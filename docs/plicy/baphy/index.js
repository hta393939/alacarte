
class Misc {
  constructor() {
    this.consoles = [];
    /** 論理幅 */
    this.logicW = 960;
    /**
     * 論理高さ
     */
    this.logicH = 540;
  }

  _pad(v, n = 2) {
    return new String(v).padStart(n, '0');
  }

  async initialize() {
    this.setListener();

    await this.initGl(window.maincanvas);
    await this.readyObject(this.scene);
    await this.initPhy();
  }

  async log(...args) {
    const d = new Date();
    const text = `${d.toLocaleTimeString()}.${new String(d.getMilliseconds()).padStart(3, '0')},` + args.join(',');
    this.consoles.unshift(text);
    const el = document.getElementById('console');
    if (!el) {
      return;
    }
    const br = document.createElement('br');
    el.insertBefore(br, el.firstChild);
    const node = document.createTextNode(text);
    el.insertBefore(node, el.firstChild);
  }

  setListener() {
    {
      const el = document.body;
      el?.addEventListener('dragover', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'none';
      });
      el?.addEventListener('drop', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.dataTransfer.dropEffect = 'none';
      });
    }
    {
      const el = document.querySelector('.drop');
      el?.addEventListener('dragover', ev => {
        ev.stopPropagation();
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'copy';
      });
      el?.addEventListener('drop', ev => {
        ev.stopPropagation();
        ev.preventDefault();
        this.onDrop(ev.dataTransfer.files[0]);
      });
    }

    for (const k of ['startcount', 'addcount', 'outcount']) {
      const el = document.getElementById(k);
      if (!el) {
        continue;
      }
      const _update = () => {
        const val = Number.parseFloat(el.value);
        const viewel = document.getElementById(`${k}view`);
        if (viewel) {
          viewel.textContent = `${val}`;
        }
      };
      el?.addEventListener('input', _update);
      _update();
    }

  }

  gatherParam() {
    const param = {};
    for (const k of ['toply']) {
      const el = document.getElementById(`${k}`);
      if (!el) {
        continue;
      }
      param[k] = el?.checked || false;
    }
    return param;
  }

  /**
   * 
   * @param {HTMLCanvasElement} canvas 
   */
  initGl(canvas) {
    canvas.width = this.logicW;
    canvas.height = this.logicH;

    const engine = new BABYLON.Engine(canvas);
    this.engine = engine;
    const scene = new BABYLON.Scene(engine);
    this.scene = scene;

    scene.useRightHandedSystem = true;
    {
      const camera = new BABYLON.ArcRotateCamera('camera1',
        0, 0, 10, new BABYLON.Vector3(0, 0, 0),
        scene,
      );
      this.camera = camera;
      camera.position = new BABYLON.Vector3(0.5, 0.5, 5);
      camera.wheelPrecision = 20;
      camera.attachControl();
    }

    {
      const light = new BABYLON.HemisphericLight(
        'hlight',
        new BABYLON.Vector3(0.75, 0.5, 1),
        scene,
      );
    }

    {
      const axes = new BABYLON.Debug.AxesViewer(
        scene,
        5,
      );
    }

    {
      const m = BABYLON.MeshBuilder.CreateBox(
        'box1',
      {width: 0.4, height: 0.6, depth: 0.2},
      scene);
    }

    engine.runRenderLoop(() => {
      this.analyzePads();

      scene.render(this.camera);
    });
  }

  analyzePads() {
    const pads = navigator.getGamepads();
    for (const pad of pads) {
      if (!pad) {
        continue;
      }

      // TODO: 取得
    }
  }

  async readyObject(scene) {
    {
      const gui3D = BABYLON.GUI.AdvancedDynamicTexture
        .CreateFullscreenUI(
          'UI', true, scene,
        );

      const but = new BABYLON.GUI.Button3D('but1');
      but.position = new BABYLON.Vector3(2, 2, 0);
      but.scaling = new BABYLON.Vector3(1, 0.2, 0.2);

      const tb = new BABYLON.GUI.TextBlock();
      but.content = tb;

      gui3D.addControl(but);

      but.onPointerClickObservable.add(() => {
        console.log('click');
        tb.text = `${new Date().toISOString()}`;
      });
    }
  }

  async initPhy() {
    const instance = await HavokPhysics({
      locateFile: file => file.endsWidth('.wasm'),
    });
    const plugin = new BABYLON.HavokPlugin(true, instance);
    this.scene.enablePhysics(
      new BABYLON.Vector3(0, -9.81, 0),
      plugin,
    );
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
