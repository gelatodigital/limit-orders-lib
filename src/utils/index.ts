import { ETH_ADDRESS } from "../constants";

export const isNetworkGasToken = (token: string): boolean => {
  if (token.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
    return true;
  } else {
    return false;
  }
};
