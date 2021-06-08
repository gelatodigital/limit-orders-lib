import { useMemo } from "react";
import { formatUnits } from "ethers/lib/utils";
import { useWeb3 } from "../web3";
import useGasPrice from "./useGasPrice";
import { useCurrency } from "./Tokens";
import { BigNumber } from "@ethersproject/bignumber";
import { GENERIC_GAS_LIMIT_ORDER_EXECUTION } from "../constants/misc";
import { useTradeExactIn } from "./useTrade";
import { tryParseAmount } from "../state/gorder/hooks";
import { Currency, CurrencyAmount } from "@uniswap/sdk-core";
import { Rate } from "../state/gorder/actions";
import JSBI from "jsbi";

export default function useGasOverhead(
  inputAmount: CurrencyAmount<Currency> | undefined,
  outputAmount: CurrencyAmount<Currency> | undefined,
  rateType: Rate
): { realExecutionRate: string | undefined; gasPrice: number | undefined } {
  const { chainId } = useWeb3();

  const gasPrice = useGasPrice();
  const NativeCurrency = useCurrency("NATIVE");

  const requiredGas = formatUnits(
    gasPrice
      ? BigNumber.from(gasPrice).mul(GENERIC_GAS_LIMIT_ORDER_EXECUTION)
      : "0"
  );

  const requiredGasAsCurrencyAmount = tryParseAmount(
    requiredGas,
    NativeCurrency ?? undefined
  );

  const gasCostInInputTokens = useTradeExactIn(
    requiredGasAsCurrencyAmount,
    inputAmount?.currency
  );

  const realInputAmount = useMemo(
    () =>
      gasCostInInputTokens &&
      inputAmount &&
      inputAmount.subtract(gasCostInInputTokens.outputAmount),
    [gasCostInInputTokens, inputAmount]
  );

  const realExecutionRate = useMemo(
    () =>
      realInputAmount && outputAmount && inputAmount
        ? rateType === Rate.DIV
          ? realInputAmount
              .divide(outputAmount.asFraction)
              ?.multiply(
                JSBI.exponentiate(
                  JSBI.BigInt(10),
                  JSBI.BigInt(outputAmount.currency.decimals)
                )
              )
              ?.toSignificant(6)
          : outputAmount
              ?.divide(realInputAmount.asFraction)
              ?.multiply(
                JSBI.exponentiate(
                  JSBI.BigInt(10),
                  JSBI.BigInt(inputAmount.currency.decimals)
                )
              )
              ?.toSignificant(6)
        : "-",
    [rateType, realInputAmount, outputAmount, inputAmount]
  );

  return chainId === 1
    ? { realExecutionRate, gasPrice }
    : { realExecutionRate: undefined, gasPrice: undefined };
}
