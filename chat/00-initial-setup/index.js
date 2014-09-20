var _       = require('underscore'),
    request = require('request-json'),
    io      = require('./server');

function log(id, msg, callback) {

  function attempt(retries) {
    request
      .newClient('http://localhost:3000/api/')
      .post('log', { id: id, msg: msg }, function(err, response) {
        if (!err) callback(err, response);
        else {
          if (retries < 0) callback(err, response);
          else {
            setTimeout(function() {
              attempt(retries-1);
            }, 100);
          }
        }
      });
  }

  attempt(10);
}

function getWeather(callback) {
  request
    .newClient('http://localhost:3000/api/')
    .get('weather', function(err, response, body) {
      callback(err, body.weather[0].main + ', ' + body.main.temp + 'F');
    });
}

getWeather(function(err, weather) {
  var messageCount = 0;

  if (err) throw err

  function poll() {
    setTimeout(function() {
      getWeather(function(err, _weather) {
        if (err) throw err;
        weather = _weather;
        poll()
      });
    }, 2000);
  }

  poll();

  io.on('connection', function(socket) {
    socket.broadcast.emit('message', 'CONN: ' + socket.id);

    socket.send('Welcome! Current weather is: ' + weather);

    socket.on('message', function(msg) {
      io.emit('message', socket.id + ': ' + msg);

      if (20 === ++messageCount) {
        messageCount = 0;
        io.emit('message', 'Did you know...?');
      }

      if (msg.indexOf("cloudy") !== -1) {
        log(socket.id, msg, function(err) {
          if (err) throw err;
          // otherwise OK
        })
      }
    });
  });
});
