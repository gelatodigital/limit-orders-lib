import { ethers, providers } from "ethers";
import {
  ETH_ADDRESS,
  getLimitOrderModule
} from "./constants";
import { getGelatoPineCore } from "./gelatoPineCore";
import {
  getOrders,
  getOpenOrders,
  getExecutedOrders,
  getCancelledOrders,
} from "./query/orders";
import { Order, TransactionData, TransactionDataWithSecret } from "./types";
import { ContractTransaction } from "ethers";
import { TransactionResponse } from "@ethersproject/abstract-provider";

//#region Limit Orders Submission

// Convention ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
export const getLimitOrderPayload = async (
  provider: providers.Provider | undefined,
  fromCurrency: string,
  toCurrency: string,
  amount: ethers.BigNumber,
  minimumReturn: ethers.BigNumber,
  owner: string
): Promise<TransactionData> => {
  return (
    await getLimitOrderPayloadWithSecret(
      provider,
      fromCurrency,
      toCurrency,
      amount,
      minimumReturn,
      owner
    )
  ).txData;
};

export const getLimitOrderPayloadWithSecret = async (
  provider: providers.Provider  | undefined,
  fromCurrency: string,
  toCurrency: string,
  amount: ethers.BigNumber,
  minimumReturn: ethers.BigNumber,
  owner: string
): Promise<TransactionDataWithSecret> => {
  const secret = ethers.utils
    .hexlify(ethers.utils.randomBytes(13))
    .replace("0x", "");
  const fullSecret = `2070696e652e66696e616e63652020d83ddc09${secret}`;
  const { privateKey, address } = new ethers.Wallet(fullSecret);

  if (!provider)
    throw new Error("getLimitOrderPayloadWithSecret: no provider on signer");

  const gelatoPineCore = await getGelatoPineCore(provider);

  const [data, value] = await getEncodedData(
    provider,
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
}

const getEncodedData = async (
  provider: providers.Provider,
  gelatoPineCore: ethers.Contract,
  fromCurrency: string,
  toCurrency: string,
  account: string,
  address: string,
  amount: ethers.BigNumber,
  minimumReturn: ethers.BigNumber,
  privateKey: string
): Promise<[ethers.BytesLike, ethers.BigNumber]> => {
  if (fromCurrency === toCurrency) throw "currency 1 is equal to currency 2";

  const encodedData = new ethers.utils.AbiCoder().encode(
    ["address", "uint256"],
    [toCurrency, minimumReturn]
  );

  const limitOrderModuleAddr = await getLimitOrderModule(provider);

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
        ethers.constants.Zero,
      ];
};

export const sendLimitOrder = async (
  signer: ethers.Signer,
  fromCurrency: string,
  toCurrency: string,
  amount: ethers.BigNumber,
  minimumReturn: ethers.BigNumber
): Promise<TransactionResponse> => {
  const txData = await getLimitOrderPayload(
    signer.provider,
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
  signer: ethers.Signer,
  fromCurrency: string,
  toCurrency: string,
  minReturn: ethers.BigNumber,
  witness: string
): Promise<ContractTransaction> => {
  if (!signer.provider)
    throw new Error("getLimitOrderPayloadWithSecret: no provider on signer");

  const abiCoder = new ethers.utils.AbiCoder();

  const gelatoPineCore = await getGelatoPineCore(signer.provider);

  return gelatoPineCore.cancelOrder(
    await getLimitOrderModule(signer.provider),
    fromCurrency,
    await signer.getAddress(),
    witness,
    abiCoder.encode(["address", "uint256"], [toCurrency, minReturn])
  );
};

export const cancelLimitOrderPayload = async (
  provider: providers.Provider,
  fromCurrency: string,
  toCurrency: string,
  minReturn: ethers.BigNumber,
  account: string,
  witness: string
): Promise<TransactionData> => {
  const abiCoder = new ethers.utils.AbiCoder();
  const gelatoPineCore = await getGelatoPineCore(provider);

  return {
    to: gelatoPineCore.address,
    data: gelatoPineCore.interface.encodeFunctionData("cancelOrder", [
      await getLimitOrderModule(provider),
      fromCurrency,
      account,
      witness,
      abiCoder.encode(["address", "uint256"], [toCurrency, minReturn]),
    ]),
    value: ethers.constants.Zero,
  };
};

//#endregion Limit Orders Cancellation

//#region Get All Orders

// available on mainnet (chainId 1) and ropsten (chainId 3)

export const getAllOrders = async (
  account: string,
  chainID: string
): Promise<Order> => {
  return getOrders(account, chainID);
};

export const getAllOpenOrders = async (
  account: string,
  chainID: string
): Promise<Order> => {
  return getOpenOrders(account, chainID);
};

export const getAllExecutedOrders = async (
  account: string,
  chainID: string
): Promise<Order> => {
  return getExecutedOrders(account, chainID);
};

export const getAllCancelledOrders = async (
  account: string,
  chainID: string
): Promise<Order> => {
  return getCancelledOrders(account, chainID);
};

//#endregion Get All Orders
