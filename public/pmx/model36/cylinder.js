/**
 * @file cylinder.js
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

export class CylinderBuilder extends PMX.Maker {
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
   * シリンダー
   * UV は V0が上、V1が下
   */
  make(param) {
    const d = new Date();
    const scale = 1.0;

    const capsuleR = 1;
    const height2 = Math.PI * 0.5;
    const uvR = 1 / (2 * Math.PI);

    this.debug = 1;

    this.head.nameEn = param.nameEn;
    this.head.nameJa = this.head.nameEn;
    let comment = `${d.toLocaleString()} CylinderBuilder.make\r\n`;
    this.head.commentEn = ``;
    this.head.commentJa = comment;

    let div = 16;

    {
      for (let i = 0; i < 2; ++i) { // 中心点
        const v = new PMX.Vertex();
        const sign = (i === 0) ? 1 : -1;
        let x = 0;
        let y = height2 * sign;
        let z = 0;
        v.p = [x * scale, y * scale, z * scale];
        v.n = [0, -sign, 0];
        v.uv = [
          0.25 + 0.5 * i,
          0.25,
        ];
        v.deformType = PMX.Vertex.DEFORM_BDEF1;
        v.joints = [3 + i, 0, 0, 0];
        v.weights = [1, 0, 0, 0];

        this.vts.push(v);
      }
      for (let i = 0; i < 2; ++i) {
        const sign = (i === 0) ? 1 : -1;
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          let hang = Math.PI * 2 * j / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);
          let x = -sn * capsuleR;
          let y = height2 * sign;
          let z = cs * capsuleR;

          v.n = this.normalize([-x, 0, -z]);
          v.p = [x * scale, y * scale, z * scale];
          v.uv = [
            0.25 + 0.5 * i - sn * uvR,
            0.25 - sign * cs * uvR,
          ];
          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [3 + i, 0, 0, 0];
          v.weights = [1, 0, 0, 0];

          this.vts.push(v);
        }
      }

      for (let i = 0; i < 2; ++i) {
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          let hang = Math.PI * 2 * j / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);

          let x = - sn * capsuleR;
          let y = ((i === 0) ? 1 : -1) * height2;
          let z = cs * capsuleR;

          v.n = this.normalize([-x, 0, -z]);
          v.p = [x * scale, y * scale, z * scale];
          v.uv = [
            (j / div),
            0.5 + 0.5 * i,
          ];
          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [3 + i, 0, 0, 0];
          v.weights = [1, 0, 0, 0];

          this.vts.push(v);
        }
      }

    }

    this.textures.push(...param.texturePath);

    for (let i = 0; i < 1; ++i) {
      const m = new PMX.Material();
      m.nameJa = `材質00${i}`;
      m.nameEn = `mtl00${i}`;
      m.texIndex = 0;
      m.diffuse = [1, 1, 1, 1];
      m.specular = [0.2, 0.2, 0.2];
      m.specPower = 0.5;
      m.ambient = [0.7, 0.7, 0.7];
      m.edgeColor = [156/255, 130/255, 48/255, 1];
      let bits = 0
        //| PMX.Material.BIT_GROUND
        //| PMX.Material.BIT_TOMAP
        //| PMX.Material.BIT_SELFSHADOW
        ;
      m.bitFlag = bits;
      m.sharetoonflag = 0;
      m.sharetoonindex = -1;

      let offset = 2;
        for (let i = 0; i < 2; ++i) {
          for (let j = 0; j < div; ++j) {
            let v0 = i;
            let v1 = offset + i * (div + 1) + j;
            let v2 = v1 + 1;
            if (i === 0) {
              m.faces.push([v0, v1, v2]);
            } else {
              m.faces.push([v0, v2, v1]);             
            }
          }
        }

      offset += (div + 1) * 2;
        {
          for (let j = 0; j < div; ++j) {
            let v0 = offset + j;
            let v1 = v0 + 1;
            let v2 = v0 + (div + 1);
            let v3 = v2 + 1;
            m.faces.push([v0, v2, v1]);
            m.faces.push([v1, v2, v3]);
          }
        }

      this.materials.push(m);
    }

    for (let i = 0; i < 5; ++i) { // ボーン
      /**
       * ボーン
       */
      const b = new PMX.Bone();
      /**
       * 剛体
       */
      let rb = new PMX.Rigid();
      rb.bone = i;
      rb.nameJa = `rb${_pad(i, 3)}`;
      rb.nameEn = rb.nameJa;
      rb.shape = PMX.Rigid.SHAPE_BOX;

      let x = 0;
      let y = 0;
      let z = 0;
      if (i === 3) {
        y = height2;
      } else if (i === 4) {
        y = -height2;
      }

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
      rb.nameJa = `rb${_pad(i, 3)}`;
      rb.nameEn = rb.nameJa;

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
        rb = null;
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
        //this.rigids.push(rb);
      }
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
        mm.setValue(1);
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
