const Discord = require("discord.js");
const { intervalTime } = require("../util.js");
const crvPriceRun = () => {
  const crvPriceClient = new Discord.Client();

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
          `CRV: Ξ${(await responses[1].json())["curve-dao-token"].eth}`
        );
      } catch (err) {
        console.log(err.name + ": " + err.message);
      }
    }, intervalTime);
  });

  crvPriceClient.login(process.env.DISCORD_CRVPRICE_BOT_TOKEN);
};

module.exports = crvPriceRun;
