/**
 * @file index.js
 */

class Misc {
    constructor() {
        this.c = 0;
        this.p = new DataView();
    }

    async initialize() {
        this.setListener();

        const dpr = window.devicePixelRatio;
        {
            let s = '';
            s += `${window.innerWidth}`;
            s += `x${window.innerHeight}`;
            const el = window.innerview;
            el.textContent = s;
        }

        {
            const canvas = document.getElementById('main');
            canvas.width = 640 * dpr;
            canvas.height = 360 * dpr;
            const c = canvas.getContext('2d');
            let fam = 'BIZ UDPゴシック';
            c.font = `normal 32px ${fam}`;
            c.fillStyle = '#000000';
            let s = `五王国`;
            c.fillText(s, 64, 64);
        }
    }

    poslog() {
        console.log(`0x${this.c.toString(16)}`, this.c);
    }

    rs() {
        const len = this.p.getUint32(this.c, true);
        this.c += 4;
        const buf = this.p.slice(this.c, this.c + len);
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
            buf[i] = this.p.getUint(this.c);
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
            this.poslog();

        }
        { // names
            this.poslog();
            const buf = this.r32s(1);
            const num = buf[0];
            for (let i = 0; i < num; ++i) {
                const index = this.r32s(1)[0];
                const name = this.rs();
                ret.names.push({
                    index, name,
                });
            }
        }
        { // bone
            this.poslog();
            const buf = this.r32s(1);
            const num = buf[0];
            for (let i = 0; i < num; ++i) {
                const obj = {};
                ret.bones.push(obj);
            }
        }
        { // morph
            this.poslog();
            const buf = this.r32s(1);
            const num = buf[0];
            for (let i = 0; i < num; ++i) {
                const obj = {};
                ret.morphs.push(obj);
            }
        }
        { // info
            this.poslog();
            const buf = this.r32s(4);
            const num = buf[0];
            for (let i = 0; i < num; ++i) {
                const obj = {};
                obj.argb = this.r8s(4);

                ret.infos.push(obj);
            }
        }
        {
            const buf = this.r8s(2);
            console.log(buf[0], buf[1]);
        }
        console.log('end', this.c, this.p.byteLength);
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



