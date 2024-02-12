const Discord = require("discord.js");

const { ethers, provider, intervalTime } = require("./../util.js");

const pndCrvusdRun = () => {
  const fuseUtilClient = new Discord.Client();
  fuseUtilClient.on("ready", async () => {
    setInterval(async () => {
      try {
        const guild = fuseUtilClient.guilds.cache.get(
          process.env.DISCORD_CHANNEL_ID
        );
        const bot = await guild.members.fetch(
          process.env.DISCORD_PND_CRVUSD_BOT_ID
        );
        const ABI = require("../../abi/pnd.json");
        const pCRVUSDcontract = new ethers.Contract(
          "0xE0e2d860797eF02F18c474847787A6C8f8389044",
          ABI,
          provider
        );

        const utilCRVUSDuint = await pCRVUSDcontract.getUtilization();
        const utilCRVUSD = Math.round(utilCRVUSDuint / 1e16);
        const borrowRateCRVUSDuint = await pCRVUSDcontract.getBorrowRate(
          utilCRVUSDuint
        );
        const supplyRateCRVUSDuint = await pCRVUSDcontract.getSupplyRate(
          utilCRVUSDuint
        );
        const borrowRateCRVUSD = (
          Math.round((borrowRateCRVUSDuint * 31536000) / 1e15) / 10
        ).toFixed(1);
        const supplyRateCRVUSD = (
          Math.round((supplyRateCRVUSDuint * 31536000) / 1e15) / 10
        ).toFixed(1);

        await bot.setNickname(`crvUSD-util: ${utilCRVUSD}%`);
        await fuseUtilClient.user.setActivity(
          `金利 貸:${supplyRateCRVUSD}% 借:${borrowRateCRVUSD}% `
        );
      } catch (err) {
        console.log(err.name + ": " + err.message);
      }
    }, intervalTime);
  });

  fuseUtilClient.login(process.env.DISCORD_PND_CRVUSD_BOT_TOKEN);
};

module.exports = pndCrvusdRun;
