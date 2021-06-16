import { Token } from "@uniswap/sdk-core";
import { getCreate2Address } from "@ethersproject/address";
import { keccak256, pack } from "@ethersproject/solidity";

let PAIR_ADDRESS_CACHE: {
  [token0Address: string]: { [token1Address: string]: string };
} = {};

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

export const getSpiritSwapPairAddress = (
  tokenA: Token,
  tokenB: Token
): string => {
  const tokens = tokenA.sortsBefore(tokenB)
    ? [tokenA, tokenB]
    : [tokenB, tokenA]; // does safety checks

  if (
    PAIR_ADDRESS_CACHE?.[tokens[0].address]?.[tokens[1].address] === undefined
  ) {
    PAIR_ADDRESS_CACHE = {
      ...PAIR_ADDRESS_CACHE,
      [tokens[0].address]: {
        ...PAIR_ADDRESS_CACHE?.[tokens[0].address],
        [tokens[1].address]: getCreate2Address(
          SPIRIT_SWAP_FACTORY_ADDRESS,
          keccak256(
            ["bytes"],
            [
              pack(
                ["address", "address"],
                [tokens[0].address, tokens[1].address]
              ),
            ]
          ),
          SPIRIT_SWAP_INIT_CODE_HASH
        ),
      },
    };
  }

  return PAIR_ADDRESS_CACHE[tokens[0].address][tokens[1].address];
};

export const getQuickSwapPairAddress = (
  tokenA: Token,
  tokenB: Token
): string => {
  const tokens = tokenA.sortsBefore(tokenB)
    ? [tokenA, tokenB]
    : [tokenB, tokenA]; // does safety checks

  if (
    PAIR_ADDRESS_CACHE?.[tokens[0].address]?.[tokens[1].address] === undefined
  ) {
    PAIR_ADDRESS_CACHE = {
      ...PAIR_ADDRESS_CACHE,
      [tokens[0].address]: {
        ...PAIR_ADDRESS_CACHE?.[tokens[0].address],
        [tokens[1].address]: getCreate2Address(
          QUICK_SWAP_FACTORY_ADDRESS,
          keccak256(
            ["bytes"],
            [
              pack(
                ["address", "address"],
                [tokens[0].address, tokens[1].address]
              ),
            ]
          ),
          QUICK_SWAP_INIT_CODE_HASH
        ),
      },
    };
  }

  return PAIR_ADDRESS_CACHE[tokens[0].address][tokens[1].address];
};

export const getSpookySwapPairAddress = (
  tokenA: Token,
  tokenB: Token
): string => {
  const tokens = tokenA.sortsBefore(tokenB)
    ? [tokenA, tokenB]
    : [tokenB, tokenA]; // does safety checks

  if (
    PAIR_ADDRESS_CACHE?.[tokens[0].address]?.[tokens[1].address] === undefined
  ) {
    PAIR_ADDRESS_CACHE = {
      ...PAIR_ADDRESS_CACHE,
      [tokens[0].address]: {
        ...PAIR_ADDRESS_CACHE?.[tokens[0].address],
        [tokens[1].address]: getCreate2Address(
          SPOOKY_SWAP_FACTORY_ADDRESS,
          keccak256(
            ["bytes"],
            [
              pack(
                ["address", "address"],
                [tokens[0].address, tokens[1].address]
              ),
            ]
          ),
          SPOOKY_SWAP_INIT_CODE_HASH
        ),
      },
    };
  }

  return PAIR_ADDRESS_CACHE[tokens[0].address][tokens[1].address];
};
