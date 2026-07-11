
class Misc {
  constructor() {
    this.consoles = [];
    /** 論理幅 */
    this.logicW = 960;
    /**
     * 論理高さ
     */
    this.logicH = 540;

    this.ts = [];
    this.textLabels = [];
  }

  _pad(v, n = 2) {
    return new String(v).padStart(n, '0');
  }

  async initialize() {
    this.setListener();

    await this.initGl(window.maincanvas);
    await this.readyObject(this.scene);
    await this.initPhy();
    await this.readyRigid(this.scene);
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

    const engine = new BABYLON.Engine(canvas, {
      preserveDrawingBuffer: true,
    });
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
      {
        const now = Date.now();
        this.ts = this.ts.filter(t => (now - t) < 2000);
        const n = this.ts.length;
        const fps = (n >= 1) ? (n / 2) : 0;
        this.ts.push(now);

        const tl = this.textLabels[0];
        if (tl) {
          tl.text = `${fps.toFixed(1)}`;
        }
      }


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
    const manager = new BABYLON.GUI.GUI3DManager(scene);
    {
      const panel = new BABYLON.GUI.StackPanel3D();
      manager.addControl(panel);
      panel.position = new BABYLON.Vector3(0, 0.5, 1);

      for (let i = 0; i < 3; ++i) {
        const but = new BABYLON.GUI.Button3D(`but${i}`);
        but.position = new BABYLON.Vector3(i - 1, 2, 0);
        but.scaling = new BABYLON.Vector3(1, 0.4, 0.2);

        const tb = new BABYLON.GUI.TextBlock();
        tb.text = `${i}`;
        tb.color = 'red';
        tb.fontSize = (i === 0) ? 100 : 40;
        tb.resizeToFit = true;
        but.content = tb;

        console.log('but', but);
        panel.addControl(but);

        but.onPointerClickObservable.add(() => {
          console.log(`click`, i);
          tb.text = `${new Date().toISOString()}`;
        });

        this.textLabels.push(tb);
      }

    }
  }

  async initPhy() {
    const instance = await HavokPhysics({
      locateFile: file => `./havok/${file}`,
    });
    const plugin = new BABYLON.HavokPlugin(true, instance);
    this.scene.enablePhysics(
      new BABYLON.Vector3(0, -9.81, 0),
      plugin,
    );
  }

  async readyRigid(scene) {
    {
      const m = BABYLON.MeshBuilder.CreateBox(
        'floor1',
        {width: 10, height: 0.2, depth: 10},
        scene);
      m.position.y = -0.25;
      const pa = new BABYLON.PhysicsAggregate(
        m,
        BABYLON.PhysicsShapeType.BOX,
        { mass: 0, restitution: 1, friction: 0.8 },  // mass:0 = 静的
        scene,  
      );

    }
    const rigids = [];
    for (let i = 0; i < 3; ++i) {
      const m = BABYLON.MeshBuilder.CreateBox(
        `box${i}`,
        {width: 0.1, height: 0.2, depth: 0.08},
        scene,
      );
      m.position = new BABYLON.Vector3(i - 1, 3, 0);
      const pa = new BABYLON.PhysicsAggregate(
        m,
        BABYLON.PhysicsShapeType.BOX,
        { mass: 2.0, restitution: 0.2, friction: 0.8 },  // mass:0 = 静的
        scene,  
      );
      rigids.push(pa);
    }

    {
      /*
// 【例1】Ball & Socket（球関節：自由に回転）
const ballJoint = new BABYLON.PhysicsConstraint(
    BABYLON.PhysicsConstraintType.BALL_AND_SOCKET,
    boxAggregate.body,      // Main Body
    sphereAggregate.body,   // Connected Body
    scene
);

// 接続位置（ローカル座標）
ballJoint.setAnchorInMain(new BABYLON.Vector3(0.5, 0.5, 0));   // boxの右上あたり
ballJoint.setAnchorInConnected(new BABYLON.Vector3(0, -0.6, 0)); // sphereの下側

// 【例2】Hinge（蝶番：1軸回転）
const hingeJoint = new BABYLON.PhysicsConstraint(
    BABYLON.PhysicsConstraintType.HINGE,
    boxAggregate.body,
    sphereAggregate.body,
    scene
);

hingeJoint.setAnchorInMain(new BABYLON.Vector3(0.5, 0, 0));
hingeJoint.setAnchorInConnected(new BABYLON.Vector3(-0.6, 0, 0));
hingeJoint.setAxisInMain(new BABYLON.Vector3(0, 0, 1));     // Z軸回転
hingeJoint.setAxisInConnected(new BABYLON.Vector3(0, 0, 1));
*/
    }

  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
