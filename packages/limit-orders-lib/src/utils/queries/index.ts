import { request } from "graphql-request";
import { OLD_SUBGRAPH_URL, SUBGRAPH_URL } from "../../constants";
import { Order } from "../../types";
import { GET_ALL_ORDERS_BY_OWNER, GET_ORDER_BY_ID } from "./constants";

export const queryOrder = async (
  orderId: string,
  chainId: number
): Promise<Order | null> => {
  try {
    const dataFromOldSubgraph = OLD_SUBGRAPH_URL[chainId]
      ? await request(OLD_SUBGRAPH_URL[chainId], GET_ORDER_BY_ID, {
          id: orderId.toLowerCase(),
        })
      : { orders: [] };

    const dataFromNewSubgraph = SUBGRAPH_URL[chainId]
      ? await request(SUBGRAPH_URL[chainId], GET_ORDER_BY_ID, {
          id: orderId.toLowerCase(),
        })
      : { orders: [] };

    const allOrders = [
      ...dataFromOldSubgraph.orders,
      ...dataFromNewSubgraph.orders,
    ];

    return _getUniqueOrdersWithHandler(allOrders).pop() ?? null;
  } catch (error) {
    console.log(error);
    throw new Error("Could not query subgraph for all orders");
  }
};

export const queryOrders = async (
  owner: string,
  chainId: number
): Promise<Order[]> => {
  try {
    const dataFromOldSubgraph = OLD_SUBGRAPH_URL[chainId]
      ? await request(OLD_SUBGRAPH_URL[chainId], GET_ALL_ORDERS_BY_OWNER, {
          owner: owner.toLowerCase(),
        })
      : { orders: [] };

    const dataFromNewSubgraph = SUBGRAPH_URL[chainId]
      ? await request(SUBGRAPH_URL[chainId], GET_ALL_ORDERS_BY_OWNER, {
          owner: owner.toLowerCase(),
        })
      : { orders: [] };

    const allOrders = [
      ...dataFromOldSubgraph.orders,
      ...dataFromNewSubgraph.orders,
    ];

    return _getUniqueOrdersWithHandler(allOrders);
  } catch (error) {
    console.log(error);
    throw new Error("Could not query subgraph for all orders");
  }
};

export const queryOpenOrders = async (
  owner: string,
  chainId: number
): Promise<Order[]> => {
  try {
    const dataFromOldSubgraph = OLD_SUBGRAPH_URL[chainId]
      ? await request(OLD_SUBGRAPH_URL[chainId], GET_ALL_ORDERS_BY_OWNER, {
          owner: owner.toLowerCase(),
        })
      : { orders: [] };

    const dataFromNewSubgraph = SUBGRAPH_URL[chainId]
      ? await request(SUBGRAPH_URL[chainId], GET_ALL_ORDERS_BY_OWNER, {
          owner: owner.toLowerCase(),
        })
      : { orders: [] };

    const allOrders = [
      ...dataFromOldSubgraph.orders,
      ...dataFromNewSubgraph.orders,
    ];

    return _getUniqueOrdersWithHandler(allOrders).filter(
      (order) => order.status === "open"
    );
  } catch (error) {
    throw new Error("Could not query subgraph for open orders");
  }
};

export const queryPastOrders = async (
  owner: string,
  chainId: number
): Promise<Order[]> => {
  try {
    const dataFromOldSubgraph = OLD_SUBGRAPH_URL[chainId]
      ? await request(OLD_SUBGRAPH_URL[chainId], GET_ALL_ORDERS_BY_OWNER, {
          owner: owner.toLowerCase(),
        })
      : { orders: [] };

    const dataFromNewSubgraph = SUBGRAPH_URL[chainId]
      ? await request(SUBGRAPH_URL[chainId], GET_ALL_ORDERS_BY_OWNER, {
          owner: owner.toLowerCase(),
        })
      : { orders: [] };

    const allOrders = [
      ...dataFromOldSubgraph.orders,
      ...dataFromNewSubgraph.orders,
    ];

    return _getUniqueOrdersWithHandler(allOrders).filter(
      (order) => order.status !== "open"
    );
  } catch (error) {
    throw new Error("Could not query subgraph for past orders");
  }
};

export const queryExecutedOrders = async (
  owner: string,
  chainId: number
): Promise<Order[]> => {
  try {
    const dataFromOldSubgraph = OLD_SUBGRAPH_URL[chainId]
      ? await request(OLD_SUBGRAPH_URL[chainId], GET_ALL_ORDERS_BY_OWNER, {
          owner: owner.toLowerCase(),
        })
      : { orders: [] };

    const dataFromNewSubgraph = SUBGRAPH_URL[chainId]
      ? await request(SUBGRAPH_URL[chainId], GET_ALL_ORDERS_BY_OWNER, {
          owner: owner.toLowerCase(),
        })
      : { orders: [] };

    const allOrders = [
      ...dataFromOldSubgraph.orders,
      ...dataFromNewSubgraph.orders,
    ];

    return _getUniqueOrdersWithHandler(allOrders).filter(
      (order) => order.status === "executed"
    );
  } catch (error) {
    throw new Error("Could not query subgraph for executed orders");
  }
};

export const queryCancelledOrders = async (
  owner: string,
  chainId: number
): Promise<Order[]> => {
  try {
    const dataFromOldSubgraph = OLD_SUBGRAPH_URL[chainId]
      ? await request(OLD_SUBGRAPH_URL[chainId], GET_ALL_ORDERS_BY_OWNER, {
          owner: owner.toLowerCase(),
        })
      : { orders: [] };

    const dataFromNewSubgraph = SUBGRAPH_URL[chainId]
      ? await request(SUBGRAPH_URL[chainId], GET_ALL_ORDERS_BY_OWNER, {
          owner: owner.toLowerCase(),
        })
      : { orders: [] };

    const allOrders = [
      ...dataFromOldSubgraph.orders,
      ...dataFromNewSubgraph.orders,
    ];

    return _getUniqueOrdersWithHandler(allOrders).filter(
      (order) => order.status === "cancelled"
    );
  } catch (error) {
    throw new Error("Could not query subgraph for cancelled orders");
  }
};

const _getUniqueOrdersWithHandler = (allOrders: Order[]): Order[] =>
  [...new Map(allOrders.map((order) => [order.id, order])).values()]
    // sort by `updatedAt` asc so that the most recent one will be used
    .sort((a, b) => parseFloat(a.updatedAt) - parseFloat(b.updatedAt))
    .map((order) => {
      let handler;
      try {
        const hasHandler = order.data.length === 194;
        handler = hasHandler ? "0x" + order.data.substr(154, 194) : null;
      } catch (e) {
        handler = null;
      }

      return { ...order, handler };
    });
