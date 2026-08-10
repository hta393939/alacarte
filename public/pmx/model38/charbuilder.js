
import { TexMaker } from './texmaker.js';

/**
 * @typedef IParam
 * @property {number} hdiv 水平側分割数
 * @property {number} vdiv 垂直側分割数
 * @property {PMX.Bone} bonea 根本側
 * @property {PMX.Bone} boneb 先側
 * @property {PMX.Vertex[]} vertices これまでの頂点が格納されていて追加する先の配列
 * @property {number[][]} faces 追加する先の配列。3頂点インデックスの配列
 * @property {number} lenhalf 箱。高さの半分
 * @property {number} boneIndex 箱。決定後のボーンインデックス。所属
 */



/** 3次ベクトル */
export class Vec3 {
  static XAXIS = 'x';
  static YAXIS = 'y';
  static ZAXIS = 'z';

  /**
   * 
   * @param {number[]} arr 
   * @returns 
   */
  static fromArray(arr) {
    return new Vec3(arr[0], arr[1], arr[2]);
  }

  constructor(inx = 0, iny = 0, inz = 0) {
    this._x = inx;
    this._y = iny;
    this._z = inz;
  }

  asArray() {
    return [this.x, this.y, this.z];
  }

  get x() {
    return this._x;
  }
  set x(val) {
    this._x = val;
  }
  get y() {
    return this._y;
  }
  set y(val) {
    this._y = val;
  }
  get z() {
    return this._z;
  }
  set z(val) {
    this._z = val;
  }

  clone() {
    return new Vec3(this.x, this.y, this.z);
  }

  /**
   * 
   * @param {Vec3} b 
   * @returns {number}
   */
  dot(b) {
    return (this.x * b.x + this.y * b.y + this.z * b.z);
  }

  /**
   * 破壊スカラー倍
   * @param {number} k 
   */
  mulkInPlace(k) {
    this._x *= k;
    this._y *= k;
    this._z *= k;
    return this;
  }

  len() {
    return Math.sqrt(this.dot(this));
  }

  /**
   * 破壊正規化
   * @returns 
   */
  normalizeInPlace() {
    const len = this.len();
    if (len === 0) {
      return this;
    }
    return this.mulkInPlace(1 / len);
  }

  /**
   * 新しいインスタンスで外積
   * @param {Vec3} b 
   * @returns 
   */
  cross(b) {
    return new Vec3(
      this.y * b.z - this.z * b.y,
      this.z * b.x - this.x * b.z,
      this.x * b.y - this.y * b.x,
    );
  }

  /**
   * 破壊加算
   * @param {number} ok スカラー倍数
   * @param {Vec3} b ベクトル
   * @param {number} bk スカラー倍数
   */
  add(ok, b, bk) {
    this.x = this.x * ok + b.x * bk;
    this.y = this.y * ok + b.y * bk;
    this.z = this.z * ok + b.z * bk;
    return this;
  }

  /**
   * 破壊で加算
   * @param {Vec3} b 
   * @returns 
   */
  addInPlace(b) {
    this.x += b.x;
    this.y += b.y;
    this.z += b.z;
    return this;
  }

  /**
   * 破壊引き算
   * @param {Vec3} b 
   */
  subInPlace(b) {
    this.x -= b.x;
    this.y -= b.y;
    this.z -= b.z;
    return this;
  }

}

export class Quat {
  constructor(inx, iny, inz, inw) {
    this._x = inx;
    this._y = iny;
    this._z = inz;
    this._w = inw;
  }

  /**
   * 
   * @param {number[]} arr w, x, y, z 順
   * @returns 
   */
  static fromArrayWHead(arr) {
    const ret = new Quat();
    ret.w = arr[0];
    ret.x = arr[1];
    ret.y = arr[2];
    ret.z = arr[3];
    return ret;
  }
  /**
   * 
   * @param {number[]} arr x, y, z, w 順
   * @returns 
   */
  static fromArrayWTail(arr) {
    const ret = new Quat();
    ret.x = arr[0];
    ret.y = arr[1];
    ret.z = arr[2];
    ret.w = arr[3];
    return ret;
  }

  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }
  get z() {
    return this._z;
  }
  get w() {
    return this._w;
  }

  set x(val) {
    this._x = val;
  }
  set y(val) {
    this._y = val;
  }
  set z(val) {
    this._z = val;
  }
  set w(val) {
    this._w = val;
  }

  clone() {
    const ret = Quat.fromArrayWTail(this.x, this.y, this.z, this.w);
    return ret;
  }

  im() {
    return new Vec3(this.x, this.y, this.z);
  }

  /**
   * 積。新しいインスタンスで。
   * @param {Quat} b 
   * @returns 
   */
  mul(b) {
    const are = this.w;
    const bre = b.w;
    const aim = this.im();
    const bim = b.im();
    const vre = aim.clone()
      .mulkInPlace(bre)
      .addInPlace(bim.clone().mulkInPlace(are))
      .addInPlace(aim.cross(bim));
    return Quat.fromArrayWTail([
      vre.x,
      vre.y,
      vre.z,
      are * bre - aim.dot(bim),
    ]);
  }

  toVec3() {
    return new Vec3(this.x, this.y, this.z);
  }

  /**
   * 共役。新しいインスタンスで。
   * @returns 
   */
  conj() {
    const ret = Quat.fromArrayWTail([-this.x, -this.y, -this.z, this.w]);
    return ret;
  }

  /**
   * 回転。新しいインスタンスで。
   * @param {Vec3} target 
   * @returns {Vec3}
   */
  rotate(target) {
    const posq = Quat.fromArrayWTail([target.x, target.y, target.z, 0]);
    return this.mul(posq).mul(this.conj()).toVec3();   
  }

  /**
   * center でこの Quat 回転する
   * @param {Vec3} target
   * @param {Vec3} center 
   */
  rotateByPoint(target, center) {
    const p1 = target.clone().subInPlace(center);
    const p2 = this.rotate(p1);
    return p2.addInPlace(center);
  }

  /**
   * axis 周りに ang ラジアン回転させるクォータニオン
   * @param {Vec3} axis 
   * @param {number} ang 
   */
  static axisRot(axis, ang) {
    const vec = axis.normalizeInPlace().mulkInPlace(Math.sin(ang * 0.5));
    const ret = Quat.fromArrayWTail([
      vec.x, vec.y, vec.z,
      Math.cos(ang * 0.5),
    ]);
    return ret;
  }
} 

export class CharBuilder extends PMX.Maker {
  static VERSION = '0.1.0';

  /** 8x8 uv インデックス */
  static INDEX_OWNJOINT = 1;
  /** 8x8 uv インデックス */
  static INDEX_MOBIUS = 2;

  /** 腕のベクトルの正規化X成分 */
  static ANX = 0.788;
  /** 腕のベクトルの正規化Y成分の正 */
  static ANY = 0.616;
  /** 指ボーンの隙間 */
  static FINGER_INTERVAL = 0.08;

  constructor() {
    super();

    this.bones = this.initBone();
    this.materials = this.initMaterial();

    this.morphs = this.initEmotion();
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * 
   * @param {PMX.Bone[]} bones 
   * @param {string} parentName
   */
  searchChild(bones, parentName) {
    const ret = [];
    for (let i = 0; i < bones.length; ++i) {
      const bone = bones[i];
      const parentIndex = bone.parent;
      if (parentIndex < 0) {
        continue;
      }
      const parent = bones[parentIndex];
      if (parent.nameJa === parentName) {
        ret.push(bone);
      }
    }
    return ret;
  }

  initBone() {
    /** @type {PMX.Bone[]} */
    const bones = [];

    const ax = CharBuilder.ANX * 1;
    const ay = CharBuilder.ANY * 1;
    const fx = CharBuilder.ANX * 0.25;
    const fy = CharBuilder.ANY * 0.25;
    /** 指ずれ */
    const fit = CharBuilder.FINGER_INTERVAL;

    const blocks = [
{ lr: false, bones: [
{ parentName: '', nameJa: '全ての親', nameEn: 'root', p:[0,0,0] },
{ parentName: '全ての親', nameJa: '操作中心', nameEn: 'view cnt bone', p:[0,0,0] },
{ parentName: '全ての親', nameJa: 'センター', nameEn: 'center', p:[0,5,0] },
{ parentName: 'センター', nameJa: '下半身', nameEn: 'spine', p: [0,0,0] },
{ parentName: '下半身', nameJa: '上半身', nameEn: 'chest', p:[0,1,0] },
{ parentName: '上半身', nameJa: '上半身2', nameEn: 'upperChest', p:[0,1,0] },
{ parentName: '上半身2', nameJa: '首', nameEn: 'neck', p:[0,1,0] },
{ parentName: '首', nameJa: '頭', nameEn: 'head', p:[0,1,0] }, // #7
]},
{ lr: true, bones: [
{parentName: '下半身',nameJa: '足', nameEn: 'UpperLeg', p:[1,0,0]},
{parentName: '_足',nameJa: 'ひざ', nameEn: 'LowerLeg', p:[0,-1,0]},
{parentName: '_ひざ',nameJa: '足首', nameEn: 'Foot', p:[0,-1,0]},
{parentName: '_足首',nameJa: 'つま先', nameEn: 'Toe', p:[0,0,-1]},
]},
{ lr: true, bones: [
{parentName: '上半身2',nameJa: '肩', nameEn: 'Shoulder', p:[0.5,0,0]},
{parentName: '_肩',nameJa: '腕', nameEn: 'UpperArm', p:[0.5,0,0]},
{parentName: '_腕',nameJa: 'ひじ', nameEn: 'LowerArm', p:[ax,-ay,0]},
{parentName: '_ひじ',nameJa: '手首', nameEn: 'Hand', p:[ax,-ay,0]},
// 薬指を手首の先として使用する
{parentName: '_手首',nameJa: '薬指１', nameEn: 'RingProximal', p:[fx,-fy,0]},
{parentName: '_薬指１',nameJa: '薬指２', nameEn: 'RingIntermediate', p:[fx,-fy,0]},
{parentName: '_薬指２',nameJa: '薬指３', nameEn: 'RingDistal', p:[fx,-fy,0]},
{parentName: '_薬指３',nameJa: '薬指先', nameEn: 'RingEnd', p:[fx,-fy,0]},

{parentName: '_手首',nameJa: '小指１', nameEn: 'LittleProximal', p:[fx,-fy,fit]},
{parentName: '_小指１',nameJa: '小指２', nameEn: 'LittleIntermediate', p:[fx,-fy,0]},
{parentName: '_小指２',nameJa: '小指３', nameEn: 'LittleDistal', p:[fx,-fy,0]},
{parentName: '_小指３',nameJa: '小指先', nameEn: 'LittleEnd', p:[fx,-fy,0]},

{parentName: '_手首',nameJa: '中指１', nameEn: 'MiddleProximal', p:[fx,-fy,-fit]},
{parentName: '_中指１',nameJa: '中指２', nameEn: 'MiddleIntermediate', p:[fx,-fy,0]},
{parentName: '_中指２',nameJa: '中指３', nameEn: 'MiddleDistal', p:[fx,-fy,0]},
{parentName: '_中指３',nameJa: '中指先', nameEn: 'MiddleEnd', p:[fx,-fy,0]},

{parentName: '_手首',nameJa: '人指１', nameEn: 'IndexProximal', p:[fx,-fy,-fit*2]},
{parentName: '_人指１',nameJa: '人指２', nameEn: 'IndexIntermediate', p:[fx,-fy,0]},
{parentName: '_人指２',nameJa: '人指３', nameEn: 'IndexDistal', p:[fx,-fy,0]},
{parentName: '_人指３',nameJa: '人指先', nameEn: 'IndexEnd', p:[fx,-fy,0]},

{parentName: '_手首',nameJa: '親指０', nameEn: 'ThumbMetacarpal', p:[fx,-fy,-fit*3]},
{parentName: '_親指０',nameJa: '親指１', nameEn: 'ThumbProximal', p:[fx,-fy,0]},
{parentName: '_親指１',nameJa: '親指２', nameEn: 'ThumbDistal', p:[fx,-fy,0]},
{parentName: '_親指２',nameJa: '親指先', nameEn: 'ThumbEnd', p:[fx,-fy,0]},
]},
{ lr: true, bones: [
{parentName: '頭',nameJa: '目', nameEn: 'Eye', p:[0.2,0,-0.2]},
]},
{ lr: true, bones: [
{parentName: '全ての親', nameJa: '足ＩＫ', nameEn: 'LegIK', p:[1,0,0]},
{parentName: '_足ＩＫ', nameJa: '足ＩＫ先', nameEn: 'LegIKEnd', p:[0,0,-1]},
]},
{ lr: true, bones: [
{parentName: '_足ＩＫ', nameJa: 'つま先ＩＫ', nameEn: 'ToeIKTop', p:[1,0,0]},
{parentName: '_つま先ＩＫ', nameJa: 'つま先ＩＫ先', nameEn: 'ToeIKEnd', p:[0,0,-1]},
]},
{ lr: true, bones: [
{parentName: '上半身2', nameJa: 'パーツ１', nameEn: 'parts1', p:[1,0,0]},
{parentName: '_パーツ１', nameJa: 'パーツ２', nameEn: 'parts2', p:[0,1,0]},
]}
    ];
    const lrpre = [
      {nameJa: '右', nameEn: 'right', x: -1},
      {nameJa: '左', nameEn: 'left', x: 1},
    ];

    /**
     * 後ろから
     * @param {string} _str 
     * @returns {number}
     */
    const _search = (_str) => {
      let _index = -1;
      let num = bones.length;
      for (let _i = num - 1; _i >= 0; --_i) {
        const _b = bones[_i];
        if (_b.nameJa === _str) {
          _index = _i;
          break;
        }
      }
      return _index;
    };

    const armTypeBlockIndex = 2;
    for (let bi = 0; bi < blocks.length; ++bi) {
      const block = blocks[bi];
      for (let i = ((block.lr) ? 0 : 1); i < 2; ++i) {
        for (let j = 0; j < block.bones.length; ++j) {
          const one = block.bones[j];
          const bone = new PMX.Bone();
          let bits = 0;
          Object.assign(bone, {
            parentName: one.parentName.replace('_', lrpre[i].nameJa),
            nameJa: `${block.lr ? lrpre[i].nameJa : ''}${one.nameJa}`,
            nameEn: `${block.lr ? lrpre[i].nameEn : ''}${one.nameEn}`,
          });
          if (!bone.nameEn.endsWith('End')) {
            bits |= PMX.Bone.BIT_ROT | PMX.Bone.BIT_CONTROL | PMX.Bone.BIT_VISIBLE;
          }

          const index = bones.findIndex(b => b.nameJa === bone.parentName);
          let parentPos = new Vec3(0, 0, 0);
          if (index < 0) {
            console.warn('not found parent', bone.parentName);
          } else {
            bone.parent = index;
            parentPos = bones[index].position?.clone() || new Vec3(0,0,0);
          }
          // p は相対とした
          const diff = Vec3.fromArray(one.p);
          diff.x = diff.x * lrpre[i].x;
          bone.position = parentPos.clone().addInPlace(diff);
          bone.p = bone.position.asArray();
          bone._index = bones.length;

          //// IKボーン
          /** @type {string} */
          const nameJa = bone.nameJa;

          const isFootIK = nameJa.endsWith(`足ＩＫ`);
          const isToeIK = nameJa.endsWith(`つま先ＩＫ`);
          //console.log('nameJa', nameJa, isFootIK);
          if (isFootIK || isToeIK) {
            bits |= PMX.Bone.BIT_IK | PMX.Bone.BIT_MOVE;
            bone.ikTargetBone = _search(`${lrpre[i].nameJa}${isFootIK ? '足首' : 'つま先'}`);
            bone.ikLimitation = isFootIK ? 2 : 4; // radian
            bone.ikLoopCount = isFootIK ? 40 : 3; // loop
            for (let i2 = 0; i2 < (isFootIK ? 2 : 1); ++i2) {
              const link = new PMX.IKLink();
              let linkName = `${lrpre[i].nameJa}`;
              if (i2 === 0 && isFootIK) { // 角度制限
                link.isLimitation = 1;
                link.upper = [-5 * Math.PI / 180, 0, 0];
                link.lower = [-Math.PI, 0, 0];
                linkName += 'ひざ';
              } else {
                linkName += ['足首', '足'][i2];
              }
              link.linkBone = _search(linkName); // ひざ、足。足首。

              bone.ikLinks.push(link);
            }
          }

          bone._blockIndex = bi; // 保持しておく
          if (false) { // ローカル軸 TODO: 肩を含み手系は全部あるのかも
            // 実はローカル軸はGUIローカルにしか使用しないとか???
            // だとすると必須ではない
            const isLocalAxis = (bi === armTypeBlockIndex);
            if (isLocalAxis) {
              let boneVec = new Vec3(...bone.p);
              let child = null; // 子ボーンのうちどれかか、どこかの方向
              if (child) {
                let vec = child.subInPlace(boneVec).normalizeInPlace();
                let xv = vec;
                let yv = new Vec3(0, 1, 0);
                let zv = new Vec3(0, 0, 1); // 基本はZ軸(0,0,+1)。指もだいたいこれ
                // 親指０だけ異なる

                xv = yv.cross(zv).normalizeInPlace();
                yv = zv.cross(xv).normalizeInPlace();
                bone.xLocalVector = xv.asArray();
                bone.zLocalVector = zv.asArray();
                bits |= PMX.Bone.BIT_LOCALAXIS;
              }
            }
          }

          bone.bits = bits;
          bones.push(bone);
        }
      }
    }

    for (let i = 0; i < bones.length; ++i) {
      const bone = bones[i];
      // ローカル軸 TODO: 肩を含み手系は全部あるのかも
      // 実はローカル軸はGUIローカルにしか使用しないとか???
      // だとすると必須ではない
      const isLocalAxis = (bone._blockIndex === armTypeBlockIndex);
      if (isLocalAxis) {
        let boneVec = new Vec3(...bone.p);
        let childlen = this.searchChild(bones, bone.nameJa); // 子ボーンのうちどれかか、どこかの方向
        let child = (childlen.length >= 1) ? childlen[0] : null;
        if (child) {
          let vec = Vec3.fromArray(child.p).subInPlace(boneVec).normalizeInPlace();
          let xv = vec;
          let yv = new Vec3(0, 1, 0);
          let zv = new Vec3(0, 0, 1); // 基本はZ軸(0,0,+1)。指もだいたいこれ
          // 親指０だけ異なる

          yv = zv.cross(xv).normalizeInPlace();
          //yv = zv.cross(xv).normalizeInPlace();
          bone.xLocalVector = xv.asArray();
          bone.zLocalVector = zv.asArray();
          bone.bits |= PMX.Bone.BIT_LOCALAXIS;
        }
      }

    }

    return bones;
  }

  initMaterial() {
    let bits = 0
        | PMX.Material.BIT_GROUND
      //  | PMX.Material.BIT_TOMAP
      //  | PMX.Material.BIT_SELFSHADOW
        | PMX.Material.BIT_EDGE;

    const mtls = [];
    const mtl = new PMX.Material();
    Object.assign(mtl, {
      nameJa: `材質000`,
      nameEn: `material000`,
      texIndex: 0,
      diffuse: [1, 1, 1, 1],
      specular: [0.2, 0.2, 0.2],
      specPower: 0.5,
      ambient: [0.7, 0.7, 0.7],
      edgeColor: [156/255, 130/255, 48/255, 1],
      bitFlag: bits,
      sphereMode: PMX.Material.SPMODE_ADD,
      sphereIndex: 1,
      sharetoonflag: 0,
      sharetoonindex: -1,
      faces: [],
    });
    mtls.push(mtl);
    return mtls;
  }

  /**
   * 表情。定番とVRM1.0
   * @returns 
   */
  initEmotion() {
    const emos = [
{nameJa: 'あ', nameEn: 'aa', panel: PMX.Morph.PANEL_MOUTH},
{nameJa: 'い', nameEn: 'ih', panel: PMX.Morph.PANEL_MOUTH},
{nameJa: 'う', nameEn: 'ou', panel: PMX.Morph.PANEL_MOUTH},
{nameJa: 'え', nameEn: 'ee', panel: PMX.Morph.PANEL_MOUTH},
{nameJa: 'お', nameEn: 'oh', panel: PMX.Morph.PANEL_MOUTH},
{nameJa: 'まばたき', nameEn: 'blink', panel: PMX.Morph.PANEL_EYE},
{nameJa: '左ウインク', nameEn: 'blinkLeft', panel: PMX.Morph.PANEL_EYE},
{nameJa: '右ウインク', nameEn: 'blinkRight', panel: PMX.Morph.PANEL_EYE},
{nameJa: '喜び', nameEn: 'happy', panel: PMX.Morph.PANEL_EYE}, // 笑い?
{nameJa: '怒り', nameEn: 'angry', panel: PMX.Morph.PANEL_EYE},
{nameJa: '悲しみ', nameEn: 'sad', panel: PMX.Morph.PANEL_EYE},
{nameJa: '穏やか', nameEn: 'relaxed', panel: PMX.Morph.PANEL_EYE},
{nameJa: '驚き', nameEn: 'surprised', panel: PMX.Morph.PANEL_EYE},
{nameJa: '通常', nameEn: 'neutral'},
{nameJa: '上目遣い', nameEn: 'lookUp', panel: PMX.Morph.PANEL_EYE},
{nameJa: '下目遣い', nameEn: 'lookDown', panel: PMX.Morph.PANEL_EYE},
{nameJa: '左目線', nameEn: 'lookLeft', panel: PMX.Morph.PANEL_EYE},
{nameJa: '右目線', nameEn: 'lookRight', panel: PMX.Morph.PANEL_EYE},
    ];
    const emotions = [];
    for (const emo of emos) {
      const m = new PMX.Morph();
      m.nameJa = emo.nameJa;
      m.nameEn = emo.nameEn;
      m.panel = emo.panel;
      for (let i = 0; i < 1; ++i) {
        const vm = new PMX.VertexMorph();
        m.vertexMorphs.push(vm);
      }
      emotions.push(m);
    }

    return emotions;
  }

  /**
   * 配列を破壊で正規化
   * @param {number[]} vs 
   */
  normalize(vs) {
    let sum = vs.reduce((p, c) => p + c * c, 0);
    if (sum === 0) {
      return vs;
    }
    const k = 1 / Math.sqrt(sum);
    for (let i = 0; i < vs.length; ++i) {
      vs[i] *= k;
    }
    return vs;
  }

  /**
   * Z軸周り2次元回転
   * @param {number[]} vs 破壊
   * @param {number} deg 
   */
  rotate(vs, deg) {
    const ang = deg * Math.PI / 180;
    const cs = Math.cos(ang);
    const sn = Math.sin(ang);
    let x = vs[0] * cs - vs[1] * sn;
    let y = vs[0] * sn + vs[1] * cs;
    vs[0] = x;
    vs[1] = y;
    return vs;
  }

  /**
   * make() を実装
   * このインスタンスに保存する
   */
  make(param) {
    console.log('CharBuilder::make');

    this.debug = 1;

    this.head.nameEn = param.nameEn;
    this.head.nameJa = param.nameJa;
    this.head.commentEn = param.commentEn;
    this.head.commentJa = param.commentJa;

    {
      this.textures = param.textures;
    }

    { // モーフ 3個
      for (let i = 0; i < 3; ++i) {
        const m = new PMX.Morph();
        m.nameJa = `mr${i}`;
        m.nameEn = `mr${i}`;
        m.type = PMX.Morph.TYPE_MATERIAL;
        m.panel = PMX.Morph.PANEL_ETC;
        const mm = new PMX.MaterialMorph();
        mm.calcType = PMX.MaterialMorph.CALC_MUL;
        mm.setValue(1); // すべてを1にする
        m.materialMorphs.push(mm);
        switch (i) {
        case 0:
          m.nameEn = 'rmul';
          mm.tex = [0, 1, 1, 1];
          break;
        case 1:
          m.nameEn = 'gmul';
          mm.tex = [1, 0, 1, 1];
          break;
        case 2:
          m.nameEn = 'bmul';
          mm.tex = [1, 1, 0, 1];
          break;
        }
        m.nameJa = m.nameEn;
        this.morphs.push(m);
      }
    }

    { // ボーングループフレーム
      const _bones = [...this.bones];

      /** 条件を満たすボーンのインデックスの配列を得る。 _func(b: PMX.Bone): boolean */
      const _sel = (_func) => {
        const ret = [];
        for (let j = 0; j < _bones.length; ++j) {
          if (_bones[j] == null) {
            continue;
          }
          if (_func(_bones[j])) {
            _bones[j] = null;
            ret.push(j);
          }
        }
        return ret;
      };

      for (let i = 0; i < 9; ++i) {
        const f = new PMX.Frame();
        f.nameJa = 'その他のボーン';
        f.nameEn = `fr00${i}`;
        f.bones = [];
        f.specialFlag = 0;
        if (i === 0) {
          f.nameJa = 'Root';
          f.nameEn = 'Root';
          f.specialFlag = 1;
          f.bones.push(0);

          _bones[0] = null;
        } else if (i === 1) {
          f.nameJa = '表情';
          f.specialFlag = 1;
          for (let j = 0; j < this.morphs.length; ++j) {
            f.morphs.push(j);
          }
        } else if (i === 2) {
          f.nameJa = 'ＩＫ';
          f.nameEn = 'IK';
          for (let j = 0; j < _bones.length; ++j) {
            const b = _bones[j];
            if (!b) {
              continue;
            }
            if (b.nameJa.includes('ＩＫ')) {
              f.bones.push(j);
              _bones[j] = null;
            }
          }
        } else if (i === 3) {
          f.nameJa = 'センター';
          f.bones.push(..._sel(b =>
            ['センター'].includes(b.nameJa)
          ));
        } else if (i === 4) {
          f.nameJa = '体(下)';
          f.bones.push(..._sel(b =>
            ['下半身'].includes(b.nameJa)
          ));  
        } else if (i === 5) {
          f.nameJa = '体(上)';
          f.bones.push(..._sel(b =>
            ['首', '頭', '上半身', '上半身2'].includes(b.nameJa)
          ));
        } else if (i === 6) {
          f.nameJa = '腕';
          f.bones.push(..._sel(b => {
            for (const _k of ['肩', 'ひじ', '手首']) {
              if (b.nameJa.endsWith(_k)) {
                return true;
              }
            }
            return false;
          }));
        } else if (i === 7) {
          f.nameJa = 'パーツ';
          f.bones.push(..._sel(b => {
            for (const _k of ['パーツ']) {
              if (b.nameJa.endsWith(_k)) {
                return true;
              }
            }
            return false;
          }));
        } else {
          f.bones.push(..._sel(b => true));
        }
        this.frames.push(f);
      }
    }

    {
      this.indexed();

      const num = this.bones.length;
      for (let i = 0; i < num; ++i) {
        const bone = this.bones[i];
        const param = {
          radius: 0.25, // 共通で 0.5 だが大きいので小さくする。指はもっと小さく
          hhalf: 0.25,
          bonea: bone,
          boneb: bone, // TODO: 同じもの渡している
          vertices: this.vts,
          faces: this.materials[0].faces,
          index: i,
        };
        const nameJa = bone.nameJa;
        const nameEn = bone.nameEn;
        if (nameEn.endsWith('End')) {
          continue; // ～先 にのるメッシュは無い
        }

        if (nameJa.includes('指')) {
          param.radius = CharBuilder.FINGER_INTERVAL * 0.5;
          param.hhalf = CharBuilder.FINGER_INTERVAL * 0.5;
        }

        if (nameJa.includes('ひじ') || nameJa.includes('ひざ')) {
          delete param.radius;
          delete param.hhalf;
          if (nameJa.includes('ひざ')) {
            param.zrot = 0;
          }
          this.makeMobius(param);
        } else {
          this.makeJoint(param);
        }

        if (false) { // TODO: ボーンメッシュのように
          this.makeCyl(param);
        }

      }
    }

  }

  /**
   * 現在のボーンの配列に対して、end 情報を決定する
   * 標準的な移動可能ボーンにビットを付与する
   */
  indexed() {
    console.log('indexed', this.bones);
    {
      const num = this.bones.length;
      for (let i = 0; i < num; ++i) {
        const bone = this.bones[i];
        //bone._index = i;

        const cs = this.searchChild(this.bones, bone.nameJa);
        /** *End があったら優先する @type {PMX.Bone} */
        let end = cs.find(_b => _b.nameEn.endsWith('End'));
        if (!end && cs.length >= 1) {
          end = cs[0];
        }
        const index = end?._index ?? -1;

        if (index >= 0) {
          bone.endBoneIndex = index;
          bone.bits |= PMX.Bone.BIT_BONECONNECT;
        } else {
          bone.endOffset = [0, 0, -1];
        }

        switch (bone.nameJa) {
        case '全ての親':
        case '操作中心':
        case 'センター':
          bone.bits |= PMX.Bone.BIT_MOVE;
          break;
        }

      }
    }
  }

  /**
   * 変形無しの物理シンプルな箱
   */
  makeBox(param) {
    const lenhalf = param.lenhalf || 1;
    const boneIndex = param.boneIndex || 0;
    {
      const vs = [
        {p: [-1, 1, -1]}, // 手前
        {p: [ 1, 1, -1]},
        {p: [-1,-1, -1]}, // z
        {p: [ 1,-1, -1]}, // 手前 下
        {p: [-1, 1,  1]}, // 4 奥上
        {p: [ 1, 1,  1]}, // 5
        {p: [-1,-1,  1]}, // 6
        {p: [ 1,-1,  1]}, // 7
      ];
      /** UV用 */
      const k = 0.25;
      const mens = [
        {p: [0, 1, 2, 3], n: [0, 0, -1], uv: [k * 2, k * 2, k * 3, k * 2, k * 2, k * 1, k * 3, k * 1,]},
        {p: [4, 0, 6, 2], n: [-1, 0, 0], uv: [k * 1, k * 2, k * 2, k * 2, k * 1, k * 1, k * 2, k * 1,]},
        {p: [1, 5, 3, 7], n: [1, 0, 0], uv: [k * 3, k * 2, k * 4, k * 2, k * 3, k * 1, k * 4, k * 1,]},
        {p: [4, 5, 0, 1], n: [0, 1, 0], uv: [k * 2, k * 3, k * 3, k * 3, k * 2, k * 2, k * 3, k * 2,]},
        {p: [2, 3, 6, 7], n: [0, -1, 0], uv: [k * 2, k * 1, k * 3, k * 1, k * 2, k * 0, k * 3, k * 0,]},
        {p: [5, 4, 7, 6], n: [0, 0, 1], uv: [k * 2, k * 2, k * 3, k * 2, k * 2, k * 1, k * 3, k * 1,]},
      ];

      for (const men of mens) {
        for (let j = 0; j < 4; ++j) {
          const vp = vs[men.p[j]];

          const v = new PMX.Vertex();

          let x = vp.p[0];
          let y = vp.p[1];
          let z = vp.p[2];

          v.n = this.normalize(men.n);
          v.p = [
            x * scale * 1,
            y * scale * lenhalf,
            z * scale * 1,
          ];
          v.uv = [
            men.uv[j*2+0],
            men.uv[j*2+1],
          ];
          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [boneIndex, 0, 0, 0];
          v.weights = [1, 0, 0, 0];

          this.vts.push(v);
        }
      }
    }

  }

  /**
   * ジョイントとして使用している → makeJoint へ移行
   * シリンダー形状
   * ボーン2つ渡しているがウエイト割り当てしていない
   * @param {IParam} param 
   */
  makeCyl(param) {
    const hdiv = param.hdiv || 8;
    const vdiv = param.vdiv || 4;
    const hhalf = param.hhalf || 1;
    const radius = param.radius || 1;
    const index = param.index || 0;
    /** @type {PMX.Bone} */
    const bonea = param.bonea;
    const boneb = param.boneb;

    const vts = param.vertices;
    const startIndex = vts.length;
    const faces = param.faces;


    const stepnum = 8;
    const rsc = (1 / stepnum) * 0.5 * 0.5;
    const offsetu = 0.5 + ((index % stepnum) * 2 + 1) * rsc;
    const offsetv = (Math.floor(index / stepnum) * 2 + 1) * rsc;

    for (let i = 0; i <= vdiv; ++i) { // 上から下か
      const vang = i * Math.PI / vdiv;
      let rr = Math.sin(vang);

      const ratey = (i - vdiv * 0.5) / (vdiv * 0.5);
      for (let j = 0; j <= hdiv; ++j) {
        const ratex = (j - hdiv * 0.5) / (hdiv * 0.5);

        const hang = (j % hdiv) * Math.PI * 2 / hdiv;

        const cs = Math.cos(hang);
        const sn = Math.sin(hang);

        const v = new PMX.Vertex();

        let x = -sn * rr;
        let y = Math.cos(vang);
        let z = cs * rr;

        v.n = this.normalize([x, y, z]);
        v.p = [
          x * radius + bonea.p[0],
          y * hhalf  + bonea.p[1],
          z * radius + bonea.p[2],
        ];
        v.uv = [
          ratex * rsc + offsetu,
          ratey * rsc + offsetv,
        ];
        v.deformType = PMX.Vertex.DEFORM_BDEF2;
        v.joints = [bonea._index, boneb._index, 0, 0];
        v.weights = [1, 0, 0, 0];

        vts.push(v);
      }
    }

    for (let i = 0; i < vdiv; ++i) {
      for (let j = 0; j < hdiv; ++j) {
        const v0 = (hdiv + 1) * i + j + startIndex;
        const v1 = v0 + 1;
        const v2 = v0 + (hdiv + 1);
        const v3 = v2 + 1;
        faces.push([v0, v1, v2]);
        faces.push([v2, v1, v3]);
      }
    }

  }

  /**
   * 使用していない。シリンダー形状
   * @param {IParam} param
   * @param {()=>number} param.rfunc
   * @param {number} param.hnum 垂直方向の点数
   * @param {(index:number)=>number} param.hfunc
   */
  makeCyl2(param) {
    const hdiv = param.hdiv || 8;
    const vdiv = param.vdiv || 4;
    const hhalf = param.hhalf || 1;
    /** UV分割領域のインデックス */
    const index = param.index || 0;
    /** @type {PMX.Bone} */
    const bonea = param.bonea;
    const boneb = param.boneb;

    const vts = param.vertices;
    const startIndex = vts.length;
    const faces = param.faces;


    const stepnum = 8;
    const rsc = (1 / stepnum) * 0.5 * 0.5;
    const offsetu = 0.5 + ((index % stepnum) * 2 + 1) * rsc;
    const offsetv = (Math.floor(index / stepnum) * 2 + 1) * rsc;

    for (let i = 0; i < param.hnum; ++i) { // 上から下か
      const vang = i * Math.PI / vdiv;
      let rr = param.rfunc(i);

      const ratey = (i - vdiv * 0.5) / (vdiv * 0.5);
      for (let j = 0; j <= hdiv; ++j) {
        const ratex = (j - hdiv * 0.5) / (hdiv * 0.5);

        const hang = (j % hdiv) * Math.PI * 2 / hdiv;

        const cs = Math.cos(hang);
        const sn = Math.sin(hang);

        const v = new PMX.Vertex();

        let x = -sn * rr;
        let y = param.hfunc(j);
        let z =  cs * rr;

        v.n = this.normalize([x, y, z]);
        v.p = [
          x * radius + bonea.p[0],
          y * hhalf + bonea.p[1],
          z * radius + bonea.p[2],
        ];
        v.uv = [
          ratex * rsc + offsetu,
          ratey * rsc + offsetv,
        ];
        v.deformType = PMX.Vertex.DEFORM_BDEF2;
        v.joints = [bonea._index, boneb._index, 0, 0];
        v.weights = [1, 0, 0, 0];

        vts.push(v);
      }
    }

    for (let i = 0; i < param.hnum - 1; ++i) {
      for (let j = 0; j < hdiv; ++j) {
        const v0 = (hdiv + 1) * i + j + startIndex;
        const v1 = v0 + 1;
        const v2 = v0 + (hdiv + 1);
        const v3 = v2 + 1;
        faces.push([v0, v1, v2]);
        faces.push([v2, v1, v3]);
      }
    }

  }

  /**
   * ジョイントとして使用している
   * シリンダー形状
   * ボーン2つ渡しているがウエイト割り当てしていない
   * @param {IParam} param 
   */
  makeJoint(param) {
    const hdiv = param.hdiv || 16;
    const vdiv = param.vdiv || 8;
    const hhalf = param.hhalf || 1;
    const radius = param.radius || 1;
    const index = param.index || 0;
    /** @type {PMX.Bone} */
    const bonea = param.bonea;
    const boneb = param.boneb;

    const vts = param.vertices;
    const startIndex = vts.length;
    const faces = param.faces;

    for (let i = 0; i <= vdiv; ++i) { // 上から下か
      const vang = i * Math.PI / vdiv;
      let rr = Math.sin(vang);

      const ratey = (i - vdiv * 0.5) / (vdiv * 0.5);
      for (let j = 0; j <= hdiv; ++j) {
        const ratex = (j - hdiv * 0.5) / (hdiv * 0.5);

        const hang = (j % hdiv) * Math.PI * 2 / hdiv;

        const cs = Math.cos(hang);
        const sn = Math.sin(hang);

        const v = new PMX.Vertex();

        let x = -sn * rr;
        let y = Math.cos(vang);
        let z =  cs * rr;

        // TODO: 回転

        v.n = this.normalize([x, y, z]);
        v.p = [
          x * radius + bonea.p[0],
          y * hhalf  + bonea.p[1],
          z * radius + bonea.p[2],
        ];

        v.uv = TexMaker.subTex8(
          ((j - hdiv / 2) / hdiv) * 0.75 + 0.5,
          ((i - vdiv / 2) / vdiv) * 0.75 + 0.5,
          CharBuilder.INDEX_OWNJOINT);
        v.deformType = PMX.Vertex.DEFORM_BDEF2;
        v.joints = [bonea._index, boneb._index, 0, 0];
        v.weights = [1, 0, 0, 0];

        vts.push(v);
      }
    }

    for (let i = 0; i < vdiv; ++i) {
      for (let j = 0; j < hdiv; ++j) {
        const v0 = (hdiv + 1) * i + j + startIndex;
        const v1 = v0 + 1;
        const v2 = v0 + (hdiv + 1);
        const v3 = v2 + 1;
        faces.push([v0, v1, v2]);
        faces.push([v2, v1, v3]);
      }
    }

  }

  /**
   * 
   * @param {IParam} param 
   */
  makeMobius(param) {
    console.log('makeMobius');
    const hdiv = param.hdiv || 32;
    const radius = param.radius || 0.5;
    const bonea = param.bonea;
    const isLeft = (bonea.p[0] > 0);

    const localRotAng = param.zrot ?? Math.atan2(
      CharBuilder.ANX,
      CharBuilder.ANY,
    ) * (isLeft ? 1 : -1);

    const boneIndex = param.index;
    const hhalf = 0.25;
    const dhalf = hhalf * 0.25;
    const vs = [
      {p: [0, hhalf,  dhalf]}, // 上外
      {p: [0, hhalf, -dhalf]}, // 上内
      {p: [0,-hhalf, -dhalf]}, // 下内
      {p: [0,-hhalf,  dhalf]}, // 下外
      {p: [0, hhalf,  dhalf]}, // 上外
    ]; // NOTE: 法線分離するかなあ
    vs.forEach(v => {
      v.pos = Vec3.fromArray(v.p);
      v.n = v.pos.clone().normalizeInPlace();
    });

    const vts = param.vertices;
    const faces = param.faces;
    let startIndex = vts.length;
    for (let i = 0; i <= hdiv; ++i) {
      const twistAng = - Math.PI * i / hdiv;
      const roundAng = 2 * Math.PI * (i % hdiv) / hdiv * (isLeft ? -1 : 1);
      for (let j = 0; j <= 4; ++j) {
        const v = vs[j];

        let pv = v.pos.clone();
        let nv = v.n.clone();

        // □ を X+ ang で回転、n も回転 
        const twistQ = Quat.axisRot(new Vec3(1, 0, 0), twistAng);
        pv = twistQ.rotate(pv);
        nv = twistQ.rotate(nv);

        // 位置を半径分 Z+ へ移動
        pv.addInPlace(new Vec3(0, 0, radius));

        // □ と n を Y+ ang で回転
        const roundQ = Quat.axisRot(new Vec3(0, 1, 0), roundAng);
        pv = roundQ.rotate(pv);
        nv = roundQ.rotate(nv);

        // ボーンローカル回転してボーンの位置に移動
        const boneQ = Quat.axisRot(new Vec3(0, 0, 1), localRotAng);
        pv = boneQ.rotate(pv);
        nv = boneQ.rotate(nv);

        pv.addInPlace(Vec3.fromArray(bonea.p));

        const vtx = new PMX.Vertex();
        vtx.p = pv.asArray();
        vtx.n = nv.asArray();
        let subu = (j / 4);
        let subv = (i / hdiv);
        vtx.uv = TexMaker.subTex8(subu, subv, CharBuilder.INDEX_MOBIUS);
        vtx.joints = [boneIndex, 0, 0, 0];
        vts.push(vtx);
      }
    }

    // 面の追加
    for (let i = 0; i < hdiv; ++i) {
      const v0 = i * 5 + startIndex;
      const v1 = v0 + 1;
      const v2 = v0 + 2;
      const v3 = v0 + 3;
      const v0b = v0 + 4;
      const v4 = v0 + 5; // 次
      const v5 = v4 + 1;
      const v6 = v4 + 2;
      const v7 = v4 + 3;
      const v4b = v4 + 4;

      const fs = [
      [v0, v1, v4],
      [v4, v1, v5],
      [v1, v2, v5],
      [v5, v2, v6],
      [v2, v3, v6],
      [v6, v3, v7],
      [v3, v0b, v7],
      [v7, v0b, v4b],
      ];

      if (!isLeft) {
        fs.forEach(fi => {
          const tmp = fi[1];
          fi[1] = fi[2];
          fi[2] = tmp;
        });
      }
      faces.push(...fs);
    }

    console.log('makeMobius');
  }

}
