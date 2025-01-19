
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
    /**
     * UIから
     */
    this.scale = 16;
    this.cellx = 0;
    this.celly = 0;
    this.cellw = 16;
    this.cellh = 16;

    this.map = new Int32Array(256 * 256);
    this.indices = new Int32Array(256 * 256);
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
   * ドットによる境界線太線化1
   */
  async toThick() {
    console.log('toThick called');
    /**
     * @type {HTMLCanvasElement}
     */
    const src = document.getElementById('maincanvas');
    /**
     * @type {HTMLCanvasElement}
     */
    const dst = document.getElementById('subcanvas');

    const srcc = src.getContext('2d');
    const dstc = dst.getContext('2d');
    const w = src.width;
    const h = src.height;
    dst.width = w;
    dst.height = h;
    //dstc.drawImage(src, 0, 0, w, h, 0, 0, w, h);
    const dat = srcc.getImageData(0, 0, w, h);

    dstc.fillStyle = 'black';
    const size = 10; // 8 はわずかに切れる
    for (let i = 0; i < h; ++i) {
      for (let j = 0; j < w; ++j) {
        let x = j;
        let y = i;
        let ft = (j + i * w) * 4;
        let r = dat.data[ft];
        let g = dat.data[ft+1];
        let b = dat.data[ft+2];
        //let a = dat.data[ft+3];
        let luma = (r * 87 + g * 150 + b * 29) >> 8;
        if (luma < 128 + 8) {
          dstc.fillRect(x, y, size, size);
        }
      }
      await window.scheduler.yield();
    }

  }

  /**
   * ドットによる境界線太線化1
   */
  async toThick2() {
    console.log('toThick2 called');
    /**
     * @type {HTMLCanvasElement}
     */
    const src = document.getElementById('maincanvas');
    /**
     * @type {HTMLCanvasElement}
     */
    const dst = document.getElementById('subcanvas');

    const srcc = src.getContext('2d');
    const dstc = dst.getContext('2d');
    const w = src.width;
    const h = src.height;
    dst.width = w;
    dst.height = h;
    //dstc.drawImage(src, 0, 0, w, h, 0, 0, w, h);
    const dat = srcc.getImageData(0, 0, w, h);

    dstc.fillStyle = 'black';
    const size = 10; // 8 はわずかに切れる
    for (let i = 0; i < h; ++i) {
      for (let j = 0; j < w; ++j) {
        let x = j;
        let y = i;
        let ft = (j + i * w) * 4;
        let r = dat.data[ft];
        let g = dat.data[ft+1];
        let b = dat.data[ft+2];
        //let a = dat.data[ft+3];
        let luma = (r * 87 + g * 150 + b * 29) >> 8;
        if (luma < 128 + 8) {
          dstc.fillRect(x, y, size, size);
        }
      }
      await window.scheduler.yield();
    }

  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   */
  async canvasToMap(canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const map = new Int32Array(w * h);
    const c = canvas.getContext('2d');
    const img = c.getImageData(0, 0, w, h);
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let index = x + w * y;
        let offset = index * 4;
        let r = img.data[offset];
        let g = img.data[offset+1];
        let b = img.data[offset+2];
        let a = img.data[offset+3];
        let flag = (r >= 128);
        map[index] = flag ? 1 : 0;
      }
    }
    return {
      width: w,
      height: h,
      map,
    };
  }

  /**
   * this.map から this.indices を作成してinfos を返す
   * @param {number} w 
   * @param {number} h 
   * @returns {{index:number,offsets:number[]}[]} 結果的に領域個数
   */
  async checkIsland(w, h) {
    const num = w * h;
    for (let i = 0; i < num; ++i) {
      this.indices[i] = -1;
    }

    let infos = [];
    let nextIndex = 0;

    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let offset = x + w * y;
        let left = (x >= 1) ? this.indices[offset - 1] : -1;
        let top = (y >= 1) ? this.indices[offset - w] : -1;

        let flag = this.map[offset];
        if (flag === 0) {
          this.indices[offset] = -1;
          continue;
        }

        if (false) {
          continue;
        }

        //// 有効マップ
        if (top >= 0) {
          if (left >= 0) {
            this.indices[offset] = top;
            infos[top].offsets.push(offset);
            // 左をくっつける
            for (const offset of infos[left].offsets) {
              this.indices[offset] = top;
            }
            infos[top].offsets.push(...infos[left].offsets);
          } else {
            this.indices[offset] = top;
            infos[top].offsets.push(offset);
          }
        } else if (left >= 0) {
          this.indices[offset] = left;
          infos[left].offsets.push(offset);
        } else {
          // 上も左も空いていた
          this.indices[offset] = nextIndex;
          const obj = {
            index: nextIndex,
            offsets: [offset],
          };
          infos.push(obj);
          nextIndex += 1;
        }
      }
    }
    return infos;
  }

  /**
   * 
   * @param {number} w 元幅
   * @param {number} h 元高さ
   * @param {number} scale 縮小数
   */
  async scaleMini(w, h, scale) {
    const dw = Math.ceil(w / scale);
    const dh = Math.ceil(h / scale);
    const dmap = new Int32Array(dw * dh);
    for (let dy = 0; dy < dh; ++dy) {
      for (let dx = 0; dx < dw; ++dx) {
        let sum = 0;
        for (let py = 0; py < scale; ++py) {
          for (let px = 0; px < scale; ++px) {
            let sx = dx * scale + px;
            let sy = dy * scale + py;
            let soffset = w * sy + sx;
            sum += 0;
          }
        }
        dmap[dx + dw * dy] = sum;
      }
    }
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
        const canvas = document.getElementById('maincanvas');
        await this.loadFileToCanvas(ev.dataTransfer.files[0], canvas);
        this.toThick();
      });
    }

    for (const k of [
      'scale', 'cellx', 'celly', 'cellw', 'cellh',
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

        await this.make1(canvas, this.scale);
      });
    }

  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();

/**
 * - 0or1の2次元配列を0or1の小さい配列に縮小したい
 * - 元々つながっている横または斜めはつながった結果になってほしい
 * - 縮小に伴った良さげな痩せ化はしたい
 * - つながっていない島は島で残っていてほしい
 * - つながってほしくないが難しそう
 * 
 * 島はあらかじめ除外する。1領域とする。
 * 0個を0とする。判定trueを1とする。
 * 離れた島をつなげる。not 0 な判定falseでなんとかつなげる。
 */
