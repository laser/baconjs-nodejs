path  = require('path')
app   = require('express')()
http  = require('http').Server(app)
io    = require('socket.io')(http)
Bacon = require('baconjs').Bacon
_     = require('lodash')

app.get '/', (req, res) ->
  res.sendFile(path.join(__dirname, 'frame.html'))

app.get '/index.html', (req, res) ->
  res.sendFile(path.join(__dirname, 'index.html'))

http.listen 3003, -> console.log('listening on *:3003')

class Client
  constructor: (@id, @incoming, @outgoing) ->

connections    = new Bacon.Bus()
disconnections = new Bacon.Bus()
messages       = new Bacon.Bus()
broadcastMsgs  = new Bacon.Bus()

io.on 'connection', (socket) ->
  incoming = Bacon.fromEventTarget socket, 'message'
  outgoing = new Bacon.Bus()
  outgoing.onValue (message) -> socket.send(message)

  unplug1 = messages.plug(incoming)
  unplug2 = outgoing.plug(broadcastMsgs)
  client = new Client(socket.id, incoming, outgoing)

  connections.push(client)
  socket.on 'disconnect', ->
    disconnections.push(client)
    unplug1()
    unplug2()

clients = connections.merge(disconnections).scan [], (clients, client) ->
  index = _.findIndex clients, (c) -> c.id == client.id

  if index == -1
    clients.concat(client)
  else
    clients.splice(index, 1)
    clients

broadcast = (stream) ->
  broadcastMsgs.plug(stream)

module.exports = {
  connections: connections
  disconnection: disconnections
  clients: clients
  messages: messages
  broadcast: broadcast
}