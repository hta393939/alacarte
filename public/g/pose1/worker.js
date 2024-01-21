/**
 * @file worker.js
 */

// module の外では import できない

// failed to load;;
//importScripts('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/vision_bundle.mjs');
//importScripts('vision_bundle.mjs');

// application/node はあかんらしい
//importScripts('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/vision_bundle.cjs');
importScripts('vision_bundle.cjs');

class Misc {
    constructor() {
    }

/**
 * 
 * @param {OffscreenCanvas} canvas 
 */
    drawDummy(canvas) {
        const w = canvas.width;
        const h = canvas.height;
        const ctx = canvas.getContext('2d');
        for (let i = 0; i < 4; ++i) {
            for (let j = 0; j < 4; ++j) {
                ctx.fillStyle = `rgb(${64 * i}, ${64 * j}, 0)`;
                ctx.fillRect(j * w / 4, i * h / 4, w / 4, h / 4);
            }
        }
    }

    async onInitialize(ev) {
        console.log('onInitialize');
        this.offscreen = ev.data.offscreen;
        this.width = ev.data.width;
        this.height = ev.data.height;
        this.drawDummy(this.offscreen);

        const vision = await self.FilesetResolver.forVisionTasks(
            // path/to/wasm/root
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
          );
        const poseLandmarker = await poseLandmarker.createFromOptions(
            vision,
            {
                //baseOptions: {
                //modelAssetPath: "path/to/model"
                //},
                runningMode: 'VIDEO'
            });
        this.poseLandmarker = poseLandmarker;

        self.postMessage({
            type: 'ready',
        });

        console.log('onInitialize success');
    }

    onDetect(ev) {
        console.log('onDetect');

        const frame = ev.data.frame;
        if (!frame) {
            self.postMessage({
                type: 'detect',
                result: null,
            });
            return;
        }

        const result = this.poseLandmarker.detectForVideo(frame);

        const obj = {
            type: 'detect',
            result,
        };
        self.postMessage(obj);
    }

    onMessage(ev) {
        switch(ev.data?.type) {
        case 'initialize':
            this.onInitialize(ev);
            break;
        case 'detect':
            this.onDetect(ev);
            break;
        }
    }

}

const misc = new Misc();

self.addEventListener('message', ev => {
    misc.onMessage(ev);
});

