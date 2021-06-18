[![npm version](https://badge.fury.io/js/%40gelatonetwork%2Flimit-orders-lib.svg)](https://badge.fury.io/js/%40gelatonetwork%2Flimit-orders-lib)
[![gelatodigital](https://circleci.com/gh/gelatodigital/limit-orders-lib.svg?style=shield)](https://app.circleci.com/pipelines/github/gelatodigital/limit-orders-lib)

# Gelato Limit Order React SDK

use Gelato's react component or hooks to place limit buy and sell orders on Ethereum, Polygon and Fantom using Gelato Network.

## Demo

<a href="https://www.sorbet.finance" target="_blank">
     <img src="https://i.imgur.com/xE5RKRH.png"
          alt="Gelato Limit orders"
          style="width: 640px;"
     />
</a>

## Installation

`yarn add -D @gelatonetwork/limit-orders-react`

or

`npm install --save-dev @gelatonetwork/limit-orders-react`

## Getting started

import { GelatoProvider } from '@gelatonetwork/limit-orders-react'

```tsx
import React from "react";
import ReactDOM from "react-dom";
import { GelatoProvider } from "@gelatonetwork/limit-orders-react";
import { useActiveWeb3React } from "hooks/web3";

function Gelato({ children }: { children?: React.ReactNode }) {
  const { library, chainId, account } = useActiveWeb3React();
  return (
    <GelatoProvider
      library={library}
      chainId={chainId}
      account={account ?? undefined}
    >
      {children}
    </GelatoProvider>
  );
}

ReactDOM.render(
  <StrictMode>
    <FixedGlobalStyle />
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ProviderNetwork getLibrary={getLibrary}>
        <Provider store={store}>
          <ThemeProvider>
            <ThemedGlobalStyle />
            <HashRouter>
              <Gelato>
                <App />
              </Gelato>
            </HashRouter>
          </ThemeProvider>
        </Provider>
      </Web3ProviderNetwork>
    </Web3ReactProvider>
  </StrictMode>,
  document.getElementById("root")
);
```

## Use the Gelato react component

Using the gelato react component is the easiest option to get limit orders into your app.

```tsx
import React from "react";
import {
  GelatoLimitOrderPanel,
  GelatoLimitOrdersHistoryPanel,
} from "@gelatonetwork/limit-orders-react";

export default function LimitOrder() {
  return (
    <>
      <GelatoLimitOrderPanel />
      <GelatoLimitOrdersHistoryPanel />
    </>
  );
}
```

## Use the Gelato react hooks

Using the gelato hooks all logic and state updates are encapsulated and all your have to do is plug them in into your application.

```tsx
import React from "react";
import {
  useGelatoLimitOrders,
  GelatoLimitOrdersHistoryPanel,
} from "@gelatonetwork/limit-orders-react";

export default function LimitOrder() {
  const {
    handlers: {
      handleInput,
      handleRateType,
      handleCurrencySelection,
      handleSwitchTokens,
      handleLimitOrderSubmission,
    },
    derivedOrderInfo: {
      parsedAmounts,
      currencies,
      currencyBalances,
      trade,
      formattedAmounts,
      inputError,
    },
    orderState: { independentField, rateType, typedValue },
  } = useGelatoLimitOrders();

  const { open, cancelled, executed } = useGelatoLimitOrdersHistory();

  ...
}
```

## Types

See `dist/src/index.d.ts`

```typescript
useGelatoLimitOrders(): {
  library: GelatoLimitOrders | undefined;
  handlers: GelatoLimitOrdersHandlers;
  derivedOrderInfo: DerivedOrderInfo;
  orderState: OrderState;
}

useGelatoLimitOrdersHandlers(): {
  handleLimitOrderSubmission: () => Promise<string | undefined>;
  handleLimitOrderCancellation: (
    order: Order,
    orderDetails?: {
      inputTokenSymbol: string;
      outputTokenSymbol: string;
      inputAmount: string;
      outputAmount: string;
      executionPrice: string;
    }
  ) => Promise<string | undefined>;
  handleInput: (field: Field, value: string) => void;
  handleCurrencySelection: (field: Field, currency: Currency) => void;
  handleSwitchTokens: () => void;
  handleRateType: () => void;
  library: GelatoLimitOrders | undefined;
}

useGelatoLimitOrdersHistory(): {
  open: { pending: Order[]; confirmed: Order[] };
  cancelled: { pending: Order[]; confirmed: Order[] };
  executed: Order[];
}
```

### Need help?

Reach out to us on [Telegram](https://t.me/therealgelatonetwork), [Discord](https://discord.gg/ApbA39BKyJ) or [Twitter](https://twitter.com/gelatonetwork)