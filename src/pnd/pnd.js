const pndTxjpRun = require("./txjp.js");
const pndEthRun = require("./eth.js");
const pndCrvusdRun = require("./crvusd.js");
const pndUsdcRun = require("./usdc.js");

const pndUtilRun = () => {
  console.log(`executing pndUtilRun`);
  pndTxjpRun();
  pndEthRun();
  pndCrvusdRun();
  pndUsdcRun();
};

module.exports = pndUtilRun;