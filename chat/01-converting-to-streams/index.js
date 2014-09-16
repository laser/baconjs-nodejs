var express = require('express'),
    request = require('request-json'),
    app     = express(),
    http    = require('http').Server(app),
    io      = require('socket.io')(http),
    Bacon   = require('baconjs').Bacon;

app.get('/', function(req, res) {
  res.sendFile('./static/index.html');
});

// TODO: DELETE THIS
app.post('/log', function(req, res) {
  res.send({});
});

app.use(express.static('./static'));

http.listen(3000, function() {
  console.log('listening on *:3000');
});

function weatherUpdate() {
  return Bacon
    .fromNodeCallback(
        request
          .newClient('http://api.openweathermap.org/data/2.5/'),
        'get',
        'weather?q=Seattle,wa&units=imperial')
    .map('.body')
    .map(JSON.parse)
    .map(function(body) {
      return body.weather[0].main + ', ' + body.main.temp + 'F';
    });
};

function logAttempt(packed) {
  var socket = packed[0], msg = packed[1], id = socket.id,
      client = request.newClient('http://localhost:3000/');

  return Bacon.fromNodeCallback(client, 'post', 'log', {
    id: id, msg: msg
  });
}

var connections = Bacon.fromBinder(function(sink) {
  io.on('connection', sink)
});

var currentWeather = Bacon
  .mergeAll(
    weatherUpdate(),
    Bacon
      .interval(2000)
      .flatMap(weatherUpdate)
  )
  .toProperty()

var greetings = currentWeather
  .sampledBy(connections, function(greeting, socket) {
    var tmp = 'Welcome! Current weather is: ' + greeting;
    return [tmp, socket];
  });

var messages = connections.flatMap(function(socket) {
  return Bacon.fromBinder(function(sink) {
    socket.on('message', function(msg) {
      sink([socket, msg]);
    });
  });
});

var logAttempts = messages.flatMap(function(packed) {
  return Bacon.retry({
    retries: 10,
    delay: function() { return 100; },
    source: function() { return logAttempt(packed); }
  });
});

connections.onValue(function(socket) {
  socket.broadcast.emit('message', 'CONN: ' + socket.id);
});

greetings.onValues(function(greeting, socket) {
  socket.send(greeting);
});

messages.onValues(function(socket, msg) {
  io.emit('message', '' + socket.id + ': ' + msg);
});

logAttempts.onValue(function() {
  console.log('log success');
});

Bacon
  .mergeAll(connections, greetings, messages, logAttempts)
  .onError(function(err) { throw err; });
