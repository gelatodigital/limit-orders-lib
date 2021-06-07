import JSBI from "jsbi";
import { parseUnits } from "@ethersproject/units";
import {
  Currency,
  CurrencyAmount,
  Percent,
  Price,
  TradeType,
} from "@uniswap/sdk-core";
import { Trade as V2Trade } from "@uniswap/v2-sdk";
import { useCallback, useMemo } from "react";
import { useCurrency } from "../../hooks/Tokens";
import useSwapSlippageTolerance from "../../hooks/useSwapSlippageTolerance";
import { useTradeExactIn, useTradeExactOut } from "../../hooks/useTrade";
import { isAddress } from "../../utils";
import { useCurrencyBalances } from "../gwallet/hooks";
import {
  Field,
  Rate,
  selectCurrency,
  setRateType,
  setRecipient,
  switchCurrencies,
  typeInput,
} from "./actions";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "..";
import useGasPrice from "../../hooks/useGasPrice";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits } from "ethers/lib/utils";
import { GENERIC_GAS_LIMIT_ORDER_EXECUTION } from "../../constants/misc";
import { useWeb3 } from "../../web3";

export function applyExchangeRateTo(
  inputValue: string,
  exchangeRate: string,
  inputCurrency: Currency,
  outputCurrency: Currency,
  isInverted: boolean
): string | undefined {
  const parsedInputAmount = tryParseAmount(
    inputValue,
    isInverted ? outputCurrency : inputCurrency
  );
  const parsedExchangeRate = tryParseAmount(
    exchangeRate,
    isInverted ? inputCurrency : outputCurrency
  );

  if (isInverted) {
    return parsedExchangeRate && parsedInputAmount
      ? parsedInputAmount
          ?.multiply(
            JSBI.exponentiate(
              JSBI.BigInt(10),
              JSBI.BigInt(inputCurrency.decimals)
            )
          )
          ?.divide(parsedExchangeRate.asFraction)
          .toSignificant(6)
      : undefined;
  } else {
    return parsedExchangeRate && parsedInputAmount
      ? parsedInputAmount
          ?.multiply(parsedExchangeRate.asFraction)
          .divide(
            JSBI.exponentiate(
              JSBI.BigInt(10),
              JSBI.BigInt(outputCurrency.decimals)
            )
          )
          .toSignificant(6)
      : undefined;
  }
}

export function useOrderState(): AppState["gorder"] {
  return useSelector<AppState, AppState["gorder"]>((state) => state.gorder);
}

export function useOrderActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void;
  onSwitchTokens: () => void;
  onUserInput: (field: Field, typedValue: string) => void;
  onChangeRecipient: (recipient: string | null) => void;
  onChangeRateType: (rateType: Rate) => void;
} {
  const dispatch = useDispatch();
  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      dispatch(
        selectCurrency({
          field,
          currencyId: currency.isToken
            ? currency.address
            : currency.isNative
            ? "ETH"
            : "",
        })
      );
    },
    [dispatch]
  );

  const onSwitchTokens = useCallback(() => {
    dispatch(switchCurrencies());
  }, [dispatch]);

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }));
    },
    [dispatch]
  );

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient({ recipient }));
    },
    [dispatch]
  );

  const onChangeRateType = useCallback(
    (rateType: Rate) => {
      dispatch(setRateType({ rateType }));
    },
    [dispatch]
  );

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRecipient,
    onChangeRateType,
  };
}

// try to parse a user entered amount for a given token
export function tryParseAmount<T extends Currency>(
  value?: string,
  currency?: T
): CurrencyAmount<T> | undefined {
  if (!value || !currency) {
    return undefined;
  }
  try {
    const typedValueParsed = parseUnits(value, currency.decimals).toString();
    if (typedValueParsed !== "0") {
      return CurrencyAmount.fromRawAmount(
        currency,
        JSBI.BigInt(typedValueParsed)
      );
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error);
  }
  // necessary for all paths to return a value
  return undefined;
}

const BAD_RECIPIENT_ADDRESSES: { [address: string]: true } = {
  "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f": true, // v2 factory
  "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a": true, // v2 router 01
  "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D": true, // v2 router 02
};

/**
 * Returns true if any of the pairs or tokens in a trade have the given checksummed address
 * @param trade to check for the given address
 * @param checksummedAddress address to check in the pairs and tokens
 */
function involvesAddress(
  trade: V2Trade<Currency, Currency, TradeType>,
  checksummedAddress: string
): boolean {
  const path = trade.route.path;
  return (
    path.some((token) => token.address === checksummedAddress) ||
    (trade instanceof V2Trade
      ? trade.route.pairs.some(
          (pair) => pair.liquidityToken.address === checksummedAddress
        )
      : false)
  );
}

export interface DerivedOrderInfo {
  currencies: { [field in Field]?: Currency };
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> };
  parsedAmount: CurrencyAmount<Currency> | undefined;
  inputAmount: CurrencyAmount<Currency> | undefined;
  inputError?: string;
  trade: V2Trade<Currency, Currency, TradeType> | undefined;
  //v3TradeState: { trade: V3Trade<Currency, Currency, TradeType> | null; state: V3TradeState }
  allowedSlippage: Percent;
  parsedAmounts: {
    [field in Field]: CurrencyAmount<Currency> | undefined;
  };
  rawAmounts: {
    [Field.INPUT]: string | undefined;
    [Field.OUTPUT]: string | undefined;
  };
  formattedAmounts: {
    [field in Field]: string;
  };
  realExecutionRate: string;
  price: Price<Currency, Currency> | undefined;
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedOrderInfo(): DerivedOrderInfo {
  const { account } = useWeb3();

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    rateType,
    inputValue,
  } = useOrderState();

  const inputCurrency = useCurrency(inputCurrencyId);
  const outputCurrency = useCurrency(outputCurrencyId);

  const to: string | null = account ?? null;

  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    inputCurrency ?? undefined,
    outputCurrency ?? undefined,
  ]);

  const isExactIn: boolean = independentField === Field.INPUT;
  const isDesiredRateUpdate = independentField === Field.DESIRED_RATE;
  const desiredRateApplied =
    isDesiredRateUpdate && inputValue && inputCurrency && outputCurrency
      ? applyExchangeRateTo(
          inputValue,
          typedValue,
          inputCurrency,
          outputCurrency,
          rateType === Rate.MUL ? false : true
        )
      : typedValue;

  const parsedAmount = tryParseAmount(
    typedValue,
    (isExactIn ? inputCurrency : outputCurrency) ?? undefined
  );

  const parsedAmountToUse = isDesiredRateUpdate
    ? tryParseAmount(
        desiredRateApplied,
        (isExactIn ? inputCurrency : outputCurrency) ?? undefined
      )
    : tryParseAmount(
        typedValue,
        (isExactIn ? inputCurrency : outputCurrency) ?? undefined
      );

  const bestTradeExactIn = useTradeExactIn(
    isExactIn ? parsedAmountToUse : undefined,
    outputCurrency ?? undefined
  );
  const bestTradeExactOut = useTradeExactOut(
    inputCurrency ?? undefined,
    !isExactIn ? parsedAmountToUse : undefined
  );

  const trade = isExactIn ? bestTradeExactIn : bestTradeExactOut;

  const inputAmount =
    (isDesiredRateUpdate && inputValue && inputCurrency) ||
    (independentField === Field.OUTPUT && inputCurrency)
      ? tryParseAmount(inputValue, inputCurrency) ?? undefined
      : trade?.inputAmount;

  const currencyBalances = {
    [Field.INPUT]: relevantTokenBalances[0],
    [Field.OUTPUT]: relevantTokenBalances[1],
  };

  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [Field.OUTPUT]: outputCurrency ?? undefined,
  };

  let inputError: string | undefined;
  if (!account) {
    inputError = "Connect Wallet";
  }

  if (!parsedAmount) {
    inputError = inputError ?? "Enter an amount";
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? "Select a token";
  }

  const formattedTo = isAddress(to);
  if (!to || !formattedTo) {
    inputError = inputError ?? "Enter a recipient";
  } else {
    if (
      BAD_RECIPIENT_ADDRESSES[formattedTo] ||
      (bestTradeExactIn && involvesAddress(bestTradeExactIn, formattedTo)) ||
      (bestTradeExactOut && involvesAddress(bestTradeExactOut, formattedTo))
    ) {
      inputError = inputError ?? "Invalid recipient";
    }
  }

  const toggledTrade = trade;
  const allowedSlippage = useSwapSlippageTolerance(toggledTrade ?? undefined);

  const executionRate = useMemo(() => {
    if (independentField === Field.OUTPUT) {
      let executionRate;
      if (rateType === Rate.MUL) {
        executionRate =
          inputAmount &&
          currencies[Field.INPUT] &&
          parsedAmount?.divide(inputAmount?.asFraction)?.multiply(
            JSBI.exponentiate(
              JSBI.BigInt(10),
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              JSBI.BigInt(currencies[Field.INPUT]!.decimals)
            )
          );
      } else {
        executionRate =
          parsedAmount &&
          currencies[Field.OUTPUT] &&
          inputAmount?.divide(parsedAmount.asFraction)?.multiply(
            JSBI.exponentiate(
              JSBI.BigInt(10),
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              JSBI.BigInt(currencies[Field.OUTPUT]!.decimals)
            )
          );
      }
      return executionRate;
    } else
      return rateType === Rate.MUL
        ? trade?.executionPrice
        : trade?.executionPrice.invert();
  }, [
    rateType,
    trade,
    independentField,
    currencies,
    inputAmount,
    parsedAmount,
  ]);

  const parsedAmounts = useMemo(
    () => ({
      [Field.INPUT]:
        independentField === Field.INPUT ? parsedAmount : inputAmount,
      [Field.OUTPUT]:
        independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
      [Field.DESIRED_RATE]:
        independentField === Field.DESIRED_RATE ? parsedAmount : executionRate,
    }),
    [independentField, parsedAmount, trade, inputAmount, executionRate]
  );

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
    currencies[Field.INPUT]
  );

  const realInputAmount =
    gasCostInInputTokens &&
    inputAmount &&
    inputAmount.subtract(gasCostInInputTokens.outputAmount);

  const realExecutionRate =
    inputCurrency && outputCurrency && trade && realInputAmount
      ? rateType === Rate.DIV
        ? realInputAmount
            .divide(trade.outputAmount.asFraction)
            ?.multiply(
              JSBI.exponentiate(
                JSBI.BigInt(10),
                JSBI.BigInt(outputCurrency.decimals)
              )
            )
            ?.toSignificant(6)
        : trade?.outputAmount
            ?.divide(realInputAmount.asFraction)
            ?.multiply(
              JSBI.exponentiate(
                JSBI.BigInt(10),
                JSBI.BigInt(inputCurrency.decimals)
              )
            )
            ?.toSignificant(6)
      : "-";

  // compare input to balance
  const [balanceIn, amountIn] = [
    currencyBalances[Field.INPUT],
    parsedAmounts[Field.INPUT],
  ];

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = "Insufficient " + amountIn.currency.symbol + " balance";
  }

  const dependentField: Field =
    independentField === Field.INPUT || independentField === Field.DESIRED_RATE
      ? Field.OUTPUT
      : Field.INPUT;

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? "",
    // Overrides independent value when equal to DESIRED_RATE
    [Field.DESIRED_RATE]:
      parsedAmounts[Field.DESIRED_RATE]?.toSignificant(6) ?? "",
  };

  formattedAmounts[Field.DESIRED_RATE] =
    independentField === Field.DESIRED_RATE &&
    formattedAmounts[Field.DESIRED_RATE] === ""
      ? typedValue
      : formattedAmounts[Field.DESIRED_RATE];

  formattedAmounts[Field.INPUT] =
    dependentField !== Field.INPUT &&
    independentField !== Field.INPUT &&
    inputAmount
      ? inputAmount.toSignificant(6)
      : formattedAmounts[Field.INPUT];

  const rawAmounts = {
    [Field.INPUT]: inputCurrency
      ? parsedAmounts[Field.INPUT]
          ?.multiply(
            JSBI.exponentiate(
              JSBI.BigInt(10),
              JSBI.BigInt(inputCurrency.decimals)
            )
          )
          .toExact()
      : undefined,

    [Field.OUTPUT]: outputCurrency
      ? parsedAmounts[Field.OUTPUT]
          ?.multiply(
            JSBI.exponentiate(
              JSBI.BigInt(10),
              JSBI.BigInt(outputCurrency.decimals)
            )
          )
          .toExact()
      : undefined,
  };

  const price =
    parsedAmounts[Field.INPUT] && parsedAmounts[Field.OUTPUT]
      ? new Price({
          baseAmount: parsedAmounts[Field.OUTPUT]!,
          quoteAmount: parsedAmounts[Field.INPUT]!,
        })
      : undefined;

  return {
    currencies,
    currencyBalances,
    parsedAmount,
    rawAmounts,
    inputError,
    inputAmount,
    trade: trade ?? undefined,
    parsedAmounts: parsedAmounts as {
      [field in Field]: CurrencyAmount<Currency> | undefined;
    },
    formattedAmounts: formattedAmounts as {
      [field in Field]: string;
    },
    allowedSlippage,
    realExecutionRate,
    price,
  };
}
