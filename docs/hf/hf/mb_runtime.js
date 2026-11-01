// MotionBricks SOMA runtime in JavaScript: a port of the official Python/Warp engine and player
// (motionbricks/model/soma/kernels.py, model/generation.py, runtime/motion_player.py, runtime/motion_recorder.py,
// utils/time_utils.py, utils/pose_utils.py). Everything is in SOMA model space (Y up, meters); model_to_runtime is the
// identity. A pose is a Float32Array of J*7 values: per joint the local position xyz and quaternion xyzw, root first.

export const FPS = 30;
export const POSES_PER_TOKEN = 4;
export const BOUNDARY = POSES_PER_TOKEN - 1;
export const MIN_TOKENS = 6, MAX_TOKENS = 16;
export const MAX_VALID_FRAMES = MAX_TOKENS * POSES_PER_TOKEN - 2 * BOUNDARY;
export const MODEL_JOINTS = [
  'Hips', 'Spine1', 'Spine2', 'Chest', 'Neck1', 'Neck2', 'Head', 'Jaw', 'LeftEye', 'RightEye',
  'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'LeftHandThumbEnd', 'LeftHandMiddleEnd',
  'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand', 'RightHandThumbEnd', 'RightHandMiddleEnd',
  'LeftLeg', 'LeftShin', 'LeftFoot', 'LeftToeBase', 'RightLeg', 'RightShin', 'RightFoot', 'RightToeBase',
];
const FEAT = 366;  // root 5, positions 87, 6D rotations 180, velocities 90, foot contacts 4

// ---------- quaternion / transform math (xyzw) ----------
export const qmul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
export const qinv = (q) => [-q[0], -q[1], -q[2], q[3]];
export const qnorm = (q) => { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0] / l, q[1] / l, q[2] / l, q[3] / l]; };
export function qrot(q, v) {
  const [x, y, z, w] = q;
  const tx = 2 * (y * v[2] - z * v[1]), ty = 2 * (z * v[0] - x * v[2]), tz = 2 * (x * v[1] - y * v[0]);
  return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
}
export const qrotInv = (q, v) => qrot(qinv(q), v);
export const qAxisY = (a) => [0, Math.sin(a / 2), 0, Math.cos(a / 2)];
// warp quat_slerp: q0 * axis_angle(q0^-1 q1) scaled by t, taking the short way
export function qslerp(a, b, t) {
  let d = qmul(qinv(a), b);
  if (d[3] < 0) d = [-d[0], -d[1], -d[2], -d[3]];
  const s = Math.hypot(d[0], d[1], d[2]);
  if (s < 1e-9) return qnorm(a);
  const ang = 2 * Math.atan2(s, d[3]) * t;
  const k = Math.sin(ang / 2) / s;
  return qmul(a, [d[0] * k, d[1] * k, d[2] * k, Math.cos(ang / 2)]);
}
// rotation matrix with columns x, y, z -> quaternion
export function qFromCols(x, y, z) {
  const m00 = x[0], m10 = x[1], m20 = x[2], m01 = y[0], m11 = y[1], m21 = y[2], m02 = z[0], m12 = z[1], m22 = z[2];
  const tr = m00 + m11 + m22;
  let q;
  if (tr > 0) { const s = 0.5 / Math.sqrt(tr + 1); q = [(m21 - m12) * s, (m02 - m20) * s, (m10 - m01) * s, 0.25 / s]; }
  else if (m00 > m11 && m00 > m22) { const s = 2 * Math.sqrt(1 + m00 - m11 - m22); q = [0.25 * s, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]; }
  else if (m11 > m22) { const s = 2 * Math.sqrt(1 + m11 - m00 - m22); q = [(m01 + m10) / s, 0.25 * s, (m12 + m21) / s, (m02 - m20) / s]; }
  else { const s = 2 * Math.sqrt(1 + m22 - m00 - m11); q = [(m02 + m20) / s, (m12 + m21) / s, 0.25 * s, (m10 - m01) / s]; }
  return qnorm(q);
}
const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return l > 0 ? [v[0] / l, v[1] / l, v[2] / l] : [0, 0, 0]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

// transforms as {p, q}
export const T = (p, q) => ({ p, q });
export const tmul = (A, B) => T(add(A.p, qrot(A.q, B.p)), qmul(A.q, B.q));
export const tget = (pose, j) => T([pose[j * 7], pose[j * 7 + 1], pose[j * 7 + 2]], [pose[j * 7 + 3], pose[j * 7 + 4], pose[j * 7 + 5], pose[j * 7 + 6]]);
export function tset(pose, j, t) { pose.set(t.p, j * 7); pose.set(t.q, j * 7 + 3); }
export function blendT(a, b, w) { return T(add(scl(a.p, 1 - w), scl(b.p, w)), qslerp(a.q, b.q, w)); }

// ---------- skeleton ----------
export class Skeleton {
  constructor(names, parents, reference) {
    this.names = names; this.parents = parents; this.J = names.length;
    this.reference = Float32Array.from(reference.flat());
    this.index = (n) => names.indexOf(n);
    this.modelToPose = MODEL_JOINTS.map((n) => this.index(n));
    if (this.modelToPose.includes(-1)) throw new Error('skeleton is missing model joints');
    // model joints outside the connected hierarchy keep their reference transforms when decoding
    this.poseToModel = new Int32Array(this.J).fill(-1);
    this.modelToPose.forEach((pj, mj) => {
      const p = parents[pj];
      if (p === -1 || this.poseToModel[p] >= 0) this.poseToModel[pj] = mj;
    });
    this.rightLeg = this.index('RightLeg'); this.leftLeg = this.index('LeftLeg');
  }
  // world transforms of a pose; root gets rootXform first
  world(pose, rootXform = null) {
    const out = new Array(this.J);
    for (let j = 0; j < this.J; j++) {
      const l = tget(pose, j), p = this.parents[j];
      out[j] = p < 0 ? (rootXform ? tmul(rootXform, l) : l) : tmul(out[p], l);
    }
    return out;
  }
}

// forward = up x (right - left); angle = atan2(fx, fz). Mirrors the training heading ("hips_pos").
export function headingFromHips(right, left) {
  let a = [right[0] - left[0], 0, right[2] - left[2]];
  const l = Math.hypot(a[0], a[2]);
  if (l <= 1e-6) return 0;
  a = scl(a, 1 / l);
  const f = cross([0, 1, 0], a);
  return Math.atan2(f[0], f[2]);
}

// ---------- encode (compute_guide_alignment_kernel + encode_motionbricks_inputs_kernel + write_conditions) ----------
export function encode(sk, contextPoses, targetPoses, { headingAlignment = [1, 0], allowedTokens = [8, 9, 10, 11, 12, 13, 14] } = {}) {
  const nT = targetPoses.length;
  const guide = [];
  for (let i = 0; i < 4; i++) guide.push(sk.world(contextPoses[i]));
  for (let i = 0; i < 4; i++) guide.push(sk.world(targetPoses[Math.min(i, nT - 1)]));
  const last = guide[3];
  const hips = last[0].p;
  const cur = headingFromHips(last[sk.rightLeg].p, last[sk.leftLeg].p);
  const desired = Math.atan2(headingAlignment[0], headingAlignment[1]);
  const align = T([hips[0], 0, hips[2]], qAxisY(cur - desired));
  const aligned = (p) => qrotInv(align.q, sub(p, align.p));
  const alignQinv = qinv(align.q);

  const grv = new Float32Array(8 * 5), lrv = new Float32Array(8 * 4), lp = new Float32Array(8 * 267);
  const NM = MODEL_JOINTS.length;
  for (let f = 0; f < 8; f++) {
    const next = f === 3 ? f : Math.min(f + 1, 7);
    const g = guide[f], gn = guide[next];
    const ch = aligned(g[0].p), nh = aligned(gn[0].p);
    const chd = headingFromHips(aligned(g[sk.rightLeg].p), aligned(g[sk.leftLeg].p));
    const nhd = headingFromHips(aligned(gn[sk.rightLeg].p), aligned(gn[sk.leftLeg].p));
    const dh = Math.atan2(Math.sin(nhd - chd), Math.cos(nhd - chd));
    grv.set([ch[0], ch[1], ch[2], Math.cos(chd), Math.sin(chd)], f * 5);
    lrv.set([dh * FPS, (nh[0] - ch[0]) * FPS, (nh[2] - ch[2]) * FPS, ch[1]], f * 4);
    const root = [ch[0], 0, ch[2]];
    for (let mj = 0; mj < NM; mj++) {
      const w = g[sk.modelToPose[mj]];
      if (mj > 0) lp.set(sub(aligned(w.p), root), f * 267 + (mj - 1) * 3);
      const r = qmul(alignQinv, w.q);
      lp.set([...qrot(r, [1, 0, 0]), ...qrot(r, [0, 1, 0])], f * 267 + (NM - 1) * 3 + mj * 6);
    }
  }
  const hasG = new Int32Array(8), hasL = new Int32Array(8), hasP = new Int32Array(8);
  for (let i = 0; i < 8; i++) {
    const v = i < 4 + nT ? 1 : 0;
    hasG[i] = v; hasP[i] = v;
    hasL[i] = (i === 3 || i === 4 + nT - 1) ? 0 : v;
  }
  const allowed = new Int32Array(11);
  for (let i = 0; i < 11; i++) allowed[i] = allowedTokens.includes(MIN_TOKENS + i) ? 1 : 0;
  return {
    align,
    arrays: { global_root_values: grv, has_global_root_values: hasG, local_root_values: lrv, has_local_root_values: hasL,
              local_poses: lp, has_local_poses: hasP, allowed_pred_num_tokens: allowed },
  };
}

// ---------- decode (decode_motionbricks_output_kernel) ----------
function readRot(pred, frame, off) {
  const b = frame * FEAT + off;
  const xr = [pred[b], pred[b + 1], pred[b + 2]], yr = [pred[b + 3], pred[b + 4], pred[b + 5]];
  const x = norm3(xr), z = norm3(cross(x, yr)), y = cross(z, x);
  return qFromCols(x, y, z);
}
export function decode(sk, pred, tokens, align) {
  const NM = MODEL_JOINTS.length;
  const raw = Math.min(Math.max(tokens * POSES_PER_TOKEN, 0), 64);
  const n = Math.max(0, raw - 2 * BOUNDARY);
  const rotOff = 5 + (NM - 1) * 3;
  const frames = [], contacts = [];
  for (let f = 0; f < n; f++) {
    const rf = BOUNDARY + f;
    const pose = new Float32Array(sk.J * 7);
    const c = [];
    for (let k = 0; k < 4; k++) c.push(Math.min(1, Math.max(0, pred[rf * FEAT + FEAT - 4 + k])));
    contacts.push(c);
    const hp = [pred[rf * FEAT], pred[rf * FEAT + 1], pred[rf * FEAT + 2]];
    const rots = new Array(NM);
    for (let mj = 0; mj < NM; mj++) rots[mj] = readRot(pred, rf, rotOff + mj * 6);
    tset(pose, 0, tmul(align, T(hp, rots[0])));
    for (let j = 1; j < sk.J; j++) {
      const mj = sk.poseToModel[j];
      const ref = tget(sk.reference, j);
      if (mj < 0) { tset(pose, j, ref); continue; }
      const pm = sk.poseToModel[sk.parents[j]];
      tset(pose, j, T(ref.p, qnorm(qmul(qinv(rots[pm]), rots[mj]))));
    }
    frames.push(pose);
  }
  return { frames, contacts };
}

// ---------- light temporal smoothing ----------
// fp16 inference adds frame-to-frame noise to the decoded rotations (visible as trembling while standing still). A
// [1, 2, 1] / 4 filter over time per joint (rotations by sign-aligned normalized averaging, the root position too)
// removes it; the first and last frames are kept so the endpoint correction still lands exactly.
export function smoothFrames(frames, passes = 1) {
  const n = frames.length;
  if (n < 3) return frames;
  for (let k = 0; k < passes; k++) {
    const src = frames.map(f => Float32Array.from(f));
    const J = src[0].length / 7;
    for (let f = 1; f < n - 1; f++) {
      for (let j = 0; j < J; j++) {
        const a = tget(src[f - 1], j), b = tget(src[f], j), c = tget(src[f + 1], j);
        const al = (q) => (q[0] * b.q[0] + q[1] * b.q[1] + q[2] * b.q[2] + q[3] * b.q[3] < 0 ? q.map(v => -v) : q);
        const qa = al(a.q), qc = al(c.q);
        const q = qnorm([0, 1, 2, 3].map(i => (qa[i] + 2 * b.q[i] + qc[i]) / 4));
        const p = j === 0 ? [0, 1, 2].map(i => (a.p[i] + 2 * b.p[i] + c.p[i]) / 4) : b.p;
        tset(frames[f], j, T(p, q));
      }
    }
  }
  return frames;
}

// ---------- endpoint correction (compute_endpoint_deltas_kernel + apply_endpoint_deltas_kernel) ----------
export function correctEndpoints(sk, frames, lastContextPose, firstTargetPose) {
  const n = frames.length;
  if (n < 2) return;
  const sd = [], ed = [];
  for (let j = 0; j < sk.J; j++) {
    const g0 = tget(frames[0], j), g1 = tget(frames[n - 1], j), c = tget(lastContextPose, j), t = tget(firstTargetPose, j);
    if (j === 0) {
      sd.push(T(sub(c.p, g0.p), qnorm(qmul(qinv(qnorm(g0.q)), qnorm(c.q)))));
      ed.push(T(sub(t.p, g1.p), qnorm(qmul(qinv(qnorm(g1.q)), qnorm(t.q)))));
    } else {
      // delta = inverse(src) * dst
      const inv = (A) => { const qi = qinv(A.q); return T(qrot(qi, scl(A.p, -1)), qi); };
      sd.push(tmul(inv(g0), c)); ed.push(tmul(inv(g1), t));
    }
  }
  const I = T([0, 0, 0], [0, 0, 0, 1]);
  for (let f = 0; f < n; f++) {
    const we = f / (n - 1), ws = 1 - we;
    for (let j = 0; j < sk.J; j++) {
      const x = tget(frames[f], j);
      if (j === 0) {
        const q = qnorm(qmul(qmul(x.q, qslerp(I.q, sd[0].q, ws)), qslerp(I.q, ed[0].q, we)));
        tset(frames[f], 0, T(add(add(x.p, scl(sd[0].p, ws)), scl(ed[0].p, we)), q));
      } else {
        const a = tmul(x, blendT(I, sd[j], ws));
        tset(frames[f], j, tmul(a, blendT(I, ed[j], we)));
      }
    }
  }
}

// ---------- animation buffer sampling (frame_index_from_time + blend_transform) ----------
export function sampleFrames(frames, time, out) {
  const last = Math.max(0, frames.length - 1);
  const fr = time * FPS;
  const f0 = Math.min(Math.max(Math.floor(fr), 0), last);
  const f1 = Math.min(f0 + 1, last);
  const w = f0 < last ? Math.min(Math.max(fr - f0, 0), 1) : 0;
  const J = out.length / 7;
  for (let j = 0; j < J; j++) tset(out, j, blendT(tget(frames[f0], j), tget(frames[f1], j), w));
  return out;
}

// ---------- recorded history (MotionRecorder + history_sample_indices) ----------
export class Recorder {
  constructor(pose, capacity = 32) { this.capacity = capacity; this.fill(pose); }
  fill(pose) { this.poses = Array.from({ length: this.capacity }, () => Float32Array.from(pose)); this.dts = new Float32Array(this.capacity); }
  record(dt, pose) {
    this.dts[this.capacity - 1] = dt;
    this.dts.copyWithin(0, 1); this.dts[this.capacity - 1] = 0;
    this.poses.shift(); this.poses.push(Float32Array.from(pose));
  }
  // four poses at 30 Hz ending at the latest recorded pose
  context() {
    const n = this.capacity, times = new Float32Array(n);
    for (let f = n - 2; f >= 0; f--) times[f] = times[f + 1] - this.dts[f];
    const out = [];
    for (let s = 0; s < POSES_PER_TOKEN; s++) {
      const st = -(POSES_PER_TOKEN - 1) / FPS + s / FPS;
      let upper = 0; while (upper < n && times[upper] <= st) upper++;
      upper = Math.min(upper, n - 1);
      let lower = Math.max(upper - 1, 0);
      const ft = times[upper] - times[lower];
      let w = 0;
      if (ft > 0) w = (st - times[lower]) / ft; else lower = upper;
      w = Math.min(Math.max(w, 0), 1);
      const pose = new Float32Array(this.poses[0].length);
      for (let j = 0; j < pose.length / 7; j++) tset(pose, j, blendT(tget(this.poses[lower], j), tget(this.poses[upper], j), w));
      out.push(pose);
    }
    return out;
  }
}

// ---------- target placement (place_target_poses in model space: yaw about +Y, heading 0 faces +Z) ----------
export function placeTarget(window, groundPos, yaw) {
  const place = T([groundPos[0], 0, groundPos[2]], qAxisY(yaw));
  return window.map((p) => { const o = Float32Array.from(p); tset(o, 0, tmul(place, tget(p, 0))); return o; });
}

// ---------- the ONNX call ----------
export async function runModel(ort, session, arrays) {
  const shapes = { global_root_values: [1, 8, 5], has_global_root_values: [1, 8], local_root_values: [1, 8, 4],
                   has_local_root_values: [1, 8], local_poses: [1, 8, 267], has_local_poses: [1, 8], allowed_pred_num_tokens: [1, 11] };
  const feeds = {};
  for (const [k, v] of Object.entries(arrays)) feeds[k] = new ort.Tensor(v instanceof Int32Array ? 'int32' : 'float32', v, shapes[k]);
  const out = await session.run(feeds);
  return { pred: out.pred_global_motions.data, tokens: out.pred_num_tokens.data[0] };
}

// One generation: context from the recorder, then decode and endpoint correction.
export async function generate(ort, session, sk, recorder, targetPoses, opts = {}) {
  const t0 = performance.now();
  const context = recorder.context();
  const { align, arrays } = encode(sk, context, targetPoses, opts);
  const t1 = performance.now();
  const { pred, tokens } = await runModel(ort, session, arrays);
  const t2 = performance.now();
  const { frames, contacts } = decode(sk, pred, tokens, align);
  if (opts.smooth) smoothFrames(frames, opts.smooth);
  correctEndpoints(sk, frames, context[3], targetPoses[0]);
  const t3 = performance.now();
  return { frames, contacts, tokens, ms: { encode: t1 - t0, run: t2 - t1, decode: t3 - t2 } };
}
