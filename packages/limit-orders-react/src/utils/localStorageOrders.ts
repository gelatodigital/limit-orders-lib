import { Order } from "@gelatonetwork/limit-orders-lib";
import { get, set } from "local-storage";

const LS_ORDERS = "gorders_";

function lsKey(key: string, account: string, chainId: number) {
  return key + account.toString() + chainId.toString();
}

export function getLSOrders(chainId: number, account: string, pending = false) {
  const key = pending
    ? lsKey(LS_ORDERS + "pending_", account, chainId)
    : lsKey(LS_ORDERS, account, chainId);

  const orders = get<Order[]>(key);
  if (pending) console.log("orders inside getLSOrders", orders);
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

  console.log("saving order", pending, order);

  if (prev === null) {
    console.log("key, [order]", key, [order]);
    set(key, [order]);
  } else {
    console.log("else");
    const orderExists = prev.find(
      (orderInLS) => orderInLS.createdTxHash === order.createdTxHash
    );

    if (
      !orderExists ||
      (orderExists && orderExists.updatedAt < order.updatedAt)
    ) {
      prev.push(order);
      set(key, prev);
    }
  }
  console.log(
    "lsKey(LS_ORDERS + pending_, account, chainId)",
    lsKey(LS_ORDERS + "pending_", account, chainId)
  );

  console.log(
    "lsKey(LS_ORDERS + pending_, account, chainId)",
    getLSOrders(chainId, account)
  );
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
    (orderInLS) => orderInLS.createdTxHash !== order.createdTxHash
  );

  set(key, orders);
}

export function confirmOrderCancellation(
  chainId: number,
  account: string,
  cancellationHash: string,
  success = true
) {
  const pendingKey = lsKey(LS_ORDERS + "pending_", account, chainId);
  const pendingOrders = get<Order[]>(pendingKey);
  const confirmedOrder = pendingOrders.find(
    (order) => order.cancelledTxHash === cancellationHash
  );

  console.log(
    "confirmedOrder.cancelledTxHash",
    confirmedOrder?.cancelledTxHash
  );
  console.log("ancellationHash", cancellationHash);
  set(
    pendingKey,
    pendingOrders.filter((order) => order.cancelledTxHash !== cancellationHash)
  );

  if (success && confirmedOrder) {
    const ordersKey = lsKey(LS_ORDERS, account, chainId);
    const orders = get<Order[]>(ordersKey);
    orders.push({ ...confirmedOrder, cancelledTxHash: cancellationHash });
    set(pendingKey, orders);
  }
}

export function confirmOrderSubmission(
  chainId: number,
  account: string,
  creationHash: string,
  success = true
) {
  const pendingKey = lsKey(LS_ORDERS + "pending_", account, chainId);
  const pendingOrders = get<Order[]>(pendingKey);
  const confirmedOrder = pendingOrders.find(
    (order) => order.createdTxHash === creationHash
  );
  set(
    pendingKey,
    pendingOrders.filter((order) => order.createdTxHash !== creationHash)
  );

  if (success && confirmedOrder) {
    const ordersKey = lsKey(LS_ORDERS, account, chainId);
    const orders = get<Order[]>(ordersKey);
    orders.push({ ...confirmedOrder, createdTxHash: creationHash });
    set(pendingKey, orders);
  }
}
