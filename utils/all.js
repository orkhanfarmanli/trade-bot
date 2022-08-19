const Binance = require('binance-api-node').default


const client = Binance({
    apiKey: '4ac3599f4f995b3c8a8173a74c38dc3ccb3b2647dfe36d047ba5e5358e740458',
    apiSecret: 'bc98ce79ee924d4dbbea14a15a951af97527e447c80d5000d77186825c649251',
    httpFutures: 'https://testnet.binancefuture.com'
})


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
        // console.log(error);
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

    await openPosition(activePosition.symbol, amount, positionSide)
}

const getAssetPrecision = async function (asset) {
    var filtered = await client.futuresExchangeInfo()
    return Object.values(filtered.symbols).filter(O => O.symbol === asset)[0].quantityPrecision;
}


exports.client = client;
exports.getAccountBalance = getAccountBalance;
exports.openPosition = openPosition;
exports.getAssetPrecision = getAssetPrecision;
exports.getActivePosition = getActivePosition;
exports.closeActivePosition = closeActivePosition;