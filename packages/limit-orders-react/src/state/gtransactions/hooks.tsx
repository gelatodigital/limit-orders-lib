import { TransactionResponse } from "@ethersproject/providers";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import { useWeb3 } from "../../web3";
import { AppDispatch, AppState } from "../index";
import { addTransaction, TransactionType } from "./actions";
import { TransactionDetails } from "./reducer";

// helper that can take a ethers library transaction response and add it to the list of transactions
export function useTransactionAdder(): (
  response: TransactionResponse,
  customData?: {
    summary?: string;
    type: TransactionType;
  }
) => void {
  const { chainId, account } = useWeb3();
  const dispatch = useDispatch<AppDispatch>();

  return useCallback(
    (
      response: TransactionResponse,
      {
        summary,
        type,
      }: {
        summary?: string;
        type: TransactionType;
      } = { type: "submission" }
    ) => {
      if (!account) return;
      if (!chainId) return;

      const { hash } = response;
      if (!hash) {
        throw Error("No transaction hash found.");
      }
      dispatch(
        addTransaction({
          hash,
          from: account,
          chainId,
          type,
          summary,
        })
      );
    },
    [dispatch, chainId, account]
  );
}

// returns all the transactions for the current chain
export function useAllTransactions(): { [txHash: string]: TransactionDetails } {
  const { chainId } = useWeb3();

  const state = useSelector<AppState, AppState["gtransactions"]>(
    (state) => state.gtransactions
  );

  return chainId ? state[chainId] ?? {} : {};
}

export function useIsTransactionPending(transactionHash?: string): boolean {
  const transactions = useAllTransactions();

  if (!transactionHash || !transactions[transactionHash]) return false;

  return !transactions[transactionHash].receipt;
}

/**
 * Returns whether a transaction happened in the last day (86400 seconds * 1000 milliseconds / second)
 * @param tx to check for recency
 */
export function isTransactionRecent(tx: TransactionDetails): boolean {
  return new Date().getTime() - tx.addedTime < 86_400_000;
}
