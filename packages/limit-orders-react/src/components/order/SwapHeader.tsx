import React from "react";
import styled from "styled-components/macro";
import { RowBetween, RowFixed } from "../Row";
import { TYPE } from "../../theme";

const StyledSwapHeader = styled.div`
  padding: 1rem 1.25rem 0.5rem 1.25rem;
  width: 100%;
  color: ${({ theme }) => theme.text2};
`;

export default function SwapHeader() {
  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed>
          <TYPE.black
            fontWeight={500}
            fontSize={16}
            style={{ marginRight: "8px" }}
          >
            Limit Order
          </TYPE.black>
        </RowFixed>
      </RowBetween>
    </StyledSwapHeader>
  );
}
