/**
 * @file phycapsule.js
 */
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
/**
 * 度からradへ
 * @param {*} deg 
 * @returns 
 */
const _rad = (deg) => {
  return deg * Math.PI / 180;
};

/**
 * 物理カプセルにしたい
 */
class PhyCapsule extends PMX.Maker {
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
   * 物理 SDEF してみたい。
   * 常時物理
   */
  make(param) {
    const _belt = param.belt;

    const usephy = param.usephy;
    const usedynamic = param.usedynamic;

    const _indexByInclude = (s) => {
      return this.bones.findIndex(bone => {
        return bone.nameJa.includes(s);
      });
    };

    const d = new Date();
    /**
     * 最終位置とサイズへの倍率
     */
    const scale = param.scale;
    let div = 16;
    /**
     * ベルト数
     * @type {number}
     */
    const beltNum = _belt;
    /**
     * 移動減衰
     */
    const moveDamp = 1;
    const rotDamp = 1;
    /**
     * 普通の衝突グループ GUI
     * 自分にはぶつからない
     */
    const RIGID_DEFAULT_GROUP = 4;
    /**
     * 一切衝突しないグループ(1-origin)
     */
    const RIGID_IGNORE_GROUP = 14;

    this.debug = 1;

    /**
     * 
     * @param {number} t 0.0～1.0
     * @param {number} target 1.0 の半径に対して縮める値
     * @returns 
     */
    const calcRadius = (t) => {
      const fwTarget = param.fwrate; // t が 0 の方
      const bwTarget = param.bwrate; // t が 1 の方
      const fw = 0.4;
      let bwAmp = (1 - bwTarget) * 0.5;
      let fwAmp = (1 - fwTarget) * 0.5;
      let bwCenter = 1 - bwAmp;
      let fwCenter = 1 - fwAmp;
      const tx = beltHeight * beltNum;
      if (t < fw) {
        const ang = (t / fw) * Math.PI;
        let u = - Math.cos(ang) * fwAmp + fwCenter;
        const tr = Math.sin(ang) * fwAmp * Math.PI / fw;
        const obj = {
          r: u, nx: -tr, nr: tx,
        };
        return u;
      }
      const ang = (t - fw) / (1 - fw) * Math.PI;
      let u = Math.cos(ang) * bwAmp + bwCenter;
      const tr = - Math.sin(ang) * Math.PI / (1 - fw) * bwAmp;
      const obj = {
        r: u, nx: -tr, nr: tx,
      };
      return u;
    };

    this.head.nameEn = param.nameEn;
    this.head.nameJa = this.head.nameEn;
    let s = `${d.toLocaleString()} PhyCapsule.make\r\n`;
    s += `damp: ${moveDamp}, ${rotDamp}\r\n`;
    s += `gui group: ${RIGID_DEFAULT_GROUP}`;
    s += `, scale: ${scale}, div: ${div}\r\n`;
    s += `belt: ${beltNum}, bw: ${param.bwrate}\r\n`;
    s += `物理: ${usephy}, 動的: ${usedynamic}\r\n`;
    this.head.commentEn = s;
    this.head.commentJa = s;

/**
 * すべての親 0 メッシュ無し
 * 操作中心 1 メッシュ無し
 * センター 2 多分メッシュ無し
 */
    /**
     * ベースボーンインデックス
     * 下の半球
     */
    const baseBoneIndex = 3;

    //const capsuleR = 1 / (2 * Math.PI);
    const capsuleR = 1;
    /**
     * ベルト1個分
     */
    const beltHeight = capsuleR * 2;

    /**
     * 上下の空いてる幅
     */
    const capV = 92 / 512;
    //const capV = 0.25;
    /**
     * 内側の存在する部分の幅
     */
    const beltV = 1 - capV * 2;

    /**
     * 増えていくボーンインデックス
     */
    let boneIndex = baseBoneIndex;

    for (let i = 0; i < 1; ++i) { // 材質
      const m = new PMX.Material();
      m._index = i;
      m.nameEn = `mtl${_pad(i, 3)}`;
      m.nameJa = m.nameJa;
      m.texIndex = 0;
      m.diffuse = [1, 1, 1, 1];
      m.specular = [0.2, 0.2, 0.2];
      m.specPower = 0.5;
      m.ambient = [0.7, 0.7, 0.7];
      m.edgeColor = [156/255, 130/255, 48/255, 1];
      let bits = 0
        //PMX.Material.BIT_GROUND
        | PMX.Material.BIT_TOMAP
        | PMX.Material.BIT_SELFSHADOW
      m.bitFlag = bits;
      m.sharetoonflag = 0;
      m.sharetoonindex = -1;
      this.materials.push(m);
    }

    let vertexOffset = 0;
    let m = this.materials[0];
    { // 頂点
      vertexOffset = this.vts.length;

      for (let i = 0; i <= div / 4; ++i) { // 半球 -Y
        const result = calcRadius(0);
        let adjustR = capsuleR * calcRadius(0);
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          let vang = Math.PI * 2 * i / div;
          let hang = Math.PI * 2 * j / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);
          let rr = Math.sin(vang);
          let x = -sn * rr;
          let z =  cs * rr;
          let y = -Math.cos(vang);

          v.n = this.normalize([x, y, z]);
          x *= adjustR;
          y *= adjustR;
          z *= adjustR;

          v.p = [x * scale, y * scale, z * scale];
          v.uv = [
            (j / div),
            - i / (div / 4) * capV + 1,
          ];
          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [baseBoneIndex, 0, 0, 0];
          v.weights = [1, 0, 0, 0];

          this.vts.push(v);
        }
      }
      for (let i = 0; i < div / 4; ++i) {
        for (let j = 0; j < div; ++j) {
          let v0 = vertexOffset + (div + 1) * i + j;
          let v1 = v0 + 1;
          let v2 = v0 + (div + 1);
          let v3 = v2 + 1;
          m.faces.push([v0, v2, v1]);
          m.faces.push([v1, v2, v3]);
        }
      }

      console.log('boneIndex', boneIndex);
      let by = 0;
      for (let h = 0; h < beltNum; ++h) { // まんなか 上から下へ
        vertexOffset = this.vts.length;
        for (let i = 0; i <= div; ++i) {
          let py = by + i * beltHeight / div;
          const result = calcRadius(py / (beltHeight * beltNum));
          let adjustR = capsuleR * calcRadius(py / (beltHeight * beltNum));
          for (let j = 0; j <= div; ++j) {
            const v = new PMX.Vertex();
            const rr = 1;
            let hang = Math.PI * 2 * j / div;
            const cs = Math.cos(hang);
            const sn = Math.sin(hang);
            let x = -sn * rr;
            let y = 0;
            let z =  cs * rr;

            v.n = this.normalize([x, 0, z]);

            x *= adjustR;
            y *= adjustR;
            z *= adjustR;
            y += py;
            v.p = [x * scale, y * scale, z * scale];
            v.uv = [
              (j / div),
              - i / div * beltV + (1 - capV),
            ];
            v.deformType = PMX.Vertex.DEFORM_SDEF;
            v.joints = [boneIndex, boneIndex + 2, 0, 0];
            v.weights = [1 - i / div, 0, 0, 0];
            v.weights[1] = 1 - v.weights[0];
            v.r0 = [0, by * scale, 0]; // 下ボーン
            v.r1 = [0, (by + beltHeight) * scale, 0]; // 上ボーン
            v.c = [0, y * scale, 0]; // 同じ高さの根っこ

            this.vts.push(v);
          }
        }
        boneIndex += 2;
        by += beltHeight;

        for (let i = 0; i < div; ++i) {
          for (let j = 0; j < div; ++j) {
            let v0 = vertexOffset + (div + 1) * i + j;
            let v1 = v0 + 1;
            let v2 = v0 + (div + 1);
            let v3 = v2 + 1;
            m.faces.push([v0, v2, v1]);
            m.faces.push([v1, v2, v3]);
          }
        }
      }

      vertexOffset = this.vts.length;

      // by は中を上がっていく方
      console.log('半分', 'by', by, 'vertexOffset', vertexOffset);
      const result = calcRadius(1);
      let adjustR = calcRadius(1) * capsuleR; // 端1.0
      for (let i = 0; i <= div/4; ++i) { // 半球
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          const vang = Math.PI * 2 * i / div;
          const hang = Math.PI * 2 * j / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);
          let rr = Math.cos(vang);
          let x = -sn * rr;
          let z =  cs * rr;
          let y = Math.sin(vang);

          v.n = this.normalize([x, y, z]);
          x *= adjustR;
          y *= adjustR;
          z *= adjustR;
          y += by;
          v.p = [x * scale, y * scale, z * scale];
          v.uv = [
            (j / div),
            (1 - i / (div / 4)) * capV,
          ];
          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [boneIndex, 0, 0, 0];
          v.weights = [1, 0, 0, 0];

          this.vts.push(v);
        }          
      }
      for (let i = 0; i < div / 4; ++i) {
        for (let j = 0; j < div; ++j) {
          let v0 = vertexOffset + (div + 1) * i + j;
          let v1 = v0 + 1;
          let v2 = v0 + (div + 1);
          let v3 = v2 + 1;
          m.faces.push([v0, v2, v1]);
          m.faces.push([v1, v2, v3]);
        }
      } // 上の半球

    }

    { // テクスチャ
      let name = param.texturePath;
      this.textures.push(name);
    }

    for (let i = 0; i <= boneIndex; ++i) { // ボーン
      const rr = capsuleR;
/**
 * ボーン
 */
      let b = new PMX.Bone();
/**
 * 剛体
 */
      let rb = new PMX.Rigid();
      rb.bone = i;
      rb.type = PMX.Rigid.TYPE_STATIC;
      rb.groupFlags = 0x0000;
      rb.setUIGroup(RIGID_IGNORE_GROUP);
      rb.shape = PMX.Rigid.SHAPE_SPHERE;
      rb.moveDamping = moveDamp;
      rb.rotDamping = rotDamp;

      let j = new PMX.Joint();
      j.nameEn = `j${_pad(i, 3)}`;
      j.nameJa = j.nameEn;
      //const rotAng = _rad(90);
      const rotAng = _rad(45);
      j.rotUpper = [ rotAng,  rotAng * 0,  rotAng];
      j.rotLower = [-rotAng, -rotAng * 0, -rotAng];
      j.lockMove();

      let x = 0;
      let y = 0;
      let z = 0;
      rb.p = [x * scale, y * scale, z * scale];
      rb.size = [rr * scale, 0.5 * scale, 1 * scale];

      let bits = PMX.Bone.BIT_MOVE | PMX.Bone.BIT_ROT
        | PMX.Bone.BIT_VISIBLE;
      bits |= PMX.Bone.BIT_CONTROL;
      b.bits = bits;
// even が tree
      let opt = ((i & 1) === 0) ? 'tree' : 'effleaf';
      b.nameJa = `b${_pad(i, 3)}${opt}`;
      b.nameEn = b.nameJa;
      rb.nameJa = `rb${_pad(i, 3)}`;
      rb.nameEn = rb.nameJa;

      b.parent = i - 1;

      switch(i) {
      case 0:
        j = null;
        b.nameJa = '全ての親';
        b.nameEn = 'root';
        rb.shape = PMX.Rigid.SHAPE_BOX;
        rb.size = [0.1, 0.05, 0.05];
        break;
      case 1:
        j = null;
        b.nameJa = '操作中心'; // 視点基準
        b.nameEn = 'view cnt bone';
        b.parent = -1;
        rb.shape = PMX.Rigid.SHAPE_BOX;
        rb.size = [0.05, 0.05, 0.1];
        rb.rot = [0, 0, Math.PI * 30 / 180];
        break;
      case 2:
        j = null;
        b.parent = 0;
        b.nameJa = 'センター';
        b.nameEn = 'center';
        rb.shape = PMX.Rigid.SHAPE_BOX;
        rb.size = [0.05, 0.1, 0.05];
        rb.rot = [Math.PI * 30 / 180, 0, 0];
        break;

      default:
        b.p = [
          0,
          (i - baseBoneIndex) * beltHeight * 0.5 * scale,
          0,
        ];
        rb.friction = 1000;
        rb.mass = 0.002; // 重量
        rb.setUINots(
          1, 2,
          5, 6,
          13, 14, 15, 16,
        );
        if ((i & 1) !== 0) { // odd がエフェクト
          j = null;
          if (i !== baseBoneIndex) {
            if (usephy && usedynamic) {
              b.bits |= PMX.Bone.BIT_AFTERPHY;
            }
          }
          b.parent = i - 1;
        } else { // even が tree
          if (usephy && usedynamic) {
            rb.type = PMX.Rigid.TYPE_DYNAMIC_POS;
          }
          rb.setUIGroup(RIGID_DEFAULT_GROUP);
          b.parent = i - 2;

          if (i + 2 <= boneIndex) { // 子ボーンが存在するとき
            b.bits |= PMX.Bone.BIT_BONECONNECT;
            b.endBoneIndex = i + 2;
          }
          if (i == baseBoneIndex + 1) {
            b.parent = baseBoneIndex;
            console.log('match first tree', i, b.parent);
          }
          {
            j.p = [...b.p];
            j.rigids = [b.parent, i];
          }
        }
        if (i == baseBoneIndex) {
          b.nameJa += '根っこ';
        }
// 半径、不使用、不使用
        rb.size = [
          capsuleR * calcRadius(b.p[1] / scale / (beltHeight * beltNum)) * scale,
          scale,
          scale,
        ];
        rb.p = [...b.p];
        break;
      }

      if (!usephy) {
        rb = null;
        j = null;
      }

      if (b) {
        this.bones.push(b);
      }
      if (rb) {
        this.rigids.push(rb);
      }
      if (j) {
        this.joints.push(j);
      }
    }

    { // モーフ 3個
      for (let i = 0; i < 3; ++i) {
        const m = new PMX.Morph();
        m.panel = PMX.Morph.PANEL_ETC; // その他
        m.type = PMX.Morph.TYPE_MATERIAL;
        this.morphs.push(m);

        const mm = new PMX.MaterialMorph();
        m.materialMorphs.push(mm);
        mm.setValue(1);

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
          for (let j = 0; j < 3; ++j) {
            f.morphs.push(j);
          }
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
    exports.module = exports = PhyCapsule;
  }
  exports.PhyCapsule = PhyCapsule;
} else {
  _global.PhyCapsule = PhyCapsule;
}

})(globalThis);


