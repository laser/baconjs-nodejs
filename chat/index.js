var server = require('./server')
var Bacon =  require('baconjs').Bacon
var _     = require('underscore')

var advertisements = new Bacon.Bus()

setInterval(function() {
  advertisements.push(Math.random())
}, 10000);

var notifications = server
  .sockets
  .sampledBy(server.connections, function(sockets, connection) {
    var otherUsers = _.filter(sockets, function(socket) {
      return socket.id != connection.id;
    });
    return ['' + connection.id + ' just connected.', otherUsers];
    //return ["#{connection.id} connected", otherUsers]
  });

var greetings = server
  .sockets
  .sampledBy(server.connections, function(sockets, connection) {
    return ['There are ' + (sockets.length - 1) + ' other people here, dude.', [connection]];
  });

var withoutCusses = server
  .messages
  .map(function(message) {
    return message == 'shit' ? 'poo' : message;
  });

server.broadcast(withoutCusses)
server.broadcast(notifications)
server.broadcast(greetings)
server.broadcast(advertisements)
