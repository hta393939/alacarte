/**
 * @file index.js
 */

class Misc {
    static TAG_CLIP = 0x0128;
    static TAG_BONE = 0x0310;
    static TAG_MORPH = 0x0120;
    static TAG_INFO = 0x0340;
    static TAG_END = 0x00ff;

    static BOLD = 'font-weight:bold;';

    constructor() {
        this.c = 0;
/**
 * @type {DataView}
 */
        this.p = null;
    }

    async initialize() {
        this.setListener();
    }

    poslog(...args) {
        console.log(`0x${this.c.toString(16)}`, this.c, ...args);
    }

    rs() {
        this.poslog('rs');
        const len = this.p.getUint32(this.c, true);
        this.c += 4;

        const buf = new Uint8Array(len);
        for (let i = 0; i < len; ++i) {
            buf[i] = this.p.getUint8(this.c + i);
        }
        let s = new TextDecoder().decode(buf);
        this.c += len;
        return s;
    }

    rfs(num) {
        const buf = new Float32Array(num);
        for (let i = 0; i < num; ++i) {
            buf[i] = this.p.getFloat32(this.c, true);
            this.c += 4;
        }
        return buf;
    }

    r32s(num) {
        const buf = new Int32Array(num);
        for (let i = 0; i < num; ++i) {
            buf[i] = this.p.getInt32(this.c, true);
            this.c += 4;
        }
        return buf;
    }

    r16s(num) {
        const buf = new Uint16Array(num);
        for (let i = 0; i < num; ++i) {
            buf[i] = this.p.getUint16(this.c, true);
            this.c += 2;
        }
        return buf;        
    }

    r8s(num) {
        const buf = new Uint8Array(num);
        for (let i = 0; i < num; ++i) {
            buf[i] = this.p.getUint8(this.c);
            this.c += 1;
        }
        return buf;
    }

    parseClip() {
        this.poslog('clip');
        const obj = {
            keys: []
        };
        obj.index = this.r32s(1)[0]; // 0
        obj.bytefactor = this.r32s(1)[0];
        obj.keynum = this.r32s(1)[0];
        obj.additivebyte = this.r32s(1)[0];
        obj.additivedata = this.r8s(obj.additivebyte);

        //obj.header = this.r32s(3); // 68, 1, 8, -1, 0

        const num = obj.keynum;
        console.log('%cclip', `${Misc.BOLD}color:${obj.bytefactor === 68 ? 'green' : 'red'}`);
        for (let i = 0; i < num; ++i) {
            const val = {
                f2s: []
            };
            val.reserved0 = this.rfs(3); // 0, 0, -1
            val.reserved1 = this.r32s(1)[0]; // 1
            val.reserved2 = this.rfs(2); // 1, 1
            val.reserved3 = this.r32s(1)[0]; // 1
            val.num = this.r32s(1)[0];
            for (let j = 0; j < val.num; ++j) {
                val.f2s.push(this.rfs(2));
            }
            obj.keys.push(val);
            // 64バイト(0x40) 0x44 は 68バイト
        }
        console.log('clip', obj);
        return obj;
    }
    parseBone() {
        { // bone
            this.poslog('bone');
            const obj = {
                keys: []
            };

            obj.index = this.r32s(1)[0];
            obj.bytefactor = this.r32s(1)[0];
            obj.keynum = this.r32s(1)[0];
            obj.additivebyte = this.r32s(1)[0];
            obj.additivedata = this.r8s(obj.additivebyte);

            const num = obj.keynum;
            console.log('%cbone', `${Misc.BOLD}color:${obj.bytefactor === 60 ? 'green' : 'red'}`);

            for (let i = 0; i < num; ++i) {
                const val = {};

                val.reserved0 = this.r32s(1)[0];

                val.frame = this.r32s(1)[0]; // 0 IV 0
                val.reserved1 = this.r32s(1)[0]; // 0 IV 0
                val.position = this.rfs(3);
                val.quaternion = this.rfs(4);
                val.r = this.r8s(4); // 0-127
                val.x = this.r8s(4);
                val.y = this.r8s(4);
                val.z = this.r8s(4);
                {
                    console.log('%cr', `${Misc.BOLD}color:${val.r[3] === 0x6b ? 'green' : 'red'}`);
                }

                val.reserved1 = this.r8s(4);
// 60バイト(4x15)

                obj.keys.push(val);
            }
            console.log('bone', obj);
            return obj;
        }
    }
    parseMorph() {
        { // morph
            this.poslog('morph');
            const obj = {
                keys: []
            };
            obj.index = this.r32s(1)[0];

            obj.bytefactor = this.r32s(1)[0];
            obj.keynum = this.r32s(1)[0];
            obj.additivebyte = this.r32s(1)[0];
            obj.additivedata = this.r8s(obj.additivebyte);

            const num = obj.keynum;
            console.log('%cmorph', `${Misc.BOLD}color:${obj.bytefactor === 16 ? 'green' : 'red'}`);
            for (let i = 0; i < num; ++i) {
                const val = {};
                val.frame = this.r32s(1)[0];
                val.reserved = this.rfs(1)[0];
                val.weight = this.rfs(1)[0];
                val.curve = this.r8s(4);
                // 16バイト
                obj.keys.push(val);
            }
            console.log('morph', obj);
            return obj;
        }
    }
    parseInfo() {
        { // info
//            this.c = 0x222;
            this.poslog('info');
            const obj = {
                keys: []
            };

            obj.index = this.r32s(1)[0];

            obj.bytefactor = this.r32s(1)[0];
            obj.keynum = this.r32s(1)[0];

            obj.additivebyte = this.r32s(1)[0];
            obj.additivedata = this.r8s(obj.additivebyte);

            // 36, 3, 8, 0, 1 
            // IK4つ分 40, 1, 24, 「4個, (4, 5, 6, 7) 1」
            const num = obj.keynum;
            console.log('%cinfo', `${Misc.BOLD}`,
                obj.bytefactor);

            for (let i = 0; i < num; ++i) {
                const val = {};
                val.frame = this.r32s(1)[0];
                val.reserved0 = this.r32s(1)[0];
                val.flags = this.r8s(8);
                val.edgeWidth = this.rfs(1)[0];
                val.argb = this.r8s(4);
                {
                    console.log('%cargb', `${Misc.BOLD}color:${val.argb[0] === 0xff ? 'green' : 'red'}`)
                }
                val.scale = this.rfs(1)[0];
                val.reserved1 = this.r32s(3);
                if (obj.bytefactor === 40) {
                    val.reserved2 = this.r32s(1)[0];
                }

                obj.keys.push(val);
            }
            console.log('info', obj);
            return obj;
        }
    }

/**
 * 
 * @param {File} file 
 */
    async parseVector(file) {
        const ab = await file.arrayBuffer();
        const p = new DataView(ab);
        this.c = 0;
        this.p = p;
        const ret = {
            header: {
                names: []
            },
            clips: [],
            bones: [],
            morphs: [],
            infos: [],
        };
        { // header
            this.poslog('header');
            this.r8s(30);
            ret.header.version = this.rfs(1)[0];
            ret.header.reserved0_1 = this.r8s(1)[0]; // 1
            ret.header.nameJa = this.rs();
            ret.header.nameEn = this.rs();
            ret.header.fps = this.rfs(1)[0];
            ret.header.reserved1 = this.r8s(14); // all 0
            ret.header.num = this.r32s(1)[0];
            ret.header.reserved2 = this.r32s(1); // 0

            this.poslog('names');
            const num = ret.header.num;
            for (let i = 0; i < num; ++i) {
                const index = this.r32s(1)[0];
                const name = this.rs();
                ret.header.names.push({
                    index, name,
                });
            }
            console.log('names', ret.header.names);
            console.log('header', ret.header);
        }

        while(this.c + 2 <= this.p.byteLength) {
            this.poslog('tag start');
            const tag = this.r16s(1)[0];
            if (tag === Misc.TAG_END) {
                console.log('end tag found');
                break;
            }
            switch(tag) {
            case Misc.TAG_CLIP:
                {
                    const clip = this.parseClip();
                    ret.clips.push(clip);
                }
                break;

            case Misc.TAG_BONE:
                {
                    const bone = this.parseBone();
                    ret.bones.push(bone);
                }
                break;

            case Misc.TAG_MORPH:
                {
                    const morph = this.parseMorph();
                    ret.morphs.push(morph);
                }
                break;
            case Misc.TAG_INFO:
                {
                    const info = this.parseInfo();
                    ret.infos.push(info);
                }
                break;

            default:
                console.warn('unknown tag', tag.toString(16));
                break;
            }
        }

        console.log('terminate', this.c, this.p.byteLength, ret);
        return ret;
    }

    setListener() {
        {
            const el = window;
            el.addEventListener('dragover', ev => {
                ev.preventDefault();
                ev.stopPropagation();
                ev.dataTransfer.dropEffect = 'copy';
            });
            el.addEventListener('drop', ev => {
                ev.preventDefault();
                ev.stopPropagation();
                ev.dataTransfer.dropEffect = 'copy';
                this.parseVector(ev.dataTransfer.files[0]);
            });
        }

    }

}

const misc = new Misc();
misc.initialize();



