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
video.addEventListener('click', async _ => {
  await pipVideo.requestPictureInPicture();

  const screenVideoStream = await navigator.getDisplayMedia({ video: true });
  const voiceAudioStream  = await navigator.mediaDevices.getUserMedia({ audio: true });

  const stream = new MediaStream([
    ...screenVideoStream.getTracks(),
    ...voiceAudioStream.getTracks()
  ]);

  // Record screen video stream and broadcast stream to server
  const mediaRecorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 6000, videoBitsPerSecond: 100000});
  // const mediaRecorder = new MediaRecorder(stream, { mimeType });
  mediaRecorder.start();
  mediaRecorder.ondataavailable = event => {
    if (event.data.size === 0)
      return;
    socket.emit('broadcast', { blob: event.data });
  }
  setInterval(_ => mediaRecorder.requestData(), 30);
}, { once: true });

let chunks = [];
let isAppendingBuffer = false;

// Receive video stream from server and play it back.
const mediaSource = new MediaSource();
video.src = URL.createObjectURL(mediaSource);
mediaSource.onsourceopen = _ => {
  mediaSource.addSourceBuffer(mimeType);

  socket.on('playback', event => {
    if (!document.pictureInPictureElement && !video.controls) {
      video.controls = true;
      video.play();
    }
    chunks.push(event.blob);
    appendBuffer();
  });
}

function appendBuffer() {
  if (chunks.length === 0 || isAppendingBuffer)
    return;
  const blob = chunks.shift();
  const sourceBuffer = mediaSource.sourceBuffers[0];
  sourceBuffer.appendBuffer(blob);
  isAppendingBuffer = true;
  sourceBuffer.addEventListener('updateend', function() {
    isAppendingBuffer = false;
    appendBuffer();
  }, { once: true });

}

