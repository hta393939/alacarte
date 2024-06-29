/**
 * @file index.js
 */

import * as THREE from 'three/three.module.min.js';

import {Tg} from './tg.js';

const _lerp = (a, b, t) => {
  return (a * (1 - t) + b * t);
};

const _norm = (x, y, z) => {
  const sum = x ** 2 + y ** 2 + z ** 2;
  const k = (sum > 0) ? (1 / Math.sqrt(sum)) : 0;
  return [x * k, y * k, z * k];
};

class Misc extends Tg {
  constructor() {
    super();
  }

  async init() {
    this.setListener();

  
    await this.initialize();

    {
      const m = this.makeRoundPath();
      this.scene.add(m);
    }
  }

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

      const mtl = new THREE.MeshStandardMaterial({
        color: 0x8080ff,
      });
      const m = new THREE.Mesh(geo, mtl);
      return m;
    }
  }

  download(blob, name) {
    const a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(blob);
    a.click();
  }

  setListener() {
    console.log('setListener');
    {
      const el = window;
      el.addEventListener('dragover', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'copy';
      });
      el.addEventListener('drop', async ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'copy';
        const canvas = document.getElementById('subcanvas');
        await this.loadFileToCanvas(ev.dataTransfer.files[0], canvas);
        this.round(canvas);
      });
    }

    for (const k of [
      'scale', 'cellx', 'celly', 'cellw',
    ]) {
      const el = document.getElementById(`${k}`);
      const viewel = document.getElementById(`${k}view`);
      const _update = () => {
        this[k] = Number.parseFloat(el.value);
        viewel.textContent = this[k];
      };
      el?.addEventListener('input', () => {
        _update();
      });
      _update();
    }

    {
      const el = document.getElementById('idmake1');
      el?.addEventListener('click', async () => {
        const canvas = document.getElementById('maincanvas');
        canvas.width = 256;
        canvas.height = 256;
        await this.make1(canvas);
      });
    }

    {
      const el = document.getElementById('idmake2');
      el?.addEventListener('click', async () => {
        const ab = await this.makeGlb();
        this.download(new Blob([ab]), `a.glb`);
      });
    }
    { // 未実装
      const el = document.getElementById('idmake3');
      el?.addEventListener('click', async () => {
        const canvas = document.getElementById('maincanvas');
        canvas.width = 256;
        canvas.height = 256;
        await this.make1(canvas);
      });
    }
    console.log('setListener');
  }

  /**
   * このクラスの関数
   * @returns {THREE.Mesh}
   */
  makeRoundPath() {
    console.log('makeRoundPath');
    // +
    // しずく
    // (=)
    // ノ 長い胴体
    // (=)
    // ノ ベース
    // (=)
    // 下から
    const thin2 = 0.05;

    const makeDisc = (height, _thin2, radius) => {
      const ret = {vs: []};
      for (let i = 0; i <= 16; ++i) {
        const ang = (i - 8) * Math.PI * 2 / 32;
        const cs = Math.cos(ang);
        const sn = Math.sin(ang);
        const p = [radius + cs * _thin2, sn * _thin2 + height, 0];
        const n = [cs, sn, 0];
        ret.vs.push({p, n});
      }
      return ret;
    };
    const makeCurve = (a, b, c, d) => {
      const ret = {vs: []};
      for (let i = 0; i <= 16; ++i) {
        let t = i / 16;
        let u = 1 - t;
        let x = a[0] * u ** 3
          + b[0] * 3 * u * u * t
          + c[0] * 3 * u * t * t
          + d[0] * t ** 3;
        let y = a[1] * u ** 3
          + b[1] * 3 * u * u * t
          + c[1] * 3 * u * t * t
          + d[1] * t ** 3;

        let nx = - a[0] * 3 * u * u
          + b[0] * 3 * (1 - 3 * t) * u
          + c[0] * 3 * (2 - t * 3) * t
          + d[0] * 3 * t * t;
        let ny = - a[1] * 3 * u * u
          + b[1] * 3 * (-2 * u * t + u * u)
          + c[1] * 3 * (- t * t + u * 2 * t)
          + d[1] * 3 * t * t;
        const p = [x, y, 0];
        const n = _norm(nx, ny, 0);
        ret.vs.push({p, n});
      }
      return ret;
    };

    const vs = [];
    let x = 0.4;
    let y = 0;
    const parts = [];
    parts.push(makeCurve([0, y], [x / 3, y], [x * 2 / 3, y], [x, y]));
    parts.push(makeDisc(thin2, thin2, x));
    y += thin2 * 2;
    parts.push(makeCurve([x, y], [x-0.02, y+0.02], [x-0.04, y+0.04], [x-0.06, y+0.06]));
    y += 0.06;
    parts.push(makeDisc(y + thin2, thin2, 0.5));
    y += thin2 * 2;
    x = 0.1;
    parts.push(makeCurve([x, y], [x, y+0.04], [x, y+0.08], [x, y+0.12]));
    y += 0.12;
    parts.push(makeDisc(y + thin2, thin2, x));
    y += thin2 * 2;
    parts.push(makeCurve([x, y], [x-0.02, y+0.1], [x-0.04, y+0.2], [x-0.06, y+0.3]));
    y += 0.3;
    x = 0.1;
    parts.push(makeDisc(y + thin2, thin2, x));
    y += thin2 * 2;
    parts.push(makeCurve([x, y], [x * 2 / 3, y], [x / 3, y], [0, y]));

    for (const part of parts) {
      vs.push(...part.vs);
    } // 十字が無い
    this.draw(window.maincanvas, vs);

    const geo = new THREE.BufferGeometry();
    const vts = [];
    const fis = [];
    let index = 0;
    for (let part of parts) {
      index = vts.length;
      const lathe = this.createLathe(part.vs, index);
      vts.push(...lathe.vs);
      fis.push(...lathe.fis);
    }
    const vnum = vts.length;
    const ps = new Float32Array(vnum * 3);
    const ns = new Float32Array(vnum * 3);
    const uvs = new Float32Array(vnum * 2);
    for (let i = 0; i < vnum; ++i) {
      const pt = vts[i];
      const ft3 = i * 3;
      const ft2 = i * 2;
      ps[ft3] = pt.p[0];
      ps[ft3+1] = pt.p[1];
      ps[ft3+2] = pt.p[2];
      ns[ft3] = pt.n[0];
      ns[ft3+1] = pt.n[1];
      ns[ft3+2] = pt.n[2];
      uvs[ft2] = pt.uv[0];
      uvs[ft2+1] = pt.uv[1];
    }
    geo.setAttribute('position', new THREE.BufferAttribute(ps, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(ns, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(fis);
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    const mtl = new THREE.MeshStandardMaterial({
      color: 0x00ccff,
    });
    const m = new THREE.Mesh(geo, mtl);
    return m;
  }

  /**
   * このクラスの関数
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

const misc = new Misc();
globalThis.misc = misc;
misc.init();

