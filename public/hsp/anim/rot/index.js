class Misc {
  init() {
  }

  downloadFile() {
    {
      const chs = [
        {targetId: 'head'},
      ];
      const text = this.makeXML(chs);
      this.download(new Blob([text]), `a.xml`);
    }
  }

  download(blob, name) {
    const a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(blob);
    a.click();
  }

  makeXML(chs) {
    const rootel = document.createElement('root');
    const asel = document.createElement('Animations');
    asel.setAttribute('id', '__Animations__');

    rootel.appendChild(asel);
    const ael = document.createElement('Animation');
    ael.setAttribute('id', 'animations');
    asel.appendChild(ael);
    for (let i = 0; i < chs.length; ++i) {
      const ch = chs[i];

      const chel = document.createElement('AnimationChannel');
      ael.appendChild(chel);


      const attribel = document.createElement('targetAttrib');
      attribel.textContent = `16 TARGET_ROTATE_TRANSLATE`;
      chel.appendChild(attribel);

      const targetel = document.createElement('targetId');
      targetel.textContent = ch.targetId;
      chel.appendChild(targetel);

      const kel = document.createElement('keytimes');
      kel.setAttribute('Count', `2`);
      kel.textContent = `${[``, ``].join(' ')}`;
      chel.appendChild(kel);

      const vel = document.createElement('values');
      vel.setAttribute('Count', `${2*7}`);
      vel.textContent = `${[``, ``].join(' ')}`;
      chel.appendChild(vel);

      const tinel = document.createElement('tangentsIn');
      tinel.setAttribute('Count', `0`);
      chel.appendChild(tinel);

      const toutel = document.createElement('tangentsOut');
      toutel.setAttribute('Count', `0`);
      chel.appendChild(toutel);

      const interel = document.createElement('interpolations');
      interel.setAttribute('Count', `1`);
      interel.textContent = `${[`1`, ``].join(' ')}`;
      chel.appendChild(interel);
    }

    let str = rootel.outerHTML;
    str = this.replaceTag(str);
    return str;
  }

  replaceTag(intext) {
    let result = intext;
    const pairs = [
      {target: 'Animations'},
      {target: 'Animation'},
      {target: 'AnimationChannel'},
      {target: 'targetAttrib'},
      {target: 'targetId'},
      {target: 'tangentsIn'},
      {target: 'tangentsOut'},
      {target: 'interpolations'},
    ];
    for (const pair of pairs) {
      {
        const search = new RegExp(`<${pair.target.toLocaleLowerCase()}`);
        const rep = `<${pair.target}`;
        result = result.replace(search, rep);
      }
      {
        const search = new RegExp(`</${pair.target.toLocaleLowerCase()}>`);
        const rep = `</${pair.target}>`;
        result = result.replace(search, rep);
      }
    }

    return result;
  }

}

const misc = new Misc();
globalThis.misc = misc;
misc.init();
