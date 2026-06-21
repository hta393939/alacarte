
/**
 * jpeg タグ1つ
 */
class Tag {
  constructor() {
    /** 全体での開始位置 @type {number} */
    this.offset = 0;
    /** @type {number} */
    this.next = 0;
    /** "APP0" など @type {string} */
    this.name = '';
    /** @type {Object<string, string>} */
    this.hexa = {};
  }
}


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

/**
 * jpeg ファイルの解析クラス
 */
export class GPixel {
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
   * 二段下まで sparse/0/ を探してそこの \*.bin をパースする
   * @param {FileSystemDirectoryHandle} dirHandle 
   */
  async parseBins(dirHandle) {
    console.log('parseBins');

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
      case 'points3d.bin':
        ret.points3d = parser.parsePoint(ab);
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
   * 直下に dst/, _foo/, _foodb/ を含むフォルダを指定する。 
   * @param {FileSystemDirectoryHandle} dirHandle 
   * @param {*} param 
   */
  async searchDir(dirHandle, param) {
    console.log('searchDir', dirHandle);

    /** @type {FileSystemDirectoryHandle} */
    let srcDir = null;
    /** @type {FileSystemDirectoryHandle} */
    let dstDir = null;
    /** @type {FileSystemDirectoryHandle} */
    let srcSubDir = null;
    /** @type {FileSystemDirectoryHandle} */
    let dstSubDir = null;

    /** @type {FileSystemDirectoryHandle} */
    let depthDir = null;

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
        console.warn('create', e);
      }
    }

    console.log('searchDir end');
    return {
      srcDir,
      srcSubDir,
      dst: dstDir,
      imagesDir: dstSubDir,
      depthDir,
    };
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

  /**
   * 先に this.curinfo にパース結果が格納されていること
   * @param {ArrayBuffer} ab
   * @param {number} index 
   * @returns {{bufs: ArrayBuffer[]}} 
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
   * 最後に id candimage の src に格納する
   */
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
   * delayTime === 0 だと continue
   * @param {ArrayBuffer} inab 
   * @param {Object} info 
   * @param {Frame[]} info.frames パース後情報
   * @returns {{ArrayBuffer[]}}
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
   * 0x00 が見つかるまでを探す。ただし32768バイトまで。
   * @param {DataView} p 
   * @param {number} inc 
   * @returns {{num: number, text: string}} null含めたバイト数とテキスト
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
   * @returns {{tags: Tag[]}}
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
   * @returns {Object<string, any>}
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

}

