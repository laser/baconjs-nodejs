var _       = require('underscore'),
    express = require('express'),
    request = require('request'),
    fs      = require('fs'),
    app     = express(),
    http    = require('http').Server(app),
    io      = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile('./static/index.html');
});

app.use(express.static('./static'));

var randomWord = "";

setInterval(function() {
  request('http://randomword.setgetgo.com/get.php', function(err, response) {
    if (err) throw err;
    randomWord = response.body;
  });;
}, 2000);

function main() {
  if (randomWord == "") {
    setTimeout(main, 100);
  }
  else {
    io.on('connection', function(socket) {

      socket.broadcast.emit('message', 'CONN: ' + socket.id);

      socket.send('New user, your word is: ' + randomWord);

      socket.on('message', function(msg) {
        var path = './logs/' + socket.id + '.log';

        fs.appendFile(path, msg + '\n', function(err) {
          if (err) throw err;
        });

        io.emit('message', socket.id + ': ' + msg);
      });
    });
  }
}

main();

http.listen(3000, function() {
  console.log('listening on *:3000');
});
