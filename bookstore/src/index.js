var Bacon   = require('baconjs').Bacon;
var express = require('express');

var db      = require('./database');

var connections, response, app = express();

function streaminate(app, path) {
  var bus = new Bacon.Bus()

  app.get(path, function(req, res) {
    bus.push({
      req: function() { return req; },
      res: function() { return res; }
    });
  });

  return bus;
}

// a stream of inbound HTTP connections
connections = streaminate(app, '/books/:title');

// a mapping of inbound HTTP connections to books in our
// mongo database
responses = connections
  .map(function(o) { return o.req().params.title; })
  .flatMap(Bacon.fromNodeCallback, db.getBookByTitle)
  .map(function(o) { return o === null ? 'No match found' : o; })

// zip both streams together and respond
Bacon.zipAsArray(connections, responses).onValues(function(conn, body) {
  conn.res().send(body);
});

app.listen(3001);

console.log("Listening on port 3001");
