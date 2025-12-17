
(function(_global) {

class AU2Base {
  /**
   * au2では0からっぽい
   */
  #head = 0;
  /**
   * 1-1 の場合、1フレーム分の長さ
   */
  #tail = 80;
  constructor() {
    /**
     * 配置するレイヤー番号
     */
    this.layer = 1;
    this.update();

    //this.group = 1;
    //this.overlay = 1;
  }

  update() {
    this.frame = `${this.head},${this.tail}`;
  }

  get head() {
    return this.#head;
  }
  set head(val) {
    this.#head = val;
    this.update();
  }
  get tail() {
    return this.#tail;
  }
  set tail(val) {
    this.#tail = val;
    this.update();
  }

}

class AU2Standard {
  constructor() {
    this['effect.name'] = '標準描画';
    this['X'] = 0;
    this['Y'] = 0;
    this['Z'] = 0;
    this['Group'] = 1;
    this['合成モード'] = '通常';
  }
}

class AU2Element {
  constructor() {
    this._index = 0;

    this.data = new AU2Base();

    /*
    this.data._start = 1;

    this.data._end = 61;

    this.data.layer = 1;
*/
    //this.data.group = 1;

    //this.data.overlay = 1;

//        this.camera = 1;
//        this.audio = 1;

    this.data0 = null;
    this.data1 = null;
    this.data2 = null;
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

    if (this.data2) {
      ss.push(`[${this._index}.2]`);
      for (const k in this.data2) {
        ss.push(`${k}=${this.data2[k]}`);
      }
    }

    if (this.data3) {
      ss.push(`[${this._index}.3]`);
      for (const k in this.data3) {
        ss.push(`${k}=${this.data3[k]}`);
      }  
    }

    return ss;
  }
}

/**
 * テキスト
 */
class AU2Text extends AU2Element {
  /**
   * 縁取り文字影など無し
   */
  static TYPE_NORMAL = '標準文字';
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

  static TYPE_EDGETHICK = '縁取り文字(太)';

  /** 縁取り細い */
  static TYPE_EDGETHIN = 4;

  /** 左上 */
  static ALIGN_LEFTTOP = '左寄せ[上]';
  /** 中央揃え中 */
  static ALIGN_CENTERMIDDLE = '中央揃え[中]';
  /** 中央揃え下 */
  static ALIGN_CENTERBOTTOM = '中央揃え[下]';

  constructor() {
    super();

    //this.data.camera = 0;

    this.data0 = {
      ['effect.name']: 'テキスト',
      ['サイズ']: 30,
      '字間': 4,
      '行間': 0,
      ['表示速度']: 0,
      'フォント': 'BIZ UDPゴシック',
      //'フォント': 'UD デジタル教科書体 NK-B',
      //font: 'メイリオ',
      //font: 'Noto Sans JP Black',
      '文字色': 'ffffff',
      '影・縁色': '1a1a1c',
      '文字装飾': AU2Text.TYPE_EDGE,
      '文字揃え': AU2Text.ALIGN_CENTERBOTTOM,
      B: 1,
      I: 0,
      'テキスト': '',
      ['文字毎に個別オブジェクト']: 0,
      ['自動スクロール']: 0,
      ['移動座標上に表示する']: 0,
      'オブジェクトの長さを自動調節': 0,
    };

    if (true) {
      this.data1 = new AU2Standard();

      this.data2 = {
        ['effect.name']: 'オフスクリーン描画',
      };

      this.data3 = {
        ['effect.name']: '縁取り',
        ['サイズ']: 3,
        ['ぼかし']: 10,
        '縁色': 'ffffff',
        'パターン画像': '',
      };

    } else {

      this.data1 = {
        ['_name']: '縁取り',
        ['サイズ']: 3,
        ['ぼかし']: 10,
        color: 'ffffff',
        file: '',
      };
      this.data2 = {
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

  }

  setText(instr) {
    this.data0['テキスト'] = instr;
  }

}

/**
 * 音声ファイル
 */
class AU2Audio extends AU2Element {
  constructor() {
    super();

    this.data0 = {
      ['effect.name']: '音声ファイル',
      ['再生位置']: `0.000,0.000,再生範囲,0`,
      ['再生速度']: 100,
      'ファイル': '',
      'トラック': 0,
      ['ループ再生']: 0,
      //['動画ファイルと連携']: 0,
    };
    this.data1 = {
      ['effect.name']: '標準再生',
      ['音量']: 100,
      ['左右']: 0,
    };
  }
}


/**
 * グループ制御
 */
class AU2Group extends AU2Element {
  constructor() {
    super();

    this.data0 = {
      ['effect.name']: 'グループ制御',
      ['X']: 0,
      ['Y']: 0,
      ['Z']: 0,
      Group: 1,
      ['X軸回転']: 0,
      ['Y軸回転']: 0,
      ['Z軸回転']: 0,
      ['拡大率']: 100,
      '対象レイヤー数': 3,
      //['上位グループ制御の影響を受ける']: 0,
      //['同じグループのオブジェクトを対象にする']: 1,
    };

    // .1 は無い
  }
}

class Project2 {
  constructor() {
    /**
     * @type {AU2Element[]}
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
      alpha: 1,
      name: 'znd',
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
  AU2Element,
  AU2Text,
  AU2Audio,
  AU2Group,
//  Project2,
};


})(globalThis);

