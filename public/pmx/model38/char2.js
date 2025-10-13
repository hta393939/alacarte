
import { CharBuilder } from "./char.js";

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

export class CharBuilder2 extends CharBuilder {
  static L = 0;
  static R = 1;
  static lrname = ['左', '右'];

  constructor() {
    super();

    /** 分割数 */
    this.divnum = 16;
  }

  addOneJoint() {
    for (let i = 0; i < this.divnum; ++i) {
      for (let j = 0; j < this.divnum; ++j) {

      }
    }
  }

  addMultiJoint() {
    for (let i = 0; i < this.divnum; ++i) {
      for (let j = 0; j < this.divnum; ++j) {

      }
    }
  }

  /**
   * 原点から下へ延びる中間筒を生成する
   * @param {*} param 
   * @param {*} lr 
   */
  addMid(param, lr) {
    let vindex = this.vertices.length;
    for (let i = 0; i <= this.divnum; ++i) {
      for (let j = 0; j <= this.divnum; ++j) {
        let ang = (j % this.divnum) * Math.PI * 2 / this.divnum;
        let cs = Math.cos(ang);
        let sn = Math.sin(ang);
        const vtx = new PMX.Vertex();
        vtx.p = [cs, -i, sn];
        vtx.n = [cs, 0, sn];
        vtx.uv = [j / this.divnum, 1 - i / this.divnum];
        vtx._boneName[0] = '全ての親';
        vtx._boneName[1] = `${CharBuilder2.lrname[lr]}腕`;

        this.vertices.push(vtx);
      }
    }

    for (let i = 0; i < this.divnum; ++i) {
      for (let j = 0; j < this.divnum; ++j) {
        let v0 = vindex + (this.divnum + 1) + j;
        let v1 = v0 + 1;
        let v2 = v1 + (this.divnum + 1);
        let v3 = v2 + 1;
        this.faces.push([v0, v2, v1]);
        this.faces.push([v1, v2, v3]);
      }
    }
  }

  /**  */
  addArm(param, lr) {
    let vindex = this.vertices.length;
    this.addMid(param, lr);
    for (let i = 0; i < 0; ++i) {

    }
  }

  /**  */
  addLeg(param, lr) {
    let vindex = this.vertices.length;
    this.addMid(param, lr);
    for (let i = 0; i < 0; ++i) {

    }
  }

  /**  */
  addUpper(param) {
    {
      this.addArm(param, CharBuilder2.L);
      this.addArm(param, CharBuilder2.R);
      this.addHead(param);
      this.addHeadPart(param);
    }
  }

  /**  */
  addLower(param) {
    {
      this.addLeg(param, CharBuilder2.L);
      this.addLeg(param, CharBuilder2.R);
    }
  }

  /**  */
  addHead(param) {

  }

  /**  */
  addHeadPart(param) {

  }

  /**
   * 物理シンプルな箱
   */
  makeBox(param) {
    {
      const vs = [
        {p: [-1, 1, -1]}, // 手前
        {p: [ 1, 1, -1]},
        {p: [-1,-1, -1]}, // z
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

  }

  /**
   * シリンダー
   * UV は V0が上、V1が下
   */
  makeKeep(param) {
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
      for (let i = 0; i < 2; ++i) { // 天地
        const sign = (i === 0) ? 1 : -1;
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          let hang = Math.PI * 2 * j / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);
          let x = -sn * capsuleR;
          let y = height2 * sign;
          let z = cs * capsuleR;

          v.n = this.normalize([-x, -sign, -z]);
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

      for (let i = 0; i < 2; ++i) { // 筒
        const sign = (i === 0) ? 1 : -1;
        for (let j = 0; j <= div; ++j) {
          const v = new PMX.Vertex();
          let hang = Math.PI * 2 * j / div;
          const cs = Math.cos(hang);
          const sn = Math.sin(hang);

          let x = - sn * capsuleR;
          let y = sign * height2;
          let z = cs * capsuleR;

          v.n = this.normalize([-x, -sign, -z]);
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
      m.nameJa = `mtl00${i}`;
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
