
/**
 * 何回か実装してるからどこかにはありそうだが;;
 */

/**
 * ノード
 */
export class GpbNode {
  constructor() {
    this.name = '';

    /** ファイルでの位置 */
    this._infile = 0;

    /** @type {GpbNode[]} */
    this.children = [];
  }
}


export class GpbAttribute {
  static TYPE_POSITION = 0;
  static TYPE_NORMAL = 1;
  static TYPE_TEXCOORD0 = 3;
  static TYPE_WEIGHTS = 10;
  static TYPE_JOINTS = 11;
  constructor() {
    this.type = GpbAttribute.TYPE_POSITION;
    this.num = 3;
  }
}

/**
 * パート
 */
export class GpbPart {
  constructor() {
    /**
     * @type {GpbAttribute[]}
     */
    this.attrs = [];

    this.center = [0, 0, 0];
    this.posmin = [0, 0, 0];
    this.posmax = [0, 0, 0];
    this.radius = 1;
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

export class GpbAnimation {
  constructor() {
    this.channel = '';
  }
}

export class GpbAnimations {
  constructor() {
    this.name = '';

    /** @type {GpbAnimation} */
    this.anim = [];
  }
}

export class Gpb {
  constructor() {
    this.c = 0;

    /** @type {GpbTable[]} */
    this.tables = [];
    /** @type {GpbPart[]} */
    this.parts = [];
    /** @type {GpbNode[]} */
    this.nodes = [];
    /** @type {GpbAnimations[]} */
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
   * @param {number} c 
   * @param {number[]} vs 
   * @returns {number}
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
   * @param {number} c 
   * @param {number[]} vs 
   * @returns {number}
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
   * @param {number} c 
   * @param {number[]} vs 
   * @returns {number}
   */
  writefs(p, c, vs) {
    const num = vs.length;
    for (let i = 0; i < num; ++i) {
      p.setFloat32(c + i * 4, vs[i], true);
    }
    return num * 4;
  }

  /**
   * 
   * @param {GpbNode} node 
   */
  processNode(node) {
    // 
    // 
    for (const c of node.children) {
      this.processNode(c);
    }
    // 
  }

  /**
   * 
   * @param {GpbPart} part 
   */
  writePart(part) {

  }

  writeAnimation(anim) {
  }

  make() {
    this.c = 0;
    const buf = new ArrayBuffer(1024 * 1024);
    const p = new DataView(buf);

    { // ヘッダ
      this.c += this.write8s(p, this.c,
        [0, 0, 0, 0, 1, 5]
      );
    }
    { // テーブル
      const num = this.tables.length;
      for (let i = 0; i < num; ++i) {
        const table = this.tables[i];
        table._infile = this.c;

        this.c += this.write32s(p, this.c,
          [table.type, table.offset]);
        this.c += this.writestr(p, this.c, table.name);
      }
    }
    { // メッシュ
      const num = this.parts.length;
      this.c += this.write32s(p, this.c, [num]);
      for (let i = 0; i < num; ++i) {
        const part = this.parts[i];
        this.writePart(part);
      }
    }
    { // ノード
      this.processNode(this.nodes[0]);
    }
    { // アニメーション
      const num = this.animations.length;
      this.c += this.write32s(p, this.c, [num]);
    }

    return buf.slice(0, this.c);
  }

}

