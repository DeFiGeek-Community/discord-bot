const yamatoCollateralRun = require("./collateral.js");
const yamatoTcrRun = require("./tcr.js");
const yamatoExchangerateRun = require("./exchangerate.js");

const yamatoPriceRun = () => {
  console.log(`executing yamatoPriceRun`);
  yamatoCollateralRun();
  yamatoTcrRun();
  yamatoExchangerateRun();
};

module.exports = yamatoPriceRun;