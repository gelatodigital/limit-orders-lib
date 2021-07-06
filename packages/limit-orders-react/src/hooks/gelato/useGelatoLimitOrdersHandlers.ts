/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useCallback, useMemo } from "react";
import {
  ChainId,
  GelatoLimitOrders,
  Order,
  utils,
} from "@gelatonetwork/limit-orders-lib";
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
import { useTransactionAdder } from "../../state/gtransactions/hooks";
import useGasPrice from "../useGasPrice";
import { BigNumber } from "ethers";

export interface GelatoLimitOrdersHandlers {
  handleLimitOrderSubmission: () => Promise<string | undefined>;
  handleLimitOrderCancellation: (
    order: Order,
    orderDetails?: {
      inputTokenSymbol: string;
      outputTokenSymbol: string;
      inputAmount: string;
      outputAmount: string;
      executionPrice: string;
    }
  ) => Promise<string | undefined>;
  handleInput: (field: Field, value: string) => void;
  handleCurrencySelection: (field: Field, currency: Currency) => void;
  handleSwitchTokens: () => void;
  handleRateType: () => void;
  library: GelatoLimitOrders | undefined;
}

export default function useGelatoLimitOrdersHandlers(): GelatoLimitOrdersHandlers {
  const { chainId, library, account, handler } = useWeb3();

  const gelatoLimitOrders = useMemo(() => {
    try {
      return chainId && library
        ? new GelatoLimitOrders(
            chainId as ChainId,
            library?.getSigner(),
            handler
          )
        : undefined;
    } catch (error) {
      console.error(
        `Could not instantiate GelatoLimitOrders: ${error.message}`
      );
      return undefined;
    }
  }, [chainId, library, handler]);

  const {
    currencies,
    parsedAmounts,
    formattedAmounts,
    rawAmounts,
  } = useDerivedOrderInfo();

  const addTransaction = useTransactionAdder();

  const { rateType } = useOrderState();

  const gasPrice = useGasPrice();

  const {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRateType,
  } = useOrderActionHandlers();

  const inputCurrency = currencies.input;
  const outputCurrency = currencies.output;

  const handleLimitOrderSubmission = useCallback(async () => {
    if (!inputCurrency?.wrapped.address) {
      throw new Error("Invalid input currency");
    }

    if (!outputCurrency?.wrapped.address) {
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

    if (!account) {
      throw new Error("No account");
    }

    if (!gelatoLimitOrders?.signer) {
      throw new Error("No signer");
    }

    const {
      witness,
      payload,
      order,
    } = await gelatoLimitOrders.encodeLimitOrderSubmissionWithSecret(
      inputCurrency?.isNative ? NATIVE : inputCurrency.wrapped.address,
      outputCurrency?.isNative ? NATIVE : outputCurrency.wrapped.address,
      rawAmounts.input,
      rawAmounts.output,
      account
    );

    const tx = await gelatoLimitOrders.signer.sendTransaction({
      to: payload.to,
      data: payload.data,
      value: BigNumber.from(payload.value),
      gasPrice,
    });

    const now = Math.round(Date.now() / 1000);

    addTransaction(tx, {
      summary: `Order submission: Swap ${formattedAmounts.input} ${
        inputCurrency.symbol
      } for ${formattedAmounts.output} ${outputCurrency.symbol} when 1 ${
        rateType === Rate.MUL ? inputCurrency.symbol : outputCurrency.symbol
      } = ${formattedAmounts.price} ${
        rateType === Rate.MUL ? outputCurrency.symbol : inputCurrency.symbol
      }`,
      type: "submission",
      order: {
        ...order,
        createdTxHash: tx?.hash.toLowerCase(),
        witness,
        status: "open",
        updatedAt: now.toString(),
      } as Order,
    });

    return tx?.hash;
  }, [
    inputCurrency,
    outputCurrency,
    rawAmounts,
    gelatoLimitOrders,
    chainId,
    addTransaction,
    formattedAmounts,
    rateType,
    account,
    gasPrice,
  ]);

  const handleLimitOrderCancellation = useCallback(
    async (
      orderToCancel: Order,
      orderDetails?: {
        inputTokenSymbol: string;
        outputTokenSymbol: string;
        inputAmount: string;
        outputAmount: string;
        executionPrice: string;
      }
    ) => {
      if (!gelatoLimitOrders) {
        throw new Error("Could not reach Gelato Limit Orders library");
      }

      if (!chainId) {
        throw new Error("No chainId");
      }

      if (!account) {
        throw new Error("No account");
      }

      const checkIfOrderExists = Boolean(
        orderToCancel.module &&
          orderToCancel.inputToken &&
          orderToCancel.owner &&
          orderToCancel.witness &&
          orderToCancel.data
      );

      const tx = await gelatoLimitOrders.cancelLimitOrder(
        orderToCancel,
        checkIfOrderExists,
        gasPrice
      );

      const now = Math.round(Date.now() / 1000);

      const summary = orderDetails
        ? `Order cancellation: Swap ${orderDetails.inputAmount} ${orderDetails.inputTokenSymbol} for ${orderDetails.outputAmount} ${orderDetails.outputTokenSymbol} when 1 ${orderDetails.inputTokenSymbol} = ${orderDetails.executionPrice} ${orderDetails.outputTokenSymbol}`
        : "Order cancellation";

      addTransaction(tx, {
        summary,
        type: "cancellation",
        order: {
          ...orderToCancel,
          updatedAt: now.toString(),
          status: "cancelled",
          cancelledTxHash: tx?.hash.toLowerCase(),
        },
      });

      return tx?.hash;
    },
    [gelatoLimitOrders, chainId, account, gasPrice, addTransaction]
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
    if (rateType === Rate.MUL) {
      const flipped =
        parsedAmounts.input && parsedAmounts.output && outputCurrency
          ? parsedAmounts.input
              ?.divide(parsedAmounts.output.asFraction)
              ?.multiply(
                JSBI.exponentiate(
                  JSBI.BigInt(10),
                  JSBI.BigInt(outputCurrency.decimals)
                )
              )
              ?.toSignificant(6)
          : undefined;
      onChangeRateType(Rate.DIV);
      if (flipped) onUserInput(Field.PRICE, flipped);
    } else {
      const flipped =
        parsedAmounts.input && parsedAmounts.output && inputCurrency
          ? parsedAmounts.output
              ?.divide(parsedAmounts.input.asFraction)
              ?.multiply(
                JSBI.exponentiate(
                  JSBI.BigInt(10),
                  JSBI.BigInt(inputCurrency.decimals)
                )
              )
              ?.toSignificant(6)
          : undefined;
      onChangeRateType(Rate.MUL);
      if (flipped) onUserInput(Field.PRICE, flipped);
    }
  }, [
    onUserInput,
    onChangeRateType,
    rateType,
    parsedAmounts,
    inputCurrency,
    outputCurrency,
  ]);

  return {
    handleLimitOrderSubmission,
    handleLimitOrderCancellation,
    handleInput,
    handleCurrencySelection,
    handleSwitchTokens,
    handleRateType,
    library: gelatoLimitOrders,
  };
}
