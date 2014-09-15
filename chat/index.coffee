server = require('./server')
Bacon =  require('baconjs').Bacon
_     = require('lodash')

advertisements = new Bacon.Bus()

setInterval ->
  advertisements.push(Math.random())
, 10000

# notifications = server.sockets.sampledBy server.connections, (sockets, connection) ->
#   otherUsers = _.filter sockets, (socket) -> socket.id != connection.id
#   ["#{connection.id} connected", otherUsers]

greetings = server.clients.sampledBy server.connections, (clients, connection) ->
  "There are #{_.keys(clients).length} people here, dude."

withoutCusses = server.messages.map (message) ->
  if message == 'shit' then 'poo' else message

server.broadcast(withoutCusses)
# server.broadcast(notifications)
server.broadcast(greetings)
server.broadcast(advertisements)


# broadcast = (message) ->
#   fn = -> message
#   console.log 'blar-ing'
#   blar = Bacon.combineTemplate({ sockets: sockets, message: fn })
#   blar.onValue (stuff) ->
#     console.log stuff

# messages.onValue broadcast


# connections.onValue (connection) ->
#   console.log 'user connected'

# sockets.onValue (sockets) ->
#   console.log 'current sockets', sockets.length
# wss.on('connection', function(ws) {
#     ws.on('message', function(message) {
#         console.log('received: %s', message);
#     });
#     ws.send('something');
# });


# io.on 'connection', (socket) -> connections.push(socket)

# connections.flatMap (connection) ->
#   Bacon.fromEventTarget connection,
# connections.onValue (val) ->
#   console.log('a user connected')

# io.on 'connection', (socket) ->
#   socket.on 'chat message', (msg) ->
#     console.log('message: ' + msg)
