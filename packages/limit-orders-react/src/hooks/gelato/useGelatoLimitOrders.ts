import { useMemo } from "react";
import { ChainId, GelatoLimitOrders } from "@gelatonetwork/limit-orders-lib";
import useGasPrice from "../useGasPrice";
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
  gasPrice: number | undefined;
  handlers: GelatoLimitOrdersHandlers;
  derivedOrderInfo: DerivedOrderInfo;
  orderState: OrderState;
  // history: GelatoLimitOrdersHistory;
} {
  const { chainId, library: provider } = useWeb3();

  const derivedOrderInfo = useDerivedOrderInfo();

  const gasPrice = useGasPrice();

  const library = useMemo(() => {
    try {
      return chainId && provider
        ? new GelatoLimitOrders(chainId as ChainId, provider?.getSigner())
        : undefined;
    } catch (error) {
      console.error("Could not instantiate GelatoLimitOrders");
      return undefined;
    }
  }, [chainId, provider]);

  const orderState = useOrderState();

  const handlers = useGelatoLimitOrdersHandlers();

  return {
    library,
    gasPrice,
    handlers,
    derivedOrderInfo,
    orderState,
  };
}
