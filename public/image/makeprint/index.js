
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


    /** 9 */
    const total_width = 9;
    /** 5 */
    const width_at_border = 5;
    /** 41 */
    const nbits = 41;
    /** true */
    const reversed_border = true;


class Pattern {
  static WHITE = 1;
  static BLACK = 0;
  constructor() {
    this.pitch = total_width;
  }

  /**
   * 
   * @param {Float32Array} pos 
   * @param {BigInt} bits 
   */
  makeMap(pos, bits) {
    this.bitMap = new Float32Array(9 * 9);

    // 黒と白
    for (const v of [{ox: 1, oy: 1, num: 7, val: Pattern.BLACK},
      {ox: 2, oy: 2, num: 5, val: Pattern.WHITE},
    ]) {
      for (let i = 0; i < v.num; ++i) {
        for (let j = 0; j < v.num; ++j) {
          let x = j + v.ox;
          let y = i + v.oy;
          this.bitMap[this.pitch * y + x] = v.val;
        }
      }
    }

    // パターン
    /** 今回は2 */
    const border_start = Math.floor((total_width - width_at_border) / 2);
    for (let i = 0; i < nbits; ++i) {
      let x = pos[i * 2 + 0] + border_start;
      let y = pos[i * 2 + 1] + border_start;
      let bw = ((bits & (1n << BigInt(nbits - i - 1))) != 0n) ? Pattern.WHITE : Pattern.BLACK;
      this.bitMap[this.pitch * y + x] = bw;
    }
  }

  getBit(x, y) {
    return this.bitMap[this.pitch * y + x];
  }
}

class Misc {
  constructor() {

  }

  async initialize() {
    const side = 15 * 16;
    {
      const canvas = window.maincanvas;
      canvas.width = side * 5;
      canvas.height = side * 5 * 7 / 7;
      this.makeGrad(canvas);
    }
    {
      const canvas = window.subcanvas;
      canvas.width = side * 5;
      canvas.height = side * 5 * 7 / 7;
      this.makeGrad(canvas, 'rb');
    }
    {
      const canvas = window.backcanvas;
      canvas.width = side * 5;
      canvas.height = side * 7;
      this.makeMarker(canvas);
    }

    this.setListener();

    {

      const canvas = document.getElementById('onecanvas');
      const result = this.parseCode(_code);
      this.mapping = result.map;
      this.makeOne(canvas, 100);
    }
  }

  /**
   * 正方形グラデーション
   * @param {HTMLCanvasElement} canvas 
   */
  async makeGrad(canvas, type) {
    const w = canvas.width;
    const h = canvas.height;
    const c = canvas.getContext('2d');
    c.fillStyle = 'white';
    c.fillRect(0, 0, w, h);

    const data = c.getImageData(0, 0, w, h);

    {
      for (let y = 0; y < h; ++y) {
        let cy = y;
        if (cy >= w) {
          continue;
        }
        for (let x = 0; x < w; ++x) {
          const mx = x & 1;
          const my = cy & 1;
          if (mx === 1 && my === 1) {
            // do nothing.
          } else {
            //continue;
          }

          const offset = (x + w * cy) * 4;

          let r = x / w;
          let g = cy / w;
          let b = 0;
          let a = 255;

          if (type === 'rb') {
            r = x / w;
            g = 0;
            b = 1 - cy / w;
          }

          r = Math.max(0, Math.min(r * 255, 255));
          g = Math.max(0, Math.min(g * 255, 255));
          b = Math.max(0, Math.min(b * 255, 255));

          data.data[offset+0] = r;
          data.data[offset+1] = g;
          data.data[offset+2] = b;
          data.data[offset+3] = a;
        }
      }
    }
    c.putImageData(data, 0, 0);
    console.log('makeGrad', canvas.width, canvas.height);
  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   */
  async makeMarker(canvas) {
    console.log('makeMarker called');
    const cellsize = 16;
    const cside = cellsize * 15;
    const w = cside * 5;
    const h = cside * 7;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.fillStyle = 'white';
    c.fillRect(0, 0, w, h);

    const data = c.getImageData(0, 0, w, h);
    let count = 0;
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillStyle = 'black';
    for (let i = 0; i < 7; ++i) {
      for (let j = 0; j < 5; ++j) {
        let chx = cside * j;
        let chy = cside * i;
        let forceblack = false;
        if ((((j&1) + (i&1)) & 1) === 0) {
          forceblack = true;
        } else {
          forceblack = false;

        }

        const id = count;
        const bits = [0, 1, 0, 1];

        for (let cy = 0; cy < 15; ++cy) {
          for (let cx = 0; cx < 15; ++cx) {


            const white = true;
            let lv = white ? 255 : 0;
            if (forceblack) {
              lv = 0;
            }
            let r = lv;
            let g = lv;
            let b = lv;
            let a = 255;

            for (let y = 0; y < cellsize; ++y) {
              for (let x = 0; x < cellsize; ++x) {
                let offset = (x + cx * cellsize + chx + w * (y + cy * cellsize + chy)) * 4;
                data.data[offset] = r;
                data.data[offset+1] = g;
                data.data[offset+2] = b;
                data.data[offset+3] = a;
              }
            }
          }
        }

        if (forceblack === false) {
                    //c.fillText(`${count}`, chx, chy);
          count += 1;
        }
      }
    }

    c.putImageData(data, 0, 0);
    console.log('makeMarker leave', canvas.width, canvas.height);
  }

  /**
   * 1つ作画する
   * @param {HTMLCanvasElement} canvas 
   */
  makeOne(canvas, id) {
    const cellsize = 16;
    canvas.width = 9 * cellsize;
    canvas.height = 9 * cellsize;
    const c = canvas.getContext('2d');

    const map = this.mapping[id];
    for (let i = 0; i < 9; ++i) {
      for (let j = 0; j < 9; ++j) {
        const bw = map.getBit(j, i);

        c.fillStyle = (bw === Pattern.BLACK) ? 'black' : 'white';
        c.fillRect(j * cellsize, i * cellsize, cellsize, cellsize); 
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
      const el = document.getElementById('idmakemarker');
      el?.addEventListener('click', async () => {
        const canvas = document.getElementById('backcanvas');
        canvas.width = 16 * 15 * 5;
        canvas.height = 16 * 15 * 7;
        this.makeMarker(canvas, result);
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

  /**
   * 
   * @see https://github.com/AprilRobotics/apriltag/blob/master/apriltag.c#L1454
   * @param {string} code 
   * @returns 
   */
  parseCode(code) {
    const ret = {
      bits: [],
      pos: new Float32Array(41 * 2),
      map: [],
    };
    const lines = code.split('\n');
    const bitReg = /0x(?<bits>.{16})UL,/;
    const posReg = /bit_(?<el>x|y)\[(?<index>\d+)\] = (?<num>-?\d+);/;
    for (const line of lines) {
      const bit = bitReg.exec(line);
      if (bit) {
        const bitstr = bit.groups['bits'];
        const bit64 = (BigInt(`0x${bitstr.slice(0, 8)}`) << 32n) | BigInt(`0x${bitstr.slice(8, 16)}`);
        ret.bits.push(bit64);

        console.log(ret.bits.length - 1, 'bit64', bit64.toString(16).padStart(16, '0'));
        continue;
      }
      const pos = posReg.exec(line);
      if (pos) {
        const el = pos.groups['el'] === 'x' ? 0 : 1;
        const index = Number.parseFloat(pos.groups['index']);
        const num = Number.parseFloat(pos.groups['num']);
        ret.pos[index * 2 + el] = num;
        continue;
      }
    }

    for (let i = 0; i < 2115; ++i) {
      const pat = new Pattern();
      pat.makeMap(ret.pos, ret.bits[i]);
      ret.map.push(pat);
    }

    console.log('parseCode', ret);
    return ret;
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
