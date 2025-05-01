
const _pad = (v, n = 2) => {
  return new String(v).padStart(n, '0');
};

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
    this.srcdh = null;
    this.dstdh = null;
  }

  async initialize() {
    this.setListener();
  }


  /**
   * フォルダに対して処理する．
   * ルートから指定フォルダに重複せずにファイルを作成する．
   * @param {FileSystemDirectoryHandle} dirHandle 
   */
  async moveAndFile(dirHandle) {
    this.root = dirHandle;
    let srcDir = null;
    let dstDir = null;
    /** @type {FileSystemFileHandle[]} */
    const images = [];

    const reImage = /^image[^\.]*\.(?<ext>[^\.]+)$/;
    // ルートフォルダ内から列挙
    for await (const h of dirHandle.values()) {
      if (h.kind === 'directory') {
        if (h.name === 'dst') {
          dstDir = h;
        } else if (h.name === 'src') {
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
    let count = 0;
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
    console.log('done');
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
    this.root = dirHandle;
    const result = this.moveAndFile(dirHandle);
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
   * 
   */
  async analyzeDir() {
    console.log('analyzeDir called');
    /**
     * @type {FileSystemDirectoryHandle}
     */
    const root = this.root;

    const re = /(?<prefix>\D*)(?<num>\d+)\.(?<ext>[^.]*)$/;
    for await (const h of root.values()) {
      if (h.kind === 'directory') {
        if (h.name === this.src) {
          this.srcdh = h;
        }
        if (h.name === this.dst) {
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
      /**
       * @type {File}
       */
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
        this.dirHandle = dirHandle;
        await this.processDir(dirHandle);
      });
    }
    { // リトライ
      const el = document.getElementById('retry');
      el?.addEventListener('click', async () => {
        await this.processDir(this.dirHandle);
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

}

const misc = new Misc();
misc.initialize();
