var express = require('express');
var app = express();

var server = app.listen(8081);
var io = require('socket.io')(server);

io.on('connection', function(socket) {
  socket.on('data-available', function(data) {
    socket.emit('play-video', { data });
  });
});

app.use(express.static('public'));

