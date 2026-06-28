import {BinParser, ColmapImage} from "../../../lib/colmap/colmapbin.js";
import {Quaternion, Vector3} from "../../../lib/mathutil.js";


class Misc {
  constructor() {
    this.param = {
      pointsize: 4,
    };
  }

  initialize() {
    const search = new URLSearchParams(location.search);
    const param = {};
    for (const k of ['pointsize']) {
      if (!search.has(k)) {
        continue;
      }
      let val = search.get(k);
      try {
        val = Number.parseFloat(val);
        param[k] = val;
      } catch (e) {

      }
    }
    this.param = param;


    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById('maincanvas');
    canvas.width = 512;
    canvas.height = 288;
    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
    });
    this.engine = engine;
    const scene = new BABYLON.Scene(engine);
    this.scene = scene;
    scene.useRightHandedSystem = true;

    const camera = new BABYLON.ArcRotateCamera('camera',
      0, 0, 10, new BABYLON.Vector3(0, 0.5, 0),
      scene,
    );
    camera.position = new BABYLON.Vector3(-2, 1, 5);
    //camera.position = new BABYLON.Vector3(0, 1, 2);
    camera.wheelPrecision = 20;
    //camera.wheelDeltaPercentage = 0.01;
    camera.minZ = 0.01;
    camera.upVector = new BABYLON.Vector3(0, -1, 0);
    camera.attachControl();

    {
      const light = new BABYLON.HemisphericLight('light',
        new BABYLON.Vector3(-0.75, 1, 0.5),
        scene,
      );
    }

    {
      const axes = new BABYLON.Debug.AxesViewer(scene, 5);
    }

    {
      const box = BABYLON.MeshBuilder.CreateBox('box', {
        width: 0.2, height: 0.3, depth: 0.4,
      }, scene);
    }

    engine.runRenderLoop(() => {
      scene.render();
    });

    //this.load(scene);

    {
      BABYLON.Inspector.Show(scene, {});
    }

    this.addHandler();
  }

  addHandler() {

    /*
    for (const k of ['dragover', 'drop']) {
      document.body.addEventListener(k, ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'none';
      });
    } */

    //const el = document.querySelector('.drop');
    const el = document.body;
    el?.addEventListener('dragover', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      ev.dataTransfer.dropEffect = 'link';
    });
    el?.addEventListener('drop', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      ev.dataTransfer.dropEffect = 'link';
      this.onDrop(ev.dataTransfer.files[0]);
    });
  }

  /**
   * 共通にロードする
   * @param {File} file 
   */
  async onDrop(file) {
    console.log('onDrop', file.name);
    if (file.name === 'images.bin') {
      this.onImages(file);
      return;
    }

    const pluginOptions = {
    };
    const result = await BABYLON.ImportMeshAsync(file, this.scene, pluginOptions);
    if (file.name.endsWith('.ply')) {
      const mesh = result.meshes?.[0];
      if (mesh) {
        mesh.name = file.name;
        const mtl = mesh.material;
        console.log('mesh, mtl', mesh, mtl);
        if (!mtl) {
          const material = new BABYLON.MeshStandardMaterial('mtl1', this.scene);
          mesh.material = material;
        }
        //const el = document.getElementById('pointsize');
        //const size = Number.parseFloat(el?.value);

        const size = this.param.pointsize;
        if (Number.isFinite(size)) {
          mesh.material.pointSize = size;
        }
      }
    }

    console.log('onDrop', file.name);
  }

  /**
   * images.bin を受け取った場合の追加処理
   * @param {File} file 
   */
  async onImages(file) {
    console.log('onImages');

    const ab = await file.arrayBuffer();
    const parser = new BinParser();
    const images = parser.parseImage(ab, false);
    const num = images.images.length;
    const scene = this.scene;
    for (let i = 0; i < num; ++i) {
      /** @type {ColmapImage} */
      const img = images.images[i];
      {
        const node = new BABYLON.TransformNode(`${i}`, scene);
        {
          const cyl = BABYLON.MeshBuilder.CreateCylinder(`cyl${i}`, {
            height: 0.02,
            diameterTop: 0,
            diameterBottom: 0.02,
          }, scene);
          cyl.parent = node;
        }
        {
          const sph = BABYLON.MeshBuilder.CreateSphere(`sph${i}`, {
            diameter: 0.02,
            radius: 0.02,
          }, scene);
          sph.position = new BABYLON.Vector3(0, 0, 0.1); // カメラ目線延長先
          sph.parent = node;
        }

        const vec = new Vector3(0, 0, 0).add(1, new Vector3(...img.t), -1);
        const conj = Quaternion.fromTopW(...img.wtop).conjugate();
        const origin = conj.rot(vec);
        node.position = origin;
        node.rotationQuaternion = conj;
      }
    }
  }

  /**
   * 
   * @param {BABYLON.Scene} scene 
   */
  async load(scene) {
    console.log('load');
    let url = './Zundamon_2025_VRM10A.vrm';
    const res = await fetch(url);
    const file = await res.blob();
    file.name = 'placeholder.glb';

    let gltf = {};
    const pluginOptions = {
      gltf: {
        /*
          extensionOptions: {
            VRM: {
              enabled: true,
              option1: 'hello world',
              option2: 42,
            }
          }, */
        /** @param {{bin: Object, json: Object}} loaderData */
        onParsed: (loaderData) => {
          console.log('onParsed', loaderData);
          gltf = loaderData;
        }
      }
    };

    /*
    BABYLON.LoadSceneAsync(url, scene.engine, {
      pluginOptions,
    }); */

    const result = await BABYLON.ImportMeshAsync(file, scene, {
      pluginOptions,
    });

    console.log('ImportMeshAsync', result);

    const vrm1 = gltf.json.extensions['VRMC_vrm'];
    { // ボーン
      const boneName = 'leftUpperArm';
      const hb = vrm1.humanoid.humanBones[boneName];
      const bone = gltf.json.nodes[hb.node];
      const node = bone._babylonTransformNode;
      node.rotation = new BABYLON.Vector3(Math.PI * 60 / 180, 0, 0);
    }
    { // 表情
      const rate = 1;
      const emoName = 'happy';
      const emo = vrm1.expressions.preset[emoName];
      for (const mb of emo.morphTargetBinds) {
        const node = gltf.json.nodes[mb.node];
        for (const mesh of node._primitiveBabylonMeshes) {
          const mtm = mesh.morphTargetManager;
          if (!mtm) {
            continue;
          }
          const target = mtm.getTarget(mb.index);
          target.influence = mb.weight * rate;
        }
      }
    }

  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
