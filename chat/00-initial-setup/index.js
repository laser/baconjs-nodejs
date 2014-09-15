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

var connected = [];

io.on('connection', function(socket){
  connected.push(socket);

  socket.on('message', function(msg){
    _.each(connected, function(s) {
      s.send(msg);
    });
  });

  socket.on('disconnect', function() {
    connected = _.filter(connected, function(s) {
      return s.id != socket.id;
    });
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
