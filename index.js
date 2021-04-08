import { ethers } from "ethers";
import { ETH_ADDRESS, LIMIT_ORDER_MODULE } from "./constants";
import { getGelatoPineCore } from "./gelatoPineCore";

// Convention ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
export const getLimitOrderPayload = async (
  providerOrSigner,
  fromCurrency,
  toCurrency,
  account,
  amount,
  minimumReturn
) => {
  const secret = ethers.utils
    .hexlify(ethers.utils.randomBytes(13))
    .replace("0x", "");
  const fullSecret = `2070696e652e66696e616e63652020d83ddc09${secret}`;
  const { privateKey, address } = new ethers.Wallet(fullSecret);

  const gelatoPineCore = getGelatoPineCore(providerOrSigner);

  const [data, value] = await getEncodedData(
    gelatoPineCore,
    fromCurrency,
    toCurrency,
    account,
    address,
    amount,
    minimumReturn,
    privateKey
  );

  return {
    to: fromCurrency === ETH_ADDRESS ? gelatoPineCore.address : fromCurrency,
    data: data,
    value: value,
  };
};

const getEncodedData = async (
  gelatoPineCore,
  fromCurrency,
  toCurrency,
  account,
  address,
  amount,
  minimumReturn,
  privateKey
) => {
  if (fromCurrency === toCurrency) throw "currency 1 is equal to currency 2";

  const abiCoder = new ethers.utils.AbiCoder();
  const encodedData = abiCoder.encode(
    ["address", "uint256"],
    [toCurrency, minimumReturn]
  );

  return fromCurrency === ETH_ADDRESS
    ? [
        gelatoPineCore.interface.encodeFunctionData(
          "depositEth",
          await gelatoPineCore.encodeEthOrder(
            LIMIT_ORDER_MODULE,
            fromCurrency,
            account,
            address,
            encodedData,
            privateKey
          )
        ),
        amount,
      ]
    : [
        await gelatoPineCore.encodeTokenOrder(
          LIMIT_ORDER_MODULE,
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
  signer,
  fromCurrency,
  toCurrency,
  amount,
  minimumReturn
) => {
  const [to, data, value] = await getLimitOrderPayload(
    signer,
    fromCurrency,
    toCurrency,
    await signer.getAddress(),
    amount,
    minimumReturn
  );

  return await signer.sendTransaction({
    to: to,
    data: data,
    value: value,
  });
};
