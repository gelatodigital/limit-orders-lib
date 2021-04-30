import { TransactionResponse } from "@ethersproject/abstract-provider";
import {
  BigNumber,
  constants,
  ContractTransaction,
  getDefaultProvider,
  Signer,
  utils,
  Wallet,
} from "ethers";
import {
  ETH_ADDRESS,
  getLimitOrderModuleAddr,
  getNetworkName,
} from "./constants";
import { GelatoPineCore } from "./contracts/types";
import { getGelatoPineCore } from "./gelatoPineCore";
import {
  getCancelledOrders,
  getExecutedOrders,
  getOpenOrders,
  getOrders,
  getPastOrders,
} from "./query/orders";
import { Order, TransactionData, TransactionDataWithSecret } from "./types";

//#region Limit Orders Submission

// Convention ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
export const getLimitOrderPayload = async (
  chainId: number,
  fromCurrency: string,
  toCurrency: string,
  amount: BigNumber,
  minimumReturn: BigNumber,
  owner: string
): Promise<TransactionData> => {
  return (
    await getLimitOrderPayloadWithSecret(
      chainId,
      fromCurrency,
      toCurrency,
      amount,
      minimumReturn,
      owner
    )
  ).txData;
};

export const getLimitOrderPayloadWithSecret = async (
  chainId: number,
  fromCurrency: string,
  toCurrency: string,
  amount: BigNumber,
  minimumReturn: BigNumber,
  owner: string
): Promise<TransactionDataWithSecret> => {
  const secret = utils.hexlify(utils.randomBytes(13)).replace("0x", "");
  const fullSecret = `4200696e652e66696e616e63652020d83ddc09${secret}`;
  const { privateKey, address } = new Wallet(fullSecret);

  const provider = await getDefaultProvider(getNetworkName(chainId));

  if (!provider)
    throw new Error("getLimitOrderPayloadWithSecret: no provider on provider");

  const gelatoPineCore = await getGelatoPineCore(provider);

  const [data, value] = await getEncodedData(
    chainId,
    gelatoPineCore,
    fromCurrency,
    toCurrency,
    owner,
    address,
    amount,
    minimumReturn,
    privateKey
  );

  return {
    txData: {
      to: fromCurrency === ETH_ADDRESS ? gelatoPineCore.address : fromCurrency,
      data: data,
      value: value,
    },
    secret: privateKey,
    witness: address,
  };
};

const getEncodedData = async (
  chainId: number,
  gelatoPineCore: GelatoPineCore,
  fromCurrency: string,
  toCurrency: string,
  account: string,
  address: string,
  amount: BigNumber,
  minimumReturn: BigNumber,
  privateKey: string
): Promise<[string, BigNumber]> => {
  if (fromCurrency === toCurrency) throw "currency 1 is equal to currency 2";

  const encodedData = new utils.AbiCoder().encode(
    ["address", "uint256"],
    [toCurrency, minimumReturn]
  );

  const limitOrderModuleAddr = await getLimitOrderModuleAddr(chainId);

  return fromCurrency === ETH_ADDRESS
    ? [
        gelatoPineCore.interface.encodeFunctionData("depositEth", [
          await gelatoPineCore.encodeEthOrder(
            limitOrderModuleAddr,
            fromCurrency,
            account,
            address,
            encodedData,
            privateKey
          ),
        ]),
        amount,
      ]
    : [
        await gelatoPineCore.encodeTokenOrder(
          limitOrderModuleAddr,
          fromCurrency,
          account,
          address,
          encodedData,
          privateKey,
          amount
        ),
        constants.Zero,
      ];
};

export const sendLimitOrder = async (
  signer: Signer,
  fromCurrency: string,
  toCurrency: string,
  amount: BigNumber,
  minimumReturn: BigNumber
): Promise<TransactionResponse> => {
  if (!signer.provider) {
    throw new Error("Provider undefined");
  }
  const chainId = (await signer.provider?.getNetwork()).chainId;
  const txData = await getLimitOrderPayload(
    chainId,
    fromCurrency,
    toCurrency,
    amount,
    minimumReturn,
    await signer.getAddress()
  );

  return signer.sendTransaction({
    to: txData.to,
    data: txData.data,
    value: txData.value,
  });
};

//#endregion Limit Orders Submission

//#region Limit Orders Cancellation

export const cancelLimitOrder = async (
  signer: Signer,
  fromCurrency: string,
  toCurrency: string,
  minReturn: BigNumber,
  witness: string
): Promise<ContractTransaction> => {
  if (!signer.provider)
    throw new Error("getLimitOrderPayloadWithSecret: no signer on signer");

  const chainId = (await signer.provider?.getNetwork()).chainId;
  const provider = await getDefaultProvider(getNetworkName(chainId));
  const abiCoder = new utils.AbiCoder();

  const gelatoPineCore = await getGelatoPineCore(provider);

  return gelatoPineCore
    .connect(signer)
    .cancelOrder(
      await getLimitOrderModuleAddr(
        (await signer.provider.getNetwork()).chainId
      ),
      fromCurrency,
      await signer.getAddress(),
      witness,
      abiCoder.encode(["address", "uint256"], [toCurrency, minReturn])
    );
};

export const getCancelLimitOrderPayload = async (
  chainId: number,
  fromCurrency: string,
  toCurrency: string,
  minReturn: BigNumber,
  account: string,
  witness: string
): Promise<TransactionData> => {
  const abiCoder = new utils.AbiCoder();
  const provider = await getDefaultProvider(getNetworkName(chainId));
  const gelatoPineCore = await getGelatoPineCore(provider);

  return {
    to: gelatoPineCore.address,
    data: gelatoPineCore.interface.encodeFunctionData("cancelOrder", [
      await getLimitOrderModuleAddr(chainId),
      fromCurrency,
      account,
      witness,
      abiCoder.encode(["address", "uint256"], [toCurrency, minReturn]),
    ]),
    value: constants.Zero,
  };
};

//#endregion Limit Orders Cancellation

//#region Get All Orders

// available on mainnet (chainId 1) and ropsten (chainId 3)

export const getAllOrders = async (
  account: string,
  chainID: number
): Promise<Order> => {
  return getOrders(account, chainID);
};

export const getAllOpenOrders = async (
  account: string,
  chainID: number
): Promise<Order> => {
  return getOpenOrders(account, chainID);
};

export const getAllPastOrders = async (
  account: string,
  chainID: number
): Promise<Order> => {
  return getPastOrders(account, chainID);
};

export const getAllExecutedOrders = async (
  account: string,
  chainID: number
): Promise<Order> => {
  return getExecutedOrders(account, chainID);
};

export const getAllCancelledOrders = async (
  account: string,
  chainID: number
): Promise<Order> => {
  return getCancelledOrders(account, chainID);
};

//#endregion Get All Orders
