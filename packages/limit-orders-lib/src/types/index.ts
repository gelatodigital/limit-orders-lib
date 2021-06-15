import { BigNumberish, BytesLike } from "ethers";

// mainnet | ropsten | matic | fantom
export type ChainId = 1 | 3 | 137 | 250;

export type Venue = "spookyswap" | "uniswap" | "quickswap" | "spiritswap";

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

export interface WitnessAndSecret {
  witness: string;
  secret: string;
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
