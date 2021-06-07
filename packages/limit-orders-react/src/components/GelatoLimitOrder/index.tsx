/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Currency, CurrencyAmount, TradeType } from "@uniswap/sdk-core";
import { Trade } from "@uniswap/v2-sdk";
import { AdvancedSwapDetails } from "../order/AdvancedSwapDetails";
import UnsupportedCurrencyFooter from "../order/UnsupportedCurrencyFooter";
import { MouseoverTooltipContent } from "../Tooltip";
import JSBI from "jsbi";
import React, { useCallback, useMemo, useState, Fragment } from "react";
import { ArrowDown, Info, Divide, X } from "react-feather";
import { Text } from "rebass";
import styled from "styled-components";
import { ButtonError, ButtonGray, ButtonLight, ButtonPrimary } from "../Button";
import { GreyCard } from "../Card";
import { AutoColumn } from "../Column";
import CurrencyInputPanel from "../CurrencyInputPanel";
import Row, { RowFixed } from "../Row";
import confirmPriceImpactWithoutFee from "../order/confirmPriceImpactWithoutFee";
import ConfirmSwapModal from "../order/ConfirmSwapModal";
import {
  ArrowWrapper,
  BottomGrouping,
  Dots,
  SwapCallbackError,
  Wrapper,
} from "../order/styleds";
import SwapHeader from "../order/SwapHeader";
import TradePrice from "../order/TradePrice";
import { useGelatoLimitOrders } from "../../hooks/gelato";
import { useIsSwapUnsupported } from "../../hooks/useIsSwapUnsupported";
import { useUSDCValue } from "../../hooks/useUSDCPrice";
import { useWalletModalToggle } from "../../state/gapplication/hooks";
import { Field } from "../../state/gorder/actions";
import { tryParseAmount } from "../../state/gorder/hooks";
import {
  useExpertModeManager,
  useUserSingleHopOnly,
} from "../../state/guser/hooks";
import { computeFiatValuePriceImpact } from "../../utils/computeFiatValuePriceImpact";
import { maxAmountSpend } from "../../utils/maxAmountSpend";
import { warningSeverity } from "../../utils/prices";
import AppBody from "./AppBody";
import { TYPE } from "../../theme";
import { useWeb3 } from "../../web3";
import useTheme from "../../hooks/useTheme";
import { useSelector } from "react-redux";
import LimitOrdersHistory from "../LimitOrdersHistory";

const StyledInfo = styled(Info)`
  opacity: 0.4;
  color: ${({ theme }) => theme.text1};
  height: 16px;
  width: 16px;
  :hover {
    opacity: 0.8;
  }
`;

enum Rate {
  DIV = "DIV",
  MUL = "MUL",
}

export default function GelatoLimitOrder() {
  const { account } = useWeb3();
  const theme = useTheme();

  const recipient = account ?? null;

  const {
    handlers: {
      handleInput,
      handleRateType,
      handleCurrencySelection,
      handleSwitchTokens,
      handleLimitOrderSubmission,
    },
    derivedOrderInfo: {
      parsedAmounts,
      formattedAmounts,
      currencies,
      currencyBalances,
      trade,
      inputError,
      allowedSlippage,
      realExecutionRate,
    },
    gasPrice,
    orderState: { independentField, rateType },
  } = useGelatoLimitOrders();

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle();

  // for expert mode
  const [isExpertMode] = useExpertModeManager();

  const fiatValueInput = useUSDCValue(parsedAmounts[Field.INPUT]);
  const fiatValueOutput = useUSDCValue(parsedAmounts[Field.OUTPUT]);
  const desiredRateInCurrencyAmount = tryParseAmount(
    trade?.outputAmount.toSignificant(6),
    currencies[Field.OUTPUT]
  );

  const fiatValueDesiredRate = useUSDCValue(desiredRateInCurrencyAmount);
  const priceImpact = computeFiatValuePriceImpact(
    fiatValueInput,
    fiatValueOutput
  );
  const currentMarketRate = trade?.executionPrice.toSignificant(6) ?? undefined;

  const isValid = !inputError;

  const handleTypeInput = useCallback(
    (value: string) => {
      handleInput(Field.INPUT, value);
    },
    [handleInput]
  );
  const handleTypeOutput = useCallback(
    (value: string) => {
      handleInput(Field.OUTPUT, value);
    },
    [handleInput]
  );
  const handleTypeDesiredRate = useCallback(
    (value: string) => {
      handleInput(Field.DESIRED_RATE, value);
    },
    [handleInput]
  );

  // modal and loading
  const [
    { showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash },
    setSwapState,
  ] = useState<{
    showConfirm: boolean;
    tradeToConfirm: Trade<Currency, Currency, TradeType> | undefined;
    attemptingTxn: boolean;
    swapErrorMessage: string | undefined;
    txHash: string | undefined;
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  });

  const userHasSpecifiedInputOutput = Boolean(
    (independentField === Field.INPUT || independentField === Field.OUTPUT) &&
      currencies[Field.INPUT] &&
      currencies[Field.OUTPUT]
    // &&
    // parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  );
  const routeNotFound = !trade?.route;
  const isLoadingRoute = parsedAmounts[Field.INPUT] && !trade; //V3TradeState.LOADING === v3TradeState

  const maxInputAmount: CurrencyAmount<Currency> | undefined = maxAmountSpend(
    currencyBalances[Field.INPUT]
  );
  const showMaxButton = Boolean(
    maxInputAmount?.greaterThan(0) &&
      !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount)
  );

  const [singleHopOnly] = useUserSingleHopOnly();

  const handleSwap = useCallback(() => {
    if (!handleLimitOrderSubmission) {
      return;
    }

    if (priceImpact && !confirmPriceImpactWithoutFee(priceImpact)) {
      return;
    }

    setSwapState({
      attemptingTxn: true,
      tradeToConfirm,
      showConfirm,
      swapErrorMessage: undefined,
      txHash: undefined,
    });

    handleLimitOrderSubmission()
      .then((hash) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: undefined,
          txHash: hash,
        });
      })
      .catch((error) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        });
      });
  }, [
    priceImpact,
    handleLimitOrderSubmission,
    tradeToConfirm,
    showConfirm,
    recipient,
    account,
    trade,
    singleHopOnly,
  ]);

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false);

  // warnings on the greater of fiat value price impact and execution price impact
  const priceImpactSeverity = useMemo(() => {
    const executionPriceImpact = trade?.priceImpact;
    return warningSeverity(
      executionPriceImpact && priceImpact
        ? executionPriceImpact.greaterThan(priceImpact)
          ? executionPriceImpact
          : priceImpact
        : executionPriceImpact ?? priceImpact
    );
  }, [priceImpact, trade]);

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({
      showConfirm: false,
      tradeToConfirm,
      attemptingTxn,
      swapErrorMessage,
      txHash,
    });
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      handleInput(Field.INPUT, "");
    }
  }, [attemptingTxn, handleInput, swapErrorMessage, tradeToConfirm, txHash]);

  const handleAcceptChanges = useCallback(() => {
    setSwapState({
      tradeToConfirm: trade as any,
      swapErrorMessage,
      txHash,
      attemptingTxn,
      showConfirm,
    });
  }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash]);

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      //  setApprovalSubmitted(false); // reset 2 step UI for approvals
      handleCurrencySelection(Field.INPUT, inputCurrency);
    },
    [handleCurrencySelection]
  );

  const handleMaxInput = useCallback(() => {
    maxInputAmount && handleInput(Field.INPUT, maxInputAmount.toExact());
  }, [maxInputAmount, handleInput]);

  const handleOutputSelect = useCallback(
    (outputCurrency) => handleCurrencySelection(Field.OUTPUT, outputCurrency),
    [handleCurrencySelection]
  );

  const swapIsUnsupported = useIsSwapUnsupported(
    currencies?.INPUT,
    currencies?.OUTPUT
  );

  const priceImpactTooHigh = priceImpactSeverity > 3 && !isExpertMode;

  const state = useSelector((state) => state);

  return (
    <Fragment>
      {/* <TokenWarningModal
        isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
        onDismiss={handleDismissTokenWarning}
      /> */}
      <AppBody>
        <SwapHeader />
        <Wrapper id="limit-order-page">
          <ConfirmSwapModal
            isOpen={showConfirm}
            trade={trade as any}
            originalTrade={tradeToConfirm}
            onAcceptChanges={handleAcceptChanges}
            attemptingTxn={attemptingTxn}
            txHash={txHash}
            recipient={recipient}
            allowedSlippage={allowedSlippage}
            onConfirm={handleSwap}
            swapErrorMessage={swapErrorMessage}
            onDismiss={handleConfirmDismiss}
          />

          <AutoColumn gap={"md"}>
            <div style={{ display: "relative" }}>
              <CurrencyInputPanel
                label={
                  independentField === Field.OUTPUT ? "From (at most)" : "From"
                }
                value={formattedAmounts[Field.INPUT]}
                showMaxButton={showMaxButton}
                currency={currencies[Field.INPUT]}
                onUserInput={handleTypeInput}
                onMax={handleMaxInput}
                fiatValue={fiatValueInput ?? undefined}
                onCurrencySelect={handleInputSelect}
                otherCurrency={currencies[Field.OUTPUT]}
                showCommonBases={true}
                id="limit-order-currency-input"
              />
              <ArrowWrapper clickable>
                {rateType === Rate.MUL ? (
                  <X
                    size="16"
                    onClick={handleRateType}
                    color={
                      currencies[Field.INPUT] && currencies[Field.OUTPUT]
                        ? theme.text1
                        : theme.text3
                    }
                  />
                ) : (
                  <Divide
                    size="16"
                    onClick={handleRateType}
                    color={
                      currencies[Field.INPUT] && currencies[Field.OUTPUT]
                        ? theme.text1
                        : theme.text3
                    }
                  />
                )}
              </ArrowWrapper>
              <CurrencyInputPanel
                value={formattedAmounts[Field.DESIRED_RATE]}
                currentMarketRate={currentMarketRate}
                showMaxButton={showMaxButton}
                currency={currencies[Field.INPUT]}
                onUserInput={handleTypeDesiredRate}
                fiatValue={fiatValueDesiredRate ?? undefined}
                onCurrencySelect={handleInputSelect}
                otherCurrency={currencies[Field.OUTPUT]}
                showCommonBases={true}
                id="limit-order-currency-rate"
                showCurrencySelector={false}
                hideBalance={true}
                showRate={true}
                isInvertedRate={rateType === Rate.MUL ? false : true}
                realExecutionRate={realExecutionRate}
                gasPrice={gasPrice}
              />
              <ArrowWrapper clickable>
                <ArrowDown
                  size="16"
                  onClick={() => {
                    //   setApprovalSubmitted(false); // reset 2 step UI for approvals
                    handleSwitchTokens();
                  }}
                  color={
                    currencies[Field.INPUT] && currencies[Field.OUTPUT]
                      ? theme.text1
                      : theme.text3
                  }
                />
              </ArrowWrapper>
              <CurrencyInputPanel
                value={formattedAmounts[Field.OUTPUT]}
                onUserInput={handleTypeOutput}
                label={
                  independentField === Field.INPUT ? "To (at least)" : "To"
                }
                showMaxButton={false}
                hideBalance={false}
                fiatValue={fiatValueOutput ?? undefined}
                priceImpact={priceImpact}
                currency={currencies[Field.OUTPUT]}
                onCurrencySelect={handleOutputSelect}
                otherCurrency={currencies[Field.INPUT]}
                showCommonBases={true}
                id="limit-order-currency-output"
              />
            </div>

            <Row
              style={{ justifyContent: !trade ? "center" : "space-between" }}
            >
              <RowFixed>
                <ButtonGray
                  width="fit-content"
                  padding="0.1rem 0.5rem"
                  disabled
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    height: "24px",
                    opacity: 0.4,
                    marginLeft: "0.25rem",
                  }}
                >
                  <TYPE.black fontSize={12}>Powered by Gelato🍦</TYPE.black>
                </ButtonGray>
              </RowFixed>
              {trade ? (
                <RowFixed>
                  <TradePrice
                    price={trade.executionPrice as any}
                    showInverted={showInverted}
                    setShowInverted={setShowInverted}
                  />
                  <MouseoverTooltipContent
                    content={
                      <AdvancedSwapDetails
                        trade={trade as any}
                        allowedSlippage={allowedSlippage}
                      />
                    }
                  >
                    <StyledInfo />
                  </MouseoverTooltipContent>
                </RowFixed>
              ) : null}
            </Row>

            <BottomGrouping>
              {swapIsUnsupported ? (
                <ButtonPrimary disabled={true}>
                  <TYPE.main mb="4px">Unsupported Asset</TYPE.main>
                </ButtonPrimary>
              ) : !account ? (
                <ButtonLight onClick={toggleWalletModal}>
                  Connect Wallet
                </ButtonLight>
              ) : routeNotFound &&
                userHasSpecifiedInputOutput &&
                parsedAmounts[Field.INPUT] ? (
                <GreyCard style={{ textAlign: "center" }}>
                  <TYPE.main mb="4px">
                    {isLoadingRoute ? (
                      <Dots>Loading</Dots>
                    ) : (
                      `Insufficient liquidity for this trade.`
                    )}
                  </TYPE.main>
                </GreyCard>
              ) : priceImpact?.greaterThan("0") ? (
                <GreyCard style={{ textAlign: "center" }}>
                  <TYPE.main mb="4px">{`Only possible to place orders above market rate`}</TYPE.main>
                </GreyCard>
              ) : (
                <ButtonError
                  onClick={() => {
                    if (isExpertMode) {
                      handleSwap();
                    } else {
                      setSwapState({
                        tradeToConfirm: trade as any,
                        attemptingTxn: false,
                        swapErrorMessage: undefined,
                        showConfirm: true,
                        txHash: undefined,
                      });
                    }
                  }}
                  id="limit-order-button"
                  disabled={!isValid || priceImpactTooHigh}
                  error={isValid && priceImpactSeverity > 2}
                >
                  <Text fontSize={20} fontWeight={500}>
                    {inputError
                      ? inputError
                      : priceImpactTooHigh
                      ? `Price Impact Too High`
                      : `Place order`}
                  </Text>
                </ButtonError>
              )}
              {isExpertMode && swapErrorMessage ? (
                <SwapCallbackError error={swapErrorMessage} />
              ) : null}
            </BottomGrouping>
          </AutoColumn>
        </Wrapper>
      </AppBody>

      <LimitOrdersHistory />
      {!swapIsUnsupported ? null : (
        <UnsupportedCurrencyFooter
          show={swapIsUnsupported}
          currencies={[currencies.INPUT, currencies.OUTPUT]}
        />
      )}
    </Fragment>
  );
}
