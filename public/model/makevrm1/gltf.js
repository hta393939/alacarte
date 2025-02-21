/* */
/**
 * @file gltf.js
 * MIT License (c) 2018- Usagi
 */

(function(global_) {

'use strict';

/** */
const pad = (v, n = 2) => {
    return String(v).padStart(n, '0');
};

/** */
class V4 {
    constructor(inX = 0, inY = 0, inZ = 0, inW = 0) {
        this.x = inX;
        this.y = inY;
        this.z = inZ;
        this.w = inW;
    }

    static I() {
        return new V4(0,0,0, 1);
    }

    static X(ang) {
        const cs = Math.cos(ang * 0.5);
        const sn = Math.sin(ang * 0.5);
        return new V4(sn,0,0, cs);
    }
    static Y(ang) {
        const cs = Math.cos(ang * 0.5);
        const sn = Math.sin(ang * 0.5);
        return new V4(0,sn,0, cs);
    }
    static Z(ang) {
        const cs = Math.cos(ang * 0.5);
        const sn = Math.sin(ang * 0.5);
        return new V4(0,0,sn, cs);
    }
}

/** */
class V3 {
    constructor(inX = 0, inY = 0, inZ = 0) {
        this.x = inX;
        this.y = inY;
        this.z = inZ;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    clone() {
        return new V3(this.x, this.y, this.z);
    }

    /**
     * 破壊
     */
    normalize() {
        const len = this.length();
        if (len > 0.0) {
            const k = 1 / len;
            this.x *= k;
            this.y *= k;
            this.z *= k;
        }
        return this;
    }

}

/**
 * 
 */
class V2 {
    constructor(inX = 0, inY = 0) {
        this.x = inX;
        this.y = inY;
    }
}

/**
 * 
 */
class Gltf {
    constructor(param) {
        this.cl = this.constructor.name;

        /**
         * 文字列
         */
        this.str = '{}';

/**
 * @type {Object.<string, any>}
 */
        this.parts = {};

        /**
         * ボーンのところの材質インデックス
         * 光抑えめ
         * @default 0
         */
        this.boneMatrixIndex = 0;
        /**
         * 丸いところの材質インデックス
         * 光を受ける
         * @default 0
         */
        this.spMatrixIndex = 0;
/**
 * 目の材質
 * @default 0
 */
        this.eyeMatrixIndex = 0;
/**
 * アンテナの材質
 * @default 0
 */
        this.antennaMatrixIndex = 0;

/**
 * 材質数
 * @default 1
 */
        this.materialNum = 1;


/**
 * 
 */
        this.baseTex = null;
        /** */
        this.thumbTex = null;
        /** */
        this.tex2 = null;
        /** */
        this.tex3 = null;
        /** */
        this.tex4 = null;
        /** */
        this.tex5 = null;
        /** */
        this.tex6 = null;
        /** */
        this.tex7 = null;

/**
 * 格納テクスチャ数
 * @default 2
 */
        this.texNum = 2;

        this.BYTE = 5120;
        this.UNSIGNED_BYTE = 5121;
        this.SHORT = 5122;
        /**
         * 5123
         */
        this.UNSIGNED_SHORT = 5123;
        /**
         * 5125
         */
        this.UNSIGNED_INT = 5125;
        /**
         * 5126
         */
        this.FLOAT = 5126;
/**
 * 34962 bufferView.target 用
 */
        this.ARRAY_BUFFER = 34962;
/**
 * 34963 bufferView.target 用
 */
        this.ELEMENT_ARRAY_BUFFER = 34963;

/**
 * 9728
 */
        this.NEAREST = 9728
/**
 * 9729 LINEAR
 */
        this.LINEAR = 9729;
/**
 * 
 */
        this.NEAREST_MIPMAP_NEAREST = 9984;
/**
 * 
 */
        this.LINEAR_MIPMAP_NEAREST = 9985;
/**
 * 
 */
        this.NEAREST_MIPMAP_LINEAR = 9986;
/**
 * 9987 LL MIPMAP
 */
        this.LINEAR_MIPMAP_LINEAR = 9987;

/**
 * 33071 wrap* 用
 */
        this.CLAMP_TO_EDGE = 33071;
/**
 * 33648 wrap* 用
 */
        this.MIRRORED_REPEAT = 33648;
/**
 * 10497 wrap*用 デフォルト
 */
        this.REPEAT = 10497;

/**
 * for VRM
 */
        this.DIS = 'Disallow';
/**
 * 
 */
        this.ALLOW = 'Allow';
    }

    /**
     * 
     * @param {Date} d 時刻
     */
    getTimeID(d = new Date()) {
        let s = '';
        s += pad(d.getFullYear(), 4);
        s += pad(d.getMonth() + 1);
        s += pad(d.getDate());
        s += '_' + pad(d.getHours());
        s += pad(d.getMinutes());
        s += pad(d.getSeconds());
        //s += '_' + pad(d.getMilliseconds(), 3);
        return s;
    }

    /**
     * パーツファイルを読み込む
     * @param {string} inpath 
     */
    async loadPart(inpath) {
        const res = await fetch(inpath)
            .catch(err => {
                console.warn(`loadPart`, err);
            });
        const obj = await res.json();
        this.parts[inpath] = obj;

        console.log(`loadPart succ`, obj);
    }

    /**
     * .obj をパーツとして読み込みたい
     * bookmark: bookmark:
     */
    async loadObj(inpath) {
        const res = await fetch(inpath)
            .catch(err => {
                console.log(`loadObj catch`, err);
            });
        const text = await res.text();
        const objparse = new ObjParse();
        const obj = await objparse.parse(text, { mtl: false });
        this.objpart = {};
        for (const v of obj.os) {
            const vertices = objparse.makeVertex(obj, v.name);
            this.objpart[v.name] = vertices;
        }
        console.log(this.cl, `loadObj leave, obj`, obj, this.objpart);
    }

    /**
     * ダウンロードする
     * @param {Blob} blob バイナリ
     * @param {string[]} ファイル名の配列 
     */
    download(blob, names) {
        for (const v of names) {
            const a = document.createElement('a');
            a.download = v;
            a.href = URL.createObjectURL(blob);
            a.dispatchEvent(new MouseEvent('click'));
        }
    }

    /**
     * fourcc 4バイトを生成する u8
     * @param {string} f 4文字まで
     */
    fourcc(f) {
        const buf = new Uint8Array(4);
        for (let i = 0; i < 4; ++i) {
            buf[i] = f.charCodeAt(i);
        }
        return buf;
    }

    /**
     * Typed Array を返す u8
     * @param {number} v 整数
     */
    u32(v) {
        const ab = new ArrayBuffer(4);
        const p = new DataView(ab);
        p.setUint32(0, v, true);
        return new Uint8Array(ab);
    }


    /**
     * ファイル全体作る
     * str と bin はすでに準備できていること。
     * @return {Blob} 1つの Blob 
     */
    wholeBlob() {
        console.log(this.cl, `wholeBlob called`);

        const ret = [];

        let strBin = new Blob([this.str],
            { type: 'text/plain;charset=UTF-8'});
        let strBinLen = strBin.size;
        strBinLen = Math.floor(strBinLen / 4) * 4;
        strBin = strBin.slice(0, strBinLen);

        const binLen = this.bin.byteLength;

        const whole = 12 + 8 + strBinLen + 8 + binLen;

        ret.push(new Blob([this.fourcc('glTF')]));
        ret.push(new Blob([this.u32(2)]));
        ret.push(new Blob([this.u32(whole)]));

        ret.push(new Blob([this.u32(strBinLen)]));
        ret.push(new Blob([this.fourcc('JSON')]));
        ret.push(strBin);

        ret.push(new Blob([this.u32(binLen)]));
        ret.push(new Blob([this.fourcc('BIN\0')]));
        ret.push(new Blob([this.bin]));

        console.log(this.cl, `wholeBlob leave`);
        return new Blob([...ret]);
    }

    /**
     * ファイルとして保存する
     * @param {boolean} inurl 
     */
    save(inurl) {
        console.log(this.cl, `save called`, inurl);

        {
            const base = `a_${this.getTimeID(new Date())}`;

            const blob = this.wholeBlob();
            const url = URL.createObjectURL(blob);

            this.download(blob,
                [`${base}.glb`, `${base}.vrm`]);

            if (inurl) {
                console.log(`true`);
                return url;
            }
            console.log(`false`);
            return null;
        }
    }


    /**
     * リカーシブツリーを平たくする
     * @param {{}[]} ns この配列のインデックスとしてみなす
     * @param {Object} cur 今の対象 in tree
     * @param {any[]} [cur.c]
     * @param {{}} parent 親 obj
     * @return {{recur: boolean, index: number}} cur の結果。自分のインデックス
     */
    recurTree(ns, cur, parent) {

        const glopos = [0,0,0];
        if (parent && '_global' in parent) {
            glopos[0] = parent._global[0];
            glopos[1] = parent._global[1];
            glopos[2] = parent._global[2];
        }

        let recur = true;
        if ('c' in cur) {
            if (cur.c.length === 0) {
                recur = false;
            }
        } else {
            recur = false;
        }

        let index = ns.length + 0;
        const obj = {
            name: `${cur.name}`,
            translation: [0,0,0],
            rotation: [0,0,0,1],
            scale: [1,1,1]
        };
        if ('r' in cur) {
            obj.translation = cur.r;
            for (let i = 0; i < 3; ++i) {
                glopos[i] += cur.r[i];
            }
        }
        if ('k' in cur) {
            obj._k = [...cur.k];
        }
        if ('pts' in cur) {
            obj._pts = [...cur.pts];
        }
        if ('sz' in cur) {
            obj._sz = [...cur.sz];
        } else {
            obj._sz = [0.04];
        }
        if ('ci' in cur) {
            obj._ci = [...cur.ci];
        } else {

        }
        obj._global = glopos;

        ns.push(obj);

        if (recur === false) {
            return { recur, index };
        }

        obj.children = [];
        cur.c.forEach(v=>{
            let result = this.recurTree(ns, v, obj);
            obj.children.push(result.index);
        });
        return { recur, index };
    }

    /**
     * ツリーからノード配列を作成する
     * @param {{}[]} nodes 保存先
     */
    makeTree(nodes) {
        console.log(this.cl, `makeTree called`);
        this.recurTree(nodes, _tree, null);
        console.log(this.cl, `makeTree leave`, nodes);
    }

    /**
     * bookmark: bookmark: 
     * メッシュと頂点を現状に追加する。obj パーツから
     * @param {Vtx[]} vts 点の配列
     * @param {{_global: number[], _sz: number[]}[]} nodes ノード配列 
     * @param {{}[]} arr 複数面。三段配列
     * @param {number} ji ジョイントインデックス
     * @param {string} inpath パーツパス
     * @param {number} mi 材質インデックス
     */
    addObjPart(vts, nodes, arr, ji, inpath, mi) {
        console.log(this.cl, `addObjPart called`);
        //console.log(this.cl, vts.length, arr[mi].length);

        /**
         * @type {{vs: Vtx[], fs: number[]}
         */
        const partsource = this.objpart[inpath];
/**
 * 開始前の vertex 数
 */
        const vioffset = vts.length;

        // vertex を追加する
        for (const v of partsource.vs) {
            /**
             * バーテックスデータ
             */
            const vtx = v.clone();
            let boi = + ji;
            vtx.jnt.set(boi, boi, boi, boi);

            vts.push(vtx);
        }

        // 面インデックスを追加する
        /*
        let fis = [];
        for (const v of partsource.fs) {
            fis.push(vioffset + v);
            if (fis.length >= 3) {
                arr[mi].push(fis);
                fis = [];
            }
        }*/
        for (const fis of partsource.faces) {
            arr[mi].push(fis.map(v => vioffset + v));
        }

        //console.log(this.cl, partsource);
        //console.log(this.cl, `addObjPart leave`, vts.length, arr[mi].length,
        //    vts, arr[mi]);
    }

    /**
     * メッシュと頂点を現状に追加する。ここ bookmark
     * @param {Vtx[]} vts 点の配列
     * @param {{_global: number[], _sz: number[]}[]} nodes ノード配列 
     * @param {{}[]} arr 複数面。三段配列。
     * @param {number} ji ジョイントインデックス
     * @param {string} inpath パーツパス
     * @param {number} mi 材質インデックス
     */
    addSubPart(vts, nodes, arr, ji, inpath, mi) {
        console.log(this.cl, `addSubPart called`);
        //return;

        /**
         * @type {{vts: {}}}
         */
        const partsource = this.parts[inpath];
        let v = nodes[ji];
        const vioffset = vts.length; // 現在の末端

        const vtskey = Object.keys(partsource.vts);

        vtskey.forEach((k1, i) => {
            /**
             * @type {{p:string, n:number[], uv:number[]}}
             */
            const v1 = partsource.vts[k1];

            const onep = partsource.ps[v1.p];
            let x = onep.p[0];
            let y = onep.p[1];
            let z = onep.p[2];

            const vtx = new Vtx();
            vtx.p.set(x, y, z);
            vtx.p.multiplyScalar(1/16);
            vtx.n.set(v1.n[0], v1.n[1], v1.n[2]);
            vtx.n.normalize();
            // OpenGL base を gltf base へ変換
            vtx.uv.set(v1.uv[0], 1 - v1.uv[1]);

            let boi = + ji;
            vtx.jnt.set(boi, boi, boi, boi);

            vtx.p.add(new THREE.Vector3(
                v._global[0], v._global[1], v._global[2]));

            vts.push(vtx);
        });

        Object.keys(partsource.faces).forEach(k2 => {
            const v2 = partsource.faces[k2];
            const f3 = [];
            v2.i.forEach(k3 => {
                // k3 を vtx から取り出す
                let index = vtskey.indexOf(k3);
                //console.log(``, index);
                f3.push(vioffset + index);
            });
            arr[mi].push(f3);
        });

    }

    /**
     * メッシュと頂点を現状に追加する。骨と関節追加する。
     * @param {Vtx[]} vts 点の配列
     * @param {{_global: number[], _sz: number[]}[]} nodes ノード配列 
     * @param {{}[]} arr 複数面。三段配列。
     */
    makeSubMesh(vts, nodes, arr) {
        console.log(this.cl, `makeSubMesh called`);

        let rnd = 1;

        nodes.forEach((v, i) => {
            for (let j = 0; j < 1; ++j) {
                const div = 8;
                const belt = 8;

                let index, ir, ig, ib;

                /*
                if ('_pts' in v) {
                    v._pts.forEach(k => {
                        this.addSubPart(vts, nodes, arr, i, `${k}.json`, 0);
                    });
                } else {
                    this.addSubPart(vts, nodes, arr, i, 'part001.json', 0);
                }*/
                if (v.name === 'leftHand'
                    || v.name == 'chest'
                    || v.name == 'leftFoot'
                    || v.name == 'leftShoulder'
                    || v.name === 'spine'
                    || v.name === 'head') {
                    //this.addObjPart(vts, nodes, arr, i, v.name, 0);
                }

                /**
                 * 骨の方
                 */
                const addSubBone = arg2 => {
                    // 頂点の最後尾
                    let vioffset = vts.length;

                    ir = 5;
                    ig = 4;
                    ib = 3;
                    const cindex = ib + ig * 6 + ir * 36;
                    let ix = (cindex + 8) % 16;
                    let iy = Math.floor((cindex + 8) / 16);
                    /**
                     * 0.0 - 1.0 の範囲に変更した uv
                     * glTF って上から?
                     */
                    let uv = new THREE.Vector2((ix * 4 + 2) / 64, (iy * 4 + 2) / 64);

                    let from = new THREE.Vector3(arg2.from._global[0],
                        arg2.from._global[1],
                        arg2.from._global[2]);
                    let to = new THREE.Vector3(arg2.to._global[0],
                            arg2.to._global[1],
                            arg2.to._global[2]);
                    let diff = new THREE.Vector3().subVectors(to, from);
                    let dist = diff.length();
                    let offsetVector = diff.clone().multiplyScalar(0.5).add(from);

                    // 横? 上? 前? を判定する
                    let bx = new THREE.Vector3(1,0,0);
                    let by = new THREE.Vector3(-diff.x, -diff.y, -diff.z).normalize();
                    let bz = new THREE.Vector3(0,0,1);
                    let dir = 'default';
                    if (diff.y > 0
                        && Math.abs(diff.y) > Math.abs(diff.x)
                        && Math.abs(diff.y) > Math.abs(diff.z)) {
                        dir = 'up';
                        // x正 と y で
                        bz.crossVectors(bx, by);
                        bx.crossVectors(by, bz);
                    } else if (diff.z < 0
                        && Math.abs(diff.z) > Math.abs(diff.x)
                        && Math.abs(diff.z) > Math.abs(diff.y)) {
                        dir = 'front';
                        // x正 と y で front は Znega だった;;
                        bz.crossVectors(bx, by);
                        bx.crossVectors(by, bz);
                    } else {
                        // y と z正で
                        bx.crossVectors(by, bz);
                        bz.crossVectors(bx, by);
                    }
                    let rot = new THREE.Matrix3();
                    // set は row-major
                    rot.set(bx.x, by.x, bz.x,
                        bx.y, by.y, bz.y,
                        bx.z, by.z, bz.z);

                    let topR = arg2.from._sz[0];
                    let topLen = dist * 0.5;
                    let bottomR = arg2.to._sz[0];
                    let bottomLen = dist * 0.5;

                    if (topR <= 0.0 || bottomR <= 0.0) {
                        return;
                    }
                    topR = Math.min(topR, bottomR);
                    bottomR = topR;

                    // 補正後半径
                    let topK = (topR - bottomR) * (dist - topR * 1) / dist + bottomR;
                    let bottomK = (bottomR - topR) * (dist - bottomR * 1) / dist + topR;
                    topLen -= topR * 1;
                    topR = +topK;
                    bottomLen -= bottomR * 1;
                    bottomR = +bottomK;

                    if (topLen <= -bottomLen) {
                        return; // 裏返ったら追加しない
                    }

                    const pts = [
                        [-1,-1,-1], [1,-1,-1], [-1,1,-1], [1,1,-1],
                        [-1,-1,1], [1,-1,1], [-1,1,1], [1,1,1]
                    ];
                    const faces = [
                        {is: [0,4,6,2], n: [-1,0,0]},
                        {is: [3,7,5,1], n: [1,0,0]},
                        {is: [5,4,0,1], n: [0,-1,0]},
                        {is: [3,2,6,7], n: [0,1,0]},
                        {is: [1,0,2,3], n: [0,0,-1]},
                        {is: [7,6,4,5], n: [0,0,1]}
                    ];
                    /**
                     * 左上、右上、右下、左下 コ
                     */
                    const uvs = [
                        [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0]
                    ];

// 細長補正
                    {
                        let uindex = 0;
                        let vindex = 0;
                        let yoko = topR + topR;
                        let tate = topLen + bottomLen;
                        if (yoko !== tate) {
                            if (yoko < tate) {
                                // 右へ
                                let pow = Math.round(Math.log2(tate / yoko));
                                if (pow >= 2) {
                                    pow = 2;
                                }
                                uindex = pow;
                            } else {
                                // 下へ
                                let pow = Math.round(Math.log2(yoko / tate));
                                if (pow >= 2) {
                                    pow = 2;
                                }
                                vindex = pow;
                            }
                        }
                    }

                    faces.forEach((v4, i4) =>{
                        v4.is.forEach((index, i5) => {
                            let pt = pts[index];
                            const ptv = new THREE.Vector3(pt[0], pt[1], pt[2]);

                            if (ptv.y > 0) {
                                ptv.x *= topR;
                                ptv.y *= topLen;
                                ptv.z *= topR;
                            } else {
                                ptv.x *= bottomR;
                                ptv.y *= bottomLen;
                                ptv.z *= bottomR;
                            }

                            // 全面で貼るタイプ
                            //uv.set(uvs[i5][0], uvs[i5][1]);
                            /*
                            if (true) {
                                const u = 0;
                                const v = 0;
                                uv.set(u, v);
                            }*/

                            const nv = new THREE.Vector3(v4.n[0], v4.n[1], v4.n[2]);
                            ptv.applyMatrix3(rot);
                            nv.applyMatrix3(rot);

                            const vtx = new Vtx();
                            vtx.p.copy(ptv);
                            vtx.n.copy(nv);
                            vtx.n.normalize();

                            vtx.uv.copy(uv);

                            // TODO: ボーンウエイトインデックス
                            let boi = + i;
                            //vtx.jnt.set(boi, boi, boi, boi);
                            vtx.jnt.set(boi, 0, 0, 0);

                            vtx.p.add(offsetVector);

                            vts.push(vtx);
                        });
                        let v0 = i4 * 4 + vioffset;
                        let v1 = v0 + 1;
                        let v2 = v0 + 2;
                        let v3 = v0 + 3;

                        let aindex = this.boneMatrixIndex;
                        arr[aindex].push([v0, v1, v2]);
                        arr[aindex].push([v0, v2, v3]);
                    });
      
                };
                if ('children' in v) {
                    v.children.forEach(vi2 => {
                        addSubBone({ from: v, to: nodes[vi2] });
                    });
                }

                /**
                 * 関節の方
                 */
                const addSubJoint = () => {
                    let vioffset = vts.length;

                    let scaleX = v._sz[0];
                    let scaleY = v._sz[0];
                    let scaleZ = v._sz[0];
                    let scale = new THREE.Vector3(scaleX, scaleY, scaleZ);
                    if (scaleX <= 0.0) {
                        return;
                    }

// uv はカラーチップで貼る
                    const cindex = ((rnd >> 16) & 32767) % 216;
                    rnd = (rnd * 214013 + 2531011) & 0xffffffff;    
                    if ('_ci' in v) {
                        ir = v._ci[0];
                        ig = v._ci[1];
                        ib = v._ci[2];
                        index = ib + ig * 6 + ir * 36;
                    }
                    let ix = (cindex + 8) % 16;
                    let iy = Math.floor((cindex + 8) / 16);
                    let uv = new THREE.Vector2((ix * 4 + 2) / 64, (iy * 4 + 2) / 64);
                    if (v.name.includes('EyeEnd')) {
                        //uv.set(0.5, 0.5);
                    }

                    // Y+ 上から Y- 下まで
                    for (let k = 0; k < belt + 1; ++k) {
                        const vang = k * Math.PI / belt;
                        let vcs = Math.cos(vang);
                        let vsn = Math.sin(vang);
                        if (belt / 2 === k) {
                            vcs = 0; // Y軸
                            vsn = 1; // 半径
                        }
                        if (belt === k) {
                            vcs = -1; // Y軸
                            vsn = 0; // 半径
                        }

                        for (let l = 0; l < div + 1; ++l) {
                            const hang = l * Math.PI * 2 / div;

                            let cs = Math.cos(hang);
                            let sn = Math.sin(hang);
                            if (div / 4 === l) {
                                cs = 0;
                                sn = 1;
                            }
                            if (div / 2 === l) {
                                cs = -1;
                                sn = 0;
                            }
                            if (div * 3 / 4 === l) {
                                cs = 0;
                                sn = -1;
                            }
                            if (div === l) {
                                cs = 1;
                                sn = 0;
                            }

                            // Z+ か Z- にするか
                            let x = sn * vsn;
                            let y = vcs;
                            let z = cs * vsn;

                            const vtx = new Vtx();
                            vtx.p.set(x, y, z);
                            vtx.p.multiply(scale);
                            vtx.n.copy(vtx.p);
                            vtx.n.normalize();

                            vtx.uv.copy(uv);

                            // TODO: ボーンウエイトインデックス
                            let boi = + i;
                            //vtx.jnt.set(boi, boi, boi, boi);
                            vtx.jnt.set(boi, 0, 0, 0);

                            vtx.p.add(new THREE.Vector3(
                                v._global[0], v._global[1], v._global[2]));

                            vts.push(vtx);
                        }
                    }

                    // 面インデックス
                    for (let k = 0; k < belt; ++k) {
                        for (let l = 0; l < div; ++l) {
                            let v0 = (div+1) * k + l + vioffset;
                            let v1 = v0 + 1;
                            let v2 = v0 + div + 1;
                            let v3 = v2 + 1;

                            let aindex = (k % 7) + 1;
                            aindex = this.spMatrixIndex;
                            if (v.name.includes('EyeEnd')) {
                                aindex = this.eyeMatrixIndex;
                            }

                            arr[aindex].push([v0, v2, v1]);
                            arr[aindex].push([v1, v2, v3]);
                        }
                    }         
                };
                addSubJoint();

            }
        });

    }

/**
 * 配列の中を name で探す
 * @param {{name:string}[]} arr 
 * @param {RegExp} inre 
 * @returns {{index:number, node: {}}}
 */
    searchNode(arr, inre) {
        let found = null;
        arr.some((v, i)=>{
            if (inre.test(v.name)) {
                found = { index: + i, node: v };
                return true;
            }
            return false;
        });
        return found;
    }

/**
 * 材質8つ TODO: 材質変更
 */
    createMaterials() {
        console.log(this.cl, `createMaterials called`);
        const ret = {ms: [], props: []};

        for (let i = 0; i < this.materialNum; ++i) {
            const name = `m${pad(i, 3)}`; // 一致させる
            const m = {
                name: name,
                pbrMetallicRoughness: {
                    baseColorTexture: { index: 0, texCoord: 0 },
                    //baseColorFactor: [1,1,1, 1],
                    baseColorFactor: [0.1, 0.1, 0.1, 1],
                    //metallicFactor: 0.5,
                    metallicFactor: 0.1,
                    roughnessFactor: 0.1
                }
            };
            ret.ms.push(m);

            let prop = {};
            switch(i) {
                case 0: // 骨のところ 面貼り
                case 7:
                    prop = { // VRM/MToon シェーダー
                        name: name,
                        shader: 'VRM/MToon',
                        renderQueue: 5000,
                        floatProperties: {
//"_UvAnimScrollX": 0.5, // 0.5 だと動いてるの見える 2秒周期
//"_UvAnimScrollY": 0.5, // 0.5 だと動いているの見える
//"_UvAnimRotation": 0.05,
//"_ReceiveShadowRate":1, "_ShadeShift":0,
//"_ShadeToony": 0.9,
//"_LightColorAttenuation": 0.0,
//"_OutlineWidth": 0.5 * 10,
//"_OutlineScaledMaxDistance": 1,
//"_OutlineLightingMix": 1,
//"_DebugMode": 0,
//"_BlendMode": 0,
//"_OutlineWidthMode": 0,
//"_OutlineColorMode": 0,
//"_CullMode": 2,
//"_OutlineCullMode": 1,
//"_MToonVersion": 32,
//"_Mode": 0,
//"_SrcBlend": 1.0,
//"_DstBlend": 0.0,
//"_ZWrite": 1,
//"_IsFirstSetup": 0
                        },
keywordMap: {},
tagMap: { RenderType: 'Opaque' },
                        textureProperties: {
_MainTex: 0,
//_BumpMap: 2,
//_BumpMap: 5,
//_SphereAdd: 3
                        },
                        vectorProperties: {
//"_OutlineColor": [1,0,0, 1],
//"_ShadeColor": [0.1, 0.9, 0.1, 1], // cluster で効いてる
//"_MainTex": [0, 0, 0.5, 0.5], // オフセットと比率
//_BumpMap: [0,0, 1,1],
//"_EmissionColor": [0.1, 0.1, 0.1, 1]
                        }
                };
                break;

                case 1: // 丸いところ 色 uv 指定
                    prop = { // VRM/MToon シェーダー
                        name: name,
                        shader: 'VRM/MToon',
                        renderQueue: 5000,
                        floatProperties: {
//"_ReceiveShadowRate":1,
//"_ShadeShift":0,
//"_ShadeToony": 0.9,
//"_LightColorAttenuation": 0.0, // 丸いところ 光反映
//"_OutlineWidth": 0.5 * 10,
//"_OutlineScaledMaxDistance": 1,
//"_OutlineLightingMix": 1,
//"_DebugMode": 0,
//"_BlendMode": 0,
//"_OutlineWidthMode": 0,
//"_OutlineColorMode": 0,
//"_CullMode": 2,
//"_OutlineCullMode": 1,
//"_MToonVersion": 32,
"_Mode": 0,
                        },
                        keywordMap: {},
                        tagMap: { RenderType: 'Opaque' },
                        textureProperties: {
                            _MainTex: 0,
                            //_SphereAdd: 3
                        },
                        vectorProperties: {
//"_OutlineColor": [0,1,0, 1],
//"_ShadeColor": [0.1, 0.9, 0.1, 1], // cluster で効いてる
//_BumpMap: [0,0, 1,1],
//"_EmissionColor": [0.1, 0.1, 0.1, 1]
                        }
                };
                break;

                case 1111: // Standard シェーダー
                    //m.normalTexture = { index: 2, texCoord: 0 };
                    //m.emissiveTexture = { index: 3, texCoord: 0 };
                    prop = {
                        name: name,
                        shader: 'Standard',
                        renderQueue: 2000,
                        floatProperties: {"_Cutoff": 0.5,
            "_Glossiness": 0.5, "_GlossMapScale": 1,
            "_SmoothnessTextureChannel": 0,
            "_Metallic": ((i % 2) === 0) ? 1.0 : 0.5,
            "_SpecularHighlights": 1, "_GlossyReflections": 1,
//"_BumpScale": 1, "_Parallax": 0.02, "_OcclusionStrength": 1,
            "_DetailNormalMapScale": 1, "_UVSec": 0,
            "_Mode": 0,
//"_SrcBlend": 1.0, "_DstBlend": 0.0,
            "_ZWrite": 1
                        },
                        keywordMap: {},
                        tagMap: { RenderType: 'Opaque' },
                        textureProperties: {
                            _MainTex: 0,
                            //_BumpMap: 2,
                            //_SphereAdd: 3
                        },
                        vectorProperties: {
                            //_MainTex: [0,0, 0.5,0.5], // 効く 3tene
                            //_BumpMap: [0,0, 1,1],
                            //_Color: [1,1,1, 1],
                            //_EmissionColor: [0.1, 0.1, 0.1, 1]
                        }
                    };
                    break;

                case 2: // VRM/MToon シェーダー 目のところ予定
                    prop = {
                        name: name,
                        shader: 'VRM/MToon',
                        renderQueue: 2000,
                        floatProperties: {
"_UvAnimScrollX": 0.25,
//"_ReceiveShadowRate":1,
//"_ShadeShift":0,
//"_ShadeToony": 0.9,
"_LightColorAttenuation": 1, // 光の影響を受けない
//"_OutlineWidth": 0.5,
//"_OutlineScaledMaxDistance": 1,
//"_OutlineLightingMix": 1,
//"_DebugMode": 0,
"_BlendMode": 0,
//"_OutlineWidthMode": 0,
//"_OutlineColorMode": 0,
"_CullMode": 2,
//"_OutlineCullMode": 1,
"_MToonVersion": 32,
"_Mode": 0,
//"_SrcBlend": 1.0,
//"_DstBlend": 0.0,
//"_ZWrite": 1,
//"_IsFirstSetup": 0
                        },
keywordMap: {},
tagMap: { RenderType: 'Opaque' },
textureProperties: { _MainTex: 7 },
                        vectorProperties: {
"_Color": [1,1,1, 1],
//"_ShadeColor": [0.1, 0.9, 0.1, 1], // cluster で効いてる
//_MainTex: [0, 0, 0.5, 0.5], // オフセットと比率 効く 3tene
//_BumpMap: [0,0, 1,1],
//_EmissionColor: [0.1, 0.1, 0.1, 1]
                        }
                };
                break;

                case 3: // VRM/MToon シェーダー アンテナのところ予定
                    prop = {
                        name: name,
                        shader: 'VRM/MToon',
                        renderQueue: 2000,
                        floatProperties: {
//"_UvAnimScrollX": 0.01,
//"_UvAnimScrollY": 0.01,
//"_UvAnimRotation": 0.01,
//"_ReceiveShadowRate":1,
//"_ShadeShift":0,
//"_ShadeToony": 0.9,
//"_LightColorAttenuation": 0.5,
"_OutlineWidth": 0.5,
"_OutlineScaledMaxDistance": 1,
"_OutlineLightingMix": 1,
//"_DebugMode": 0,
"_BlendMode": 0,
//"_OutlineWidthMode": 0,
//"_OutlineColorMode": 0,
"_CullMode": 2,
"_OutlineCullMode": 1,
"_MToonVersion": 32,
"_Mode": 0,
//"_SrcBlend": 1.0,
//"_DstBlend": 0.0,
//"_ZWrite": 1,
//"_IsFirstSetup": 0
                        },
                        keywordMap: {},
                        tagMap: { RenderType: 'Opaque' },
                        textureProperties: { _MainTex: 0,
                            //_BumpMap: 2,
                            //_SphereAdd: 3
                        },
                        vectorProperties: {
"_Color": [1,1,1, 1],
//"_ShadeColor": [0.1, 0.9, 0.1, 1], // cluster で効いてる
//_MainTex: [0, 0, 0.5, 0.5], // オフセットと比率 効く 3tene
//_BumpMap: [0,0, 1,1],
//_EmissionColor: [0.1, 0.1, 0.1, 1]
                        }
                };
                break;

            case 333: // スタンダード
                prop = {
                    name: name,
                    shader: 'Standard',
                    renderQueue: 2000,
                    floatProperties: {"_Cutoff": 0.5,
        "_ReceiveShadowRate":1, "_ShadeShift":0,
        "_ShadeToony": 0.9, "_LightColorAttenuation": 0,
        "_OutlineWidth": 0.5, "_OutlineScaledMaxDistance": 1,
        "_OutlineLightingMix": 1, "_DebugMode": 0,
        "_BlendMode": 0, "_OutlineWidthMode": 0,
        "_OutlineColorMode": 0, "_CullMode": 2,
        "_OutlineCullMode": 1,
        "_BumpScale": 1,
        "_Mode": 0,
        "_SrcBlend": 1.0,
        "_DstBlend": 0.0,
        "_ZWrite": 1,
        "_IsFirstSetup": 0
                    },
                    keywordMap: {},
                    tagMap: { RenderType: 'Opaque' },
                    textureProperties: { _MainTex: 0,
                        //_BumpMap: 2,
                        //_SphereAdd: 3
                    },
                    vectorProperties: {
                        _MainTex: [0, 0, 0.5, 0.5], // オフセットと比率 効く 3tene
                        _BumpMap: [0,0, 1,1],
                        "_ShadeColor": [0.1, 0.9, 0.1, 1], // cluster で効いてる
                        _Color: [1,1,1, 1],
                        _EmissionColor: [0.1, 0.1, 0.1, 1]
                    }
            };
                break;

                case 4: // VRM/ シェーダー
                    prop = {
                        name: name,
                        shader: 'VRM/UnlitTexture',
                        renderQueue: 2000,
floatProperties: {
"_UvAnimScrollX": 0.01,
"_UvAnimScrollY": 0.01,
"_UvAnimRotation": 0.01,
"_Cutoff": 0.5,
"_BumpScale": 1,
"_ReceiveShadowRate":1, "_ShadeShift":0,
"_ShadeToony": 0.9,
"_LightColorAttenuation": 0.5,
"_OutlineWidth": 0.5,
"_OutlineScaledMaxDistance": 1,
"_OutlineLightingMix": 1, "_DebugMode": 0,
"_BlendMode": 0, "_OutlineWidthMode": 0,
"_OutlineColorMode": 0, "_CullMode": 2,
"_OutlineCullMode": 1,
"_MToonVersion": 32,
"_Mode": 0,
"_SrcBlend": 1.0,
"_DstBlend": 0.0,
"_ZWrite": 1,
"_IsFirstSetup": 0
                        },
                        keywordMap: {},
                        tagMap: { RenderType: 'Opaque' },
                        textureProperties: { _MainTex: 0,
                            //_BumpMap: 2,
                            //_SphereAdd: 3
                        },
vectorProperties: {
    "_Color": [1,1,1, 1],
//"_ShadeColor": [0.1, 0.9, 0.1, 1], // cluster で効いてる
_MainTex: [0, 0, 0.5, 0.5], // オフセットと比率 効く 3tene
//_BumpMap: [0,0, 1,1],
//_EmissionColor: [0.1, 0.1, 0.1, 1]
}
                };
                    break;

                    case 5: // VRM/ シェーダー
                        prop = {
                            name: name,
                            shader: 'VRM/UnlitCutout',
                            renderQueue: 3000,
floatProperties: {
    "_UvAnimScrollX": 0.01,
    "_UvAnimScrollY": 0.01,
    "_UvAnimRotation": 0.01,
    "_Cutoff": 0.5,
    "_BumpScale": 1,
    "_ReceiveShadowRate":1, "_ShadeShift":0,
    "_ShadeToony": 0.9,
"_LightColorAttenuation": 0.5,
    "_OutlineWidth": 0.5,
    "_OutlineScaledMaxDistance": 1,
    "_OutlineLightingMix": 1, "_DebugMode": 0,
    "_BlendMode": 0, "_OutlineWidthMode": 0,
    "_OutlineColorMode": 0, "_CullMode": 2,
    "_OutlineCullMode": 1,
    "_MToonVersion": 32,
    "_Mode": 0,
    "_SrcBlend": 1.0,
    "_DstBlend": 0.0,
    "_ZWrite": 1,
    "_IsFirstSetup": 0
},
                            keywordMap: {},
                            tagMap: { RenderType: 'Opaque' },
textureProperties: { _MainTex: 1, _BumpMap: 2, _SphereAdd: 3 },
vectorProperties: {
    "_Color": [1,1,1, 1],
    "_ShadeColor": [0.1, 0.9, 0.1, 1], // cluster で効いてる
//_MainTex: [0, 0, 0.5, 0.5], // オフセットと比率 効く 3tene
//_BumpMap: [0,0, 1,1],
//_EmissionColor: [0.1, 0.1, 0.1, 1]
}
                    };
                        break;

                        case 6: // VRM/ シェーダー パーティクルとか
                            prop = {
                                name: name,
                                shader: 'VRM/UnlitTransparent',
                                renderQueue: 6000,
floatProperties: {
        "_UvAnimScrollX": 0.01,
        "_UvAnimScrollY": 0.01,
        "_UvAnimRotation": 0.01,
        "_Cutoff": 0.5,
        "_BumpScale": 1,
        "_ReceiveShadowRate":1, "_ShadeShift":0,
        "_ShadeToony": 0.9,
"_LightColorAttenuation": 0.5,
        "_OutlineWidth": 0.5,
        "_OutlineScaledMaxDistance": 1,
        "_OutlineLightingMix": 1, "_DebugMode": 0,
        "_BlendMode": 0, "_OutlineWidthMode": 0,
        "_OutlineColorMode": 0, "_CullMode": 2,
        "_OutlineCullMode": 1,
        "_MToonVersion": 32,
        "_Mode": 0,
        "_SrcBlend": 1.0,
        "_DstBlend": 0.0,
        "_ZWrite": 1,
        "_IsFirstSetup": 0
},
keywordMap: {},
tagMap: { RenderType: 'Opaque' },
textureProperties: { _MainTex: 1 },
vectorProperties: {
    "_Color": [1,1,1, 1],
"_ShadeColor": [0.1, 0.9, 0.1, 1], // cluster で効いてる
//_MainTex: [0, 0, 0.5, 0.5], // オフセットと比率 効く 3tene
    _EmissionColor: [0.1, 0.1, 0.1, 1]
}
                        };
                            break;

                case 777: // VRM/ シェーダー Z書く
                    prop = {
                        name: name,
                        shader: 'VRM/UnlitTransparentZWrite',
                        renderQueue: 3000,
                        floatProperties: {
"_UvAnimScrollX": 0.01,
"_UvAnimScrollY": 0.01,
"_UvAnimRotation": 0.01,
"_Cutoff": 0.5,
"_BumpScale": 1,
"_ReceiveShadowRate":1, "_ShadeShift":0,
"_ShadeToony": 0.9,
"_LightColorAttenuation": 0.5,
"_OutlineWidth": 0.5,
"_OutlineScaledMaxDistance": 1,
"_OutlineLightingMix": 1, "_DebugMode": 0,
"_BlendMode": 0, "_OutlineWidthMode": 0,
"_OutlineColorMode": 0, "_CullMode": 2,
"_OutlineCullMode": 1,
"_MToonVersion": 32,
"_Mode": 0,
"_SrcBlend": 1.0,
"_DstBlend": 0.0,
"_ZWrite": 1,
"_IsFirstSetup": 0
                        },
                        keywordMap: {},
                        tagMap: { RenderType: 'Opaque' },
textureProperties: { _MainTex: 1 },
                        vectorProperties: {
"_Color": [1,1,1, 1],
"_ShadeColor": [0.1, 0.9, 0.1, 1], // cluster で効いてる
//_MainTex: [0, 0, 0.5, 0.5], // オフセットと比率 効く 3tene
//_EmissionColor: [0.1, 0.1, 0.1, 1]
                        }
                };
                break;

            case 888:
                prop = {
                        name: name,
                        shader: 'Standard',
                        renderQueue: 2000,
                        floatProperties: {"_Cutoff": 0.5,
            "_ReceiveShadowRate":1, "_ShadeShift":0,
            "_ShadeToony": 0.9, "_LightColorAttenuation": 0,
            "_OutlineWidth": 0.5, "_OutlineScaledMaxDistance": 1,
            "_OutlineLightingMix": 1, "_DebugMode": 0,
            "_BlendMode": 0, "_OutlineWidthMode": 0,
            "_OutlineColorMode": 0, "_CullMode": 2,
            "_OutlineCullMode": 1,
            "_BumpScale": 1,
            "_Mode": 0,
            "_SrcBlend": 1.0,
            "_DstBlend": 0.0,
            "_ZWrite": 1,
            "_IsFirstSetup": 0
                        },
                        keywordMap: {},
                        tagMap: { RenderType: 'Opaque' },
                        textureProperties: { _MainTex: 1,
                            _BumpMap: 2,
                            _SphereAdd: 3 },
                        vectorProperties: {
                            _MainTex: [0, 0, 0.5, 0.5], // オフセットと比率 効く 3tene
                            _BumpMap: [0,0, 1,1],
                            "_ShadeColor": [0.1, 0.9, 0.1, 1], // cluster で効いてる
                            _Color: [1,1,1, 1],
                            _EmissionColor: [0.1, 0.1, 0.1, 1]
                        }
                };
                break;

                default:
                    prop = {
                        name: name,
                        shader: 'VRM/MToon',
                        renderQueue: 5000,
                        floatProperties: {
//"_UvAnimScrollX": 0.0,
//"_UvAnimScrollY": 0.0,
//"_UvAnimRotation": 0.01,
//"_Cutoff": 0.5,
//"_BumpScale": 1,
//"_ReceiveShadowRate":1,
//"_ShadeShift":0,
//"_ShadeToony": 0.9,
///"_LightColorAttenuation": 0.5,
//"_OutlineWidth": 0.5,
//"_OutlineScaledMaxDistance": 1,
//"_OutlineLightingMix": 1,
//"_DebugMode": 0,
//"_BlendMode": 0,
//"_OutlineWidthMode": 0,
//"_OutlineColorMode": 0,
//"_CullMode": 2,
//"_OutlineCullMode": 1,
//"_MToonVersion": 32,
//"_Mode": 0,
//"_SrcBlend": 1.0,
//"_DstBlend": 0.0,
//"_ZWrite": 1,
//"_IsFirstSetup": 0
                        },
keywordMap: {},
tagMap: { RenderType: 'Opaque' },
textureProperties: { _MainTex: 0 },
                        vectorProperties: {
//"_Color": [1,1,1, 1],
//"_ShadeColor": [0.1, 0.9, 0.1, 1], // cluster で効いてる
//_MainTex: [0, 0, 0.5, 0.5], // オフセットと比率
//_EmissionColor: [0.1, 0.1, 0.1, 1]
                        }
                };
            }
            ret.props.push(prop);
        }
        console.log(this.cl, `createMaterials leave`, ret);
        return ret;
    }

/**
 * 1つ以上とする
 * @param {{}[]} vts 頂点
 * @param {number[][]} arr 面頂点配列の配列
 */
    paddingFace(vts, arr) {
        console.log(`paddingFace called`);

        const pts = [{ p: [-1,1,0], uv: [0,0]},
            {p: [1,1,0], uv: [1,0]},
            {p: [1,-1,0], uv: [0,1]},
            {p: [-1,-1,0], uv: [1,1]}];
        arr.forEach(bym=>{
            if (bym.length >= 1) {
                return;
            }
            let offset = vts.length;
            pts.forEach((v, i)=>{
                const vtx = new Vtx();
                vtx.p.set(v.p[0], v.p[1], v.p[2]);
                vtx.p.multiplyScalar(0);
                vtx.n.set(0,0,1);
                //vtx.calcStandardTan();
                vtx.uv.set(v.uv[0], v.uv[1]);
                vts.push(vtx);
            });
            let v0 = offset; // 時計回り
            let v1 = v0 + 1;
            let v2 = v0 + 2;
            let v3 = v0 + 3;
            bym.push([v0, v3, v2]);
            bym.push([v0, v2, v1]);
        });
    }

    /**
     * .gltf と .bin に相当するデータを生成して
     * 内部に保持する
     */
    makeData2() {

        console.info(this.cl, `makeDate2 called`);

        /**
         * TODO: ここを変更
         */
        const modelVersion = `1.38.13`;
        const modelTitle = 'poly bbb 図形人形';

        let texs = [
            { tex: this.baseTex },
            { tex: this.thumbTex },
            { tex: this._tex02 },
            { tex: this._tex03 },
            { tex: this._tex04 },
            { tex: this._tex05 },
            { tex: this._tex06 },
            { tex: this._tex07 }
        ];
        texs = texs.slice(0, this.texNum);

        /**
         * 全テクスチャのバイナリ領域
         */
        let texByte = 0;
        for (const v of texs) {
            v.byteLength = + v.tex.byteLength;
            v.byteStride = Math.ceil(v.byteLength / 4) * 4;
            texByte += v.byteStride;
        } // テクスチャも4バイトアラインしておく

        /**
         * あとでセットする obj.nodes
         */
        const treenodes = [];
        this.makeTree(treenodes);

        /**
         * 頂点オブジェクトの配列
         */
        const vts = [];
        /**
         * 材質ごとの面配列
         * @type {number[][][]}
         */
        const arr = [];
        for (let i = 0; i < this.materialNum; ++i) {
            arr.push([]);
        }

        this.makeSubMesh(vts, treenodes, arr);
        this.paddingFace(vts, arr);

        /**
         * メッシュ生成後の頂点数
         */
        const vtNum = vts.length;

/**
 * ノードすべて。bone でなくてもテクスチャに影響を与えるので
 */
        const jointNum = treenodes.length;
        console.info(`ジョイント数(treenodes)`, jointNum);

        let found = this.searchNode(treenodes,
            /head/i);
        const headNodeIndex = found.index;
        console.log(`head search`, found);

        const bvs = [
            {
                byteLength: 3 * 4 * vtNum,
                componentType: this.FLOAT,
                count: vtNum,
                max: [ 1,  1,  1],
                min: [-1, -1, -1], // 範囲
                type: 'VEC3'
            },
            {
                byteLength: 3 * 4 * vtNum,
                componentType: this.FLOAT,
                count: vtNum,
                type: 'VEC3'
            },
            {
                byteLength: 2 * 4 * vtNum,
                componentType: this.FLOAT,
                count: vtNum,
                type: 'VEC2'
            },
            { // #3 WEIGHTS_0
                byteLength: 4 * 4 * vtNum,
                componentType: this.FLOAT,
                count: vtNum,
                type: 'VEC4'
            },
            { // #4 JOINTS_0 short か..
                byteLength: 4 * 2 * vtNum,
                componentType: this.UNSIGNED_SHORT,
                count: vtNum,
                type: 'VEC4'
            }
        ];

        /**
         * 面構成インデックスの先頭
         */
        const facetop = bvs.length;
        for (let i = 0; i < arr.length; ++i) {
            const facenum = arr[i].length;
            bvs.push({ // 面構成頂点
                byteLength: facenum * 3 * 4,
                componentType: this.UNSIGNED_INT,
                count: facenum * 3,
                type: 'SCALAR' });
        }

        const inverseIndex = bvs.length;
        console.info(`面と逆行列(bufferViewで`, facetop, inverseIndex);
        {
            bvs.push({
                byteLength: 16 * 4 * jointNum,
                componentType: this.FLOAT,
                count: jointNum,
                type: 'MAT4' });
        }


        const obj = {
            //extensionsRequired: [],
            extensionsUsed: ["VRM"],
            asset: {
                version: "2.0",
                generator: 'usagi ECMAScript'
            },
            nodes: [],
            scenes: [{ nodes: [] }],
// GLB-stored Buffer によると uri は undefined にして配列の先頭で参照する
            buffers: [
                { byteLength: 0 /*binBufByte*/ }
            ],
            bufferViews: [],
            accessors: [],
            images: [],
            textures: [],
            materials: [],
            samplers: [
                { // 通常テクスチャ用
                    magFilter: this.LINEAR,
                    minFilter: this.LINEAR_MIPMAP_LINEAR,
                    wrapS: this.REPEAT,
                    wrapT: this.REPEAT
                    //wrapS: this.CLAMP_TO_EDGE,
                    //wrapT: this.CLAMP_TO_EDGE
                },
                {
                    magFilter: this.LINEAR,
                    minFilter: this.LINEAR,
                    wrapS: this.REPEAT,
                    wrapT: this.REPEAT
                    //wrapS: this.CLAMP_TO_EDGE,
                    //wrapT: this.CLAMP_TO_EDGE
                }
            ],
            meshes: [ { primitives: [] }],
            skins: [
                {
                    inverseBindMatrices: inverseIndex, joints: []
                } // bookmark
            ],

            extensions: {
                VRM: {
                    //version: "0.44",
                    exporterVersion: "usagiECMAScript-0.38.1",
                    specVersion: "0.0",
                    meta: {
                        title: modelTitle,
                        author: 'usagi',
                        contactInformation: '',
                        reference: '',
                        texture: 1,
                        version: modelVersion,
                        allowedUserName: 'Everyone',
                        violentUssageName: this.ALLOW,
                        violentUsageName: this.ALLOW,
                        sexualUssageName: this.ALLOW,
                        sexualUsageName: this.ALLOW,
                        commercialUssageName: this.ALLOW,
                        commercialUsageName: this.ALLOW,
                        otherPermissionUrl: '',
                        licenseName: 'CC0',
                        otherLicenseUrl: ''
                    },
                    humanoid: {
                        armStretch: 0.05,
                        feetSpacing: 0,
                        hasTranslationDoF: false,
                        legStretch: 0.05,
                        lowerArmTwist: 0.5,
                        lowerLegTwist: 0.5,
                        upperArmTwist: 0.5,
                        upperLegTwist: 0.5,
                        humanBones: []
                    },
                    firstPerson: {
                        firstPersonBone: headNodeIndex,
                        firstPersonOffset: { x:0, y:0, z:0 },
                        meshAnnotations: [
                            { mesh: 0, firstPersonFlag: 'Auto' }
                        ],
                        lookAtTypeName: 'Bone',
                        lookAtHorizontalInner: { curve: [0,0,0,1,1,1,1,0],
                            xRange: 30, yRange: 30 },
                        lookAtHorizontalOuter: { curve: [0,0,0,1,1,1,1,0],
                            xRange: 30, yRange: 10 },
                        lookAtVerticalDown: { curve: [0,0,0,1,1,1,1,0],
                            xRange: 30, yRange: 10 },
                        lookAtVerticalUp: { curve: [0,0,0,1,1,1,1,0],
                            xRange: 30, yRange: 8 }
                    },
                    blendShapeMaster: { blendShapeGroups: [] },
                    secondaryAnimation: {
                        boneGroups: [],
                        colliderGroups: []
                    },
                    materialProperties: []
                } // VRM
            } // extension

    }; // obj

    /**
     * VRM! VRM!
     */
    const vrm = obj.extensions.VRM;

    const globals = [];
    { // node のツリー構造
        obj.nodes = treenodes;

        // 統一されているものとしてコピー

        obj.nodes.forEach((v,i) => {
            const b = {
                bone: `${v.name}`,
                node: + i,
                useDefaultValues: true
            };

            let isbone = true;
            if ('_k' in v) {
                if (v._k.includes('exc')) {
                    isbone = false;
                }
            }

            if (isbone) {
                vrm.humanoid.humanBones.push(b);
            }

            //console.log(v.name, v._global);

            // bookmark 違うけど一応ここで
            globals.push(v._global);
            obj.skins[0].joints.push(i);

            // (ノード)ボーン追従
            const coll = {
                node: + i,
                colliders: [ {offset: {x: 0, y: 0, z: 0},
                    radius: 0.01 } ]
            };
            vrm.secondaryAnimation.colliderGroups.push(coll);
        });

        { // 揺れ物の根元らしいが どうも ノードインデックスに見える
            [
                [],
                [/antenna0/i]
            ].forEach((regs, i) => {
                const phybone = {
                    bones: [],
                    center: -1,
                    colliderGroups: [],
                    comment: `bg${String(i).padStart(2, '0')}`,
                    dragForce: 0.0, // 抵抗 減速
                    gravityDir: {x: 0, y: -1, z: 0},
                    gravityPower: 1.0,
                    hitRadius: 0.01,
                    stiffiness: 0.5 // 復元力
                };
                regs.forEach(reg => {
                    let found = this.searchNode(treenodes, reg);
                    if (found) {
                        phybone.bones.push(found.index);
                    }
                });
                vrm.secondaryAnimation.boneGroups.push(phybone);
            });
        }

        obj.scenes[0].nodes.push(0);

        let index = obj.nodes.length;
        obj.nodes.push({ name: 'skinnode',
            translation: [0,0,0],
            rotation: [0,0,0,1],
            scale: [1,1,1],
            mesh: 0,
            skin: 0
        });
        obj.scenes[0].nodes.push(index);

        index = obj.nodes.length;
        obj.nodes.push({ name: 'secondary',
            translation: [0,0,0],
            rotation: [0,0,0,1],
            scale: [1,1,1]
        });
        obj.scenes[0].nodes.push(index);
    }

    const ms = this.createMaterials();
    obj.materials.push(...ms.ms);
    vrm.materialProperties.push(...ms.props); 

    { // モーション
        ['Neutral',
            'A', 'I', 'U', 'E', 'O',
            'Blink',
            'Joy', 'Angry', 'Sorrow', 'Fun',
            'LookUp', 'LookDown', 'LookLeft', 'LookRight',
            'Blink_L', 'Blink_R'].forEach(k => {
            const gr = {
                name: `${k}`,
                presetName: `${k.toLocaleLowerCase()}`,
                binds: [], materialValues: []
            };
            vrm.blendShapeMaster.blendShapeGroups.push(gr);
        });
    }

    /**
     * bufferView の番号が1つずつ増えていく
     */
    let bvOffset = 0;
    /**
     * buffer のバイトオフセットがバイト単位で増えていく
     */
    let byteOffset = 0;
    {
        for (const bv of bvs) {
            obj.bufferViews.push({
                buffer: 0,
                byteLength: bv.byteLength,
                byteOffset: byteOffset
            });
            bv.bufferView = bvOffset;
            //bv.byteOffset = + byteOffset; // TODO: これ間違い

            byteOffset += bv.byteLength;
            delete bv.byteLength;

            obj.accessors.push(bv);

            bvOffset += 1;
        }
    }

    arr.forEach((v, i) => { // プリミを複数段にする。材質があるので
        let prim = {
            mode: 4,
            attributes: {
                POSITION: 0,                  
                NORMAL: 1,
                TEXCOORD_0: 2,
                WEIGHTS_0: 3,
                JOINTS_0: 4
            },
            indices: facetop + i, // 面構成頂点
            material: + i, // 材質インデックス
        };
        if (i >= 0) {
//        if (false) {
            prim.targets = [
                {
                    POSITION: 0,
                    NORMAL: 1
                }
            ];
        }

        obj.meshes[0].primitives.push(prim);
    });


//// バイナリここから ////

/**
 * テクスチャ以外の buffer 内でのバイトオフセット
 */
    let attrByte = byteOffset;

// 切り上げてちょうど確保
    const binBufByte = Math.ceil((attrByte + texByte) / 4) * 4;
/**
* バイナリ全体
*/
    const buf = new ArrayBuffer(binBufByte);
    const p = new DataView(buf);

    obj.buffers[0].byteLength = binBufByte;


    /**
     * POSITION の範囲取得用
     */
        const range = {
            min: [9999, 9999, 9999], max: [-9999,-9999,-9999]
        };

        /**
         * バイトオフセット
         */
        let c = 0;
        { // position

            for (const v of vts) {
                const pp = [v.p.x, v.p.y, v.p.z];
                pp.forEach((v2, j) => {
                    p.setFloat32(c, v2, true);
                    c += 4;

                    range.min[j] = Math.min(range.min[j], v2);
                    range.max[j] = Math.max(range.max[j], v2);
                });
            }

            obj.accessors[0].min = [...range.min];
            obj.accessors[0].max = [...range.max];
            console.log(`最大最小`, obj.accessors[0]);
        }
        { // normal
            for (const v of vts) {
                p.setFloat32(c  , v.n.x, true);
                p.setFloat32(c+4, v.n.y, true);
                p.setFloat32(c+8, v.n.z, true);
                c += 3 * 4;
            }
        }
        { // uv ここがメイン
            const rate = 1;
            for (const v of vts) {
                p.setFloat32(c  , v.uv.x * rate, true);
                p.setFloat32(c+4, v.uv.y * rate, true);
                c += 2 * 4;
            }
        }

        { // WEIGHTS_0
            vts.forEach(v => {
                p.setFloat32(c   , v.wei.x, true);
                p.setFloat32(c+ 4, v.wei.y, true);
                p.setFloat32(c+ 8, v.wei.z, true);
                p.setFloat32(c+12, v.wei.w, true);
                c += 4 * 4;
            });
        }
        { // JOINTS_0
            for (const v of vts) {
                p.setUint16(c   , v.jnt.x, true);
                p.setUint16(c+ 2, v.jnt.y, true);
                p.setUint16(c+ 4, v.jnt.z, true);
                p.setUint16(c+ 6, v.jnt.w, true);
                c += 2 * 4;
            }
        }

        for (const v of arr) { // face indices 材質8つ
            for (const f of v) { // 1つの面
                p.setUint32(c  , f[0], true);
                p.setUint32(c+4, f[1], true);
                p.setUint32(c+8, f[2], true);
                c += 3 * 4;
            }
        }

        { // 行列
            for (let i = 0; i < jointNum; ++i) {
                const glopos = globals[i];
                const mts = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0, 1];
                mts[12] = -glopos[0];
                mts[13] = -glopos[1];
                mts[14] = -glopos[2];
                for (const v of mts) {
                    p.setFloat32(c, v, true);
                    c += 4;
                }
            }
        }

        {
            const buf8 = new Uint8Array(buf);
            let d = attrByte;
            console.log(`テクスチャ開始バイト`, d, c);

// テクスチャ
            console.log(`テクスチャ bufferView 開始インデックス`, bvOffset);
            texs.forEach((v, i) => {
                obj.images.push({
                    bufferView: bvOffset,
                    mimeType: 'image/png'
                });
                bvOffset += 1;
                obj.textures.push({
                    sampler: 0, source: + i
                });

                const b8 = new Uint8Array(v.tex);
                buf8.set(b8, d); // オフセットd は buf8 の中、で全体を書き込む

                obj.bufferViews.push({
                        buffer: 0,
                        byteOffset: d,
                        byteLength: v.byteLength
                    });
                    d += v.byteStride; 
                });
        }

        this.deleteExtra(obj);

        if (true) {
            let facesum = 0;
            for (const v of arr) {
                facesum += v.length;
            }

            console.info(`ノード`, obj.nodes.length);
            console.info(`頂点`, vts.length);
            console.info(`面数(32000)`, facesum);
            console.info(`テクスチャ数`, obj.textures.length);
            console.info(`ボーン(128)`);
        }

// 多めにとった String
        this.str = JSON.stringify(obj) + ' '.repeat(4);
// ちょうどパディング済み Uint8Array
        this.bin = new Uint8Array(buf);
        console.log(this.cl, `makeData2 leave`,
            this.str.length, this.bin.length);
    }

    /**
     * _foo のようなメンバを削除する
     * @param {Object} obj 
     * @param {{}[]} obj.nodes 
     */
    deleteExtra(obj) {
        let count = 0;
        obj.nodes.forEach(node => {
            const keys = Object.keys(node);
            keys.forEach(k => {
                if (k.substr(0,1) === '_') {
                    delete node[k];
                    ++count;
                }
            });
        });
        console.log(`deleteExtra leave`, count);
    }

}


if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = Gltf;
    }
    exports.Gltf = Gltf;
} else {
    global_.Gltf = Gltf;
}

})( (this || 0).self || typeof self !== 'undefined' ? self : global );

