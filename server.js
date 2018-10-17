var express = require("express");
var app = express();

var server = app.listen(8081);
var io = require("socket.io")(server);

let firstChunk = null;

io.on("connection", socket => {
  socket.on("broadcast", data => {
    // Broadcast to all connected clients.
    io.emit("playback", data);
    // Save first chunk for later
    if (data.isFirstChunk) {
      firstChunk = data;
    }
  });
  socket.on("hello", data => {
    // Broadcast first chunk to new connected client.
    if (firstChunk) {
      socket.emit("hello", firstChunk);
    }
  });
});

app.use(express.static("public"));
