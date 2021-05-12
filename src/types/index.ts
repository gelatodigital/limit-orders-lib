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
  inputToken: string;
  outputToken: string;
  inputAmount: BigNumber;
  minReturn: BigNumber;
  bought: BigNumber;
  status: string;
  cancelledTxHash: BytesLike;
  executedTxHash: BytesLike;
  updatedAt: string;
}
