import {
  BigNumber,
  constants,
  utils,
  ContractTransaction,
  BigNumberish,
  Wallet,
  Overrides,
} from "ethers";
import { Provider } from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";
import {
  ETH_ADDRESS,
  GELATO_STOPLOSS_ORDERS_MODULE_ADDRESS,
  STOPLOSS_HANDLERS_ADDRESSES,
} from "../constants";
import {
  ERC20__factory,
} from "../contracts/types";

import {
  Handler,
  ChainId,
  Order,
  TransactionData,
  TransactionDataWithSecret,
} from "../types";
import { isEthereumChain, isNetworkGasToken } from "../utils";
import { isValidChainIdAndHandler, GelatoCore } from "../gelato-core";


export class GelatoStoplossOrders extends GelatoCore {
  constructor(
    chainId: ChainId,
    signerOrProvider?: Signer | Provider,
    handler?: Handler,
  ) {
    if (handler && !isValidChainIdAndHandler(chainId, handler)) {
      throw new Error("Invalid chainId and handler");
    }


    const moduleAddress = GELATO_STOPLOSS_ORDERS_MODULE_ADDRESS[chainId];

    if (!moduleAddress) throw new Error("Invalid chainId and handler");

    const handlerAddress = handler === "quickswap_stoploss" ? STOPLOSS_HANDLERS_ADDRESSES[chainId][handler]?.toLowerCase() : undefined;
    super(chainId, moduleAddress, signerOrProvider, handler, handlerAddress);

  }

  public async submitStoplossOrder(
    inputToken: string,
    outputToken: string,
    inputAmount: BigNumberish,
    stoploss: BigNumberish,
    minReturn: BigNumberish,
    checkAllowance = true,
    overrides?: Overrides
  ): Promise<ContractTransaction> {
    if (!this.signer) throw new Error("No signer");

    const owner = await this.signer.getAddress();

    const txData = await this.encodeLimitOrderSubmission(
      inputToken,
      outputToken,
      inputAmount,
      stoploss,
      minReturn,
      owner,
      checkAllowance
    );

    return this.signer.sendTransaction({
      ...overrides,
      to: txData.to,
      data: txData.data,
      value: BigNumber.from(txData.value),
    });
  }

  public async encodeLimitOrderSubmission(
    inputToken: string,
    outputToken: string,
    inputAmount: BigNumberish,
    stoploss: BigNumberish,
    minReturn: BigNumberish,
    owner: string,
    checkAllowance = true
  ): Promise<TransactionData> {
    const { payload } = await this.encodeLimitOrderSubmissionWithSecret(
      inputToken,
      outputToken,
      inputAmount,
      stoploss,
      minReturn,
      owner,
      checkAllowance
    );

    return payload;
  }


  public async encodeLimitOrderSubmissionWithSecret(
    inputToken: string,
    outputToken: string,
    inputAmount: BigNumberish,
    stoplossToBeParsed: BigNumberish,
    minReturnToBeParsed: BigNumberish,
    owner: string,
    checkAllowance = true
  ): Promise<TransactionDataWithSecret> {
    const randomSecret = utils.hexlify(utils.randomBytes(19)).replace("0x", "");
    // 0x67656c61746f6e6574776f726b = gelatonetwork in hex
    const fullSecret = `0x67656c61746f6e6574776f726b${randomSecret}`;

    const { privateKey: secret, address: witness } = new Wallet(fullSecret);

    const { minReturn: stoploss } = !isEthereumChain(this.chainId)
      ? this.getFeeAndSlippageAdjustedMinReturn(stoplossToBeParsed)
      : { minReturn: stoplossToBeParsed };

    const { minReturn } = !isEthereumChain(this.chainId)
      ? this.getFeeAndSlippageAdjustedMinReturn(minReturnToBeParsed)
      : { minReturn: minReturnToBeParsed };

    const payload = await this._encodeSubmitData(
      inputToken,
      outputToken,
      owner,
      witness,
      inputAmount,
      stoploss,
      minReturn,
      secret,
      checkAllowance
    );

    const encodedData = this.handlerAddress
      ? this.abiEncoder.encode(
        ["address", "uint256", "uint256", "address"],
        [outputToken, stoploss, minReturn, this.handlerAddress]
      )
      : this.abiEncoder.encode(
        ["address", "uint256", "uint256"],
        [outputToken, stoploss, minReturn,]
      );

    return {
      payload,
      secret,
      witness,
      order: {
        id: this._getKey({
          module: this.moduleAddress,
          inputToken,
          owner,
          witness,
          data: encodedData,
        } as Order),
        module: this.moduleAddress.toLowerCase(),
        data: encodedData,
        inputToken: inputToken.toLowerCase(),
        outputToken: outputToken.toLowerCase(),
        owner: owner.toLowerCase(),
        witness: witness.toLowerCase(),
        inputAmount: inputAmount.toString(),
        minReturn: minReturn.toString(),
        stoploss: stoploss.toString(),
        adjustedMinReturn: minReturnToBeParsed.toString(),
        inputData: payload.data.toString(),
        secret: secret.toLowerCase(),
        handler: this.handlerAddress ?? null,
      },
    };
  }

  public async _encodeSubmitData(
    inputToken: string,
    outputToken: string,
    owner: string,
    witness: string,
    amount: BigNumberish,
    stoploss: BigNumberish,
    minReturn: BigNumberish,
    secret: string,
    checkAllowance: boolean
  ): Promise<TransactionData> {
    if (!this.provider) throw new Error("No provider");

    if (inputToken.toLowerCase() === outputToken.toLowerCase())
      throw new Error("Input token and output token can not be equal");

    const encodedData = this.handlerAddress
      ? this.abiEncoder.encode(
        ["address", "uint256", "uint256", "address"],
        [outputToken, stoploss, minReturn, this.handlerAddress]
      )
      : this.abiEncoder.encode(
        ["address", "uint256", "uint256"],
        [outputToken, stoploss, minReturn,]
      );

    let data, value, to;
    if (isNetworkGasToken(inputToken)) {
      const encodedEthOrder = await this.contract.encodeEthOrder(
        this.moduleAddress,
        ETH_ADDRESS, // we also use ETH_ADDRESS if it's MATIC
        owner,
        witness,
        encodedData,
        secret
      );
      data = this.contract.interface.encodeFunctionData(
        "depositEth",
        [encodedEthOrder]
      );
      value = amount;
      to = this.contract.address;
    } else {
      if (checkAllowance) {
        const allowance = await ERC20__factory.connect(
          inputToken,
          this.provider
        ).allowance(owner, this.erc20OrderRouter.address);

        if (allowance.lt(amount))
          throw new Error("Insufficient token allowance for placing order");
      }

      data = this.erc20OrderRouter.interface.encodeFunctionData(
        "depositToken",
        [
          amount,
          this.moduleAddress,
          inputToken,
          owner,
          witness,
          encodedData,
          secret,
        ]
      );
      value = constants.Zero;
      to = this.erc20OrderRouter.address;
    }

    return { data, value, to };
  }

}

