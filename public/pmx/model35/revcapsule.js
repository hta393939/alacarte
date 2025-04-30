/**
 * @file revcapsule.js
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
 * 縦化
 */
class RevCapsule extends PMX.Maker {
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
    console.log('make', param);

    // param.fwRate の値で決まる
    //const useradius = param.useradius;

    /**
     * true でいいや
     */
    const _usePhy = true;
    /**
     * false でいいや
     */
    //const usedynamic = false;
    /**
     * 一次的に全
     */
    const usefull = true;
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

    /**
     * 内側の長さの半分
     */
    const halfAllLength = beltHeight * beltNum * 0.5;

    /**
     * この関数での半径制御関数
     * @param {number} t 0.0～1.0
     * @param {number} fwTarget 1.0 に対して縮める値
     * @returns 
     */
    const calcRadius = (t) => {
      const fwTarget = param.fwrate;
      const bwTarget = param.bwrate;

      const fw = 0.4;
      let bwAmp = (1 - bwTarget) * 0.5;
      let fwAmp = (1 - fwTarget) * 0.5;
      let bwCenter = 1 - bwAmp;
      let fwCenter = 1 - fwAmp;
      //let fwPower = 1 / 4;
      //let fwPower = 1 / 2;
      let fwPower = 1;
      if (t < fw) { // 前半 リバース側
        const ang = Math.pow(t / fw, fwPower) * Math.PI;
        let u = - Math.cos(ang) * fwAmp + fwCenter;

        const tx = beltHeight * beltNum;
        // fwPower が 1
        let tr = Math.sin(ang) * fwAmp * Math.PI / fw;
        // fwPower が 1 未満の場合
        //let tr = Math.sin(ang) * fwAmp * Math.PI * Math.pow(1 / fw, fwPower) * fwPower * Math.pow(t, fwPower - 1);
        if (Number.isNaN(tr)) {
          tr = 0;
        }

        return {r: u, nx: -tr, nr: tx};
      }
      // 後半 あってる
      const ang = (t - fw) / (1 - fw) * Math.PI;
      let u = Math.cos(ang) * bwAmp + bwCenter;

      const tx = beltHeight * beltNum;
      const tr = - Math.sin(ang) * Math.PI / (1 - fw) * bwAmp;

      return {r: u, nx: -tr, nr: tx};
    };


    this.head.nameEn = param.nameEn;
    this.head.nameJa = this.head.nameEn;
    let s = `${d.toLocaleString()} CenterCapsule.make forward\r\n`;
    s += `IK: ${_useIK}, 物理有り: ${_usePhy}, \r\n`;
    s += `scale: ${scale}, div: ${div}, beltNum: ${beltNum}\r\n`;
    s += `フルコリジョン: ${usefull}\r\n`;
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
        | PMX.Material.BIT_GROUND
        | PMX.Material.BIT_TOMAP
        //| PMX.Material.BIT_SELFSHADOW
      m.bitFlag = bits;
      m.sharetoonflag = 0;
      m.sharetoonindex = -1;

      m.sphereIndex = 1;
      m.sphereMode = 2; // 加算
      this.materials.push(m);
    }

    let vertexOffset = 0;
    let m = this.materials[0];
    {
// MARK: 最初の半分
      vertexOffset = this.vts.length;
      let adjustR = calcRadius(0).r * capsuleR;

      const allNum = div / 4 * 4;
      /** 外側半径 */
      const rt = 1 / 4;
      /** 内側半径 */
      const ri = 1 / 2;

      for (let i = 0; i <= allNum; ++i) { // 下半球 -Y
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          let vang = Math.PI * 2 * i / div;
          let hang = Math.PI * 2 * j / div;
          let cs = Math.cos(hang);
          let sn = Math.sin(hang);
          let rr = Math.sin(vang);
          let x = -sn * rr;
          let z = cs * rr;
          let y = -Math.cos(vang);

          if (i < allNum / 2) {// 曲1
            vang = Math.PI * 2 * i / (allNum / 2 * 4);
            hang = Math.PI * 2 * j / div;
            cs = Math.cos(hang);
            sn = Math.sin(hang);
            rr = Math.sin(vang);
            x = -sn * rr * -1;
            z =  cs * rr * -1;
            y = Math.cos(vang) * -1;
            v.n = this.normalize([x, y, z]);
            x *= -ri;
            y *= -ri;
            z *= -ri;
            y += 1;
          } else {
            vang = Math.PI * 2 * (i - allNum / 2) / (allNum / 2 * 2);
            hang = Math.PI * 2 * j / div;
            cs = Math.cos(hang);
            sn = Math.sin(hang);
            rr = -Math.cos(vang);
            x = -sn * rr;
            z =  cs * rr;
            y = -Math.sin(vang);
            v.n = this.normalize([x, y, z]);
            x *=  rt;
            y *=  rt;
            z *=  rt;
            x += -sn * (ri + rt);
            z +=  cs * (ri + rt);
          }

          x *= adjustR;
          y *= adjustR;
          z *= adjustR;
          y += -centerOffset;
          v.p = [x * scale, y * scale, z * scale];
          v.uv = [
            (j / div),
            i / (div / 4) / 4 * capV, // TODO: MARK: /4) / 4 でいいのか? 
          ];
          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [
            baseBoneIndex + (sideBoneNum * 1 - 1),
            0, 0, 0];
          v.weights = [1, 0, 0, 0];

          this.vts.push(v);
        }
      }
      for (let i = 0; i < allNum; ++i) {
        for (let j = 0; j < div; ++j) {
          let v0 = vertexOffset + (div + 1) * i + j;
          let v1 = v0 + 1;
          let v2 = v0 + (div + 1);
          let v3 = v2 + 1;

          // 元
          m.faces.push([v0, v2, v1]);
          m.faces.push([v1, v2, v3]);

          //m.faces.push([v0, v1, v2]);
          //m.faces.push([v1, v3, v2]);
        }
      }


/*
      vertexOffset = this.vts.length;
      let adjustR = calcRadius(0).r * capsuleR;
      for (let i = 0; i <= div / 4; ++i) { // 左半球 -X
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          let vang = Math.PI * 2 * i / div;
          let hang = Math.PI * 2 * j / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);
          let rr = Math.sin(vang);
          let x = -sn * rr;
          let z = cs * rr;
          let y = -Math.cos(vang);

          v.n = this.normalize([x, y, z]);
          x *= adjustR;
          y *= adjustR;
          z *= adjustR;
          y += -centerOffset;
          v.p = [x * scale, y * scale, z * scale];
          v.uv = [
            (j / div),
            i / (div / 4) * capV,
          ];
          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [
            baseBoneIndex + (sideBoneNum * 1 - 1),
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

          //if (i !== 0) {
            m.faces.push([v0, v2, v1]);
          //}
          m.faces.push([v1, v2, v3]);
        }
      }
*/


      let by = - centerOffset;
      for (let h = 0; h < beltNum; ++h) { // まんなか。座標ループ
        vertexOffset = this.vts.length;
        for (let i = 0; i <= div; ++i) {
          const py = by + i * beltHeight / div;
          const result = calcRadius((py - (-halfAllLength)) / (beltHeight * beltNum));
          adjustR = result.r * capsuleR;

          for (let j = 0; j <= div; ++j) {
            const v = new PMX.Vertex();
            let hang = Math.PI * 2 * j / div;
            const cs = Math.cos(hang);
            const sn = Math.sin(hang);

            
            let an = this.normalize([
              -0,
              result.nx,
              result.nr,
            ]);

            let y = an[0];
            let x = - sn * an[2];
            let z = cs * an[2];

            v.n = this.normalize([x, y, z]);

            y = py;
            x = - sn * adjustR;
            z = cs * adjustR;

            v.p = [x * scale, y * scale, z * scale];
            v.uv = [
              (j / div),
              i / div * beltV + capV,
            ];
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
            v.r0 = [by * scale, 0, 0];
            v.r1 = [(by + beltHeight) * scale, 0, 0];
            v.c = [y * scale, 0, 0];

            this.vts.push(v);
          }
        }
        by += beltHeight;

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
      console.log('上半分', 'by', by, 'vertexOffset', vertexOffset);
      adjustR = calcRadius(1).r * capsuleR;
      for (let i = 0; i <= div/4; ++i) { // 右半球 +Y
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          const vang = Math.PI * 2 * i / div;
          const hang = Math.PI * 2 * j / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);
          let rr = Math.cos(vang);
          let x = - sn * rr;
          let z = cs * rr;
          let y = Math.sin(vang);

          v.n = this.normalize([x, y, z]);
          x *= adjustR;
          y *= adjustR;
          z *= adjustR;
          y += centerOffset;
          v.p = [x * scale, y * scale, z * scale];
          v.uv = [
            (j / div),
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
      } // 上の半球

    }

    /**
     * 一切衝突しないグループ(1-origin)
     */
    const RIGID_IGNORE_GROUP = 14;

    /**
     * 普通の衝突グループ(1-origin UI)
     */
    const RIGID_DEFAULT_GROUP = 4;

    this.textures.push(...param.texturePath);

    for (let i = 0; i <= 2; ++i) { // ボーン
      /**
       * ボーン
       */
      let b = new PMX.Bone();
      /**
       * 剛体
       */
      let rb = new PMX.Rigid();
// 関連ボーンのインデックス
      rb.bone = i;
      rb.type = PMX.Rigid.TYPE_STATIC;
      rb.nameEn = `rb${_pad(i, 3)}`;
      rb.nameJa = rb.nameEn;
      rb.setUIGroup(RIGID_IGNORE_GROUP);
      rb.groupFlags = 0x0000;
      rb.shape = PMX.Rigid.SHAPE_BOX;
      rb.size = [0.05, 0.1, 0.05];
      rb.rot = [Math.PI * 30 / 180, 0, 0];

      let y = 0;
      let x = -3;
      let z = 3;
      rb.p = [x * scale, y * scale, z * scale];
      rb.size = [scale, scale, scale];

      let bits = PMX.Bone.BIT_MOVE | PMX.Bone.BIT_ROT
        | PMX.Bone.BIT_VISIBLE;
      bits |= PMX.Bone.BIT_CONTROL;
      b.bits = bits;

      b.parent = i - 1;

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
      }

      if (b) {
        this.bones.push(b);
      }
      if (rb && _usePhy) {
        this.rigids.push(rb);
      }
    }

    for (let h = 0; h < 2; ++h) {
      const dx = (h === 0) ? (-1) : 1;
      for (let i = 0; i < sideBoneNum; ++i) { // ボーン
        /**
         * ボーン
         */
        let b = new PMX.Bone();
        /**
         * 剛体
         */
        let rb = new PMX.Rigid();
        rb.bone = baseBoneIndex + sideBoneNum * h + i;
        rb.type = PMX.Rigid.TYPE_STATIC; // 追従
        rb.shape = PMX.Rigid.SHAPE_SPHERE;

        let y = beltHeight * 0.5 * i * dx;
        let x = -0;
        let z = 0;
        rb.size = [scale, scale, scale];
        b.p = [x * scale, y * scale, z * scale];

        let bits = PMX.Bone.BIT_MOVE | PMX.Bone.BIT_ROT
          | PMX.Bone.BIT_VISIBLE;
        bits |= PMX.Bone.BIT_CONTROL;
        b.bits = bits;
        /**
         * odd が tree
         */
        let opt = ((i & 1) === 0) ?
          'effleaf' : 'tree';
        const index = this.bones.length;
        b.nameJa = `b${_pad(index, 3)}${opt}`;
        b.nameEn = b.nameJa;
        rb.nameJa = `rb${_pad(index, 3)}`;
        rb.nameEn = rb.nameJa;

        b.parent = rb.bone - 1;

        switch (i) {
        case -1:
          b.layer = 1;
          b.nameJa = 'ik';
          b.nameEn = 'ik';
          b.parent = 0; // 全ての親
          rb = null;
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
          rb.friction = 1000;
          rb.mass = 0.002; // 重量
          rb.setUIGroup(RIGID_DEFAULT_GROUP);
          rb.setUINots(1, 2, // UI3 とは当たる
            5, 6, 7, 8,
            13, 14, 15, 16,
          );
          if ((i & 1) === 0) { // even がエフェクト
            b.parent = rb.bone - 1;
          } else { // odd が tree IK
            b.parent = rb.bone - 2;
            if (i + 2 < sideBoneNum) {
              b.bits |= PMX.Bone.BIT_BONECONNECT;
              b.endBoneIndex = rb.bone + 2;
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

          // 半径、不使用
          rb.size = [
            capsuleR * calcRadius((x - (-halfAllLength)) / (beltHeight * beltNum)).r * scale,
            scale,
            scale,
          ];
          rb.p = [...b.p];
          if (opt !== 'effleaf') {
            rb.setUIGroup(usefull ? RIGID_DEFAULT_GROUP : RIGID_IGNORE_GROUP);
            //rb = null;
          }
          break;
        }

        if (b) {
          this.bones.push(b);
        }
        if (rb && _usePhy) {
          this.rigids.push(rb);
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
    exports.module = exports = RevCapsule;
  }
  exports.RevCapsule = RevCapsule;
} else {
  _global.RevCapsule = RevCapsule;
}

})(globalThis);


