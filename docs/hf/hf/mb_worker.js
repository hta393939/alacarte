// Runs the whole generation off the main thread: encode, the ONNX model (WebGPU), decode and endpoint correction.
// Messages in:  {type: 'init', ortVersion, modelUrl, ep, runtimeUrl}
//               {type: 'gen', id, context: Float32Array[4], target: Float32Array[1..4]}
// Messages out: {type: 'ready'} | {type: 'error', message} | {type: 'progress', loaded, total} (model download, bytes)
//               | {type: 'cached'} (the model comes from this browser's Cache Storage)
//               {type: 'gen', id, frames: Float32Array (n * J * 7), n, tokens, ms: {encode, run, decode}}
let mb, sk, session;
let queue = Promise.resolve();  // one session.run at a time

self.onmessage = (e) => { queue = queue.then(() => handle(e.data)); };

// The model's bytes, kept in Cache Storage after the first download. On Hugging Face the model URL redirects to a newly
// signed CDN address every time, so the browser's own HTTP cache never hits and each visit fetched all 380 MB again.
// Stored in 32 MB parts (one 380 MB entry failed with an internal error) plus a small entry with the part count.
// Without Cache Storage (blocked, private mode, full) it just downloads.
const PART = 32e6;
const partKey = (url, i) => { const u = new URL(url, self.location.href); u.searchParams.set('mbpart', String(i)); return u.href; };
async function loadModel(url) {
  let cache = null;
  try { cache = await caches.open('motionbricks-model-v1'); } catch { cache = null; }
  try {
    const meta = cache && await cache.match(partKey(url, 'meta'));
    if (meta) {
      self.postMessage({ type: 'cached' });
      const { total, parts } = await meta.json(), bytes = new Uint8Array(total);
      for (let i = 0, at = 0; i < parts; i++) {
        const p = await cache.match(partKey(url, i));
        if (!p) throw new Error('missing part');
        const b = new Uint8Array(await p.arrayBuffer()); bytes.set(b, at); at += b.length;
      }
      return bytes;
    }
  } catch { /* incomplete: download again */ }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`model download failed (HTTP ${res.status})`);
  const total = +res.headers.get('content-length') || 0, reader = res.body.getReader(), chunks = [];
  let loaded = 0, shown = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); loaded += value.length;
    if (loaded - shown > 4e6) { shown = loaded; self.postMessage({ type: 'progress', loaded, total }); }
  }
  const bytes = new Uint8Array(loaded);
  let at = 0;
  for (const c of chunks) { bytes.set(c, at); at += c.length; }
  if (cache) {
    try {
      const parts = Math.ceil(loaded / PART);
      for (let i = 0; i < parts; i++) await cache.put(partKey(url, i), new Response(bytes.slice(i * PART, Math.min(loaded, (i + 1) * PART))));
      await cache.put(partKey(url, 'meta'), new Response(JSON.stringify({ total: loaded, parts })));  // last: marks it complete
    } catch { /* full or blocked: next visit downloads again */ }
  }
  return bytes;
}

async function handle(m) {
  try {
    if (m.type === 'init') {
      //importScripts(`https://cdn.jsdelivr.net/npm/onnxruntime-web@${m.ortVersion}/dist/ort.webgpu.min.js`);
      importScripts(`./ort.webgpu.min.js`);
      ort.env.wasm.wasmPaths = `./`;
      //ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${m.ortVersion}/dist/`;
      mb = await import(`./mb_runtime.js${self.location.search}`);  // same build query as the worker itself

      const rt = await fetch(m.runtimeUrl).then((r) => r.json());

      sk = new mb.Skeleton(rt.joint_names, rt.parents, rt.reference);

      console.log('create calling...');

      session = await ort.InferenceSession.create(await loadModel(m.modelUrl), { executionProviders: [m.ep] });
      // warm up the shaders with a standing pose
      const idle = rt.styles.find((s) => s.id === 'idle').window.map((p) => Float32Array.from(p.flat()));

      console.log('handle idle', idle);

      await mb.generate(ort, session, sk, new mb.Recorder(idle[3]), idle);
      self.postMessage({ type: 'ready' });
    } else if (m.type === 'gen') {
      const recorder = { context: () => m.context };  // the main thread already sampled the context
      const g = await mb.generate(ort, session, sk, recorder, m.target, m.opts || {});
      const n = g.frames.length, size = sk.J * 7;
      const flat = new Float32Array(n * size);
      g.frames.forEach((f, i) => flat.set(f, i * size));
      self.postMessage({ type: 'gen', id: m.id, frames: flat, n, tokens: g.tokens, ms: g.ms }, [flat.buffer]);
    }
  } catch (err) {
    self.postMessage({ type: 'error', id: m.id, message: String(err && err.stack || err) });
  }
}
