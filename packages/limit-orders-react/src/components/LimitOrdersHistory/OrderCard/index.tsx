import React, { useCallback, useState } from "react";
import styled, { DefaultTheme } from "styled-components/macro";
import { darken } from "polished";
import { ArrowRight } from "react-feather";
import { TYPE } from "../../../theme";
import { RowBetween } from "../../Row";
import { Order } from "@gelatonetwork/limit-orders-lib";
import useTheme from "../../../hooks/useTheme";
import { useCurrency } from "../../../hooks/Tokens";
import CurrencyLogo from "../../CurrencyLogo";
import {
  useGelatoLimitOrders,
  useGelatoLimitOrdersHandlers,
} from "../../../hooks/gelato";
import { CurrencyAmount } from "@uniswap/sdk-core";
import ConfirmCancellationModal from "../ConfirmCancellationModal";
import { useTradeExactIn } from "../../../hooks/useTrade";
import { Dots } from "../../order/styleds";
import { isEthereumChain } from "@gelatonetwork/limit-orders-lib/dist/utils";
import { useWeb3 } from "../../../web3";
import { ButtonGray } from "../../Button";
import { useIsTransactionPending } from "../../../state/gtransactions/hooks";
import {
  ExplorerDataType,
  getExplorerLink,
} from "../../../utils/getExplorerLink";

const handleColorType = (status: string, theme: DefaultTheme) => {
  switch (status) {
    case "open":
      return theme.blue1;
    case "executed":
      return theme.green1;
    case "cancelled":
      return theme.red1;

    case "pending":
      return theme.blue2;

    default:
      return theme.text3;
  }
};

const OrderPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: "16px";
  background-color: ${() => "transparent"};
  z-index: 1;
  width: "100%";
`;

const Container = styled.div<{ hideInput: boolean }>`
  border-radius: ${({ hideInput }) => (hideInput ? "16px" : "20px")};
  border: 1px solid ${" transparent"};
  background-color: ${({ theme }) => theme.bg1};
  width: ${({ hideInput }) => (hideInput ? "100%" : "initial")};
  :focus,
  :hover {
    border: 1px solid
      ${({ theme, hideInput }) => (hideInput ? " transparent" : theme.bg3)};
  }
`;

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.text1};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0 1rem 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.text2)};
  }
`;

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) =>
    active
      ? "  margin: 0 0.25rem 0 0.25rem;"
      : "  margin: 0 0.25rem 0 0.25rem;"}
  font-size:  ${({ active }) => (active ? "14px" : "14px")};
`;

const OrderRow = styled(LabelRow)`
  justify-content: flex-end;
  margin-top: -8px;
`;

const OrderStatus = styled.span<{ status: string; clickable: boolean }>`
  font-size: 0.825rem;
  font-weight: 600;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: ${({ clickable }) => (clickable ? "pointer" : "default")};
  color: ${({ status, theme }) => handleColorType(status, theme)};
  border: 1px solid ${({ status, theme }) => handleColorType(status, theme)};
  width: fit-content;
  justify-self: flex-end;
  text-transform: uppercase;
  :hover {
    content: "Reply!";
    border: 1px solid
      ${({ status, theme, clickable }) =>
        clickable
          ? handleColorType("cancelled", theme)
          : handleColorType(status, theme)};

    color: ${({ status, theme, clickable }) =>
      clickable
        ? handleColorType("cancelled", theme)
        : handleColorType(status, theme)};
  }
`;

export const ArrowWrapper = styled.div`
  padding: 4px;
  border-radius: 12px;
  height: 32px;
  width: 32px;
  margin-right: 2px;
  margin-left: -10px;
  background-color: ${({ theme }) => theme.bg1};
  border: 4px solid ${({ theme }) => theme.bg1};
`;

const CurrencySelect = styled(ButtonGray)<{
  selected: boolean;
  hideInput?: boolean;
}>`
  align-items: center;
  font-size: 24px;
  font-weight: 500;
  background-color: ${({ selected, theme }) =>
    selected ? theme.bg0 : theme.primary1};
  color: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
  border-radius: 16px;
  box-shadow: ${({ selected }) =>
    selected ? "none" : "0px 6px 10px rgba(0, 0, 0, 0.075)"};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  outline: none;
  cursor: default;
  user-select: none;
  border: none;
  height: ${({ hideInput }) => (hideInput ? "2.8rem" : "2.4rem")};
  width: ${({ hideInput }) => (hideInput ? "100%" : "initial")};
  padding: 0 8px;
  justify-content: space-between;
  margin-right: ${({ hideInput }) => (hideInput ? "0" : "12px")};
  &:focus {
    box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
    background-color: ${({ selected, theme }) =>
      selected ? theme.bg0 : theme.primary1};
  }
  :hover {
    background-color: ${({ selected, theme }) =>
      selected ? theme.bg0 : theme.primary1};
  }
`;

const Spacer = styled.div`
  flex: 1 1 auto;
`;

export default function OrderCard({ order }: { order: Order }) {
  const theme = useTheme();

  const { chainId } = useWeb3();

  const { handleLimitOrderCancellation } = useGelatoLimitOrdersHandlers();

  const { library: gelatoLibrary } = useGelatoLimitOrders();

  const inputToken = useCurrency(order.inputToken);
  const outputToken = useCurrency(order.outputToken);

  const outputAmount = outputToken
    ? CurrencyAmount.fromRawAmount(outputToken, order.minReturn)
    : undefined;

  const inputAmount = inputToken
    ? CurrencyAmount.fromRawAmount(inputToken, order.inputAmount)
    : undefined;

  const rawMinReturn =
    outputToken && gelatoLibrary && inputToken && chainId
      ? isEthereumChain(chainId)
        ? order.minReturn
        : gelatoLibrary.getRawMinReturn(order.minReturn)
      : undefined;

  const rawMinReturnAmount =
    outputToken && gelatoLibrary && inputToken && rawMinReturn
      ? CurrencyAmount.fromRawAmount(outputToken, rawMinReturn)
      : undefined;

  const executionRate =
    outputToken && gelatoLibrary && inputToken && rawMinReturn
      ? CurrencyAmount.fromRawAmount(
          outputToken,
          gelatoLibrary.getExecutionPrice(
            order.inputAmount,
            inputToken.decimals,
            rawMinReturn,
            outputToken.decimals
          )
        )
      : undefined;

  const trade = useTradeExactIn(inputAmount, outputToken ?? undefined);

  const isSubmissionPending = useIsTransactionPending(order.createdTxHash);
  const isCancellationPending = useIsTransactionPending(order.cancelledTxHash);

  // modal and loading
  const [
    { showConfirm, cancellationErrorMessage, attemptingTxn, txHash },
    setCancellationState,
  ] = useState<{
    showConfirm: boolean;
    attemptingTxn: boolean;
    cancellationErrorMessage: string | undefined;
    txHash: string | undefined;
  }>({
    showConfirm: false,
    attemptingTxn: false,
    cancellationErrorMessage: undefined,
    txHash: undefined,
  });

  const handleConfirmDismiss = useCallback(() => {
    setCancellationState({
      showConfirm: false,
      attemptingTxn,
      cancellationErrorMessage,
      txHash,
    });
  }, [attemptingTxn, cancellationErrorMessage, txHash]);

  const handleCancellation = useCallback(() => {
    if (!handleLimitOrderCancellation) {
      return;
    }

    setCancellationState({
      attemptingTxn: true,
      showConfirm,
      cancellationErrorMessage: undefined,
      txHash: undefined,
    });

    handleLimitOrderCancellation(order)
      .then((hash) => {
        setCancellationState({
          attemptingTxn: false,
          showConfirm,
          cancellationErrorMessage: undefined,
          txHash: hash,
        });
      })
      .catch((error) => {
        setCancellationState({
          attemptingTxn: false,
          showConfirm,
          cancellationErrorMessage: error.message,
          txHash: undefined,
        });
      });
  }, [setCancellationState, handleLimitOrderCancellation, showConfirm, order]);

  return (
    <OrderPanel>
      <ConfirmCancellationModal
        isOpen={showConfirm}
        attemptingTxn={attemptingTxn}
        txHash={txHash}
        onConfirm={handleCancellation}
        swapErrorMessage={cancellationErrorMessage}
        onDismiss={handleConfirmDismiss}
      />
      <Container hideInput={true}>
        <RowBetween padding="10px">
          {inputToken ? (
            <CurrencySelect selected={true}>
              <Aligner>
                <CurrencyLogo
                  currency={inputToken ?? undefined}
                  size={"18px"}
                />
                <StyledTokenName>
                  {inputToken?.name ?? <Dots />}
                </StyledTokenName>
              </Aligner>
            </CurrencySelect>
          ) : (
            <Dots />
          )}
          <ArrowWrapper>
            <ArrowRight size="16" color={theme.text1} />
          </ArrowWrapper>
          {outputToken ? (
            <CurrencySelect selected={true}>
              <Aligner>
                <CurrencyLogo
                  currency={outputToken ?? undefined}
                  size={"18px"}
                />
                <StyledTokenName>
                  {outputToken.name ?? <Dots />}
                </StyledTokenName>
              </Aligner>
            </CurrencySelect>
          ) : (
            <Dots />
          )}
          <Spacer />
          <OrderStatus
            clickable={true}
            onClick={() => {
              if (!chainId) return;

              if (order.status === "open")
                setCancellationState({
                  attemptingTxn: false,
                  cancellationErrorMessage: undefined,
                  showConfirm: true,
                  txHash: undefined,
                });
              else if (order.status === "cancelled")
                window.open(
                  getExplorerLink(
                    chainId,
                    order.cancelledTxHash,
                    ExplorerDataType.TRANSACTION
                  ),
                  "_blank"
                );
              else if (order.status === "executed")
                window.open(
                  getExplorerLink(
                    chainId,
                    order.executedTxHash,
                    ExplorerDataType.TRANSACTION
                  ),
                  "_blank"
                );
            }}
            status={
              isCancellationPending || isSubmissionPending
                ? "pending"
                : order.status
            }
          >
            {isSubmissionPending || isCancellationPending
              ? "pending"
              : order.status === "open"
              ? "cancel"
              : order.status}
            {isSubmissionPending || isCancellationPending ? <Dots /> : null}
          </OrderStatus>
        </RowBetween>

        <Aligner style={{ marginTop: "10px" }}>
          <OrderRow>
            <RowBetween>
              <TYPE.main
                color={theme.text2}
                fontWeight={400}
                fontSize={14}
                style={{ display: "inline" }}
              >
                {`Sell ${inputAmount ? inputAmount.toSignificant(4) : "-"} ${
                  inputAmount?.currency.symbol ?? ""
                } for ${
                  rawMinReturnAmount ? rawMinReturnAmount.toSignificant(4) : "-"
                } ${outputAmount?.currency.symbol ?? ""}`}
              </TYPE.main>
            </RowBetween>
          </OrderRow>
        </Aligner>
        <Aligner>
          <OrderRow>
            <RowBetween>
              <TYPE.body
                color={theme.text2}
                fontWeight={400}
                fontSize={14}
                style={{ display: "inline", cursor: "pointer" }}
              >
                Current rate:{" "}
                {trade && inputToken && outputToken ? (
                  `1 ${inputToken.symbol}` +
                  " = " +
                  trade.executionPrice.toSignificant(4) +
                  ` ${outputToken.symbol}`
                ) : (
                  <Dots />
                )}
              </TYPE.body>
            </RowBetween>
          </OrderRow>
        </Aligner>
        <Aligner>
          <OrderRow>
            <RowBetween>
              <TYPE.body
                color={theme.text2}
                fontWeight={400}
                fontSize={14}
                style={{ display: "inline", cursor: "pointer" }}
              >
                {`Execution rate: ${
                  executionRate && inputToken && outputToken
                    ? `1 ${inputToken.symbol}` +
                      " = " +
                      executionRate.toSignificant(4) +
                      ` ${outputToken.symbol}`
                    : "-"
                }`}
              </TYPE.body>
            </RowBetween>
          </OrderRow>
        </Aligner>
      </Container>
    </OrderPanel>
  );
}
