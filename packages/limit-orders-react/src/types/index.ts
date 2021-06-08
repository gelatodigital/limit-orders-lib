export enum Field {
  INPUT = "INPUT",
  OUTPUT = "OUTPUT",
  PRICE = "PRICE",
}

export const NativeCurrency = {
  1: "ETH",
  3: "ETH",
  137: "MATIC",
};

export interface LimitOrderState {
  readonly independentField: Field;
  readonly typedValue: string;
  readonly inputValue?: string;
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined;
  };
  readonly [Field.OUTPUT]: {
    readonly currencyId: string | undefined;
  };
}

// We use this address to define a native currency in all chains
export const NATIVE_CURRENCY = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
