import { useMemo } from "react";
import { ChainId, GelatoLimitOrders } from "@gelatonetwork/limit-orders-lib";
import useGelatoLimitOrdersHandlers, {
  GelatoLimitOrdersHandlers,
} from "./useGelatoLimitOrdersHandlers";
import {
  DerivedOrderInfo,
  useDerivedOrderInfo,
  useOrderState,
} from "../../state/gorder/hooks";
import { OrderState } from "../../state/gorder/reducer";
import { useWeb3 } from "../../web3";

export default function useGelatoLimitOrders(): {
  library: GelatoLimitOrders | undefined;
  handlers: GelatoLimitOrdersHandlers;
  derivedOrderInfo: DerivedOrderInfo;
  orderState: OrderState;
} {
  const { chainId, library: provider, venue } = useWeb3();

  const derivedOrderInfo = useDerivedOrderInfo();

  const library = useMemo(() => {
    try {
      return chainId && provider
        ? new GelatoLimitOrders(
            chainId as ChainId,
            provider?.getSigner(),
            venue
          )
        : undefined;
    } catch (error) {
      console.error("Could not instantiate GelatoLimitOrders");
      return undefined;
    }
  }, [chainId, provider, venue]);

  const orderState = useOrderState();

  const handlers = useGelatoLimitOrdersHandlers();

  return {
    library,
    handlers,
    derivedOrderInfo,
    orderState,
  };
}
