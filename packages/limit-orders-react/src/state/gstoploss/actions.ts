import { createAction } from "@reduxjs/toolkit";

export enum Field {
  INPUT = "INPUT",
  OUTPUT = "OUTPUT",
  PRICE = "PRICE",
}

export enum Rate {
  MUL = "MUL",
  DIV = "DIV",
}

export const selectCurrency = createAction<{
  field: Field;
  currencyId: string;
}>("gstoploss/selectCurrency");
export const switchCurrencies = createAction<void>("gstoploss/switchCurrencies");
export const typeInput = createAction<{ field: Field; typedValue: string }>(
  "gstoploss/typeInput"
);
export const setRecipient = createAction<{ recipient: string | null }>(
  "gstoploss/setRecipient"
);
export const setRateType = createAction<{ rateType: Rate }>(
  "gstoploss/setRateType"
);

export const setSlippage = createAction<{ slippage: string }>(
  "gstoploss/setSlippage"
)
