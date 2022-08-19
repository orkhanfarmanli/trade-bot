const Binance = require('binance-api-node').default;
const dotenv = require('dotenv');
dotenv.config();


const client = Binance({
    apiKey: process.env.API_KEY,
    apiSecret: process.env.API_SECRET,
    httpFutures: process.env.HTTP_FUTURES
});

const getAccountBalance = async function () {
    const futuresAccountBalance = await client.futuresAccountBalance();
    let currentBalance = 0;

    for (const result in futuresAccountBalance) {
        if (Object.hasOwnProperty.call(futuresAccountBalance, result)) {
            const futuresBalanceResult = futuresAccountBalance[result];

            if (futuresBalanceResult['asset'] == 'USDT') {
                currentBalance = Math.round(futuresBalanceResult['availableBalance']);
            }
        }
    }

    return currentBalance;
}

const openPosition = async function (pair, quantity, positionSide) {
    console.log('Futures ping:' + await client.futuresPing());

    await client.futuresLeverage({
        symbol: pair,
        leverage: 10,
    })

    try {
        await client.futuresMarginType({
            symbol: pair,
            marginType: 'ISOLATED',
        })
    } catch (error) {
        console.log(error);
    }

    return await client.futuresOrder({
        symbol: pair,
        side: positionSide,
        type: 'MARKET',
        quantity: quantity,
    });
}


const getActivePosition = async function (pair) {
    const positions = await client.futuresPositionRisk({
        symbol: pair
    });

    let activePositions = positions.filter(position => position.entryPrice > 0);

    if (activePositions.length > 0) {
        return activePositions[0];
    }

    return [];
}

const closeActivePosition = async function (activePosition) {
    if (Object.keys(activePosition).length === 0) {
        return;
    }

    let positionSide = activePosition.positionAmt > 0 ? "SELL" : "BUY";
    let amount = Math.abs(activePosition.positionAmt);

    await openPosition(activePosition.symbol, amount, positionSide);
}

const getAssetPrecision = async function (asset) {
    var filtered = await client.futuresExchangeInfo();
    return Object.values(filtered.symbols).filter(O => O.symbol === asset)[0].quantityPrecision;
}


exports.client = client;
exports.getAccountBalance = getAccountBalance;
exports.openPosition = openPosition;
exports.getAssetPrecision = getAssetPrecision;
exports.getActivePosition = getActivePosition;
exports.closeActivePosition = closeActivePosition;