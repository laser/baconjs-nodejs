var _       = require('underscore'),
    express = require('express'),
    request = require('request-json'),
    app     = express(),
    http    = require('http').Server(app),
    io      = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile('./static/index.html');
});

app.post('/api/log', function(req, res) {
  res.send(true);
});

app.get('/api/weather', function(req, res) {
  res.send({
    "main": {
      "temp": (Math.round(Math.random() * 1000) / 10)
    },
    "weather": [{
      "main": "Cloudy"
    }]
  });
});

app.use(express.static('./static'));

var seattleWeather = null;

setInterval(function() {
  request
    .newClient('http://localhost:3000/api/')
    .get('weather', function(err, response, body) {
      if (err) throw err;
      seattleWeather = body.weather[0].main + ', ' + body.main.temp + 'F';
    });
}, 2000);

function log(id, msg) {
  function log_(retries) {
    request
      .newClient('http://localhost:3000/api/')
      .post('log', { id: id, msg: msg }, function(err, response) {
        if (err) {
          if (retries > 0) {
            setTimeout(function() {
              log_(retries-1);
            }, 100);
          }
          else throw err
        }
      });
  }

  log_(10);
}

function main() {
  if (seattleWeather == null) {
    setTimeout(main, 100);
  }
  else {
    io.on('connection', function(socket) {
      socket.broadcast.emit('message', 'CONN: ' + socket.id);

      socket.send('Welcome! Current weather is: ' + seattleWeather);

      socket.on('message', function(msg) {
        log(socket.id, msg);
        io.emit('message', socket.id + ': ' + msg);
      });
    });
  }
}

main();

http.listen(3000, function() {
  console.log('listening on *:3000');
});
