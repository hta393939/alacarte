/**
 * @file capsule8.js
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

const _rad = (deg) => {
    return deg * Math.PI / 180;
};

class CapsuleBuilder extends PMX.Maker {
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
 * 物理 SDEF してみたい。一旦できた。まんなかを動かす。
 */
    make(param) {
        const d = new Date();
    /**
    * 最終位置とサイズへの倍率
    */
        const scale = 1.0;
    /**
    * 上に逃がす
    */
        const step = 0.5;

        this.debug = 1;

        this.head.nameEn = param.nameEn;
        this.head.nameJa = this.head.nameEn;
        this.head.commentEn = `${d.toLocaleString()} CapsuleBuilder8.make`;
        this.head.commentJa = this.head.commentEn;

        let div = 16;
        let ringnums = [0, 0];

    /**
    * すべての親 0 メッシュ無し
    * 操作中心 1 メッシュ無し
    * センター 2 多分メッシュ無し
    */


    /**
    * ベースボーンインデックス
    */
        const baseBoneIndex = 3;
    /**
    * まんなかに配置かなぁ
    */
        const middleBoneIndex = 4;
    /**
    * 先端ボーンインデックス
    */
        const topBoneIndex = 5;

    /**
    * +Z は奥に伸びる。
    * 手前に青軸が表示されるものもあるがそっちは -Z
    */
        let offsetZ = 0;

        //const capsuleR = 1 / (2 * Math.PI);
        const capsuleR = 0.25;
        const revR = 1 / capsuleR;

        const uvinfos = [
            { cu: 0.5, cv: 0.5, rin: 0.1, rout: 0.2 }, // 奥 Z+ 
            { cu: 0.5, cv: 0.5, rin: 0.1, rout: 0.2 }, // 中
            { cu: 0.5, cv: 0.5, rin: 0.1, rout: 0.2 }, // 中
            { cu: 0.5, cv: 0.5, rin: 0.1, rout: 0.2 }, // 手前 Z-
            { cu: 0.5, cv: 0.5, rin: 0.1, rout: 0.2 }, // 手前 Z-
        ];

    // #7
        {
            for (let i = 0; i < div / 4; ++i) { // 奥半球 +Z
                for (let j = 0; j <= div; ++j) {
                    const v = new PMXVertex();
                    let vang = Math.PI * 2 * i / div;
                    let hang = Math.PI * 2 * j / div;
                    const cs = Math.cos(hang);
                    const sn = Math.sin(hang);
                    let rr = Math.sin(vang) * capsuleR;
                    let x = cs * rr;
                    let y = sn * rr;
                    let z = 0.25 + capsuleR * Math.cos(vang);
                    z += offsetZ;

                    v.n = this.normalize([x, y, z - 0.25]);
                    v.p = [x * scale, y * scale, z * scale];

                    v.uv = [
                        1 - (j / div),
                        1 - (z + 0.5),
                    ];

                    v.deformType = PMXVertex.DEFORM_BDEF1;
                    v.joints = [baseBoneIndex, 0, 0, 0];
                    v.weights = [1, 0, 0, 0];

                    this.vts.push(v);
                }
                ringnums[0] += 1;
            }
            for (let i = 0; i <= div; ++i) { // まんなか
                for (let j = 0; j <= div; ++j) {
                    const v = new PMXVertex();
                    const rr = capsuleR;
                    let hang = Math.PI * 2 * j / div;
                    const cs = Math.cos(hang);
                    const sn = Math.sin(hang);
                    let x = cs * rr;
                    let y = sn * rr;
                    // +0.25(奥) ～ -0.25(手前)
                    let z = - (i / div - 0.5) * 0.5;
                    z += offsetZ;

                    v.n = this.normalize([x, y, 0]);
                    v.p = [x * scale, y * scale, z * scale];

                    v.uv = [
                        1 - (j / div),
                        1 - (z + 0.5),
                    ];

                    v.deformType = PMXVertex.DEFORM_SDEF;
                    v.joints = [baseBoneIndex, topBoneIndex, 0, 0];
                    v.weights = [(z + 0.25) * 2,
                        0, 0, 0];
                    v.weights[1] = 1 - v.weights[0];
                    v.r0 = [0, 0, 0.25 * scale]; // +Z は奥
                    v.r1 = [0, 0, -0.25 * scale]; // -Z は手前
                    v.c = [0, 0, z];

                    this.vts.push(v);
                }
                ringnums[0] += 1;
            }
            for (let i = 1; i <= div/4; ++i) { // 手前半球 -Z
                for (let j = 0; j <= div; ++j) {
                    const v = new PMXVertex();
                    const vang = Math.PI * 2 * i / div;
                    const hang = Math.PI * 2 * j / div;
                    const cs = Math.cos(hang);
                    const sn = Math.sin(hang);
                    let rr = Math.cos(vang) * capsuleR;
                    let x = cs * rr;
                    let y = sn * rr;
                    let z = - 0.25 - capsuleR * Math.sin(vang);
                    z += offsetZ;

                    v.n = this.normalize([x, y, z + 0.25]);
                    v.p = [x * scale, y * scale, z * scale];

                    v.uv = [
                        1 - (j / div),
                        1 - (z + 0.5),
                    ];

                    v.deformType = PMXVertex.DEFORM_BDEF1;
                    v.joints = [topBoneIndex, 0, 0, 0];
                    v.weights = [1, 0, 0, 0];

                    this.vts.push(v);
                }
                ringnums[0] += 1;
            }
        }

        {
            let name = 'tex/LA_body_c.png';
            name = 'tex/a008.png';
            this.textures.push(name);
            //name = `tex/a001.png`;
            //this.textures.push(name);
        }

        for (let i = 0; i < 1; ++i) { // 材質 #8
            const m = new PMX.Material();
            m._index = i;
            m.nameJa = `材質00${i}`;
            m.nameEn = `mtl00${i}`;
            m.texIndex = 0;
            m.diffuse = [1, 1, 1, 1];
            m.specular = [0.2, 0.2, 0.2];
            m.specPower = 0.5;
            m.ambient = [0.7, 0.7, 0.7];
            m.edgecolor = [156/255, 130/255, 48/255, 1];
            let bits = PMX.Material.BIT_GROUND
                | PMX.Material.BIT_TOMAP
                | PMX.Material.BIT_SELFSHADOW
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
                        m.faces.push([v0, v2, v1]);
                        m.faces.push([v1, v2, v3]);
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
    * 一切衝突しないグループ(0-origin)
    */
        const RIGID_IGNORE_GROUP = 13;

    /**
    * 普通の衝突グループ(0-origin)
    * 自分にはぶつからないが 9(0-origin) にはぶつかる
    * 0x0f0f
    * グループUI2(1, 0-origin)
    */
        const RIGID_DEFAULT_GROUP = 5;

        for (let i = 0; i <= topBoneIndex; ++i) { // ボーン 6個 #8
            const rr = capsuleR;

            let j = new PMXJoint();
    /**
    * ボーン
    */
            let b = new PMXBone();
    /**
    * 剛体
    */
            let r = new PMX.Rigid();
            r.bone = i;
            r.type = PMX.Rigid.TYPE_STATIC;

            let x = 0;
            let y = i * step;
            let z = 0;
            r.p = [x * scale, y * scale, z * scale];
            r.rot = [0, 0, 0];
            r.size = [rr * scale, 0.5 * scale, 1 * scale];

            let bits = PMXBone.BIT_MOVE | PMXBone.BIT_ROT
                | PMXBone.BIT_VISIBLE;
            bits |= PMXBone.BIT_CONTROL;
            b.bits = bits;

            b.nameJa = `bone${_pad(i, 3)}`;
            b.nameEn = b.nameJa;
            r.nameJa = `rb${_pad(i, 2)}`;
            r.nameEn = r.nameJa;

            b.parent = i - 1;
            b.layer = 0;

            switch(i) { // #8
            case 0:
                b.nameJa = '全ての親';
                b.nameEn = 'root';
                r.group = RIGID_IGNORE_GROUP;
                r.groupFlags = 0x0000;
                r.shape = PMX.Rigid.SHAPE_BOX;
                r.size = [0.1, 0.05, 0.05];
                j = null;
                break;
            case 1:
                b.nameJa = '操作中心'; // 視点基準
                b.nameEn = 'view cnt bone';
                b.parent = -1;
                r.group = RIGID_IGNORE_GROUP;
                r.groupFlags = 0x0000;
                r.shape = PMX.Rigid.SHAPE_BOX;
                r.size = [0.05, 0.05, 0.1];
                r.rot = [0, 0, Math.PI * 30 / 180];
                j = null;
                break;
            case 2:
                b.parent = 0;
                b.nameJa = 'センター';
                b.nameEn = 'center';
                r.group = RIGID_IGNORE_GROUP;
                r.groupFlags = 0x0000;
                r.shape = PMX.Rigid.SHAPE_BOX;
                r.size = [0.05, 0.1, 0.05];
                r.rot = [Math.PI * 30 / 180, 0, 0];
                j = null;
                break;

            case baseBoneIndex:
                b.nameJa = '根っこ';
                b.p = [0, 0, +0.25 * scale];
                r.group = RIGID_IGNORE_GROUP;
                r.groupFlags = 0x0000;
                r.shape = PMX.Rigid.SHAPE_SPHERE;
                // 半径、高さ、不使用
                r.size = [capsuleR * scale, 1, 1];
                r.p = [...b.p];
                j = null;
                break;

            case middleBoneIndex:
                b.layer = 0;
                b.nameJa = 'まんなか';
                b.p = [0, 0, 0];
                r.friction = 1000;
                r.mass = 0.002; // 重量
                r.type = PMX.Rigid.TYPE_DYNAMIC;
                r.group = RIGID_DEFAULT_GROUP;
                r.groupFlags = 0x0f0f;
    /*
                r.shape = PMX.Rigid.SHAPE_SPHERE;
                // 半径、高さ、不使用
                r.size = [capsuleR * scale, 0.5 * scale, 1 * scale];
                r.p = [...b.p];
                */
                r.shape = PMX.Rigid.SHAPE_CAPSULE;
                // 半径、高さ、不使用
                r.size = [capsuleR * scale, 0.5 * scale * 0.5, 1 * scale];
                r.p = [b.p[0], b.p[1], (0 - 0.25 * scale) * 0.5];
                r.rot = [Math.PI * 0.5, 0, 0];
                r.rotDamping = 0.25;

                j.nameJa = `joint000`;
                j.nameEn = `joint000`;
                j.p = [0, 0, 0];
                j.rigids = [i - 1, i];
                // 移動固定
                j.moveUpper = [0, 0, 0];
                j.moveLower = [0, 0, 0];
                // これもしかして rot する前に対する制限か!?
                // ジョイントなので違う
                j.rotUpper = [_rad(120), _rad(120), _rad(120)];
                j.rotLower = [_rad(-120), _rad(-120), _rad(-120)];
                j.springRot = [20, 20, 20];
                break;

            case topBoneIndex:
                b.layer = 0;
                b.nameJa = '先端ボーン';
                b.p = [0, 0, -0.25 * scale];
                r = null;
                j = null;
                /*
                r.group = RIGID_IGNORE_GROUP;
                r.groupFlags = 0x0000;
                r.shape = PMX.Rigid.SHAPE_SPHERE;
                // 半径、高さ、不使用
                r.size = [capsuleR * scale, 0.5 * scale, 1 * scale];
                r.p = [...b.p];
                */
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

        { // モーフ 0個
            for (let i = 0; i < 0; ++i) {
                const m = new PMXMorph();
                m.nameJa = 'morph000';
                m.nameEn = 'morph000';
                m.type = 1;
                this.morphs.push(m);
            }
        }

        { // ボーングループフレーム
            for (let i = 0; i < 3; ++i) {
                const f = new PMXFrame();
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
        exports.module = exports = CapsuleBuilder;
    }
    exports.CapsuleBuilder8 = CapsuleBuilder;
} else {
    _global.CapsuleBuilder8 = CapsuleBuilder;
}

})(globalThis);


