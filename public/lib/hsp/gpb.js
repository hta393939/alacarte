
// LINES 1
// TRIANGLE 4
// COLOR 3, TAN 4, BINORMAL 5, BLENDWEIGHTS 6, BLENDINDICES 7


/**
 * 何回か実装してるからどこかにはありそうだが;;
 * xml から gpb に変換するのとか。
 */

export class Vec3 {
  constructor() {
    this.m = [0, 0, 0];
  }
  asArray() {
    return [...this.m];
  }
  set x(val) {
    this.m[0] = val;
  }
  get x() {
    return this.m[0];
  }
  set y(val) {
    this.m[1] = val;
  }
  get y() {
    return this.m[1];
  }
  set z(val) {
    this.m[2] = val;
  }
  get z() {
    return this.m[2];
  }
}

export class Mat4 {
  constructor() {
    /**
     * 格納は4x4 row major
     */
    this.m = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
  }

  setTranslate(x, y, z) {
    this.m[3] = x;
    this.m[6] = y;
    this.m[9] = z;
    return this;
  }

  asArrayRow() {
    return [...this.m];
  }

  asArrayCol() {
    return [
      this.m[0], this.m[4], this.m[8], this.m[12],
      this.m[1], this.m[5], this.m[9], this.m[13],
      this.m[2], this.m[6], this.m[10], this.m[14],
      this.m[3], this.m[7], this.m[11], this.m[15],
    ];
  }

  mul(v) {
    const r = [...v.m, 1];
    const result = [0, 0, 0, 0];
    for (let i = 0; i < 4; ++i) {
      for (let j = 0; j < 4; ++j) {
        result[i] += this.m[i*4+j] * r[j];
      }
    }
    return new Vec3(result[0], result[1], result[2]);
  }

}

/**
 * ノード
 */
export class GpbNode {
  static TYPE_NODE = 1;
  static TYPE_JOINT = 2;

  constructor() {
    this.name = '';
    this.type = GpbNode.TYPE_NODE;

    /** ファイルでの位置 */
    this._infile = 0;

    /** @type {GpbNode[]} */
    this.children = [];
  }
}

/**
 * シーン
 */
export class GpbScene {
  constructor() {
    /** @type {GpbNode[]} */
    this.children = [];

    this.cameraName = '';
    this.ambient = [0.5, 0.25, 0.125];
  }
}


export class GpbAttribute {
  static TYPE_POSITION = 0;
  static TYPE_NORMAL = 1;
  static TYPE_COLOR = 3;
  static TYPE_TANGENT = 4;
  static TYPE_BINORMAL = 5;
  static TYPE_WEIGHTS = 6;
  static TYPE_JOINTS = 7;
  static TYPE_TEXCOORD0 = 8;

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
  static INDEX8 = 0x1401;
  static INDEX16 = 0x1403;
  /** GL_UNSIGNED_INT */
  static INDEX32 = 0x1405;

  static TRIANGLES = 4;
  static TRIANGLE_STRIP = 5;
  static LINES = 1;
  static LINE_STRIP = 3;
  static POINTS = 0;
  constructor() {
    this.type = GpbPart.TRIANGLES;
    this.indexFormat = GpbPart.INDEX32;
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
  static TYPE_ANIMATIONS = 3;
  static TYPE_ANIMATION = 4;
  static TYPE_MESH = 34;
  static TYPE_FONT = 128;
  constructor() {
    this.name = 'node0';
    this.type = GpbTable.TYPE_NODE;
    this.offset = 0;
    this._infile = 0;
  }
}

export class GpbAnimation {
  static ROTATE_TRANSLATE = 16;
  static SCALE_ROTATE_TRANSLATE = 17;
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
    /** ファイルバイトオフセット */
    this.c = 0;

    this.major = 1;
    this.minor = 5;

    /** @type {GpbTable[]} */
    this.tables = [];
    /** @type {GpbMesh[]} */
    this.meshes = [];
    /** シーン */
    this.scene = new GpbScene();
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
    this.c += 9;

    return ret;
  }

}

export class GpbExport extends Gpb {
  constructor() {
    super();

    /** テーブル順管理用 */
    this.tableOffsetIndex = 0;
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
   * ※ノード
   * @param {DataView} p 
   * @param {GpbNode} node 
   * @returns {void}
   */
  processNode(p, node) {

    // NOTE: テーブルオフセット
    this.tables[this.tableOffsetIndex].offset = this.c;
    this.tableOffsetIndex += 1;


    const cnum = node.children.length;
    this.c += this.write32s(p, this.c, [cnum]);
    for (const child of node.children) {
      this.processNode(p, child);
    }

    // TODO: ノード
  }

  /**
   * 
   * @param {DataView} p 
   * @param {GpbScene} scene 
   * @returns {undefined}
   */
  processScene(p, scene) {

    // NOTE: テーブルオフセット
    this.tables[this.tableOffsetIndex].offset = this.c;
    this.tableOffsetIndex += 1;


    const num = scene.children.length;
    this.c += this.write32s(p, this.c, [num]);
    for (const node of scene.children) {
      this.processNode(p, node);
    }

    this.c += this.writestr(p, this.c, scene.cameraName);
    this.c += this.writefs(p, this.c, scene.ambient);
  }

  /**
   * 
   * @param {DataView} p
   * @param {number} c
   * @param {GpbMesh} m 
   */
  writeMesh(p, c, m) {
    let offset = 0;

    for (const v of m.vts) {
      offset += this.writefs(p, c + offset, v.p);
      offset += this.writefs(p, c + offset, v.n);
      offset += this.writefs(p, c + offset, v.uv);

      offset += this.writefs(p, c + offset, v.weights);
      offset += this.writefs(p, c + offset, v.joints);
      // 属性ごと?
    }

    offset += this.writefs(p, c + offset, m.posmin);
    offset += this.writefs(p, c + offset, m.posmax);
    offset += this.writefs(p, c + offset, m.center);
    offset += this.writefs(p, c + offset, [m.radius]);

    {
      const num = m.parts.length;
      offset += this.write32s(p, c + offset, [num]);
      for (const part of m.parts) {
        offset += this.write32s(p, c + offset, [
          part.type, part.indexFormat, part.indices.length * 4
        ]);
        offset += this.write32s(p, c + offset, part.indices);
      }
    }

    return offset;
  }

  /**
   * 未実装
   * @param {DataView} p 
   * @param {number} c 
   * @param {GpbAnimation} anim 
   */
  writeAnimation(p, c, anim) {
    let offset = 0;
    offset += this.writestr(p, c, anim.name);

    return offset;
  }

  /**
   * API
   * @returns {ArrayBuffer}
   */
  make() {
    this.tableOffsetIndex = 0;
    this.c = 0;
    const buf = new ArrayBuffer(1024 * 1024 + 1024 * 1024);
    const p = new DataView(buf);

    { // ヘッダ
      this.c += this.write8s(p, this.c,
        [0xAB, 0x47, 0x50, 0x42, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A,
          this.major, this.minor]
      );
    }
    { // テーブル
      const num = this.tables.length;
      this.c += this.write32s(p, this.c, [num]);
      for (let i = 0; i < num; ++i) {
        const table = this.tables[i];

        this.c += this.writestr(p, this.c, table.name);
        this.c += this.write32s(p, this.c,
          [table.type, table.offset]);
        table._infile = this.c - 4;
      }
    }
    { // メッシュ
      const num = this.meshes.length;
      this.c += this.write32s(p, this.c, [num]);
      for (let i = 0; i < num; ++i) {
        // NOTE: テーブルオフセット
        this.tables[this.tableOffsetIndex].offset = this.c;
        this.tableOffsetIndex += 1;

        const mesh = this.meshes[i];
        this.c += this.writeMesh(p, this.c, mesh);
      }
    }
    this.c += this.write32s(p, this.c, [2]); // シーンとアニメで2

    this.processScene(p, this.scene);

    { // アニメーション
      // アニメーションズ位置
      // NOTE: テーブルオフセット
      this.tables[this.tableOffsetIndex].offset = this.c;
      this.tableOffsetIndex += 1;

      const num = this.animations.length;
      this.c += this.write32s(p, this.c, [num]);
      for (const anim of this.animations) {
        this.c += this.writeAnimation(p, this.c, anim);
      }
    }

    console.log(`table`, this.tableOffsetIndex, this.tables.length);

    { // 戻って書き込む
      for (const table of this.tables) {
        this.c = table._infile;
        this.write32s(p, this.c, [table.offset]);
      }
    }

    return buf.slice(0, this.c);
  }

  /**
   * .material ファイルを作成する
   * @returns {string}
   */
  makeMaterial() {
    const lines = [];

    {
      lines.push(...[
`material colored {`,
`  u_worldViewProjectMatrix = WORLD_VIEW_PROJECTION_MATRIX`,
`  u_matrixPalette = MATRIX_PALETTE`,
`  renderState {`,
`    cullFace = true`,
`    depthTest = true`,
`    blendSrc = SRC_ALPHA`,
`    blendDst = ONE_MINUS_SRC_ALPHA`,
`  }`,
`  technique {`,
`    pass {`,
`      vertexShader = res/shaders/colored.vert`,
`      fragmentShader = res/shaders/colored.frag`,
`    }`,
`  }`,
`}`,
'',
]);
    }

    {
      lines.push(...[
`material textured {`,
`  u_worldViewProjectMatrix = WORLD_VIEW_PROJECTION_MATRIX`,
`  u_matrixPalette = MATRIX_PALETTE`,
`  sampler u_diffuseTexture {`,
`    mipmap = true`,
`    wrapS = REPEAT`,
`    wrapT = REPEAT`,
`    minFilter = LINEAR_MIPMAP_LINEAR`,
`    magFilter = LINEAR`,
`  }`,
`  renderState {`,
`    cullFace = true`,
`    depthTest = true`,
`    blendSrc = SRC_ALPHA`,
`    blendDst = ONE_MINUS_SRC_ALPHA`,
`  }`,
`  technique {`,
`    pass {`,
`      vertexShader = res/shaders/textured.vert`,
`      fragmentShader = res/shaders/textured.frag`,
`    }`,
`  }`,
`}`,
'',
]);
    }

    {
      lines.push(...[
`material material1: textured {`,
`  u_matrixPalette = MATRIX_PALETTE`,
`  sampler u_diffuseTexture {`,
`    path = res/body_SD.png`,
`    wrapS = REPEAT`,
`    wrapT = REPEAT`,
`  }`,
`  technique {`,
`    pass {`,
`      defines = SKINNING;SKINNING_JOINT_COUNT 12`,
`    }`,
`  }`,
`}`,
'',
]);
    }

    return lines.join('\n');
  }

}

