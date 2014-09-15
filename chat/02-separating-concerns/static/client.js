$(function() {
  var socket = io();

  socket.on('message', function(message) {
    $("#messages").append("<li>" + message + "</li>")
  });

  $('form').submit(function(e){
    socket.emit('message', $('#m').val());
    $('#m').val('');
    e.preventDefault();
  });
});
