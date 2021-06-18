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
import { isEthereumChain } from "@gelatonetwork/limit-orders-lib/dist/utils";

export default function useGasOverhead(
  inputAmount: CurrencyAmount<Currency> | undefined,
  outputAmount: CurrencyAmount<Currency> | undefined,
  rateType: Rate
): { realExecutionRate: string | undefined; gasPrice: number | undefined } {
  const { chainId, handler } = useWeb3();

  const gasPrice = useGasPrice();
  const nativeCurrency = useCurrency("NATIVE");

  const requiredGas = formatUnits(
    gasPrice
      ? BigNumber.from(gasPrice).mul(GENERIC_GAS_LIMIT_ORDER_EXECUTION)
      : "0"
  );

  const requiredGasAsCurrencyAmount = tryParseAmount(
    requiredGas,
    nativeCurrency ?? undefined
  );

  const gasCostInInputTokens = useTradeExactIn(
    requiredGasAsCurrencyAmount,
    inputAmount?.currency,
    handler
  );

  const realInputAmount = useMemo(
    () =>
      gasCostInInputTokens &&
      inputAmount &&
      inputAmount.subtract(gasCostInInputTokens.outputAmount),
    [gasCostInInputTokens, inputAmount]
  );

  const realExecutionRate = useMemo(() => {
    if (
      !inputAmount ||
      !gasCostInInputTokens ||
      !realInputAmount ||
      !outputAmount
    )
      return "-";

    if (gasCostInInputTokens.outputAmount.greaterThan(inputAmount.asFraction))
      return "never executes";
    else
      return rateType === Rate.DIV
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
            ?.toSignificant(6);
  }, [
    rateType,
    realInputAmount,
    outputAmount,
    inputAmount,
    gasCostInInputTokens,
  ]);

  return chainId && isEthereumChain(chainId)
    ? { realExecutionRate, gasPrice }
    : { realExecutionRate: undefined, gasPrice: undefined };
}
