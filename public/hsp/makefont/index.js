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

    this.replace(8);
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

    {
      const el = document.getElementById('makingfont');
      el?.addEventListener('click', () => {
        console.log('makingfont click');
        
        const dst = document.getElementById('subcanvas');
        this.magByDot(this.scale);
        const padding = 0.25;
        const name = `afont8_${8 * this.scale}_${padding * 100}`;
        const buf = this.makeFont(name, dst, padding);
        this.download(new Blob([buf]), `${name}.gpb`);
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
   * afont8.png を 16x16 で再配置する
   * @param {number} size 8 など
   */
  replace(size) {
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
   * gpb フォントバイナリを生成する
   * @see https://github.com/gameplay3d/gameplay/blob/master/gameplay/src/Font.h
   * @param {string} name 
   * @param {HTMLCanvasElement} canvas 
   * @param {number} padding ピクセル単位
   * @returns 
   */
  makeFont(name, canvas, padding) {
    const texw = canvas.width;
    const TYPE_FONT = 128;
    const FORMAT_BITMAP = 0;
    const STYLE_PLAIN = 0;
    /**
     * 幅に対してグリフ16個均等割つけ
     */
    const GWNUM = 16;
    /**
     * 1グリフのピクセルサイズ
     */
    const size = texw / GWNUM;

    // code 0x80 以降は含まない場合
    // そもそもレンダリングできなかったはず
    const texh = Math.min(canvas.height, size * 8);

    const gryphs = [];
    // 0x20～0x7e か? 0x7f が del
    for (let i = 32; i <= 0x7e; ++i) {
      let x = (i & (GWNUM - 1)) * size;
      let y = Math.floor(i / GWNUM) * size;
      const g = {
        code: i,
        width: size,
        bearingX: 0,
        advance: size,
        uvs: [
          x + padding,
          y + padding,
          x + size - padding,
          y + size - padding,
        ],
      };
      gryphs.push(g);
    }


    const buf = new ArrayBuffer(texw * texh * 4);
    const p = new DataView(buf);
    let c = 0;

    /**
     * 
     * @param {string} ascii 
     */
    const _wascii = (ascii) => {
      const len = ascii.length;
      p.setInt32(c, len, true);
      c += 4;
      for (let i = 0; i < len; ++i) {
        p.setUint8(c, ascii.codePointAt(i), true);
        c += 1;
      }
    };

    { // magic and reftable
      const chs = [
        0xab, 0x47, 0x50, 0x42,
        0xbb, 0x0d, 0x0a, 0x1a,
        0x0a, 0x01, 0x05,
      ];
      for (const v of chs) {
        p.setUint8(c, v);
        c += 1;
      }
      p.setInt32(c, 1, true); // ref 1個
      c += 4;
      _wascii(name); // チャンク名
      p.setInt32(c, TYPE_FONT, true);
      c += 4;
      p.setInt32(c, c + 4, true);
      c += 4;
    }
    { // フォントチャンク内のヘッダ
      // not empty font family
      _wascii(name);

      // font style
      const style = STYLE_PLAIN;
      p.setInt32(c, style, true);
      c += 4;

      if (true) { // fontSize ver.1.4以上のみ 以前は1固定
        p.setInt32(c, 1, true);
        c += 4;
      }

      {
        p.setInt32(c, size, true); // 高さサイズ
        c += 4;

        _wascii('');

        const gnum = gryphs.length;
        p.setInt32(c, gnum, true);
        c += 4;

        for (const g of gryphs) {
          p.setInt32(c, g.code, true);
          p.setInt32(c + 4, g.width, true);
          c += 8;
          if (true) { // 1.5以上のみ デフォルトは 0, width
            p.setInt32(c, g.bearingX, true);
            p.setInt32(c + 4, g.advance, true);
            c += 8;
          }
          p.setFloat32(c, g.uvs[0] / texw, true);
          p.setFloat32(c + 4, g.uvs[1] / texh, true);
          p.setFloat32(c + 8, g.uvs[2] / texw, true);
          p.setFloat32(c + 12, g.uvs[3] / texh, true);
          c += 16;
        }
      }
    }
    { // 中身
      const ctx = canvas.getContext('2d');
      const img = ctx.getImageData(0, 0, texw, texh);

      p.setInt32(c, texw, true);
      p.setInt32(c + 4, texh, true);
      p.setInt32(c + 8, texw * texh * 1, true);
      c += 12;
      for (let y = 0; y < texh; ++y) {
        for (let x = 0; x < texw; ++x) {
          let offset = (x + texw * y) * 4;
          let a = img.data[offset+3];
          let lv = a;
          p.setUint8(c, lv);

          c += 1;
        }
      }
      p.setInt32(c, FORMAT_BITMAP, true);
      c += 4;
    }
    return buf.slice(0, c);
  }

  /**
   * ドットのまま拡大する
   * @param {number} scale 倍率
   */
  magByDot(scale) {
    /**
     * @type {HTMLCanvasElement}
     */
    const src = document.getElementById('maincanvas');
    /**
     * @type {HTMLCanvasElement}
     */
    const dst = document.getElementById('subcanvas');
    const w = src.width;
    const h = src.height;
    dst.width = w * scale;
    dst.height = h * scale;

    const srcc = src.getContext('2d');
    const dstc = dst.getContext('2d');
    const img = srcc.getImageData(0, 0, w, h);
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let offset = (x + w * y) * 4;
        let r = img.data[offset];
        let g = img.data[offset+1];
        let b = img.data[offset+2];
        let a = img.data[offset+3];

        dstc.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
        dstc.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
