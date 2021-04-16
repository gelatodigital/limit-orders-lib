import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";

import { providers, Signer } from "ethers";
import {
  cancelLimitOrderPayload,
  getLimitOrderPayload,
  getLimitOrderPayloadWithSecret,
} from "../src/index";
import { ethers, network, waffle } from "hardhat";

chai.use(solidity);

const GELATO_PINE_CORE: string = "0x36049D479A97CdE1fC6E2a5D2caE30B666Ebf92B";
const LIMIT_ORDER_MODULE: string = "0x36049D479A97CdE1fC6E2a5D2caE30B666Ebf92B";
const ETH: string = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DAI: string = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const UNI: string = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";

describe("Test Limit Orders Submission", async function () {
  this.timeout(0);
  if (network.name !== "hardhat") {
    console.error("Test Suite is meant to be run on hardhat only");
    process.exit(1);
  }

  let userAddress: string;
  let userWallet: Signer;

  beforeEach(async function () {
    [userWallet] = await ethers.getSigners();
  });

  it("#1: ETh to DAI Task Submission should work", async function () {
    await expect(
      getLimitOrderPayload(
        userWallet.provider,
        ETH,
        DAI,
        ethers.utils.parseEther("3"),
        ethers.utils.parseUnits("6000", 18),
        await userWallet.getAddress()
      )
    ).to.not.throw;
  });

  it("#2: DAI to UNI Task Submission should work", async function () {
    await expect(
      getLimitOrderPayload(
        userWallet.provider,
        DAI,
        UNI,
        ethers.utils.parseUnits("3000", 18),
        ethers.utils.parseUnits("20", 18),
        await userWallet.getAddress()
      )
    ).to.not.throw;
  });

  it("#3: Should Cancel a previous order", async function () {
    const transactionDataWithSecret = await getLimitOrderPayloadWithSecret(
      userWallet.provider,
      ETH,
      UNI,
      ethers.utils.parseUnits("3000", 18),
      ethers.utils.parseUnits("20", 18),
      await userWallet.getAddress()
    );

    let transactionData = transactionDataWithSecret.txData;

    userWallet.sendTransaction({
      to: transactionData.to,
      data: transactionData.data,
      value: transactionData.value,
    });

    transactionData = await cancelLimitOrderPayload(
      userWallet.provider as providers.Provider,
      DAI,
      UNI,
      ethers.utils.parseUnits("3000", 18),
      await userWallet.getAddress(),
      (await transactionDataWithSecret).witness
    );

    await expect(
      userWallet.sendTransaction({
        to: transactionData.to,
        data: transactionData.data,
        value: transactionData.value,
      })
    ).to.not.reverted;
  });

  // it("DAI to DAI Task Submission should not work", async function () {
  //   await expect(
  //     getLimitOrderPayload(
  //       userWallet,
  //       DAI,
  //       DAI,
  //       await userWallet.getAddress(),
  //       ethers.utils.parseUnits("3000", 18),
  //       ethers.utils.parseUnits("20", 18)
  //     )
  //   ).to.be.throw(() => "currency 1 is equal to currency 2");
  // });
});
