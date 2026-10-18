
/**
 * @typedef Point2d
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef BoundingBox
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * 結果の一つ
 * @typedef DetectedBarcode
 * @property {BoundingBox} boundingBox
 * @property {Point2d[]} cornerPoints 
 * @property {string} format "qr_code"
 * @property {string} rawValue URLなど
 */

/// <reference path="../../third_party/libqrean/Qrean.d.ts" />
import { Qrean } from '../../third_party/libqrean/Qrean.js';

class Misc {
  static STATUS_NONE = 'none';
  static STATUS_READY = 'ready';
  static STATUS_RUNNING = 'running';

  constructor() {
    this.consoles = [];

    /** @type {MediaStreamVideoTrack} */
    this.track = null;

    /** @type {number[]} */
    this.times = [];
    this.timesdetect = [];

    this.status = Misc.STATUS_NONE;
  }

  _pad(v, n = 2) {
    return new String(v).padStart(n, '0');
  }

  async initialize() {
    this.setStatus(Misc.STATUS_NONE);
    this.setListener();

    {
      const dpr = window.devicePixelRatio;
      const iw = window.innerWidth;
      const ih = window.innerHeight;
      const dcw = document.documentElement.clientWidth;
      const dch = document.documentElement.clientHeight;
      const sw = window.screen.width;
      const sh = window.screen.height;
      const saw = window.screen.availWidth;
      const sah = window.screen.availHeight;
      this.log(`dpr,i,dc,sc,sca,${dpr}, ${iw}x${ih}, ${dcw}x${dch}, ${sw}x${sh}, ${saw}x${sah}`);
    }

    this.update();

    this.initializeWorker();

    this.makeQr('9999');

    {
      const el = document.getElementById('innerview');
      if (el) {
        el.textContent = `2026-10-17T15:00`;
      }
    }
  }

  async log(...args) {
    const d = new Date();
    const text = `${d.toLocaleTimeString()}.${new String(d.getMilliseconds()).padStart(3, '0')},` + args.join(',');
    this.consoles.unshift(text);
    const el = document.getElementById('console');
    if (!el) {
      return;
    }
    const br = document.createElement('br');
    el.insertBefore(br, el.firstChild);
    const node = document.createTextNode(text);
    el.insertBefore(node, el.firstChild);
  }

  applyResult(data) {
    const result = data.result;
    if (!result) {
      // 検知無し
      this.setText('#resultview', `,-2`);
      return;
    }

    if (Array.isArray(result)) {
      this.applyBarcode(result);
      return;
    }

    this.applyLib(result);
  }

  applyLib(result) {
    const detected = result.detected;
    /** おそらくグレースケール */
    const digitized = result.digitized;

    this.setText('#resultview', `,${detected.length}`);
    if (detected.length >= 1) {
      console.log('detected', detected.length);
    }

    {
      const canvas = document.getElementById('resultcanvas');
      canvas.width = digitized.width;
      canvas.height = digitized.height;
      const c = canvas.getContext('2d');
      c.font = `bold 24px consolas`;
      const imageData = c.getImageData(0, 0, canvas.width, canvas.height);
      imageData.data.set(digitized.data);
      c.putImageData(imageData, 0, 0);
      for (const one of detected) {
        c.strokeStyle = `red`;
        c.beginPath();
        let first = true;
        for (const xy of one.points) {
          let x = xy[0];
          let y = xy[1];
          if (first) {
            first = false;
            c.moveTo(x, y);
            continue;
          }
          c.lineTo(x, y);
        }
        c.closePath();
        c.stroke();

        c.fillStyle = 'rgb(160, 160, 0)';
        c.beginPath();
        const rr = 1;
        c.ellipse(one.points[1][0], one.points[1][1],
          rr, rr, 0,
          0, Math.PI * 2
        );
        c.closePath();
        c.fill();

        c.fillStyle = 'green';
        c.fillText(`${one.text}`, one.points[0][0], one.points[0][1]);
      }
    }
  }

  /**
   * 
   * @param {DetectedBarcode[]} result 
   */
  async applyBarcode(result) {
    {
      /** @type {HTMLCanvasElement} */
      const src = document.getElementById('subcanvas');

      const canvas = document.getElementById('resultcanvas');
      canvas.width = src.width;
      canvas.height = src.height;
      const c = canvas.getContext('2d');
      c.font = `bold 24px consolas`;

      c.drawImage(src, 0, 0);

      for (const one of result) {
        c.strokeStyle = `red`;
        c.beginPath();
        let first = true;
        for (const xy of one.cornerPoints) {
          let x = xy.x;
          let y = xy.y;
          if (first) {
            first = false;
            c.moveTo(x, y);
            continue;
          }
          c.lineTo(x, y);
        }
        c.closePath();
        c.stroke();

        c.fillStyle = 'rgb(0, 192, 192)';
        c.beginPath();
        const rr = 4;
        c.ellipse(one.cornerPoints[1].x, one.cornerPoints[1].y,
          rr, rr, 0,
          0, Math.PI * 2
        );
        c.closePath();
        c.fill();

        c.fillStyle = 'green';
        c.fillText(`${one.rawValue}`, one.cornerPoints[0].x, one.cornerPoints[0].y);
      }
    }

  }

  /**
   * ワーカー検知器を用意する
   */
  initializeWorker() {
    const worker = new Worker('./worker.js' + location.search);
    this.worker = worker;

    worker.addEventListener('message', ev => {
      console.log('receive', ev.data);
      switch (ev.data.type) {
        case 'detectresult':
          this.timesdetect.push(Date.now());
          this.setStatus(Misc.STATUS_READY);
          this.applyResult(ev.data);
          break;
        case 'ready':
          {
            const err = ev.data.error;
            if (err) {
              this.log('worker Barcode error');
              return;
            }
            this.setStatus(Misc.STATUS_READY);
          }
          break;
      }
    });
  }

  /**
   * 
   * @param {string} status 
   */
  setStatus(status) {
    this.status = status;
    const icons = {
      [Misc.STATUS_NONE]: '⌛',
      [Misc.STATUS_READY]: '⏸️',
      [Misc.STATUS_RUNNING]: '🤔',
    };
    const el = document.getElementById('statusview');
    if (!el) {
      return;
    }
    el.textContent = `${icons[status]}, ${status}, ${new Date().toLocaleTimeString()}`;
  }

  /**
   * 初回用
   */
  async first() {
    const opt = {audio: false, video: {
      aspectRatio: {ideal: 1.0 / 1.0},
      facingMode: {ideal: 'environment'}
    }};
    const stream = await navigator.mediaDevices.getUserMedia(opt);
    for (const track of stream.getTracks()) {
      let text = `${track.kind},${track.label},${track.id}`;
      this.log(text);
    }
  }

  /**
   * 
   * @param {MediaStream} ms 
   */
  async endStream(ms) {
    for (const vt of ms.getVideoTracks()) {
      vt.enabled = false;
      vt.stop();
      ms.removeTrack(vt);
    }
  }

  async enum() {
    {
      const dev = await navigator.mediaDevices.getUserMedia({video: true});
      await this.endStream(dev);
    }

    const parent = document.getElementById('devices');
    const devs = await navigator.mediaDevices.enumerateDevices();
    for (const dev of devs) {
      let text = `${dev.kind},${dev.label},${dev.deviceId}`;
      this.log(text);

      if (!parent) {
        continue;
      }
      if (dev.kind !== 'videoinput') {
        continue;
      }

      const el = document.createElement('button');
      el.textContent = `${dev.label}`;
      el.classList.add('pointer', 'largebutton');
      el.addEventListener('click', async ev => {
        const opt = {
          audio: false,
          video: {
            deviceId: {exact: dev.deviceId},
          },
        };
        if (false) {
          opt.video.width = {exact: 1024};
          opt.video.height = {exact: 1024};
        }
        if (false) {
          opt.video.width = {exact: 640};
          opt.video.height = {exact: 480};
        }
        {
          opt.video.aspectRatio = {ideal: 1.0 / 1.0};
        }

        const stream = await navigator.mediaDevices.getUserMedia(opt);
        let str = `getUserMedia succ,${dev.label}`;
        this.log(str);
        for (const track of stream.getVideoTracks()) {
          try {
            const capa = await track.getCapabilities();
            this.log(`${JSON.stringify(capa)}`);
          } catch (e) {
            this.log(`${e.message}`);
          }

          //if (dev.label.includes('back') || dev.label.startsWith('Android')) {
          if (true) {
            this.track = track;
            /** @type {HTMLVideoElement} */
            const video = document.getElementById('video');
            if (video && !video.srcObject) {
              video.srcObject = stream;
            }
          }
        }
      });
      parent.appendChild(el);
    }
  }

  download(blob, name) {
    const a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(blob);
    a.click();
  }

  setListener() {
    {
      const el = document.getElementById('encode');
      el?.addEventListener('click', () => {
        const textel = document.getElementById('enctext');
        this.makeQr(textel.value);
      });
    }

    {
      const el = document.body;
      el?.addEventListener('dragover', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'none';
      });
      el?.addEventListener('drop', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'none';
      });
    }
    {
      const el = document.querySelector('.drop');
      el?.addEventListener('dragover', ev => {
        ev.stopPropagation();
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'copy';
      });
      el?.addEventListener('drop', ev => {
        ev.stopPropagation();
        ev.preventDefault();
        //this.analyzeText(ev.dataTransfer.files[0]);
      });
    }

    {
      const el = document.getElementById('startbutton');
      el?.addEventListener('click', async () => {
        try {
          await this.first();
        } catch (e) {
          this.log(`first,${e.message}`);
        }
      });
    }
    {
      const el = document.getElementById('enumbutton');
      el?.addEventListener('click', async () => {
        this.enum();
      });
    }

    {
      const el = document.getElementById('actscan');
      el?.addEventListener('click', () => {
        this.readyReader();
      });
    }

    {
      const el = document.getElementById('zoomnumber');
      const viewel = document.getElementById('zoomnumberview');
      const _update = ev => {
        const val = Number.parseFloat(el.value);
        if (Number.isFinite(val)) {
          viewel.textContent = `${val}`;
        }
        return val;
      };
      el?.addEventListener('input', _update);
      el?.addEventListener('change', ev => {
        const result = _update();
        if (Number.isFinite(result)) {
          this.setZoom(result);
        }
      });
      _update();
    }

    for (const k of ['startcount', 'addcount', 'outcount']) {
      const el = document.getElementById(k);
      if (!el) {
        continue;
      }
      const _update = () => {
        const val = Number.parseFloat(el.value);
        const viewel = document.getElementById(`${k}view`);
        if (viewel) {
          viewel.textContent = `${val}`;
        }
      };
      el?.addEventListener('input', _update);
      _update();
    }

  }

  /**
   * ビデオからコンテキストを返す
   */
  makeContext() {
    /** @type {HTMLVideoElement} */
    const video = document.getElementById('video');
    const w = video.videoWidth;
    const h = video.videoHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.drawImage(video, 0, 0);
    return c;
  }

  /**
   * リーダーを用意する
   * @returns 
   */
  async readyReader() {
    const el = document.getElementById('scanview');
    try {
      const c = this.makeContext();
      const canvas = c.canvas;
      const imgdata = c.getImageData(0, 0, canvas.width, canvas.height);

      /** @type {detected: Detected[]} */
      const result = await Qrean.detect(imgdata, {});
      el.textContent = `${result.detected.length}`;
      for (const detected of result.detected) {
        this.log('result', JSON.stringify(detected));

        this.makeView(canvas, detected);
      }
      document.body.appendChild(canvas);

    } catch (e) {
      this.log('detect', e.message);
    }
    this.log('readyReader end');
  }

  /**
   * 追加はしない
   * @param {HTMLCanvasElement} canvas
   * @param {Detected} one 
   */
  makeView(canvas, one) {
    const c = canvas.getContext('2d');
    {
      const pts = one.points;
      let sx = pts[0][0];
      let sy = pts[0][1];
      c.fillStyle = '#ff0000';
      c.beginPath();
      c.ellipse(sx, sy, 4, 4, 0,
        0, Math.PI * 2);
      c.closePath();
      c.fill();

      c.fillStyle = '#55aaaa';
      c.beginPath();
      c.ellipse(pts[1][0], pts[1][1], 8, 8, 0,
        0, Math.PI * 2);
      c.closePath();
      c.fill();

      c.beginPath();
      c.moveTo(sx, sy);
      c.strokeStyle = '#00aa00';
      for (let i = 1; i <= 3; ++i) {
        c.lineTo(pts[i][0], pts[i][1]);
      }
      c.closePath();
      c.lineWidth = 4;
      c.stroke();
    }

  }

  /**
   * 
   * @param {number} rate 
   */
  async setZoom(rate) {
    try {
      /** @type {MediaStreamVideoTrack} */
      const track = this.track;
      if (!track) {
        return;
      }
      const opt = {
        advanced: [{zoom: rate}]
      };
      await track.applyConstraints(opt);
      this.log(`apply success`);
    } catch (e) {
      this.log(`apply,catch,${e.message}`);
    }
  }

  async update() {
    try {
      const el = document.getElementById('enableloop');
      if (el?.checked) {

        if (this.status === Misc.STATUS_READY) {
          /** @type {HTMLVideoElement} */
          const video = document.getElementById('video');
          const w = video.videoWidth;
          const h = video.videoHeight;
          const canvas = document.getElementById('subcanvas');
          canvas.width = w;
          canvas.height = h;
          const c = canvas.getContext('2d');
          c.drawImage(video, 0, 0);
          const imageData = c.getImageData(0, 0, w, h);
          await this.send(imageData);

          this.setStatus(Misc.STATUS_RUNNING);
        }
      }
    } catch (e) {
      // catch
    }

    window.requestAnimationFrame(() => {
      this.update();
    });


    // フレームレートのカウント
    const nowts = Date.now();
    this.times = this.times.filter(ts => nowts - ts < 2000);
    this.timesdetect = this.timesdetect.filter(ts => nowts - ts < 2000);
    const n = this.times.length;
    let fps = 0;
    if (n >= 1) {
      fps = n / 2;
    }

    let fpsdetect = 0;
    if (this.timesdetect.length >= 1) {
      fpsdetect = this.timesdetect.length / 2;
    }

    {
      const el = document.getElementById('fpsview');
      if (el) {
        el.textContent = `${fps.toFixed(1)} fps, ${fpsdetect.toFixed(1)} fps`;
      }
    }
    this.times.push(nowts);
  }


  /**
   * 
   * @param {ImageData} imageData 
   */
  async send(imageData) {
    const obj = {
      type: 'detect',
      width: imageData.width,
      height: imageData.height,
      data: imageData.data,
    }
    try {
      this.worker.postMessage(obj);
    } catch (e) {
      this.setText('#warnview', `${new Date().toLocaleTimeString()}, ${e.message}`);
    }
  }

  /**
   * 
   * @param {string} qtext 
   * @param {string} text 
   */
  setText(qtext, text) {
    const el = document.querySelector(qtext);
    if (!el) {
      return;
    }
    el.textContent = text;
  }

  makeCanvas(img) {
    const w = img.width;
    const h = img.height;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const imgdata = ctx.getImageData(0, 0, w, h);
    imgdata.data.set(img.data);
    ctx.putImageData(imgdata, 0, 0);
    return canvas;
  }

  /**
   * 
   * @param {string} text 
   */
  async makeQr(text) {
    // keyof ってオブジェクトのキーの方だったか
    const opts = {
      //codeType: Qrean.CODE_TYPES.mQR,
      codeType: Qrean.CODE_TYPE_MQR,

      //'Q',
      qrErrorLevel: 'L',
    };
    const img = await Qrean.encode(text, opts);
    if (img) {
      const canvas = this.makeCanvas(img);
      document.body.appendChild(canvas);
    } else {
      this.log('encode failure');
    }
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
