var request = require('request-json'),
    io      = require('./server'),
    Bacon   = require('baconjs').Bacon,
    client  = request.newClient('http://localhost:3000/api/');

function weatherUpdate() {
  return Bacon
    .fromNodeCallback(client, 'get', 'weather')
    .map('.body')
    .map(JSON.parse)
    .map(function(body) {
      return body.weather[0].main + ', ' + body.main.temp + 'F';
    });
};

var connections = Bacon.fromBinder(function(sink) {
  io.on('connection', sink)
});

var currentWeather = Bacon
  .mergeAll(weatherUpdate(), Bacon.interval(2000).flatMap(weatherUpdate))
  .toProperty()

var greetings = currentWeather
  .sampledBy(connections, function(weather, socket) {
    var s = 'Welcome! Current weather is: ' + weather;
    return { txt: s, recip: socket }
  });

var messages = connections.flatMap(function(socket) {
  return Bacon.fromBinder(function(sink) {
    socket.on('message', function(txt) {
      sink({ author: socket, txt: txt });
    });
  });
});

var entries = messages
  .filter(function(message) {
    return message.txt.indexOf('cloudy') > -1;
  })
  .flatMap(function(message) {
    return Bacon.retry({
      retries: 10,
      delay: function() { return 100; },
      source: function() {
        return Bacon.fromNodeCallback(client, 'post', 'log', {
          id: message.author.id, txt: message.txt
        });
      }
    });
});

var funFact = messages
  .scan(0, function(acc) { return acc + 1; })
  .filter(function(acc) { return acc % 5 === 0 })
  .map("Did you know...?");

connections.onValue(function(socket) {
  socket.broadcast.emit('message', 'CONN: ' + socket.id);
});

greetings.onValue(function(message) {
  message.recip.send(message.txt);
});

messages.onValue(function(message) {
  io.emit('message', '' + message.author.id + ': ' + message.txt);
});

funFact.onValue(function(fact) {
  io.emit('message', fact);
});

entries.onValue(function() {
  // deliberate no-op
});

Bacon
  .mergeAll(connections, greetings, messages, entries)
  .onError(function(err) { throw err; });
