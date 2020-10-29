var express = require("express");
var app = express();

var server = app.listen(8081);
var io = require("socket.io")(server);

io.on("connection", socket => {
  socket.on("broadcast", data => {
    // Broadcast video stream to all connected clients.
    io.emit("playback", data);
    streamingVideoSocket
  });
  socket.on("camera", data => {
    // Send
      socket.emit("camera", data);
  });
});

app.use(express.static("public"));
