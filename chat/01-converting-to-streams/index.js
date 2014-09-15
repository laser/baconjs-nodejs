var _       = require('underscore')
var path    = require('path')
var express = require('express')
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);
var Bacon   = require('baconjs').Bacon;

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

var messages = connections.flatMap(function(socket) {
  return Bacon.fromBinder(function(sink) {
    socket.on('message', function(message) {
      sink([socket, message]);
    });
  });
});

connections.onValue(function(socket) {
  socket.broadcast.emit('message', 'User ' + socket.id + ' has connected.');
});

messages.onValues(function(socket, message) {
  io.emit('message', '' + socket.id + ': ' + message);
});

disconnects.onValue(function(socket) {
  io.emit('User ' + socket.id + ' has disconnected.');
});

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.use(express.static(__dirname + '/static'));

http.listen(3000, function(){
  console.log('listening on *:3000');
});
