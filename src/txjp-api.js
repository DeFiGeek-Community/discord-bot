const Keyv = require("keyv");
const cache = new Keyv();
const cron = require("node-cron");

require("dotenv").config();

const { Web3 } = require("web3");
const web3 = new Web3(process.env.INFURA_URL);

const express = require("express");
const router = express.Router();

const Big = require("big.js");
const TOTAL_COINS = Big(210000);

const myWalletAddresses = [
  "0x24dd242c3c4061b1fcaa5119af608b56afbaea95",
  "0x153d9dd730083e53615610a0d2f6f95ab5a0bc01",
  "0x4534f4968006ca9eca3bac922022c7ecba066e9e",
  "0xdc94eeeb3260d0b9bf22849e8f5d236d286cdba1",
];
const txjpAddress = "0x961dD84059505D59f82cE4fb87D3c09bec65301d";
const uniV3NFTAddress = ["0xA9166690c35d900a57D2ec132C58291bC0678944"]; // add new V3 position address in array if any
const balV1Contract = process.env.BALANCERV1_TOKEN_CONTRACT_ADDRESS;
const balV2TokenContract = process.env.BALANCER_TOKEN_CONTRACT_ADDRESS;
const balV2VaultContract = process.env.BALANCER_VAULT_CONTRACT_ADDRESS;
const balV2PoolAddress = process.env.BALANCER_POOL_CONTRACT_ADDRESS;
const balancerV1Abi = require("../abi/balancerV1Token.json");
const balancerV2TokenAbi = require("../abi/balancerV2Token.json");
const balancerV2VaultAbi = require("../abi/balancer.json");
const balanceOfAbi = require("../abi/balanceOf.json");

async function calculateAndCacheDaoBalance() {
  const walletBalance = await getWalletBalance();
  const balV1Balance = await getBalV1Balance();
  const balV2Balance = await getBalV2Balance();
  const uniV3Balance = await getUniV3Balance();

  const sum = walletBalance
    .plus(balV1Balance)
    .plus(balV2Balance)
    .plus(uniV3Balance);

  await cache.set("daoBalance", sum.toNumber());

  console.log("Dao Balance calculated and cached.");
}

cron.schedule("0 * * * *", async () => {
  await calculateAndCacheDaoBalance();
});

async function getWalletBalance() {
  let sum = new Big(0);
  for (const address of myWalletAddresses) {
    const balanceOf = await new web3.eth.Contract(
      balanceOfAbi,
      txjpAddress
    ).methods
      .balanceOf(address)
      .call();
    const balance = new Big(balanceOf);
    sum = sum.plus(balance.div(10 ** 8));
  }
  return sum;
}

async function getBalV1Balance() {
  let sum = new Big(0);
  const getBalance = await new web3.eth.Contract(
    balancerV1Abi,
    balV1Contract
  ).methods
    .getBalance(txjpAddress)
    .call();
  const totalSupply = await new web3.eth.Contract(
    balancerV1Abi,
    balV1Contract
  ).methods
    .totalSupply()
    .call();
  for (const address of myWalletAddresses) {
    const balanceOf = await new web3.eth.Contract(
      balancerV1Abi,
      balV1Contract
    ).methods
      .balanceOf(address)
      .call();
    const balance = new Big(balanceOf);
    const result = new Big(getBalance)
      .times(balance)
      .div(totalSupply)
      .div(10 ** 8);
    sum = sum.plus(result);
  }
  return sum;
}

async function getBalV2Balance() {
  let sum = new Big(0);
  const totalSupply = await new web3.eth.Contract(
    balancerV2TokenAbi,
    balV2TokenContract
  ).methods
    .totalSupply()
    .call();
  const getPoolTokenInfo = await new web3.eth.Contract(
    balancerV2VaultAbi,
    balV2VaultContract
  ).methods
    .getPoolTokenInfo(balV2PoolAddress, txjpAddress)
    .call();
  for (const address of myWalletAddresses) {
    const balanceOf = await new web3.eth.Contract(
      balancerV2TokenAbi,
      balV2TokenContract
    ).methods
      .balanceOf(address)
      .call();
    const balance = new Big(balanceOf);
    const result = new Big(getPoolTokenInfo.cash)
      .times(balance)
      .div(totalSupply)
      .div(10 ** 8);
    sum = sum.plus(result);
  }
  return sum;
}

async function getUniV3Balance() {
  let sum = new Big(0);
  for (const address of uniV3NFTAddress) {
    const result = await new web3.eth.Contract(
      balanceOfAbi,
      txjpAddress
    ).methods
      .balanceOf(address)
      .call();
    const balance = new Big(result);
    sum = sum.plus(balance.div(10 ** 8));
  }
  return sum;
}

router.get("/", async (req, res) => {
  const q = req.query.q;
  let value;
  if (q === "totalcoins") {
    value = TOTAL_COINS;
  } else if (q === "circulating") {
    const cachedDaoBalance = await cache.get("daoBalance");
    if (cachedDaoBalance !== undefined) {
      value = TOTAL_COINS.minus(cachedDaoBalance);
    } else {
      await calculateAndCacheDaoBalance();
      const updatedCachedDaoBalance = await cache.get("daoBalance");
      value = TOTAL_COINS.minus(updatedCachedDaoBalance);
    }
  } else {
    const error = {
      message:
        "Invalid parameter value. Please specify either 'totalcoins' or 'circulating'.",
    };
    return res.status(400).json(error);
  }

  res.json(Number(value));
});

module.exports = router;
