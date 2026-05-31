

class Misc {

  initialize() {
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById('maincanvas');
    canvas.width = 320;
    canvas.height = 180;
    const engine = new BABYLON.Engine(canvas);
    this.engine = engine;
    const scene = new BABYLON.Scene(engine);
    this.scene = scene;
    scene.useRightHandedSystem = true;

    const camera = new BABYLON.ArcRotateCamera('camera',
      0, 0, 10, new BABYLON.Vector3(0, 0, 0),
      scene,
    );
    camera.position = new BABYLON.Vector3(-2, 1, 0.5);
    camera.wheelDeltaPercentage = 0.01;
    camera.minZ = 0.01;
    camera.attachControl();

    {
      const light = new BABYLON.HemisphericLight('light',
        new BABYLON.Vector3(-0.75, 1, 0.5),
        scene,
      );
    }

    {
      const box = BABYLON.MeshBuilder.CreateBox('box', {
        width: 0.2, height: 0.3, depth: 0.4,
      }, scene);
    }

    engine.runRenderLoop(() => {
      scene.render();
    });

    this.load(scene);
  }

  /**
   * 
   * @param {BABYLON.Scene} scene 
   */
  async load(scene) {
    console.log('load');
    let url = './Zundamon_2025_VRM10A' + '.glb';

    const pluginOptions = {
        fileName: 'placeholder.glb',
        gltf: {
          extensionOptions: {
            VRM: {
              enabled: true,
              option1: 'hello world',
              option2: 42,
            }
          },
          onParsed: (loaderData) => {
            console.log('onParsed', loaderData);
          }
        }
    };

    /*
    BABYLON.LoadSceneAsync(url, scene.engine, {
      pluginOptions,
    }); */

    const result = await BABYLON.ImportMeshAsync(url, scene, {
      pluginOptions,
    });

    console.log('ImportMeshAsync', result);
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.initialize();
