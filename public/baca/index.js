/**
 * @file index.js
 */

var engine = null;
var canvas = document.getElementById('canvas1');
var canvas2 = document.getElementById('canvas2');

var createScene = async function() {
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera('camera1',
        0, 0, 1,
        new BABYLON.Vector3(0, 0, 0),
        scene);
    camera.position = new BABYLON.Vector3(1, 1, 5);
    camera.attachControl();

    const sphere = BABYLON.MeshBuilder.CreateSphere('sphere',
        { diameter: 2 },
        scene);
    sphere.setAbsolutePosition(new BABYLON.Vector3(0, 2, 0));

    const ground = BABYLON.MeshBuilder.CreateGround('ground',
        { width: 5, height: 5 },
        scene);

    return scene;
};

class Misc {
    constructor() {
    }

    async initialize() {
        this.setListener();

        engine = new BABYLON.Engine(canvas);
        const _scene = await createScene();

        engine.runRenderLoop(() => {
            _scene.render();
        });
    }

    setListener() {
        {
            const el = document.getElementById('enumvoice');
            el?.addEventListener('click', () => {
                this.enumVoice();
            });
        }

        {
            const el = document.getElementById('saytext');
            el?.addEventListener('click', () => {
                this.speakerid = Number.parseInt(window.speakerid.value);
                //this.say('こんにちなのだ', true);
                this.say(window.text.value, true);
            });
        }

        {
            const el = document.getElementById('openwindow');
            el?.addEventListener('click', () => {
                this.openWindow();
            });
        }
        { // ワーキングディレクトリで指定するタイプ。うまくいく。
            const el = document.getElementById('opendir');
            el?.addEventListener('click', async () => {
                const dirHandle = await this.openDir();
                this.dirHandle = dirHandle;
                await this.processDir(dirHandle);
            });
        }
        { // リトライ
            const el = document.getElementById('retry');
            el?.addEventListener('click', async () => {
                await this.processDir(this.dirHandle);
            });
        }

    }

}

const misc = new Misc();
misc.initialize();





