
import {BinParser} from '../../lib/colmap/colmapbin.js';

class Misc {
  constructor() {
    this.consoles = [];
    /** カーソル */
    this.c = 0;
  }

  pad(v, n = 2) {
    return new String(v).padStart(n, '0');
  }

  /**
   * .bin の文字列を取得してカーソルを進める。
   * null 止め。
   * @param {DataView} p 
   */
  rbinstr(p) {
    const buf = new Uint8Array(256);
    let len = 0;
    for (let i = 0; i < 256; ++i) {
      const val = p.getUint8(this.c);
      this.c += 1;
      if (val === 0) {
        len = i;
        break;
      }
      buf[i] = val;
    }
    const text = new TextDecoder().decode(buf.slice(0, len));
    return text;
  }

  async initialize() {
    this.setListener();

    this.update();

    this.initBabylon();
  }

  async log(...args) {
    const d = new Date();
    const text = `${d.toLocaleTimeString()}.${new String(d.getMilliseconds()).padStart(3, '0')},` + args.join(',');
    this.consoles.unshift(text);
    const el = document.getElementById('console');
    if (!el) {
      return;
    }
    const br = document.createElement('br');
    el.insertBefore(br, el.firstChild);
    const node = document.createTextNode(text);
    el.insertBefore(node, el.firstChild);
  }

  makeFilename(num) {
    return `${this.prefix}${this.pad(num, this.num)}.${this.ext}`;
  }

  update() {
    window.requestAnimationFrame(() => {
      this.update();
    });


  }


  setListener() {
    {
      const el = document.body;
      el?.addEventListener('dragover', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'none';
      });
      el?.addEventListener('drop', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'none';
      });
    }
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
        //this.onDrop(ev.dataTransfer.files[0]);

        this.parseFile(ev.dataTransfer.files[0]);
      });
    }

    for (const k of ['startcount', 'addcount', 'outcount']) {
      const el = document.getElementById(k);
      if (!el) {
        continue;
      }
      const _update = () => {
        const val = Number.parseFloat(el.value);
        const viewel = document.getElementById(`${k}view`);
        if (viewel) {
          viewel.textContent = `${val}`;
        }
      };
      el?.addEventListener('input', _update);
      _update();
    }

  }

  gatherParam() {
    const param = {};
    for (const k of ['toply']) {
      const el = document.getElementById(`${k}`);
      if (!el) {
        continue;
      }
      param[k] = el?.checked || false;
    }
    return param;
  }

  /**
   * 
   * @param {File} file 
   */
  onDrop(file) {
    const re = /(?<fw>.+)\.(?<ext>[^\.]+)$/;
    const m = re.exec(file.name);
    if (!m) {
      this.onBin(file);
      return;
    }
    const obj = {
      fw: m.groups['fw'],
      ext: m.groups['ext'],
    };
    switch (obj.ext) {
      case 'bin':
        this.onBin(file, obj);
        break;
    }
  }

  /**
   * 
   * @param {Blob} blob 
   * @param {string} name 
   */
  download(blob, name) {
    const el = document.createElement('a');
    el.href = URL.createObjectURL(blob);
    el.download = name;
    el.click();
  }

  /**
   * 
   * @param {File} file 
   * @param {*} obj 
   */
  async onBin(file, obj) {
    let result = {};
    const param = this.gatherParam();
    switch (obj.fw) {
      case 'cameras':
        result = await this.onCameras(file);
        break;
      case 'images':
        result = await this.onImages(file);
        break;
      case 'points3D':
        {
          result = await this.onPoints3D(file);
          if (param.toply) {
            const blobs = await this.makePly(result);
            this.download(new Blob(blobs), `poscol.ply`);
          }
        }
        break;
    }
    console.log('onBin', result);
  }

  /**
   * 
   * @param {File} file 
   */
  async onCameras(file) {
    const ab = await file.arrayBuffer();
    const p = new DataView(ab);
    const ret = {cams: []};
    this.c = 0;
    ret.num = this.read64(p);
    for (let i = 0; i < ret.num; ++i) {
      const cam = {};
      ret.cams.push(cam);
    }
    return ret;
  }

  /**
   * 未実装
   * @param {File} file 
   */
  async onImages(file) {
    const ab = await file.arrayBuffer();
    const p = new DataView(ab);
    const ret = {images: []};
    this.c = 0;
    ret.num = this.read64(p);
    for (let i = 0; i < ret.num; ++i) {
      const image = {f2ds: []};
      image.id = this.reads32(p, 1)[0];
      image.wxyz = this.readd(p, 4);
      image.t = this.readd(p, 3);
      image.cameraid = this.reads32(p, 1)[0];
      image.name = this.rbinstr(p);
      image.num = this.read64(p);
      for (let j = 0; j < image.num; ++j) {
        const f2d = {};
        f2d.pos = this.readd(p, 2); // x, y
        f2d.id = this.read64(p);
        //image.f2ds.push(f2d);
      }

      ret.images.push(image);
    }
    console.log('onImages', ret, this.c, ab.byteLength);
    return ret;
  }

  /**
   * 
   * @param {File} file 
   */
  async onPoints3D(file) {
    const ab = await file.arrayBuffer();
    const p = new DataView(ab);
    const ret = {points: []};
    this.c = 0;
    ret.num = this.read64(p);
    for (let i = 0; i < ret.num; ++i) {
      const pt = {tracks: []};
      pt.id = this.read64(p);
      pt.pos = this.readd(p, 3); // x,y,z
      pt.col = this.readu8(p, 3); // r,g,b
      pt.error = this.readd(p, 1)[0]; // error
      pt.trackNum = this.read64(p); // track[]
      for (let j = 0; j < pt.trackNum; ++j) {
        const track = {};
        track.id = this.reads32(p, 1)[0];
        track.index = this.reads32(p, 1)[0];
        // pt.tracks.push(track);
      }
      ret.points.push(pt);
    }
    console.log('onPoints3D', this.c, ab.byteLength);
    return ret;
  }

  /**
   * 
   */
  async makePly(param) {
    const bufs = [];
    {
      const lines = [
        `ply`,
        `format binary_little_endian 1.0`,
        `element vertex ${param.points.length}`,
        `property float x`,
        `property float y`,
        `property float z`,
        `property uchar red`,
        `property uchar green`,
        `property uchar blue`,
        `end_header`,
        '',
      ];
      bufs.push(lines.join('\n'));
    }
    // バイナリ部
    const pbuf = new ArrayBuffer(param.num * 15);
    const p = new DataView(pbuf);
    let offset = 0;
    for (let i = 0; i < param.num; ++i) {
      const pt = param.points[i];
      p.setFloat32(offset, pt.pos[0], true);
      p.setFloat32(offset+4, pt.pos[1], true);
      p.setFloat32(offset+8, pt.pos[2], true);
      offset += 12;
      p.setUint8(offset, pt.col[0]);
      p.setUint8(offset+1, pt.col[1]);
      p.setUint8(offset+2, pt.col[2]);
      offset += 3;
    }
    bufs.push(pbuf);
    return bufs;
  }

  /**
   * 
   * @param {DataView} p 
   * @param {number} n 
   */
  readu8(p, n) {
    const ret = new Uint8Array(n);
    for (let i = 0; i < n; ++i) {
      ret[i] = p.getUint8(this.c);
      this.c += 1;
    }
    return ret;
  }

  /**
   * 
   * @param {DataView} p 
   * @param {number} n 
   */
  reads32(p, n) {
    const ret = new Int32Array(n);
    for (let i = 0; i < n; ++i) {
      ret[i] = p.getInt32(this.c, true);
      this.c += 4;
    }
    return ret;
  }

  /**
   * 
   * @param {DataView} p 
   * @param {number} n 
   * @returns 
   */
  readd(p, n) {
    const ret = new Float64Array(n);
    for (let i = 0; i < n; ++i) {
      ret[i] = p.getFloat64(this.c, true);
      this.c += 8;
    }
    return ret;
  }

  /**
   * 
   * @param {DataView} p 
   * @param {number} n 
   * @returns 
   */
  readf(p, n) {
    const ret = new Float32Array(n);
    for (let i = 0; i < n; ++i) {
      ret[i] = p.getFloat32(this.c, true);
      this.c += 4;
    }
    return ret;
  }

  /**
   * 32bitのみ採用する。一応 -1(s64) は読む
   * @param {DataView} p 
   */
  read64(p) {
    let val = p.getUint32(this.c, true);
    this.c += 4;
    let h = p.getUint32(this.c, true);
    this.c += 4;
    if (h === 0xffffffff) {
      val -= (2 ** 32);
    }
    return val;
  }

  /**
   * 前後判定
   * @param {BinParser} parser 
   */
  async frontback(images) {
    const re = /^(?<fw>.+)_(?<bw>[^_]+)\.(?<ext>[^.]+)$/;

    const en = {};
    const user = {};

    for (const image of images) {
      const m = re.exec(image.name);
      if (m) {
        const {fw, bw, ext} = m.groups;
        image.tb = BABYLON.Vector3.FromArray(image.t);
        image.rb = BABYLON.Quaternion.FromArray([
          image.wtop[1], image.wtop[2], image.wtop[3], image.wtop[0]]);

        image.qb = image.rb.invert();
        image.pb = image.tb.scale(-1).applyRotationQuaternion(image.qb);

        console.log('', fw, bw, ext, image);
        if (bw === 'environment') {
          en[fw] = image;
        }
        if (bw === 'user') {
          user[fw] = image;
        }
      }
    }

    const _pyramid = (scene, m) => {
      const lines = [];
      const d = 0.4;
      const h2 = d * 0.5;
      const pairs = [
        [[0, 0, 0], [-d, h2, -d]],
        [[0, 0, 0], [ d, h2, -d]],
        [[0, 0, 0], [ d,-h2, -d]],
        [[0, 0, 0], [-d,-h2, -d]],
      ];
      for (const pair of pairs) {
        lines.push([
          BABYLON.Vector3.FromArray(pair[0]),
          BABYLON.Vector3.FromArray(pair[1]),
        ]);
      }
      const ls = BABYLON.MeshBuilder.CreateLineSystem(
        `${Date.now()}`,
        {lines, updatable: false},
        scene,
      );
      ls.parent = m;
    };

    const _comp = (a, b) => {
      const ret = {
        anegb: a.qb.multiply(b.qb.invert()),
        distance: BABYLON.Vector3.Distance(a.pb, b.pb),
      };
      return ret;
    };

    for (const k in en) {
      const userOne = user[k];
      if (!userOne) {
        continue;
      }
      const enOne = en[k];

      userOne.col = new BABYLON.Color3(1, 0, 0);
      enOne.col = new BABYLON.Color3(0, 1, 0);

      const result = _comp(enOne, userOne);
      console.log('comp', result);

      const scene = this.scene;
      for (const one of [enOne, userOne]) {
        const m = BABYLON.MeshBuilder.CreateBox(`${Date.now()}`,
          {width: 0.1, height: 0.1, depth: 0.1},
          scene);
        m.position = one.pb;
        m.rotationQuaternion = one.qb;
        const mtl = new BABYLON.StandardMaterial(`${Date.now()}`, scene);
        mtl.diffuseColor = one.col;
        m.material = mtl;

        _pyramid(scene, m);
      }

      {
        const lines = [
          [enOne.pb, userOne.pb],
        ];
        const ls = BABYLON.MeshBuilder.CreateLineSystem(
          `${Date.now()}`,
          {lines, updatable: false},
          scene,
        );
        ls.color = new BABYLON.Color3(0.2, 0.2, 1);
      }
    }

  }

  /**
   * 
   * @param {File} file 
   */
  async parseFile(file) {
    const parser = new BinParser();
    const ab = await file.arrayBuffer();
    let result = null;
    switch (file.name) {
    case BinParser.CAM_NAME:
      result = parser.parseCamera(ab);
      break;
    case BinParser.IMG_NAME:
      {
        result = parser.parseImage(ab);
        const el = document.getElementById('imagemode');
        switch (el?.value) {
        case 'normal':
          break;
        case 'frontback':
          await this.frontback(result.images);
          break;
        }
      }
      break;
    case BinParser.PT_NAME:
      result = parser.parsePoint(ab);
      break;
    }
    console.log('parse', file.name, result);
    this.log('parse', file.name, result);
  }

  initBabylon() {
    const canvas = document.getElementById('maincanvas');
    canvas.width = 384;
    canvas.height = 384;
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    this.scene = scene;
    {
      const camera = new BABYLON.ArcRotateCamera(
        'maincamera',
        0, 0, 10,
        new BABYLON.Vector3(0, 0, 0),
        scene,
      );
      camera.position = new BABYLON.Vector3(1, 0, -10)
      //camera.lookAt(new BABYLON.Vector3(0, 0, 0));
      camera.attachControl();
    }
    {
      const light = new BABYLON.HemisphericLight('mainlight',
        new BABYLON.Vector3(0.6, 0.8, 1),
      );
    }
    {
      const axes = new BABYLON.Debug.AxesViewer(scene, 5);
    }

    window.addEventListener('resize', () => {
      engine.resize();
    });

    engine.runRenderLoop(() => {
      scene.render();
    });
  }

}

const misc = new Misc();
misc.initialize();
