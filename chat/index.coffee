server = require('./server')
Bacon =  require('baconjs').Bacon
_     = require('underscore')

advertisements = new Bacon.Bus()

setInterval ->
  advertisements.push(Math.random())
, 10000

notifications = server.sockets.sampledBy server.connections, (sockets, connection) ->
  otherUsers = _.filter sockets, (socket) -> socket.id != connection.id
  ["#{connection.id} connected", otherUsers]

greetings = server.sockets.sampledBy server.connections, (sockets, connection) ->
  ["There are #{sockets.length - 1} other people here, dude.", [connection]]

withoutCusses = server.messages.map (message) ->
  if message == 'shit' then 'poo' else message

server.broadcast(withoutCusses)
server.broadcast(notifications)
server.broadcast(greetings)
server.broadcast(advertisements)
