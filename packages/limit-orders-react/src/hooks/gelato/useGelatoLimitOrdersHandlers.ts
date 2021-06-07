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

  const { currencies, rawAmounts, parsedAmounts } = useDerivedOrderInfo();

  const { independentField, rateType } = useOrderState();

  const {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRateType,
  } = useOrderActionHandlers();

  const handleLimitOrderSubmission = useCallback(async () => {
    if (!currencies[Field.INPUT]?.wrapped.address) {
      throw new Error("Invalid input currency");
    }

    if (!currencies[Field.OUTPUT]?.wrapped.address) {
      throw new Error("Invalid output currency");
    }

    if (!rawAmounts[Field.INPUT]) {
      throw new Error("Invalid input amount");
    }

    if (!rawAmounts[Field.OUTPUT]) {
      throw new Error("Invalid output amount");
    }

    if (!gelatoLimitOrders) {
      throw new Error("Could not reach Gelato Limit Orders library");
    }

    if (!chainId) {
      throw new Error("No chainId");
    }

    const { minReturn } = !utils.isEthereumChain(chainId)
      ? gelatoLimitOrders.getFeeAndSlippageAdjustedMinReturn(
          rawAmounts[Field.OUTPUT]!
        )
      : { minReturn: rawAmounts[Field.OUTPUT]! };

    const tx = await gelatoLimitOrders.submitLimitOrder(
      currencies[Field.INPUT]?.isNative
        ? NATIVE
        : currencies[Field.INPUT]!.wrapped.address,
      currencies[Field.OUTPUT]?.isNative
        ? NATIVE
        : currencies[Field.OUTPUT]!.wrapped.address,
      rawAmounts[Field.INPUT]!,
      minReturn
    );
    return tx?.hash;
  }, [gelatoLimitOrders, rawAmounts, currencies]);

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
    if (independentField === Field.DESIRED_RATE) {
      if (rateType === Rate.MUL) {
        const flipped =
          parsedAmounts[Field.INPUT] &&
          parsedAmounts[Field.OUTPUT] &&
          currencies[Field.OUTPUT]
            ? parsedAmounts[Field.INPUT]
                ?.divide(parsedAmounts[Field.OUTPUT]!.asFraction)
                ?.multiply(
                  JSBI.exponentiate(
                    JSBI.BigInt(10),
                    JSBI.BigInt(currencies[Field.OUTPUT]!.decimals)
                  )
                )
                ?.toSignificant(6)
            : undefined;

        onChangeRateType(Rate.DIV);
        if (flipped) onUserInput(Field.DESIRED_RATE, flipped);
      } else {
        const flipped =
          parsedAmounts[Field.INPUT] &&
          parsedAmounts[Field.OUTPUT] &&
          currencies[Field.OUTPUT]
            ? parsedAmounts[Field.OUTPUT]
                ?.divide(parsedAmounts[Field.INPUT]!.asFraction)
                ?.multiply(
                  JSBI.exponentiate(
                    JSBI.BigInt(10),
                    JSBI.BigInt(currencies[Field.INPUT]!.decimals)
                  )
                )
                ?.toSignificant(6)
            : undefined;

        onChangeRateType(Rate.MUL);
        if (flipped) onUserInput(Field.DESIRED_RATE, flipped);
      }
    } else {
      onChangeRateType(rateType === Rate.MUL ? Rate.DIV : Rate.MUL);
    }
  }, [rateType, onUserInput, independentField, currencies, parsedAmounts]);

  return {
    handleLimitOrderSubmission,
    handleLimitOrderCancellation,
    handleInput,
    handleCurrencySelection,
    handleSwitchTokens,
    handleRateType,
  };
}
