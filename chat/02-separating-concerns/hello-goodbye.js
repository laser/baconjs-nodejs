var _           = require('underscore'),
    server      = require('./server'),
    OutboundMsg = require('./shared').OutboundMsg;

var greetings = server
  .activeSockets
  .sampledBy(server.connections, function(sockets, connection) {
    return new OutboundMsg('There are ' + (sockets.length - 1) + ' other people here, dude.', [connection]);
  });

var notifications = server
  .activeSockets
  .sampledBy(server.connections, function(sockets, connection) {
    var otherUsers = _.filter(sockets, function(socket) {
      return socket.id != connection.id;
    });
    return new OutboundMsg('' + connection.id + ' just connected.', otherUsers);
  });

var passthrough = server
  .activeSockets
  .sampledBy(server.inboundMsgs, function(sockets, inboundMsg) {
    return new OutboundMsg(inboundMsg.content, sockets)
  });

server.send(passthrough);
server.send(greetings);
server.send(notifications);
