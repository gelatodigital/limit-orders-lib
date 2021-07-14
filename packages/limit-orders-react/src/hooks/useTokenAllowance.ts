import { Token, CurrencyAmount } from "@uniswap/sdk-core";
import { Contract } from "@ethersproject/contracts";
import { useMemo } from "react";
import { useSingleCallResult } from "../state/gmulticall/hooks";
import { useTokenContract } from "./useContract";

export function useTokenAllowance(
  token?: Token,
  owner?: string,
  spender?: string
): CurrencyAmount<Token> | undefined {
  const contract = useTokenContract(token?.address, false);

  const inputs = useMemo(() => [owner, spender], [owner, spender]);
  const allowance = useSingleCallResult(
    (contract as unknown) as Contract,
    "allowance",
    inputs,
    {
      blocksPerFetch: 1,
    }
  ).result;

  return useMemo(
    () =>
      token && allowance
        ? CurrencyAmount.fromRawAmount(token, allowance.toString())
        : undefined,
    [token, allowance]
  );
}
