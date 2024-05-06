/**
 * @file index.js
 */
// [ ] sony reader のタイトルはどこを参照しているのだろう
// title と title22
// あと最上位ディレクトリハンドルにネームがあるかどうか
// あったら，タイトルに挿入する??

const _pad = (v, n = 2) => {
  return String(v).padStart(n, '0');
};

class Misc {
  static XMLDOC = '<?xml version="1.0" encoding="UTF-8"?>';

  constructor() {
/**
 * ファイルネーム
 */
    this.filename = 'content.opf';

    this.onepagename = 'chapter01.xhtml';

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
    console.log('initialize end');
  }

  setListener() {
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

    { // ワーキングディレクトリで指定するタイプ。うまくいく。
      const el = document.getElementById('opendir');
      el?.addEventListener('click', async () => {
        const dirHandle = await this.openDir();
        this.dirHandle = dirHandle;
        try {
          await this.processDir(dirHandle);
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
        await this.processDir(this.dirHandle);
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

  makeOnePage(names, prefix) {
    const fw = `
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
  <meta char="UTF-8"></meta>
  <title></title>
  <link href="default.css" type="text/css" rel="stylesheet"></link>
</head>
<body>
`;
    const bw = `
</body>
</html>
`;

    const lines = [];
    for (const name of names) {
      let line = `<img src="${prefix}${name}" class="fullwidth tbmargin"></img>`;
      lines.push(line);
    }
    return `${Misc.XMLDOC}${fw}${lines.join('\n')}${bw}`;
  }

/**
 * content.opf を生成する
 * @param {string[]} names ファイル部分
 * @param {string} prefix '' や 'res/' など
 * @param {string} title タイトル
 * @returns 
 */
  makeList(names, prefix, title) {
    const div = document.createElement('div');
    {
      div.innerHTML = `
<package version="2.0" xmlns="http://www.idpf.org/2007/opf"
unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/"
xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:creator opf:role="aut">no name</dc:creator>
    <dc:language>ja</dc:language>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="text/xml"></item>
    <item id="style" href="default.css" media-type="text/css"></item>
    <item id="title_page" href="title_page.xhtml" media-type="application/xhtml+xml"></item>
    <item id="chapter01" href="chapter01.xhtml" media-type="application/xhtml+xml"></item>
    <item id="end_page" href="end_page.xhtml" media-type="application/xhtml+xml"></item>
  </manifest>
  <spine toc="ncx">
    <itemref idref="title_page"></itemref>
    <itemref idref="chapter01"></itemref>
    <itemref idref="end_page"></itemref>
  </spine>
</package>
`;
    }

    const obj = {
      metadata: {
        'dc:title': title,
        'dc:date': new Date().toLocaleDateString(),
        'dc:identifier': `urn:uuid:${new MediaStream().id}`,
      },
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
      for (const name of names) {
        const item = document.createElement('item');
        item.setAttribute('id', name);
        item.setAttribute('href', `${prefix}${name}`);
        item.setAttribute('media-type', this.getMime(name));
        manifest.appendChild(item);
      }
    }
    /* { // spine
      const spine = div.querySelector('spine');
      {
        const itemref = document.createElement('itemref');
        itemref.setAttribute('idref', 'top page');
        spine.appendChild(itemref);
      }
    } */

    return Misc.XMLDOC + div.innerHTML;
  }

  download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
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
 * 指定ディレクトリの中からディレクトリを見つける
 * @param {FileHandle} dirHandle 
 * @param {RegExp} re  
 */
  async getDir(dirHandle, re) {
    const ret = {
      handle: null,
      name: ''
    };
    for await (let [name, handle] of dirHandle) {
      if (handle.kind === 'file') {
        console.log('file', name);
        continue;
      } else { // 'directory'
        console.log('not file', name, handle.kind);
        const m = re.exec(name);
        if (m) {
          ret.handle = handle;
          ret.name = name;
          break;
        }
      }
    }
    return ret;
  }

/**
 * OEBPS ディレクトリに対して処理を実施する
 * @param {FileSystemDirectoryHandle} dirHandle ディレクトリハンドル指定
 */
  async processDir(dirHandle) {
    console.log('processDir', dirHandle.name);
/**
 * @type {HTMLElement}
 */
    const viewel = document.getElementById('processingview');

    const oebps = await this.getDir(dirHandle,
      /^OEBPS$/);
    if (!oebps.handle) {
      viewel.textContent = 'not found OEBPS';
      return;
    }
    const res = await this.getDir(oebps.handle,
      /^res|resources?$/);
    if (!res.handle) {
      viewel.textContent = 'not found res';
      return;
    }

    const _subfh = res.handle;
/**
 * メディアファイル用
 */
    const _prefix = `${res.name}/`;

    const _filenames = [];
    for await (let [name, handle] of _subfh) {
      if (handle.kind === 'file') {
        console.log('file', name);
        _filenames.push(name);
      } else { // 'directory' Media
        console.log('not file', name, handle.kind);
      }
    }

    {
      const text = this.makeList(_filenames, _prefix, dirHandle.name);
      await this.writeTextFile(text, oebps.handle, this.filename);
    }
    {
      const text = this.makeOnePage(_filenames, _prefix);
      await this.writeTextFile(text, oebps.handle, this.onepagename);
    }
    viewel.textContent = `${dirHandle.name}, processDir 終わり ${new Date().toLocaleTimeString()}`;
    console.log(dirHandle.name, 'processDir 終わり');
  }

/**
 * テキストファイルをディレクトリハンドルの中に書き出す
 * @param {string} text 
 * @param {FileHandle} dirHandle 
 * @param {string} filename 
 */
  async writeTextFile(text, dirHandle, filename) {
    const fileHandle = await dirHandle.getFileHandle(filename,
    { create: true });
    const writer = await fileHandle.createWritable();
    await writer.write(text);
    await writer.close();
  }

/**
 * ディレクトリに対して処理を実施する
 * @param {FileSystemDirectoryHandle} dirHandle ディレクトリハンドル指定
 * @returns {}
 */
  async processDir_keep(dirHandle, startLayer) {
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

