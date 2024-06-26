/**
 * @file index.js
 */

const _lerp = (a, b, t) => {
  return (a * (1 - t) + b * t);
};

const _norm = (x, y, z) => {
  const sum = x ** 2 + y ** 2 + z ** 2;
  const k = (sum > 0) ? (1 / Math.sqrt(sum)) : 0;
  return [x * k, y * k, z * k];
};

class Misc {
  constructor() {
  }

  async initialize() {
    this.setListener();

    this.makeRoundPath();
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
 * 
 * @param {HTMLCanvasElement} canvas 
 */
async make1(canvas) {

  const w = canvas.width;
  const h = canvas.height;
  const c = canvas.getContext('2d');
  const data = c.getImageData(0, 0, w, h);

  const router = 37;

  {
    const rot = Math.PI * 20 / 180;
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let dx = (x - w * 0.5) / (w * 0.5);
        let dy = (y - h * 0.5) / (h * 0.5);
        const d = Math.sqrt(dx * dx + dy * dy);
        const ang = Math.atan2(-dy, dx);
        const deg = ang * 180 / Math.PI;

        dx *= 1;
        dy *= 1.2 + 0.05 * (Math.cos(ang * 5) + Math.cos(ang * 7));
        const cs = Math.cos(rot);
        const sn = Math.sin(rot);
        let vx = dx * cs - dy * sn;
        let vy = dx * sn + dy * cs;

        const d2 = Math.sqrt(vx * vx + vy * vy);
        let lv = 1 - d2 * 1;
        lv = Math.max(0, Math.min(1, lv));

        const offset = (x + h * y) * 4;

        lv *= 255;

        let r = 255;
        let g = 204;
        let b = 204;
        let a = lv;
        r = lv;
        g = lv;
        b = lv;
        a = 255;

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
        const canvas = document.getElementById('maincanvas');
        canvas.width = 256;
        canvas.height = 256;
        await this.make1(canvas);
      });
    }

  }

  makeRoundPath() {
    // +
    // しずく
    // (=)
    // ノ 長い胴体
    // (=)
    // ノ ベース
    // (=)
    // 下から
    const thin2 = 0.05;

    const makeDisc = (height, _thin2, radius) => {
      const ret = {vs: []};
      for (let i = 0; i <= 16; ++i) {
        const ang = (i - 8) * Math.PI * 2 / 32;
        const cs = Math.cos(ang);
        const sn = Math.sin(ang);
        const p = [radius + cs * _thin2, sn * _thin2 + height, 0];
        const n = [cs, sn, 0];
        ret.vs.push({p, n});
      }
      return ret;
    };
    const makeCurve = (a, b, c, d) => {
      const ret = {vs: []};
      for (let i = 0; i <= 16; ++i) {
        let t = i / 16;
        let u = 1 - t;
        let x = a[0] * u ** 3
          + b[0] * 3 * u * u * t
          + c[0] * 3 * u * t * t
          + d[0] * t ** 3;
        let y = a[1] * u ** 3
          + b[1] * 3 * u * u * t
          + c[1] * 3 * u * t * t
          + d[1] * t ** 3;

        let nx = - a[0] * 3 * u * u
          + b[0] * 3 * (1 - 3 * t) * u
          + c[0] * 3 * (2 - t * 3) * t
          + d[0] * 3 * t * t;
        let ny = - a[1] * 3 * u * u
          + b[1] * 3 * (-2 * u * t + u * u)
          + c[1] * 3 * (- t * t + u * 2 * t)
          + d[1] * 3 * t * t;
        const p = [x, y, 0];
        const n = _norm(nx, ny, 0);
        ret.vs.push({p, n});
      }
      return ret;
    };

    const vs = [];
    let x = 0.4;
    let y = 0;
    const result0 = makeCurve([0, y], [x / 3, y], [x * 2 / 3, y], [x, y]);
    const result = makeDisc(thin2, thin2, x);
    y += thin2 * 2;
    const result2 = makeCurve([x, y], [x-0.02, y+0.02], [x-0.04, y+0.04], [x-0.06, y+0.06]);
    y += 0.06;
    const result3 = makeDisc(y + thin2, thin2, 0.5);
    y += thin2 * 2;
    x = 0.1;
    const result4 = makeCurve([x, y], [x, y+0.04], [x, y+0.08], [x, y+0.12]);
    y += 0.12;
    const result5 = makeDisc(y + thin2, thin2, x);
    y += thin2 * 2;
    const result6 = makeCurve([x, y], [x-0.02, y+0.1], [x-0.04, y+0.2], [x-0.06, y+0.3]);
    y += 0.3;
    x = 0.1;
    const result7 = makeDisc(y + thin2, thin2, x);
    y += thin2 * 2;
    const result8 = makeCurve([x, y], [x * 2 / 3, y], [x / 3, y], [0, y]);

    // 十字
    vs.push(
      ...result0.vs,
      ...result.vs,
      ...result2.vs,
      ...result3.vs,
      ...result4.vs,
      ...result5.vs,
      ...result6.vs,
      ...result7.vs,
      ...result8.vs,
    );
    this.draw(window.maincanvas, vs);
  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   * @param {*} vs 
   */
  draw(canvas, vs) {
    const w = 200;
    const h = 200;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.beginPath();
    c.moveTo((vs[0].p[0] + 1) * w * 0.5, (1 - vs[0].p[1]) * h * 0.5);
    for (let i = 1; i < vs.length; ++i) {
      const v = vs[i];
      c.lineTo((v.p[0] + 1) * w * 0.5, (1 - v.p[1]) * h * 0.5);
    }
    c.strokeStyle = 'red';
    c.stroke();
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();

