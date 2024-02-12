const Discord = require("discord.js");

const { ethers, provider, intervalTime } = require("./../util.js");

const pndUsdcRun = () => {
  const fuseUtilClient = new Discord.Client();
  fuseUtilClient.on("ready", async () => {
    setInterval(async () => {
      try {
        const guild = fuseUtilClient.guilds.cache.get(
          process.env.DISCORD_CHANNEL_ID
        );
        const bot = await guild.members.fetch(
          process.env.DISCORD_PND_USDC_BOT_ID
        );
        const ABI = require("../../abi/pnd.json");
        const pUSDCcontract = new ethers.Contract(
          "0x7a997e2D7C84abb219832d944141de210e2840e1",
          ABI,
          provider
        );

        const utilUSDCuint = await pUSDCcontract.getUtilization();
        const utilUSDC = Math.round(utilUSDCuint / 1e16);
        const borrowRateUSDCuint = await pUSDCcontract.getBorrowRate(
          utilUSDCuint
        );
        const supplyRateUSDCuint = await pUSDCcontract.getSupplyRate(
          utilUSDCuint
        );
        const borrowRateUSDC = (
          Math.round((borrowRateUSDCuint * 31536000) / 1e15) / 10
        ).toFixed(1);
        const supplyRateUSDC = (
          Math.round((supplyRateUSDCuint * 31536000) / 1e15) / 10
        ).toFixed(1);

        await bot.setNickname(`USDC-util: ${utilUSDC}%`);
        await fuseUtilClient.user.setActivity(
          `金利 貸:${supplyRateUSDC}% 借:${borrowRateUSDC}% `
        );
      } catch (err) {
        console.log(err.name + ": " + err.message);
      }
    }, intervalTime);
  });

  fuseUtilClient.login(process.env.DISCORD_PND_USDC_BOT_TOKEN);
};

module.exports = pndUsdcRun;
