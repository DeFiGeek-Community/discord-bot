const Discord = require("discord.js");
const { ethers, provider, intervalTime } = require("./../util.js");

function formatYen(value) {
    return ethers.utils.formatEther(value);
}

const yamatoTcrRun = () => {

    const yamatoTcrBotClient = new Discord.Client();
    yamatoTcrBotClient.on("ready", async () => {
        setInterval(async () => {
        try {
            const guild = yamatoTcrBotClient.guilds.cache.get(
            process.env.DISCORD_CHANNEL_ID
            );
            const bot = await guild.members.fetch(
            process.env.DISCORD_YAMATO_TCR_BOT_ID
            );
            const ABI = require("../../abi/PriorityRegistryV6.json");
            const PriorityRegistryV6contract = new ethers.Contract(
            "0x0c9Bdf09de9EaCbE692dB2c17a75bfdB5FF4190B", //PriorityRegistryV6 contract address
            ABI,
            provider
            );
            const ABI2 = require("../../abi/Yamato.json");
            const YAMATOcontract = new ethers.Contract(
            "0x02Fe72b2E9fF717EbF3049333B184E9Cd984f257", //Yamato contract address
            ABI2,
            provider
            );
            const ABI3 = require("../../abi/PriceFeedV3.json");
            const yamatoPriceFeedContract = new ethers.Contract(
            "0x3f4E4Dad0AC01Da50A774F3389b70506c96FfF2f", //Price Feed contract address
            ABI3,
            provider
            );

            const allYamatoStates = await YAMATOcontract.getStates();

            const rateOfEthJpy = Number(
            formatYen(await yamatoPriceFeedContract.getPrice())
            );
            
            const totalCollateralETH = allYamatoStates[0] * rateOfEthJpy / 10 ** 18;//18924045.2508;//allYamatoStates[0] / 10 ** 18;
            const totalSupplyCJPY = allYamatoStates[1] / 10 ** 18;
            const tcr = totalSupplyCJPY === 0 ? 0 : (totalCollateralETH / totalSupplyCJPY * 100).toFixed(2);
            
            await bot.setNickname(`TCR: ${tcr}%`);

            var redeemablesCandidate = await PriorityRegistryV6contract.getRedeemablesCap();
            if(redeemablesCandidate !== 0) redeemablesCandidate = redeemablesCandidate / 10 ** 18;
            
            await yamatoTcrBotClient.user.setActivity(`償還候補: ${redeemablesCandidate} CJPY`);
            
        } catch (err) {
            console.log(err.name + ": " + err.message);
        }
        }, intervalTime);
    });

    yamatoTcrBotClient.login(process.env.DISCORD_YAMATO_TCR_BOT_TOKEN);

};

module.exports = yamatoTcrRun;