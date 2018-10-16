var express = require('express');
var app = express();

var server = app.listen(8081);
var io = require('socket.io')(server);

io.on('connection', function(socket) {
  socket.on('broadcast', function(data) {
    // Broadcast to all connected clients.
    io.emit('play', data);
  });
});

app.use(express.static('public'));

