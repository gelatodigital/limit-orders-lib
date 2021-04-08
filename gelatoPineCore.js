import { GELATOPINECORE } from "./constants";
import { ethers } from "ethers";

const GelatoPineCoreABI = require("./abis/GelatoPineCore.json");

export const getGelatoPineCore = (providerOrSigner) => {
  return new ethers.Contract(
    GELATOPINECORE,
    GelatoPineCoreABI,
    providerOrSigner
  );
};
