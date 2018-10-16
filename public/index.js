const socket = io();
const mimeType = 'video/webm; codecs=vp9';

// Record screen video stream and broadcast stream to server
navigator.getDisplayMedia({ video: true }).then(stream => {
  const mediaRecorder = new MediaRecorder(stream, { mimeType });
  mediaRecorder.start(1000 /* TODO */);
  mediaRecorder.addEventListener('dataavailable', function(e) {
    socket.emit('broadcast', { blob: e.data });
  });
});

// Receive video stream from server and play it back.
const mediaSource = new MediaSource();
video.src = URL.createObjectURL(mediaSource);
mediaSource.addEventListener('sourceopen', function() {
  const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
  socket.on('play', function(e) {
    sourceBuffer.appendBuffer(e.blob);
  });
});