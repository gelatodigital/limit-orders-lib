import { expect } from "chai";
import { Signer, utils } from "ethers";
import { ethers, network } from "hardhat";
import {
  getCancelLimitOrderPayload,
  getLimitOrderPayload,
  getLimitOrderPayloadWithSecret,
} from "../src/index";

const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const UNI = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984";

describe("Test Limit Orders Submission", async function () {
  this.timeout(0);
  if (network.name !== "hardhat") {
    console.error("Test Suite is meant to be run on hardhat only");
    process.exit(1);
  }

  let userWallet: Signer;

  if (!network.config.chainId) throw Error("No Chain Id");
  const chainId = network.config.chainId;

  before(async function () {
    [userWallet] = await ethers.getSigners();
  });

  it("#1: Eth to DAI Task Submission should work", async function () {
    await expect(
      getLimitOrderPayload(
        chainId,
        ETH,
        DAI,
        utils.parseEther("3"),
        utils.parseUnits("6000", 18),
        await userWallet.getAddress()
      )
    ).to.not.throw;
  });

  it("#2: DAI to UNI Task Submission should work", async function () {
    await expect(
      getLimitOrderPayload(
        chainId,
        DAI,
        UNI,
        utils.parseUnits("3000", 18),
        utils.parseUnits("20", 18),
        await userWallet.getAddress()
      )
    ).to.not.throw;
  });

  it("#3: Should Cancel a previous order", async function () {
    const transactionDataWithSecret = await getLimitOrderPayloadWithSecret(
      chainId,
      ETH,
      UNI,
      utils.parseUnits("3000", 18),
      utils.parseUnits("20", 18),
      await userWallet.getAddress()
    );

    let transactionData = transactionDataWithSecret.txData;

    userWallet.sendTransaction({
      to: transactionData.to,
      data: transactionData.data,
      value: transactionData.value,
    });

    transactionData = await getCancelLimitOrderPayload(
      chainId,
      DAI,
      UNI,
      utils.parseUnits("3000", 18),
      await userWallet.getAddress(),
      (await transactionDataWithSecret).witness
    );

    await expect(
      userWallet.sendTransaction({
        to: transactionData.to,
        data: transactionData.data,
        value: transactionData.value,
      })
    ).to.not.be.reverted;
  });

  // it("DAI to DAI Task Submission should not work", async function () {
  //   await expect(
  //     getLimitOrderPayload(
  //       chainId,
  //       DAI,
  //       await userWallet.getAddress(),
  //       utils.parseUnits("3000", 18),
  //       utils.parseUnits("20", 18),
  //       DAI
  //     )
  //   ).to.be.throw("currency 1 is equal to currency 2");
  // });
});
