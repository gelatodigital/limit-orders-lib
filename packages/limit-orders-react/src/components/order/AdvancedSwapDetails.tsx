/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { utils } from "@gelatonetwork/limit-orders-lib";
import {
  Percent,
  Currency,
  TradeType,
  CurrencyAmount,
} from "@uniswap/sdk-core";
import { Trade } from "@uniswap/v2-sdk";
import JSBI from "jsbi";
import React, { useMemo } from "react";
import { useGelatoLimitOrders } from "../../hooks/gelato";
import useTheme from "../../hooks/useTheme";
import { TYPE } from "../../theme";
import { Field } from "../../types";
import { computeRealizedLPFeePercent } from "../../utils/prices";
import { useWeb3 } from "../../web3";
import { AutoColumn } from "../Column";
import { RowBetween, RowFixed } from "../Row";
import { MouseoverTooltip } from "../Tooltip";

export interface AdvancedSwapDetailsProps {
  trade?: Trade<Currency, Currency, TradeType>;
  allowedSlippage: Percent;
}

export function AdvancedSwapDetails({ trade }: AdvancedSwapDetailsProps) {
  const theme = useTheme();
  const { chainId } = useWeb3();
  const {
    library,
    derivedOrderInfo: { parsedAmounts },
  } = useGelatoLimitOrders();

  // const inputAmount = parsedAmounts[Field.INPUT]!;
  const outputAmount = parsedAmounts.output;
  const rawOutputAmount = outputAmount
    ? outputAmount
        .multiply(
          JSBI.exponentiate(
            JSBI.BigInt(10),
            JSBI.BigInt(outputAmount.currency.decimals)
          )
        )
        .toExact()
    : "0"!;

  const {
    realizedLPFee,
    minReturn,
    realizedGelatoFee,
    allowedSlippageGelato,
    lpFeePercentage,
    gelatoFeePercentage,
  } = useMemo(() => {
    if (!outputAmount || !library || !trade || !chainId)
      return {
        realizedGelatoFee: undefined,
        realizedLPFee: undefined,
        minReturn: undefined,
        allowedSlippageGelato: undefined,
        gelatoFeePercentage: undefined,
        lpFeePercentage: undefined,
      };

    if (utils.isEthereumChain(chainId))
      return {
        minReturn: outputAmount,
        realizedGelatoFee: undefined,
        realizedLPFee: undefined,
        allowedSlippageGelato: undefined,
        gelatoFeePercentage: undefined,
        lpFeePercentage: undefined,
      };

    const {
      minReturn,

      slippageBPS,

      lpFeeBPS,
      gelatoFee,
      gelatoFeeBPS,
    } = library.getFeeAndSlippageAdjustedMinReturn(rawOutputAmount);

    const realizedLpFeePercent = computeRealizedLPFeePercent(trade, lpFeeBPS);
    const realizedLPFee = outputAmount.multiply(realizedLpFeePercent);

    // const realizedGelatoFee = outputAmount.multiply(
    //   new Fraction(JSBI.BigInt(gelatoFeeBPS), JSBI.BigInt(10000))
    // );
    const allowedSlippageGelato = Number(slippageBPS) / 100;
    const gelatoFeePercentage = Number(gelatoFeeBPS) / 100;
    const lpFeePercentage = Number(lpFeeBPS) / 100;

    const minReturnParsed = CurrencyAmount.fromRawAmount(
      outputAmount.currency,
      minReturn
    );

    // const lpFeeParsed = CurrencyAmount.fromRawAmount(
    //   outputAmount.currency,
    //   lpFee
    // );

    const gelatoFeeParsed = CurrencyAmount.fromRawAmount(
      outputAmount.currency,
      gelatoFee
    );

    return {
      realizedGelatoFee: gelatoFeeParsed,
      realizedLPFee,
      minReturn: minReturnParsed,
      allowedSlippageGelato,
      gelatoFeePercentage,
      lpFeePercentage,
    };
  }, [trade, outputAmount, chainId, library, parsedAmounts, rawOutputAmount]);

  return !trade ? null : (
    <AutoColumn gap="8px">
      <RowBetween>
        <RowFixed>
          <MouseoverTooltip
            text={`Liquidity Provider Fee = ${lpFeePercentage}%`}
          >
            <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
              Liquidity Provider Fee
            </TYPE.black>
          </MouseoverTooltip>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          {realizedLPFee
            ? `${realizedLPFee.toSignificant(4)} ${
                realizedLPFee.currency.symbol
              }`
            : "-"}
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <MouseoverTooltip text={`Gelato Fee = ${gelatoFeePercentage}%`}>
            <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
              Gelato Fee
            </TYPE.black>
          </MouseoverTooltip>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          {realizedGelatoFee
            ? `${realizedGelatoFee.toSignificant(4)} ${
                outputAmount ? outputAmount.currency.symbol : "-"
              }`
            : "-"}
        </TYPE.black>
      </RowBetween>

      {/* <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            Route
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          <SwapRoute trade={trade} />
        </TYPE.black>
      </RowBetween> */}

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            Slippage tolerance
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          {allowedSlippageGelato}%
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <MouseoverTooltip
            text={`The minimum amount you can receive. It includes all fees and max slippage tolerance.`}
          >
            <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
              Minimum Received (?)
            </TYPE.black>
          </MouseoverTooltip>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          {minReturn
            ? `${minReturn.toSignificant(4)} ${
                outputAmount ? outputAmount.currency.symbol : "-"
              }`
            : "-"}
        </TYPE.black>
      </RowBetween>
    </AutoColumn>
  );
}
