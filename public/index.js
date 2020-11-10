const socket = io();
const mimeType = "video/webm; codecs=vp9";

/* Recording */

let stream;
let mediaRecorder;
let containsInitSegment = false;

getUserMediaButton.onclick = async () => {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1, height: 1, pan: true, tilt: true, zoom: true }
  });
  live.srcObject = stream;
  startStreaming();

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

function startStreaming() {
  console.log("startStreaming");
  mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 100000
  });
  containsInitSegment = true;
  mediaRecorder.start(500 /* timeslice */);
  mediaRecorder.ondataavailable = event => {
    // console.log("ondataavailable!");

    const date = new Date();
    // console.log({ containsInitSegment });
    console.log("date:" + date.toJSON());
    socket.emit("broadcast", { blob: event.data, containsInitSegment, date });
    containsInitSegment = false;
  };
}

/* Playback video */

let pendingBuffers = [];
let mediaSource;
let sourceBuffer;

socket.on("playback", ({ blob, containsInitSegment, date }) => {
  // console.log("playback!", { containsInitSegment, date });
  if (containsInitSegment) {
    resetVideo();
    pendingBuffers = [blob];
    return;
  }
  pendingBuffers.push(blob);
  // Receive video stream from server and play it back.
  appendBuffer();
});

function resetVideo() {
  console.log("resetVideo");
  if (video.src) {
    URL.revokeObjectURL(video.src);
    video.srcObject = null;
  }
  mediaSource = new MediaSource();
  video.src = URL.createObjectURL(mediaSource);
  mediaSource.onsourceopen = () => {
    console.log("sourceopen");
    sourceBuffer = mediaSource.addSourceBuffer(mimeType);
    sourceBuffer.mode = "sequence";
    appendBuffer();
  };
}

function appendBuffer() {
  // console.log("appendBuffer", pendingBuffers);
  if (pendingBuffers.length === 0) return;
  if (!sourceBuffer || sourceBuffer.updating) {
    console.log("HEY!", !sourceBuffer, sourceBuffer.updating);
    setTimeout(_ => appendBuffer, 100);
    return;
  }
  console.log("sourceBuffer.appendBuffer");
  sourceBuffer.appendBuffer(pendingBuffers[0]);
  pendingBuffers.shift();
}

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
  const [videoTrack] = stream.getVideoTracks();
  videoTrack.applyConstraints({ advanced: [event] });
});

/* Clients count */

socket.on("clients", ({ type, count }) => {
  if (stream && type === "connection") {
    startStreaming();
  }
  clientsCount.textContent = count;
});
