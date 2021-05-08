import { TransactionResponse } from "@ethersproject/abstract-provider";
import {
  BigNumber,
  constants,
  ContractTransaction,
  getDefaultProvider,
  providers,
  Signer,
  utils,
  Wallet,
} from "ethers";
import {
  isNetworkGasToken,
  getLimitOrderModuleAddr,
  getNetworkName,
  ETH_ADDRESS,
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
  owner: string,
  provider?: providers.Provider
): Promise<TransactionData> => {
  return (
    await getLimitOrderPayloadWithSecret(
      chainId,
      fromCurrency,
      toCurrency,
      amount,
      minimumReturn,
      owner,
      provider
    )
  ).txData;
};

export const getLimitOrderPayloadWithSecret = async (
  chainId: number,
  fromCurrency: string,
  toCurrency: string,
  amount: BigNumber,
  minimumReturn: BigNumber,
  owner: string,
  provider?: providers.Provider
): Promise<TransactionDataWithSecret> => {
  const secret = utils.hexlify(utils.randomBytes(13)).replace("0x", "");
  const fullSecret = `4200696e652e66696e616e63652020d83ddc09${secret}`;
  const { privateKey, address } = new Wallet(fullSecret);

  provider = provider ?? (await getDefaultProvider(getNetworkName(chainId)));

  if (!provider) throw new Error("getLimitOrderPayloadWithSecret: no provider");

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
      to: isNetworkGasToken(chainId, fromCurrency)
        ? gelatoPineCore.address
        : fromCurrency,
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
  if (fromCurrency === toCurrency)
    throw new Error("fromCurrency === toCurrency");

  const encodedData = new utils.AbiCoder().encode(
    ["address", "uint256"],
    [toCurrency, minimumReturn]
  );

  const limitOrderModuleAddr = await getLimitOrderModuleAddr(chainId);

  return isNetworkGasToken(chainId, fromCurrency)
    ? [
        gelatoPineCore.interface.encodeFunctionData("depositEth", [
          await gelatoPineCore.encodeEthOrder(
            limitOrderModuleAddr,
            ETH_ADDRESS, // we also use ETH_ADDRESS if it's MATIC
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
  minimumReturn: BigNumber,
  provider?: providers.Provider
): Promise<TransactionResponse> => {
  if (!signer.provider) throw new Error("Provider undefined");

  const chainId = (await signer.provider?.getNetwork()).chainId;
  const txData = await getLimitOrderPayload(
    chainId,
    fromCurrency,
    toCurrency,
    amount,
    minimumReturn,
    await signer.getAddress(),
    provider
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
    throw new Error("cancelLimitOrder: no provider on signer");

  const gelatoPineCore = await getGelatoPineCore(signer.provider);

  return gelatoPineCore
    .connect(signer)
    .cancelOrder(
      await getLimitOrderModuleAddr(
        (await signer.provider.getNetwork()).chainId
      ),
      fromCurrency,
      await signer.getAddress(),
      witness,
      new utils.AbiCoder().encode(
        ["address", "uint256"],
        [toCurrency, minReturn]
      )
    );
};

export const getCancelLimitOrderPayload = async (
  chainId: number,
  fromCurrency: string,
  toCurrency: string,
  minReturn: BigNumber,
  account: string,
  witness: string,
  provider?: providers.Provider
): Promise<TransactionData> => {
  const abiCoder = new utils.AbiCoder();
  provider = provider ?? (await getDefaultProvider(getNetworkName(chainId)));
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
): Promise<Order[]> => {
  return getOrders(account, chainID);
};

export const getAllOpenOrders = async (
  account: string,
  chainID: number
): Promise<Order[]> => {
  return getOpenOrders(account, chainID);
};

export const getAllPastOrders = async (
  account: string,
  chainID: number
): Promise<Order[]> => {
  return getPastOrders(account, chainID);
};

export const getAllExecutedOrders = async (
  account: string,
  chainID: number
): Promise<Order[]> => {
  return getExecutedOrders(account, chainID);
};

export const getAllCancelledOrders = async (
  account: string,
  chainID: number
): Promise<Order[]> => {
  return getCancelledOrders(account, chainID);
};

//#endregion Get All Orders
