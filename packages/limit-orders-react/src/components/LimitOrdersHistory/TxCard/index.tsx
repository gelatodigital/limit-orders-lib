import React from "react";
import styled, { DefaultTheme } from "styled-components/macro";
import { darken } from "polished";
import { TYPE } from "../../../theme";
import { RowBetween } from "../../Row";
import useTheme from "../../../hooks/useTheme";
import { TransactionDetails } from "../../../state/gtransactions/reducer";

const handleColorType = (status: string, theme: DefaultTheme) => {
  switch (status) {
    case "pending":
      return theme.blue1;
    case "confirmed":
      return theme.green1;
    case "reverted":
      return theme.red1;

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

const Spacer = styled.div`
  flex: 1 1 auto;
`;

export default function OrderCard({ tx }: { tx: TransactionDetails }) {
  const theme = useTheme();

  return (
    <OrderPanel>
      <Container hideInput={true}>
        <RowBetween padding="10px">
          <Aligner style={{ marginTop: "10px" }}>
            <OrderRow>
              <RowBetween>
                <TYPE.main
                  color={theme.text2}
                  fontWeight={400}
                  fontSize={14}
                  style={{ display: "inline" }}
                >
                  {tx.summary ?? "-"}
                </TYPE.main>
              </RowBetween>
            </OrderRow>
          </Aligner>
          <Spacer />
          <OrderStatus
            clickable={true}
            onClick={() => console.log("clicked")}
            status={
              !tx.receipt
                ? "pending"
                : tx.receipt.status === 1
                ? "reverted"
                : "confirmed"
            }
          >
            {!tx.receipt
              ? "pending"
              : tx.receipt.status === 1
              ? "reverted"
              : "confirmed"}
          </OrderStatus>
        </RowBetween>
      </Container>
    </OrderPanel>
  );
}
