

export class Cam {
  /** 0, 3個 f, cx, cy */
  static TYPE_SIMPLE_PINHOLE = 0;
  /** 1, 4個 fx, fy, cx, cy */
  static TYPE_PINHOLE = 0;
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
}

export class Point2D {
  constructor() {
    /** double */
    this.p = [0, 0];
    /** i64 */
    this.id3d = 0;
  }
}

export class Image {
  constructor() {
    /** i32 */
    this.id = 0;
    /** double world to camera */
    this.wtop = [1, 0, 0, 0];
    /** double */
    this.t = [0, 0, 0];
    /** i32 */
    this.cameraid = 0;
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

export class Point {
  constructor() {
    /** u64 */
    this.id = 0;
    /** double */
    this.p = [0, 0, 0];
    /** u8 */
    this.color = [255, 255, 255];
    /** double */
    this.err = 0.5;
    /** @type {Track[]} 個数はu64 */
    this.tracks = [];
  }
}

export class BinParser {
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
      if (buf[i] === 0) {
        text = new TextDecoder().decode(buf.slice(0, i));
        break;
      }
      this.c += 1;
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
   * 
   * @param {ArrayBuffer} ab 
   */
  parseImage(ab) {
    console.log('parseImage');
    const ret = { images: [] };
    const p = new DataView(ab);
    this.c = 0;
    ret.num = this.readu64s(p, 1)[0];
    console.log('num', ret.num);
    for (let i = 0; i < ret.num; ++i) {
      const img = new Image();

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

        if (false) {
          img.point2ds.push(p2);
        }
      }

      ret.images(img);
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
    return ret;
  }

}

