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

    const BONE_CENTER = 2;

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
          let bone = BONE_CENTER;
          switch (j) {
          case 0:
            bone = 3;
            break;
          case 2:
            bone = 4;
            break;
          }

          v.joints = [bone, 0, 0, 0];
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

    for (let i = 0; i < 7; ++i) { // ボーン
      /**
       * ボーン
       */
      const b = new PMX.Bone();

      let bits = PMX.Bone.BIT_MOVE | PMX.Bone.BIT_ROT
        | PMX.Bone.BIT_VISIBLE;
      bits |= PMX.Bone.BIT_CONTROL;
      b.bits = bits;

      b.nameJa = `b${_pad(i, 3)}`;
      b.nameEn = b.nameJa;
      b.p = [0, 0, 0];
      b.parent = i - 1;

      switch (i) {
      case 0:
        b.parent = -1;
        b.nameJa = '全ての親';
        b.nameEn = 'root';
        break;
      case 1:
        b.parent = 0;
        b.nameJa = '操作中心';
        b.nameEn = 'view cnt bone';
        break;
      case BONE_CENTER:
        b.parent = 0;
        b.nameJa = 'センター';
        b.nameEn = 'center';
        break;
      case 3:
        b.parent = BONE_CENTER;
        b.p = [1, 0, 0];
        break;
      case 4:
        b.parent = BONE_CENTER;
        b.p = [-1, 0, 0];
        b.bits |= PMX.Bone.BIT_MOVEAPPLY;
        b.applyParent = 3;
        b.applyRate = 1;
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
      this.bones.push(b);
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
        switch(i) {
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

}
