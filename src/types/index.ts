import { BigNumber, BytesLike } from "ethers";

export type ChainId = 1 | 3 | 137;

export interface TransactionData {
  to: string;
  data: BytesLike;
  value: BigNumber;
}

export interface TransactionDataWithSecret {
  payload: TransactionData;
  secret: string;
  witness: string;
}

export interface Order {
  id: number;
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  minReturn: string;
  bought: string;
  status: string;
  cancelledTxHash: string;
  executedTxHash: string;
  updatedAt: string;
}
