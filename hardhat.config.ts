import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";

// Libraries
const assert = require("assert");
// Process Env Variables
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });
// const INFURA_ID = process.env.INFURA_ID;
// assert.ok(INFURA_ID, "no Infura ID in process.env");
const ALCHEMY_ID = process.env.ALCHEMY_ID;
assert.ok(ALCHEMY_ID, "no Alchemy ID in process.env");

import { mainnetDeployment } from "./hardhat/mainnet/mainnetDeployments";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      // Standard config
      // timeout: 150000,
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ID}`,
        blockNumber: 12244294,
      },
      chainId: 1,
      // Accounts
      accounts: {
        accountsBalance: "10000000000000000000000000",
      },
      // Custom
      ...mainnetDeployment,
    },
  },
  solidity: "0.7.3",
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};

export default config;
