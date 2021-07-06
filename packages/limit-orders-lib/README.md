[![npm version](https://badge.fury.io/js/%40gelatonetwork%2Flimit-orders-lib.svg)](https://badge.fury.io/js/%40gelatonetwork%2Flimit-orders-lib)
[![gelatodigital](https://circleci.com/gh/gelatodigital/limit-orders-lib.svg?style=shield)](https://app.circleci.com/pipelines/github/gelatodigital/limit-orders-lib)

# Gelato Limit Order SDK

Place limit buy and sell orders on Ethereum, Polygon and Fantom using Gelato Network.

## [Demo - Sorbet Finance](https://www.sorbet.finance)

## Installation

`yarn add -D @gelatonetwork/limit-orders-lib`

or

`npm install --save-dev @gelatonetwork/limit-orders-lib`

## Getting Started

Instantiate GelatoLimitOrders

```typescript
import { GelatoLimitOrders, utils } from "@gelatonetwork/limit-orders-lib";

// Supported networks: Mainnet = 1; Ropsten = 3; Polygon = 137; Fantom = 250
const chainId = 1;
const signerOrProvider = await provider.getSigner();
const handler = "uniswap"; // "spookyswap" | "uniswap" | "quickswap" | "spiritswap";

const gelatoLimitOrders = new GelatoLimitOrders(
  chainId as ChainId,
  signerOrProvider, // optional
  handler // optional
);
```

### Examples

1. Submit a limit order

```typescript
// Token to sell
const inputToken = "0x6b175474e89094c44da98b954eedeac495271d0f"; // DAI

// Token to buy
const outputToken = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // ETH

// Amount to sell
const inputAmount = ethers.utils.parseUnits("2000", "18");

// Minimum amount of outTOken which the users wants to receive back
const minReturnToBeParsed = ethers.utils.parseEther("1", "18");

// Address of user who places the order (must be same as signer address)
const userAddress = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";

const tx = await gelatoLimitOrders.submitLimitOrder(
  inputToken,
  outputToken,
  inputAmount,
  minReturn
);
```

2. Cancel an order

```typescript
const tx = await gelatoLimitOrders.cancelLimitOrder(
  order,
  true // Optional: checkIsActiveOrder = true, to check if order to be cancelled actually exists. It is recommended to use this check before trying to cancel an order to avoid faulty cancellations and gas waste.
```

3. Fetch orders

Note: to display the minReturn you should always use the `adjustedMinReturn` field of the order.

```javascript
const allOrders = await gelatoLimitOrders.getOrders(userAddress);
```

## Types

```typescript
export class GelatoLimitOrders {
  private _chainId;
  private _provider;
  private _signer;
  private _gelatoLimitOrders;
  private _moduleAddress;
  private _subgraphUrl;
  private _handlerAddress?;
  private _handler?;
  static slippageBPS: number;
  static gelatoFeeBPS: number;
  get chainId(): ChainId;
  get signer(): Signer | undefined;
  get provider(): Provider | undefined;
  get subgraphUrl(): string;
  get handler(): Handler | undefined;
  get handlerAddress(): string | undefined;
  get moduleAddress(): string;
  get contract(): GelatoLimitOrdersContract;
  constructor(chainId: ChainId, signerOrProvider?: Signer, handler?: Handler);
  encodeLimitOrderSubmission(
    inputToken: string,
    outputToken: string,
    inputAmount: BigNumberish,
    minReturn: BigNumberish,
    owner: string
  ): Promise<TransactionData>;
  encodeLimitOrderSubmissionWithSecret(
    inputToken: string,
    outputToken: string,
    inputAmount: BigNumberish,
    minReturn: BigNumberish,
    owner: string
  ): Promise<TransactionDataWithSecret>;
  submitLimitOrder(
    inputToken: string,
    outputToken: string,
    inputAmount: BigNumberish,
    minReturn: BigNumberish,
    gasPrice?: BigNumberish
  ): Promise<ContractTransaction>;
  encodeLimitOrderCancellation(
    order: Order,
    checkIsActiveOrder?: boolean
  ): Promise<TransactionData>;
  cancelLimitOrder(
    order: Order,
    checkIsActiveOrder?: boolean,
    gasPrice?: BigNumberish
  ): Promise<ContractTransaction>;
  isActiveOrder(order: Order): Promise<boolean>;
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
export declare type ChainId = 1 | 3 | 137 | 250;

export declare type Handler =
  | "spookyswap"
  | "uniswap"
  | "quickswap"
  | "spiritswap";

export interface TransactionData {
  to: string;
  data: BytesLike;
  value: BigNumberish;
}

export interface TransactionDataWithSecret {
  payload: TransactionData;
  secret: string;
  witness: string;
  order: PartialOrder;
}

export interface Order {
  id: string;
  owner: string;
  inputToken: string;
  outputToken: string;
  minReturn: string;
  adjustedMinReturn: string;
  module: string;
  witness: string;
  secret: string;
  inputAmount: string;
  vault: string;
  bought: string | null;
  auxData: string | null;
  status: string;
  createdTxHash: string;
  executedTxHash: string | null;
  cancelledTxHash: string | null;
  blockNumber: string;
  createdAt: string;
  updatedAt: string;
  updatedAtBlock: string;
  updatedAtBlockHash: string;
  data: string;
  inputData: string;
  handler: string | null;
}

export interface PartialOrder {
  owner: string;
  inputToken: string;
  outputToken: string;
  minReturn: string;
  adjustedMinReturn: string;
  module: string;
  witness: string;
  secret: string;
  inputAmount: string;
  data: string;
  inputData: string;
  handler?: string;
}
```

### Need help?

Reach out to us on [Telegram](https://t.me/therealgelatonetwork), [Discord](https://discord.gg/ApbA39BKyJ) or [Twitter](https://twitter.com/gelatonetwork)
