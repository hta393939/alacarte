/**
 * @file index.js
 */

class Misc {
    constructor() {
    }

    async initialize() {
        this.setListener();

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
    }

}

const misc = new Misc();
misc.initialize();



