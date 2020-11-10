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

  mediaRecorder?.stop();
  mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 100000
  });
  containsInitSegment = true;
  mediaRecorder.start(2000 /* timeslice */);
  mediaRecorder.ondataavailable = ({ data }) => {
    const date = new Date();
    console.log(
      `[ondataavailable] containsInitSegment: ${containsInitSegment}, date: ${date.toJSON()}`
    );
    if (containsInitSegment
      socket.emit("broadcast", { data, containsInitSegment, date });
    containsInitSegment = false;
  };
}

/* Playback video */

let pendingData = [];
let mediaSource;
let sourceBuffer;

socket.on("playback", ({ data, containsInitSegment, date }) => {
  // console.log("playback!", { containsInitSegment, date });
  if (containsInitSegment) {
    resetVideo();
    pendingData = [data];
    return;
  }
  pendingData.push(data);
  // Receive video stream from server and play it back.
  appendBuffer();
});

function resetVideo() {
  console.log("resetVideo");
  // if (video.src) {
  // URL.revokeObjectURL(video.src);
  // video.src = null;
  // }
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
  if (pendingData.length === 0) return;
  if (!sourceBuffer || sourceBuffer.updating) {
    console.log("HEY!", !sourceBuffer, sourceBuffer.updating);
    setTimeout(_ => appendBuffer, 100);
    return;
  }
  console.log("sourceBuffer.appendBuffer");
  sourceBuffer.appendBuffer(pendingData[0]);
  pendingData.shift();
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
