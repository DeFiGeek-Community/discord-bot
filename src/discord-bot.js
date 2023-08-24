const fetch = require("node-fetch");
const Discord = require("discord.js");
const fuseUtilRun = require("./fuse.js");
const txjpPriceRun = require("./txjp.js");
const crvPriceRun = require("./curve/crv.js");
const currencies = {
  compound: {
    name: "compound",
    precisions: [1e18, 1e6],
  },
  usdt: {
    name: "usdt",
    precisions: [1e18, 1e6, 1e6],
  },
  y: {
    name: "y",
    precisions: [1e18, 1e6, 1e6, 1e18],
  },
  busd: {
    name: "busd",
    precisions: [1e18, 1e6, 1e6, 1e18],
  },
  susd: {
    name: "susd",
    precisions: [1e18, 1e6, 1e6, 1e18],
  },
  pax: {
    name: "pax",
    precisions: [1e18, 1e6, 1e6, 1e18],
  },
  rens: {
    name: "rens",
    precisions: [1e8, 1e8, 1e18],
  },
  ren2: {
    name: "ren2",
    precisions: [1e8, 1e8],
  },
  hbtc: {
    name: "hbtc",
    precisions: [1e18, 1e8],
  },
  "3pool": {
    name: "3pool",
    precisions: [1e18, 1e6, 1e6],
  },
  gusd: {
    name: "gusd",
    precisions: [1e2, 1e18, 1e6, 1e6],
    wrappedPrecisions: [1e2, 1e18],
  },
  husd: {
    name: "husd",
    precisions: [1e8, 1e18, 1e6, 1e6],
    wrappedPrecisions: [1e8, 1e18],
  },
  usdk: {
    name: "usdk",
    precisions: [1e18, 1e18, 1e6, 1e6],
    wrappedPrecisions: [1e18, 1e18],
  },
  usdk: {
    name: "usdk",
    precisions: [1e18, 1e18, 1e6, 1e6],
    wrappedPrecisions: [1e18, 1e18],
  },
  usdn: {
    name: "usdn",
    precisions: [1e18, 1e18, 1e6, 1e6],
    wrappedPrecisions: [1e18, 1e18],
  },
  linkusd: {
    name: "linkusd",
    precisions: [1e18, 1e18, 1e6, 1e6],
    wrappedPrecisions: [1e18, 1e18],
  },
  musd: {
    name: "musd",
    precisions: [1e18, 1e18, 1e6, 1e6],
    wrappedPrecisions: [1e18, 1e18],
  },
  rsv: {
    name: "rsv",
    precisions: [1e18, 1e18, 1e6, 1e6],
    wrappedPrecisions: [1e18, 1e18],
  },
  ust: {
    name: "ust",
    precisions: [1e18, 1e18, 1e6, 1e6],
    wrappedPrecisions: [1e18, 1e18],
  },
  tbtc: {
    name: "tbtc",
    precisions: [1e18, 1e8, 1e8, 1e18],
    wrappedPrecisions: [1e18, 1e18],
  },
  dusd: {
    name: "dusd",
    precisions: [1e18, 1e18, 1e6, 1e6],
    wrappedPrecisions: [1e18, 1e18],
  },
  pbtc: {
    name: "pbtc",
    precisions: [1e18, 1e8, 1e8, 1e18],
    wrappedPrecisions: [1e18, 1e18],
  },
  bbtc: {
    name: "bbtc",
    precisions: [1e8, 1e8, 1e8, 1e18],
    wrappedPrecisions: [1e8, 1e18],
  },
  obtc: {
    name: "obtc",
    precisions: [1e18, 1e8, 1e8, 1e18],
    wrappedPrecisions: [1e18, 1e18],
  },
  eurs: {
    name: "eurs",
    precisions: [1e2, 1e18],
  },
  seth: {
    name: "seth",
    precisions: [1e18, 1e18],
  },
  aave: {
    name: "aave",
    precisions: [1e18, 1e6, 1e6],
  },
  steth: {
    name: "steth",
    precisions: [1e18, 1e18],
  },
  ankreth: {
    name: "ankreth",
    precisions: [1e18, 1e18],
  },
  reth: {
    name: "reth",
    precisions: [1e18, 1e18],
  },
  lusd: {
    name: "lusd",
    precisions: [1e18, 1e18, 1e6, 1e6],
    wrappedPrecisions: [1e18, 1e18],
  },
  alusd: {
    name: "alusd",
    precisions: [1e18, 1e18, 1e6, 1e6],
    wrappedPrecisions: [1e18, 1e18],
  },
  usdp: {
    name: "usdp",
    precisions: [1e18, 1e18, 1e6, 1e6],
    wrappedPrecisions: [1e18, 1e18],
  },
  ib: {
    name: "ib",
    precisions: [1e18, 1e6, 1e6],
  },
  saave: {
    name: "saave",
    precisions: [1e18, 1e18],
  },
  frax: {
    name: "frax",
    precisions: [1e18, 1e18, 1e6, 1e6],
    wrappedPrecisions: [1e18, 1e18],
  },
  busdv2: {
    name: "busdv2",
    precisions: [1e18, 1e18, 1e6, 1e6],
    wrappedPrecisions: [1e18, 1e18],
  },
  tusd: {
    name: "tusd",
    precisions: [1e18, 1e18, 1e6, 1e6],
    wrappedPrecisions: [1e18, 1e18],
  },
};

const btcPool = ["ren2", "rens", "hbtc", "tbtc", "pbtc", "bbtc", "obtc"];
const ethPool = ["seth", "steth", "ankreth", "reth"];
const eurPool = ["eurs"];
const lists = [
  "compound",
  "usdt",
  "y",
  "busd",
  "susd",
  "pax",
  "ren2",
  "rens",
  "hbtc",
  "3pool",
  "gusd",
  "husd",
  "usdk",
  "usdn",
  "linkusd",
  "musd",
  "rsv",
  "tbtc",
  "dusd",
  "pbtc",
  "bbtc",
  "obtc",
  "eurs",
  "seth",
  "aave",
  "steth",
  "ust",
  "ankreth",
  "reth",
  "lusd",
  "alusd",
  "usdp",
  "ib",
  "saave",
  "frax",
  "busdv2",
  "tusd",
];

const getVolume = async (minute, period) => {
  let volume = 0;
  const bitcoinPriceRes = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
  );
  const bitcoinPrice = (await bitcoinPriceRes.json()).bitcoin.usd;
  const ethPriceRes = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
  );
  const ethPrice = (await ethPriceRes.json()).ethereum.usd;
  const eurPriceRes = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=stasis-eurs&vs_currencies=usd"
  );
  const eurPrice = (await eurPriceRes.json())["stasis-eurs"].usd;
  const now = Date.now();
  for (let i = 0; i < lists.length; i++) {
    const res = await fetch(
      `https://stats.curve.fi/raw-stats/${lists[i]}-${minute}m.json`
    );
    const json = await res.json();
    const weeklyData = json.filter(
      (value) => value.timestamp > now / 1000 - period * 86400
    );
    const precisions = currencies[lists[i]].precisions;
    weeklyData.forEach((data) => {
      for (const [key, value] of Object.entries(data.volume)) {
        let fixed1 = 0;
        const splitedKey = key.split("-");
        fixed1 = btcPool.includes(lists[i])
          ? (value[Number(fixed1)] / precisions[splitedKey[0]]) * bitcoinPrice
          : ethPool.includes(lists[i])
          ? (value[Number(fixed1)] / precisions[splitedKey[0]]) * ethPrice
          : eurPool.includes(lists[i])
          ? (value[Number(fixed1)] / precisions[splitedKey[0]]) * eurPrice
          : value[Number(fixed1)] / precisions[splitedKey[0]];
        volume = volume + fixed1;
      }
    });
  }
  return volume;
};

const getTVL = async () => {
  let tvl = 0;
  const bitcoinPriceRes = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
  );
  const bitcoinPrice = (await bitcoinPriceRes.json()).bitcoin.usd;
  const ethPriceRes = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
  );
  const ethPrice = (await ethPriceRes.json()).ethereum.usd;
  const eurPriceRes = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=stasis-eurs&vs_currencies=usd"
  );
  const eurPrice = (await eurPriceRes.json())["stasis-eurs"].usd;
  for (let i = 0; i < lists.length; i++) {
    const res = await fetch(
      `https://stats.curve.fi/raw-stats/${lists[i]}-1m.json`
    );
    const json = await res.json();
    const lastData = json[json.length - 3];
    const precisions =
      currencies[lists[i]].wrappedPrecisions || currencies[lists[i]].precisions;
    if (lastData.balances && lastData.rates) {
      lastData.balances.forEach((currentBalance, index) => {
        const balanceFixed = btcPool.includes(lists[i])
          ? (((currentBalance / precisions[index]) * lastData.rates[index]) /
              1e18) *
            bitcoinPrice
          : ethPool.includes(lists[i])
          ? (((currentBalance / precisions[index]) * lastData.rates[index]) /
              1e18) *
            ethPrice
          : eurPool.includes(lists[i])
          ? (((currentBalance / precisions[index]) * lastData.rates[index]) /
              1e18) *
            eurPrice
          : ((currentBalance / precisions[index]) * lastData.rates[index]) /
            1e18;
        tvl =
          currencies[lists[i]].wrappedPrecisions && index == 1
            ? tvl
            : tvl + balanceFixed;
      });
    }
  }
  return tvl;
};

const discordBotRun = () => {
  crvPriceRun();
  fuseUtilRun();
  txjpPriceRun();
};

module.exports = discordBotRun;
