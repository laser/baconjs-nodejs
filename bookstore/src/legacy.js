var express = require('express');

var db = require('./database');

var app = express();

app.get('/books/:title', function(req, res) {
  var query = req.params.title;
  db.getBookByTitle(req.params.title, function(err, item) {
    var body = item === null ? 'No match found' : item;
    res.send(body);
  });
});

app.listen(3002);

console.log("Listening on port 3002");
