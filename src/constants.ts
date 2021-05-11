export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
//export const MATIC_ADDRESS = "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0";

export const isNetworkGasToken = (token: string): boolean => {
  if (token.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
    return true;
  } else {
    return false;
  }
};

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
    case 1: {
      return MAINNET_GELATOPINECORE;
    }
    case 3: {
      return ROPSTEN_GELATOPINECORE;
    }
    case 4: {
      throw new Error("GelatoPineCore is not available on Rinkeby");
    }
    case 5: {
      throw new Error("GelatoPineCore is not available on Görli");
    }
    case 42: {
      throw new Error("GelatoPineCore is not available on Kovan");
    }
    case 137: {
      return MATIC_GELATOPINECORE;
    }
    case 80001: {
      throw new Error("GelatoPineCore is not available on Mumbai");
    }
    default: {
      throw new Error("NETWORK NOT SUPPORTED");
    }
  }
};

export const getLimitOrderModuleAddr = (chainId: number): string => {
  switch (chainId) {
    case 1: {
      return MAINNET_LIMIT_ORDER_MODULE;
    }
    case 3: {
      return ROPSTEN_LIMIT_ORDER_MODULE;
    }
    case 4: {
      throw new Error("Gelato Limit Orders not available on Rinkeby");
    }
    case 5: {
      throw new Error("Gelato Limit Orders not available on Görli");
    }
    case 42: {
      throw new Error("Gelato Limit Orders not available on Kovan");
    }
    case 137: {
      return MATIC_LIMIT_ORDER_MODULE;
    }
    case 80001: {
      throw new Error("Gelato Limit Orders is not available on Mumbai");
    }
    default: {
      throw new Error("NETWORK NOT SUPPORTED");
    }
  }
};

export const getSubgraphUrl = (chainId: number): string => {
  switch (chainId) {
    case 1: {
      return MAINNET_SUBGRAPH_URL;
    }
    case 3: {
      return ROPSTEN_SUBGRAPH_URL;
    }
    case 4: {
      throw new Error("Subgraph not available on Rinkeby");
    }
    case 5: {
      throw new Error("Subgraph not available on Görli");
    }
    case 42: {
      throw new Error("Subgraph not available on Kovan");
    }
    case 137: {
      return MATIC_SUBGRAPH_URL;
    }
    case 80001: {
      throw new Error("Subgraph is not available on Mumbai");
    }
    default: {
      throw new Error("NETWORK NOT SUPPORTED");
    }
  }
};

export const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case 1: {
      return "homestead";
    }
    case 3: {
      return "ropsten";
    }
    case 4: {
      return "rinkeby";
    }
    case 5: {
      return "goerli";
    }
    case 42: {
      return "kovan";
    }
    case 137: {
      return "matic";
    }
    case 80001: {
      return "mumbai";
    }
    default: {
      throw new Error("NETWORK NOT SUPPORTED");
    }
  }
};
