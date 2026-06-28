
/**
 * colmap の一つのカメラ
 */
export class Cam {
  /** 0, 3個 f, cx, cy */
  static TYPE_SIMPLE_PINHOLE = 0;
  /** 1, 4個 fx, fy, cx, cy */
  static TYPE_PINHOLE = 1;
  constructor() {
    /** i32 */
    this.id = 0;
    /** i32 */
    this.type = Cam.TYPE_PINHOLE;
    /** u64 */
    this.width = 0;
    /** u64 */
    this.height = 0;
    /** double */
    this.params = [0, 0, 0, 0];
  }

  get fx() {
    return this.params[0];
  }
  get fy() {
    return this.params[(this.type === Cam.TYPE_PINHOLE) ? 1 : 0];
  }
  get cx() {
    return this.params[(this.type === Cam.TYPE_PINHOLE) ? 2 : 1];
  }
  get cy() {
    return this.params[(this.type === Cam.TYPE_PINHOLE) ? 3 : 2];
  }
}

export class Point2D {
  constructor() {
    /** double */
    this.p = [0, 0];
    /** i64 */
    this.id3d = 0;
  }
}

/**
 * クラス名を変更した
 */
export class ColmapImage {
  constructor() {
    /** i32, イメージID */
    this.id = 0;
    /** double world to camera */
    this.wtop = [1, 0, 0, 0];
    /** double */
    this.t = [0, 0, 0];
    /** i32 */
    this.cameraid = 0;
    /** 拡張子を含むファイル名 */
    this.name = '';

    /** @type {Point2D[]} u64で個数 */
    this.point2ds = [];
  }
}

export class Track {
  constructor() {
    /** 画像のID. i32 */
    this.imageid = 0;
    /** その中でのインデックス．i32 */
    this.index = 0;
  }
}

/**
 * 3次元点。位置と色
 */
export class Point {
  constructor() {
    /** u64 */
    this.id = 0;
    /** double */
    this.p = [0, 0, 0];
    /** u8 */
    this.color = [255, 255, 255];
    /** double @type {number} */
    this.err = 0.5;
    /** @type {Track[]} 個数はu64 */
    this.tracks = [];
  }
}

export class BinParser {
  static CAM_NAME = 'cameras.bin';
  static IMG_NAME = 'images.bin';
  /** ファイル名 */
  static PT_NAME = 'points3D.bin';

  constructor() {
    this.c = 0;
  }

  /**
   * 
   * @param {DataView} p 
   */
  readstr(p) {
    const buf = new Uint8Array(256);
    let text = null;
    for (let i = 0; i < 256; ++i) {
      buf[i] = p.getUint8(this.c);
      this.c += 1;
      if (buf[i] === 0) {
        text = new TextDecoder().decode(buf.slice(0, i));
        break;
      }
    }
    return text;
  }

  /**
   * 
   * @param {DataView} p 
   * @param {number} num 
   * @returns 
   */
  readu8s(p, num) {
    const ret = new Uint8Array(num);
    for (let i = 0; i < num; ++i) {
      ret[i] = p.getUint8(this.c);
      this.c += 1;
    }
    return ret;
  }

  /**
   * 
   * @param {DataView} p 
   * @param {number} num 
   * @returns 
   */
  read32s(p, num) {
    const ret = new Uint32Array(num);
    for (let i = 0; i < num; ++i) {
      ret[i] = p.getUint32(this.c, true);
      this.c += 4;
    }
    return ret;
  }

  /**
   * u64の幅を読み進むが32bitだけ格納する。
   * ffが8バイトのときは-1を格納する。
   * @param {DataView} p 
   * @param {number} num 
   */
  readu64s(p, num) {
    const ret = new Array(num);
    for (let i = 0; i < num; ++i) {
      ret[i] = p.getUint32(this.c, true);
      const hi = p.getUint32(this.c + 4, true);
      if (hi === 0xffffffff && ret[i] === 0xffffffff) {
        ret[i] = -1;
      }
      this.c += 8;
    }
    return ret;
  }

  /**
   * float64
   * @param {DataView} p 
   * @param {number} num
   */
  readds(p, num) {
    const ret = new Float64Array(num);
    for (let i = 0; i < num; ++i) {
      ret[i] = p.getFloat64(this.c, true);
      this.c += 8;
    }
    return ret;
  }

  /**
   * 
   * @param {ArrayBuffer} ab 
   */
  parseCamera(ab) {
    const ret = { cameras: [] };
    const p = new DataView(ab);
    this.c = 0;
    ret.num = this.readu64s(p, 1)[0];
    for (let i = 0; i < ret.num; ++i) {
      const cam = new Cam();
      cam.id = this.read32s(p, 1)[0];
      cam.type = this.read32s(p, 1)[0];
      cam.width = this.readu64s(p, 1)[0];
      cam.height = this.readu64s(p, 1)[0];

      let len = (cam.type === Cam.TYPE_SIMPLE_PINHOLE) ? 3 : 4;
      cam.params = this.readds(p, len);

      ret.cameras.push(cam);

      console.log('cam', cam);
    }
    console.log('parseCamera', this.c, ab.byteLength);
    return ret;
  }

  /**
   * images.bin をパースする
   * @param {ArrayBuffer} ab 
   * @param {boolean} use2d
   */
  parseImage(ab, use2d = false) {
    console.log('parseImage', use2d);
    const ret = { images: [] };
    const p = new DataView(ab);
    this.c = 0;
    ret.num = this.readu64s(p, 1)[0];
    console.log('num', ret.num);
    for (let i = 0; i < ret.num; ++i) {
      const img = new ColmapImage();

      img.id = this.read32s(p, 1)[0];
      img.wtop = this.readds(p, 4);
      img.t = this.readds(p, 3);
      img.cameraid = this.read32s(p, 1)[0];
      img.name = this.readstr(p);
      const len = this.readu64s(p, 1)[0];
      for (let j = 0; j < len; ++j) {
        const p2 = new Point2D();
        p2.p = this.readds(p, 2);
        p2.id3d = this.readu64s(p, 1)[0];

        if (use2d) {
          img.point2ds.push(p2);
        }
      }

      ret.images.push(img);
    }
    console.log('parseImage', this.c, ab.byteLength);
    return ret;
  }

  /**
   * 
   * @param {ArrayBuffer} ab 
   */
  parsePoint(ab) {
    const ret = { points: [] };
    const p = new DataView(ab);
    this.c = 0;
    ret.num = this.readu64s(p, 1)[0];
    for (let i = 0; i < ret.num; ++i) {
      const pt = new Point();
      pt.id = this.readu64s(p, 1)[0];
      pt.p = this.readds(p, 3);
      pt.color = this.readu8s(p, 3);
      pt.err = this.readds(p, 1)[0];
      const len = this.readu64s(p, 1)[0];
      for (let j = 0; j < len; ++j) {
        const track = new Track();
        track.imageid = this.read32s(p, 1)[0];
        track.index = this.read32s(p, 1)[0];
        if (false) {
          pt.tracks.push(track);
        }
      }

      ret.points.push(pt);
    }
    console.log('parsePoint', this.c, ab.byteLength);
    return ret;
  }

}

export class BinExporter extends BinParser {
  constructor() {
    super();
  }

  /**
   * 
   * @param {DataView} p 
   * @param {number} c 
   * @param {number[]} vals 
   */
  writeu8s(p, c, vals) {
    let offset = 0;
    for (const val of vals) {
      p.setUint8(c + offset, val);
      offset += 1;
    }
    return offset;
  }

  /**
   * 
   * @param {DataView} p 
   * @param {number} c 
   * @param {numbers} vals 
   */
  write32s(p, c, vals) {
    let offset = 0;
    for (const val of vals) {
      p.setUint32(c + offset, val, true);
      offset += 4;
    }
    return offset;
  }

  /**
   * 
   * @param {DataView} p 
   * @param {number} c 
   * @param {number[]} vals 
   * @returns 
   */
  writeu64s(p, c, vals) {
    let offset = 0;
    for (let i = 0; i < vals.length; ++i) {
      const val = vals[i];
      if (val !== -1) {
        p.setUint32(c + offset, val, true);
      } else {
        p.setUint32(c + offset, 0xffffff, true);
        p.setUint32(c + offset + 4, 0xffffffff, true);
      }
      offset += 8;
    }
    return offset;
  }

  /**
   * float64 配列
   * @param {DataView} p 
   * @param {number} c 
   * @param {number[]} vals 
   * @returns 
   */
  writeds(p, c, vals) {
    let offset = 0;
    for (const val of vals) {
      p.setFloat64(c + offset, val, true);
      offset += 8;
    }
    return offset;  
  }


  /**
   * 未確認
   * @param {Cam[]} cams 
   */
  makeCamera(cams) {
    const chunks = [];

    let num = cams.length;
    {
      const buf = new Uint32Array(2);
      buf[0] = num;
      chunks.push(buf);
    }

    for (let i = 0; i < num; ++i) {
      const cam = cams[i];
      const len = cam.params.length;
      const ab = new ArrayBuffer(24 + len * 8);
      const p = new DataView(ab);
      let c = 0;
      c += this.write32s(p, c, [cam.id, cam.type]);
      c += this.writeu64s(p, c, [cam.width, cam.height]);
      c += this.writeu64s(p, c, cam.params);

      chunks.push(ab.slice(0, c));
    }

    return chunks;
  }

  /**
   * 未実装
   * @param {ColmapImage[]} imgs 
   * @param {boolean} use2d 
   */
  makeImage(imgs, use2d = false) {
    const chunks = [];

    let num = imgs.length;
    {
      const buf = new Uint32Array(2);
      buf[0] = num;
      chunks.push(buf);
    }

    for (let i = 0; i < num; ++i) {
      const img = imgs[i];
      const len = use2d ? img.point2ds.length : 0;
      const ab = new ArrayBuffer(0 + len * 0);
      let c = 0;

      chunks.push(ab);
    }

    return chunks;
  }

  /**
   * points3D.bin バイナリを作成する
   * @param {Point[]} pts 
   * @returns {object[]} チャンク配列
   */
  makePoint(pts, usetrack = false) {
    const chunks = [];

    let num = pts.length;
    {
      const buf = new Uint32Array(2);
      buf[0] = num;
      chunks.push(buf);
    }

    for (let i = 0; i < num; ++i) {
      const pt = pts[i];
      let len = usetrack ? pt.tracks.length : 0;
      const ab = new ArrayBuffer(64 + len * 8);
      const p = new DataView(ab);
      let c = 0;
      c += this.writeu64s(p, c, [pt.id]);
      c += this.writeds(p, c, pt.p);
      c += this.writeu8s(p, c, pt.color);
      c += this.writeds(p, c, [pt.err]);
      c += this.writeu64s(p, c, [len]);
      for (let j = 0; j < len; ++j) {
        const track = pt.tracks[j];
        c += this.write32s(p, c, [track.imageid, track.index]);
      }
      chunks.push(ab.slice(0, c));
    }
    return chunks;
  }

  /**
   * points3D から .ply を作成する
   * @param {Point[]} pts 
   * @returns {any[]} チャンク配列
   */
  async makePly(pts) {
    const bufs = [];
    const num = pts.length;
    {
      const lines = [
        `ply`,
        `format binary_little_endian 1.0`,
        `element vertex ${num}`,
        `property float x`,
        `property float y`,
        `property float z`,
        `property uchar red`,
        `property uchar green`,
        `property uchar blue`,
        `end_header`,
        '',
      ];
      bufs.push(lines.join('\n'));
    }
    // バイナリ部
    const pbuf = new ArrayBuffer(num * 15);
    const p = new DataView(pbuf);
    let offset = 0;
    for (let i = 0; i < num; ++i) {
      const pt = pts[i];
      p.setFloat32(offset, pt.p[0], true);
      p.setFloat32(offset+4, pt.p[1], true);
      p.setFloat32(offset+8, pt.p[2], true);
      offset += 12;
      p.setUint8(offset, pt.color[0]);
      p.setUint8(offset+1, pt.color[1]);
      p.setUint8(offset+2, pt.color[2]);
      offset += 3;
    }
    bufs.push(pbuf);
    return bufs;
  }

}

