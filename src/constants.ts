export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const isNetworkGasToken = (token: string): boolean => {
  if (token.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
    return true;
  } else {
    return false;
  }
};

export const FEE_BPS = 2; // 0.02%
export const MAX_SLIPPAGE_BPS = 20; // 0.2%

export const FANTOM_GELATOPINECORE =
  "0x05Ad1094Eb6Cde564d732196F6754Ee464896031";
export const FANTOM_LIMIT_ORDER_MODULE =
  "0xf2253BF9a0BD002300cFe6f4E630d755669f6DCa";
export const FANTOM_SUBGRAPH_URL =
  "https://api.thegraph.com/subgraphs/name/gelatodigital/limit-orders-fantom";

export const MAINNET_GELATOPINECORE =
  "0x36049D479A97CdE1fC6E2a5D2caE30B666Ebf92B";
export const MAINNET_LIMIT_ORDER_MODULE =
  "0x037fc8e71445910e1E0bBb2a0896d5e9A7485318";
export const MAINNET_SUBGRAPH_URL =
  "https://api.thegraph.com/subgraphs/name/gelatodigital/limit-orders";

export const MATIC_GELATOPINECORE =
  "0x38c4092b28dAB7F3d98eE6524549571c283cdfA5";
export const MATIC_LIMIT_ORDER_MODULE =
  "0x5A36178E38864F5E724A2DaF5f9cD9bA473f7903";
export const MATIC_SUBGRAPH_URL =
  "https://api.thegraph.com/subgraphs/name/gelatodigital/limit-orders-polygon";

export const ROPSTEN_GELATOPINECORE =
  "0x0e5096D201Fe2985f5C26432A76f145D6e5D1453";
export const ROPSTEN_LIMIT_ORDER_MODULE =
  "0x3f3C13b09B601fb6074124fF8D779d2964caBf8B";
export const ROPSTEN_SUBGRAPH_URL =
  "https://api.thegraph.com/subgraphs/name/gelatodigital/limit-orders-ropsten";

export const getGelatoPineCoreAddr = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return MAINNET_GELATOPINECORE;
    case 3:
      return ROPSTEN_GELATOPINECORE;
    case 137:
      return MATIC_GELATOPINECORE;
    case 250:
      return FANTOM_GELATOPINECORE;
    default:
      throw new Error("NETWORK NOT SUPPORTED");
  }
};

export const getLimitOrderModuleAddr = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return MAINNET_LIMIT_ORDER_MODULE;
    case 3:
      return ROPSTEN_LIMIT_ORDER_MODULE;
    case 137:
      return MATIC_LIMIT_ORDER_MODULE;
    case 250:
      return FANTOM_LIMIT_ORDER_MODULE;
    default:
      throw new Error("NETWORK NOT SUPPORTED");
  }
};

export const getSubgraphUrl = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return MAINNET_SUBGRAPH_URL;
    case 3:
      return ROPSTEN_SUBGRAPH_URL;
    case 137:
      return MATIC_SUBGRAPH_URL;
    case 250:
      return FANTOM_SUBGRAPH_URL;
    default:
      throw new Error("NETWORK NOT SUPPORTED");
  }
};

export const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return "homestead";
    case 3:
      return "ropsten";
    case 137:
      return "matic";
    case 250:
      return "fantom";
    default:
      throw new Error("NETWORK NOT SUPPORTED");
  }
};

export const isL2 = (chainId: number): boolean => {
  switch (chainId) {
    case 1:
      return false;
    case 3:
      return false;
    case 137:
      return true;
    case 250:
      return true;
    default:
      throw new Error("NETWORK NOT SUPPORTED");
  }
};
