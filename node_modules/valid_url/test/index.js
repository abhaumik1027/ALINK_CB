var validUrl = require('../index.js');
var assert = require('assert');

var url = "google.com"
assert.equal(validUrl(url), true);

var url = "http://google.com"
assert.equal(validUrl(url), true);

var url = "https://google.com"
assert.equal(validUrl(url), true);

var url = "http://www.google.com"
assert.equal(validUrl(url), true);

var url = "https://www.google.com"
assert.equal(validUrl(url), true);

var url = "google.es"
assert.equal(validUrl(url), true);

var url = "http://google.es"
assert.equal(validUrl(url), true);

var url = "https://google.es"
assert.equal(validUrl(url), true);

var url = "https://www.google.com"
assert.equal(validUrl(url), true);

var url = "http://www.google.com"
assert.equal(validUrl(url), true);

var url = "https://d1f4470da51b49289906b3d6cbd65074@app.getsentry.com/13176"
assert.equal(validUrl(url), true);

var url = "d1f4470da51b49289906b3d6cbd65074@app.getsentry.com/13176"
assert.equal(validUrl(url), true);

var url = "ftp://test@example.com"
assert.equal(validUrl(url), true);

//Not valid

var url = "mongodb://u:p@example.com:21332/mydb"
assert.equal(validUrl(url), false);

var url = "wss://secure.example.com/biz"
assert.equal(validUrl(url), false);

var url = "google"
assert.equal(validUrl(url), false);

var url = "http://google"
assert.equal(validUrl(url), false);

var url = "https://google"
assert.equal(validUrl(url), false);

var url = "www.google"
assert.equal(validUrl(url), false);

var url = "http://www.google"
assert.equal(validUrl(url), false);

var url = "https://www.google"
assert.equal(validUrl(url), false);

var url = "htt://google.es"
assert.equal(validUrl(url), false);

var url = "htt://www.google.es"
assert.equal(validUrl(url), false);

var url = "htt://google"
assert.equal(validUrl(url), false);

var url = ""
assert.equal(validUrl(url), false);
