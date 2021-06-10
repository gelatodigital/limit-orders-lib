/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { GelatoLimitOrders, utils } from "@gelatonetwork/limit-orders-lib";
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
import { useWeb3 } from "../../web3";
import { AutoColumn } from "../Column";
import { RowBetween, RowFixed } from "../Row";
import { MouseoverTooltip } from "../Tooltip";

export interface AdvancedSwapDetailsProps {
  trade?: Trade<Currency, Currency, TradeType>;
  allowedSlippage: Percent;
}

export function AdvancedSwapDetails({
  trade,
  allowedSlippage,
}: AdvancedSwapDetailsProps) {
  const theme = useTheme();
  const { chainId } = useWeb3();
  const {
    library,
    derivedOrderInfo: { parsedAmounts },
  } = useGelatoLimitOrders();

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

  const { minReturn, slippagePercentage, gelatoFeePercentage } = useMemo(() => {
    if (!outputAmount || !library || !trade || !chainId)
      return {
        minReturn: undefined,
        slippagePercentage: undefined,
        gelatoFeePercentage: undefined,
      };

    if (utils.isEthereumChain(chainId))
      return {
        minReturn: outputAmount,
        slippagePercentage: undefined,
        gelatoFeePercentage: undefined,
      };

    const { minReturn } = library.getFeeAndSlippageAdjustedMinReturn(
      rawOutputAmount
    );

    const slippagePercentage = GelatoLimitOrders.slippageBPS / 100;
    const gelatoFeePercentage = GelatoLimitOrders.gelatoFeeBPS / 100;

    const minReturnParsed = CurrencyAmount.fromRawAmount(
      outputAmount.currency,
      minReturn
    );

    return {
      minReturn: minReturnParsed,
      slippagePercentage,
      gelatoFeePercentage,
    };
  }, [trade, outputAmount, chainId, library, parsedAmounts, rawOutputAmount]);

  return !trade ? null : (
    <AutoColumn gap="8px">
      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            Gelato Fee
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          {gelatoFeePercentage ? `${gelatoFeePercentage}` : "-"}%
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            Slippage
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          {slippagePercentage ? `${slippagePercentage}` : "-"}%
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <MouseoverTooltip
            text={`The minimum amount you can receive. It includes all fees and maximum slippage tolerance.`}
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
