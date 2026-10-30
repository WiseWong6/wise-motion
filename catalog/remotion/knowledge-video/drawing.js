// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {Space3D} from './space3d.js';
export const V = (() => {
  const W = 1080, H = 1440, TAU = Math.PI * 2;
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    let u = 0;
    while (!u) u = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * r());
  }
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const ease = {
    lin: (u) => u,
    o2: (u) => 1 - (1 - u) * (1 - u),
    o3: (u) => 1 - Math.pow(1 - u, 3),
    io2: (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2),
    io3: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
    expo: (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
    back: (u) => 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2),
  };
  const sm = (t, a, b, e = ease.io3) => e(seg(t, a, b));
  const win = (t, a, b, c, d, e = ease.io2) => Math.min(e(seg(t, a, b)), 1 - e(seg(t, c, d)));

  const C = {
    white: [242, 242, 240],
    silver: [184, 188, 198],
    gold: [232, 184, 74],
    goldHi: [255, 216, 115],
    yellow: [255, 225, 77],
    amber: [214, 140, 52],
    pink: [255, 140, 190],
    blue: [128, 172, 255],
    mint: [130, 228, 200],
  };
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, a).toFixed(3)})`;
  const mix = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  function iris(u, amt = 0.35) {
    const k = ((u % 1) + 1) % 1;
    const tint = k < 0.34 ? mix(C.pink, C.blue, k / 0.34) : k < 0.67 ? mix(C.blue, C.goldHi, (k - 0.34) / 0.33) : mix(C.goldHi, C.pink, (k - 0.67) / 0.33);
    return mix(C.white, tint, amt);
  }

  function begin(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  function makeDust(seed, n = 1400, box = [0, 0, W, H]) {
    const r = rng(seed);
    const out = [];
    for (let i = 0; i < n; i++) {
      const roll = r();
      out.push({
        x: box[0] + r() * box[2], y: box[1] + r() * box[3],
        s: 0.6 + r() * r() * 1.5, a: 0.03 + r() * r() * 0.26,
        ph: r() * TAU, w: 0.5 + r() * 2.2,
        c: roll < 0.1 ? iris(r(), 0.75) : roll < 0.14 ? C.goldHi : roll < 0.6 ? C.silver : C.white,
        vx: (r() - 0.5) * 5, vy: (r() - 0.5) * 4,
      });
    }
    return out;
  }
  function dust(ctx, D, t, alpha = 1) {
    if (alpha <= 0.002) return;
    const camera = Space3D.camera({ cx: 540, cy: 720, scale: 550, depth: 6, yaw: 0.08, pitch: -0.04, spin: 0.025, sway: 0.01 }, t);
    for (const p of D) {
      const q = Space3D.project([(p.x - 540 + p.vx * t) / 550, (720 - p.y - p.vy * t) / 550, Math.sin(p.ph) * 0.85], camera);
      const a = p.a * alpha * q.light * (0.6 + 0.4 * Math.sin(t * p.w + p.ph));
      if (a < 0.004) continue;
      ctx.fillStyle = rgba(p.c, a);
      const size = p.s * q.scale;
      ctx.fillRect(q.x, q.y, size, size);
    }
  }

  function cubic(p0, p1, p2, p3, u) {
    const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
  }
  function curvePts(p0, c1, c2, p3, K = 40) {
    const out = [];
    for (let k = 0; k <= K; k++) out.push(cubic(p0, c1, c2, p3, k / K));
    return out;
  }
  function linePts(p0, p1, K = 2) {
    const out = [];
    for (let k = 0; k <= K; k++) out.push([lerp(p0[0], p1[0], k / K), lerp(p0[1], p1[1], k / K)]);
    return out;
  }

  // A bundle of hair-thin bezier fibers from around point a to around point b.
  function makeFibers(o) {
    const r = rng(o.seed), K = o.K || 28, out = [];
    const j = o.jitter ?? 60;
    for (let i = 0; i < o.n; i++) {
      const p0 = [o.a[0] + gauss(r) * o.sa, o.a[1] + gauss(r) * (o.say ?? o.sa)];
      const p3 = [o.b[0] + gauss(r) * o.sb, o.b[1] + gauss(r) * (o.sby ?? o.sb)];
      const c1 = [o.c1[0] + gauss(r) * j, o.c1[1] + gauss(r) * j];
      const c2 = [o.c2[0] + gauss(r) * j, o.c2[1] + gauss(r) * j];
      const pts = new Float32Array((K + 1) * 2);
      for (let k = 0; k <= K; k++) {
        const q = cubic(p0, c1, c2, p3, k / K);
        pts[k * 2] = q[0];
        pts[k * 2 + 1] = q[1];
      }
      let c;
      if (o.color) c = r() < (o.irisP ?? 0.22) ? iris(r(), 0.6) : mix(o.color, C.white, r() * (o.whiten ?? 0.35));
      else c = iris(r(), (o.irisAmt ?? 0.32) * (0.4 + r()));
      out.push({ pts, K, d: r() * (o.lag ?? 0.3), a: (o.alpha ?? 0.08) * (0.35 + r() * 1.1), w: (o.width ?? 0.8) * (0.55 + r() * 0.9), c });
    }
    out.lag = o.lag ?? 0.3;
    return out;
  }
  function ptAt(f, x) {
    const k = Math.min(f.K - 1, Math.floor(x)), u = x - k, p = f.pts;
    return [lerp(p[k * 2], p[k * 2 + 2], u), lerp(p[k * 2 + 1], p[k * 2 + 3], u)];
  }
  function fibers(ctx, F, u, alpha = 1, o = {}) {
    if (alpha <= 0.002 || u <= 0) return;
    const L = F.lag;
    for (const f of F) {
      const lp = clamp(u * (1 + L) - f.d);
      if (lp <= 0) continue;
      const end = lp * f.K;
      const start = o.tail ? Math.max(0, end - o.tail * f.K) : (o.from ?? 0) * f.K;
      if (end - start < 0.05) continue;
      ctx.strokeStyle = rgba(f.c, f.a * alpha);
      ctx.lineWidth = f.w;
      ctx.beginPath();
      const s = ptAt(f, start);
      ctx.moveTo(s[0], s[1]);
      for (let k = Math.floor(start) + 1; k < end; k++) ctx.lineTo(f.pts[k * 2], f.pts[k * 2 + 1]);
      const e = ptAt(f, end);
      ctx.lineTo(e[0], e[1]);
      ctx.stroke();
      if (o.heads && lp < 1) {
        ctx.fillStyle = rgba(C.white, Math.min(1, f.a * alpha * 6));
        ctx.fillRect(e[0] - 0.8, e[1] - 0.8, 1.6, 1.6);
      }
    }
  }

  function subPath(pts, u0, u1) {
    const n = pts.length - 1, a = clamp(u0) * n, b = clamp(u1) * n;
    const at = (x) => {
      const k = Math.min(n - 1, Math.floor(x)), u = x - k;
      return [lerp(pts[k][0], pts[k + 1][0], u), lerp(pts[k][1], pts[k + 1][1], u)];
    };
    const out = [at(a)];
    for (let k = Math.floor(a) + 1; k < b; k++) out.push(pts[k]);
    out.push(at(b));
    return out;
  }
  function strokePts(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }
  // Layered additive stroke: soft halo, glow, hot core.
  function glowPath(ctx, pts, u1, c = C.gold, w = 3, alpha = 1, u0 = 0) {
    if (u1 <= u0) return pts[0];
    const P = subPath(pts, u0, u1);
    if (alpha <= 0.002) return P[P.length - 1];
    const passes = [[w * 9, 0.035], [w * 4.5, 0.08], [w * 2.2, 0.22], [w, 0.75]];
    for (const [lw, a] of passes) {
      ctx.strokeStyle = rgba(c, a * alpha);
      ctx.lineWidth = lw;
      strokePts(ctx, P);
    }
    ctx.strokeStyle = rgba(mix(c, C.white, 0.7), 0.85 * alpha);
    ctx.lineWidth = Math.max(0.8, w * 0.38);
    strokePts(ctx, P);
    return P[P.length - 1];
  }
  function glowDot(ctx, x, y, r, c = C.goldHi, a = 1, core = true) {
    if (a <= 0.002) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(c, 0.55 * a));
    g.addColorStop(0.25, rgba(c, 0.18 * a));
    g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    if (core) {
      ctx.fillStyle = rgba(mix(c, C.white, 0.8), a);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.2, r * 0.09), 0, TAU);
      ctx.fill();
    }
  }
  function arrowHead(ctx, x, y, ang, size, c, a) {
    ctx.fillStyle = rgba(mix(c, C.white, 0.35), a);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - Math.cos(ang - 0.42) * size, y - Math.sin(ang - 0.42) * size);
    ctx.lineTo(x - Math.cos(ang) * size * 0.72, y - Math.sin(ang) * size * 0.72);
    ctx.lineTo(x - Math.cos(ang + 0.42) * size, y - Math.sin(ang + 0.42) * size);
    ctx.closePath();
    ctx.fill();
  }

  // Spindle of fine fibers along a straight vector, pinched at both ends; reads as a silk beam.
  function makeBeam(seed, n = 90, spread = 7) {
    const r = rng(seed), out = [];
    for (let i = 0; i < n; i++) {
      out.push({ amp: gauss(r) * spread, f: 1 + r() * 3, ph: r() * TAU, a: 0.05 + r() * 0.16, w: 0.5 + r() * 0.7, c: r() < 0.3 ? iris(r(), 0.6) : null });
    }
    return out;
  }
  function vector(ctx, B, x0, y0, x1, y1, o = {}) {
    const a = o.alpha ?? 1;
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (a <= 0.002 || len < 2) return;
    const c = o.color || C.gold, head = o.head ?? 30, t = o.t ?? 0;
    const ang = Math.atan2(y1 - y0, x1 - x0), ux = Math.cos(ang), uy = Math.sin(ang);
    const sx = x1 - ux * head * 0.7, sy = y1 - uy * head * 0.7;
    const K = 18;
    for (const f of B) {
      ctx.strokeStyle = rgba(f.c || mix(c, C.white, 0.3), f.a * a);
      ctx.lineWidth = f.w;
      ctx.beginPath();
      for (let k = 0; k <= K; k++) {
        const s = k / K, off = f.amp * Math.sin(Math.PI * s) * Math.sin(f.f * s * Math.PI + f.ph + t * 0.6);
        const x = lerp(x0, sx, s) - uy * off, y = lerp(y0, sy, s) + ux * off;
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    glowPath(ctx, [[x0, y0], [sx, sy]], 1, c, o.w ?? 3.2, a);
    arrowHead(ctx, x1, y1, ang, head, c, a);
  }

  function makeCloud(seed, n, cx, cy, sx, sy, o = {}) {
    const r = rng(seed), out = [];
    for (let i = 0; i < n; i++) {
      const roll = r();
      out.push({
        x: cx + gauss(r) * sx, y: cy + gauss(r) * sy,
        s: 0.7 + r() * r() * (o.size ?? 1.8), a: (o.alpha ?? 0.5) * (0.25 + r() * 0.75),
        c: o.color ? (roll < (o.irisP ?? 0.15) ? iris(r(), 0.7) : mix(o.color, C.white, r() * 0.4)) : iris(r(), 0.2 + r() * 0.55),
        ph: r() * TAU, w: 0.6 + r() * 2, r1: r(), r2: r(),
      });
    }
    return out;
  }
  function cloud(ctx, P, t, alpha = 1, o = {}) {
    if (alpha <= 0.002) return;
    const dx = o.dx ?? 0, dy = o.dy ?? 0, k = o.scale ?? 1, cx = o.cx ?? 540, cy = o.cy ?? 720, tw = o.twinkle ?? 0.3;
    for (const p of P) {
      const a = p.a * alpha * (1 - tw + tw * Math.sin(t * p.w + p.ph));
      if (a < 0.004) continue;
      ctx.fillStyle = rgba(p.c, a);
      ctx.fillRect(cx + (p.x - cx) * k + dx, cy + (p.y - cy) * k + dy, p.s, p.s);
    }
  }

  // Dense dot lattice with a travelling brightness wave (the "network" look).
  function lattice(ctx, x, y, cols, rows, dx, dy, t, o = {}) {
    const a = o.alpha ?? 1;
    if (a <= 0.002) return;
    const c = o.color || C.silver, r = rng(o.seed ?? 7), speed = o.speed ?? 1.2;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const n = r();
        const wave = 0.5 + 0.5 * Math.sin(i * 0.35 - t * speed * 3 + j * 0.12 + n * 1.5);
        const v = (0.08 + 0.55 * Math.pow(wave, 3)) * a * (0.5 + n * 0.8);
        ctx.fillStyle = rgba(n < 0.07 ? iris(n * 14, 0.7) : n < 0.12 ? C.goldHi : c, v);
        ctx.fillRect(x + i * dx, y + j * dy, 1.6, 1.6);
      }
    }
  }

  function fmt(x, d = 2) {
    return (Math.abs(x) < Math.pow(10, -d) / 2 ? 0 : x).toFixed(d);
  }

  return { W, H, TAU, rng, gauss, clamp, lerp, seg, ease, sm, win, C, rgba, mix, iris, begin, makeDust, dust, cubic, curvePts, linePts, makeFibers, fibers, subPath, strokePts, glowPath, glowDot, arrowHead, makeBeam, vector, makeCloud, cloud, lattice, fmt };
})();
export function makeK(document) {
  const NS = "http://www.w3.org/2000/svg";
  function s(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function h(tag, cls, html, parent, style) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (style) Object.assign(e.style, style);
    if (parent) parent.appendChild(e);
    return e;
  }
  const path = (p, d, cls = "ln", extra = {}) => s("path", { d, class: cls, pathLength: 1, ...extra }, p);
  const line = (p, x1, y1, x2, y2, cls = "ln", extra = {}) => path(p, `M${x1} ${y1}L${x2} ${y2}`, cls, extra);
  const arcD = (cx, cy, r, a0, a1) => {
    const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0, sw = a1 > a0 ? 1 : 0;
    return `M${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)}A${r} ${r} 0 ${large} ${sw} ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`;
  };

  // Arrow as a group whose geometry can be re-set every frame.
  function arrow(p, o = {}) {
    const g = s("g", { class: o.glow === false ? "" : "glow" }, p);
    const color = o.color || "#e8b84a";
    g._shaft = s("path", { fill: "none", stroke: color, "stroke-width": o.w || 6, "stroke-linecap": "round" }, g);
    g._head = s("path", { fill: color }, g);
    g._size = o.head || 30;
    if (o.from) setArrow(g, ...o.from, ...o.to);
    return g;
  }
  function setArrow(g, x1, y1, x2, y2) {
    g._ends = [x1, y1, x2, y2];
    const L = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1), hs = Math.min(g._size, L * 0.45);
    const bx = x2 - Math.cos(a) * hs * 0.8, by = y2 - Math.sin(a) * hs * 0.8;
    g._shaft.setAttribute("d", `M${x1} ${y1}L${bx} ${by}`);
    const p1 = [x2 - Math.cos(a - 0.4) * hs, y2 - Math.sin(a - 0.4) * hs], p2 = [x2 - Math.cos(a + 0.4) * hs, y2 - Math.sin(a + 0.4) * hs];
    g._head.setAttribute("d", `M${x2} ${y2}L${p1[0]} ${p1[1]}L${bx} ${by}L${p2[0]} ${p2[1]}Z`);
    g.style.display = L < 2 ? "none" : "";
  }

  const ICON = {
    catfood: '<path d="M26 18h48l6 70q-30 8-60 0z"/><path d="M26 28h48"/><path d="M38 56l4-12 6 7h4l6-7 4 12q0 12-12 12t-12-12z"/><circle cx="45" cy="57" r="1.6" fill="currentColor"/><circle cx="55" cy="57" r="1.6" fill="currentColor"/>',
    litter: '<path d="M12 50h76l-8 32H20z"/><path d="M24 50q4-12 14-10 6-12 18-6 12-6 18 6 8 0 6 10"/><path d="M62 22l14 18"/><path d="M70 18l14 6-6 10z"/>',
    dogfood: '<path d="M26 18h48l6 70q-30 8-60 0z"/><path d="M26 28h48"/><path d="M36 58h28"/><circle cx="34" cy="53" r="5"/><circle cx="34" cy="63" r="5"/><circle cx="66" cy="53" r="5"/><circle cx="66" cy="63" r="5"/>',
    user: '<circle cx="50" cy="36" r="16"/><path d="M20 86q2-28 30-28t30 28"/>',
    doc: '<path d="M24 10h36l18 18v62H24z"/><path d="M60 10v18h18"/><path d="M34 46h32M34 58h32M34 70h22"/>',
    search: '<circle cx="42" cy="42" r="24"/><path d="M60 60l24 24"/>',
    funnel: '<path d="M12 16h76L58 54v28l-16 8V54z"/>',
    chip: '<rect x="24" y="24" width="52" height="52" rx="8"/><path d="M36 24v-12M50 24v-12M64 24v-12M36 88v-12M50 88v-12M64 88v-12M24 36h-12M24 50h-12M24 64h-12M88 36h-12M88 50h-12M88 64h-12"/>',
    db: '<ellipse cx="50" cy="22" rx="32" ry="10"/><path d="M18 22v56q0 10 32 10t32-10V22"/><path d="M18 41q0 10 32 10t32-10M18 60q0 10 32 10t32-10"/>',
    check: '<path d="M18 52l20 20 44-46"/>',
    cross: '<path d="M24 24l52 52M76 24L24 76"/>',
    bubble: '<path d="M14 20h72v46H46l-18 16V66H14z"/><path d="M28 36h44M28 50h30"/>',
    scissors: '<circle cx="28" cy="72" r="10"/><circle cx="72" cy="72" r="10"/><path d="M34 64L74 14M66 64L26 14"/>',
  };
  function icon(name, size = 80, o = {}) {
    const color = o.color || "#e8b84a";
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" style="display:block;overflow:visible;color:${color}" fill="none" stroke="currentColor" stroke-width="${o.w || 5}" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`;
  }

  function photo(parent, o) {
    const el = h("div", "polaroid", `<div class="pin"></div><img src="${o.src}" style="width:${o.w}px;height:${o.h}px">` +
      (o.cap ? `<div class="pl-cap">${o.cap}</div>` : "") + (o.credit ? `<div class="pl-credit">${o.credit}</div>` : ""), parent);
    if (o.id) el.id = o.id;
    el.setAttribute("data-layout-ignore", "");
    return el;
  }

return {s,h,path,line,arcD,arrow,setArrow,icon,photo};
}
