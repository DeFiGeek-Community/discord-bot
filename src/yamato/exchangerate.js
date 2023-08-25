const Discord = require("discord.js");
const { ethers, provider, intervalTime } = require("./../util.js");

const yamatoExchangerateRun = () => {

    const yamatoExchangerateBotClient = new Discord.Client();
    yamatoExchangerateBotClient.on("ready", async () => {
        setInterval(async () => {
        try {
            const guild = yamatoExchangerateBotClient.guilds.cache.get(
            process.env.DISCORD_CHANNEL_ID
            );
            const bot = await guild.members.fetch(
            process.env.DISCORD_YAMATO_EXCHANGERATE_BOT_ID
            );

            const res = await fetch(
            "https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=JPY&apikey=GZWY0Y5XMJ7WM66A"
            );
            const resJSON = await res.json();
            const jpyPerUSD = resJSON['Realtime Currency Exchange Rate']['5. Exchange Rate'];
            const jpyPerUSDToFixed = Number(jpyPerUSD).toFixed(2);
            
            const res2 = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=convertible-jpy-token&vs_currencies=jpy"
            );
            const resJSON2 = await res2.json();
            const cjpyPerJPY = Number(resJSON2['convertible-jpy-token']['jpy']);
            const diff = ((cjpyPerJPY-1)*100).toFixed(2);
            
            const cjpyPerUSDToFixed = (jpyPerUSDToFixed / cjpyPerJPY).toFixed(2);
            
            let plusDiff;

            if(diff > 0){
            plusDiff = "+"+diff;
            await bot.setNickname(`為替差異: ${plusDiff}%`);
            }else{
            await bot.setNickname(`為替差異: ${diff}%`);
            }

            await yamatoExchangerateBotClient.user.setActivity(`円: ${jpyPerUSDToFixed}・CJPY: ${cjpyPerUSDToFixed}`);

        } catch (err) {
            console.log(err.name + ": " + err.message);
        }
        }, intervalTime);
    });

    yamatoExchangerateBotClient.login(process.env.DISCORD_YAMATO_EXCHANGERATE_BOT_TOKEN);

};

module.exports = yamatoExchangerateRun;