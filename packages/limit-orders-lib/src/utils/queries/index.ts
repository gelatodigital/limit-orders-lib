import { request } from "graphql-request";
import { SUBGRAPH_URL } from "../../constants";
import { Order } from "../../types";
import {
  GET_ALL_CANCELLED_ORDERS_BY_OWNER,
  GET_ALL_EXECUTED_ORDERS_BY_OWNER,
  GET_ALL_OPEN_ORDERS_BY_OWNER,
  GET_ALL_ORDERS_BY_OWNER,
  GET_ALL_PAST_ORDERS_BY_OWNER,
} from "./constants";

export const queryOrders = async (
  owner: string,
  chainID: number
): Promise<Order[]> => {
  try {
    const data = await request(SUBGRAPH_URL[chainID], GET_ALL_ORDERS_BY_OWNER, {
      owner: owner.toLowerCase(),
    });

    return data.orders;
  } catch (error) {
    throw new Error("Could not query subgraph for all orders");
  }
};

export const queryOpenOrders = async (
  owner: string,
  chainID: number
): Promise<Order[]> => {
  try {
    const data = await request(
      SUBGRAPH_URL[chainID],
      GET_ALL_OPEN_ORDERS_BY_OWNER,
      {
        owner: owner.toLowerCase(),
      }
    );
    console.log("data", data);
    return data.orders;
  } catch (error) {
    console.log(error);
    throw new Error("Could not query subgraph for open orders");
  }
};

export const queryPastOrders = async (
  owner: string,
  chainID: number
): Promise<Order[]> => {
  try {
    const data = await request(
      SUBGRAPH_URL[chainID],
      GET_ALL_PAST_ORDERS_BY_OWNER,
      {
        owner: owner.toLowerCase(),
      }
    );
    return data.orders;
  } catch (error) {
    throw new Error("Could not query subgraph for past orders");
  }
};

export const queryExecutedOrders = async (
  owner: string,
  chainID: number
): Promise<Order[]> => {
  try {
    const data = await request(
      SUBGRAPH_URL[chainID],
      GET_ALL_EXECUTED_ORDERS_BY_OWNER,
      {
        owner: owner.toLowerCase(),
      }
    );
    return data.orders;
  } catch (error) {
    throw new Error("Could not query subgraph for executed orders");
  }
};

export const queryCancelledOrders = async (
  owner: string,
  chainID: number
): Promise<Order[]> => {
  try {
    const data = await request(
      SUBGRAPH_URL[chainID],
      GET_ALL_CANCELLED_ORDERS_BY_OWNER,
      {
        owner: owner.toLowerCase(),
      }
    );
    return data.orders;
  } catch (error) {
    throw new Error("Could not query subgraph for cancelled orders");
  }
};
