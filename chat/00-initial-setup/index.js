var path    = require('path')
var express = require('express')
var app     = express()
var http    = require('http').Server(app)
var io      = require('socket.io')(http)
var _       = require('underscore')

var connectedSockets = [];

io.on('connection', function(socket) {
  connectedSockets.push(socket);

  socket.on('disconnect', function() {
    connectedSockets = _.filter(connectedSockets, function(s) {
      return s.id != socket.id;
    });
  });

  socket.on('message', function(message) {
    _.each(connectedSockets, function(socket) {
      socket.send(message);
    });
  });
});

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.use(express.static(__dirname + '/static'));

http.listen(3003, function() {
  console.log('listening on *:3003');
});
