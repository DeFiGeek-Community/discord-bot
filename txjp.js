require("dotenv").config();
const fetch = require("node-fetch");
const express = require("express");
const router = express.Router();
const Big = require("big.js");

const myWalletAddresses = [
  "0x24dd242c3c4061b1fcaa5119af608b56afbaea95",
  "0x153d9dd730083e53615610a0d2f6f95ab5a0bc01",
  "0x4534f4968006ca9eca3bac922022c7ecba066e9e",
  "0xdc94eeeb3260d0b9bf22849e8f5d236d286cdba1",
];

const USERNAME = process.env.ZERION_API_KEY;
const SUB_URL =
  "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer";
const AUTH_HEADER = {
  Authorization: `Basic ${Buffer.from(`${USERNAME}:`).toString("base64")}`,
};
const PARAMS = { method: "GET", headers: AUTH_HEADER };
const TOTAL_COINS = Big(210000);

const getSupplyData = async () => {
  let sum = Big(0);
  const output = [];

  for (const myAddress of myWalletAddresses) {
    const url = `https://api.zerion.io/v1/wallets/${myAddress}/positions/?currency=jpy&sort=value`;
    const response = await fetch(url, PARAMS);
    const json = await response.json();

    for (const obj of json.data) {
      if (obj.attributes.fungible_info.symbol === "BPT-V1") {
        const lpTokenAddress =
          obj.attributes.fungible_info.implementations[0].address;
        const lpTokenQuery = `
            query {
              pool(id: "${lpTokenAddress}") {
              totalShares
              tokens {
                  symbol
                  balance
                }
              }
            }
            `;
        const response = await fetch(SUB_URL, {
          method: "post",
          body: JSON.stringify({ query: lpTokenQuery }),
          headers: { "Content-Type": "application/json" },
        });
        const lpTokenJson = await response.json();

        for (const token of lpTokenJson.data.pool.tokens) {
          const underlyingToken = token.symbol;
          const underlyingTokenBalance = Big(token.balance)
            .times(obj.attributes.quantity.numeric)
            .div(lpTokenJson.data.pool.totalShares);
          if (underlyingToken === "TXJP") {
            output.push(underlyingTokenBalance);
          }
        }
      } else if (obj.attributes.fungible_info.symbol === "TXJP") {
        output.push(Big(obj.attributes.quantity.numeric));
      }
    }
  }

  for (const number of output) {
    sum = sum.plus(number);
  }

  return sum;
};

router.get("/", async (req, res) => {
  const q = req.query.q;
  let value;
  if (q === "totalcoins") {
    value = TOTAL_COINS;
  } else if (q === "circulating") {
    const circulatingSupply = await getSupplyData();
    value = TOTAL_COINS.minus(circulatingSupply);
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
