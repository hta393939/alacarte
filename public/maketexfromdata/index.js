/**
 * @file index.js
 */

class Misc {
    constructor() {
    }

    async initialize() {
        this.setListener();

        console.log('buf', buf);
    }

/**
 * 
 * @param {HTMLCanvasElement} canvas 
 */
    draw(canvas, objs) {
        const w = 512;
        const h = 512;
        canvas.width = w;
        canvas.height = h;
        const c = canvas.getContext('2d');
        for (const obj of objs) {
            c.strokeStyle = null;
            c.fillStyle = 'green';
            c.ellipse(obj.x, obj.y, obj.rx, obj.ry,
                obj.rot, 0, Math.PI * 2);
        }
        return;
    }

    async analyzeText(file) {
        const text = await file.text();
        const lines = text.split('\n');
        const result = {
            objs: []
        };
        for (const line of lines) {
            const vals = line.split(',').map(val => Number.parseFloat(val));
            const obj = {
                a: vals[0],
                b: vals[1],
                c: vals[2],
                d: vals[3],
                e: vals[4],
                f: vals[5],
            };
            result.objs.push(obj);
        }
        console.log('result', result);
        return result;
    }

    setListener() {
        {
            const el = document.querySelector('.drop');
            el?.addEventListener('dragover', ev => {
                ev.stopPropagation();
                ev.preventDefault();
                ev.dataTransfer.dropEffect = 'copy';
            });
            el?.addEventListener('drop', ev => {
                ev.stopPropagation();
                ev.preventDefault();
                //ev.dataTransfer.files[0];
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
                this.speakerid = Number.parseInt(window.speakerid.value);
                //this.say('こんにちなのだ', true);
                this.say(window.text.value, true);
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
        { // リトライ
            const el = document.getElementById('retry');
            el?.addEventListener('click', async () => {
                await this.processDir(this.dirHandle);
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
 * ～znd.txt をパースする
 * @param {string} instr 
 */
    parseZndml(instr) {
        const ret = {
            says: [],
            pathprefix: '',
        };

        const reyomi = /(?<fw>[^\<]*)<(?<display>[^\<\>]*)\|(?<yomi>[^\<\>]*)\>(?<bw>.*)/;

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
                case '@margin':
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
    async processDir(dirHandle) {
        console.log('processDir', dirHandle.name);
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
        {
            const file = await mlfh.getFile();
            const text = await file.text();
            const result = this.parseZndml(text);

            for (const say of result.says) {
                counter += 1;
                const mod = counter & 1;

                let name = '';
                for (let i = 0; i < 10; ++i) {
                    name = `${say.text.substring(0, 6)}_${i}.wav`;
                    if (!_filenames.includes(name)) {
                        break;
                    }
                }
                viewel.textContent = `process... ${name}`;

                try {
                    const waveBinary = await this.say(say.yomi, false);
                    if (!waveBinary) {
                        continue;
                    }

// 秒数を決定する
                    let sec = Math.ceil(waveBinary.len.sec);
                    const secmod = waveBinary.len.sec - Math.floor(waveBinary.len.sec);
                    if (secmod >= 0.9 || secmod == 0.0) {
                        sec += 1;
                    }
                    const len = sec * 30;

                    {
                        const te = new AVIUTL.AUText();
                        te.setText(say.text);
                        te.data.layer = 8 + mod; // 8 or 9
                        te.data.start = timeCounter + 1;
                        te.data.end = te.data.start + len - 1;
                        project.elements.push(te);
                    }

                    const ae = new AVIUTL.AUAudio();
                    ae.data0.file = `${result.pathprefix}${name}`;
                    ae.data.layer = 3 + mod; // 3 or 4
                    ae.data.start = timeCounter + 1;
                    ae.data.end = ae.data.start + len - 1;
                    project.elements.push(ae);
    
                    timeCounter += len;
    

// 書き込む
                    const fileHandle = await dirHandle.getFileHandle(name,
                        { create: true });
                    const writer = await fileHandle.createWritable();
                    await writer.write(waveBinary.arrayBuffer);
                    await writer.close();               
                } catch(ec) {
                    console.warn('catch', ec.message);
                }
            }

            {
                const ge = new AVIUTL.AUGroup();
                ge.data.start = 1;
                ge.data.end = ge.data.start + timeCounter - 1;
                ge.data.layer = 7;
                ge.data0.range = 2;
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



