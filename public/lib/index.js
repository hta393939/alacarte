/**
 * @file index.js
 */

/**
 * @param {number} v 値
 */
const _pad = (v, n = 2) => {
    return String(v).padStart(n, '0');
};

const _dstr = (d = new Date()) => {
    let s = '';
    s += _pad(d.getFullYear(), 4);
    s += `_${_pad(d.getMonth() + 1)}`;
    s += _pad(d.getDate());
    s += `_${_pad(d.getHours())}`;
    s += _pad(d.getMinutes());
    s += _pad(d.getSeconds());
    s += `_${_pad(d.getMilliseconds(), 3)}`;
    return s;
};

/**
 * 距離
 * @param {number[]} a 
 * @param {number[]} b 
 * @returns {number}
 */
const _dist = (a, b) => {
    let sum = 0;
    sum += (a[0] - b[0]) ** 2;
    sum += (a[1] - b[1]) ** 2;
    sum += (a[2] - b[2]) ** 2;
    return Math.sqrt(sum);
};

/**
 * Set から array を得る
 * @param {Set} t 
 * @returns {any[]} 
 */
const _settoarray = (t) => {
    return Array.from(t).sort((a, b) => a - b);
};


class Misc {
    constructor() {
    }

/**
 * 
 * @param {File} file 
 */
    async parseFile(file) {
        const ab = await file.arrayBuffer();
        const parser = new PMX.Maker();
        this.parser = parser;
        parser.parse(ab);

        const result = this.analyzeFileRoss(parser);
//        const ss = adjustvts.map(vtx => vtx.toCSV());

        result.push('');
        let str = result.join('\n');
        await navigator.clipboard.writeText(str);
    }

/**
 * 位置ベース
 * @param {PMX.Parser} parser 
 * @returns {string[]} 行ごとに返す
 */
    analyzeFileRoss(parser) {
        let rc = 93;
        //const rce = 94; // 無い
        let rtop = 785;
        const rpos = [-1.37018, 14.7010, -1.96364];

        let lc = 95;
        //const lce = 96; // 無い
        let ltop = 4707;
        const lpos = [-rpos[0], rpos[1], rpos[2]];

        console.log(parser.vts[rtop].p, parser.vts[ltop].p);

        for (let i = 0; i < parser.bones.length; ++i) {
            const b = parser.bones[i];
            if (b.nameJa === '右胸') {
                rc = i;
                console.info('found rc', rc);
            } else if (b.nameJa === '左胸') {
                lc = i;
                console.info('found lc', lc);
            }
        }

// 材質で絞るためのカウント
        let _ficount = 0;
        let mtl = null;
        const mtlIndex = 10;
        for (let i = 0; i < parser.materials.length; ++i) {
            mtl = parser.materials[i];
            if (mtl.nameJa === '\u88f8') {
//            if (mtlIndex === i) {
                console.log('_ficount', _ficount);
                break;
            }
            _ficount += mtl._faceIndexNum;
            console.log(mtl._faceIndexNum / 3);
        }

// 対象頂点を絞る
        const oneIndices = new Set();

        const R = 0;
        const L = 1;
        const lrname = ['right', 'left'];
/**
 * 最小が有効扱いするので大きい値
 */
        const NA = 999999;

        let rmin = 99999;
        let lmin = 99999;

        for (let i = 0; i < mtl._faceIndexNum; ++i) {
            const index = _ficount + i;
            const vtxIndex = parser.faceIndices[index];
/**
 * 頂点1個
 */
            const vtx = parser.vts[vtxIndex];
            vtx._analyze = {
                target: false,
                ring: NA,
                lr: NA,
            };

// 影響1個
            if (vtx.deformType !== PMX.Vertex.DEFORM_BDEF1) {
                continue;
            }
            let found = NA;
            if (vtx.joints.includes(rc)) {
                found = R;
            }
            if (vtx.joints.includes(lc)) {
                found = L;
            }
            if (found == NA) {
                continue;
            }

            vtx._analyze.lr = found;
            vtx._analyze.target = true;

            oneIndices.add(vtxIndex);

            {
                const dist = _dist(vtx.p, rpos);
                if (dist < rmin) {
                    rmin = dist;
                    rtop = vtxIndex;
                    //console.log('r found', vtxIndex, rmin);
                }
            }
            {
                const dist = _dist(vtx.p, lpos);
                if (dist < lmin) {
                    lmin = dist;
                    ltop = vtxIndex;
                    //console.info('l found', vtxIndex, lmin);
                }
            }
        }
        parser.vts[rtop]._analyze.ring = 0;
        parser.vts[ltop]._analyze.ring = 0;
        console.log('rtop, ltop', rtop, ltop, rmin, lmin);
        const targets = _settoarray(oneIndices);

        console.log('one, targets', oneIndices, targets);

// flood で ring 階層を更新していく
        const faceNum = mtl._faceIndexNum / 3;
        for (let i = 0; i < 14; ++i) {
            for (let j = 0; j < faceNum; ++j) { // 面ループ
                const index = _ficount + j * 3;

                const faceIndices = parser.faceIndices.slice(index, index + 3);
// map() の返り値が Type[] であるので最後に変換が入る
                const vs = Array.from(faceIndices).map(v => parser.vts[v]);

                const minRing = Math.min(...(vs.map(v => v._analyze?.ring ?? NA)));
                if (minRing == NA) {
                    continue; // 何もしない
                }
                const minLR = Math.min(...vs.map(v => v._analyze?.lr ?? NA));

                for (let k = 0; k < 3; ++k) {
                    const analyze = vs[k]._analyze;
                    if (!analyze) {
                        continue;
                    }
                    analyze.ring = Math.min(minRing + 1, analyze.ring);
                    analyze.lr = minLR;
                }
            }
        }

/**
 * 各0～13段のインデックスに分離する
 */
        const ringNum = 14;
        const setset = [[], []];
        for (let i = 0; i < ringNum; ++i) {
            setset[R].push(new Set());
            setset[L].push(new Set());
        }

        for (const vi of targets) {
            const vtx = parser.vts[vi];
            if (vtx._analyze.ring >= ringNum) {
                continue;
            }
//            console.log('ring', vtx._analyze.lr, vtx._analyze.ring);
            setset[vtx._analyze.lr][vtx._analyze.ring].add(vi);
        }
        for (let i = 0; i < ringNum; ++i) {
            setset[R][i] = _settoarray(setset[R][i]);
            setset[L][i] = _settoarray(setset[L][i]);
        }

// リングごとに算出する
        const adjustvts = [];
        const morphs = [];

        const _shapes = [
            { rr: 1, delta: 0.00 }, // 0
            { rr: 0.4, delta: -0.01 }, // 1
            { rr: 0.8, delta: 0.02 }, // 2
            { rr: 1.0, delta: 0.02 }, // 3
            { rr: 1.1, delta: 0.02 }, // 4
            { rr: 1.08, delta: 0.03 }, // 5
            { rr: 1.05, delta: 0.03 }, // 6
            { rr: 1, delta: 0.03 }, // 7 基準
            { rr: 1, delta: 0.00 }, // 8
            { rr: 1, delta: 0.01 }, // 9
            { rr: 1, delta: 0.02 }, // 10
            { rr: 1, delta: 0.02 }, // 11
            { rr: 1, delta: 0.02 }, // 12
            { rr: 1, delta: 0.02 }, // 13          
        ];

        for (let i = 0; i < 2; ++i) {
            const morph = new PMX.Morph();
            morphs.push(morph);
            morph.nameEn = `${lrname[i]}chest`;
            morph.nameJa = morph.nameEn;
            morph.panel = PMX.Morph.PANEL_ETC;
            morph.type = PMX.Morph.TYPE_VERTEX;

            let offsets = [0, 0, 0];
            let radius7 = -1;
            for (let j = ringNum - 1; j >= 0 ; --j) {
                const pts = setset[i][j].map(index => {
                    return parser.vts[index].p;
                });
                const result = Util.Avg(pts);
                console.log('result', j, result);
                if (j === 7) {
                    radius7 = result.radius;
                }
                let newradius = radius7;

                // ここまでのオフセットを足す
/**
 * このリングの重心
 * @type {V3}
 */
                const center = new V3(...result.avg);
                for (const index of setset[i][j]) {
                    const vtx = parser.vts[index];

                    const vm = new PMX.VertexMorph();
                    vm._parentName = morph.nameJa;
                    // 一番最後に足すためのインデックス
                    vm._index = morph.vertexMorphs.length;
                    vm.target = index;
                    morph.vertexMorphs.push(vm);

                    // NOTE: 破壊している
                    const adjust = new V3(...offsets);
                    if (newradius >= 0) {
                        const diff = new V3(...vtx.p).sub(center);
                        const rr = diff.length() / (result.radius || 1) * newradius * _shapes[j].rr;
                        const dir = diff.clone().normalize();
                        adjust.add(center).add(dir.scale(rr)).sub(new V3(...vtx.p));
                    }
                    vm.offset = adjust.asArray();
                    vtx.p = adjust.add(new V3(...vtx.p)).asArray();

                    adjustvts.push(vtx);
                }
                // オフセットに法線とちょこっとを足す
                const delta = _shapes[j].delta;
                offsets[0] += - result.normal[0] * delta;
                offsets[1] += - result.normal[1] * delta;
                offsets[2] += - result.normal[2] * delta;
            }
        }

// 行返す
        const lines = [];
        {
            for (const morph of morphs) {
                lines.push(...morph.toLines());
            }
        }
        console.log('終わり', setset);
        return lines;
    }



    init() {
        window.view.textContent = new Date().toLocaleTimeString();

        window.idmake1?.addEventListener('click', () => {
            const param = {
                nameEn: `aa_capsulesdef`,
            };
            const writer = new CapsuleBuilder1();
            writer.make(param);
            const bufs = writer.makeBuffer();
            this.download(new Blob(bufs), `${param.nameEn}_${_dstr()}.pmx`);
    
            const offsets = writer.toOffsets(bufs);
            for (const chunk of offsets.chunks) {
                chunk.hex = `0x${chunk.offset.toString(16)}`;
            }
            console.log('make1 offsets', offsets);
        });
        window.idmake2?.addEventListener('click', () => {
            this.make2();
        });
        window.idmake3?.addEventListener('click', () => {
            this.make3();
        });
        window.idmake4?.addEventListener('click', () => {
            this.make4();
        });
        window.idmake5?.addEventListener('click', () => {
            this.make5();
        });
        window.idmake6?.addEventListener('click', () => {
            this.make6();
        });
        window.idmake7?.addEventListener('click', () => {
            const param = {
                nameEn: `ag_capsulesdef`,
            };
            const writer = new CapsuleBuilder7();
            writer.make(param);
            const bufs = writer.makeBuffer();
            this.download(new Blob(bufs), `${param.nameEn}_${_dstr()}.pmx`);
    
            const offsets = writer.toOffsets(bufs);
            for (const chunk of offsets.chunks) {
                chunk.hex = `0x${chunk.offset.toString(16)}`;
            }
            console.log('make7 offsets', offsets);            
        });

        window.idmake8?.addEventListener('click', () => {
            const param = {
                nameEn: `ah_capsulesdef`,
            };
            const writer = new CapsuleBuilder8();
            writer.make(param);
            const bufs = writer.makeBuffer();
            this.download(new Blob(bufs), `${param.nameEn}_${_dstr()}.pmx`);
    
            const offsets = writer.toOffsets(bufs);
            for (const chunk of offsets.chunks) {
                chunk.hex = `0x${chunk.offset.toString(16)}`;
            }
            console.log('make8 offsets', offsets);            
        });

        {
            const el = window.idtoclip1;
            el?.addEventListener('click', async () => {
                const maker = new TransObjectBuilder();
                maker.make1();
                const s = maker.toString();
                console.log('s', s);
                await navigator.clipboard.writeText(s);
            });
        }

        this.draw(window.canvast);
        this.draw1(window.canvast1);

        {
/**
 * @type {HTMLDivElement}
 */
            const el = window.drop;
            el?.addEventListener('dragover', ev => {
                ev.stopPropagation();
                ev.preventDefault();
                ev.dataTransfer.dropEffect = 'copy';
            });
            el?.addEventListener('drop', ev => {
                ev.stopPropagation();
                ev.preventDefault();
                this.parseFile(ev.dataTransfer.files[0]);
            });
        }

    }

/**
 * カプセルの生成
 */
    make2() {
        const writer = new CapsuleBuilder();
        writer.make2();
        const bufs = writer.makeBuffer();
        this.download(new Blob(bufs), `ab_${_dstr()}.pmx`);

        const offsets = writer.toOffsets(bufs);
        for (const chunk of offsets.chunks) {
            chunk.hex = `0x${chunk.offset.toString(16)}`;
        }
        console.log('make2 offsets', offsets);
    }

/**
 * その3の生成
 */
    make3() {
        const writer = new CapsuleBuilder();
        writer.make3();
        const bufs = writer.makeBuffer();
        this.download(new Blob(bufs), `ac_${_dstr()}.pmx`);

        const offsets = writer.toOffsets(bufs);
        for (const chunk of offsets.chunks) {
            chunk.hex = `0x${chunk.offset.toString(16)}`;
        }
        console.log('make3 offsets', offsets);
    }

/**
 * その4の生成 シンプルカプセルの生成
 */
    make4() {
        const writer = new CapsuleBuilder();
        writer.make4();
        const bufs = writer.makeBuffer();
        this.download(new Blob(bufs), `ad_${_dstr()}.pmx`);

        const offsets = writer.toOffsets(bufs);
        for (const chunk of offsets.chunks) {
            chunk.hex = `0x${chunk.offset.toString(16)}`;
        }
        console.log('make4 offsets', offsets);
    }

/**
 * その5の生成 カプセルの生成
 */
    make5() {
        const writer = new CapsuleBuilder();
        writer.make5();
        const bufs = writer.makeBuffer();
        this.download(new Blob(bufs), `ae_${_dstr()}.pmx`);

        const offsets = writer.toOffsets(bufs);
        for (const chunk of offsets.chunks) {
            chunk.hex = `0x${chunk.offset.toString(16)}`;
        }
        console.log('make5 offsets', offsets);
    }

/**
 * その6の生成
 */
    make6() {
        const writer = new CapsuleBuilder();
        writer.make6();
        const bufs = writer.makeBuffer();
        this.download(new Blob(bufs), `af_${_dstr()}.pmx`);

        const offsets = writer.toOffsets(bufs);
        for (const chunk of offsets.chunks) {
            chunk.hex = `0x${chunk.offset.toString(16)}`;
        }
        console.log('make6 offsets', offsets);
    }

/**
 * ダウンロードする
 * @param {*} blob 
 * @param {*} name 
 */
    download(blob, name) {
        const a = document.createElement('a');
        a.download = name;
        a.href = URL.createObjectURL(blob);
//        a.dispatchEvent(new MouseEvent('click'));
        a.click();
        URL.revokeObjectURL(a.href);
    }

/**
 * 
 * @param {HTMLCanvasElement} canvas 
 */
    draw(canvas) {
        const w = 512;
        const h = 512;
        canvas.width = w;
        canvas.height = h;
        const c = canvas.getContext('2d');
        const img = c.getImageData(0, 0, w, h);
        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                let r = 255;
                let g = 0;
                let b = 0;
                let a = 255;

                let rateh = 10;
                let ft = (x + w * y) * 4;
                let nx = x / (w - 1) * 2 - 1;
                let ny = y / (h - 1) * 2 - 1;
                if (y < h / 4 || y >= 3 * h / 4) {
                    let ang = Math.PI;
                    let hang = Math.PI * 2 * x / w;
                    g = 128;
                    b = Math.sin(hang * rateh) * 64 + 64;
                    r = b;
                    let k = (Math.abs(ny) - 0.5) * 2;
                    r =   0 * k + r * (1 - k);
                    g = 128 * k + g * (1 - k);
                    b =   0 * k + b * (1 - k);
                } else {
                    let ang = Math.PI;
                    let hang = Math.PI * 2 * x / w;
                    g = 128;
                    b = Math.sin(hang * rateh) * 64 + 64;
                    r = b;
                }

                img.data[ft] = r;
                img.data[ft+1] = g;
                img.data[ft+2] = b;
                img.data[ft+3] = a;
            }
        }
        c.putImageData(img, 0, 0);
    }

/**
 * 
 * @param {HTMLCanvasElement} canvas 
 */
    draw1(canvas) {
        const w = 512;
        const h = 512;
        canvas.width = w;
        canvas.height = h;
        const c = canvas.getContext('2d');
        const img = c.getImageData(0, 0, w, h);
        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                let hang = Math.PI * 2 * x / w;
                let rateh = 10;
                let k = Math.sin(hang * rateh);
                let r = 128 * ((k + 1) * 0.25 + 0.5);
                let g = 0;
                let b = 255 * ((k + 1) * 0.25 + 0.5);
                let a = 255;

                let ft = (x + w * y) * 4;
                let nx = x / (w - 1) * 2 - 1;
                let ny = y / (h - 1) * 2 - 1;
                if (y < h / 4 || y >= 3 * h / 4) { // 外側
                    let ang = Math.PI;
                    let hang = Math.PI * 2 * x / w;
                    let k2 = (Math.abs(ny) - 0.5) * 2;
                    r = 128 * k2 + r * (1 - k2);
                    g =   0 * k2 + g * (1 - k2);
                    b = 255 * k2 + b * (1 - k2);
                } else { // 内側
                    let ang = Math.PI;
                }

                img.data[ft] = r;
                img.data[ft+1] = g;
                img.data[ft+2] = b;
                img.data[ft+3] = a;
            }
        }
        c.putImageData(img, 0, 0);
    }

}

const misc = new Misc();
misc.init();


