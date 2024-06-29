/**
 * @file index.js
 */

import * as THREE from 'three/three.module.min.js';
import {OrbitControls} from 'three/jsm/controls/OrbitControls.js';

import {GLTFExporter} from 'three/jsm/exporters/GLTFExporter.js';

const _lerp = (a, b, t) => {
  return (a * (1 - t) + b * t);
};

const _norm = (x, y, z) => {
  const sum = x ** 2 + y ** 2 + z ** 2;
  const k = (sum > 0) ? (1 / Math.sqrt(sum)) : 0;
  return [x * k, y * k, z * k];
};

export class Tg {
  constructor() {
  }

  async initialize() {
    this.initThree(window.subcanvas);
  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   */
  initThree(canvas) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      preservedDrawingBuffer: true,
    });
    this.renderer = renderer;
    renderer.setSize(320, 180);

    const scene = new THREE.Scene();
    this.scene = scene;
    const camera = new THREE.PerspectiveCamera(
      45, 16/9, 0.02, 768
    );
    this.camera = camera;
    camera.position.copy(new THREE.Vector3(1, 1, 5));
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    {
      const light = new THREE.DirectionalLight(0xffffff);
      light.name = 'light';
      const obj3d = new THREE.Object3D();
      light.target = obj3d;
      scene.add(light);
    }

    const controller = new OrbitControls(camera, canvas);
    this.controller = controller;

    this.makeScene();
    {
      const m = this.makeMesh();
      //scene.add(m);
    }

    this.update();
  }

  makeScene() {
    {
      const geo = new THREE.SphereGeometry(2, 2);
      const mtl = new THREE.MeshStandardMaterial({
        color: 0xff8000,
      });
      const m = new THREE.Mesh(geo, mtl);
      this.scene.add(m);
    }
  }

  /**
   * 
   * @returns {THREE.Mesh}
   */
  makeMesh() {
    {
      const vnum = 10;
      const ps = new Float32Array(vnum * 3);
      const ns = new Float32Array(vnum * 3);
      const uvs = new Float32Array(vnum * 2);
      const ws = new Float32Array(vnum * 4);
      const js = new Float32Array(vnum * 4);
      const fis = new Array(1 * 3);

      for (let i = 0; i < 10; ++i) {
        let ft3 = i * 3;
        let ft2 = i * 2;
        let ft4 = i * 4;
        ps[ft3  ] = i & 1;
        ps[ft3+1] = 1 - Math.floor(i / 2);
        ps[ft3+2] = 0;
        ns[ft3  ] = 0;
        ns[ft3+1] = 0;
        ns[ft3+2] = 1;
        uvs[ft2  ] = 0.5;
        uvs[ft2+1] = 0.5;
        ws[ft4  ] = 1;
        ws[ft4+1] = 0;
        ws[ft4+2] = 0;
        ws[ft4+3] = 0;
        js[ft4  ] = 0;
        js[ft4+1] = 0;
        js[ft4+2] = 0;
        js[ft4+3] = 0;
        fis[0] = 0;
        fis[1] = 1;
        fis[2] = 2;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(ps, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(ns, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(ps, 2));
      //geo.addAttribute('weight', new THREE.BufferAttribute(ps, 4));
      //geo.addAttribute('joint', new THREE.BufferAttribute(ps, 4));
      geo.setIndex(fis);
      geo.computeBoundingBox();
      geo.computeBoundingSphere();

      const mtl = new THREE.MeshStandardMaterial({
        color: 0x8080ff,
      });
      const m = new THREE.Mesh(geo, mtl);
      return m;
    }
  }

  update() {
    requestAnimationFrame(() => {
      this.update();
    });

    this.controller?.update();
    this.renderer?.render(this.scene, this.camera);
  }

  async makeGlb() {
    console.log('makeGlb');
    for (const k of ['light']) {
      const obj = this.scene.getObjectByName(k);
      if (!obj) {
        continue;
      }
      //this.scene.remove(obj);
    }

    const exporter = new GLTFExporter();

    const opt = {
      /*
			// default options
			binary: false,
			trs: false,
			onlyVisible: true,
			maxTextureSize: Infinity,
			animations: [],
			includeCustomExtensions: false,
      */

      binary: true,
    };

    const ab = await exporter.parseAsync(this.scene, opt);
    console.log('makeGlb', ab);
    return ab;
  }

/**
 * 
 * @param {File} file 
 * @param {HTMLCanvasElement} canvas 
 * @returns {Promise<HTMLCanvasElement>}
 */
  loadFileToCanvas(file, canvas) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const c = canvas.getContext('2d');
        c.drawImage(img, 0, 0);
        resolve(canvas);
      });
      img.addEventListener('error', () => {
        reject(`load error`);
      });
      img.src = URL.createObjectURL(file);
    });
  }

/**
 * 
 * @param {HTMLCanvasElement} src 
 */
  scaleImage(src) {
    const scale = this.scale;

    const cellx = this.cellx;
    const celly = this.celly;
    const cellw = this.cellw;
    const cellh = cellw;

/**
 * 入力画像の幅
 */
//        const w = src.width;
//        const h = src.height;
    const context = src.getContext('2d');
/**
 * 書き出し先
 * @type {HTMLCanvasElement}
 */
    const canvas = document.getElementById('subcanvas');
    const c = canvas.getContext('2d');
    canvas.width = cellw * scale;
    canvas.height = cellh * scale;
    const cx = cellx * cellw;
    const cy = celly * cellh;
    console.log(cx, cy, cellw, cellh);
    const dat = context.getImageData(cx, cy, cellw, cellh);

    let backs = [-1, -1, -1];
    if (true) {
      let ft = (0 + 0 * 0) * 4;
      backs[0] = dat.data[ft];
      backs[1] = dat.data[ft+1];
      backs[2] = dat.data[ft+2];
    }

    for (let i = 0; i < cellw; ++i) {
      for (let j = 0; j < cellw; ++j) {
        let ft = (j + i * cellw) * 4;
        let x = j * scale;
        let y = i * scale;
        let r = dat.data[ft];
        let g = dat.data[ft+1];
        let b = dat.data[ft+2];
        let a = dat.data[ft+3];
        if (r === backs[0] && g === backs[1] && b === backs[2]) {
          a = 0;
        }
        c.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        c.fillRect(x, y, scale, scale);
      }
    }
  }

/**
 * 
 * @param {File} file 
 */
  async parseImage(file) {
    const img = new Image();
    img.addEventListener('load', () => {
/**
 * @type {HTMLCanvasElement}
 */
      const canvas = document.getElementById('maincanvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const c = canvas.getContext('2d');
      c.drawImage(img, 0, 0);
      this.scaleImage(canvas);
    });
    img.src = URL.createObjectURL(file);
  }

  download(blob, name) {
    const a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(blob);
    a.click();
  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   * @param {*} vs 
   */
  draw(canvas, vs) {
    const w = 200;
    const h = 200;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');
    c.beginPath();
    c.moveTo((vs[0].p[0] + 1) * w * 0.5, (1 - vs[0].p[1]) * h * 0.5);
    for (let i = 1; i < vs.length; ++i) {
      const v = vs[i];
      c.lineTo((v.p[0] + 1) * w * 0.5, (1 - v.p[1]) * h * 0.5);
    }
    c.strokeStyle = 'red';
    c.stroke();
  }

}

