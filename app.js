var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');

var app = express();
var requestIp = require('request-ip');
var net = require('net');

// you can override which attirbute the ip will be set on by
// passing in an options object with an attributeName
app.use(requestIp.mw({attributeName: 'myCustomAttributeName'}));

// respond to all requests
app.use(function (req, res, next) {
  // use our custom attributeName that we registered in the middleware
  var ip = req.myCustomAttributeName;
  var ipType = net.isIP(ip); // returns 0 for invalid, 4 for IPv4, and 6 for IPv6
  var date = new Date();
  console.log('IP address is ' + ip + ' and is of type IPv ' + ipType + ' requested at ' + date);
  next();
});
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

module.exports = app;
