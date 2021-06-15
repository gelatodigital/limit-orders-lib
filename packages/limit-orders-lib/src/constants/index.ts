export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const SLIPPAGE_BPS = 40; // 0.4%
export const TWO_BPS_GELATO_FEE = 2; // 0.02%

export const CHAIN_ID = {
  MAINNET: 1,
  ROPSTEN: 3,
  MATIC: 137,
  FANTOM: 250,
};

export const NETWORK_NAME = {
  [CHAIN_ID.MAINNET]: "Ethereum",
  [CHAIN_ID.ROPSTEN]: "Ropsten",
  [CHAIN_ID.MATIC]: "Polygon (Matic)",
  [CHAIN_ID.FANTOM]: "FANTOM",
};

export const NETWORK_VENUES = {
  [CHAIN_ID.MAINNET]: ["uniswap"],
  [CHAIN_ID.ROPSTEN]: ["uniswap"],
  [CHAIN_ID.MATIC]: ["quickswap"],
  [CHAIN_ID.FANTOM]: ["spiritswap", "spookyswap"],
};

export const SUBGRAPH_URL = {
  [CHAIN_ID.MAINNET]:
    "https://api.thegraph.com/subgraphs/name/gelatodigital/limit-orders",
  [CHAIN_ID.ROPSTEN]:
    "https://api.thegraph.com/subgraphs/name/gelatodigital/limit-orders-ropsten",
  [CHAIN_ID.MATIC]:
    "https://api.thegraph.com/subgraphs/name/gelatodigital/limit-orders-polygon",
  [CHAIN_ID.FANTOM]:
    "https://api.thegraph.com/subgraphs/name/gelatodigital/limit-orders-fantom",
};

export const GELATO_LIMIT_ORDERS_ADDRESS = {
  [CHAIN_ID.MAINNET]: "0x36049D479A97CdE1fC6E2a5D2caE30B666Ebf92B",
  [CHAIN_ID.ROPSTEN]: "0x0e5096D201Fe2985f5C26432A76f145D6e5D1453",
  [CHAIN_ID.MATIC]: "0x38c4092b28dAB7F3d98eE6524549571c283cdfA5",
  [CHAIN_ID.FANTOM]: "0x36049D479A97CdE1fC6E2a5D2caE30B666Ebf92B",
};

export const GELATO_LIMIT_ORDERS_MODULE_ADDRESS = {
  [CHAIN_ID.MAINNET]: "0x037fc8e71445910e1E0bBb2a0896d5e9A7485318",
  [CHAIN_ID.ROPSTEN]: "0x3f3C13b09B601fb6074124fF8D779d2964caBf8B",
  [CHAIN_ID.MATIC]: "0x5A36178E38864F5E724A2DaF5f9cD9bA473f7903",
  [CHAIN_ID.FANTOM]: "0x037fc8e71445910e1E0bBb2a0896d5e9A7485318",
};

export const NATIVE_TOKEN_TICKER = {
  [CHAIN_ID.MAINNET]: "ETH",
  [CHAIN_ID.ROPSTEN]: "ETH",
  [CHAIN_ID.MATIC]: "MATIC",
  [CHAIN_ID.FANTOM]: "FTM",
};

export const NATIVE_WRAPPED_TOKEN_TICKER = {
  [CHAIN_ID.MAINNET]: "WETH",
  [CHAIN_ID.ROPSTEN]: "WETH",
  [CHAIN_ID.MATIC]: "WMATIC",
  [CHAIN_ID.FANTOM]: "WFTM",
};

export const NATIVE_TOKEN_NAME = {
  [CHAIN_ID.MAINNET]: "Ether",
  [CHAIN_ID.ROPSTEN]: "Ether",
  [CHAIN_ID.MATIC]: "Matic",
  [CHAIN_ID.MATIC]: "Fantom",
};

export const NATIVE_WRAPPED_TOKEN_ADDRESS = {
  [CHAIN_ID.MAINNET]: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  [CHAIN_ID.ROPSTEN]: "0xc778417e063141139fce010982780140aa0cd5ab",
  [CHAIN_ID.MATIC]: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  [CHAIN_ID.FANTOM]: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83",
};

export const MULTICALL_ADDRESSES = {
  [CHAIN_ID.ROPSTEN]: "0xCa731e0f33Afbcfa9363d6F7449d1f5447d10C80",
  [CHAIN_ID.MAINNET]: "0xCa731e0f33Afbcfa9363d6F7449d1f5447d10C80",
  [CHAIN_ID.MATIC]: "0xCa731e0f33Afbcfa9363d6F7449d1f5447d10C80",
  [CHAIN_ID.FANTOM]: "0x5A36178E38864F5E724A2DaF5f9cD9bA473f7903",
};

export const GENERIC_GAS_LIMIT_ORDER_EXECUTION = "400000";
