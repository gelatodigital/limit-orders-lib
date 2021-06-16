import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChainId,
  GelatoLimitOrders,
  Order,
  utils,
} from "@gelatonetwork/limit-orders-lib";
import { useWeb3 } from "../../web3";
import { getLSOrders, saveOrder } from "../../utils/localStorageOrders";
import { useAllTransactions } from "../../state/gtransactions/hooks";
import useInterval from "../useInterval";

export interface GelatoLimitOrdersHistory {
  open: { pending: Order[]; confirmed: Order[] };
  cancelled: { pending: Order[]; confirmed: Order[] };
  executed: Order[];
}

export default function useGelatoLimitOrdersHistory(): GelatoLimitOrdersHistory {
  const { account, chainId, library } = useWeb3();

  const gelatoLimitOrders = useMemo(() => {
    try {
      return chainId && library
        ? new GelatoLimitOrders(chainId as ChainId, library?.getSigner())
        : undefined;
    } catch (error) {
      console.error("Could not instantiate GelatoLimitOrders");
      return undefined;
    }
  }, [chainId, library]);

  const [transactionsValues, setTransactionsValues] = useState<number>(0);

  const [openOrders, setOpenOrders] = useState<{
    pending: Order[];
    confirmed: Order[];
  }>({ pending: [], confirmed: [] });
  const [cancelledOrders, setCancelledOrders] = useState<{
    pending: Order[];
    confirmed: Order[];
  }>({ pending: [], confirmed: [] });
  const [executedOrders, setExecutedOrders] = useState<Order[]>([]);

  const transactions = useAllTransactions();

  const fetchOpenOrders = useCallback(() => {
    if (gelatoLimitOrders && account && chainId)
      fetch(gelatoLimitOrders.subgraphUrl, {
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

          data.orders.forEach((order: Order) => {
            const orderExists = getLSOrders(chainId, account).find(
              (confOrder) =>
                confOrder.createdTxHash.toLowerCase() ===
                order.createdTxHash.toLowerCase()
            );

            if (
              !orderExists ||
              (orderExists && orderExists.updatedAt < order.updatedAt)
            ) {
              saveOrder(chainId, account, order);
            }
          });
          console.log("open");

          const openOrdersLS = getLSOrders(chainId, account).filter(
            (order) => order.status === "open"
          );

          const pendingOrdersLS = getLSOrders(chainId, account, true);

          setOpenOrders({
            confirmed: openOrdersLS.filter((order: Order) => {
              const orderCancelled = pendingOrdersLS
                .filter(
                  (pendingOrder) =>
                    pendingOrder.status === "cancelled" ||
                    pendingOrder.status === "pending"
                )
                .find(
                  (pendingOrder) =>
                    pendingOrder.createdTxHash.toLowerCase() ===
                    order.createdTxHash.toLowerCase()
                );
              return orderCancelled === undefined;
            }),
            pending: pendingOrdersLS.filter((order) => order.status === "open"),
          });
        })
        .catch(() => {
          console.error("Error fetching open orders");
        });
  }, [gelatoLimitOrders, account, chainId]);

  const fetchCancelledOrders = useCallback(() => {
    if (gelatoLimitOrders && account && chainId)
      fetch(gelatoLimitOrders.subgraphUrl, {
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

          data.orders.forEach((order: Order) => {
            const orderExists = getLSOrders(chainId, account).find(
              (confOrder) =>
                confOrder.createdTxHash.toLowerCase() ===
                order.createdTxHash.toLowerCase()
            );
            if (
              !orderExists ||
              (orderExists && orderExists.updatedAt < order.updatedAt)
            ) {
              saveOrder(chainId, account, order);
            }
          });

          const cancelledOrdersLS = getLSOrders(chainId, account).filter(
            (order) => order.status === "cancelled"
          );

          const pendingCancelledOrdersLS = getLSOrders(
            chainId,
            account,
            true
          ).filter((order) => order.status === "cancelled");

          setCancelledOrders({
            confirmed: cancelledOrdersLS,
            pending: pendingCancelledOrdersLS,
          });
        })
        .catch(() => console.error("Error fetching cancelled orders"));
  }, [gelatoLimitOrders, account, chainId]);

  const fetchExecutedOrders = useCallback(() => {
    if (gelatoLimitOrders && account && chainId)
      fetch(gelatoLimitOrders.subgraphUrl, {
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

          data.orders.forEach((order: Order) => {
            const orderExists = getLSOrders(chainId, account).find(
              (confOrder) =>
                confOrder.createdTxHash.toLowerCase() ===
                order.createdTxHash.toLowerCase()
            );
            if (
              !orderExists ||
              (orderExists && orderExists.updatedAt < order.updatedAt)
            ) {
              saveOrder(chainId, account, order);
            }
          });

          const executedOrdersLS = getLSOrders(chainId, account).filter(
            (order) => order.status === "executed"
          );

          setExecutedOrders(executedOrdersLS);
        })
        .catch(() => console.error("Error executing open orders"));
  }, [gelatoLimitOrders, account, chainId]);

  useEffect(() => {
    if (
      Object.keys(transactions).length + Object.values(transactions).length !==
      transactionsValues
    ) {
      fetchOpenOrders();
      fetchCancelledOrders();
      fetchExecutedOrders();
      setTransactionsValues(
        Object.keys(transactions).length + Object.values(transactions).length
      );
    }
  }, [
    fetchCancelledOrders,
    fetchExecutedOrders,
    fetchOpenOrders,
    transactions,
    transactionsValues,
  ]);

  useInterval(fetchOpenOrders, 60000);
  useInterval(fetchCancelledOrders, 60000);
  useInterval(fetchExecutedOrders, 60000);

  return {
    open: openOrders,
    cancelled: cancelledOrders,
    executed: executedOrders,
  };
}
