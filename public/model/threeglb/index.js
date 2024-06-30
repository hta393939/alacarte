/**
 * @file index.js
 */

import * as THREE from 'three/three.module.min.js';
import {Util} from '../../lib/util.js';
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

    this.div = 32;
  }

  async init() {
    this.setListener();

  
    await this.initialize();

    {
      const m = this.makeRoundPath();
      m.name = 'bishop';
      this.scene.add(m);
    }

    {
      const m = this.makeRound(1);
      m.name = 'round';
      this.scene.add(m);
    }
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
        const obj = this.scene.getObjectByName('bishop');
        const ab = await this.makeGlb(obj);
        Util.download(new Blob([ab]), `a.glb`);
      });
    }
    {
      const el = document.getElementById('idmake3');
      el?.addEventListener('click', async () => {
        const obj = this.scene.getObjectByName('round');
        const ab = await this.makeGlb(obj);
        Util.download(new Blob([ab]), `round.glb`);
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
    // ()
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

        let tx =
          - a[0] * 3 * u * u
          + b[0] * 3 * (1 - 3 * t) * u
          + c[0] * 3 * (2 - t * 3) * t
          + d[0] * 3 * t * t;
        let ty =
          - a[1] * 3 * u * u
          + b[1] * 3 * (-2 * u * t + u * u)
          + c[1] * 3 * (- t * t + u * 2 * t)
          + d[1] * 3 * t * t;
        const p = [x, y, 0];
        const n = _norm(ty, -tx, 0);
        ret.vs.push({p, n});
      }
      return ret;
    };

    /**
     * 一周した厚みの無い円盤
     * @param {number} radius 
     * @param {number} iny 
     * @param {number} inny 
     * @param {number} indexOffset
     */
    const makeYDisc = (radius, iny, inny, indexOffset) => {
      const ret = {vs: [], fis: []};
      const div = this.div;
      for (let i = 0; i < div; ++i) {
        const ang = Math.PI * 2 * i / div;
        const cs = Math.cos(ang);
        const sn = Math.sin(ang);
        const vt = {
          p: [cs * radius, iny, -sn * radius],
          n: [0, inny, 0],
          uv: [0.5 + cs * 0.5, 0.5 + sn * 0.5],
        };
        ret.vs.push(vt);

        let v0 = div;
        let v1 = i;
        let v2 = (i + 1) % div;
        v0 += indexOffset;
        v1 += indexOffset;
        v2 += indexOffset;
        if (inny > 0) {
          ret.fis.push(v0, v1, v2);
        } else {
          ret.fis.push(v0, v2, v1);
        }
      }
      {
        const vt = {
          p: [0, iny, 0],
          n: [0, inny, 0],
          uv: [0.5, 0.5],
        };
        ret.vs.push(vt);       
      }
      return ret;
    };

    /**
     * 最終頂点配列
     */
    const vts = [];
    const fis = [];
    let index = 0;

    const vs = [];
    let x = 0.3;
    let y = 0;
    const parts = [];
    { // 下面
      const disc = makeYDisc(x, y, -1, vts.length);
      vts.push(...disc.vs);
      fis.push(...disc.fis);
    }

    parts.push(makeDisc(thin2, thin2, x));
    y += thin2 * 2;
    parts.push(makeCurve( // 足
      [x, y],
      [x+0.02, y+0.075],
      [x+0.02, y+0.075],
      [x, y+0.15]));
    y += 0.15;
    x -= 0.0;
    parts.push(makeDisc(y + thin2, thin2, x));
    y += thin2 * 2;
    parts.push(makeCurve( // 胴
      [x, y],
      [x - 0.05, y+0.10],
      [x - 0.15, y+0.40],
      [x - 0.15, y+0.60]));
    x -= 0.15;
    y += 0.60;
    parts.push(makeDisc(y + thin2, thin2, x));
    y += thin2 * 2;
    parts.push(makeCurve( // 帽子
      [x, y],
      [x+0.15, y+0.15],
      [x+0.10, y+0.20],
      [x-0.09, y+0.40]));
    y += 0.40;
    x -= 0.09;

    parts.push(makeCurve(
      [x, y],
      [x+0.04, y+0.05],
      [x+0.04, y+0.15],
      [x-x, y+0.15]));
    y += 0.15;
    x -= x;

    console.log('y', y, x);

    for (const part of parts) {
      vs.push(...part.vs);
    }
    this.draw(window.maincanvas, vs);

    const geo = new THREE.BufferGeometry();

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
    const scale = 1 / 2;
    for (let i = 0; i < vnum; ++i) {
      const pt = vts[i];
      const ft3 = i * 3;
      const ft2 = i * 2;
      ps[ft3] = pt.p[0] * scale;
      ps[ft3+1] = pt.p[1] * scale;
      ps[ft3+2] = pt.p[2] * scale;
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
      color: 0xeeeeee,
    });
    const m = new THREE.Mesh(geo, mtl);
    return m;
  }

  /**
   * 
   * @param {number} dirk +1 or -1
   * @returns {THREE.Mesh}
   */
  makeRound(dirk) {
    const div = this.div;
    const thin2 = 1 / 8;
    const ret = {vs: [], fis: []};
    for (let i = 0; i <= div; ++i) {
      // U 
      // +1.0 ～ 0.0 ～ -1.0
      let z = (div / 2 - i) / (div / 2);
      for (let j = 0; j <= div; ++j) {
        const vt = {
          p: [0, 0, z],
          n: [0, -1, 0],
          uv: [0.5, 0.5],
        };

        if (0 <= j && j < div / 4) {
          vt.p = [
            -(div / 4 - j) / (div / 4),
            -thin2, // 下
            z
          ];
        } else if (div / 4 <= j && j < div * 3 / 4) {
          const ang = Math.PI * 2 * ((j + div * 2 / 4) % div) / div;
          const cs = Math.cos(ang);
          const sn = Math.sin(ang);
          vt.p = [thin2 * cs, thin2 * sn, z];
          vt.n = [cs, sn, 0];
        } else {
          vt.n = [0, 1, 0];
          vt.p = [
            -(j - div * 3 / 4) / (div / 4),
            thin2, // 上
            z
          ];
        }

        vt.n = vt.n.map(n => n * dirk);

        ret.vs.push(vt);
      }
    }

    for (let i = 0; i < div; ++i) {
      for (let j = 0; j < div; ++j) {
        let v0 = (div + 1) * i + j;
        let v1 = v0 + 1;
        let v2 = v0 + (div + 1);
        let v3 = v2 + 1;
        ret.fis.push(v0, v2, v1);
        ret.fis.push(v1, v2, v3);
      }
    }

    { // 他の側面閉じた方がいいかな...
      for (let i = 0; i < div; ++i) {
        let v0 = (div + 1) * i;
        let v1 = v0 + div;
        let v2 = v0 + (div + 1);
        let v3 = v2 + div;
        ret.fis.push(v0, v1, v2);
        ret.fis.push(v2, v1, v3);
      }
      for (let i = 0; i < div; ++i) {
        {
          let v0 = 0;
          let v1 = 0;
          let v2 = 0;
          let v3 = 0;
          //ret.fis.push(v0, v1, v2);
          //ret.fis.push(v2, v1, v3);
        }
      }

    }

    const m = this.makeMesh(ret);
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
    const scale = w / 4;
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d');

    {
      c.beginPath();
      c.strokeStyle = 'black';
      let x = w * 0.5;
      let y = h * 0.5;
      c.moveTo(x, 0);
      c.lineTo(x, h);
      c.stroke();
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(w, y);
      c.stroke();
    }

    c.beginPath();
    c.moveTo(
      vs[0].p[0] * scale + w * 0.5,
      - vs[0].p[1] * scale + h * 0.5);
    for (let i = 1; i < vs.length; ++i) {
      const v = vs[i];
      c.lineTo(
        w * 0.5 + v.p[0] * scale,
        h * 0.5 - v.p[1] * scale);
    }
    c.lineWidth = 1.5;
    c.strokeStyle = 'red';
    c.stroke();


  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.init();

