const socket = io();
const mimeType = 'video/webm; codecs=vp9';

// Record screen video stream and broadcast stream to server
navigator.getDisplayMedia({ video: true }).then(stream => {
  const mediaRecorder = new MediaRecorder(stream, { mimeType });

  mediaRecorder.start(1000 /* 1 to record into each blob */);
  mediaRecorder.ondataavailable = event => {
    socket.emit('broadcast', { blob: event.data });
  }
});

// Receive video stream from server and play it back.
const mediaSource = new MediaSource();
video.src = URL.createObjectURL(mediaSource);
mediaSource.addEventListener('sourceopen', _ => {
  const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
  socket.on('play', event => {
    sourceBuffer.appendBuffer(event.blob);
  });
});