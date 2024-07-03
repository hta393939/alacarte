
// make() で生成

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

class PitMaker extends PMX.Maker {
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
 * @param {number} param.denom
 */
  make(param) {
    const d = new Date();
    let div = 32;
    const height = 2;
    const inR = 1 / param.denom;
    const thinR = inR * 0.5;
    const outR = inR + thinR * 3;
    console.log('outR', outR, thinR, inR);

  /**
  * 最終位置とサイズへの倍率
  */
    const scale = 1.0;

    this.debug = 1;

    this.head.nameEn = param.nameEn;
    this.head.nameJa = this.head.nameEn;
    let comment = `${d.toLocaleString()} pit\r\n`;
    comment += `div: ${div}\r\n`;
    comment += `outR: ${outR}, thinR: ${thinR}, inR: ${inR}\r\n`;
    this.head.commentEn = comment;
    this.head.commentJa = this.head.commentEn;

/**
 * すべての親 0 メッシュ無し
 * 操作中心 1 メッシュ無し
 * センター 2 メッシュ
 */

    const ringnums = [0];
    {
      for (let i = 0; i <= div; ++i) { // cylinder
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          let hang = Math.PI * 2 * j / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);
          let x = cs * inR;
          let z = sn * inR;
          let y = - height + (thinR + height) * i / div;

          v.n = this.normalize([
            -x,
             0,
            -z,
          ]);
          if (i === 0) {
            x = 0;
            y = - height + (thinR + height) * 1 / div;
            z = 0;
            v.n = [0, 1, 0];
          }

          v.p = [x * scale, y * scale, z * scale];

          v.uv = [
            0.5 + x / outR * 0.5,
            0.5 + z / outR * 0.5,
          ];

          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [2, 0, 0, 0];
          v.weights = [1, 0, 0, 0];

          this.vts.push(v);
        }
        ringnums[0] += 1;
      }
      for (let i = 0; i <= div * 3 / 4; ++i) { // thin
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          let hang = Math.PI * 2 * j / div;
          let vang = Math.PI * 2 * i / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);
          let nx = - cs * Math.cos(vang);
          let ny =        Math.sin(vang);
          let nz = - sn * Math.cos(vang);
          let x = (inR + thinR) * cs + thinR * nx;
          let y = thinR * Math.sin(vang) + thinR;
          let z = (inR + thinR) * sn + thinR * nz;
          if (i >= div / 2) {
            nx = -nx;
            ny = -ny;
            nz = -nz;
            x = (inR + thinR * 3) * cs + nx * thinR;
            y = Math.sin(vang) * thinR + thinR;
            z = (inR + thinR * 3) * sn + nz * thinR;
          }

          v.n = this.normalize([nx, ny, nz]);
          v.p = [x * scale, y * scale, z * scale];
          v.uv = [
            0.5 + x / outR * 0.5,
            0.5 + z / outR * 0.5,
          ];

          v.deformType = PMX.Vertex.DEFORM_BDEF2;
          v.joints = [3, 2, 0, 0];
          const rate = y / (thinR * 2);
          v.weights = [1 - rate, rate, 0, 0];
          this.vts.push(v);
        }
        ringnums[0] += 1;
      }

    }

    { // 中心付近は 192 灰色
      let name = 'tex/pit.png';
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

      let bits = PMX.Bone.BIT_MOVE | PMX.Bone.BIT_ROT
        | PMX.Bone.BIT_VISIBLE;
      bits |= PMX.Bone.BIT_CONTROL;
      b.bits = bits;

      b.nameJa = `b${_pad(i, 3)}`;
      b.nameEn = b.nameJa;
      b.parent = i - 1;

      switch(i) {
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
        break;
      case 3:
        b.p = [0, 0 * scale, 0];
        break;
      }

      if (b) {
        this.bones.push(b);
      }
    }

    for (let i = 0; i < div; i += 2) {
      const ang = Math.PI * 2 * i / div;
      const rb = new PMX.Rigid();
      rb.nameEn = `rb${_pad(i, 3)}`;
      rb.nameJa = rb.nameEn;
      let x = Math.cos(ang) * (inR + thinR);
      let y = thinR;
      let z = Math.sin(ang) * (inR + thinR);

      rb.bone = 3;
      rb.type = PMX.Rigid.TYPE_STATIC;
      rb.p = [x * scale, y * scale, z * scale];
      rb.rot = [0, 0, 0];
      rb.size = [thinR * scale, 1 * scale, 1 * scale];
      rb.setUIGroup(RIGID_DEFAULT_GROUP);
      rb.groups = 0x0000;
      rb.friction = 0;
      rb.pong = 0;
      rb.shape = PMX.Rigid.SHAPE_SPHERE;
      
      this.rigids.push(rb);
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
        f.nameEn = `fr00${i}`;
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
    exports.module = exports = PitMaker;
  }
  exports.PitMaker = PitMaker;
} else {
  _global.PitMaker = PitMaker;
}

})(globalThis);


