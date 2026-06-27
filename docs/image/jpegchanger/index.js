
import { BinParser, ColmapImage, Point, Cam, BinExporter } from "../../lib/colmap/colmapbin.js";
import {GPixel} from "../../lib/gpixel/gpixel.js";
import {Vector3, Quaternion} from "../../lib/mathutil.js";

const _pad = (v, n = 2) => {
  return new String(v).padStart(n, '0');
};

const _dtstr = () => {
  let str = Temporal.Now.plainDateTimeISO().toString();
  str = str.replace(/[-:]/g, '');
  str = str.replace(/[T\.]/g, '_');
  return str;
};

/**
 * 
 * @param {ArrayBuffer} ab 
 * @param {number} offset 
 * @param {number} len 
 */
const _clone = (ab, offset, len) => {
  const clone = new Uint8Array(len);
  const src = new Uint8Array(ab);
  for (let i = 0; i < len; ++i) {
    clone[i] = src[offset + i];
  }
  return clone;
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

    /** graphic block */
    this.graphicOffset = 0;
    /** graphic block */
    this.graphicEnd = 0;
    /** delayTime 書き込み先 */
    this.delayOffset = 0;
    /** フレーム画像かどうか */
    this.isFrame = false;

    this.index = -1;

    /** 1/100秒単位。0だとカット扱いとする */
    this.delayTime = 0;
    /** 元ファイルでの値
     */
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

    /** @type {FileSystemDirectoryHandle} フォルダ選択で開く */
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

    /**
     * 現在の作業フォルダ配下の *.bin
     */
    this.curbins = {};
  }

  async initialize() {
    this.setListener();
  }

  /**
   * GUI から値を収集する
   */
  gatherParam() {
    const obj = {};
    // 文字列
    for (const k of ['source', 'destination']) {
      const el = document.getElementById(k);
      obj[k] = el.value;
    }
    // チェックボックス
    for (const k of ['isdel']) {
      const el = document.getElementById(k);
      obj[k] = el?.checked;
    }
    // 数値
    for (const k of ['divnum', 'targetimageid']) {
      const el = document.getElementById(k);
      const val = Number.parseFloat(el?.value);
      if (Number.isFinite(val)) {
        obj[k] = val;
      }
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
   * 未使用
   * フォルダに対して処理する
   * ルートから指定フォルダに重複せずにファイルを作成する
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
   * 不使用
   * フォルダに対して処理する
   * ルートから見た指定フォルダの重複をチェックする
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

    const result = await this.searchDir(dirHandle, param);
    if (!result) {
      console.warn('searchDir failure');
      return;
    }

    await this.miniFiles(result, param);
    console.log('processDir end');
  }

  /**
   * 二段下まで sparse/0/ を探してそこの \*.bin をパースする。
   * 動作する
   * @param {FileSystemDirectoryHandle} dirHandle 
   */
  async parseBins(dirHandle) {
    console.log('parseBins', dirHandle.name);

    let sparseDir = null;

    for await (const [k, v] of dirHandle.entries()) {
      if (v.kind === 'file') {
        continue;
      }
      if (k === 'sparse') {
        sparseDir = v;
        break;
      }

      for await (const [k2, v2] of v.entries()) {
        if (v2.kind === 'file') {
          continue;
        }
        if (k2 === 'sparse') {
          sparseDir = v2;
          break;
        }
      }

      if (sparseDir) {
        break;
      }
    }

    if (!sparseDir) {
      return null;
    }

    let zeroDir = null;

    for await (const [k, v] of sparseDir.entries()) {
      if (v.kind === 'file') {
        continue;
      }
      if (k === '0') {
        zeroDir = v;
        break;        
      }
    }

    if (!zeroDir) {
      return null;
    }

    const ret = {
      zeroDir,
    };
    const parser = new BinParser();

    for await (const [k, v] of zeroDir.entries()) {
      if (v.kind !== 'file') {
        continue;
      }

      const f = await v.getFile();
      const ab = await f.arrayBuffer();

      switch (k) {
      case 'cameras.bin':
        ret.cameras = parser.parseCamera(ab);
        break;
      case 'images.bin':
        ret.images = parser.parseImage(ab);
        break;
      case 'points3D.bin':
        ret.points3D = parser.parsePoint(ab);
        break;
      default:
        console.log('ignore', k);
        break;
      }
    }

    return ret;
  }

  /**
   * 
   * @param {*} dirobj ディレクトリハンドルたち
   * @param {object} param パラメータたち
   */
  async miniFiles(dirobj, param) {
    const divnum = param.divnum || 8;
    /** @type {FileSystemDirectoryHandle} */
    const dstDir = dirobj.imagesDir;

    /**
     * 2回目以降はimg elementを追加しない
     */
    let first = true;
    for await (const [k, v] of dirobj.srcDir.entries()) {
      if (v.kind !== 'file') {
        continue;
      }
      /** @type {File} */
      const f = await v.getFile();
      const srcab = await f.arrayBuffer();

      // 分離して2or0を取得する
      const info = await this.parseJpeg(srcab, first);
      const onejpeg = info.frames[(info.frames.length >= 3) ? 2 : 0].buffer;

      const off = await this.imageBufToOff(onejpeg, divnum, true);

      const dstblob = await off.convertToBlob({type: 'image/jpeg'});

      const name = k.split('.')[0]; // 前方だけ
      const dstFile = await dstDir.getFileHandle(`${name}.jpg`, {create: true});
      const ws = await dstFile.createWritable();
      await ws.write(dstblob);
      await ws.close();

      first = false;
    }
  }

  /**
   * 階層文字列配列を渡して先頭だけ探して再帰する
   * @param {FileSystemDirectoryHandle} startDir 
   * @param {string[]} names 
   * @returns {FileSystemHandle|null}
   */
  async searchFile(startDir, names) {
    if (names.length === 0) {
      return null;
    }
    let ret = null;
    for await (const [k, v] of startDir.entries()) {
      if (v.name === names[0]) {
        ret = v;
        break;
      }
    }

    if (names.length === 1) {
      return ret;
    }
    const next = await this.searchFile(ret, names.slice(1));
    return next;
  }

  /**
   * ハンドルを探す。
   * "./" は長さ0になるので自分自身にはならないので注意
   * @param {FileSystemDirectoryHandle} startDir 
   * @param {string} pathname /で区切ったパス名
   * @returns 
   */
  async searchFileByPath(startDir, pathname) {
    let ret = null;
    const ss = pathname.split('/').filter(s => s !== '' && s !== '.');  
    ret = await this.searchFile(startDir, ss);
    return ret;
  }

  /**
   * 直下に dst/, _foo/, _foodb/ を含むフォルダを指定する。 
   * @param {FileSystemDirectoryHandle} dirHandle 
   * @param {*} param 
   */
  async searchDir(dirHandle, /*param*/) {
    console.log('searchDir', dirHandle);

    /** 複数フレームを含む画像群を格納 @type {FileSystemDirectoryHandle} */
    let srcDir = null;
    /** _foo フォルダ @type {FileSystemDirectoryHandle} */
    let dstDir = null;
    /** _foodb フォルダ @type {FileSystemDirectoryHandle} */
    let srcSubDir = null;
    /** RGB画像だけ取り出した格納 @type {FileSystemDirectoryHandle} */
    let dstSubDir = null;

    /** depth画像群を含むフォルダ @type {FileSystemDirectoryHandle} */
    let depthDir = null;
    /** @type {FileSystemDirectoryHandle} */
    let colmapDir = null;

    for await (const [k, v] of dirHandle.entries()) {
      if (v.kind === 'file') {
        continue;
      }
      if (k === 'org') {
        srcDir = v;
        continue;
      }
      if (k === 'depth') {
        depthDir = v;
        continue;
      }
      if (!k.startsWith('_')) {
        continue;
      }
      if (k.endsWith('db')) {
        srcSubDir = v;
        continue;
      }

      dstDir = v;
      try { // images フォルダを作成する
        dstSubDir = await dstDir.getDirectoryHandle('images', {create: true});
      } catch (e) {
        console.warn('create folder images', e);
      }

      // 掘る
      colmapDir = await this.searchFileByPath(v, 'sparse/0');
    }

    console.log('searchDir end');
    return {
      srcDir,
      srcSubDir,
      dst: dstDir,
      imagesDir: dstSubDir,
      depthDir,
      colmapDir,
    };
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

        await this.oneActWithColmap(file);
        return;

        // TODO: ここ

        this.curfile = file;
        const ab = await file.arrayBuffer();
        const info = await this.parseJpeg(ab, true);
        this.curinfo = info;
        console.log('info', info);
        this.curname = file.name;
        document.title = `${this.curname} - jpegchanger`;
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

    { // ワーキングディレクトリ
      const el = document.getElementById('selectdir');
      el?.addEventListener('click', async () => {
        const dirHandle = await this.openDir();
        this.setContent('#rootview', dirHandle.name);
        this.root = dirHandle;
      });
    }

    {
      const el = document.getElementById('cutdepth');
      el?.addEventListener('click', async () => {
        this.cutDepth(this.root);
      });
    }

    {
      const el = document.getElementById('parsebin');
      el?.addEventListener('click', async () => {
        this.curbins = await this.parseBins(this.root);
      });
    }

    {
      const el = document.getElementById('onewithcolmap');
      el?.addEventListener('click', async () => {
        await this.tempOne();
      });
    }

    {
      const el = document.getElementById('actwithcolmap');
      el?.addEventListener('click', async () => {
        await this.actWithColmap(this.root);
      });
    }

    {
      const el = document.getElementById('openfile');
      el?.addEventListener('click', async () => {
        const opt = {};
        /** @type {FileSystemFileHandle[]} */
        const fhs = await window.showOpenFilePicker(opt);
        const f = await fhs[0].getFile();
        const ab = await f.arrayBuffer();
        await this.parseJpeg(ab, true);
      });
    }
    { // 反映後のダウンロード
      const el = document.getElementById('downloadbut');
      el?.addEventListener('click', async () => {
        await this.downloadJpeg();
      });
    }

    for (const k of ['startcount', 'addcount', 'outcount', 'divnum']) {
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
   * スケールを推測する。比率の平均
   * @param {any[]} images 
   */
  async inferScale(images) {
    const ret = {
      farWide: [], // 50cm超過，デプスfar は2m超過
      farNarrow: [],
      nearWide: [],
      nearNarrow: [], // 50cm未満, デプスfar は2m未満
    };
    for (const image of images) {
      const fx = 1;
      const fy = 1;
      const cx = 1;
      const cy = 1;
      // 特徴点リストのうち，どれかを取り出す
      // 例えば配列の真ん中付近など
      // id から points3D を対応づけて取得する
      {
        // px, py から dx, dy へ変換
        // dx, dy から depth を手に入れる
        const depth = 1;
        const fromdepth = [(px - cx) / fx * depth, (py - cy) / fy * depth, depth];
        // ここではメートル単位
      
        // 3次元points3Dの位置から
        // R, t で変換して incam で [x,y,z] が得られる
        const frompt = [1, 1, 1];
        // これを incam 内で比較すると scale が決まる

        const scales = [
          fromdepth[0] / frompt[0],
          fromdepth[1] / frompt[1],
          fromdepth[2] / frompt[2]];
        const scale = (scales[0] + scales[1] + scales[2]) / 3;

        if (depth >= 0.5) {
          if (far > 2.0) {
            ret.farWide.push(scale);
          } else {
            ret.nearWide.push(scale);
          }
        } else {
          if (far > 2.0) {
            ret.farNarrow.push(scale);
          } else {
            ret.nearNarrow.push(scale);
          }
        }

      }
    }

    const _avg = (vs) => {
      if (vs.length === 0) {
        return 0;
      }
      return vs.reduce((p, c) => p + c, 0) / vs.length;
    };
    ret.farWideAvg = _avg(ret.farWide);
    ret.farNarrowAvg = _avg(ret.farNarrow);
    ret.nearWideAvg = _avg(ret.nearWide);
    ret.nearNarrowAvg = _avg(ret.nearNarrow);
    // 4つ比較してどうなるか
    console.log('inferScale', ret);
  }

  /**
   * colmap の姿勢、画像とパース後xml、を用いて
   * points3D を増やす
   * @param {OffscreenCanvas|HTMLCanvasElement} canvas 色画像
   * @param {OffscreenCanvas|HTMLCanvasElement} depthCanvas 深さ画像
   * @param {any} depthInfo 深さの変換式のための情報
   * @param {Cam} cameraInfo カメラのパラメーター
   * @param {{tailW: number[], t: number[]}} pose colmap の姿勢 
   * @param {number} scale スケール倍率
   */
  async reconOne(canvas, depthCanvas, depthInfo,
    cameraInfo, pose, scale) {
    const ret = {points: []};

    const pw = canvas.width;
    const ph = canvas.height;
    const dw = depthCanvas.width;
    const dh = depthCanvas.height;
    const div = 16;
    const pbw = Math.ceil(pw / div);
    const pbh = Math.ceil(ph / div);
    const dbw = Math.ceil(dw / div);
    const dbh = Math.ceil(dh / div);

    const pc = canvas.getContext('2d');
    const dc = depthCanvas.getContext('2d');

    const pdata = pc.getImageData(0, 0, pw, ph);
    const ddata = dc.getImageData(0, 0, dw, dh);

    /**
     * near, far から深さを算出
     * @param {number} x 0-255 の値
     * @returns 
     */
    const _depth = (x) => {
      const t = x / 255; // [0.0, 1.0]
      const rev = (1 / depthInfo.near) * (1 - t) + (1 / depthInfo.far) * t;
      return 1 / rev;
    };

    let count = 0;
    for (let by = 0; by < div; ++by) {
      for (let bx = 0; bx < div; ++bx) {
        let px = Math.floor((bx + 0.5) * pbw);
        let py = Math.floor((by + 0.5) * pbh);
        /** デプス画像でのX座標 */
        let dx = Math.floor((bx + 0.5) * dbw);
        /** デプス画像でのY座標 */
        let dy = Math.floor((by + 0.5) * dbh);

        const p3d = new Point();
        p3d.id = count;
        count += 1;
        p3d.err = 0.125;
        p3d.tracks = []; // 空

        // 色 0-255
        const poffset = (px + pw * py) * 4;
        p3d.color = [
          pdata[poffset], pdata[poffset + 1], pdata[poffset + 2],
        ];
        // デプス
        const doffset = (dx + dw * dy) * 4;
        const depth = _depth(ddata.data[doffset]) * scale; // 赤成分

        // カメラ座標系での座標
        // TODO: cameraInfo が 色か深さ かで dx,dy ではなく px,py
        const inCam = [
          (dx - cameraInfo.cx) / cameraInfo.fx * depth,
          (dy - cameraInfo.cy) / cameraInfo.fy * depth,
          depth,
        ];

        const vec = Vector3.fromArray(inCam)
          .add(1, Vector3.fromArray(pose.t), -1);
        // 全体座標系へ変換
        // inCam から t を引いて，R^-1 を掛ける
        const q = Quaternion.fromBottomW(...pose.tailW).conjugate();
        const world = q.rot(vec);
        p3d.p = world.asArray();
      }
    }

    ret.nextCount = count;
    return ret;
  }

  /**
   * colmap の結果を使って
   * 奥行きと姿勢から3次元点を追加する
   * @param {FileSystemDirectoryHandle} root 
   */
  async actWithColmap(root) {
    const param = this.gatherParam();

    const ret = {
      points: [],
    };
    for (let i = 0; i < 0; ++i) { // 画像ごと
      // 取得方法はアルゴリズムによって
      // 標準は均等分割
      const pixelImage = 0;
      const depthImage = 0;
      const depthInfo = {};
      const cameraInfo = {};
      const pose = {};
      const scale = 1;

      const result = await this.reconOne(pixelImage,
        depthImage,
        depthInfo,
        cameraInfo,
        pose,
        scale,
      );
      ret.points.push(...result.points);
    }
    return ret;
  }

  /**
   * 1枚のjpegファイルから点の配列を得る
   * @param {File} jpegFile 
   * @param {number[]} tailW  
   * @param {number[]} t
   */
  async oneActWithColmap(jpegFile, tailW, t, startIdOffset = 1) {
    console.log('oneActWithColmap', jpegFile.name);
    const ab = await jpegFile.arrayBuffer();
    // パースする
    const gpixel = new GPixel();
    const info = await gpixel.parseJpeg(ab, false);
    console.log('info', info);
    if (info.frames.length < 6) {
      console.log('6枚存在しない', info.frames.length);
      return null;
    }

    console.log('%cfrom one jpeg', 'color:#ff5555;', info);

    // 画像とデプスとxmlからの情報
    const imageCanvas = await this.imageBufToOff(
      info.frames[2].buffer, 1, false);
    const depthCanvas = await this.imageBufToOff(
      info.frames[4].buffer, 1, false);
    const depthInfo = {};
    const cameraInfo = {};
    const pose = {t, tailW};

    // points を作る
    const result = await this.reconOne(
      imageCanvas, depthCanvas,
      depthInfo, cameraInfo, pose, startIdOffset,
    );
    return result;
  }

  /**
   * 現時点の状態で1枚だけ処理をする
   */
  async tempOne() {
    const currentDirs = await this.searchDir(this.root);

    const re = /^(?<branch>.+)\.(?<ext>[^\.]+)$/;

    /** ここに格納していく @type {Point[]} */
    const pts = [];
    let startIdOffset = 1;
    for (const img of this.curbins.images.images) {
      const m = re.exec(img.name);
      if (!m) {
        continue;
      }
      const name = `${m.groups['branch']}.PORTRAIT.${m.groups['ext']}`;
      const fh = await this.searchFileByPath(
        currentDirs.srcDir, name);
      const file = await fh.getFile();

      const tailW = [img.wtop[1], img.wtop[2], img.wtop[3], img.wtop[0]];
      const result = await this.oneActWithColmap(file,
        tailW, img.t, startIdOffset);
      if (!result) {
        continue;
      }

      startIdOffset = result.nextCount;
      pts.push(...result.points);
      break;
    }

    const exporter = new BinExporter();
    if (false) { // points3D.bin 書き出す。書き出さない
      const chunks = await exporter.makePoint(pts, false);
      this.download(new Blob(chunks), `points3D.bin`);
    }

    { // .ply 書き出す

      const chunks = await exporter.makePly(pts);
      this.download(new Blob(chunks), `a.ply`);
    }
    console.log('tempOne');
  }

  /**
   * 
   * @param {ArrayBuffer} ab
   * @param {number} index 
   */
  async pickJpeg(ab, index) {
    const ret = { bufs: [] };
    {
      const clone = _clone(ab, 0, this.curinfo.headend);
      ret.bufs.push(clone.buffer);
    }
    for (const frame of this.curinfo.frames) {
      if (!frame.isFrame) {
        // NOTE: または animation 無しを作成する
        continue;
      }

      if (frame.index !== index) {
        continue;
      }

      // graphic control block を書き出さない
      const clone = _clone(ab,
        frame.offset, frame.end - frame.offset,
      );
      ret.bufs.push(clone.buffer);
    }
    {
      const b8 = new Uint8Array(1);
      b8[0] = 0x3b;
      ret.bufs.push(b8.buffer);
    }
    return ret;
  }

  /**
   * クローンした各エレメントから値を収集する。gif の名残か
   */
  async gatherUI() {
    console.log('gatherUI');
    const qs = document.querySelectorAll('.oneframe');
    for (const q of qs) {
      const frame = {};
      {
        const index = q.querySelector('.index');
        frame.index = Number.parseFloat(index.textContent);
        if (!Number.isFinite(frame.index)) {
          continue;
        }
      }
      {
        const delayTime = q.querySelector('.delayTime');
        frame.delayTime = Number.parseFloat(delayTime.value);
      }

      const found = this.curinfo.frames.find(f => frame.index === frame.index);
      if (!found) {
        console.warn('not found', frame.index);
        continue;
      }
      found.delayTime = frame.delayTime;
    }
  }

  async makeUI() {
    console.log('makeUI');

    const el = document.getElementById('oneframe');
    const parent = document.getElementById('processingview');
    parent.textContent = '';
    for (const frame of this.curinfo.frames) {
      if (!frame.isFrame) {
        continue;
      }

      const clone = document.importNode(el.content, true);
      for (const k of ['offset', 'end', 'index']) {
        const q = clone.querySelector(`.${k}`);
        if (!q) {
          continue;
        }
        q.textContent = `${frame[k]}`;
      }
      {
        const k = 'enable';
        const q = clone.querySelector(`.${k}`);
        if (q) {
          q.addEventListener('change', async ev => {
            if (!q.checked) {
              return;
            }
            const ab = await this.curfile.arrayBuffer();
            const result = await this.pickJpeg(ab, frame.index);
            const img = document.getElementById('baseimage');
            img.src = URL.createObjectURL(new Blob(result.bufs));
          });
        }
      }
      {
        const k = 'delayTime';
        const q = clone.querySelector(`.${k}`);
        const view = clone.querySelector(`.${k}view`);
        if (q && view) {
          q.value = frame[k];
          const _update = () => {
            view.textContent = `${q.value}`;
          };
          q.addEventListener('input', _update);
          _update();
        }
      }
      parent.appendChild(clone);
    }
  }

  async applyJpeg() {
    console.log('applyJpeg');
    // TODO: UIから収集する

    const ab = await this.curfile.arrayBuffer();
    const result = await this.changeJpeg(ab, this.curinfo);
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

  async downloadJpeg() {
    console.log('downloadJpeg');
    const ab = await this.curfile.arrayBuffer();
    const result = await this.changeJpeg(ab, this.curinfo);
    const re = /(?<front>.+)\.[^\.]+$/;
    const m = re.exec(this.curname);
    let name = `_${_dtstr()}.jpg`;
    if (m) {
      name = m.groups['front'] + name;
    }
    this.download(new Blob(result.bufs), name);
  }

  /**
   * 
   * @param {ArrayBuffer} inab 
   * @param {Object} info 
   * @param {Frame[]} info.frames
   * @returns 
   */
  async changeJpeg(inab, info) {


    const ret = { bufs: [] };

    const b8 = _clone(inab, 0, inab.byteLength);
    const ab = b8.buffer;
    const p = new DataView(ab);

    {
      const clone = _clone(ab, 0, info.headend);
      ret.bufs.push(clone.buffer);
    }

    for (const frame of info.frames) { // 書き換え
      if (!frame.isFrame) {
        const clone = _clone(ab,
          frame.offset, frame.end - frame.offset,
        );
        ret.bufs.push(clone.buffer);
        continue;
      }

      if (frame.delayTime === 0) {
        continue;
      }

      //let offset = frame.delayOffset;
      //p.setUint16(offset, 100, true);

      {
        const clone = _clone(ab,
          frame.graphicOffset, frame.graphicEnd - frame.graphicOffset);
        ret.bufs.push(clone.buffer);
      }
      {
        const clone = _clone(ab,
          frame.offset, frame.end - frame.offset);
        ret.bufs.push(clone.buffer);
      }
    }

    {
      const buf = new Uint8Array(1);
      buf[0] = 0x3b;
      ret.bufs.push(buf);
    }

    return ret;
  }

  /**
   * 0x00 が見つかるまでを探す
   * @param {DataView} p 
   * @param {number} inc 
   */
  searchNullTerm(p, inc) {
    const buf = new Uint8Array(32768);
    let num = 0;
    for (let i = 0; i < 32768; ++i) {
      let u8 = p.getUint8(inc + i);
      buf[i] = u8;
      if (u8 !== 0) {
        continue;
      }
      num = i + 1;
      break;
    }
    const text = new TextDecoder().decode(buf.buffer.slice(0, num - 1));

    return {
      num,
      text,
    }
  }

  /**
   * ファイルバイナリからタグパースする
   * @param {ArrayBuffer} ab 
   * @returns {{tags:any[]}}
   */
  async parseOneJpeg(ab) {
    let info = {
      tags: [],
    };
    const names = {
      0x69: '69',
      0xc0: 'SOF0',
      0xc4: 'DHT',
      0xd8: 'SOI',
      0xd9: 'EOI',
      0xda: 'SOS',
      0xdb: 'DQT',
      0xe0: 'APP0',
      0xe1: 'APP1',
      0xe2: 'APP2',
      0xeb: 'APP11',
    };

    const p = new DataView(ab);
    let c = 0;

    for (; c < ab.byteLength;) {
      let b8 = p.getUint8(c);
      c += 1;
      if (b8 !== 0xff) {
        continue;
      }

      let next = p.getUint8(c);
      c += 1;
      if (next == 0) {
        continue;
      }
      const obj = {
        offset: c - 2,
        next,
        name: names[next],
        hexa: {},
      };
      info.tags.push(obj);

      console.log('', c - 2, (c - 2).toString(16), next.toString(16), obj.name);

      switch (next) {
      case 0xe1:
      case 0xe2:
      case 0xeb:
        {
          // タグは含まずこのサイズフィールドは含む長さ
          let num = p.getUint16(c, false);
          c += 2;
          obj.num = num;

          let localc = c;
          c += num - 2;

          if (next === 0xe1) {
            const result = this.searchNullTerm(p, localc);
            console.log('APP1 text', result);
            localc += result.num;

            if (result.text.includes('xmp')) {
              const hexa = new TextDecoder().decode(ab.slice(localc, localc + 32));
              console.log('hexa', hexa);
              localc += 32;
              
              const fulllen = p.getUint32(localc, false);
              const offset = p.getUint32(localc + 4, false);
              localc += 8;
              console.log('full, offset', fulllen, offset);

              // null-term するのか??? してなかった気がする
              const last = new TextDecoder().decode(ab.slice(localc, c));
              console.log('last text', last);

              obj.hexa[hexa] = last;
            }

          }

        }
        break;
      }

    }

    //console.log('info', info);
    return info;
  }

  /**
   * jpeg パース
   * @param {ArrayBuffer} ab 
   * @param {boolean} addElement 
   */
  async parseJpeg(ab, addElement = true) {
    const byteNum = ab.byteLength;

    let info = await this.parseOneJpeg(ab);

    let frames = [];
    let frame = null;
    for (const tag of info.tags) {
      if (tag.next === 0xd8) {
        frame = {
          tags: [tag],
          hexa: {},
        };
      } else if (tag.next === 0xd9) {
        frame.tags.push(tag);
        frames.push(frame);
        frame = null;
      } else if (frame) {
        frame.tags.push(tag);

        {
          const uuids = Object.keys(tag.hexa);
          if (uuids.length >= 1) {
            for (const uuid of uuids) {
              if (!(uuid in frame.hexa)) {
                frame.hexa[uuid] = '';
              }
              frame.hexa[uuid] += tag.hexa[uuid];
            }
          }
        }
      }
    }

    console.log('frames', frames);


    for (let i = 0; i < frames.length; ++i) {
      const one = frames[i];
      let begin = one.tags[0].offset;
      let end = (i + 1 < frames.length)
        ? frames[i+1].tags[0].offset : byteNum;
      const sub = ab.slice(begin, end);

      one.buffer = sub;

      if (addElement) {
        const img = document.createElement('img');
        img.classList.add('thumb');
        img.src = URL.createObjectURL(new Blob([sub]));
        document.body.appendChild(img);
      }

      {
        const uuids = Object.keys(one.hexa);
        if (uuids.length >= 1) {
          for (const uuid of uuids) {
            const hexa = one.hexa[uuid];
            if (hexa.includes("Adobe XMP Core 5.1.0-jc003")) {
              console.log('jc003', hexa);

              const result = this.parseXML(hexa);
              const obj = result?.depthmap;
              if (obj) {
                window.nearfarview.textContent = `${obj.near} ${obj.far}`;

                if (Array.isArray(obj.focaltable)) {
                  this.dumpFocalTable(obj.focaltable,
                    obj.near, obj.far,
                  );
                }
              }

              const imaging = result?.imagingmodel;
              if (imaging) {
                window.focalview.textContent = `${imaging.focallengthx} ${imaging.focallengthy}`;
                window.whview.textContent = `${imaging.imagewidth} ${imaging.imageheight}`;
              }
            }
          }
        }
      }

    }

    info.frames = frames;

    return info;
  }

  /**
   * 
   * @param {string} text 
   * @returns 
   */
  parseXML(text) {
    const el = document.createElement('div');
    el.innerHTML = text;
    console.log('parseXML el', el);

    const strkeys = [
      'confidenceuri', 'depthuri', 'format',
      'itemsemantic', 'measuretype', 'units',
    ];
    const b64keys = [
      'focaltable', 'distortion',
    ];

    /**
     * 
     * @param {Node} _n 
     */
    const _f = (_n) => {
      console.log('node', _n.tagName, _n.nodeType);
      //if (_n.tagName === 'RDF:DESCRIPTION') {
      if (true) {
        for (const attr of _n.attributes) {
          console.log('attr name', attr.name, attr.localName);
          console.log('attr value', attr.value);
          if (attr.name === 'gcamera:hdrplusmakernote') {
            const _buf = Uint8Array.fromBase64(attr.value);
            console.log('_buf', _buf); // 46781バイトもある
          }
        }
      }

      for (const _n2 of _n.children) {
        _f(_n2);
      }
    };
    _f(el);


    const ret = {};
    for (const sub of ['depthmap', 'imagingmodel', 'gcamera']) {
      const obj = {};
      ret[sub] = obj;

      const el2 = el.getElementsByTagName(`camera:${sub}`);
      const firstcs = el2[0]?.children;

      for (const node of (firstcs || [])) {
        console.log('child', node);
        //console.log('', node.tagName, node.textContent);
        const key = node.tagName.split(':')[1].toLowerCase();
        let val = node.textContent;
        if (b64keys.includes(key)) {
          val = Uint8Array.fromBase64(val);
          if (key === 'focaltable') {
            val = new Float32Array(val.buffer);
            // distance, radius らしいが radius は負で見えていて
            // 負半径は前景ぼかし(distanceがfocusより小さいらしいが大小はおかしい)
          }

        } else if (!(strkeys.includes(key))) {
          val = Number.parseFloat(val);
        }
        obj[key] = val;
      }
    }

    console.log('ret', ret);
    return ret;
  }

  /**
   * 
   * @param {number[]} table 
   * @param {number} near 
   * @param {number} far 
   */
  dumpFocalTable(table, near, far) {
    for (let i = 0; i < 256; ++i) {
      const distance = table[i * 2];
      const rate = i / 255; // i === 0 のとき、near を返す場合
      const invd = (1 / near) * (1 - rate) + (1 / far) * rate;
      console.log('focaltable', i, distance, 1 / invd, table[i * 2 + 1]);
    }
  }

  /**
   * @param {number} x 0.0-1.0
   */
  qtoreal8(x, near, far) {
    if (x <= 0) {
      return near;
    }
    if (x >= 1) {
      return far;
    }
    let val = far * near / (far - x * (far - near));
    return val;
  }

  /**
   * ファイルバイナリからオフキャンバスへ
   * @param {ArrayBuffer} ab ファイルバイト
   * @param {number} indivnum 分割数
   * @param {boolean} samesize 同じサイズに補正する場合
   */
  async imageBufToOff(ab, indivnum, samesize) {
    const bitmap = await window.createImageBitmap(new Blob([ab]));
    let w = bitmap.width;
    let h = bitmap.height;
    if (samesize) { // 6144x8160を基準とする場合
      if (h > w) {
        w = 6144;
        h = 8160;
      } else {
        w = 8160;
        h = 6144;
      }
    }
    w = Math.ceil(w / indivnum);
    h = Math.ceil(h / indivnum);

    const off = new OffscreenCanvas(w, h);
    const c = off.getContext('2d');
    c.drawImage(bitmap,
      0, 0, bitmap.width, bitmap.height,
      0, 0, w, h,
    );

    console.log('ToOff', w, h);
    return off;
  }

  /**
   * @param {FileSystemDirectoryHandle} dirHandle 
   */
  async cutDepth(dirHandle) {
    console.log('cutDepth');
    const param = this.gatherParam();

    const result = await this.searchDir(dirHandle, param);
    if (!result) {
      console.warn('searchDir failure');
      return;
    }

    await this.cutDepth2(result, param);
    console.log('cutDepth');
  }

  /**
   * 
   * @param {*} dirobj ディレクトリハンドルたち
   * @param {object} param パラメータたち
   */
  async cutDepth2(dirobj, param) {
    const divnum = param.divnum || 8;
    /** 出力先 @type {FileSystemDirectoryHandle} */
    const dstDir = dirobj.depthDir;

    /**
     * 2回目以降はimg elementを追加しない
     */
    let first = true;
    for await (const [k, v] of dirobj.srcDir.entries()) {
      if (v.kind !== 'file') {
        continue;
      }
      /** @type {File} */
      const f = await v.getFile();
      const srcab = await f.arrayBuffer();

      // 分離して2or0を取得する
      const info = await this.parseJpeg(srcab, first);
      if (info.frames.length < 5) {
        continue;
      }
      const onejpeg = info.frames[4].buffer;

      const off = await this.imageBufToOff(onejpeg, divnum, true);

      const dstblob = await off.convertToBlob({type: 'image/jpeg'});

      const name = k.split('.')[0]; // 前方だけ
      const dstFile = await dstDir.getFileHandle(`${name}.jpg`, {create: true});
      const ws = await dstFile.createWritable();
      await ws.write(dstblob);
      await ws.close();

      first = false;
    }
  }


  /**
   * ※parseBins() が正しく動いている。二重に書いてしまった;;
   * @param {FileSystemDirectoryHandle} dirHandle 直下に _foodb などを含む
   * @param {{srcDir: FileSystemDirectoryHandle}} dirobj ディレクトリハンドルたち
   * @param {object} param パラメータたち
   */
  async preloadCurrentDir(dirHandle) {
    console.log('preload current dir', dirHandle.name);

    const dirs = await this.searchDir(dirHandle, {});

    const infos = [];
    for (const v of [
      {name: 'cameras.bin', f: 'parseCamera'},
      {name: 'images.bin', f: 'parseImage'},
      {name: 'points3D.bin', f: 'parsePoint'},
    ]) {
      const handle = await this.searchFilePath(dirs.colmapDir, v.name);
      const file = await handle.getFile();
      const ab = await file.arrayBuffer();

      const parser = new BinParser();
      const result = parser[v.f](ab);
      infos.push(result);
    }

    const ret = {
      cameras: infos[0],
      images: infos[1],
      points3D: infos[2],
    };

    console.log('cam, img, pts',
      ret.cameras.length,
      ret.images.length,
      ret.points3D.length,
    );
    return ret;
  }


}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
