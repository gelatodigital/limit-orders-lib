import { providers } from "ethers";
import { getGelatoPineCoreAddr } from "./constants";
import { GelatoPineCore, GelatoPineCore__factory } from "./contracts/types";

// cannot name parameter provider
export const getGelatoPineCore = async (
  _provider: providers.Provider
): Promise<GelatoPineCore> => {
  return GelatoPineCore__factory.connect(
    await getGelatoPineCoreAddr((await _provider.getNetwork()).chainId),
    _provider
  );
};
