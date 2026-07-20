
class Misc {
  static STATUS_TITLE = 'title';
  static STATUS_PRECOUNT = 'precount';
  static STATUS_INGAME = 'ingame';
  static STATUS_TIMEUP = 'timeup';

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

    this.status = Misc.STATUS_TITLE;

    this.prePadIndex = -1;
    this.count = 0;

    this.objAmb = new BABYLON.Color3(0.25, 0.25, 0.25);
  }

  async initialize() {
    this.setListener();

    await this.initGl(window.maincanvas);
    await this.readyObject(this.scene);
    await this.initPhy();
    await this.readyRigid(this.scene);

    const arm = await this.makeBoneArm(this.scene);
    this.arm = arm;
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
      camera.position = new BABYLON.Vector3(0.5, 0.5, 2);
      camera.wheelPrecision = 20 * 2;
      camera.maxZ = 100;
      camera.minZ = 0.02;
      camera.attachControl();
    }

    if (true) {
      const light = new BABYLON.HemisphericLight(
        'hlight',
        new BABYLON.Vector3(0.75, 0.5, 1),
        scene,
      );
      light.intensity = 0.125;
    }
    { // NOTE: 環境光ベース
      scene.ambientColor = new BABYLON.Color3(1, 1, 1);
    }

    { // @see https://doc.babylonjs.com/typedoc/classes/BABYLON.PointLight
      const light = new BABYLON.PointLight(
        'plight',
        new BABYLON.Vector3(0, 2, 0.5), // position
        scene,
      );
      light.intensity = 0.5;
      const sg = new BABYLON.ShadowGenerator(1024, light);
      this.sg = sg;
    }

    if (false) {
      const axes = new BABYLON.Debug.AxesViewer(
        scene,
        5,
      );
    }
    {
      BABYLON.Inspector.Show(
        scene, {overlay:true}
      );
    }


    engine.runRenderLoop(() => {
      this.prerender();

      scene.render(this.camera);
    });
  }

  prerender() {
    { // 簡易フレームレートの計算
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

    {
      const result = this.analyzePads();
      this.applyMove(result);
      const tl = this.textLabels[1];
      if (tl) { // 0 を許す
        tl.text = `${result?.index ?? -1}(${this.prePadIndex})`;
      }
    }

    {
      const now = Date.now();
      const val = (now % 10000) / 10000;
      const rot = new BABYLON.Vector3(val * Math.PI * 2, 0, 0);
      const arm = this.arm;
      if (Array.isArray(arm)) {
        for (const node of arm) {
          const body = node.agg?.body;
          const axisVec = node.axisVec;
          const dirVec = node.dirVec;
          if (!body || (!axisVec && !dirVec)) {
            continue;
          }
          if (axisVec) {
            node.ct.setAxisMotorTarget(
              BABYLON.PhysicsConstraintAxis.ANGULAR_X,
              val * Math.PI * 2,
            );
          }

          if (dirVec) {
            const p = dirVec;
            node.ct.setAxisMotorTarget(
              BABYLON.PhysicsConstraintAxis.LINEAR_X,
              val,
            );
          }

        }

        /**
         * @see https://doc.babylonjs.com/typedoc/classes/_babylonjs_core.TransformNode
         */

      }
    }
  }

  applyMove(pad) {
    if (!pad) {
      return;
    }

    { // TODO: 関節などに適用する
    }
    {

    }
    {

    }
    {

    }

  }

  /**
   * 
   */
  analyzePads() {
    const standards = [];
    const others = [];

    const pads = navigator.getGamepads();
    for (let i = 0; i < pads.length; ++i) {
      const pad = pads[i];
      if (!pad) {
        continue;
      }
      if (pad.mapping === 'standard') {
        standards.push(pad);
      } else {
        others.push(pad);
      }
    }
    // 'standard' 優先
    const targets = (standards.length >= 1) ? standards : others;
    // その後はインデックス優先
    let index = targets.findIndex(pad => pad.index === this.prePadIndex);
    if (index < 0) {
      index = 0;
    }
    /** @type {Gamepad} */
    const curPad = targets[index];
    if (curPad) { // 有効情報の場合のみ更新する
      this.prePadIndex = curPad.index;
    }
    return curPad;
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

          if (i === 2) {
            this.addEights(this.scene);
          }
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
      m.receiveShadows = true;
      m.position = new BABYLON.Vector3(0, -0.1, 0);
      const pa = new BABYLON.PhysicsAggregate(
        m,
        BABYLON.PhysicsShapeType.BOX,
        // mass 0 で動かない
        { mass: 0, restitution: 0.1, friction: 0.8 },
        scene,  
      );

      this.floorpa = pa;
    }
    const rigids = [];
    for (let i = 0; i < 3; ++i) {
      const m = BABYLON.MeshBuilder.CreateCapsule(
        `box${i}`,
        {radius: 0.05, height: 0.2},
        scene,
      );
      const mtl = new BABYLON.StandardMaterial(
        this.oid('m'),
        scene,
      );
      mtl.ambientColor = this.objAmb;
      m.material = mtl;

      this.sg.addShadowCaster(m);
      m.position = new BABYLON.Vector3(i - 1, 3, 0);
      // 回転は入ったがどっちだ??
      //m.rotation = new BABYLON.Vector3(Math.PI * 0.5, 0, 0);

      const pa = new BABYLON.PhysicsAggregate(
        m,
        BABYLON.PhysicsShapeType.CAPSULE,
        { mass: 2.0, restitution: 0.1, friction: 0.8 },  // mass:0 = 静的
        scene,  
      );
      rigids.push(pa);
    }

    { // 距離が0.5
      const ct = new BABYLON.LockConstraint(
        new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0.5, 0, 0),
        new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(1, 0, 0),
        scene,
      );
      rigids[0].body.addConstraint(rigids[1].body, ct);
    }

    {

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

  /**
   * 10個の八面体を追加する
   * @param {*} scene 
   */
  addEights(scene) {
    for (let i = 0; i < 5; ++i) {
      const result = this.makeEight(scene);
      result.mesh.position = new BABYLON.Vector3(i - 2, 1 + Math.random(), 0);
    }
    for (let i = 0; i < 5; ++i) {
      const result = this.makeEight(scene);
      result.mesh.position = new BABYLON.Vector3(i - 2, 1 + Math.random(), -1);
      const mtl = new BABYLON.StandardMaterial(`${i}i1`, scene);
      mtl.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
      result.mesh.material = mtl;
    }
  }

  /**
   * 1つの八面体を作成する
   * @param {*} scene 
   * @returns 
   */
  makeEight(scene) {
    const scale = 0.08;
    const vd = new BABYLON.VertexData();
    const n = 6;
    const ps = new Float32Array(n * 3);
    const ns = new Float32Array(n * 3);
    const fis = new Uint16Array(8 * 3);
    for (let i = 0; i < 6; ++i) {
      const pos = [
        [0, 1, 0],
        [1, 0, 0],
        [0, 0, 1],
        [-1, 0, 0],
        [0, 0, -1],
        [0, -1, 0],
      ];
      const p = pos[i];
      ns[i * 3] = p[0];
      ns[i * 3 + 1] = p[1];
      ns[i * 3 + 2] = p[2];
      ps[i * 3] = p[0] * scale;
      ps[i * 3 + 1] = p[1] * scale;
      ps[i * 3 + 2] = p[2] * scale;
    }
    for (let i = 0; i < 24; ++i) {
      fis[i] = [
        0, 1, 2,
        0, 2, 3,
        0, 3, 4,
        0, 4, 1,
        5, 2, 1,
        5, 3, 2,
        5, 4, 3,
        5, 1, 4,
      ][i];
    }
    vd.positions = ps;
    vd.normals = ns;
    vd.indices = fis;
    const m = new BABYLON.Mesh(`${Math.random()}`, scene);
    vd.applyToMesh(m);
    this.sg.addShadowCaster(m);

    const pa = new BABYLON.PhysicsAggregate(
      m,
      BABYLON.PhysicsShapeType.CONVEX_HULL,
      {mass: 2},
      scene,
    );

    return {mesh: m};
  }

  oid(top = 'o') {
    this.count += 1;
    return `${top}${this.count}`;
  }

  /**
   * ランダムカラー
   */
  rc() {
    return new BABYLON.Color3(Math.random(), Math.random(), Math.random());
  }

  /**
   * 実装してない
   * 旋回、仰角、仰角、ねじり、仰角、ねじり、はさむ
   * むしろモデルファイル作るか???
   * @param {*} scene 
   */
  makeArm(scene) {
    const parts = [
      {p: [0, 0.1, 0], s: [0.1, 0.4, 0.1], parent: -1}, // ベース
      {p: [0, 0.3, 0], s: [0.1, 0.4, 0.1], parent: 0}, // 
      {p: [0, 0.5, 0], s: [0.1, 0.4 ,0.1], parent: 1},
      {p: [0, 0.7, 0], s: [0.1, 0.4, 0.1], parent: 2},
      {p: [0, 0.7, 0.4], s: [0.1, 0.4, 0.1], parent: 3},
      {p: [0, 0.7, 0.4], s: [0.1, 0.4, 0.1], parent: 4},
      {p: [0, 0.7, 0.4], s: [0.1, 0.4, 0.1], parent: 5},
      {p: [-0.2, 0.5, 0.4], s: [0.2, 0.4, 0.4], parent: 6},
      {p: [ 0.2, 0.5, 0.4], s: [0.2, 0.4, 0.4], parent: 6},
    ];
    const arms = [];
    for (let i = 0; i < parts.length; ++i) {
      const part = parts[i];
      const tn = new BABYLON.TransformNode(`${i}tn`, scene);


      const m = BABYLON.MeshBuilder.CreateBox(`${i}b`,
        {width: part.s[0], height: part.s[1], depth: part.s[2]},
        scene,
      );
      m.position = BABYLON.Vector3.FromArray(part.p);
      const pa = new BABYLON.PhysicsAggregate(
        m,
        BABYLON.PhysicsShapeType.BOX,
        {mass: 0},
        scene,
      );
      // 親登録．ヒンジかノード親か
      let index = i - 1;
      if (i !== 0) {
        if (i === 6) {
          index = 4;
        }
        arms[index].mesh.addChild(m);
      }

      arms.push({mesh: m, pa,});
    }
  }

  /**
   * 旋回、仰角、仰角、ねじり、仰角、ねじり、はさむ
   * これはボーンでやるタイプ
   * @param {*} scene 
   */
  makeBoneArm(scene) {
    console.log('makeBoneArm', 'bone でやる');
    const armDia = 0.04;
    const jointDia = 0.04;
    const jointWidth = 0.04;
    const parts = [
      { // #0 ベース
        p: [0, 0.05, 0], dir: [0,0,0], parent: -1, axis: [0, 0, 0],
        type: 'cyl', s:[armDia * 2, 0.1, armDia * 2], deg:[0,0],
      },
      { // #1 回転
        p: [0, 0.15, 0], dir: [0,0,0], parent: 0, axis: [0, 1, 0],
        type: 'cyl', s:[armDia, 0.1, armDia], deg:[-180,180],
      },
      { // #2 仰角
        p: [0, 0.2, 0], dir: [0,0,0], axis: [1, 0, 0], parent: 1,
        type: 'box', s:[jointWidth, jointDia, jointDia], deg:[-135,0],
      },
      { // #3 腕
        p: [0, 0.2, 0.1], dir: [0,0,0], axis: [0, 0, 0], parent: 2,
        type: 'box', s:[armDia, armDia, 0.2 - jointDia], deg:[0,0],
      },
      { // #4 仰角
        p: [0, 0.2, 0.2], dir: [0,0,0], parent: 2, axis: [1, 0, 0],
        type: 'box', s:[jointWidth, jointDia, jointDia], deg:[0,135],
      },
      { // #5 腕
        p: [0, 0.2, 0.25], dir: [0,0,0], parent: 4, axis: [0, 0, 0],
        type: 'box', s:[armDia, armDia, 0.1 - jointDia], deg:[0,0],
      },
      { // #6 ねじり
        p: [0, 0.2, 0.35], dir: [0,0,0], parent: 5, axis: [0, 0, 1],
        type: 'box', s:[armDia, armDia, 0.1 - jointDia], deg:[0,0], 
      },
      { // #7 仰角
        p: [0, 0.2, 0.4], dir: [0,0,0], parent: 5, axis: [1, 0, 0],
        type: 'box', s:[jointWidth, jointDia, jointDia], deg:[-180,0],
      },
      { // #8 腕
        p: [0, 0.15, 0.4], dir: [0,0,0], parent: 7, axis: [0, 0, 0],
        type: 'cyl', s:[armDia, 0.1 - jointDia, armDia], deg:[0,0],
      },
      { // #9 ハサミ
        p: [0, 0.1, 0.4], dir: [0,0,0], parent: 7, axis: [0, 1, 0],
        type: 'box', s:[0.2, 0.02, 0.05], deg:[-180,180],
      },
      { // #10 X-
        p: [-0.1, 0.05, 0.4], dir: [1, 0, 0], parent: 9, axis: [0, 0, 0],
        type: 'cyl', s:[0.01, 0.1 - 0.02, 0.01], deg:[0,0],
      },
      { // #11 X+
        p: [ 0.1, 0.05, 0.4], dir: [-1, 0, 0], parent: 9, axis: [0, 0, 0],
        type: 'cyl', s:[0.01, 0.1 - 0.02, 0.01], deg:[0,0],
      },
    ];
    const arms = [];
    for (let i = 0; i < parts.length; ++i) {
      const part = parts[i];
      const tn = new BABYLON.TransformNode(this.oid(), scene);

      // 親登録．ノード親か
      let vec = BABYLON.Vector3.FromArray(part.p);
      let diffv = BABYLON.Vector3.Zero();
      let index = part.parent;
      if (index >= 0) {
        // NOTE: ボーンツリーを構成する場合
        tn.parent = arms[index].node;
      } else {
        tn.parent = this.floorpa.transformNode;
      }
      diffv = vec.subtract(tn.parent.absolutePosition);
      tn.position = diffv;

      let axisVec = part.axis ? BABYLON.Vector3.FromArray(part.axis) : null;
      if (axisVec?.length === 0) {
        axisVec = null;
      }

      const arm = {
        node: tn,
        axis: part.axis,
        aggs: [],
        dir: part.dir || [0,0,0]};
      arms.push(arm);

      {
        const info = part;

        let m = null;
        let shapeType = '';
        switch (part.type) {
          case 'cyl':
            shapeType = BABYLON.PhysicsShapeType.CYLINDER;
            m = BABYLON.MeshBuilder.CreateCylinder(this.oid(),
              {diameterTop: part.s[0],
                height: part.s[1],
                diameterBottom: part.s[2]},
              scene);
            break;
          case 'box':
            shapeType = BABYLON.PhysicsShapeType.BOX;
            m = BABYLON.MeshBuilder.CreateBox(this.oid(),
              {width: part.s[0], height: part.s[1], depth: part.s[2]},
              scene);
            break;
          case 'cap':
            shapeType = BABYLON.PhysicsShapeType.CAPSULE;
            m = BABYLON.MeshBuilder.CreateCapsule(
              this.oid(),
              {radium: part.s[0],
                height: part.s[1],},
              scene,
            );
            break;
        }
        const mtl = new BABYLON.StandardMaterial(this.oid(), scene);
        mtl.diffuseColor = this.rc();
        mtl.ambientColor = this.objAmb;
        m.material = mtl;

        m.parent = tn;

        this.sg.addShadowCaster(m);

        /*
        const pa = new BABYLON.PhysicsAggregate(
          m,
          shapeType,
          {mass: 2.0}, // NOTE: 重さを 2.0 にすると??
          scene,
        );

        arm.aggs.push(pa);
        */
      }

    }
    return arms;
  }

  /**
   * Constraint フルでやろうとしたら全然ダメだったもの
   * @param {*} scene 
   */
  makeBoneArmConstraint(scene) {
    console.log('makeBoneArmConstraint', 'constraint でやる');
    const armDia = 0.04;
    const jointDia = 0.04;
    const jointWidth = 0.04;
    /** 剛体パーツ */
    const parts = [
      { // #0 ベース
        p: [0, 0.05, 0], dir: [0,0,0], parent: -1, axis: [0, 0, 0],
        type: 'cyl', s:[armDia * 2, 0.1, armDia * 2], deg:[0,0],
      },
      { // #1 回転
        p: [0, 0.15, 0], dir: [0,0,0], parent: 0, axis: [0, 1, 0],
        type: 'cyl', s:[armDia, 0.1, armDia], deg:[-180,180],
      },
      { // #2 仰角
        p: [0, 0.2, 0], dir: [0,0,0], axis: [1, 0, 0], parent: 1,
        type: 'box', s:[jointWidth, jointDia, jointDia], deg:[-135,0],
      },
      { // #3 腕
        p: [0, 0.2, 0.1], dir: [0,0,0], axis: [0, 0, 0], parent: 2,
        type: 'box', s:[armDia, armDia, 0.2 - jointDia], deg:[0,0],
      },
      { // #4 仰角
        p: [0, 0.2, 0.2], dir: [0,0,0], parent: 2, axis: [1, 0, 0],
        type: 'box', s:[jointWidth, jointDia, jointDia], deg:[0,135],
      },
      { // #5 腕
        p: [0, 0.2, 0.25], dir: [0,0,0], parent: 4, axis: [0, 0, 0],
        type: 'box', s:[armDia, armDia, 0.1 - jointDia], deg:[0,0],
      },
      { // #6 ねじり
        p: [0, 0.2, 0.35], dir: [0,0,0], parent: 5, axis: [0, 0, 1],
        type: 'box', s:[armDia, armDia, 0.1 - jointDia], deg:[0,0], 
      },
      { // #7 仰角
        p: [0, 0.2, 0.4], dir: [0,0,0], parent: 5, axis: [1, 0, 0],
        type: 'box', s:[jointWidth, jointDia, jointDia], deg:[-180,0],
      },
      { // #8 腕
        p: [0, 0.15, 0.4], dir: [0,0,0], parent: 7, axis: [0, 0, 0],
        type: 'cyl', s:[armDia, 0.1 - jointDia, armDia], deg:[0,0],
      },
      { // #9 ハサミ
        p: [0, 0.1, 0.4], dir: [0,0,0], parent: 7, axis: [0, 1, 0],
        type: 'box', s:[0.2, 0.02, 0.05], deg:[-180,180],
      },
      { // #10 X-
        p: [-0.1, 0.05, 0.4], dir: [1, 0, 0], parent: 9, axis: [0, 0, 0],
        type: 'cyl', s:[0.01, 0.1 - 0.02, 0.01], deg:[0,0],
      },
      { // #11 X+
        p: [ 0.1, 0.05, 0.4], dir: [-1, 0, 0], parent: 9, axis: [0, 0, 0],
        type: 'cyl', s:[0.01, 0.1 - 0.02, 0.01], deg:[0,0],
      },
    ];
    const arms = [];
    for (let i = 0; i < parts.length; ++i) {
      const part = parts[i];

      /**
       * 位置 in モデル
       */
      let vec = BABYLON.Vector3.FromArray(part.p);
      let parent = (part.parent < 0) ? this.floorpa : arms[part.parent].agg;
      const diffv = vec.clone().subtract(parent.transformNode.absolutePosition);

      // @see https://doc.babylonjs.com/typedoc/classes/_babylonjs_core.Quaternion

      let axisVec = part.axis ? BABYLON.Vector3.FromArray(part.axis) : null;
      if (axisVec?.length() === 0) {
        axisVec = null;
      }
      let dirVec = part.dir ? BABYLON.Vector3.FromArray(part.dir) : null;
      if (dirVec?.length() === 0) {
        dirVec = null;
      }

      const arm = {
        agg: null,
        axisVec,
        dirVec,
      };
      arms.push(arm);

      {
        let m = null;
        let shapeType = '';
        switch (part.type) {
          case 'cyl':
            shapeType = BABYLON.PhysicsShapeType.CYLINDER;
            m = BABYLON.MeshBuilder.CreateCylinder(this.oid(),
              {diameterTop: part.s[0],
                height: part.s[1],
                diameterBottom: part.s[2]},
              scene);
            break;
          case 'box':
            shapeType = BABYLON.PhysicsShapeType.BOX;
            m = BABYLON.MeshBuilder.CreateBox(this.oid(),
              {width: part.s[0], height: part.s[1], depth: part.s[2]},
              scene);
            break;
          case 'cap':
            shapeType = BABYLON.PhysicsShapeType.CAPSULE;
            m = BABYLON.MeshBuilder.CreateCapsule(
              this.oid(),
              {radium: part.s[0],
                height: part.s[1],},
              scene,
            );
            break;
        }
        const mtl = new BABYLON.StandardMaterial(this.oid('m'), scene);
        mtl.diffuseColor = this.rc();
        mtl.ambientColor = this.objAmb;
        m.material = mtl;

        m.position = vec;

        this.sg.addShadowCaster(m);

        const pa = new BABYLON.PhysicsAggregate(
          m,
          shapeType,
          {mass: 0.2},
          scene,
        );

        arm.agg = pa;

        // @see https://doc.babylonjs.com/typedoc/classes/_babylonjs_core.PhysicsConstraint
        { // コンストレイント
          const upv = BABYLON.Vector3.Up();
          let ct = null;
          if (!axisVec && !dirVec) {
            ct = new BABYLON.LockConstraint(
              diffv, new BABYLON.Vector3(0, 0, 0),
              upv, upv,
              scene,
            );
          } else if (dirVec) {
            // ハサミ
            const limits = [
              { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X, minLimit: 0, maxLimit: 0 },
              { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y, minLimit: 0, maxLimit: 0 },
              { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z, minLimit: 0, maxLimit: 0 },
            ];
            if (dirVec.x !== 0) {
              const minx = (dirVec.x < 0) ? -0.05 : 0;
              const maxx = (dirVec.x < 0) ? 0 : 0.05;
              limits.push(
                { axis: BABYLON.PhysicsConstraintAxis.LINEAR_X, minLimit: minx, maxLimit: maxx},
                { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Y, minLimit: 0, maxLimit: 0 },
                { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Z, minLimit: 0, maxLimit: 0},
              );
            } else if (dirVec.y !== 0) {
              // 不使用
              limits.push(
                { axis: BABYLON.PhysicsConstraintAxis.LINEAR_X, minLimit: 0, maxLimit: 0 },
                { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Y, minLimit: -0.1, maxLimit: 0.1},
                { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Z, minLimit: 0, maxLimit: 0},
              );
            } else if (dirVec.z !== 0) {
              // 不要
              limits.push(
                { axis: BABYLON.PhysicsConstraintAxis.LINEAR_X, minLimit: 0, maxLimit: 0 },
                { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Y, minLimit: 0, maxLimit: 0 },
                { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Z, minLimit: -0.1, maxLimit: 0.1 },
              );
            }
            ct = new BABYLON.Physics6DoFConstraint(
              { pivotA: diffv,
                pivotB: new BABYLON.Vector3(0, 0, 0), },
              limits,
              scene,
            );

          } else {
            // 仰角かねじり 5つ
            const angs = part.deg.map(deg => deg * Math.PI / 180);
            const limits = [
              { axis: BABYLON.PhysicsConstraintAxis.LINEAR_X, minLimit: 0, maxLimit: 0 },
              { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Y, minLimit: 0, maxLimit: 0 },
              { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Z, minLimit: 0, maxLimit: 0 },
            ];
            if (axisVec.x !== 0) {
              limits.push(
                // 回転も大部分ロック（1軸だけ自由）
                { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X,
                  minLimit: angs[0], maxLimit: angs[1],
                  stiffness: 0.95, damping: 0.9,
                },
                { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y, minLimit: 0, maxLimit: 0 },
                { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z, minLimit: 0, maxLimit: 0},
              );
            } else if (axisVec.y !== 0) {
              limits.push(
                { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X, minLimit: 0, maxLimit: 0 },
                { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y, minLimit: angs[0], maxLimit: angs[1]},
                { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z, minLimit: 0, maxLimit: 0},
              );
              console.log('axisVec.y');
            } else if (axisVec.z !== 0) {
              limits.push(
                { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X, minLimit: 0, maxLimit: 0 },
                { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y, minLimit: 0, maxLimit: 0 },
                { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z, minLimit: angs[0], maxLimit: angs[1]},
              );
            }
            ct = new BABYLON.Physics6DoFConstraint(
              { pivotA: diffv,
                pivotB: new BABYLON.Vector3(0, 0, 0),
                axisA: new BABYLON.Vector3(1, 0, 0),
                axisB: new BABYLON.Vector3(1, 0, 0),
                perpAxisA: upv, perpAxisB: upv,
              },
              limits,
              scene,
            );

          }
          parent.body.addConstraint(pa.body, ct);
          arm.ct = ct;

          try {
            const ma = BABYLON.PhysicsConstraintAxis.ANGULAR_X;
            // Lock にはない
            ct.setAxisMotorMaxForce(ma, 10);
            ct.setAxisMotorType(ma,
              BABYLON.PhysicsConstraintMotorType.POSITION,
            );

          } catch (e) {
            console.warn('motor catch', part.axis, e);
          }

        }

      }

    }
    return arms;
  }

  /**
   * 実装してない
   * @param {number[]} srcpos 
   * @param {number[]} dstpos 
   */
  calcToPosition(srcpos, dstpos) {
    const ret = {

    };
    // 角度の決定
    // IK ライブラリに任せた方がいいのでは
    // 相対回転量を決定

    return ret;
  }

  /**
   * 実装してない
   * @param {number[]} srcp 
   * @param {number[]} dstp 
   */
  calByPosition(srcp, dstp) {
    // 分割
    for (let i = 0; i <= 16; ++i) {
      const t = i / 16;
      const p = [0,1,2].map(j => srcp[j] * (1 - t) + dstp[j] + t);
      const result = this.calcToPosition(srcp, p);
    }

    // いける最大を使用する
    return {};
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
