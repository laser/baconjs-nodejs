path  = require('path')
app   = require('express')()
http  = require('http').Server(app)
io    = require('socket.io')(http)
Bacon = require('baconjs').Bacon
_     = require('underscore')

app.get '/', (req, res) ->
  res.sendFile(path.join(__dirname, 'frame.html'))

app.get '/index.html', (req, res) ->
  res.sendFile(path.join(__dirname, 'index.html'))

http.listen 3003, -> console.log('listening on *:3003')

connectDisconnects = new Bacon.Bus()

io.on 'connection', (socket) ->
  connectDisconnects.push(['connect', socket])
  socket.on 'disconnect', -> connectDisconnects.push(['disconnect', socket])

sockets = connectDisconnects.scan([], (sockets, [event, socket]) ->
  if event == 'connect'
    sockets.concat(socket)
  else
    _.filter sockets, (s) -> s.id != socket.id
)

connections = connectDisconnects.filter ([event, _]) -> event == 'connect'
  .map ([_, connection]) -> connection

disconnections = connectDisconnects.filter ([event, _]) -> event == 'disconnect'
  .map ([_, connection]) -> connection

messages = connections.flatMap (connection) ->
  Bacon.fromEventTarget connection, 'message'

broadcast = (stream) ->
  sockets
    .sampledBy stream, (sockets, message) ->
      [ message, recipients ] = message if _.isArray(message)
      [ recipients || sockets, message ]
    .onValues (sockets, message) ->
      for socket in sockets
        socket.emit 'message', message

module.exports = {
  connections: connections,
  disconnection: disconnections
  messages: messages,
  broadcast: broadcast,
  sockets: sockets
}
