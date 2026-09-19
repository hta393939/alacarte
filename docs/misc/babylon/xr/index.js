import {BinParser, ColmapImage} from "../../../lib/colmap/colmapbin.js";
import {Quaternion, Vector3} from "../../../lib/mathutil.js";


class Misc {
  static VERSION = '0.1.0';

  constructor() {
    this.param = {
      pointsize: 4,
    };

    this.lines = [];
  }

  log(...args) {
    console.log(...args);
    const line = args.join(', ');
    this.lines.unshift(line);
    const el = document.getElementById('consoleview');
    if (!el) {
      return;
    }
    el.innerHTML = this.lines.join('<br />');
  }

  initialize() {
    {
      const el = document.getElementById('versionview');
      if (el) {
        el.textContent = Misc.VERSION;
      }
    }

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
      //BABYLON.Inspector.Show(scene, {});
    }

    this.addHandler();

    this.initXR(scene);
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
    el?.addEventListener('drop', async ev => {
      ev.preventDefault();
      ev.stopPropagation();
      ev.dataTransfer.dropEffect = 'link';
      for (const file of ev.dataTransfer.files) {
        await this.onDrop(file);
      }
    });
  }

  /**
   * 共通にロードする
   * @param {File} file 
   */
  async onDrop(file) {
    console.log('onDrop', file.name);

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

  async initXR(scene) {
    // 
    const xrHelper = await scene.createDefaultXRExperienceAsync(
      {uiOptions: {sessionMode: 'inline'}},
    );
    xrHelper.onStateChangedObservable.add((state) => {
      switch (state) {
          case WebXRState.IN_XR:
              this.log('// XR is initialized and already submitted one frame');
              break;
          case WebXRState.ENTERING_XR:
              // xr is being initialized, enter XR request was made
          case WebXRState.EXITING_XR:
              // xr exit request was made. not yet done.
          case WebXRState.NOT_IN_XR:
            console.log('// self explanatory - either out or not yet in XR');
              break;
      }
    });

    await this.initFeature(scene, xrHelper);

  }

  async initFeature(scene, xrHelper) {
    const fms = BABYLON.WebXRFeaturesManager.GetAvailableFeatures();
    this.log('available', fms);

    const featuesManager = xrHelper.baseExperience.featuresManager;
    if (!featuesManager) {
      return;
    }

    {
      const mod = featuresManager.enableFeature(
        BABYLON.WebXRFeature.PLANE_DETECT,
        'latest',
        {},
      );
      mod.onFeatureStartObservable.add((...args) => {
        this.log(...args);
      });
    }
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
