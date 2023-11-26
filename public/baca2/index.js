var canvas = document.getElementById('renderCanvas');
var engine = new BABYLON.Engine(canvas);

var createScene = async function() {
    const scene = new BABYLON.Scene(engine);

    const canvas1 = document.getElementById('canvas1');
    const canvas2 = document.getElementById('canvas2');
// 上から見る直交射影カメラ
    const camera1 = new BABYLON.FreeCamera('camera1',
        new BABYLON.Vector3(0, 10, 0),
        scene);
    camera1.upVector = new BABYLON.Vector3(0, 0, 1);
    camera1.setTarget(new BABYLON.Vector3(0, 0, 0));
    camera1.position = new BABYLON.Vector3(0, 10, 0);
    camera1.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    camera1.orthoLeft = -8;
    camera1.orthoRight = 8;
    camera1.orthoTop = 4.5;
    camera1.orthoBottom = -4.5;
    scene.activeCameras.push(camera1);
    engine.registerView(canvas1, camera1);
// 通常の操作対象カメラ
    const camera2 = new BABYLON.ArcRotateCamera('camera2',
        0, 0, 1,
        new BABYLON.Vector3(0, 0, 0),
        scene);
    camera2.position = new BABYLON.Vector3(1, 3, -10);
    scene.activeCameras.push(camera2);
    engine.registerView(canvas2, camera2);

    engine.inputElement = canvas2;
    camera2.wheelPrecision = 0.04;
    camera2.wheelDeltaPercentage = 0.04;
    camera2.attachControl();

// ライト
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
// 球
    const sphere = BABYLON.MeshBuilder.CreateSphere('sphere',
        { diameter: 2 }, scene);
    scene.onBeforeRenderObservable.add(() => {
        const ts = Date.now();
        sphere.setAbsolutePosition(new BABYLON.Vector3(Math.sin((ts % 2000) / 1000 * Math.PI), 1.5, -1));
    });
    sphere.setAbsolutePosition(new BABYLON.Vector3(0, 1.5, -1));
// 地面
    const ground = BABYLON.MeshBuilder.CreateGround('ground',
        { width: 6, height: 6 }, scene);
    return scene;
};

const initialize = async () => {
    const _scene = await createScene();
    engine.runRenderLoop(() => {
        _scene.render();
    });
};
initialize();