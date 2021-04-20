import { HardhatUserConfig } from "hardhat/config";

// Plugins
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";

// Process Env Variables
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

const config: HardhatUserConfig = {
  networks: { hardhat: { chainId: 1 } },
};

export default config;
