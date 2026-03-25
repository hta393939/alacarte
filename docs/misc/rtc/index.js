
const _pad = (v, n = 2) => {
  return new String(v).padStart(n, '0');
};

class Misc {
  constructor() {
    this.consoles = [];

    /** @type {MediaStreamVideoTrack} */
    this.track = null;
  }

  async initialize() {
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
          //if (dev.label.includes('back') || dev.label.startsWith('Android')) {
          if (true) {
            this.track = track;
            /** @type {HTMLVideoElement} */
            const video = document.getElementById('video');
            /** @type {HTMLVideoElement} */
            const subvideo = document.getElementById('subvideo');
            if (video && !video.srcObject) {
              video.srcObject = stream;
            } else {
              subvideo.srcObject = stream;
            }
          }
        }
      });
      parent.appendChild(el);
    }
  }

  makeFilename(num) {
    return `${this.prefix}${_pad(num, this.num)}.${this.ext}`;
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
      const el = document.getElementById('torchon');
      el?.addEventListener('click', () => {
        this.setTorch(true);
      });
    }
    {
      const el = document.getElementById('torchoff');
      el?.addEventListener('click', () => {
        this.setTorch(false);
      });
    }
    {
      const el = document.getElementById('zoom10');
      el?.addEventListener('click', () => {
        this.setZoom(10);
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
   * 
   * @param {boolean} onoff 
   */
  async setTorch(onoff) {
    try {
      /** @type {MediaStreamVideoTrack} */
      const track = this.track;
      if (!track) {
        return;
      }
      const opt = {
        advanced: [{torch: onoff}]
      };
      await track.applyConstraints(opt);
      this.log(`apply success`);
    } catch (e) {
      this.log(`apply,catch,${e.message}`);
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

}

const misc = new Misc();
misc.initialize();
