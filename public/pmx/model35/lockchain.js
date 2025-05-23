/**
 * @file lockchain.js
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
 * 
 */
class LockChain extends PMX.Maker {
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
 * 物理 SDEF してみたい。まんなかを動かす。
 * 常時物理
 */
  make(param) {
    const _belt = param.belt;

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
    const beltNum = _belt;
/**
 * 移動減衰
 */
    const moveDamp = 1;
    const rotDamp = 1;
/**
 * 普通の衝突グループ GUI 4
 */
    const RIGID_DEFAULT_GROUP = 4;
/**
 * 一切衝突しないグループ(1-origin)
 */
    const RIGID_IGNORE_GROUP = 14;

    this.debug = 1;

    this.head.nameEn = param.nameEn;
    this.head.nameJa = this.head.nameEn;
    let s = `${d.toLocaleString()} LockChain.make\r\n`;
    s += `damp: ${moveDamp}, ${rotDamp}\r\n`;
    s += `gui group: ${RIGID_DEFAULT_GROUP}`;
    s += `, scale: ${scale}, div: ${div}\r\n`;
    s += `belt: ${beltNum}\r\n`;
    s += `${param.texprefix}\r\n`;
    this.head.commentEn = s;
    this.head.commentJa = s;

/**
 * すべての親 0 メッシュ無し
 * 操作中心 1 メッシュ無し
 * センター 2 多分メッシュ無し
 */
/**
 * 
 */
    const BONE_CENTER = 2;

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

    let boneNum = 3 + beltNum * 2 + 1 + 1 + 1;
// ソート後ボーンリスト
    const sortedBones = [5, 3];
    for (let i = 0; i <= beltNum - 2; ++i) {
      sortedBones.push(i * 2 + 9);
    }
    console.log('sortedBones', sortedBones);

    let vertexOffset = 0;
    let m = this.materials[0];
    { // 頂点
      vertexOffset = this.vts.length;
      for (let i = 0; i <= div / 4; ++i) { // 上半球 +Y
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          let vang = Math.PI * 2 * i / div;
          let hang = Math.PI * 2 * j / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);
          let rr = Math.sin(vang) * capsuleR;
          let x = -sn * rr;
          let z =  cs * rr;
          let y = capsuleR * Math.cos(vang);

          v.n = this.normalize([x, y, z]);
          y += beltHeight * beltNum;

          v.p = [x * scale, y * scale, z * scale];
          v.uv = [
            (j / div),
            - i / (div / 4) * capV + 1,
          ];
          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [sortedBones[0], 0, 0, 0];
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


      let by = beltNum * beltHeight;
      for (let h = 0; h < beltNum; ++h) { // まんなか 上から下へ
        vertexOffset = this.vts.length;
        for (let i = 0; i <= div; ++i) {
          for (let j = 0; j <= div; ++j) {
            const v = new PMX.Vertex();
            const rr = capsuleR;
            let hang = Math.PI * 2 * j / div;
            const cs = Math.cos(hang);
            const sn = Math.sin(hang);
            let x = -sn * rr;
            let y = by - i * beltHeight / div;
            let z =  cs * rr;

            v.n = this.normalize([x, 0, z]);
            v.p = [x * scale, y * scale, z * scale];
            v.uv = [
              (j / div),
              - i / div * beltV + (1 - capV)];
            v.deformType = PMX.Vertex.DEFORM_SDEF;
            v.joints = [
              sortedBones[h],
              sortedBones[h + 1],
              0,
              0
            ];
            v.weights = [1 - i / div,
              0, 0, 0];
            v.weights[1] = 1 - v.weights[0];
            v.r0 = [0, by * scale, 0]; // +Z は奥
            v.r1 = [0, (by - beltHeight) * scale, 0]; // -Z は手前
            v.c = [0, y * scale, 0];

            this.vts.push(v);
          }
        }
        by += -beltHeight;

        for (let i = 0; i < div; ++i) {
          for (let j = 0; j < div; ++j) {
            let v0 = vertexOffset + (div + 1) * i + j;
            let v1 = v0 + 1;
            let v2 = v0 + (div + 1);
            let v3 = v2 + 1;
            m.faces.push([v0, v1, v2]);
            m.faces.push([v2, v1, v3]);
          }
        }
      }

      vertexOffset = this.vts.length;
      console.log('下半分', 'by', by, 'vertexOffset', vertexOffset);
      for (let i = 0; i <= div/4; ++i) { // 下半球 -Y
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          const vang = Math.PI * 2 * i / div;
          const hang = Math.PI * 2 * j / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);
          let rr = Math.cos(vang) * capsuleR;
          let x = -sn * rr;
          let z =  cs * rr;
          let y = -Math.sin(vang);

          v.n = this.normalize([x, y, z]);
          y = (y * capsuleR) + by;
          v.p = [x * scale, y * scale, z * scale];
          v.uv = [
            (j / div),
            (1 - i / (div / 4)) * capV,
          ];
          v.deformType = PMX.Vertex.DEFORM_BDEF1;
          v.joints = [sortedBones[sortedBones.length - 1], 0, 0, 0];
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
      } // 下の半球

    }

    {
      let name = `tex/${param.texprefix}013.png`;
      this.textures.push(name);
    }

    //const rotAng = _rad(90);
    const rotAng = _rad(45);
    for (let i = 0; i < boneNum; ++i) { // ボーン
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

      j.rotUpper = [rotAng, rotAng * 0, rotAng];
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

      case 3:
        j = null;
        b.parent = BONE_CENTER;
        b.bits |= PMX.Bone.BIT_BONECONNECT;
        b.endBoneIndex = 4;
        b.bits |= PMX.Bone.BIT_MOVE;
        b.nameEn = `b003effmove`;
        b.nameJa = b.nameEn;
        b.p = [0,
          (beltNum - 1) * beltHeight * scale,
          0];
        rb.p = [...b.p];
        rb.setUIGroup(RIGID_DEFAULT_GROUP);
        rb.setUINots(1, 2,
          5, 6,
          13, 14, 15, 16,
        );
        break;

      case 4:
        j = null;
        b.parent = 3;
        b.bits |= PMX.Bone.BIT_BONECONNECT;
        b.endBoneIndex = 5;
        b.nameJa = `b004tree`;
        b.nameEn = `b004tree`;
        b.p = [0,
          (beltNum * 2 - 1) * beltHeight * 0.5 * scale,
          0];
        rb.p = [...b.p];
        break;

      case 5:
        j = null;
        b.parent = 4;
        b.nameEn = `b005eff`;
        b.nameJa = `b005eff`;
        b.p = [0,
          beltNum * beltHeight * scale,
          0];
        rb.p = [...b.p];
        rb.setUIGroup(RIGID_DEFAULT_GROUP);
        rb.setUINots(1, 2,
          5, 6,
          13, 14, 15, 16,
        );
        break;

      case 6:
        j = null;
        b.parent = BONE_CENTER;
        b.bits |= PMX.Bone.BIT_MOVE;
        b.nameEn = 'b006lock';
        b.nameJa = b.nameEn;
        b.p = [0, 0, 0];
        rb.type = PMX.Rigid.TYPE_STATIC;
        rb.shape = PMX.Rigid.SHAPE_SPHERE;
        rb.setUIGroup(RIGID_IGNORE_GROUP);
        rb.groupFlags = 0x0000;
        rb.p = [...b.p];
        break;

      default:
        b.p = [
          0,
          (beltNum * 2 - (i - 5)) * beltHeight * 0.5 * scale,
          0];
        rb.friction = 1000;
        rb.mass = 0.002; // 重量
        if ((i & 1) !== 0) { // odd がエフェクト
          j = null;
          rb.type = PMX.Rigid.TYPE_STATIC;
          if (i === 7) {
            b.parent = 3; // 3の動きについていく
          } else {
            b.bits |= PMX.Bone.BIT_AFTERPHY; // 物理後
            b.parent = i - 1;
          }
        } else { // even が tree
          //rb.type = PMX.Rigid.TYPE_DYNAMIC;
          rb.type = PMX.Rigid.TYPE_DYNAMIC_POS;
          b.parent = i - 2;

          if (i + 2 < boneNum) { // 子ボーンが存在するとき
            b.bits |= PMX.Bone.BIT_BONECONNECT;
            b.endBoneIndex = i + 2;
          }
          if (i == 7 + 1) {
            b.parent = 3;
            console.log('match first tree', i, b.parent);
          }
          {
            j.p = [...b.p];
            j.rigids = [b.parent, i];
          }
          // TODO: 動的の場合はすべての親にぶらさげてみる
          //b.parent = 0;

          if (i === Math.floor((boneNum - 1) / 2) * 2) { // 一番最後
            console.log('last reverser joint', i, b.p);
            const j2 = new PMX.Joint();
            j2.nameEn = `j${_pad(i, 3)}lock`;
            j2.nameJa = j2.nameEn;
            j2.p = [...j.p];
            j2.rigids = [6, i];
            j2.rotUpper = [rotAng, 0, rotAng];
            j2.rotLower = [-rotAng, 0, -rotAng];
            j2.lockMove();
            this.joints.push(j2);
          }
        }
        if (i == 7) {
          b.nameJa += '根っこ';
        }
// 半径、不使用、不使用
        rb.size = [capsuleR * scale, scale, scale];
        rb.p = [...b.p];
        break;
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

    { // モーフ
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
    exports.module = exports = LockChain;
  }
  exports.LockChain = LockChain;
} else {
  _global.LockChain = LockChain;
}

})(globalThis);

