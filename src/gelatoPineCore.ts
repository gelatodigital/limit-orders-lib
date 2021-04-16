import { GelatoPineCore, GelatoPineCore__factory } from "./contracts/types";
import { MAINNET_GELATOPINECORE, ROPSTEN_GELATOPINECORE } from "./constants";
import { providers } from "ethers";

export const getGelatoPineCore = async (
  providers: providers.Provider
): Promise<GelatoPineCore> => {
  return GelatoPineCore__factory.connect(
    (await providers.getNetwork())?.chainId == 1
      ? MAINNET_GELATOPINECORE
      : ROPSTEN_GELATOPINECORE,
    providers
  );
};
