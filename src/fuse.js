const Discord = require("discord.js");

const { ethers, provider, intervalTime } = require("./util.js");

const fuseUtilRun = () => {
  const fuseUtilClient = new Discord.Client();
  fuseUtilClient.on("ready", async () => {
    setInterval(async () => {
      try {
        const guild = fuseUtilClient.guilds.cache.get(
          process.env.DISCORD_CHANNEL_ID
        );
        const bot = await guild.members.fetch(
          process.env.DISCORD_FUSEUTIL_BOT_ID
        );
        const ABI = require("../abi/fToken.json");
        const fETHcontract = new ethers.Contract(
          "0x6d8260fff752ba01bcf76c919e9e3d328971152e",
          ABI,
          provider
        );
        const fUSDCcontract = new ethers.Contract(
          "0x35036a4b7b012331f23f2945c08a5274ced38ac2",
          ABI,
          provider
        );

        const decimalsETH = await fETHcontract.decimals();
        const exchangeRateCurrentETH = await fETHcontract.exchangeRateStored();
        const totalBorrowsCurrentETH = await fETHcontract.totalBorrows();
        const totalSupplyETH = await fETHcontract.totalSupply();
        const oneCTETH = exchangeRateCurrentETH / 10 ** 18;
        const supplyETH = (totalSupplyETH / 10 ** decimalsETH) * oneCTETH;
        const borrowETH = totalBorrowsCurrentETH / 10 ** decimalsETH;
        const utilETH = Math.round((borrowETH / supplyETH) * 100);
        await bot.setNickname(`ETH-util: ${utilETH}%`);

        const decimalsUSDC = await fUSDCcontract.decimals();
        const exchangeRateCurrentUSDC =
          await fUSDCcontract.exchangeRateStored();
        const totalBorrowsCurrentUSDC = await fUSDCcontract.totalBorrows();
        const totalSupplyUSDC = await fUSDCcontract.totalSupply();
        const oneCTUSDC = exchangeRateCurrentUSDC / 10 ** 18;
        const supplyUSDC = (totalSupplyUSDC / 10 ** decimalsUSDC) * oneCTUSDC;
        const borrowUSDC = totalBorrowsCurrentUSDC / 10 ** decimalsUSDC;
        const utilUSDC = Math.round((borrowUSDC / supplyUSDC) * 100);
        await fuseUtilClient.user.setActivity(`USDC-util: ${utilUSDC}%`);
      } catch (err) {
        console.error("fuse.js" + err.name + ": " + err.message);
      }
    }, intervalTime);
  });

  fuseUtilClient.login(process.env.DISCORD_FUSEUTIL_BOT_TOKEN);
};

module.exports = fuseUtilRun;
