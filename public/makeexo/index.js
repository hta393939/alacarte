/**
 * @file index.js
 */

class Misc {
    constructor() {
    }

    makeExo1() {
        let ss = [];
        ss.push(``);
        ss.push(``);
        ss.push(``);
        return ss;
    }

/**
 * 未実装
 * @param {string} str 
 */
    async strToSJISBinary(str) {
        let ab = new ArrayBuffer(str);
        return ab;
    }

/**
 * バイナリを hex 文字列へ変換
 * @param {ArrayBuffer} ab 
 */
    binaryToHex(ab) {
        const len = ab.byteLength;
        const p = new DataView(ab);
        const ss = [];
        for (let i = 0; i < len; ++i) {
            const u8 = p.getUint8(i);
            ss.push(u8.toString(16).padStart(2, '0'));
        }
        return ss.join('');
    }

/**
 * 未実装
 * 文字列を生成した後，全体を shift_jis へ変換して
 * ダウンロード
 */
    makeExo() {
        const ss = [];
        {
            ss.push('[exedit]');
            ss.push(`width=${960}`);
            ss.push(`height=${540}`);
            ss.push(`rate=${30}`);
            ss.push(`scale=${1}`);
            ss.push(`length=${2580}`);
            ss.push(`audio_rate=${48000}`);
            ss.push(`audio_ch=${2}`);
            ss.push(`alpha=${1}`);
            ss.push(`name=${'メイン'}`);
        }
        {
            ss.push(`[3]`);
            ss.push(`start=${1}`);
            ss.push(`end=${178}`);
            ss.push(`layer=${3}`);
            ss.push(`overlay=${1}`);
            ss.push(`camera=${0}`);
        }
        {
            ss.push(`[3.0]`);
            ss.push(`_name=テキスト`);
            ss.push(`サイズ=48`);
            ss.push(`表示速度=0.0`);
            ss.push(`B=1`);
            ss.push(`I=0`);
            ss.push(`font=${'BIZ UDゴシック'}`);
            ss.push(`text=${''.padStart(4096, '0')}`);
        }
        {
            ss.push(`[3.1]`);
            ss.push(`_name=標準描画`);
        }

        let s = ss.join('\r\n');
        const blob = new Blob([s]);
        this.download(blob, `a.exo`);
    }

/**
 * 
 * @param {Blob} blob 
 * @param {string} name 
 */
    download(blob, name) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    async initialize() {
        this.setListener();

        {
            let s = '';
            s += `${window.innerWidth}`;
            s += `x${window.innerHeight}`;
            const el = window.innerview;
            el.textContent = s;
        }

        this.enumVoice();
    }

    async enumVoice() {
        const voices = window.speechSynthesis.getVoices();
        for (const voice of voices) {
            if (!voice.lang.toLocaleLowerCase().includes('ja')) {
                continue;
            }
            console.log(voice);
            if (voice.name.toLocaleLowerCase().includes('nanami')) {
                this.selectVoice = voice;
            }
        }
    }

    async say(text) {
        const synth = window.speechSynthesis;
        const utt = new SpeechSynthesisUtterance(text);
        if (this.selectVoice) {
            utt.voice = this.selectVoice;
        }
        synth.speak(utt);
    }

    setListener() {
        {
            const el = document.getElementById('enumvoice');
            el?.addEventListener('click', () => {
                this.enumVoice();
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

        {
            const el = document.getElementById('cap');
            el?.addEventListener('click', () => {
                this.startCapture();
            });
        }
    }

    async startCapture() {
        const opt = {
            audio: true,
            video: true,
        };
        const stream = await navigator.mediaDevices.getDisplayMedia(opt);
        window.mainvideo.srcObject = stream;
        await window.mainvideo.play();
    }

    openWindow() {
        let width = 640;
        let height = 360;
        let hOffset = -1;
        let url = '../player/index.html';
        let feats = [
            //`popup`,
            `width=${width}`,
            `height=${height + hOffset}`,
        ];
        const win = window.open(url,
            //'_blank',
            'corge',
            feats.join(','));
        this.win = win;
    }

}

const misc = new Misc();
misc.initialize();



