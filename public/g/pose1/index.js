/**
 * @file index.js
 */

class Misc {
    constructor() {
        this.detecting = false;
/**
 * 全終了する
 */
        this.isTerminate = false;
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

    onResult(ev) {
        const result = ev.data.result;
        const landmarks = result.landmarks;
        if (!Array.isArray(landmarks)) {
            this.detecting = false;
            return;
        }


        this.detecting = false;
    }

    onMessage(ev) {
        console.log('receive message', ev);
        switch(ev.data.type) {
        case 'result':
            this.onResult(ev);
            break;
        case 'ready':
            this.startDetect();
            break;
        }
    }

    async runDetect() {
        const video = document.getElementById('camera');
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) {
            return;
        }
/**
 * @type {HTMLCanvasElement}
 */
        const canvas = document.getElementById('copy');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const bitmap = await window.createImageBitmap(canvas);

// 検知中フラグ立てる

        this.worker.postMessage({
            type: 'detect',
            image: bitmap,
        }, [bitmap]);
    }

    async loop() {
        if (this.isTerminate) {
            return;
        }

        if (!this.detecting) {
            await this.runDetect();
        }

        requestAnimationFrame(() => {
            this.loop();
        });
    }

    startDetect() {
        this.detecting = false;
        this.loop();     
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

    terminate() {
        this.isTerminate = true;
    }

    setListener() {
        {
            const el = document.getElementById('start');
            el?.addEventListener('click', () => {
                this.initDetect();
            });
        }

        {
            const el = document.getElementById('stop');
            el?.addEventListener('click', () => {
                this.terminate();                
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

