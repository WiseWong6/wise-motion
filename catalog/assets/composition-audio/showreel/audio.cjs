// Synthesises soundtrack.wav from scratch; beat grid, whooshes and typing clicks
// share timing with the visuals via shared.js.
const S = require('./shared.js');
const fs = require('fs');
const path = require('path');

const SR = 44100, DUR = 60, N = SR * DUR, TAU = Math.PI * 2;
const bus = () => [new Float32Array(N), new Float32Array(N)];
const DRUM = bus(), MUS = bus(), SEND = bus();
let seed = 1234567;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

function put(b, i, v, pan = 0, send = 0) {
  if (i < 0 || i >= N) return;
  const l = v * Math.cos((pan + 1) * Math.PI / 4) * Math.SQRT2;
  const r = v * Math.sin((pan + 1) * Math.PI / 4) * Math.SQRT2;
  b[0][i] += l; b[1][i] += r;
  if (send) { SEND[0][i] += l * send; SEND[1][i] += r * send; }
}
const at = t => Math.round(t * SR);

function kick(t0, g = 1) {
  const i0 = at(t0); let ph = 0;
  for (let k = 0; k < 0.5 * SR; k++) {
    const tt = k / SR;
    const f = 42 + 120 * Math.exp(-tt * 30) + 60 * Math.exp(-tt * 220);
    ph += TAU * f / SR;
    const env = Math.exp(-tt * 6.5) * Math.min(1, k / 30);
    put(DRUM, i0 + k, Math.tanh(Math.sin(ph) * env * 1.8) * g * 0.85);
  }
}
function clap(t0, g = 1) {
  const i0 = at(t0); let prev = 0, lp = 0;
  for (let k = 0; k < 0.35 * SR; k++) {
    const tt = k / SR;
    let env = 0.6 * Math.exp(-tt * 13);
    for (const o of [0, 0.011, 0.023]) if (tt >= o) env += Math.exp(-(tt - o) * 280);
    const n = rnd() * 2 - 1, hp = n - prev; prev = n; lp += 0.5 * (hp - lp);
    const tone = Math.sin(TAU * 195 * tt) * Math.exp(-tt * 35) * 0.35;
    put(DRUM, i0 + k, (lp * env * 0.55 + tone) * g, 0, 0.18);
  }
}
function hat(t0, g = 0.2, open = false, pan = 0.25) {
  const i0 = at(t0); let p1 = 0, p2 = 0;
  const len = (open ? 0.4 : 0.06) * SR;
  for (let k = 0; k < len; k++) {
    const tt = k / SR, n = rnd() * 2 - 1;
    const h1 = n - p1; p1 = n; const h2 = h1 - p2; p2 = h1;
    put(DRUM, i0 + k, h2 * Math.exp(-tt * (open ? 9 : 75)) * g * 0.5, pan);
  }
}
function bassNote(t0, dur, m, g = 0.35, drive = 1, cutoff = 1400) {
  const i0 = at(t0), f = mtof(m); let ph = 0, ph2 = 0, y = 0;
  for (let k = 0; k < dur * SR; k++) {
    const tt = k / SR;
    ph = (ph + f / SR) % 1; ph2 = (ph2 + (f * 1.005) / SR) % 1;
    const saw = (2 * ph - 1) + (2 * ph2 - 1);
    const fc = 150 + cutoff * Math.exp(-tt * 9);
    y += (1 - Math.exp(-TAU * fc / SR)) * (saw * 0.5 - y);
    const env = Math.min(1, tt / 0.004) * Math.min(1, (dur - tt) / 0.02);
    const sub = Math.sin(TAU * f * 0.5 * tt) * 0.55;
    put(MUS, i0 + k, Math.tanh((y + sub) * drive) * env * g);
  }
}
function pad(t0, dur, notes, g = 0.08, att = 0.35, rel = 0.6) {
  const i0 = at(t0), total = (dur + rel) * SR;
  for (const m of notes) for (const det of [-0.09, 0, 0.09]) {
    const f = mtof(m + det), pan = det * 7; let ph = rnd(), y = 0;
    for (let k = 0; k < total; k++) {
      const tt = k / SR;
      ph = (ph + f / SR) % 1;
      y += 0.09 * ((2 * ph - 1) - y);
      const env = Math.min(1, tt / att) * (tt > dur ? Math.exp(-(tt - dur) / (rel / 4)) : 1);
      put(MUS, i0 + k, y * env * g, pan, 0.25);
    }
  }
}
function pluck(t0, m, g = 0.18, dec = 6, wave = 'pulse', pan = 0) {
  const i0 = at(t0), f = mtof(m); let ph = 0, y = 0;
  for (let k = 0; k < 0.6 * SR; k++) {
    const tt = k / SR;
    ph = (ph + f / SR) % 1;
    const v = wave === 'pulse' ? (ph < 0.3 ? 1 : -1) : Math.sin(TAU * ph) + 0.3 * Math.sin(2 * TAU * ph);
    const fc = 400 + 5000 * Math.exp(-tt * 14);
    y += (1 - Math.exp(-TAU * fc / SR)) * (v - y);
    put(MUS, i0 + k, y * Math.exp(-tt * dec) * Math.min(1, k / 40) * g, pan, 0.35);
  }
}
function whoosh(tEnd, len = 0.8, g = 0.3) {
  const i0 = at(tEnd - len), tail = 0.35; let y = 0;
  for (let k = 0; k < (len + tail) * SR; k++) {
    const tt = k / SR, x = tt / len;
    const env = x < 1 ? Math.pow(x, 2.4) : Math.exp(-(tt - len) * 14);
    const a = 0.01 + 0.45 * Math.pow(Math.min(x, 1), 2);
    y += a * ((rnd() * 2 - 1) - y);
    put(DRUM, i0 + k, y * env * g * 1.6, lerp(-0.7, 0.7, Math.min(x, 1)), 0.2);
  }
}
function impact(t0, g = 1) {
  kick(t0, g);
  const i0 = at(t0); let y = 0, ph = 0;
  for (let k = 0; k < 2.2 * SR; k++) {
    const tt = k / SR;
    y += 0.06 * ((rnd() * 2 - 1) - y);
    ph += TAU * (34 + 30 * Math.exp(-tt * 4)) / SR;
    put(DRUM, i0 + k, (y * 2.2 * Math.exp(-tt * 2.4) + Math.sin(ph) * 0.5 * Math.exp(-tt * 1.6)) * g, 0, 0.35);
  }
}
function riser(t0, t1, g = 0.15) {
  const i0 = at(t0), len = t1 - t0; let ph = 0, y = 0;
  for (let k = 0; k < len * SR; k++) {
    const x = k / SR / len, f = 110 * Math.pow(8, x);
    ph = (ph + f / SR) % 1;
    y += (0.02 + 0.3 * x * x) * ((rnd() * 2 - 1) - y);
    const env = x * x;
    put(MUS, i0 + k, ((2 * ph - 1) * 0.35 + y * 1.2) * env * g, Math.sin(x * 20) * 0.4, 0.3);
  }
}
function tick(t0, g = 0.12) {
  const i0 = at(t0), f = 1600 + rnd() * 900, pan = (rnd() - 0.5) * 0.5; let prev = 0;
  for (let k = 0; k < 0.02 * SR; k++) {
    const tt = k / SR, n = rnd() * 2 - 1, hp = n - prev; prev = n;
    put(DRUM, i0 + k, (hp * 0.6 + Math.sin(TAU * f * tt) * 0.4) * Math.exp(-tt * 500) * g, pan);
  }
}
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- arrangement ---------- */
const CH = [[45, [57, 60, 64]], [41, [53, 57, 60]], [48, [55, 60, 64]], [43, [55, 59, 62]]];
const chord = t => CH[Math.floor(t / 2 + 1e-6) % 4];
const PENTA = [57, 60, 62, 64, 67, 69, 72, 74, 76];

for (const k of S.KICKS) {
  if (k === 0) impact(0, 0.75);
  else if (k === 54) impact(54, 0.95);
  else if (k === 58) impact(58, 0.9);
  else kick(k, k < 4 ? 0.8 : 1);
}
pad(0.1, 3.9, [57, 60, 64], 0.07, 1.2);
riser(1.6, 4.0, 0.12);
for (const B of S.BOUNDS) if (B !== 54) whoosh(B, 0.75, 0.28);

for (let bar = 2; bar < 23; bar++) {
  const t0 = bar * 2;
  if (t0 >= 46) break;
  const [root, notes] = chord(t0);
  const grit = t0 >= 16 && t0 < 22, full = t0 >= 38;
  pad(t0, 2, notes, full ? 0.075 : 0.05, 0.2, 0.3);
  for (let e = 0; e < 8; e++) {
    const t = t0 + e * 0.25;
    const m = root - 12 + [0, 0, 12, 0, 0, 12, 7, 12][e];
    bassNote(t, 0.22, m, 0.3, grit ? 3.5 : 1.2, grit ? 2200 : 1300);
  }
  for (let b = 0; b < 4; b++) {
    const t = t0 + b * 0.5;
    if (b % 2 === 1) clap(t, 0.8);
    hat(t + 0.25, full ? 0.3 : 0.22, full, 0.25);
    if ((t0 >= 22 && t0 < 30) || full) { hat(t + 0.125, 0.12, false, -0.3); hat(t + 0.375, 0.12, false, -0.3); }
  }
  if ((t0 >= 10 && t0 < 16) || (t0 >= 22 && t0 < 30) || full) {
    const pat = t0 < 16 ? [0, 1, 2, 1] : [0, 2, 1, 2];
    for (let s = 0; s < 16; s++) {
      const m = notes[pat[s % 4]] + 12 + (s >= 8 && t0 >= 22 ? 12 : 0);
      pluck(t0 + s * 0.125, m, full ? 0.06 : 0.075, 9, 'pulse', s % 2 ? 0.45 : -0.45);
    }
  }
  if ((t0 >= 30 && t0 < 38) || full) {
    for (let e = 0; e < 8; e++) {
      const h = Math.sin(bar * 12.9898 + e * 78.233) * 43758.5453, r = h - Math.floor(h);
      if (r < 0.35 && e !== 0) continue;
      pluck(t0 + e * 0.25, PENTA[Math.floor(r * PENTA.length)] + 12, full ? 0.07 : 0.1, 5, 'sine', (r - 0.5) * 0.8);
    }
  }
}
for (let i = 0; i < 260; i++) {
  const t = 16 + rnd() * 6, i0 = at(t), a = 0.04 + rnd() * 0.1;
  for (let k = 0; k < 40; k++) put(DRUM, i0 + k, (rnd() * 2 - 1) * a * Math.exp(-k / 6));
}

// 46–54 breakdown: pad, low drone, the prompt being typed, send, riser
for (let bar = 23; bar < 27; bar++) {
  const t0 = bar * 2, [root, notes] = chord(t0);
  pad(t0, 2, notes, 0.065, 0.3, 0.5);
  bassNote(t0, 1.95, root - 12, 0.18, 1, 300);
}
S.CHARS.forEach((c, i) => { if (c !== ' ') tick(S.charTime(i), 0.1); });
tick(S.SEND, 0.5); kick(S.SEND, 0.35);
riser(51.3, 54.0, 0.2);

// outro
for (let bar = 27; bar < 29; bar++) {
  const t0 = bar * 2, [root, notes] = chord(t0);
  pad(t0, 2, notes, 0.07, 0.1, 0.3);
  for (let e = 0; e < 8; e++) bassNote(t0 + e * 0.25, 0.22, root - 12 + [0, 0, 12, 0, 0, 12, 7, 12][e], 0.28);
  for (let b = 0; b < 4; b++) { const t = t0 + b * 0.5; if (b % 2) clap(t, 0.8); hat(t + 0.25, 0.25, true); }
}
pad(58, 1.6, [45, 57, 60, 64, 69], 0.07, 0.02, 1.2);
pluck(58, 81, 0.12, 2.5, 'sine'); pluck(58, 76, 0.1, 2.5, 'sine', 0.4);

/* ---------- mix ---------- */
const d = Math.round(0.375 * SR), fb = 0.36;
const yl = new Float32Array(N), yr = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const pl = i >= d ? yr[i - d] : 0, pr = i >= d ? yl[i - d] : 0;
  yl[i] = SEND[0][i] + pl * fb; yr[i] = SEND[1][i] + pr * fb;
  MUS[0][i] += pl * 0.6; MUS[1][i] += pr * 0.6;
}
const duck = new Float32Array(N);
{
  let ki = 0, last = -1;
  const ks = S.KICKS;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    while (ki < ks.length && ks[ki] <= t) last = ks[ki++];
    duck[i] = last < 0 ? 1 : 1 - 0.55 * Math.exp(-(t - last) * 9);
  }
}
const out = Buffer.alloc(44 + N * 4);
let peak = 0;
const L = new Float32Array(N), R = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, (N - i) / (SR * 0.8));
  L[i] = Math.tanh((DRUM[0][i] + MUS[0][i] * duck[i]) * 0.9) * fade;
  R[i] = Math.tanh((DRUM[1][i] + MUS[1][i] * duck[i]) * 0.9) * fade;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.93 / peak;
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVE', 8);
out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34);
out.write('data', 36); out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  out.writeInt16LE(Math.round(L[i] * norm * 32767), 44 + i * 4);
  out.writeInt16LE(Math.round(R[i] * norm * 32767), 46 + i * 4);
}
fs.writeFileSync(path.join(__dirname, 'soundtrack.wav'), out);
console.log('soundtrack.wav written, peak', peak.toFixed(3));
