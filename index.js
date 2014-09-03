var express = require('express');
var app = express();

app.get('/hello', function(req, res) {
  console.log('request received');
  res.send('Hello World');
});

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});
