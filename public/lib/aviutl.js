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
        this.data.end = 61;
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

/**
 * テキスト
 */
class AUText extends AUElement {
/**
 * 縁取り文字影など無し
 */
    static TYPE_NORMAL = 0;
/**
 * 影つき
 */
    static TYPE_SHADOW = 1;
/**
 * 影付き薄い
 */
    static TYPE_SHADOW2 = 2;
/**
 * 縁取り
 */
    static TYPE_EDGE = 3;
/**
 * 縁取り細い
 */
    static TYPE_EDGETHIN = 4;

/**
 * 左上
 */
    static ALIGN_LEFTTOP = 0;
/**
 * 中央揃え中
 */
    static ALIGN_CENTERMIDDLE = 4;
/**
 * 中央揃え下
 */
    static ALIGN_CENTERBOTTOM = 7;

/**
 * UTF-16 little endian をテキスト化
 * @param {string} instr 
 * @returns {string} 4096 文字(0-9a-f)
 */
    static Make4096(instr) {
        const _pad = (v, n = 2) => String(v).padStart(n, '0');
        const cs = Array.from(instr);
        let ss = [];
        for (let i = 0; i < cs.length; ++i) {
            const code = cs[i].charCodeAt(0);
            ss.push(_pad((code & 0xff).toString(16))); // 下位
            ss.push(_pad((code >> 8).toString(16))); // 上位
        }
        return ss.join('').padEnd(4096, '0');
    }

    constructor() {
        super();

        this.data.camera = 0;

/**
 * 変換元
 */
        this._text = '';

        this.data0 = {
            ['_name']: 'テキスト',
            ['サイズ']: 30,
            ['表示速度']: 0,
            ['文字毎に個別オブジェクト']: 0,
            ['移動座標上に表示する']: 0,
            ['自動スクロール']: 0,
            B: 1,
            I: 0,
            type: AUText.TYPE_EDGE,
            autoadjust: 0,
            soft: 1,
            monospace: 0,
            align: AUText.ALIGN_CENTERBOTTOM,
            spacing_x: 4,
            spacing_y: 0,
            precision: 1,
            color: 'ffffff',
            color2: '000000',
            font: 'BIZ UDPゴシック',
            text: '0000',
        };
        this.data1 = {
            ['_name']: '標準描画',
            X: 0,
            Y: 0,
            Z: 0,
            ['拡大率']: 100,
            ['透明度']: 0,
            ['回転']: 0,
            blend: 0,
        };
    }

    setText(instr) {
        this._text = instr;
        this.data0.text = AUText.Make4096(instr);
    }

}

/**
 * 音声ファイル
 */
class AUAudio extends AUElement {
    constructor() {
        super();

        this.data.audio = 1;

        this.data0 = {
            ['_name']: '音声ファイル',
            ['再生位置']: 0,
            ['再生速度']: 100,
            ['ループ再生']: 0,
            ['動画ファイルと連携']: 0,
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
            length: 61,
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

