import { BigNumberish, BytesLike } from "ethers";

//export type ChainId = 1 | 3 | 137;

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
