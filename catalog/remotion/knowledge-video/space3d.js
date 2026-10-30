// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {LineGrowth} from './line-growth.js';
/*
 * Depth-projected Canvas particles inspired by nolangz/3D-Chladni,
 * app/index.html (Apache-2.0). See assets/licenses/3D-Chladni-Apache-2.0.txt.
 * Adaptation: sharp, pixel-aligned grains; seeded, seek-safe nodal assembly;
 * absolute-time rotation, gold-white wire and silver-white grains.
 * No upstream audio or loop.
 * Cube line choreography and origin-light profiles adapted from Wise Motion's
 * point-domain-flow.js, drawCoordinate(), point() and light().
 * Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0.
 * See assets/licenses/Wise-Motion-NOTICE.md.
 */
export const Space3D = (() => {
  const TAU = Math.PI * 2;
  // Match the Transformer silk's gold / goldHi and white / silver palette.
  const gold = { body: '#e8b84a', light: '#ffd873', core: '#fff0c2' };
  const silver = { body: [184, 188, 198], core: [242, 242, 240] };
  // The same white-to-silver mix as the Transformer strands. Index-based tint
  // leaves the seeded positions, arrival times and particle sizes untouched.
  function silverTint(i) {
    const t = (i * .61803398875) % 1;
    return `rgb(${silver.core.map((v, k) => Math.round(v + (silver.body[k] - v) * t)).join(',')})`;
  }
  const grainStops = color => [
    [0, '#ffffff', .98], [.25, '#f2f2f0', .96],
    [.62, color, .78], [1, '#b8bcc6', 0]
  ];
  const silverGrains = new Map();
  function silverGrain(size, color) {
    const key = `${size}:${color}`;
    if (silverGrains.has(key)) return silverGrains.get(key);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    // The entire gradient fits inside one 1–3 px grain. No outer halo.
    const g = ctx.createRadialGradient(size * .34, size * .3, 0, size * .5, size * .5, size * .68);
    for (const [at, tint, opacity] of grainStops(color)) {
      const rgb = tint.startsWith('#')
        ? [1, 3, 5].map(i => parseInt(tint.slice(i, i + 2), 16))
        : tint.match(/\d+/g).slice(0, 3);
      g.addColorStop(at, `rgba(${rgb.join(',')},${opacity})`);
    }
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    silverGrains.set(key, canvas); return canvas;
  }
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  function rng(seed) {
    let n = seed >>> 0;
    return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
  }
  function camera(o, t = 0) {
    const yaw = (o.yaw ?? 0.3) + Math.sin(t * 0.35) * (o.spin ?? 0.08);
    const pitch = (o.pitch ?? -0.22) + Math.sin(t * 0.21) * (o.sway ?? 0.025);
    const roll = o.roll ?? 0;
    return { ...o, depth: o.depth ?? 5, cyaw: Math.cos(yaw), syaw: Math.sin(yaw), cp: Math.cos(pitch), sp: Math.sin(pitch), cr: Math.cos(roll), sr: Math.sin(roll) };
  }
  function project(p, c) {
    const x0 = p[0] * c.cyaw + p[2] * c.syaw;
    const z0 = -p[0] * c.syaw + p[2] * c.cyaw;
    const y0 = p[1] * c.cp - z0 * c.sp;
    const z = p[1] * c.sp + z0 * c.cp;
    const x = x0 * c.cr - y0 * c.sr, y = x0 * c.sr + y0 * c.cr;
    const scale = c.depth / Math.max(0.5, c.depth + z);
    const front = clamp((1.8 - z) / 3.6);
    return { x: c.cx + x * c.scale * scale, y: c.cy - y * c.scale * scale, z, scale, light: 0.3 + 0.7 * front };
  }
  function cloud(seed, n, o = {}) {
    const r = rng(seed), radii = o.radii ?? [1, 1, 1], center = o.center ?? [0, 0, 0], shell = o.shell ?? 0.5;
    return Array.from({ length: n }, (_, i) => {
      const a = r() * TAU, z = r() * 2 - 1, q = Math.sqrt(1 - z * z);
      const rad = Math.pow(r(), 1 / 3) * (1 - shell) + shell;
      return { p: [center[0] + Math.cos(a) * q * rad * radii[0], center[1] + Math.sin(a) * q * rad * radii[1], center[2] + z * rad * radii[2]], color: o.color ?? (i % 5 ? '#b8bcc6' : '#ffd873'), size: 0.65 + r() * 1.2, alpha: 0.3 + r() * 0.6, phase: r() * TAU, star: i % 23 === 0 };
    });
  }
  // Chladni's sand gathers along nodes instead of filling a foggy volume.
  // Here an ellipsoid's zero surface replaces the audio-driven standing wave.
  // Evenly spaced directions keep settled grains apart; each grain travels
  // from a seeded cube position along a bounded curve, with a staggered arrival.
  function formation(seed, n, o = {}) {
    const r = rng(seed), radii = o.radii ?? [1, 1, 1], half = o.half ?? 1.3;
    const turn = Math.PI * (3 - Math.sqrt(5)), rotation = r() * TAU;
    return Array.from({ length: n }, (_, i) => {
      const z = 1 - 2 * (i + .5) / n, q = Math.sqrt(1 - z * z), angle = rotation + i * turn;
      const radius = .95 + r() * .05;
      const from = [0, 1, 2].map(() => (r() * 2 - 1) * half);
      const control = from.map(v => v * .5 + (r() * 2 - 1) * half * .5);
      return {
        p: [Math.cos(angle) * q, Math.sin(angle) * q, z].map((v, k) => v * radius * radii[k]),
        from, control, delay: r() * .18, size: 1.35 + r() * .9,
        alpha: .66 + r() * .27, color: silverTint(i),
      };
    });
  }
  // Absolute-time evaluation: seeking backward or skipping frames cannot alter
  // a trajectory. A convex curve keeps all travel inside the cube's walls.
  function gather(points, age, o = {}) {
    const center = o.center ?? [0, 0, 0], duration = o.duration ?? 1.35;
    return points.map(p => {
      const t = clamp((age - (o.delay ?? 0) - p.delay) / duration);
      const u = t * t * (3 - 2 * t), v = 1 - u;
      return { ...p, settled: u, p: p.p.map((x, k) => v * v * p.from[k] + 2 * v * u * p.control[k] + u * u * (x + center[k])) };
    });
  }
  const stars = new Map();
  function star(color) {
    if (stars.has(color)) return stars.get(color);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
    const ctx = canvas.getContext('2d'), g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, '#fff8e8'); g.addColorStop(0.13, color); g.addColorStop(0.4, color + '55'); g.addColorStop(1, color + '00');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32); stars.set(color, canvas); return canvas;
  }
  let starPoint;
  // Wise Motion's warm-white origin light: a tiny white core, graduated halo
  // and a hairline optical flare. Its extent is shortened here to clear labels.
  const lightStops = [
    [0, 'rgba(255,252,246,.96)'], [.075, 'rgba(255,247,233,.94)'],
    [.18, 'rgba(242,228,207,.48)'], [.43, 'rgba(193,179,162,.1)'],
    [1, 'rgba(160,135,110,0)']
  ];
  const flareStops = [
    [0, 'rgba(255,240,218,0)'], [.29, 'rgba(241,232,218,.03)'],
    [.46, 'rgba(244,237,224,.13)'], [.5, 'rgba(255,255,246,.7)'],
    [.54, 'rgba(244,237,224,.13)'], [.71, 'rgba(241,232,218,.03)'],
    [1, 'rgba(255,240,218,0)']
  ];
  const goldLightStops = [
    [0, '#fff0c2f5'], [.075, '#ffe4a1f0'], [.18, '#ffd8737a'],
    [.43, '#e8b84a1a'], [1, '#e8b84a00']
  ];
  const goldFlareStops = [
    [0, '#e8b84a00'], [.29, '#e8b84a08'], [.46, '#ffd87321'],
    [.5, '#fff0c2b3'], [.54, '#ffd87321'], [.71, '#e8b84a08'],
    [1, '#e8b84a00']
  ];
  function originLight(ctx, x, y, alpha = 1, unit = 1.5, golden = false) {
    if (alpha <= .001) return;
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = alpha;
    const halo = ctx.createRadialGradient(x, y, 0, x, y, 8 * unit);
    (golden ? goldLightStops : lightStops).forEach(([at, color]) => halo.addColorStop(at, color));
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, 8 * unit, 0, TAU); ctx.fill();
    const extent = 10 * unit, flare = ctx.createLinearGradient(x - extent, y, x + extent, y);
    (golden ? goldFlareStops : flareStops).forEach(([at, color]) => flare.addColorStop(at, color));
    ctx.strokeStyle = flare; ctx.lineWidth = .5 * unit;
    ctx.beginPath(); ctx.moveTo(x - extent, y); ctx.lineTo(x + extent, y); ctx.stroke();
    ctx.fillStyle = golden ? gold.core : '#fffefa'; ctx.beginPath(); ctx.arc(x, y, .48 * unit, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function starSprite() {
    if (starPoint) return starPoint;
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 96;
    originLight(canvas.getContext('2d'), 48, 48, 1, 4.5);
    starPoint = canvas; return canvas;
  }
  let grainGradientId = 0;
  // A label's location uses the same small silver-white gradient as the cloud.
  function svgParticle(parent, { x = 0, y = 0, radius = 1.25, opacity = 1, color = silverTint(0) } = {}) {
    const create = (tag, attrs, target) => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, String(value));
      target.appendChild(element);
      return element;
    };
    const marker = create('g', { transform: `translate(${x} ${y})`, opacity }, parent);
    const id = `space3d-silver-grain-${++grainGradientId}`;
    const defs = create('defs', {}, marker);
    const gradient = create('radialGradient', { id, cx: '.5', cy: '.5', r: '.68', fx: '.34', fy: '.3' }, defs);
    grainStops(color).forEach(([offset, tint, alpha]) => create('stop', { offset, 'stop-color': tint, 'stop-opacity': alpha }, gradient));
    const size = Math.min(2.5, Math.max(1, radius * 2));
    create('rect', { x: -size / 2, y: -size / 2, width: size, height: size, fill: `url(#${id})` }, marker);
    return marker;
  }
  function render(ctx, points, cam, o = {}) {
    const alpha = o.alpha ?? 1; if (alpha <= 0.001) return;
    const time = o.time ?? 0, darkLift = clamp(o.darkLift ?? 0);
    const projected = points.map(p => ({ p, q: project(p.p, cam) })).sort((a, b) => b.q.z - a.q.z);
    ctx.save(); ctx.globalCompositeOperation = o.grainPoints ? 'source-over' : 'lighter';
    if (o.grainPoints) { ctx.imageSmoothingEnabled = false; ctx.shadowBlur = 0; }
    for (const { p, q } of projected) {
      if (o.grainPoints) {
        // Keep native pixel sizes and integer positions. Cached gradients fade
        // only within the grain; no blur, additive pile-up or star spikes.
        const size = clamp(Math.round(p.size * q.scale * (o.pointSize ?? 1)), 1, 3);
        ctx.globalAlpha = clamp(alpha * p.alpha * (.72 + .28 * q.light) * (.6 + .4 * (p.settled ?? 1)));
        ctx.drawImage(silverGrain(size, p.color), Math.round(q.x - size / 2), Math.round(q.y - size / 2));
        continue;
      }
      const light = 0.78 + 0.22 * Math.sin(time * 0.8 + p.p[0] * 1.7 + p.phase);
      const brightness = p.alpha * light;
      const a = darkLift === 0 ? alpha * p.alpha * q.light * light
        : alpha * (brightness + (1 - brightness) * darkLift) * q.light;
      const size = clamp(p.size * q.scale * (o.pointSize ?? 1), .65, 3.4);
      if (o.starPoints && p.star) {
        const radius = 6.5 * q.scale;
        ctx.globalAlpha = clamp(a * (1.1 + 0.12 * Math.sin(time * 3 + p.phase)));
        ctx.drawImage(starSprite(), q.x - radius, q.y - radius, radius * 2, radius * 2);
        continue;
      }
      ctx.globalAlpha = a; ctx.fillStyle = p.color;
      ctx.fillRect(q.x - size / 2, q.y - size / 2, size, size);
      if (p.star) {
        const radius = 7 * q.scale;
        ctx.globalAlpha = a * (0.15 + 0.1 * Math.sin(time * 3 + p.phase));
        ctx.drawImage(star(p.color), q.x - radius, q.y - radius, radius * 2, radius * 2);
      }
    }
    ctx.restore();
  }
  function line(ctx, points, cam, color, alpha, width = 1, depthRange, silk = false) {
    let sheen, core;
    if (silk) {
      const projected = points.map(p => project(p, cam));
      let a = projected[0], b = projected[projected.length - 1];
      if (Math.hypot(b.x - a.x, b.y - a.y) < .01) {
        // Closed cluster contours need a spatial gradient, not coincident ends.
        a = { x: Math.min(...projected.map(p => p.x)), y: Math.min(...projected.map(p => p.y)) };
        b = { x: Math.max(...projected.map(p => p.x)), y: Math.max(...projected.map(p => p.y)) };
      }
      const gradient = stops => {
        const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        stops.forEach(([at, tint]) => g.addColorStop(at, tint)); return g;
      };
      sheen = gradient([[0, '#e8b84a80'], [.2, '#ffd873c7'], [.34, '#fff6dce8'], [.53, '#ffd87399'], [.76, '#fffefaed'], [1, '#e8b84a99']]);
      core = gradient([[0, '#fff0c200'], [.2, '#fff0c25c'], [.34, '#fffefadc'], [.53, '#fff0c22e'], [.76, '#fffefae6'], [1, '#fff0c200']]);
    }
    const stroke = () => {
      // Both layers are transparent gradients; there is no solid gold base.
      ctx.strokeStyle = silk ? sheen : color; ctx.lineWidth = width; ctx.stroke();
      if (silk) {
        // A narrow translucent highlight, not a wider blurred glow.
        ctx.save(); ctx.shadowBlur = 0; ctx.globalAlpha *= .54;
        ctx.strokeStyle = core; ctx.lineWidth = width * .48; ctx.stroke(); ctx.restore();
      }
    };
    if (depthRange) {
      const [near, far] = depthRange;
      // Split straight frame edges too, so depth changes along each edge instead
      // of assigning one brightness to an entire front-to-back connection.
      const pts = points.length === 2 ? Array.from({ length: 9 }, (_, i) => points[0].map((v, k) => v + (points[1][k] - v) * i / 8)) : points;
      const projected = pts.map(p => project(p, cam));
      for (let i = 1; i < projected.length; i++) {
        const a = projected[i - 1], b = projected[i];
        const front = clamp((far - (a.z + b.z) / 2) / Math.max(0.001, far - near));
        ctx.globalAlpha = clamp(alpha * (silk ? .56 + .44 * front : .42 + .58 * front));
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); stroke();
      }
      return;
    }
    ctx.globalAlpha = alpha; ctx.beginPath();
    points.forEach((p, i) => { const q = project(p, cam); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }); stroke();
  }
  function frame(ctx, cam, o = {}) {
    // A single half-edge length makes every face square in world space.
    const half = o.half ?? 1.4, alpha = o.alpha ?? .8;
    if (!Number.isFinite(half) || half <= 0) throw new Error('Space3D.frame requires one positive cube half-edge length');
    if (alpha <= 0.001) return;
    const color = o.color ?? gold.body, width = o.lineWidth ?? 1.05, age = o.age ?? Infinity;
    const progress = (delay, duration = .65) => LineGrowth.progress(clamp((age - delay) / duration), duration);
    const depths = [-1, 1].flatMap(i => [-1, 1].flatMap(j => [-1, 1].map(k => project([i*half,j*half,k*half],cam).z)));
    const range = [Math.min(...depths), Math.max(...depths)];
    const origin = [-half, -half, -half], primary = [];
    ctx.save(); ctx.lineCap = 'butt'; ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = color; ctx.shadowBlur = 1.2;
    for (let axis = 0; axis < 3; axis++) for (const i of [-1,1]) for (const j of [-1,1]) {
      const other = [0,1,2].filter(k => k !== axis), a = [-half,-half,-half], b = [...a];
      a[other[0]] = b[other[0]] = i * half; a[other[1]] = b[other[1]] = j * half; b[axis] = half;
      const main = i === -1 && j === -1, delay = (i + j + 2) * .1 + axis * .09, u = progress(delay);
      if (u <= 0) continue;
      const end = a.map((v, k) => v + (b[k] - v) * u);
      if (main) primary.push({ a, b: end });
      else line(ctx, [a,end], cam, color, alpha * .9, width, range, true);
      const head = project(end,cam), start = project(a,cam);
      LineGrowth.canvas(ctx,[start.x,start.y],[head.x,head.y],age-delay,.65,{burst:main,alpha:alpha*.8});
    }
    // The reference's dash-dot coordinates are the three edges from one origin.
    ctx.setLineDash([18.6,5.1,2.9,5.1]);
    primary.forEach(({a,b}) => line(ctx,[a,b],cam,gold.light,alpha,width*1.12,undefined,true));
    ctx.setLineDash([]);
    ctx.shadowBlur = .6;
    // Golden-rectangle waterfall: stagger the two directions independently.
    // Keep all eight divisions and the finished gold-white filament unchanged.
    for (let i=1;i<8;i++) {
      const v=-half+2*half*i/8;
      for (const direction of ['v','h']) {
        const u=LineGrowth.gridProgress(age,direction,i-1,7), end=-half+2*half*u;
        if (u <= 0) continue;
        const [a,b]=direction==='v' ? [[v,-half,-half],[v,-half,end]] : [[-half,-half,v],[end,-half,v]];
        line(ctx,[a,b],cam,gold.body,alpha*.8,width*.85,range,true);
        const start=project(a,cam),head=project(b,cam);
        LineGrowth.canvasGrid(ctx,[start.x,start.y],[head.x,head.y],u,{alpha:alpha*.5});
      }
    }
    ctx.shadowBlur = 0;
    const q = project(origin,cam);
    originLight(ctx,q.x,q.y,alpha*progress(0,.3),1.65,true);
    ctx.restore();
  }
  function ring(ctx, cam, center, radii, o = {}) {
    const projectedCenter = project(center, cam);
    // The depth extent of an ellipsoid after the camera's yaw and pitch.
    const extent = Math.hypot(radii[0] * cam.syaw * cam.cp, radii[1] * cam.sp, radii[2] * cam.cyaw * cam.cp);
    const range = o.depthShading ? [projectedCenter.z - extent, projectedCenter.z + extent] : null;
    ctx.save();
    for (let axis=0;axis<3;axis++) {
      const pts=Array.from({length:65},(_,i)=>{
        const a=i/64*TAU,p=[...center]; p[(axis+1)%3]+=Math.cos(a)*radii[(axis+1)%3]; p[(axis+2)%3]+=Math.sin(a)*radii[(axis+2)%3]; return p;
      });
      line(ctx,pts,cam,o.color ?? gold.body,(o.alpha ?? 0.2)*(range ? 1 : axis===1?1:0.5),o.lineWidth ?? 0.9,range,true);
    }
    ctx.restore();
  }
  function dot(ctx,q,o={}) {
    const alpha=o.alpha ?? 1; if(alpha<=0.001) return;
    const color=o.color ?? '#ffd873', radius=(o.radius ?? 6)*q.scale;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha*q.light*0.6;
    ctx.drawImage(star(color),q.x-radius*3,q.y-radius*3,radius*6,radius*6);
    ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.arc(q.x,q.y,radius,0,TAU);ctx.fill();ctx.restore();
  }
  return { gold, camera, project, cloud, formation, gather, render, frame, ring, dot, svgParticle };
})();
