var Bacon   = require('baconjs').Bacon;
var express = require('express');
var http    = require('http');
var WSS     = require('ws').Server

var app     = express();
var server  = http.createServer(app);
var wss     = new WSS({ server: server, path: '/messages'});
var _       = require('underscore');



// desired features
//
// assume: users A, B, C have connected
//
// 1. broadcast a message sent from A to both B and
//    C users
//
// 2. notify A, B, and C when D joins
//
// 3. replay the last 5 messages to D when they join
//
// 4. periodically insert into the message stream
//    an advertisement from CocaCorp
//

var connections = Bacon.fromEventTarget(wss, 'connection')
var sockets = connections.scan([], '.concat')

// satisfies #2
sockets.onValue(function(sockets) {
  _.chain(sockets)
    .take(sockets.length - 1)
    .each(function(s) {
      s.send('someone just joined');
    });
});

server.listen(3003);

console.log('Listening on port 3003');
