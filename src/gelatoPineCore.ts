import { MAINNET_GELATOPINECORE, ROPSTEN_GELATOPINECORE } from "./constants";
import { ethers } from "ethers";
import {GelatoPineCore__factory} from "./types/factories/GelatoPineCore__factory";

export const getGelatoPineCore = async (
  signer: ethers.Signer
): Promise<ethers.Contract> => {
  return GelatoPineCore__factory.connect(
    (await signer.provider?.getNetwork())?.chainId === 1 ? MAINNET_GELATOPINECORE : ROPSTEN_GELATOPINECORE,
    signer
  );
};
