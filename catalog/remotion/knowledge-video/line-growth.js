// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
export const LineGrowth=(()=>{
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const mix = (a, b, t) => a + (b - a) * t;
  // Wise Motion: .32 s extension followed by .26 s at the endpoint.
  // Scale that single arrival/hold sequence to the existing shot duration.
  const ARRIVE = .32 / .58, SPARK_COUNT = 16, SPARK_LIFE = .38;
  let serial = 0;

  function progress(u) { return smooth(u / ARRIVE); }
  const ease = duration => u => progress(u, duration);
  const add = (tag, attrs, parent) => {
    const el = parent.ownerDocument.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (tag === 'path') { el.style.strokeDasharray = 'none'; el.style.strokeDashoffset = '0'; }
    parent.appendChild(el);
    return el;
  };
  const register = (tl, render) => { (tl._lineGrowth || (tl._lineGrowth = [])).push(render); };

  // One continuous extension. Only the completed line holds; sparks follow the hold.
  function phase(age, duration) {
    const u = age / duration;
    const holding = u >= ARRIVE && u < 1;
    return { p: progress(u), holding, charge: holding ? smooth((u - ARRIVE) / (1 - ARRIVE)) : 0,
      burstAge: age - duration, active: age >= 0 && age < duration + SPARK_LIFE };
  }
  const flash = state => state.holding ? .4 * state.charge : state.burstAge >= 0 ? .9 * Math.pow(clamp(1 - state.burstAge / .18), 2) : 0;
  function sparks(age, tangent, size = 1) {
    const result = [];
    for (let i = 0; i < SPARK_COUNT; i++) {
      const life = .24 + (i % 5) * .03, a = age - (i % 3) * .008;
      if (a <= 0 || a >= life) continue;
      const angle = tangent + (i % 2 ? 1 : -1) * (.35 + ((i * 7) % 11) * .17);
      const speed = (72 + ((i * 37) % 110)) * size, drag = .8 + (i % 7) * .2;
      const point = t => {
        const d = -Math.expm1(-drag * t) / drag;
        return [Math.cos(angle) * speed * d, Math.sin(angle) * speed * d + 80 * size * t * t];
      };
      result.push({ head: point(a), tail: point(Math.max(0, a - .016 - .035 * (1 - a / life))), alpha: Math.pow(1 - a / life, .8) * .8 });
    }
    return result;
  }
  function svgEffect(host, geometry, source = null) {
    const g = add('g', { 'data-line-growth': '', 'data-layout-ignore': '', 'pointer-events': 'none', opacity: 0 }, host);
    const defs = add('defs', {}, g), id = `line-growth-${++serial}`;
    const gradient = add('linearGradient', { id, gradientUnits: 'userSpaceOnUse' }, defs);
    const color = source?._shaft?.getAttribute('stroke') || source?.style?.stroke || source?.getAttribute('stroke') || (source ? getComputedStyle(source).stroke : '#e8b84a');
    const silver = /196|242|214|f2f2|ddd|d3d|c9c|d6d9|b8bc|8589|fff|white|silver/i.test(color);
    add('stop', { offset: 0, 'stop-color': silver ? '#9aa8b5' : '#e8b84a', 'stop-opacity': 0 }, gradient);
    add('stop', { offset: '.7', 'stop-color': silver ? '#dbe5eb' : '#ffe4a0', 'stop-opacity': '.72' }, gradient);
    add('stop', { offset: 1, 'stop-color': '#fffdf4', 'stop-opacity': 1 }, gradient);
    const glowId = `${id}-glow`, glow = add('radialGradient', { id: glowId }, defs);
    add('stop', { offset: 0, 'stop-color': '#fffdf4', 'stop-opacity': 1 }, glow);
    add('stop', { offset: '.16', 'stop-color': '#fffdf4', 'stop-opacity': '.85' }, glow);
    add('stop', { offset: '.42', 'stop-color': silver ? '#dbe5eb' : '#ffe4a0', 'stop-opacity': '.22' }, glow);
    add('stop', { offset: 1, 'stop-color': silver ? '#9aa8b5' : '#e8b84a', 'stop-opacity': 0 }, glow);
    const haze = add('path', { fill: 'none', stroke: `url(#${id})`, 'stroke-width': 3, opacity: '.26', 'stroke-linecap': 'round' }, g);
    const core = add('path', { fill: 'none', stroke: `url(#${id})`, 'stroke-width': 1.25, 'stroke-linecap': 'round' }, g);
    // Arrow tips stay pointed; only plain connectors receive a circular arrival flash.
    const glint = source?._shaft ? null : add('circle', { r: 9, fill: `url(#${glowId})`, opacity: 0 }, g);
    const tails = Array.from({ length: SPARK_COUNT }, (_, i) => {
      const tailId = `${id}-tail-${i}`, gradient = add('linearGradient', { id: tailId, gradientUnits: 'userSpaceOnUse' }, defs);
      add('stop', { offset: 0, 'stop-color': silver ? '#9aa8b5' : '#dda746', 'stop-opacity': 0 }, gradient);
      add('stop', { offset: '.55', 'stop-color': silver ? '#dbe5eb' : '#ffdda0', 'stop-opacity': '.7' }, gradient);
      add('stop', { offset: 1, 'stop-color': '#fff9e9', 'stop-opacity': 1 }, gradient);
      return { gradient, el: add('path', { fill: 'none', stroke: `url(#${tailId})`, 'stroke-width': i % 5 ? '.55' : '.85', 'stroke-linecap': 'round' }, g) };
    });
    return (age, duration, dynamic = false) => {
      const state = phase(age, duration);
      if (!state.active) { g.setAttribute('opacity', 0); return; }
      if (source && !source._shaft) {
        const opacity = source.style.opacity || source.getAttribute('opacity') || 1;
        g.setAttribute('opacity', opacity);
        const transform = source.getAttribute('transform');
        if (transform) g.setAttribute('transform', transform); else g.removeAttribute('transform');
      } else g.setAttribute('opacity', 1);
      const shape = geometry(), p = dynamic ? 1 : state.p;
      const span = Math.min(.24, 28 / Math.max(1, shape.length));
      const head = p * (state.holding ? mix(.55, 1, state.charge) : 1);
      const from = Math.max(0, head - span), points = [];
      for (let i = 0; i <= 6; i++) points.push(shape.at(mix(from, head, i / 6)));
      const start = points[0], end = points[6];
      gradient.setAttribute('x1', start[0]); gradient.setAttribute('y1', start[1]);
      gradient.setAttribute('x2', end[0] + .01); gradient.setAttribute('y2', end[1] + .01);
      const d = points.map((v, i) => `${i ? 'L' : 'M'}${v[0]} ${v[1]}`).join('');
      const alpha = age >= duration ? 0 : state.holding ? Math.sin(Math.PI * state.charge) : .8;
      for (const el of [core, haze]) { el.setAttribute('d', d); el.style.opacity = el === haze ? alpha * .26 : alpha; }
      const tip = shape.at(p), prev = shape.at(Math.max(0, p - .01));
      if (glint) {
        glint.setAttribute('cx', tip[0]); glint.setAttribute('cy', tip[1]); glint.setAttribute('opacity', flash(state));
      }
      const particles = sparks(state.burstAge, Math.atan2(tip[1] - prev[1], tip[0] - prev[0]));
      tails.forEach(({el, gradient}, i) => {
        const s = particles[i];
        el.setAttribute('opacity', s ? s.alpha : 0);
        if (s) {
          const a = [tip[0] + s.tail[0], tip[1] + s.tail[1]], b = [tip[0] + s.head[0], tip[1] + s.head[1]];
          el.setAttribute('d', `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`);
          gradient.setAttribute('x1', a[0]); gradient.setAttribute('y1', a[1]);
          gradient.setAttribute('x2', b[0] + .001); gradient.setAttribute('y2', b[1] + .001);
        }
      });
    };
  }
  function gridTiming(direction, index, count, scale = 1) {
    const vertical = direction === 'v', rank = index / Math.max(1, count - 1);
    return { start: (vertical ? .24 + rank * 13 * .075 : .68 + rank * 9 * .088) * scale,
      duration: (vertical ? 1.03 : 1.13) * scale };
  }
  function gridProgress(age, direction, index, count, scale = 1) {
    const timing = gridTiming(direction, index, count, scale);
    return smooth((age - timing.start) / timing.duration);
  }
  function canvasFilament(ctx, start, tip, head, alpha, silver = false) {
    const dx = tip[0] - start[0], dy = tip[1] - start[1], length = Math.hypot(dx, dy);
    if (length < 2) return;
    const tail = Math.max(0, head - 20 / length);
    const a = [start[0] + dx * tail, start[1] + dy * tail], b = [start[0] + dx * head, start[1] + dy * head];
    const gr = ctx.createLinearGradient(a[0], a[1], b[0] + .01, b[1] + .01);
    gr.addColorStop(0, silver ? 'rgba(189,200,219,0)' : 'rgba(232,184,74,0)');
    gr.addColorStop(.75, silver ? 'rgba(219,229,235,.7)' : 'rgba(255,233,177,.7)'); gr.addColorStop(1, '#fffdf4');
    ctx.globalAlpha = alpha; ctx.strokeStyle = gr; ctx.lineWidth = 1.25;
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
  }
  function canvasGrid(ctx, start, tip, p, { alpha = 1 } = {}) {
    if (p <= 0 || p >= 1) return;
    ctx.save(); ctx.shadowBlur = 0;
    canvasFilament(ctx, start, tip, 1, alpha);
    ctx.restore();
  }
  function canvas(ctx, start, tip, age, duration, { burst = true, alpha = 1 } = {}) {
    if (!Number.isFinite(age)) return;
    const state = phase(age, duration);
    if (!state.active) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.shadowBlur = 0;
    if (age < duration) {
      canvasFilament(ctx, start, tip, state.holding ? mix(.55, 1, state.charge) : 1,
        alpha * (state.holding ? Math.sin(Math.PI * state.charge) : .8));
    }
    if (burst) {
      const brightness = flash(state);
      if (brightness > 0) {
        const gr = ctx.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 7);
        gr.addColorStop(0, '#fffdf4'); gr.addColorStop(.16, 'rgba(255,253,244,.85)');
        gr.addColorStop(.42, 'rgba(255,228,160,.22)'); gr.addColorStop(1, 'rgba(232,184,74,0)');
        ctx.globalAlpha = alpha * brightness; ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(...tip, 7, 0, Math.PI * 2); ctx.fill();
      }
      for (const p of sparks(state.burstAge, Math.atan2(tip[1] - start[1], tip[0] - start[0]), .75)) {
        const a = [tip[0] + p.tail[0], tip[1] + p.tail[1]], b = [tip[0] + p.head[0], tip[1] + p.head[1]];
        const gr = ctx.createLinearGradient(...a, b[0] + .001, b[1] + .001);
        gr.addColorStop(0, 'rgba(221,167,70,0)'); gr.addColorStop(.55, 'rgba(255,221,160,.7)'); gr.addColorStop(1, '#fff9e9');
        ctx.globalAlpha = alpha * p.alpha; ctx.strokeStyle = gr; ctx.lineWidth = .65;
        ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
      }
    }
    ctx.restore();
  }
return {progress,phase,gridTiming,gridProgress,canvas,canvasGrid,svgEffect};
})();
