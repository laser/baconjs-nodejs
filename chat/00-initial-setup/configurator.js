var express = require('express'),
    app     = express(),
    http    = require('http').Server(app);

module.exports = function() {
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

  http.listen(3000, function() {
    console.log(new Date(), 'started server');
  });

  return http;
}
