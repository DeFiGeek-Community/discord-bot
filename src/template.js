const Discord = require("discord.js");

const { intervalTime } = require("./util.js");

const templateBotRun = () => {
  const templateClient = new Discord.Client();

  templateClient.on("ready", async () => {
    setInterval(async () => {}, intervalTime);
  });

  templateClient.login(process.env.DISCORD_TEMPLATE_BOT_TOKEN);
};

module.exports = templateBotRun;
