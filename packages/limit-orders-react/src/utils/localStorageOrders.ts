import { Order } from "@gelatonetwork/limit-orders-lib";
import { get, set } from "local-storage";

const LS_ORDERS = "gorders_";

export function lsKey(key: string, account: string, chainId: number) {
  return key + account.toString() + chainId.toString();
}

export function getLSOrders(chainId: number, account: string, pending = false) {
  const key = pending
    ? lsKey(LS_ORDERS + "pending_", account, chainId)
    : lsKey(LS_ORDERS, account, chainId);

  const orders = get<Order[]>(key);

  return orders ?? [];
}

export function saveOrder(
  chainId: number,
  account: string,
  order: Order,
  pending = false
) {
  const key = pending
    ? lsKey(LS_ORDERS + "pending_", account, chainId)
    : lsKey(LS_ORDERS, account, chainId);

  const prev = get<Order[]>(key);

  if (prev === null) {
    set(key, [order]);
  } else {
    const orders = removeOrder(chainId, account, order, pending);

    orders.push(order);
    set(key, orders);
  }
}

export function removeOrder(
  chainId: number,
  account: string,
  order: Order,
  pending = false
) {
  const key = pending
    ? lsKey(LS_ORDERS + "pending_", account, chainId)
    : lsKey(LS_ORDERS, account, chainId);

  const prev = get<Order[]>(key);

  const orders = prev.filter(
    (orderInLS) =>
      orderInLS.createdTxHash.toLowerCase() !==
      order.createdTxHash.toLowerCase()
  );

  set(key, orders);

  return orders;
}

export function confirmOrderCancellation(
  chainId: number,
  account: string,
  cancellationHash: string,
  success = true
) {
  const cancelHash = cancellationHash.toLowerCase();
  const pendingKey = lsKey(LS_ORDERS + "pending_", account, chainId);
  const pendingOrders = get<Order[]>(pendingKey);
  const confirmedOrder = pendingOrders.find(
    (order) => order.cancelledTxHash?.toLowerCase() === cancelHash
  );

  if (confirmedOrder) removeOrder(chainId, account, confirmedOrder, true);

  if (success && confirmedOrder) {
    const ordersKey = lsKey(LS_ORDERS, account, chainId);
    const orders = get<Order[]>(ordersKey);
    if (orders) {
      const ordersToSave = removeOrder(
        chainId,
        account,
        { ...confirmedOrder, cancelledTxHash: cancelHash },
        true
      );

      ordersToSave.push({ ...confirmedOrder, cancelledTxHash: cancelHash });

      set(ordersKey, ordersToSave);
    } else {
      set(ordersKey, [{ ...confirmedOrder, cancelledTxHash: cancelHash }]);
    }
  }
}

export function confirmOrderSubmission(
  chainId: number,
  account: string,
  submissionHash: string,
  success = true
) {
  const creationHash = submissionHash.toLowerCase();
  const pendingKey = lsKey(LS_ORDERS + "pending_", account, chainId);
  const pendingOrders = get<Order[]>(pendingKey);
  const confirmedOrder = pendingOrders.find(
    (order) => order.createdTxHash?.toLowerCase() === creationHash
  );

  if (confirmedOrder) removeOrder(chainId, account, confirmedOrder, true);

  if (success && confirmedOrder) {
    const ordersKey = lsKey(LS_ORDERS, account, chainId);
    const orders = get<Order[]>(ordersKey);
    if (orders) {
      const ordersToSave = removeOrder(
        chainId,
        account,
        { ...confirmedOrder, createdTxHash: creationHash },
        true
      );

      ordersToSave.push({ ...confirmedOrder, createdTxHash: creationHash });

      set(ordersKey, ordersToSave);
    } else {
      set(ordersKey, [{ ...confirmedOrder, createdTxHash: creationHash }]);
    }
  }
}
