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
  mediaRecorder.start(1000 /* timeslice */);
  mediaRecorder.ondataavailable = event => {
    if (event.data.size === 0) return;
    socket.emit("broadcast", { blob: event.data });
  };
}

// /* Playback video */

let chunks = [];

// Receive video stream from server and play it back.
const mediaSource = new MediaSource();
video.src = URL.createObjectURL(mediaSource);
mediaSource.addEventListener(
  "sourceopen",
  () => {
    const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
    sourceBuffer.mode = 'sequence';
    console.log(sourceBuffer);

    socket.on("playback", event => {
      console.log(`video.currentTime: ${video.currentTime}`);
      console.log(`video.duration: ${video.duration}`);
      console.log(`mediaSource.duration: ${mediaSource.duration}`);
      // if (video.duration) video.currentTime = video.duration;
      console.log("playback");
      chunks.push(event.blob);
      appendBuffer();
    });

    function appendBuffer() {
      if (sourceBuffer.updating || chunks.length === 0) return;

      sourceBuffer.appendBuffer(chunks.shift());
      sourceBuffer.addEventListener("updateend", appendBuffer, { once: true });
    }
  },
  { once: true }
);
