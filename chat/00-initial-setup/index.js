var _       = require('underscore'),
    request = require('request-json'),
    config  = require('./configurator')(),
    io      = require('socket.io')(config);

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

function getWeather(callback) {
  request
    .newClient('http://localhost:3000/api/')
    .get('weather', function(err, response, body) {
      console.log(new Date(), 'got weather update');
      callback(err, body.weather[0].main + ', ' + body.main.temp + 'F');
    });
}

getWeather(function(err, weather) {
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
      log(socket.id, msg);
      io.emit('message', socket.id + ': ' + msg);
    });
  });
});
