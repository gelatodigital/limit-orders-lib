import { useCallback, useEffect, useMemo, useState } from "react";
import { Order } from "@gelatonetwork/limit-orders-lib";
import { useWeb3 } from "../../web3";
import { getLSOrders, saveOrder } from "../../utils/localStorageOrders";
import useInterval from "../useInterval";
import { useSelector } from "react-redux";
import { AppState } from "../../state";
import useGelatoStopLimitOrdersLib from "./useGelatoStopLimitOrdersLib";

export interface GelatoStopLimitOrdersHistory {
  open: { pending: Order[]; confirmed: Order[] };
  cancelled: { pending: Order[]; confirmed: Order[] };
  executed: Order[];
}
function newOrdersFirst(a: Order, b: Order) {
  return Number(b.updatedAt) - Number(a.updatedAt);
}

export default function useGelatoStopLimitOrdersHistory(
  includeOrdersWithNullHandler = false
): GelatoStopLimitOrdersHistory {
  const { account, chainId } = useWeb3();


  const gelatoLimitOrders = useGelatoStopLimitOrdersLib();

  const [openOrders, setOpenOrders] = useState<{
    pending: Order[];
    confirmed: Order[];
  }>({ pending: [], confirmed: [] });
  const [cancelledOrders, setCancelledOrders] = useState<{
    pending: Order[];
    confirmed: Order[];
  }>({ pending: [], confirmed: [] });
  const [executedOrders, setExecutedOrders] = useState<Order[]>([]);

  const state = useSelector<AppState, AppState["gtransactions"]>(
    (state) => state.gtransactions
  ) as any;


  const fetchOpenOrders = useCallback(() => {
    if (gelatoLimitOrders && account && chainId)
      gelatoLimitOrders
        .getOpenOrders(account.toLowerCase(), includeOrdersWithNullHandler)
        .then(async (orders) => {
          const ordersLS = getLSOrders(chainId, account, false, true);
          orders.forEach((order: Order) => {
            const orderExists = ordersLS.find(
              (confOrder) =>
                confOrder.id.toLowerCase() === order.id.toLowerCase()
            );

            if (
              !orderExists ||
              (orderExists &&
                Number(orderExists.updatedAt) < Number(order.updatedAt))
            ) {
              saveOrder(chainId, account, order, false, true);
            }
            saveOrder(chainId, account, order, false, true);
          });

          const openOrdersLS = getLSOrders(chainId, account, false, true).filter(
            (order) => order.status === "open"
          );

          const pendingOrdersLS = getLSOrders(chainId, account, true, true);

          setOpenOrders({
            confirmed: openOrdersLS
              .filter((order: Order) => {
                const orderCancelled = pendingOrdersLS
                  .filter((pendingOrder) => pendingOrder.status === "cancelled")
                  .find(
                    (pendingOrder) =>
                      pendingOrder.id.toLowerCase() === order.id.toLowerCase()
                  );
                return orderCancelled ? false : true;
              })
              .sort(newOrdersFirst),
            pending: pendingOrdersLS
              .filter((order) => order.status === "open")
              .sort(newOrdersFirst),
          });
        })
        .catch((e) => {
          console.error("Error fetching open orders from subgraph", e);
          const openOrdersLS = getLSOrders(chainId, account, false, true).filter(
            (order) => order.status === "open"
          );

          const pendingOrdersLS = getLSOrders(chainId, account, true, true);

          setOpenOrders({
            confirmed: openOrdersLS
              .filter((order: Order) => {
                const orderCancelled = pendingOrdersLS
                  .filter((pendingOrder) => pendingOrder.status === "cancelled")
                  .find(
                    (pendingOrder) =>
                      pendingOrder.id.toLowerCase() === order.id.toLowerCase()
                  );
                return orderCancelled ? false : true;
              })
              .sort(newOrdersFirst),
            pending: pendingOrdersLS
              .filter((order) => order.status === "open")
              .sort(newOrdersFirst),
          });
        });
  }, [gelatoLimitOrders, account, chainId, includeOrdersWithNullHandler]);

  const fetchCancelledOrders = useCallback(() => {
    if (gelatoLimitOrders && account && chainId)
      gelatoLimitOrders
        .getCancelledOrders(account.toLowerCase(), includeOrdersWithNullHandler)
        .then(async (orders) => {
          const ordersLS = getLSOrders(chainId, account, false, true);

          orders.forEach((order: Order) => {
            const orderExists = ordersLS.find(
              (confOrder) =>
                confOrder.id.toLowerCase() === order.id.toLowerCase()
            );
            if (
              !orderExists ||
              (orderExists &&
                Number(orderExists.updatedAt) < Number(order.updatedAt))
            ) {
              saveOrder(chainId, account, order, false, true);
            }
          });

          const cancelledOrdersLS = getLSOrders(chainId, account, false, true).filter(
            (order) => order.status === "cancelled"
          );

          const pendingCancelledOrdersLS = getLSOrders(
            chainId,
            account,
            true,
            true
          ).filter((order) => order.status === "cancelled");

          setCancelledOrders({
            confirmed: cancelledOrdersLS.sort(newOrdersFirst),
            pending: pendingCancelledOrdersLS.sort(newOrdersFirst),
          });
        })
        .catch((e) => {
          console.error("Error fetching cancelled orders from subgraph", e);

          const cancelledOrdersLS = getLSOrders(chainId, account, false, true).filter(
            (order) => order.status === "cancelled"
          );

          const pendingCancelledOrdersLS = getLSOrders(
            chainId,
            account,
            true,
            true
          ).filter((order) => order.status === "cancelled");

          setCancelledOrders({
            confirmed: cancelledOrdersLS.sort(newOrdersFirst),
            pending: pendingCancelledOrdersLS.sort(newOrdersFirst),
          });
        });
  }, [gelatoLimitOrders, account, chainId, includeOrdersWithNullHandler]);

  const fetchExecutedOrders = useCallback(() => {
    if (gelatoLimitOrders && account && chainId)
      gelatoLimitOrders
        .getExecutedOrders(account.toLowerCase(), includeOrdersWithNullHandler)
        .then(async (orders) => {
          const ordersLS = getLSOrders(chainId, account, false, true);

          orders.forEach((order: Order) => {
            const orderExists = ordersLS.find(
              (confOrder) =>
                confOrder.id.toLowerCase() === order.id.toLowerCase()
            );
            if (
              !orderExists ||
              (orderExists &&
                Number(orderExists.updatedAt) < Number(order.updatedAt))
            ) {
              saveOrder(chainId, account, order, false, true);
            }
          });

          const executedOrdersLS = getLSOrders(chainId, account, false, true).filter(
            (order) => order.status === "executed"
          );

          setExecutedOrders(executedOrdersLS.sort(newOrdersFirst));
        })
        .catch((e) => {
          console.error("Error fetching executed orders from subgraph", e);
          const executedOrdersLS = getLSOrders(chainId, account, false, true).filter(
            (order) => order.status === "executed"
          );

          setExecutedOrders(executedOrdersLS.sort(newOrdersFirst));
        });
  }, [gelatoLimitOrders, account, chainId, includeOrdersWithNullHandler]);

  const transactions = useMemo(() => (chainId ? state[chainId] ?? {} : {}), [
    chainId,
    state,
  ]);

  useEffect(() => {
    fetchOpenOrders();
    fetchCancelledOrders();
    fetchExecutedOrders();
  }, [
    fetchCancelledOrders,
    fetchExecutedOrders,
    fetchOpenOrders,
    transactions,
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
