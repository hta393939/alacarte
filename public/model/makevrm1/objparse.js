/**
 * @file objparse.js
 */


class ObjParse {
    constructor() {
        this.cl = this.constructor.name;
    }

    async loadmtl(inpath) {
        const res = await fetch(`${inpath}`);
        const text = await res.text();
        const ss = text.split('\n');
        for (const line of ss) {
            if (line.startsWith('#')) {
                continue;
            }


        }
        console.log(ss);
    }

    /**
     * 
     * @param {string} inwhole 
     * @param {{mtl: boolean}} inopt 
     */
    async parse(inwhole, inopt = {}) {
        const ret = {
            os: [],
            vs: [],
            vts: [],
            vns: []
        };

        const re = /^\s*(?<type>\S+)\s+(?<body>.*)\s*$/;
        const ref1 = /\d+\/\d+\/\d+/;
        const ref2 = /\d+\/\d+\/\d+/;
        const ref3 = /(?<v>\d+)\/(?<vt>\d+)\/(?<vn>\d+)/;

        const ss = inwhole.split('\n');
        let curname = '_default';
        let curflag = false;
        let curobj = {
            fs: [],
            name: '' + curname
        };
        for (const line of ss) {
            if (line.startsWith('#')) {
                continue;
            }
            const m = re.exec(line);
            if (m) {
                const obj = {
                    type: m.groups.type,
                    body: m.groups.body,
                    vs: []
                };
                if (obj.type === 'mtllib') {
                    ret.mtllib = '' + obj.body;
                    if (inopt.mtl) {
                        const mtls = await this.loadmtl(ret.mtllib)
                            .catch(err => {
                                console.warn(`loadmtl`, err);
                            });
                    }
                    continue;
                }
                if (obj.type === 'o') {
                    // カレントが存在したら処理
                    if (curflag) {
                        curflag = false;
                        ret.os.push(curobj);
                        curobj = null;
                    }

                    curname = '' + obj.body;
                    curobj = {
                        fs: [],
                        name: curname
                    };
                    curflag = true;
                    continue;
                }
                if (obj.type === 'usemtl') {
                    curobj.usemtl = '' + obj.body;
                    continue; // 複数はあるのか...
                }
                if (obj.type === 's') {
                    curobj.s = '' + obj.body;
                    continue;
                }

                if (obj.type === 'f') {
                    // インデックスはファイル全体で通しがつく。1-origin
                    const oneface = {
                        vs: []
                    };
                    const sf = obj.body.split(' ');
                    for (const s3 of sf) {
                        const m3 = ref3.exec(s3);
                        if (m3) {
                            const indices = {
                                str: s3,
                                v: parseInt(m3.groups.v),
                                vt: parseInt(m3.groups.vt),
                                vn: parseInt(m3.groups.vn)
                            };
                            oneface.vs.push(indices);
                        }
                    }
                    curobj.fs.push(oneface);
                    continue;
                }

                {
                    const ss2 = m.groups.body.split(' ');
                    for (const v of ss2) {
                        const val = parseFloat(v);
                        if (!isNaN(val)) {
                            obj.vs.push(val);
                        }
                    }

                    if (obj.type === 'v') {
                        ret.vs.push(obj.vs);
                    } else if (obj.type === 'vt') {
                        ret.vts.push(obj.vs);
                    } else if (obj.type === 'vn') {
                        ret.vns.push(obj.vs);
                    }
                }
                //console.log(obj);
            } else {
                console.warn(`no match line`, line);
            }
        }

        if (curflag) {
            ret.os.push(curobj);
        }

        for (const obj of ret.os) {
            console.log(obj);
        }

        return ret;
    }

    /**
     * 使う v, vt, vn だけから再構成するので重複はあまり心配しなくていい
     * @param {{os: {}[], vs: {}[], vts: {}[], vns: {}[]}} inopt 
     * @param {string} inname inopt.os[index] の中の name から見つける
     */
    makeVertex(inopt, inname) {
        const ret = {
            vs: [],
            fs: [],
            /**
             * @type {number[][]}
             */
            faces: []
        };

        const mtl = inopt.os.find(v => {
            return v.name === inname;
        });
        if (mtl == null) {
            return ret;
        }

        for (const oneface of mtl.fs) {
            const fis = [];
            for (const fi of oneface.vs) {
                //console.log(fi);

                /**
                 * 0-origin
                 */
                let index = ret.vs.findIndex(v => {
                    return (v.name === fi.str);
                });
                if (index < 0) {
                    const vtx = new Vtx();
                    vtx.name = '' + fi.str;
                    { // 3要素をセットする
                        const i = fi.v - 1;
                        vtx.p.fromArray(inopt.vs[i]);
                    }
                    {
                        const i = fi.vt - 1;
                        vtx.uv.fromArray(inopt.vts[i]);
                    }
                    {
                        const i = fi.vn - 1;
                        vtx.n.fromArray(inopt.vns[i]);
                    }

                    {
                        vtx.wei.fromArray([1, 0, 0, 0]);
                    }
                    {
                        vtx.jnt.fromArray([0, 0, 0, 0]);
                    }

                    ret.vs.push(vtx);

                    index = ret.vs.length - 1;
                }
                //ret.fs.push(index);

                fis.push(index);
            }

            for (let i = 0; i < fis.length - 2; ++i) {
                const tris = [fis[0], fis[i+1], fis[i+2]];
                ret.faces.push(tris);

                ret.fs.push(...tris);
            }

            //console.log(`length`, ret.fs.length);
        }
        console.log(this.cl, `makeVertex leave`, inname, ret);
        return ret;
    }

}

