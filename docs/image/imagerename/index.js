
class Misc {
  constructor() {
    this.startcount = 0;
    this.addcount = 1;
    /**
     * 出力数
     */
    this.outcount = 1;
    this.maxcount = -1;

    /** @type {FileSystemDirectoryHandle} */
    this.root = null;
  }

  async initialize() {
    this.setListener();
  }

  pad(v, n = 2) {
    return new String(v).padStart(n, '0');
  }

  /**
   * パラメーター
   * @returns {any}
   */
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
    for (const k of ['startcount',
      'addcount', 'outcount',
    ]) {
      const el = document.getElementById(k);
      obj[k] = Number.parseFloat(el?.value);
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
   * 部分的に重複チェックする
   * @param {FileSystemFileHandle} a 
   * @param {FileSystemFileHandle} b 
   */
  async checkSame(a, b) {
    let checkByte = 256;
    try {
      const fa = await a.getFile();
      const fb = await b.getFile();
      if (fa.size !== fb.size) {
        return false;
      }

      const end = fa.size;
      const start = Math.max(0, end - checkByte);
      const bufa = await fa.slice(start, end).arrayBuffer();
      const bufb = await fb.slice(start, end).arrayBuffer();

      const n = bufa.size;
      for (let i = 0; i < n; ++i) {
        if (bufa[i] !== bufb[i]) {
          return false;
        }
      }
      return true;

    } catch (e) {
      return false;
    }
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
        const result = this.checkSame(fi.handle, fj.handle);
        if (!result) {
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
    const cb = document.getElementById('onefile');
    for (let i = 0; i < n; ++i) {
      const f = dstFiles[i];
      if (!f.dup) {
        continue;
      }
      const clone = document.importNode(cb.content, true);
      {
        const q = clone.querySelector('.onefile');
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
    return `${this.prefix}${this.pad(num, this.num)}.${this.ext}`;
  }

  /**
   * 未使用
   */
  async analyzeDir(param) {
    console.log('analyzeDir called', param);
    /** @type {FileSystemDirectoryHandle} */
    const root = this.root;

    const re = /(?<prefix>\D*)(?<num>\d+)\.(?<ext>[^.]*)$/;

    const srcdh = await this.searchHandle(root, param.source);
    const dstdh = await this.searchHandle(root, param.destination);

    for await (const h of srcdh.values()) {
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
      const dstfh = await dstdh.getFileHandle(dstfilename, { create: true });
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
      el?.addEventListener('drop', ev => {
        ev.stopPropagation();
        ev.preventDefault();
        //this.analyzeText(ev.dataTransfer.files[0]);
      });
    }

    { // ワーキングディレクトリで指定するタイプ。うまくいく。
      const el = document.getElementById('opendir');
      el?.addEventListener('click', async () => {
        const dirHandle = await this.openDir();
        this.setContent('#rootview', dirHandle.name);
        this.root = dirHandle;


        //await this.processDir(dirHandle);
      });
    }

    {
      const el = document.getElementById('skipnumber');
      el?.addEventListener('click', async () => {
        this.renumber();
      });
    }

    { // リトライ
      const el = document.getElementById('retry');
      el?.addEventListener('click', async () => {
        await this.processDir(this.root);
      });
    }

    { // 重複チェック
      const el = document.getElementById('checkdup');
      el?.addEventListener('click', async () => {
        const param = this.gatherParam();
        await this.checkDup(this.root, param);
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

  /**
   * 
   * @param {FileSystemDirectoryHandle} cur 
   * @param {string[]} strs 
   */
  async searchHandleByPath(cur, strs) {
    if (strs.length === 0) {
      return null;
    }
    const name = strs[0];
    let result = null;
    for await (const [key, val] of cur.entries()) {
      if (key !== name) {
        continue;
      }
      result = val;
      break;
    }
    if (!result) {
      return null;
    }

    if (strs.length === 1) {
      return result;
    }
    result = await this.searchHandleByPath(result, strs.slice(1));
    return result;
  }

  /**
   * 
   * @param {FileSystemDirectoryHandle} handle 
   * @param {string} pathstr 
   * @returns {FileSystemHandle|null}
   */
  async searchHandle(handle, pathstr) {
    const ss = pathstr.split('/').filter(v => v !== '' && v !== '.');
    const result = await this.searchHandleByPath(handle, ss);
    return result;
  }

  /**
   * ハンドルから ArrayBuffer を得る
   * @param {FileSystemFileHandle} handle
   */
  async loadFile(handle) {
    const file = await handle.getFile();
    const ab = await file.arrayBuffer();
    return ab;
  }

  /**
   * 指定フォルダにファイルを書き出す
   * @param {FileSystemDirectoryHandle} dir 
   * @param {string} name
   * @param {ArrayBuffer} buf
   */
  async writeFile(dir, name, buf) {
    const fh = await dir.getFileHandle(name, {create: true});
    const ws = await fh.createWritable({
      //keepExistingData: true,
    });
    //await ws.seek(256);
    await ws.write(buf);
    await ws.close();
  }

  /**
   * 選択から src フォルダを列挙して
   * dst フォルダに書き出す
   */
  async renumber() {
    const param = this.gatherParam();

    const srcDir = await this.searchHandle(this.root, param.source);
    const dstDir = await this.searchHandle(this.root, param.destination);
    /**
     * @type {FileSystemFileHandle}
     */
    let srcOne = null;
    for await (const [key, val] of srcDir.entries()) {
      if (val.kind !== 'file') {
        continue;
      }
      srcOne = val;
      break;
    }
    // src の名前検知
    const re = /^(?<base>\D+)(?<number>\d+)\.(?<ext>[^\.]+)$/;
    const m = re.exec(srcOne.name);
    if (!m) {
      console.log('no match');
      return;
    }
    const base = m.groups['base'];
    const numstr = m.groups['number'];
    const ext = m.groups['ext'];
    // src の数の桁
    const digitNum = numstr.length;

    const mapNum = {};
    // ベース150
    for (let i = 0; i < 150; ++i) {
      const index = i * 2;
      mapNum[`${index}`] = {type: 5};
    }
    // デンス30
    const denses = JSON.parse(denses);
    for (const dense of denses) {
      for (let i = 0; i < 30; ++i) {
        const index = dense + i;
        mapNum[`${index}`] = {type: 3};
      }
    }

    const nums = Object.keys(mapNum).map(v => Number.parseFloat(v)).sort((a, b) => a - b);
    nums.splice(150);

    let count = 0;
    for (const num of nums) {
      const srcName = `${base}${this.pad(num, digitNum)}.${ext}`;
      const srcFH = await srcDir.getFileHandle(srcName);
      const buf = await this.loadFile(srcFH);

      const dstName = `${base}${this.pad(count, digitNum)}.${ext}`;
      // 書き出す
      await this.writeFile(dstDir, dstName, buf);

      count += 1;
    }

    console.log('renumber');
  }

}

const misc = new Misc();
misc.initialize();
