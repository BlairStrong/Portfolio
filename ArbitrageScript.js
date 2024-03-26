// how to build a function

async function main() {
  
  url_list = ["https://api.binance.com/api/v3/exchangeInfo", "https://api4.binance.com/api/v3/ticker/price"];
  const promiseList = await retrivePromiseData(url_list);
  exchange_data = buildExchangeData(promiseList);
  console.log(exchange_data);
  console.log("Building Sequence");
  buildTriangularSequence(exchange_data);
  console.log("Sequence Built..");
  console.log(exchange_data.ArbitrageSequence);
  console.log("calculating arbitrage opportunity");
  surfaceRates_list = calculateTriangularArbitrageSurfaceRatesSimple(exchange_data);
  console.log("surface reates", surfaceRates_list);
  loadTable("BinanceData", surfaceRates_list)

}

async function retrivePromiseData(url_list) {
  const arrayOfResponses = await Promise.all(
    url_list.map((url) =>
        fetch(url)
            .then((response) => response.json())
    )
  );
  return arrayOfResponses
}

function buildExchangeData(promiseList) {
  const exchange_data = {
    baseTokens: new Set(),
    quoteTokens: new Set(),
    basePairs: new Set(),
    ArbitrageSequence: new Set(),
    pairData: new Set(),
    nonUSDPairData: new Set(),
    priceData: {},
  }

  for (const promise of promiseList) {
    if (promise.symbols) {
      for (const assetData of promise.symbols){
        if (assetData["status"] !== "TRADING"){
          continue;
        }
        exchange_data.baseTokens.add(assetData["baseAsset"])
        exchange_data.quoteTokens.add(assetData["quoteAsset"])
        exchange_data.pairData.add([assetData["baseAsset"], assetData["quoteAsset"], assetData["symbol"] ])
        if (!assetData["symbol"].includes("USD")){
          exchange_data.nonUSDPairData.add([assetData["baseAsset"], assetData["quoteAsset"], assetData["symbol"] ])

        }
      }
    } else {
      for (const assetData of promise){
        exchange_data.basePairs.add(assetData["symbol"]);
        exchange_data.priceData[assetData["symbol"]] = assetData["price"];
      }
    }
  }
  return exchange_data

}

async function buildTriangularSequence(exchange_data){
  let alreadySeen_set = new Set();
  pairData = exchange_data.pairData

  // cycle through all possile pairs listed on the exchange
  for (const originalPair of pairData) {
    originalBaseAsset = originalPair[0] // example: btc
    originalQuoteAsset = originalPair[1] // exmaple: eth
    originalPairAsset = originalPair[2] // example: btceth

    
    //run a second cycle thorugh all items
    for (const nextPair of pairData){
      secondBaseAsset = nextPair[0] // example: btc
      secondQuoteAsset = nextPair[1] // example: ltc
      secondPairAsset = nextPair[2] //example: btcltc

      // removing duplicate pairs - must be done this way as some pairs exist in both directions: eg USDCBNB BNBUSDC
      if (originalPairAsset === secondPairAsset){
        //console.log("Duplicate found", originalPairAsset, secondPairAsset)
        continue
      }

      // find all pairs that have the base or quote in common
      if (secondBaseAsset === originalBaseAsset || secondQuoteAsset === originalBaseAsset || secondBaseAsset === originalQuoteAsset || secondQuoteAsset === originalQuoteAsset){

          // of the assets, remove the duplicate
        let asset_counter = {}
        for (const asset of [originalBaseAsset, originalQuoteAsset, secondBaseAsset, secondQuoteAsset]){
          asset_counter[asset] = asset_counter[asset] ? asset_counter[asset] + 1 : 1;
        }
        let new_asset = []; 
        for (const asset in asset_counter){
          if (asset_counter[asset] === 1){
            new_asset.push(asset)
          }
        }

        if (exchange_data.basePairs.has(`${new_asset[0]}${new_asset[1]}`)){
          exchange_data.ArbitrageSequence.add(`${originalBaseAsset}-${originalQuoteAsset},${secondBaseAsset}-${secondQuoteAsset},${new_asset[0]}-${new_asset[1]}`);
     
        } else if (exchange_data.basePairs.has(`${new_asset[1]}${new_asset[0]}`)){
          exchange_data.ArbitrageSequence.add(`${originalBaseAsset}-${originalQuoteAsset},${secondBaseAsset}-${secondQuoteAsset},${new_asset[1]}-${new_asset[0]}`);
  
        }
      }
   
    }
  }
}
  

function turnDataIntoTable(surfaceRates_list, table_rows){
  // get the top 50 opportunities
  for (let i = 0; i < table_rows; i++){
    console.log(surfaceRates_list[i])
  }
}

function calculateTriangularArbitrageSurfaceRatesSimple(exchange_data, assetData, top_number){
  const surfaceRates = new Set();
  let counter = 0;
  for (let assetSequence of exchange_data.ArbitrageSequence){
    
    assetSequence = assetSequence.split(",")
    counter += 1;

    if (counter > 5000){
      continue
    }

    let firstBase = assetSequence[0].split("-")[0];
    let firstQuote = assetSequence[0].split("-")[1];
    let secondBase = assetSequence[1].split("-")[0];
    let secondQuote = assetSequence[1].split("-")[1];
    let thirdBase = assetSequence[2].split("-")[0];
    let thirdQuote = assetSequence[2].split("-")[1];

    let firstAsset = `${firstBase}${firstQuote}`;
    let secondAsset = `${secondBase}${secondQuote}`;
    let thirdAsset = `${thirdBase}${thirdQuote}`;

    // build an order for each starting asset
    
    let firstTransactionBase = "";
    let firstTransactionQuote = "";
    let effectiveBuyPrice = 0;
    let secondTransactionBase = "";
    let secondTransactionQuote = "";
    let secondTransactionPrice = 0;
    
    let firstAssetPairPrice = exchange_data.priceData[firstAsset];
    let secondAssetPairPrice =  exchange_data.priceData[secondAsset];
    let thirdAssetPairPrice =  exchange_data.priceData[thirdAsset];

    let surfaceRate = 0;
    // console.log(firstAssetPairPrice, secondAssetPairPrice, thirdAssetPairPrice)
    
  
      //build remaining asset


    if (firstBase == secondQuote){
      firstTransactionBase = secondBase;
      firstTransactionQuote = firstQuote;
      // check if the resulting pair is the correct way up ie usdt/btc != correct way up
      if (exchange_data.basePairs.has(`${firstTransactionBase}${firstTransactionQuote}`)){
        effectiveBuyPrice = firstAssetPairPrice * secondAssetPairPrice;
      } else {
        effectiveBuyPrice = 1 / (firstAssetPairPrice * secondAssetPairPrice);
      }

    } else if (firstQuote == secondBase){
      firstTransactionBase = firstBase;
      firstTransactionQuote = secondQuote;
      // check if the resulting pair is the correct way up ie usdt/btc != correct way up
      if (exchange_data.basePairs.has(`${firstTransactionBase}${firstTransactionQuote}`)){
        effectiveBuyPrice = firstAssetPairPrice * secondAssetPairPrice;
      } else {
        effectiveBuyPrice = 1 / (firstAssetPairPrice * secondAssetPairPrice);
      }
    
    } else if (firstBase == secondBase){
      // we know the pair, but need to verify the order
      firstTransactionBase = firstQuote;
      firstTransactionQuote = secondQuote;
      // check if the resulting pair is the correct way up ie usdt/btc != correct way up
      if (exchange_data.basePairs.has(`${firstTransactionBase}${firstTransactionQuote}`)){
        effectiveBuyPrice = 1/ (firstAssetPairPrice / secondAssetPairPrice);
      } else {
        effectiveBuyPrice = (firstAssetPairPrice / secondAssetPairPrice);
      }
    
    } else if (firstQuote == secondQuote){
        firstTransactionBase = firstBase;
        firstTransactionQuote = secondBase;
        // check if the resulting pair is the correct way up ie usdt/btc != correct way up
        if (exchange_data.basePairs.has(`${firstTransactionBase}${firstTransactionQuote}`)){
          effectiveBuyPrice = (firstAssetPairPrice / secondAssetPairPrice);
        } else {
          effectiveBuyPrice = 1 / (firstAssetPairPrice / secondAssetPairPrice);
        }  
    } else {
      console.log("Error with first transaction - line 181")
    }
    surfaceRate = Math.round(thirdAssetPairPrice/effectiveBuyPrice)

    // // completing the triangular arbitrage opportunity
    // if (firstTransactionBase === thirdQuote){
    //   secondTransactionBase = thirdBase;
    //   secondTransactionQuote = firstTransactionQuote;
    //   surfaceRate = effectiveBuyPrice * thirdAssetPairPrice;
    // } else if (firstTransactionQuote == thirdBase){
    //   secondTransactionBase = firstTransactionQuote;
    //   secondTransactionQuote = thirdQuote;
    //   surfaceRate = effectiveBuyPrice * thirdAssetPairPrice;

    // } else if (thirdAsset === `${firstTransactionBase}${firstTransactionQuote}`){
    //   secondTransactionBase = firstTransactionBase;
    //   secondTransactionQuote = thirdQuote;
    //   surfaceRate = thirdAssetPairPrice / effectiveBuyPrice;
      
          
    // } else {
    //   console.log("Error with first transaction - line 204")
    // }

    surfaceRates.add([surfaceRate, firstAsset, firstAssetPairPrice, secondAsset, secondAssetPairPrice, thirdAsset, thirdAssetPairPrice ])
  }


    const surfaceRates_list = Array.from(surfaceRates).sort(function(a,b){
      return b[0]-a[0];
    });

    let top_list = surfaceRates_list.slice(top_number)
  return top_list
}

function loadTable(tableId, data) {
  var table = document.getElementById(tableId);

  // Clear existing table content
  table.innerHTML = '';

  // Create table header
  const headers = {
    0 : "Surface Rate %",
    1 : "Pair 1",
    2 : "Pair 1 Price",
    3 : "Pair 2",
    4 : "Pair 2 Price",
    5 : "Pair 3",
    6 : "Pair 3 Price",

  }
  var headerRow = table.insertRow();
  for (var i = 0; i < data[0].length; i++) {
      var headerCell = headerRow.insertCell(i);
      headerCell.textContent = headers[i]; // You can customize the headers here
  }

  // Populate table with data
  for (var i = 0; i < data.length; i++) {
      var rowData = data[i];
      var row = table.insertRow();
      for (var j = 0; j < rowData.length; j++) {
          var cell = row.insertCell(j);
          cell.textContent = rowData[j];
      }
  }
}