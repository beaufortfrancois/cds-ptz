var express = require("express");
var app = express();

var server = app.listen(8081);
var io = require("socket.io")(server);

let firstBlob;
let shouldSaveFirstBlob = false;

io.on("connection", socket => {
  // if (firstBlob) {
  //   socket.emit("playback", { blob: firstBlob });
  // }
  socket.on("broadcast", data => {
    if (data.start) {
      shouldSaveFirstBlob = true;
    }
    // Broadcast to all connected clients.
    if (data.blob) {
      if (shouldSaveFirstBlob) {
        firstBlob = data.blob;
        shouldSaveFirstBlob = false;
      }
      io.emit("playback", data);
    }
    if ("pan" in data || "tilt" in data || "zoom" in data)
      socket.emit("camera", data);
  });
});

app.use(express.static("public"));
