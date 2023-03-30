const fetch = require("node-fetch");
const Discord = require("discord.js");
const numeral = require("numeral");
const { request, gql } = require("graphql-request");
const { ethers } = require("ethers");

const balancerPoolAbi = require("./abi/balancer.json");
const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_URL);
const intervalTime = 10 * 60 * 1000;

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
  const curveTVLClient = new Discord.Client();
  const veCRVBotClient = new Discord.Client();
  const crvPriceClient = new Discord.Client();
  const txjpPriceClient = new Discord.Client();
  const fuseUtilClient = new Discord.Client();

  //   curveTVLClient.on("ready", async () => {
  //     setInterval(async () => {
  //       try {
  //         const guild = curveTVLClient.guilds.cache.get(
  //           process.env.DISCORD_CHANNEL_ID
  //         );
  //         const bot = await guild.members.fetch(
  //           process.env.DISCORD_CURVE_TVL_BOT_ID
  //         );
  //         const tvl = await getTVL();
  //         const dailyVolume = await getVolume(30, 1);
  //         const dailyVolumeFixed = numeral(dailyVolume).format("0a");
  //         const tvlFixed = numeral(tvl).format("0.00a");
  //         await bot.setNickname(`Daily Vol: $${dailyVolumeFixed}`);
  //         await curveTVLClient.user.setActivity(`TVL: $${tvlFixed}`);
  //       } catch (err) {
  //         console.log(err.name + ": " + err.message);
  //       }
  //     }, intervalTime);
  //   });

  crvPriceClient.on("ready", async () => {
    const guild = crvPriceClient.guilds.cache.get(
      process.env.DISCORD_CHANNEL_ID
    );
    const bot = await guild.members.fetch(process.env.DISCORD_CRVPRICE_BOT_ID);
    const crvusdURL =
      "https://api.coingecko.com/api/v3/simple/price?ids=curve-dao-token&vs_currencies=usd";
    const crvethURL =
      "https://api.coingecko.com/api/v3/simple/price?ids=curve-dao-token&vs_currencies=eth";
    setInterval(async () => {
      try {
        const responses = await Promise.all([
          fetch(crvusdURL),
          fetch(crvethURL),
        ]);
        await bot.setNickname(
          `CRV: $${(await responses[0].json())["curve-dao-token"].usd}`
        );
        await crvPriceClient.user.setActivity(
          `CRV/ETH: Ξ${(await responses[1].json())["curve-dao-token"].eth}`
        );
      } catch (err) {
        console.log(err.name + ": " + err.message);
      }
    }, intervalTime);
  });

  //   veCRVBotClient.on("ready", async () => {
  //     const guild = veCRVBotClient.guilds.cache.get(
  //       process.env.DISCORD_CHANNEL_ID
  //     );
  //     const bot = await guild.members.fetch(process.env.DISCORD_VECRV_BOT_ID);
  //     const URL = `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2&apikey=${process.env.ETHERSCAN_API_KEY}`;
  //     setInterval(async () => {
  //       try {
  //         const res = await fetch(URL);
  //         const veCRVData = await res.json();
  //         const veCRV = Math.floor(Number(veCRVData.result) / 10 ** 18);
  //         const weeklyVolume = await getVolume(1440, 7);
  //         const veCRVPerYear = (weeklyVolume * 52 * 0.02) / 100 / veCRV;
  //         await bot.setNickname(`$${veCRVPerYear.toFixed(2)} veCRV/年`);
  //         const veCRVToFixed = veCRV.toFixed();
  //         await veCRVBotClient.user.setActivity(
  //           `total: ${Number(veCRVToFixed).toLocaleString()} veCRV`
  //         );
  //       } catch (err) {
  //         console.log(err.name + ": " + err.message);
  //       }
  //     }, intervalTime);
  //   });

  txjpPriceClient.on("ready", async () => {
    const contract = new ethers.Contract(
      process.env.BALANCER_VAULT_CONTRACT_ADDRESS,
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
      try {
        const guild = txjpPriceClient.guilds.cache.get(
          process.env.DISCORD_CHANNEL_ID
        );
        const bot = await guild.members.fetch(
          process.env.DISCORD_TXJPPRICE_BOT_ID
        );
        const uniswapv3Data = await request(
          "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
          uniswapV3Query
        );
        const priceOnUniswap = uniswapv3Data.pool.token1Price;
        const balancerData = await contract.getPoolTokens(
          process.env.BALANCER_POOL_CONTRACT_ADDRESS
        );
        const priceOnBalancer =
          balancerData[1][1].mul(98).div(2).div(balancerData[1][0]).toNumber() /
          1e10;
        await bot.setNickname(
          `TXJP: Ξ${Math.round(priceOnUniswap * 100000) / 100000}`
        );
        await txjpPriceClient.user.setActivity(
          `TXJP on BALV2: Ξ${Math.round(priceOnBalancer * 100000) / 100000}`
        );
      } catch (err) {
        console.log(err.name + ": " + err.message);
      }
    }, intervalTime);
  });

  fuseUtilClient.on("ready", async () => {
    setInterval(async () => {
      try {
        const guild = fuseUtilClient.guilds.cache.get(
          process.env.DISCORD_CHANNEL_ID
        );
        const bot = await guild.members.fetch(
          process.env.DISCORD_FUSEUTIL_BOT_ID
        );
        const ABI = require("./abi/fToken.json");
        const fETHcontract = new ethers.Contract(
          "0x6d8260fff752ba01bcf76c919e9e3d328971152e",
          ABI,
          provider
        );
        const fUSDCcontract = new ethers.Contract(
          "0x35036a4b7b012331f23f2945c08a5274ced38ac2",
          ABI,
          provider
        );

        const decimalsETH = await fETHcontract.decimals();
        const exchangeRateCurrentETH = await fETHcontract.exchangeRateStored();
        const totalBorrowsCurrentETH = await fETHcontract.totalBorrows();
        const totalSupplyETH = await fETHcontract.totalSupply();
        const oneCTETH = exchangeRateCurrentETH / 10 ** 18;
        const supplyETH = (totalSupplyETH / 10 ** decimalsETH) * oneCTETH;
        const borrowETH = totalBorrowsCurrentETH / 10 ** decimalsETH;
        const utilETH = Math.round((borrowETH / supplyETH) * 100);
        await bot.setNickname(`ETH-util: ${utilETH}%`);

        const decimalsUSDC = await fUSDCcontract.decimals();
        const exchangeRateCurrentUSDC =
          await fUSDCcontract.exchangeRateStored();
        const totalBorrowsCurrentUSDC = await fUSDCcontract.totalBorrows();
        const totalSupplyUSDC = await fUSDCcontract.totalSupply();
        const oneCTUSDC = exchangeRateCurrentUSDC / 10 ** 18;
        const supplyUSDC = (totalSupplyUSDC / 10 ** decimalsUSDC) * oneCTUSDC;
        const borrowUSDC = totalBorrowsCurrentUSDC / 10 ** decimalsUSDC;
        const utilUSDC = Math.round((borrowUSDC / supplyUSDC) * 100);
        await fuseUtilClient.user.setActivity(`USDC-util: ${utilUSDC}%`);
      } catch (err) {
        console.log(err.name + ": " + err.message);
      }
    }, intervalTime);
  });

  crvPriceClient.login(process.env.DISCORD_CRVPRICE_BOT_TOKEN);
  curveTVLClient.login(process.env.DISCORD_CURVE_TVL_BOT_TOKEN);
  veCRVBotClient.login(process.env.DISCORD_VECRV_BOT_TOKEN);
  txjpPriceClient.login(process.env.DISCORD_TXJPPRICE_BOT_TOKEN);
  fuseUtilClient.login(process.env.DISCORD_FUSEUTIL_BOT_TOKEN);
};

module.exports = discordBotRun;
