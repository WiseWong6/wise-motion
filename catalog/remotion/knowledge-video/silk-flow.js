// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
// Fixed silk curves: reveal and light travel from one word to another.
// Geometry never bends or scales during entrance; playback depends only on time.
export const SilkFlow = (() => {
  const clamp = (n) => Math.max(0, Math.min(1, n));

  function create(points, style) {
    const [a, b, c, d] = points;
    const path = new Path2D();
    path.moveTo(...a);
    path.bezierCurveTo(...b, ...c, ...d);
    let length = 0, previous = a;
    for (let i = 1; i <= 64; i++) {
      const t = i / 64, u = 1 - t;
      const p = [0, 1].map((k) => u ** 3 * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t ** 3 * d[k]);
      length += Math.hypot(p[0] - previous[0], p[1] - previous[1]);
      previous = p;
    }
    return { ...style, path, length };
  }

  function state(age, delay = 0) {
    const elapsed = age - delay;
    if (elapsed <= 0) return { reveal: 0, from: 0, to: 0 };
    // A short light ribbon follows the same full-height curve as the reveal.
    // The pause between passes keeps the bundle airy instead of constantly white.
    const head = (elapsed % 1.85) / 1.25;
    return { reveal: clamp(elapsed / 1.25), from: clamp(head - 0.20), to: clamp(head) };
  }

  function draw(ctx, strand, age, opacity = 1) {
    const s = state(age, strand.delay);
    if (s.reveal <= 0 || opacity <= 0) return;
    const { length, path } = strand;
    ctx.lineWidth = strand.width;
    ctx.strokeStyle = strand.stroke;
    ctx.lineDashOffset = 0;
    ctx.setLineDash(s.reveal < 1 ? [length * s.reveal, length + 1] : []);
    ctx.globalAlpha = strand.alpha * opacity * 0.72;
    ctx.stroke(path);
    if (s.to > s.from) {
      ctx.setLineDash([length * (s.to - s.from), length + 1]);
      ctx.lineDashOffset = -length * s.from;
      ctx.globalAlpha = strand.alpha * opacity * 1.35;
      ctx.stroke(path);
    }
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
  }

  return { create, state, draw };
})();
