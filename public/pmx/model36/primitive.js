
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

/**
 * プレーン作成
 */
export class PrimitiveBuilder extends PMX.Maker {
  constructor() {
    super();
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
   * 
   * @param {number[]} vs 
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
   * @param {Object} param 
   * @param {number} param.planenum 枚数
   */
  make(param) {
    const planenum = param.planenum;
    const d = new Date();

    this.debug = 1;

    this.head.nameEn = param.nameEn;
    this.head.nameJa = this.head.nameEn;
    this.head.commentEn = `${d.toLocaleString()}`;
    this.head.commentJa = this.head.commentEn;

/**
  * すべての親 0 メッシュ無し
  * 操作中心 1 メッシュ無し
  * センター 2 多分メッシュ無し
  */

/**
  * ベースボーンインデックス
  */
    const baseBoneIndex = 3;

    {
      for (let i = 0; i < planenum; ++i) {
        for (let j = 0; j < 4; ++j) {
          const v = new PMX.Vertex();
          let bx = j & 1;
          let by = Math.floor(j / 2);
          let x = bx * 2 - 1;
          let y = 1 - by * 2;
          let z = i;

          v.n = this.normalize([0, 0, -1]);
          v.p = [x, y, z];
          v.uv = [
            bx,
            1 - by,
          ];
          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [baseBoneIndex, 0, 0, 0];
          v.weights = [1, 0, 0, 0];

          this.vts.push(v);
        }
      }
    }

    {
      let name = 't000.png';
      this.textures.push(name);
    }

    for (let i = 0; i < 1; ++i) {
      const m = new PMX.Material();
      m.nameJa = `m00${i}`;
      m.nameEn = `m00${i}`;
      m.texIndex = 0;
      m.diffuse = [1, 1, 1, 1];
      m.specular = [0.2, 0.2, 0.2];
      m.specPower = 0.5;
      m.ambient = [0.7, 0.7, 0.7];
      m.edgeColor = [0/255, 0/255, 0/255, 1];
      let bits = 0;
      m.bitFlag = bits;
      m.sharetoonflag = 0;
      m.sharetoonindex = -1;
      {
        for (let k = 0; k < planenum; ++k) {
          let v0 = k * 4;
          let v1 = v0 + 1;
          let v2 = v0 + 2;
          let v3 = v0 + 3;
          m.faces.push([v0, v1, v2]);
          m.faces.push([v2, v1, v3]);
        }
      }
      this.materials.push(m);
    }

    for (let i = 0; i <= 3; ++i) {
  /**
  * ボーン
  */
      let b = new PMX.Bone();
      let bits = PMX.Bone.BIT_MOVE | PMX.Bone.BIT_ROT
        | PMX.Bone.BIT_VISIBLE;
      bits |= PMX.Bone.BIT_CONTROL;
      b.bits = bits;

      b.nameJa = `b${_pad(i, 3)}`;
      b.nameEn = b.nameJa;

      b.parent = i - 1;
      b.layer = 0;

      switch (i) {
      case 0:
        b.nameJa = '全ての親';
        b.nameEn = 'root';
        break;
      case 1:
        b.nameJa = '操作中心'; // 視点基準
        b.nameEn = 'view cnt bone';
        b.parent = -1;
        break;
      case 2:
        b.parent = 0;
        b.nameJa = 'センター';
        b.nameEn = 'center';
        break;

      case baseBoneIndex:
        break;
      }

      if (b) {
        this.bones.push(b);
      }
    }

    { // モーフ 0個
      for (let i = 0; i < 0; ++i) {
        const m = new PMX.Morph();
        m.nameJa = 'mr000';
        m.nameEn = 'mr000';
        m.type = 1;
        this.morphs.push(m);
      }
    }

    { // ボーングループフレーム
      for (let i = 0; i < 3; ++i) {
        const f = new PMX.Frame();
        f.nameJa = 'その他のボーンたち';
        f.nameEn = `frame00${i}`;
        f.specialFlag = 0;
        f.bones = [];

        if (i === 0) {
          f.nameJa = 'Root';
          f.specialFlag = 1;
          f.bones.push(0);
        } else if (i === 1) {
          f.nameJa = '表情';
          f.specialFlag = 1;
        } else {
          for (let j = 1; j < this.bones.length; ++j) {
            f.bones.push(j);
          }
        }
        this.frames.push(f);
      }
    }

  }

}
