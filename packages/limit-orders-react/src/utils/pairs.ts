import { Token } from "@uniswap/sdk-core";
import { getCreate2Address } from "@ethersproject/address";
import { keccak256, pack } from "@ethersproject/solidity";
import { isEthereumChain } from "@gelatonetwork/limit-orders-lib/dist/utils";

const SPOOKY_SWAP_FACTORY_ADDRESS =
  "0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3";
const SPOOKY_SWAP_INIT_CODE_HASH =
  "0xcdf2deca40a0bd56de8e3ce5c7df6727e5b1bf2ac96f283fa9c4b3e6b42ea9d2";

const QUICK_SWAP_FACTORY_ADDRESS = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
const QUICK_SWAP_INIT_CODE_HASH =
  "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";

const SPIRIT_SWAP_FACTORY_ADDRESS =
  "0xEF45d134b73241eDa7703fa787148D9C9F4950b0";
const SPIRIT_SWAP_INIT_CODE_HASH =
  "0xe242e798f6cee26a9cb0bbf24653bf066e5356ffeac160907fe2cc108e238617";

const UNISWAP_FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const UNISWAP_INIT_CODE_HASH =
  "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";

const POLYDEX_FACTORY_ADDRESS = "0x5BdD1CD910e3307582F213b33699e676E61deaD9";
const POLYDEX_INIT_CODE_HASH =
  "0x8cb41b27c88f8934c0773207afb757d84c4baa607990ad4a30505e42438d999a";

const getSpiritSwapPairAddress = (tokenA: Token, tokenB: Token): string => {
  const tokens = tokenA.sortsBefore(tokenB)
    ? [tokenA, tokenB]
    : [tokenB, tokenA]; // does safety checks

  return getCreate2Address(
    SPIRIT_SWAP_FACTORY_ADDRESS,
    keccak256(
      ["bytes"],
      [pack(["address", "address"], [tokens[0].address, tokens[1].address])]
    ),
    SPIRIT_SWAP_INIT_CODE_HASH
  );
};

const getQuickSwapPairAddress = (tokenA: Token, tokenB: Token): string => {
  const tokens = tokenA.sortsBefore(tokenB)
    ? [tokenA, tokenB]
    : [tokenB, tokenA]; // does safety checks

  return getCreate2Address(
    QUICK_SWAP_FACTORY_ADDRESS,
    keccak256(
      ["bytes"],
      [pack(["address", "address"], [tokens[0].address, tokens[1].address])]
    ),
    QUICK_SWAP_INIT_CODE_HASH
  );
};

const getSpookySwapPairAddress = (tokenA: Token, tokenB: Token): string => {
  const tokens = tokenA.sortsBefore(tokenB)
    ? [tokenA, tokenB]
    : [tokenB, tokenA]; // does safety checks

  return getCreate2Address(
    SPOOKY_SWAP_FACTORY_ADDRESS,
    keccak256(
      ["bytes"],
      [pack(["address", "address"], [tokens[0].address, tokens[1].address])]
    ),
    SPOOKY_SWAP_INIT_CODE_HASH
  );
};

const getUniswapPairAddress = (tokenA: Token, tokenB: Token): string => {
  const tokens = tokenA.sortsBefore(tokenB)
    ? [tokenA, tokenB]
    : [tokenB, tokenA]; // does safety checks

  return getCreate2Address(
    UNISWAP_FACTORY_ADDRESS,
    keccak256(
      ["bytes"],
      [pack(["address", "address"], [tokens[0].address, tokens[1].address])]
    ),
    UNISWAP_INIT_CODE_HASH
  );
};

const getPolydexPairAddress = (tokenA: Token, tokenB: Token): string => {
  const tokens = tokenA.sortsBefore(tokenB)
    ? [tokenA, tokenB]
    : [tokenB, tokenA]; // does safety checks

  return getCreate2Address(
    POLYDEX_FACTORY_ADDRESS,
    keccak256(
      ["bytes"],
      [pack(["address", "address"], [tokens[0].address, tokens[1].address])]
    ),
    POLYDEX_INIT_CODE_HASH
  );
};

export const calculatePairAddressByHandler = (
  tokenA: Token,
  tokenB: Token,
  handler?: string
): string | undefined => {
  if (tokenA.chainId === 137 && tokenB.chainId === 137) {
    switch (handler) {
      case "polydex":
        return getPolydexPairAddress(tokenA, tokenB);
      case "quickswap":
        return getQuickSwapPairAddress(tokenA, tokenB);
      default:
        return getQuickSwapPairAddress(tokenA, tokenB);
    }
  } else if (tokenA.chainId === 250 && tokenB.chainId === 250) {
    switch (handler) {
      case "spiritswap":
        return getSpiritSwapPairAddress(tokenA, tokenB);
      case "spookyswap":
        return getSpookySwapPairAddress(tokenA, tokenB);
      default:
        return getSpookySwapPairAddress(tokenA, tokenB);
    }
  } else if (isEthereumChain(tokenA.chainId)) {
    return getUniswapPairAddress(tokenA, tokenB);
  } else return undefined;
};
