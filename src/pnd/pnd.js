const Discord = require("discord.js");
const { ethers, provider, intervalTime } = require("../util.js");
const poolConfigs = require("../pnd/poolConfig.js");

const pndUtilRun = () => {
  console.log(`executing pndUtilRun`);
  poolConfigs.forEach((config) => {
    const pndUtilClient = new Discord.Client();
    pndUtilClient.on("ready", async () => {
      setInterval(async () => {
        try {
          const guild = pndUtilClient.guilds.cache.get(
            process.env.DISCORD_CHANNEL_ID
          );
          const bot = await guild.members.fetch(config.botId);
          const ABI = require("../../abi/pnd.json");
          const contract = new ethers.Contract(
            config.contractAddress,
            ABI,
            provider
          );

          const utilUint = await contract.getUtilization();
          const util = Math.round(utilUint / 1e16);
          const borrowRateUint = await contract.getBorrowRate(utilUint);
          const supplyRateUint = await contract.getSupplyRate(utilUint);
          const borrowRate = (
            Math.round((borrowRateUint * 31536000) / 1e15) / 10
          ).toFixed(1);
          const supplyRate = (
            Math.round((supplyRateUint * 31536000) / 1e15) / 10
          ).toFixed(1);

          await bot.setNickname(`${config.nicknamePrefix}: ${util}%`);
          await pndUtilClient.user.setActivity(
            `金利 貸:${supplyRate}% 借:${borrowRate}%`
          );
        } catch (err) {
          console.error("pnd.js" + err.name + ": " + err.message);
        }
      }, intervalTime);
    });

    pndUtilClient.login(config.botToken);
  });
};

module.exports = pndUtilRun;
