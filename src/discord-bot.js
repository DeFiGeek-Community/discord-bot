const fuseUtilRun = require("./fuse.js");
const txjpPriceRun = require("./txjp.js");
const crvPriceRun = require("./curve/crv.js");
const yamatoPriceRun = require("./yamato.js");

const discordBotRun = () => {
  crvPriceRun();
  fuseUtilRun();
  txjpPriceRun();
  yamatoPriceRun();
};

module.exports = discordBotRun;
