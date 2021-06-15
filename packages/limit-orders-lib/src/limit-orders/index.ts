import {
  BigNumber,
  constants,
  utils,
  Wallet,
  Signer,
  ContractTransaction,
  BigNumberish,
  Contract,
} from "ethers";
import {
  ETH_ADDRESS,
  GELATO_LIMIT_ORDERS_ADDRESS,
  GELATO_LIMIT_ORDERS_MODULE_ADDRESS,
  NETWORK_VENUES,
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
  Venue,
  ChainId,
  Order,
  TransactionData,
  TransactionDataWithSecret,
} from "../types";
import { isEthereumChain, isNetworkGasToken } from "../utils";

const isValidChainIdAndVenue = (chainId: ChainId, venue: Venue) => {
  return venue in NETWORK_VENUES[chainId];
};
export class GelatoLimitOrders {
  private _chainId: ChainId;
  private _signer: Signer | undefined;
  private _gelatoLimitOrders: GelatoLimitOrdersContract;
  private _moduleAddress: string;
  private _subgraphUrl: string;
  private _venue?: Venue;

  public static slippageBPS = SLIPPAGE_BPS;
  public static gelatoFeeBPS = TWO_BPS_GELATO_FEE;

  get chainId(): ChainId {
    return this._chainId;
  }

  get signer(): Signer | undefined {
    return this._signer;
  }

  get subgraphUrl(): string {
    return this._subgraphUrl;
  }

  get venue(): Venue | undefined {
    return this._venue;
  }

  get moduleAddress(): string {
    return this._moduleAddress;
  }

  get contract(): GelatoLimitOrdersContract {
    return this._gelatoLimitOrders;
  }

  constructor(chainId: ChainId, signer?: Signer, venue?: Venue) {
    if (venue && !isValidChainIdAndVenue(chainId, venue)) {
      throw new Error("Invalid chainId and venue");
    }
    this._chainId = chainId;
    this._subgraphUrl = SUBGRAPH_URL[chainId];
    this._signer = signer;
    this._gelatoLimitOrders = this._signer
      ? GelatoLimitOrders__factory.connect(
          GELATO_LIMIT_ORDERS_ADDRESS[this._chainId],
          this._signer
        )
      : (new Contract(
          GELATO_LIMIT_ORDERS_ADDRESS[this._chainId],
          GelatoLimitOrders__factory.createInterface()
        ) as GelatoLimitOrdersContract);
    this._moduleAddress = GELATO_LIMIT_ORDERS_MODULE_ADDRESS[this._chainId];
    this._venue = venue;
  }

  public async encodeLimitOrderSubmission(
    fromCurrency: string,
    toCurrency: string,
    amount: BigNumberish,
    minimumReturn: BigNumberish,
    owner: string
  ): Promise<TransactionData> {
    const { payload } = await this.encodeLimitOrderSubmissionWithSecret(
      fromCurrency,
      toCurrency,
      amount,
      minimumReturn,
      owner
    );

    return payload;
  }

  public async encodeLimitOrderSubmissionWithSecret(
    fromCurrency: string,
    toCurrency: string,
    amount: BigNumberish,
    minimumReturn: BigNumberish,
    owner: string
  ): Promise<TransactionDataWithSecret> {
    const secret = utils.hexlify(utils.randomBytes(13)).replace("0x", "");
    const fullSecret = `0x4200696e652e66696e616e63652020d83ddc09${secret}`;
    try {
      const { privateKey, address } = new Wallet(fullSecret);
      const payload = await this._encodeData(
        fromCurrency,
        toCurrency,
        owner,
        address,
        amount,
        minimumReturn,
        privateKey
      );

      return {
        payload,
        secret: privateKey,
        witness: address,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public async submitLimitOrder(
    fromCurrency: string,
    toCurrency: string,
    amount: BigNumberish,
    minimumReturn: BigNumberish
  ): Promise<ContractTransaction> {
    if (!this._signer) throw new Error("No signer");

    const owner = await this._signer.getAddress();

    const txData = await this.encodeLimitOrderSubmission(
      fromCurrency,
      toCurrency,
      amount,
      minimumReturn,
      owner
    );

    return this._signer.sendTransaction({
      to: txData.to,
      data: txData.data,
      value: BigNumber.from(txData.value),
    });
  }

  public encodeLimitOrderCancellation(
    fromCurrency: string,
    toCurrency: string,
    minReturn: BigNumberish,
    witness: string,
    owner: string
  ): TransactionData {
    if (!this._signer) throw new Error("No signer");
    if (!this._gelatoLimitOrders)
      throw new Error("No gelato limit orders contract");

    const data = this._gelatoLimitOrders.interface.encodeFunctionData(
      "cancelOrder",
      [
        this._moduleAddress,
        fromCurrency,
        owner,
        witness,
        new utils.AbiCoder().encode(
          ["address", "uint256"],
          [toCurrency, minReturn]
        ),
      ]
    );

    return {
      data,
      to: this._gelatoLimitOrders.address,
      value: constants.Zero,
    };
  }

  public async cancelLimitOrder(
    fromCurrency: string,
    toCurrency: string,
    minReturn: BigNumberish,
    witness: string
  ): Promise<ContractTransaction> {
    if (!this._signer) throw new Error("No signer");
    if (!this._gelatoLimitOrders)
      throw new Error("No gelato limit orders contract");

    const owner = await this._signer.getAddress();
    return this._gelatoLimitOrders.cancelOrder(
      this._moduleAddress,
      fromCurrency,
      owner,
      witness,
      new utils.AbiCoder().encode(
        ["address", "uint256"],
        [toCurrency, minReturn]
      )
    );
  }

  public exchangeRate(
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
      .div(BigNumber.from(10000).sub(fees))
      .mul(10000);

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

  private async _encodeData(
    fromCurrency: string,
    toCurrency: string,
    account: string,
    address: string,
    amount: BigNumberish,
    minimumReturn: BigNumberish,
    privateKey: string
  ): Promise<TransactionData> {
    if (!this._signer) throw new Error("No signer");

    if (fromCurrency.toLowerCase() === toCurrency.toLowerCase())
      throw new Error("Input token and output token can not be equal");

    const encodedData = this._venue
      ? new utils.AbiCoder().encode(
          ["address", "uint256", "string"],
          [toCurrency, minimumReturn, this._venue]
        )
      : new utils.AbiCoder().encode(
          ["address", "uint256"],
          [toCurrency, minimumReturn]
        );

    let data, value, to;
    if (isNetworkGasToken(fromCurrency)) {
      const encodedEthOrder = await this._gelatoLimitOrders.encodeEthOrder(
        this._moduleAddress,
        ETH_ADDRESS, // we also use ETH_ADDRESS if it's MATIC
        account,
        address,
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
        fromCurrency,
        account,
        address,
        encodedData,
        privateKey,
        amount
      );
      value = constants.Zero;
      to = fromCurrency;
    }

    return { data, value, to };
  }
}
