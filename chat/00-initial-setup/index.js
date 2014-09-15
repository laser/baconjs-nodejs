var _       = require('underscore')
var path    = require('path')
var express = require('express')
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.use(express.static(__dirname + '/static'));

io.on('connection', function(socket) {
  socket.broadcast.emit('message', 'User ' + socket.id + ' has connected.');

  socket.on('message', function(msg) {
    io.emit('message', '' + socket.id + ': ' + msg);
  });

  socket.on('disconnect', function() {
    io.sockets.emit('User ' + socket.id + ' has disconnected.');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
