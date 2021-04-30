import { request } from "graphql-request";
import { getSubgraphUrl } from "../constants";
import { Order } from "../types";
import {
  GET_ALL_CANCELLED_ORDERS,
  GET_ALL_EXECUTED_ORDERS,
  GET_ALL_OPEN_ORDERS,
  GET_ALL_ORDERS,
  GET_ALL_PAST_ORDERS,
} from "./graphql";

export const getOrders = async (
  account: string,
  chainID: number
): Promise<Order> => {
  return await request(getSubgraphUrl(chainID), GET_ALL_ORDERS, {
    owner: account.toLowerCase(),
  }).then((data) => {
    return data.orders;
  });
};

export const getOpenOrders = async (
  account: string,
  chainID: number
): Promise<Order> => {
  return await request(getSubgraphUrl(chainID), GET_ALL_OPEN_ORDERS, {
    owner: account.toLowerCase(),
  }).then((data) => {
    return data.orders;
  });
};

export const getPastOrders = async (
  account: string,
  chainID: number
): Promise<Order> => {
  return await request(getSubgraphUrl(chainID), GET_ALL_PAST_ORDERS, {
    owner: account.toLowerCase(),
  }).then((data) => {
    return data.orders;
  });
};

export const getExecutedOrders = async (
  account: string,
  chainID: number
): Promise<Order> => {
  return await request(getSubgraphUrl(chainID), GET_ALL_EXECUTED_ORDERS, {
    owner: account.toLowerCase(),
  }).then((data) => {
    return data.orders;
  });
};

export const getCancelledOrders = async (
  account: string,
  chainID: number
): Promise<Order> => {
  return await request(getSubgraphUrl(chainID), GET_ALL_CANCELLED_ORDERS, {
    owner: account.toLowerCase(),
  }).then((data) => {
    return data.orders;
  });
};
