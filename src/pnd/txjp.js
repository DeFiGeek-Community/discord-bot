const Discord = require("discord.js");

const { ethers, provider, intervalTime } = require("./../util.js");

const pndTxjpRun = () => {
  const fuseUtilClient = new Discord.Client();
  fuseUtilClient.on("ready", async () => {
    setInterval(async () => {
      try {
        const guild = fuseUtilClient.guilds.cache.get(
          process.env.DISCORD_CHANNEL_ID
        );
        const bot = await guild.members.fetch(
          process.env.DISCORD_PND_TXJP_BOT_ID
        );
        const ABI = require("../../abi/pnd.json");
        const pCJPYcontract = new ethers.Contract(
          "0xaa59f501c92092e624d30cff77eaff5ea4e7bfa2",
          ABI,
          provider
        );

        const utilCJPYuint = await pCJPYcontract.getUtilization();
        const utilCJPY = Math.round(utilCJPYuint / 1e16);
        const borrowRateCJPYuint = await pCJPYcontract.getBorrowRate(
          utilCJPYuint
        );
        const supplyRateCJPYuint = await pCJPYcontract.getSupplyRate(
          utilCJPYuint
        );
        const borrowRateCJPY = (
          Math.round((borrowRateCJPYuint * 31536000) / 1e15) / 10
        ).toFixed(1);
        const supplyRateCJPY = (
          Math.round((supplyRateCJPYuint * 31536000) / 1e15) / 10
        ).toFixed(1);

        await bot.setNickname(`CJPY-util: ${utilCJPY}%`);
        await fuseUtilClient.user.setActivity(
          `金利 貸:${supplyRateCJPY}% 借:${borrowRateCJPY}% `
        );
      } catch (err) {
        console.log(err.name + ": " + err.message);
      }
    }, intervalTime);
  });

  fuseUtilClient.login(process.env.DISCORD_PND_TXJP_BOT_TOKEN);
};

module.exports = pndTxjpRun;
