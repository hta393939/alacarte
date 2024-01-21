/**
 * @file pmdwriter.js
 * だめだった;; 2023/3/26
 */

// https://blog.goo.ne.jp/torisu_tetosuki/e/209ad341d3ece2b1b4df24abf619d6e4

class Vertex {
    constructor() {
        this.p = [0, 0, 0];
        this.n = [0, 0, 1];
        this.uv = [0.5, 0.5];
        this.b = [0, 0];
/**
 * 0-100
 */
        this.w = 100;
/**
 * 0, 1: エッジ無効
 */
        this.edge = 1;
    }
}


class Material {
    constructor() {
        this.diffuse = [1, 1, 1];
        this.alpha = 1;
        this.specPower = 5;
        this.specular = [0.5, 0.5, 0.5];
/**
 * ambient
 */
        this.ambient = [0.2, 0.2, 0.2];
        this.toonindex = 255;
        this.edge = 0;
/**
 * 20バイトまで
 * "tex.bmp*sph.sph" だと乗算 sphere
 * *spa.spa" だと加算 sphere
 */
        this.textureName = '';

/**
 * [0, 1, 2] などを面の数だけある配列
 * @type {number[][]}
 */
        this.faces = [];
    }
}

class Bone {
    constructor() {
/**
 * 20バイト
 */
        this.boneName = 'bone000';
        this.boneNameEn = 'bone000';
        this.parent = 0xffff;
        this.tail = 0;
/**
 * 0: 回転，1: 回転と移動
 */
        this.type = 0;
        this.ikParent = 0;
        this.head = [0, 0, 0];

/**
 * 0 はセンター専用
 */
        this.boneGroupFrameIndex = 1;
    }
}

/**
 * 表情クラス
 */
class Morph {
    constructor() {
        this.name = 'base';
/**
 * @type {{p: number[], index: number}[]}
 */
        this.vts = [];
/**
 * 0: base, 1: まゆ，2: 目，3: リップ，4: その他
 */
        this.type = 0;
    }
}

class Frame {
    constructor() {

    }
}

/**
 * ボーングループ枠
 */
class BoneGroupFrame {
    constructor() {
        this.name = '';
/**
 * 英名
 */
        this.nameEn = '';
    }
}

class Rigid {
    constructor() {
        this.name = 'rigidbody';
/**
 * ボーン番号
 */
        this.bone = 2;
/**
 * 衝突グループインデックス
 */
        this.group = 0;
/**
 * グループターゲット
 */
        this.groupTarget = 0x0fff;
/**
 * 0: 球面，1: 箱，2: カプセル
 */
        this.shape = 0;

        this.size = [1, 1, 1];
        this.p = [0, 0, 0];
        this.rot = [0, 0, 0];
/**
 * 質量
 */
        this.weight = 1.0;
/**
 * 移動減衰
 */
        this.pdim = 0.0;
        this.rotdim = 0.0;
/**
 * 反発係数
 */
        this.pong = 0.0;
/**
 * 摩擦係数
 */
        this.friction = 1.0;
/**
 * 0: ボーン追従，1: 物理演算，2: 物理演算(位置合わせ)
 */
        this.type = 0;
    }
}

class Joint {
    constructor() {
        this.p = [0, 0, 0];
    }
}


class PMDWriter {
    constructor() {
        this.debug = 0;

        this.head = {
            nameja: 'name',
            commentja: 'comment',
        };
/**
 * @type {Vertex[]}
 */
        this.vts = [];
/**
 * @type {Material[]}
 */
        this.materials = [];
/**
 * @type {Bone[]}
 */
        this.bones = [];
/**
 * @type {Morph[]}
 */
        this.morphs = [];
/**
 * 表情の番号配列
 * @type {number[]}
 */
        this.framenos = [];
/**
 * ボーングループの枠の配列
 * @type {BoneGroupFrame[]}
 */
        this.boneGroupFrames = [];

/**
 * @type {Rigid[]}
 */
        this.rigids = [];
/**
 * @type {Joint[]}
 */
        this.joints = [];
    }

    log(...args) {
        if (this.debug > 0) {
            console.log(...args);
        }
    }

    pad(v, n = 2) {
        return String(v).padStart(n, '0');
    }

/**
 * 文字列を書き込む
 * @param {DataView} p 
 * @param {number} offset
 * @param {string} ins 
 * @param {number} step 文字列領域のバイト数
 */
    setString(p, offset, ins, step) {
        const b8 = new TextEncoder().encode(ins);
        const num = b8.byteLength;
        for (let i = 0; i < num; ++i) {
            p.setUint8(offset + i, b8[i]);
        }
        return step;
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

    makeBuffer() {
        const bufs = [];
        { // Pmd #0
            const buf = new ArrayBuffer(3+4+20+256);
            const p = new DataView(buf);
            let c = 0;
            c += this.setString(p, c, 'Pmd', 3);
            c += this.writefs(p, c, [1.0]);
            c += this.setString(p, c, this.head.nameja, 20);
            c += this.setString(p, c, this.head.commentja, 256);
            bufs.push(buf);
        }

        { // 頂点 #1
            const num = this.vts.length;
            let c = 0;
            const buf = new ArrayBuffer(4 + num * 38);
            const p = new DataView(buf);
            c += this.write32s(p, c, [num]);
            for (const v of this.vts) {
                c += this.writefs(p, c, 
                    [...v.p,
                        ...v.n,
                        ...v.uv,
                    ]);
                c += this.write16s(p, c, v.b);
                c += this.write8s(p, c, [v.w, v.edge]);
            }
            bufs.push(buf);
        }

        { // 面 #2
            let faceNum = 0;
            for (const m of this.materials) {
                faceNum += m.faces.length;
            }

            const num = faceNum * 3;
            const buf = new ArrayBuffer(4 + num * 2);
            const p = new DataView(buf);
            let c = 0;
            c += this.write32s(p, c, [num]);
            for (const m of this.materials) {
                for (const face of m.faces) {
                    c += this.write16s(p, c, face);
                }
            }
            this.log('face indices', buf.byteLength, c, 'num', num, 'face', num /3);
            bufs.push(buf);
        }

        { // 材質 #3
            const num = this.materials.length;
            const buf = new ArrayBuffer(4 + num * 70);
            const p = new DataView(buf);
            let c = 0;
            c += this.write32s(p, c, [num]);
            for (const m of this.materials) {
                c += this.writefs(p, c, [
                        ...m.diffuse,
                        m.alpha,
                        m.specPower,
                        ...m.specular,
                        ...m.ambient,
                    ]);
                c += this.write8s(p, c, [
                    m.toonindex,
                    m.edge]);
                c += this.write32s(p, c, [m.faces.length * 3]);
                c += this.setString(p, c, m.textureName, 20);
            }
            this.log('material', buf.byteLength, c);            
            bufs.push(buf);
        }

        { // ボーン #4
            const num = this.bones.length;
            const buf = new ArrayBuffer(2 + 39 * num);
            const p = new DataView(buf);
            let c = 0;
            c += this.write16s(p, c, [num]);
            for (const b of this.bones) {
                c += this.setString(p, c, b.boneName, 20);
                p.setUint16(c, b.parent, true);
                p.setUint16(c+2, b.tail, true);
                c += 4;
                p.setUint8(c, b.type);
                c += 1;
                p.setUint16(c, b.ikParent, true);
                c += 2;

                c += this.writefs(p, c, b.head);
            }
            this.log('bone', buf.byteLength, c);
            bufs.push(buf);
        }

        { // IK WORD #5
            const buf = new ArrayBuffer(2);
            const p = new DataView(buf);
            let c = 0;
            c += this.write16s(p, c, [0]);
            bufs.push(buf);
        }

        { // 表情リスト #6
            const num = this.morphs.length;
            let vnumsum = 0;
            for (const m of this.morphs) {
                vnumsum += m.vts.length;
            }
            const buf = new ArrayBuffer(2 + 25 * num + vnumsum * 16);
            const p = new DataView(buf);
            let c = 0;
            c += this.write16s(p, c, [num]);
            for (let m of this.morphs) {
                c += this.setString(p, c, m.name, 20);
                c += this.write32s(p, c, [m.vts.length]);
                c += this.write8s(p, c, [m.type]);
                for (const v of m.vts) {
                    c += this.write32s(p, c, [v.index]);
                    c += this.writefs(p, c, v.p);
                }
            }
            this.log('morph', buf.byteLength, c, vnumsum);
            bufs.push(buf);
        }

        { // 表情枠 #7
            const num = this.framenos.length;
            const buf = new ArrayBuffer(1 + num * 2);
            const p = new DataView(buf);
            let c = 0;
            c += this.write8s(p, c, [num]);
            c += this.write16s(p, c, this.framenos);
            bufs.push(buf);
        }

        { // ボーン枠 枠名リスト #8
            const num = this.boneGroupFrames.length;
            const buf = new ArrayBuffer(1 + num * 50);
            const p = new DataView(buf);
            let c = 0;
            c += this.write8s(p, c, [num]);
            for (const f of this.boneGroupFrames) {
                c += this.setString(p, c, f.name, 50);
            }
            bufs.push(buf);
        }

        { // ボーン枠表示リスト(センターを含まない) #9 okっぽい
            const num = this.bones.length;
            const buf = new ArrayBuffer(4 + num * 3);
            const p = new DataView(buf);
            let c = 0;
            c += this.write32s(p, c, [num]);
            for (let i = 0; i < num; ++i) {
                const b = this.bones[i];
                c += this.write16s(p, c, [i]);
                c += this.write8s(p, c, [(b.boneNameEn === 'center') ? 0 : 1]);
            }
            bufs.push(buf);
        }

//// 拡張

        if (false) { // 英名フィールド無し
            const buf = new ArrayBuffer(1);
            bufs.push(buf);
        } else {
        { // 拡張部分 英名 #10 NG
            const buf = new ArrayBuffer(1 + 20 + 256);
            const p = new DataView(buf);
            let c = 0;
            c += this.write8s(p, c, [1]);
            c += this.setString(p, c, 'modelen', 20);
            c += this.setString(p, c, 'commenten', 256);
            bufs.push(buf);
        }
        { // ボーン 英名 #11
            const num = this.bones.length;
            const buf = new ArrayBuffer(num * 20);
            const p = new DataView(buf);
            let c = 0;
            for (const b of this.bones) {
                c += this.setString(p, c, b.boneNameEn, 20);
            }
            bufs.push(buf);  
        }
        { // 表情 英名 #12 [ ] ?
            //const num = this.bones.length;
            const num = 0;
            const buf = new ArrayBuffer(num * 20);
            const p = new DataView(buf);
            let c = 0;
            for (let i = 0; i < num; ++i) {
                c += this.setString(p, c, `morph${i}`, 20);
            }
            bufs.push(buf);
        }

        { // ボーン枠 英名(センター枠を含まない) #13 [ ] NG
            const num = this.boneGroupFrames.length;
            const buf = new ArrayBuffer(num * 50);
            const p = new DataView(buf);
            let c = 0;
            for (const f of this.boneGroupFrames) {
                c += this.setString(p, c, f.nameEn, 50);
            }
            bufs.push(buf);  
        }
        }

        { // トゥーンテクスチャ #14
            const buf = new ArrayBuffer(100 * 10);
            const p = new DataView(buf);
            let c = 0;
            for (let i = 0; i < 10; ++i) {
                c += this.setString(p, c,
                    `toon${this.pad(i + 1)}.bmp`, 100);
            }
            bufs.push(buf);
        }

        { // 物理 #15
            const num = this.rigids.length;
            const buf = new ArrayBuffer(4+83*num);
            let c = 0;
            const p = new DataView(buf);
            c += this.write32s(p, c, [num]);
            for (const r of this.rigids) {
                c += this.setString(p, c, r.name, 20);
                c += this.write16s(p, c, [r.bone]);
                c += this.write8s(p, c, [r.group]);
                c += this.write16s(p, c, [r.groupTarget]);
                c += this.write8s(p, c, [r.shape]);
                c += this.writefs(p, c, [
                    ...r.size,
                    ...r.p,
                    ...r.rot,
                    r.weight,
                    r.pdim, r.rotdim,
                    r.pong,
                    r.friction,
                ]);
                c += this.write8s(p, c, [r.type]);
            }
            this.log('rigidbody', buf.byteLength, c);
            bufs.push(buf);
        }

        { // ジョイント #16
            const num = this.joints.length;
            const buf = new ArrayBuffer(4);
            const p = new DataView(buf);
            let c = 0;
            c += this.write32s(p, c, [num]);
            bufs.push(buf);
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


