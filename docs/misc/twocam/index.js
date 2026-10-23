
class Misc {
  constructor() {
    this.consoles = [];

    this.status = 'no';
    this.ts = [];
  }

  pad(v, n = 2) {
    return new String(v).padStart(n, '0');
  }

  async initialize() {
    this.setListener();
    {
      const el = document.getElementById('innerview');
      el.textContent = `2026-10-23 1`;
    }

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

    await this.update();
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

  async first() {
    const opt = {audio: true, video: true};
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
        if (true) {
          opt.video.width = {exact: 1024};
          opt.video.height = {exact: 1024};
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
          try {

          } catch (e) {

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
          await this.start();
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
      const el = document.getElementById('running');
      el?.addEventListener('change', () => {
        this.status = (el.checked) ? 'running' : 'no';
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

  async update() {
    if (this.status === 'capture') {
      await this.captureTwo();
    }

    window.requestAnimationFrame(() => {
      this.update();
    });

    {
      const now = Date.now();
      this.ts = this.ts.filter(ts => (now - ts) < 3000);
      const num = this.ts.length;
      let fps = 0;
      if (num >= 1) {
        fps = num / 3;
      }
      const el = document.getElementById('fpsview');
      el.textContent = `${fps.toFixed(1)} [fps]`;
      this.ts.push(now);
    }

  }

  /**
   * 
   * @param {Date} d 
   */
  timeText(d = new Date()) {
    let s = ``;
    s += `${this.pad(d.getFullYear(), 4)}${this.pad(d.getMonth() + 1)}${this.pad(d.getDate())}`;
    s += `_${this.pad(d.getHours())}${this.pad(d.getMinutes())}${this.pad(d.getSeconds())}`;
    s += `_${this.pad(d.getMilliseconds(), 3)}`;
    return s;
  }

  async captureTwo() {
    let d = new Date();
    const prefix = this.timeText(d);
    for (const k of ['environment', 'user']) {
      /** @type {HTMLVideoElement} */
      const video = document.getElementById(`${k}video`);
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w <= 0 || h <= 0) {
        continue;
      }
      const off = new OffscreenCanvas(w, h);
      const c = off.getContext('2d');
      c.drawImage(video, 0, 0);
      const blob = await off.convertToBlob({type: 'image/jpeg'});
      const name = `t${prefix}_${k}.jpg`;
      const fh = await this.subdh.getFileHandle(
        name, {create: true});
      const ws = await fh.createWritable({
        keepExistingData: false,
      });
      await ws.write({type: 'write', data: blob});
      await ws.close();
    }
  }

  async readyTwoCam() {
    const cams = [];
    for (const k of ['environment', 'user']) {
      const opt = {audio: false, video: {
        width: {ideal: 1024}, height: {ideal: 1024},
        facingMode: {exact: k}
      }};
      const stream = await navigator.mediaDevices.getUserMedia(opt);
      cams.push(stream);

      /** @type {HTMLVideoElement} */
      const video = document.getElementById(`${k}video`);
      video.srcObject = stream;
    }
  }

  async start() {
    const opt = {
      mode: 'readwrite',
      startIn: 'pictures',
    };
    const rootdh = await window.showDirectoryPicker(opt);
    this.rootdh = rootdh;
    const subdh = await rootdh.getDirectoryHandle(
      `t${this.timeText()}`,
      {create: true}
    );
    this.subdh = subdh;

    await this.readyTwoCam();
  }

}

const misc = new Misc();
misc.initialize();
