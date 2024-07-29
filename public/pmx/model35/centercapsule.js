/**
 * @file centercapsule.js
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

class CenterCapsule extends PMX.Maker {
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
 * 中央から上の IK してみたい
 */
  make(param) {
    const useradius = param.useradius;

    /**
     * true でいいや
     */
    const _usePhy = true;
    /**
     * false でいいや
     */
    const usedynamic = false;
/**
 * ik 書き出しするかどうか
 */
    const _useIK = param.useik;

    const _belt = param.belt || 10;

    const d = new Date();
/**
 * 最終位置とサイズへの倍率
 */
    const scale = param.scale || (1 / 8);
    let div = 16;
//        const beltNum = 20;
    const beltNum = _belt;
    const halfBeltNum = _belt * 0.5;
    this.debug = 1;

    //const capsuleR = 1 / (2 * Math.PI);
    const capsuleR = 1;
/**
 * ベルト1個分
 */
    const beltHeight = capsuleR * 2;
/**
 * X軸 伸びた先
 */
    const centerOffset = beltHeight * halfBeltNum;

    const sideBoneNum = halfBeltNum * 2 + 1;

    this.head.nameEn = param.nameEn;
    this.head.nameJa = this.head.nameEn;
    let s = `${d.toLocaleString()} CenterCapsule.make forward\r\n`;
    s += `IK: ${_useIK}, phy: ${_usePhy}\r\n`;
    s += `scale: ${scale}, div: ${div}, beltNum: ${beltNum}\r\n`;
    s += `${param.texprefix}`;
    this.head.commentEn = s;
    this.head.commentJa = s;

/**
 * すべての親 0 メッシュ無し
 * 操作中心 1 メッシュ無し
 * センター 2 多分メッシュ無し
 */
/**
 * ベースボーンインデックス
 * @default 3
 */
    const baseBoneIndex = 3;

    const capV = 92 / 512;
    //const capV = 0.25;
    const beltV = 1 - capV * 2;

    for (let i = 0; i < 1; ++i) { // 材質
      const m = new PMX.Material();
      m._index = i;
      m.nameEn = `mtl${_pad(i, 3)}`;
      m.nameJa = m.nameEn;
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
    {
      vertexOffset = this.vts.length;
      for (let i = 0; i <= div / 4; ++i) { // 左半球 -X
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          let vang = Math.PI * 2 * i / div;
          let hang = Math.PI * 2 * j / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);
          let rr = Math.sin(vang) * capsuleR;
          let y = cs * rr;
          let z = sn * rr;
          let x = -capsuleR * Math.cos(vang);

          v.n = this.normalize([x, y, z]);
          x += -centerOffset;
          v.p = [x * scale, y * scale, z * scale];
          v.uv = [ (j / div),
            i / div * 4 * capV];
          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [baseBoneIndex + (sideBoneNum * 1 - 1),
            0, 0, 0];
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
          m.faces.push([v0, v1, v2]);
          m.faces.push([v2, v1, v3]);
        }
      }
      let bx = - centerOffset;
      for (let h = 0; h < beltNum; ++h) { // まんなか
        vertexOffset = this.vts.length;
        for (let i = 0; i <= div; ++i) {
          for (let j = 0; j <= div; ++j) {
            const v = new PMX.Vertex();
            const rr = capsuleR;
            let hang = Math.PI * 2 * j / div;
            const cs = Math.cos(hang);
            const sn = Math.sin(hang);
            let y = sn * rr;
            let x = bx + i * beltHeight / div;
            let z = cs * rr;

            v.n = this.normalize([0, y, z]);
            v.p = [x * scale, y * scale, z * scale];
            v.uv = [(j / div),
              i / div * beltV + capV];
            v.deformType = PMX.Vertex.DEFORM_SDEF;

            let fromCenter = (halfBeltNum - 1 - h);
            let rightBone = fromCenter * 2 + baseBoneIndex;
            let leftBone = rightBone + 2;
            if (h >= halfBeltNum) { // 右半分
              fromCenter = h - halfBeltNum;
              leftBone = fromCenter * 2 + baseBoneIndex + sideBoneNum;
              rightBone = leftBone + 2;
            }
            v.joints = [leftBone, rightBone, 0, 0];
            v.weights = [1 - i / div,
              0, 0, 0];
            v.weights[1] = 1 - v.weights[0];
            v.r0 = [bx * scale, 0, 0];
            v.r1 = [(bx + beltHeight) * scale, 0, 0];
            v.c = [x * scale, 0, 0];

            this.vts.push(v);
          }
        }
        bx += beltHeight;

        for (let i = 0; i < div; ++i) {
          for (let j = 0; j < div; ++j) {
            let v0 = vertexOffset + (div + 1) * i + j;
            let v1 = v0 + 1;
            let v2 = v0 + (div + 1);
            let v3 = v2 + 1;
            m.faces.push([v0, v2, v1]);
            m.faces.push([v2, v3, v1]);
          }
        }
      }

      vertexOffset = this.vts.length;
      console.log('右半分', 'bx', bx, 'vertexOffset', vertexOffset);
      for (let i = 0; i <= div/4; ++i) { // 右半球 +Y
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          const vang = Math.PI * 2 * i / div;
          const hang = Math.PI * 2 * j / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);
          let rr = Math.cos(vang) * capsuleR;
          let y = sn * rr;
          let z = cs * rr;
          let x = Math.sin(vang);

          v.n = this.normalize([x, y, z]);
          x += centerOffset;
          v.p = [x * scale, y * scale, z * scale];
          v.uv = [ (j / div),
            i / div * 4 * capV + (1 - capV),
          ];
          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [baseBoneIndex + sideBoneNum * 2 - 1,
            0, 0, 0];
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
          m.faces.push([v2, v3, v1]);
        }
      } // 右の半球

    }

    {
      let name = param.texurePath;
      this.textures.push(name);
    }
/**
 * 一切衝突しないグループ(1-origin)
 */
    const RIGID_IGNORE_GROUP = 14;

/**
 * 普通の衝突グループ(1-origin UI)
 */
    const RIGID_DEFAULT_GROUP = 4;

    for (let i = 0; i <= 2; ++i) { // ボーン
      const rr = capsuleR;
/**
 * ボーン
 */
      let b = new PMX.Bone();
/**
 * 剛体
 */
      let r = new PMX.Rigid();
// 関連ボーンのインデックス
      r.bone = i;
      r.type = PMX.Rigid.TYPE_STATIC;

      let x = 0;
      let y = 0;
      let z = 0;
      r.p = [x * scale, y * scale, z * scale];
      r.size = [rr * scale, 0.5 * scale, 1 * scale];

      let bits = PMX.Bone.BIT_MOVE | PMX.Bone.BIT_ROT
        | PMX.Bone.BIT_VISIBLE;
      bits |= PMX.Bone.BIT_CONTROL;
      b.bits = bits;

      b.parent = i - 1;
      b.layer = 0;

      switch (i) {
      case 0:
        b.nameJa = '全ての親';
        b.nameEn = 'root';
        r.setUIGroup(RIGID_IGNORE_GROUP);
        r.groupFlags = 0x0000;
        r.shape = PMX.Rigid.SHAPE_BOX;
        r.size = [0.1, 0.05, 0.05];
        break;
      case 1:
        b.nameJa = '操作中心'; // 視点基準
        b.nameEn = 'view cnt bone';
        b.parent = -1;
        r.setUIGroup(RIGID_IGNORE_GROUP);
        r.groupFlags = 0x0000;
        r.shape = PMX.Rigid.SHAPE_BOX;
        r.size = [0.05, 0.05, 0.1];
        r.rot = [0, 0, Math.PI * 30 / 180];
        break;
      case 2:
        b.parent = 0;
        b.nameJa = 'センター';
        b.nameEn = 'center';
        r.setUIGroup(RIGID_IGNORE_GROUP);
        r.groupFlags = 0x0000;
        r.shape = PMX.Rigid.SHAPE_BOX;
        r.size = [0.05, 0.1, 0.05];
        r.rot = [Math.PI * 30 / 180, 0, 0];
        break;
      }

      if (b) {
        this.bones.push(b);
      }
      if (r & _usePhy) {
        this.rigids.push(r);
      }
    }

    for (let h = 0; h < 2; ++h) {
      const dx = (h === 0) ? (-1) : 1;
      for (let i = 0; i < sideBoneNum; ++i) { // ボーン
        const rr = capsuleR;
/**
 * ボーン
 */
        let b = new PMX.Bone();
/**
 * 剛体
 */
        let r = new PMX.Rigid();
        r.bone = baseBoneIndex + sideBoneNum * h + i;
        r.type = PMX.Rigid.TYPE_STATIC; // 追従

        let x = beltHeight * 0.5 * i * dx;
        let y = 0;
        let z = 0;
        r.size = [rr * scale, 0.5 * scale, 1 * scale];
        b.p = [x * scale, y * scale, z * scale];

        let bits = PMX.Bone.BIT_MOVE | PMX.Bone.BIT_ROT
          | PMX.Bone.BIT_VISIBLE;
        bits |= PMX.Bone.BIT_CONTROL;
        b.bits = bits;
// odd が tree
        let opt = ((i & 1) === 0) ?
          'effleaf' : 'tree';
        const index = this.bones.length;
        b.nameJa = `b${_pad(index, 3)}${opt}`;
        b.nameEn = b.nameJa;
        r.nameJa = `rb${_pad(index, 3)}`;
        r.nameEn = r.nameJa;

        b.parent = r.bone - 1;
        b.layer = 0;

        switch (i) {
        case -1:
          b.layer = 1;
          b.nameJa = 'ik';
          b.nameEn = 'ik';
          b.parent = 0; // 全ての親
          r = null;
          b.bits |= PMX.Bone.BIT_IK;
          b.ikTargetBone = 0;
          b.p = [...this.bones[b.ikTargetBone].p];
          b.ikLoopCount = 40;
          b.ikLimitation = 2; // 約114度
          // ターゲットボーンを含まない
          for (let j = 4; j <= boneIndex - 3; j += 2) {
            const ik = new PMX.IKLink();
            ik.linkBone = j;
            ik.isLimitation = 1;
            const deg = 179;
            ik.upper = [ _rad(deg),  _rad(deg),  _rad(deg)];
            ik.lower = [-_rad(deg), -_rad(deg), -_rad(deg)];
            b.ikLinks.push(ik);
          }
          break;

        default:

          b.layer = 0;
          r.friction = 1000;
          r.mass = 0.002; // 重量
          r.setUIGroup(RIGID_DEFAULT_GROUP);
          r.setUINots(1, 2, // UI3 とは当たる
            5, 6, 7, 8,
            13, 14, 15, 16,
          );
          if ((i & 1) === 0) { // even がエフェクト
            b.parent = r.bone - 1;
            //b.layer = 3;
          } else { // odd が tree IK
            b.parent = r.bone - 2;
            if (i + 2 < sideBoneNum) {
              b.bits |= PMX.Bone.BIT_BONECONNECT;
              b.endBoneIndex = r.bone + 2;
            }
            if (i == 1) {
              b.parent = baseBoneIndex + sideBoneNum * h;
              console.log('match first ik', i, b.parent);
            }
          }
          if (i == 0) {
            b.nameJa += '根っこ';
            b.parent = baseBoneIndex - 1;
          }

  /*
        r.shape = PMXRigid.SHAPE_SPHERE;
        // 半径、高さ、不使用
        r.size = [capsuleR * scale, 0.5 * scale, 1 * scale];
        r.p = [...b.p];
        */
          r.shape = PMX.Rigid.SHAPE_CAPSULE;
        // カプセルだと 半径、高さ、不使用
          r.size = [capsuleR * scale, 0.5 * scale * 0.5, 1 * scale];
          r.p = [...b.p];
          if (opt !== 'effleaf') {
            r = null;
          }
          break;
        }

        if (b) {
          this.bones.push(b);
        }
        if (r & _usePhy) {
          this.rigids.push(r);
        }
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
    exports.module = exports = CenterCapsule;
  }
  exports.CenterCapsule = CenterCapsule;
} else {
  _global.CenterCapsule = CenterCapsule;
}

})(globalThis);


