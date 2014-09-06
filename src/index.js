var Bacon   = require('baconjs').Bacon;
var express = require('express');
var _       = require('underscore');

var f     = require('./functional');
var db    = require('./database');

var connections, response,                               // streams
    fromRecordToResp, fromQueryToRecord, fromReqToQuery, // combinators
    app = express();

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

// return 'No match found' if null, val otherwise
fromRecordToResp = f.iif(f.thk('No match found'), f.id, f.neq(null));

// given an http conn, returns its title param
fromReqToQuery = _.compose(f.prop('title'), f.prop('params'), f.send('req'));

// given a book title, queries database
fromQueryToRecord = _.partial(Bacon.fromNodeCallback, db.getBookByTitle)

// a stream of inbound HTTP connections
connections = streaminate(app, '/books/:title');

// a mapping of inbound HTTP connections to books in our
// mongo database
responses = connections
  .map(fromReqToQuery)
  .flatMap(fromQueryToRecord)
  .map(fromRecordToResp)

// zip both streams together and respond
Bacon.zipAsArray(connections, responses).onValue(function(a) {
  var conn = a[0], body = a[1];
  conn.res().send(body);
});

app.listen(3001);

console.log("Listening on port 3001");
