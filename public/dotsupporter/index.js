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
    scaleImage(src) {
        const scale = 4;
        const w = src.width;
        const h = src.height;
        const context = src.getContext('2d');
/**
 * @type {HTMLCanvasElement}
 */
        const canvas = document.getElementById('subcanvas');
        const c = canvas.getContext('2d');
        canvas.width = w * scale;
        canvas.height = h * scale;
        const dat = context.getImageData(0, 0, w, h);

        let backs = [-1, -1, -1];
        if (true) {
            let ft = (0 + 0 * w) * 4;
            backs[0] = dat.data[ft];
            backs[1] = dat.data[ft+1];
            backs[2] = dat.data[ft+2];
        }

        for (let i = 0; i < h; ++i) {
            for (let j = 0; j < w; ++j) {
                let ft = (j + i * w) * 4;
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
            el.addEventListener('drop', ev => {
                ev.preventDefault();
                ev.stopPropagation();
                ev.dataTransfer.dropEffect = 'copy';
                this.parseImage(ev.dataTransfer.files[0]);
            });
        }

    }

}

const misc = new Misc();
misc.initialize();



