import { useCallback } from "react";
import { Order } from "@gelatonetwork/limit-orders-lib";
import { BigNumber } from "@ethersproject/bignumber";
import { Overrides } from "@ethersproject/contracts";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { useOrderActionHandlers } from "../../state/gstoploss/hooks";
import { Field } from "../../types";
import { Currency, Price } from "@uniswap/sdk-core";
import { Rate } from "../../state/gstoploss/actions";
import { useWeb3 } from "../../web3";
import { useTransactionAdder } from "../../state/gtransactions/hooks";
import useGasPrice from "../useGasPrice";
import useGelatoStoplossOrdersLib from "./useGelatoStoplossOrdersLib";

export interface GelatoStoplossOrdersHandlers {
  handleStoplossOrderSubmission: (orderToSubmit: {
    inputToken: string;
    outputToken: string;
    inputAmount: string;
    outputAmount: string;
    slippage: number;
    owner: string;
    overrides?: Overrides;
  }) => Promise<TransactionResponse>;
  handleStoplossOrderCancellation: (
    order: Order,
    orderDetails?: {
      inputTokenSymbol: string;
      outputTokenSymbol: string;
      inputAmount: string;
      outputAmount: string;
      slippage: number;
    },
    overrides?: Overrides
  ) => Promise<TransactionResponse>;
  handleInput: (field: Field, value: string) => void;
  handleCurrencySelection: (
    field: Field.INPUT | Field.OUTPUT,
    currency: Currency
  ) => void;
  handleSwitchTokens: () => void;
  handleRateType: (rateType: Rate, price?: Price<Currency, Currency>) => void;
  handleSlippage: (slippage: string) => void;
}

export default function useGelatoStoplossOrdersHandlers(): GelatoStoplossOrdersHandlers {
  const { chainId, account } = useWeb3();

  const gelatoStoplossOrders = useGelatoStoplossOrdersLib();

  console.log("gelatoStoplossOrders", gelatoStoplossOrders);

  const addTransaction = useTransactionAdder();

  const gasPrice = useGasPrice();

  const {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRateType,
    onSlippageInput,
  } = useOrderActionHandlers();

  const handleStoplossOrderSubmission = useCallback(
    async (
      orderToSubmit: {
        inputToken: string;
        outputToken: string;
        inputAmount: string;
        outputAmount: string;
        slippage: number;
        owner: string;
      },
      overrides?: Overrides
    ) => {
      if (!gelatoStoplossOrders) {
        throw new Error("Could not reach Gelato Limit Orders library");
      }

      if (!chainId) {
        throw new Error("No chainId");
      }

      if (!gelatoStoplossOrders?.signer) {
        throw new Error("No signer");
      }

      const {
        witness,
        payload,
        order,
      } = await gelatoStoplossOrders.encodeStoplossOrderSubmissionWithSecret(
        orderToSubmit.inputToken,
        orderToSubmit.outputToken,
        orderToSubmit.inputAmount,
        orderToSubmit.outputAmount,
        orderToSubmit.slippage,
        orderToSubmit.owner
      );

      const tx = await gelatoStoplossOrders.signer.sendTransaction({
        ...(overrides ?? { gasPrice }),
        to: payload.to,
        data: payload.data,
        value: BigNumber.from(payload.value),
      });

      const now = Math.round(Date.now() / 1000);

      addTransaction(tx, {
        summary: `Order submission`,
        type: "submission",
        order: {
          ...order,
          createdTxHash: tx?.hash.toLowerCase(),
          witness,
          status: "open",
          updatedAt: now.toString(),
        } as Order,
      });

      return tx;
    },
    [addTransaction, chainId, gasPrice, gelatoStoplossOrders]
  );

  const handleStoplossOrderCancellation = useCallback(
    async (
      orderToCancel: Order,
      orderDetails?: {
        inputTokenSymbol: string;
        outputTokenSymbol: string;
        inputAmount: string;
        outputAmount: string;
        slippage: number;
      },
      overrides?: Overrides
    ) => {
      if (!gelatoStoplossOrders) {
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

      const tx = await gelatoStoplossOrders.cancelLimitOrder(
        orderToCancel,
        checkIfOrderExists,
        overrides ?? { gasPrice, gasLimit: 600000 }
      );

      const now = Math.round(Date.now() / 1000);

      const summary = orderDetails
        ? `Order cancellation: Swap ${orderDetails.inputAmount} ${orderDetails.inputTokenSymbol} for ${orderDetails.outputAmount} ${orderDetails.outputTokenSymbol}`
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

      return tx;
    },
    [gelatoStoplossOrders, chainId, account, gasPrice, addTransaction]
  );

  const handleInput = useCallback(
    (field: Field, value: string) => {
      onUserInput(field, value);
    },
    [onUserInput]
  );

  const handleCurrencySelection = useCallback(
    (field: Field.INPUT | Field.OUTPUT, currency: Currency) => {
      onCurrencySelection(field, currency);
    },
    [onCurrencySelection]
  );

  const handleSwitchTokens = useCallback(() => {
    onSwitchTokens();
  }, [onSwitchTokens]);

  const handleRateType = useCallback(
    async (rateType: Rate, price?: Price<Currency, Currency>) => {
      if (rateType === Rate.MUL) {
        if (price) onUserInput(Field.PRICE, price.invert().toSignificant(6));
        onChangeRateType(Rate.DIV);
      } else {
        if (price) onUserInput(Field.PRICE, price.toSignificant(6));
        onChangeRateType(Rate.MUL);
      }
    },
    [onChangeRateType, onUserInput]
  );

  const handleSlippage = useCallback(
    (slippage: string) => {
      onSlippageInput(slippage);
    },
    [onSlippageInput]
  );

  return {
    handleStoplossOrderSubmission,
    handleStoplossOrderCancellation,
    handleInput,
    handleCurrencySelection,
    handleSwitchTokens,
    handleRateType,
    handleSlippage,
  };
}
