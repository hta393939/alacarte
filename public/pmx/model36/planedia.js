/**
 * @file plate.js
 */

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

export class PlaneDiaBuilder extends PMX.Maker {
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
   * ボーン多いプレート
   */
  make(param) {
    const d = new Date();
    const scale = 0.25;

    this.debug = 1;

    this.head.nameEn = param.nameEn;
    this.head.nameJa = this.head.nameEn;
    let comment = `${d.toLocaleString()} PlateDiaBuilder.make\r\n`;
    comment += `プレートダイア\r\n`;
    comment += `scale: ${scale}\r\n`;
    this.head.commentEn = '';
    this.head.commentJa = comment;

    {
      for (let i = 0; i <= 2; ++i) {
        for (let j = 0; j <= 2; ++j) {
          const v = new PMX.Vertex();

          let x = j / div * 2 - 1;
          let y = 1 - i / div * 2;
          let z = 0;

          v.n = [0, 0, -1];
          if (j !== 1 || i !== 1) {
            v.n = this.normalize([x, y, 0]);
          }

          v.p = [x * scale, y * scale, z * scale];
          v.uv = [
            j / div,
            i / div,
          ];
          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [2, 0, 0, 0];
          v.weights = [1, 0, 0, 0];

          this.vts.push(v);
        }
      }
    }

    this.textures.push(...param.texturePath);

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
      m.sharetoonflag = 0;
      m.sharetoonindex = -1;

      const fis = [
        [0, 1, 3], [1, 4, 3],
        [1, 2, 5], [1, 5, 4],
        [3, 4, 7], [3, 7, 6],
        [4, 5, 7], [5, 8, 7],
      ];
      m.faces.push(...fis);

      this.materials.push(m);
    }

    for (let i = 0; i < 2; ++i) { // ボーン
      /**
       * ボーン
       */
      const b = new PMX.Bone();
      /**
       * 剛体
       */
      let rb = new PMX.Rigid();

      rb.nameJa = `rb${_pad(i, 3)}`;
      rb.nameEn = rb.nameJa;
      rb.shape = PMX.Rigid.SHAPE_BOX;
      rb.setUIGroup(4);

      let x = 0;
      let y = 0;
      let z = 0;
      rb.p = [x * scale, y * scale, z * scale];
      rb.rot = [0, 0, 0];
      rb.size = [1 * scale, 1 * scale, 1 * scale];
      rb.friction = 100;

      let bits = PMX.Bone.BIT_MOVE | PMX.Bone.BIT_ROT
        | PMX.Bone.BIT_VISIBLE;
      bits |= PMX.Bone.BIT_CONTROL;
      b.bits = bits;

      b.nameJa = `b${_pad(i, 3)}`;
      b.nameEn = b.nameJa;

      b.parent = i - 1;

      switch (i) {
      case 0:
        b.nameJa = '全ての親';
        b.nameEn = 'root';
        rb = null;
        break;
      case 1:
        b.nameJa = '操作中心';
        b.nameEn = 'view cnt bone';
        rb = null;
        break;
      case 2:
        b.parent = 0;
        b.nameJa = 'センター';
        b.nameEn = 'center';
        break;
      case 3:
        b.parent = 2;
        break;
      case 4:
        b.parent = 2;
        break;
      }

      this.bones.push(b);
      if (rb) {
//        this.rigids.push(rb);
      }
    }

    { // モーフ 0個 未実装
      for (let i = 0; i < 0; ++i) {
        const m = new PMX.Morph();
        m.nameJa = 'mr000';
        m.nameEn = 'mr000';
        m.type = 1;
        this.morphs.push(m);
      }
    }

    { // ボーングループフレーム
      for (let i = 0; i < 5; ++i) {
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

}
