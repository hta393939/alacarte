/**
 * @file index.js
 */

import * as THREE from 'three/three.module.min.js';
import {OrbitControls} from 'three/jsm/controls/OrbitControls.js';

import {GLTFExporter} from 'three/jsm/exporters/GLTFExporter.js';

/**
 * @typedef Vtx
 * @property {[number, number, number]} p
 * @property {number[]} n
 * @property {[number, number]} uv
 */

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
    this.div = 16;
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

    {
      const light = new THREE.AmbientLight(0x999999);
      scene.add(light);
    }

    const controller = new OrbitControls(camera, canvas);
    this.controller = controller;

    this.update();
  }

  makeScene() {
    {
      const geo = new THREE.SphereGeometry(2, 2);
      const mtl = new THREE.MeshStandardMaterial({
        color: 0xff8000,
      });
      const m = new THREE.Mesh(geo, mtl);
      m.position.set(-5, 0, 0);
      this.scene.add(m);
    }
  }

  /**
   * 
   * @param {{vs: Vtx[], fis: number[]}} part
   * @returns {THREE.Mesh}
   */
  makeMesh(part) {
    {
      const vnum = part.vs.length;
      const ps = new Float32Array(vnum * 3);
      const ns = new Float32Array(vnum * 3);
      const uvs = new Float32Array(vnum * 2);
      const ws = new Float32Array(vnum * 4);
      const js = new Uint16Array(vnum * 4);
      const fis = part.fis;

      let usewj = false;

      for (let i = 0; i < vnum; ++i) {
        const vt = part.vs[i];
        let ft3 = i * 3;
        let ft2 = i * 2;
        let ft4 = i * 4;
        ps[ft3  ] = vt.p[0];
        ps[ft3+1] = vt.p[1];
        ps[ft3+2] = vt.p[2];
        ns[ft3  ] = vt.n[0];
        ns[ft3+1] = vt.n[1];
        ns[ft3+2] = vt.n[2];
        uvs[ft2  ] = vt.uv[0];
        uvs[ft2+1] = vt.uv[1];
        if ('w' in vt) {
          usewj = true;
          ws[ft4  ] = vt.w[0];
          ws[ft4+1] = vt.w[1];
          ws[ft4+2] = vt.w[2];
          ws[ft4+3] = vt.w[3];
          js[ft4  ] = vt.j[0];
          js[ft4+1] = vt.j[1];
          js[ft4+2] = vt.j[2];
          js[ft4+3] = vt.j[3];
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(ps, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(ns, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      if (usewj) {
        geo.addAttribute('skinWeight', new THREE.BufferAttribute(ws, 4));
        geo.addAttribute('skinIndex', new THREE.BufferAttribute(js, 4));
      }
      geo.setIndex(fis);
      geo.computeBoundingBox();
      geo.computeBoundingSphere();

      const mtl = new THREE.MeshStandardMaterial({
        color: 0x8080ff,
      });

      if (usewj) {
        const m = new THREE.SkinnedMesh(geo, mtl);
        //const skeleton = new THREE.Skeleton(bones);
// https://threejs.org/docs/#api/en/objects/SkinnedMesh
        return m;
      }

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

  /**
   * 
   * @param {THREE.Object3D} inobj 
   * @returns 
   */
  async makeGlb(inobj) {
    console.log('makeGlb');
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

    const scene = new THREE.Scene();
    scene.add(inobj);
    const ab = await exporter.parseAsync(scene, opt);
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
   * 法線付きlathe
   * @param {Vtx[]} vs 
   * @param {number} indexOffset 頂点インデックスオフセット
   * @returns {{vs: Vtx[], fis: number[]}}
   */
  createLathe(vs, indexOffset) {
    const div = this.div;
    const ret = {vs: [], fis: []};
    const num = vs.length;
    for (let i = 0; i < num; ++i) {
      const pt = vs[i];
      for (let j = 0; j <= div; ++j) {
        const ang = Math.PI * 2 * (j % div) / div;
        const cs = Math.cos(ang);
        const sn = Math.sin(ang);
        let x = pt.p[0] * cs;
        let y = pt.p[1];
        let z = - pt.p[0] * sn;
        let nx = pt.n[0] * cs;
        let ny = pt.n[1];
        let nz = - pt.n[0] * sn;
        let u = j / div;
        let v = i / (num - 1);

        const vtx = {
          p: [x, y, z],
          n: [nx, ny, nz],
          uv: [u, v],
        };
        ret.vs.push(vtx);
      }

      if (i === 0) {
        continue;
      }
      for (let j = 0; j < div; ++j) {
        let v0 = (i - 1) * (div + 1) + j;
        let v1 = v0 + 1;
        let v2 = v0 + (div + 1);
        let v3 = v2 + 1;
        v0 += indexOffset;
        v1 += indexOffset;
        v2 += indexOffset;
        v3 += indexOffset;
        ret.fis.push(v0, v1, v2);
        ret.fis.push(v2, v1, v3);
      }
    }
    return ret;
  }

}

