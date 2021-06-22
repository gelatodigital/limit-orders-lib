import React, { useCallback, useMemo, useState } from "react";
import styled, { DefaultTheme } from "styled-components/macro";
import { darken } from "polished";
import { ArrowRight } from "react-feather";
import { Text } from "rebass";
import { RowBetween } from "../../Row";
import { Order } from "@gelatonetwork/limit-orders-lib";
import useTheme from "../../../hooks/useTheme";
import { useCurrency } from "../../../hooks/Tokens";
import CurrencyLogo from "../../CurrencyLogo";
import { useGelatoLimitOrdersHandlers } from "../../../hooks/gelato";
import { CurrencyAmount, Price } from "@uniswap/sdk-core";
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
import TradePrice from "../../order/TradePrice";

const handleColorType = (status: string, theme: DefaultTheme) => {
  switch (status) {
    case "open":
      return theme.blue1;
    case "executed":
      return theme.green1;
    case "cancelled":
      return theme.red1;

    case "pending":
      return theme.yellow1;

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

  const { chainId, handler } = useWeb3();

  const [
    showExecutionPriceInverted,
    setShowExecutionPriceInverted,
  ] = useState<boolean>(false);
  const [
    showCurrentPriceInverted,
    setShowCurrentPriceInverted,
  ] = useState<boolean>(true);

  const {
    handleLimitOrderCancellation,
    library: gelatoLibrary,
  } = useGelatoLimitOrdersHandlers();

  const inputToken = useCurrency(order.inputToken);
  const outputToken = useCurrency(order.outputToken);

  const inputAmount = useMemo(
    () =>
      inputToken
        ? CurrencyAmount.fromRawAmount(inputToken, order.inputAmount)
        : undefined,
    [inputToken, order.inputAmount]
  );

  const outputAmount = useMemo(
    () =>
      outputToken
        ? CurrencyAmount.fromRawAmount(outputToken, order.minReturn)
        : undefined,
    [order.minReturn, outputToken]
  );

  const rawMinReturn = useMemo(
    () =>
      outputToken && gelatoLibrary && inputToken && chainId
        ? isEthereumChain(chainId)
          ? order.minReturn
          : gelatoLibrary.getRawMinReturn(order.minReturn)
        : undefined,
    [chainId, gelatoLibrary, inputToken, order.minReturn, outputToken]
  );

  const rawMinReturnAmount = useMemo(
    () =>
      outputToken && gelatoLibrary && inputToken && rawMinReturn
        ? CurrencyAmount.fromRawAmount(outputToken, rawMinReturn)
        : undefined,
    [gelatoLibrary, inputToken, outputToken, rawMinReturn]
  );

  const executionPrice = useMemo(
    () =>
      rawMinReturnAmount && inputAmount
        ? new Price({
            baseAmount: rawMinReturnAmount,
            quoteAmount: inputAmount,
          })
        : undefined,
    [inputAmount, rawMinReturnAmount]
  );

  const trade = useTradeExactIn(inputAmount, outputToken ?? undefined, handler);

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

    const orderDetails =
      inputToken?.symbol &&
      outputToken?.symbol &&
      inputAmount &&
      outputAmount &&
      trade
        ? {
            inputTokenSymbol: inputToken.symbol,
            outputTokenSymbol: outputToken.symbol,
            inputAmount: inputAmount.toSignificant(4),
            outputAmount: outputAmount.toSignificant(4),
            executionPrice: trade.executionPrice.toSignificant(4),
          }
        : undefined;

    handleLimitOrderCancellation(order, orderDetails)
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
  }, [
    handleLimitOrderCancellation,
    showConfirm,
    inputToken,
    outputToken,
    inputAmount,
    outputAmount,
    trade,
    order,
  ]);

  return (
    <OrderPanel>
      <ConfirmCancellationModal
        isOpen={showConfirm}
        attemptingTxn={attemptingTxn}
        txHash={txHash}
        onConfirm={handleCancellation}
        swapErrorMessage={cancellationErrorMessage}
        onDismiss={handleConfirmDismiss}
        order={order}
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

              if (order.status === "open" && !isSubmissionPending)
                setCancellationState({
                  attemptingTxn: false,
                  cancellationErrorMessage: undefined,
                  showConfirm: true,
                  txHash: undefined,
                });
              else if (order.status === "open" && isSubmissionPending)
                window.open(
                  getExplorerLink(
                    chainId,
                    order.createdTxHash,
                    ExplorerDataType.TRANSACTION
                  ),
                  "_blank"
                );
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
              <Text fontWeight={500} fontSize={14} color={theme.text1}>
                {`Sell ${inputAmount ? inputAmount.toSignificant(4) : "-"} ${
                  inputAmount?.currency.symbol ?? ""
                } for ${
                  rawMinReturnAmount ? rawMinReturnAmount.toSignificant(4) : "-"
                } ${outputAmount?.currency.symbol ?? ""}`}
              </Text>
            </RowBetween>
          </OrderRow>
        </Aligner>
        <Aligner style={{ marginTop: "-2px" }}>
          <OrderRow>
            <RowBetween>
              <Text
                fontWeight={400}
                fontSize={12}
                color={theme.text1}
                style={{ marginRight: "4px", marginTop: "2px" }}
              >
                Current price:
              </Text>
              {trade ? (
                <TradePrice
                  price={trade.executionPrice}
                  showInverted={showCurrentPriceInverted}
                  setShowInverted={setShowCurrentPriceInverted}
                  fontWeight={500}
                  fontSize={12}
                />
              ) : (
                <Dots />
              )}
            </RowBetween>
          </OrderRow>
        </Aligner>
        <Aligner style={{ marginTop: "-10px" }}>
          <OrderRow>
            <RowBetween>
              <Text
                fontWeight={400}
                fontSize={12}
                color={theme.text1}
                style={{ marginRight: "4px", marginTop: "2px" }}
              >
                Execution price:
              </Text>
              {executionPrice ? (
                <TradePrice
                  price={executionPrice}
                  showInverted={showExecutionPriceInverted}
                  setShowInverted={setShowExecutionPriceInverted}
                  fontWeight={500}
                  fontSize={12}
                />
              ) : (
                <Dots />
              )}
            </RowBetween>
          </OrderRow>
        </Aligner>
      </Container>
    </OrderPanel>
  );
}
