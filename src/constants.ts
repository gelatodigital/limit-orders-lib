import { providers } from "ethers";

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

export const getGelatoPineCoreAddr = async (
  provider: providers.Provider
): Promise<string> => {
  return (await provider.getNetwork()).chainId === 1
    ? MAINNET_GELATOPINECORE
    : ROPSTEN_GELATOPINECORE;
};

export const getLimitOrderModule = async (
  provider: providers.Provider
): Promise<string> => {
  return (await provider.getNetwork()).chainId === 1
    ? MAINNET_LIMIT_ORDER_MODULE
    : ROPSTEN_LIMIT_ORDER_MODULE;
}

export const getSubgraphUrl = (
  chainId: string
): string => {
  return chainId === "1"
    ? MAINNET_SUBGRAPH_URL
    : ROPSTEN_SUBGRAPH_URL;
}
