import * as Comlink from "./comlink.mjs";

class Asol {
  constructor() {
    this.R = [[], [], []];
    this.t = [0.1, 0.2, 0.3];
    this.e = 0.02;
    this.uniquesol = false;
  }
}

class Tag {
  constructor() {
    /** ID */
    this.id = -1;
    /** 4つ */
    this.corners = [{x: 0, y: 0}, {x: 1, y: 0}];
    /** 中心 */
    this.center = {x: -1, y: -1};
    this.pose = {R: [[], [], []],
      asol: new Asol,
      e: 0.02, size: 0.2, t: [0.1, 0.2, 0.3]};
  }
}


var detections = [];

const _marks = new Int32Array(38);

async function init() {
  // WebWorkers use `postMessage` and therefore work with Comlink.
  const source = `apriltag.js`;
  //const source = `../${window._dir}/apriltag.js`;
  const Apriltag = Comlink.wrap(new Worker(source));

  // must call this to init apriltag detector; argument is a callback for when the detector is ready
  window.apriltag = await new Apriltag(Comlink.proxy(() => {

    // set camera info; we must define these according to the device and image resolution for pose computation
    //window.apriltag.set_camera_info(double fx, double fy, double cx, double cy)

    window.apriltag.set_tag_size(5, .5);

    // start processing frames
    window.requestAnimationFrame(process_frame);
  }));
};

window.onload = (event) => {
  init();
};

async function process_frame() {

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  let ctx = canvas.getContext("2d");

  let imageData;
  try {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  } catch (err) {
    console.log("Failed to get video frame. Video not started ?");
    setTimeout(process_frame, 500); // try again in 0.5 s
    return;
  }
  let imageDataPixels = imageData.data;
  let grayscalePixels = new Uint8Array(ctx.canvas.width * ctx.canvas.height); // this is the grayscale image we will pass to the detector

  for (var i = 0, j = 0; i < imageDataPixels.length; i += 4, j++) {
    let grayscale = Math.round((imageDataPixels[i] + imageDataPixels[i + 1] + imageDataPixels[i + 2]) / 3);
    grayscalePixels[j] = grayscale; // single grayscale value
    imageDataPixels[i] = grayscale;
    imageDataPixels[i + 1] = grayscale;
    imageDataPixels[i + 2] = grayscale;
  }
  ctx.putImageData(imageData, 0, 0);

  // draw previous detection
  detections.forEach(/** @param {Tag} det */(det) => {
    // draw tag borders
    ctx.beginPath();
      ctx.lineWidth = "5";
      ctx.strokeStyle = "blue";
      ctx.moveTo(det.corners[0].x, det.corners[0].y);
      ctx.lineTo(det.corners[1].x, det.corners[1].y);
      ctx.lineTo(det.corners[2].x, det.corners[2].y);
      ctx.lineTo(det.corners[3].x, det.corners[3].y);
      ctx.lineTo(det.corners[0].x, det.corners[0].y);
      ctx.font = "bold 20px Arial";
      var txt = ""+det.id;
      ctx.fillStyle = "blue";
      ctx.textAlign = "center";
      ctx.fillText(txt, det.center.x, det.center.y+5);
    ctx.stroke();

    if (det.id < _marks.length) {
      _marks[det.id] += 1;
    }
  });

  // detect aprilTag in the grayscale image given by grayscalePixels
  detections = await apriltag.detect(grayscalePixels, ctx.canvas.width, ctx.canvas.height);

  if (detections.length > 0) {
    if (!window._notfirst) {
      window._notfirst = true;
      console.log('detections', detections);
    }
  }

  if (true) {
    let s = _marks.join(',');
    const el = document.getElementById('mark');
    if (el) {
      el.textContent = s;
    }
  }

  window.requestAnimationFrame(process_frame);
}

