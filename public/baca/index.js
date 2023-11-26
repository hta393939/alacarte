/**
 * @file index.js
 */

var engine = null;
var canvas = document.getElementById('renderCanvas');

var createScene = async function() {
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera('camera1',
        0, 0, 1,
        new BABYLON.Vector3(0, 0, 0),
        scene);
    camera.wheelPrecision = 0.04;
    camera.wheelDeltaPercentage = 0.04;
    camera.position = new BABYLON.Vector3(1, 1, 5);


//    camera.attachControl();
    engine.inputElement = document.getElementById('canvas2');
    camera.attachControl();


    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    const sphere = BABYLON.MeshBuilder.CreateSphere('sphere',
        { diameter: 2 }, scene);
    sphere.setAbsolutePosition(new BABYLON.Vector3(0, 1.5, 0));

    const ground = BABYLON.MeshBuilder.CreateGround('ground',
        { width: 6, height: 6 }, scene);

    return scene;
};

const initialize = async () => {
    engine = new BABYLON.Engine(canvas);
    const _scene = await createScene();

    engine.runRenderLoop(() => {
        _scene.render();
    });
};

initialize();

