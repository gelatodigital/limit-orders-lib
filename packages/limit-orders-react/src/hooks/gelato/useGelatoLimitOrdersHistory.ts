import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GelatoLimitOrders,
  Order,
  utils,
} from "@gelatonetwork/limit-orders-lib";
import { useWeb3 } from "../../web3";
import { getLSOrders, saveOrder } from "../../utils/localStorageOrders";
import { useAllTransactions } from "../../state/gtransactions/hooks";

export interface GelatoLimitOrdersHistory {
  open: { pending: Order[]; confirmed: Order[] };
  cancelled: { pending: Order[]; confirmed: Order[] };
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

  const [txLengthLastChecked, setTxLengthLastChecked] = useState<number>();

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
            const orderExists = openOrders.confirmed.find(
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

          const pendingOrdersLS = getLSOrders(chainId, account, true);
          const openOrdersLS = getLSOrders(chainId, account).filter(
            (order) => order.status === "open"
          );

          setOpenOrders({
            confirmed: openOrdersLS.filter((order: Order) => {
              const orderCancelled = pendingOrdersLS
                .filter((pendingOrder) => pendingOrder.status === "cancelled")
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
  }, [gelatoLimitOrders, account, chainId, openOrders]);

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
            const orderExists = cancelledOrders.confirmed.find(
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

          const pendingCancelledOrdersLS = getLSOrders(
            chainId,
            account,
            true
          ).filter((order) => order.status === "cancelled");
          const cancelledOrdersLS = getLSOrders(chainId, account).filter(
            (order) => order.status === "cancelled"
          );

          setCancelledOrders({
            confirmed: cancelledOrdersLS,
            pending: pendingCancelledOrdersLS,
          });
        })
        .catch(() => console.error("Error fetching cancelled orders"));
  }, [gelatoLimitOrders, account, chainId, cancelledOrders]);

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
            const orderExists = executedOrders.find(
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
  }, [gelatoLimitOrders, account, chainId, executedOrders]);

  // useEffect(() => {
  //   fetchOpenOrders();
  //   fetchCancelledOrders();
  //   fetchExecutedOrders();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useEffect(() => {
    let nrReceipts = 0;
    Object.keys(transactions).forEach((key) => {
      if (transactions[key].receipt) nrReceipts++;
    });

    if (Object.keys(transactions).length + nrReceipts !== txLengthLastChecked) {
      fetchOpenOrders();
      fetchCancelledOrders();
      fetchExecutedOrders();
      setTxLengthLastChecked(Object.keys(transactions).length + nrReceipts);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  return {
    open: openOrders,
    cancelled: cancelledOrders,
    executed: executedOrders,
  };
}
