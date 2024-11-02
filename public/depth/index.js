
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.163.js';

import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.169.js';

class Misc {
  constructor() {
    this.counter = 0;

    this.whs = [
      [4032, 3024, 3053.0],
      [540, 270, 3053.0],
    ];
    this.size = {
      "img_4_365": [1008, 756, 756.9675903320312],
      "img_8_365": [504, 378, 382.5411682128906],
      "img_4_967": [756, 1008, 833.658935546875],
      "img_8_967": [378, 504, 407.9227294921875],
      "scr_4_146": [540, 270, 801.8546752929688],
    };

    this.target = 'scr_4_146';
    this.target = 'img_4_365';
    this.target = 'img_8_365';
    this.target = 'img_4_967';
    this.target = 'img_8_967';
  }

  /**
   * 
   * @param {string} target 
   */
  async loadFiles(target) {
    //const bitmap = await window.createImageBitmap(`./${target}.png`);
    //console.log('size', bitmap.width, bitmap.height);
    const res = await fetch(`./${target}.csv`);
    //const text = await res.text();
    const blob = await res.blob();
    this.makeFile(blob, true);
  }

  async exportGLB() {
    console.log('exportGLB called');
    const exporter = new GLTFExporter();
    const opt = {
      binary: true,
      includeCustomExtensions: true,
    };
    exporter.parse(this.scene,
      gltf => {
        console.log('gltf');
        this.download(new Blob([gltf]), `${this.target}.glb`);
      },
      () => {
        console.warn('gltf error');
      },
      opt,
    );
  }

  async init() {
    console.log('init called');

    if (true) {
      const el = document.body;
      el.addEventListener('dragover', ev => {
        ev.preventDefault();
        ev.stopPropagation();

        ev.dataTransfer.dropEffect = 'none';
      });
    }

    if (true) {
      const el = document.getElementById('drop');
      //const el = document.body;
      el.addEventListener('dragover', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        ev.dataTransfer.dropEffect = 'copy';
      });
      el.addEventListener('drop', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        const fromCsvDirect = document.getElementById('fromcsvdirect')?.checked;

        const files = ev.dataTransfer.files;
        if (files.length === 1) {
          this.makeFile(files[0], fromCsvDirect);
        } else {
          this.makeFiles(files);
        }
      });
    }

    {
      const el = document.getElementById('exportglb');
      el?.addEventListener('click', () => {
        this.exportGLB();
      });
    }

    this.initGL();
    if (false) {
      const m = await this.makeMesh();
      this.scene.add(m);
    }
    this.update();

    this.loadFiles(this.target);
  }

  initGL() {
    const w = 512;
    const h = 512;
    /**
     * @type {HTMLCanvasElement}
     */
    const canvas = document.getElementById('maincanvas');
    //canvas.width = w;
    //canvas.height = h;
    
    const renderer = new THREE.WebGLRenderer({
      canvas,
      preserveDrawingBuffer: true,
      alpha: true,
    });
    this.renderer = renderer;
    renderer.setSize(w, h);
    renderer.setClearColor(new THREE.Color(0x333366));

    const scene = new THREE.Scene();
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(
      50,
      w / h,
      0.002,
      2000,
    );
    this.camera = camera;
    camera.position.set(0, 0, 0);
    camera.lookAt(new THREE.Vector3(0, 0, -2));

    {
      const light = new THREE.DirectionalLight(0xcccccc);
      light.position.set(0, 0, 5);
      light.rotation.set(Math.PI * 30 / 180, 0, 0);
      this.scene.add(light);
    }
    {
      const light = new THREE.AmbientLight(0xcccccc);
      this.scene.add(light);
    }

    if (false) {
      const axes = new THREE.AxesHelper(10);
      this.scene.add(axes);
    }

    if (false) {
      const geo = new THREE.SphereGeometry(0.2);
      const mtl = new THREE.MeshStandardMaterial({
        color: 0xffffff,
      });
      const m = new THREE.Mesh(geo, mtl);
      m.position.set(1, 1, -10);
      this.scene.add(m);
    }

    {
      const control = new OrbitControls(camera, canvas);
      this.control = control;
    }

    {
      const clock = new THREE.Clock(true);
      this.clock = clock;
    }

  }

  update() {
    this.counter += 1;

    requestAnimationFrame(() => {
      this.update();
    });

    const delta = this.clock.getDelta();

    this.control?.update(delta);
    this.renderer?.render(this.scene, this.camera);

    {
      const el = document.getElementById('counterview');
      if (el) {
        el.textContent = `${this.counter}`;
      }
    }
  }

  async download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  }

  /**
   * 
   * @param {File} file 
   * @param {boolean} fromCsvDirect
   */
  async makeFile(file, fromCsvDirect) {
    let w = 9999;
    let h = 0;
    const depths = [];

      const text = await file.text();
      const lines = text.split('\n');
      console.log('lines', lines.length);

//    const ss = text.split(',');
//    console.log('ss', ss.length);
      for (let i = 0; i < lines.length; ++i) {
        const ss = lines[i].split(',');
        if (i === 0) {
            console.log('ss', ss.length);
        }
        //if (ss.length < this.whs[0][1]) {
        if (ss.length < 10) {
          console.log('small', ss.length);
          continue;
        }

        const ds = ss.map(v => Number.parseFloat(v));
        depths.push(ds);

        w = Math.min(ds.length);
        h += 1;
      }

    const vnum = w * h;
    {
      const focal = this.size[this.target][2];
      const cx = (w - 1) * 0.5;
      const cy = (h - 1) * 0.5;

      const ps = new Float32Array(vnum * 3);
      const uvs = new Float32Array(vnum * 2);
      const fis = new Uint32Array(6 * (w - 1) * (h - 1));
      let ft3 = 0;
      let ft2 = 0;

      const viewel = document.getElementById('view');

      let maxz = 0;

      console.log('vertices');
      for (let y = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x) {
          let d = depths[y][x];
          maxz = Math.max(d, maxz);

          let x3 = (x - cx) * d / focal;
          let y3 = (y - cy) * d / focal;

          ps[ft3  ] = x3;
          ps[ft3+1] = -y3;
          ps[ft3+2] = -d;

          uvs[ft2  ] = x / (w - 1);
          uvs[ft2+1] = (h - 1 - y) / (h - 1);

          ft3 += 3;
          ft2 += 2;

          await window?.scheduler?.yield();
        }

        if (viewel) {
          viewel.textContent = `${y}/${h}`;
        }
      }

      if (!fromCsvDirect) {
        {
          await this.download(new Blob([
            ps.buffer,
          ]), `ap.dat`);
        }
        {
          await this.download(new Blob([
            uvs.buffer,
          ]), `auv.dat`);
        }
      }

      console.log('face indices', maxz);

      let ft6 = 0;
      for (let y = 0; y < h - 1; ++y) {
        for (let x = 0; x < w - 1; ++x) {
          const v0 = w * y + x;
          const v1 = v0 + 1;
          const v2 = v0 + w;
          const v3 = v2 + 1;

          fis[ft6  ] = v0;
          fis[ft6+1] = v2;
          fis[ft6+2] = v1;
          fis[ft6+3] = v1;
          fis[ft6+4] = v2;
          fis[ft6+5] = v3;

          ft6 += 6;

          await window?.scheduler?.yield();
        }

        if (viewel) {
          viewel.textContent = `${y}/${h}`;
        }
      }
      if (!fromCsvDirect) {
        await this.download(new Blob([
          fis.buffer,
        ]), `afis.dat`);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(ps, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.setIndex(new THREE.BufferAttribute(fis, 1));

      console.log('compute calling...');
      geo.computeVertexNormals();
      console.log('compute done');
      {
        //await this.download(new Blob([]), `n.dat`);
      }

      const map = new THREE.TextureLoader().load(`./${this.target}.png`);
      
      const mtl = new THREE.MeshStandardMaterial({
        metalness: 0,
        roughness: 1,
        map,
      });
      
      /*
      const mtl = new THREE.MeshBasicMaterial({
        map,
      });
      */
      const m = new THREE.Mesh(geo, mtl);
      this.scene.add(m);
    }

    console.log('makeFile leave', w, h);
  }

  /**
   * 
   * @param {File[]} files 
   */
  async makeFiles(files) {
    let w = 9999;
    let h = 0;
      w = this.whs[0][0];
      h = this.whs[0][1];

    const vnum = w * h;
    {
      const focal = this.whs[0][2];
      const cx = (w - 1) * 0.5;
      const cy = (h - 1) * 0.5;

      const ps = new Float32Array(vnum * 3);
      const uvs = new Float32Array(vnum * 2);
      const fis = new Uint32Array(6 * (w - 1) * (h - 1));
      let ft3 = 0;
      let ft2 = 0;

      const viewel = document.getElementById('view');

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(ps, 3));
      geo.setIndex(new THREE.BufferAttribute(fis, 1));

      console.log('compute calling...');
      geo.computeVertexNormals();
      console.log('compute done');

      const map = new THREE.Texture(document.getElementById('img'));
      const mtl = new THREE.MeshStandardMaterial({
        map,
      });
      const m = new THREE.Mesh(geo, mtl);
      this.scene.add(m);
    }

    console.log('makeFiles leave', w, h);
  }

  async makeMesh() {
    console.log('makeMesh called');
    const w = 10;
    const h = 10;
    const vnum = (w + 1) * (h + 1);
    const ps = new Float32Array(vnum * 3);
    const fis = new Uint32Array(w * h * 6);
    const uvs = new Float32Array(vnum * 2);
    let offset3 = 0;
    let offset2 = 0;
    for (let y = 0; y <= h; ++y) {
      for (let x = 0; x <= w; ++x) {
        let px = x - w * 0.5;
        let py = h - y - h * 0.5;
        ps[offset3] = px;
        ps[offset3+1] = py;
        ps[offset3+2] = -20;

        uvs[offset2] = x / w;
        uvs[offset2+1] = 1 - y / h;

        offset3 += 3;
        offset2 += 2;
      }
    }
    let offset6 = 0;
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        let v0 = (w + 1) * y + x;
        let v1 = v0 + 1;
        let v2 = v0 + (w + 1);
        let v3 = v2 + 1;

        fis[offset6] = v0;
        fis[offset6+1] = v2;
        fis[offset6+2] = v1;
        fis[offset6+3] = v1;
        fis[offset6+4] = v2;
        fis[offset6+5] = v3;
        offset6 += 6;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(ps, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(new THREE.BufferAttribute(fis, 1));
    const mtl = new THREE.MeshStandardMaterial({
      color: 0xccffcc,
    });
    const m = new THREE.Mesh(geo, mtl);
    //m.position.set(0, 0, 0);
    return m;
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.init();
