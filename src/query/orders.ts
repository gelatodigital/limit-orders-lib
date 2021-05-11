import { request } from "graphql-request";
import { getSubgraphUrl } from "../constants";
import { Order } from "../types";
import {
  GET_ALL_CANCELLED_ORDERS_BY_OWNER,
  GET_ALL_EXECUTED_ORDERS_BY_OWNER,
  GET_ALL_OPEN_ORDERS_BY_OWNER,
  GET_ALL_ORDERS_BY_OWNER,
  GET_ALL_PAST_ORDERS_BY_OWNER,
} from "./graphql";

export const getOrders = async (
  owner: string,
  chainID: number
): Promise<Order[]> => {
  const data = await request(getSubgraphUrl(chainID), GET_ALL_ORDERS_BY_OWNER, {
    owner: owner.toLowerCase(),
  });
  if (!data) throw new Error("getOrders: NO DATA");
  if (!data.orders) throw new Error("getOrders: NO ORDERS FIELD");
  return data.orders;
};

export const getOpenOrders = async (
  owner: string,
  chainID: number
): Promise<Order[]> => {
  const data = await request(
    getSubgraphUrl(chainID),
    GET_ALL_OPEN_ORDERS_BY_OWNER,
    {
      owner: owner.toLowerCase(),
    }
  );
  if (!data) throw new Error("getOpenOrders: NO DATA");
  if (!data.orders) throw new Error("getOpenOrders: NO ORDERS FIELD");
  return data.orders;
};

export const getPastOrders = async (
  owner: string,
  chainID: number
): Promise<Order[]> => {
  const data = await request(
    getSubgraphUrl(chainID),
    GET_ALL_PAST_ORDERS_BY_OWNER,
    {
      owner: owner.toLowerCase(),
    }
  );
  if (!data) throw new Error("getPastOrders: NO DATA");
  if (!data.orders) throw new Error("getPastOrders: NO ORDERS FIELD");
  return data.orders;
};

export const getExecutedOrders = async (
  owner: string,
  chainID: number
): Promise<Order[]> => {
  const data = await request(
    getSubgraphUrl(chainID),
    GET_ALL_EXECUTED_ORDERS_BY_OWNER,
    {
      owner: owner.toLowerCase(),
    }
  );
  if (!data) throw new Error("getExecutedOrders: NO DATA");
  if (!data.orders) throw new Error("getExecutedOrders: NO ORDERS FIELD");
  return data.orders;
};

export const getCancelledOrders = async (
  owner: string,
  chainID: number
): Promise<Order[]> => {
  const data = await request(
    getSubgraphUrl(chainID),
    GET_ALL_CANCELLED_ORDERS_BY_OWNER,
    {
      owner: owner.toLowerCase(),
    }
  );
  if (!data) throw new Error("getCancelledOrders: NO DATA");
  if (!data.orders) throw new Error("getCancelledOrders: NO ORDERS FIELD");
  return data.orders;
};
