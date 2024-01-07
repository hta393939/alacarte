/**
 * @file worker.js
 */

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

    onInitialize(ev) {
        console.log('onInitialize');
        this.offscreen = ev.data.offscreen;
        this.width = ev.data.width;
        this.height = ev.data.height;
        this.drawDummy(this.offscreen);
    }

    onDetect(ev) {
        console.log('onDetect');
    }

    sendResult() {
        const obj = {
            type: 'detect',
            result: {},
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

