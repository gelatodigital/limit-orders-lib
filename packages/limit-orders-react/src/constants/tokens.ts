import { Token } from "@uniswap/sdk-core";

export const UNI_ADDRESS = {
  [1]: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  [5]: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  [4]: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  [3]: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  [137]: "0xb33EaAd8d922B1083446DC23f610c2567fB5180f",
};

export const AMPL = new Token(
  1,
  "0xD46bA6D942050d489DBd938a2C909A5d5039A161",
  9,
  "AMPL",
  "Ampleforth"
);
export const DAI = new Token(
  1,
  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  18,
  "DAI",
  "Dai Stablecoin"
);
export const USDC = new Token(
  1,
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  6,
  "USDC",
  "USD//C"
);
export const USDT = new Token(
  1,
  "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  6,
  "USDT",
  "Tether USD"
);
export const WBTC = new Token(
  1,
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  8,
  "WBTC",
  "Wrapped BTC"
);
export const FEI = new Token(
  1,
  "0x956F47F50A910163D8BF957Cf5846D573E7f87CA",
  18,
  "FEI",
  "Fei USD"
);
export const TRIBE = new Token(
  1,
  "0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B",
  18,
  "TRIBE",
  "Tribe"
);
export const FRAX = new Token(
  1,
  "0x853d955aCEf822Db058eb8505911ED77F175b99e",
  18,
  "FRAX",
  "Frax"
);
export const FXS = new Token(
  1,
  "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0",
  18,
  "FXS",
  "Frax Share"
);
export const renBTC = new Token(
  1,
  "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D",
  8,
  "renBTC",
  "renBTC"
);
export const UMA = new Token(
  1,
  "0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828",
  18,
  "UMA",
  "UMA Voting Token v1"
);
// Mirror Protocol compat.
export const UST = new Token(
  1,
  "0xa47c8bf37f92abed4a126bda807a7b7498661acd",
  18,
  "UST",
  "Wrapped UST"
);
export const MIR = new Token(
  1,
  "0x09a3ecafa817268f77be1283176b946c4ff2e608",
  18,
  "MIR",
  "Wrapped MIR"
);
export const UNI: { [chainId: number]: Token } = {
  [1]: new Token(1, UNI_ADDRESS[1], 18, "UNI", "Uniswap"),
  [4]: new Token(4, UNI_ADDRESS[4], 18, "UNI", "Uniswap"),
  [3]: new Token(3, UNI_ADDRESS[3], 18, "UNI", "Uniswap"),
  [5]: new Token(5, UNI_ADDRESS[5], 18, "UNI", "Uniswap"),
  [137]: new Token(42, UNI_ADDRESS[137], 18, "UNI", "Uniswap"),
};

export const USDC_MATIC = new Token(
  137,
  "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  6,
  "USDC",
  "USD//C"
);
export const DAI_MATIC = new Token(
  137,
  "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
  18,
  "DAI",
  "Dai Stablecoin"
);
export const USDT_MATIC = new Token(
  137,
  "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
  6,
  "USDT",
  "Tether USD"
);
export const WETH_MATIC = new Token(
  137,
  "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
  18,
  "WETH",
  "Wrapped ETH"
);
export const QUICK_MATIC = new Token(
  137,
  "0x831753dd7087cac61ab5644b308642cc1c33dc13",
  18,
  "QUICK",
  "Quickswap"
);
export const WBTC_MATIC = new Token(
  137,
  "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
  8,
  "WBTC",
  "Wrapped BTC"
);
export const WMATIC_MATIC = new Token(
  137,
  "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  18,
  "WMATIC",
  "Wrapped MATIC"
);
export const MATIC_BASES = [
  USDC_MATIC,
  DAI_MATIC,
  USDT_MATIC,
  WETH_MATIC,
  QUICK_MATIC,
  WBTC_MATIC,
  WMATIC_MATIC,
];

export const getBaseTokenLogoURLByTokenSymbol = (
  symbol: string | undefined
): string | undefined => {
  switch (symbol) {
    case "USDC":
      return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png";
    case "DAI":
      return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png";
    case "USDT":
      return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png";
    case "ETH":
    case "WETH":
      return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png";
    case "QUICK":
      return "https://raw.githubusercontent.com/sameepsi/quickswap-interface/master/public/favicon.jpeg";
    case "WBTC":
      return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png";
    case "WMATIC":
    case "MATIC":
      return "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0/logo.png";
    default:
      return undefined;
  }
};
