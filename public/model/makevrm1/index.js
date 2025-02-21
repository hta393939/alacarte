/**
 * @file index.js
 */
// MIT License (c) 2018- Usagi

/// <reference path="./index.d.ts" />

'use strict';

/** */
class Misc {
    constructor() {
        this.cl = this.constructor.name;
        this.NAME = 'Pack';
/**
 * 共通名
 */
        this.STORAGE = 'gvrmn';
/**
 * 
 */
        this.STORAGE_THUMB = 'gvrmthumb';

        this.baseTex = null;
        this.thumbTex = null;
        this._tex02 = null;
        this._tex03 = null;

        this.texs = [];
    }

/**
 * 
 */
    save() {
        console.log(this.cl, `save called`);
        this.gltf.makeData();
        const urlstr = this.gltf.save(true);
        if (urlstr) {
            // todo: 
            this.threed.setModel(urlstr);
            URL.revokeObjectURL(urlstr);
        }
    }

/**
 * 
 */
    init() {
        console.log(this.cl, `init called`);

        const tex = [
            { cv: cv00, name: 'baseTex' },
            { cv: cv01, name: 'thumbTex' },
            { cv: cv02, name: '_tex02' },
            { cv: cv03, name: '_tex03' },
            { cv: cv04, name: '_tex04' },
            { cv: cv05, name: '_tex05' },
            { cv: cv06, name: '_tex06' },
            { cv: cv07, name: '_tex07' }
        ];

        this.draw(cv00);
        {
            /**
             * @type {HTMLCanvasElement}
             */
            const cv = window.cv01;

            const c = cv.getContext('2d');
            let ratio = window.devicePixelRatio;
            ratio = 1;
            const w = imgthumb.naturalWidth;
            const h = imgthumb.naturalHeight;

            cv.width = w / ratio;
            cv.height = h / ratio;
            c.drawImage(imgthumb,
                0,0, w, h, // src
                0,0, cv.width, cv.height);

            console.log(`natural`, w,h);
        }

        if (false) {
            const c = cv07.getContext('2d');
            let ratio = window.devicePixelRatio;
            ratio = 1;
            const w = img07.naturalWidth;
            const h = img07.naturalHeight;

            cv07.width = w / ratio;
            cv07.height = h / ratio;
            c.drawImage(img07,
                0,0, w, h, // src
                0,0, cv07.width, cv07.height);

            console.log(`natural`, w,h);
        }

        this.draw2(cv02);
        this.draw3(cv03);
        this.draw4(cv04);
        //this.drawColor(cv5, 128,128,255);
        this.draw5(cv05);
        this.draw6(cv06);
        this.draw7(cv07);

        tex.forEach(v => {
            v.cv.toBlob(blob => {
                const reader = new FileReader();
                reader.addEventListener('load', ev => {
                    console.log(`${v.name} load fire`);

                    this.gltf[v.name] = ev.target.result;
                });
                reader.readAsArrayBuffer(blob);
            }, 'image/png');
        });

        {
            const threed = new Threed();
            const w = 512;
            const h = 512;
            const dom = threed.init(w,h, 50);
            if (dom) {
                idwebgl.appendChild(dom);
                threed.makeControl(dom);


            }
            this.threed = threed;
        }

    } // init


    /**
     * ベーステクスチャ
     * @param {HTMLCanvasElement} cv 
     */
    draw(cv) {
        console.log(`draw called`);
        const w = cv.width;
        const h = cv.height;
        const c = cv.getContext('2d');
        if (c) {
            let cnt = -8;
            const n = 16;
            for (let i = 0; i < n; ++i) {
                for (let j = 0; j < n; ++j) {
                    let x = j * 4;
                    let y = i * 4;
                    let r = 51 * (Math.floor(cnt / 36) % 6);
                    let g = 51 * (Math.floor(cnt / 6) % 6);
                    let b = 51 * (cnt % 6);
                    let a = 1;

                    if (cnt < 0) {
                        if (cnt <= -5) {
                            r = 255;
                            g = 255;
                            b = 255;
                            a = 0.25 * (cnt + 8);
                        } else {
                            r = 0;
                            g = 0;
                            b = 255;
                            a = 0.5;
                            if (cnt === -3) {
                                r = 255;
                                g = 0;
                                b = 0;
                            } else if (cnt === -2) {
                                r = 0;
                                g = 255;
                                b = 255;
                            } else if (cnt === -1) {
                                r = 0;
                                g = 255;
                                b = 0;
                            }
                        }
                    } else if (cnt >= 216) {
                        r = 128;
                        g = 128;
                        b = 128;
                        a = 1;
                    }

                    c.fillStyle = `rgba(${r},${g},${b}, ${a})`;
                    c.fillRect(x,y, 4, 4);
                    ++cnt;
                }
            }
        }
    }

/**
 * 一色で塗りつぶす
 * @param {HTMLCanvasElement} cv 
 * @param {number} r 
 * @param {number} g 
 * @param {number} b 
 */
    drawColor(cv, r,g,b) {
        const w = cv.width;
        const h = cv.height;
        const c = cv.getContext('2d');
        if (c) {
            c.fillStyle = `rgba(${r},${g},${b}, 1)`;
            c.fillRect(0,0, w,h);
        }  
    }

/**
 * 
 * @param {*} x 
 * @param {*} y 
 * @param {*} z 
 */
    tos(x,y,z) {
        let v3 = new THREE.Vector3(x,y,z);
        v3 = v3.normalize();
        v3 = v3.addScalar(1).multiplyScalar(0.5 * 255);
        const s = `rgba(${v3.x},${v3.y},${v3.z}, 1)`;
        return s;
    }

/**
 * bump ってモノクロでいいんだっけ??
 * @param {HTMLCanvasElement} cv 
 */
    draw2(cv) {
        console.log(this.cl, `draw2 called bump`);

        const w = cv.width;
        const h = cv.height;
        const c = cv.getContext('2d');

        let n = new THREE.Vector3(0,0,1);
        n = n.addScalar(1.0).multiplyScalar(0.5).multiplyScalar(255.0);

        c.fillStyle = `rgba(0.5, 0.5, 1.0, 1)`;
        c.fillRect(0,0, w,h);

        for (let i = 0; i < 16; ++i) {
            c.beginPath();
//            c.arc(w/2, h/2, w/2 - 40, 0, Math.PI * 1);
            c.moveTo(i/16*w, 0);
            c.lineTo(i/16*w, h);
            c.lineWidth = 10;
            c.strokeStyle = this.tos(1,1,1);
            c.stroke();
        }
    }

/**
 * MatCap 法線で加算
 * @param {HTMLCanvasElement} cv 
 */
    draw3(cv) {
        console.log(this.cl, `draw3 called add`);

        const w = cv.width;
        const h = cv.height;
        const c = cv.getContext('2d');
        c.fillStyle = `rgba(0,0,0, 1)`;
        c.fillRect(0,0, w,h);

        c.beginPath();
        c.arc(w/2, h/2, w/2 - 40, 0, Math.PI * 1);
        c.lineWidth = 16;
        c.strokeStyle = `rgba(128,128,255, 1)`;
        c.strokeStyle = `rgba(255, 0, 0, 1)`;
        c.stroke();

        c.beginPath();
        c.arc(w/2, h/2, w/2 - 40, Math.PI * 1, Math.PI * 2);
        c.lineWidth = 16;
        c.strokeStyle = `rgba(128,128,255, 1)`;
        //c.strokeStyle = `rgba(255, 0, 0, 1)`;
        c.stroke();
    }

    /**
     * 
     * @param {HTMLCanvasElement} cv 
     */
    draw4(cv) {
        console.log(this.cl, `draw4 called add`);

        const w = cv.width;
        const h = cv.height;
        const c = cv.getContext('2d');
        const data = c.getImageData(0,0, w,h);

        for (let i = 0; i < h; ++i) {
            for (let j = 0; j < w; ++j) {
                let x = 2.0 * j / (w - 1) - 1.0;
                let y = 2.0 * i / (h - 1) - 1.0;

                let ft = (w * i + j) * 4; // bgra
                let r = Math.max(0, Math.floor(x * 255.0));
                data.data[ft] = r;
                data.data[ft+1] = 128;
                data.data[ft+2] = 0;
                data.data[ft+3] = 255;
            }
        }
        c.putImageData(data, 0,0);
    }

    /**
     * テクスチャ
     * @param {HTMLCanvasElement} cv 
     */
    draw5(cv) {
        console.log(this.cl, `draw5 called texture`);

        const w = cv.width;
        const h = cv.height;
        const c = cv.getContext('2d');
        const data = c.getImageData(0,0, w,h);

        for (let i = 0; i < h; ++i) {
            for (let j = 0; j < w; ++j) {
                let ft = (w * i + j) * 4;

                let nmx = (j * 2 - w) / w;
                let nmy = (i * 2 - h) / h;
                let x = 0.0;
                let y = 0.0;
                let z = 1.0;
                if (-0.5 <= nmx && nmx <= -0.3) {
                    x = (nmx - (-0.4)) / 0.1;
                }
                if (-0.5 <= nmy && nmy <= -0.3) {
                    y = nmy - (-0.4);
                }

                // 正規化
                let k = x ** 2 + y ** 2 + z ** 2;
                if (k > 0) {
                    k = 1 / Math.sqrt(k);
                }
                x *= k;
                y *= k;
                z *= k;

                let r = (x + 1) / 2 * 255;
                let g = (y + 1) / 2 * 255;
                let b = (z + 1) / 2 * 255;

                r = Math.max(0, Math.min(255, r));
                g = Math.max(0, Math.min(255, g));
                b = Math.max(0, Math.min(255, b));

                data.data[ft] = r;
                data.data[ft+1] = g;
                data.data[ft+2] = b;
                data.data[ft+3] = 255;
            }
        }
        c.putImageData(data, 0,0);
    }

    /**
     * 面用通常用テクスチャ
     * 
     * @param {HTMLCanvasElement} cv 
     */
    draw6(cv) {
        console.log(this.cl, `draw6 called texture`);

        const w = cv.width;
        const h = cv.height;
        const c = cv.getContext('2d');
        const data = c.getImageData(0,0, w,h);

        for (let i = 0; i < h; ++i) {
            for (let j = 0; j < w; ++j) {
                let ft = (w * i + j) * 4; // bgra

                let lv = 1;
                let x = 2.0 * j / (w - 1) - 1.0;
                let y = 2.0 * i / (h - 1) - 1.0;
                let d = Math.sqrt(x ** 2 + y ** 2);
                // 0 - 0 - 1 - 0 - 0
                d = d * 2;
                if (d > 1) {
                    d = 1;
                }
                lv = 1 - Math.cos(d * Math.PI) * 0.2;
                //lv = 1; // TODO: 模様無し

                let r = 255;
                let g = 204;
                let b = 153;
                r *= lv;
                g *= lv;
                b *= lv;

                r = Math.max(0, Math.min(255, Math.floor(r)));
                g = Math.max(0, Math.min(255, Math.floor(g)));
                b = Math.max(0, Math.min(255, Math.floor(b)));

                data.data[ft] = r;
                data.data[ft+1] = g;
                data.data[ft+2] = b;
                data.data[ft+3] = 255;
            }
        }
        c.putImageData(data, 0,0);
    }

    /**
     * テクスチャ
     * @param {HTMLCanvasElement} cv 
     */
    draw7(cv) {
        console.log(this.cl, `draw7 called texture`);

        const w = cv.width;
        const h = cv.height;
        const c = cv.getContext('2d');
        const data = c.getImageData(0,0, w,h);

        for (let i = 0; i < h; ++i) {
            for (let j = 0; j < w; ++j) {
                let x = 2.0 * j / (w - 1) - 1.0;
                let y = 2.0 * i / (h - 1) - 1.0;

                let ft = (w * i + j) * 4; // bgra

                let d = Math.abs(x);
                d *= 2;
                if (d > 1) {
                    d = 1;
                }
                let lv = (Math.cos(d * Math.PI) + 1) * 0.5;
                //lv = 1;

                lv = Math.floor(lv * 255);
                lv = Math.max(0, Math.min(255, lv));

                data.data[ft] = lv;
                data.data[ft+1] = 0;
                data.data[ft+2] = 0;
                data.data[ft+3] = 255;
            }
        }
        c.putImageData(data, 0,0);
    }

    /**
     * 
     * @param {HTMLCanvasElement} cv 
     */
    drawInner(cv) {
        console.log(this.cl, `drawInner called add`);

        const w = cv.width;
        const h = cv.height;
        const c = cv.getContext('2d');
        const data = c.getImageData(0,0, w,h);

        for (let i = 0; i < h; ++i) {
            for (let j = 0; j < w; ++j) {
                let r = 0;
                let g = 0;
                let b = 0;

                data.data[ft] = r;
                data.data[ft+1] = g;
                data.data[ft+2] = b;
                data.data[ft+3] = 255;
            }
        }

        c.putImageData(data, 0,0);
    }

/**
 * メイン
 */
    makeFile() {
        console.log(this.cl, `makeFile called`);
        { // バイナリ作る
            this.gltf.makeData2();
            const urlstr = this.gltf.save(true);
            if (urlstr) {
                this.threed.setModel(urlstr);
                URL.revokeObjectURL(urlstr);

                setTimeout(() => {
                    this.saveSetting();
                }, 3000);
            }
        }
    }

    loadFile(inPath) {
        console.log(this.cl, `loadFile called`, inPath);
        {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', inPath);
            xhr.responseType = 'arraybuffer';
            xhr.addEventListener('load', ev=>{
                const parser = new GltfParser();
                parser.parse(ev.currentTarget.response);
            });
            xhr.send();
        }
    }

    loadSetting() {
        console.log(`loadSetting called`);

        let str = localStorage.getItem(this.STORAGE);
        try {
            const obj = JSON.parse(str);
            if (obj) {

            }
        } catch(ec) {
            console.warn(`parse catch`, ec.message);
        }

        str = localStorage.getItem(this.STORAGE_THUMB);
        if (str) {
            window.img06.src = str;
            console.log(`str.length`, str.length);
        }
    }
    saveSetting() {
        console.log(`${this.NAME}#saveSetting called`);

        const obj = {};
        let str = '';
        if (true) {
            const cv = window.idwebgl.children[0];
            str = cv.toDataURL('image/png');
        }
        localStorage.setItem(this.STORAGE_THUMB, str);
        console.log(`${this.NAME}#saveSetting leave`, obj, str.length);
    }

    onload() {
        this.loadSetting();
    
        {
            const gltf = new Gltf();
            this.gltf = gltf;
            gltf.loadPart('part001.json');
            gltf.loadObj('obj11_6.obj');
        }
    
        {
            idSave3.addEventListener('click', ev => {
                this.makeFile();
            });
        }
    
        {
            this.init();
            info0.textContent = `${new Date().toLocaleString()}`;
        }
    
        {
            idvis.addEventListener('change', ev => {
                this.threed.setVisible('model', ev.currentTarget.checked);
            });
            idwire.addEventListener('change', ev => {
                this.threed.setWire(ev.currentTarget.checked);
            });
            idaxes.addEventListener('change', ev => {
                this.threed.setVisible('axes', ev.currentTarget.checked);
            });
        }
    
        update();
        console.log(`leave`, this);
    }

}

const pack = new Misc();

const update = () => {
    requestAnimationFrame(update);

    pack.threed.update();
};

window.addEventListener('load', () => {
    pack.onload();
});

