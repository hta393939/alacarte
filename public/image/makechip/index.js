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
   * 丸い分布
   * @param {HTMLCanvasElement} canvas 
   */
  async make2(canvas) {

    const w = canvas.width;
    const h = canvas.height;
    const c = canvas.getContext('2d');
    const data = c.getImageData(0, 0, w, h);

    for (let i = 0; i < 1000; ++i) {
      const u = Math.random();
      const v = Math.random();
      let z = - u * 2 + 1;
      let rr = Math.sqrt(1 - z * z);
      let x = rr * Math.cos(2 * Math.PI * v);
      let y = rr * Math.sin(2 * Math.PI * v);

      x *= w;
      y *= h;

      let lv = 128;
      x = Math.floor(x);
      y = Math.floor(y);
      if (x < 0 || y < 0) {
        continue;
      }

      const ft = (w * y + x) * 4;
      data.data[ft  ] += lv;
      data.data[ft+1] += lv;
      data.data[ft+2] += lv;
      data.data[ft+3] = 255;
    }

    if (false) {
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
  async make3(canvas) {
    console.log('make3 called');
    const w = canvas.width;
    const h = canvas.height;
    const c = canvas.getContext('2d');
    //c.fillStyle = '#c0c0c0'; // 192
    //c.fillRect(0, 0, w, h);

    const data = c.getImageData(0, 0, w, h);

    let c0 = [0, 153, 0];
    let c1 = [51, 255, 51];
    const objs = [];
    for (let i = 0; i < 32; ++i) {
      const ang = Math.PI * 2 * i / 32;
      const odd = (i & 1) !== 0;
      {
        const k = 0.5 + (odd ? +0.05 : -0.05);
        const obj = {
          x: Math.cos(ang) * k * w * 0.5 + w * 0.5,
          y: Math.sin(ang) * k * h * 0.5 + h * 0.5,
          z: 0,
          radius: 2 / 64 * w,
        };
        objs.push(obj);
      }

      if (!odd) {
        const k = 0.5 + 0.15;
        const obj = {
          x: Math.cos(ang + 0.06) * k * w * 0.5 + w * 0.5,
          y: Math.sin(ang + 0.06) * k * h * 0.5 + h * 0.5,
          z: 0,
          radius: 2 / 64 * w,
        };
        objs.push(obj);
      }
    }

    if (true) {
      for (let y = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x) {
          const sph = [
            x, y, 0,
          ];
          let r = 51;
          let g = 176;
          let b = 51; // 126.23
          let a = 255;
          for (const obj of objs) {
            const dist = Math.sqrt(
              (obj.x - sph[0]) ** 2
              + (obj.y - sph[1]) ** 2
              + (obj.z - sph[2]) ** 2
            );
            const diff = 1 - dist / obj.radius;
            if (diff > 1 || diff <= 0) {
              continue;
            }

            const col = lerp(
              c0,
              c1,
              Math.min(1, Math.max(0, diff)),
              true);
            r = col[0];
            g = col[1];
            b = col[2];
          }
          const offset = (x + w * y) * 4;

          let lv = (r * 87 + g * 150 + b * 29) / 256;
          lv += 64 + 2;

          {
            const d = Math.sqrt((x - w * 0.5) ** 2
              + (y - h * 0.5) ** 2) / (w * 0.5);
            const thr = 3 / 16; // 2 / 8
            if (d <= thr) {
              lv = _lerp(64, 192, d / thr);
            }
          }

          r = lv;
          g = lv;
          b = lv;

          r = Math.max(0, Math.min(r, 255));
          g = Math.max(0, Math.min(g, 255));
          b = Math.max(0, Math.min(b, 255));
          a = Math.max(0, Math.min(a, 255));
          data.data[offset+0] = r;
          data.data[offset+1] = g;
          data.data[offset+2] = b;
          data.data[offset+3] = a;
        }
      }
    }
    c.putImageData(data, 0, 0);
    console.log('make3 leave');
  }

  /**
   * 明るくしたい場所は白アルファ
   * 影は黒アルファチャンネル
   * 無関係はalpha0
   * 
   * @param {HTMLCanvasElement} canvas 
   */
  async makeWater(param) {
    console.log('makeWater called');
    const w = param.size;
    const h = w;
    const canvas = new OffscreenCanvas(w, h);
    const c = canvas.getContext('2d');

    const data = c.getImageData(0, 0, w, h);

    if (true) {
      /**
       * 中心から外までを1.0としたときの球半径
       */
      const rradius = 0.25;

      const eradius = 0.01;
      /**
       * n ピクセル相当
       */
      const pn = 4 * 2 / param.size;

      let leftblur = true;
      let rightblur = true;
      switch (param.tail) {
      case 'e':
        leftblur = true;
        rightblur = true;
        break;
      case 'l':
        leftblur = false;
        rightblur = true;
        break;
      case 'r':
        leftblur = true;
        rightblur = false;
        break;
      case 'w':
        leftblur = false;
        rightblur = false;
        break;
      }

      const tailLen = param.taillen;
      const lastLen = param.lastlen;
      const heightrate = param.heightrate;
      const ishigh = param.ishigh;

      for (let y = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x) {
          const offset = (x + w * y) * 4;

          let lv = 0; // デフォルトは0黒
          let a = 0;

          const rx = (x - w * 0.5) / (w * 0.5);
          const ry = (h * 0.5 - y) / (h * 0.5);
          const d = Math.sqrt(rx ** 2 + ry ** 2);
          const bx = Math.abs(rx);

          const ax = rx * 1;
          let spec = 0;

          /**
           * 上半分の減衰
           */
          let rate = 1 - ry / lastLen;

          if (ry > tailLen) { // 最後の上
            let hr = 0.5 * rradius;
            if (bx > hr) {
              a = (hr + eradius + pn - bx) / pn;

              if (rx > 0 && rightblur) {
                a = 0;
              }
              if (rx < 0 && leftblur) {
                a = 0;
              }

            } else { // 内側
              const mx = bx / hr;
              let z = Math.sqrt(1 - mx ** 2);
              a = z;
              lv = 1;
            }
            a = Math.max(0, Math.min(1, a));
            a *= rate;

          } else if (ry >= 0) { // 上半分
            let ang = Math.PI * 2 * ry / tailLen * 0.5;
            let hr = (Math.cos(ang) + 3) / 4 * rradius;

            if (bx > hr) { // 外側
              const diff = bx - hr;

              let thr = eradius;
              let k = 1;
              if (leftblur && rx < 0) {
                k = rate ** 6;
              }
              if (rightblur && rx > 0) {
                k = rate ** 6;
              }
              thr *= k;

              a = (thr + pn * k - diff) / (pn * k);
            } else { // 内側
              const mx = bx / hr;
              let z = Math.sqrt(1 - mx ** 2);
              a = z;

              lv = 1; // 白
            }
            a = Math.max(0, Math.min(1, a));
            a *= rate;

          } else { // 下半分
            let ay = ry * 0.98;
            let ad = Math.sqrt(ax ** 2 + ay ** 2);
            if (ad < rradius) { // 楕円の内側
              if (d < rradius) { // 縁の内側
                let z = Math.sqrt(1 - (d / rradius) ** 2);
                a = z;

                if (ishigh) {
                  const q3 = Math.sqrt(1 / 3);
                  const lightv = [-q3, -q3, +q3];
                  let nv = [
                    rx / rradius,
                    ry / rradius,
                    z,
                  ];
                  const dp = _dot(nv, lightv);
                  const ref = [
                    -lightv[0] + 2 * dp * nv[0],
                    -lightv[1] + 2 * dp * nv[1],
                    -lightv[2] + 2 * dp * nv[2],
                  ];
                  const viewv = _norm([
                    0 - x,
                    0 - y,
                    (-5) - z,
                  ]);
                  const sp = Math.max(0, _dot(ref, viewv));
                  spec = Math.pow(sp, 5);
                }

                lv = 1; // 白
              } else { // 楕円の内側で円の外
                lv = 0; // 黒
                a = 1;
              }

            } else { // 下半分の外側
              a = (rradius + eradius + pn - ad) / pn;
              a = Math.max(0, Math.min(1, a));
            }
          }
          a *= heightrate;
          a += spec;

          lv = Math.max(0, Math.min(lv * 255, 255));
          a = Math.max(0, Math.min(a * 255, 255));
          data.data[offset+0] = lv;
          data.data[offset+1] = lv;
          data.data[offset+2] = lv;
          data.data[offset+3] = a;
        }
      }
    }
    c.putImageData(data, 0, 0);
    console.log('makeWater leave');
    return canvas;
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
      const el = document.getElementById('idmake2');
      el?.addEventListener('click', async () => {
        const canvas = document.getElementById('maincanvas');
        canvas.width = 256;
        canvas.height = 256;
        await this.make2(canvas);
      });
    }

    {
      const el = document.getElementById('idmake3');
      el?.addEventListener('click', async () => {
        const canvas = document.getElementById('maincanvas');
        canvas.width = 1024;
        canvas.height = 1024;
        await this.make3(canvas);
      });
    }

    {
      const el = document.getElementById('makewaterbt');
      el?.addEventListener('click', async () => {
        //const param = this.getCommon();


        const canvas = document.getElementById('backcanvas');
        canvas.width = 256;
        canvas.height = 256;
        const param = {
          size: 512,
          taillen: 0.75,
          //lastlen: 0.98,
          lastlen: 1,
          //taillen: 1,
          //heightrate: 0.5,
          heightrate: 0.75,
          ishigh: false,
          //ishigh: true,
          tail: document.getElementById('tail')?.value || 'e',
        };
        const src = await this.makeWater(param);
        const c = canvas.getContext('2d');
        c.drawImage(src,
          0, 0, src.width, src.height,
          0, 0, canvas.width, canvas.height,
        );
      });
    }

  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
