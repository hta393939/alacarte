//import {BinParser, ColmapImage} from "../../../lib/colmap/colmapbin.js";
//import {Quaternion, Vector3} from "../../../lib/mathutil.js";


class Misc {
  static VERSION = '0.1.11';

  constructor() {
    this.param = {
      pointsize: 4,
      feature: 1,
      session: 'immersive-vr',
      ref: 'local-floor',
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
    for (const k of ['pointsize', 'feature',
      'session', 'ref',
    ]) {
      if (!search.has(k)) {
        continue;
      }
      let val = search.get(k) || true;
      try {
        val = JSON.parse(val);
      } catch (e) {
        // 何もしない
      }
      param[k] = val;
    }
    Object.assign(this.param, param);


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

    this.addMesh(scene);
  }

  addHandler() {

    {
      const el = document.getElementById('register');
      el?.addEventListener('click', () => {
        const qs = document.querySelectorAll('.feature');
        for (const q of qs) {
          const cb = q.querySelector('.enable');
          if (!cb?.checked) {
            continue;
          }
          const keyel = q.querySelector('.key');
          if (!keyel) {
            continue;
          }
          this.add(keyel.textContent);
        }
      });
    }

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
    this.log('onDrop', file.name);

    const pluginOptions = {
    };
    const result = await BABYLON.ImportMeshAsync(file, this.scene, pluginOptions);
    if (file.name.endsWith('.ply')) {
      const mesh = result.meshes?.[0];
      if (mesh) {
        mesh.name = file.name;
        const mtl = mesh.material;
        this.log('mesh, mtl', mesh, mtl);
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

    this.log('onDrop', file.name);
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

  /**
   * XR 初期化
   * @param {*} scene 
   */
  async initXR(scene) {
    this.log('initXR', this.param.session, this.param.ref);
    const xrHelper = await scene.createDefaultXRExperienceAsync(
      {uiOptions: {
        //sessionMode: 'inline',
        sessionMode: this.param.session,
        referenceSpaceType: this.param.ref,
      }},
    );
    xrHelper.baseExperience.onStateChangedObservable.add((state) => {
      switch (state) {
        case BABYLON.WebXRState.IN_XR:
          this.log('in_xr'); // inline では発火しないか?
          break;
        case BABYLON.WebXRState.ENTERING_XR:
          this.log('entering');
          break;
        case BABYLON.WebXRState.EXITING_XR:
          this.log('exiting');
          break;
        case BABYLON.WebXRState.NOT_IN_XR:
          this.log('not in XR');
          break;
      }
    });

    if (this.param.feature) {
      await this.initFeature(scene, xrHelper);
    }
  }

  async initFeature(scene, xrHelper) {
    const fms = BABYLON.WebXRFeaturesManager.GetAvailableFeatures();
    this.log('available', fms.length, fms);

    const featuresManager = xrHelper.baseExperience.featuresManager;
    this.featuresManager = featuresManager;
    if (!featuresManager) {
      return;
    }

    /** この時点では22個。そのうち1個増える */
    const keys = Object.keys(BABYLON.WebXRFeatureName);
    const isImm = true;
    /** inline では使用できないもの */
    const imms = [ // 9
      BABYLON.WebXRFeatureName.ANCHOR_SYSTEM,
      BABYLON.WebXRFeatureName.HIT_TEST, // experimental
      BABYLON.WebXRFeatureName.PLANE_DETECTION,
      BABYLON.WebXRFeatureName.HAND_TRACKING,
      BABYLON.WebXRFeatureName.DOM_OVERLAY,
      BABYLON.WebXRFeatureName.LIGHT_ESTIMATION,
      BABYLON.WebXRFeatureName.LAYERS,
      BABYLON.WebXRFeatureName.DEPTH_SENSING, // depthSensing が必要
      BABYLON.WebXRFeatureName.RAW_CAMERA_ACCESS,
    ];
    const diffs = [ // 6
      BABYLON.WebXRFeatureName.MESH_DETECTION,
      BABYLON.WebXRFeatureName.TELEPORTATION,

      BABYLON.WebXRFeatureName.WALKING_LOCOMOTION,

      BABYLON.WebXRFeatureName.IMAGE_TRACKING, // unsupported
      BABYLON.WebXRFeatureName.FEATURE_POINTS, // bjsfeature unrecog

      BABYLON.WebXRFeatureName.SPACE_WARP, // unrecog
    ];
    const disables = [ // 4
      BABYLON.WebXRFeatureName.PHYSICS_CONTROLLERS, // コントローラに物理衝突判定
      BABYLON.WebXRFeatureName.EYE_TRACKING, // unrecog, アイトラ
      BABYLON.WebXRFeatureName.BODY_TRACKING, // unrecog, ボディトラッキング
      BABYLON.WebXRFeatureName.MOVEMENT, // 他のものを推奨される
    ];

    const parent = document.body;
    const template = document.getElementById('selecttemplate');

    for (const k of keys) {
      const val = BABYLON.WebXRFeatureName[k];

      const clone = document.importNode(
        template.content, true);
      {
        const q = clone.querySelector('.key');
        if (q) {
          q.textContent = `${k}`;
        }
      }
      parent.appendChild(clone);

      if (disables.includes(val)) {
        this.log('skip disable', val);
        continue;
      }

      if (diffs.includes(val)) {
        this.log('skip diff', val);
        continue;
      }
      if (!isImm) {
        if (imms.includes(val)) {
          this.log('skip inline', val);
          continue;
        }
      }

      const opt = {};
      if (['POINTER_SELECTION',
        'TELEPORTATION',
        'HAND_TRACKING',
        'NEAR_INTERACTION',
        'MOVEMENT',
        'PHYSICS_CONTROLLERS',
      ].includes(k)) {
        opt['xrInput'] = xrHelper.input;
      }      
      const mod = featuresManager.enableFeature(
        val,
        'latest',
        opt,
        true,
        false, // false だと必須ではない
      );
      mod.onFeatureAttachObservable.add((ifeat) => {
        // 開始前からアタッチできるものもある
        this.log('attach', k, ifeat);
      });
      this.log('enable', k);
    }
  }

  /**
   * 
   * @param {string} key WebXRFeatureName のキー 
   */
  add(key) {
    const featuresManager = this.featuresManager;
    const opt = {};
    if (['POINTER_SELECTION',
      'TELEPORTATION',
      'HAND_TRACKING',
      'NEAR_INTERACTION',
      'MOVEMENT',
      'PHYSICS_CONTROLLERS',
    ].includes(key)) {
      opt['xrInput'] = xrHelper.input;
    }


    const val = BABYLON.WebXRFeatureName[key];
    const mod = featuresManager.enableFeature(
      val,
      'latest',
      opt,
      true,
      false, // false だと必須ではない
    );
    mod.onFeatureAttachObservable.add((ifeat) => {
      // 開始前からアタッチできるものもある
      this.log('add attach', key, ifeat);
    });
    this.log('add enable', key);
  }

  addMesh(scene) {
    for (let i = 0; i < 20; ++i) {
      const m = BABYLON.MeshBuilder.CreateBox(`box${i}`, {
        width: 0.1, height: 0.2, depth: 0.1,
      }, scene);
      m.position = new BABYLON.Vector3(Math.random(), 1 + Math.random, Math.random());
      const mtl = new BABYLON.StandardMaterial(`m${i}`, scene);
      mtl.diffuseColor = new BABYLON.Color3(1, Math.random() * 0.5 + 0.5, Math.random() * 0.5);
      m.material = mtl;
    }
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
