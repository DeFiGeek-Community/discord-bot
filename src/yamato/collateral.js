const Discord = require("discord.js");
const { ethers, provider, intervalTime } = require("./../util.js");

const yamatoCollateralRun = () => {
    const yamatoCollateralBotClient = new Discord.Client();
    yamatoCollateralBotClient.on("ready", async () => {
        setInterval(async () => {
        try {
            const guild = yamatoCollateralBotClient.guilds.cache.get(
            process.env.DISCORD_CHANNEL_ID
            );
            const bot = await guild.members.fetch(
            process.env.DISCORD_YAMATO_COLLATERAL_BOT_ID
            );
            const ABI = require("../../abi/Yamato.json");
            const YAMATOcontract = new ethers.Contract(
            "0x02Fe72b2E9fF717EbF3049333B184E9Cd984f257", //Yamato contract address
            ABI,
            provider
            );
            const allYamatoStates = await YAMATOcontract.getStates();
            
            const totalCollateralETH = allYamatoStates[0] / 10 ** 18;
            await bot.setNickname(`総担保 : Ξ ${totalCollateralETH} ETH`);

            const totalSupplyCJPY = allYamatoStates[1] / 10 ** 18;
            await yamatoCollateralBotClient.user.setActivity(`総発行: ${totalSupplyCJPY.toLocaleString()} CJPY`);

        } catch (err) {
            console.log(err.name + ": " + err.message);
        }
        }, intervalTime);
    });

    yamatoCollateralBotClient.login(process.env.DISCORD_YAMATO_COLLATERAL_BOT_TOKEN);

};

module.exports = yamatoCollateralRun;