
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

class LineCost {
  constructor() {
    this.index = 2;
    this.cost = 10 ** 9;
    this.elm = 0;
    this.len = 1;
    /**
     * index 0 or 1 のときの色
     */
    this.cs = [0, 0, 0];
  }
}

class LineResult {
  constructor() {
    this.index = 2;
    /**
     * index 0 or 1 のときの色
     */
    this.cs = [0, 0, 0];

    /**
     * elm 0 側の色
     */
    this.scs = [0, 0, 0];
    /**
     * elm 1 側の色
     */
    this.dcs = [0, 0, 0];
    /**
     * 2点の距離
     */
    this.len = 1;
    /**
     * 線分要素
     */
    this.elm = 0;
  }
}

class LineObj {
  constructor() {
    /**
     * s から d への方向ベクトル
     */
    this.dir = [0, 0, 1];
    /**
     * 2点の距離
     */
    this.len = 1;
    this.s = {cs: [0, 0, 0], luma: 0};
    this.d = {cs: [255, 255, 255], luma: 255 * 256};
  }
}


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
   * 指定スケールで拡大する
   * @param {HTMLCanvasElement} src 元
   * @param {HTMLCanvasElement} dst 先
   * @param {number} scale スケール
   */
  scaleImage(src, dst, scale) {
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

    const c = dst.getContext('2d');
    dst.width = cellw * scale;
    dst.height = cellh * scale;
    const cx = cellx * cellw;
    const cy = celly * cellh;
    console.log(cx, cy, cellw, cellh);
    const dat = context.getImageData(cx, cy, cellw, cellh);

    let backs = [-1, -1, -1];
    if (false) {
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
   * 指定スケールで拡大する
   * @param {HTMLCanvasElement} src 元
   * @param {HTMLCanvasElement} dst 先
   * @param {number} scale スケール
   */
  scaleImageSimple(src, dst, scale) {
    /**
     * 入力画像の幅
     */
    const w = src.width;
    const h = src.height;
    dst.width = w * scale;
    dst.height = h * scale;
    const c = dst.getContext('2d');
    // 拡大フィルタ
    c.imageSmoothingEnabled = false;
    c.drawImage(src,
      0, 0, w, h,
      0, 0, w * scale, h * scale,
    );

    {
      const el = document.getElementById('subview');
      if (el) {
        el.textContent = `${w}x${h}`;
      }
    }
  }

  async openImage() {
    const fileHandle = await globalThis.showOpenFilePicker({
      types: [
        {
          description: 'Image files',
          accept: {
            'image/*': ['.png', '.jpg', '.jpeg'],
          },
        },
      ],
    });
    const file = await fileHandle[0].getFile();

    const canvas = document.getElementById('maincanvas');
    await this.loadFileToCanvas(file, canvas);

    {
      const el = document.getElementById('filenameview');
      if (el) {
        el.textContent = file.name;
      }
    }
  }

  /**
   * すでに存在する maincanvas に処理を適用する
   */
  async applyForMain() {
    const src = document.getElementById('maincanvas');
    const setting = this.gatherSetting();
    switch (setting.method) {
      case 'quantize':
        this.convByQ(setting);
        return;
      case 'gray':
        this.gray(setting);
        return;
      case 'colorgray':
        this.colorgray(setting);
        return;
      case 'down':
        {
          const mid = document.getElementById('subcanvas');
          await this.miniScale(src, mid);
          await this.downColor(mid);
          this.scaleImageSimple(mid,
            document.getElementById('backcanvas'),
            setting.afterdot);
        }
        return;
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

      const dst = document.getElementById('subcanvas');
      this.scaleImage(canvas, dst, this.scale);
    });
    img.src = URL.createObjectURL(file);
  }

  gatherSetting() {
    const ret = { method: 'quantize', qstep: 1, downsize: 0, afterdot: 1 };
    {
      const el = document.getElementById('methodsel');
      if (el) {
        ret.method = el.value;
      }
    }

    for (const k of [
      'downsize', 'afterdot', 'qstep',
    ]) {
      const el = document.getElementById(`${k}sel`);
      if (!el) {
        continue;
      }
      const val = Number.parseFloat(el.value);
      if (Number.isFinite(val)) {
        ret[k] = val;
      }
    }

    return ret;
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
        const canvas = document.getElementById('maincanvas');
        await this.loadFileToCanvas(ev.dataTransfer.files[0], canvas);

        this.applyForMain();
      });
    }

    for (const k of [
      'scale', 'cellx', 'celly', 'cellw',
    ]) {
      const el = document.getElementById(`${k}`);
      const viewel = document.getElementById(`${k}view`);
      const _update = () => {
        if (!el) {
          return;
        }
        this[k] = Number.parseFloat(el.value);
        viewel.textContent = this[k];
      };
      el?.addEventListener('input', () => {
        _update();
      });
      _update();
    }

    {
      const el = document.getElementById('openimagebut');
      el?.addEventListener('click', async () => {
        await this.openImage();
        this.applyForMain();
      });
    }
    {
      const el = document.getElementById('applybut');
      el?.addEventListener('click', () => {
        this.applyForMain();
      });
    }

  }

  /**
   * 縦横ともに256以下になるまで半分にする
   * @param {HTMLCanvasElement} canvas 
   * @param {HTMLCanvasElement} dst
   */
  miniScale(canvas, dst) {
    let w = canvas.width;
    let h = canvas.height;
    while (w > 256 || h > 256) {
      w *= 0.5;
      h *= 0.5;
    }
    w = Math.floor(w);
    h = Math.floor(h);

    dst.width = w;
    dst.height = h;
    const dstc = dst.getContext('2d');
    dstc.drawImage(canvas,
      0, 0, canvas.width, canvas.height,
      0, 0, w, h,
    );
  }

  /**
   * wxh の閾値テーブルを作る
   * @param {number} w 
   * @param {number} h 
   * @param {number} size
   */
  async makeThrImage(w, h, shufflenum = 32, size = 8) {
    const table = new Float32Array(w * h);
    /**
     * ラスタ
     */
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
        const a = Math.floor(Math.random() * size * size);
        const b = Math.floor(Math.random() * size * size);
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
            table[doff] = mtx[soff];
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
   * 量子化
   * @param {number} v 0～255
   * @param {number} step 
   * @returns {number}
   */
  toq(v, step) {
    if (step <= 1) {
      return v;
    }
    const half = step / 2;
    const mod = Math.floor((v + half) / step);
    return Math.min(255, mod * step);
  }

  convByQ(param) {
    /** 画素値に対する事前量子化想定 */
    const { qstep, downsize } = param;
    console.log('%c convByQ', 'color:blue', param);

    const canvas = window.maincanvas;
    const w = canvas.width;
    const h = canvas.height;
    let calcw = w;
    let calch = h;
    const dstcanvas = window.subcanvas;
    if (downsize > 0) {
//      calcw = _downsize;
//      calch = Math.floor(h * calcw / w);
      if (w > h) {
        calch = downsize;
        calcw = Math.floor(w * calch / h);
      } else {
        calcw = downsize;
        calch = Math.floor(h * calcw / w);
      }
    }
    dstcanvas.width = calcw;
    dstcanvas.height = calch;
    const dstc = dstcanvas.getContext('2d');
    dstc.drawImage(canvas,
      0, 0, w, h,
      0, 0, calcw, calch);
    const dstimg = dstc.getImageData(0, 0, calcw, calch);
    for (let i = 0; i < h; ++i) {
      for (let j = 0; j < w; ++j) {
        let ft = (j + i * w) * 4;
        let r = dstimg.data[ft];
        let g = dstimg.data[ft+1];
        let b = dstimg.data[ft+2];
        let a = dstimg.data[ft+3];

        r = this.toq(r, qstep);
        g = this.toq(g, qstep);
        b = this.toq(b, qstep);
        a = this.toq(a, qstep);

        dstimg.data[ft]   = r;
        dstimg.data[ft+1] = g;
        dstimg.data[ft+2] = b;
        dstimg.data[ft+3] = a;
      }
    }
    dstc.putImageData(dstimg, 0, 0);

    const last = document.getElementById('backcanvas');
    this.scaleImageSimple(dstcanvas, last, param.afterdot);
  }

  gray(param) {
    /** 画素値に対する事前量子化想定 */
    const { qstep, downsize } = param;
    console.log('%c convByQ', 'color:blue', param);

    const canvas = window.maincanvas;
    const w = canvas.width;
    const h = canvas.height;
    let calcw = w;
    let calch = h;
    const dstcanvas = window.subcanvas;
    if (downsize > 0) {
//      calcw = _downsize;
//      calch = Math.floor(h * calcw / w);
      if (w > h) {
        calch = downsize;
        calcw = Math.floor(w * calch / h);
      } else {
        calcw = downsize;
        calch = Math.floor(h * calcw / w);
      }
    }
    dstcanvas.width = calcw;
    dstcanvas.height = calch;
    const dstc = dstcanvas.getContext('2d');
    dstc.drawImage(canvas,
      0, 0, w, h,
      0, 0, calcw, calch);
    const dstimg = dstc.getImageData(0, 0, calcw, calch);
    for (let i = 0; i < h; ++i) {
      for (let j = 0; j < w; ++j) {
        let ft = (j + i * w) * 4;
        let r = dstimg.data[ft];
        let g = dstimg.data[ft+1];
        let b = dstimg.data[ft+2];
        let a = dstimg.data[ft+3];

        r = this.toq(r, qstep);
        g = this.toq(g, qstep);
        b = this.toq(b, qstep);
        a = this.toq(a, qstep);

        dstimg.data[ft]   = r;
        dstimg.data[ft+1] = g;
        dstimg.data[ft+2] = b;
        dstimg.data[ft+3] = a;
      }
    }
    dstc.putImageData(dstimg, 0, 0);

    const last = document.getElementById('backcanvas');
    this.scaleImageSimple(dstcanvas, last, param.afterdot);
  }

  colorgray(param) {
    /** 画素値に対する事前量子化想定 */
    const { qstep, downsize } = param;
    console.log('%c convByQ', 'color:blue', param);

    const canvas = window.maincanvas;
    const w = canvas.width;
    const h = canvas.height;
    let calcw = w;
    let calch = h;
    const dstcanvas = window.subcanvas;
    if (downsize > 0) {
//      calcw = _downsize;
//      calch = Math.floor(h * calcw / w);
      if (w > h) {
        calch = downsize;
        calcw = Math.floor(w * calch / h);
      } else {
        calcw = downsize;
        calch = Math.floor(h * calcw / w);
      }
    }
    dstcanvas.width = calcw;
    dstcanvas.height = calch;
    const dstc = dstcanvas.getContext('2d');
    dstc.drawImage(canvas,
      0, 0, w, h,
      0, 0, calcw, calch);
    const dstimg = dstc.getImageData(0, 0, calcw, calch);
    for (let i = 0; i < h; ++i) {
      for (let j = 0; j < w; ++j) {
        let ft = (j + i * w) * 4;
        let r = dstimg.data[ft];
        let g = dstimg.data[ft+1];
        let b = dstimg.data[ft+2];
        let a = dstimg.data[ft+3];

        r = this.toq(r, qstep);
        g = this.toq(g, qstep);
        b = this.toq(b, qstep);
        a = this.toq(a, qstep);

        dstimg.data[ft]   = r;
        dstimg.data[ft+1] = g;
        dstimg.data[ft+2] = b;
        dstimg.data[ft+3] = a;
      }
    }
    dstc.putImageData(dstimg, 0, 0);

    const last = document.getElementById('backcanvas');
    this.scaleImageSimple(dstcanvas, last, param.afterdot);
  }

  /**
   * 減色したい
   * 未実装 16 で量子化．0,32,48,64, ... ,240,255 または 0,17,34, ... ,238, 255
   * 多分前者
   * @param {HTMLCanvasElement} canvas 
   */
  async downColor(canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const c = canvas.getContext('2d');
    const img = c.getImageData(0, 0, w, h);
    /**
     * 量子化する場合
     */
    let _useq = true;

    /**
     * パレット
     * 素直にピックした方が良さそうだった。
     */
    const _cols = [
      {cs:[0,0,0]}, // 黒
      {cs:[256,128,64]},
      {cs:[255,0,0]},
      {cs:[255,0,255]},
      {cs:[192,64,64]},
      {cs:[0,255,255]},
      {cs:[228,188,128]}, // 水→顔 多い
      {cs:[255,255,255]}, // 白
      {cs:[192,192,192]},
      {cs:[255,192,192]},
      {cs:[128,0,0]},
      {cs:[128,0,128]},
      {cs:[0,192,0]}, // 緑唯一
      {cs:[0,128,128]},
      {cs:[128,128,0]},
      {cs:[128,128,128]},
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

    const thrTable = await this.makeThrImage(w, h);
    console.log('thrTable', thrTable);

    /**
     * 0, 32, 48, 64, ... , 240, 255
     * @param {number} v 
     * @returns 
     */
    const _q16 = v => {
      if (v <= 32) {
        return (v < 16) ? 0 : 32;
      }
      let index = Math.floor((v + 8) / 16);
      return Math.min(255, index * 16);
    };

//// パレットの作成
// 8pxブロックの投票
    const palblocks = [];
    for (let r = 0; r < 32; ++r) {
      const rs = [];
      for (let g = 0; g < 32; ++g) {
        const bs = [];
        for (let b = 0; b < 32; ++b) {
          const obj = {
            count: 0,
          };
          bs.push(obj);
        }
        rs.push(bs);
      }
      palblocks.push(rs);
    }
    for (let y = 0; y < 0; ++y) {
      for (let x = 0; x < 0; ++x) {
        let offset = (x + w * y) * 4;
        let r = img.data[offset  ];
        let g = img.data[offset+1];
        let b = img.data[offset+2];
        let ri = Math.floor(r / 8);
        let gi = Math.floor(g / 8);
        let bi = Math.floor(b / 8);
        palblocks[ri][gi][bi].count += 1;

        if (_useq) {
          img.data[offset] = _q16(r);
          img.data[offset+1] = _q16(g);
          img.data[offset+2] = _q16(b);
        }
      }
    }

    if (_useq) { // NOTE: 量子化する場合
      c.putImageData(img, 0, 0);
    }


    const palnum = _cols.length;
    for (let i = 0; i < palnum; ++i) {
      const col = _cols[i];
      const luma = col.cs[0] * 77 + col.cs[1] * 150 + col.cs[2] * 29;
      col.luma = luma;
    }

// 線分の構成
    /**
     * @type {LineObj[]}
     */
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
        obj.len = this.len(...diff);
        obj.dir = this.newNorm(...diff);
        _lines.push(obj);
      }
    }
    console.log('_line', _lines);

//// 決定
    /**
     * 
     * @param {number} inr 
     * @param {number} ing 
     * @param {number} inb 
     * @returns {LineResult}
     */
    const _calcCost = (inr, ing, inb) => {
      let minCost = 10 ** 9;
      /**
       * @type {LineResult | null}
       */
      let minLine = null;

      /**
       * 線分と色のコストを返す
       * @param {LineObj} line 
       * @param {number} r 
       * @param {number} g 
       * @param {number} b 
       * @returns {LineCost}
       */
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
          + diffs[0] * line.dir[0]
          + diffs[1] * line.dir[1]
          + diffs[2] * line.dir[2];
        const dist = [
          diffs[0] - line.dir[0] * elm,
          diffs[1] - line.dir[1] * elm,
          diffs[2] - line.dir[2] * elm,
        ];

        const lens = [
          this.len(...diffs),
          this.len(...diffd),
          this.len(...dist),
        ];

        const result = new LineCost();
        result.elm = elm;
        result.index = 0;
        result.cs = [...line.s.cs];
        result.cost = lens[0];

        if (lens[0] > lens[1]) {
          result.index = 1;
          result.cs = [...line.d.cs];
          result.cost = lens[1];
        }
        // TODO: 一番近い色を採用する半径
        const nearThr = 8 * 4;
        if (lens[result.index] < nearThr) {
          result.cost = Math.sqrt(result.cost);
          return result;
        }

        if (elm < 0 || elm > line.len) {
          result.cost *= 10;
          return result;
        }

        // TODO: 線分コスト定義
        //let linecost = lens[2] + lens[0] + lens[1];
        let linecost = lens[2] * 4 + (lens[0] + lens[1]) * 1;
        result.index = 2;
        result.cost = linecost;
        return result;
      };

      for (const line of _lines) {
        const result = _calc(line, inr, ing, inb);
        if (result.cost <= minCost) {
          minCost = result.cost;
          minLine = new LineResult();
          minLine.index = result.index;
          minLine.cs = [...result.cs];
          minLine.elm = result.elm;
          minLine.len = line.len;
          minLine.scs = [...line.s.cs];
          minLine.dcs = [...line.d.cs];
        }
      }
      return minLine;
    };

    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let offset = (x + w * y) * 4;
        let r = img.data[offset  ];
        let g = img.data[offset+1];
        let b = img.data[offset+2];
        let a = img.data[offset+3];

        const line = _calcCost(r, g, b);
        console.log(line, x, y);

        if (line.index !== 2) {
          r = line.cs[0];
          g = line.cs[1];
          b = line.cs[2];
        } else {
          const rate = line.elm * nump / line.len;
          const thr = thrTable[x + w * y];
          if (rate < thr) {
            r = line.scs[0];
            g = line.scs[1];
            b = line.scs[2];
          } else {
            r = line.dcs[0];
            g = line.dcs[1];
            b = line.dcs[2];
          }
        }

        img.data[offset  ] = r;
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

