/**
 * @file index.js
 */

class Misc {
  constructor() {
    this.STORAGE = 'maketool';

    this.filename = null;

    this.param = {
      scale: 11,
      cellx: 0,
      celly: 0,
      cellw: 1,
      cellh: 1,
      x: 0,
      y: 0,
      w: 512,
      h: 512,
      destsize: 512,
    };

    /**
     * @type {FileSystemDirectoryHandle}
     */
    this.dirHandle = null;
  }

  async initialize() {
    this.loadSetting();
    this.setListener();

    this.replace();
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
    { // 無効化
      const el = document;
      el?.addEventListener('dragover', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'none';
      });
    }

    { // ドロップ
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

    // パラメータ群
    for (const k in this.param) {
      const el = document.getElementById(`${k}`);
      const viewel = document.getElementById(`${k}view`);
      const _update = () => {
        this[k] = Number.parseFloat(el.value);
        viewel.textContent = this[k];

        //this.drawFrame();
        //this.renewGuide();
      };
      el?.addEventListener('input', () => {
        _update();
      });
      _update();
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
      const el = document.getElementById('processfont');
      el?.addEventListener('click', () => {
        this.processFont();
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
    //URL.revokeObjectURL(a.href);
  }

  /**
   * 
   */
  replace() {
    const size = 8;
    const img = document.getElementById('afont8');
    /**
     * @type {HTMLCanvasElement}
     */
    const canvas = document.getElementById('maincanvas');
    canvas.width = size * 16;
    canvas.height = size * 16;
    const c = canvas.getContext('2d');

    const colOffset = 0; // white
    //const colOffset = 1; // dark blue
    //const colOffset = 8; // red
    for (let y = 0; y < 16; ++y) {
      for (let x = 0; x < 16; ++x) {
        let index = x + 16 * y;
        let sx = size * (index % 64);
        let sy = size * (Math.floor(index / 64) + colOffset * 4);
        c.drawImage(img, sx, sy, size, size,
          x * size, y * size, size, size);
      }
    }

    c.fillStyle = 'rgba(255, 255, 255, 1.0)';
    for (let y = 13; y < 16; ++y) {
      for (let x = 0; x < 16; ++x) {
        let index = x + y * 16;

        let r = x * 16;
        let g = x * 16;
        let b = x * 16;

        if (y === 13) {

        } else {
          let gr = Math.floor((index - 14 * 16) / 4);
          r = ((gr >> 1) & 1) * 256;
          g = ((gr >> 2) & 1) * 256;
          b = (gr & 1) * 256;
          let div = 1 << (index & 3);
          {
            r /= div;
            g /= div;
            b /= div;
          }
        }

        r = Math.min(255, r);
        g = Math.min(255, g);
        b = Math.min(255, b);
        c.fillStyle = `rgba(${r},${g},${b},1.0)`;
        c.fillRect(x * size, y * size, size, size);
      }
    }

  }

  /**
   * 
   */
  processFont() {
    console.log('processFont');
    /**
     * @type {HTMLImageElement}
     */
    const srcimg = document.getElementById('chip8dblue');
    const sw = srcimg.naturalWidth;
    const sh = srcimg.naturalHeight;

    const dstimg = document.getElementById('chip16');
    const dw = dstimg.naturalWidth;
    const dh = dstimg.naturalHeight;

    /**
     * @type {HTMLCanvasElement}
     */
    const canvass = document.getElementById('maincanvas');
    canvass.width = sw;
    canvass.height = sh;
    const cs = canvass.getContext('2d');
    /**
     * @type {HTMLCanvasElement}
     */
    const canvasd = document.getElementById('subcanvas');
    canvasd.width = dw;
    canvasd.height = dh;
    const cd = canvasd.getContext('2d');

    // 参照
    cs.drawImage(srcimg, 0, 0);
    cd.drawImage(dstimg, 0, 0);
    // 書き出し先

    let side = 2;
    let w1 = 8 * 16;
    let h1 = 8 * 11;

    const img = cs.getImageData(0, 0, sw, sh);
    for (let y = 0; y < h1; ++y) {
      for (let x = 0; x < w1; ++x) {
        let sx = x;
        let sy = y + 8 * 2;
        let offset = (sx + sw * sy) * 4;

        let cx = sx * side;
        let cy = sy * side;
        let r = img.data[offset];
        let g = img.data[offset+1];
        let b = img.data[offset+2];
        let a = img.data[offset+3];

        if (a !== 0) {
          r = 0;
          g = 255;
          b = 0;
          a = 1;

          cd.fillStyle = `rgba(${r},${g},${b}, ${a})`;
          cd.fillRect(cx, cy, side, side);
        } else {
          a = 0;

          cd.fillStyle = `rgba(${r},${g},${b}, ${a})`;
          cd.clearRect(cx, cy, side, side);
        }

      }
    }
  }

  /**
   * 
   */
  act() {
    console.log('act called');

    /**
     * 
     * @param {string} base 
     * @param {FileSystemDirectoryHandle} handle 
     */
    const _resolveInclude = (base, handle) => {
      const lines = base.split('\r\n');

    };

    console.log('act leave');
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
