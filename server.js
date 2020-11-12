var express = require("express");
var app = express();

var server = app.listen(8081);
var io = require("socket.io")(server);

let videoStreamingSocket;
let numberOfClientsConnected = 0;

let firstVideoStreamingData;

io.on("connection", socket => {
  numberOfClientsConnected++;
  io.emit("clients", {
    type: "connection",
    count: numberOfClientsConnected - 1
  });
  if (firstVideoStreamingData)
    socket.emit("firstVideoStreamingData", firstVideoStreamingData);

  socket.on("broadcast", data => {
    // if (videoStreamingSocket) videoStreamingSocket.disconnect(true);
    if (videoStreamingSocket != socket) {
      firstVideoStreamingData = data;
    }
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
  socket.on("capabilities", data => {
    // Broadcast ptz capabilities to all connected clients.
    io.emit("capabilities", data);
  });
  socket.on("disconnect", reason => {
    numberOfClientsConnected--;
    io.emit("clients", {
      type: "disconnection",
      count: numberOfClientsConnected - 1
    });
  });
});

app.use(express.static("public"));
