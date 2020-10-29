const socket = io();
const mimeType = "video/webm; codecs=vp9";

/* Recording */

let stream;

getUserMediaButton.onclick = async () => {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 160, height: 120, pan: true, tilt: true, zoom: true }
  });
  // Record screen video stream and broadcast stream to server
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 100000
  });
  mediaRecorder.start(200 /* timeslice */);
  mediaRecorder.ondataavailable = event => {
    socket.emit("broadcast", { blob: event.data });
  };
};

/* Camera PTZ */

function ptz(pan, tilt, zoom) {
  socket.emit("camera", { pan, tilt, zoom });
}

socket.on("camera", event => {
  const constraint = {};
  ["pan", "tilt", "zoom"].forEach(ptz => {
    if (ptz in event) constraint[ptz] = event[ptz];
  });
  stream.getVideoTracks()[0].applyConstraints({ advanced: [constraint] });
});

/* Playback video */

const mediaSource = new MediaSource();
video.src = URL.createObjectURL(mediaSource);
mediaSource.onsourceopen = () => {
  const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
  sourceBuffer.mode = "sequence";

  socket.on("playback", event => {
    // Receive video stream from server and play it back.
    if (!sourceBuffer.updating) sourceBuffer.appendBuffer(event.blob);
    getUserMediaButton.hidden = true;
  });
};
