
import { TexMaker } from './texmaker.js';

/**
 * @typedef IParam
 * @property {number} hdiv 水平側分割数
 * @property {number} vdiv 垂直側分割数
 * @property {PMX.Bone} bonea 根本側
 * @property {PMX.Bone} boneb 先側
 * @property {PMX.Vertex[]} vertices これまでの頂点が格納されていて追加する先の配列
 * @property {number[][]} faces 追加する先の配列。3頂点インデックスの配列
 * @property {number} radius 半径
 * @property {number} hhalf 縦長さの半分
 * @property {number[]} intl 最初の平行移動。
 * @property {number[]} modelrot ボーン位置反映前の回転
 * @property {number?} subindex8 8x8分割の場合の基準インデックス
 * @property {[number,number,number]?} col6 存在する場合、色固定(0～5)
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

  /**
   * radian euler を返す
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  eulerForDropRing() {
    const tov = this.clone().normalizeInPlace();
    const ret = new Vec3(0, 0, 0);
    ret.x = Math.acos(-tov.y);
    ret.y = Math.atan2(-tov.x, -tov.z);
    return ret;
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

  static euler(es) {
    const ret = Quat.axisRot(new Vec3(0, 1, 0), es[1] * Math.PI / 180)
      .mul(Quat.axisRot(new Vec3(1, 0, 0), es[0] * Math.PI / 180))
      .mul(Quat.axisRot(new Vec3(0, 0, 1), es[2] * Math.PI / 180));
    return ret;
  }
} 

export class CharBuilder extends PMX.Maker {
  static VERSION = '0.1.2';

  /** 8x8 uv インデックス */
  static INDEX_OWNJOINT = 1;
  /** 8x8 uv インデックス */
  static INDEX_MOBIUS = 2;
  /** ボーンにのっかるメッシュのサブテクスチャインデックス */
  static INDEX_OWNBONE = 3;
  /** トンネル表と裏 */
  static INDEX_TUNNEL8 = 8;
  /** トンネル表と裏 */
  static INDEX_TUNNEL9 = 9;
  /** トンネル表と裏 */
  static INDEX_TUNNEL10 = 10;
  static INDEX_TUNNEL11 = 11;

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

    const thumbs = {
      tow0: [fx, -fy, -fit * 3],
      tow0rate: 1,

      to01: [fx, -fy, 0],
      to01rate: 1,
      to01x: [1, 0, 0],
      to01z: [0, 0, 0.9],
  
      to12: [fx, -fy, 0],
      to12rate: 1,
      to12x: [1, 0, 0],
      to12z: [0, 0, 1], // 実質これ

      //to2e: [fx, -fy, 0],
      to2e: [0.523, -0.852, -0.038],
      to2erate: 0.264, // 実値 [0.138, -0.225, -0.010] ぐらい
      to2x: [1, 0, 0],
      to2z: [0, 0, 1], // 実質これ
    };
    thumbs.endOffset = thumbs.to2erate; // 同じ量を伸ばす

    const blocks = [
{ lr: false, bones: [
{ parentName: '', nameJa: '全ての親', nameEn: 'root', p:[0,0,0] },
{ parentName: '全ての親', nameJa: '操作中心', nameEn: 'view cnt bone', p:[0,0,0] },
{ parentName: '全ての親', nameJa: 'センター', nameEn: 'center', p:[0, 8, 0] },
{ parentName: 'センター', nameJa: 'グルーブ', nameEn: 'groove', p:[0, 1, 0] },
{ parentName: 'グルーブ', nameJa: '腰', nameEn: 'waist', p:[0, 3, 0] },
{ parentName: '腰', nameJa: '下半身', nameEn: 'spine', p: [0, 1, 0] },
{ parentName: '下半身', nameJa: '上半身', nameEn: 'chest', p:[0, 0.2, 0] },
{ parentName: '上半身', nameJa: '上半身2', nameEn: 'upperChest', p:[0, 2.8, 0] },
{ parentName: '上半身2', nameJa: '首', nameEn: 'neck', p:[0, 0.5, 0] },
{ parentName: '首', nameJa: '頭', nameEn: 'head', p:[0, 1, 0] }, // #7
]},
{ lr: true, bones: [
{parentName: '下半身',nameJa: '足', nameEn: 'UpperLeg', p:[1, -2, 0]}, // NOTE: 少し下げる
{parentName: '_足',nameJa: 'ひざ', nameEn: 'LowerLeg', p:[0,-5,0]},
{parentName: '_ひざ',nameJa: '足首', nameEn: 'Foot', p:[0,-5,0]},
{parentName: '_足首',nameJa: 'つま先', nameEn: 'Toe', p:[0,0,-1]},
]},
{ lr: true, bones: [
{parentName: '上半身2',nameJa: '肩', nameEn: 'Shoulder', p:[0.5,0,0]},
{parentName: '_肩',nameJa: '腕', nameEn: 'UpperArm', p:[0.5,0,0]},
{parentName: '_腕',nameJa: 'ひじ', nameEn: 'LowerArm', p:[ax * 2,-ay * 2,0]},
{parentName: '_ひじ',nameJa: '手首', nameEn: 'Hand', p:[ax * 2,-ay * 2,0]},
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

{parentName: '_手首',nameJa: '親指０', nameEn: 'ThumbMetacarpal', p: thumbs.tow0,
  x: thumbs.to01x, z: thumbs.to01z,
},
{parentName: '_親指０',nameJa: '親指１', nameEn: 'ThumbProximal', p: thumbs.to01,
  x: thumbs.to12x, z: thumbs.to12z,
},
{parentName: '_親指１',nameJa: '親指２', nameEn: 'ThumbDistal', p: thumbs.to12,
  x: thumbs.to2ex, z: thumbs.to2ez,
},
{parentName: '_親指２',nameJa: '親指先', nameEn: 'ThumbEnd', p: thumbs.to2e,
  endOffset: [0, 0, 0],
},
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
{parentName: '上半身2', nameJa: 'パーツ１', nameEn: 'Parts1', p:[1,0,2]},
{parentName: '_パーツ１', nameJa: 'パーツ２', nameEn: 'Parts2', p:[0,1,0.5]},
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
      specular: [0.7, 0.7, 0.7],
      specPower: 10, // 0.5
      ambient: [0.3, 0.3, 0.3],
      edgeColor: [102/255, 102/255, 0/255, 1],
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
   * Z軸周り2次元回転
   * @param {number[]} vs 破壊
   * @param {number} deg 
   */
  /*
  rotate(vs, deg) {
    const ang = deg * Math.PI / 180;
    const cs = Math.cos(ang);
    const sn = Math.sin(ang);
    let x = vs[0] * cs - vs[1] * sn;
    let y = vs[0] * sn + vs[1] * cs;
    vs[0] = x;
    vs[1] = y;
    return vs;
  } */

  /**
   * ボーンの向いている方向
   * @param {PMX.Bone} bone 
   * @param {PMX.Bone[]} bones
   */
  boneDir(bone, bones) {
    if (bone.bits & PMX.Bone.BIT_BONECONNECT & bone.endBoneIndex >= 0) {
      const endBone = bones[bone.endBoneIndex];
      return Vec3.fromArray(endBone.p).subInPlace(Vec3.fromArray(bone.p));
    }
    return Vec3.fromArray(bone.endOffset);
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

      for (let i = 0; i < 10; ++i) {
        const f = new PMX.Frame();
        f.nameJa = 'その他';
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
            ['センター', 'グルーブ', '腰', '操作中心'].includes(b.nameJa)
          ));
        } else if (i === 4) {
          f.nameJa = '体(下)';
          f.bones.push(..._sel(b => {
            for (const _k of ['下半身', '足', 'ひざ', '足首', 'つま先']) {
              if (b.nameJa.endsWith(_k)) {
                return true;
              }
            }
            return false;
          }));  
        } else if (i === 5) {
          f.nameJa = '体(上)';
          f.bones.push(..._sel(b => {
            for (const _k of ['首', '頭', '上半身', '上半身2']) {
              if (b === _k) {
                return true;
              }
            }
            for (const _k of ['目']) {
              if (b.nameJa.endsWith(_k)) {
                return true;
              }
            }
            return false;
          }));
        } else if (i === 6) {
          f.nameJa = '腕';
          f.bones.push(..._sel(b => {
            for (const _k of ['肩', '腕', 'ひじ', '手首']) {
              if (b.nameJa.endsWith(_k)) {
                return true;
              }
            }
            return false;
          }));
        } else if (i === 7) {
          f.nameJa = '指';
          f.bones.push(..._sel(b => b.nameJa.includes('指')));
        } else if (i === 8) {
          f.nameJa = 'パーツ';
          f.bones.push(..._sel(b => {
            for (const _k of ['パーツ']) {
              if (b.nameJa.includes(_k)) {
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

    { // トンネルの厚み
      const thickTun = 0.06;
      // ピン半径
      const rpin = 3 / 80 * 12 * 0.5;

      this.indexed();
      /** (0, -1, 0) をZ+に回すときの回転量 */
      const armang = Math.atan2(CharBuilder.ANX, CharBuilder.ANY);

      const num = this.bones.length;
      for (let i = 0; i < num; ++i) {
        const bone = this.bones[i];
        const param = {
          radius: 0.125, // 指はもっと小さく
          hhalf: 0.125,
          bonea: bone,
          boneb: ((bone.bits & PMX.BIT_BONECONNECT) != 0 && bone.endBoneIndex >= 0)
            ? this.bones[bone.endBoneIndex] : bone,
          vertices: this.vts,
          faces: this.materials[0].faces,
          index: i,
        };
        const nameJa = bone.nameJa;
        const nameEn = bone.nameEn;
        if (nameEn.endsWith('End')) {
          continue; // ～先 にのるメッシュは無い
        }

        let isBone = 'sphere';
        if (nameJa.includes('ＩＫ')) { // 全角
          isBone = '';
        } else if (nameJa.includes('指')) {

          if (nameJa.includes('親')) {

            param.radius = CharBuilder.FINGER_INTERVAL * 0.5;
            param.hhalf = CharBuilder.FINGER_INTERVAL * 0.5;
            const dirv = this.boneDir(bone, this.bones);
            dirv.x = Math.abs(dirv.x); // NOTE: 中で判定するので正に揃える
            param.modelrot = dirv.eulerForDropRing().asArray();
            this.makeJoint(param);

            isBone = false;
            param.hradius = param.radius * 2;
            param.intl = [0, -0.125, 0];
            this.makeSphere(param);

          } else {

            param.radius = CharBuilder.FINGER_INTERVAL * 0.5;
            param.hhalf = CharBuilder.FINGER_INTERVAL * 0.5;
            param.modelrot = [0, 0, armang];
            this.makeJoint(param);

            isBone = false;
            param.hradius = param.radius * 2;
            param.intl = [0, -0.125, 0];
            this.makeSphere(param);

          }

        } else if (nameJa.includes('腕')) {
          param.intl = [0, -1, 0];
          param.modelrot = [0, Math.PI, - armang];

          param.col6 = [5, 5, 4];
          param.thick = thickTun;
          param.whalf = 0.2;
          param.winterval = 0.1;
          param.dhalf = 0.2;
          param.hhalf = 0.6;
          param.cutout = 0.05;
          param.cutin = 0.025;
          this.makeTun(param);

          param.radius = 0.125;
          param.hhalf = 0.125;

        } else if (nameJa.includes('ひじ')) {
          param.radius = 0.5;
          param.hhalf = 0.25;
          this.makeMobius(param);

          param.intl = [0, -1, 0];
          param.modelrot = [
            0, Math.PI,
            - Math.atan2(
              CharBuilder.ANX,
              CharBuilder.ANY,
            )];

          param.thick = thickTun;
          param.col6 = [5, 5, 4];
          param.whalf = 0.2;
          param.winterval = 0.1;
          param.dhalf = 0.2;
          param.hhalf = 0.75;
          param.cutout = 0.05;
          param.cutin = 0.025;
          this.makeTun(param);

          param.radius = 0.125;
          param.hhalf = 0.125;

        } else if (nameJa.includes('パーツ')) {
          //this.makeJoint(param);

          param.sepface = 1;
          param.whalf = 0.5;
          param.hhalf = 2;
          //param.dhalf = 0.125;
          param.dhalf = 0;
          param.modelrot = [
            -30 * Math.PI / 180,
            10 * Math.PI / 180,
            10 * Math.PI / 180,
          ];
          //this.makeBox(param);
          if (nameJa.includes('左パーツ')) {
            this.makeBebel1(param);
          } else {
            param.sepface = -1;
            this.makeBebel1(param);
          }

          isBone = '';
        } else if (nameJa.includes('頭')) {
          isBone = false;
          param.whalf = 0.75;
          param.hhalf = 0.75;
          param.dhalf = 0.75;
          this.makeHead(param);
        } else if (nameJa.includes('目')) {
          isBone = false;
          param.intl = [0, 0, -0.5];
          param.hhalf = 0.1;
          param.col6 = [2, 2, 2];
          this.makeEye(param);
        } else if (nameJa.includes('上半身2')) { // 2 は半角
          isBone = false;
          param.whalf = 1;
          param.hhalf = 1;
          param.dhalf = 1;
          this.makeBody(param);
        } else if (nameJa.includes('足首')) {

          this.makeCyl(param);

        } else if (nameJa.includes('足')) {
          param.intl = [0, -3, 0];
          param.whalf = 0.6;
          param.winterval = 0.3;
          param.thick = 0.1;
          param.dhalf = 0.5;
          param.hhalf = 2;
          param.cutout = 0.05;
          param.cutin = 0.025;
          this.makeTun(param);


          param.intl = [0, 0.02, 0];
          param.thick = rpin / 3 * 2;
          param.whalf = rpin + param.thick;
          param.winterval = param.thick / 4;

          param.dhalf = param.whalf;
          param.hhalf = param.whalf * 0.5;
          param.cutout = param.whalf * (2 - Math.sqrt(2));
          param.cutin = rpin * (2 - Math.sqrt(2));       
          this.makeTun(param);

          isBone = 'pin';
          param.hradius = 0.04;

        } else if (nameJa.includes('ひざ')) {
          param.radius = 0.5;
          param.hhalf = 0.25;
          param.zrot = 0;
          this.makeMobius(param);

          param.thick = thickTun;
          param.intl = [0, -2, 0];
          param.subindex8 = CharBuilder.INDEX_TUNNEL8;
          //param.col6 = [5, 5, 4];
          param.whalf = 0.3;
          param.winterval = 0.1;
          param.dhalf = 0.3;
          param.hhalf = 1.4; // TODO: 
          param.cutout = 0.05;
          param.cutin = 0.025;
          this.makeTun(param);

          param.radius = 0.125;
          param.hhalf = 0.125;

        } else if (nameJa.includes('手')) {
          param.modelrot = [0, 0, armang];
          this.makeJoint(param);
          isBone = '';
          this.makeHand(param);
        } else {
          this.makeJoint(param);
        }


        if (isBone === 'sphere') { // ボーンメッシュのように
          param.intl = [0, -0.25, 0];
          param.hradius = param.radius * 2;
          this.makeSphere(param);
        } else if (isBone === 'pin') {
          param.intl = [0, -0.25, 0];
          param.hhalf = param.radius * 2;
          param.radius = rpin * 15 / 16; // 少し小さくした
          param.vdiv = 4;
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
        case 'グルーブ':
          bone.bits |= PMX.Bone.BIT_MOVE;
          break;
        }

      }
    }
  }

  /**
   * サポート関数。今 isLeft は中で判定している
   * @param {number[]} p 
   * @param {number[]} n 
   * @param {number[]} intl 平行移動量
   * @param {number[]} modelrot model z, x, y の順
   * @param {PMX.Bone} bonea 
   * @param {PMX.Vertex} vt 反映先
   */
  applyEuler(p, n, intl, modelrot, bonea, vt) {
    const isLeft = (bonea.p[0] > 0);

    let pv = Vec3.fromArray(p);
    let nv = Vec3.fromArray(n);
    pv.addInPlace(Vec3.fromArray(intl));

    // モデル座標回転
    const zq = Quat.axisRot(Vec3.fromArray([0, 0, 1]),
      modelrot[2] * (isLeft ? 1 : -1));
    const xq = Quat.axisRot(Vec3.fromArray([1, 0, 0]), modelrot[0]);
    const yq = Quat.axisRot(Vec3.fromArray([0, 1, 0]),
      modelrot[1] * (isLeft ? 1 : -1));
    const eq = yq.mul(xq).mul(zq);
    pv = eq.rotate(pv);
    nv = eq.rotate(nv);

    pv.addInPlace(Vec3.fromArray(bonea.p));
    vt.p = pv.asArray();
    vt.n = nv.normalizeInPlace().asArray();

    vt.deformType = PMX.Vertex.DEFORM_BDEF1;
    vt.joints = [bonea._index, 0, 0, 0];
    vt.weights = [1, 0, 0, 0];
  }

  /**
   * 変形無しの物理シンプルな箱
   * 面ごとに頂点を分割する場合。これだとエッジがおかしくなる
   * 法線を位置で補正してエッジの問題を回避したもの
   * @param {IParam} param 
   */
  makeBox(param) {
    const radius = param.radius || 1;
    const bonea = param.bonea;
    const boneIndex = bonea._index;
    const isLeft = (bonea.p[0] > 0);
    const whalf = param.whalf || radius;
    const hhalf = param.hhalf || radius;
    const dhalf = param.dhalf || radius;
    const intl = param.intl || [0, 0, 0];
    const modelrot = param.modelrot || [0, 0, 0];
    {
      const vs = [
        {p: [-1, 1, -1]}, // 0 手前
        {p: [ 1, 1, -1]}, // 1
        {p: [-1,-1, -1]}, // 2 z
        {p: [ 1,-1, -1]}, // 3 手前 下
        {p: [-1, 1,  1]}, // 4 奥上
        {p: [ 1, 1,  1]}, // 5
        {p: [-1,-1,  1]}, // 6
        {p: [ 1,-1,  1]}, // 7
      ];
      /** UV用 */
      const k = 0.25;
      const mens = [
        {p: [0, 1, 2, 3], n: [ 0,  0, -1], uv: [k * 2, k * 2, k * 3, k * 2, k * 2, k * 1, k * 3, k * 1,]},
        {p: [4, 0, 6, 2], n: [-1,  0,  0], uv: [k * 1, k * 2, k * 2, k * 2, k * 1, k * 1, k * 2, k * 1,]},
        {p: [1, 5, 3, 7], n: [ 1,  0,  0], uv: [k * 3, k * 2, k * 4, k * 2, k * 3, k * 1, k * 4, k * 1,]},
        {p: [4, 5, 0, 1], n: [ 0,  1,  0], uv: [k * 2, k * 3, k * 3, k * 3, k * 2, k * 2, k * 3, k * 2,]},
        {p: [2, 3, 6, 7], n: [ 0, -1,  0], uv: [k * 2, k * 1, k * 3, k * 1, k * 2, k * 0, k * 3, k * 0,]},
        {p: [5, 4, 7, 6], n: [ 0,  0,  1], uv: [k * 2, k * 2, k * 3, k * 2, k * 2, k * 1, k * 3, k * 1,]},
      ];

      const vts = param.vertices;
      const faces = param.faces;

      for (const men of mens) {
        const startIndex = vts.length;
        for (let j = 0; j < 4; ++j) {
          const vp = vs[men.p[j]];

          const v = new PMX.Vertex();
          const p = [
            vp.p[0] * whalf,
            vp.p[1] * hhalf,
            vp.p[2] * dhalf,
          ];
          this.applyEuler(p, p,
            intl, modelrot,
            bonea, v);

          v.uv = TexMaker.subTex8(
            men.uv[j*2+0],
            men.uv[j*2+1],
            2,
          );

          vts.push(v);
        }

        { // 面張り
          const v0 = startIndex;
          const v1 = v0 + 1;
          const v2 = v0 + 2;
          const v3 = v0 + 3;
          faces.push([v0, v1, v2]);
          faces.push([v2, v1, v3]);
        }

      }
    }

  }

  /**
   * 使用していない。変形無しの物理シンプルな箱
   * 面ごとに頂点を分割する場合。これだとエッジがおかしくなる
   * @param {IParam} param 
   */
  makeBox2(param) {
    const radius = param.radius || 1;
    const hhalf = param.hhalf || radius;
    const bonea = param.bonea;
    const boneIndex = bonea._index;
    const isLeft = (bonea.p[0] > 0);
    const whalf = param.whalf || radius;
    const dhalf = param.dhalf || radius;
    const intl = param.intl || [0, 0, 0];
    const modelrot = param.modelrot || [0, 0, 0];
    {
      const vs = [
        {p: [-1, 1, -1]}, // 0 手前
        {p: [ 1, 1, -1]}, // 1
        {p: [-1,-1, -1]}, // 2 z
        {p: [ 1,-1, -1]}, // 3 手前 下
        {p: [-1, 1,  1]}, // 4 奥上
        {p: [ 1, 1,  1]}, // 5
        {p: [-1,-1,  1]}, // 6
        {p: [ 1,-1,  1]}, // 7
      ];
      /** UV用 */
      const k = 0.25;
      const mens = [
        {p: [0, 1, 2, 3], n: [ 0,  0, -1], uv: [k * 2, k * 2, k * 3, k * 2, k * 2, k * 1, k * 3, k * 1,]},
        {p: [4, 0, 6, 2], n: [-1,  0,  0], uv: [k * 1, k * 2, k * 2, k * 2, k * 1, k * 1, k * 2, k * 1,]},
        {p: [1, 5, 3, 7], n: [ 1,  0,  0], uv: [k * 3, k * 2, k * 4, k * 2, k * 3, k * 1, k * 4, k * 1,]},
        {p: [4, 5, 0, 1], n: [ 0,  1,  0], uv: [k * 2, k * 3, k * 3, k * 3, k * 2, k * 2, k * 3, k * 2,]},
        {p: [2, 3, 6, 7], n: [ 0, -1,  0], uv: [k * 2, k * 1, k * 3, k * 1, k * 2, k * 0, k * 3, k * 0,]},
        {p: [5, 4, 7, 6], n: [ 0,  0,  1], uv: [k * 2, k * 2, k * 3, k * 2, k * 2, k * 1, k * 3, k * 1,]},
      ];

      const vts = param.vertices;
      const faces = param.faces;

      for (const men of mens) {
        const startIndex = vts.length;
        for (let j = 0; j < 4; ++j) {
          const vp = vs[men.p[j]];

          const v = new PMX.Vertex();

          this.applyEuler([
            vp.p[0] * whalf,
            vp.p[1] * hhalf,
            vp.p[2] * dhalf],
            men.n,
            intl, modelrot,
            bonea, v);

          v.uv = TexMaker.subTex8(
            men.uv[j*2+0],
            men.uv[j*2+1],
            2,
          );

          vts.push(v);
        }

        { // 面張り
          const v0 = startIndex;
          const v1 = v0 + 1;
          const v2 = v0 + 2;
          const v3 = v0 + 3;
          faces.push([v0, v1, v2]);
          faces.push([v2, v1, v3]);
        }

      }
    }

  }

  /**
   * 歪み球形状
   * ボーン2つ渡しているがウエイト割り当てしていない
   * @param {IParam} param 
   */
  makeSphere(param) {
    const hdiv = param.hdiv || 16;
    const vdiv = param.vdiv || 8;
    const radius = param.radius || 1;
    const hradius = param.hradius || radius;
    /** 最初に平行移動する分(回転よりも前) */
    const intl = param.intl || [0, 0, 0];

    /** @type {PMX.Bone} */
    const bonea = param.bonea;
    //const boneb = param.boneb;

    const modelrot = param.modelrot || [0, 0, 0];

    const vts = param.vertices;
    const startIndex = vts.length;
    const faces = param.faces;

    const uvscale = 3 / 4;
    {
        const v = new PMX.Vertex();
        let x = 0;
        let y = 1;
        let z = 0;

        this.applyEuler([x * radius, y * hradius, z * radius],
          [x, y, z],
          intl, modelrot,
          bonea, v);

        let subu = 0.5;
        let subv = 0;
        v.uv = TexMaker.subTex8(subu, subv, CharBuilder.INDEX_OWNBONE, uvscale);

        vts.push(v);  
    }

    for (let i = 1; i < vdiv; ++i) { // 上から下か
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

        this.applyEuler([x * radius, y * hradius, z * radius],
          [x, y, z],
          intl, modelrot,
          bonea, v);

        let subu = j / hdiv;
        let subv = i / vdiv;
        v.uv = TexMaker.subTex8(subu, subv, CharBuilder.INDEX_OWNBONE, uvscale);

        vts.push(v);
      }
    }

    {
        const v = new PMX.Vertex();

        let x = 0;
        let y = -1;
        let z = 0;

        this.applyEuler([x * radius, y * hradius, z * radius],
          [x, y, z],
          intl, modelrot,
          bonea, v);

        let subu = 0.5;
        let subv = 1;
        v.uv = TexMaker.subTex8(subu, subv, CharBuilder.INDEX_OWNBONE, uvscale);

        vts.push(v);
    }

    // 面張り
    for (let j = 0; j < hdiv; ++j) {
      faces.push([0, 1 + j + 1, 1 + j].map(v => v + startIndex));
    }

    for (let i = 1; i < vdiv - 1; ++i) {
      for (let j = 0; j < hdiv; ++j) {
        const v0 = (hdiv + 1) * (i - 1) + j + (startIndex + 1);
        const v1 = v0 + 1;
        const v2 = v0 + (hdiv + 1);
        const v3 = v2 + 1;
        faces.push([v0, v1, v2]);
        faces.push([v2, v1, v3]);
      }
    }

    const bottomIndex = vts.length - 1 - (hdiv + 1);
    for (let j = 0; j < hdiv; ++j) {
      faces.push([bottomIndex + j, bottomIndex + j + 1, vts.length - 1]);
    }

  }

  /**
   * シリンダー形状
   * @param {IParam} param
   * @param {()=>number} param.rfunc
   * @param {number} param.hnum 垂直方向の点数
   */
  makeCyl(param) {
    const hdiv = param.hdiv || 16;
    const vdiv = param.vdiv || 8;
    const hnum = param.hnum || 2;

    const radius = param.radius || 1;
    /** 半球の高さ。0 も有効 */
    const hradius = param.hradius ?? radius;
    const hhalf = param.hhalf || 1;

    /** @type {PMX.Bone} */
    const bonea = param.bonea;
    //const boneb = param.boneb;

    const intl = param.intl || [0, 0, 0];
    const modelrot = param.modelrot || [0, 0, 0];

    const vts = param.vertices;
    /** この関数での先頭 */
    let startIndex = vts.length;
    const faces = param.faces;

    const subindex8 = param.subindex8 || -1;
    const col6 = param.col6 || [5, 5, 5];

    const _calcuv = (ratex, ratey) => {
      if (subindex8 >= 0) {
        return TexMaker.subTex8(ratex, ratey, subindex8);
      }
      return TexMaker.calcColorUV(col6[0], col6[1], col6[2], vts.length);
    };

    console.log('hradius', hradius);


    {
      { // 一番上
        const v = new PMX.Vertex();
        let x = 0;
        let y = 1;
        let z = 0;
        this.applyEuler(
          [x * radius, y * hradius + hhalf, z * radius],
          [x, y, z],
          intl, modelrot,
          bonea, v
        );
        v.uv = _calcuv(0.5, 0);
        vts.push(v);       
      }
    }

    for (let i = 1; i < vdiv * 0.5; ++i) { // 上から下か 上半分
      const vang = i * Math.PI / vdiv;
      //let rr = param.rfunc(i);
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
        const ns = [x * radius, y * hradius, z * radius];
        this.applyEuler(
          [ns[0], ns[1] + hhalf, ns[2]],
          ns,
          intl, modelrot,
          bonea, v
        );

        v.uv = _calcuv(ratex, ratey);

        vts.push(v);
      }
    }

    for (let i = 0; i < hnum; ++i) { // まんなか
      //const vang = i * Math.PI / vdiv;
      //let rr = param.rfunc(i);
      let rr = 1;

      const ratey = (i - vdiv * 0.5) / (vdiv * 0.5);
      for (let j = 0; j <= hdiv; ++j) {
        const ratex = (j - hdiv * 0.5) / (hdiv * 0.5);

        const hang = (j % hdiv) * Math.PI * 2 / hdiv;

        const cs = Math.cos(hang);
        const sn = Math.sin(hang);

        const v = new PMX.Vertex();

        let x = -sn * rr;
        let y = (1 - i / hnum * 2);
        let z =  cs * rr;

        this.applyEuler(
          [x * radius, y * hhalf, z * radius],
          [x, 0, z],
          intl, modelrot,
          bonea, v
        );

        v.uv = _calcuv(ratex, ratey);

        vts.push(v);
      }
    }

    for (let i = vdiv * 0.5; i < vdiv; ++i) { // 上から下か。下半分
      const vang = i * Math.PI / vdiv;
      //let rr = param.rfunc(i);
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
        const ns = [x * radius, y * hradius, z * radius];
        this.applyEuler(
          [ns[0], ns[1] - hhalf, ns[2]],
          ns,
          intl, modelrot,
          bonea, v
        );

        v.uv = _calcuv(ratex, ratey);

        vts.push(v);
      }
    }
    {
      { // 一番下
        const v = new PMX.Vertex();
        let x = 0;
        let y = -1;
        let z = 0;
        this.applyEuler(
          [x * radius, y * hradius - hhalf, z * radius],
          [x, y, z],
          intl, modelrot,
          bonea, v
        );
        v.uv = _calcuv(0.5, 1);
        vts.push(v);       
      }
    }

    // 面
    {
      for (let j = 0; j < hdiv; ++j) {
        const fi = [0, 1 + j + 1, 1 + j];
        faces.push(fi.map(index => index + startIndex));
      }
    }
    startIndex += 1;

    for (let i = 1; i < (vdiv + hnum) - 1; ++i) {
      for (let j = 0; j < hdiv; ++j) {
        const v0 = (hdiv + 1) * (i - 1) + j + startIndex; // 一段減らす
        const v1 = v0 + 1;
        const v2 = v0 + (hdiv + 1); // 裏で切れてる
        const v3 = v2 + 1;
        faces.push([v0, v1, v2]);
        faces.push([v2, v1, v3]);
      }
    }

    startIndex = vts.length - 1 - (hdiv + 1);
    {
      for (let j = 0; j < hdiv; ++j) {
        const fi = [j + startIndex, j + 1 + startIndex, vts.length - 1];
        faces.push(fi);
      }
    }

  }

  /**
   * 使用していない。トンネル形状
   * @param {IParam} param
   */
  makeTun(param) {
    /** @type {PMX.Bone} */
    const bonea = param.bonea;
    //const boneb = param.boneb;

    const intl = param.intl || [0, 0, 0];
    const modelrot = param.modelrot || [0, 0, 0];

    const vts = param.vertices;
    const startIndex = vts.length;
    const faces = param.faces;

    const subindex8 = param.subindex8 || -1;
    const col6 = param.col6 || [1, 5, 5];

    const _calcuv = (u, v) => {
      if (subindex8 >= 0) {
        return TexMaker.subTex8(u, v, subindex8, 3/4);
      }
      return TexMaker.calcColorUV(col6[0], col6[1], col6[2], vts.length);
    };


    const whalf = param.whalf || 1;
    const hhalf = param.hhalf || 1;
    const dhalf = param.dhalf || 1;
    /** 内側に厚み */
    const thick = param.thick || 0.1;
    const winterval = param.winterval || 0.5;
    const cutout = param.cutout || 0.05;
    const cutin = param.cutin || 0.025;
    const vs = [ // 上だけ
      {p: [-winterval, hhalf, dhalf], rv: 1, n: [1,1,1]},
      {p: [-whalf + cutout, hhalf,  dhalf], rv: 1, n: [0,1,1]},
      {p: [-whalf, hhalf,  dhalf - cutout], rv: 1, n: [-1,1,0]}, // 左奥

      {p: [-whalf, hhalf, -dhalf + cutout], rv: 1, n: [-1,1,0]},
      {p: [-whalf + cutout, hhalf, -dhalf], rv: 1, n: [0,1,-1]}, // 左手前

      {p: [ whalf - cutout, hhalf, -dhalf], rv: 1, n: [0,1,-1]}, // 右手前
      {p: [ whalf, hhalf, -dhalf + cutout], rv: 1, n: [ 1,1,0]},

      {p: [ whalf, hhalf,  dhalf - cutout], rv: 1, n: [ 1,1,0]},
      {p: [ whalf - cutout, hhalf,  dhalf], rv: 1, n: [0,1, 1]}, // 右奥
      {p: [ winterval, hhalf, dhalf], rv: 1, n: [-1,1,1]}, // 外周

      {p: [ winterval, hhalf, dhalf - thick], rv: -1, n: [-1,1,-1]}, // 内周
      {p: [ whalf - thick - cutin, hhalf,  dhalf - thick], rv: -1, n: [0,1,-1]}, // 右奥
      {p: [ whalf - thick, hhalf,  dhalf - thick - cutin], rv: -1, n: [-1,1,0]},

      {p: [ whalf - thick, hhalf, -dhalf + thick + cutin], rv: -1, n: [-1,1,0]}, // 右手前
      {p: [ whalf - thick - cutin, hhalf, -dhalf + thick], rv: -1, n: [0,1,1]},

      {p: [-whalf + thick + cutin, hhalf, -dhalf + thick], rv: -1, n: [0,1,1]}, // 左手前
      {p: [-whalf + thick, hhalf, -dhalf + thick + cutin], rv: -1, n: [1,1,0]},

      {p: [-whalf + thick, hhalf,  dhalf - thick - cutin], rv: -1, n: [1,1,0]},
      {p: [-whalf + thick + cutin, hhalf,  dhalf - thick], rv: -1, n: [0,1,-1]},
      {p: [-winterval, hhalf, dhalf - thick], rv: -1, n: [1,1,-1]},

      {p: [-winterval, hhalf, dhalf], rv: 1, n: [1,1,1]},
    ];
    const num = vs.length; // 20個 + 1
    const num2 = Math.floor(num / 2); // 切り捨てて10個
    for (let i = 0; i < 2; ++i) { // 上と下
      for (let j = 0; j < num; ++j) {
        const v = new PMX.Vertex();

        let pv = Vec3.fromArray(vs[j].p);
        let nv = Vec3.fromArray(vs[j].n).normalizeInPlace();
        if (i === 1) { // 下の点
          pv.y = -pv.y;
          nv.y = -nv.y;
        }

        // TODO: 回転

        this.applyEuler(pv.asArray(),
          nv.asArray(),
          intl, modelrot,
          bonea, v);

        // TODO: 横張りテクスチャ
        v.uv = _calcuv(
            j / (num - 1),
            (i === 0) ? 0 : 1);

        vts.push(v);
      }
    }

    // 面張り
    const zigs = [];
    for (let i = 0; i < num - 1; ++i) { // 側面
      const v0 = i;
      //const v1 = (i + 1) % num;
      const v1 = i + 1;
      const zig = [v0, v1, v0 + num, v1 + num];
      zigs.push(zig);
    }
    for (let i = 0; i < num2 - 1; ++i) { // 上
      const v2 = i;
      const v3 = v2 + 1;
      const v0 = (num - 1) - 1 - i;
      const v1 = v0 - 1;
      zigs.push([v0, v1, v2, v3]);
    }
    for (let i = 0; i < num2 - 1; ++i) { // 下 TODO: バグ
      const v0 = num + i;
      const v1 = v0 + 1;
      const v2 = num + num - 1 - 1 - i;
      const v3 = v2 - 1;
      zigs.push([v0, v1, v2, v3]);
    }

    for (const zig of zigs) {
      const fis = zig.map(i => i + startIndex);
      faces.push([fis[0], fis[1], fis[2]], [fis[2], fis[1], fis[3]]);
    }

  }

  /**
   * ジョイントとして使用している
   * @param {IParam} param 
   */
  makeJoint(param) {
    const hdiv = param.hdiv || 16;
    const vdiv = param.vdiv || 8;
    const radius = param.radius || 1;
    const hhalf = param.hhalf || 1;
    const intl = param.intl || [0, 0, 0];
    const modelrot = param.modelrot || [0, 0, 0];
    /** @type {PMX.Bone} */
    const bonea = param.bonea;

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

        // 回転
        this.applyEuler([x * radius, y * hhalf, z * radius],
          [x, y, z],
          intl, modelrot,
          bonea, v
        );

        v.uv = TexMaker.subTex8(
          ((j - hdiv / 2) / hdiv) * 0.75 + 0.5,
          ((i - vdiv / 2) / vdiv) * 0.75 + 0.5,
          CharBuilder.INDEX_OWNJOINT);

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
    );

    const boneIndex = param.index;
    const hhalf = param.hhalf || 0.25;
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

        const vtx = new PMX.Vertex();

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


        this.applyEuler(pv.asArray(),
          nv.asArray(),
          [0, 0, 0],
          [0, 0, localRotAng],
          bonea, vtx
        );
        let subu = (j / 4);
        let subv = (i / hdiv);
        vtx.uv = TexMaker.subTex8(subu, subv, CharBuilder.INDEX_MOBIUS);
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

  /**
   * 頭、顔の予定
   * @param {IParam} param 
   */
  makeHead(param) {
    console.log('未実装');
    this.makeBox(param);
    return;
  }

  /**
   * 
   * @param {IParam} param 
   */
  makeEye(param) {
    console.log('未実装 目');
    param.hnum = 2;
    param.col6 = [5, 3, 1];
    this.makeCyl(param);
  }

  /**
   * 上体の予定
   * @param {IParam} param 
   */
  makeBody(param) {
    console.log('未実装');
    this.makeBox(param);
    return;
  }

  /**
   * 下体の予定
   * @param {IParam} param 
   */
  makeWaist(param) {
    console.log('未実装');
    this.makeBox(param);
    return;
  }

  /**
   * 手の予定
   * @param {IParam} param 
   * @returns 
   */
  makeHand(param) {
    console.log('未実装');
    this.makeBox(param);
    return;
  }

  /**
   * べべルつき直方体
   * @param {IParam} param 
   */
  makeBebel1(param) {
    const sepface = param.sepface ?? -1;
    const vts = param.vertices;

    const faces = param.faces;
    const whalf = param.whalf ?? 1;
    const hhalf = param.hhalf ?? 1;
    const dhalf = param.dhalf ?? 1; // 0 を許容する
    const bonea = param.bonea;
    const intl = param.intl || [0, 0, 0];
    const modelrot = param.modelrot || [0, 0, 0];
    const bebelsub = param.bebelsub || 0.1; // パディングのような量
    const bebeladd = param.bebeladd || 0.1; // 元の直方体から厚みを増やす
    const mens = [ // 正の値
      {x: whalf, y: hhalf, z: dhalf, rot: [0,0,0] }, // Z-
      {x: whalf, y: hhalf, z: dhalf, rot: [0,180,0] }, // Z+
      {x: dhalf, y: hhalf, z: whalf, rot: [0,90,0] }, // X-
      {x: dhalf, y: hhalf, z: whalf, rot: [0,-90,0] }, // X+
      {x: whalf, y: dhalf, z: hhalf, rot: [90,0,0] }, // Y+
      {x: whalf, y: dhalf, z: hhalf, rot: [-90,0,0] }, // Y-
    ];
    if (dhalf === 0) {
      mens.splice(2);
    }

    for (let mi = 0; mi < mens.length; ++mi) {
      const men = mens[mi];
      const faceq = Quat.euler(men.rot);
      const vnums = [1, 4, 8];
      if (mi === sepface) {
        vnums.push(1, 4);
      }
      const startIndex = vts.length;
      for (let i = 0; i < vnums.length; ++i) {
        for (let j = 0; j < vnums[i % 3]; ++j) {
          const v = new PMX.Vertex();

          let pv = new Vec3(0, 0, -men.z);
          let nv = new Vec3(0, 0, -1);

          switch (i % 3) {
            case 0: // 真ん中のみ
              pv.z = -men.z - bebeladd;
              break;
            case 1:
              {
                const w = men.x - bebelsub;
                const h = men.y - bebelsub;
                const ps = [
                  {p: [-w,  h, 0]}, // 左上
                  {p: [ w,  h, 0]}, // 右上
                  {p: [ w, -h, 0]}, // 右下
                  {p: [-w, -h, 0]},
                ];
                pv.x = ps[j].p[0];
                pv.y = ps[j].p[1];
                pv.z = -men.z - bebeladd;
              }
              break;
            case 2:
              {
                const w = men.x;
                const h = men.y;
                const ps = [
                  {p: [-w,  h, 0]},
                  {p: [ 0,  h, 0]},
                  {p: [ w,  h, 0]},
                  {p: [ w,  0, 0]},
                  {p: [ w, -h, 0]},
                  {p: [ 0, -h, 0]},
                  {p: [-w, -h, 0]},
                  {p: [-w,  0, 0]},
                ];
                pv.x = ps[j].p[0];
                pv.y = ps[j].p[1];
                nv = pv.clone().normalizeInPlace();
              }
              break;
          }

          const sqSize = Math.max(men.x, men.y);
          let uv = [
            pv.x / sqSize * 0.5 * 0.75 + 0.5,
            pv.y / sqSize * 0.5 * 0.75 + 0.5,
          ];

          pv = faceq.rotate(pv);
          nv = faceq.rotate(nv);

          this.applyEuler(pv.asArray(),
            nv.asArray(),
            intl, modelrot, // ボーンとしての補正
            bonea, v
          );

          let index = 0;
          v.uv = TexMaker.subTex8(
            uv[0], uv[1], index,
          );

          if (i >= 3) { // 専用部分
            const cs = [15/16, 0.5];
            v.uv = cs;
            if (i >= 4) {
              const uh = 1 / 16;
              const vh = 1 / 4;
              v.uv = [
                [cs[0] - uh, cs[1] - vh],
                [cs[0] + uh, cs[1] - vh],
                [cs[0] + uh, cs[1] + vh],
                [cs[0] - uh, cs[1] + vh],
              ][j];
            }
          }

          vts.push(v);
        }
      }
      const fis = [
        [1, 6, 2], [2, 8, 3], [3, 10, 4], [4, 12, 1],
        [1, 5, 6], [2, 6, 7], [2, 7, 8], [3, 8, 9],
        [3, 9, 10], [4, 10, 11], [4, 11, 12], [1, 12, 5],
      ];

      if (mi === sepface) {
        fis.push([13, 14, 15], [13, 15, 16], [13, 16, 17], [13, 17, 14]);
      } else {
        fis.push([0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1]);
      }

      for (const fi of fis) {
        faces.push(fi.map(index => index + startIndex));
      }
    }

  }

}
