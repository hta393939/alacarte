
class Misc {
  static STATUS_TITLE = 'title';
  static STATUS_PRECOUNT = 'precount';
  static STATUS_INGAME = 'ingame';
  static STATUS_TIMEUP = 'timeup';

  static CURVE_LINEAR = 'linear';
  static CURVE_THR = 'thr';

  constructor() {
    this.consoles = [];
    /** 論理幅 */
    this.logicW = 960;
    /**
     * 論理高さ
     */
    this.logicH = 540;

    this.curveMode = Misc.CURVE_THR;

    /**
     * 閾値で0.0に丸める場合
     */
    this.curveThr = 0.2;

    /** IKもどき算出時の1本のアーム長 */
    this.ikArmLen = 0.2;

    this.ts = [];
    this.textLabels = [];

    this.status = Misc.STATUS_TITLE;

    this.prePadIndex = -1;
    this.count = 0;
    /** autoRot は実験用 */
    this.autoRot = false;

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
    {
      const nearFarIndex = 1;
      const upDownIndex = 3;
      const downIndex = 5;
      {
        this.arm[2]._set(-45);
        this.arm[4]._set(90);
        this.arm[7]._set(-45);
      }

      for (let i = 0; i < arm.length; ++i) {
        const one = arm[i];
        one._padFunc = () => {};
        switch (i) {
          case 1:
            one._padFunc = (pad) => {
              const a = pad.axes[0];
              one._add(a);
              const q = BABYLON.Quaternion.RotationAxis(
                new BABYLON.Vector3(0, 1, 0),
                one.curVal * Math.PI / 180,
              );
              one.node.rotationQuaternion = q;
            };
            break;
          case 2:
            one._padFunc = (pad) => {
              /*
              const a = pad.axes[nearFarIndex];
              one._add(a * 0.5);

              const uda = pad.axes[upDownIndex];
              one._add(uda * 0.5);

              const but = pad.buttons[downIndex].value;
              one._add(but * 0.5);

              const q = BABYLON.Quaternion.RotationAxis(
                new BABYLON.Vector3(1, 0, 0),
                one.curVal * Math.PI / 180,
              );
              one.node.rotationQuaternion = q; */
            };
            break;
          case 4: // 仰角
            one._padFunc = (pad) => { /*
              const a = pad.axes[nearFarIndex];
              one._add(-a);

              const q = BABYLON.Quaternion.RotationAxis(
                new BABYLON.Vector3(1, 0, 0),
                one.curVal * Math.PI / 180,
              );
              one.node.rotationQuaternion = q; */
            };
            break;
          case 6: // ねじり
            one._padFunc = (pad) => {
              //one._add(0);
            };
            break;
          case 7: // 仰角
            one._padFunc = (pad) => { /*
              const a = pad.axes[nearFarIndex];
              one._add(a * 0.5);
              const but = pad.buttons[downIndex].value;
              one._add(but * 0.5);

              const q = BABYLON.Quaternion.RotationAxis(
                new BABYLON.Vector3(1, 0, 0),
                one.curVal * Math.PI / 180,
              );
              one.node.rotationQuaternion = q; */
            };
            break;

          case 9: // ねじり
            one._padFunc = (pad) => {
              //one._add(0);
            };
            break;
          case 10: // ハサミ
            one.curVal = -0.1;
            one._padFunc = (pad) => {
              const but = pad.buttons[7].value;
              one._set(-0.1 + but * 0.06);
              const p = new BABYLON.Vector3(one.curVal, -0.05, 0);
              one.node.position = p;
            };
            break;
          case 11:
            one.curVal = 0.1;
            one._padFunc = (pad) => {
              const but = pad.buttons[7].value;
              one._set(0.1 - but * 0.06);
              const p = new BABYLON.Vector3(one.curVal, -0.05, 0);
              one.node.position = p;
            };
            break;
        }
      }
    }
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
        tl.text = `${result?.index ?? -1}(${this.prePadIndex}) ${this.autoRot}`;
      }
    }

    if (false) { // Constraint の場合
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

    if (true) { // ボーン の場合
      const now = Date.now();
      const val = (now % 10000) / 10000;
      const rot = new BABYLON.Vector3(val * Math.PI * 2, 0, 0);
      const arm = this.arm;
      if (Array.isArray(arm)) {
        if (this.autoRot) {
          for (const one of arm) { // ボーン変更
            const tn = one.node;
            const axisVec = one.axisVec;
            const dirVec = one.dirVec;
            if (!tn || (!axisVec && !dirVec)) {
              continue;
            }
            if (axisVec) {
              tn.rotation = rot;
              /*
              tn.rotation = BABYLON.Quaternion.FromEulerAngles(
                val * Math.PI * 2, 0, 0,
              );
              */
            }

            if (dirVec) {
              tn.position = new BABYLON.Vector3(val * 0.01, 0.05, 0);
            }

          }
        }

        for (const one of arm) { // 反映
          const tn = one.node;
          const body = one.agg?.body;
          if (!body) {
            continue;
          }
          // @see https://doc.babylonjs.com/typedoc/classes/_babylonjs_core.PhysicsBody
          body.setTargetTransform(
            tn.absolutePosition,
            tn.absoluteRotationQuaternion,
          );
        }

        /**
         * @see https://doc.babylonjs.com/typedoc/classes/_babylonjs_core.TransformNode
         */
      }
    }

  }

  /**
   * 許容角度を超えていたら true を返す
   * @param {{}[]} cands 
   * @returns {boolean}
   */
  checkOver(cands) {
    for (const cand of cands) {
      const deg = cand.deg;
      if (Number.isNaN(deg)) {
        return true;
      }

      const one = this.arm[cand.index];
      if (deg < one.deg[0] || deg > one.deg[1]) {
        return true;
      }      
    }
    return false;    
  }

  applyMove(pad) {
    if (!pad) {
      return;
    }
    if (!this.arm) {
      return;
    }

    for (const one of this.arm) {
      one._padFunc(pad);
    }

    const ikRate = 0.008;
    /** 半径方向，高さ方向 */
    const target = [
      this.axisCurve( pad.axes[1]) * ikRate,
      this.axisCurve(-pad.axes[3]) * ikRate,
    ];
    for (const rate of [1]) {
    //for (const rate of [1, 0.5, 0.25, 0]) {
      // IK もどき
      const len = this.ikArmLen;
      // 回転させて Z, Y にする必要がある
      const hang = this.arm[1].curVal * Math.PI / 180;
      /** 根本 */
      const ov = this.arm[2].node.absolutePosition;
      /** 先 */
      const cv = this.arm[7].node.absolutePosition;
      const ocv = cv.subtract(ov);

      const revq = BABYLON.Quaternion
        .RotationAxis(BABYLON.Vector3.Up(),
        -hang);
      const rotated = ocv.applyRotationQuaternion(revq);

      const cpos = [rotated.z, rotated.y];
      cpos[0] += target[0] * rate;
      cpos[1] += target[1] * rate;
      const result = this.calcToPosition(cpos, len);

      const cands = [
        {index: 2, deg: result.odeg},
        {index: 4, deg: result.bdeg},
        {index: 7, deg: result.cdeg},
      ];
      let isOver = this.checkOver(cands);
      if (isOver) {
        continue;
      }
      // 新しい角度を反映する。
      for (const cand of cands) {
        const one = this.arm[cand.index];
        one._set(cand.deg);
        const q = BABYLON.Quaternion.RotationAxis(
          new BABYLON.Vector3(1, 0, 0),
          one.curVal * Math.PI / 180,
        );
        one.node.rotationQuaternion = q;
      }

      {
        let s = `${result.odeg.toFixed(1)}, ${result.bdeg.toFixed(1)}, ${result.cdeg.toFixed(1)}`;
        const tl = this.textLabels[2];
        tl.text = s;
      }

      break;
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

  /**
   * トリガーには適用しない
   * @param {number} x 
   * @returns 
   */
  axisCurve(x) {
    switch (this.curveMode) {
      case 'linear':
        return x;
      case 'thr':
        return (Math.abs(x) <= this.curveThr) ? 0 : x;
    }
  }

  async readyObject(scene) {
    const manager = new BABYLON.GUI.GUI3DManager(scene);
    {
      const panel = new BABYLON.GUI.StackPanel3D();
      manager.addControl(panel);
      panel.position = new BABYLON.Vector3(0, 0.5, 1);

      for (let i = 0; i < 4; ++i) {
        const but = new BABYLON.GUI.Button3D(`but${i}`);
        but.position = new BABYLON.Vector3((i - 1) * 0.8, 2, 0);
        but.scaling = new BABYLON.Vector3(0.8, 0.3, 0.2);

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

          if (i === 1) {
            this.autoRot = !this.autoRot;
          }
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


    for (let i = 0; i < 10; ++i) { // カプセル
      const m = BABYLON.MeshBuilder.CreateCapsule(
        `c${i}`,
        {radius: 0.01, height: 0.03},
        scene,
      );
      m.position = new BABYLON.Vector3(0.04 * i, 0.015, 0.04 * i);
      const mtl = new BABYLON.StandardMaterial(`c${i}`, scene);
      mtl.diffuseColor = this.rc();
      m.material = mtl;
      const pa = new BABYLON.PhysicsAggregate(
        m, BABYLON.PhysicsShapeType.CAPSULE,
        {mass: 0.2,
          damping: 0.8,
        }, scene,
      );
    }

    for (let i = 0; i < 10; ++i) { // シリンダー
      const m = BABYLON.MeshBuilder.CreateCylinder(
        `cyl${i}`,
        {diameterTop: 0.02, height: 0.02, diameterBottom: 0.02},
        scene,
      );
      m.position = new BABYLON.Vector3(i * 0.04, 0.01, Math.random() * 0.1);
      const mtl = new BABYLON.StandardMaterial(`cyl${i}`, scene);
      mtl.diffuseColor = this.rc();
      m.material = mtl;
      const pa = new BABYLON.PhysicsAggregate(
        m, BABYLON.PhysicsShapeType.CYLINDER,
        {mass: 0.2}, scene,
      );
    }

    for (let i = 0; i < 10; ++i) { // 球
      const m = BABYLON.MeshBuilder.CreateSphere(
        `sph${i}`,
        {diameter: 0.04},
        scene,
      );
      m.position = new BABYLON.Vector3(Math.random() * 0.04, 0.02, i * 0.04);
      const mtl = new BABYLON.StandardMaterial(`sph${i}`, scene);
      mtl.diffuseColor = this.rc();
      m.material = mtl;
      const pa = new BABYLON.PhysicsAggregate(
        m, BABYLON.PhysicsShapeType.SPHERE,
        {mass: 0.2,
          damping: 1,
        }, scene,
      );
    }

    for (let i = 0; i < 10; ++i) { // 箱
      const m = BABYLON.MeshBuilder.CreateBox(
        `box${i}`,
        {width: 0.04, height: 0.04, depth: 0.04},
        scene,
      );
      m.position = new BABYLON.Vector3(i * 0.04, 0.02, 0);
      const mtl = new BABYLON.StandardMaterial(`box${i}`, scene);
      mtl.diffuseColor = this.rc();
      m.material = mtl;
      const pa = new BABYLON.PhysicsAggregate(
        m, BABYLON.PhysicsShapeType.BOX,
        { mass: 0.2,
          extents: BABYLON.Vector3.FromArray([0.1, 0.1, 0.1])
              .add(new BABYLON.Vector3(0.03, 0.03, 0.03))
        }, scene,
      );
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
    const scale = 0.04;
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
   * 旋回、仰角、仰角、ねじり、仰角、ねじり、はさむ
   * これはボーンでやるタイプ
   * @param {*} scene 
   */
  makeBoneArm(scene) {
    console.log('makeBoneArm', 'bone でやる');
    const armDia = 0.04;
    const jointDia = 0.04;
    const jointWidth = 0.04;
    const ikArmLen = this.ikArmLen;
    const gripZ = ikArmLen * 2;
    const parts = [
      { // #0 ベース
        p: [0, 0.05, 0], dir: [0,0,0], parent: -1, axis: [0, 0, 0],
        type: 'cyl', s:[armDia * 2, 0.1, armDia * 2], deg:[0,0],
      },
      { // #1 回転
        p: [0, 0.15, 0], dir: [0,0,0], parent: 0, axis: [0, 1, 0],
        type: 'cyl', s:[armDia, 0.1, armDia], deg:[-180,180],
      },
      { // #2 仰角 IK
        p: [0, 0.2, 0], dir: [0,0,0], axis: [1, 0, 0], parent: 1,
        type: 'box', s:[jointWidth, jointDia, jointDia], deg:[-135,0],
      },
      { // #3 腕
        p: [0, 0.2, ikArmLen * 0.5], dir: [0,0,0], axis: [0, 0, 0], parent: 2,
        type: 'box', s:[armDia, armDia, ikArmLen - jointDia], deg:[0,0],
      },
      { // #4 仰角 IK
        p: [0, 0.2, ikArmLen], dir: [0,0,0], parent: 2, axis: [1, 0, 0],
        type: 'box', s:[jointWidth, jointDia, jointDia], deg:[0,135],
      },
      { // #5 腕
        p: [0, 0.2, ikArmLen * (1 + 1/4)], dir: [0,0,0], parent: 4, axis: [0, 0, 0],
        type: 'box', s:[armDia, armDia, ikArmLen * 0.5 - jointDia], deg:[0,0],
      },
      { // #6 ねじり
        p: [0, 0.2, ikArmLen * (1 + 1/4 + 1/2)], dir: [0,0,0], parent: 5, axis: [0, 0, 1],
        type: 'box', s:[armDia, armDia, ikArmLen * 0.5 - jointDia], deg:[0,0], 
      },
      { // #7 仰角 IK
        p: [0, 0.2, gripZ], dir: [0,0,0], parent: 5, axis: [1, 0, 0],
        type: 'box', s:[jointWidth, jointDia, jointDia], deg:[-180,0],
      },
      { // #8 腕
        p: [0, 0.15, gripZ], dir: [0,0,0], parent: 7, axis: [0, 0, 0],
        type: 'cyl', s:[armDia, 0.1 - jointDia, armDia], deg:[0,0],
      },
      { // #9 ハサミ
        p: [0, 0.1, gripZ], dir: [0,0,0], parent: 7, axis: [0, 1, 0],
        type: 'box', s:[0.2, 0.02, 0.05], deg:[-180,180],
      },
      { // #10 X-
        p: [-0.1, 0.05, gripZ], dir: [1, 0, 0], parent: 9, axis: [0, 0, 0],
        type: 'box', s:[0.01, 0.1 - 0.02, 0.05], deg:[-0.1, 0], // 0からの移動
      },
      { // #11 X+
        p: [ 0.1, 0.05, gripZ], dir: [-1, 0, 0], parent: 9, axis: [0, 0, 0],
        type: 'box', s:[0.01, 0.1 - 0.02, 0.05], deg:[0, 0.1], // 0から移動
      },
      { // #12 X-
        p: [-0.1 + 0.02, 0.01, gripZ], dir: [0, 0, 0], parent: 10, axis: [0, 0, 0],
        type: 'box', s:[0.04, 0.02, 0.04], deg:[0, 0],
      },
      { // #13 X+
        p: [ 0.1 - 0.02, 0.01, gripZ], dir: [0, 0, 0], parent: 11, axis: [0, 0, 0],
        type: 'box', s:[0.04, 0.02, 0.04], deg:[0, 0],
      },

      { // #14 X-
        p: [-0.1 + 0.02, 0.01, gripZ - 0.02], dir: [0, 0, 0], parent: 10, axis: [0, 0, 0],
        type: 'box', s:[0.04, 0.02, 0.02], deg:[0, 0],
      },
      { // #15 X+
        p: [ 0.1 - 0.02, 0.01, gripZ - 0.02], dir: [0, 0, 0], parent: 11, axis: [0, 0, 0],
        type: 'box', s:[0.04, 0.02, 0.02], deg:[0, 0],
      },
      { // #16 X-
        p: [-0.1 + 0.02, 0.01, gripZ + 0.02], dir: [0, 0, 0], parent: 10, axis: [0, 0, 0],
        type: 'box', s:[0.04, 0.02, 0.02], deg:[0, 0],
      },
      { // #17 X+
        p: [ 0.1 - 0.02, 0.01, gripZ + 0.02], dir: [0, 0, 0], parent: 11, axis: [0, 0, 0],
        type: 'box', s:[0.04, 0.02, 0.02], deg:[0, 0],
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
        // ボーンツリーを構成する
        tn.parent = arms[index].node;
      } else {
        tn.parent = this.floorpa.transformNode;
      }
      diffv = vec.subtract(tn.parent.absolutePosition);
      tn.position = diffv;

      let axisVec = part.axis ? BABYLON.Vector3.FromArray(part.axis) : null;
      if (axisVec?.length() === 0) {
        axisVec = null;
      }

      let dirVec = part.dir ? BABYLON.Vector3.FromArray(part.dir) : null;
      if (dirVec?.length() === 0) {
        dirVec = null;
      }

      const arm = part;
      Object.assign(arm, {
        curVal: 0,
        _clip: () => { // deg を使う
          arm.curVal = Math.max(arm.deg[0], Math.min(arm.deg[1], arm.curVal));
        },
        _set: (_val) => {
          if (Number.isNaN(_val)) {
            return;
          }
          arm.curVal = _val;
          arm._clip();
        },
        _add: (_diff) => {
          if (Number.isNaN(_diff)) {
            return;
          }
          arm.curVal += _diff;
          arm._clip();
        },
        node: tn,
        agg: null,
        axisVec,
        dirVec,
      });
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
        const mtl = new BABYLON.StandardMaterial(this.oid(), scene);
        mtl.alpha = 0.5;
        mtl.diffuseColor = this.rc();
        mtl.ambientColor = this.objAmb;
        m.material = mtl;

        m.position = vec;

        this.sg.addShadowCaster(m);

        if (false) { // ボーン側可視
          const viewm = m.clone();
          viewm.position = diffv;
          this.sg.addShadowCaster(viewm);
          viewm.parent = tn;
        }

        // NOTE: Aggregate は元々剛体がメッシュを動かすもの
        const pa = new BABYLON.PhysicsAggregate(
          m,
          shapeType,
          {mass: 2.0,
            // box はこれ
            //extents: BABYLON.Vector3.FromArray(part.s).multiplyByFloats(2, 2, 2),
            extents: BABYLON.Vector3.FromArray(part.s)
              .add(new BABYLON.Vector3(0.03, 0.03, 0.03))
          },
          scene,
        );
        // cyl はこれで良さそう
        pa?.shape?._pluginData?.setMargin?.(0);

        pa.body.setMotionType(BABYLON.PhysicsMotionType.ANIMATED);

        // NOTE: こっちは動く
        pa.body.setPrestepType(BABYLON.PhysicsPrestepType.TELEPORT);   // 瞬間移動（テレポート）
        // NOTE: 位置だと動かないかも
        //pa.body.setPrestepType(BABYLON.PhysicsPrestepType.ACTION);     // 速度で追従（摩擦などで影響を受ける）

        arm.agg = pa;
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
   * 根本を引いた後の座標を使用する
   * @param {number[]} cpos アーム先。C_z, C_y
   * @param {number} len 共通な腕の長さ
   */
  calcToPosition(cpos, len) {
    /** OC の長さ */
    const oclen = Math.sqrt(cpos[0] ** 2 + cpos[1] ** 2);

    /** OC の上げ角度(符号つき) */
    const gamma = Math.atan(cpos[1] / cpos[0]);

    /** 近アームの追加上げ角度 */
    const theta = Math.acos(oclen / len * 0.5);

    const ang = gamma + theta;
    /** B_z, B_y */
    const bpos = [
      len * Math.cos(ang),
      len * Math.sin(ang),
    ];

    /** 水平から上げた角度 */
    const beta = Math.acos((cpos[0] - bpos[0]) / len);

    const ret = {
      oang: - gamma - theta,
      bang: theta * 2,
      cang: - beta, // 真下に向かせたいときに使用する
    };
    Object.assign(ret,
      {
        odeg: ret.oang * 180 / Math.PI,
        bdeg: ret.bang * 180 / Math.PI,
        cdeg: ret.cang * 180 / Math.PI,
      }
    );
    return ret;
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
