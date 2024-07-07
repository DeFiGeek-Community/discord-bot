const Discord = require("discord.js");
const { request, gql } = require("graphql-request");

const { ethers, provider, intervalTime } = require("./util.js");
const balancerPoolAbi = require("../abi/balancer.json");

const txjpPriceRun = () => {
  const txjpPriceClient = new Discord.Client();

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
          `https://gateway-arbitrum.network.thegraph.com/api/${process.env.THEGRAPH_API_KEY}/subgraphs/id/8e4dRt4P4WHXnKbEq7STaQfU2g99WZ5S4w39f2PcUTjD`,
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

  txjpPriceClient.login(process.env.DISCORD_TXJPPRICE_BOT_TOKEN);
};

module.exports = txjpPriceRun;
