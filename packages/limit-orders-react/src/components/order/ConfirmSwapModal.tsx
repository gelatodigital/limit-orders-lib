import { Currency, Percent, TradeType } from "@uniswap/sdk-core";
import { Trade } from "@uniswap/v2-sdk";
import React, { useCallback } from "react";
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from "../TransactionConfirmationModal";
import SwapModalFooter from "./SwapModalFooter";
import SwapModalHeader from "./SwapModalHeader";

export default function ConfirmSwapModal({
  trade,
  onAcceptChanges,
  allowedSlippage,
  onConfirm,
  onDismiss,
  recipient,
  swapErrorMessage,
  isOpen,
  attemptingTxn,
  txHash,
}: {
  isOpen: boolean;
  trade: Trade<Currency, Currency, TradeType> | undefined;
  originalTrade: Trade<Currency, Currency, TradeType> | undefined;
  attemptingTxn: boolean;
  txHash: string | undefined;
  recipient: string | null;
  allowedSlippage: Percent;
  onAcceptChanges: () => void;
  onConfirm: () => void;
  swapErrorMessage: string | undefined;
  onDismiss: () => void;
}) {
  // const showAcceptChanges = useMemo(
  //   () =>
  //     Boolean(
  //       trade instanceof Trade &&
  //         originalTrade instanceof Trade &&
  //         tradeMeaningfullyDiffers(trade, originalTrade)
  //     ),
  //   [originalTrade, trade]
  // );
  const showAcceptChanges = false;

  const modalHeader = useCallback(() => {
    return trade ? (
      <SwapModalHeader
        trade={trade as any}
        allowedSlippage={allowedSlippage}
        recipient={recipient}
        showAcceptChanges={false}
        onAcceptChanges={onAcceptChanges}
      />
    ) : null;
  }, [allowedSlippage, onAcceptChanges, recipient, trade]);

  const modalBottom = useCallback(() => {
    return trade ? (
      <SwapModalFooter
        onConfirm={onConfirm}
        trade={trade}
        disabledConfirm={showAcceptChanges}
        swapErrorMessage={swapErrorMessage}
      />
    ) : null;
  }, [onConfirm, showAcceptChanges, swapErrorMessage, trade]);

  // text to show while loading
  const pendingText = `Swapping ${trade?.inputAmount?.toSignificant(6)} ${
    trade?.inputAmount?.currency?.symbol
  } for ${trade?.outputAmount?.toSignificant(6)} ${
    trade?.outputAmount?.currency?.symbol
  }`;

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent
          onDismiss={onDismiss}
          message={swapErrorMessage}
        />
      ) : (
        <ConfirmationModalContent
          title="Confirm Order"
          onDismiss={onDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ),
    [onDismiss, modalBottom, modalHeader, swapErrorMessage]
  );

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={confirmationContent}
      pendingText={pendingText}
      currencyToAdd={trade?.outputAmount.currency}
    />
  );
}
