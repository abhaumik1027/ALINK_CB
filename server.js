var validUrl = require('valid_url')
var Couchbase = require("couchbase");
var Express = require("express");
var BodyParser = require("body-parser");
var Hashids = require("hashids");

// User Creds.
var endpoint = 'cb.tisntgxbzgvsjjcn.cloud.couchbase.com'
var username = 'alink'
var password = 'Alink_123'
var bucketName = 'ALINK'

// Initialize the Connection
var cluster = new Couchbase.Cluster('couchbases://' + endpoint + '?ssl=no_verify&console_log_level=5', { username: username, password: password });
var bucket = cluster.bucket(bucketName);
var collection = bucket.defaultCollection();
var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

//Load the table
app.get("/", async function (req, res) {

    let shortUrls = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "`")
    if (shortUrls.rows.length > 0) {
       res.render('index', { shortUrls: shortUrls.rows, shortUrlss: 'render' })
    }
});

//Create a record
app.post('/shortUrls', async function (req, res) {
    // Check  if url is valid
    if (!validUrl(req.body.fullUrl)) {
        let shortUrls = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "`")
        res.render('index', { shortUrls: shortUrls.rows, shortUrlss: 'invalid_url' })
    }
    //Check if url exists
    else {
        try {
            let lResult = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE full = '" + req.body.fullUrl + "'");
            let sResult = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE short = '" + req.body.shortUrl + "'");
            
            if (lResult.rows.length > 0) {
                let shortUrls = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "`")
                res.render('index', { shortUrls: shortUrls.rows, shortUrlss: 'url_exists' })
            }
            else if (sResult.rows.length > 0) {
                let shortUrls = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "`")
                res.render('index', { shortUrls: shortUrls.rows, shortUrlss: 'alink_exists' })
            }
            else {
                let hashids = new Hashids();
                let response = {
                    linkID: hashids.encode((new Date).getTime()),
                    full: req.body.fullUrl,
                    short: req.body.shortUrl,
                    clicks: 0,
                    date: new Date().toLocaleDateString()
                }
                await collection.upsert(response.linkID, response, function (error, result) {
                    if (error) {
                        return res.status(400).send(error);
                    }
                    res.redirect('/')
                });
            }
        }
        catch (err) {
            console.error(err);
            res.status(500).json('Server error');
        }
    }
})

//Direct a alink to the long url
app.get('/:shortUrl', async function (req, res){

    let resUrl = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE short = '" + req.params.shortUrl + "'");
    let status = '';
    if (resUrl.rows.length > 0) {
        await cluster.query("UPDATE `" + bucket._name + "`  SET  clicks = clicks + 1 WHERE short = '" + req.params.shortUrl + "'");
        res.redirect(resUrl.rows[0].full);
    }
    else {
        let shortUrls = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "`")
        res.render('index', { shortUrls: shortUrls.rows, shortUrlss: 'search' })
    }
})

//Delete an alink
app.post('/delUrl', async function (req, res){

    try {
        await cluster.query("DELETE FROM `" + bucket._name + "`  WHERE linkID = '" + req.body.linkID + "'");
        res.redirect('/')
    }
    catch (err) {
        res.status(500).json('Server error');
    }
})

//Edit an alink
app.post('/editUrl', async function (req, res){

    if (!validUrl(req.body.fullUrl)) {
        let shortUrls = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "`")
        res.render('index', { shortUrls: shortUrls.rows, shortUrlss: 'invalid_url' })
    }
    else {
        try {
            
            await cluster.query("UPDATE `" + bucket._name + "`  SET  full = '" + req.body.fullUrl + "' , short = '" + req.body.shortUrl + "' , date = '" +
                new Date().toLocaleDateString() + "'  WHERE linkID = '" + req.body.linkID + "'");
            res.redirect('/')
            
        }
        catch (err) {
            res.status(500).json('Server error');
        }
    }
})



app.listen(process.env.PORT || 5000);

