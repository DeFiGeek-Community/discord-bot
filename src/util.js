module.exports.intervalTime = 10 * 60 * 1000;

const { ethers } = require("ethers");
const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_URL);
module.exports.ethers = ethers;
module.exports.provider = provider;
