/**
 * @file index.js
 */

const _pad = (v, n = 2) => {
    return String(v).padStart(n, '0');
};

class Misc {
    static CTYPE = 'application/json;charset=UTF-8';

    constructor() {
        this.startLayer = 10;
/**
 * ずんだもんノーマル
 */
        this.speakerid = 3;
/**
 * VOICEVOX ベースアドレス
 */
        this.base = 'http://127.0.0.1:50021';
    }

/**
 * 初期化する
 */
    async initialize() {
        this.setListener();

        this.enumVoice();
// テスト
        const buf = this.strToSJIS('漢字abc');
        console.log('buf', buf);
    }

/**
 * VOICEVOX のスピーカ列挙要求
 */
    async enumVoice() {
        const res = await fetch(`${this.base}/speakers`);
        const speakers = await res.json();
        console.log('speakers', speakers);

        const parent = document.getElementById('speakers');
        const el = document.getElementById('speakertemplate');
        for (const speaker of speakers) {
            const clone = document.importNode(el.content, true);
            //parent.appendChild(clone);
            for (const k of ['name', 'version', 'speaker_uuid']) {
                const q = clone.querySelector(`.${k}`);
                if (!q) {
                    console.log('not found', k, clone);
                    continue;
                }
                q.textContent = speaker[k];
            }
            parent.appendChild(clone);
        }
    }

/**
 * .wav バイナリをパースして情報を得る
 * @param {ArrayBuffer} ab 
 * @returns 
 */
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
 * VOICEVOX へ要求して結果を受け取る
 * @param {string} text 
 * @param {boolean} replay 
 * @returns 
 */
    async say(text, replay) {
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
        if (replay) {
            const url = URL.createObjectURL(blob);
            const audio = window.audioelement;
            audio.src = url;
            try {
                audio.play();
            } catch(e) {
                console.warn('play', e.message);
            }
        }

        const ab = await blob.arrayBuffer();
        const result = this.parseWav(ab);
        console.log('result', result);
        result.arrayBuffer = ab;

        return result;
    }

    setListener() {
        {
            const el = document.getElementById('enumvoice');
            el?.addEventListener('click', () => {
                this.enumVoice();
            });
        }
        {
            const el = document.getElementById('startlayer');
            const _apply = () => {
                const viewel = document.getElementById('startlayerview');
                viewel.textContent = `${el.value}`;

                this.startLayer = Number.parseInt(el.value);
            };
            el?.addEventListener('input', () => {
                _apply();
            });
            _apply();
        }

        {
            const el = document.getElementById('saytext');
            el?.addEventListener('click', () => {
                this.speakerid = Number.parseInt(window.speakerid.value);
                //this.say('こんにちなのだ', true);
                this.say(window.text.value, true);
            });
        }

        { // ワーキングディレクトリで指定するタイプ。うまくいく。
            const el = document.getElementById('opendir');
            el?.addEventListener('click', async () => {
                const dirHandle = await this.openDir();
                this.dirHandle = dirHandle;
                try {
                    await this.processDir(dirHandle, this.startLayer);
                } catch(e) {
                    console.warn('processDir catch', e);
                } finally {
                    const retryel = document.getElementById('retry');
                    retryel.removeAttribute('disabled');
                }
            });
        }
        { // リトライ
            const el = document.getElementById('retry');
            el?.addEventListener('click', async () => {
                await this.processDir(this.dirHandle, this.startLayer);
            });
        }

    }

/**
 * ～znd.txt をパースする
 * @param {string} instr 
 */
    parseZndml(instr) {
        const ret = {
            says: [],
            pathprefix: '',
            postpadding: 0,
        };
/**
 * 本家にあわせて {|}
 */
        const reyomi = /(?<fw>[^\{]*)<(?<display>[^\{\}]*)\|(?<yomi>[^\{\}]*)\>(?<bw>.*)/;

        const lines = instr.split('\n');
        let obj = null;
        for (let line of lines) {
            line = line.trimEnd();
            if (line.length === 0) {
                continue; // 空行は無視する
            }
/**
 * 先頭の1文字
 */
            const top = line.substring(0, 1);
            if (top === '#') {
                continue; // コメントであり無視する
            }

            if (top === '@') {
                const ss = line.split(',');
                switch(ss[0]) {
                case '@version':
                    {
                        const version = Number.parseInt(ss[1]);
                        if (version >= 20000) {
                            console.warn('非対応の未来のバージョンです');
                        }
                        console.log('version', version);
                    }
                    break;
                case '@pathprefix':
                    ret.pathprefix = ss[1];
                    break;
                case '@speaker':
                    break;
                case '@postpadding':
                    {
                        const sec = Number.parseFloat(ss[1]);
                        ret.postpadding = sec;
                    }
                    break;
                default:
                    console.warn('unknown command');
                    break;
                }
                continue;
            }

            if (top == ' ') {
// 継続なので obj は消さずに残す
                obj.text += '\r\n';
                line = line.trim();
                obj.keep = line;
            } else {
                if (obj) {
                    ret.says.push(obj);
                }
                obj = null;
            }

            if (!obj) {
                obj = {
                    text: '',
                    yomi: '',
                    keep: line,
                };
            }

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
        }

        if (obj) {
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
 * @param {FileSystemDirectoryHandle} dirHandle ディレクトリハンドル指定
 * @returns {}
 */
    async processDir(dirHandle, startLayer) {
        console.log('processDir', dirHandle.name, startLayer);
        const useVox = document.getElementById('idusevox')?.checked;
/**
 * znd.txt を探す
 * @type {FileSystemFileHandle}
 */
        let mlfh = null;
        const _filenames = [];
        let basename = 'znd';
        for await (let [name, handle] of dirHandle) {
            if (handle.kind === 'file') {
                console.log('file', name);
                _filenames.push(name);

                const fileHandle = await dirHandle.getFileHandle(name);
                console.log('fileHandle', fileHandle);

                if (name.endsWith('znd.txt')) {
                    mlfh = handle;
                    console.log('found', name);
                    const re = /(?<basename>.+)\.txt$/;
                    const m = re.exec(name);
                    if (m) {
                        basename = m.groups['basename'];
                    }
                }
            } else { // 'directory' Media
                console.log('not file', name, handle.kind);
            }
        }

        if (!mlfh) {
            console.warn('not found ～znd.txt');
            return;
        }

/**
 * @type {HTMLElement}
 */
        const viewel = document.getElementById('processingview');

/**
 * 1シーン分
 */
        const project = new AVIUTL.Project();
        let counter = 0;
        let timeCounter = 0;
        const _fps = 30;
        {
            const file = await mlfh.getFile();
            const text = await file.text();
            const result = this.parseZndml(text);
/**
 * 全体グループパディングフレーム数
 */
            const postPaddingFrame = Math.floor(result.postpadding * _fps);

            for (const say of result.says) {
                counter += 1;
                const mod = counter & 1;

                let name = '';
                let filehead = (`${say.text}`).replace(/[\r\n\s\t"]/g, '');
                for (let i = 0; i < 10; ++i) {
                    name = `${filehead.substring(0, 6)}_${_pad(counter, 3)}_${i}.wav`;
                    if (!_filenames.includes(name)) {
                        break;
                    }
                }
                viewel.textContent = `process... ${name}`;

                let waveBinary = null;
                if (useVox) {
                    try {
                        waveBinary = await this.say(say.yomi, false);
                    } catch(ec) {
                        console.warn('catch', ec.message, 'name', name);
                    }
                }

                { // 秒数を決定する
                    let rawsec = waveBinary ? waveBinary.len.sec : 7.5;
                    let sec = Math.ceil(rawsec);
                    const secmod = rawsec - Math.floor(rawsec);
                    if (secmod >= 0.9 || secmod == 0.0) {
                        sec += 1;
                    }
                    const len = sec * _fps;

                    {
                        const te = new AVIUTL.AUText();
                        te.setText(say.text);
                        te.data.layer = startLayer + 5 + mod; // +5, +6
                        te.data.start = timeCounter + 1;
                        te.data.end = te.data.start + len - 1;
                        project.elements.push(te);
                    }

                    if (useVox) {
                        const ae = new AVIUTL.AUAudio();
                        ae.data0.file = `${result.pathprefix}${name}`;
                        ae.data.layer = startLayer + 2 + mod; // +2, +3
                        ae.data.start = timeCounter + 1;
                        ae.data.end = ae.data.start + len - 1;
                        project.elements.push(ae);
                    }
    
                    timeCounter += len;

                    if (useVox) { // 書き込む
                        const fileHandle = await dirHandle.getFileHandle(name,
                            { create: true });
                        const writer = await fileHandle.createWritable();
                        await writer.write(waveBinary.arrayBuffer);
                        await writer.close();
                    }               
                }
            }

            { // グループ制御
                const ge = new AVIUTL.AUGroup();
                ge.data.start = 1;
/**
 * end に指定する値
 */
                let wholeEnd = ge.data.start + timeCounter - 1;
                wholeEnd += postPaddingFrame;

                ge.data.end = wholeEnd;
                ge.data.layer = startLayer;
                ge.data0.range = 6;
                ge.data0.Y = 240;
                project.elements.push(ge);
            }

            { // グループ制御
                const ge = new AVIUTL.AUGroup();
                ge.data.start = 1;
/**
 * end に指定する値
 */
                let wholeEnd = ge.data.start + timeCounter - 1;
                wholeEnd += postPaddingFrame;

                ge.data.end = wholeEnd;
                ge.data.layer = startLayer + 8;
                ge.data0.range = 4;
                ge.data0.Y = 50;
                project.elements.push(ge);
            }

// .exo ファイルを書き込む
            const fileHandle = await dirHandle.getFileHandle(`${basename}.exo`,
                { create: true });
            const writer = await fileHandle.createWritable();
            {
                for (let i = 0; i < project.elements.length; ++i) {
                    const el = project.elements[i];
                    el._index = i;
                }

                const ss = project.getLines();
                await writer.write(this.strToSJIS(ss.join('\r\n')));
                await writer.close();
            }
            
        }

        viewel.textContent = `processDir 終わり ${new Date().toLocaleTimeString()}`;
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

}

const misc = new Misc();
misc.initialize();



