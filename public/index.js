const socket = io();
const mimeType = 'video/webm; codecs=vp9,opus';

const pipVideo = document.createElement('video');
pipVideo.autoplay = true;
pipVideo.muted = true;
/* BUG */ pipVideo.style.width = '1px'; document.body.appendChild(pipVideo);

navigator.mediaDevices.getUserMedia({ video: true }).then(cameraVideoStream => {
  pipVideo.srcObject = cameraVideoStream;
});

// User clicks on video to enter Picture-in-Picture and record display and microphone.
video.onclick = async _ => {
  await pipVideo.requestPictureInPicture();

  const screenVideoStream = await navigator.getDisplayMedia({ video: true });
  const voiceAudioStream  = await navigator.mediaDevices.getUserMedia({ audio: true });

  const stream = new MediaStream([
    ...screenVideoStream.getTracks(),
    ...voiceAudioStream.getTracks()
  ]);

  // Record screen video stream and broadcast stream to server
  const mediaRecorder = new MediaRecorder(stream, { mimeType });
  mediaRecorder.start();
  mediaRecorder.ondataavailable = event => {
    socket.emit('broadcast', { blob: event.data });
  }
  setInterval(_ => mediaRecorder.requestData(), 1000);
}

// Receive video stream from server and play it back.
const mediaSource = new MediaSource();
video.src = URL.createObjectURL(mediaSource);
mediaSource.onsourceopen = _ => {
  const sourceBuffer = mediaSource.addSourceBuffer(mimeType);

  socket.on('playback', event => {
    if (!document.pictureInPictureElement) {
      video.controls = true;
      video.muted = false;
      video.currentTime = 
    }
    sourceBuffer.appendBuffer(event.blob);
  });
}

