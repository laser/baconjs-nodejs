var _       = require('underscore'),
    express = require('express'),
    fs      = require('fs'),
    app     = express(),
    http    = require('http').Server(app),
    io      = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile('./static/index.html');
});

app.use(express.static('./static'));

fs.readFile('./hello.txt', 'utf8', function(err, greeting) {
  if (err) throw err;

  io.on('connection', function(socket) {

    socket.broadcast.emit('message', 'CONN: ' + socket.id);

    socket.send(greeting);

    socket.on('message', function(msg) {
      var path = './logs/' + socket.id + '.log';

      fs.appendFile(path, msg + '\n', function(err) {
        if (err) throw err;
      });

      io.emit('message', socket.id + ': ' + msg);
    });
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});
