var validUrl = require('valid_url')
var Couchbase = require("couchbase");
var Express = require("express");
var BodyParser = require("body-parser");
var Hashids = require("hashids");
var os = require("os");
var ipget = require('child_process');


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

        /*
        var ip = '192.168.1.171';


        ipget.exec('wmic.exe /node:"'+ip+'" ComputerSystem Get UserName', function (err, stdout, stderr) {
            if (err) {
                console.log("\n" + stderr);
            } else {
                console.log(stdout);
                var last = stdout.split("/").pop();
                console.log(last);
                console.log(last);
            }
        });

        */

        if (app.get('callinIn')) {
            searchStr = app.get('urlSearch')
            message = app.get('message')
            app.set('callinIn', '')

        }
       

        let tagDetails = await cluster.query("SELECT DISTINCT(`" + bucket._name + "`.tag) FROM `" + bucket._name + "` order by tag");

        
        //Load the table with the searched tag
        if (app.get('tag')) {
            let tag = app.get('tag')

            let shortUrls = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE tag LIKE '%" + tag + "%'");
            app.set('tag', '')
            res.render('index', { shortUrls: shortUrls.rows, message: message, searchStr: searchStr, tagDetails: tagDetails.rows })
        }
        //Load the table with the searched alink
        else if (app.get('alink')) {
            let shortUrls = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE short LIKE '%" + searchStr + "%' or full LIKE '%" + searchStr + "%'");
            app.set('alink', '')
            res.render('index', { shortUrls: shortUrls.rows, message: message, searchStr: searchStr, tagDetails: tagDetails.rows })
        }
        else {
            let shortUrls = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "`")
            res.render('index', { shortUrls: shortUrls.rows, message: message, searchStr: searchStr, tagDetails: tagDetails.rows })
        }

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

        app.set('message', 'invalid_url')
        app.set('urlSearch', '')
        app.set('callinIn', 'callinIn')
        res.redirect('/');

    }
    //Check if url/alink exists
    else {
        try {
            let lResult = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE full = '" + req.body.fullUrl + "'");
            let sResult = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE short = '" + req.body.shortUrl + "'");

            if (lResult.rows.length > 0) {
                app.set('message', 'url_exists')
                app.set('urlSearch', '')
                app.set('callinIn', 'callinIn')
                res.redirect('/');
            }

            else if (sResult.rows.length > 0) {
                app.set('message', "alink_exists " + req.body.shortUrl + "")
                app.set('urlSearch', '')
                app.set('callinIn', 'callinIn')
                res.redirect('/');
            }

            else {
                let hashids = new Hashids();
                let linkID = hashids.encode((new Date).getTime())
                let clicks = 0
                let creator = os.userInfo().username
                let tag = req.body.tag.toUpperCase()

                let qs = await cluster.query("INSERT into `" + bucket._name + "` (KEY, VALUE) VALUES(\"" + linkID
                    + "\", {\"linkID\": \"" + linkID + "\" , \"full\": \"" + req.body.fullUrl + "\" , \"short\": \"" + req.body.shortUrl
                    + "\", \"clicks\": TONUMBER(\"" + clicks + "\"), \"date\": \"" + new Date().toLocaleDateString()
                    + "\", \"tag\": \"" + tag + "\", \"creator\": \"" + creator + "\"})")

                app.set('message', "alink_added " + req.body.shortUrl + "")
                app.set('urlSearch', '')
                app.set('callinIn', 'callinIn')
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
app.get('/:shortUrl', async function (req, res) {
    try {
        let resUrl = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE short = '" + req.params.shortUrl + "'");
        let status = '';
        if (resUrl.rows.length > 0) {
            await cluster.query("UPDATE `" + bucket._name + "`  SET  clicks = clicks + 1 WHERE short = '" + req.params.shortUrl + "'");
            res.redirect(resUrl.rows[0].full);
        }
        else {
            let resUrl = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE short LIKE '%" + req.params.shortUrl + "%' or full LIKE '%" + req.params.shortUrl + "%'");
            if (resUrl.rows.length > 0) {
                app.set('urlSearch', req.params.shortUrl)
                app.set('alink', req.params.shortUrl)
                app.set('message', "searchPartial " + req.params.shortUrl + "")
                app.set('callinIn', 'callinIn')
                res.redirect('/');
            }
            else {
                if (req.params.shortUrl != 'favicon.ico') {
                    app.set('urlSearch', req.params.shortUrl)
                    app.set('message', "search " + req.params.shortUrl + "")
                    app.set('callinIn', 'callinIn')
                    res.redirect('/');
                }
            }
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json('Error while redirecting');
    }
})

//Get `by tags
app.get('/tag/:tag', async function (req, res) {
    try {
        let tag = req.params.tag.toUpperCase();
        let resUrl = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE tag LIKE '%" + tag + "%'");
        if (resUrl.rows.length > 0) {
            app.set('tag', tag)
            app.set('urlSearch', '')
            app.set('message', "yes_tag " + tag + "")
            app.set('callinIn', 'callinIn')
            res.redirect('/');
        }
        else {
            app.set('message', "no_tag " + tag + "")
            app.set('urlSearch', '')
            app.set('callinIn', 'callinIn')
            res.redirect('/');
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json('Error while get by tag');
    }
})

//Get `by creator : We need to find a way out to get the username without login
/*app.get('/creator/:creator', async function (req, res) {
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
})*/

//Delete an alink
app.post('/delUrl', async function (req, res) {

    try {
        await cluster.query("DELETE FROM `" + bucket._name + "`  WHERE linkID = '" + req.body.linkID + "'");
        app.set('message', "alink_deleted " + req.body.shortUrl+ "")
        app.set('urlSearch', '')
        app.set('callinIn', 'callinIn')
        res.redirect('/');
    }
    catch (err) {
        console.error(err);
        res.status(500).json('Error while deleting alink');
    }
})

//Edit an alink
app.post('/editUrl', async function (req, res) {

    try {
        if (!validUrl(req.body.fullUrl)) {
            app.set('message', 'invalid_url')
            app.set('urlSearch', '')
            app.set('callinIn', 'callinIn')
            res.redirect('/');
        }
        
        else {
            var noUpdate = 0
           
         
            if (req.body.fullUrl != req.body.prevFullUrl) {
                let longUrlCheck = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE full = '" + req.body.fullUrl + "'");
                //url exists
                if (longUrlCheck.rows.length > 0) {
                    app.set('message', 'url_exists')
                    app.set('urlSearch', '')
                    app.set('callinIn', 'callinIn')
                    noUpdate = 1
                }
               
            }
           
            if (req.body.shortUrl != req.body.prevShortUrl) {
                let shortUrlCheck = await cluster.query("SELECT `" + bucket._name + "`.* FROM `" + bucket._name + "` WHERE short = '" + req.body.shortUrl + "'");
                //alink exists
                if (shortUrlCheck.rows.length > 0) {
                    app.set('message', "alink_exists " + req.body.shortUrl + "")
                    app.set('urlSearch', '')
                    app.set('callinIn', 'callinIn')
                    noUpdate = 1
                }
                
            }
            //check for tag
            if (req.body.tag[1] == "") {
                app.set('message', 'needs_tag')
                app.set('urlSearch', '')
                app.set('callinIn', 'callinIn')
                noUpdate = 1
            }
           
            if (noUpdate != 1) {
                let creator = os.userInfo().username;
                if (req.body.tag.length == 2) {
                    req.body.tag = req.body.tag[1].toUpperCase()
                }
                await cluster.query("UPDATE `" + bucket._name + "`  SET  full = '" + req.body.fullUrl + "' , short = '" + req.body.shortUrl + "' , date = '" + new Date().toLocaleDateString() + "', tag = '" + req.body.tag + "', creator = '" + creator + "' WHERE linkID = '" + req.body.linkID + "'");
                app.set('message', "alink_updated " + req.body.shortUrl+ "")
                app.set('urlSearch', '')
                app.set('callinIn', 'callinIn')
            }
           
            res.redirect('/');
        }

    }
    catch (err) {
        console.error(err);
        res.status(500).json('Error while editing alink');
    }
})

app.listen(process.env.PORT || 5000);
