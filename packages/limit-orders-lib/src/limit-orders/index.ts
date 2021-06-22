import {
  BigNumber,
  constants,
  utils,
  ContractTransaction,
  BigNumberish,
  Contract,
  Wallet,
} from "ethers";
import { Provider } from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";
import {
  ETH_ADDRESS,
  GELATO_LIMIT_ORDERS_ADDRESS,
  GELATO_LIMIT_ORDERS_MODULE_ADDRESS,
  HANDLERS_ADDRESSES,
  NETWORK_HANDLERS,
  SLIPPAGE_BPS,
  SUBGRAPH_URL,
  TWO_BPS_GELATO_FEE,
} from "../constants";
import {
  GelatoLimitOrders as GelatoLimitOrdersContract,
  GelatoLimitOrders__factory,
} from "../contracts/types";
import {
  queryCancelledOrders,
  queryExecutedOrders,
  queryOpenOrders,
  queryOrders,
  queryPastOrders,
} from "../utils/queries";
import {
  Handler,
  ChainId,
  Order,
  TransactionData,
  TransactionDataWithSecret,
} from "../types";
import { isEthereumChain, isNetworkGasToken } from "../utils";

export const isValidChainIdAndHandler = (
  chainId: ChainId,
  handler: Handler
): boolean => {
  return NETWORK_HANDLERS[chainId].includes(handler);
};

export class GelatoLimitOrders {
  private _chainId: ChainId;
  private _provider: Provider | undefined;
  private _signer: Signer | undefined;
  private _gelatoLimitOrders: GelatoLimitOrdersContract;
  private _moduleAddress: string;
  private _subgraphUrl: string;
  private _handlerAddress?: string;
  private _handler?: Handler;

  public static slippageBPS = SLIPPAGE_BPS;
  public static gelatoFeeBPS = TWO_BPS_GELATO_FEE;

  get chainId(): ChainId {
    return this._chainId;
  }

  get signer(): Signer | undefined {
    return this._signer;
  }

  get provider(): Provider | undefined {
    return this._provider;
  }

  get subgraphUrl(): string {
    return this._subgraphUrl;
  }

  get handler(): Handler | undefined {
    return this._handler;
  }

  get handlerAddress(): string | undefined {
    return this._handlerAddress;
  }

  get moduleAddress(): string {
    return this._moduleAddress;
  }

  get contract(): GelatoLimitOrdersContract {
    return this._gelatoLimitOrders;
  }

  constructor(chainId: ChainId, signerOrProvider?: Signer, handler?: Handler) {
    if (handler && !isValidChainIdAndHandler(chainId, handler)) {
      throw new Error("Invalid chainId and handler");
    }

    this._chainId = chainId;
    this._subgraphUrl = SUBGRAPH_URL[chainId];
    this._signer = Signer.isSigner(signerOrProvider)
      ? signerOrProvider
      : undefined;
    this._provider = Provider.isProvider(signerOrProvider)
      ? signerOrProvider
      : Signer.isSigner(signerOrProvider)
      ? signerOrProvider.provider
      : undefined;

    this._gelatoLimitOrders = this._signer
      ? GelatoLimitOrders__factory.connect(
          GELATO_LIMIT_ORDERS_ADDRESS[this._chainId],
          this._signer
        )
      : this._provider
      ? GelatoLimitOrders__factory.connect(
          GELATO_LIMIT_ORDERS_ADDRESS[this._chainId],
          this._provider
        )
      : (new Contract(
          GELATO_LIMIT_ORDERS_ADDRESS[this._chainId],
          GelatoLimitOrders__factory.createInterface()
        ) as GelatoLimitOrdersContract);
    this._moduleAddress = GELATO_LIMIT_ORDERS_MODULE_ADDRESS[this._chainId];
    this._handler = handler;
    this._handlerAddress = handler
      ? HANDLERS_ADDRESSES[this._chainId][handler]
      : undefined;
  }

  public async encodeLimitOrderSubmission(
    inputToken: string,
    outputToken: string,
    inputAmount: BigNumberish,
    minReturn: BigNumberish,
    owner: string
  ): Promise<TransactionData> {
    const { payload } = await this.encodeLimitOrderSubmissionWithSecret(
      inputToken,
      outputToken,
      inputAmount,
      minReturn,
      owner
    );

    return payload;
  }

  public async encodeLimitOrderSubmissionWithSecret(
    inputToken: string,
    outputToken: string,
    inputAmount: BigNumberish,
    minReturn: BigNumberish,
    owner: string
  ): Promise<TransactionDataWithSecret> {
    const secret = utils.hexlify(utils.randomBytes(13)).replace("0x", "");
    const fullSecret = `0x4200696e652e66696e616e63652020d83ddc09${secret}`;
    try {
      const { privateKey: secret, address: witness } = new Wallet(fullSecret);
      const payload = await this._encodeSubmitData(
        inputToken,
        outputToken,
        owner,
        witness,
        inputAmount,
        minReturn,
        secret
      );

      const encodedData = this._handlerAddress
        ? new utils.AbiCoder().encode(
            ["address", "uint256", "address"],
            [outputToken, minReturn, this._handlerAddress]
          )
        : new utils.AbiCoder().encode(
            ["address", "uint256"],
            [outputToken, minReturn]
          );

      return {
        payload,
        secret,
        witness,
        order: {
          module: this._moduleAddress.toLowerCase(),
          data: encodedData,
          inputToken: inputToken.toLowerCase(),
          outputToken: outputToken.toLowerCase(),
          owner: owner.toLowerCase(),
          witness: witness.toLowerCase(),
          inputAmount: inputAmount.toString(),
          minReturn: minReturn.toString(),
          inputData: payload.data.toString(),
          secret: secret.toLowerCase(),
          handler: this._handlerAddress ?? undefined,
        },
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public async submitLimitOrder(
    inputToken: string,
    outputToken: string,
    inputAmount: BigNumberish,
    minReturn: BigNumberish,
    gasPrice?: BigNumberish
  ): Promise<ContractTransaction> {
    if (!this._signer) throw new Error("No signer");

    const owner = await this._signer.getAddress();

    const txData = await this.encodeLimitOrderSubmission(
      inputToken,
      outputToken,
      inputAmount,
      minReturn,
      owner
    );

    return this._signer.sendTransaction({
      to: txData.to,
      data: txData.data,
      value: BigNumber.from(txData.value),
      gasPrice,
    });
  }

  public async encodeLimitOrderCancellation(
    order: Order,
    checkIsActiveOrder?: boolean
  ): Promise<TransactionData> {
    if (!this._gelatoLimitOrders)
      throw new Error("No gelato limit orders contract");

    if (!order.inputToken) throw new Error("No input token in order");
    if (!order.witness) throw new Error("No witness in order");
    if (!order.outputToken) throw new Error("No output token in order");
    if (!order.minReturn) throw new Error("No minReturn in order");
    if (!order.owner) throw new Error("No owner");

    if (checkIsActiveOrder) {
      const isActiveOrder = await this.isActiveOrder(order);
      if (!isActiveOrder)
        throw new Error("Order not found. Please review your order data.");
    }

    const encodedData = order.handler
      ? new utils.AbiCoder().encode(
          ["address", "uint256", "address"],
          [order.outputToken, order.minReturn, order.handler]
        )
      : new utils.AbiCoder().encode(
          ["address", "uint256"],
          [order.outputToken, order.minReturn]
        );

    const data = this._gelatoLimitOrders.interface.encodeFunctionData(
      "cancelOrder",
      [
        this._moduleAddress,
        order.inputToken,
        order.owner,
        order.witness,
        encodedData,
      ]
    );

    return {
      data,
      to: this._gelatoLimitOrders.address,
      value: constants.Zero,
    };
  }

  public async cancelLimitOrder(
    order: Order,
    checkIsActiveOrder?: boolean,
    gasPrice?: BigNumberish
  ): Promise<ContractTransaction> {
    if (!this._signer) throw new Error("No signer");
    if (!this._gelatoLimitOrders)
      throw new Error("No gelato limit orders contract");

    if (!order.inputToken) throw new Error("No input token in order");
    if (!order.witness) throw new Error("No witness in order");
    if (!order.outputToken) throw new Error("No output token in order");
    if (!order.minReturn) throw new Error("No minReturn in order");

    if (checkIsActiveOrder) {
      const isActiveOrder = await this.isActiveOrder(order);
      if (!isActiveOrder)
        throw new Error("Order not found. Please review your order data.");
    }

    const owner = await this._signer.getAddress();

    if (owner.toLowerCase() !== order.owner.toLowerCase())
      throw new Error("Owner and signer mismatch");

    const encodedData = order.handler
      ? new utils.AbiCoder().encode(
          ["address", "uint256", "address"],
          [order.outputToken, order.minReturn, order.handler]
        )
      : new utils.AbiCoder().encode(
          ["address", "uint256"],
          [order.outputToken, order.minReturn]
        );

    return this._gelatoLimitOrders.cancelOrder(
      this._moduleAddress,
      order.inputToken,
      order.owner,
      order.witness,
      encodedData,
      { gasPrice, gasLimit: 400000 }
    );
  }

  public async isActiveOrder(order: Order): Promise<boolean> {
    if (!this._provider) throw new Error("No provider");
    if (!this._gelatoLimitOrders)
      throw new Error("No gelato limit orders contract");

    if (!order.module) throw new Error("No module in order");
    if (!order.inputToken) throw new Error("No input token in order");
    if (!order.owner) throw new Error("No owner in order");
    if (!order.witness) throw new Error("No witness in order");
    if (!order.data) throw new Error("No data in order");

    return this._gelatoLimitOrders.existOrder(
      order.module,
      order.inputToken,
      order.owner,
      order.witness,
      order.data
    );
  }

  public getExchangeRate(
    inputValue: BigNumberish,
    inputDecimals: number,
    outputValue: BigNumberish,
    outputDecimals: number,
    invert = false
  ): string {
    const factor = BigNumber.from(10).pow(BigNumber.from(18));

    if (invert) {
      return BigNumber.from(inputValue)
        .mul(factor)
        .div(outputValue)
        .mul(BigNumber.from(10).pow(BigNumber.from(outputDecimals)))
        .div(BigNumber.from(10).pow(BigNumber.from(inputDecimals)))
        .toString();
    } else {
      return BigNumber.from(outputValue)
        .mul(factor)
        .div(inputValue)
        .mul(BigNumber.from(10).pow(BigNumber.from(inputDecimals)))
        .div(BigNumber.from(10).pow(BigNumber.from(outputDecimals)))
        .toString();
    }
  }

  public getFeeAndSlippageAdjustedMinReturn(
    outputAmount: BigNumberish,
    extraSlippageBPS?: number
  ): {
    minReturn: string;
    slippage: string;
    gelatoFee: string;
  } {
    if (isEthereumChain(this._chainId))
      throw new Error("Method not available for current chain.");

    if (extraSlippageBPS) {
      if (!Number.isInteger(extraSlippageBPS))
        throw new Error("Extra Slippage BPS must an unsigned integer");
    }

    const gelatoFee = BigNumber.from(outputAmount)
      .mul(GelatoLimitOrders.gelatoFeeBPS)
      .div(10000)
      .gte(1)
      ? BigNumber.from(outputAmount)
          .mul(GelatoLimitOrders.gelatoFeeBPS)
          .div(10000)
      : BigNumber.from(1);

    const slippageBPS = extraSlippageBPS
      ? GelatoLimitOrders.slippageBPS + extraSlippageBPS
      : GelatoLimitOrders.slippageBPS;

    const slippage = BigNumber.from(outputAmount).mul(slippageBPS).div(10000);

    const minReturn = BigNumber.from(outputAmount).sub(gelatoFee).sub(slippage);

    return {
      minReturn: minReturn.toString(),
      slippage: slippage.toString(),
      gelatoFee: gelatoFee.toString(),
    };
  }

  public getRawMinReturn(
    minReturn: BigNumberish,
    extraSlippageBPS?: number
  ): string {
    if (isEthereumChain(this._chainId))
      throw new Error("Method not available for current chain.");

    const gelatoFee = BigNumber.from(GelatoLimitOrders.gelatoFeeBPS);

    const slippage = extraSlippageBPS
      ? BigNumber.from(GelatoLimitOrders.slippageBPS + extraSlippageBPS)
      : BigNumber.from(GelatoLimitOrders.slippageBPS);

    const fees = gelatoFee.add(slippage);

    const rawMinReturn = BigNumber.from(minReturn)
      .mul(10000)
      .div(BigNumber.from(10000).sub(fees));

    return rawMinReturn.toString();
  }

  public getExecutionPrice(
    inputAmount: BigNumberish,
    inputDecimals: number,
    outputAmount: BigNumberish,
    outputDecimals: number,
    isInverted = false
  ): string {
    const factor = BigNumber.from(10).pow(
      BigNumber.from(isInverted ? outputDecimals : inputDecimals)
    );

    if (isInverted) {
      return BigNumber.from(inputAmount)
        .mul(factor)
        .div(outputAmount)
        .toString();
    } else {
      return BigNumber.from(outputAmount)
        .mul(factor)
        .div(inputAmount)
        .toString();
    }
  }

  public async getOrders(owner: string): Promise<Order[]> {
    return queryOrders(owner, this._chainId);
  }

  public async getOpenOrders(owner: string): Promise<Order[]> {
    return queryOpenOrders(owner, this._chainId);
  }

  public async getPastOrders(owner: string): Promise<Order[]> {
    return queryPastOrders(owner, this._chainId);
  }

  public async getExecutedOrders(owner: string): Promise<Order[]> {
    return queryExecutedOrders(owner, this._chainId);
  }

  public async getCancelledOrders(owner: string): Promise<Order[]> {
    return queryCancelledOrders(owner, this._chainId);
  }

  private async _encodeSubmitData(
    inputToken: string,
    outputToken: string,
    owner: string,
    witness: string,
    amount: BigNumberish,
    minReturn: BigNumberish,
    privateKey: string
  ): Promise<TransactionData> {
    if (!this._provider) throw new Error("No provider");

    if (inputToken.toLowerCase() === outputToken.toLowerCase())
      throw new Error("Input token and output token can not be equal");

    const encodedData = this._handlerAddress
      ? new utils.AbiCoder().encode(
          ["address", "uint256", "address"],
          [outputToken, minReturn, this._handlerAddress]
        )
      : new utils.AbiCoder().encode(
          ["address", "uint256"],
          [outputToken, minReturn]
        );

    let data, value, to;
    if (isNetworkGasToken(inputToken)) {
      const encodedEthOrder = await this._gelatoLimitOrders.encodeEthOrder(
        this._moduleAddress,
        ETH_ADDRESS, // we also use ETH_ADDRESS if it's MATIC
        owner,
        witness,
        encodedData,
        privateKey
      );
      data = this._gelatoLimitOrders.interface.encodeFunctionData(
        "depositEth",
        [encodedEthOrder]
      );
      value = amount;
      to = this._gelatoLimitOrders.address;
    } else {
      data = await this._gelatoLimitOrders.encodeTokenOrder(
        this._moduleAddress,
        inputToken,
        owner,
        witness,
        encodedData,
        privateKey,
        amount
      );
      value = constants.Zero;
      to = inputToken;
    }

    return { data, value, to };
  }
}
