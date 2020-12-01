const socket = io();
const mimeType = "video/webm; codecs=vp9";

/* Recording & streaming */

let stream;
let mediaRecorder;
let containsInitSegment = false;

getUserMediaButton.onclick = async () => {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1, height: 1, pan: true, tilt: true, zoom: true }
  });
  startStreaming();
};

function startStreaming() {
  if (mediaRecorder) {
    mediaRecorder.stop();
    setTimeout(_ => {
      // FIXME: I'm not sure why this is needed... ;(
      mediaRecorder = undefined;
      startStreaming();
    }, 100);
    return;
  }
  mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 100000
  });
  containsInitSegment = true;
  mediaRecorder.start(500 /* timeslice */);
  mediaRecorder.ondataavailable = ({ data }) => {
    socket.emit("broadcast", { data, containsInitSegment });
    containsInitSegment = false;
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
}

/* Playback video */

let pendingData = [];
let mediaSource;
let sourceBuffer;

socket.on("playback", ({ data, containsInitSegment }) => {
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
  mediaSource = new MediaSource();
  video.src = URL.createObjectURL(mediaSource);
  mediaSource.onsourceopen = () => {
    sourceBuffer = mediaSource.addSourceBuffer(mimeType);
    sourceBuffer.mode = "sequence";
    appendBuffer();
  };
}

function appendBuffer() {
  if (pendingData.length === 0) return;
  if (!sourceBuffer || sourceBuffer.updating) {
    setTimeout(_ => appendBuffer, 100);
    return;
  }
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

pan.oninput = () => socket.emit("camera", { pan: pan.value });
tilt.oninput = () => socket.emit("camera", { tilt: tilt.value });
zoom.oninput = () => socket.emit("camera", { zoom: zoom.value });

socket.on("camera", constraints => {
  const [videoTrack] = stream.getVideoTracks();
  videoTrack.applyConstraints({ advanced: [constraints] });
});

/* Clients count */

socket.on("clients", ({ type, count }) => {
  if (!stream) return;

  clientsCount.textContent = count ? `${count} connected` : "";
  if (type === "connection") startStreaming();
});

socket.on("allowedToBroadcast", allowedToBroadcast => {
  getUserMediaButton.hidden = !allowedToBroadcast;
});

/* Picture-in-Picture */

video.ononcanplay = () => {
  video.onclick = () => video.requestPictureInPicture();
};
