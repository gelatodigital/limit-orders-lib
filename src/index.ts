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
  ETH_ADDRESS,
  FEE_BPS,
  MAX_SLIPPAGE_BPS,
  getLimitOrderModuleAddr,
  getNetworkName,
  isNetworkGasToken,
  isL2,
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
import {
  Order,
  TransactionData,
  TransactionDataWithSecret,
  WitnessAndSecret,
} from "./types";

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

export const getWitnessAndSecret = (): WitnessAndSecret => {
  const secret = utils.hexlify(utils.randomBytes(13)).replace("0x", "");
  const fullSecret = `4200696e652e66696e616e63652020d83ddc09${secret}`;
  const { privateKey, address } = new Wallet(fullSecret);
  return {
    secret: privateKey,
    witness: address,
  };
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
  const { secret, witness } = getWitnessAndSecret();

  provider = provider ?? (await getDefaultProvider(getNetworkName(chainId)));

  if (!provider) throw new Error("getLimitOrderPayloadWithSecret: no provider");

  const gelatoPineCore = await getGelatoPineCore(provider);

  const [data, value] = await getEncodedData(
    chainId,
    gelatoPineCore,
    fromCurrency,
    toCurrency,
    owner,
    witness,
    amount,
    minimumReturn,
    secret
  );

  return {
    txData: {
      to: isNetworkGasToken(fromCurrency)
        ? gelatoPineCore.address
        : fromCurrency,
      data: data,
      value: value,
    },
    secret: secret,
    witness: witness,
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

  return isNetworkGasToken(fromCurrency)
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
        (
          await signer.provider.getNetwork()
        ).chainId
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

export const getAllOrders = async (
  account: string,
  chainId: number
): Promise<Order[]> => {
  return getOrders(account, chainId);
};

export const getAllOpenOrders = async (
  account: string,
  chainId: number
): Promise<Order[]> => {
  return getOpenOrders(account, chainId);
};

export const getAllPastOrders = async (
  account: string,
  chainId: number
): Promise<Order[]> => {
  return getPastOrders(account, chainId);
};

export const getAllExecutedOrders = async (
  account: string,
  chainId: number
): Promise<Order[]> => {
  return getExecutedOrders(account, chainId);
};

export const getAllCancelledOrders = async (
  account: string,
  chainId: number
): Promise<Order[]> => {
  return getCancelledOrders(account, chainId);
};

// Special for L2
export const getFeeAndSlippageAdjustedMinReturn = (
  chainId: number,
  minReturn: BigNumber
): BigNumber => {
  if (!isL2(chainId))
    throw new Error("Use getFeeAndSlippageAdjustedMinReturn only on L2");
  const fee = minReturn.mul(FEE_BPS).div(10000);
  const maxSlippage = minReturn.mul(MAX_SLIPPAGE_BPS).div(10000);
  return minReturn.sub(fee).sub(maxSlippage);
};
