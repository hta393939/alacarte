
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.169.js';

class Misc {
  constructor() {
    this.counter = 0;

    this.whs = [
      [4032, 3024, 3053.0],
    ];
  }

  init() {
    console.log('init called');

    {
      console.log('個数', this.whs[0][0] * this.whs[0][1]);
    }

    if (false) {
      const el = document.body;
      el.addEventListener('dragover', ev => {
        ev.preventDefault();
        ev.stopPropagation();

        ev.dataTransfer.dropEffect = 'none';
      });
    }

    {
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

        this.makeFile(ev.dataTransfer.files[0]);
      });
    }

    this.initGL();
    this.update();
  }

  initGL() {
    const w = 512;
    const h = 512;
    /**
     * @type {HTMLCanvasElement}
     */
    const canvas = document.getElementById('canvas');
    canvas.width = w;
    canvas.height = h;
    
    const renderer = new THREE.WebGLRenderer({
      canvas,
      preserveDrawingBuffer: true,
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
      light.rotation.set(Math.PI * 30 / 180, 0, 0);
      this.scene.add(light);
    }
    {
      const light = new THREE.AmbientLight(0xcccccc);
      this.scene.add(light);
    }

    {
      const axes = new THREE.AxesHelper(10);
      this.scene.add(axes);
    }

    {
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

  /**
   * 
   * @param {File} file 
   */
  async makeFile(file) {
    //const ab = await file.arrayBuffer();
    const text = await file.text();
    const lines = text.split('\n');
    console.log('lines', lines.length);
//    const ss = text.split(',');
//    console.log('ss', ss.length);
    let w = 9999;
    let h = 0;
    const depths = [];
    for (let i = 0; i < lines.length; ++i) {
      const ss = lines[i].split(',');
      if (i === 0) {
          console.log('ss', ss.length);
      }
      if (ss.length < this.whs[0][1]) {
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
      const focal = this.whs[0][2];
      const cx = (w - 1) * 0.5;
      const cy = (h - 1) * 0.5;

      const ps = new Float32Array(vnum * 3);
      const uvs = new Float32Array(vnum * 2);
      const fis = new Uint32Array(6 * (w - 1) * (h - 1));
      let ft3 = 0;
      let ft2 = 0;
      for (let y = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x) {
          let d = depths[y][x];

          let x3 = (x - cx) * d / focal;
          let y3 = (y - cy) * d / focal;

          ps[ft3  ] = x3;
          ps[ft3+1] = -y3;
          ps[ft3+2] = -d;

          uvs[ft2  ] = x / (w - 1);
          uvs[ft2+1] = (h - 1 - y) / (h - 1);

          ft3 += 3;
          ft2 += 2;
        }
      }

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
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(ps, 3));
        geo.setIndex(new THREE.BufferAttribute(fis, 1));
        geo.computeVertexNormals();

        const map = new THREE.Texture(document.getElementById('img'));
        const mtl = new THREE.MeshStandardMaterial({
          map,
        });
        const m = new THREE.Mesh(geo, mtl);
        this.scene.add(m);
      }

    }

    console.log('makeFile leave', w, h);
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.init();
