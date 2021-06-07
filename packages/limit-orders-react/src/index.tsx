import React from "react";
import store, { gelatoReducers } from "./state";
import ApplicationUpdater from "./state/gapplication/updater";
import ListsUpdater from "./state/glists/updater";
import MulticallUpdater from "./state/gmulticall/updater";
import TransactionUpdater from "./state/gtransactions/updater";
import { ThemeProvider, DefaultTheme } from "styled-components";
import {
  useGelatoLimitOrders,
  useGelatoLimitOrdersHandlers,
} from "./hooks/gelato";
import { Provider } from "react-redux";

// import GelatoLimitOrder from "./components/GelatoLimitOrder";
import useGelatoLimitOrdersHistory from "./hooks/gelato/useGelatoLimitOrdersHistory";
import GelatoLimitOrder from "./components/GelatoLimitOrder";
import { Web3Provider } from "./web3";
import { Store } from "@reduxjs/toolkit";
export * from "@gelatonetwork/limit-orders-lib";

export function GelatoProvider({
  chainId,
  library,
  children,
  theme,
  account,
  storeOut,
}: {
  chainId: number | undefined;
  library: any | undefined;
  account: string | undefined;
  theme: DefaultTheme;
  storeOut: Store;
  children?: React.ReactNode;
}) {
  return (
    <Provider store={storeOut}>
      <ThemeProvider theme={theme}>
        <Web3Provider chainId={chainId} library={library} account={account}>
          <ListsUpdater library={library} />
          <ApplicationUpdater chainId={chainId} library={library} />
          <TransactionUpdater chainId={chainId} library={library} />
          <MulticallUpdater chainId={chainId} />
          {children}
        </Web3Provider>
      </ThemeProvider>
    </Provider>
  );
}

export function GelatoProviderStore({
  chainId,
  library,
  children,
  theme,
  account,
}: {
  chainId: number | undefined;
  library: any | undefined;
  account: string | undefined;
  theme: DefaultTheme;
  children?: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <Web3Provider chainId={chainId} library={library} account={account}>
        <ListsUpdater library={library} />
        <ApplicationUpdater chainId={chainId} library={library} />
        <TransactionUpdater chainId={chainId} library={library} />
        <MulticallUpdater chainId={chainId} />
        {children}
      </Web3Provider>
    </ThemeProvider>
  );
}

export function GelatoProviderInternalStore({
  chainId,
  library,
  children,
  theme,
  account,
}: {
  chainId: number | undefined;
  library: any | undefined;
  account: string | undefined;
  theme: DefaultTheme;
  children?: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Web3Provider chainId={chainId} library={library} account={account}>
          <ListsUpdater library={library} />
          <ApplicationUpdater chainId={chainId} library={library} />
          <TransactionUpdater chainId={chainId} library={library} />
          <MulticallUpdater chainId={chainId} />
          {children}
        </Web3Provider>
      </ThemeProvider>
    </Provider>
  );
}

export const getReact = () => React;

export {
  useGelatoLimitOrders,
  useGelatoLimitOrdersHandlers,
  useGelatoLimitOrdersHistory,
  GelatoLimitOrder as GelatoLimitOrderPanel,
  gelatoReducers,
};
