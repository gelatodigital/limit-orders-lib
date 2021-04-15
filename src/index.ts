import { Interface } from "@ethersproject/abi";
import { ethers, providers } from "ethers";
import {
  ETH_ADDRESS,
  MAINNET_LIMIT_ORDER_MODULE,
  ROPSTEN_LIMIT_ORDER_MODULE,
} from "./constants";
import { getGelatoPineCore } from "./gelatoPineCore";
import {
  getOrders,
  getOpenOrders,
  getExecutedOrders,
  getCancelledOrders,
} from "./query/orders";
import {
  Order,
  TransactionData,
  TransactionDataWithSecret,
} from "./types/type";

//#region Limit Orders Submission

// Convention ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
export const getLimitOrderPayload = async (
  signer: ethers.Signer,
  fromCurrency: string,
  toCurrency: string,
  amount: ethers.BigNumber,
  minimumReturn: ethers.BigNumber
): Promise<TransactionData> => {
  return (
    await getLimitOrderPayloadWithSecret(
      signer,
      fromCurrency,
      toCurrency,
      amount,
      minimumReturn
    )
  ).txData;
};

export const getLimitOrderPayloadWithSecret = async (
  signer: ethers.Signer,
  fromCurrency: string,
  toCurrency: string,
  amount: ethers.BigNumber,
  minimumReturn: ethers.BigNumber
): Promise<TransactionDataWithSecret> => {
  const secret = ethers.utils
    .hexlify(ethers.utils.randomBytes(13))
    .replace("0x", "");
  const fullSecret = `2070696e652e66696e616e63652020d83ddc09${secret}`;
  const { privateKey, address } = new ethers.Wallet(fullSecret);

  const gelatoPineCore = await getGelatoPineCore(signer.provider);

  const [data, value] = await getEncodedData(
    await signer.getChainId(),
    gelatoPineCore,
    fromCurrency,
    toCurrency,
    await signer.getAddress(),
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
  chainId: Number,
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

  return fromCurrency === ETH_ADDRESS
    ? [
        gelatoPineCore.interface.encodeFunctionData("depositEth", [
          await gelatoPineCore.encodeEthOrder(
            chainId == 1
              ? MAINNET_LIMIT_ORDER_MODULE
              : ROPSTEN_LIMIT_ORDER_MODULE,
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
          chainId == 1
            ? MAINNET_LIMIT_ORDER_MODULE
            : ROPSTEN_LIMIT_ORDER_MODULE,
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
): Promise<any> => {
  let txData = await getLimitOrderPayload(
    signer,
    fromCurrency,
    toCurrency,
    amount,
    minimumReturn
  );

  return await signer.sendTransaction({
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
): Promise<any> => {
  const abiCoder = new ethers.utils.AbiCoder();
  const gelatoPineCore = await getGelatoPineCore(signer.provider);
  return await gelatoPineCore.cancelOrder(
    (await signer.provider?.getNetwork())?.chainId === 1
      ? MAINNET_LIMIT_ORDER_MODULE
      : ROPSTEN_LIMIT_ORDER_MODULE,
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
      (await provider.getNetwork())?.chainId === 1
        ? MAINNET_LIMIT_ORDER_MODULE
        : ROPSTEN_LIMIT_ORDER_MODULE,
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
  return await getOrders(account, chainID);
};

export const getAllOpenOrders = async (
  account: string,
  chainID: string
): Promise<Order> => {
  return await getOpenOrders(account, chainID);
};

export const getAllExecutedOrders = async (
  account: string,
  chainID: string
): Promise<Order> => {
  return await getExecutedOrders(account, chainID);
};

export const getAllCancelledOrders = async (
  account: string,
  chainID: string
): Promise<Order> => {
  return await getCancelledOrders(account, chainID);
};

//#endregion Get All Orders
