class Misc {
  static MODE_NONE = 'none';
  static MODE_ONOFF = 'onoff';
  static MODE_PROGRESS = 'progress';

  constructor() {
    /**
     * ざっくり 9.8 ベース
     */
    this.x = 0;
    this.y = 0;
    this.z = 0;

    this.shx = 4;
    this.shy = 8;

    /**
     * 情報表示するしない
     */
    this.isinfo = 1;

    this.isx = 1;

    this.is0 = 0;

    this.curts = 0;
    this.prets = 0;

    this.mode = Misc.MODE_NONE;

    this.col = {
      body: 'rgb(32, 82, 111)', // 筐体
      onshadow: 'rgb(67, 158, 176)', // 点火影 ピック時
      //onshadow: 'rgb(47, 128, 156)', // 点火影

      off: 'rgb(9,46,63)', // 液晶無点火
      on: 'rgb(168, 243, 255)', // 液晶点火
      cyan: 'rgb(0,128,255)',
    };
  }

  async initialize() {
    this.setListener();

    {
      const canvas = await this.loadImage('./gqdot.png');
      this.dotcanvas = canvas;
    }
    {
      const canvas = await this.loadImage('./gqdot3.png');
      this.dot3canvas = canvas;
    }

    this.update();
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => {
        const w = image.width;
        const h = image.height;
        const canvas = new OffscreenCanvas(w, h);
        const c = canvas.getContext('2d');
        c.drawImage(image, 0, 0);
        console.log('loadImage two');
        resolve(canvas);
      });
      image.src = url;
      console.log('loadImage one');
    });
  }

  setListener() {
    const qs = document.querySelectorAll('.live');
    for (const el of qs) {
      const k = el.id;
      const viewel = document.getElementById(`${k}view`);
      const _update = () => {
        const val = Number.parseFloat(el.value);
        this[k] = Number.isFinite(val) ? val : el.value;

        if (viewel) {
          viewel.textContent = this[k];
        }
      };

      //_update();
    }

    {
      const el = document.body;
      el?.addEventListener('click', async (ev) => {
        const cx = ev.clientX;
        const cy = ev.clientY;

        const cw = document.documentElement.clientWidth;
        const ch = document.documentElement.clientHeight;

        if (cx < cw * 0.5) {
          if (cy < ch * 0.5) {
            this.fullscreen();
            this.startIMU();
          } else {
            this.is0 = 1 - this.is0;
          }
        } else {
          if (cy < ch * 0.5) {
            this.isinfo = 1 - this.isinfo;
          } else {
            //this.isx = 1 - this.isx;
            if (this.mode === Misc.MODE_NONE) {
              this.mode = Misc.MODE_ONOFF;
            } else {
              this.mode = Misc.MODE_NONE;
            }
          }
        }
      });
    }

    this.ready();
  }

  update() {
    requestAnimationFrame(() => {
      this.update();
    });

    {
      const dst = document.getElementById('maincanvas');
      this.updateScreen(dst);
    }
  }

  async startIMU() {
    if (this.imu) {
      return;
    }

    const sensor = new Accelerometer();
    this.imu = sensor;
    sensor.addEventListener('reading', ev => {
      const x = sensor.x;
      const y = sensor.y;
      const z = sensor.z;
      this.x = x;
      this.y = y;
      this.z = z;
    });
    sensor.start();
  }

  async fullscreen() {
    try {
      await document.exitFullscreen();
    } catch (e) {
      await document.body.requestFullscreen();
    }
  }

  ready() {
    const canvas = document.getElementById('maincanvas');
    const dpr = window.devicePixelRatio;
    // デバイス解像度を取得するようにする
    const sw = window.screen.width;
    const sh = window.screen.height;

    const cw = document.documentElement.clientWidth;
    const ch = document.documentElement.clientHeight;
    const w = Math.ceil(sw * dpr);
    const h = Math.ceil(sh * dpr);
    canvas.width = w;
    canvas.height = h;

    const c = canvas.getContext('2d');
    c.fillStyle = 'black';
    c.fillRect(0, 0, w, h);

    c.strokeStyle = 'white';
    c.lineWidth = 1;
    //c.lineWidth = dpr;
    //c.lineWidth = 0.5;
    const data = c.getImageData(0, 0, w, h);
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let offset = (x + w * y) * 4;
        if ((x & 1) === 0) {
          continue;
        }
        data.data[offset] = 255;
        data.data[offset+1] = 255;
        data.data[offset+2] = 255;
        data.data[offset+3] = 255;
      }
    }
    c.putImageData(data, 0, 0);

  }

  /**
   * 
   * @param {*} canvas 
   * @param {HTMLCanvasElement} dstcanvas 
   */
  updateScreen(dstcanvas) {
    const nowts = Date.now();
    this.curts = nowts;

    const c = dstcanvas.getContext('2d');
    const dw = dstcanvas.width;
    const dh = dstcanvas.height;
    c.fillStyle = 'black';
    c.fillRect(-16, -16, dw + 32, dh + 32);

    {
      c.fillStyle = 'white';
      c.fillRect(0, 0, dw, 2 + 4);
    }
    let canvas = this.dotcanvas;
    let second = null;
    let minute = null;
    if (this.mode === Misc.MODE_ONOFF) {
      // 1時間余り
      const mod = this.curts % (1000 * 60 * 60);
      second = Math.floor(mod / 1000);
      minute = Math.floor(second / 60);
      canvas = (((minute + this.is0) % 2) === 0) ? this.dotcanvas : this.dot3canvas;
    }
    this.updateDot(canvas, dstcanvas);

    if (this.isinfo) {
      // 追加描画
      c.fillStyle = 'red';
      c.font = `Normal 40px Consolas`;
      c.textAlign = 'left';
      c.textBaseline = 'top';
      
      const dpr = window.devicePixelRatio;
      const w = dw;
      const h = dh;
      c.fillText(`${w} ${h} ${dpr} ${this.is0} ${this.mode} ${minute}:${second % 60}`, w / 2, h / 2);

      c.fillStyle = 'rgb(0,128,255)';
      c.fillText(`${this.x.toFixed(3)} ${this.y.toFixed(3)} ${this.z.toFixed(3)}`, w / 2, h / 2 - 60);
    }
  }

  /**
   * 
   * @param {OffscreenCanvas} canvas 
   * @param {HTMLCanvasElement} dstcanvas 
   */
  updateFont(canvas, dstcanvas) {

  }

  /**
   * 
   * @param {OffscreenCanvas} canvas 
   * @param {HTMLCanvasElement} dstcanvas
   */
  updateDot(canvas, dstcanvas) {
    const mode = this.mode;

    const w = canvas.width;
    const h = canvas.height;
    const c = canvas.getContext('2d');
    const data = c.getImageData(0, 0, w, h);
    const dstc = dstcanvas.getContext('2d');

    const bl = 12;
    const offsety = (1080 - 40 * bl) * 0.5;

    let shx = this.shx;
    let shy = this.shy;
    if (this.isx) {
      // -1.0: 向こうへ垂直 0.0: 上向き平置き、1.0: 垂直
      let t = Math.min(1, this.x / (9.8 - 0.8));
      const ang = Math.asin(t);
      shy = Math.sin(ang) * this.shy;
    }

    console.log('us', w, h, offsety);

    dstc.fillStyle = this.col.off;
    dstc.fillRect(0, offsety, w * bl, h * bl);
    for (let i = 0; i < 2; ++i) {
      for (let y = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x) {
          let offset = (x + w * y) * 4;
          let r = data.data[offset];
          let g = data.data[offset+1];
          let b = data.data[offset+2];
          let a = data.data[offset+3];

          let bx = x * bl;
          let by = y * bl;
          let col = 'rgba(0,0,0,0)';
          if (i === 0) {
            if (r >= 128) {
              col = this.col.onshadow;
            } else {
              continue;
            }
          } else {
            if (r >= 128) {
              col = this.col.on;
            } else {
              continue;
            }
          }

          dstc.fillStyle = col;
          let cx = bx + 1;
          let cy = by + 1;
          if (i === 0) {
            cx += shx;
            cy += shy;
          }
          cy += offsety;
          dstc.fillRect(cx, cy, bl - 2, bl - 2);
        }
      }
    }
  }

}

const misc = new Misc();
misc.initialize();

