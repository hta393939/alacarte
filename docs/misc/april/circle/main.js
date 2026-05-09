/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found at:
 *  https://github.com/webrtc/samples/blob/gh-pages/LICENSE.md
 */

// Put variables in global scope to make them available to the browser console.
const video = window.video = document.getElementById('webcam_canvas');
const canvas = window.canvas = document.getElementById('out_canvas');

// set camera info
var cameraInfoBox = document.getElementById('camera_info');
const cameraInfoDefaults = window.cameraInfo = JSON.parse(cameraInfoBox.value);

canvas.width = 480;
canvas.height = 360;

const _readyCamera = async () => {
  const constraints = {
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: cameraInfo.img_size[0],
      height: cameraInfo.img_size[1],
    }
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    window.stream = stream; // make stream available to browser console
    video.srcObject = stream;
  } catch (e) {
    console.log('navigator.MediaDevices.getUserMedia error: ', e.message, e.name);
    const el = document.getElementById('mark');
    if (el) {
      el.textContent = e.message;
    }
  }
};

// Change listener for camera parameters
cameraInfoBox.addEventListener('change', () => {
  try {
    window.cameraInfo = JSON.parse(cameraInfoBox.value);
  } catch (err) {
    console.log("Error parsing camera parameters!", err);
    cameraInfoBox.value = JSON.stringify(cameraInfoDefaults, null, 2);
  }
});

_readyCamera();
