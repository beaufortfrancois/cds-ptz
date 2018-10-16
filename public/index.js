const socket = io();
const mimeType = 'video/webm; codecs=vp9';

const pipVideo = document.createElement('video');
pipVideo.autoplay = true;
pipVideo.muted = true;
/* BUG */ pipVideo.style.width = 1; document.body.appendChild(pipVideo);

navigator.mediaDevices.getUserMedia({ video: true }).then(cameraVideoStream => {
  pipVideo.srcObject = cameraVideoStream;
});


video.addEventListener('click', function() {

pipVideo.requestPictureInPicture();

// Record screen video stream and broadcast stream to server
navigator.getDisplayMedia({ video: true }).then(stream => {
  const mediaRecorder = new MediaRecorder(stream, { mimeType });

  mediaRecorder.start();
  mediaRecorder.ondataavailable = event => {
    socket.emit('broadcast', { blob: event.data });
  }
  setInterval(_ => mediaRecorder.requestData(), 1000);
});

  
});

// Receive video stream from server and play it back.
const mediaSource = new MediaSource();
video.src = URL.createObjectURL(mediaSource);
mediaSource.onsourceopen = _ => {
  const sourceBuffer = mediaSource.addSourceBuffer(mimeType);

  socket.on('playback', event => {
    sourceBuffer.appendBuffer(event.blob);
  });
}

