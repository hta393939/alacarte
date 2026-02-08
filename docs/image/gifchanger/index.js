
const _pad = (v, n = 2) => {
  return new String(v).padStart(n, '0');
};

const _dtstr = () => {
  let str = Temporal.Now.plainDateTimeISO();
  str = str.replace(/[-:]/g, '');
  str = str.replace(/[T\.]/g, '_');
  return str;
};

/**
 * 1フレーム分
 */
class Frame {
  constructor() {
    /** ファイル中オフセット */
    this.offset = 0;
    /** 末尾バイト。ファイル中オフセット */
    this.end = 0;

    /** 1/100秒単位。0だとカット扱いとする */
    this.delayTime = 0;

    this.orgDelayTime = 0;
  }
}

class Misc {
  constructor() {
    this.src = '';
    this.dst = '';
    this.startcount = 0;
    this.addcount = 1;
    /**
     * 出力数
     */
    this.outcount = 1;
    this.maxcount = -1;

    /** @type {FileSystemDirectoryHandle} */
    this.root = null;
    this.srcdh = null;
    this.dstdh = null;

    /** ドロップしたファイル名 */
    this.curname = '';
    /** @type {File} */
    this.curfile = null;
    this.curinfo = {};
    /** 変更後バイナリの素 */
    this.curbufs = [];
  }

  async initialize() {
    this.setListener();
  }

  gatherParam() {
    const obj = {};
    for (const k of ['source', 'destination']) {
      const el = document.getElementById(k);
      obj[k] = el.value;
    }
    for (const k of ['isdel']) {
      const el = document.getElementById(k);
      obj[k] = el?.checked;
    }
    return obj;
  }

  /**
   * 
   * @param {string} q 
   * @param {string} val 
   * @returns 
   */
  setContent(q, val) {
    const el = document.querySelector(q);
    if (!el) {
      return;
    }
    el.textContent = val;
  }


  /**
   * フォルダに対して処理する．
   * ルートから指定フォルダに重複せずにファイルを作成する．
   * @param {FileSystemDirectoryHandle} dirHandle 
   */
  async moveAndFile(dirHandle, param) {
    let srcDir = null;
    let dstDir = null;
    /** @type {FileSystemFileHandle[]} */
    const images = [];

    const reImage = /^image[^\.]*\.(?<ext>[^\.]+)$/;
    // ルートフォルダ内から列挙
    for await (const h of dirHandle.values()) {
      if (h.kind === 'directory') {
        if (h.name === param.destination) {
          dstDir = h;
        } else if (h.name === param.source) {
          srcDir = h;
        }
        console.log('dir', h.name);
      }
    }
    for await (const h of srcDir.values()) {
      const m = reImage.exec(h.name);
      if (!m) {
        continue;
      }
      images.push(h);           
      console.log('file', h.name);
    }
    if (!srcDir || !dstDir) {
      return;
    }

    /**
     * 指定フォルダ内から列挙
     * @type {string[]}
     */
    const dstNames = [];
    for await (const h of dstDir.values()) {
      if (h.kind === 'directory') {
        continue;
      }
      dstNames.push(h.name);
    }
    // 移動
    let count = 10000;
    for await (const h of images) {
      //let name = h.name;
      let name = `image${String(count).padStart(5, '0')}.jpg`;
      while (true) {
        if (dstNames.indexOf(name) < 0) {
          break;
        }
        count++;
        name = `image${String(count).padStart(5, '0')}.jpg`;
      }

      // ソース
      const srcFile = await h.getFile();
      const srcBuf = await srcFile.arrayBuffer();
      // 書き出し
      const dstFile = await dstDir.getFileHandle(name, { create: true });
      const writer = await dstFile.createWritable();
      await writer.write(srcBuf);
      await writer.close();
      
      console.log('write', h.name, name);
      dstNames.push(name);

      { // 削除
        await h.remove();
      }
    }

    this.srcdh = srcDir;
    this.dstdh = dstDir;
    console.log('moveAndFile done');
  }

  /**
   * フォルダに対して処理する．
   * ルートから見た指定フォルダの重複をチェックする．
   * @param {FileSystemDirectoryHandle} dirHandle 
   * @param {boolean} isdel
   */
  async checkDup(dirHandle, param) {
    const isdel = param.isdel;
    let srcDir = null;
    let dstDir = null;

    const reImage = /^(?<pre>.*)image[^\.]*\.(?<ext>[^\.]+)$/;
    // ルートフォルダ内から列挙
    for await (const h of dirHandle.values()) {
      if (h.kind === 'directory') {
        if (h.name === param.destination) {
          dstDir = h;
        } else if (h.name === param.source) {
          srcDir = h;
        }
        console.log('dir', h.name);
      }
    }
    if (!srcDir || !dstDir) {
      return;
    }

    /**
     * 指定フォルダ内から列挙
     * @type {object[]}
     */
    const dstFiles = [];
    for await (const h of dstDir.values()) {
      if (h.kind === 'directory') {
        continue;
      }
      const obj = {handle: h, name: h.name, dup: false};
      const f = await h.getFile();
      obj.byte = f.size;
      dstFiles.push(obj);
    }

    let n = dstFiles.length;
    for (let i = n - 1; i >= 0; --i) {
      for (let j = n - 1; j > i; --j) {
        const fi = dstFiles[i];
        const fj = dstFiles[j];
        const bi = fi.byte;
        const bj = fj.byte;
        if (bi !== bj) {
          continue;
        }

        if (!fi.dup && !fj.dup) { // どっちもfalseの場合
          const mi = reImage.exec(fi.name);
          const mj = reImage.exec(fj.name);
          if (mi) {
            const pi = mi.groups['pre'] || '';
            if (pi.length === 0) {
              fi.dup = true;
            } else {
              fj.dup = true;
            }
          }
        }

        console.log(`%csame byte`, 'font-weight:bold;',
          fi, fj);
      }
    }

    const parent = document.getElementById('dupfiles');
    parent.textContent = '';
    const cb = document.getElementById('oneframe');
    for (let i = 0; i < n; ++i) {
      const f = dstFiles[i];
      if (!f.dup) {
        continue;
      }
      const clone = document.importNode(cb.content, true);
      {
        const q = clone.querySelector('.oneframe');
        if (q) {
          q.dataset['name'] = f.name;
        }
      }
      {
        const q = clone.querySelector('.name');
        if (q) {
          q.textContent = f.name;
        }
      }
      parent.appendChild(clone);

      if (isdel) {
        await f.handle.remove();
      }
    }

    console.log('checkDup', n * (n + 1) / 2);
    return;
  }

  /**
   * readwrite でディレクトリを指定する
   * @returns {FileSystemDirectoryHandle}
   */
  async openDir() {
    const diropt = {
      mode: 'readwrite'
    };
    const dirHandle = await window.showDirectoryPicker(diropt);
    console.log('openDir', dirHandle);
    return dirHandle;
  }

  /**
   * フォルダに対して処理する．
   * ルートから指定フォルダに重複せずにファイルを作成する．
   * @param {FileSystemDirectoryHandle} dirHandle 
   */
  async processDir(dirHandle) {
    console.log('processDir');
    const param = this.gatherParam();
    const result = await this.moveAndFile(dirHandle, param);
    if (!result) {
      console.warn('moveAndFile failure');
      return;
    }
  }

  async analyzeText(file) {
    const text = await file.text();
    const lines = text.split('\n');
    const result = {
      objs: []
    };
    for (const line of lines) {
      const vals = line.split(',').map(val => Number.parseFloat(val));
      if (!Number.isFinite(vals[0])) {
        continue;
      }

      const obj = {
        index: vals[0],
        id: vals[1],
        x: vals[2],
        y: vals[3],
        a: vals[4],
        rx: vals[5],
        ry: vals[6],
      };
      result.objs.push(obj);
    }
    console.log('result', result);

    this.draw(window.canvas, result.objs);

    return result;
  }

  makeFilename(num) {
    return `${this.prefix}${_pad(num, this.num)}.${this.ext}`;
  }

  /**
   * 未使用
   */
  async analyzeDir(param) {
    console.log('analyzeDir called', param);
    /** @type {FileSystemDirectoryHandle} */
    const root = this.root;

    const re = /(?<prefix>\D*)(?<num>\d+)\.(?<ext>[^.]*)$/;
    for await (const h of root.values()) {
      if (h.kind === 'directory') {
        if (h.name === param.source) {
          this.srcdh = h;
        }
        if (h.name === param.destination) {
          this.dstdh = h;
        }
        continue;
      }
    }


    for await (const h of this.srcdh.values()) {
      if (h.kind === 'directory') {
        continue;
      }
      // file
      // 存在するファイルを取得する
      const m = re.exec(h.name);
      // 名前数値.拡張子 に分解する
      if (!m) {
        continue;
      }
      // 見つかった
      this.prefix = m.groups['prefix'];
      this.num = m.groups['num'].length;
      this.ext = m.groups['ext'];
      this.maxcount = Math.max(this.maxcount, 0);
      const curcount = Number.parseInt(m.groups['num']);

      // startcount, addcount, outcount
      const index = (curcount - this.startcount) / this.addcount;
      if (index !== Math.floor(index)) {
        continue;
      }
      /** @type {File} */
      const file = await h.getFile();
      const buf = await file.arrayBuffer();

      let dstfilename = this.makeFilename(index);
      const dstfh = await this.dstdh.getFileHandle(dstfilename, { create: true });
      const writer = await dstfh.createWritable();
      await writer.write(buf);
      await writer.close();
      console.log('', curcount, index);
    }

    return ret;
  }

  setListener() {
    {
      const el = document.body;
      el?.addEventListener('dragover', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'none';
      });
      el?.addEventListener('drop', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'none';
      });
    }
    {
      const el = document.querySelector('.drop');
      el?.addEventListener('dragover', ev => {
        ev.stopPropagation();
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'copy';
      });
      el?.addEventListener('drop', async ev => {
        ev.stopPropagation();
        ev.preventDefault();
        const file = ev.dataTransfer.files[0];
        this.curfile = file;
        const ab = await file.arrayBuffer();
        const info = await this.parseGif(ab);
        this.curinfo = info;
        console.log('info', info);
        this.curname = file.name;
        document.title = `${this.curname} - gifchanger`;
      });
    }

    { // ワーキングディレクトリで指定するタイプ。うまくいく。
      const el = document.getElementById('opendir');
      el?.addEventListener('click', async () => {
        const dirHandle = await this.openDir();
        this.setContent('#rootview', dirHandle.name);
        this.root = dirHandle;
        await this.processDir(dirHandle);
      });
    }
    { // delayやカットの反映
      const el = document.getElementById('applybut');
      el?.addEventListener('click', async () => {
        await this.applyGif();
      });
    }
    { // 反映後のダウンロード
      const el = document.getElementById('downloadbut');
      el?.addEventListener('click', async () => {
        await this.downloadGif();
      });
    }

    for (const k of ['startcount', 'addcount', 'outcount']) {
      const el = document.getElementById(k);
      const _update = () => {
        const val = Number.parseFloat(el.value);
        const viewel = document.getElementById(`${k}view`);
        if (viewel) {
          viewel.textContent = `${val}`;
        }
      };
      el?.addEventListener('input', _update);
      _update();
    }

  }

  async makeUI() {
    console.log('makeUI');

    const el = document.getElementById('oneframe');
    const parent = document.getElementById('processingview');
    parent.textContent = '';
    for (const frame of this.curinfo.frames) {
      const clone = document.importNode(el.content, true);
      for (const k of ['offset', 'end']) {
        const q = clone.querySelector(`.${k}`);
        if (!q) {
          continue;
        }
        q.textContent = `${frame[k]}`;
      }
      for (const k of ['delayTime']) {
        const q = clone.querySelector(`.${k}`);
        if (!q) {
          continue;
        }
        q.value = frame[k];
      }
      parent.appendChild(clone);
    }
  }

  async applyGif() {
    console.log('applyGif');
    // TODO: UIから収集する

    const ab = await this.curfile.arrayBuffer();
    const result = await this.changeGif(ab, this.curinfo);
    this.curbufs = result.bufs;
    const candimage = document.getElementById('candimage');
    candimage.src = URL.createObjectURL(new Blob(this.curbufs));
  }

  /**
   * 
   * @param {Blob} blob 
   * @param {string} name 
   */
  download(blob, name) {
    const a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(blob);
    a.click();
  }  

  async downloadGif() {
    console.log('downloadGif');
    const ab = await this.curfile.arrayBuffer();
    const bufs = await this.changeGif(ab, this.curinfo);
    const re = `(?<front>.+)\.[^\.]+$`;
    const m = re.exec(this.curname);
    let name = `_${_dtstr()}.gif`;
    if (m) {
      name = m.groups['front'] + name;
    }
    this.download(new Blob(bufs), name);
  }

  /**
   * 
   * @param {ArrayBuffer} inab 
   * @param {Object} info 
   * @param {Frame[]} info.frames
   * @returns 
   */
  async changeGif(inab, info) {
    /**
     * 
     * @param {ArrayBuffer} ab 
     * @param {number} offset 
     * @param {number} len 
     */
    const _clone = (ab, offset, len) => {
      const clone = new ArrayBuffer(len);
      const src = new Uint8Array(ab);
      for (let i = 0; i < len; ++i) {
        clone[i] = src.getUint8(offset + i);
      }
      return clone;
    };

    const ret = {};
    // クローン
    const ab = _clone(inab, 0, inab.byteLength);
    const p = new DataView(ab);

    for (const frame of info.frames) { // 書き換え
      if (frame.delayTime === 0) {
        continue;
      }

      let offset = frame.offset;
      p.setUint16(offset, 100, true);
      const clone = _clone(ab,
        frame.offset, frame.end - frame.offset);
      ret.bufs.push(clone);
    }

    return ret;
  }

  /**
   * 
   * @param {ArrayBuffer} ab 
   */
  async parseGif(ab) {
    let info = {
      frames: [],
    };

    const p = new DataView(ab);
    let c = 0;
    c += 6;
    let gw = p.getUint16(c, true);
    let gh = p.getUint16(c + 2, true);
    c += 4;
    let flags = p.getUint8(c);
    c += 1;
    let globalTable = ((flags & 0x80) !== 0);
    let pow = (flags & 7) + 1;

    //let globalTable = ((flags & 1) !== 0);
    //let pow = ((flags >> 5) & 7) + 1;

    let commonPaletteNum = 2 ** pow;
    console.log('table', globalTable, commonPaletteNum, gw, gh);

    c += 2;

    if (globalTable) {
      c += commonPaletteNum * 3;
    }

    let frame = {};

    while (c < ab.byteLength) {
      console.log('offset', c, c.toString(16));
      const sep = p.getUint8(c);
      c += 1;
      if (sep === 0x3b) { // 
        break;
      }
      if (sep === 0x21) {
        const subsep = p.getUint8(c);
        c += 1;

        console.log('0x21', c - 2, subsep.toString(16));

        switch (subsep) {
        case 0xf9: // 
          {
            const blockByte = p.getUint8(c);
            c += 1;
            const flags = p.getUint8(c);
            const delayTime = p.getUint16(c + 1, true);
            const transparent = p.getUint8(c + 3, true);
            c += blockByte;
            console.log('Graphic', flags, delayTime, transparent);
          }
        case 0x01:
        case 0xff: // Application
        default:
          // offset.push(c - 2);
          while (c < ab.byteLength) {
            let blockByte = p.getUint8(c);
            c += 1;
            if (blockByte === 0) {
              break;
            }
            c += blockByte;
          }
        }
      } else if (sep === 0x2c) { // image
        frame.offset = c - 1;
        console.log('image', c - 1);

        let lx = p.getUint16(c, true);
        let ly = p.getUint16(c + 2, true);
        let lw = p.getUint16(c + 4, true);
        let lh = p.getUint16(c + 6, true);
        c += 8;
        let iflags = p.getUint8(c);
        c += 1;
        let itable = ((iflags & 0x80) !== 0);
        let ipow = (iflags & 7) + 1;
        let localNum = 2 ** ipow;
        console.log('', itable, localNum);
        if (itable) {
          c += localNum * 3;
        }
        let lzw = p.getUint8(c);
        c += 1;

        while (c + 1 < ab.byteLength) {
          let blockByte = p.getUint8(c);
          c += 1;
          if (blockByte === 0) {
            break;
          }
          c += blockByte;
        }

        frame.end = c;
        info.frames.push(Object.assign({}, frame));
        frame = {};
      }

    }

    console.log('', c, ab.byteLength);
    return info;
  }

}

const misc = new Misc();
misc.initialize();
