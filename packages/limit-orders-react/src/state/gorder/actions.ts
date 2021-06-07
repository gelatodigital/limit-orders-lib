import { createAction } from "@reduxjs/toolkit";

export enum Field {
  INPUT = "INPUT",
  OUTPUT = "OUTPUT",
  DESIRED_RATE = "DESIRED_RATE",
}

export enum Rate {
  MUL = "MUL",
  DIV = "DIV",
}

export const selectCurrency = createAction<{
  field: Field;
  currencyId: string;
}>("gorder/selectCurrency");
export const switchCurrencies = createAction<void>("gorder/switchCurrencies");
export const typeInput = createAction<{ field: Field; typedValue: string }>(
  "gorder/typeInput"
);
export const replaceOrderState = createAction<{
  field: Field;
  typedValue: string;
  inputCurrencyId?: string;
  outputCurrencyId?: string;
  recipient: string | null;
}>("gorder/replaceSwapState");
export const setRecipient = createAction<{ recipient: string | null }>(
  "gorder/setRecipient"
);
export const setRateType = createAction<{ rateType: Rate }>(
  "gorder/setRateType"
);
