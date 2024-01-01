/**
 * @file index.js
 */

class Misc {
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

    r8s(num) {
        const buf = new Uint8Array(num);
        for (let i = 0; i < num; ++i) {
            buf[i] = this.p.getUint8(this.c);
            this.c += 1;
        }
        return buf;
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
            header: {},
            names: [],
            bones: [],
            morphs: [],
            infos: [],
        };
        { // header
            this.poslog('header');
            this.r8s(30);
            ret.header.version = this.rfs(1)[0];
            ret.header.reserved0_1 = this.r8s(1)[0];
            ret.header.nameJa = this.rs();
            ret.header.nameEn = this.rs();
            ret.header.fps = this.rfs(1)[0];
            ret.header.reserved1 = this.r8s(14);
            ret.header.num = this.r32s(1)[0];
            ret.header.reserved2 = this.r32s(1);
            console.log('header', ret.header);
        }
        { // names
            this.poslog('names');
            const num = ret.header.num;
            for (let i = 0; i < num; ++i) {
                const index = this.r32s(1)[0];
                const name = this.rs();
                ret.names.push({
                    index, name,
                });
            }
            console.log('names', ret.names);
        } // ok----

        {
            this.poslog('unknown');
            const obj = {
                keys: []
            };
            ret.unknown = obj;

            obj.reserved0 = this.r8s(2);
            obj.reserved1 = this.r32s(1)[0];

            obj.header = this.r32s(5);
            const num = obj.header[1];
            for (let i = 0; i < num; ++i) {
                const val = {
                    f2s: []
                };
                val.reserved0 = this.rfs(3);
                val.reserved1 = this.r32s(1)[0];
                val.reserved2 = this.rfs(2);
                val.reserved3 = this.r32s(1)[0];
                val.num = this.r32s(1)[0];
                for (let j = 0; j < val.num; ++j) {
                    val.f2s.push(this.rfs(2));
                }
                obj.keys.push(val);
                // 64バイト(0x40) 0x44 は 68バイト
            }
            console.log('unknown', ret.unknown);
        }

        { // bone
            //this.c = 0xd6;
            this.poslog('bones');
            const obj = {
                keys: []
            };
            ret.bones = obj;

            obj.reserved0 = this.r8s(2);
            obj.reserved1 = this.r32s(1)[0];

            obj.header = this.r32s(5);
            const num = obj.header[1];
            //const num = 0;
            for (let i = 0; i < num; ++i) {
                const val = {};

                val.frame = this.r32s(1)[0];
                val.reserved0 = this.r32s(1)[0];
                val.position = this.rfs(3);
                val.quaternion = this.rfs(4);
                val.r = this.r8s(4); // 0-127
                val.x = this.r8s(4);
                val.y = this.r8s(4);
                val.z = this.r8s(4);

                val.reserved1 = this.r8s(8);
// 60バイト

                obj.keys.push(val);
            }
            console.log('bones', ret.bones);
        }
        if (false) { // morph
            this.poslog('morphs');
            const obj = {
                keys: []
            };
            ret.morphs = obj;
            obj.reserved0 = this.r8s(2);
            obj.reserved1 = this.r32s(1)[0];

            obj.header = this.r32s(5);
            const num = obj.header[1];
            //const num = 0;
            for (let i = 0; i < num; ++i) {
                const val = {};

                obj.keys.push(val);
            }
            console.log('morphs', ret.morphs);
        }
        { // info
//            this.c = 0x222;
            this.poslog('infos');
            const obj = {
                keys: []
            };
            ret.infos = obj;

            obj.reserved0 = this.r8s(2);
            obj.reserved1 = this.r32s(1)[0];

            obj.header = this.r32s(5);
            const num = obj.header[1];
            for (let i = 0; i < num; ++i) {
                const val = {};
                val.frame = this.r32s(1)[0];
                val.reserved0 = this.r32s(1)[0];
                val.flags = this.r8s(8);
                val.edgeWidth = this.rfs(1)[0];
                val.argb = this.r8s(4);
                val.scale = this.rfs(1)[0];
                val.reserved1 = this.r32s(3);

                obj.keys.push(val);
            }
            console.log('infos', ret.infos);
        }
        {
            const buf = this.r8s(2);
            console.log('last2', buf[0]);
        }
        console.log('end', this.c, this.p.byteLength, ret);
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

        {
            const el = document.getElementById('enumvoice');
            el?.addEventListener('click', () => {
                this.enumVoice();
            });
        }

        {
            const el = document.getElementById('saytext');
            el?.addEventListener('click', () => {
                this.say(window.text.value);
            });
        }

        {
            const el = document.getElementById('openwindow');
            el?.addEventListener('click', () => {
                this.openWindow();
            });
        }
    }

}

const misc = new Misc();
misc.initialize();



