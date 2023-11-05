/**
 * @file aviutl.js
 */

(function(_global) {

class AUElement {
    constructor() {
        this._index = 0;

        this.data = {};
/**
 * 表示を0-originにしても1から開始する
 */
        this.data.start = 1;
/**
 * 1-1 の場合、1フレーム分の長さ
 */
        this.data.end = 1;
/**
 * 配置するレイヤー番号
 */
        this.data.layer = 1;

        this.data.overlay = 1;

//        this.camera = 1;
//        this.audio = 1;


        this.data0 = null;
        this.data1 = null;
    }

/**
 * この要素の全ラインを取得する
 * this._index を事前に適切にセットしておくこと
 * @returns {string[]}
 */
    getLines() {
        const ss = [
            `[${this._index}]`
        ];
        for (const k in this.data) {
            ss.push(`${k}=${this.data[k]}`);
        }

        if (this.data0) {
            ss.push(`[${this._index}.0]`);
            for (const k in this.data0) {
                ss.push(`${k}=${this.data0[k]}`);
            }           
        }

        if (this.data1) {
            ss.push(`[${this._index}.1]`);
            for (const k in this.data1) {
                ss.push(`${k}=${this.data1[k]}`);
            }
        }
        return ss;
    }
}

class AUText extends AUElement {
    constructor() {
        super();

        this.data0 = {
            ['_name']: 'テキスト',
            ['サイズ']: 34,
            ['表示速度']: 0,
            ['text']: '0000'
        };
        this.data1 = {
            ['_name']: '標準描画',
        };
    }

}

class AUAudio {
    constructor() {
        super();

        this.data0 = {
            ['_name']: '音声ファイル',
            ['再生位置']: 0,
            ['再生速度']: 0,
            ['ループ再生']: 0,
            ['動画ファイルと連携']: 1,
            file: '',
        };
        this.data1 = {
            ['_name']: '標準再生',
            ['音量']: 100,
            ['左右']: 0,
        };
    }
}



class AUGroup extends AUElement {
    constructor() {
        super();

        this.data0 = {
            ['_name']: 'グループ制御',
            ['上位グループ制御の影響を受ける']: 0,
            ['同じグループのオブジェクトを対象にする']: 1,
            range: 0,
        };

        // .1 は無い
    }
}

class Project {
    constructor() {
/**
 * @type {AUElement[]}
 */
        this.elements = [];

        this.data = {
            width: 960,
            height: 540,
            rate: 30,
            scale: 1,
            length: 301,
            audio_rate: 48000,
            audio_ch: 2,
        };
    }

/**
 * 1ファイル分
 * @returns {string[]}
 */
    getLines() {
        const ss = [];
        ss.push('[exedit]');
        for (const k in this.data) {
            ss.push(`${k}=${this.data[k]}`);
        }
        for (const el of this.elements) {
            ss.push(...el.getLines());
        }
        return ss;
    }
}


_global.AVIUTL = {
    AUElement,
    AUText,
    AUAudio,
    AUGroup,
    Project,
};


})(globalThis);

