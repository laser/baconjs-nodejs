var express = require('express'),
    fs      = require('fs'),
    app     = express(),
    http    = require('http').Server(app),
    io      = require('socket.io')(http),
    Bacon   = require('baconjs').Bacon;

app.get('/', function(req, res) {
  res.sendFile('./static/index.html');
});

app.use(express.static('./static'));

var greeting = Bacon
  .fromNodeCallback(fs.readFile, './hello.asdtxt', 'utf8')
  .toProperty()

var sockets = Bacon.fromBinder(function(sink) {
  io.on('connection', sink)
});

var greetings = greeting.sampledBy(sockets, function(grt, skt) {
  return [grt, skt];
})

var messages = sockets.flatMap(function(skt) {
  return Bacon.fromBinder(function(sink) {
    skt.on('message', function(msg) {
      sink([skt, msg]);
    });
  });
});

var appends = messages.flatMap(function(packed) {
  var skt = packed[0], msg = packed[1];
  var path = './logs/' + skt.id + '.log';
  return Bacon.fromNodeCallback(fs.appendFile, path, msg + '\n');
});

sockets.onValue(function(skt) {
  skt.broadcast.emit('message', 'CONN: ' + skt.id);
});

greetings.onValues(function(grt, skt) {
  skt.send(grt);
});

messages.onValues(function(skt, msg) {
  io.emit('message', '' + skt.id + ': ' + msg);
});

appends.onValue(function() {
  // no op; simply starts the "pull"
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});
