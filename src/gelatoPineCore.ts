import { MAINNET_GELATOPINECORE, ROPSTEN_GELATOPINECORE } from "./constants";
import { ethers, providers } from "ethers";
import { GelatoPineCore__factory } from "./types/factories/GelatoPineCore__factory";

export const getGelatoPineCore = async (
  providers: providers.Provider | undefined
): Promise<ethers.Contract> => {
  if (!providers) throw "Provider missing";
  return GelatoPineCore__factory.connect(
    (await providers.getNetwork())?.chainId == 1
      ? MAINNET_GELATOPINECORE
      : ROPSTEN_GELATOPINECORE,
    providers
  );
};
