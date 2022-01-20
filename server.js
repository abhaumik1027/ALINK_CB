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
app.use(Express.static('public'));
app.set('view engine', 'ejs');

//Load the table
app.get("/", async function (req, res) {
    try {
        
        let message = ""
        let searchStr = ""
        if (app.get('message')){
            message = app.get('message')
        }

        if (app.get('urlSearch')) {
            searchStr = app.get('urlSearch')
        }
        let shortUrls = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "`")
        res.render('index', { shortUrls: shortUrls.rows, message: message, searchStr: searchStr })
        
    }
    catch (err) {
        console.error(err);
        res.status(500).json('Error while populating the Alinks.');
    }
});

//Create a record
app.post('/shortUrls', async function (req, res) {
    // Check  if url is valid
    if (!validUrl(req.body.fullUrl)) {
        let shortUrls = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "`")
        res.render('index', { shortUrls: shortUrls.rows, message: 'invalid_url' })
    }
    //Check if url exists
    else {
        try {
            let lResult = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE full = '" + req.body.fullUrl + "'");
            let sResult = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE short = '" + req.body.shortUrl + "'");
            
            if (lResult.rows.length > 0) {
                let shortUrls = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "`")
                res.render('index', { shortUrls: shortUrls.rows, message: 'url_exists' })
            }
            else if (sResult.rows.length > 0) {
                let shortUrls = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "`")
                res.render('index', { shortUrls: shortUrls.rows, message: 'alink_exists' })
            }
            else {
                let hashids = new Hashids();
                let linkID = hashids.encode((new Date).getTime())
                let clicks = 0
                let creator = "Ani Bhaumik"

                let qs = await cluster.query("INSERT into `" + bucket._name + "` (KEY, VALUE) VALUES(\"" + linkID
                    + "\", {\"linkID\": \"" + linkID + "\" , \"full\": \"" + req.body.fullUrl + "\" , \"short\": \"" + req.body.shortUrl
                    + "\", \"clicks\": TONUMBER(\"" + clicks + "\"), \"date\": \"" + new Date().toLocaleDateString()
                    + "\", \"tag\": \"" + req.body.tag + "\", \"creator\": \"" + creator + "\"})")

                app.set('message', 'alink_added')
                if (app.get('urlSearch')) {
                    app.set('urlSearch', "")
                }
                res.redirect('/');
                
            }
        }
        catch (err) {
            console.error(err);
            res.status(500).json('Error while creating Alinks');
        }
    }
})

//Direct a alink to the long url
app.get('/:shortUrl', async function (req, res){
    try {
        let resUrl = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE short = '" + req.params.shortUrl + "'");
        let status = '';
        if (resUrl.rows.length > 0) {
            await cluster.query("UPDATE `" + bucket._name + "`  SET  clicks = clicks + 1 WHERE short = '" + req.params.shortUrl + "'");
            res.redirect(resUrl.rows[0].full);
        }
        else {
            if (req.params.shortUrl != 'favicon.ico') {
                app.set('urlSearch', req.params.shortUrl)
                app.set('message', 'search')
                res.redirect('/');
            }
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json('Error while redirecting');
    }
})

//Get `by tags
app.get('/tag/:tag', async function (req, res){
    try {
        let tag = req.params.tag.toUpperCase();
        let resUrl = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE tag LIKE '%" + tag + "%'");
        if (resUrl.rows.length > 0) {
            res.redirect('/');
        }
        else {
            app.set('message', 'no_tag')
            res.redirect('/');
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json('Error while get by tag');
    }
})

//Get `by creator
app.get('/creator/:creator', async function (req, res) {
    try {
        let resUrl = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE creator LIKE '%" + req.params.creator + "%'");
        if (resUrl.rows.length > 0) {
            res.render('index', { shortUrls: resUrl.rows, message: '' })
        }
        else {
            app.set('message', 'no_author')
            res.redirect('/');
        }
    }
        catch (err) {
        console.error(err);
        res.status(500).json('Error while fetching by creator');
    }
})

//Delete an alink
app.post('/delUrl', async function (req, res){

    try {
        await cluster.query("DELETE FROM `" + bucket._name + "`  WHERE linkID = '" + req.body.linkID + "'");
        app.set('message', 'alink_deleted')
        res.redirect('/');
    }
    catch (err) {
        console.error(err);
        res.status(500).json('Error while deleting alink');
    }
})

//Edit an alink
app.post('/editUrl', async function (req, res){

    try {
        if (!validUrl(req.body.fullUrl)) {
            app.set('message', 'invalid_url')
            res.redirect('/');
        }
        else {
            
            let creator = "Ani Bhaumik";
            await cluster.query("UPDATE `" + bucket._name + "`  SET  full = '" + req.body.fullUrl + "' , short = '" + req.body.shortUrl + "' , date = '" + new Date().toLocaleDateString() + "', tag = '" + req.body.tag + "', creator = '" + creator + "' WHERE linkID = '" + req.body.linkID + "'");
            app.set('message', 'alink_updated')
            res.redirect('/');
            
        }
            
    }
    catch (err) {
        console.error(err);
        res.status(500).json('Error while editing alink');
    }
})



app.listen(process.env.PORT || 5000);

