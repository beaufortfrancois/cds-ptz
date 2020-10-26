const socket = io();
const mimeType = "video/webm; codecs=vp9,opus";

/* Recording */

async function getUserMedia() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { pan: true, tilt: true, zoom: true }
  });

  const video = document.createElement("video");
  video.autoplay = true;
  video.muted = true;
  video.srcObject = stream;
  video.play();

  document.body.classList.add("broadcasting");

  // Record screen video stream and broadcast stream to server
  const mediaRecorder = new MediaRecorder(stream, { mimeType });
  mediaRecorder.start(30 /* timeslice */);
  mediaRecorder.ondataavailable = event => {
    if (event.data.size === 0) return;
    socket.emit("broadcast", { blob: event.data });
  };
}

/* Playback video */

let chunks = [];

// Receive video stream from server and play it back.
const mediaSource = new MediaSource();
video.src = URL.createObjectURL(mediaSource);
mediaSource.onsourceopen = _ => {
  const sourceBuffer = mediaSource.addSourceBuffer(mimeType);

  socket.on("playback", event => {
    chunks.push(event.blob);
    appendBuffer();

    // Add controls to unmute video.
    if (!document.pictureInPictureElement && !video.controls) {
      video.addEventListener(
        "playing",
        _ => {
          video.controls = true;
        },
        { once: true }
      );
    }
    document.body.classList.add("playing");
    video.removeEventListener("click", onVideoFirstClick);
  });

  function appendBuffer() {
    if (sourceBuffer.updating || chunks.length === 0) return;

    sourceBuffer.appendBuffer(chunks.shift());
    sourceBuffer.addEventListener("updateend", appendBuffer, { once: true });
  }
};
