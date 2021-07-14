import { request } from "graphql-request";
import { OLD_SUBGRAPH_URL, SUBGRAPH_URL } from "../../constants";
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
  chainId: number
): Promise<Order[]> => {
  if (chainId === 3) {
    try {
      const data = await request(
        SUBGRAPH_URL[chainId],
        GET_ALL_ORDERS_BY_OWNER,
        {
          owner: owner.toLowerCase(),
        }
      );
      return _getUniqueOrdersWithHandler(data.orders);
    } catch (error) {
      throw new Error("Could not query subgraph for all orders");
    }
  } else {
    try {
      const dataFromOldSubgraph = await request(
        OLD_SUBGRAPH_URL[chainId],
        GET_ALL_ORDERS_BY_OWNER,
        {
          owner: owner.toLowerCase(),
        }
      );

      const dataFromNewSubgraph = await request(
        SUBGRAPH_URL[chainId],
        GET_ALL_ORDERS_BY_OWNER,
        {
          owner: owner.toLowerCase(),
        }
      );

      const allOrders = [
        ...dataFromOldSubgraph.orders,
        ...dataFromNewSubgraph.orders,
      ];

      return _getUniqueOrdersWithHandler(allOrders);
    } catch (error) {
      throw new Error("Could not query subgraph for all orders");
    }
  }
};

export const queryOpenOrders = async (
  owner: string,
  chainId: number
): Promise<Order[]> => {
  if (chainId === 3) {
    try {
      const data = await request(
        SUBGRAPH_URL[chainId],
        GET_ALL_OPEN_ORDERS_BY_OWNER,
        {
          owner: owner.toLowerCase(),
        }
      );
      return _getUniqueOrdersWithHandler(data.orders);
    } catch (error) {
      throw new Error("Could not query subgraph for open orders");
    }
  } else {
    try {
      const dataFromOldSubgraph = await request(
        OLD_SUBGRAPH_URL[chainId],
        GET_ALL_OPEN_ORDERS_BY_OWNER,
        {
          owner: owner.toLowerCase(),
        }
      );

      const dataFromNewSubgraph = await request(
        SUBGRAPH_URL[chainId],
        GET_ALL_OPEN_ORDERS_BY_OWNER,
        {
          owner: owner.toLowerCase(),
        }
      );

      const allOrders = [
        ...dataFromOldSubgraph.orders,
        ...dataFromNewSubgraph.orders,
      ];

      return _getUniqueOrdersWithHandler(allOrders);
    } catch (error) {
      throw new Error("Could not query subgraph for open orders");
    }
  }
};

export const queryPastOrders = async (
  owner: string,
  chainId: number
): Promise<Order[]> => {
  if (chainId === 3) {
    try {
      const data = await request(
        SUBGRAPH_URL[chainId],
        GET_ALL_PAST_ORDERS_BY_OWNER,
        {
          owner: owner.toLowerCase(),
        }
      );
      return _getUniqueOrdersWithHandler(data.orders);
    } catch (error) {
      throw new Error("Could not query subgraph for past orders");
    }
  } else {
    try {
      const dataFromOldSubgraph = await request(
        OLD_SUBGRAPH_URL[chainId],
        GET_ALL_PAST_ORDERS_BY_OWNER,
        {
          owner: owner.toLowerCase(),
        }
      );

      const dataFromNewSubgraph = await request(
        SUBGRAPH_URL[chainId],
        GET_ALL_PAST_ORDERS_BY_OWNER,
        {
          owner: owner.toLowerCase(),
        }
      );

      const allOrders = [
        ...dataFromOldSubgraph.orders,
        ...dataFromNewSubgraph.orders,
      ];

      return _getUniqueOrdersWithHandler(allOrders);
    } catch (error) {
      throw new Error("Could not query subgraph for past orders");
    }
  }
};

export const queryExecutedOrders = async (
  owner: string,
  chainId: number
): Promise<Order[]> => {
  if (chainId === 3) {
    try {
      const data = await request(
        SUBGRAPH_URL[chainId],
        GET_ALL_EXECUTED_ORDERS_BY_OWNER,
        {
          owner: owner.toLowerCase(),
        }
      );
      return _getUniqueOrdersWithHandler(data.orders);
    } catch (error) {
      throw new Error("Could not query subgraph for executed orders");
    }
  } else {
    try {
      const dataFromOldSubgraph = await request(
        OLD_SUBGRAPH_URL[chainId],
        GET_ALL_EXECUTED_ORDERS_BY_OWNER,
        {
          owner: owner.toLowerCase(),
        }
      );

      const dataFromNewSubgraph = await request(
        SUBGRAPH_URL[chainId],
        GET_ALL_EXECUTED_ORDERS_BY_OWNER,
        {
          owner: owner.toLowerCase(),
        }
      );

      const allOrders = [
        ...dataFromOldSubgraph.orders,
        ...dataFromNewSubgraph.orders,
      ];

      return _getUniqueOrdersWithHandler(allOrders);
    } catch (error) {
      throw new Error("Could not query subgraph for executed orders");
    }
  }
};

export const queryCancelledOrders = async (
  owner: string,
  chainId: number
): Promise<Order[]> => {
  if (chainId === 3) {
    try {
      const data = await request(
        SUBGRAPH_URL[chainId],
        GET_ALL_CANCELLED_ORDERS_BY_OWNER,
        {
          owner: owner.toLowerCase(),
        }
      );
      return _getUniqueOrdersWithHandler(data.orders);
    } catch (error) {
      throw new Error("Could not query subgraph for cancelled orders");
    }
  } else {
    try {
      const dataFromOldSubgraph = await request(
        OLD_SUBGRAPH_URL[chainId],
        GET_ALL_CANCELLED_ORDERS_BY_OWNER,
        {
          owner: owner.toLowerCase(),
        }
      );

      const dataFromNewSubgraph = await request(
        SUBGRAPH_URL[chainId],
        GET_ALL_CANCELLED_ORDERS_BY_OWNER,
        {
          owner: owner.toLowerCase(),
        }
      );
      const allOrders = [
        ...dataFromOldSubgraph.orders,
        ...dataFromNewSubgraph.orders,
      ];

      return _getUniqueOrdersWithHandler(allOrders);
    } catch (error) {
      throw new Error("Could not query subgraph for cancelled orders");
    }
  }
};

const _getUniqueOrdersWithHandler = (allOrders: Order[]): Order[] =>
  [...new Map(allOrders.map((order) => [order.id, order])).values()].map(
    (order) => {
      let handler;
      try {
        const hasHandler = order.data.length === 194;
        handler = hasHandler ? "0x" + order.data.substr(154, 194) : null;
      } catch (e) {
        handler = null;
      }

      return { ...order, handler };
    }
  );
