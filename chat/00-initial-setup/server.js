var express = require('express'),
    app     = express(),
    http    = require('http').Server(app),
    io      = require('socket.io');

app.get('/', function(req, res) {
  res.sendFile('./static/index.html');
});

app.post('/api/log', function(req, res) {
  var x = ((Math.random() * 10) > 5) ? "NOT\nJSON" : true;
  res.send(x);
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

module.exports = io(http);
