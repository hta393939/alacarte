
/**
 * @param {number} v 値
 */
const _pad = (v, n = 2) => {
  return String(v).padStart(n, '0');
};

const _lerp = (a, b, t) => {
  return a + (b - a) * t;
};

const _rad = (deg) => {
  return deg * Math.PI / 180;
};

export class Vec3 {
  static XAXIS = 'x';
  static YAXIS = 'y';
  static ZAXIS = 'z';

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
   * 
   * @param {number} k 
   */
  mulk(k) {
    return new Vec3(this.x * k, this.y * k, this.z * k);
  }

  cross(b) {
    return new Vec3(
      this.y * b.z - this.z * b.y,
      this.z * b.x - this.x * b.z,
      this.x * b.y - this.y * b.x,
    );
  }

  /**
   * 
   * @param {number} ok スカラー倍数
   * @param {Vec3} b ベクトル
   * @param {number} bk スカラー倍数
   */
  add(ok, b, bk) {
    return new Vec3(
      this.x * ok + b.x * bk,
      this.y * ok + b.y * bk,
      this.z * ok + b.z * bk,
    );
  }
}

export class Quat {
  constructor(inx, iny, inz, inw) {
    this._x = inx;
    this._y = iny;
    this._z = inz;
    this._w = inw;
  }

  static fromArrayWHead(arr) {
    return new Quat(arr[1], arr[2], arr[3], arr[0]);
  }
  static fromArrayWTail(arr) {
    return new Quat(arr[0], arr[1], arr[2], arr[3]);
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

  clone() {
    return new Quat(this.x, this.y, this.z, this.w);
  }

  im() {
    return new Vec3(this.x, this.y, this.z);
  }

  mul(b) {
    const are = this.w;
    const bre = b.w;
    const aim = this.im();
    const bim = b.im();
    const vre = aim.mulk(bre).add(bim.mulk(are)).add(aim.cross(bim));
    return new Quat(
      vre.x,
      vre.y,
      vre.z,
      are * bre - aim.dot(bim),
    );
  }

  toVec3() {
    return new Vec3(this.x, this.y, this.z);
  }

  conj() {
    return new Quat(-this.x, -this.y, -this.z, this.w);
  }

  /**
   * 
   * @param {Vec3} target 
   * @returns {Vec3}
   */
  rotate(target) {
    const posq = new Quat(target.x, target.y, target.z, 0);
    return this.mul(posq).mul(this.conj()).toVec3();   
  }

  /**
   * center でこの Quat 回転する
   * @param {Vec3} target
   * @param {Vec3} center 
   */
  rotateByPoint(target, center) {
    const p1 = target.add(1, center, -1);
    const p2 = this.rotate(p1);
    return p2.add(1, center, 1);
  }
} 

export class CharBuilder extends PMX.Maker {
  constructor() {
    super();

    this.bones = this.initBone();
    this.mtls = this.initMaterial();
    this.emos = this.initEmotion();
  }

  initBone() {
    const bones = [];

    const blocks = [
{ lr: false, bones: [
{ parentName: '', nameJa: '全ての親', nameEn: 'root', p:[0,0,0] },
{ parentName: '全ての親', nameJa: '操作中心', nameEn: 'view cnt bone', p:[0,0,0] },
{ parentName: '全ての親', nameJa: 'センター', nameEn: 'center', p:[0,0,0] },
{ parentName: 'センター', nameJa: '下半身', nameEn: 'spine', p: [0,0,0] },
{ parentName: '下半身', nameJa: '上半身１', nameEn: 'chest', p:[0,0,0] },
{ parentName: '上半身１', nameJa: '上半身２', nameEn: 'upperChest', p:[0,0,0] },
{ parentName: '上半身２', nameJa: '首', nameEn: 'neck', p:[0,0,0] },
{ parentName: '首', nameJa: '頭', nameEn: 'head', p:[0,0,0] }, // #7
]},
{ lr: true, bones: [
{parentName: '下半身',nameJa: '足', nameEn: 'UpperLeg', p:[0,0,0]},
{parentName: '_足',nameJa: 'ひざ', nameEn: 'LowerLeg', p:[0,0,0]},
{parentName: '_ひざ',nameJa: '足首', nameEn: 'Foot', p:[0,0,0]},
{parentName: '_足首',nameJa: 'つま先', nameEn: 'Toe', p:[0,0,0]},
]},
{ lr: true, bones: [
{parentName: '上半身２',nameJa: '肩', nameEn: 'Shoulder', p:[0,0,0]},
{parentName: '_肩',nameJa: '腕', nameEn: 'UpperArm', p:[0,0,0]},
{parentName: '_腕',nameJa: 'ひじ', nameEn: 'LowerArm', p:[0,0,0]},
{parentName: '_ひじ',nameJa: '手首', nameEn: 'Hand', p:[0,0,0]},
{parentName: '_手首',nameJa: '小指１', nameEn: 'LittleProximal', p:[0,0,0]},
{parentName: '_小指１',nameJa: '小指２', nameEn: 'LittleIntermediate', p:[0,0,0]},
{parentName: '_小指２',nameJa: '小指３', nameEn: 'LittleDistal', p:[0,0,0]},
{parentName: '_小指３',nameJa: '小指先', nameEn: 'LittleEnd', p:[0,0,0]},

{parentName: '_手首',nameJa: '薬指１', nameEn: 'RingProximal', p:[0,0,0]},
{parentName: '_薬指１',nameJa: '薬指２', nameEn: 'RingIntermediate', p:[0,0,0]},
{parentName: '_薬指２',nameJa: '薬指３', nameEn: 'RingDistal', p:[0,0,0]},
{parentName: '_薬指３',nameJa: '薬指先', nameEn: 'RingEnd', p:[0,0,0]},

{parentName: '_手首',nameJa: '中指１', nameEn: 'MiddleProximal', p:[0,0,0]},
{parentName: '_中指１',nameJa: '中指２', nameEn: 'MiddleIntermediate', p:[0,0,0]},
{parentName: '_中指２',nameJa: '中指３', nameEn: 'MiddleDistal', p:[0,0,0]},
{parentName: '_中指３',nameJa: '中指先', nameEn: 'MiddleEnd', p:[0,0,0]},

{parentName: '_手首',nameJa: '人指１', nameEn: 'IndexProximal', p:[0,0,0]},
{parentName: '_人指１',nameJa: '人指２', nameEn: 'IndexIntermediate', p:[0,0,0]},
{parentName: '_人指２',nameJa: '人指３', nameEn: 'IndexDistal', p:[0,0,0]},
{parentName: '_人指３',nameJa: '人指先', nameEn: 'IndexEnd', p:[0,0,0]},

{parentName: '_手首',nameJa: '親指０', nameEn: 'ThumbMetacarpal', p:[0,0,0]},
{parentName: '_親指０',nameJa: '親指１', nameEn: 'ThumbProximal', p:[0,0,0]},
{parentName: '_親指１',nameJa: '親指２', nameEn: 'ThumbDistal', p:[0,0,0]},
{parentName: '_親指２',nameJa: '親指先', nameEn: 'ThumbEnd', p:[0,0,0]},
]},
{ lr: true, bones: [
{parentName: '頭',nameJa: '目', nameEn: 'Eye', p:[0,0,0]},
]},
{ lr: true, bones: [
{parentName: '全ての親',nameJa: '足ＩＫ', nameEn: 'LegIK', p:[0,0,0]},
{parentName: '_足ＩＫ',nameJa: '足ＩＫ先', nameEn: 'LegIKEnd', p:[0,0,0]},
]},
{ lr: true, bones: [
{parentName: '_足ＩＫ',nameJa: 'つま先ＩＫ', nameEn: 'ToeIKTop', p:[0,0,0]},
{parentName: '_つま先ＩＫ',nameJa: 'つま先ＩＫ先', nameEn: 'ToeIKEnd', p:[0,0,0]},
]},
{ lr: true, bones: [
{parentName: '上半身２', nameJa: 'パーツ１', nameEn: 'parts1', p:[0,0,0]},
{parentName: '_パーツ１', nameJa: 'パーツ２', nameEn: 'parts2', p:[0,0,0]},
]}
    ];
    const lrpre = [
      {nameJa: '右', nameEn: 'right', x: -1},
      {nameJa: '左', nameEn: 'left', x: 1},
    ];
    for (let bi = 0; bi < blocks.length; ++bi) {
      const block = blocks[bi];
      for (let i = ((block.lr) ? 0 : 1); i < 2; ++i) {
        for (let j = 0; j < block.bones.length; ++j) {
          const one = block.bones[j];
          const bone = {
            parent: -1,
            parentName: one.parentName.replace('_', lrpre[i].nameJa),
            nameJa: `${block.lr ? lrpre[i].nameJa : ''}${one.nameJa}`,
            nameEn: `${block.lr ? lrpre[i].nameEn : ''}${one.nameEn}`,
          };
          const index = bones.findIndex(b => b.nameJa === bone.parentName);
          let parentPos = new Vec3(0, 0, 0);
          if (index < 0) {
            console.warn('not found parent', bone.parentName);
          } else {
            bone.parent = index;
            parentPos = bones[index].position?.clone() || new Vec3(0,0,0);
          }
          const diff = Vec3.fromArray(one.p);
          diff.x = diff.x * lrpre[i].x;
          bone.position = parentPos.add(1, diff, 1);
          bone.p = bone.position.asArray();

          bones.push(bone);
        }
      }
    }

    return bones;
  }

  initMaterial() {
      let bits = 0;
      //  | PMX.Material.BIT_GROUND
      //  | PMX.Material.BIT_TOMAP
      //  | PMX.Material.BIT_SELFSHADOW

    const mtls = [{
      nameJa: `材質1`,
      nameEn: `material1`,
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
    }];
    return mtls;
  }

  /**
   * 表情。定番とVRM1.0
   * @returns 
   */
  initEmotion() {
    const emos = [
{nameJa: 'あ', nameEn: 'aa'},
{nameJa: 'い', nameEn: 'ih'},
{nameJa: 'う', nameEn: 'ou'},
{nameJa: 'え', nameEn: 'ee'},
{nameJa: 'お', nameEn: 'oh'},
{nameJa: 'まばたき', nameEn: 'blink'},
{nameJa: '左ウインク', nameEn: 'blinkLeft'},
{nameJa: '右ウインク', nameEn: 'blinkRight'},
{nameJa: '喜び', nameEn: 'happy'}, // 笑い?
{nameJa: '怒り', nameEn: 'angry'},
{nameJa: '悲しみ', nameEn: 'sad'},
{nameJa: '穏やか', nameEn: 'relaxed'},
{nameJa: '驚き', nameEn: 'surprised'},
{nameJa: '通常', nameEn: 'neutral'},
{nameJa: '上目遣い', nameEn: 'lookUp'},
{nameJa: '下目遣い', nameEn: 'lookDown'},
{nameJa: '左目線', nameEn: 'lookLeft'},
{nameJa: '右目線', nameEn: 'lookRight'},
    ];
    const emotions = [];
    for (const emo of emos) {
      const m = new PMX.Morph();
      m.nameJa = emo.nameJa;
      m.nameEn = emo.nameEn;
      for (let i = 0; i < 1; ++i) {
        const vm = new PMX.VertexMorph();
        m.vertexMorphs.push(vm);
      }
      emotions.push(m);
    }

    return emotions;
  }

  /**
   * 破壊
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

    const d = new Date();
    const scale = 0.25;

    this.debug = 1;

    const BONE_CENTER = 2;

    this.head.nameEn = param.nameEn;
    this.head.nameJa = this.head.nameEn;
    let comment = `${d.toLocaleString()} CharBuilder.make\r\n`;
    comment += `キャラクタ\r\n`;
    comment += `scale: ${scale}\r\n`;
    this.head.commentEn = '';
    this.head.commentJa = comment;

    {
      for (let i = 0; i <= 3; ++i) {
        for (let j = 0; j <= 2; ++j) {
          const v = new PMX.Vertex();

          let x = j - 1;
          let y = 0;
          let z = 0;

          switch (i) {
          case 0:
            y = 1;
            break;
          case 1:
            y = 0.75;
            break;
          case 2:
            y = 0;
            break;
          case 3:
            y = -1;
            break;
          }

          v.n = [0, 0, -1];
          if (x !== 0 || y !== 0) {
            v.n = this.normalize([x, y, 0]);
          }

          v.p = [x * scale, y * scale, z * scale];
          v.uv = [
            j / 2,
            (1 - y) * 0.5,
          ];
          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          let bone = BONE_CENTER;
          switch (j) {
          case 0:
            bone = 3;
            break;
          case 2:
            bone = 4;
            break;
          }
          if (i === 0) {
            bone = 5; // 上だけ伸ばす
          }

          v.joints = [bone, 0, 0, 0];
          v.weights = [1, 0, 0, 0];

          this.vts.push(v);
        }
      }
    }

    //this.textures.push(...param.texturePath);

    for (let i = 0; i < 1; ++i) { // 材質
      const m = new PMX.Material();
      m.nameJa = `mtl00${i}`;
      m.nameEn = `mtl00${i}`;
      m.texIndex = 0;
      m.diffuse = [1, 1, 1, 1];
      m.specular = [0.2, 0.2, 0.2];
      m.specPower = 0.5;
      m.ambient = [0.7, 0.7, 0.7];
      m.edgeColor = [156/255, 130/255, 48/255, 1];
      let bits = 0;
      //  | PMX.Material.BIT_GROUND
      //  | PMX.Material.BIT_TOMAP
      //  | PMX.Material.BIT_SELFSHADOW
      m.bitFlag = bits;
      m.sphereMode = PMX.Material.SPMODE_ADD;
      m.sphereIndex = 1;
      m.sharetoonflag = 0;
      m.sharetoonindex = -1;

      const fis = [
        [0, 1, 3], [1, 4, 3],
        [3, 4, 6], [4, 7, 6],
        [4, 5, 8], [4, 8, 7],
        [6, 7, 10], [6, 10, 9],
        [7, 8, 10], [8, 11, 10],
      ];
      m.faces.push(...fis);

      this.materials.push(m);
    }

    for (let i = 0; i < this.bones.length; ++i) { // ボーン
      const bone = this.bones[i];
      /** ボーン */
      const b = new PMX.Bone();

      let bits = PMX.Bone.BIT_MOVE | PMX.Bone.BIT_ROT
        | PMX.Bone.BIT_VISIBLE;
      bits |= PMX.Bone.BIT_CONTROL;
      b.bits = bits;

      b.nameJa = bone.nameJa;
      b.nameEn = bone.nameEn;
      b.p = [0, 0, 0];
      b.parent = bone.parent;

      switch (i) {
      case 3:
        b.parent = BONE_CENTER;
        b.p = [1, 0, 0];
        break;
      case 4:
        b.parent = BONE_CENTER;
        b.p = [-1, 0, 0];
        b.bits |= PMX.Bone.BIT_MOVEAPPLY;
        b.applyParent = 3;
        b.applyRate = -1;
        break;

      case 5:
        b.parent = BONE_CENTER;
        b.p = [0, 1, 0];
        break;
      case 6:
        b.parent = BONE_CENTER;
        b.p = [0, -1, 0];
        break;
      }

      b.p = b.p.map(v => v * scale);
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
      for (let i = 0; i < 3; ++i) {
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
        } else if (i === 1) {
          f.nameJa = '表情';
          f.specialFlag = 1;
          for (let j = 0; j < 3; ++j) {
            f.morphs.push(j);
          }
        } else {
          if (this.bones.length <= 1) {
            break;
          }
          for (let j = 1; j < this.bones.length; ++j) {
            f.bones.push(j);
          }
        }
        this.frames.push(f);
      }
    }

  }


  /**
   * 物理シンプルな箱
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
   * シリンダー形状
   */
  makeCyl(param) {
    const hdiv = param.hdiv || 8;
    const vdiv = param.vdiv || 4;
    const hhalf = param.hhalf || 1;
    const radius = param.radius || 1;
    const ret = {
      vs: [],
      fis: [],
    };

    for (const i = 0; i <= vdiv; ++i) { // 上から下か
      const vang = i * Math.PI / vdiv;
      let rr = Math.cos(vang);
      for (const j = 0; j <= hdiv; ++j) {
        const hang = (j % hdiv) * Math.PI * 2 / hdiv;

        const cs = Math.cos(hang);
        const sn = Math.sin(hang);

        const v = new PMX.Vertex();

        let x = -sn * rr;
        let y = Math.sin(vang);
        let z = cs * rr;

        v.n = this.normalize();
        v.p = [
          x * radius,
          y * hhalf,
          z * radius,
        ];
        v.n = this.normalize([...v.p]);
        v.uv = [
          j / vdiv,
          i / hdiv,
        ];
        v.deformType = PMX.Vertex.DEFORM_BDEF2;
        v.joints = [2, 0, 0, 0];
        v.weights = [1, 0, 0, 0];

        ret.vs.push(v);
      }
    }

    for (let i = 0; i < vdiv; ++i) {
      for (let j = 0; j < hdiv; ++j) {
        const v0 = (hdiv + 1) * i + j;
        const v1 = v0 + 1;
        const v2 = v0 + hdiv + 1;
        const v3 = v2 + 1;
        ret.fis.push(v0, v1, v2);
        ret.fis.push(v2, v1, v3);
      }
    }

    return ret;
  }

}
