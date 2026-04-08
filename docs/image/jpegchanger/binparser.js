

export class Cam {
  static TYPE_SIMPLEPINHOLE = 0;
  static TYPE_PINHOLE = 0;
  constructor() {
    /**  */
    this.id = 0;
    this.type = 0;
    /**  */
    this.width = 0;
    /**  */
    this.height = 0;
    /**  */
    this.params = [0, 0, 0, 0];
  }
}

export class Point2D {
  constructor() {
    this.p = [0, 0];
    /**  */
    this.id3d = 0;
  }
}

export class Image {
  constructor() {
    /**  */
    this.id = 0;
    this.wtop = [1, 0, 0, 0];
    this.t = [0, 0, 0];
    /**  */
    this.cameraid = 0;
    this.name = '';

    /** @type {Point2D[]} */
    this.point2ds = [];
  }
}

export class Track {
  constructor() {
    /** 画像のID */
    this.imageid = 0;
    /** その中でのインデックス */
    this.index = 0;
  }
}

export class Point {
  constructor() {
    /**  */
    this.id = 0;
    this.p = [0, 0, 0];
    this.color = [1, 1, 1];
    this.err = 0.5;
    this.tracks = [];
  }
}

export class BinParser {
  constructor() {
  }

  /**
   * 
   * @param {ArrayBuffer} ab 
   */
  parseCamera(ab) {
    const ret = { cameras: [] };
    const p = new DataView(ab);
    let c = 0;
    ret.num = p.getUint32(c, true);
    c += 8;
    for (let i = 0; i < ret.num; ++i) {
      const cam = new Cam();
      ret.cameras.push(cam);
    }
    return ret;
  }

  /**
   * 
   * @param {ArrayBuffer} ab 
   */
  parseImage(ab) {
    const ret = { images: [] };
    const p = new DataView(ab);
    let c = 0;
    ret.num = p.getUint32(c, true);
    c += 8;
    for (let i = 0; i < ret.num; ++i) {
      const img = new Image();
      ret.images(img);
    }
    return ret;
  }

  /**
   * 
   * @param {ArrayBuffer} ab 
   */
  parsePoint(ab) {
    const ret = { points: [] };
    const p = new DataView(ab);
    let c = 0;
    ret.num = p.getUint32(c, true);
    c += 8;
    for (let i = 0; i < ret.num; ++i) {
      const pt = new Point();
      ret.points.push(pt);
    }
    return ret;
  }

}

