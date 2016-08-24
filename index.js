"use strict";
var express = require('express');
var app = express();
var feedsifter = require('./main');

app.set('port', (process.env.PORT || 5000));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if(req.query.f !== undefined) {
    log(ip,"LEGACY", req.query.f, undefined, "Legacy request rejected")
    res.status(400).render('400');
    return;
  }

  var feed = req.query.feed;
  var filters = req.query.filters;
  if(!feed || !filters) {
    log(ip, 'CREATE', feed)
    res.render('create');
  } else {
    log(ip, 'START', feed, start);
    var start = +(new Date());
    feedsifter(feed, filters)
    .then((out) => {
      if(out === false) {
        res.render('create');
        log(ip, 'ERROR', feed, start, 'Unspecified error');
      } else {
        res.writeHead(200, {'Content-Type':'text/xml'});
        res.write(out);
        res.end();
        log(ip, 'SUCCESS', feed, start)
      }
    })
    .catch((e) => {
      res.status(400).render('400');
      log(ip, 'FAIL', feed, start, e.message)
      return;
    });
  }
});

/**
 * Simple unified logging method
 * @param {String} End user IP
 * @param {String} Action name
 * @param {String} Feed URL
 * @param {Integer} Unix Msec of process start
 * @param {String} Extra message to record
 */
function log(ip, action, feed, start, message) {
  var sec = (+(new Date() - start)/1000);
  var runtime = start === undefined ? "" : "Runtime:" + sec + "s  ";
  message = message === undefined ? "" : message;
  feed = feed === undefined ? "" : feed;
  var actionPad = "         ";
  action = action + actionPad.substring(0, actionPad.length - action.length);
  var ipPad = "                ";
  ip = ip + ipPad.substring(0, ipPad.length - ip.length);

  console.log(Date(), ip, action, feed, runtime, message);
}

app.listen(app.get('port'), function() {
  console.log(Date(), 'Node app is running on port', app.get('port'));
});
