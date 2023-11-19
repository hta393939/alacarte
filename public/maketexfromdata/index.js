/**
 * @file index.js
 */

class Misc {
    constructor() {
    }

    async initialize() {
        this.setListener();
    }

/**
 * 
 * @param {HTMLCanvasElement} canvas 
 */
    draw(canvas, objs) {
        const w = 512;
        const h = 512;
        //const w = 64;
        //const h = 64;
        const rate = 512 / 64;
// 1: (1/PI) のとき
        //const offsetY = h * 0.5 - 512 / Math.PI * 0.5;

// 1: (2/PI) のとき
        const offsetY = h * 0.5 - 512 / Math.PI;

        canvas.width = w;
        canvas.height = h;
        const c = canvas.getContext('2d');
        c.fillStyle = 'rgba(51, 153, 51, 1)';
        c.fillStyle = 'rgba(51, 176, 51, 1)';
        c.fillRect(0, 0, w, h);

        const _l = (a, b, index, t) => {
            return a[index] * (1 - t) + b[index] * t;
        };

        for (const obj of objs) {
            let c0 = [0, 153, 0];
            let c1 = [51, 255, 51];
            let smaller = 1;
            for (let i = 0; i <= 16 - smaller; ++i) {
                let t = i / 16;
                let k = (16 - smaller) /16 - t;
                c.beginPath();
                c.strokeStyle = 'red';
                c.fillStyle = `rgb(${_l(c0, c1, 0, t)}, ${_l(c0, c1, 1, t)}, ${(c0, c1, 2, t)}, 0.5)`;
                c.ellipse(obj.x * rate,
                    obj.y * rate + offsetY,
                    obj.rx * rate * k, obj.ry * rate * k,
                    obj.a,
                    0, Math.PI * 2);
                c.fill();
                //c.stroke();
            }

//            c.fillStyle = 'blue';
//            c.fillRect(obj.x, obj.y, 4, 4);
        }
        return;
    }

    async analyzeText(file) {
        const text = await file.text();
        const lines = text.split('\n');
        const result = {
            objs: []
        };
        for (const line of lines) {
            const vals = line.split(',').map(val => Number.parseFloat(val));
            if (!Number.isFinite(vals[0])) {
                continue;
            }

            const obj = {
                index: vals[0],
                id: vals[1],
                x: vals[2],
                y: vals[3],
                a: vals[4],
                rx: vals[5],
                ry: vals[6],
            };
            result.objs.push(obj);
        }
        console.log('result', result);

        this.draw(window.canvas, result.objs);

        return result;
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
                this.analyzeText(ev.dataTransfer.files[0]);
            });
        }
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



