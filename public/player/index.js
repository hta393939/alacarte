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
        window.addEventListener('message', ev => {
            switch(ev.data.type) {
            case 'a':
                break;
            case 'b':
                break;
            case 'c':
                break;
            }
        });

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
    }

}

const misc = new Misc();
misc.initialize();



