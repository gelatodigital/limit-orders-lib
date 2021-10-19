import { useMemo } from "react";
import { ChainId, GelatoLimitOrders } from "@gelatonetwork/limit-orders-lib";
import { useWeb3 } from "../../web3";

export default function useGelatoLimitOrdersLib():
  | GelatoLimitOrders
  | undefined {
  const { chainId, library, handler, isFlashbotsProtected } = useWeb3();

  return useMemo(() => {
    try {
      return chainId && library
        ? new GelatoLimitOrders(
            chainId as ChainId,
            library?.getSigner(),
            handler,
            isFlashbotsProtected
          )
        : undefined;
    } catch (error) {
      console.error(
        `Could not instantiate GelatoLimitOrders: ${error.message}`
      );
      return undefined;
    }
  }, [chainId, library, handler, isFlashbotsProtected]);
}
