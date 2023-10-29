/**
 * @file index.js
 */

class Misc {
    static CTYPE = 'application/json;charset=UTF-8';

    constructor() {
        this.speakerid = 3;
        this.base = 'http://127.0.0.1:50021';
    }

    async initialize() {
        this.setListener();

        {
            let s = '';
            s += `${window.innerWidth}`;
            s += `x${window.innerHeight}`;
            const el = window.innerview;
            el.textContent = s;
        }

        this.enumVoice();
    }

    async enumVoice() {
        const res = await fetch(`${this.base}/speakers`);
        const speakers = await res.json();
        console.log('speakers', speakers);
    }

    parseWav(ab) {
/**
 * 
 * @param {DataView} p 
 * @param {number} c 開始オフセット
 * @returns {string}
 */
        const _readfourcc = (p, c) => {
            let s = '';
            for (let i = 0; i < 4; ++i) {
                s += String.fromCodePoint(p.getUint8(c + i));
            }
            return s;
        };

        const p = new DataView(ab);
        const ret = {
            header: {}
        };
        let c = 0;
        ret.header.RIFF = _readfourcc(p, c);
        ret.header.riffbodybyte = p.getUint32(c + 4, true);
        ret.header.WAVE = _readfourcc(p, c + 8);
        ret.header.fmts = _readfourcc(p, c + 12);
        ret.header.fmtbodybyte = p.getUint32(c + 16, true);
        c += 20;
        ret.header.format = p.getUint16(c, true);
        ret.header.channelnum = p.getUint16(c + 2, true);
        ret.header.samplingrate = p.getUint32(c + 4, true);
// 48000 など
        ret.header.bytepersec = p.getUint32(c + 8, true);
// 2 など
        ret.header.bytepertick = p.getUint16(c + 12, true);
// 16 など
        ret.header.bitnum = p.getUint16(c + 14, true);
        c += 16;

        ret.header.data = _readfourcc(p, c);
        ret.header.databodybyte = p.getUint32(c + 4, true);
        c += 8;

        ret.offset = c;

        const byteNum = ret.header.databodybyte;
        ret.len = {
            sec: byteNum / ret.header.bytepersec,
        };

        console.log('ret', ret);
        return ret;
    }

/**
 * 
 * @param {string} text 
 * @returns 
 */
    async say(text) {
        let param = {};
        const sp = new URLSearchParams();
        sp.append('speaker', this.speakerid);
        sp.append('text', text);
        {
            const sendobj = {
                method: 'POST',
            };
            const res = await fetch(`${this.base}/audio_query?${sp.toString()}`, sendobj);
            const json = await res.json();
            param = json;
            console.log('param', param);
        }

        const sendobj = {
            'method': 'POST',
            headers: {
                'Content-Type': Misc.CTYPE,
            },
            body: JSON.stringify(param),
        };
        sp.delete('text');
        const res = await fetch(`${this.base}/synthesis?${sp.toString()}`, sendobj);
        if (!res.ok) {
            const json = await res.json();
            console.log('json', json);
            return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = window.audioelement;
        audio.src = url;

        const ab = await blob.arrayBuffer();
        const result = this.parseWav(ab);
        console.log('result', result);

        audio.play();
    }

    setListener() {
        {
            const el = document.getElementById('enumvoice');
            el?.addEventListener('click', () => {
                this.enumVoice();
            });
        }

        {
            const el = document.getElementById('saytext');
            el?.addEventListener('click', () => {
                this.speakerid = Number.parseInt(window.speakerid.value);
                this.say('こんにちなのだ');
//                this.say(window.text.value);
            });
        }

        {
            const el = document.getElementById('openwindow');
            el?.addEventListener('click', () => {
                this.openWindow();
            });
        }

    }

    openWindow() {
        let width = 640;
        let height = 360;
        let hOffset = -1;
        let url = '../player/index.html';
        let feats = [
            //`popup`,
            `width=${width}`,
            `height=${height + hOffset}`,
        ];
        const win = window.open(url,
            //'_blank',
            'corge',
            feats.join(','));
        this.win = win;
    }

}

const misc = new Misc();
misc.initialize();



