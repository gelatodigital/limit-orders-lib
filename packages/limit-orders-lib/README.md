[![npm version](https://badge.fury.io/js/%40gelatonetwork%2Flimit-orders-lib.svg)](https://badge.fury.io/js/%40gelatonetwork%2Flimit-orders-lib)
[![gelatodigital](https://circleci.com/gh/gelatodigital/limit-orders-lib.svg?style=shield)](https://app.circleci.com/pipelines/github/gelatodigital/limit-orders-lib)

# Gelato Limit Order SDK

Place limit buy and sell orders on Ethereum, Polygon and Fantom using Gelato Network.

## Demo

<a href="https://www.sorbet.finance" target="_blank">
     <img src="https://i.imgur.com/xE5RKRH.png"
          alt="Gelato Limit orders"
          style="width: 640px;"
     />
</a>

## Installation

`yarn add -D @gelatonetwork/limit-orders-lib`

or

`npm install --save-dev @gelatonetwork/limit-orders-lib`

## Getting Started (using ethers.js, but also works with web3.js)

1. Instantiate GelatoLimitOrders and send an order

```typescript
import { GelatoLimitOrders } from "@gelatonetwork/limit-orders-lib";

// Supported networks: Mainnet = 1; Ropsten = 3; Polygon = 137; Fantom = 250
const chainId = 1;
const signer = await provider.getSigner();
const handler = "uniswap"; // "spookyswap" | "uniswap" | "quickswap" | "spiritswap";

const gelatoLimitOrders = new GelatoLimitOrders(
  chainId as ChainId,
  signer, // optional
  handler // optional
);

// Token to sell
const inToken = "0x6b175474e89094c44da98b954eedeac495271d0f"; // DAI

// Token to buy
const outToken = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // ETH

// Amount to sell
const inputAmount = ethers.utils.parseUnits("2000", "18");

// Minimum amount of outTOken which the users wants to receive back
const minimumReturn = ethers.utils.parseEther("1", "18");

// Address of user who places the order (must be same as signer address)
const userAddress = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";

// If 1 ETH is above 2000 DAI, then the user will buy 1 ETH if it is less than 2000 DAI
// If 1 ETH is below 2000 DAI, then the user will buy 1 ETH if it is greater than 2000 DAI
const txData = await gelatoLimitOrders.submitLimitOrder(
  inToken,
  outToken,
  inputAmount,
  minimumReturn,
  userAddress
);
```

2. Cancel an order

```typescript
const tx = await gelatoLimitOrders.cancelLimitOrder(
  order.inputToken,
  order.outputToken,
  order.minReturn,
  order.witness
);
```

3. Fetch all orders

```javascript
const allOrders = await gelatoLimitOrders.getOrders(userAddress);
```

## Types

See `dist/src/index.d.ts`

```typescript
export class GelatoLimitOrders {
  static slippageBPS: number;
  static gelatoFeeBPS: number;
  get chainId(): ChainId;
  get signer(): Signer | undefined;
  get subgraphUrl(): string;
  get handler(): Handler | undefined;
  get moduleAddress(): string;
  get contract(): GelatoLimitOrdersContract;
  constructor(chainId: ChainId, signer?: Signer, handler?: Handler);
  encodeLimitOrderSubmission(
    fromCurrency: string,
    toCurrency: string,
    amount: BigNumberish,
    minimumReturn: BigNumberish,
    owner: string
  ): Promise<TransactionData>;
  encodeLimitOrderSubmissionWithSecret(
    fromCurrency: string,
    toCurrency: string,
    amount: BigNumberish,
    minimumReturn: BigNumberish,
    owner: string
  ): Promise<TransactionDataWithSecret>;
  submitLimitOrder(
    fromCurrency: string,
    toCurrency: string,
    amount: BigNumberish,
    minimumReturn: BigNumberish,
    gasPrice?: BigNumberish
  ): Promise<ContractTransaction>;
  encodeLimitOrderCancellation(
    fromCurrency: string,
    toCurrency: string,
    minReturn: BigNumberish,
    witness: string,
    owner: string
  ): TransactionData;
  cancelLimitOrder(
    fromCurrency: string,
    toCurrency: string,
    minReturn: BigNumberish,
    witness: string,
    gasPrice?: BigNumberish
  ): Promise<ContractTransaction>;
  getExchangeRate(
    inputValue: BigNumberish,
    inputDecimals: number,
    outputValue: BigNumberish,
    outputDecimals: number,
    invert?: boolean
  ): string;
  getFeeAndSlippageAdjustedMinReturn(
    outputAmount: BigNumberish,
    extraSlippageBPS?: number
  ): {
    minReturn: string;
    slippage: string;
    gelatoFee: string;
  };
  getRawMinReturn(minReturn: BigNumberish, extraSlippageBPS?: number): string;
  getExecutionPrice(
    inputAmount: BigNumberish,
    inputDecimals: number,
    outputAmount: BigNumberish,
    outputDecimals: number,
    isInverted?: boolean
  ): string;
  getOrders(owner: string): Promise<Order[]>;
  getOpenOrders(owner: string): Promise<Order[]>;
  getPastOrders(owner: string): Promise<Order[]>;
  getExecutedOrders(owner: string): Promise<Order[]>;
  getCancelledOrders(owner: string): Promise<Order[]>;
}

export interface TransactionData {
  to: string;
  data: BytesLike;
  value: BigNumberish;
}

export interface TransactionDataWithSecret {
  payload: TransactionData;
  secret: string;
  witness: string;
}

export interface Order {
  id: number;
  owner: string;
  inputToken: string;
  outputToken: string;
  minReturn: string;
  module: string;
  witness: string;
  secret: string;
  inputAmount: string;
  vault: string;
  bought: string;
  auxData: string;
  status: string;
  createdTxHash: string;
  executedTxHash: string;
  cancelledTxHash: string;
  blockNumber: string;
  createdAt: string;
  updatedAt: string;
  updatedAtBlock: string;
  updatedAtBlockHash: string;
  data: string;
  inputData: string;
}
```

### Need help?

Reach out to us on [Telegram](https://t.me/therealgelatonetwork), [Discord](https://discord.gg/ApbA39BKyJ) or [Twitter](https://twitter.com/gelatonetwork)
