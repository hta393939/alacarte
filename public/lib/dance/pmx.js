/**
 * @file pmx.js
 */
// 2024-05-06

(function(_global) {

class Vertex {
/**
 * BDEF1
 * @default 0
 */
  static DEFORM_BDEF1 = 0;
/**
 * BDEF2
 * @default 1
 */
  static DEFORM_BDEF2 = 1;
/**
 * 4参照
 * @default 2
 */
  static DEFORM_BDEF4 = 2;
/**
 * spherical deform
 * @default 3
 */
  static DEFORM_SDEF = 3;
/**
 * quaternion deform
 * @default 4
 */
  static DEFORM_QDEF = 4;

/**
 * 共用のトゥーン
 * 1
 */
  static TOONTYPE_SHARE = 1;
/**
 * テクスチャでトゥーン
 * 0
 */
  static TOONTYPE_TEXTURE = 0;

  constructor() {
/**
 * インデックス
 */
    this._index = 0;

    this.p = [0, 0,  0];
    this.n = [0, 0, -1];
/**
 * V成分は上から下が 0.0～1.0
 */
    this.uv = [0.5, 0.5];

    this.deformType = Vertex.DEFORM_BDEF2;
    this.weights = [1, 0, 0, 0];
    this.joints  = [0, 1, 0, 0];

/**
 * ボーン名
 */
    this._boneName = ['', '', '', ''];
/**
 * エッジ倍率
 */
    this.edgeRate = 1.0;

    this.c  = [0, 0, 0];
    this.r0 = [0, 0, 0];
    this.r1 = [0, 0, 0];
  }

  toCSV() {
    const ss = [
      'PmxVertex',
      this._index,
      ...this.p,
      ...this.n,
      this.edgeRate,
      ...this.uv,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      this.deformType,
      `"${this._boneName[0]}"`,
      this.weights[0],
      `"${this._boneName[1]}"`,
      this.weights[1],
      `"${this._boneName[2]}"`,
      this.weights[2],
      `"${this._boneName[3]}"`,
      this.weights[3],
      ...this.c,
      ...this.r0,
      ...this.r1,
    ];
    return ss.join(',');
  }
}

class IKLink {
  constructor() {
/**
 * リンクボーンのボーンインデックス
 */
    this.linkBone = -1;
/**
 * 角度制限 0: OFF, 1: ON
 */
    this.isLimitation = 0;
/**
 * 下限ラジアン
 */
    this.lower = [0, 0, 0];
/**
 * 上限ラジアン
 */
    this.upper = [0, 0, 0];
  }
}

class Bone {
/**
 * 接続先、bone で指定
 */
  static BIT_BONECONNECT = 0x0001;
/**
 * 回転可能
 */
  static BIT_ROT = 0x0002;
/**
 * 移動可能
 */
  static BIT_MOVE = 0x0004;
/**
 * 表示
 */
  static BIT_VISIBLE = 0x0008;
/**
 * 操作可
 */
  static BIT_CONTROL = 0x0010;
/**
 * IK
 */
  static BIT_IK = 0x0020;

/**
 * 回転付与
 */
  static BIT_ROTAPPLY = 0x0100;
/**
 * 移動付与
 */
  static BIT_MOVEAPPLY = 0x0200;

  static BIT_LOCALAPPLY = Bone.BIT_ROTAPPLY | Bone.BIT_MOVEAPPLY;

/**
 * 軸固定
 */
  static BIT_FIXAXIS = 0x0400;
/**
 * ローカル軸
 */
  static BIT_LOCALAXIS = 0x0800;
/**
 * 物理演算の後
 */
  static BIT_AFTERPHY = 0x1000;
/**
 * 外部親
 */
  static BIT_EXTERNALPARENT = 0x2000;

  constructor() {
    this.nameJa = 'boon000';
    this.nameEn = 'bone000';
/**
 * ボーン 16bit 値
 */
    this.bits = 0;
/**
 * 位置
 */
    this.p = [0, 0, 0];
/**
 * 親ボーンインデックス
 * @default -1
 */
    this.parent = -1;

    this._parentName = '';
/**
 * 変形階層
 * @default 0
 */
    this.layer = 0;

    this._endBoneName = '';
/**
 * 座標オフセット(接続先: 0)
 */
    this.endOffset = [0, 0, 1];
/**
 * (接続先: 1) のときのボーンインデックス
 */
    this.endBoneIndex = -1;

/**
 * 付与親ボーン
 */
    this.applyParent = -1;
/**
 * 付与親ボーン名
 */
    this._applyParentName = '';
/**
 * 付与率
 * @type {number}
 * @default 0
 */
    this.applyRate = 0;
/**
 * 軸固定: 1 の場合の軸の方向ベクトル
 */
    this.axisVector = [0, 0, 1];
/**
 * ローカル軸: 1 の場合
 */
    this.xLocalVector = [1, 0, 0];
/**
 * ローカル軸: 1 の場合
 */
    this.zLocalVector = [0, 0, 1];
/**
 * 外部親変形: 1 の場合の key値
 */
    this.externalParentKey = -1;

    this.ikTargetBone = -1;
/**
 * IKターゲット名
 */
    this._ikTargetBoneName = '';

    this.ikLoopCount = 255;
/**
 * ラジアン値
 */
    this.ikLimitation = 0;
/**
 * @type {IKLink[]}
 */
    this.ikLinks = [];
  }

  toCSV() {
    const ss = [
      'PmxBone',
      `"${this.nameJa}"`,
      `"${this.nameEn}"`,
      this.layer,
      (this.bits & Bone.BIT_AFTERPHY) ? 1 : 0,
      ...this.p,
      (this.bits & Bone.BIT_ROT) ? 1 : 0,
      (this.bits & Bone.BIT_MOVE) ? 1 : 0,
      (this.bits & Bone.BIT_IK) ? 1 : 0,
      (this.bits & Bone.BIT_VISIBLE) ? 1 : 0,
      (this.bits & Bone.BIT_CONTROL) ? 1 : 0,
      `"${this._parentName}"`, // 親ボーン名
      (this.bits & Bone.BIT_BONECONNECT) ? 1 : 0, // 接続先
      `"${this._endBoneName}"`,
      ...this.endOffset,
      (this.bits & Bone.BIT_ROTAPPLY) ? 1 : 0,
      (this.bits & Bone.BIT_MOVEAPPLY) ? 1 : 0,
      this.applyRate,
      `"${this._applyParentName}"`, // 付与親名
      (this.bits & Bone.BIT_FIXAXIS) ? 1 : 0, // 軸制限
      ...this.axisVector,
      (this.bits & Bone.BIT_LOCALAXIS) ? 1 : 0,
      ...this.xLocalVector,
      ...this.zLocalVector,
      (this.bits & Bone.BIT_EXTERNALPARENT) ? 1 : 0,
      `"${this.externalParentKey}"`,
      `"${this._ikTargetBoneName}"`, // IKTarget名
      this.ikLoopCount,
      this.ikLimitation * 180 / Math.PI, // deg
    ];
    return ss.join(',');
  }
}

/**
 * 1面分
 */
class Face {
  constructor() {
    this._index = 0;
    this._materialName = '';
/**
 * 3頂点のインデックス
 */
    this.indices = [0, 0, 0];
  }
  toCSV() {
    const ss = [
      'PmxFace',
      `"${this._materialName}"`,
      this._index,
      ...this.indices,
    ];
    return ss.join(',');
  }
}

/**
 * 材質。面の管理どうしよう...
 */
class Material {
/**
 * 両面
 */
  static BIT_DOUBLE = 0x01;
/**
 * 地面影
 */
  static BIT_GROUND = 0x02;
/**
 * セルフシャドウマップへの描画
 */
  static BIT_TOMAP = 0x04;
/**
 * セルフシャドウ
 */
  static BIT_SELFSHADOW = 0x08;
/**
 * エッジ有効
 */
  static BIT_EDGE = 0x10;

  constructor() {
    this.nameJa = 'm000';
    this.nameEn = 'mtl000';
/**
 * rgba
 */
    this.diffuse = [1, 1, 1, 1];
    this.specPower = 5;
    this.specular = [0.5, 0.5, 0.5];
    this.ambient = [0.2, 0.2, 0.2];
/**
 * 材質ビットフラッグ 8bit
 */
    this.bitFlag = 0;
/**
 * rgba
 */
    this.edgeColor = [1, 1, 1, 1];
/**
 * エッジサイズ
 */
    this.edgeSize = 1;
/**
 * テクスチャインデックス
 */
    this.texIndex = 0;
/**
 * スフィアテクスチャインデックス
 */
    this.sphereIndex = -1;
/**
 * 0: 無効、1: 乗算、2: 加算、3: サブテクスチャ
 */
    this.sphereMode = 0;

    this.memo = 'メモ';
/**
 * この材質の面の全頂点数。3の倍数であること。
 */
    this._faceIndexNum = 0;
/**
 * 面配列
 * @type {number[][]}
 */
    this.faces = [];
  }

/**
 * 未実装
 * @returns {string}
 */
  toCSV() {
    const ss = [
      'PmxMaterial',
      `"${this.nameJa}"`,
      `"${this.nameEn}"`,
      ...this.diffuse,
      ...this.specular,
      ...this.specPower,
      ...this.ambient,
      (this.bitFlag & Material.BIT_DOUBLE) ? 1 : 0,
      (this.bitFlag & Material.BIT_GROUND) ? 1 : 0,
      (this.bitFlag & Material.BIT_TOMAP) ? 1 : 0,
      (this.bitFlag & Material.BIT_SELFSHADOW) ? 1 : 0,
      0, //(this.bitFlag & Material.BIT_VERTEXCOLOR) ? 1 : 0, // 頂点色
      0, // 描画 0: Tri, 1: Point, 2: Line
      (this.bitFlag & Material.BIT_EDGE) ? 1 : 0,
      this.edgeSize,
      ...this.edgeColor,
      `"${''}"`, //this.texIndex,
      `"${''}"`, //this.sphereIndex,
      this.sphereMode,
      `"${''}"`, // this.sharetoonindex,
      `"${this.memo}"`
    ];
    return ss.join(',');
  }
}



/**
 * 材質モーフ1要素分
 */
class MaterialMorph {
/**
 * 積
 */
  static CALC_MUL = 0;
/**
 * 和
 */
  static CALC_ADD = 1;
  constructor() {
    this._index = 0;
    this._parentName = 'morph000';
    this._materialName = 'mtl000';
/**
 * -1 だと全材質らしい
 */
    this.materialIndex = -1;
    this.calcType = MaterialMorph.CALC_MUL;
/**
 * RGBA
 */
    this.diffuse = [0, 0, 0, 0];
/**
 * no A
 */
    this.specular = [0, 0, 0];
    this.power = 0;
/**
 * no A
 */
    this.ambient = [0, 0, 0];
    this.edgeSize = 0;
/**
 * RGBA
 */
    this.edge = [0, 0, 0, 0];
    this.tex = [0, 0, 0, 0];
    this.sphere = [0, 0, 0, 0];
    this.toon = [0, 0, 0, 0];
  }

/**
 * 
 * @param {number} val 0(add default) or 1(mul default) 
 */
  setValue(val) {
    this.diffuse = [val, val, val, val];
    this.specular = [val, val, val];
    this.power = val;
    this.ambient = [val, val, val];
    this.edgeSize = val;
    this.edge = [val, val, val, val];
    this.tex = [val, val, val, val];
    this.sphere = [val, val, val, val];
    this.toon = [val, val, val, val];
  }

  toCSV() {
    const ss = [
      'PmxMaterialMorph',
      `${this._parentName}`, // 空??
      this._index, // 空??
      `${this._materialName}`,
      this.calcType,

      ...this.diffuse,
      ...this.specular,
      this.power,
      ...this.ambient,
      this.edgeSize,
      ...this.edge,
      ...this.tex,
      ...this.sphere,
      ...this.toon,
    ];
    return ss.join(',');
  }
}

/**
 * 頂点モーフ1要素
 */
class VertexMorph {
  constructor() {
    this._parentName = '';
    this._index = 0;
/**
 * 頂点インデックス
 */
    this.target = 0;
/**
 * 座標オフセット
 */
    this.offset = [0, 0, 0];
  }
/**
 * 1行返す
 * @returns {string}
 */
  toCSV() {
    const ss = [
      'PmxVertexMorph',
      `"${this._parentName}"`,
      this._index,
      this.target,
      ...this.offset,
    ];
    return ss.join(',');
  }
}

/**
 * モーフ
 */
class Morph {
  static PANEL_SYSTEM = 0;
/**
 * まゆげ
 */
  static PANEL_B = 1;
  static PANEL_EYE = 2;
  static PANEL_MOUTH = 3;
  static PANEL_ETC = 4;

  static TYPE_GROUP = 0;
  static TYPE_VERTEX = 1;
  static TYPE_BONE = 2;
  static TYPE_UV = 3;
  static TYPE_UV1 = 4;
  static TYPE_UV2 = 5;
  static TYPE_UV3 = 6;
  static TYPE_UV4 = 7;
/**
 * 材質モーフ
 */
  static TYPE_MATERIAL = 8;
  constructor() {
    this._index = 0;
    this.nameJa = 'moruhu000';
    this.nameEn = 'morph000';

    this.panel = Morph.PANEL_ETC;
    this.type = Morph.TYPE_VERTEX;

    this.ones = [];


    this.groupMorphs = [];

/**
 * @type {VertexMorph[]}
 */
    this.vertexMorphs = [];

    this.boneMorphs = [];

    this.uvMorphs = [];
/**
 * @type {MaterialMorph[]}
 */
    this.materialMorphs = [];
  }

/**
 * 1行だけ返す
 * @returns 
 */
  toCSV() {
    const ss = [
      'PmxMorph',
      `"${this.nameJa}"`,
      `"${this.nameEn}"`,
      this.panel,
      this.type,
    ];
    return ss.join(',');
  }

/**
 * 複数行で返す
 * @returns {string[]}
 */
  toLines() {
    const ss = [
      'PmxMorph',
      `"${this.nameJa}"`,
      `"${this.nameEn}"`,
      this.panel,
      this.type,
    ];
    const lines = [
      ss.join(','),
    ];
    for (const gm of this.groupMorphs) {
      lines.push(gm.toCSV());
    }
    for (const vm of this.vertexMorphs) {
      lines.push(vm.toCSV());
    }
    for (const bm of this.boneMorphs) {
      lines.push(bm.toCSV());
    }
    return lines;
  }
}


class Frame {
  constructor() {
    this._index = 0;
/**
 * 日本語名
 */
    this.nameJa = 'f000';
/**
 * 英語名
 */
    this.nameEn = 'frame000';
/**
 * 0: 通常, 1: 特殊
 */
    this.specialFlag = 0;
/**
 * ボーンのインデックスの配列
 * @type {number[]}
 */
    this.bones = [];
/**
 * モーフのインデックスの配列
 * @type {number[]}
 */
    this.morphs = [];
  }

  toCSV() {
    console.warn('not implemented');
  }
}


/**
 * フレームの中のアイテム
 */
class NodeItem {
/**
 * ボーン
 */
  static TYPE_BONE = 0;
/**
 * 表情
 */
  static TYPE_EXPRESSION = 1;
  constructor() {
    this._parentName = 'node000';
    this.type = NodeItem.TYPE_BONE;
    this._itemName = 'bone000';
  }
  toCSV() {
    const ss = [
      'PmxNodeItem',
      `"${this._parentName}"`,
      this.type,
      `"${this._itemName}"`
    ];
    return ss.join(',');
  }
}

/**
 * フレーム
 */
class PMXNode {
  constructor() {
    this.nameJa = 'node000';
    this.nameEn = 'node000';
  }
  toCSV() {
    const ss = [
      'PmxNode',
      `"${this.nameJa}"`,
      `"${this.nameEn}"`
    ];
    return ss.join(',');
  }
}


/**
 * 物理剛体
 */
class Rigid {
  static SHAPE_SPHERE = 0;
  static SHAPE_BOX = 1;
  static SHAPE_CAPSULE = 2;
/**
 * ボーンの位置にセットされる
 */
  static TYPE_STATIC = 0;
/**
 * この物理でボーンを移動する
 */
  static TYPE_DYNAMIC = 1;
/**
 * この物理が移動してボーンを位置合わせする
 */
  static TYPE_DYNAMIC_POS = 2;

  constructor() {
    this.nameJa = '剛体000';
    this.nameEn = 'rigid000';
/**
 * -1 は関連ボーン無し
 */
    this.bone = -1;
/**
 * 関連ボーン名。ボーン名
 */
    this._boneName = '';
/**
 * 所属グループ #0～#15
 */
    this.group = 0;
/**
 * 衝突するグループのフラグ。衝突する側でよい。GUI のチェックとは逆。
 * 上のビットが#15で下のビットが#0
 */
    this.groupFlags = 0x7fff;

    this.shape = Rigid.SHAPE_BOX;
/**
 * サイズ
 * 球の場合、半径
 * カプセルの場合、半径、内高さ、不使用
 * 箱の場合、
 */
    this.size = [1, 1, 1];
/**
 * 位置
 */
    this.p = [0, 0, 0];
/**
 * 回転
 */
    this.rot = [0, 0, 0];
/**
 * 質量
 */
    this.mass = 2;
/**
 * 移動減衰。0だと減衰しない。
 */
    this.moveDamping = 0;
/**
 * 回転減衰。0だと減衰しない。
 */
    this.rotDamping = 0;
    this.pong = 0;
    this.friction = 0;

    this.type = Rigid.TYPE_STATIC;
  }

/**
 * GUI 数字で文字列を作成する
 * @returns {string}
 */
  not() {
    let s = '';
    for (let i = 0; i < 16; ++i) {
      const bit = 1 << i;
      if (this.groupFlags & bit) {
        // Do nothing.
      } else {
        s += ` ${i+1}`;
      }
    }
    return s;
  }

/**
 * UI番号で指定する
 * @param {number} ui 1～16
 */
  setUIGroup(ui) {
    this.group = ui - 1;
  }

  getUIGroup() {
    return this.group + 1;
  }

/**
 * 非接触ビットを非接触UI番号列挙で上書きする
 * @param  {...number} uis 1～16
 */
  setUINots(...uis) {
    let bits = 0xffff;
    for (const ui of uis) {
      const bit = 1 << (ui - 1);
      bits &= (0xffff ^ bit);
    }
    this.groupFlags = bits;
  }

/**
 * 8 + 14
 */
  toCSV() {
    const ss = [
      'PmxBody',
      `"${this.nameJa}"`,
      `"${this.nameEn}"`,
      `"${this._boneName}"`,
      this.type,
      this.group,
      `"${this.not()}"`, // 非衝突
      this.shape,
      ...this.size,
      ...this.p,
      ...this.rot.map(v => v * 180 / Math.PI), // deg
      this.mass,
      this.moveDamping,
      this.rotDamping,
      this.pong,
      this.friction,
    ];
    return ss.join(',');
  }
}

class Joint {
  constructor() {
    this.nameJa = 'ジョイント000';
    this.nameEn = 'joint000';
/**
 * 常に6DOVの0
 */
    this.type = 0;

/**
 * A剛体、B剛体のインデックス
 */
    this.rigids = [-1, -1];
/**
 * 剛体名
 */
    this._rigidName = ['', ''];

    this.p = [0, 0, 0];
/**
* ラジアン角
*/
    this.rot = [0, 0, 0];
    this.moveLower = [-9999, -9999, -9999];
    this.moveUpper = [ 9999,  9999,  9999];
/**
 * 上限。ラジアンで指定する。
 * "-360度"～"+360度"を指定すると回転しなくなるので注意。
 */
    this.rotUpper = [ Math.PI,  Math.PI,  Math.PI];
    this.rotLower = [-Math.PI, -Math.PI, -Math.PI];
/**
 * 移動のバネ
 */
    this.springMove = [0, 0, 0];
/**
 * 回転のバネ
 */
    this.springRot  = [0, 0, 0];
  }

  lockMove() {
    this.moveUpper = [0, 0, 0];
    this.moveLower = [0, 0, 0];
  }

/**
 * 本当? 回転考慮しなくていいのだろうか?
 */
  lockRot() {
    this.rotUpper = [0, 0, 0];
    this.rotLower = [0, 0, 0];
  }

  toCSV() {
    const ss = [
      'PmxJoint',
      // インデックスは無い。変更のときどうすんだろう...名前かな
      `"${this.nameJa}"`,
      `"${this.nameEn}"`,
      `"${this._rigidName[0]}"`,
      `"${this._rigidName[1]}"`,
      this.type,
      ...this.p,
      ...this.rot.map(v => v * 180 / Math.PI),
      ...this.moveLower,
      ...this.moveUpper,
      ...this.rotLower.map(v => v * 180 / Math.PI),
      ...this.rotUpper.map(v => v * 180 / Math.PI),
      ...this.springMove,
      ...this.springRot,
    ];
    return ss.join(',');
  }
}

class SoftBody {
  constructor() {
    this.nameJa = 'sohuto000';
    this.nameEn = 'softbody000';

  }
}

/**
 * 名前とコメント
 */
class ModelInfo {
  constructor() {
    this.modelJa = '';
    this.modelEn = '';
/**
 * 改行は \r\n
 */
    this.commentJa = '';
    this.commentEn = '';
  }

  clear() {
    this.modelJa = '';
    this.modelEn = '';
    this.commentJa = '';
    this.commentEn = '';
  }

  escape(text) {
    // 改行を \r \n に置換する
    let str = text.replace(/\r/g, '\\r');
    str = str.replace(/\n/g, '\\n');
    return `"${str}"`;
  }

  toCSV() {
    const ss = [
      'PmxModelInfo',
      `"${this.modelJa}"`,
      `"${this.modelEn}"`,
      this.escape(this.commentJa),
      this.escape(this.commentEn),
    ];
    return ss.join(',');
  }
}

/**
 * バイナリヘッダ
 */
class Header {
  static UTF16 = 0;
  static UTF8 = 1;
  constructor() {
    this.ver = 2;
    this.encoding = Header.UTF16;
    this.adduvnum = 0;
  }
  toCSV() {
    const ss = [
      'PmxHeader',
      this.ver,
      this.encoding,
      this.adduvnum,
    ];
    return ss.join(',');
  }
}


/**
 * サイズ格納は4バイトで固定する
 */
class PMXObject {
  constructor() {
    //this.header = new Header();
    this.modelInfo = new ModelInfo();
    this.head = {
      nameJa: '',
      nameEn: '',
      commentJa: '',
      commentEn: '',
    };
/**
 * @type {Vertex[]}
 */
    this.vts = [];
/**
 * 面頂点が1次元配列で並んでいる
 * @type {number[]} 3の倍数個
 */
    this.faceIndices = [];
/**
 * @type {Bone[]}
 */
    this.bones = [];
/**
 * @type {string[]}
 */
    this.textures = [];
/**
 * @type {Material[]}
 */
    this.materials = [];
/**
 * @type {Morph[]}
 */
    this.morphs = [];
/**
 * @type {Frame[]}
 */
    this.frames = [];
/**
 * @type {Rigid[]}
 */
    this.rigids = [];
/**
 * @type {Joint[]}
 */
    this.joints = [];
/**
 * ソフト
 * @type {SoftBody[]}
 */
    this.softs = [];

/**
 * カーソル位置(バイト)
 */
    this.c = 0;

/**
 * 文字列
 */
    this.encoding = 'UTF-8';
/**
 * 追加UV数
 */
    this.adduvnum = 0;

/**
 * 頂点インデックスバイト数
 */
    this.vtxbnum = 4;
    this.texbnum = 4;
/**
 * 材質インデックスバイト数
 */
    this.mtlbnum = 4;
/**
 * ボーンインデックスバイト数
 */
    this.bonbnum = 4;
    this.mrpbnum = 4;
    this.rgdbnum = 4;
  }
}

class Parser extends PMXObject {
  constructor() {
    super();

    this.debug = 0;
  }    

  log(...args) {
    if (this.debug > 0) {
      console.log(...args);
    }
  }

  clear() {
    this.c = 0;

    this.modelInfo.clear();
    this.nameJa = '';
    this.nameEn = '';
    this.commentJa = '';
    this.commentEn = '';

    this.vts = [];
    this.faces = [];
    this.textures = [];
    this.materials = [];
    this.bones = [];
    this.morphs = [];
    this.frames = [];

    this.rigids = [];
    this.joints = [];
    this.softs = [];
  }

/**
 * 
 * @param {DataView} p 
 * @param {number} num 
 * @returns {number[]}
 */
  readu32s(p, num) {
    const buf = new Uint32Array(num);
    for (let i = 0; i < num; ++i) {
      buf[i] = p.getUint32(this.c, true);
      this.c += 4;
    }
    return buf;
  }
/**
 * 
 * @param {DataView} p 
 * @param {number} num 
 * @returns {number[]}
 */
  readu16s(p, num) {
    const buf = new Uint16Array(num);
    for (let i = 0; i < num; ++i) {
      buf[i] = p.getUint16(this.c, true);
      this.c += 2;
    }
    return buf;
  }
/**
 * 
 * @param {DataView} p 
 * @param {number} num 
 * @returns {number[]}
 */
  readu8s(p, num) {
    const buf = new Uint8Array(num);
    for (let i = 0; i < num; ++i) {
      buf[i] = p.getUint8(this.c);
      this.c += 1;
    }
    return buf;
  }
/**
 * 
 * @param {DataView} p 
 * @param {number} num 
 * @returns {number[]}
 */
  readf32s(p, num) {
    const buf = new Float32Array(num);
    for (let i = 0; i < num; ++i) {
      buf[i] = p.getFloat32(this.c, true);
      this.c += 4;
    }
    return buf;
  }
/**
 * pmx 文字列を読み取る
 * @param {DataView} p 
 * @param {number} num 
 * @returns {string}
 */
  readstr(p) {
    const num = p.getUint32(this.c, true);
    this.c += 4;

    if (this.encoding === 'UTF-8') {
      return new TextDecoder().decode(this.readu8s(p, num));
    }

    let s = '';
    for (let i = 0; i < num / 2; ++i) {
      const code = p.getUint16(this.c, true);
      s += String.fromCodePoint(code);
      this.c += 2;
    }
    return s;
  }

/**
 * インデックス整数読み取り用
 * @param {DataView} p 
 * @param {number} num 
 * @param {number} byteNum 
 */
  readints(p, num, byteNum) {
    switch(byteNum) {
      case 4:
        return this.readu32s(p, num);
      case 2:
        return this.readu16s(p, num);
      case 1:
        return this.readu8s(p, num);
    }
  }

/**
 * API. 
 * @param {ArrayBuffer} ab 
 */
  parse(ab) {
    this.clear();
    const p = new DataView(ab);

    { // ヘッダ
      const fs = this.readf32s(p, 2);
      this.version = fs[1];
      const num = this.readu8s(p, 1)[0];
      const heads = this.readu8s(p, num);
      {
        if (heads[0] === 1) {
          this.encoding = 'UTF-8';
        } else {
          this.encoding = 'UTF-16';
        }
        this.adduvnum = heads[1];
        this.vtxbnum = heads[2];
        this.texbnum = heads[3];
        this.mtlbnum = heads[4];
        this.bonbnum = heads[5];
        this.mrpbnum = heads[6];
        this.rgdbnum = heads[7];
      }

      console.log('heads', heads);
    }

    { // 4つ
      this.modelInfo.modelJa = this.readstr(p);
      this.modelInfo.modelEn = this.readstr(p);
      this.modelInfo.commentJa = this.readstr(p);
      this.modelInfo.commentEn = this.readstr(p);

      this.nameJa = this.modelInfo.modelJa;
      this.nameEn = this.modelInfo.modelEn;
      this.commentJa = this.modelInfo.commentJa;
      this.commentEn = this.modelInfo.commentEn;
    }

    { // vertex
      const num = this.readu32s(p, 1)[0];
      console.log('vertex num', num);
      for (let i = 0; i < num; ++i) {
        const vtx = new Vertex();
        vtx._index = i;
        const fs = this.readf32s(p, 8);
        vtx.p = [fs[0], fs[1], fs[2]];
        vtx.n = [fs[3], fs[4], fs[5]];
        vtx.uv = [fs[6], fs[7]];
        if (this.adduvnum >= 1) {
          console.warn('not implemented add uv');
        }
        vtx.deformType = this.readu8s(p, 1)[0];
        switch(vtx.deformType) {
        case Vertex.DEFORM_BDEF1:
          vtx.joints[0] = this.readints(p, 1, this.bonbnum)[0];
          vtx.weights[0] = 1;
          break;
        case Vertex.DEFORM_BDEF2:
          {
            const its = this.readints(p, 2, this.bonbnum);
            vtx.joints[0] = its[0];
            vtx.joints[1] = its[1];
            vtx.weights[0] = this.readf32s(p, 1)[0];
            vtx.weights[1] = 1 - vtx.weights[0];
          }
          break;
        case Vertex.DEFORM_BDEF4:
          vtx.joints = this.readints(p, 4, this.bonbnum);
          vtx.weights = this.readf32s(p, 4);
          break;
        case Vertex.DEFORM_SDEF:
          {
            const its = this.readints(p, 2, this.bonbnum);
            vtx.joints[0] = its[0];
            vtx.joints[1] = its[1];
            const fs = this.readf32s(p, 10);
            vtx.weights[0] = fs[0];
            vtx.weights[1] = 1 - fs[0];
            vtx.c = fs.slice(1, 4);
            vtx.r0 = fs.slice(4, 7);
            vtx.r1 = fs.slice(7, 10);
          }

          break;
        default:
          console.warn('unknown deform', i, vtx.deformType);
          break;
        }
        vtx.edgeRate = this.readf32s(p, 1)[0];

        this.vts.push(vtx);
      }
    }
    { // face
      const num = this.readu32s(p, 1)[0];
      console.log('face num', num);
      this.faceIndices = this.readints(p, num, this.vtxbnum);
    }
    { // texture
      const num = this.readu32s(p, 1)[0];
      for (let i = 0; i < num; ++i) {
        const tpath = this.readstr(p);
        this.textures.push(tpath);
      }
      console.log('texture', this.textures);
    }
    { // material
      const num = this.readu32s(p, 1)[0];
      for (let i = 0; i < num; ++i) {
        const m = new Material();
        m._index = i;
        m.nameJa = this.readstr(p);
        m.nameEn = this.readstr(p);
        const fs = this.readf32s(p, 11);
        m.diffuse = fs.slice(0, 4);
        m.specular = fs.slice(4, 7);
        m.specPower = fs[7];
        m.ambient = fs.slice(8, 11);
        m.bitFlag = this.readu8s(p, 1)[0];
        m.edgeColor = this.readf32s(p, 4);
        m.edgeSize = this.readf32s(p, 1)[0];

        m.texIndex = this.readints(p, 1, this.texbnum)[0];
        m.sphereIndex = this.readints(p, 1, this.texbnum)[0];

        m.sphereMode = this.readu8s(p, 1)[0];

        m.sharetoonflag = this.readu8s(p, 1)[0];
        if (m.sharetoonflag === 0) {
          m.sharetoonindex = this.readints(p, 1, this.texbnum)[0];
        } else {
          m.sharetoonindex = this.readu8s(p, 1)[0];
        }

        m.memo = this.readstr(p);
// 頂点全数(3の倍数)が格納されている
        const num = this.readu32s(p, 1)[0];
        m._faceIndexNum = num;
        m.faces = new Array(num / 3);

        this.materials.push(m);
      }
      console.log('material', this.materials);
    }
    { // bone
      const num = this.readu32s(p, 1)[0];
      for (let i = 0; i < num; ++i) {
        const b = new Bone();
        b._index = i;
        b.nameJa = this.readstr(p);
        b.nameEn = this.readstr(p);
        b.p = this.readf32s(p, 3);
        b.parent = this.readints(p, 1, this.bonbnum);
        b.layer = this.readu32s(p, 1)[0];
        b.bits = this.readu16s(p, 1)[0];
        if (b.bits & Bone.BIT_BONECONNECT) {
          b.boneConnect = this.readints(p, 1, this.bonbnum);
        } else {
          b.endOffset = this.readf32s(p, 3);
        }
        if ((b.bits & Bone.BIT_ROTAPPLY)
          || (b.bits & Bone.BIT_MOVEAPPLY)) {
          b.applyParent = this.readints(p, 1, this.bonbnum)[0];
          b.applyRate = this.readf32s(p, 1)[0];
        }
        if (b.bits & Bone.BIT_FIXAXIS) {
          b.axisVector = this.readf32s(p, 3);
        }
        if (b.bits & Bone.BIT_LOCALAXIS) {
          b.xLocalVector = this.readf32s(p, 3);
          b.zLocalVector = this.readf32s(p, 3);
        }
        if (b.bits & Bone.BIT_EXTERNALPARENT) {
          b.externalParentKey = this.readu32s(p, 1)[0];
        }
        if (b.bits & Bone.BIT_IK) {
          b.ikTargetBone = this.readints(p, 1, this.bonbnum)[0];
          b.ikLoopCount = this.readu32s(p, 1)[0];
          b.ikLimitation = this.readf32s(p, 1)[0];
          const linknum = this.readu32s(p, 1)[0];
          for (let j = 0; j < linknum; ++j) {
            const link = new IKLink();
            link.linkBone = this.readints(p, 1, this.bonbnum)[0];
            link.isLimitation = this.readu8s(p, 1)[0];
            if (link.isLimitation) {
              link.lower = this.readf32s(p, 3);
              link.upper = this.readf32s(p, 3);
            }
            b.ikLinks.push(link);
          }
        }

        this.bones.push(b);
        //console.log('bone', b.nameJa);
      }
    }
    { // morph
      const num = this.readu32s(p, 1)[0];
      console.log('morph num', num);
      for (let i = 0; i < num; ++i) {
        const m = new Morph();
        m._index = i;
        m.nameJa = this.readstr(p);
        m.nameEn = this.readstr(p);
        m.panel = this.readu8s(p, 1)[0];
        m.type = this.readu8s(p, 1)[0];
        const morphnum = this.readu32s(p, 1)[0];
        for (let j = 0; j < morphnum; ++j) {
          let one = null;
          switch(m.type) {
          case Morph.TYPE_GROUP: // グループ
            {
              console.warn('skip only group');
              this.readints(p, 1, this.mrpbnum)[0];
              this.readf32s(p, 1)[0];
            }
            break;
          case Morph.TYPE_VERTEX: // 頂点
            {
            //console.warn('skip only vertex', m.nameJa, `${i}/${num}`, `${j}/${morphnum}`);
              this.readints(p, 1, this.vtxbnum)[0];
              this.readf32s(p, 3);
            }
            break;
          case Morph.TYPE_BONE: // ボーン
            {
              console.warn('skip only bone', m.nameJa);
              this.readints(p, 1, this.bonbnum)[0];
              this.readf32s(p, 3);
              this.readf32s(p, 4);
            }
            break;
          case Morph.TYPE_UV: // UV
            {
              console.warn('skip only uv', m.nameJa);
              this.readints(p, 1, this.vtxbnum)[0];
              this.readf32s(p, 4);
            }
            break;
          case Morph.TYPE_MATERIAL:
            {
              one = new PMX.MaterialMorph();
              console.warn('skip only material morph', m.nameJa);
              this.readints(p, 1, this.mtlbnum)[0];
              this.readu8s(p, 1)[0];
              this.readf32s(p, 28);
              m.materialMorphs.push(one);
            }
            break;
          default:
            console.warn('not implemented', m.type, m.nameJa);
            break;
          }
          m.ones.push(one);
        }
        this.morphs.push(m);
      }
    }
    { // frame
      const num = this.readu32s(p, 1)[0];
      console.log('frame num', num);
      for (let i = 0; i < num; ++i) {
        const f = new Frame();
        f._index = i;
        f.nameJa = this.readstr(p);
        f.nameEn = this.readstr(p);
        f.specialFlag = this.readu8s(p, 1)[0];
        const framenum = this.readu32s(p, 1)[0];
        for (let j = 0; j < framenum; ++j) {
          const target = this.readu8s(p, 1)[0];
          if (target === 0) {
            this.readints(p, 1, this.bonbnum)[0];
          } else {
            this.readints(p, 1, this.mrpbnum)[0];
          }
          //console.warn('skip only', f.nameJa);
        }
        this.frames.push(f);
      }
    }

    { // rigid
      const num = this.readu32s(p, 1)[0];
      console.log('rigid num', num);
      for (let i = 0; i < num; ++i) {
        const r = new Rigid();
        r._index = i;
        r.nameJa = this.readstr(p);
        r.nameEn = this.readstr(p);
        r.bone = this.readints(p, 1, this.bonbnum)[0];
        r.group = this.readu8s(p, 1)[0];
        r.groupFlags = this.readu16s(p, 1);
        r.shape = this.readu8s(p, 1)[0];
        const fs = this.readf32s(p, 14);
        r.size = fs.slice(0, 3);
        r.p = fs.slice(3, 6);
        r.rot = fs.slice(6, 9);
        r.mass = fs[9];
        r.moveDamping = fs[10];
        r.rotDamping = fs[11];
        r.pong = fs[12];
        r.friction = fs[13];               
        r.type = this.readu8s(p, 1)[0];
        this.rigids.push(r);

        console.log('rigid', r.nameJa, i);
      }
    }
    { // joint
      const num = this.readu32s(p, 1)[0];
      console.log('joint num', num);
      for (let i = 0; i < num; ++i) {
        const j = new Joint();
        j._index = i;
        j.nameJa = this.readstr(p);
        j.nameEn = this.readstr(p);
        j.type = this.readu8s(p, 1)[0];
        j.rigids = this.readints(p, 2, this.rgdbnum);
        const fs = this.readf32s(p, 24);
        j.p = fs.slice(0, 3);
        j.rot = fs.slice(3, 6);
        j.moveLower = fs.slice(6, 9);
        j.moveUpper = fs.slice(9, 12);
        j.rotLower = fs.slice(12, 15);
        j.rotUpper = fs.slice(15, 18);
        j.springMove = fs.slice(18, 21);
        j.springRot = fs.slice(21, 24);
        this.joints.push(j);

        console.log('joint', j.nameJa, i);
      }
    }
// softbody
    if (this.version > 2.0) {
      const num = this.readu32s(p, 1)[0];
      console.log('softbody num', num);
      for (let i = 0; i < num; ++i) {

      }
    }

    { // face の分配
      //console.warn('face 分配は not implemented');
    }

    console.log('parse', this.c, p.byteLength);
  }

}

/**
 * バイナリ書き出しクラス
 */
class Maker extends Parser {
  constructor() {
    super();
  }

/**
 * 文字列を書き込む
 * @param {DataView} p 
 * @param {number} offset
 * @param {string} ins 
 */
  writestr(p, offset, ins) {
    if (this.encoding === 'UTF-8') {
    // UTF-8 のとき 16LE 変換必要だったら入れる
      const b8 = new TextEncoder().encode(ins);
      const num = b8.byteLength;
      p.setInt32(offset, num, true);
      for (let i = 0; i < num; ++i) {
        p.setUint8(offset + 4 + i, b8[i]);
      }
      return 4 + num;
    }

    const ss = Array.from(ins);
    const num = ss.length * 2;
    p.setUint32(offset, num, true);
    for (let i = 0; i < ss.length; ++i) {
      p.setUint16(offset + 4 + i * 2, ss[i].codePointAt(0));
    }
    return 4 + num;
  }

/**
 * 
 * @param {DataView} p 
 * @param {number} inoffset 
 * @param {number[]} fs 
 * @returns {number} 進んだバイト数
 */
  writefs(p, inoffset, fs) {
    let offset = 0;
    for (const f of fs) {
      p.setFloat32(inoffset + offset, f, true);
      offset += 4;
    }
    return offset;
  }

/**
 * 
 * @param {DataView} p 
 * @param {offset} inoffset 
 * @param {number[]} vs 
 * @returns 
 */
  write32s(p, inoffset, vs) {
    let offset = 0;
    for (const v of vs) {
      p.setInt32(inoffset + offset, v, true);
      offset += 4;
    }
    return offset;
  }

/**
* 
* @param {DataView} p 
* @param {number} inoffset 
* @param {number[]} vs 
* @returns {number} 進んだバイト数
*/
  write16s(p, inoffset, vs) {
    let offset = 0;
    for (const v of vs) {
      p.setUint16(inoffset + offset, v, true);
      offset += 2;
    }
    return offset;
  }

/**
* 
* @param {DataView} p 
* @param {number} inoffset 
* @param {number[]} vs 
* @returns 
*/
  write8s(p, inoffset, vs) {
    let offset = 0;
    for (const v of vs) {
      p.setUint8(inoffset + offset, v);
      offset += 1;
    }
    return offset;
  }
/**
 * 
 * @param {DataView} p 
 * @param {number} inoffset 
 * @param {number[]} vs 
 * @param {number} byteNum 
 */
  writeints(p, inoffset, vs, byteNum) {
    switch(byteNum) {
    case 4:
      return this.write32s(p, inoffset, vs);
    case 2:
      return this.write16s(p, inoffset, vs);
    case 1:
      return this.write8s(p, inoffset, vs);
    }
  }

/**
 * 現在の状態でバッファを作成する
 * @returns {ArrayBuffer[]}
 */
  makeBuffer() {
    const bufs = [];
    { // ヘッダ
      const buf = new ArrayBuffer(4+4+9);
      const p = new DataView(buf);
      let c = 0;
      for (const v of Array.from('PMX ')) {
        p.setUint8(c, v.charCodeAt(0));
        c += 1;
      }
      c += this.writefs(p, c, [2]);
      c += this.write8s(p, c, [8,
        (this.encoding === 'UTF-8') ? 1 : 0,
        this.adduvnum,
        this.vtxbnum,
        this.texbnum,
        this.mtlbnum,
        this.bonbnum,
        this.mrpbnum,
        this.rgdbnum
      ]);
      bufs.push(buf);
    }
    {
      const buf = new ArrayBuffer(65536);
      const p = new DataView(buf);
      let c = 0;
      c += this.writestr(p, c, this.head.nameJa);
      c += this.writestr(p, c, this.head.nameEn);
      c += this.writestr(p, c, this.head.commentJa);
      c += this.writestr(p, c, this.head.commentEn);
/*
      c += this.writestr(p, c, this.modelInfo.modelJa);
      c += this.writestr(p, c, this.modelInfo.modelEn);
      c += this.writestr(p, c, this.modelInfo.commentJa);
      c += this.writestr(p, c, this.modelInfo.commentEn);
*/
      bufs.push(buf.slice(0, c));
    }

    { // 頂点
      const num = this.vts.length;
      const buf = new ArrayBuffer(4 + (1 + 22 * 4) * num);
      const p = new DataView(buf);
      let c = 0;
      c += this.write32s(p, c, [num]);
      for (const v of this.vts) {
        c += this.writefs(p, c, [
          ...v.p,
          ...v.n,
          ...v.uv,
        ]);
        c += this.write8s(p, c, [v.deformType]);
        switch(v.deformType) {
        case Vertex.DEFORM_BDEF1:
          c += this.writeints(p, c, [v.joints[0]], this.bonbnum);
          break;
        case Vertex.DEFORM_BDEF2:
          c += this.writeints(p, c,
            [v.joints[0], v.joints[1]],
            this.bonbnum);
          c += this.writefs(p, c, [v.weights[0]]);
          break;
        case Vertex.DEFORM_BDEF4:
          c += this.writeints(p, c, v.joints, this.bonbnum);
          c += this.writefs(p, c, v.weights);
          break;
        case Vertex.DEFORM_SDEF:
          c += this.writeints(p, c,
            [v.joints[0], v.joints[1]],
            this.bonbnum);
          c += this.writefs(p, c, [
            v.weights[0],
            ...v.c,
            ...v.r0,
            ...v.r1,
          ]);
          break;
        }
        // エッジ倍率
        c += this.writefs(p, c, [v.edgeRate]);
      }
      bufs.push(buf.slice(0, c));
    }

    { // 面頂点数
  /**
  * 面数
  */
      let facenum = 0;
      for (const v of this.materials) {
        facenum += v.faces.length;
      }
      const buf = new ArrayBuffer(4 + 4 * facenum * 3);
      const p = new DataView(buf);
      let c = 0;
      c += this.write32s(p, c, [facenum * 3]);
      for (const m of this.materials) {
        for (const face of m.faces) {
          c += this.write32s(p, c, face);
        }
      }            
      bufs.push(buf);
    }

    { // テクスチャ
      const num = this.textures.length;
      const buf = new ArrayBuffer(65536);
      const p = new DataView(buf);
      let c = 0;
      c += this.write32s(p, c, [num]);
      for (const v of this.textures) {
        c += this.writestr(p, c, v);
      }
      bufs.push(buf.slice(0, c));
    }

    { // 材質
      const num = this.materials.length;
      const buf = new ArrayBuffer(65536 * 256);
      const p = new DataView(buf);
      let c = 0;
      c += this.write32s(p, c, [num]);
      for (const m of this.materials) {
        c += this.writestr(p, c, m.nameJa);
        c += this.writestr(p, c, m.nameEn);
        c += this.writefs(p, c, [
          ...m.diffuse,
          ...m.specular,
          m.specPower,
          ...m.ambient,
        ]);
        c += this.write8s(p, c, [m.bitFlag]);

        c += this.writefs(p, c, m.edgeColor);
        c += this.writefs(p, c, [m.edgeSize]);

        c += this.writeints(p, c, [m.texIndex, m.sphereIndex],
          this.texbnum);
        c += this.write8s(p, c, [m.sphereMode]); // sphere

        c += this.write8s(p, c, [m.sharetoonflag]);
        if (m.sharetoonflag) {
          c += this.write8s(p, c, [m.sharetoonindex]); // 0～9 が 01～10
        } else {
          c += this.writeints(p, c,
            [m.sharetoonindex],
            this.texbnum); // 個別テクスチャインデックス
        }

        c += this.writestr(p, c, m.memo); // メモ
        c += this.writeints(p, c, [m.faces.length * 3],
          this.vtxbnum);
      }
      bufs.push(buf.slice(0, c));
    }

    { // ボーン * ここ
      const num = this.bones.length;
      const buf = new ArrayBuffer(65536 * 16);
      const p = new DataView(buf);
      let c = 0;
      c += this.write32s(p, c, [num]);
      for (const b of this.bones) {
        c += this.writestr(p, c, b.nameJa);
        c += this.writestr(p, c, b.nameEn);
        c += this.writefs(p, c, b.p);
        c += this.write32s(p, c, [b.parent]);
        c += this.write32s(p, c, [b.layer]);

        c += this.write16s(p, c, [b.bits]);

        if (b.bits & PMX.Bone.BIT_BONECONNECT) {
          c += this.write32s(p, c, [b.endBoneIndex]);
        } else {
          c += this.writefs(p, c, b.endOffset);
        }

        if (b.bits & PMX.Bone.BIT_LOCALAPPLY) { // 回転付与移動付与
          c += this.write32s(p, c, b.applyParent);
          c += this.writefs(p, c, [b.applyRate]);
        }
        if (b.bits & PMX.Bone.BIT_FIXAXIS) { // 軸固定
          c += this.writefs(p, c, b.axisVector);
        }
        if (b.bits & PMX.Bone.BIT_LOCALAXIS) { // ローカル軸
          c += this.writefs(p, c, b.xLocalVector);
          c += this.writefs(p, c, b.zLocalVector);
        }

        if (b.bits & PMX.Bone.BIT_EXTERNALPARENT) {
          c += this.write32s(p, c, [b.externalParentKey]);
        }

        if (b.bits & PMX.Bone.BIT_IK) {
          c += this.write32s(p, c, [b.ikTargetBone]);
          c += this.write32s(p, c, [b.ikLoopCount]);
          c += this.writefs(p, c, [b.ikLimitation]);
          c += this.write32s(p, c, [b.ikLinks.length]);
          for (const ik of b.ikLinks) {
            c += this.write32s(p, c, [ik.linkBone]);
            c += this.write8s(p, c, [ik.isLimitation]);
            if (ik.isLimitation) {
              c += this.writefs(p, c, ik.lower);
              c += this.writefs(p, c, ik.upper);
            }
          }
        }

      }
      bufs.push(buf.slice(0, c));
    }

    { // モーフ
      const num = this.morphs.length;
      const buf = new ArrayBuffer(65536 * 4);
      const p = new DataView(buf);
      let c = 0;
      c += this.write32s(p, c, [num]);
      for (const m of this.morphs) {
        c += this.writestr(p, c, m.nameJa);
        c += this.writestr(p, c, m.nameEn);
        c += this.write8s(p, c, [m.panel]);
        c += this.write8s(p, c, [m.type]);
        switch(m.type) {
        case Morph.TYPE_GROUP:
          break;
        case Morph.TYPE_VERTEX:
          break;
        case Morph.TYPE_BONE:
          break;
        case Morph.TYPE_UV:
        case Morph.TYPE_UV1:
        case Morph.TYPE_UV2:
        case Morph.TYPE_UV3:
        case Morph.TYPE_UV4:
          break;
        case Morph.TYPE_MATERIAL:
          c += this.write32s(p, c, [m.materialMorphs.length]);
          for (const one of m.materialMorphs) {
            c += this.writeints(p, c, [one.materialIndex], this.mtlbnum);
            c += this.write8s(p, c, [one.calcType]);
            c += this.writefs(p, c,
              [ // 28個
                ...one.diffuse,
                ...one.specular, // no A
                one.power,
                ...one.ambient, // no A
                ...one.edge,
                one.edgeSize,
                ...one.tex,
                ...one.sphere,
                ...one.toon,
              ]);
          }
          break;
        }
      }
      bufs.push(buf.slice(0, c));
    }

    { // 表示枠 *
      const num = this.frames.length;
      const buf = new ArrayBuffer(65536);
      const p = new DataView(buf);
      let c = 0;
      c += this.write32s(p, c, [num]);
      for (const f of this.frames) {
        c += this.writestr(p, c, f.nameJa);
        c += this.writestr(p, c, f.nameEn);
        c += this.write8s(p, c, [f.specialFlag]); // 0: 通常、1: 特殊(rootとPMD互換)
        const num = f.bones.length + f.morphs.length;
        c += this.write32s(p, c, [num]);
        for (const v of f.bones) {
          c += this.write8s(p, c, [0]); // 0: ボーン、1: モーフ
          c += this.writeints(p, c, [v], this.bonbnum);
        }
        for (const v of f.morphs) {
          c += this.write8s(p, c, [1]); // 0: ボーン、1: モーフ
          c += this.writeints(p, c, [v], this.mrpbnum);
        }
      }
      bufs.push(buf.slice(0, c));
    }

    { // 物理
      const num = this.rigids.length;
      const buf = new ArrayBuffer(65536 * 16);
      const p = new DataView(buf);
      let c = 0;
      c += this.write32s(p, c, [num]);
      for (const r of this.rigids) {
        c += this.writestr(p, c, r.nameJa);
        c += this.writestr(p, c, r.nameEn);
        c += this.write32s(p, c, [r.bone]);
        c += this.write8s(p, c, [r.group]);
        c += this.write16s(p, c, [r.groupFlags]);
        c += this.write8s(p, c, [r.shape]);
        c += this.writefs(p, c, [
          ...r.size,
          ...r.p,
          ...r.rot,
          r.mass,
          r.moveDamping,
          r.rotDamping,
          r.pong,
          r.friction,
        ]);
        c += this.write8s(p, c, [r.type]);
      }
      bufs.push(buf.slice(0, c));
    }

    { // ジョイント
      const num = this.joints.length;
      const buf = new ArrayBuffer(65536);
      const p = new DataView(buf);
      let c = 0;
      c += this.write32s(p, c, [num]);
      for (const j of this.joints) {
        c += this.writestr(p, c, j.nameJa);
        c += this.writestr(p, c, j.nameEn);
        c += this.write8s(p, c, [j.type]);
        c += this.write32s(p, c, j.rigids);
        c += this.writefs(p, c, [
          ...j.p,
          ...j.rot,
          ...j.moveLower,
          ...j.moveUpper,
          ...j.rotLower,
          ...j.rotUpper,
          ...j.springMove,
          ...j.springRot,
        ]);
      }
      bufs.push(buf.slice(0, c));
    }

    { // ソフトボディ
      //const num = this.softs.length;
      const num = 0;
      const buf = new ArrayBuffer(65536);
      const p = new DataView(buf);
      let c = 0;
      c += this.write32s(p, c, [num]);
      bufs.push(buf.slice(0, c));
    }
    return bufs;
  }

/**
* オフセットとバイト数にする
* @param {ArrayBuffer[]} bufs 
*/
  toOffsets(bufs) {
    const ret = {
      chunks: []
    };
    let offset = 0;
    for (const buf of bufs) {
      const chunk = {
        offset,
        bytes: buf.byteLength,
      };
      offset += chunk.bytes;
      ret.chunks.push(chunk);
    }
    return ret;
  }

}


_global.PMX = {};
Object.assign(_global.PMX, {
  IKLink,
  Vertex,
  Face,
  Bone,
  Material,
  MaterialMorph,
  VertexMorph,
  Morph,
  Frame,
  NodeItem,
  PMXNode,
  Rigid,
  Joint,
  SoftBody,
  ModelInfo,
  Header,

  PMXObject,
  Parser,
  Maker,
});

})(globalThis);

