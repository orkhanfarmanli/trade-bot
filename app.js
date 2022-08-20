const express = require('express');
const bodyParser = require('body-parser');
const utils = require('./utils/all');
const dotenv = require('dotenv');
const app = express();
dotenv.config();

// use the express-static middleware
app.use(express.static("public"));
app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.send("<h1>Hello there!</h1>");
});

app.post('/order', async (req, res) => {
  if (req.body.API_KEY != process.env.APP_KEY) {
    res.sendStatus(500);
  }

  const pair = req.body.pair;
  const positionSide = req.body.positionSide;
  const activePosition = await utils.getActivePosition(pair);
  const currentPosition = activePosition.positionAmt > 0 ? "BUY" : "SELL";

  // don't change anything if the current position is the same as the requested
  if (currentPosition === positionSide) {
    res.sendStatus(200);
  }

  // get the account balance
  const balance = await utils.getAccountBalance();

  // get the coin price
  const priceObj = await utils.client.avgPrice({
    symbol: pair
  });
  const coinPrice = Math.round(priceObj.price);
  const assetPrecision = await utils.getAssetPrecision(pair);

  // opening position with 50% of account balance
  const quantity = parseFloat(balance / 2 / coinPrice * 10).toFixed(assetPrecision);

  // close current active position
  await utils.closeActivePosition(activePosition);

  // wait for 2 seconds for the position to be closed in case there's a delay
  await new Promise(r => setTimeout(r, 2000));

  // open a new position
  const position = await utils.openPosition(pair, quantity, positionSide);

  console.log(position);

  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => console.log("Server is running..."));