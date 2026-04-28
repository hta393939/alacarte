import {
  GpbAttribute, GpbTable,
  GpbExport, GpbMesh, GpbNode, GpbPart,
  GpbVertex,
  GpbAnimation, GpbAnimChannel,
  GpbMaterialFile, GpbMaterial,
} from "../../lib/hsp/gpb.js";

import * as THREE from "three";

import {OrbitControls} from "three/addon/controls/OrbitControls.js";
import {GLTFLoader} from "three/addon/loaders/GLTFLoader.js";
import {OBJLoader} from "three/addon/loaders/OBJLoader.js";
import {MTLLoader} from "three/addon/loaders/MTLLoader.js";

class Misc {
  constructor() {
    this.STORAGE = '';

    this.filename = null;

    this.param = {
      scale: 11,
      cellx: 0,
      celly: 0,
      cellw: 1,
      cellh: 1,
      x: 0,
      y: 0,
      w: 512,
      h: 512,
      destsize: 512,
    };

    /** @type {FileSystemDirectoryHandle} */
    this.dirHandle = null;
  }

  async initialize() {
    this.loadSetting();
    this.setListener();

    //this.replace();

    this.initThree();
  }

  getCommonParam() {
    const param = {};
    for (const k of ['forcenormal']) { // checkbox
      const el = document.getElementById(k);
      param[k] = el?.checked ? true : false;
    }
    {

    }
    return param;
  }

  loadSetting() {
    const param = this.param;
    try {
      const obj = JSON.parse(localStorage.getItem(this.STORAGE));
      for (const key in obj) {
        param[key] = obj[key];
      }
    } catch (e) {
      console.warn('loadSetting', e.message);
    }
    console.log('loadSetting', param);
    return param;
  }

  saveSetting() {
    return;

    const param = this.param;
    try {
      for (const key in param) {
        const el = document.getElementById(key);
        if (!el) {
          continue;
        }
        if (Number.isFinite(param[key])) {
          param[key] = Number.parseFloat(el.value);
        } else {
          param[key] = el.value;
        }
      }
    } catch (e) {
      console.warn('saveSetting', e.message);
    }
    localStorage.setItem(this.STORAGE, JSON.stringify(param));
    return param;
  }

  setListener() {
    const handler = (eff) => {
      return (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = eff;
      };
    };

    { // 無効化
      const el = document;
      el?.addEventListener('dragover', handler('none'));
    }

    { // ドロップ
      const el = document.getElementById('loadimage');
      el.addEventListener('dragover', handler('copy'));
      el.addEventListener('drop', async ev => {
        handler('copy')(ev);

        const canvas = document.getElementById('maincanvas');
        await this.loadFileToCanvas(ev.dataTransfer.files[0], canvas);
      });
    }

    { // ドロップ
      const el = document.getElementById('fromglb');
      el.addEventListener('dragover', handler('copy'));
      el.addEventListener('drop', async ev => {
        handler('copy')(ev);

        let firstFile = null;
        let mtlFile = null;
        const files = ev.dataTransfer.files;
        if (files.length >= 2) {
          console.log('obj sets');
          firstFile = files[0];
          mtlFile = files[1];
          if (!mtlFile.name.endsWith('.mtl')) {
            firstFile = files[1];
            mtlFile = files[0];
          }
        } else {
          firstFile = files[0];
        }

        this.loadGlb(firstFile, mtlFile);
      });
    }

    // パラメータ群
    for (const k in this.param) {
      const el = document.getElementById(`${k}`);
      const viewel = document.getElementById(`${k}view`);
      const _update = () => {
        this[k] = Number.parseFloat(el.value);
        viewel.textContent = this[k];

        //this.drawFrame();
        //this.renewGuide();
      };
      el?.addEventListener('input', () => {
        _update();
      });
      _update();
    }

    {
      const el = document.getElementById('act');
      el?.addEventListener('click', () => {
        this.act();
      });
    }

    {
      const el = document.getElementById('selectdir');
      el?.addEventListener('click', () => {
        this.selectDir();
      });
    }

    {
      const el = document.getElementById('processfordir');
      el?.addEventListener('click', () => {
        this.processForDir();
      });
    }

  }

  initThree() {
    const opt = {
      canvas: window.maincanvas,
      preserveDrawingBuffer: true,
    };
    const renderer = new THREE.WebGLRenderer(opt);
    this.renderer = renderer;
    const scene = new THREE.Scene();
    this.scene = scene;
    scene.background = new THREE.Color(0x999999);
    const camera = new THREE.PerspectiveCamera();
    this.camera = camera;
    {
      camera.position.set(1, 1, 10);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
    {
      const light = new THREE.AmbientLight(0xffffff);
      scene.add(light);
    }
    {
      const axes = new THREE.AxesHelper(10);
      scene.add(axes);
    }

    const control = new OrbitControls(camera, opt.canvas);
    this.control = control;

    {
      const m = this.makeCurve();
      scene.add(m);
    }

    this.update();
    console.log('initThree');
  }

  update() {
    requestAnimationFrame(() => {
      this.update();
    });

    this.control?.update();
    this.renderer?.render(this.scene, this.camera);
  }

  /**
   * 
   * @param {File} blob
   * @param {ArrayBuffer} ab 
   */
  async loadGlb(blob, mtlFile) {
    const url = URL.createObjectURL(blob);

    let loader = null;
    if (blob.name.endsWith('.glb')) {
      loader = new GLTFLoader();

      loader.load(url, (result) => {
        console.log('gltf', result);
        const model = result.scene || result;
        this.scene.add(model);

        const exporter = this.toGpb(model);
        console.log('exporter', exporter);
        if (window.downloadgpb?.checked) {
          this.downloadGpb(exporter);
        }
      },
        xhr => {
          console.log('xhr', xhr);
        },
        err => {
          console.log('loader err', err);
        }
      );
      console.log('loadGlb');
      return;

    }

    const mtlLoader = new MTLLoader();
    const mtlurl = URL.createObjectURL(mtlFile);
    mtlLoader.load(mtlurl, mtls => {
      mtls.preload();

      loader = new OBJLoader();
      loader.setMaterials(mtls);
      loader.load(url, (result) => {
          console.log('obj', result);
          this.scene.add(result);

          const exporter = this.toGpb(result);
          console.log('exporter', exporter);
          if (window.downloadgpb?.checked) {
            this.downloadGpb(exporter);
          }
        },
        xhr => {
          console.log('xhr', xhr);
        },
        err => {
          console.log('loader err', err);
        });
    });
    console.log('load obj');
  }

  /**
   * 
   * @param {GpbExport} exporter 
   */
  downloadGpb(exporter) {
    console.log('downloadGpb');
    {
      const buf = exporter.make(false);
      this.download(new Blob([buf]), `foo.gpb`);
    }
    {
      const text = exporter._materialFile.toString();
      this.download(new Blob([text]), `foo.material`);
    }
  }

  /**
   * @param {THREE.Mesh} obj
   */
  toGpb(obj) {
    const param = this.getCommonParam();

    const gpb = new GpbExport();

    let m = obj;
    while (m?.isMesh !== true) {
      if (m.children.length === 0) {
        break;
      }
      m = m.children[0];
    }

    {
      const geo = m.geometry;
      const mtl = m.material;
      //mtl.wireframe = true;
      m.name = 'target';
      console.log('toGpb, geo, mtl', geo, mtl, m);

      // 材質作る
      // ジオメトリ作って面張る
      const attrs = geo.attributes;
      /** 頂点の個数 */
      const vn = attrs.position.array.length / 3;
      /** 面頂点の配列 */
      let fis = geo.index?.array;
      if (!fis) {
        fis = new Uint16Array(vn * 3);
        for (let i = 0; i < fis.length; ++i) {
          fis[i] = i;
        }
      }

      // normal 無かったら計算する
      if (param.forcenormal || !('normal' in attrs)) {
        geo.computeVertexNormals(); // flat でないタイプ
      }
      // joint, weight は無かったら 0, 1.0 で。
      if (!('skinIndex' in attrs)) {
        const ba = new THREE.BufferAttribute(new Float32Array(vn * 4), 4);
        geo.setAttribute('skinIndex', ba);
      }
      if (!('skinWeight' in attrs)) {
        const ba = new THREE.BufferAttribute(new Float32Array(vn * 4), 4);
        for (let i = 0; i < vn; ++i) {
          ba.array[i * 4] = 1.0;
        }
        geo.setAttribute('skinWeight', ba);
      }

      //// Gpbへの読み替え
      const modelName = 'mesh0';
      const materialName = 'material0';

      const mtlFile = new GpbMaterialFile();
      mtlFile.addStandards();
      {
        const gpbmtl = new GpbMaterial();
        gpbmtl.superClass = GpbMaterial.NAME_TEXTURED;
        gpbmtl.name = materialName;
        mtlFile.materials.push(gpbmtl);
      }

      { // メッシュの読み替え
        const gpbmesh = new GpbMesh();
        gpbmesh.readyAttrs(true);

        const gpbpart = new GpbPart();
        gpbpart.indices = fis;
        gpbpart.indexFormat = GpbPart.INDEX16;
        gpbmesh.parts.push(gpbpart);

        const glbp = attrs['position'].array;
        const glbn = attrs['normal'].array;
        const glbuv = attrs['uv'].array;
        for (let i = 0; i < vn; ++i) {
          const i3 = i * 3;
          const vt = new GpbVertex();
          vt.p = glbp.slice(i3, i3 + 3);
          vt.n = glbn.slice(i3, i3 + 3);
          vt.uv = [glbuv[i * 2], glbuv[i * 2 + 1]];
          vt.weights = [1, 0, 0, 0];
          vt.joints = [0, 0, 0, 0];
          gpbmesh.vts.push(vt);
        }
        gpbmesh.compute();

        gpb.meshes.push(gpbmesh);

        
        { // 位置
          const t = new GpbTable();
          t.name = modelName;
          t.type = GpbTable.TYPE_MESH;
          gpb.tables.push(t);
        }

      }
      { // シーン
        { // 位置
          const t = new GpbTable();
          t.name = '__SCENE__';
          t.type = GpbTable.TYPE_SCENE;
          gpb.tables.push(t);
        }
      }
      { // メッシュノード
        const node = new GpbNode();
        node.parentName = '__SCENE__';
        node._name = 'node0';
        node.modelName = `#${modelName}`;
        node.materials.push(materialName);
        gpb.scene.children.push(node);

        { // 位置
          const t = new GpbTable();
          t.name = node._name;
          t.type = GpbTable.TYPE_NODE;
          gpb.tables.push(t);
        }       
      }

      gpb._materialFile = mtlFile;
    }

    return gpb;
  }

  /**
   * この形のままでは使用しない
   */
  async selectDir() {
    const opt = {
      mode: 'readwrite',
      //id, startIn,
    };
    /** @type {FileSystemDirectoryHandle} */
    const dh = await window.showDirectoryPicker(opt);
    this.dirHandle = dh;
    const el = document.getElementById('dirview');
    if (el) {
      el.textContent = `dir, ${dh.name}`;
    }

    if (false) { // 1枚だけ表示する
      const inputdh = await dh.getDirectoryHandle('input');
      const re = /^(?<body>.+)(?<ext>\.[^.]+)$/;
      for await (const [k, h] of inputdh) {
        if (h.kind !== 'file') {
          continue;
        }
        const m = re.exec(h.name);
        if (!m) {
          continue;
        }

        const ext = m.groups['ext'];
        console.log('one', ext, m.groups['body']);

        if (ext !== '.png') {
          continue;
        }

        const file = await h.getFile();
        await this.parseImage(file);
        this.act();
        break;
      }
    }

  }

  /**
   * 使用していない
   */
  async processForDir() {
    console.log('processForDir called');
    const dh = this.dirHandle;
    const inputdh = await dh.getDirectoryHandle('input');
    const outputdh = await dh.getDirectoryHandle('output');

    let count = 0;
    const re = /^(?<body>.+)(?<ext>\.[^.]+)$/;
    for await (const [k, h] of inputdh) {
      console.log(k, h); // 短い名前とハンドル
      if (h.kind !== 'file') {
        continue;
      }

      const m = re.exec(h.name);
      if (!m) {
        continue;
      }
      const ext = m.groups['ext'];
      if (ext !== '.png') {
        continue;
      }

      /**
       * @type {File}
       */
      const file = await h.getFile();

      let dstbuf = null;
      {
        const result = await this.parseImage(file);

        this.act();
        // 変換処理後のバイナリ
        const subcanvas = document.getElementById('subcanvas');
        const dstblob = await this.canvasToBlob(subcanvas);
        dstbuf = await dstblob.arrayBuffer();
      }

      const opt = {
        create: true,
      };
      const outname = `${m.groups['body']}_po.png`;
      const fh = await outputdh.getFileHandle(outname, opt);

      const wr = await fh.createWritable({
        keepExistingData: false, // false は空にする
      });
      await wr.write(dstbuf);
      await wr.close();

      await window?.scheduler?.yield();

      count += 1;
    }

    {
      const el = document.getElementById('countview');
      if (el) {
        el.textContent = `${count}, ${new Date().toLocaleTimeString()}`;
      }
    }

    console.log('processForDir');
  }

  /**
   * 
   * @param {Blob} blob 
   * @param {string} name 
   */
  download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    //URL.revokeObjectURL(a.href);
  }

  /**
   * gpbの素を作成する
   */
  createGpb1() {
    console.log('createGpb1 start');

    const gpb = new GpbExport();

    const attrSet = [
      {type: GpbAttribute.TYPE_POSITION, num: 3},
      {type: GpbAttribute.TYPE_NORMAL, num: 3},
      {type: GpbAttribute.TYPE_TEXCOORD0, num: 2},
      {type: GpbAttribute.TYPE_WEIGHTS, num: 4},
      {type: GpbAttribute.TYPE_JOINTS, num: 4},
    ].map(v => {
      const attr = new GpbAttribute();
      attr.type = v.type;
      attr.num = v.num;
      return attr;
    });

    { // メッシュ 頂点と面
      const m = new GpbMesh();
      m.attrs = [...attrSet];
      const part = new GpbPart();

      m.parts.push(part);
      part.indexFormat = GpbPart.INDEX16;

      {
        for (let i = 0; i < 2; ++i) {
          for (let j = 0; j < 2; ++j) {
            const vt = new GpbVertex();
            vt.p = [
              (j * 2 - 1) * 2, (1 - i * 2) * 2,
              (((i & 1) + (j & 1)) & 1) * 0.5];
            vt.uv = [j / 1, 1 - i / 1];
            m.vts.push(vt);
          }
        }

        for (let i = 0; i < 1; ++i) {
          part.indices.push(0, 2, 1, 1, 2, 3);
          //part.indices.push(0, 1, 2, 2, 1, 3);
        }
      }

      m.compute();
      gpb.meshes.push(m);

      {
        const t = new GpbTable();
        t.name = 'mesh1';
        t.type = GpbTable.TYPE_MESH;
        gpb.tables.push(t);
      }
    }

    { // 頂点と面
      const m = new GpbMesh();
      m.attrs = [...attrSet];
      const part = new GpbPart();
      m.parts.push(part);
      part.indexFormat = GpbPart.INDEX16;

      {
        for (let i = 0; i <= 8; ++i) {
          for (let j = 0; j <= 16; ++j) {
            const vt = new GpbVertex();

            const hang = (j % 16) * 2 * Math.PI / 16;
            const vang = (i % 16) * 2 * Math.PI / 16;
            const rr = Math.sin(vang);

            vt.p = [
              - Math.sin(hang) * rr,
              Math.cos(vang),
              - Math.cos(hang) * rr];
            vt.n = [...vt.p];
            vt.uv = [j / 16, 1 - i / 16];
            m.vts.push(vt);
          }
        }

        for (let i = 0; i < 8; ++i) {
          for (let j = 0; j < 16; ++j) {
            let v0 = (16 + 1) * i + j;
            let v1 = v0 + 1;
            let v2 = v0 + 16 + 1;
            let v3 = v2 + 1;
            part.indices.push(v0, v2, v1);
            part.indices.push(v1, v2, v3);
          }
        }
      }

      m.compute();
      gpb.meshes.push(m);

      {
        const t = new GpbTable();
        t.name = 'mesh2';
        t.type = GpbTable.TYPE_MESH;
        gpb.tables.push(t);
      }
    }

    { // シーン
      const t = new GpbTable();
      t.name = '__SCENE__';
      t.type = GpbTable.TYPE_SCENE;
      gpb.tables.push(t);
    }


    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

    const materialNames = [
      'colored',
      'material1',
      'material2',
    ];
    const jointNames = ['joint0', 'joint1'];

    // ノード(ジョイント)
    const jn0 = new GpbNode();
    jn0._name = jointNames[0];
    jn0.nodeType = GpbNode.TYPE_JOINT;
    {
      const t = new GpbTable();
      t.name = jn0._name;
      t.type = GpbTable.TYPE_NODE;
      gpb.tables.push(t);
    }
    gpb.scene.children.push(jn0);

    // ノード(ジョイント)
    const jn1 = new GpbNode();
    jn1._name = jointNames[1];
    jn0.nodeType = GpbNode.TYPE_JOINT;
    {
      const t = new GpbTable();
      t.name = jn1._name;
      t.type = GpbTable.TYPE_NODE;
      gpb.tables.push(t);
    }
    jn1.parentName = jointNames[0];
    jn0.children.push(jn1);

    // ノード
    const n0 = new GpbNode();
    n0._name = 'node0';
    {
      const t = new GpbTable();
      t.name = n0._name;
      t.type = GpbTable.TYPE_NODE;
      gpb.tables.push(t);      
    }
    gpb.scene.children.push(n0);

    // ノード
    const n1 = new GpbNode();
    n1._name = 'node1';
    { // メッシュ名
      n1.modelName = `#mesh1`;
      n1.isSkin = 1;
      n1.jointNames.push(...jointNames.map(n => `#${n}`));
      n1.inverseMatrices.push([...identity], [...identity]);

      n1.materials.push(materialNames[1]);
    }
    {
      const t = new GpbTable();
      t.name = n1._name;
      t.type = GpbTable.TYPE_NODE;
      gpb.tables.push(t);
    }
    n0.children.push(n1);
    n1.parentName = n0._name;
    
    // ノード
    const n2 = new GpbNode();
    n2._name = 'node2';
    {
      // メッシュ名
      n2.modelName = `#mesh2`;
      n2.isSkin = 1;
      n2.jointNames.push(...jointNames.map(n => `#${n}`));
      n2.inverseMatrices.push([...identity], [...identity]);

      n2.materials.push(materialNames[2]);
    }
    {
      const t = new GpbTable();
      t.name = n2._name;
      t.type = GpbTable.TYPE_NODE;
      gpb.tables.push(t);
    }
    n0.children.push(n2);
    n2.parentName = n0._name;

    if (false) {
      const t = new GpbTable();
      t.name = '__Animations__';
      t.type = GpbTable.TYPE_ANIMATIONS;
      gpb.tables.push(t);
    }
    
    { // アニメーション 空でいいのか?
      const anim = new GpbAnimation();
      //gpb.animations.push(anim);

      for (let i = 0; i < 2; ++i) {
        const ch = new GpbAnimChannel();
        ch.keys = [0, 30000, 60000];
        ch.values = [0, 0, 0, 1, 0.0, 0,  1];
        ch.values = [0, 0, 0, 1, 0.5, 1,  0];
        ch.values = [0, 0, 0, 1, 1.0, 0, -1];
        anim.channels.push(ch);
      }
    }

    console.log('gpb', gpb);
    return gpb;
  }

  /**
   * gpbの素を作成する
   */
  createGpb2() {
    console.log('createGpb2 start');

    const gpb = new GpbExport();

    const attrSet = [
      {type: GpbAttribute.TYPE_POSITION, num: 3},
      {type: GpbAttribute.TYPE_NORMAL, num: 3},
      {type: GpbAttribute.TYPE_TEXCOORD0, num: 2},
      {type: GpbAttribute.TYPE_WEIGHTS, num: 4},
      {type: GpbAttribute.TYPE_JOINTS, num: 4},
    ].map(v => {
      const attr = new GpbAttribute();
      attr.type = v.type;
      attr.num = v.num;
      return attr;
    });

    { // 頂点と面
      const m = new GpbMesh();
      m.attrs = [...attrSet];
      const part = new GpbPart();
      m.parts.push(part);
      part.indexFormat = GpbPart.INDEX16;

      {
        for (let i = 0; i <= 8; ++i) {
          for (let j = 0; j <= 16; ++j) {
            const vt = new GpbVertex();

            const hang = (j % 16) * 2 * Math.PI / 16;
            const vang = (i % 16) * 2 * Math.PI / 16;
            const rr = Math.sin(vang);

            vt.p = [
              - Math.sin(hang) * rr,
              Math.cos(vang),
              - Math.cos(hang) * rr];
            vt.n = [...vt.p];
            vt.uv = [j / 16, 1 - i / 16];
            m.vts.push(vt);
          }
        }

        for (let i = 0; i < 8; ++i) {
          for (let j = 0; j < 16; ++j) {
            let v0 = (16 + 1) * i + j;
            let v1 = v0 + 1;
            let v2 = v0 + 16 + 1;
            let v3 = v2 + 1;
            part.indices.push(v0, v2, v1);
            part.indices.push(v1, v2, v3);
          }
        }
      }

      m.compute();
      gpb.meshes.push(m);

      {
        const t = new GpbTable();
        t.name = 'mesh1';
        t.type = GpbTable.TYPE_MESH;
        gpb.tables.push(t);
      }
    }

    { // シーン
      const t = new GpbTable();
      t.name = '__SCENE__';
      t.type = GpbTable.TYPE_SCENE;
      gpb.tables.push(t);
    }

    // ノード
    const n1 = new GpbNode();
    n1._name = 'node1';
    { // メッシュ名
      n1.modelName = `#mesh1`;
      n1.materials.push('material1');
    }
    {
      const t = new GpbTable();
      t.name = n1._name;
      t.type = GpbTable.TYPE_NODE;
      gpb.tables.push(t);
    }
    gpb.scene.children.push(n1);

    console.log('gpb', gpb);
    return gpb;
  }

  /**
   * gpbの素を作成する。
   * ジョイントノード無しのモデル
   */
  createGpb3() {
    console.log('createGpb3 start');

    const gpb = new GpbExport();

    const attrSet = [
      {type: GpbAttribute.TYPE_POSITION, num: 3},
      {type: GpbAttribute.TYPE_NORMAL, num: 3},
      {type: GpbAttribute.TYPE_TEXCOORD0, num: 2},
      {type: GpbAttribute.TYPE_WEIGHTS, num: 4},
      {type: GpbAttribute.TYPE_JOINTS, num: 4},
    ].map(v => {
      const attr = new GpbAttribute();
      attr.type = v.type;
      attr.num = v.num;
      return attr;
    });

    { // メッシュ 頂点と面
      const m = new GpbMesh();
      m.attrs = [...attrSet];
      const part = new GpbPart();

      m.parts.push(part);
      part.indexFormat = GpbPart.INDEX16;

      {
        for (let i = 0; i < 2; ++i) {
          for (let j = 0; j < 2; ++j) {
            const vt = new GpbVertex();
            vt.p = [
              (j * 2 - 1) * 2, (1 - i * 2) * 2,
              (((i & 1) + (j & 1)) & 1) * 0.5];
            vt.uv = [j / 1, 1 - i / 1];
            m.vts.push(vt);
          }
        }

        for (let i = 0; i < 1; ++i) {
          part.indices.push(0, 2, 1, 1, 2, 3);
          //part.indices.push(0, 1, 2, 2, 1, 3);
        }
      }

      m.compute();
      gpb.meshes.push(m);

      {
        const t = new GpbTable();
        t.name = 'mesh1';
        t.type = GpbTable.TYPE_MESH;
        gpb.tables.push(t);
      }
    }

    { // 頂点と面
      const m = new GpbMesh();
      m.attrs = [...attrSet];
      const part = new GpbPart();
      m.parts.push(part);
      part.indexFormat = GpbPart.INDEX16;

      {
        for (let i = 0; i <= 8; ++i) {
          for (let j = 0; j <= 16; ++j) {
            const vt = new GpbVertex();

            const hang = (j % 16) * 2 * Math.PI / 16;
            const vang = (i % 16) * 2 * Math.PI / 16;
            const rr = Math.sin(vang);

            vt.p = [
              - Math.sin(hang) * rr,
              Math.cos(vang),
              - Math.cos(hang) * rr];
            vt.n = [...vt.p];
            vt.uv = [j / 16, 1 - i / 16];
            m.vts.push(vt);
          }
        }

        for (let i = 0; i < 8; ++i) {
          for (let j = 0; j < 16; ++j) {
            let v0 = (16 + 1) * i + j;
            let v1 = v0 + 1;
            let v2 = v0 + 16 + 1;
            let v3 = v2 + 1;
            part.indices.push(v0, v2, v1);
            part.indices.push(v1, v2, v3);
          }
        }
      }

      m.compute();
      gpb.meshes.push(m);

      {
        const t = new GpbTable();
        t.name = 'mesh2';
        t.type = GpbTable.TYPE_MESH;
        gpb.tables.push(t);
      }
    }

    { // シーン
      const t = new GpbTable();
      t.name = '__SCENE__';
      t.type = GpbTable.TYPE_SCENE;
      gpb.tables.push(t);
    }

    const materialNames = [
      'colored',
      'material1',
      'material2',
    ];

    // ノード
    const n0 = new GpbNode();
    n0._name = 'node0';
    {
      const t = new GpbTable();
      t.name = n0._name;
      t.type = GpbTable.TYPE_NODE;
      gpb.tables.push(t);      
    }
    gpb.scene.children.push(n0);

    // ノード
    const n1 = new GpbNode();
    n1._name = 'node1';
    { // メッシュ名
      n1.modelName = `#mesh1`;
      n1.materials.push(materialNames[1]);
    }
    {
      const t = new GpbTable();
      t.name = n1._name;
      t.type = GpbTable.TYPE_NODE;
      gpb.tables.push(t);
    }
    n0.children.push(n1);
    n1.parentName = n0._name;
    
    // ノード
    const n2 = new GpbNode();
    n2._name = 'node2';
    {
      // メッシュ名
      n2.modelName = `#mesh2`;
      n2.materials.push(materialNames[2]);
    }
    {
      const t = new GpbTable();
      t.name = n2._name;
      t.type = GpbTable.TYPE_NODE;
      gpb.tables.push(t);
    }
    n0.children.push(n2);
    n2.parentName = n0._name;

    console.log('gpb 3', gpb);
    return gpb;
  }

  /**
   * カーブ作るか
   * gpbの素を作成する。
   * ジョイントノード無しのモデル
   * 1メッシュノード
   */
  createGpb4() {
    console.log('createGpb4 start');

    const gpb = new GpbExport();

    { // メッシュ 頂点と面
      const m = new GpbMesh();
      m.readyAttrs(true);
      const part = new GpbPart();

      m.parts.push(part);
      part.indexFormat = GpbPart.INDEX16;

      {
        for (let l = 0; l < 1; ++l) {
          for (let i = 0; i < 2; ++i) {
            for (let j = 0; j < 2; ++j) {
              const vt = new GpbVertex();
              vt.p = [
                (j * 2 - 1) * 2, (1 - i * 2) * 2,
                (((i & 1) + (j & 1)) & 1) * 0.5];
              vt.uv = [j / 1, 1 - i / 1];
              m.vts.push(vt);
            }
          }
        }

        for (let i = 0; i < 1; ++i) {
          part.indices.push(0, 2, 1, 1, 2, 3);
          //part.indices.push(0, 1, 2, 2, 1, 3);
        }
      }

      m.compute();
      gpb.meshes.push(m);

      {
        const t = new GpbTable();
        t.name = 'mesh0';
        t.type = GpbTable.TYPE_MESH;
        gpb.tables.push(t);
      }
    }

    { // シーン
      const t = new GpbTable();
      t.name = '__SCENE__';
      t.type = GpbTable.TYPE_SCENE;
      gpb.tables.push(t);
    }

    const materialNames = [
      'material0',
    ];

    // ノード
    const n0 = new GpbNode();
    n0._name = 'node0';
    { // メッシュ名
      n0.modelName = `#mesh0`;
      n0.materials.push(materialNames[0]);
    }
    {
      const t = new GpbTable();
      t.name = n0._name;
      t.type = GpbTable.TYPE_NODE;
      gpb.tables.push(t);
    }
    gpb.scene.children.push(n0);
    n0.parentName = '__SCENE__';

    console.log('gpb 4', gpb);
    return gpb;
  }

  /**
   * THREE.Mesh を作成する
   * 左上カーブ。右へ曲がる
   */
  makeCurve() {
    console.log('makeCurve');
    const geo = new THREE.BufferGeometry();
    const mtl = new THREE.MeshStandardMaterial({
      color: 0xff8000,
      side: THREE.FrontSide,
    });
    //mtl.wireframe = true;
    {
      const div = 64;
      const height = 0.5;
      const rr = 1;

      /** 1層の頂点数 */
      const ninl = 1 + div / 4 + 1;
      /** 頂点数 */
      const vn = ninl * 2;

      const pb = new Float32Array(vn * 3);
      const nb = new Float32Array(vn * 3);
      const uvb = new Float32Array(vn * 2);

      /** 頂点ごとのインデックス */
      let vi = 0;

      const _f = (p, n, uv) => {
        pb[vi * 3] = p[0];
        pb[vi * 3 + 1] = p[1];
        pb[vi * 3 + 2] = p[2];
        nb[vi * 3] = n[0];
        nb[vi * 3 + 1] = n[1];
        nb[vi * 3 + 2] = n[2];
        uvb[vi * 2] = uv[0];
        uvb[vi * 2 + 1] = uv[1];
      };

      let p = [0, 0, 0];
      let n = [0, 0, 0];
      let uv = [0.5, 0.5];
      for (let l = 0; l < 2; ++l) {
        p[0] = -1 * rr;
        p[1] = l * height;
        p[2] = -1 * rr;
        { // 角
          n[0] = 0;
          n[1] = (l === 0) ? -1 : 1;
          n[2] = 0;
          uv[0] = 0;
          uv[1] = 1;
          _f(p, n, uv);
          vi += 1;
        }
        for (let i = 0; i <= div / 4; ++i) {
          const ang = Math.PI * 2 * i / div;
          const cs = Math.cos(ang);
          const sn = Math.sin(ang);
          let x = -cs;
          let z = -sn;
          p[0] = x * rr;
          p[2] = z * rr;
          n[0] = -x;
          n[1] = 0;
          n[2] = -z;
          uv[0] = x;
          uv[1] = -z;
          _f(p, n, uv);
          vi += 1;          
        }
      }

      /** 面数 */
      let fn = div / 4 * 2 + div / 4 * 2 + 4;
      const fis = new Uint16Array(fn * 3);
      let index = 0;
      { // 上面と下面(div/4 * 2)
        for (let l = 0; l < 2; ++l) {
          for (let i = 0; i < div / 4; ++i) {
            const v0 = l * ninl;
            let v1 = v0 + 1 + i;
            let v2 = v1 + 1;
            if (l === 0) {
              const tmp = v2;
              v2 = v1;
              v1 = tmp;
            }
            fis[index] = v0;
            fis[index+1] = v1;
            fis[index+2] = v2;
            index += 3;
          }
        }
      }
      { // カーブ側面(div/4 * 2)
        for (let i = 0; i < div / 4; ++i) {
          const v0 = 1 + i; // 左下
          const v1 = v0 + 1; // 右下
          const v2 = v0 + ninl;
          const v3 = v1 + ninl;
          fis[index] = v2;
          fis[index+1] = v0;
          fis[index+2] = v1;
          fis[index+3] = v3;
          fis[index+4] = v2;
          fis[index+5] = v1;
          index += 6;
        }
      }
      { // 側面2つ(4面)
        const v0 = 0; // 下の角
        const v1 = 1; // 下のカーブ開始
        const v2 = ninl - 1; // 下のカーブ最後
        const v3 = v0 + ninl;
        const v4 = v1 + ninl;
        const v5 = v2 + ninl;
        // z字 v3, v4, v0, v1 
        fis[index] = v3;
        fis[index+1] = v0;
        fis[index+2] = v4;
        fis[index+3] = v4;
        fis[index+4] = v0;
        fis[index+5] = v1;
        index += 6;
        // z字 v5, v3, v2, v0
        fis[index] = v5;
        fis[index+1] = v2;
        fis[index+2] = v3;
        fis[index+3] = v3;
        fis[index+4] = v2;
        fis[index+5] = v0;           
        index += 6;
      }
      console.log('vi', vi, vn);
      console.log('index', index, fn * 3);

      geo.setAttribute('position', new THREE.BufferAttribute(pb, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(nb, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvb, 2));

      geo.setIndex(new THREE.BufferAttribute(fis, 1));
    }

    const m = new THREE.Mesh(geo, mtl);
    m.name = 'curve';
    console.log('makeCurve', m);
    return m;
  }

  act() {
    //const gpb = this.createGpb1();
    //let name = 'foo';

    //const gpb = this.createGpb2();
    //let name = 'bar';

    const gpb = this.createGpb3();
    let name = 'baz';


    const buf = gpb.make();
    this.download(new Blob([buf]), `${name}.gpb`);

    const text = gpb.makeMaterial();
    this.download(new Blob([text]), `${name}.material`);

    console.log('act end');
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
