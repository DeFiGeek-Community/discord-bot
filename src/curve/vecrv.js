const Discord = require("discord.js");

const veCrvRun = () => {
  const veCRVBotClient = new Discord.Client();

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

  veCRVBotClient.login(process.env.DISCORD_VECRV_BOT_TOKEN);
};

module.exports = veCrvRun;
