/**
 * @file index.js
 */

class Misc {
  constructor() {
    this.STORAGE = 'imagetool';

    this.filename = null;

    this.param = {
      scale: 11,
      cellx: 0,
      celly: 0,
      cellw: 1,
      cellh: 1,
      x: 0,
      y: 0,
    };

    /**
     * @type {FileSystemDirectoryHandle}
     */
    this.dirHandle = null;
  }

  async initialize() {
    this.loadSetting();
    this.setListener();
  }

  /**
   * 緑の明るさを取ってきてすべての成分に適用する
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
        let r = dat.data[ft  ];
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

        dat.data[ft  ] = cols[0];
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
      {
        const name = file.name;
        this.filename = name;
        window.filename.textContent = name;
      }


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
   * File を maincanvas に読み込む
   * @param {File} file 
   * @returns {Promise<{canvas: HTMLCanvasElement}>}
   */
  async parseImage(file) {
    return new Promise((resolve, reject) => {

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

        resolve({
          canvas,
        });
      });
      img.src = URL.createObjectURL(file);
    });

  }

  loadSetting() {
    const param = this.param;
    try {
      const obj = JSON.parse(localStorage.getItem(this.STORAGE));
      for (const key in obj) {
        param[key] = obj[key];
      }
    } catch (e) {
      console.warn('loadSetting', e.message);
    }
    console.log('loadSetting', param);
    return param;
  }

  saveSetting() {
    const param = this.param;
    try {
      for (const key in param) {
        const el = document.getElementById(key);
        if (!el) {
          continue;
        }
        if (Number.isFinite(param[key])) {
          param[key] = Number.parseFloat(el.value);
        } else {
          param[key] = el.value;
        }
      }
    } catch (e) {
      console.warn('saveSetting', e.message);
    }
    localStorage.setItem(this.STORAGE, JSON.stringify(param));
    return param;
  }

  setListener() {
    {
      const el = document;
      el?.addEventListener('dragover', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'none';
      });
    }

    {
      const el = document.getElementById('convcolor');
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
        this.convColor(canvas);
      });
    }

    {
      const el = document.getElementById('loadimage');
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
      });
    }

    for (const k in this.param) {
      const el = document.getElementById(`${k}`);
      const viewel = document.getElementById(`${k}view`);
      const _update = () => {
        this[k] = Number.parseFloat(el.value);
        viewel.textContent = this[k];

        this.drawFrame();
      };
      el?.addEventListener('input', () => {
        _update();
      });
      _update();
    }

    {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.saveSetting();
        }
      });
    }

    {
      const el = document.getElementById('act');
      el?.addEventListener('click', () => {
        this.act();
      });
    }

    {
      const el = document.getElementById('selectdir');
      el?.addEventListener('click', () => {
        this.selectDir();
      });
    }

    {
      const el = document.getElementById('processfordir');
      el?.addEventListener('click', () => {
        this.processForDir();
      });
    }

    {
      const el = document.getElementById('downloadact');
      el?.addEventListener('click', async () => {
        const canvas = document.getElementById('subcanvas');
        const blob = await this.canvasToBlob(canvas);
        const re = /(?<fw>[^.]+)(?<ext>\.[^.]*)?/;
        let name = 'a_po.png';
        const m = re.exec(this.filename || 'a.png');
        if (m) {
          name = `${m.groups?.['fw'] ?? 'a'}_po${m.groups?.['ext'] ?? '.png'}`;
        }
        this.download(blob, name);
      });
    }

    {
      const el = document.getElementById('curved');
      el?.addEventListener('dragover', ev => {
        ev.stopPropagation();
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'copy';
      });
      el?.addEventListener('drop', async ev => {
        ev.stopPropagation();
        ev.preventDefault();
        const canvas = document.getElementById('maincanvas');
        await this.loadFileToCanvas(ev.dataTransfer.files[0], canvas);
        this.curved(canvas);
      });
    }

  }

  async selectDir() {
    const opt = {
      mode: 'readwrite',
      //id, startIn,
    };
    /**
     * @type {FileSystemDirectoryHandle}
     */
    const dh = await window.showDirectoryPicker(opt);
    this.dirHandle = dh;
    const el = document.getElementById('dirview');
    if (el) {
      el.textContent = `dir, ${dh.name}`;
    }

    { // 1枚だけ表示する
      const inputdh = await dh.getDirectoryHandle('input');
      const re = /^(?<body>.+)(?<ext>\.[^.]+)$/;
      for await (const [k, h] of inputdh) {
        if (h.kind !== 'file') {
          continue;
        }
        const m = re.exec(h.name);
        if (!m) {
          continue;
        }

        const ext = m.groups['ext'];
        console.log('one', ext, m.groups['body']);

        if (ext !== '.png') {
          continue;
        }

        const file = await h.getFile();
        await this.parseImage(file);
        this.act();
        break;
      }
    }

  }

  async processForDir() {
    console.log('processForDir called');
    const dh = this.dirHandle;
    const inputdh = await dh.getDirectoryHandle('input');
    const outputdh = await dh.getDirectoryHandle('output');

    let count = 0;
    const re = /^(?<body>.+)(?<ext>\.[^.]+)$/;
    for await (const [k, h] of inputdh) {
      console.log(k, h); // 短い名前とハンドル
      if (h.kind !== 'file') {
        continue;
      }

      const m = re.exec(h.name);
      if (!m) {
        continue;
      }
      const ext = m.groups['ext'];
      if (ext !== '.png') {
        continue;
      }

      /**
       * @type {File}
       */
      const file = await h.getFile();

      let dstbuf = null;
      {
        const result = await this.parseImage(file);

        this.act();
        // 変換処理後のバイナリ
        const subcanvas = document.getElementById('subcanvas');
        const dstblob = await this.canvasToBlob(subcanvas);
        dstbuf = await dstblob.arrayBuffer();
      }

      const opt = {
        create: true,
      };
      const outname = `${m.groups['body']}_po.png`;
      const fh = await outputdh.getFileHandle(outname, opt);

      const wr = await fh.createWritable({
        keepExistingData: false, // false は空にする
      });
      await wr.write(dstbuf);
      await wr.close();

      await window?.scheduler?.yield();

      count += 1;
    }

    {
      const el = document.getElementById('countview');
      if (el) {
        el.textContent = `${count}, ${new Date().toLocaleTimeString()}`;
      }
    }

    console.log('processForDir');
  }

  /**
   * 
   * @param {Blob} blob 
   * @param {string} name 
   */
  download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /**
   * 円軌道上を周辺色で上塗りする
   */
  async curved(canvas) {
    console.log('curved called');
    const w = canvas.width;
    const h = canvas.height;
    const c = canvas.getContext('2d');
    const data = c.getImageData(0, 0, w, h);

    const TOPPX = 93; // 512
    //const rr = 8;
    const rr = 32;
    //const rr = 64;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; ++x) {
        const ft = (x + w * y) * 4;

        let r = data.data[ft];
        let g = data.data[ft+1];
        let b = data.data[ft+2];
        if (r === 255 && g === 0 && b === 0) {
          let ang = Math.PI * 2 * x / w;
          let ty = (y < h / 2) ? y : (h - 1 - y);
          let adjust = 176 - Math.cos(ang) * rr;
          let t = Math.max(0, Math.min(1, (ty - TOPPX * 0.5) / (TOPPX * 0.5)));
          let lv = 176 * (1 - t) + adjust * t;
          r = lv;
          g = lv;
          b = lv;

          data.data[ft] = r;
          data.data[ft+1] = g;
          data.data[ft+2] = b;
        } else {
          continue;
        }
      }
    }
    c.putImageData(data, 0, 0);
    console.log('curved leave', rr);
  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   * @returns {Promise<Blob>}
   */
  canvasToBlob(canvas) {
    console.log('canvasToBlob called');
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        resolve(blob);
      }, 'image/png');
    });
  }

  /**
   * maincanvas の内容から加工処理して subcanvas に書き出す
   */
  act() {
    console.log('act called');
    const param = this.saveSetting();
    const side = param.scale;
    /**
     * @type {HTMLCanvasElement}
     */
    const src = document.getElementById('maincanvas');
    const w = src.width;
    const h = src.height;
    /**
     * @type {HTMLCanvasElement}
     */
    const canvas = document.getElementById('subcanvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.drawImage(src, 0, 0);
    const data = c.getImageData(0, 0, w, h);
    const _sum = (inx, iny, inw, inh) => {
      const cols = [0, 0, 0, 0];
      for (let y = 0; y < inh; ++y) {
        for (let x = 0; x < inw; ++x) {
          const ft = (x + inx + w * (y + iny)) * 4;
          for (let i = 0; i < 4; ++i) {
            cols[i] += data.data[ft+i];
          }
        }
      }
      const k = (inw * inh > 0) ? 1 / (inw * inh) : 0;
      return cols.map(v => v * k);
    };
    const _set = (inx, iny, inw, inh, incols) => {
      for (let y = 0; y < inh; ++y) {
        for (let x = 0; x < inw; ++x) {
          const ft = (x + inx + w * (y + iny)) * 4;
          for (let i = 0; i < 4; ++i) {
            data.data[ft+i] = incols[i];
          }
        }
      }
    };

    for (let y = 0; y < param.cellh; y++) {
      for (let x = 0; x < param.cellw; ++x) {
        let offsetX = (x + param.cellx) * side;
        let offsetY = (y + param.celly) * side;
        const cols = _sum(
          offsetX, offsetY,
          side, side);
        _set(offsetX, offsetY,
          side, side, cols);
      }
    }
    c.putImageData(data, 0, 0);
    console.log('act leave');
  }

  /**
   * 目で見る用
   */
  drawFrame() {
    console.log('drawFrame called');
    const param = this.saveSetting();
    const side = param.scale;
    /**
     * @type {HTMLCanvasElement}
     */
    const src = document.getElementById('maincanvas');
    const w = src.width;
    const h = src.height;
    /**
     * @type {HTMLCanvasElement}
     */
    const canvas = document.getElementById('subcanvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.drawImage(src, 0, 0);
    {
      c.lineWidth = 1.5;
      c.strokeStyle = 'red';
      let x = param.cellx * side;
      let y = param.celly * side;
      c.strokeRect(x, y,
        param.cellw * side, param.cellh * side);
    }
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
