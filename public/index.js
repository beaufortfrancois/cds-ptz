const socket = io();

const mediaRecorderOptions = { mimeType: 'video/webm; codecs=vp9' };

navigator.getDisplayMedia({ video: true }).then(stream => {
  const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
  mediaRecorder.start(500);
  mediaRecorder.addEventListener('dataavailable', function(e) {
    socket.emit('broadcast', { blob: e.data });
  });
});

const mediaSource = new MediaSource();
video.src = URL.createObjectURL(mediaSource);
mediaSource.addEventListener('sourceopen', function() {
  let sourceBuffer = mediaSource.addSourceBuffer(mediaRecorderOptions.mimeType);
  socket.on('play', function(e) {
    sourceBuffer.appendBuffer(e.blob);
  });
});