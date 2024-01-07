/**
 * @file index.js
 */

class Misc {
    constructor() {
    }

    async initialize() {
        this.setListener();

        const dpr = window.devicePixelRatio;
        {
            let s = '';
            s += `${window.innerWidth}`;
            s += `x${window.innerHeight}`;
            const el = window.innerview;
            el.textContent = s;
        }

        {
            const canvas = document.getElementById('main');
            canvas.width = 640 * dpr;
            canvas.height = 360 * dpr;
            const c = canvas.getContext('2d');
            let fam = 'BIZ UDPゴシック';
            c.font = `normal 32px ${fam}`;
            c.fillStyle = '#000000';
            let s = `五王国`;
            c.fillText(s, 64, 64);
        }

        this.enumVoice();
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
                this.say(window.text.value);
            });
        }

        {
            const el = document.getElementById('openwindow');
            el?.addEventListener('click', () => {
                this.openWindow();
            });
        }
    }

}

const misc = new Misc();
misc.initialize();

