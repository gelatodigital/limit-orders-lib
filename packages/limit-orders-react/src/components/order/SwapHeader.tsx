import React from "react";
import styled from "styled-components/macro";
import Row, { RowBetween, RowFixed } from "../Row";
import { TYPE } from "../../theme";
import { darken } from "polished";
import { Info } from "react-feather";
import { MouseoverTooltipContent } from "../Tooltip";

const StyledSwapHeader = styled.div`
  padding: 1rem 1.25rem 0.5rem 1.25rem;
  width: 100%;
  color: ${({ theme }) => theme.text2};
`;

const HeaderTitles = styled(Row)`
  justify-self: flex-end;
  background-color: ${({ theme }) => theme.bg0};

  border-radius: 16px;
  display: grid;
  grid-auto-flow: column;
  overflow: auto;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    justify-self: center;
  `};
`;

const StyledOrdersHeaderTabs = styled.div`
  width: 100%;
  color: ${({ theme }) => theme.text2};
`;

const StyledNavLink = styled.div<{ active: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: right;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;
  padding: 8px 12px;

  ${({ active, theme }) =>
    active &&
    `    
    border-radius: 12px;
    font-weight: 600;
    color: ${theme.text1};
    background-color: ${theme.bg2};
  `}

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`;

const StyledInfo = styled(Info)`
  opacity: 0.4;
  color: ${({ theme }) => theme.text1};
  height: 16px;
  width: 16px;
  :hover {
    opacity: 0.8;
  }
`;

const OrdersHeaderTabs = ({
  title,
  active,
  onClick,
}: {
  title: string;
  active: boolean;
  onClick: () => void;
}) => (
  <StyledOrdersHeaderTabs>
    <TYPE.black fontWeight={500} fontSize={16}>
      <StyledNavLink
        id={`order-history-nav-link`}
        active={active}
        onClick={onClick}
      >
        {title}
      </StyledNavLink>
    </TYPE.black>
  </StyledOrdersHeaderTabs>
);

const ToolTipText = () => <>A stop-limit order triggers the submission of a limit order, once the stock reaches, or breaks through, a specified stop price. A stop-limit order consists of two prices: the stop price and the limit price. The stop price is the price that activates the limit order and is based on the last trade price. The limit price is the price constraint required to execute the order, once triggered. Just as with limit orders, there is no guarantee that a stop-limit order, once triggered, will result in an order execution. This is an important point that is worth repeating. A stop-limit order doesn’t guarantee that any trade will occur.</>

export default function SwapHeader({
  handleActiveTab,
  activeTab,
  type,
}: {
  handleActiveTab?: (tab: "sell" | "buy") => void;
  activeTab?: string;
  type?: string;
}) {
  if (type === "stoplimit") {
    return (
      <StyledSwapHeader>
        <RowBetween>
          <RowFixed>
            <TYPE.black fontWeight={500} fontSize={16}>
              Stop Limit Order
            </TYPE.black>
            <MouseoverTooltipContent content={<ToolTipText />}>
              <StyledInfo />
            </MouseoverTooltipContent>
          </RowFixed>
        </RowBetween>
      </StyledSwapHeader>
    );
  } else if (!handleActiveTab || !activeTab) {
    return null;
  }

  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed>
          <TYPE.black fontWeight={500} fontSize={16}>
            Limit Order
          </TYPE.black>
        </RowFixed>
        <RowFixed>
          <HeaderTitles>
            <OrdersHeaderTabs
              title={"Sell"}
              active={activeTab === "sell"}
              onClick={() => handleActiveTab("sell")}
            />

            <OrdersHeaderTabs
              title={"Buy"}
              active={activeTab === "buy"}
              onClick={() => handleActiveTab("buy")}
            />
          </HeaderTitles>
        </RowFixed>
      </RowBetween>
    </StyledSwapHeader>
  );
}
