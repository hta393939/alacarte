
/**
 * 何回か実装してるからどこかにはありそうだが;;
 */

export class GpbPart {
  constructor() {

  }
}

export class GpbTable {
  static TYPE_NODENODE = 1;
  static TYPE_NODEJOINT = 2;
  static TYPE_MESH = 0;
  static TYPE_ANIMATION = 32;
  static TYPE_FONT = 128;
  constructor() {
    this.type = GpbTable.TYPE_NODENODE;
    this.name = 'node0';
    this.offset = 0;
    this._infile = 0;
  }
}


export class Gpb {
  constructor() {
    this.c = 0;

    this.tables = [];
    this.parts = [];
    this.nodes = [];
    this.animations = [];
  }

  /**
   * 
   * @param {ArrayBuffer} ab 
   */
  parse(ab) {
    const ret = {};
    this.c = 0;
    return ret;
  }

}

export class GpbExport extends Gpb {
  constructor() {

  }

  /**
   * 
   * @param {DataView} p 
   * @param {number} c 
   * @param {string} text 
   */
  writestr(p, c, text) {

    return 0;
  }

  /**
   * 
   * @param {DataView} p 
   * @param {*} c 
   * @param {*} vs 
   * @returns 
   */
  write8s(p, c, vs) {
    const num = vs.length;
    for (let i = 0; i < num; ++i) {
      p.setUint8(c + i, vs[i]);
    }
    return num;
  }

  /**
   * 
   * @param {DataView} p 
   * @param {*} c 
   * @param {*} vs 
   * @returns 
   */
  write32s(p, c, vs) {
    const num = vs.length;
    for (let i = 0; i < num; ++i) {
      p.setInt32(c + i * 4, vs[i], true);
    }
    return num * 4;
  }

  /**
   * 
   * @param {DataView} p 
   * @param {*} c 
   * @param {*} vs 
   * @returns 
   */
  writefs(p, c, vs) {
    const num = vs.length;
    for (let i = 0; i < num; ++i) {
      p.setFloat32(c + i * 4, vs[i], true);
    }
    return num * 4;
  }

  make() {
    this.c = 0;
    const buf = new ArrayBuffer(1024 * 1024);
    const p = new DataView(buf);

    { // ヘッダ

    }
    { // テーブル
      const num = this.tables.length;
      for (let i = 0; i < num; ++i) {
        const table = this.tables[i];
        table._infile = this.c;

        
      }
    }
    { // メッシュ

    }
    { // ノード

    }
    { // アニメーション
      
    }

    return buf.slice(0, this.c);
  }

}

