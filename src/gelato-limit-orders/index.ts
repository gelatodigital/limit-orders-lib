import { Provider } from "@ethersproject/providers";
import { BigNumber, constants, utils, Wallet } from "ethers";
import {
  ETH_ADDRESS,
  GELATO_LIMIT_ORDERS_ADDRESS,
  GELATO_LIMIT_ORDERS_MODULE_ADDRESS,
  MULTICALL_ADDRESSES,
} from "../constants";
import {
  GelatoLimitOrders as GelatoLimitOrdersContract,
  GelatoLimitOrders__factory,
  Multicall,
  Multicall__factory,
} from "../contracts/types";
import {
  queryCancelledOrders,
  queryExecutedOrders,
  queryOpenOrders,
  queryOrders,
  queryPastOrders,
} from "../utils/queries";
import {
  ChainId,
  Order,
  TransactionData,
  TransactionDataWithSecret,
} from "../types";
import { isNetworkGasToken } from "../utils";

export class GelatoLimitOrders {
  private _chainId: ChainId;
  private _provider: Provider;
  private _multicall: Multicall;
  private _gelatoLimitOrders: GelatoLimitOrdersContract;
  private _moduleAddress: string;

  get chainId(): ChainId {
    return this._chainId;
  }

  get multicallContract(): Multicall {
    return this._multicall;
  }

  get provider(): Provider {
    return this._provider;
  }

  constructor(chainId: ChainId, provider: Provider) {
    this._chainId = chainId;
    this._provider = provider;
    this._gelatoLimitOrders = GelatoLimitOrders__factory.connect(
      GELATO_LIMIT_ORDERS_ADDRESS[this._chainId],
      this._provider
    );
    this._moduleAddress = GELATO_LIMIT_ORDERS_MODULE_ADDRESS[this._chainId];
    this._multicall = Multicall__factory.connect(
      MULTICALL_ADDRESSES[this._chainId],
      this._provider
    );
  }

  public async encodeLimitOrderSubmission(
    fromCurrency: string,
    toCurrency: string,
    amount: BigNumber,
    minimumReturn: BigNumber,
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
    amount: BigNumber,
    minimumReturn: BigNumber,
    owner: string
  ): Promise<TransactionDataWithSecret> {
    const secret = utils.hexlify(utils.randomBytes(13)).replace("0x", "");
    const fullSecret = `4200696e652e66696e616e63652020d83ddc09${secret}`;
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
  }

  public encodeLimitOrderCancellation(
    fromCurrency: string,
    toCurrency: string,
    minReturn: BigNumber,
    witness: string,
    owner: string
  ): TransactionData {
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

  public exchangeRate(
    inputValue: BigNumber,
    inputDecimals: number,
    outputValue: BigNumber,
    outputDecimals: number,
    invert = false
  ): BigNumber {
    const factor = BigNumber.from(10).pow(BigNumber.from(18));

    if (invert) {
      return inputValue
        .mul(factor)
        .div(outputValue)
        .mul(BigNumber.from(10).pow(BigNumber.from(outputDecimals)))
        .div(BigNumber.from(10).pow(BigNumber.from(inputDecimals)));
    } else {
      return outputValue
        .mul(factor)
        .div(inputValue)
        .mul(BigNumber.from(10).pow(BigNumber.from(inputDecimals)))
        .div(BigNumber.from(10).pow(BigNumber.from(outputDecimals)));
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
    amount: BigNumber,
    minimumReturn: BigNumber,
    privateKey: string
  ): Promise<TransactionData> {
    if (fromCurrency === toCurrency)
      throw new Error("fromCurrency === toCurrency");

    const encodedData = new utils.AbiCoder().encode(
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
