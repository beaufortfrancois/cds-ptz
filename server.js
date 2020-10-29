var express = require("express");
var app = express();

var server = app.listen(8081);
var io = require("socket.io")(server);

let videoStreamingSocket;

io.on("connection", socket => {
  socket.on("broadcast", data => {
    videoStreamingSocket = socket;
    // Broadcast video stream to all connected clients.
    io.emit("playback", data);
  });
  socket.on("camera", data => {
    // Send new camera values to the video streaming socket client.
    videoStreamingSocket.emit("camera", data);
  });
  socket.on("settings", data => {
    // Broadcast ptz settings to all connected clients.
    io.emit("settings", data);
  });
});

app.use(express.static("public"));
