export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const MAINNET_GELATOPINECORE =
  "0x36049D479A97CdE1fC6E2a5D2caE30B666Ebf92B";
export const MAINNET_LIMIT_ORDER_MODULE =
  "0x037fc8e71445910e1E0bBb2a0896d5e9A7485318";
export const MAINNET_SUBGRAPH_URL =
  "https://api.thegraph.com/subgraphs/name/gelatodigital/limit-orders";

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
      throw Error("GelatoPine is not available on Rinkeby");
    }
    case 5: {
      throw Error("GelatoPine is not available on Görli");
    }
    case 42: {
      throw Error("GelatoPine is not available on Kovan");
    }
    default: {
      throw Error("undefined network");
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
      throw Error("Gelato Limit Orders not available on Rinkeby");
    }
    case 5: {
      throw Error("Gelato Limit Orders not available on Görli");
    }
    case 42: {
      throw Error("Gelato Limit Orders not available on Kovan");
    }
    default: {
      throw Error("undefined network");
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
      throw Error("Subgraph not available on Rinkeby");
    }
    case 5: {
      throw Error("Subgraph not available on Görli");
    }
    case 42: {
      throw Error("Subgraph not available on Kovan");
    }
    default: {
      throw Error("undefined network");
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
    default: {
      throw Error("undefined network");
    }
  }
};
