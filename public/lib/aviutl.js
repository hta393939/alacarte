/**
 * @file aviutl.js
 */

(function(_global) {

class AUElement {
    constructor() {
        this._index = 0;
/**
 * 表示を0-originにしても1から開始する
 */
        this.start = 1;
/**
 * 1-1 の場合、1フレーム分の長さ
 */
        this.end = 1;



        this.layer = 1;
        this.camera = 1;
    }

    getLines() {
        const ss = [];

        return ss;
    }
}

class Text extends AUElement {
    constructor() {
        super();

        this.data0 = {
            ['']: 0,
            ['']: 1,
            ['']: 2,
        };
        this.data1 = {
            ['']: 0,
            ['']: 1,
            ['']: 2,
        };
    }

    getLines() {
        const ss = [];
        ss.push(...super.getLines());
        for (const k in this.data0) {
            ss.push(`${k}=${this.data0[k]}`);
        }
        for (const k in this.data1) {
            ss.push(`${k}=${this.data1[k]}`);
        }
        return ss;
    }
}

class Project {
    constructor() {
/**
 * @type {AUElement[]}
 */
        this.elements = [];

        this.data = {
            width: 640,
            height: 480,
        };
    }

    getLines() {
        const ss = [];
        ss.push('[exedit]');
        for (const k in this.data) {
            ss.push(`${k}=${this.data[k]}`);
        }
        return ss;
    }
}



_global.AVIUTL = {
    AUElement,
    Text,
    Project,
};


})(globalThis);

