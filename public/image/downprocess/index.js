
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

        this.miniScale(canvas);
        this.downColor(canvas);
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

  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   */
  miniScale(canvas) {
    let w = canvas.width;
    let h = canvas.height;
    const c = canvas.getContext('2d');
    while (w > 256 || h > 256) {
      w *= 0.5;
      h *= 0.5;
    }
    w = Math.floor(w);
    h = Math.floor(h);

    const mid = new OffscreenCanvas(w, h);
    const midc = mid.getContext('2d');
    midc.drawImage(canvas, 0, 0, canvas.width, canvas.height,
      0, 0, w, h,
    );
    canvas.width = w;
    canvas.height = h;
    c.drawImage(mid, 0, 0);
  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   */
  downColor(canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const c = canvas.getContext('2d');
    const img = c.getImageData(0, 0, w, h);

    const cols = [
      {cs:[0,0,0]}, {cs:[0,0,255]}, {cs:[255,0,0]}, {cs:[255,0,255]},
      {cs:[0,255,0]}, {cs:[0,255,255]}, {cs:[255,255,0]}, {cs:[255,255,255]},
      {cs:[192,192,192]}, {cs:[0,0,128]}, {cs:[128,0,0]}, {cs:[128,0,128]},
      {cs:[0,128,0]}, {cs:[0,128,128]}, {cs:[128,128,0]}, {cs:[128,128,128]},
    ];
    /*
    for (let i = 0; i < 16; ++i) {
      let r = Math.floor(i / 2) & 1;
      let g = Math.floor(i / 4) & 1;
      let b = i & 1;
      if (i >= 8) {
        r *= 128;
        g *= 128;
        b *= 128;
      } else {
        r *= 255;
        g *= 255;
        b *= 255;
      }
      if (i === 8) {
        r = 0;
        g = 0;
        b = 0;
      }
      const obj = {
        cs: [r, g, b],
      };
      cols.push(obj);
    } */

    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        for (const v of cols) {
          v.err = 99999;
        }

        let offset = (x + w * y) * 4;
        let r = img.data[offset];
        let g = img.data[offset+1];
        let b = img.data[offset+2];
        let a = img.data[offset+3];

        let miniErr = 99999;
        let minCol = [0, 0, 0];
        for (const v of cols) {
          let sum = Math.abs(r - v.cs[0])
            + Math.abs(g - v.cs[1])
            + Math.abs(b - v.cs[2]);
          v.err = sum;
          if (sum <= miniErr) {
            miniErr = sum;
            minCol = [...v.cs];
          }
        }

        r = minCol[0];
        g = minCol[1];
        b = minCol[2];

        img.data[offset] = r;
        img.data[offset+1] = g;
        img.data[offset+2] = b;
        img.data[offset+3] = a;
      }
    }
    c.putImageData(img, 0, 0);
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();

