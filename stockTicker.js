const { MongoClient } = require('mongodb');

const connectionString = "mongodb+srv://eleanorharty_db_user:pwd123@cluster0.49tk2lj.mongodb.net/?appName=Cluster0";
const filename = process.argv[2];

async function main () {
    // connect to mongo (mostly from slides but had to do an aysnc function for some reason)
    try {
        const account = new MongoClient(connectionString);
        await account.connect();

        var dbobj = account.db ("Stock");
        var collection = dbobj.collection ('PublicCompanies');

    // also from slides for reading a file
    var readline = require ('readline');
    var fs = require('fs');

    var myFile = readline.createInterface({
            input: fs.createReadStream(filename)
    });

    let isFirstLine = true;

    // what to do for each line
    myFile.on('line', function (line) {
        // skip first line with the header
        if (isFirstLine) {
            isFirstLine = false;
            return;
        }

        // get companyInfo and create document
        var companyInfo = line.split(',');

        var companyName = companyInfo[0];
        var companyTicker = companyInfo[1];
        var latestStockPrice = parseFloat(companyInfo[2]);

        var document = {
            companyName: companyName,
            companyTicker: companyTicker,
            latestStockPrice: latestStockPrice
        };

        // insert then log document
        collection.insertOne(document);
        console.log("Inserted:" + companyName + "(" + companyTicker + ")" + " at price: $" + latestStockPrice);
    });

    // close connection but not immediately after reading the file
    myFile.on('close', function () {
        setTimeout(function(){
            account.close();
        }, 3000);
    });

    } catch (err) {
        console.log("Connection error: " + err);
    }
}

main();
