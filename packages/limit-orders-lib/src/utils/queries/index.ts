import { request } from "graphql-request";
import { SUBGRAPH_URL } from "../../constants";
import { SubgraphRequestError } from "../../errors";
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
    throw new SubgraphRequestError();
  }
};

export const queryOpenOrders = async (
  owner: string,
  chainID: number
): Promise<Order[]> => {
  try {
    console.log("owner", owner);
    console.log("SUBGRAPH_URL[chainID]", SUBGRAPH_URL[chainID]);

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
    throw new SubgraphRequestError();
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
    throw new SubgraphRequestError();
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
    throw new SubgraphRequestError();
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
    throw new SubgraphRequestError();
  }
};
