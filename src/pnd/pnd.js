const pndCjpyRun = require("./cjpy.js");
const pndEthRun = require("./eth.js");
const pndCrvusdRun = require("./crvusd.js");
const pndUsdcRun = require("./usdc.js");

const pndUtilRun = () => {
  console.log(`executing pndUtilRun`);
  pndCjpyRun();
  pndEthRun();
  pndCrvusdRun();
  pndUsdcRun();
};

module.exports = pndUtilRun;