/**
 * @file index.js
 */

class Misc {
    static CTYPE = 'application/json;charset=UTF-8';

    constructor() {
        this.speakerid = 3;
/**
 * VOICEVOX ベースアドレス
 */
        this.base = 'http://127.0.0.1:50021';
    }

    async initialize() {
        this.setListener();

        this.enumVoice();

        const buf = this.strToSJIS('漢字abc');
        console.log('buf', buf);
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
        { // ワーキングディレクトリで指定するタイプ。うまくいく。
            const el = document.getElementById('opendir');
            el?.addEventListener('click', async () => {
                const dirHandle = await this.openDir();
                this.dirHandle = dirHandle;
                await this.processDir(dirHandle);
            });
        }
        { // ファイルを指定してそのフォルダを使いたいが
            // フォルダピッカーの初期値にすら指定できなさそう
            const el = document.getElementById('openfile');
            el?.addEventListener('click', async () => {
                const fileHandle = await this.openFile();
                this.fileHandle = fileHandle;
                await this.processFile(fileHandle);
            });
        }

        { // File からはさすがに FileSystemFileHandle にはいかなそう...
            // 見かけた気がしないでもないのだが..
            window.addEventListener('dragover', ev => {
                ev.preventDefault();
                ev.stopPropagation();
                ev.dataTransfer.dropEffect = 'none';
            });
            const el = document.querySelector('.drop');
            el?.addEventListener('dragover', ev => {
                ev.preventDefault();
                ev.stopPropagation();
                ev.dataTransfer.dropEffect = 'copy';
            });
            el?.addEventListener('drop', ev => {
                ev.preventDefault();
                ev.stopPropagation();
                ev.dataTransfer.dropEffect = 'copy';
                this.openText(ev.dataTransfer.files[0]);
            });
        }

    }

/**
 * 未実装
 * @param {File} file 
 */
    async openText(file) {
        console.log('openText called');
        const text = await file.text();

        console.log('openText');
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
 * ～znd.txt をパースする
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

    async openFile() {
        const fileopt = {
            mode: 'readwrite',
        };
        const fileHandle = await window.showOpenFilePicker(fileopt);
        console.log('openFile', fileHandle);
        return fileHandle;
    }

/**
 * 
 * @param {FileSystemFileHandle} fileHandle 
 */
    async processFile(fileHandle) {
        console.log('processFile called');
        
        const diropt = {
            mode: 'readwrite',
            startIn: fileHandle, // unknown 言われた;;
        };
        const dirHandle = await window.showDirectoryPicker(diropt);
        console.log('show', dirHandle);

        console.log('processFile 終わり');
    }

/**
 * ディレクトリに対して処理を実施する
 * @param {FileSystemDirectoryHandle} dirHandle 
 * @returns {}
 */
    async processDir(dirHandle) {
        console.log('processDir', dirHandle.name);
/**
 * znd.txt を探す
 * @type {FileSystemFileHandle}
 */
        let mlfh = null;
        for await (let [name, handle] of dirHandle) {
            if (handle.kind === 'file') {
                console.log('file', name);

                const fileHandle = await dirHandle.getFileHandle(name);
                console.log('fileHandle', fileHandle);

                if (name.endsWith === 'znd.txt') {
                    mlfh = handle;
                    console.log('found', name);
                }
            } else { // 'directory' Media
                console.log('not file', name, handle.kind);
            }
        }

        if (!mlfh) {
            console.warn('not found ～znd.txt');
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
                const project = new AVIUTL.Project();
                {
                    
                }

                const ss = project.getLines();
                await writer.write(ss.join('\r\n'));
                await writer.close();
            }
            
        }

        console.log('processDir 終わり');
    }

/**
 * 文字列から Shift_JIS のバイナリ配列を返す
 * @param {string} instr 
 * @returns {number[]} バイナリ(0-255)のための配列
 */
    strToSJIS(instr) {
        const unicodeArray = Encoding.stringToCode(instr);
        const sjisArray = Encoding.convert(unicodeArray,
            { to: 'SJIS', from: 'UNICODE' });
// ArrayBuffer のコンストラクタに指定してもダメ
        const buf = new Uint8Array(sjisArray);
        return buf;
    }

/**
 * UTF-16 little endian をテキスト化
 * @param {string} instr 
 * @returns {string} 4096 文字(0-9a-f)
 */
    make4096(instr) {
        const _pad = (v, n = 2) => String(v).padStart(n, '0');
        const cs = Array.from(instr);
        let ss = [];
        for (let i = 0; i < cs.length; ++i) {
            const code = cs[i].charCodeAt(0);
            ss.push(_pad((code & 0xff).toString(16)));
            ss.push(_pad((code >> 8).toString(16)));
        }
        return _pad(ss.join(''), 4096);
    }

}

const misc = new Misc();
misc.initialize();



