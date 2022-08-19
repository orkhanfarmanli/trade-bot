const express = require('express')
const bodyParser = require('body-parser');
const utils = require('./utils/all')
const app = express();

// use the express-static middleware
app.use(express.static("public"));
app.use(bodyParser.json());


app.get("/", function (req, res) {
  res.send("<h1>Hello there!</h1>")
})

app.post('/order', async (req, res) => {
  const pair = req.body.pair;
  const positionSide = req.body.positionSide;
  const activePosition = await utils.getActivePosition(pair);

  // get account balance
  const balance = await utils.getAccountBalance();

  // get coin price
  const priceObj = await utils.client.avgPrice({
    symbol: pair
  });
  const coinPrice = Math.round(priceObj.price);
  const assetPrecision = await utils.getAssetPrecision(pair);

  // opening position with 50% of account balance
  const quantity = parseFloat(balance / 2 / coinPrice * 10).toFixed(assetPrecision);

  console.log(pair + ' price: ' + coinPrice);
  console.log('account balance: ' + balance);
  console.log("quantity: " + quantity);

  await utils.closeActivePosition(activePosition);

  const position = await utils.openPosition(pair, quantity, positionSide);

  console.log(position);

  res.send('{status:200}');
})

app.listen(process.env.PORT || 3000, 
	() => console.log("Server is running..."));