import { Currency, CurrencyAmount, Percent } from "@uniswap/sdk-core";
import React, { useMemo } from "react";
import useTheme from "../../hooks/useTheme";
import { Rate } from "../../state/gorder/actions";
import { TYPE } from "../../theme";
import { warningSeverity } from "../../utils/prices";
import HoverInlineText from "../HoverInlineText";

export function RatePercentage({
  priceImpact,
  rateType,
  inputCurrency,
  outputCurrency,
}: {
  priceImpact?: Percent;
  rateType?: Rate;
  inputCurrency?: Currency | null;
  outputCurrency?: Currency | null;
}) {
  const theme = useTheme();
  const priceImpactColor = useMemo(() => {
    if (!priceImpact) return undefined;
    if (priceImpact.equalTo("0")) return theme.text4;
    if (priceImpact.greaterThan("0")) return theme.green1;
    return theme.red1;
  }, [priceImpact, theme.green1, theme.red1, theme.text4]);

  return (
    <TYPE.body fontSize={12} color={theme.text4}>
      {priceImpact ? (
        <span style={{ color: priceImpactColor }}>
          {rateType === Rate.MUL
            ? `Sell ${inputCurrency?.symbol ?? "-"} ${priceImpact.toSignificant(
                3
              )}% ${priceImpact.lessThan("0") ? "bellow" : "above"}  market`
            : `Buy ${outputCurrency?.symbol ?? "-"} ${priceImpact.toSignificant(
                3
              )}% ${priceImpact.lessThan("0") ? "above" : "bellow"} market`}
        </span>
      ) : null}
    </TYPE.body>
  );
}
