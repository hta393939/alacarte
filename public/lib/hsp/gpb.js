
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

export class GpbVertex {
  constructor() {
    this.p = [0, 0, 0];
    this.n = [0, 0, 1];
    this.uv = [0.5, 0.5];
    this.weights = [1, 0, 0, 0];
    this.joints = [0, 0, 0, 0];
  }
}

/**
 * 面頂点パーツ
 */
export class GpbPart {
  constructor() {
    this.type = 0;
    this.format = 0;
    /** @type {number[]} */
    this.indices = [];
  }
}

/**
 * 
 */
export class GpbMesh {
  constructor() {
    /**
     * @type {GpbAttribute[]}
     */
    this.attrs = [];

    /**
     * @type {GpbVertex[]}
     */
    this.vts = [];

    this.center = [0, 0, 0];
    this.posmin = [99999, 99999, 99999];
    this.posmax = [-99999, -99999, -99999];
    this.radius = 0;

    /** @type {GpbPart[]} */
    this.parts = [];
  }

  compute() {
    const num = this.vts.length;
    if (num === 0) {
      return;
    }
    for (const v of this.vts) {
      for (let j = 0; j < 3; ++j) {
        const val = v.p[j];
        this.posmax[j] = Math.max(this.posmax[j], val);
        this.posmin[j] = Math.min(this.posmin[j], val);
        this.center[j] += val;
      }
    }
    let sum = 0;
    for (let j = 0; j < 3; ++j) {
      this.center[j] /= num;
      sum += (this.posmax[j] - this.center[j]) ** 2;
    }
    this.radius = Math.sqrt(sum);
  }
}

export class GpbTable {
  static TYPE_SCENE = 1;
  static TYPE_NODE = 2;
  static TYPE_ANIMATION = 4;
  static TYPE_MESH = 34;
  static TYPE_ANIMATIONS = 3;
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
    /** @type {GpbMesh[]} */
    this.meshes = [];
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
   * @param {string} text ascii
   */
  writestr(p, c, text) {
    const buf = new TextEncoder().encode(text);
    const num = buf.byteLength;
    p.setUint32(c, num, true);
    for (let i = 0; i < num; ++i) {
      p.setUint8(c + 4 + i, buf[i]);
    }
    return 4 + num;
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
   * @param {DataView} p
   * @param {number} c
   * @param {GpbMesh} m 
   */
  writeMesh(p, c, m) {
    let offset = 0;

    // 頂点ごと?
    // 属性ごと?

    offset += this.writefs(p, c + offset, m.posmin);
    offset += this.writefs(p, c + offset, m.posmax);
    offset += this.writefs(p, c + offset, m.center);
    offset += this.writefs(p, c + offset, [m.radius]);

    {
      const num = 1;
      offset += this.write32s(p, c + offset, [num]);
      for (let i = 0; i < num; ++i) {
        // TODO: 面頂点
      }
    }

    return offset;
  }

  /**
   * 
   * @param {DataView} p 
   * @param {number} c 
   * @param {GpbAnimation} anim 
   */
  writeAnimation(p, c, anim) {
    let offset = 0;
    offset += this.writestr(p, c, anim.name);

    return offset;
  }

  make() {
    this.c = 0;
    const buf = new ArrayBuffer(1024 * 1024);
    const p = new DataView(buf);

    { // ヘッダ
      this.c += this.write8s(p, this.c,
        [0xAB, 0x47, 0x50, 0x42, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A,  1, 5]
      );
    }
    { // テーブル
      const num = this.tables.length;
      this.c += this.write32s(p, this.c, [num]);
      for (let i = 0; i < num; ++i) {
        const table = this.tables[i];
        table._infile = this.c;

        this.c += this.write32s(p, this.c,
          [table.type, table.offset]);
        this.c += this.writestr(p, this.c, table.name);
      }
    }
    { // メッシュ
      const num = this.meshes.length;
      this.c += this.write32s(p, this.c, [num]);
      for (let i = 0; i < num; ++i) {
        const mesh = this.meshes[i];
        this.c += this.writeMesh(p, this.c, mesh);
      }
    }
    {
      // シーン
      for (const node of this.nodes) { // ノード
        this.processNode(node);
      }
      // TODO: シーン
    }
    { // アニメーション
      const num = this.animations.length;
      this.c += this.write32s(p, this.c, [num]);
      for (const anim of this.animations) {
        this.c += this.writeAnimation(p, this.c, anim);
      }
    }

    return buf.slice(0, this.c);
  }

}

