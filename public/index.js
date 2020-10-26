const socket = io();
const mimeType = "video/webm; codecs=vp9";

/* Recording */

let stream;

async function getUserMedia() {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 160, height: 120, pan: true, tilt: true, zoom: true }
  });

  // Record screen video stream and broadcast stream to server
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 100000
  });
  mediaRecorder.start(500 /* timeslice */);
  mediaRecorder.ondataavailable = event => {
    socket.emit("broadcast", { blob: event.data });
  };
}

/* Camera PTZ */

function ptz(pan, tilt, zoom) {
  socket.emit("broadcast", { pan, tilt, zoom });
}

socket.on("camera", event => {
  console.log("camera");
  const panTiltZoom = {};
  if (event.pan) panTiltZoom.pan = event.pan;
  if (event.tilt) panTiltZoom.tilt = event.tilt;
  if (event.zoom) panTiltZoom.zoom = event.zoom;
  const [track] = stream.getVideoTracks();
  track.applyConstraints({ advanced: [panTiltZoom] });
});

/* Playback video */

let chunks = [];

// Receive video stream from server and play it back.
const mediaSource = new MediaSource();
video.src = URL.createObjectURL(mediaSource);
mediaSource.addEventListener(
  "sourceopen",
  () => {
    const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
    sourceBuffer.mode = "sequence";

    socket.on("playback", event => {
      console.log("playback");
      chunks.push(event.blob);
      appendBuffer();
    });

    function appendBuffer() {
      if (sourceBuffer.updating || chunks.length === 0) return;

      sourceBuffer.appendBuffer(chunks.shift());
      // sourceBuffer.addEventListener("updateend", appendBuffer, { once: true });
    }
  },
  { once: true }
);
