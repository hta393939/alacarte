/**
 * @file index.js
 */

const _pad = (v, n = 2) => {
    return String(v).padStart(n, '0');
};

class Misc {
    static XMLDOC = '<?xml version="1.0" encoding="UTF-8"?>';

    constructor() {
        this.startLayer = 10;
/**
 * ファイルネーム
 */
        this.filename = 'content.opf';
/**
 * VOICEVOX ベースアドレス
 */
        this.base = 'http://127.0.0.1:50021';

/**
 * 拡張子と mime
 */
        this.mimeMap = {
            'xhtml': 'application/xhtml+xml',
            'ncx': 'text/xml',
            'css': 'text/css',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'mp4': 'video/mp4',
        };
    }

/**
 * 初期化する
 */
    async initialize() {
        this.setListener();
        const s = this.makeList();
        console.log('content.opf', s);
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

    getMime(name) {
        let mime = 'application/octet-stream';
        const re = /\.(?<extwo>[^.]+)$/;
        const m = re.exec(name);
        if (m) {
            const extwo = m.groups['extwo'];
            if (extwo in this.mimeMap) {
                mime = this.mimeMap[extwo];
            }
        }
        return mime;
    }

    makeList() {
        const div = document.createElement('div');
        {
            div.innerHTML = `
<package version="2.0" xmlns="http://www.idpf.org/2007/opf"
unique-identifier="BookId">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/"
xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:creator opf:role="aut">no name</dc:creator>
    <dc:language>ja</dc:language>
    <dc:rights>Public Domain</dc:rights>
    </metadata>
    <manifest>
    </manifest>
    <spine toc="ncx">
    </spine>
</package>
`;
        }
        //for (const s of ss) {

        //}

        const obj = {
            metadata: {
                'dc:title': 'title',
                'dc:date': new Date().toLocaleDateString(),
                'dc:identifier': `urn:uuid:example.com.${new MediaStream().id}`,
            }
        };
        { // metadata
            const metadata = div.querySelector('metadata');
            for (const key in obj.metadata) {
                const val = obj.metadata[key];
                const el = document.createElement(key);
                el.textContent = val;
                if (key === 'dc:identifier') {
                    el.setAttribute('id', 'BookId');
                }
                metadata.appendChild(el);
            }
        }

        { // item
            const manifest = div.querySelector('manifest');
            {
                const name = 'a.xhtml';
                const item = document.createElement('item');
                item.setAttribute('id', name);
                item.setAttribute('href', name);
                item.setAttribute('media-type', this.getMime(name));
                manifest.appendChild(item);
            }
        }
        { // spine
            const spine = div.querySelector('spine');
            {
                const itemref = document.createElement('itemref');
                itemref.setAttribute('idref', 'top page');
                spine.appendChild(itemref);
            }
        }
        return Misc.XMLDOC + div.innerHTML;
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
                for (let i = 0; i < 10; ++i) {
                    name = `${say.text.substring(0, 6)}_${_pad(counter, 3)}_${i}.wav`;
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
                    const len = sec * _fps;

                    {
                        const te = new AVIUTL.AUText();
                        te.setText(say.text);
                        te.data.layer = startLayer + 5 + mod; // +5, +6
                        te.data.start = timeCounter + 1;
                        te.data.end = te.data.start + len - 1;
                        project.elements.push(te);
                    }

                    const ae = new AVIUTL.AUAudio();
                    ae.data0.file = `${result.pathprefix}${name}`;
                    ae.data.layer = startLayer + 2 + mod; // +2, +3
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

}

const misc = new Misc();
misc.initialize();



