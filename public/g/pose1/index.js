/**
 * @file index.js
 */

class Misc {
    constructor() {
    }

    async initialize() {
        this.setListener();
    }

    async initCapture() {
        const opt = {
            audio: false,
            video: true,
        };
        const stream = await navigator.mediaDevices.getDisplayMedia(opt);
        return stream;
    }

    onMessage(ev) {
        console.log('receive message', ev);
    }

    startDetect() {
        this.isDetect = true;
    }

    async initDetect() {
        const worker = new Worker('./worker.js');
        this.worker = worker;
        window.addEventListener('message', ev => {
            this.onMessage(ev);
        });

        const stream = await this.initCapture();
        const video = document.getElementById('camera');
        video.addEventListener('canplaythrough', ev => {
            console.log(ev.type, ev);

            const w = video.videoWidth;
            const h = video.videoHeight;

/**
 * @type {HTMLCanvasElement}
 */
            const canvas = document.getElementById('main');
            canvas.width = w;
            canvas.height = h;
            const offscreen = canvas.transferControlToOffscreen();

            worker.postMessage({
                type: 'initialize',
                width: w,
                height: h,
                offscreen,
            }, [offscreen]);
        });
        video.srcObject = stream;
    }

    setListener() {
        {
            const el = document.getElementById('start');
            el?.addEventListener('click', () => {
                this.initDetect();
            });
        }

        {
            const el = document.getElementById('saytext');
            el?.addEventListener('click', () => {
                
            });
        }

        {
            const el = document.getElementById('openwindow');
            el?.addEventListener('click', () => {
                
            });
        }
    }

}

const misc = new Misc();
misc.initialize();

