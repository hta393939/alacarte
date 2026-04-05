
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
    /** RefTable の名称 */
    this._name = '';
    this.nodeType = GpbNode.TYPE_NODE;
    this.matrix = [
      1, 0, 0, 0,
      0, 1, 0, 1,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
    this.parentName = '';

    /** @type {GpbNode[]} */
    this.children = [];

    this.camlight = [0, 0];

    /**
     * モデル名。無効の場合は長さ0
     * 先頭に # がつく．
     */
    this.modelName = '';
    /** スキンを持っているかどうか */
    this.isSkin = 0;

    this.skinMatrix = [1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1];
    /** @type {string[]} */
    this.jointNames = [];
    /** @type {number[][]} */
    this.inverseMatrices = [];


    /** @type {string[]} */
    this.materials = [];

    /** ファイルでの位置 */
    this._infile = 0;
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
  static TYPE_2 = 2;
  static TYPE_COLOR = 3;
  static TYPE_TANGENT = 4;
  static TYPE_BINORMAL = 5;
  /** 6 */
  static TYPE_WEIGHTS = 6;
  /** 7 */
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

  /** 1 線分 */
  static LINES = 1;
  static LINE_STRIP = 3;
  static POINTS = 0;
  /** 4 三角 */
  static TRIANGLES = 4;
  static TRIANGLE_STRIP = 5;

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

/**
 * 未実装
 */
export class GpbAnimChannel {
  constructor() {
    this.keys = [];
    this.values = [];
    this.tangentIn = [];
    this.tangentOut = [];
  }
}

/**
 * アニメーション
 */
export class GpbAnimation {
  /** 7成分 */
  static ROTATE_TRANSLATE = 16;
  /** 10成分 */
  static SCALE_ROTATE_TRANSLATE = 17;
  constructor() {
    this.name = '';
    /** @type {GpbAnimChannel[]} */
    this.channels = [];
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
    /** @type {GpbAnimation[]} */
    this.animations = [];
  }

  /**
   * 実装していない
   * @param {ArrayBuffer} ab 
   */
  parse(ab) {
    const ret = {};
    this.c = 0;
    this.c += 9;

    return ret;
  }

}

/** ファイル生成用クラス */
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
   * 符号無し16bit配列の書き出し。面頂点。
   * @param {DataView} p 
   * @param {number} c 
   * @param {number[]} vs 
   * @returns {number}
   */
  write16s(p, c, vs) {
    const num = vs.length;
    for (let i = 0; i < num; ++i) {
      p.setUint16(c + i * 2, vs[i], true);
    }
    return num * 2;
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
   * row major で格納した matrix を col major で書き出す。
   * 平行移動成分は col major だと 12, 13, 14
   * @param {DataView} p
   * @param {number} c
   * @param {number[]} rm row major な並びの16要素の配列
   */
  writermbycm(p, c, rm) {
    let offset = 0;
    for (let col = 0; col < 4; ++col) {
      for (let row = 0; row < 4; ++row) {
        p.setFloat32(c + offset, rm[row * 4 + col], true);
        offset += 4;
      }
    }
    return offset;
  }

  /**
   * 
   * ※ノード
   * @param {DataView} p 
   * @param {GpbNode} node 
   * @returns {void}
   */
  processNode(p, node) {
    console.log('processNode',
      node._name,
      this.tableOffsetIndex, this.tables);

    // NOTE: テーブルオフセット
    this.tables[this.tableOffsetIndex].offset = this.c;
    this.tableOffsetIndex += 1;


    this.c += this.write32s(p, this.c, [node.nodeType]);
    this.c += this.writermbycm(p, this.c, node.matrix);
    this.c += this.writestr(p, this.c, node.parentName);

    const cnum = node.children.length;
    this.c += this.write32s(p, this.c, [cnum]);
    for (const child of node.children) {
      this.processNode(p, child);
    }

    // カメラとライト
    this.c += this.write8s(p, this.c, node.camlight);

    this.c += this.writestr(p, this.c, node.modelName);
    if (node.modelName.length >= 1) {
      this.c += this.write8s(p, this.c, [node.isSkin]);
      if (node.isSkin) {
        this.c += this.writermbycm(p, this.c, node.skinMatrix);

        const jnum = node.jointNames.length;
        this.c += this.write32s(p, this.c, [jnum]);
        for (const k of node.jointNames) {
          this.c += this.writestr(p, this.c, k);
        }
        /** float 数 */
        const bpnum = node.inverseMatrices.length * 16;
        this.c += this.write32s(p, this.c, [bpnum]);
        for (const m of node.inverseMatrices) {
          this.c += this.writermbycm(p, this.c, m);
        }

      }

      const mnum = node.materials.length;
      this.c += this.write32s(p, this.c, [mnum]);
      for (const k of node.materials) {
        this.c += this.writestr(p, this.c, k);
      }
    }

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

    let valNum = 0;
    { // 属性
      const num = m.attrs.length;
      offset += this.write32s(p, c + offset, [num]);
      for (const attr of m.attrs) {
        offset += this.write32s(p, c + offset, [attr.type, attr.num]);
        valNum += attr.num;
      }
    }
    console.log('valNum', valNum);
    {
      const byteNum = m.vts.length * valNum * 4;
      offset += this.write32s(p, c + offset, [byteNum]);
      for (const v of m.vts) {
        offset += this.writefs(p, c + offset, v.p);
        offset += this.writefs(p, c + offset, v.n);
        offset += this.writefs(p, c + offset, v.uv);

        offset += this.writefs(p, c + offset, v.weights);
        offset += this.writefs(p, c + offset, v.joints);
        // 属性ごと?
      }
    }

    offset += this.writefs(p, c + offset, m.posmin);
    offset += this.writefs(p, c + offset, m.posmax);
    offset += this.writefs(p, c + offset, m.center);
    offset += this.writefs(p, c + offset, [m.radius]);

    {
      const num = m.parts.length;
      offset += this.write32s(p, c + offset, [num]);
      for (const part of m.parts) {
        let indexByte = 4;
        if (part.indexFormat !== GpbPart.INDEX32) {
          indexByte = 2;
        }
        offset += this.write32s(p, c + offset, [
          part.type, part.indexFormat, part.indices.length * indexByte
        ]);
        if (indexByte === 4) {
          offset += this.write32s(p, c + offset, part.indices);
        } else {
          offset += this.write16s(p, c + offset, part.indices);
        }
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

    const fileByte = this.c;

    console.log(`table`, this.tableOffsetIndex, this.tables.length);

    { // 戻って書き込む
      for (const table of this.tables) {
        this.c = table._infile;
        this.write32s(p, this.c, [table.offset]);
      }
    }

    return buf.slice(0, fileByte);
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
`      defines = SKINNING;SKINNING_JOINT_COUNT 2`,
`    }`,
`  }`,
`}`,
'',
]);
    }

    {
      lines.push(...[
`material material2: colored {`,
`  u_matrixPalette = MATRIX_PALETTE`,
`  u_cameraPosition = CAMERA_WORLD_POSITION`,
`  u_inverseTransposeWorldViewMatrix = INVERSE_TRANSPOSE_WORLD_VIEW_MATRIX`,
`  u_ambientColor = 0.5 1.0, 0.25, 1`,
`  u_diffuseColor = 0.25, 0.0, 1.0, 1`,
`  u_specularExponent = 6.31179`,
`  technique {`,
`    pass {`,
`      defines = DIRECTIONAL_LIGHT_COUNT 1;SKINNING;SKINNING_JOINT_COUNT 2;SPECULAR`,
`    }`,
`  }`,
`}`,
'',
]);
    }

    return lines.join('\n');
  }

}

