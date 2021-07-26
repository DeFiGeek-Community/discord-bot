const http = require("http");
const fetch = require("node-fetch");
const Discord = require("discord.js");
const numeral = require("numeral");
require("dotenv").config();
const { request, gql } = require("graphql-request");
const { ethers } = require("ethers");
const balancerPoolAbi = require("./balancer-pool-abi.json");
const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_URL);
http
  .createServer(function (request, response) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Discord bot is active now \n");
  })
  .listen(process.env.PORT || 3000);

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
const metapool = [
  "gusd",
  "husd",
  "usdk",
  "usdn",
  "linkusd",
  "musd",
  "rsv",
  "tbtc",
  "dusd",
  "ust",
  "lusd",
  "alusd",
  "usdp",
  "frax",
  "busdv2",
  "tusd",
];
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
    let poolVolume = 0;
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
        poolVolume = poolVolume + fixed1;
      }
    });
    console.log(currencies[lists[i]], ":", poolVolume);
  }
  return volume;
};

const getTVL = async () => {
  let tvl = 0;
  for (let i = 0; i < lists.length; i++) {
    const res = await fetch(
      `https://stats.curve.fi/raw-stats/${lists[i]}-1m.json`
    );
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

const client = new Discord.Client();
const veCRVBotClient = new Discord.Client();
const crvPriceClient = new Discord.Client();
const txjpPriceClient = new Discord.Client();

client.on("ready", async () => {
  setInterval(async () => {
    const guild = client.guilds.cache.get(process.env.DISCORD_CHANNEL_ID);
    const bot = await guild.members.fetch(
      process.env.DISCORD_TVL_AND_VOLUME_BOT_ID
    );
    const tvl = await getTVL();
    const dailyVolume = await getVolume(30, 1);
    console.log("Volume, tvl : ", dailyVolume, tvl);
    const dailyVolumeFixed = numeral(dailyVolume).format("0a");
    const tvlFixed = numeral(tvl).format("0.00a");
    await bot.setNickname(`Daily Vol: $${dailyVolumeFixed}`);
    await client.user.setActivity(`TVL: $${tvlFixed}`);
  }, 5 * 60 * 1000);
});

veCRVBotClient.on("ready", async () => {
  const guild = veCRVBotClient.guilds.cache.get(process.env.DISCORD_CHANNEL_ID);
  const bot = await guild.members.fetch(process.env.DISCORD_VECRV_BOT_ID);
  const URL = `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2&apikey=${process.env.ETHERSCAN_API_KEY}`;
  setInterval(async () => {
    const res = await fetch(URL);
    const veCRVData = await res.json();
    const veCRV = Math.floor(Number(veCRVData.result) / 10 ** 18);
    const weeklyVolume = await getVolume(1440, 7);
    console.log(
      "veCRV, weeklyVolume, weeklyFee:",
      veCRV,
      weeklyVolume,
      (weeklyVolume * 0.02) / 100
    );
    const veCRVPerYear = (weeklyVolume * 52 * 0.02) / 100 / veCRV;
    await bot.setNickname(`$${veCRVPerYear.toFixed(2)} veCRV/年`);
    const veCRVToFixed = veCRV.toFixed();
    await veCRVBotClient.user.setActivity(
      `total: ${Number(veCRVToFixed).toLocaleString()} veCRV`
    );
  }, 2 * 60 * 1000);
});

crvPriceClient.on("ready", async () => {
  const guild = crvPriceClient.guilds.cache.get(process.env.DISCORD_CHANNEL_ID);
  const bot = await guild.members.fetch(process.env.DISCORD_CRVPRICE_BOT_ID);
  setInterval(async () => {
    const crvusdURL =
      "https://api.coingecko.com/api/v3/simple/price?ids=curve-dao-token&vs_currencies=usd";
    const crvethURL =
      "https://api.coingecko.com/api/v3/simple/price?ids=curve-dao-token&vs_currencies=eth";
    const responses = await Promise.all([fetch(crvusdURL), fetch(crvethURL)]);
    await bot.setNickname(
      `CRV: $${(await responses[0].json())["curve-dao-token"].usd}`
    );
    await crvPriceClient.user.setActivity(
      `CRV/ETH: Ξ${(await responses[1].json())["curve-dao-token"].eth}`
    );
  }, 1 * 60 * 1000);
});

txjpPriceClient.on("ready", async () => {
  const contract = new ethers.Contract(
    process.env.BALANCER_POOL_CONTRACT_ADDRESS,
    balancerPoolAbi,
    provider
  );
  const uniswapV3Query = gql`
    {
      pool(id: "${process.env.UNISWAP_POOL_CONTRACT_ADDRESS}") {
        token1Price
      }
    }
  `;
  setInterval(async () => {
    const guild = txjpPriceClient.guilds.cache.get(
      process.env.DISCORD_CHANNEL_ID
    );
    const bot = await guild.members.fetch(process.env.DISCORD_TXJPPRICE_BOT_ID);
    const uniswapv3Data = await request(
      "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
      uniswapV3Query
    );
    const balancerData = await contract.getSpotPrice(
      process.env.WETH_CONTRACT_ADDRESS,
      process.env.TXJP_CONTRACT_ADDRESS
    );
    const priceOnUniswap = uniswapv3Data.pool.token1Price;
    const priceOnBalancer = balancerData.div(1e15).toNumber() / 1e13;
    console.log("price on uniswap", priceOnUniswap);
    await bot.setNickname(
      `TXJP: Ξ${Math.round(priceOnUniswap * 100000) / 100000}`
    );
    await txjpPriceClient.user.setActivity(
      `TXJP on BALV1: Ξ${Math.round(priceOnBalancer * 100000) / 100000}`
    );
  }, 5 * 60 * 1000);
});

client.login(process.env.DISCORD_TVL_AND_VOLUME_BOT_TOKEN);
veCRVBotClient.login(process.env.DISCORD_VECRV_BOT_TOKEN);
crvPriceClient.login(process.env.DISCORD_CRVPRICE_BOT_TOKEN);
txjpPriceClient.login(process.env.DISCORD_TXJPPRICE_BOT_TOKEN);
