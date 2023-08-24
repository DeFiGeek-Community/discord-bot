require("dotenv").config();
const txjp = require("./src/txjp-api");
const discordBotRun = require("./src/discord-bot");
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.use("/txjp", txjp);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

discordBotRun();
