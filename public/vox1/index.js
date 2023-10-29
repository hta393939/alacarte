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
            return null;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = window.audioelement;
        audio.src = url;

        const ab = await blob.arrayBuffer();
        const result = this.parseWav(ab);
        console.log('result', result);

        audio.play();

        return ab;
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
        {
            const el = document.getElementById('opendir');
            el?.addEventListener('click', async () => {
                const dirHandle = await this.openDir();
                this.dirHandle = dirHandle;
                await this.processDir(dirHandle);
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

/**
 * zndml.txt をパースする
 * @param {string} instr 
 */
    parseZndml(instr) {
        const ret = {
            says: []
        };

        const reyomi = /(?<fw>[^\<]*)<(?<display>[^\<\>]*)\|(?<yomi>[^\<\>]*)\>(?<bw>.*)/;

        const lines = instr.split('\n');
        for (let line of lines) {
            line = line.trim();
            if (line.length === 0) {
                continue; // 空行は無視する
            }

            const top = line.substring(0, 1);
            if (top === '#') {
                continue; // コメントであり無視する
            }
            if (top === '@') {
                const ss = lines.split(',');
                switch(ss[0]) {
                case '@speaker':
                    break;
                case '@margin':
                    break;
                default:
                    console.warn('unknown command');
                    break;
                }
                continue;
            }

            const obj = {
                text: '',
                yomi: '',
                keep: line,
            };

            while(true) {
                const m = reyomi.exec(obj.keep);
                if (!m) {
                    obj.text += obj.keep;
                    obj.yomi += obj.keep;
                    break;
                }
                obj.text += m.groups['fw'] + m.groups['display'];
                obj.yomi += m.groups['fw'] + m.groups['yomi'];
                obj.keep = m.groups['bw'];
            }

            ret.says.push(obj);
        }
        return ret;
    }

/**
 * readwrite でディレクトリを指定する
 * @returns {FileSystemDirectoryHandle}
 */
    async openDir() {
        const diropt = {
            mode: 'readwrite'
        };
        const dirHandle = await window.showDirectoryPicker(diropt);
        console.log('openDir', dirHandle);
        return dirHandle;
    }

/**
 * ディレクトリに対して処理を実施する
 * @param {FileSystemDirectoryHandle} dirHandle 
 * @returns {}
 */
    async processDir(dirHandle) {
        console.log('processDir', dirHandle.name);
/**
 * zndml.txt を探す
 * @type {FileSystemFileHandle}
 */
        let mlfh = null;
        for await (let [name, handle] of dirHandle) {
            if (handle.kind === 'file') {
                console.log('file', name);

                const fileHandle = await dirHandle.getFileHandle(name);
                console.log('fileHandle', fileHandle);

                if (name === 'zndml.txt') {
                    mlfh = handle;
                    console.log('found', name);
                }
            } else { // 'directory' Media
                console.log('not file', name, handle.kind);
            }
        }

        if (!mlfh) {
            return;
        }

        {
            const file = await mlfh.getFile();
            const text = await file.text();
            const result = this.parseZndml(text);

            for (const say of result.says) {
                const ab = await this.say(say.yomi);
                if (!ab) {
                    continue;
                }
                let name = `${Date.now()}.wav`;
// 書き込む
                const fileHandle = await dirHandle.getFileHandle(name, { create: true });
                const writer = await fileHandle.createWritable();
                await writer.write(ab);
                await writer.close();               
            }

// 書き込む
            const fileHandle = await dirHandle.getFileHandle('a.txt', { create: true });
            const writer = await fileHandle.createWritable();
            {
                const ss = [
                    '[0]',
                    '[1]',
                ];
                await writer.write(ss.join('\r\n'));
                await writer.close();
            }
            
        }

        console.log('processDir 終わり');
    }

}

const misc = new Misc();
misc.initialize();



