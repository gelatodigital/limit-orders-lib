/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useCallback, useMemo } from "react";
import { GelatoLimitOrders, utils } from "@gelatonetwork/limit-orders-lib";
import {
  useDerivedOrderInfo,
  useOrderActionHandlers,
  useOrderState,
} from "../../state/gorder/hooks";
import { Field } from "../../types";
import { Currency } from "@uniswap/sdk-core";
import { Rate } from "../../state/gorder/actions";
import JSBI from "jsbi";
import { NATIVE } from "../../constants/addresses";
import { useWeb3 } from "../../web3";

export enum ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
}

export interface GelatoLimitOrdersHandlers {
  handleLimitOrderSubmission: () => Promise<string | undefined>;
  handleLimitOrderCancellation: (
    fromCurrency: string,
    toCurrency: string,
    amount: string,
    witness: string
  ) => Promise<string | undefined>;
  handleInput: (field: Field, value: string) => void;
  handleCurrencySelection: (field: Field, currency: Currency) => void;
  handleSwitchTokens: () => void;
  handleRateType: () => void;
}

export default function useGelatoLimitOrdersHandlers(): GelatoLimitOrdersHandlers {
  const { chainId, library } = useWeb3();

  const gelatoLimitOrders = useMemo(
    () =>
      chainId && library
        ? new GelatoLimitOrders(chainId, library?.getSigner())
        : undefined,
    [chainId, library]
  );

  const { currencies, parsedAmounts } = useDerivedOrderInfo();

  const { independentField, rateType } = useOrderState();

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRateType } =
    useOrderActionHandlers();

  const inputCurrency = useMemo(() => currencies.input, [currencies.input]);

  const outputCurrency = useMemo(() => currencies.output, [currencies.input]);

  const rawAmounts = useMemo(
    () => ({
      input: inputCurrency
        ? parsedAmounts.input
            ?.multiply(
              JSBI.exponentiate(
                JSBI.BigInt(10),
                JSBI.BigInt(inputCurrency.decimals)
              )
            )
            .toExact()
        : undefined,

      output: outputCurrency
        ? parsedAmounts.output
            ?.multiply(
              JSBI.exponentiate(
                JSBI.BigInt(10),
                JSBI.BigInt(outputCurrency.decimals)
              )
            )
            .toExact()
        : undefined,
    }),
    [inputCurrency, outputCurrency, parsedAmounts]
  );

  const handleLimitOrderSubmission = useCallback(async () => {
    if (!currencies.input?.wrapped.address) {
      throw new Error("Invalid input currency");
    }

    if (!currencies.output?.wrapped.address) {
      throw new Error("Invalid output currency");
    }

    if (!rawAmounts.input) {
      throw new Error("Invalid input amount");
    }

    if (!rawAmounts.output) {
      throw new Error("Invalid output amount");
    }

    if (!gelatoLimitOrders) {
      throw new Error("Could not reach Gelato Limit Orders library");
    }

    if (!chainId) {
      throw new Error("No chainId");
    }

    const { minReturn } = !utils.isEthereumChain(chainId)
      ? gelatoLimitOrders.getFeeAndSlippageAdjustedMinReturn(rawAmounts.output)
      : { minReturn: rawAmounts.output };

    const tx = await gelatoLimitOrders.submitLimitOrder(
      currencies.input?.isNative ? NATIVE : currencies.input.wrapped.address,
      currencies.output?.isNative ? NATIVE : currencies.output.wrapped.address,
      rawAmounts.input,
      minReturn
    );
    return tx?.hash;
  }, [gelatoLimitOrders, rawAmounts, currencies, chainId]);

  const handleLimitOrderCancellation = useCallback(
    async (
      fromCurrency: string,
      toCurrency: string,
      amount: string,
      witness: string
    ) => {
      const tx = await gelatoLimitOrders?.cancelLimitOrder(
        fromCurrency,
        toCurrency,
        amount,
        witness
      );
      return tx?.hash;
    },
    [gelatoLimitOrders]
  );

  const handleInput = useCallback(
    (field: Field, value: string) => {
      onUserInput(field, value);
    },
    [onUserInput]
  );

  const handleCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      onCurrencySelection(field, currency);
    },
    [onCurrencySelection]
  );

  const handleSwitchTokens = useCallback(() => {
    onSwitchTokens();
  }, [onSwitchTokens]);

  const handleRateType = useCallback(async () => {
    if (independentField === Field.PRICE) {
      if (rateType === Rate.MUL) {
        const flipped =
          parsedAmounts.input && parsedAmounts.output && currencies.output
            ? parsedAmounts.input
                ?.divide(parsedAmounts.output.asFraction)
                ?.multiply(
                  JSBI.exponentiate(
                    JSBI.BigInt(10),
                    JSBI.BigInt(currencies.output.decimals)
                  )
                )
                ?.toSignificant(6)
            : undefined;

        onChangeRateType(Rate.DIV);
        if (flipped) onUserInput(Field.PRICE, flipped);
      } else {
        const flipped =
          parsedAmounts.input && parsedAmounts.output && currencies.input
            ? parsedAmounts.output
                ?.divide(parsedAmounts.input.asFraction)
                ?.multiply(
                  JSBI.exponentiate(
                    JSBI.BigInt(10),
                    JSBI.BigInt(currencies.input.decimals)
                  )
                )
                ?.toSignificant(6)
            : undefined;

        onChangeRateType(Rate.MUL);
        if (flipped) onUserInput(Field.PRICE, flipped);
      }
    } else {
      onChangeRateType(rateType === Rate.MUL ? Rate.DIV : Rate.MUL);
    }
  }, [
    rateType,
    onUserInput,
    independentField,
    currencies,
    parsedAmounts,
    onChangeRateType,
  ]);

  return {
    handleLimitOrderSubmission,
    handleLimitOrderCancellation,
    handleInput,
    handleCurrencySelection,
    handleSwitchTokens,
    handleRateType,
  };
}
