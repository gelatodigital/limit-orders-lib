import { request } from "graphql-request";
import { MAINNET_SUBGRAPH_URL, ROPSTEN_SUBGRAPH_URL } from "../constants";
import { Order } from "../types/type";
import {
  GET_ALL_ORDERS,
  GET_ALL_OPEN_ORDERS,
  GET_ALL_EXECUTED_ORDERS,
  GET_ALL_CANCELLED_ORDERS,
} from "./graphql";

export const getOrders = async (
  account: string,
  chainID: string
): Promise<Order> => {
  const SUBGRAPH_URL =
    chainID == "1" ? MAINNET_SUBGRAPH_URL : ROPSTEN_SUBGRAPH_URL;
  return await request(SUBGRAPH_URL, GET_ALL_ORDERS, {
    owner: account.toLowerCase(),
  }).then((data) => {
    return data.orders;
  });
};

export const getOpenOrders = async (
  account: string,
  chainID: string
): Promise<Order> => {
  const SUBGRAPH_URL =
    chainID == "1" ? MAINNET_SUBGRAPH_URL : ROPSTEN_SUBGRAPH_URL;
  return await request(SUBGRAPH_URL, GET_ALL_OPEN_ORDERS, {
    owner: account.toLowerCase(),
  }).then((data) => {
    return data.orders;
  });
};

export const getExecutedOrders = async (
  account: string,
  chainID: string
): Promise<Order> => {
  const SUBGRAPH_URL =
    chainID == "1" ? MAINNET_SUBGRAPH_URL : ROPSTEN_SUBGRAPH_URL;
  return await request(SUBGRAPH_URL, GET_ALL_EXECUTED_ORDERS, {
    owner: account.toLowerCase(),
  }).then((data) => {
    return data.orders;
  });
};

export const getCancelledOrders = async (
  account: string,
  chainID: string
): Promise<Order> => {
  const SUBGRAPH_URL =
    chainID == "1" ? MAINNET_SUBGRAPH_URL : ROPSTEN_SUBGRAPH_URL;
  return await request(SUBGRAPH_URL, GET_ALL_CANCELLED_ORDERS, {
    owner: account.toLowerCase(),
  }).then((data) => {
    return data.orders;
  });
};
