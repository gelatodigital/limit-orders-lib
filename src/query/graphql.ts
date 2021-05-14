import { gql } from "graphql-request";

export const GET_ALL_ORDERS = gql`
  query GetOrdersByOwner($owner: String) {
    orders(orderBy: updatedAt, orderDirection: desc, where: { owner: $owner }) {
      id
      owner
      inputToken
      outputToken
      inputAmount
      minReturn
      bought
      status
      cancelledTxHash
      executedTxHash
      updatedAt
      secret
      witness
    }
  }
`;

export const GET_ALL_OPEN_ORDERS = gql`
  query GetOrdersByOwner($owner: String) {
    orders(orderBy: updatedAt, orderDirection: desc, where: { owner: $owner, status: open }) {
      id
      owner
      inputToken
      outputToken
      inputAmount
      minReturn
      bought
      status
      updatedAt
      secret
      witness
    }
  }
`;

export const GET_ALL_EXECUTED_ORDERS = gql`
  query GetOrdersByOwner($owner: String) {
    orders(orderBy: updatedAt, orderDirection: desc, where: { owner: $owner, status: executed }) {
      id
      owner
      inputToken
      outputToken
      inputAmount
      minReturn
      bought
      status
      executedTxHash
      updatedAt
      secret
      witness
    }
  }
`;

export const GET_ALL_CANCELLED_ORDERS = gql`
  query GetOrdersByOwner($owner: String) {
    orders(orderBy: updatedAt, orderDirection: desc, where: { owner: $owner, status: cancelled }) {
      id
      owner
      inputToken
      outputToken
      inputAmount
      minReturn
      status
      cancelledTxHash
      updatedAt
      secret
      witness
    }
  }
`;
