var _       = require('underscore')
var path    = require('path')
var express = require('express')
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);
var Bacon   = require('baconjs').Bacon;

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.use(express.static(__dirname + '/static'));

var connections = Bacon.fromBinder(function(sink) {
  io.on('connection', sink)
});

var disconnects = connections.flatMap(function(socket) {
  return Bacon.fromBinder(function(sink) {
    socket.on('disconnect', function() {
      sink(socket);
    });
  });
});

var connectDisconnects = connections
  .map(function(socket) { return ['connection', socket]; })
  .merge(disconnects.map(function(socket) { return ['disconnect', socket]; }));

var active = connectDisconnects.scan([], function(acc, packed) {
  var event = packed[0], socket = packed[1];
  return event == 'connection'
    ? acc.concat(socket)
    : _.filter(acc, function(s) { return s.id != socket.id });
});

var messages = connections.flatMap(function(socket) {
  return Bacon.fromEventTarget(socket, 'message');
});

active
  .sampledBy(messages, function(sockets, message) {
    return [sockets, message];
  })
  .onValues(function(sockets, message) {
    _.each(sockets, function(s) {
      s.send(message);
    });
  });

http.listen(3000, function(){
  console.log('listening on *:3000');
});
