/**
 * @file index.js
 */

const _lerp = (a, b, t) => {
  return (a * (1 - t) + b * t);
};

class Misc {
  constructor() {
  }

  async initialize() {
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

    const center = [440, 71];
    const router = 37;
    const ps = [
      [0, 0, 0, 255, 70],
      [0, 0, 0, 255, 130],
    ];

    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        const dx = x - center[0];
        const dy = y - center[1];
        const d = Math.sqrt(dx * dx + dy * dy);
        const ang = Math.atan2(-dy, dx);
        const deg = ang * 180 / Math.PI;
        if (deg < ps[0][4] || deg > ps[1][4]) {
          continue;
        }
        if (d > router) {
          continue;
        }

        for (let i = 0; i < 2; ++i) {
          const pang = ps[i][4] * Math.PI / 180;
          let px = Math.round(center[0] + Math.cos(pang) * d);
          let py = Math.round(center[1] - Math.sin(pang) * d);
          const offset = (px + h * py) * 4;
          ps[i][0] = data.data[offset];
          ps[i][1] = data.data[offset+1];
          ps[i][2] = data.data[offset+2];
        }

        const offset = (x + h * y) * 4;

        let t = (deg - 70) / (130 - 70);

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
    c.putImageData(data, 0, 0);
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

  }

}

const misc = new Misc();
misc.initialize();



