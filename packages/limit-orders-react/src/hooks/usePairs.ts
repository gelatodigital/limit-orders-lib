import { Pair } from "@uniswap/v2-sdk";
import { useMemo } from "react";
import { abi as IUniswapV2PairABI } from "../abis/IUniswapV2Pair.json";
import { Interface } from "@ethersproject/abi";
import { useMultipleContractSingleData } from "../state/gmulticall/hooks";
import { Currency, CurrencyAmount, Token } from "@uniswap/sdk-core";
import { Venue } from "@gelatonetwork/limit-orders-lib";
import {
  getSpookySwapPairAddress,
  getSpiritSwapPairAddress,
  getQuickSwapPairAddress,
} from "../utils/pairs";

const PAIR_INTERFACE = new Interface(IUniswapV2PairABI);

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

const getPairAddress = (
  tokenA: Token,
  tokenB: Token,
  venue?: Venue
): string | undefined => {
  if (tokenA.chainId === 137 && tokenB.chainId === 137) {
    return getQuickSwapPairAddress(tokenA, tokenB);
  } else if (tokenA.chainId === 250 && tokenB.chainId === 250)
    if (venue) {
      return venue === "spookyswap"
        ? getSpookySwapPairAddress(tokenA, tokenB)
        : getSpiritSwapPairAddress(tokenA, tokenB);
    } else return getSpookySwapPairAddress(tokenA, tokenB);
  else if (
    (tokenA.chainId === 1 && tokenB.chainId === 1) ||
    (tokenA.chainId === 3 && tokenB.chainId === 3)
  ) {
    return Pair.getAddress(tokenA, tokenB);
  } else return undefined;
};

export function usePairs(
  currencies: [Currency | undefined, Currency | undefined][],
  venue?: Venue
): [PairState, Pair | null][] {
  const tokens = useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => [
        currencyA?.wrapped,
        currencyB?.wrapped,
      ]),
    [currencies]
  );

  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        return tokenA && tokenB && !tokenA.equals(tokenB)
          ? getPairAddress(tokenA, tokenB, venue)
          : undefined;
      }),
    [tokens, venue]
  );

  const results = useMultipleContractSingleData(
    pairAddresses,
    PAIR_INTERFACE,
    "getReserves"
  );

  return useMemo(() => {
    return results.map((result, i) => {
      const { result: reserves, loading } = result;
      const tokenA = tokens[i][0];
      const tokenB = tokens[i][1];

      if (loading) return [PairState.LOADING, null];
      if (!tokenA || !tokenB || tokenA.equals(tokenB))
        return [PairState.INVALID, null];
      if (!reserves) return [PairState.NOT_EXISTS, null];
      const { reserve0, reserve1 } = reserves;
      const [token0, token1] = tokenA.sortsBefore(tokenB)
        ? [tokenA, tokenB]
        : [tokenB, tokenA];
      return [
        PairState.EXISTS,
        new Pair(
          CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
          CurrencyAmount.fromRawAmount(token1, reserve1.toString())
        ),
      ];
    });
  }, [results, tokens]);
}

export function usePair(
  tokenA?: Currency,
  tokenB?: Currency
): [PairState, Pair | null] {
  const inputs: [[Currency | undefined, Currency | undefined]] = useMemo(
    () => [[tokenA, tokenB]],
    [tokenA, tokenB]
  );
  return usePairs(inputs)[0];
}
