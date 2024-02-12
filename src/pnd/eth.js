const Discord = require("discord.js");

const { ethers, provider, intervalTime } = require("./../util.js");

const pndEthRun = () => {
  const fuseUtilClient = new Discord.Client();
  fuseUtilClient.on("ready", async () => {
    setInterval(async () => {
      try {
        const guild = fuseUtilClient.guilds.cache.get(
          process.env.DISCORD_CHANNEL_ID
        );
        const bot = await guild.members.fetch(
          process.env.DISCORD_PND_ETH_BOT_ID
        );
        const ABI = require("../../abi/pnd.json");
        const pETHcontract = new ethers.Contract(
          "0x2bf8B07e41572FB09d9F002b2500E3eeDC5d7922",
          ABI,
          provider
        );

        const utilETHuint = await pETHcontract.getUtilization();
        const utilETH = Math.round(utilETHuint / 1e16);
        const borrowRateETHuint = await pETHcontract.getBorrowRate(utilETHuint);
        const supplyRateETHuint = await pETHcontract.getSupplyRate(utilETHuint);
        const borrowRateETH = (
          Math.round((borrowRateETHuint * 31536000) / 1e15) / 10
        ).toFixed(1);
        const supplyRateETH = (
          Math.round((supplyRateETHuint * 31536000) / 1e15) / 10
        ).toFixed(1);

        await bot.setNickname(`ETH-util: ${utilETH}%`);
        await fuseUtilClient.user.setActivity(
          `金利 貸:${supplyRateETH}% 借:${borrowRateETH}% `
        );
      } catch (err) {
        console.log(err.name + ": " + err.message);
      }
    }, intervalTime);
  });

  fuseUtilClient.login(process.env.DISCORD_PND_ETH_BOT_TOKEN);
};

module.exports = pndEthRun;
