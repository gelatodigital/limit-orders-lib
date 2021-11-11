import useGelatoStoplossOrdersHandlers, {
  GelatoStoplossOrdersHandlers,
} from "./useGelatoStoplossOrdersHandlers";
import {
  DerivedOrderInfo,
  useDerivedOrderInfo,
  useOrderState,
} from "../../state/gstoploss/hooks";
import { StoplossOrderState } from "../../state/gstoploss/reducer";

export default function useGelatoLimitOrders(): {
  handlers: GelatoStoplossOrdersHandlers;
  derivedOrderInfo: DerivedOrderInfo;
  orderState: StoplossOrderState;
} {
  const derivedOrderInfo = useDerivedOrderInfo();

  const orderState = useOrderState();

  const handlers = useGelatoStoplossOrdersHandlers();

  return {
    handlers,
    derivedOrderInfo,
    orderState,
  };
}
