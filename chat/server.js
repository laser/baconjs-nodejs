var path  = require('path')
var app   = require('express')()
var http  = require('http').Server(app)
var io    = require('socket.io')(http)
var Bacon = require('baconjs').Bacon
var _     = require('underscore')

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'frame.html'));
});

app.get('/index.html', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

http.listen(3003, function() {
  console.log('listening on *:3003');
});

var connectDisconnects = new Bacon.Bus()

io.on('connection', function(socket) {
  connectDisconnects.push(['connect', socket]);

  socket.on('disconnect', function() {
    connectDisconnects.push(['disconnect', socket]);
  });
});

var sockets = connectDisconnects.scan([], function(sockets, a) {
  var event = a[0], socket = a[1];
  if (event == 'connect') {
    return sockets.concat(socket)
  }
  else {
    return _.filter(sockets, function(s) {
      return s.id != socket.id
    });
  }
});

var connections = connectDisconnects
  .filter(function(a) {
    var event = a[0];
    return event == 'connect';
  })
  .map(function(a) {
    var connection = a[1];
    return connection;
  });

var disconnections = connectDisconnects
  .filter(function(a) {
    var event = a[0];
    return event == 'disconnect';
  })
  .map(function(a) {
    var connection = a[1];
    return connection;
  });

var messages = connections
  .flatMap(function(connection) {
    return Bacon.fromEventTarget(connection, 'message');
  });

broadcast = function(stream) {
  sockets
    .sampledBy(stream, function(sockets, message) {
      var msg, recips;

      if (_.isArray(message)) {
        msg = message[0], recips = message[1];
      }
      else {
        msg = message, recips = sockets;
      }

      return [recips, msg];
    })
    .onValues(function(sockets, message) {
      _.each(sockets, function(socket) {
        socket.emit('message', message);
      });
    });
}

module.exports = {
  connections: connections,
  disconnection: disconnections,
  messages: messages,
  broadcast: broadcast,
  sockets: sockets
}
