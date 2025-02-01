
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
  static A = 214013;
  static C = 2531011;

  constructor() {
    this.v = new Uint32Array(1);
    this.v[0] = 1;
  }

  rand() {
    this.v[0] = (this.v[0] * Seq.A + Seq.C) & 0xffffffff; return (this.v[0] >> 16) & 32767;  
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
   * wxh の閾値テーブルを作る
   * @param {number} w 
   * @param {number} h 
   * @param {number} size
   */
  async makeThrImage(w, h, shufflenum = 32, size = 8) {
    const table = new Float32Array(w * h);
    const mtx = new Float32Array(size * size);

    const table8 = [
      [ 0,32, 8,40, 2,34,10,42],
      [48,16,56,24,50,18,58,26],
      [12,44, 4,36,14,46, 6,38],
      [60,28,52,20,62,30,54,22],
      [ 3,35,11,43, 1,33, 9,41],
      [51,19,59,27,49,17,57,25],
      [15,47, 7,39,13,45, 5,37],
      [63,31,55,23,61,29,53,21],
    ];
    for (let i = 0; i < size; ++i) {
      for (let j = 0; j < size; ++j) {
        mtx[j + size * i] = table8[i][j];
      }
    }
    const _shuffle = (num) => {
      for (let i = 0; i < num; ++i) {
        const a = Math.floor(Math.random() * num);
        const b = Math.floor(Math.random() * num);
        const tmp = mtx[a];
        mtx[a] = mtx[b];
        mtx[b] = tmp;
      }
    };

    const bw = Math.ceil(w / size);
    const bh = Math.ceil(h / size);
    for (let y = 0; y < bh; ++y) {
      for (let x = 0; x < bw; ++x) {
        _shuffle(shufflenum);

        for (let i = 0; i < size; ++i) {
          for (let j = 0; j < size; ++j) {
            let dx = j + x * size;
            let dy = i + y * size;
            if (dx >= w || dy >= h) {
              continue;
            }
            let soff = j + i * size;
            let doff = dx + w * dy;
            table[doff] = soff;
          }
        }

        await globalThis.scheduler?.yield?.();
      }
    }

    return table;
  }

  /**
   * 
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @returns {[number, number, number]}
   */
  newNorm(x, y, z) {
    const sum = x ** 2 + y ** 2 + z ** 2;
    const k = (sum > 0) ? 1 / Math.sqrt(sum) : 0;
    return [x * k, y * k, z * k];
  }

  len(x, y, z) {
    return Math.sqrt(x ** 2 + y ** 2 + z ** 2);
  }

  /**
   * 減色したい
   * @param {HTMLCanvasElement} canvas 
   */
  downColor(canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const c = canvas.getContext('2d');
    const img = c.getImageData(0, 0, w, h);

    const _cols = [
      {cs:[0,0,0]}, {cs:[0,0,255]}, {cs:[255,0,0]}, {cs:[255,0,255]},
      {cs:[0,255,0]}, {cs:[0,255,255]}, {cs:[255,255,0]}, {cs:[255,255,255]},
      {cs:[192,192,192]}, {cs:[0,0,128]}, {cs:[128,0,0]}, {cs:[128,0,128]},
      {cs:[0,128,0]}, {cs:[0,128,128]}, {cs:[128,128,0]}, {cs:[128,128,128]},
    ];

    const table = [
      [ 0,  8,  2, 10],
      [12,  4, 14,  6],
      [ 3, 11,  1,  9],
      [15,  7, 13,  5],
    ];
    const table8 = [
      [ 0,32, 8,40, 2,34,10,42],
      [48,16,56,24,50,18,58,26],
      [12,44, 4,36,14,46, 6,38],
      [60,28,52,20,62,30,54,22],
      [ 3,35,11,43, 1,33, 9,41],
      [51,19,59,27,49,17,57,25],
      [15,47, 7,39,13,45, 5,37],
      [63,31,55,23,61,29,53,21],
    ];
    let use8 = true;
    let modp = use8 ? 8 : 4;
    let nump = modp * modp;

    const thrTable = this.makeThrImage(w, h);

// パレットの作成
// 8pxブロックの投票

    const palnum = _cols.length;
    for (let i = 0; i < palnum; ++i) {
      const col = _cols[i];
      const luma = col.cs[0] * 77 + col.cs[1] * 150 + col.cs[2] * 29;
      col.luma = luma;
    }

// 線分の構成
    const _lines = [];
    for (let i = 0; i < palnum; ++i) {
      for (let j = i + 1; j < palnum; ++j) {
        const obj = {
          s: _cols[i],
          d: _cols[j],
        };
        if (obj.s.luma > obj.d.luma) {
          const tmp = obj.s;
          obj.s = obj.d;
          obj.d = tmp;
        }
        const diff = [
          obj.d.cs[0] - obj.s.cs[0],
          obj.d.cs[1] - obj.s.cs[1],
          obj.d.cs[2] - obj.s.cs[2],
        ];
        obj.len = this.len(diff);
        obj.dir = this.newNorm(diff);
        _lines.push(obj);
      }
    }

//// 決定
    const _calcCost = (inr, ing, inb) => {
      let minCost = 99999999;
      let minLine = null;
      const _calc = (line, r, g, b) => {
        const diffs = [
          r - line.s.cs[0],
          g - line.s.cs[1],
          b - line.s.cs[2],
        ];
        const diffd = [
          r - line.d.cs[0],
          g - line.d.cs[1],
          b - line.d.cs[2],
        ];
        /**
         * s点からd点へ向かう成分
         */
        const elm =
          + diff[0] * line.dir[0]
          + diff[1] * line.dir[1]
          + diff[2] * line.dir[2];
        const dist = [
          diffs - line.dir[0] * elm,
          diffs - line.dir[1] * elm,
          diffs - line.dir[2] * elm,
        ];

        const lens = [
          this.len(...diffs),
          this.len(...diffd),
          this.len(...dist),
        ];

        const result = {
          elm,
          index: 0,
          cs: [...line.s],
          cost: lens[0],
        };
        if (lens[0] > lens[1]) {
          result.index = 1;
          result.cs = [...line.d];
          result.cost = lens[1];
        }

        const nearThr = 8;
        if (lens[result.index] < nearThr) {
          return result;
        }

        if (elm < 0 || elm > 1) {
          result.cost = 9999999;
          return result;
        }

        // 線分コスト定義
        let linecost = lens[2] + lens[0] + lens[1];
        result.index = 2;
        result.cost = linecost;
        return result;
      };
      for (const line of _lines) {
        const result = _calc(line, inr, ing, inb);
        if (result.cost <= minCost) {
          minCost = result.cost;
          line.costResult = result;
          minLine = line;
        }
      }
      return minLine;
    };

    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let offset = (x + w * y) * 4;
        let r = img.data[offset];
        let g = img.data[offset+1];
        let b = img.data[offset+2];
        let a = img.data[offset+3];

        const line = _calcCost(r, g, b);
        if (line.costResult.index !== 2) {
          r = line.costResult.cs[0];
          g = line.costResult.cs[1];
          b = line.costResult.cs[2];
        } else {
          const rate = line.elm * nump / line.len;
          const thr = thrTable[x + w * y];
          if (rate < thr) {
            r = line.s[0];
            g = line.s[1];
            b = line.s[2];
          } else {
            r = line.d[0];
            g = line.d[1];
            b = line.d[2];
          }
        }

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

