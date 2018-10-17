const socket = io();
const mimeType = 'video/webm; codecs=vp9,opus';


/* Recording */

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
  mediaRecorder.start(30 /* timeslice */);
  mediaRecorder.ondataavailable = event => {
    if (event.data.size === 0)
      return;
    socket.emit('broadcast', { blob: event.data });
  }
  video.classList.add('playing');
}, { once: true });


/* Playback video */

let chunks = [];

// Receive video stream from server and play it back.
const mediaSource = new MediaSource();
video.src = URL.createObjectURL(mediaSource);
mediaSource.onsourceopen = _ => {
  const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
  
  socket.on('playback', event => {
    chunks.push(event.blob);
    appendBuffer();

    // Add controls to unmute video.
    if (!document.pictureInPictureElement && !video.controls) {
      video.addEventListener('playing', _ => { video.controls = true }, { once : true }  );
    }
  });

  function appendBuffer() {
    if (sourceBuffer.updating || chunks.length === 0)
      return;

    sourceBuffer.appendBuffer(chunks.shift());
    sourceBuffer.addEventListener('updateend', appendBuffer, { once: true });
  }
}


      // video.addEventListener('loadedmetadata', _ => { video.style.background = 'black'; }, { once : true }  );