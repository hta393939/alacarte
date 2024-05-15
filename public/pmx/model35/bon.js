
// make() で生成
// sdef

(function(_global) {

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

class BonMaker extends PMX.Maker {
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
 * 
 */
  make(param) {
    const d = new Date();
    const radius = 10;
    const height = 1;
  /**
  * 最終位置とサイズへの倍率
  */
    const scale = 1.0;

    this.debug = 1;

    this.head.nameEn = param.nameEn;
    this.head.nameJa = this.head.nameEn;
    this.head.commentEn = `${d.toLocaleString()} bon`;
    this.head.commentJa = this.head.commentEn;

    let div = 16;

  /**
  * すべての親 0 メッシュ無し
  * 操作中心 1 メッシュ無し
  * センター 2 メッシュ
  */

    const ringnums = [0];
    {
      for (let i = 0; i <= div; ++i) { // 中心
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          let hang = Math.PI * 2 * j / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);
          let rr = radius * i / div;
          let x = cs * rr;
          let z = sn * rr;
          let y = 0;

          let t = i / (div * 2);
          v.n = this.normalize([
            _lerp(0, -x, t),
            _lerp(1,  0, t),
            _lerp(0, -z, t),
          ]);
          v.p = [x * scale, y * scale, z * scale];

          v.uv = [
            0.5 + x / radius * 0.25, // 半分まで
            0.5 + z / radius * 0.25,
          ];

          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [2, 0, 0, 0];
          v.weights = [1, 0, 0, 0];

          this.vts.push(v);
        }
        ringnums[0] += 1;
      }
      for (let i = 0; i <= div; ++i) { // ふち
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          let hang = Math.PI * 2 * j / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);
          let x = cs * radius;
          let z = sn * radius;
          let y = i / div * height;

          let t = (i + div) / (div * 2);
          v.n = this.normalize([
            _lerp(0, -x, t),
            _lerp(1,  0, t),
            _lerp(0, -z, t),
          ]);
          v.p = [x * scale, y * scale, z * scale];

          const rr = 0.25 + 0.25 * i / div;
          v.uv = [
            0.5 + cs * rr,
            0.5 + sn * rr,
          ];

          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [3, 0, 0, 0];
          this.vts.push(v);
        }
        ringnums[0] += 1;
      }

    }

    {
      let name = 'tex/bon.png';
      this.textures.push(name);
    }

    for (let i = 0; i < 1; ++i) { // 材質
      const m = new PMX.Material();
      m._index = i;
      m.nameJa = `材質00${i}`;
      m.nameEn = `mtl00${i}`;
      m.texIndex = 0;
      m.diffuse = [1, 1, 1, 1];
      m.specular = [0.2, 0.2, 0.2];
      m.specPower = 0.5;
      m.ambient = [0.7, 0.7, 0.7];
      m.edgeColor = [156/255, 130/255, 48/255, 1];
      let bits = 0;
        //PMX.Material.BIT_GROUND
        //| PMX.Material.BIT_TOMAP
        //| PMX.Material.BIT_SELFSHADOW
      m.bitFlag = bits;
      m.sharetoonflag = 0;
      m.sharetoonindex = -1;
      if (i === 0) {
        for (let k = 0; k < ringnums[0] - 1; ++k) {
          for (let j = 0; j < div; ++j) {
            let v0 = j + (div + 1) * k;
            let v1 = v0 + 1;
            let v2 = v0 + (div + 1);
            let v3 = v2 + 1;
            //m.faces.push([v0, v1, v2]);
            //m.faces.push([v1, v3, v2]);
            m.faces.push([v0, v3, v2]);
            m.faces.push([v0, v1, v3]);
          }
        }
      } else {
        for (let k = 0; k < ringnums[1] - 1; ++k) {
          for (let j = 0; j < div; ++j) {
            let v0 = j + (div + 1) * (k + ringnums[0]);
            let v1 = v0 + 1;
            let v2 = v0 + (div + 1);
            let v3 = v2 + 1;
            m.faces.push([v0, v1, v2]);
            m.faces.push([v1, v3, v2]);
          }
        }
      }
      this.materials.push(m);
    }

/**
 * 普通の衝突グループ(1-origin)
 * グループUI4(1-origin)
 */
    const RIGID_DEFAULT_GROUP = 4;

    for (let i = 0; i < 4; ++i) {
      let j = new PMX.Joint();
  /**
  * ボーン
  */
      let b = new PMX.Bone();

      let x = 0;
      let y = 0;
      let z = 0;
/**
 * 剛体
 */
      let r = new PMX.Rigid();
      r.bone = i;
      r.type = PMX.Rigid.TYPE_STATIC;
      r.p = [x * scale, -1 * scale, z * scale];
      r.rot = [0, 0, 0];
      r.size = [radius * scale, 1 * scale, radius * scale];
      r.setUIGroup(RIGID_DEFAULT_GROUP);
      r.shape = PMX.Rigid.SHAPE_BOX;

      let bits = PMX.Bone.BIT_MOVE | PMX.Bone.BIT_ROT
        | PMX.Bone.BIT_VISIBLE;
      bits |= PMX.Bone.BIT_CONTROL;
      b.bits = bits;

      b.nameJa = `b${_pad(i, 3)}`;
      b.nameEn = b.nameJa;
      r.nameJa = `rb${_pad(i, 2)}`;
      r.nameEn = r.nameJa;

      b.parent = i - 1;

      switch(i) {
      case 0:
        b.nameJa = '全ての親';
        b.nameEn = 'root';
        r = null;
        j = null;
        break;
      case 1:
        b.nameJa = '操作中心'; // 視点基準
        b.nameEn = 'view cnt bone';
        b.parent = -1;
        r = null;
        j = null;
        break;
      case 2:
        b.parent = 0;
        b.nameJa = 'センター';
        j = null;
        break;
      case 3:
        b.layer = 0;
        b.nameJa = '先端ボーン';
        b.p = [0, height * scale, 0];
        r = null;
        j = null;
        break;
      }

      if (b) {
        this.bones.push(b);
      }
      if (r) {
        this.rigids.push(r);
      }
      if (j) {
        this.joints.push(j);
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
      for (let i = 0; i < 4; ++i) {
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
        } else if (i === 2) {
          f.nameJa = '色';
          f.morphs.push(0, 1, 2);
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


if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports.module = exports = BonMaker;
  }
  exports.BonMaker = BonMaker;
} else {
  _global.BonMaker = BonMaker;
}

})(globalThis);


