const pndUtilRun = require("./pnd/pnd.js");
const txjpPriceRun = require("./txjp.js");
const crvPriceRun = require("./curve/crv.js");
const yamatoPriceRun = require("./yamato/yamato.js");

const discordBotRun = () => {
  crvPriceRun();
  pndUtilRun();
  txjpPriceRun();
  yamatoPriceRun();
};

module.exports = discordBotRun;
