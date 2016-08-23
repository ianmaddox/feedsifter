"use strict";
var express = require('express');
var app = express();
var feedsifter = require('./main');

app.set('port', (process.env.PORT || 5000));

// app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(req, res) {

  var feed = req.query.feed;
  var filters = req.query.filters;
  console.log(Date(), feed, "START.  Filters:", JSON.stringify(filters));
  if(!feed || !filters) {
    res.render('create');
  } else {
    var start = +(new Date());
    feedsifter(feed, filters)
    .then((out) => {
      if(out === false) {
        res.render('create');
        console.log(Date(), feed, "ERROR.  Runtime", (+(new Date() - start)/1000) + "s");
      } else {
        res.writeHead(200, {'Content-Type':'text/xml'});
        res.write(out);
        res.end();
        console.log(Date(), feed, "SUCCESS.  Runtime", (+(new Date() - start)/1000) + "s");
      }
    });
  }
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
