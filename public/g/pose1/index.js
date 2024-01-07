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

