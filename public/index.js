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
  mediaRecorder.start(1000 /* timeslice */);
  mediaRecorder.ondataavailable = event => {
    socket.emit("broadcast", { blob: event.data });
  };

  const [videoTrack] = stream.getVideoTracks();
  {
    const { pan, tilt, zoom } = videoTrack.getSettings();
    socket.emit("settings", { pan, tilt, zoom });
  }
  {
    const { pan, tilt, zoom } = videoTrack.getCapabilities();
    socket.emit("capabilities", { pan, tilt, zoom });
  }
};

/* Camera PTZ */

socket.on("settings", event => {
  ["pan", "tilt", "zoom"].forEach(ptz => {
    if (ptz in event) {
      document.getElementById(ptz).disabled = false;
      document.getElementById(ptz).value = event[ptz];
    }
  });
});

socket.on("capabilities", event => {
  ["pan", "tilt", "zoom"].forEach(ptz => {
    if (ptz in event) {
      document.getElementById(ptz).min = event[ptz].min;
      document.getElementById(ptz).max = event[ptz].max;
      document.getElementById(ptz).step = event[ptz].step;
    }
  });
});

pan.oninput = () => {
  socket.emit("camera", { pan: pan.value });
};
tilt.oninput = () => {
  socket.emit("camera", { tilt: tilt.value });
};
zoom.oninput = () => {
  socket.emit("camera", { zoom: zoom.value });
};

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
