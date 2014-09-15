var _          = require('underscore'),
    path       = require('path'),
    express    = require('express'),
    app        = express(),
    http       = require('http').Server(app),
    io         = require('socket.io')(http),
    Bacon      = require('baconjs').Bacon,
    InboundMsg = require('./shared').InboundMsg;

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

var inboundMsgs = connections.flatMap(function(socket) {
  return Bacon.fromBinder(function(sink) {
    socket.on('message', function(message) {
      sink(new InboundMsg(message, socket));
    });
  });
});

var tag = function(tag) {
  return function(value) {
    return [tag, value];
  };
};

var activeSockets = connections
  .map(tag('connection'))
  .merge(disconnects.map(tag('disconnect')))
  .scan([], function(acc, tagged) {
    var event = tagged[0], socket = tagged[1];
    return event == 'connection'
      ? acc.concat(socket)
      : _.filter(acc, function(s) { return s.id != socket.id });
  });

var send = function(outbounds) {
  activeSockets
    .sampledBy(outbounds, function(sockets, outbound) {
      return [sockets, outbound];
    })
    .onValues(function(sockets, outbound) {
      _.each(outbound.recipients, function(_socket) {
        _socket.send(outbound.content);
      });
    });
};

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.use(express.static(__dirname + '/static'));

http.listen(3000, function(){
  console.log('listening on *:3000');
});

module.exports = {
  send: send,
  connections: connections,
  disconnects: disconnects,
  inboundMsgs: inboundMsgs,
  activeSockets: activeSockets
};
