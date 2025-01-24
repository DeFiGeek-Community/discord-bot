const Discord = require("discord.js");
const { request, gql } = require("graphql-request");

const { ethers, provider, intervalTime } = require("./util.js");
const curvePoolAbi = require("../abi/curveTricrypto.json");
const fetch = require("node-fetch");

const ONE_TXJP = ethers.BigNumber.from("100000000"); // 1 TXJP (8 decimals)

const txjpPriceRun = () => {
  const txjpPriceClient = new Discord.Client();

  const getEthPrice = async () => {
    const ethURL =
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
    try {
      const response = await fetch(ethURL);
      const data = await response.json();
      return data.ethereum.usd;
    } catch (error) {
      console.error("ETH price fetch error:", error);
      throw error;
    }
  };

  const calcTxjpPrice = async (curvePoolContract) => {
    try {

      const priceOnCurve = await curvePoolContract.get_dy(2, 1, ONE_TXJP);
      const ethPrice = await getEthPrice();
      const priceInEth = parseFloat(ethers.utils.formatUnits(priceOnCurve, 18));

      return {
        curvePrice: priceInEth,
        usdPrice: priceInEth * ethPrice,
      };
    } catch (error) {
      console.error("calcTxjpPrice error:", error);
      throw error;
    }
  };

  txjpPriceClient.on("ready", async () => {
    const curvePoolContract = new ethers.Contract(
      process.env.CURVE_POOL_CONTRACT_ADDRESS,
      curvePoolAbi,
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
          `https://gateway-arbitrum.network.thegraph.com/api/${process.env.THEGRAPH_API_KEY}/subgraphs/id/8e4dRt4P4WHXnKbEq7STaQfU2g99WZ5S4w39f2PcUTjD`,
          uniswapV3Query
        );
        const priceOnUniswap = uniswapv3Data.pool.token1Price;
        const { usdPrice } = await calcTxjpPrice(curvePoolContract);
        await bot.setNickname(`TXJP: $${usdPrice.toFixed(2)}`);
        await txjpPriceClient.user.setActivity(
          `TXJP on UNI: Ξ${parseFloat(priceOnUniswap).toFixed(5)}`
        );
      } catch (err) {
        console.error("tjp.js" + err.name + ": " + err.message);
      }
    }, intervalTime);
  });

  txjpPriceClient.login(process.env.DISCORD_TXJPPRICE_BOT_TOKEN);
};

module.exports = txjpPriceRun;
