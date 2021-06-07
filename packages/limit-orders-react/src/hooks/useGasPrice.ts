import { useCallback, useState } from "react";
import { BigNumber } from "@ethersproject/bignumber";
import { parseUnits } from "ethers/lib/utils";
import { useWeb3 } from "../web3";
import useInterval from "./useInterval";

export enum ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  MATIC = 137,
}

const GAS_STATION = {
  [ChainId.MAINNET]: "https://www.gasnow.org/api/v3/gas/price",
  [ChainId.ROPSTEN]: "",
  [ChainId.MATIC]: "https://gasstation-mainnet.matic.network",
};

const ADD_BUFFER = {
  [ChainId.MAINNET]: true,
  [ChainId.ROPSTEN]: false,
  [ChainId.MATIC]: false,
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
  const [gasPrice, setGasPrice] = useState<number>(
    parseUnits("5", "gwei").toNumber()
  );

  const gasPriceCallback = useCallback(() => {
    if (chainId)
      fetch(GAS_STATION[chainId as ChainId])
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
  }, [chainId, setGasPrice]);

  useInterval(gasPriceCallback, chainId === 1 ? 15000 : null);

  return gasPrice;
}
