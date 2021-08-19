import { useCallback, useState } from "react";
import { BigNumber } from "@ethersproject/bignumber";
import { parseUnits } from "@ethersproject/units";
import { useWeb3 } from "../web3";
import useInterval from "./useInterval";
import { isEthereumChain } from "@gelatonetwork/limit-orders-lib/dist/utils";

export enum ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  MATIC = 137,
  FANTOM = 250,
}

const GAS_STATION = {
  [ChainId.MAINNET]: "https://www.gasnow.org/api/v3/gas/price",
  [ChainId.ROPSTEN]: undefined,
  [ChainId.MATIC]: "https://gasstation-mainnet.matic.network",
  [ChainId.FANTOM]: undefined,
};

const ADD_BUFFER = {
  [ChainId.MAINNET]: true,
  [ChainId.ROPSTEN]: false,
  [ChainId.MATIC]: false,
  [ChainId.FANTOM]: false,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseGasPrice = (data: any, chainId: ChainId): BigNumber => {
  const buffer = ADD_BUFFER[chainId]
    ? parseUnits("5", "gwei")
    : parseUnits("0", "gwei");
  const gasPriceWithBuffer = data.fast
    ? parseUnits(data.fast.toString(), "gwei")
    : BigNumber.from(data.data.fast).add(buffer);
  return gasPriceWithBuffer;
};

export default function useGasPrice(): number | undefined {
  const { chainId } = useWeb3();
  const [gasPrice, setGasPrice] = useState<number>();

  const gasPriceCallback = useCallback(() => {
    if (chainId && GAS_STATION[chainId as ChainId]) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      fetch(GAS_STATION[chainId as ChainId]!)
        .then((res) => {
          res.json().then((gasInfo) => {
            setGasPrice(parseGasPrice(gasInfo, chainId).toNumber());
          });
        })
        .catch((error) =>
          console.error(
            `Failed to get gas price for chainId: ${chainId}`,
            error
          )
        );
    }
  }, [chainId, setGasPrice]);

  useInterval(
    gasPriceCallback,
    chainId && isEthereumChain(chainId)
      ? 15000
      : chainId && GAS_STATION[chainId as ChainId]
      ? 60000
      : null
  );

  return gasPrice;
}
