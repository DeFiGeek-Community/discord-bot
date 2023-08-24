const Discord = require("discord.js");

const curveTvlRun = () => {
  const curveTVLClient = new Discord.Client();
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
  curveTVLClient.login(process.env.DISCORD_CURVE_TVL_BOT_TOKEN);
};

module.exports = curveTvlRun;
