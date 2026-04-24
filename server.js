const http = require('http');
const { MongoClient } = require('mongodb');

const connectionString = "mongodb+srv://eleanorharty_db_user:pwd123@cluster0.49tk2lj.mongodb.net/?appName=Cluster0";

// create server (format from week 12 multi-view slides)
http.createServer(async function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    
    // pt1 create the home view
    if (req.url === "/" || req.url === "/home") {
        res.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
            </head>
            <body>
                <div class="form-card">
                    <h1>Find a company's stock price!</h1>
                    <form action="/process" method="GET">
                        <p>Please enter a company or stock ticker:</p>
                        <input type="text" id="userInput" name="userInput" required>
                        
                        <p>Please select which method you've used to identify the company:</p>
                        <input type="radio" id="ticker" name="idMethod" value="ticker" required>
                        <label for="ticker">Stock Ticker</label><br>
                        
                        <input type="radio" id="companyName" name="idMethod" value="companyName">
                        <label for="companyName">Company Name</label>
                        <br><br>
                        
                        <div class="submitButton">
                            <input type="submit" value="Submit">
                        </div>
                    </form>
                </div>
            </body>
            </html>
        `);
        res.end();
    }
    
    // p2 create the process view
    else if (req.url.startsWith("/process")) {
        // Parse the query string
        const urlParts = new URL(req.url, `http://${req.headers.host}`);
        const userInput = urlParts.searchParams.get('userInput');
        const idMethod = urlParts.searchParams.get('idMethod');
        
        try {
            const account = new MongoClient(connectionString);
            await account.connect();
            
            const dbobj = account.db("Stock");
            const collection = dbobj.collection('PublicCompanies');
            
            // search db based on method
            let searchQuery = {};
            if (idMethod == "ticker") {
                searchQuery = { companyTicker: userInput };
            } else if (idMethod == "companyName") {
                searchQuery = { companyName: userInput };
            }
            
            const results = await collection.find(searchQuery).toArray();
            
            // write out results to the webpage (and console log)
            res.write(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                </head>
                <body>
                    <div class="result">
                        <h2>Search Results for: "${userInput}"</h2>
                        <p>Searching by: ${idMethod === 'ticker' ? 'Stock Ticker' : 'Company Name'}</p>
            `);
            
            if (results.length === 0) {
                res.write(`<p>No results found for "${userInput}"</p>`);
            } else {
                res.write(`
                    <table>
                        <tr>
                            <th>Company Name</th>
                            <th>Stock Ticker</th>
                            <th>Latest Price</th>
                        </tr>
                `);
                
                for (const doc of results) {
                    console.log(`Result: ${doc.companyName} (${doc.companyTicker}) - $${doc.latestStockPrice}`);

                    res.write(`
                        <tr>
                            <td>${doc.companyName}</td>
                            <td>${doc.companyTicker}</td>
                            <td>$${doc.latestStockPrice}</td>
                        </tr>
                    `);
                }
                
                res.write(`</table>`);
            }
            
            res.write(`
                        <br>
                        <a href="/">Back to Search</a>
                    </div>
                </body>
                </html>
            `);
            
            res.end();
            await account.close();
            
        } catch (err) {
            console.log("Error:", err);
            res.end();
        }
    }

    else {
        res.write ("Unknown page request");
    }

    res.end();
    
}).listen(8080, function() {
    console.log("Server running at http://localhost:8080/");
});
