import JSBI from "jsbi";
import { parseUnits } from "@ethersproject/units";
import {
  Currency,
  CurrencyAmount,
  Percent,
  Price,
  TradeType,
} from "@uniswap/sdk-core";
import { Trade } from "@uniswap/v2-sdk";
import { useCallback, useMemo } from "react";
import { useCurrency } from "../../hooks/Tokens";
import useSwapSlippageTolerance from "../../hooks/useSwapSlippageTolerance";
import { useTradeExactIn, useTradeExactOut } from "../../hooks/useTrade";
import { isAddress } from "../../utils";
import { useCurrencyBalances } from "../../hooks/Balances";
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
  trade: Trade<Currency, Currency, TradeType>,
  checksummedAddress: string
): boolean {
  const path = trade.route.path;
  return (
    path.some((token) => token.address === checksummedAddress) ||
    (trade instanceof Trade
      ? trade.route.pairs.some(
          (pair) => pair.liquidityToken.address === checksummedAddress
        )
      : false)
  );
}

export interface DerivedOrderInfo {
  currencies: { input: Currency | undefined; output: Currency | undefined };
  currencyBalances: {
    input: CurrencyAmount<Currency> | undefined;
    output: CurrencyAmount<Currency> | undefined;
  };
  parsedAmount: CurrencyAmount<Currency> | undefined;
  inputAmount: CurrencyAmount<Currency> | undefined;
  inputError?: string;
  trade: Trade<Currency, Currency, TradeType> | undefined;
  parsedAmounts: {
    input: CurrencyAmount<Currency> | undefined;
    output: CurrencyAmount<Currency> | undefined;
  };
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
  const isDesiredRateUpdate = independentField === Field.PRICE;
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
    input: relevantTokenBalances[0],
    output: relevantTokenBalances[1],
  };

  const currencies = useMemo(
    () => ({
      input: inputCurrency ?? undefined,
      output: outputCurrency ?? undefined,
    }),
    [inputCurrency, outputCurrency]
  );

  let inputError: string | undefined;
  if (!account) {
    inputError = "Connect Wallet";
  }

  if (!parsedAmount) {
    inputError = inputError ?? "Enter an amount";
  }

  if (!currencies.input || !currencies.output) {
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

  const parsedAmounts = useMemo(
    () => ({
      input: independentField === Field.INPUT ? parsedAmount : inputAmount,
      output:
        independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
    }),
    [independentField, parsedAmount, trade, inputAmount]
  );

  const price = useMemo(
    () =>
      parsedAmounts.input && parsedAmounts.output
        ? new Price({
            baseAmount: parsedAmounts.input,
            quoteAmount: parsedAmounts.output,
          })
        : undefined,
    [parsedAmounts]
  );

  // compare input to balance
  const [balanceIn, amountIn] = [currencyBalances.input, parsedAmounts.input];

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = "Insufficient " + amountIn.currency.symbol + " balance";
  }

  return {
    currencies,
    currencyBalances,
    parsedAmount,
    inputError,
    inputAmount,
    trade: trade ?? undefined,
    parsedAmounts,
    price,
  };
}
