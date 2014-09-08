var Bacon   = require('baconjs').Bacon;
var express = require('express');
var http    = require('http');
var WSS     = require("ws").Server

var app     = express();
var server  = http.createServer(app);
var wss     = new WSS({ server: server, path: '/messages'});

var connections = Bacon.fromEventTarget(wss, 'connection');
var x = connections.flatMap(function(ws) {
  return Bacon.fromEventTarget(ws, 'message');
});

var messages = (new Bacon.Bus()).combine(x)

Bacon.zipAsArray(connections, messages).onValue(function(a) {
  var ws = a[0], text = a[1].data;
  ws.send(text);
});

server.listen(3003);

console.log("Listening on port 3003");
