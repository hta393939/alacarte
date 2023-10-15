/**
 * @file pmxwriter.js
 */
// 2023-10-14 1

(function(_global) {

class PMXVertex {
/**
 * BDEF1
 */
    static DEFORM_BDEF1 = 0;
/**
 * BDEF2
 */
    static DEFORM_BDEF2 = 1;
/**
 * 4参照
 * @default 2
 */
    static DEFORM_BDEF4 = 2;
/**
 * spherical deform
 * @default 3
 */
    static DEFORM_SDEF = 3;

/**
 * 共用のトゥーン
 * 1
 */
    static TOONTYPE_SHARE = 1;
/**
 * テクスチャでトゥーン
 * 0
 */
    static TOONTYPE_TEXTURE = 0;

    constructor() {
        this.p = [0, 0,  0];
        this.n = [0, 0, -1];
/**
 * V成分は上から下が 0.0～1.0
 */
        this.uv = [0.5, 0.5];

        this.deformType = PMXVertex.DEFORM_BDEF2;
        this.weights = [1, 0, 0, 0];
        this.joints  = [0, 1, 0, 0];
/**
 * エッジ倍率
 */
        this.edgeRate = 1.0;

        this.c  = [0, 0, 0];
        this.r0 = [0, 0, 0];
        this.r1 = [0, 0, 0];
    }
}

class PMXIKLink {
    constructor() {
/**
 * リンクボーンのボーンインデックス
 */
        this.linkBone = -1;
/**
 * 角度制限 0: OFF, 1: ON
 */
        this.isLimitation = 0;
/**
 * 下限ラジアン
 */
        this.lower = [0, 0, 0];
/**
 * 上限ラジアン
 */
        this.upper = [0, 0, 0];
    }
}

class PMXBone {
/**
 * 接続先、bone で指定
 */
    static BIT_BONECONNECT = 0x0001;
/**
 * 回転可能
 */
    static BIT_ROT = 0x0002;
/**
 * 移動可能
 */
    static BIT_MOVE = 0x0004;
/**
 * 表示
 */
    static BIT_VISIBLE = 0x0008;
/**
 * 操作可
 */
    static BIT_CONTROL = 0x0010;
    static BIT_IK = 0x0020;
    static BIT_ROTAPPLY = 0x0100;
    static BIT_MOVAPPLY = 0x0200;
    static BIT_FIXAXIS = 0x0400;
    static BIT_LOCALAXIS = 0x0800;
    static BIT_AFTERPHY = 0x1000;
    static BIT_EXTERNALPARENT = 0x2000;

    constructor() {
        this.nameJa = 'boon000';
        this.nameEn = 'bone000';
/**
 * 16bit 値
 */
        this.bits = 0;
/**
 * 位置
 */
        this.p = [0, 0, 0];
/**
 * 親ボーンインデックス
 * @default -1
 */
        this.parent = -1;
/**
 * 変形階層
 * @default 0
 */
        this.layer = 0;
/**
 * 座標オフセット(接続先: 0)
 */
        this.endOffset = [0, 0, 1];
/**
 * 接続先: 1
 */
        this.boneConnect = -1;
/**
 * 付与親ボーン
 */
        this.applyParent = -1;
/**
 * 付与率
 */
        this.applyRate = 0;
/**
 * 軸固定: 1 の場合の軸の方向ベクトル
 */
        this.axisVector = [0, 0, 1];
/**
 * ローカル軸: 1 の場合
 */
        this.xLocalVector = [1, 0, 0];
/**
 * ローカル軸: 1 の場合
 */
        this.zLocalVector = [0, 0, 1];
/**
 * 外部親変形: 1 の場合の key値
 */
        this.externalParentKey = -1;

        this.ikTargetBone = -1;
        this.ikLoopCount = 255;
/**
 * ラジアン値
 */
        this.ikLimitation = 0;
/**
 * @type {PMXIKLink[]}
 */
        this.ikLinks = [];
    }
}

class PMXMaterial {
/**
 * 両面
 */
    static BIT_DOUBLE = 0x01;
/**
 * 地面影
 */
    static BIT_GROUND = 0x02;
/**
 * セルフシャドウマップへの描画
 */
    static BIT_TOMAP = 0x04;
/**
 * セルフシャドウ
 */
    static BIT_SELFSHADOW = 0x08;
/**
 * エッジ有効
 */
    static BIT_EDGE = 0x10;

    constructor() {
        this.nameJa = 'mate000';
        this.nameEn = 'mtl000';
/**
 * rgba
 */
        this.diffuse = [1, 1, 1, 1];
        this.specPower = 5;
        this.specular = [0.5, 0.5, 0.5];
        this.ambient = [0.2, 0.2, 0.2];
/**
 * ビットフラッグ
 */
        this.bitFlag = 0;
/**
 * rgba
 */
        this.edgeColor = [1, 1, 1, 1];
/**
 * エッジサイズ
 */
        this.edgeSize = 1;
/**
 * テクスチャインデックス
 */
        this.texIndex = 0;
/**
 * スフィアテクスチャインデックス
 */
        this.sphereIndex = -1;
/**
 * 0: 無効、1: 乗算、2: 加算
 */
        this.sphereMode = 0;

        this.memo = 'メモ';
/**
 * 面配列
 */
        this.faces = [];
    }
}


class PMXMorph {
    static PANEL_SYSTEM = 0;
    static PANEL_B = 1;
    static PANEL_EYE = 2;
    static PANEL_MOUTH = 3;
    static PANEL_ETC = 4;
    static TYPE_GROUP = 0;
    static TYPE_VERTEX = 1;
    static TYPE_BONE = 2;
    static TYPE_UV = 0;
    static TYPE_MATERIAL = 8;
    constructor() {
        this.nameJa = 'moruhu000';
        this.nameEn = 'morph000';

        this.panel = PMXMorph.PANEL_ETC;
        this.type = PMXMorph.TYPE_VERTEX;

        this.ones = [];
    }
}

class PMXMaterialMorph {
    constructor() {
        this.type = PMXMorph.TYPE_MATERIAL;
        
        
    }
}

class PMXFrame {
    constructor() {
/**
 * 日本語名
 */
        this.nameJa = 'hureemu000';
/**
 * 英語名
 */
        this.nameEn = 'frame000';
/**
 * 0: 通常, 1: 特殊
 */
        this.specialFlag = 0;
/**
 * @type {number[]}
 */
        this.bones = [];
    }
}

class PMXRigid {
    static SHAPE_SPHERE = 0;
    static SHAPE_BOX = 1;
    static SHAPE_CAPSULE = 2;
/**
 * ボーンの位置にセットされる
 */
    static TYPE_STATIC = 0;
/**
 * この物理でボーンを移動する
 */
    static TYPE_DYNAMIC = 1;
/**
 * この物理が移動してボーンを位置合わせする
 */
    static TYPE_DYNAMIC_POS = 2;

    constructor() {
        this.nameJa = '剛体000';
        this.nameEn = 'rigid000';
/**
 * -1 は関連ボーン無し
 */
        this.bone = -1;
/**
 * 所属グループ #0～#15
 */
        this.group = 0;
/**
 * 衝突するグループのフラグ。衝突する側でよい。GUI のチェックとは逆。
 * 上のビットが#15で下のビットが#0
 */
        this.groupFlags = 0x7fff;
/**
 * サイズ
 * 球の場合、半径
 * カプセルの場合、半径、内高さ、不使用
 * 箱の場合、
 */
        this.size = [1, 1, 1];
/**
 * 位置
 */
        this.p = [0, 0, 0];
/**
 * 回転
 */
        this.rot = [0, 0, 0];

        this.weight = 2;
        this.moveDamping = 0;
/**
 * 回転減衰。0だと減衰しない。
 */
        this.rotDamping = 0;
        this.pong = 0;
        this.friction = 0;

        this.type = PMXRigid.TYPE_STATIC;
    }
}

class PMXJoint {
    constructor() {
        this.nameJa = 'ジョイント000';
        this.nameEn = 'joint000';

        this.type = 0;

/**
 * A剛体、B剛体のインデックス
 */
        this.rigids = [-1, -1];

        this.p = [0, 0, 0];
/**
* ラジアン角
*/
        this.rot = [0, 0, 0];
        this.moveLower = [-999, -999, -999];
        this.moveUpper = [ 999,  999,  999];
/**
 * 上限。ラジアンで指定する。
 * "-360度"～"+360度"を指定すると回転しなくなるので注意。
 */
        this.rotUpper = [ Math.PI,  Math.PI,  Math.PI];
        this.rotLower = [-Math.PI, -Math.PI, -Math.PI];
/**
 * 移動のバネ
 */
        this.springMove = [0, 0, 0];
/**
 * 回転のバネ
 */
        this.springRot  = [0, 0, 0];
    }
}

class PMXSoftBody {
    constructor() {
        this.nameJa = 'sohuto000';
        this.nameEn = 'softbody000';

    }
}



/**
 * サイズ格納は4バイトで固定する
 */
class PMXObject {
    constructor() {
        this.head = {
            nameJa: '',
            nameEn: '',
            commentJa: '',
            commentEn: '',
        };
/**
 * @type {PMXVertex[]}
 */
        this.vts = [];
/**
 * @type {PMXBone[]}
 */
        this.bones = [];
/**
 * @type {string[]}
 */
        this.textures = [];
/**
 * @type {PMXMaterial[]}
 */
        this.materials = [];
/**
 * @type {PMXMorph[]}
 */
        this.morphs = [];
/**
 * @type {PMXFrame[]}
 */
        this.frames = [];
/**
 * @type {PMXRigid[]}
 */
        this.rigids = [];
/**
 * @type {PMXJoint[]}
 */
        this.joints = [];
/**
 * ソフト
 * @type {PMXSoftBody[]}
 */
        this.softs = [];

/**
 * カーソル位置(バイト)
 */
        this.c = 0;

/**
 * 文字列
 */
        this.encoding = 'UTF-8';
/**
 * 追加UV数
 */
        this.adduvnum = 0;

/**
 * 頂点インデックスバイト数
 */
        this.vtxbnum = 4;
        this.texbnum = 4;
        this.mtlbnum = 4;
/**
 * ボーンインデックスバイト数
 */
        this.bonbnum = 4;
        this.mrpbnum = 4;
        this.rgdbnum = 4;
    }
}

class PMXParser extends PMXObject {
    constructor() {
        super();

        this.debug = 0;
    }    

    log(...args) {
        if (this.debug > 0) {
            console.log(...args);
        }
    }

    clear() {
        this.c = 0;

        this.nameJa = '';
        this.nameEn = '';
        this.commentJa = '';
        this.commentEn = '';

        this.vts = [];
        this.faces = [];
        this.textures = [];
        this.materials = [];
        this.bones = [];
        this.morphs = [];
        this.frames = [];

        this.rigids = [];
        this.joints = [];
        this.softs = [];
    }

/**
 * 
 * @param {DataView} p 
 * @param {number} num 
 * @returns {number[]}
 */
    readu32s(p, num) {
        const buf = new Uint32Array(num);
        for (let i = 0; i < num; ++i) {
            buf[i] = p.getUint32(this.c, true);
            this.c += 4;
        }
        return buf;
    }
/**
 * 
 * @param {DataView} p 
 * @param {number} num 
 * @returns {number[]}
 */
    readu16s(p, num) {
        const buf = new Uint16Array(num);
        for (let i = 0; i < num; ++i) {
            buf[i] = p.getUint16(this.c, true);
            this.c += 2;
        }
        return buf;
    }
/**
 * 
 * @param {DataView} p 
 * @param {number} num 
 * @returns {number[]}
 */
    readu8s(p, num) {
        const buf = new Uint8Array(num);
        for (let i = 0; i < num; ++i) {
            buf[i] = p.getUint8(this.c);
            this.c += 1;
        }
        return buf;
    }
/**
 * 
 * @param {DataView} p 
 * @param {number} num 
 * @returns {number[]}
 */
    readf32s(p, num) {
        const buf = new Float32Array(num);
        for (let i = 0; i < num; ++i) {
            buf[i] = p.getFloat32(this.c, true);
            this.c += 4;
        }
        return buf;
    }
/**
 * pmx 文字列を読み取る
 * @param {DataView} p 
 * @param {number} num 
 * @returns {string}
 */
    readstr(p) {
        const num = p.getUint32(this.c, true);
        this.c += 4;

        if (this.encoding === 'UTF-8') {
            return new TextDecoder().decode(this.readu8s(p, num));
        }

        let s = '';
        for (let i = 0; i < num / 2; ++i) {
            const code = p.getUint16(this.c, true);
            s += String.fromCodePoint(code);
            this.c += 2;
        }
        return s;
    }

/**
 * インデックス整数読み取り用
 * @param {DataView} p 
 * @param {number} num 
 * @param {number} byteNum 
 */
    readints(p, num, byteNum) {
        switch(byteNum) {
            case 4:
                return this.readu32s(p, num);
            case 2:
                return this.readu16s(p, num);
            case 1:
                return this.readu8s(p, num);
        }
    }

/**
 * API. 
 * @param {ArrayBuffer} ab 
 */
    parse(ab) {
        this.clear();
        const p = new DataView(ab);

        { // ヘッダ
            const fs = this.readf32s(p, 2);
            const num = this.readu8s(p, 1)[0];
            const heads = this.readu8s(p, num);
            {
                if (heads[0] === 1) {
                    this.encoding = 'UTF-8';
                } else {
                    this.encoding = 'UTF-16';
                }
                this.adduvnum = heads[1];
                this.vtxbnum = heads[2];
                this.texbnum = heads[3];
                this.mtlbnum = heads[4];
                this.bonbnum = heads[5];
                this.mrpbnum = heads[6];
                this.rgdbnum = heads[7];
            }

            console.log('heads', heads);
        }
        { // 4名
            this.nameJa = this.readstr(p);
            this.nameEn = this.readstr(p);
            this.commentJa = this.readstr(p);
            this.commentEn = this.readstr(p);
        }

        { // vertex
            const num = this.readu32s(p, 1)[0];
            console.log('vertex num', num);
            for (let i = 0; i < num; ++i) {
                const vtx = new PMXVertex();
                const fs = this.readf32s(p, 8);
                vtx.p = [fs[0], fs[1], fs[2]];
                vtx.n = [fs[3], fs[4], fs[5]];
                vtx.uv = [fs[6], fs[7]];
                if (this.adduvnum >= 1) {
                    console.warn('not implemented add uv');
                }
                vtx.deformType = this.readu8s(p, 1)[0];
                switch(vtx.deformType) {
                case PMXVertex.DEFORM_BDEF1:
                    vtx.joints[0] = this.readints(p, 1, this.bonbnum)[0];
                    vtx.weights[0] = 1;
                    break;
                case PMXVertex.DEFORM_BDEF2:
                    {
                        const its = this.readints(p, 2, this.bonbnum);
                        vtx.joints[0] = its[0];
                        vtx.joints[1] = its[1];
                        vtx.weights[0] = this.readf32s(p, 1)[0];
                        vtx.weights[1] = 1 - vtx.weights[0];
                    }
                    break;
                case PMXVertex.DEFORM_BDEF4:
                    vtx.joints = this.readints(p, 4, this.bonbnum);
                    vtx.weights = this.readf32s(p, 4);
                    break;
                case PMXVertex.DEFORM_SDEF:
                    {
                        const its = this.readints(p, 2, this.bonbnum);
                        vtx.joints[0] = its[0];
                        vtx.joints[1] = its[1];
                        const fs = this.readf32s(p, 10);
                        vtx.weights[0] = fs[0];
                        vtx.weights[1] = 1 - fs[0];
                        vtx.c = fs.slice(1, 4);
                        vtx.r0 = fs.slice(4, 7);
                        vtx.r1 = fs.slice(7, 10);
                    }

                    break;
                default:
                    console.warn('unknown deform', i, vtx.deformType);
                    break;
                }
                vtx.edgeRate = this.readf32s(p, 1)[0];

                this.vts.push(vtx);
            }
        }
        { // face
            const num = this.readu32s(p, 1)[0];
            console.log('face num', num);
            this.faces = this.readints(p, num, this.vtxbnum);
        }
        { // texture
            const num = this.readu32s(p, 1)[0];
            for (let i = 0; i < num; ++i) {
                const tpath = this.readstr(p);
                this.textures.push(tpath);
            }
            console.log('texture', this.textures);
        }
        { // material
            const num = this.readu32s(p, 1)[0];
            for (let i = 0; i < num; ++i) {
                const m = new PMXMaterial();
                m.nameJa = this.readstr(p);
                m.nameEn = this.readstr(p);
                const fs = this.readf32s(p, 11);
                m.diffuse = fs.slice(0, 4);
                m.specular = fs.slice(4, 7);
                m.specPower = fs[7];
                m.ambient = fs.slice(8, 11);
                m.bitFlag = this.readu8s(p, 1)[0];
                m.edgeColor = this.readf32s(p, 4);
                m.edgeSize = this.readf32s(p, 1)[0];

                m.texIndex = this.readints(p, 1, this.texbnum)[0];
                m.sphereIndex = this.readints(p, 1, this.texbnum)[0];

                m.sphereMode = this.readu8s(p, 1)[0];

                m.sharetoonflag = this.readu8s(p, 1)[0];
                if (m.sharetoonflag === 0) {
                    m.sharetoonindex = this.readints(p, 1, this.texbnum)[0];
                } else {
                    m.sharetoonindex = this.readu8s(p, 1)[0];
                }

                m.memo = this.readstr(p);
                const num = this.readu32s(p, 1)[0];
                m.faces = new Array(num);              

                this.materials.push(m);
            }
            console.log('material', this.materials);
        }
        { // bone
            const num = this.readu32s(p, 1)[0];
            for (let i = 0; i < num; ++i) {
                const b = new PMXBone();
                b.nameJa = this.readstr(p);
                b.nameEn = this.readstr(p);
                b.p = this.readf32s(p, 3);
                b.parent = this.readints(p, 1, this.bonbnum);
                b.layer = this.readu32s(p, 1)[0];
                b.bits = this.readu16s(p, 1)[0];
                if (b.bits & PMXBone.BIT_BONECONNECT) {
                    b.boneConnect = this.readints(p, 1, this.bonbnum);
                } else {
                    b.endOffset = this.readf32s(p, 3);
                }
                if ((b.bits & PMXBone.BIT_ROTAPPLY)
                    || (b.bits & PMXBone.BIT_MOVAPPLY)) {
                    b.applyParent = this.readints(p, 1, this.bonbnum)[0];
                    b.applyRate = this.readf32s(p, 1)[0];
                }
                if (b.bits & PMXBone.BIT_FIXAXIS) {
                    b.axisVector = this.readf32s(p, 3);
                }
                if (b.bits & PMXBone.BIT_LOCALAXIS) {
                    b.xLocalVector = this.readf32s(p, 3);
                    b.zLocalVector = this.readf32s(p, 3);
                }
                if (b.bits & PMXBone.BIT_EXTERNALPARENT) {
                    b.externalParentKey = this.readu32s(p, 1)[0];
                }
                if (b.bits & PMXBone.BIT_IK) {
                    b.ikTargetBone = this.readints(p, 1, this.bonbnum)[0];
                    b.ikLoopCount = this.readu32s(p, 1)[0];
                    b.ikLimitation = this.readf32s(p, 1)[0];
                    const linknum = this.readu32s(p, 1)[0];
                    for (let j = 0; j < linknum; ++j) {
                        const link = new PMXIKLink();
                        link.linkBone = this.readints(p, 1, this.bonbnum)[0];
                        link.isLimitation = this.readu8s(p, 1)[0];
                        if (link.isLimitation) {
                            link.lower = this.readf32s(p, 3);
                            link.upper = this.readf32s(p, 3);
                        }
                        b.ikLinks.push(link);
                    }
                }

                this.bones.push(b);
                //console.log('bone', b.nameJa);
            }
        }
        { // morph
            const num = this.readu32s(p, 1)[0];
            console.log('morph num', num);
            for (let i = 0; i < num; ++i) {
                const m = new PMXMorph();
                m.nameJa = this.readstr(p);
                m.nameEn = this.readstr(p);
                m.panel = this.readu8s(p, 1)[0];
                m.type = this.readu8s(p, 1)[0];
                const morphnum = this.readu32s(p, 1)[0];
                for (let j = 0; j < morphnum; ++j) {
                    let one = null;
                    switch(m.type) {
                    case PMXMorph.TYPE_GROUP: // グループ
                        console.warn('skip only group');
                        this.readints(p, 1, this.mrpbnum)[0];
                        this.readf32s(p, 1)[0];
                        break;
                    case PMXMorph.TYPE_VERTEX: // 頂点
                        console.warn('skip only vertex', m.nameJa, `${i}/${num}`, `${j}/${morphnum}`);
                        this.readints(p, 1, this.vtxbnum)[0];
                        this.readf32s(p, 3);
                        break;
                    case PMXMorph.TYPE_BONE: // ボーン
                        console.warn('skip only bone', m.nameJa);
                        this.readints(p, 1, this.bonbnum)[0];
                        this.readf32s(p, 3);
                        this.readf32s(p, 4);
                        break;
                    case PMXMorph.TYPE_UV: // UV
                        console.warn('skip only uv', m.nameJa);
                        this.readints(p, 1, this.vtxbnum)[0];
                        this.readf32s(p, 4);
                        break;
                    case 8:
                        console.warn('skip only material morph', m.nameJa);
                        this.readints(p, 1, this.mtlbnum)[0];
                        this.readu8s(p, 1)[0];
                        this.readf32s(p, 28);
                        break;
                    default:
                        console.warn('not implemented', m.type, m.nameJa);
                        break;
                    }
                    m.ones.push(one);
                }
                this.morphs.push(m);
            }
        }
        { // frame
            const num = this.readu32s(p, 1)[0];
            console.log('frame num', num);
            for (let i = 0; i < num; ++i) {
                const f = new PMXFrame();
                f.nameJa = this.readstr(p);
                f.nameEn = this.readstr(p);
                f.specialFlag = this.readu8s(p, 1)[0];
                const framenum = this.readu32s(p, 1)[0];
                for (let j = 0; j < framenum; ++j) {
                    //const a = new PMX();
                    // not implemented
                }
                this.frames.push(f);
            }
        }

        { // rigid
            const num = this.readu32s(p, 1)[0];
            for (let i = 0; i < num; ++i) {
                const r = new PMXRigid();
                r.nameJa = this.readstr(p);
                r.nameEn = this.readstr(p);
                r.bone = this.readints(p, 1, this.bonbnum)[0];
                r.group = this.readu8s(p, 1)[0];
                r.shape = this.readu16s(p, 1)[0];
                const fs = this.readf32s(p, 14);
                r.size = fs.slice(0, 3);
                r.p = fs.slice(3, 6);
                r.rot = fs.slice(6, 9);
                r.weight = fs[9];
                r.moveDamping = fs[10];
                r.rotDamping = fs[11];
                r.pong = fs[12];
                r.friction = fs[13];               
                r.type = this.readu8s(p, 1)[0];
                this.rigids.push(r);
            }
        }
        { // joint
            const num = this.readu32s(p, 1)[0];
            for (let i = 0; i < num; ++i) {
                const j = new PMXJoint();
                j.nameJa = this.readstr(p);
                j.nameEn = this.readstr(p);
                j.type = this.readu8s(p, 1)[0];
                j.rigids = this.readints(p, 2, this.rgdbnum);
                const fs = this.readf32s(p, 24);
                j.p = fs.splice(0, 3);
                j.rot = fs.splice(3, 6);
                j.moveLower = fs.slice(6, 9);
                j.moveUpper = fs.slice(9, 12);
                j.rotLower = fs.slice(12, 15);
                j.rotUpper = fs.slice(15, 18);
                j.springMove = fs.slice(18, 21);
                j.springRot = fs.slice(21, 24);
                this.joints.push(j);
            }
        }
// softbody
        {
            const num = this.readu32s(p, 1)[0];
            console.log('softbody num', num);
            for (let i = 0; i < num; ++i) {

            }
        }

        { // face の分配

        }

        console.log('parse', this.c, p.byteLength);
    }

}

/**
 * バイナリ書き出しクラス
 */
class PMXMaker extends PMXParser {
    constructor() {
        super();
    }

/**
 * 文字列を書き込む
 * @param {DataView} p 
 * @param {number} offset
 * @param {string} ins 
 */
    setString(p, offset, ins) {
        // UTF-8 のとき 16LE 変換必要だったら入れる
        const b8 = new TextEncoder().encode(ins);
        const num = b8.byteLength;
        p.setInt32(offset, num, true);
        for (let i = 0; i < num; ++i) {
            p.setUint8(offset + 4 + i, b8[i]);
        }
        return 4 + num;
    }

/**
* 
* @param {DataView} p 
* @param {number} inoffset 
* @param {number[]} fs 
* @returns {number} 進んだバイト数
*/
    writefs(p, inoffset, fs) {
        let offset = 0;
        for (const f of fs) {
            p.setFloat32(inoffset + offset, f, true);
            offset += 4;
        }
        return offset;
    }

/**
* 
* @param {DataView} p 
* @param {offset} inoffset 
* @param {number[]} vs 
* @returns 
*/
    write32s(p, inoffset, vs) {
        let offset = 0;
        for (const v of vs) {
            p.setInt32(inoffset + offset, v, true);
            offset += 4;
        }
        return offset;
    }

/**
* 
* @param {DataView} p 
* @param {number} inoffset 
* @param {number[]} vs 
* @returns {number} 進んだバイト数
*/
    write16s(p, inoffset, vs) {
        let offset = 0;
        for (const v of vs) {
            p.setUint16(inoffset + offset, v, true);
            offset += 2;
        }
        return offset;
    }

/**
* 
* @param {DataView} p 
* @param {*} inoffset 
* @param {*} vs 
* @returns 
*/
    write8s(p, inoffset, vs) {
        let offset = 0;
        for (const v of vs) {
            p.setUint8(inoffset + offset, v);
            offset += 1;
        }
        return offset;
    }

/**
* 現在の状態でバッファを作成する
* @returns {ArrayBuffer[]}
*/
    makeBuffer() {
        const bufs = [];
        { // ヘッダ
            const buf = new ArrayBuffer(4+4+9);
            const p = new DataView(buf);
            let c = 0;
            for (const v of Array.from('PMX ')) {
                p.setUint8(c, v.charCodeAt(0));
                c += 1;
            }
            c += this.writefs(p, c, [2]);
            c += this.write8s(p, c, [8,
                1,0, 4,4,4,4,4,4]);
            bufs.push(buf);
        }
        {
            const buf = new ArrayBuffer(65536);
            const p = new DataView(buf);
            let c = 0;
            c += this.setString(p, c, this.head.nameJa);
            c += this.setString(p, c, this.head.nameEn);
            c += this.setString(p, c, this.head.commentJa);
            c += this.setString(p, c, this.head.commentEn);
            bufs.push(buf.slice(0, c));
        }

        { // 頂点
            const num = this.vts.length;
            const buf = new ArrayBuffer(4 + (1 + 22 * 4) * num);
            const p = new DataView(buf);
            let c = 0;
            c += this.write32s(p, c, [num]);
            for (const v of this.vts) {
                c += this.writefs(p, c, [
                    ...v.p,
                    ...v.n,
                    ...v.uv,
                ]);
                c += this.write8s(p, c, [v.deformType]);
                switch(v.deformType) {
                case PMXVertex.DEFORM_BDEF1:
                    c += this.write32s(p, c, [v.joints[0]]);
                    break;
                case PMXVertex.DEFORM_BDEF2:
                    c += this.write32s(p, c, [0, 1]);
                    c += this.writefs(p, c, [v.weights[0]]);
                    break;
                case PMXVertex.DEFORM_BDEF4:
                    c += this.write32s(p, c, v.joints);
                    c += this.writefs(p, c, v.weights);
                    break;
                case PMXVertex.DEFORM_SDEF:
                    c += this.write32s(p, c,
                        [v.joints[0], v.joints[1]]);
                    c += this.writefs(p, c, [
                        v.weights[0],
                        ...v.c,
                        ...v.r0,
                        ...v.r1,
                    ]);
                    break;
                }
                // エッジ倍率
                c += this.writefs(p, c, [v.edgeRate]);
            }
            bufs.push(buf.slice(0, c));
        }

        { // 面頂点数
    /**
    * 面数
    */
            let facenum = 0;
            for (const v of this.materials) {
                facenum += v.faces.length;
            }
            const buf = new ArrayBuffer(4 + 4 * facenum * 3);
            const p = new DataView(buf);
            let c = 0;
            c += this.write32s(p, c, [facenum * 3]);
            for (const m of this.materials) {
                for (const face of m.faces) {
                    c += this.write32s(p, c, face);
                }
            }            
            bufs.push(buf);
        }

        { // テクスチャ
            const num = this.textures.length;
            const buf = new ArrayBuffer(65536);
            const p = new DataView(buf);
            let c = 0;
            c += this.write32s(p, c, [num]);
            for (const v of this.textures) {
                c += this.setString(p, c, v);
            }
            bufs.push(buf.slice(0, c));
        }

        { // 材質
            const num = this.materials.length;
            const buf = new ArrayBuffer(65536 * 256);
            const p = new DataView(buf);
            let c = 0;
            c += this.write32s(p, c, [num]);
            for (const m of this.materials) {
                c += this.setString(p, c, m.nameJa);
                c += this.setString(p, c, m.nameEn);
                c += this.writefs(p, c, [
                    ...m.diffuse,
                    ...m.specular,
                    m.specPower,
                    ...m.ambient,
                ]);
                c += this.write8s(p, c, [m.bitFlag]);

                c += this.writefs(p, c, m.edgecolor);
                c += this.writefs(p, c, [m.edgeSize]);

                c += this.write32s(p, c, [m.texIndex, m.sphereIndex]);
                c += this.write8s(p, c, [m.sphereMode]); // sphere

                c += this.write8s(p, c, [m.sharetoonflag]);
                if (m.sharetoonflag) {
                    c += this.write8s(p, c, [m.sharetoonindex]); // 0～9 が 01～10
                } else {
                    c += this.write32s(p, c, [m.sharetoonindex]); // 個別テクスチャインデックス
                }

                c += this.setString(p, c, m.memo); // メモ
                c += this.write32s(p, c, [m.faces.length * 3]);
            }
            bufs.push(buf.slice(0, c));
        }

        { // ボーン *
            const num = this.bones.length;
            const buf = new ArrayBuffer(65536 * 16);
            const p = new DataView(buf);
            let c = 0;
            c += this.write32s(p, c, [num]);
            for (const b of this.bones) {
                c += this.setString(p, c, b.nameJa);
                c += this.setString(p, c, b.nameEn);
                c += this.writefs(p, c, b.p);
                c += this.write32s(p, c, [b.parent]);
                c += this.write32s(p, c, [b.layer]);

                c += this.write16s(p, c, [b.bits]);

                if (b.bits & PMXBone.BIT_BONECONNECT) {
                    c += this.write32s(p, c, [1]);
                } else {
                    c += this.writefs(p, c, [0, -1, 0]);
                }

            }
            bufs.push(buf.slice(0, c));
        }

        { // モーフ
    //            const num = this.morphs.length;
            const num = 0;
            const buf = new ArrayBuffer(65536);
            const p = new DataView(buf);
            let c = 0;
            c += this.write32s(p, c, [num]);
            bufs.push(buf.slice(0, c));
        }

        { // 表示枠 *
            const num = this.frames.length;
            const buf = new ArrayBuffer(65536);
            const p = new DataView(buf);
            let c = 0;
            c += this.write32s(p, c, [num]);
            for (const f of this.frames) {
                c += this.setString(p, c, f.nameJa);
                c += this.setString(p, c, f.nameEn);
                c += this.write8s(p, c, [f.specialFlag]); // 0: 通常、1: 特殊(rootとPMD互換)
                c += this.write32s(p, c, [f.bones.length]);
                for (const v of f.bones) {
                    c += this.write8s(p, c, [0]); // 0: ボーン、1: モーフ
                    c += this.write32s(p, c, [v]);
                }
            }
            bufs.push(buf.slice(0, c));
        }

        { // 物理
            const num = this.rigids.length;
    //            const num = 0;
            const buf = new ArrayBuffer(65536 * 16);
            const p = new DataView(buf);
            let c = 0;
            c += this.write32s(p, c, [num]);
            for (const r of this.rigids) {
                c += this.setString(p, c, r.nameJa);
                c += this.setString(p, c, r.nameEn);
                c += this.write32s(p, c, [r.bone]);
                c += this.write8s(p, c, [r.group]);
                c += this.write16s(p, c, [r.groupFlags]);
                c += this.write8s(p, c, [r.shape]);
                c += this.writefs(p, c, [
                    ...r.size,
                    ...r.p,
                    ...r.rot,
                    r.weight,
                    r.moveDamping,
                    r.rotDamping,
                    r.pong,
                    r.friction,
                ]);
                c += this.write8s(p, c, [r.type]);
            }
            bufs.push(buf.slice(0, c));
        }

        { // ジョイント
            const num = this.joints.length;
            const buf = new ArrayBuffer(65536);
            const p = new DataView(buf);
            let c = 0;
            c += this.write32s(p, c, [num]);
            for (const j of this.joints) {
                c += this.setString(p, c, j.nameJa);
                c += this.setString(p, c, j.nameEn);
                c += this.write8s(p, c, [j.type]);
                c += this.write32s(p, c, j.rigids);
                c += this.writefs(p, c, [
                    ...j.p,
                    ...j.rot,
                    ...j.moveLower,
                    ...j.moveUpper,
                    ...j.rotLower,
                    ...j.rotUpper,
                    ...j.springMove,
                    ...j.springRot,
                ]);
            }
            bufs.push(buf.slice(0, c));
        }

        { // ソフトボディ
            //const num = this.softs.length;
            const num = 0;
            const buf = new ArrayBuffer(65536);
            const p = new DataView(buf);
            let c = 0;
            c += this.write32s(p, c, [num]);
            bufs.push(buf.slice(0, c));
        }
        return bufs;
    }

/**
* オフセットとバイト数にする
* @param {ArrayBuffer[]} bufs 
*/
    toOffsets(bufs) {
        const ret = {
            chunks: []
        };
        let offset = 0;
        for (const buf of bufs) {
            const chunk = {
                offset,
                bytes: buf.byteLength,
            };
            offset += chunk.bytes;
            ret.chunks.push(chunk);
        }
        return ret;
    }

}




_global.PMX = {};
Object.assign(_global.PMX, {
    PMXObject,
    PMXParser,
    PMXMaker,
});

})(globalThis);



