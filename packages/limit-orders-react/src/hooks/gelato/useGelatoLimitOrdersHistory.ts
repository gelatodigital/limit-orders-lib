import { useMemo, useState } from "react";
import {
  GelatoLimitOrders,
  Order,
  utils,
} from "@gelatonetwork/limit-orders-lib";
import { useWeb3 } from "../../web3";

export interface GelatoLimitOrdersHistory {
  open: Order[];
  cancelled: Order[];
  executed: Order[];
}

export default function useGelatoLimitOrdersHistory(): GelatoLimitOrdersHistory {
  const { account, chainId, library } = useWeb3();

  const gelatoLimitOrders = useMemo(
    () =>
      chainId && library
        ? new GelatoLimitOrders(chainId, library?.getSigner())
        : undefined,
    [chainId, library]
  );

  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<Order[]>([]);
  const [executedOrders, setExecutedOrders] = useState<Order[]>([]);

  useMemo(
    () =>
      gelatoLimitOrders && account
        ? fetch(gelatoLimitOrders.subgraphUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: utils.queries.GET_ALL_OPEN_ORDERS_BY_OWNER,
              variables: {
                owner: account.toLowerCase(),
              },
            }),
          })
            .then(async (res) => {
              const { data } = await res.json();
              setOpenOrders(data.orders);
            })
            .catch(() => {
              setOpenOrders([]);
            })
        : undefined,

    [gelatoLimitOrders, account]
  );

  useMemo(
    () =>
      gelatoLimitOrders && account
        ? fetch(gelatoLimitOrders.subgraphUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: utils.queries.GET_ALL_CANCELLED_ORDERS_BY_OWNER,
              variables: {
                owner: account.toLowerCase(),
              },
            }),
          })
            .then(async (res) => {
              const { data } = await res.json();
              setCancelledOrders(data.orders);
            })
            .catch(() => setCancelledOrders([]))
        : undefined,

    [gelatoLimitOrders, account]
  );

  useMemo(
    () =>
      gelatoLimitOrders && account
        ? fetch(gelatoLimitOrders.subgraphUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: utils.queries.GET_ALL_EXECUTED_ORDERS_BY_OWNER,
              variables: {
                owner: account.toLowerCase(),
              },
            }),
          })
            .then(async (res) => {
              const { data } = await res.json();
              setExecutedOrders(data.orders);
            })
            .catch(() => setExecutedOrders([]))
        : undefined,

    [gelatoLimitOrders, account]
  );

  return {
    open: openOrders,
    cancelled: cancelledOrders,
    executed: executedOrders,
  };
}
