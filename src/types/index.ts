import { BigNumber, BytesLike } from "ethers";

export interface TransactionData {
  to: string;
  data: BytesLike;
  value: BigNumber;
}

export interface TransactionDataWithSecret {
  txData: TransactionData;
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
  inputAmount: string;
  minReturn: string;
  status: string;
  createdTxHash: BytesLike;
  updatedAt: string;
  bought?: string;
  executedTxHash?: BytesLike;
  cancelledTxHash?: BytesLike;
}
