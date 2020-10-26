var express = require("express");
var app = express();

var server = app.listen(8081);
var io = require("socket.io")(server);

io.on("connection", socket => {
  socket.on("broadcast", data => {
    // Broadcast to all connected clients.
    if (data.blob) io.emit("playback", data);
    if (data.pan || data.tilt || data.zoom) io.emit("camera", data);
  });
});

app.use(express.static("public"));
