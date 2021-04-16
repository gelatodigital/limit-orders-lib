import { GelatoPineCore, GelatoPineCore__factory } from "./contracts/types";
import { getGelatoPineCoreAddr } from "./constants";
import { providers } from "ethers";

export const getGelatoPineCore = async (
  providers: providers.Provider
): Promise<GelatoPineCore> => {
  return GelatoPineCore__factory.connect(
    await getGelatoPineCoreAddr(providers),
    providers
  );
};
