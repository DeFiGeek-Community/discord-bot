const fuseUtilRun = require("./fuse.js");
const txjpPriceRun = require("./txjp.js");
const crvPriceRun = require("./curve/crv.js");

const discordBotRun = () => {
  crvPriceRun();
  fuseUtilRun();
  txjpPriceRun();
};

module.exports = discordBotRun;
