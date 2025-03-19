/**
 * @file index.js
 */

/**
 * 
 * @param {number} a 
 * @param {number} b 
 * @param {number} t 1だとb 
 * @returns 
 */
const _lerp = (a, b, t) => {
  return (a * (1 - t) + b * t);
};

/**
 * 'ff8000'
 * @param {number} r 0.0～1.0
 * @param {*} g 
 * @param {*} b 
 * @returns {string}
 */
const _tocol = (r, g, b) => {
  const col = [r, g, b].map(v => Math.max(0, Math.min(255, Math.floor(v * 255.0))));
  return col.map(v => v.toString(16).padStart(2, '0')).join('');
};

/**
 * 配列版
 * @param {number[]} a 
 * @param {number[]} b 
 * @param {number} t b側の重み 1だとbになる
 * @param {boolean} is255 
 * @returns {number[]}
 */
const lerp = (a, b, t, is255) => {
  const num = Math.min(a.length, b.length);
  const ret = new Array(num);
  for (let i = 0; i < num; ++i) {
    ret[i] = a[i] * (1 - t) + b[i] * t;
    if (is255) {
      ret[i] = Math.round(ret[i]);
    }
  }
  return ret;
};

/**
 * 
 * @param  {number[]} args 
 * @returns {number[]}
 */
const _norm = (...args) => {
  const sum = args.reduce((p, c) => {
    return p + c ** 2;
  }, 0);
  if (sum === 0) {
    return [...args];
  }

  const k = 1 / Math.sqrt(sum);
  return args.filter(v => v * k);
};

const _dot = (as, bs) => {
  const num = Math.min(as.length, bs.length);
  let sum = 0;
  for (let i = 0; i < num; ++i) {
    sum += as[i] * bs[i];
  }
  return sum;
};


class Misc {
  constructor() {
  }

  async initialize() {
    {
      const canvas = window.maincanvas;
      canvas.width = 64;
    }
    {
      const canvas = window.subcanvas;
      canvas.width = 64;
    }

    this.setListener();
  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   */
  async round(canvas) {

    const w = canvas.width;
    const h = canvas.height;
    const c = canvas.getContext('2d');
    const data = c.getImageData(0, 0, w, h);

    const center = [440, 71]; // 1607, 71
    const router = 37;
    const rinner = 4;
    const ps = [
      [0, 0, 0, 255, 70], // 角度
      [0, 0, 0, 255, 130], // 角度
    ];

    for (let lr = 0; lr < 2; ++lr) {
/**
 * 度角度範囲
 */
      const range = [ps[0][4], ps[1][4]];
      if (lr === 1) {
        center[0] = 2047 - center[0];
        const turn = [180 - range[0], 180 - range[1]];
        range[0] = Math.min(...turn);
        range[1] = Math.max(...turn);
      }

      for (let y = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x) {
          const dx = x - center[0];
          const dy = y - center[1];
          const d = Math.sqrt(dx * dx + dy * dy);
          const ang = Math.atan2(-dy, dx);
          const deg = ang * 180 / Math.PI;
          if (deg < range[0] || deg > range[1]) {
            continue;
          }
          if (d > router || rinner > d) {
            continue;
          }

          for (let i = 0; i < 2; ++i) {
            const pang = range[i] * Math.PI / 180;
            let px = Math.round(center[0] + Math.cos(pang) * d);
            let py = Math.round(center[1] - Math.sin(pang) * d);
            const offset = (px + h * py) * 4;
            ps[i][0] = data.data[offset];
            ps[i][1] = data.data[offset+1];
            ps[i][2] = data.data[offset+2];
          }

          const offset = (x + h * y) * 4;

          let t = (deg - range[0]) / (range[1] - range[0]);

          let r = _lerp(ps[0][0], ps[1][0], t);
          let g = _lerp(ps[0][1], ps[1][1], t);
          let b = _lerp(ps[0][2], ps[1][2], t);
          let a = 255;

          r = Math.max(0, Math.min(r, 255));
          g = Math.max(0, Math.min(g, 255));
          b = Math.max(0, Math.min(b, 255));

          data.data[offset+0] = r;
          data.data[offset+1] = g;
          data.data[offset+2] = b;
          data.data[offset+3] = a;
        }
      }
    }
    c.putImageData(data, 0, 0);
  }

  /**
   * カラーチップ作りたい
   */
  async make1() {
    const w = 64;
    const h = 64;
    const canvas = new OffscreenCanvas(w, h);
    const c = canvas.getContext('2d');
    {
      for (let y = 0; y < h / 4; ++y) {
        for (let x = 0; x < w / 4; ++x) {
          const index = x + (w / 4) * y;
          let r = 255;
          let g = 255;
          let b = 255;
          let a = 1;
          if (index >= 0 && index <= 4) {
            a = index * 64;
          } else if (index >= 5 && index < 8) {
            switch (index) {
              case 5:
                r = 0;
                g = 0;
                b = 255;
                a = 0.5;
                break;
              case 6:
                r = 0;
                g = 255;
                b = 0;
                a = 0.5;
                break;
              case 7:
                r = 255;
                g = 0;
                b = 0;
                a = 0.5;
                break;
            }
          } else if (index >= 8 && index < 224) {
            let pal = index - 8;
            b = pal % 6;
            const val = Math.floor(pal / 6);
            g = val % 6;
            r = Math.floor(val / 6);
            r = r * 51;
            g = g * 51;
            b = b * 51;
          }

          r = Math.max(0, Math.min(255, Math.floor(r)));
          g = Math.max(0, Math.min(255, Math.floor(g)));
          b = Math.max(0, Math.min(255, Math.floor(b)));
          a = Math.max(0, Math.min(1, a));

          //c.fillStyle = `#${_tocol(r, g, b)}`;
          c.fillStyle = `rgba(${r},${g},${b},${a})`;
          c.fillRect(x * 4, y * 4, 4, 4);
        }
      }

    }

    {
      for (let x = 0; x < w; ++x) {
        let lv = x * 4;
        c.fillStyle = `rgba(${lv},${lv},${lv},${1})`;;
        c.fillRect(x, 56, 1, 4);
      }
    }
    {
      for (let x = 0; x < w; ++x) {
        let lv = 0;
        let r = 0;
        let g = 0;
        let b = 0;
        c.fillStyle = `rgba(${r},${g},${b},${1})`;
        c.fillRect(x, 60, 1, 4);
      }
    }

    return canvas;
  }

  /**
   * 量子化する
   * 
   */
  async makequat() {
    /**
     * @type {HTMLImageElement}
     */
    const img = document.getElementById('shootdot');
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    /**
     * @type {HTMLCanvasElement}
     */
    const canvas = document.getElementById('maincanvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.drawImage(img, 0, 0);
    const data = c.getImageData(0, 0, w, h);

    if (true) {
      //const q = 32;
      const q = 64;
      const _q = (v) => {
        return Math.floor((v + q / 2) / q) * q;
      };
      for (let y = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x) {
          const bx = Math.floor(x / 32);
          const by = Math.floor(y / 32);

          const offset = (x + h * y) * 4;

          const mx = (x + bx) % 4;
          const my = (y + Math.floor(bx / 4) * 2) % 4;
          let pat = (mx == 0 && my == 0) || (mx == 2 && my == 2);
          //pat = 0;

          let r = data.data[offset];
          let g = data.data[offset+1];
          let b = data.data[offset+2];
          let a = data.data[offset+3];
          r *= a / 256;
          g *= a / 256;
          b *= a / 256;
          r = _q(r);
          g = _q(g);
          b = _q(b);

          const rx = x % 32 - 15.5;
          const ry = y % 32 - 15.5;
          const rr = Math.sqrt(rx ** 2 + ry ** 2);

          if (pat || rr > 7.5) {
            r = 0;
            g = 0;
            b = 0;
            a = 0;
          } else {
            a = 255;
          }

          data.data[offset+0] = r;
          data.data[offset+1] = g;
          data.data[offset+2] = b;
          data.data[offset+3] = a;
        }
      }
    }
    c.putImageData(data, 0, 0);
  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   */
  async make3(canvas) {
    console.log('make3 called');
    const w = 16 * 8;
    const h = 16 * 8;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    //c.fillStyle = '#c0c0c0'; // 192
    //c.fillRect(0, 0, w, h);

    const cols = [
      [0, 0, 256],
      [0, 256, 0],
      [256, 0, 0],
      [256, 256, 0],
    ];

    const data = c.getImageData(0, 0, w, h);
    for (let i = 0; i < 8; ++i) {
      for (let j = 0; j < 8; ++j) {
      for (let y = 0; y < 16; ++y) {
        for (let x = 0; x < 16; ++x) {
          let offset = (x + (j * 16) + w * (y + i * 16)) * 4;
          let rx = x - 8;
          let ry = y - 7;
          let rr = Math.sqrt(rx ** 2 + ry ** 2);
          const colIndex = Math.floor(j / 2);
          let r = cols[colIndex][0];
          let g = cols[colIndex][1];
          let b = cols[colIndex][2];
          let a = 255;
          let mx = (x + Math.floor(j / 2)) % 4;
          let my = (y + Math.floor(i / 4) * 0) % 4;
          let pat = (mx == 0 && my == 0) || (mx == 2 && my == 2);
          if (rr > 5 && ((j % 2) == 0)) {
            r *= 0.5;
            g *= 0.5;
            b *= 0.5;
          } else if (rr <= 5 && ((j % 2) != 0)) {
            r *= 0.5;
            g *= 0.5;
            b *= 0.5;
          }


          if (pat && rr < 5.25) {
            a = 0;
          }
          if (rr >= 6.5 + 1) {
            a = 0;
          }
          data.data[offset] = r;
          data.data[offset+1] = g;
          data.data[offset+2] = b;
          data.data[offset+3] = a;
        }
        }
      }
    }

    c.putImageData(data, 0, 0);
    console.log('make3 leave');
  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas
   */
  convColor(canvas) {
    console.log('convColor called');
    const c = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const dat = c.getImageData(0, 0, w, h);

    for (let i = 0; i < h; ++i) {
      for (let j = 0; j < w; ++j) {
        let ft = (j + i * w) * 4;
        let r = dat.data[ft];
        let g = dat.data[ft+1];
        let b = dat.data[ft+2];
        let a = dat.data[ft+3];

        let cols = [
          g, // r
          g, // g
          g, // b
          a, // a
        ];
        cols = cols.map(v => {
          return Math.max(0, Math.min(255, Math.round(v)));
        });

        dat.data[ft] = cols[0];
        dat.data[ft+1] = cols[1];
        dat.data[ft+2] = cols[2];
        dat.data[ft+3] = cols[3];
      }
    }
    c.putImageData(dat, 0, 0);
  }

  /**
   * 
   * @param {File} file 
   * @param {HTMLCanvasElement} canvas 
   * @returns {Promise<HTMLCanvasElement>}
   */
  loadFileToCanvas(file, canvas) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const c = canvas.getContext('2d');
        c.drawImage(img, 0, 0);
        resolve(canvas);
      });
      img.addEventListener('error', () => {
        reject(`load error`);
      });
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 
   * @param {HTMLCanvasElement} src 
   */
  scaleImage(src) {
    const scale = this.scale;

    const cellx = this.cellx;
    const celly = this.celly;
    const cellw = this.cellw;
    const cellh = cellw;

    /**
     * 入力画像の幅
     */
//        const w = src.width;
//        const h = src.height;
    const context = src.getContext('2d');
    /**
     * 書き出し先
     * @type {HTMLCanvasElement}
     */
    const canvas = document.getElementById('subcanvas');
    const c = canvas.getContext('2d');
    canvas.width = cellw * scale;
    canvas.height = cellh * scale;
    const cx = cellx * cellw;
    const cy = celly * cellh;
    console.log(cx, cy, cellw, cellh);
    const dat = context.getImageData(cx, cy, cellw, cellh);

    let backs = [-1, -1, -1];
    if (true) {
      let ft = (0 + 0 * 0) * 4;
      backs[0] = dat.data[ft];
      backs[1] = dat.data[ft+1];
      backs[2] = dat.data[ft+2];
    }

    for (let i = 0; i < cellw; ++i) {
      for (let j = 0; j < cellw; ++j) {
        let ft = (j + i * cellw) * 4;
        let x = j * scale;
        let y = i * scale;
        let r = dat.data[ft];
        let g = dat.data[ft+1];
        let b = dat.data[ft+2];
        let a = dat.data[ft+3];
        if (r === backs[0] && g === backs[1] && b === backs[2]) {
          a = 0;
        }
        c.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        c.fillRect(x, y, scale, scale);
      }
    }
  }

  /**
   * 
   * @param {File} file 
   */
  async parseImage(file) {
    const img = new Image();
    img.addEventListener('load', () => {
/**
 * @type {HTMLCanvasElement}
 */
      const canvas = document.getElementById('maincanvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const c = canvas.getContext('2d');
      c.drawImage(img, 0, 0);
      this.scaleImage(canvas);
    });
    img.src = URL.createObjectURL(file);
  }

  setListener() {
    {
      const el = window;
      el.addEventListener('dragover', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'copy';
      });
      el.addEventListener('drop', async ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'copy';
        const canvas = document.getElementById('subcanvas');
        await this.loadFileToCanvas(ev.dataTransfer.files[0], canvas);
        this.round(canvas);
      });
    }

    for (const k of [
      'scale', 'cellx', 'celly', 'cellw',
    ]) {
      const el = document.getElementById(`${k}`);
      const viewel = document.getElementById(`${k}view`);
      const _update = () => {
        this[k] = Number.parseFloat(el.value);
        viewel.textContent = this[k];
      };
      el?.addEventListener('input', () => {
        _update();
      });
      _update();
    }

    {
      const el = document.getElementById('idmake1');
      el?.addEventListener('click', async () => {
        const canvas = await this.make1();
        const dst = document.getElementById('maincanvas');
        if (!dst) {
          return;
        }
        dst.width = canvas.width;
        dst.height = canvas.height;
        const c = dst?.getContext('2d');
        c.drawImage(canvas, 0, 0, dst.width, dst.height);
      });
    }

    {
      const el = document.getElementById('idmakequat');
      el?.addEventListener('click', async () => {
        await this.makequat();
      });
    }

    {
      const el = document.getElementById('idmake3');
      el?.addEventListener('click', async () => {
        const canvas = document.getElementById('maincanvas');
        canvas.width = 16 * 8;
        canvas.height = 16 * 8;
        await this.make3(canvas);
      });
    }

  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
