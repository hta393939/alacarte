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
 * @param {HTMLCanvasElement} src 
 */
    convColor(src) {
        const scale = 1;

        const cellx = this.cellx;
        const celly = this.celly;
        const cellw = this.cellw;
        const cellh = cellw;

/**
 * 入力画像の幅
 */
//        const w = src.width;
//        const h = src.height;
        const context = src.getContext('2d');
/**
 * 書き出し先
 * @type {HTMLCanvasElement}
 */
        const canvas = document.getElementById('subcanvas');
        const c = canvas.getContext('2d');
        canvas.width = cellw * scale;
        canvas.height = cellh * scale;
        const cx = cellx * cellw;
        const cy = celly * cellh;
        console.log(cx, cy, cellw, cellh);
        const dat = context.getImageData(cx, cy, cellw, cellh);

        let backs = [-1, -1, -1];
        if (true) {
            let ft = (0 + 0 * 0) * 4;
            backs[0] = dat.data[ft];
            backs[1] = dat.data[ft+1];
            backs[2] = dat.data[ft+2];
        }

        for (let i = 0; i < cellw; ++i) {
            for (let j = 0; j < cellw; ++j) {
                let ft = (j + i * cellw) * 4;
                let x = j * scale;
                let y = i * scale;
                let r = dat.data[ft];
                let g = dat.data[ft+1];
                let b = dat.data[ft+2];
                let a = dat.data[ft+3];
                if (r === backs[0] && g === backs[1] && b === backs[2]) {
                    a = 0;
                }
                c.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
                c.fillRect(x, y, scale, scale);
            }
        }

    }

/**
 * 
 * @param {File} file 
 * @returns {Promise<HTMLCanvasElement>}
 */
    loadFileToCanvas(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.addEventListener('load', () => {
        /**
        * @type {HTMLCanvasElement}
        */
                const canvas = document.getElementById('maincanvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const c = canvas.getContext('2d');
                c.drawImage(img, 0, 0);
                resolve(canvas);
            });
            img.addEventListener('error', () => {
                reject(`load error`);
            });
            img.src = URL.createObjectURL(file);
        });
    }

/**
 * 
 * @param {HTMLCanvasElement} src 
 */
    scaleImage(src) {
        const scale = this.scale;

        const cellx = this.cellx;
        const celly = this.celly;
        const cellw = this.cellw;
        const cellh = cellw;

/**
 * 入力画像の幅
 */
//        const w = src.width;
//        const h = src.height;
        const context = src.getContext('2d');
/**
 * 書き出し先
 * @type {HTMLCanvasElement}
 */
        const canvas = document.getElementById('subcanvas');
        const c = canvas.getContext('2d');
        canvas.width = cellw * scale;
        canvas.height = cellh * scale;
        const cx = cellx * cellw;
        const cy = celly * cellh;
        console.log(cx, cy, cellw, cellh);
        const dat = context.getImageData(cx, cy, cellw, cellh);

        let backs = [-1, -1, -1];
        if (true) {
            let ft = (0 + 0 * 0) * 4;
            backs[0] = dat.data[ft];
            backs[1] = dat.data[ft+1];
            backs[2] = dat.data[ft+2];
        }

        for (let i = 0; i < cellw; ++i) {
            for (let j = 0; j < cellw; ++j) {
                let ft = (j + i * cellw) * 4;
                let x = j * scale;
                let y = i * scale;
                let r = dat.data[ft];
                let g = dat.data[ft+1];
                let b = dat.data[ft+2];
                let a = dat.data[ft+3];
                if (r === backs[0] && g === backs[1] && b === backs[2]) {
                    a = 0;
                }
                c.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
                c.fillRect(x, y, scale, scale);
            }
        }
    }

/**
 * 
 * @param {File} file 
 */
    async parseImage(file) {
        const img = new Image();
        img.addEventListener('load', () => {
/**
 * @type {HTMLCanvasElement}
 */
            const canvas = document.getElementById('maincanvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const c = canvas.getContext('2d');
            c.drawImage(img, 0, 0);
            this.scaleImage(canvas);
        });
        img.src = URL.createObjectURL(file);
    }

    setListener() {
        {
            const el = window;
            el.addEventListener('dragover', ev => {
                ev.preventDefault();
                ev.stopPropagation();
                ev.dataTransfer.dropEffect = 'copy';
            });
            el.addEventListener('drop', async ev => {
                ev.preventDefault();
                ev.stopPropagation();
                ev.dataTransfer.dropEffect = 'copy';
                const canvas = await this.loadFileToCanvas(ev.dataTransfer.files[0]);
                this.convColor(canvas);
            });
        }

        for (const k of [
            'scale', 'cellx', 'celly', 'cellw',
        ]) {
            const el = document.getElementById(`${k}`);
            const viewel = document.getElementById(`${k}view`);
            const _update = () => {
                this[k] = Number.parseFloat(el.value);
                viewel.textContent = this[k];
            };
            el?.addEventListener('input', () => {
                _update();
            });
            _update();
        }

    }

}

const misc = new Misc();
misc.initialize();



