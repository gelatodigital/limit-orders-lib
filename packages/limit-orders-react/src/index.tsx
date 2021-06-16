import React from "react";
import { gelatoReducers } from "./state";
import ApplicationUpdater from "./state/gapplication/updater";
import ListsUpdater from "./state/glists/updater";
import MulticallUpdater from "./state/gmulticall/updater";
import TransactionUpdater from "./state/gtransactions/updater";
import {
  useGelatoLimitOrders,
  useGelatoLimitOrdersHandlers,
} from "./hooks/gelato";
import useGelatoLimitOrdersHistory from "./hooks/gelato/useGelatoLimitOrdersHistory";
import GelatoLimitOrderPanel from "./components/GelatoLimitOrder";
import GelatoLimitOrdersHistoryPanel from "./components/LimitOrdersHistory";
import { Web3Provider } from "./web3";
import { Venue } from "@gelatonetwork/limit-orders-lib";
export * from "@gelatonetwork/limit-orders-lib";

export function GelatoProvider({
  chainId,
  library,
  children,
  account,
  venue,
}: {
  chainId: number | undefined;
  library: any | undefined;
  account: string | undefined;
  venue?: Venue;
  children?: React.ReactNode;
}) {
  return (
    <Web3Provider
      chainId={chainId}
      library={library}
      account={account}
      venue={venue}
    >
      <ListsUpdater />
      <ApplicationUpdater />
      <MulticallUpdater />
      <TransactionUpdater />
      {children}
    </Web3Provider>
  );
}

export {
  useGelatoLimitOrders,
  useGelatoLimitOrdersHandlers,
  useGelatoLimitOrdersHistory,
  GelatoLimitOrderPanel,
  GelatoLimitOrdersHistoryPanel,
  gelatoReducers,
};
