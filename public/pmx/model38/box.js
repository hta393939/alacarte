/**
 * @file capsule.js
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

export class BoxBuilder extends PMX.Maker {
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
   * 物理シンプルな箱
   */
  make(param) {
    const d = new Date();
    const scale = 1.0;

    this.debug = 1;

    this.head.nameEn = param.nameEn;
    this.head.nameJa = this.head.nameEn;
    let comment = `${d.toLocaleString()} BoxBuilder.make\r\n`;
    comment += `箱\r\n`;
    comment += `長さ半: ${param.lenhalf}, 摩擦: ${param.usefriction}\r\n`;
    this.head.commentEn = '';
    this.head.commentJa = comment;

    {
      const vs = [
        {p: [-1, 1, -1]},
        {p: [ 1, 1, -1]},
        {p: [-1,-1, -1]},
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
            y * scale * param.lenhalf,
            z * scale * 1,
          ];
          v.uv = [
            men.uv[j*2+0],
            men.uv[j*2+1],
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
      m.nameJa = `材質00${i}`;
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
      m.sharetoonindex = 1;
      if (i === 0) {
        for (let k = 0; k < 6; ++k) {
            let v0 = 4 * k;
            let v1 = v0 + 1;
            let v2 = v0 + 2;
            let v3 = v0 + 3;
            m.faces.push([v0, v1, v2]);
            m.faces.push([v1, v3, v2]);
        }
      }
      this.materials.push(m);
    }

    for (let i = 0; i < 3; ++i) { // ボーン
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
      rb.bone = i;

      let x = 0;
      let y = 0;
      let z = 0;
      rb.p = [x * scale, y * scale, z * scale];
      rb.rot = [0, 0, 0];
      rb.size = [
        scale * 1,
        scale * param.lenhalf,
        1 * scale,
      ];
      rb.friction = param.usefriction ? 100 : 0;

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
      }

      this.bones.push(b);
      if (rb) {
        this.rigids.push(rb);
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
