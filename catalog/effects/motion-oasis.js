/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0.
 * Motion Oasis: portable geometry and water painters. No reference media.
 * Each player owns its scene caches; the catalog provides the only clock.
 */
(function (global) {
'use strict';
const HANDOFF_START = 3.90;
const HANDOFF_END = 4.55;
const COMPOSITION_DURATION_MS = 4950;
function handoffAt(t) {
  const p = Math.max(0, Math.min(1, (t - HANDOFF_START) / (HANDOFF_END - HANDOFF_START)));
  return p * p * p * (10 + p * (-15 + p * 6));
}
function createEngine(registry) {
  const window = {Opus:{}};
/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0.
 * Code-drawn catalog adaptations on the real water planes. One supplied clock;
 * each tile shares the scene time and the catalog painter.
 */
(function () {
  'use strict';
  const ROOT = '';
  const catalogCounts = registry?.effects ? Object.fromEntries(['action','illustration','composition'].map(k => [k, registry.effects.filter(e => e.kind === k).length])) : registry?.counts || {"action": 216, "illustration": 58, "composition": 21};
  const catalogDistributions = registry?.effects ? Object.fromEntries(Object.keys(catalogCounts).map(k => { const groups = {}; for (const e of registry.effects) if(e.kind === k) groups[e.category] = (groups[e.category] || 0) + 1; return [k, Object.values(groups)]; })) : registry?.distributions || {"action": [12, 7, 17, 25, 13, 14, 28, 10, 16, 12, 16, 14, 10, 11, 11], "illustration": [17, 15, 10, 9, 7], "composition": [4, 6, 11]};
  const TAU = Math.PI * 2, START = 1.40, PERIOD = .66, SPEED = 1.6;
  const clamp = v => Math.max(0, Math.min(1, v));
  const mod = (v, n) => ((v % n) + n) % n;
  const phase = (t, a, b) => { const p = clamp((t - a) / (b - a)); return p * p * (3 - 2 * p); };
  const cubic = p => { p = clamp(p); return p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2; };
  const rgba = (hex, a) => `rgba(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',')},${clamp(a)})`;
  const effects = [
    { id: 'group-stagger', name: '按距离依次响应', kind: 'action', color: '#afffdc', source: 'environment.js', relation: '中心发出信号；35个圆角方块依距离延迟，上移、放大后回落。' },
    { id: 'wave-grid', name: '网格波次传递', kind: 'action', color: '#9cece2', source: 'history-patterns.js', relation: '35个点按到左上角的距离延迟，半径与亮度共用正弦波峰。' },
    { id: 'claude-orbits-illustration', name: '多轨圆点环绕', kind: 'illustration', color: '#ffdda4', source: 'claude-tile-illustrations.js', relation: '五道椭圆；五个圆点按2.2/i的相对角速度环绕。' },
    { id: 'center-ripple-emit', name: '同心涟漪扩散', kind: 'action', color: '#bde99f', source: 'radial-branch-flow.js', relation: '固定圆心与两圈半周期错相扩散、渐淡的涟漪。' },
    { id: 'material-spinner-arc', name: '圆弧旋转伸缩', kind: 'action', color: '#ffd077', source: 'reel-flat-gen.js', relation: '起点每秒6弧度旋转；弧长按正弦在0.3–2.1弧度间变化。' },
    { id: 'spiral-draw-spin', name: '螺线描绘旋转', kind: 'action', color: '#ffb69c', source: 'reel-paper.js', relation: '保留内旋曲线、末尾减速描画和同时自转，按每秒12格取样。' },
    { id: 'planar-dot-orbit', name: '圆点平面绕转', kind: 'action', color: '#fff0d1', source: 'reel-paper.js', relation: '固定半径与1.6弧度角速度；点的初始尺寸回弹，按每秒12格取样。' },
    { id: 'radial-branch-flow', name: '涟漪扩散连线分流', kind: 'composition', color: '#e8c8ee', source: 'radial-branch-flow.js', relation: '涟漪、曲线生长、光团沿同一曲线移动，抵达后端点显卡。' }
  ].map(e => Object.freeze({ ...e, source: ROOT + 'catalog/effects/' + e.source }));
  const isWater = (i, j) => (i >= 9 && j <= 5) || (i === 9 && j >= 6 && j <= 9) || (j === 9 && i >= 5 && i <= 8);
  const cells = [];
  for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) if (isWater(i, j)) cells.push(Object.freeze({
    i, j, index: cells.length, center: Object.freeze([(i + .5) * 55, (j + .5) * 55, 8.1])
  }));
  const origins = [[10, 2], [11, 0]];
  // Catalog relationships, compressed together for this scene:
  // group-stagger: 300 ms of distance lag / 1000 ms of outCubic response.
  // wave-grid: .055 of distance lag / .13 of linear response.
  const profiles = Object.freeze([
    Object.freeze({ id: 'group-stagger', duration: .30, lag: .09, ease: 'outCubic', origin: origins[0] }),
    Object.freeze({ id: 'wave-grid', duration: .09 * .13 / .055, lag: .09, ease: 'linear', origin: origins[1] })
  ]);
  const progressAt = (t, wave) => {
    const q = clamp((t - wave.at) / wave.duration);
    return wave.ease === 'outCubic' ? 1 - (1 - q) ** 3 : q;
  };
  function waveAt(round, cell) {
    const profile = profiles[mod(round, profiles.length)], origin = profile.origin;
    const distance = Math.hypot(cell.i - origin[0], cell.j - origin[1]);
    const at = START + round * PERIOD + .04 + distance * profile.lag;
    const crestAt = at + profile.duration * (profile.ease === 'outCubic' ? 1 - Math.cbrt(.5) : .5);
    return { ...profile, round, distance, at, crestAt };
  }
  function activeWave(t, cell) {
    let round = Math.max(0, Math.floor((t - START) / PERIOD));
    // Distant canal cells can receive a wave after the next one was emitted.
    // Resolve arrivals per cell, never advance a cell just because a new round began.
    while (round > 0 && t < waveAt(round, cell).at) round--;
    return waveAt(round, cell);
  }
  function waterHeight(t, i, j) {
    const active = activeWave(t, { i, j });
    const pulse = Math.sin(Math.PI * progressAt(t, active));
    const settling = Math.sin(Math.PI * phase(t, active.at + active.duration, active.at + active.duration + .10)) ** 2;
    const pool = i >= 9 && j <= 5;
    const amplitude = pool ? (active.id === 'group-stagger' ? 12 : 8) : 3.8;
    const drift = Math.sin(t * 3.4 - i * .58 - j * .73) + .35 * Math.sin(t * 4.7 + i * .42 - j * .61);
    const swell = phase(t, .88, 1.14) * (pool ? 1.35 : .45) * drift;
    return 7 + swell + amplitude * (pulse - .08 * settling);
  }
  function stateAt(t) {
    const round = Math.max(0, Math.floor((t - START) / PERIOD));
    const mode = round % 2 ? 'wave-grid' : 'group-stagger';
    const states = cells.map(cell => {
      const wave = waveAt(round, cell);
      const active = activeWave(t, cell), revision = active.round, first = waveAt(0, cell);
      const progress = progressAt(t, active), pulse = Math.sin(Math.PI * progress);
      const transition = progress * progress * (3 - 2 * progress);
      const effectIndex = mod(cell.index - 16 + revision, effects.length);
      // Both pictures keep running across the crest. The incoming picture is
      // already in motion, so drawing its introductory blank poses cannot erase
      // the water or interrupt the outgoing picture.
      const layer = (r, opacity) => {
        const effect = effects[mod(cell.index - 16 + r, effects.length)];
        const age = .9 + Math.max(0, t - waveAt(r, cell).at) * SPEED;
        return { effect, age, opacity };
      };
      const layers = [];
      if (revision > 0 && transition < 1) layers.push(layer(revision - 1, 1 - transition));
      layers.push(layer(revision, transition));
      return { ...cell, waveAt: wave.at, crestAt: wave.crestAt, waveDuration: wave.duration, distance: wave.distance,
        responseMode: active.id, pulse, responseScale: .78 * (1 + (active.id === 'group-stagger' ? .55 : .22) * pulse),
        visibility: .8 + .2 * pulse, revision, effectIndex,
        effect: effects[effectIndex], age: layers[layers.length - 1].age, transition, layers,
        open: phase(progressAt(t, first), 0, 1) };
    });
    const origin = origins[mod(round, origins.length)];
    const selected = states.find(cell => cell.i === origin[0] && cell.j === origin[1]);
    return { round, mode, cells: states, selected, modeName: mode === 'group-stagger' ? '按距离依次响应' : '网格波次传递' };
  }
  const circlePoints = (x, y, rx, ry = rx, start = 0, end = TAU, n = 28) => Array.from({ length: n + 1 }, (_, k) => {
    const a = start + (end - start) * k / n; return [x + Math.cos(a) * rx, y + Math.sin(a) * ry];
  });
  function glyph(c, id, age, color) {
    const path = (points, width = .7, alpha = 1) => {
      if (points.length < 2 || alpha <= 0) return;
      c.beginPath(); points.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p));
      c.strokeStyle = rgba(color, alpha); c.lineWidth = width; c.stroke();
    };
    const dot = (x, y, r, alpha = 1) => { c.beginPath(); c.arc(x, y, Math.max(.01, r), 0, TAU); c.fillStyle = rgba(color, alpha); c.fill(); };
    const t = mod(age, 6);
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (id === 'group-stagger' || id === 'wave-grid') {
      const time = mod(age, 2.9), p = mod(age, 1.6) / 1.6;
      for (let k = 0; k < 35; k++) {
        const i = k % 7, j = Math.floor(k / 7), distance = id === 'group-stagger' ? Math.hypot(i - 3, j - 2) : Math.hypot(i, j);
        const q = id === 'group-stagger' ? clamp(time - .5 - distance * .3) : clamp((p - .1 - distance * .055) / .13);
        const pulse = Math.sin(Math.PI * (id === 'group-stagger' ? 1 - (1 - q) ** 3 : q));
        const x = (i - 3) * 5.3, y = (j - 2) * 5.3;
        if (id === 'group-stagger') {
          const size = 2.5 * (1 + pulse * .55), lift = pulse * 2.1;
          c.fillStyle = rgba(color, .5 + .5 * pulse); c.beginPath();
          c.roundRect(x - size / 2, y - lift - size / 2, size, size, .42); c.fill();
        } else dot(x, y, 1.05 * (1 + pulse), .3 + .7 * pulse);
      }
    } else if (id === 'claude-orbits-illustration') {
      dot(0, 0, 1.2);
      for (let i = 1; i <= 5; i++) {
        const rx = i * 3.6, ry = i * 1.8, a = age * 2.2 / i + i;
        path(circlePoints(0, 0, rx, ry), .38, .38); dot(Math.cos(a) * rx, Math.sin(a) * ry, .4 + i * .1);
      }
    } else if (id === 'center-ripple-emit' || id === 'radial-branch-flow') {
      const rootOpen = phase(t, 0, .4), end = 1 - phase(t, 4.8, 5.4), rootRadius = 3;
      path(circlePoints(0, 0, rootRadius), .6, rootOpen); dot(0, 0, .7 * (1 + .08 * Math.sin(t * 5) * end), rootOpen);
      for (let k = 0; k < 2; k++) { const p = mod(t * .55 + k * .5, 1); path(circlePoints(0, 0, 3.5 + p * 13.5), .5, .65 * (1 - p) * rootOpen * end); }
      if (id === 'radial-branch-flow') {
        const ends = [[-17, -8], [17, -8], [0, 14]], controls = [[-10, -2], [10, -2], [0, 6]];
        ends.forEach((target, i) => {
          const d = Math.hypot(...target), start = target.map(v => v / d * rootRadius), control = controls[i];
          const at = p => start.map((v, axis) => (1 - p) ** 2 * v + 2 * (1 - p) * p * control[axis] + p * p * target[axis]);
          const arrival = [2.6, 3.7, 4.8][i], growth = cubic(cubic((t - .65 - i * .25) / .65));
          if (growth > 0) path(Array.from({ length: 15 }, (_, k) => at(growth * k / 14)), .55, t >= arrival ? .9 : .4);
          const head = cubic(cubic((t - arrival + .9) / .9));
          if (head > 0 && head < 1) { dot(...at(head), 1.1); }
          const card = phase(t, arrival, arrival + .55);
          if (card > 0) {
            const [x, y] = target; path([[x - 4, y - 2.6], [x + 4, y - 2.6], [x + 4, y + 2.6], [x - 4, y + 2.6], [x - 4, y - 2.6]], .65, card);
            path([[x - 2, y], [x + 2, y]], .6, card);
          }
        });
      }
    } else if (id === 'material-spinner-arc') {
      const sourceTime = age + 4.1, a = sourceTime * 6, length = 1.2 + Math.sin(sourceTime * 4) * .9;
      path(circlePoints(0, 0, 13, 13, a, a + length, 22), 4.33);
    } else if (id === 'spiral-draw-spin') {
      const q = Math.floor(t * 12) / 12, progress = 1 - (1 - clamp((q - .5) / 4.1)) ** 3;
      const theta = 6 * Math.PI * progress, rotation = q * .35;
      const count = Math.max(2, Math.ceil(theta / .10));
      const points = Array.from({ length: count }, (_, k) => {
        const angle = k * theta / (count - 1), x = (4 * Math.cos(angle) + 4.2 * Math.cos(4 / 3 * angle)) * 2.1;
        const y = (4 * Math.sin(angle) - 4.2 * Math.sin(4 / 3 * angle)) * 2.1;
        return [x * Math.cos(rotation) - y * Math.sin(rotation), x * Math.sin(rotation) + y * Math.cos(rotation)];
      });
      if (q > .15) path(points, .65);
    } else if (id === 'planar-dot-orbit') {
      const q = Math.floor(t * 12) / 12, p = clamp((q - .15) / .6), scale = 1 + 2.70158 * (p - 1) ** 3 + 1.70158 * (p - 1) ** 2;
      path(circlePoints(0, 0, 17), .35, .35); dot(0, 0, .45, .6); dot(Math.cos(q * 1.6) * 17, Math.sin(q * 1.6) * 17, .85 * Math.max(0, scale));
    }
  }
  function render(t, g) {
    const state = stateAt(t);
    for (const cell of state.cells) {
      if (cell.open < .001) continue;
      const pulse = cell.pulse;
      const center = [...cell.center]; center[2] = waterHeight(t, cell.i, cell.j) + .22;
      g.surfaceArt(center, c => {
        // The real water remains exposed throughout entry and every handoff.
        // A passing highlight belongs to the crest, not an opaque display tile.
        c.globalAlpha = 1;
        c.fillStyle = `rgba(169,255,226,${pulse * .10})`; c.fillRect(-24.3, -24.3, 48.6, 48.6);
        c.strokeStyle = `rgba(207,255,240,${pulse * .5})`; c.lineWidth = .6 + pulse * .6;
        c.beginPath(); c.rect(-23.8, -23.8, 47.6, 47.6); c.stroke();
        c.save(); c.scale(cell.responseScale, cell.responseScale);
        c.shadowColor = 'rgba(21,86,85,.55)'; c.shadowBlur = 1.2;
        for (const layer of cell.layers) {
          if (layer.opacity <= 0) continue;
          c.globalAlpha = layer.opacity * cell.visibility;
          glyph(c, layer.effect.id, layer.age, layer.effect.color);
        }
        c.restore();
        // Caustic glints live on this moving plane, above the translucent art.
        const ripple = Math.sin(t * 3.4 + cell.i * .7 + cell.j) * 2;
        c.strokeStyle = 'rgba(211,255,241,.36)'; c.lineWidth = .6;
        c.beginPath(); c.moveTo(-19 + ripple, -19); c.lineTo(-7 + ripple, -19.6);
        c.moveTo(7 - ripple, 19.6); c.lineTo(19 - ripple, 19); c.stroke();
      });
    }
  }
  // Each card connects to a real water tile near its side of the city.
  const panels = [
    { id: 'wave-grid', name: '网格波次传递', englishName: 'Grid Wave Propagation', kind: 'action',
      center: [302.5, 522.5, 14], gridCenter: [5.5, 9.5], start: 1.80, actionStart: 1.99,
      color: '#92ffdc', source: ROOT + 'catalog/effects/history-patterns.js',
      relationship: '35个圆点按到左上触发点的空间距离延迟响应，放大后回落。' },
    { id: 'claude-orbits-illustration', name: '多轨圆点环绕', englishName: 'Multi Orbit Dots', kind: 'illustration',
      center: [574.75, 151.25, 14], gridCenter: [10.45, 2.75], start: 1.98, actionStart: 2.12,
      color: '#ffd08a', source: ROOT + 'catalog/effects/claude-tile-illustrations.js',
      relationship: '保留五道椭圆与五个沿轨圆点；角速度按2.2/i递减，外轨比内轨慢。' },
    { id: 'radial-branch-flow', name: '涟漪扩散连线分流', englishName: 'Radial Branch Flow', kind: 'composition',
      center: [574.75, 250.25, 14], gridCenter: [10.45, 4.55], start: 2.16, actionStart: 2.26,
      color: '#ffb398', source: ROOT + 'catalog/effects/radial-branch-flow.js',
      relationship: '同心涟漪、三条二次曲线枝干、沿线光点和抵达后显卡共用同一几何。' }
  ];
  const metadata = Object.freeze({
    registry: ROOT + 'catalog/registry.json', verifiedOn: '2026-10-04', total: Object.values(catalogCounts).reduce((a,b)=>a+b,0),
    counts: Object.freeze(catalogCounts),
    categories: Object.fromEntries(Object.entries(catalogCounts).map(([kind,count]) => [kind,{count}])),
    distributions: catalogDistributions,
    countingMethod: '按当前registry.json的effects数组统计kind，再按category首次出现顺序分组；不计重定向。',
    adaptation: '当前作品内的水面投映版；保留所选目录项的轨迹与动作关系。统一缩放、配色与1.6倍时钟；完整目录资产不改动。',
    panels, cells: Object.freeze(cells), effects: Object.freeze(effects), start: START, wavePeriod: PERIOD,
    contentPeriod: PERIOD, origins, profiles, cellSize: 55
  });
  window.OpusWaterGallery = Object.freeze({ render, stateAt, waterHeight, isWater, metadata });
})();

/* Scene 02. All model surfaces are projected from code-built solid geometry.
   Reference frames and video belong only to the comparison player. */
(function () {
  'use strict';
  const W = 1066, H = 600, S = 55, PI = Math.PI;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, p) => a + (b - a) * p;
  const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const phase = (t, a, b) => smooth((t - a) / (b - a));
  const random = n => { const q = Math.sin(n * 127.1 + 43.7) * 43758.5453123; return q - Math.floor(q); };
  const rgbCache = new Map();
  function rgb(hex) { if (!rgbCache.has(hex)) rgbCache.set(hex, [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))); return rgbCache.get(hex); }
  function colorMix(a, b, p) { return '#' + rgb(a).map((v, i) => Math.round(mix(v, rgb(b)[i], p)).toString(16).padStart(2, '0')).join(''); }
  // Thousands of coplanar faces share the same light/color pair. Keep only the
  // current frame's resolved colors, without changing any rounding or paint order.
  const shadeCache = new Map();
  function shade(hex, k) {
    let levels = shadeCache.get(hex);
    if (!levels) shadeCache.set(hex, levels = new Map());
    if (!levels.has(k)) levels.set(k, 'rgb(' + rgb(hex).map(v => Math.round(clamp(v * k, 0, 255))).join(',') + ')');
    return levels.get(k);
  }
  // Keep the elevation and diagonal view throughout the composition.
  const SIN_PITCH = 1 / Math.sqrt(3), COS_PITCH = Math.sqrt(2 / 3);
  const LIGHT = [-.30, -.42, .856];
  let camera, cameraBasis, faces, faceCount, vertexCount, lit, palette, now, waterHeights, surfaceLayer = 0;
  let geometryCapture = null;
  const geometryCaches = [];
  // Each primitive call keeps just its latest model. Once growth has settled,
  // retain its exact world vertices/light values and only reproject for the live
  // camera. Moving water and palms still rebuild whenever their inputs change.
  function cachedGeometry(build) {
    const cache = {cursor:0, entries:[]}; geometryCaches.push(cache);
    return function (...args) {
      const index = cache.cursor++, previous = cache.entries[index];
      if (args.some(value => typeof value === 'function')) { cache.entries[index] = undefined; return build(...args); }
      if (previous && args.length === previous.args.length && args.every((value, i) => value === previous.args[i])) {
        for (const shape of previous.shapes) {
          if (shape.line) emitStroke(shape.v, shape.color, shape.width, shape.glow, shape.bias);
          else emitFace(shape.v, shape.color, shape.brightness, shape.normal, shape.options);
        }
        return;
      }
      const capture = [], outer = geometryCapture; geometryCapture = capture;
      try { build(...args); } finally { geometryCapture = outer; }
      cache.entries[index] = {args, shapes:capture};
    };
  }
  function beginGeometry() { for (const cache of geometryCaches) cache.cursor = 0; }
  function endGeometry() { for (const cache of geometryCaches) cache.entries.length = cache.cursor; }
  // WiseMotion: the ground settles first, districts respond outward, the landmark
  // accumulates terraces, then live systems hand the focus to their data cards.
  const THEME = { sand: '#e5c7a0', cream: '#fff0d8', coral: '#e57f61', teal: '#4aa99b', ink: '#255c60', water: '#61c8bf', green: '#85aa6a' };
  const materialCache = new Map();
  const material = hex => { if (!materialCache.has(hex)) materialCache.set(hex, colorMix('#e8e5dd', hex, palette)); return materialCache.get(hex); };
  const districtPhase = (t, i, j) => phase(t, .85 + Math.hypot(i - 5.5, j - 5.5) * .025, 1.13 + Math.hypot(i - 5.5, j - 5.5) * .025);
  function interpolate(t, keys) {
    if (t <= keys[0][0]) return keys[0].slice(1);
    for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) {
      const p = phase(t, keys[i - 1][0], keys[i][0]);
      return keys[i].slice(1).map((v, j) => mix(keys[i - 1][j + 1], v, p));
    }
    return keys.at(-1).slice(1);
  }
  function cameraAt(t) {
    // Overlapping moves keep the camera flowing through growth; each move has
    // zero velocity and acceleration at its ends, including the final hold.
    const move = (a, b) => { const p = clamp((t - a) / (b - a)); return p * p * p * (10 + p * (-15 + p * 6)); };
    const opening = move(0, .26), unfold = move(.24, .92);
    const growth = move(.86, 2.05), gallery = move(1.80, 2.37), ending = handoffAt(t);
    return {
      x: mix(mix(533 + 26 * unfold - 72 * growth, 533, gallery), 533, ending),
      y: mix(mix(322 - 44 * unfold + 46 * growth, 250, gallery), 190, ending),
      scale: mix(mix(1.10 + .35 * opening - .50 * unfold + .13 * growth, .75, gallery), .56, ending),
      yaw: PI / 4
    };
  }
  function basisAt(pose) {
    const yaw = pose.yaw ?? PI / 4, sin = Math.sin(yaw), cos = Math.cos(yaw);
    return {sin, cos, view:[sin * COS_PITCH, cos * COS_PITCH, SIN_PITCH]};
  }
  function setCamera(pose) { camera = pose; cameraBasis = basisAt(pose); }
  function projectWith(v, pose, basis) {
    const x = v[0] - 6 * S, y = v[1] - 6 * S;
    return [pose.x + (x * basis.cos - y * basis.sin) * pose.scale,
      pose.y + ((x * basis.sin + y * basis.cos) * SIN_PITCH - v[2] * COS_PITCH) * pose.scale];
  }
  function project(v) { return projectWith(v, camera, cameraBasis); }
  function projectAt(v, t) { const pose = cameraAt(t); return projectWith(v, pose, basisAt(pose)); }
  function depth(v) { return v[0] * cameraBasis.view[0] + v[1] * cameraBasis.view[1] + v[2] * cameraBasis.view[2]; }
  function normal(v) {
    const a = v[0];
    for (let k = 1; k < v.length - 1; k++) {
      const b = v[k], c = v[k + 1];
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
      const wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2];
      const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      const len = Math.hypot(nx, ny, nz);
      if (len > .00001) return [nx / len, ny / len, nz / len];
    }
    return null;
  }
  function emitFace(v, color, brightness, n, options) {
    if (n[0] * cameraBasis.view[0] + n[1] * cameraBasis.view[1] + n[2] * cameraBasis.view[2] < .001) return;
    const p = new Array(v.length);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < v.length; i++) {
      const point = p[i] = project(v[i]);
      minX = Math.min(minX, point[0]); maxX = Math.max(maxX, point[0]);
      minY = Math.min(minY, point[1]); maxY = Math.max(maxY, point[1]);
    }
    if (maxX < -25 || minX > W + 25 || maxY < -60 || minY > H + 40) return;
    const totalDepth = v.reduce((sum, point) => sum + depth(point), 0) / v.length + (options.bias || 0);
    faces.push({ p, color, brightness, layer: surfaceLayer, depth: totalDepth, ...options });
    faceCount++; vertexCount += v.length;
  }
  function face(v, color, options = {}) {
    const n = normal(v); if (!n) return;
    const sunlight = Math.max(0, ((0 + n[0] * LIGHT[0]) + n[1] * LIGHT[1]) + n[2] * LIGHT[2]);
    const brightness = options.emissive ? 1 : .69 + sunlight * .34 + .045 * (n[1] - n[0]);
    // Cache all world faces. Visibility and painter order belong to the live
    // viewing direction, so a turn or a backwards seek cannot reuse old culling.
    if (geometryCapture) geometryCapture.push({v,color,brightness,normal:n,options});
    emitFace(v, color, brightness, n, options);
  }
  function emitStroke(v, color, width, glow, bias) {
    const totalDepth = v.reduce((sum, point) => sum + depth(point), 0) / v.length + bias;
    faces.push({ p: v.map(project), color, width, glow, line: true, layer: surfaceLayer, depth: totalDepth });
  }
  function stroke(v, color, width = 1, glow = 0, bias = .2) {
    if (geometryCapture) geometryCapture.push({v,color,width,glow,line:true,bias});
    emitStroke(v, color, width, glow, bias);
  }
  function surfaceArt(center, paint) {
    const p = project(center), u = project([center[0] + 1, center[1], center[2]]), v = project([center[0], center[1] + 1, center[2]]);
    faces.push({ paint, matrix: [u[0] - p[0], u[1] - p[1], v[0] - p[0], v[1] - p[1], ...p],
      layer: surfaceLayer, depth: depth(center) });
    faceCount++; vertexCount += 3;
  }
  function octagon(x, y, w, d, r, z) {
    r = Math.min(r, w / 3, d / 3);
    return [[x + r, y, z], [x + w - r, y, z], [x + w, y + r, z], [x + w, y + d - r, z], [x + w - r, y + d, z], [x + r, y + d, z], [x, y + d - r, z], [x, y + r, z]];
  }
  function box(x, y, z, w, d, h, color, bevel = 1.6, corner = 3, transform) {
    if (h < .06 || w < .06 || d < .06) return;
    const b = Math.min(bevel, h / 3, w / 5, d / 5), r = Math.max(corner, b);
    const rings = [octagon(x + b, y + b, w - b * 2, d - b * 2, Math.max(.3, r - b), z),
      octagon(x, y, w, d, r, z + b), octagon(x, y, w, d, r, z + h - b),
      octagon(x + b, y + b, w - b * 2, d - b * 2, Math.max(.3, r - b), z + h)];
    if (transform) for (const ring of rings) for (let k = 0; k < ring.length; k++) ring[k] = transform(ring[k]);
    for (let j = 0; j < 3; j++) for (let k = 0; k < 8; k++) {
      const next = (k + 1) % 8;
      face([rings[j][k], rings[j][next], rings[j + 1][next], rings[j + 1][k]], color, { edge: j === 2 });
    }
    face(rings[3], color, { top: true });
    face(rings[0].slice().reverse(), color, { bottom: true });
  }
  function block(x, y, z, w, d, h, color) {
    if (h < .06 || w < .06 || d < .06) return;
    const lo = [[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]], hi = lo.map(v => [v[0],v[1],z+h]);
    for (let k = 0; k < 4; k++) { const j = (k+1)%4; face([lo[k],lo[j],hi[j],hi[k]],color); }
    face(hi,color,{top:true}); face(lo.slice().reverse(),color,{bottom:true});
  }
  function cylinder(x, y, z, h, radius, color, topColor = color, topRadius = radius, emissive = false, cap = true) {
    if (h < .06) return;
    const n = 20, bottom = [], top = [];
    for (let i = 0; i < n; i++) { const a = i / n * PI * 2; bottom.push([x + Math.cos(a) * radius, y + Math.sin(a) * radius, z]); top.push([x + Math.cos(a) * topRadius, y + Math.sin(a) * topRadius, z + h]); }
    const steps = Math.max(1, Math.ceil(h / 10));
    for (let k = 0; k < steps; k++) for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, a = k / steps, b = (k + 1) / steps;
      const at = (u, q) => bottom[u].map((v, axis) => mix(v, top[u][axis], q));
      face([at(i, a), at(j, a), at(j, b), at(i, b)], color, { emissive });
    }
    if (cap) face(top, topColor, { top: true, emissive });
  }
  // Unit mesh coordinates are independent of position, size, time and camera.
  // Cache only the few mesh resolutions used by this scene, not rendered frames.
  const sphereMeshes = new Map(), domeMeshes = new Map();
  function sphere(x, y, z, rx, ry, rz, color, count = 8, rings = 4) {
    const key = count + ':' + rings;
    let mesh = sphereMeshes.get(key);
    if (!mesh) {
      mesh = Array.from({length:rings + 1}, (_, j) => Array.from({length:count + 1}, (_, i) => {
        const a = i / count * PI * 2, b = -.5 * PI + j / rings * PI;
        return [Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b)];
      }));
      sphereMeshes.set(key, mesh);
    }
    const points = mesh.map(row => row.map(v => [x + v[0] * rx, y + v[1] * ry, z + v[2] * rz]));
    for (let j = 0; j < rings; j++) for (let i = 0; i < count; i++) face([points[j][i], points[j][i + 1], points[j + 1][i + 1], points[j + 1][i]], color, { soft: true });
  }
  function dome(x, y, z, r, h, color) {
    const n = 20, rings = 5;
    let mesh = domeMeshes.get(n);
    if (!mesh) {
      mesh = Array.from({length:rings + 1}, (_, j) => Array.from({length:n + 1}, (_, i) => {
        const a = i / n * PI * 2, b = j / rings * PI * .5;
        return [Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b)];
      }));
      domeMeshes.set(n, mesh);
    }
    const points = mesh.map(row => row.map(v => [x + v[0] * r, y + v[1] * r, z + v[2] * h]));
    for (let j = 0; j < rings; j++) for (let i = 0; i < n; i++) face([points[j][i], points[j][i + 1], points[j + 1][i + 1], points[j + 1][i]], color);
  }
  function groundShadow(c, x, y, rx, ry, opacity) {
    c.save(); c.translate(x, y); c.scale(rx, ry);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, `rgba(102,71,47,${opacity})`); g.addColorStop(1, 'rgba(102,71,47,0)'); c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore();
  }
  function castShadow(x, y, w, d, h, opacity = .11) {
    const reach = Math.min(h * .34, 68), z = 12.2;
    face([[x, y, z], [x + w, y, z], [x + w + reach * .5, y + d + reach, z], [x + reach * .5, y + d + reach, z]], '#785542', { alpha: opacity, emissive: true, bias: -.1 });
  }
  function tileType(i, j) {
    if (i === 2 && (j === 9 || j === 10)) return 'plaza';
    if (i >= 5 && i <= 6 && j >= 5 && j <= 6) return 'core';
    if (((i === 3 || i === 8) && j >= 3 && j <= 8) || ((j === 3 || j === 8) && i >= 3 && i <= 8)) return 'road';
    if ((i >= 9 && j <= 5) || (i === 9 && j >= 6 && j <= 9) || (j === 9 && i >= 5 && i <= 8)) return 'water';
    if (i <= 2 && (j <= 3 || j >= 8)) return 'terrace';
    if ((i >= 10 && j >= 6 && j <= 9) || (i >= 5 && i <= 8 && j >= 10)) return 'garden';
    return 'sand';
  }
  function tilePose(t, i, j) {
    const dist = Math.max(Math.abs(i - 5.5), Math.abs(j - 5.5));
    const core = dist < 1;
    // Each outer ring flips as one short wave, after the previous ring has landed.
    const ringStart = [.267, .367, .450, .550, .617][Math.max(0, Math.round(dist - 1.5))];
    const start = core ? .105 : ringStart + random(i * 12 + j) * .003;
    const frame = t * 60 + 319, lag = core ? (i === 6 && j === 6 ? 0 : i === 5 && j === 6 ? .25 : .4) : 0;
    const p = core ? interpolate(frame - lag, [[325.3,0],[330,.08],[333,.30],[334,.45],[335,.95],[336,1]])[0] : phase(t, start, start + (dist <= 1.5 ? .09 : .12));
    return { p, start, core, dist, lag };
  }
  function ground(t, land = true, water = true) {
    const slab = phase(t, .750, .800), extent = 12 * S, tileBottom = -8;
    surfaceLayer = -2;
    if (land && slab > .001) {
      // These layers have shared extents: cream rim / sandstone side / terracotta solid underside.
      box(-3, -3, tileBottom - 69 * slab, extent + 6, extent + 6, 33 * slab, '#b4805b', 3, 6);
      box(-3, -3, tileBottom - 36 * slab, extent + 6, extent + 6, 24 * slab, '#d1a77c', 2, 6);
      box(-3, -3, tileBottom - 12 * slab, extent + 6, extent + 6, 12 * slab, '#f6e2c5', 1.2, 6);
      for (const f of faces) f.brightness = .86 + .18 * (f.brightness - .69) / .336;
      box(0, 0, tileBottom - .2, extent, extent, .2, '#88765b', .05, 2);
    }
    surfaceLayer = -1;
    if (land && t < .81) {
      const alpha = (1 - phase(t, .54, .84)) * .75;
      const cells = interpolate(t * 60 + 319, [[319,2],[331,2],[333,4],[335,6],[339,8],[345,10],[351,12]])[0];
      const spacing = 62, half = Math.max(92, cells * spacing / 2), center = 6 * S;
      const gridPlateStart = faces.length;
      box(center - half, center - half, -5, half * 2, half * 2, 5, '#fffaff', 1.5, 5);
      for (let f = gridPlateStart; f < faces.length; f++) faces[f].alpha = .16 * (1 - phase(t, .4, .64));
      for (let k = -Math.ceil(cells / 2); k <= Math.ceil(cells / 2); k++) {
        const lineAlpha = alpha * clamp(cells / 2 - Math.abs(k) + 1);
        stroke([[center + k * spacing, center - half, .1], [center + k * spacing, center + half, .1]], `rgba(91,236,224,${lineAlpha})`, 1);
        stroke([[center - half, center + k * spacing, .1], [center + half, center + k * spacing, .1]], `rgba(91,236,224,${lineAlpha})`, 1);
      }
    }
    surfaceLayer = 0;
    let count = 0;
    for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) {
      if (tileType(i, j) === 'water' ? !water : !land) continue;
      const v = tilePose(t, i, j); if (t < v.start) continue; count++;
      const type = tileType(i, j), target = type === 'core' ? THEME.ink : type === 'road' ? '#567978' : type === 'water' ? THEME.water : type === 'garden' ? ((i + j) % 2 ? '#9fbd83' : '#86ac78') : ((i + j) % 3 ? '#e6cba6' : '#efdab7');
      const color = type === 'core' ? target : material(target);
      const x = i * S + .7, y = j * S + .7, size = S - 1.4;
      let transform;
      if (v.p < .999 || (v.core && t * 60 + 319 < 339 + v.lag)) {
        const axisX = Math.abs(i - 5.5) >= Math.abs(j - 5.5), dir = axisX ? Math.sign(i - 5.5) || 1 : Math.sign(j - 5.5) || 1;
        const angle = (1 - v.p) * dir * (v.core ? 1.45 : 1.65), pivotX = (i + (dir > 0 ? 0 : 1)) * S, pivotY = (j + (dir > 0 ? 0 : 1)) * S;
        const lift = v.core ? interpolate(t * 60 + 319 - v.lag, [[325.3,126],[330,87],[333,100],[334,84],[335,15],[336,-5],[337,4],[338,0]])[0] : (1 - v.p) * (v.dist <= 1.5 ? 150 : 55) + Math.sin(v.p * PI) * 11;
        transform = q => {
          const z = q[2] - 3;
          if (v.core) {
            const ux = Math.sign(i - 5.5) / Math.sqrt(2), uy = Math.sign(j - 5.5) / Math.sqrt(2), dx = q[0] - 6 * S, dy = q[1] - 6 * S;
            const radial = dx * ux + dy * uy, across = -dx * uy + dy * ux, fold = (1 - v.p) * mix(1.25, .95, phase(t * 60 + 319, 331, 333));
            const r = radial * Math.cos(fold) - z * Math.sin(fold);
            return [6 * S + ux * r - uy * across, 6 * S + uy * r + ux * across, 3 + lift + radial * Math.sin(fold) + z * Math.cos(fold)];
          }
          if (axisX) { const a = q[0] - pivotX; return [pivotX + a * Math.cos(angle) - z * Math.sin(angle), q[1], 3 + lift + a * Math.sin(angle) + z * Math.cos(angle)]; }
          const a = q[1] - pivotY; return [q[0], pivotY + a * Math.cos(angle) - z * Math.sin(angle), 3 + lift + a * Math.sin(angle) + z * Math.cos(angle)];
        };
      }
      const tileFaceStart = faces.length;
      const tileTop = type === 'water' ? window.OpusWaterGallery.waterHeight(t, i, j) : 12;
      const tileHeight = type === 'core' ? 18 : type === 'water' ? tileTop + 8 : 20;
      if (type === 'water') waterHeights.push({ i, j, top: tileTop, bottom: tileTop - tileHeight });
      box(x, y, tileTop - tileHeight, size, size, tileHeight, color, .9, 2.8, transform);
      for (let f = tileFaceStart; f < faces.length; f++) { faces[f].tile = true; if (type === 'water') faces[f].layer = .70; }
      const coreOutlineFrame = i === 6 && j === 6 ? 336 : i === 5 && j === 6 ? 337 : 338;
      if (type === 'core' && t * 60 + 319 >= coreOutlineFrame - 1e-7 && t * 60 + 319 < 338 - 1e-7 && v.p > .75) {
        const z = 12.3; const outline = [[x + 2, y + 2, z], [x + size - 2, y + 2, z], [x + size - 2, y + size - 2, z], [x + 2, y + size - 2, z], [x + 2, y + 2, z]];
        surfaceLayer = .5; stroke(transform ? outline.map(transform) : outline, '#abfff1', 1.8, 3); surfaceLayer = 0;
      }
      if (type === 'road' && t > .84) {
        const marks = palette > .01 ? '#fff3d5' : '#faf5fd', z = 12.35;
        if (i === 3 || i === 8) face([[x + 24, y + 17, z], [x + 27, y + 17, z], [x + 27, y + 34, z], [x + 24, y + 34, z]], marks, { emissive: true, bias: .4 });
        else face([[x + 17, y + 24, z], [x + 34, y + 24, z], [x + 34, y + 27, z], [x + 17, y + 27, z]], marks, { emissive: true, bias: .4 });
      }
      if (type === 'water' && t > .88) {
        surfaceLayer = .70;
        const wave = Math.sin(t * 2 + i + j) * 3, waterZ = tileTop + .10;
        stroke([[x + 9 + wave, y + 18, waterZ], [x + 31 + wave, y + 18, waterZ]], material('#d3fff1'), .8);
        stroke([[x + 21 - wave, y + 34, waterZ], [x + 42 - wave, y + 34, waterZ]], material('#a3ede1'), .6);
        surfaceLayer = 0;
      }
    }
    return count;
  }
  function prism(x, y, z, h, rx, ry, n, color, topColor = color, topRatio = 1) {
    if (h < .06) return;
    const ring = (height, ratio) => Array.from({ length: n }, (_, k) => {
      const a = k / n * PI * 2 + PI / n;
      return [x + Math.cos(a) * rx * ratio, y + Math.sin(a) * ry * ratio, height];
    });
    const steps = Math.max(1, Math.ceil(h / 14));
    for (let k = 0; k < steps; k++) {
      const p = k / steps, q = (k + 1) / steps;
      const lo = ring(z + h * p, mix(1, topRatio, p)), hi = ring(z + h * q, mix(1, topRatio, q));
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; face([lo[i], lo[j], hi[j], hi[i]], color); }
    }
    face(ring(z + h, topRatio), topColor, { top: true });
  }
  function palm(x, y, z, p, size = 1, seed = 0) {
    if (p < .01) return;
    const h = 44 * p * size, direction = seed * .71 + .35;
    const lean = (4.5 + random(seed + 18) * 3.5) * p * size;
    const wind = Math.sin(now * 2.0 + seed * .31) * 1.15 * p * size;
    const center = q => [x + Math.cos(direction) * lean * q * q + wind * q * q,
      y + Math.sin(direction) * lean * q * q + wind * .4 * q * q, z + h * q];
    const radius = q => (2.15 - .90 * q) * size * Math.min(1, p * 4);
    const ring = q => Array.from({ length: 6 }, (_, k) => {
      const a = k / 6 * PI * 2 + PI / 6, v = center(q), r = radius(q);
      return [v[0] + Math.cos(a) * r, v[1] + Math.sin(a) * r, v[2]];
    });
    // Four tapered sections give the trunk a bend without a dense cylinder mesh.
    for (let j = 0; j < 4; j++) {
      const lo = ring(j / 4), hi = ring((j + 1) / 4);
      for (let k = 0; k < 6; k++) { const n = (k + 1) % 6; face([lo[k], lo[n], hi[n], hi[k]], material(k % 2 ? '#b78a5b' : '#c19a68')); }
    }
    face(ring(1), material('#698663'));
    for (const q of [.20, .40, .60, .80]) {
      const v = center(q), r = radius(q) + .08;
      stroke(Array.from({ length: 7 }, (_, k) => { const a = -PI / 4 + PI * k / 6; return [v[0] + Math.cos(a) * r, v[1] + Math.sin(a) * r, v[2]]; }), material('#94744f'), .45 * size);
    }
    const crown = center(1);
    function frond(angle, length, rise, droop, width, segments, young = false) {
      const ux = Math.cos(angle), uy = Math.sin(angle), dx = -uy, dy = ux;
      const curve = q => {
        const side = Math.sin(q * PI) * wind * 1.6;
        return [crown[0] + ux * length * q + dx * side, crown[1] + uy * length * q + dy * side,
          crown[2] + rise * Math.sin(q * PI * .85) - droop * q * q];
      };
      const edge = (q, sign) => { const v = curve(q), w = width * Math.sin(q * PI) ** .7; return [v[0] + dx * w * sign, v[1] + dy * w * sign, v[2] - w * .18]; };
      for (let k = 0; k < segments; k++) {
        const a = k / segments, b = (k + 1) / segments;
        const blade = [edge(a, -1), edge(b, -1), edge(b, 1), edge(a, 1)];
        face(blade, material(young ? '#b3c989' : k % 2 ? '#8dad75' : '#7da470'));
        face(blade.slice().reverse(), material('#537e61'));
      }
      stroke(Array.from({ length: segments + 1 }, (_, k) => curve(k / segments)), material(young ? '#d0dba0' : '#afc68a'), .42 * size);
      if (!young) for (const q of [.25, .43, .61, .78]) {
        const a = curve(q - .08), b = edge(q, -1), d = edge(q, 1);
        stroke([b, a, d], material('#abc584'), .25 * size);
      }
    }
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * PI * 2 + seed * .45, variation = random(seed * 11 + k * 7);
      frond(a, (23 + variation * 6) * p * size, (10 + variation * 3) * p * size,
        (12 + variation * 5) * p * size, (2.7 + variation * .8) * p * size, 4);
    }
    // Two younger upright leaves fill the crown instead of leaving a star-shaped hub.
    for (let k = 0; k < 2; k++) frond(direction + k * 2.1, 10 * p * size, 16 * p * size, -3 * p * size, 1.6 * p * size, 2, true);
  }
  function shrub(x, y, z, p, color = THEME.green, size = 6) {
    if (p < .01) return;
    sphere(x, y, z + size * .7 * p, size * p, size * p, size * .85 * p, material(color), 6, size <= 5 ? 2 : 3);
  }
  function planter(x, y, z, w, d, p, color = THEME.green) {
    if (p < .01) return;
    block(x, y, z, w, d, 3 * p, material('#f5dbb7'), .5, 1.5);
    block(x + 1, y + 1, z + 3 * p, w - 2, d - 2, 2 * p, material(color), .4, 1.1);
  }
  function terrain(t) {
    surfaceLayer = .75;
    for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) {
      const type = tileType(i, j), x = i * S, y = j * S, p = districtPhase(t, i, j), seed = i * 12 + j;
      if (p < .01 || type === 'core' || type === 'road' || type === 'plaza') continue;
      if (type === 'terrace') {
        const height = 5 + ((i + j) % 3) * 4;
        box(x + 4, y + 4, 12, S - 8, S - 8, height * p, material('#d4aa7c'), .9, 3.5);
        block(x + 7, y + 7, 12 + height * p, S - 14, S - 14, 2 * p, material('#f2dcb3'), .4, 3);
        const z = 12 + (height + 2) * p;
        if ((i + j) % 2 === 0) {
          planter(x + 13, y + 14, z, 24, 21, p, '#9bb17a');
          if (seed % 3 === 0) palm(x + 26, y + 25, z + 5 * p, p, .65, seed);
        } else {
          for (let k = 0; k < 3; k++) block(x + 9, y + 44 - k * 5, 12, 29, 4, (3 + k * 3) * p, material('#e9c89c'), .35, .5);
          prism(x + 31, y + 23, z, 7 * p, 8, 6, 6, material('#cda16f'), material('#efcfa2'), .72);
        }
      } else if (type === 'garden') {
        if (i === 10 && j === 7) {
          block(x + 4, y + 24, 12, 47, 27, 1.5 * p, material('#f1d8b1'));
          planter(x + 9, y + 7, 12, 37, 9, p, '#83a775');
          continue;
        }
        const alongX = j >= 10;
        for (let k = 0; k < 3; k++) {
          const xx = x + 7 + (alongX ? k * 14 : 0), yy = y + 7 + (alongX ? 0 : k * 14);
          planter(xx, yy, 12, alongX ? 10 : 40, alongX ? 40 : 10, p, k === 1 ? '#b7c786' : '#69977b');
          for (let a = 0; a < 3; a++) shrub(xx + 5 + (alongX ? 0 : a * 12), yy + 5 + (alongX ? a * 12 : 0), 17 * p + 12 * (1 - p), p, (seed + k + a) % 3 ? '#a4bf80' : '#e49b70', 3.8);
        }
      } else if (type === 'water') {
        const waterTop = window.OpusWaterGallery.waterHeight(t, i, j);
        if ((i === 9 && j >= 6) || (j === 9 && i < 9)) {
          if (i === 9) { block(x + 1, y + 1, 7, 4, 53, 5 * p, material('#eed5af'), .3, .7); block(x + 50, y + 1, 7, 4, 53, 5 * p, material('#eed5af'), .3, .7); }
          else { block(x + 1, y + 1, 7, 53, 4, 5 * p, material('#eed5af'), .3, .7); block(x + 1, y + 50, 7, 53, 4, 5 * p, material('#eed5af'), .3, .7); }
        }
        if ((i + j) % 4 === 0) {
          cylinder(x + 34, y + 23, waterTop + .7, .7, 5.2 * p, material('#79aa79'));
          shrub(x + 34, y + 23, waterTop + 1.2, p, '#f3ae87', 2.3);
        }
      } else if ((i <= 2 && j >= 4 && j <= 7) || (i >= 3 && i <= 8 && j >= 4 && j <= 7)) {
        // Functional districts remain clear for their buildings and solar pergola.
        continue;
      } else {
        if ((i + j) % 3 === 0) {
          block(x + 8, y + 9, 12, 36, 36, 1.5 * p, material('#f6e3c6'), .3, 2);
          for (let k = 0; k < 3; k++) stroke([[x + 12, y + 15 + k * 10, 13.7], [x + 40, y + 15 + k * 10, 13.7]], material('#bba485'), .45);
          palm(x + 27, y + 28, 12 + 1.5 * p, p, .78, seed);
        } else if ((i + j) % 3 === 1) {
          planter(x + 10, y + 11, 12, 34, 32, p, '#a4b77c');
          shrub(x + 22, y + 23, 12 + 5 * p, p, '#7c9f70', 8);
          shrub(x + 35, y + 31, 12 + 5 * p, p, '#d89d76', 5);
        } else {
          for (let k = 0; k < 3; k++) block(x + 11 + k * 10, y + 15, 12, 6, 27, 1.8 * p, material('#d7b58c'), .3, .6);
        }
      }
    }
    // The curved deck spans the sunken canal; railings follow the same solid path.
    const p = phase(t, 1.16, 1.53), xa = 8.78 * S, xb = 10.35 * S, y = 7.56 * S, width = 20;
    if (p > .01) for (let k = 0; k < 12; k++) {
      const a = k / 12, b = (k + 1) / 12, x0 = mix(xa, xb, a), x1 = mix(xa, xb, b), z0 = 12 + Math.sin(a * PI) * 20 * p, z1 = 12 + Math.sin(b * PI) * 20 * p;
      face([[x0, y, z0], [x1, y, z1], [x1, y + width, z1], [x0, y + width, z0]], material('#f6ddba'));
      face([[x0, y + width, z0 - 3 * p], [x1, y + width, z1 - 3 * p], [x1, y + width, z1], [x0, y + width, z0]].reverse(), material('#d5996c'));
      stroke([[x0, y, z0 + 9 * p], [x1, y, z1 + 9 * p]], material('#d68b63'), 1.1);
      stroke([[x0, y + width, z0 + 9 * p], [x1, y + width, z1 + 9 * p]], material('#d68b63'), 1.1);
      for (const yy of [y, y + width]) stroke([[x0, yy, z0], [x0, yy, z0 + 9 * p]], material('#a97c59'), .7);
      stroke([[x0, y + 1, z0 + .2], [x0, y + width - 1, z0 + .2]], material('#bc956e'), .5);
    }
    surfaceLayer = 1;
  }
  function facade(x, y, z, w, d, h, p, glass = THEME.ink) {
    const gap = 5, wh = Math.max(.1, h * .56);
    if (p < .04) return;
    const colors = material(glass);
    for (let k = 0; k < 3; k++) {
      const xx = x + gap + k * (w - gap * 2) / 3, ww = (w - gap * 2) / 3 - 3;
      face([[xx, y + d + .18, z + h * .2], [xx + ww, y + d + .18, z + h * .2], [xx + ww, y + d + .18, z + h * .2 + wh], [xx, y + d + .18, z + h * .2 + wh]].reverse(), colors, { bias: .45 });
      const yy = y + gap + k * (d - gap * 2) / 3, dd = (d - gap * 2) / 3 - 3;
      face([[x + w + .18, yy, z + h * .2], [x + w + .18, yy + dd, z + h * .2], [x + w + .18, yy + dd, z + h * .2 + wh], [x + w + .18, yy, z + h * .2 + wh]], colors, { bias: .45 });
    }
  }
  const buildings = [
    { i: 4.00, j: 4.02, w: 1.05, d: 1.04, h: 106, color: '#e8b17f', levels: 3, start: 1.06 },
    { i: 5.32, j: 3.99, w: .98, d: .81, h: 152, color: '#e69b75', levels: 4, start: 1.25 },
    { i: 6.48, j: 4.08, w: .86, d: .81, h: 124, color: '#78a99c', levels: 3, start: 1.32 },
    { i: 4.06, j: 6.27, w: .81, d: .94, h: 71, color: '#e6c284', levels: 2, start: 1.03 },
    { i: 4.12, j: 7.38, w: .91, d: .52, h: 36, color: '#c69b70', levels: 1, start: 1.10 },
    { i: 5.16, j: 7.18, w: .91, d: .67, h: 48, color: '#df8d69', levels: 2, start: 1.18 },
    { i: 7.14, j: 5.39, w: .67, d: .85, h: 92, color: '#5caaa0', levels: 3, start: 1.26 },
    { i: 7.09, j: 6.67, w: .77, d: .78, h: 58, color: '#e4b284', levels: 2, start: 1.19 }
  ];
  function building(b, t) {
    const p = phase(t, b.start, b.start + .40); if (p < .01) return;
    const x = b.i * S, y = b.j * S, w = b.w * S, d = b.d * S;
    castShadow(x, y, w, d, b.h * p, .10);
    let z = 12;
    for (let k = 0; k < b.levels; k++) {
      const q = phase(t, b.start + k * .09, b.start + .28 + k * .09), inset = k * 4.5, h = b.h / b.levels * q, ww = w - inset * 1.3, dd = d - inset * 1.4;
      if (h < .1) continue;
      const xx = x + inset * .3, yy = y + inset * .35;
      box(xx, yy, z, ww, dd, h, material(b.color), 1.3, 2.6);
      facade(xx, yy, z, ww, dd, h, q);
      box(xx - 2, yy - 2, z + h, ww + 4, dd + 4, 3 * q, material(THEME.cream), .6, 2);
      if (k < b.levels - 1) planter(xx + 3, yy + dd - 4, z + h + 3 * q, ww - 6, 3, q, '#8bb27a');
      else { planter(xx + 4, yy + 4, z + h + 3 * q, Math.max(8, ww - 8), Math.max(7, dd - 8), q); shrub(xx + ww * .5, yy + dd * .5, z + h + 8 * q, q, '#7ea775', 5); }
      z += h + 3 * q;
    }
  }
  function centralTower(t) {
    const x = 5.18 * S, y = 5.08 * S, start = 1.52;
    const p = phase(t, start, start + .45); if (p < .01) return;
    castShadow(x, y, 95, 96, 246 * p, .15);
    box(x - 4, y - 4, 12, 101, 98, 6 * p, material('#e7d4b5'), 1.2, 4);
    let z = 12 + 6 * p;
    for (let k = 0; k < 5; k++) {
      const q = phase(t, start + k * .09, start + .31 + k * .09), h = (k === 4 ? 43 : 46) * q, w = 94 - k * 12, d = 86 - k * 10, xx = x + k * 9, yy = y + k * 2;
      if (h < .1) continue;
      // Separate floor plates preserve the contact between growing tiers.
      for (let f = 0; f < 2; f++) {
        const levelZ = z + f * h / 2;
        box(xx, yy, levelZ, w, d, h / 2, material(k % 2 ? '#eb9b77' : THEME.coral), 1.5, 3);
        facade(xx, yy, levelZ, w, d, h / 2, q, '#386c68');
        box(xx - 3, yy - 3, levelZ + h / 2, w + 6, d + 6, 3 * q, material(THEME.cream), .5, 2.6);
      }
      // A broad planted ledge on every setback makes the silhouette a garden.
      planter(xx + 4, yy + d - 6, z + h + 3 * q, w - 8, 5, q, '#7baa73');
      for (let j = 0; j < 3; j++) shrub(xx + 12 + j * (w - 24) / 2, yy + d - 3.5, z + h + 8 * q, q, j % 2 ? '#adc888' : '#81a969', 2.7);
      z += h + 3 * q;
    }
    const roof = phase(t, 2.14, 2.29);
    if (roof > .01) {
      box(x + 40, y + 4, z, 42, 36, 5 * roof, material(THEME.ink), .8, 2);
      for (let k = 0; k < 5; k++) box(x + 38 + k * 11, y + 1, z + 11 * roof, 6, 43, 2.5 * roof, material(THEME.cream), .5, .8);
      for (const xx of [x + 40, x + 80]) box(xx, y + 4, z, 2.3, 36, 11 * roof, material('#dcc098'), .4, .5);
    }
  }
  function roundTower(t) {
    // The data conservatory is an octagonal lantern, replacing the old cylinder.
    const p = phase(t, 1.52, 2.05); if (p < .01) return;
    const x = 8.20 * S, y = 4.05 * S;
    castShadow(x - 38, y - 38, 76, 76, 172 * p, .12);
    prism(x, y, 12, 10 * p, 40, 40, 8, material('#d3b58d'), material(THEME.cream), .94);
    for (let k = 0; k < 5; k++) {
      const z = 22 + k * 29, ratio = 1 - k * .055;
      prism(x, y, 12 + (z - 12) * p, 24 * p, 35 * ratio, 35 * ratio, 8, material(k % 2 ? '#6cb5a7' : '#438984'), material('#b6d7ba'), .965);
      prism(x, y, 12 + (z + 24 - 12) * p, 5 * p, 37 * ratio, 37 * ratio, 8, material(THEME.cream), material('#f2ddb4'), .96);
      for (let a = 0; a < 8; a++) {
        const angle = a / 8 * PI * 2 + PI / 8, vx = Math.cos(angle) * 35 * ratio, vy = Math.sin(angle) * 35 * ratio;
        stroke([[x + vx, y + vy, 12 + (z - 12) * p], [x + vx * .965, y + vy * .965, 12 + (z + 24 - 12) * p]], material('#e3d4ae'), 1);
      }
    }
    prism(x, y, 12 + 155 * p, 23 * p, 28, 28, 8, material('#ca7f60'), material(THEME.cream), .18);
    cylinder(x, y, 12 + 178 * p, 7 * p, 2.2, material(THEME.ink));
  }
  function glasshouse(t) {
    const p = phase(t, 1.16, 1.59); if (p < .01) return;
    const x = 5.99 * S, y = 7.08 * S, w = 53, d = 39, base = 12;
    box(x - 3, y - 3, base, w + 6, d + 6, 5 * p, material(THEME.cream), .6, 2);
    const roof = (q, yy) => [x + q * w, yy, base + 5 * p + Math.sin(q * PI) * 39 * p];
    for (let k = 0; k < 12; k++) {
      const a = k / 12, b = (k + 1) / 12;
      face([roof(a, y), roof(b, y), roof(b, y + d), roof(a, y + d)], material(k % 3 ? '#a6d1b7' : '#d4e6c8'));
      const front = [[x + a * w, y + d, base + 5 * p], [x + b * w, y + d, base + 5 * p], roof(b, y + d), roof(a, y + d)];
      face(front.slice().reverse(), material('#8cbca5'));
      stroke([roof(a, y), roof(a, y + d)], material(THEME.cream), 1.1);
    }
    for (let yy = 0; yy <= 3; yy++) {
      const points = []; for (let k = 0; k <= 16; k++) points.push(roof(k / 16, y + d * yy / 3));
      stroke(points, material('#f9e4bc'), 1.4);
    }
  }
  function energyFlower(t, i, j, height, start) {
    const p = phase(t, start, start + .38); if (p < .01) return;
    const x = i * S, y = j * S, z = 12 + height * p;
    cylinder(x, y, 12, height * p, 2.7, material('#d5b48b'), material('#e7c599'), 1.8);
    prism(x, y, 12, 4 * p, 13, 13, 6, material(THEME.cream));
    const petals = phase(t, start + .14, start + .48);
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * PI * 2, ux = Math.cos(a), uy = Math.sin(a), dx = -uy, dy = ux, r = 38 * petals;
      const v = [[x + ux * 6 - dx * 5 * petals, y + uy * 6 - dy * 5 * petals, z], [x + ux * r - dx * 11 * petals, y + uy * r - dy * 11 * petals, z + 7 * petals], [x + ux * (r + 7 * petals), y + uy * (r + 7 * petals), z + 3 * petals], [x + ux * r + dx * 11 * petals, y + uy * r + dy * 11 * petals, z + 7 * petals], [x + ux * 6 + dx * 5 * petals, y + uy * 6 + dy * 5 * petals, z]];
      face(v, material('#397e7c')); face(v.slice().reverse(), material('#dec39a'));
      stroke(v.concat([v[0]]), material('#efc59c'), .8);
      stroke([[x + ux * 10, y + uy * 10, z + 2 * petals], [x + ux * (r + 3 * petals), y + uy * (r + 3 * petals), z + 5 * petals]], material('#76bdb2'), .75);
    }
    cylinder(x, y, z - 2 * p, 5 * p, 7 * petals, material(THEME.coral));
  }
  function infrastructure(t) {
    const p = phase(t, 1.01, 1.42); if (p < .01) return;
    // A low pergola opens the view instead of enclosing the city in a tall fence.
    const x = .5 * S, y = 4.03 * S, w = 86, d = 190, z = 12 + 33 * p;
    for (const xx of [x, x + w]) for (let k = 0; k < 4; k++) box(xx, y + k * d / 3, 12, 3, 3, 33 * p, material('#c49968'), .4, .5);
    for (let k = 0; k < 8; k++) {
      const yy = y + k * d / 8;
      box(x - 4, yy - 2, z, w + 10, 17, 3 * p, material('#487d79'), .5, 1.2);
      for (let j = 1; j < 4; j++) stroke([[x + j * w / 4, yy, z + 3.2], [x + j * w / 4, yy + 13, z + 3.2]], material('#87c6b7'), .65);
    }
    energyFlower(t, 8.41, .65, 115, 1.29);
    energyFlower(t, 4.0, .9, 89, 1.38);
    for (const [i, j] of [[2.50, 8.96], [2.50, 10.15], [7.50, 10.75], [10.80, 8.40]]) {
      const q = districtPhase(t, i, j); palm(i * S, j * S, 12, q, .94, i + j);
    }
    // Stepping stones and benches turn the commute marker into an actual plaza.
    for (let k = 0; k < 5; k++) box((2.10 + k * .15) * S, 9.3 * S, 12, 5, 30, 2 * p, material('#f5d8aa'), .4, .7);
    box(2.14 * S, 9.7 * S, 12, 30, 8, 6 * p, material(THEME.coral), .7, 1.2);
    if (lit > .001) {
      const points = [[3.5 * S, 3.5 * S, 13], [8.5 * S, 3.5 * S, 13], [8.5 * S, 8.5 * S, 13], [3.5 * S, 8.5 * S, 13], [3.5 * S, 3.5 * S, 13]];
      stroke(points, `rgba(162,244,213,${lit * .55})`, .9, 3 * lit);
      const travel = clamp((t - 2.01) / .56) * 4, edge = Math.min(3, Math.floor(travel)), q = travel - edge;
      const v = points[edge].map((a, axis) => mix(a, points[edge + 1][axis], q));
      sphere(v[0], v[1], 15, 2.4, 2.4, 2.4, '#f9edb9');
    }
  }
  function vehicles(t) {
    if (palette < .01) return;
    const p = (t - 2.38) * .62;
    box((3.43 + p) * S, 8.46 * S, 13, 20, 7, 6, THEME.coral, .8, 1.7);
    box((3.44 + p) * S, 8.46 * S + 1, 19, 12, 5, 2, THEME.cream, .4, 1);
    box(8.45 * S, (5.15 - p) * S, 13, 7, 14, 5, '#edc16f', .8, 1.2);
  }
  function drawFaces(c) {
    faces.sort((a, b) => a.layer - b.layer || a.depth - b.depth);
    c.lineJoin = 'round'; c.lineCap = 'round';
    for (const f of faces) {
      if (f.paint) { c.save(); c.transform(...f.matrix); f.paint(c); c.restore(); continue; }
      c.beginPath(); f.p.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p));
      if (f.line) {
        c.strokeStyle = f.color; c.lineWidth = f.width * camera.scale;
        if (f.glow) { c.shadowBlur = f.glow * camera.scale; c.shadowColor = f.color; }
        c.stroke(); c.shadowBlur = 0;
      } else {
        c.closePath(); c.globalAlpha = f.alpha ?? 1;
        if (f.soft) {
          const minY = Math.min(...f.p.map(p => p[1])), maxY = Math.max(...f.p.map(p => p[1]));
          const g = c.createLinearGradient(0, minY, 0, Math.max(minY + .1, maxY));
          g.addColorStop(0, shade(f.color, f.brightness * 1.03)); g.addColorStop(1, shade(f.color, f.brightness * .96)); c.fillStyle = g;
        } else c.fillStyle = shade(f.color, f.brightness);
        c.fill();
        if (f.tile && f.top) { c.strokeStyle = colorMix('#9d927e', '#a79777', palette); c.lineWidth = .45 * camera.scale; c.stroke(); }
        // Small overlapping edges remove subpixel cracks inside curved solids.
        if (f.soft) { c.strokeStyle = c.fillStyle; c.lineWidth = .35; c.stroke(); }
        c.globalAlpha = 1;
      }
    }
  }
  function cloud(c, x, y, s, opacity) {
    c.save(); c.globalAlpha = opacity; c.translate(x, y); c.scale(s, s);
    for (const [a, b, rx, ry] of [[-22, 3, 20, 15], [0, -7, 23, 22], [24, 6, 23, 15]]) {
      const g = c.createRadialGradient(a - 8, b - 9, 1, a, b, rx * 1.25); g.addColorStop(0, '#fff9e9'); g.addColorStop(1, '#e8d1af');
      c.beginPath(); c.ellipse(a, b, rx, ry, 0, 0, PI * 2); c.fillStyle = g; c.fill();
    }
    c.restore();
  }
  function label(c, s, x, y, size, color, weight = 400, align = 'left') {
    c.font = `${weight} ${size}px Arial, "PingFang SC", sans-serif`; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'alphabetic'; c.fillText(s, x, y);
  }
  function dataCards(c, t) {
    // Reading holds the city and cards; their departure follows the same
    // progress that shrinks the city and opens space for the supporting copy.
    const departure = handoffAt(t);
    const frame = t <= 2.7 ? t * 60 + 319 : 481 + 8 * departure;
    const cards = [
      { slope: -1 / Math.sqrt(3), kind: 'action', unit: '种', cn: '单个动作', en: 'ACTIONS', color: THEME.teal, panel: 0, route: 'near',
        layout: [[467,90.1,182.4,82.4,99.8],[468,86,180,157.4,100.2],[469,79.9,178.8,169,100.3],[472,64.2,176.3,148.6,101.1],[481,39.5,171.5,152.1,101.7],[484,37.5,171.2,152.1,101.7],[486,35.5,170.8,129.5,101.7],[487,34.5,170.5,107.7,101.7],[488,33.5,170.2,73,101.7],[489,32.5,170,0,101.7]],
        values: [[467,1],[468,5],[469,9],[470,10],[471,11],[472,12]], digits: 0 },
      { slope: 1 / Math.sqrt(3), kind: 'illustration', unit: '幅', cn: '插画单图', en: 'ILLUSTRATIONS', color: '#d4ab63', panel: 1,
        layout: [[461,870.8,72.9,53.8,98.9],[462,870.8,73.5,105.6,99.2],[463,868.7,73.1,144.5,99.2],[464,864.6,72.1,159.5,99.7],[465,862.3,71.5,161.5,99.7],[466,859.9,70.9,158.1,99.6],[467,855.1,69.4,147.9,100],[469,845.6,66.4,148.6,100.6],[481,816.9,57.6,151.3,102],[484,814.9,57.2,140.7,102],[485,813.9,57,125.6,102],[486,812.9,56.8,102.3,102],[487,811.9,56.5,64.8,102],[488,810.9,56.2,12.3,102],[489,809.9,56,0,102]],
        values: [[461,0],[462,17.6],[463,36.5],[464,65],[465,75.2],[466,83.1],[467,93.1],[468,97.5],[469,98.6]], digits: 0 },
      { slope: 1 / Math.sqrt(3), kind: 'composition', unit: '组', cn: '组合片段', en: 'SEQUENCES', color: THEME.coral, panel: 2,
        layout: [[472,867.3,266,147.9,100.6],[473,866,266,167.7,100.6],[474,863.9,265.5,173.2,100.6],[477,857.1,263.9,151.3,101.1],[481,849.6,262.2,153.4,101.4],[485,847.6,261.8,153.4,101.4],[486,846.6,261.6,141.8,101.4],[487,845.6,261.4,130.9,101.4],[488,844.6,261.2,111.8,101.4],[489,843.6,261,0,101.4]],
        values: [[472,.47],[473,.68],[474,.84],[475,.98],[476,1.08],[477,1.21],[478,1.24],[479,1.27],[480,1.28]], digits: 0 }
    ];
    for (const a of cards) {
      if (frame < a.layout[0][0] - 1e-7 || frame >= 489 - 1e-7) continue;
      const catalog = window.OpusWaterGallery.metadata, total = catalog.counts[a.kind];
      const growth = clamp(interpolate(frame, a.values)[0] / a.values.at(-1)[1]);
      const [x,y,w,h] = interpolate(frame, a.layout), value = total * growth, n = value.toFixed(0);
      const anchor = catalog.panels[a.panel].center, waterZ = window.OpusWaterGallery.waterHeight(t, Math.floor(anchor[0] / S), Math.floor(anchor[1] / S));
      const marker = project([anchor[0], anchor[1], waterZ + 1.1]), ring = [marker[0], marker[1] - 15];
      c.save(); c.globalAlpha = 1 - departure; c.strokeStyle = '#6b857d'; c.lineWidth = .85; c.beginPath();
      c.moveTo(a.route === 'near' ? x + w : x, y + h + (a.route === 'near' ? a.slope * w : 0));
      c.lineTo(...ring);
      c.lineTo(...marker); c.stroke();
      c.beginPath(); c.arc(...ring, 2.4, 0, PI * 2); c.fillStyle = '#fff8e8'; c.fill(); c.strokeStyle = '#708b82'; c.stroke();
      c.beginPath(); c.ellipse(...marker, 6.2, 2.9, 0, 0, PI * 2); c.fillStyle = a.color; c.fill(); c.strokeStyle = '#fffaed'; c.lineWidth = 1.2; c.stroke();
      c.translate(x, y); c.transform(w / 174, a.slope * w / 174, 0, h / 106, 0, 0);
      c.shadowColor = '#88614430'; c.shadowBlur = 7; c.shadowOffsetY = 5; c.beginPath(); c.roundRect(0, 0, 174, 106, 5); c.fillStyle = '#fffaf0'; c.fill(); c.shadowBlur = 0; c.shadowOffsetY = 0;
      c.fillStyle = a.color; c.fillRect(0, 5, 3, 92);
      label(c, a.cn, 13, 23, 13, '#2d4b47', 650); label(c, a.en, 13, 38, 8, '#778578');
      const distribution = catalog.distributions[a.kind], chartMax = Math.max(...distribution), gap = 67 / distribution.length;
      distribution.forEach((count, i) => { const height = count / chartMax * 20 * growth; c.fillStyle = colorMix('#f1e6d4', a.color, .40 + i / distribution.length * .45); c.fillRect(97 + i * gap, 34 - height, Math.max(2, gap - 2), height); });
      const size = n.length > 3 ? 42 : 48;
      label(c, n, 12, 88, size, '#234d48', 800); c.font = `800 ${size}px Arial`; const width = c.measureText(n).width;
      label(c, a.unit, 15 + width, 87, 15, '#49695b', 500); c.restore();
    }
  }
  function brandFrameAt(t) {
    const bottom = Math.max(...[[-3,-3,-77],[663,-3,-77],[663,663,-77],[-3,663,-77]].map(point => projectAt(point, t)[1]));
    const scale = Math.min(.70, Math.max(0, (H - 50 - bottom - 24) / (84 + 104 + 18 * .25)));
    return [scale, 0, 0, scale, cameraAt(t).x - 620 * scale / 2, bottom + 24 + 84 * scale];
  }
  function brand(c, t) {
    if (t <= HANDOFF_START) return;
    // The copy appears as the city shrinks, using only the space released below.
    c.save(); c.transform(...brandFrameAt(t));
    const word = 'MOTION OASIS'; let pen = 0; c.font = '900 84px Arial';
    const widths = [...word].map(letter => c.measureText(letter).width);
    const fit = Math.min(1, 620 / (widths.reduce((sum, width) => sum + width, 0) - 2 * (word.length - 1)));
    c.save(); c.scale(fit, 1);
    for (let i = 0; i < word.length; i++) {
      const p = handoffAt(t) * phase(t, HANDOFF_START + i * .010, HANDOFF_START + .10 + i * .010);
      c.save(); c.translate(pen, -(1 - p) * (64 + i * 2)); c.globalAlpha = p;
      for (let j = 12; j > 0; j--) label(c, word[i], -j * .36, j, 84, '#8a5c3e', 900);
      label(c, word[i], -.4, -.5, 84, '#cc8b58', 900); label(c, word[i], 0, 0, 84, '#315e57', 900); c.restore();
      pen += widths[i] - 2;
    }
    c.restore();
    const caption = handoffAt(t) * phase(t, HANDOFF_START + .13, HANDOFF_START + .23); if (caption > 0) {
      c.save(); c.globalAlpha = caption; c.strokeStyle = '#718775'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(0, 24); c.lineTo(620, 24); c.stroke();
      label(c, '让动效在城市发生', 0, 64, 38, '#325f55', 500);
      c.restore();
    }
    const footer = handoffAt(t) * phase(t, HANDOFF_START + .15, HANDOFF_START + .27); if (footer > 0) {
      c.save(); c.globalAlpha = footer;
      label(c, `WISE MOTION · ${Object.values(window.OpusWaterGallery.metadata.counts).reduce((sum, n) => sum + n, 0)} IDEAS`, 20, 104, 18, '#7c8975'); c.fillStyle = '#92f6e6'; c.beginPath(); c.arc(4, 99, 5, 0, PI * 2); c.fill();
      c.restore();
    }
    c.restore();
  }
  function render(c, t, visible) {
    const show = key => !visible || visible.has(key);
    beginGeometry(); now = t; setCamera(cameraAt(t)); faces = []; faceCount = 0; vertexCount = 0; waterHeights = [];
    palette = phase(t, 2.25, 2.366667); lit = phase(t, 2.01, 2.25); materialCache.clear(); shadeCache.clear();
    const bg = c.createLinearGradient(170, 80, 260, H);
    bg.addColorStop(0, colorMix('#eee5d5', '#f6e4c5', phase(t, 1.55, 2.68)));
    bg.addColorStop(.58, colorMix('#dfd5c4', '#ebc99f', phase(t, 1.55, 2.68)));
    bg.addColorStop(1, colorMix('#d1c6b0', '#dba676', phase(t, 1.55, 2.68)));
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    const shadowOpacity = phase(t, .38, .95) * .24;
    if (show('ground')) groundShadow(c, camera.x + 12 * camera.scale, camera.y + 245 * camera.scale, 435 * camera.scale, 45 * camera.scale, shadowOpacity);
    const tiles = ground(t, show('ground'), show('water'));
    surfaceLayer = .70;
    if (show('water')) window.OpusWaterGallery.render(t, { surfaceArt });
    if (show('landscape')) terrain(t);
    if (show('buildings')) { buildings.forEach(b => building(b, t)); centralTower(t); roundTower(t); glasshouse(t); }
    if (show('landscape')) { infrastructure(t); vehicles(t); }
    drawFaces(c);
    if (show('landscape')) cloud(c, 741 + handoffAt(t) * 163, 66 + handoffAt(t) * 21, .75, phase(t, 1.66, 1.98));
    if (show('landscape') && t > HANDOFF_START) cloud(c, 108, 80, .92, handoffAt(t));
    if (show('data')) dataCards(c, t); if (show('brand')) brand(c, t);
    endGeometry();
    render.stats = { time: now, tiles, faces: faceCount, vertices: vertexCount, waterHeights, palette, lit, camera: { ...camera } };
  }
  function drawAction(c, part, ms) {
    const p = clamp((ms - 150) / 1200);
    const t = part === 'ground' ? p * .81 : part === 'buildings' ? 1.52 + p * .77 : .95 + ms / 1000;
    beginGeometry(); now = t; palette = 1; lit = 1; faces = []; faceCount = 0; vertexCount = 0; waterHeights = []; surfaceLayer = 0; materialCache.clear(); shadeCache.clear();
    c.fillStyle = '#f1d5af'; c.fillRect(0, 0, W, H);
    let tiles = 0;
    if (part === 'ground') {
      setCamera({x:533,y:275,scale:.86});
      groundShadow(c,533,525,355,29,.17); tiles = ground(t);
    } else if (part === 'buildings') {
      setCamera({x:516,y:514,scale:1.90});
      groundShadow(c,533,510,150,25,.16); centralTower(t);
    } else {
      setCamera({x:206,y:215,scale:1.30});
      tiles = ground(t, false, true); surfaceLayer = .70;
      window.OpusWaterGallery.render(t, {surfaceArt});
    }
    drawFaces(c);
    endGeometry();
    render.stats = {time:t,part,tiles,faces:faceCount,vertices:vertexCount,waterHeights,camera:{...camera}};
  }
  box = cachedGeometry(box); block = cachedGeometry(block); cylinder = cachedGeometry(cylinder);
  sphere = cachedGeometry(sphere); dome = cachedGeometry(dome); prism = cachedGeometry(prism);
  window.Opus.Scene02 = {render,drawAction,inspect:()=>render.stats,tilePose,tileType,cameraAt,projectAt,brandFrameAt,
    dispose:()=>{faces=[];for(const cache of geometryCaches){cache.entries.length=0;cache.cursor=0;}geometryCapture=null;rgbCache.clear();materialCache.clear();shadeCache.clear();sphereMeshes.clear();domeMeshes.clear();render.stats=null;}};
})();

  return {...window.Opus.Scene02, gallery:window.OpusWaterGallery};
}
const breakdown = [
  {id:'ground',name:'地块与地基',actions:['tile-ring-unfold'],start:0,end:800,time:'0–0.80秒',detail:'144块地砖由中心逐圈翻开，三层实体地基从底面向下展开。'},
  {id:'buildings',name:'退台楼群',actions:['terraced-rise'],start:1030,end:2290,time:'1.03–2.29秒',detail:'楼层按错峰关系从底部生长，楼板、窗框、种植露台与屋顶共用实体模型。'},
  {id:'landscape',name:'植被与环境',actions:[],start:850,end:COMPOSITION_DURATION_MS,time:'0.85–4.95秒',detail:'台地、花圃、曲干棕榈树、遮阳架和云朵构成城市环境。'},
  {id:'water',name:'水波与动效换映',actions:['water-wave-handoff','group-stagger','wave-grid'],start:880,end:COMPOSITION_DURATION_MS,time:'0.88–4.95秒',detail:'26个水格持续起伏，中心与角落交替发波，按距离依次抬升；八种动效随波峰交叠切换。'},
  {id:'data',name:'目录数据卡',actions:[],start:2366.666667,end:HANDOFF_END*1000,time:'2.37–4.55秒',detail:'三张数据卡从当前目录统计动作、插画和组合数量；2.70–3.90秒保留完整数字与卡面，3.90–4.55秒随地块缩小同步淡出，短连线与水面标记一起消失。'},
  {id:'brand',name:'立体英文收尾',actions:[],start:HANDOFF_START*1000,end:COMPOSITION_DURATION_MS,time:'3.90–4.95秒',detail:'3.90秒地块开始缩小时，MOTION OASIS与中文同步在地块下方显现，随腾出的空间放大并保持水平居中；4.55秒完成交接，地块不旋转，水面继续换图。'}
];
function make(root,kit,definition={},part) {
  const doc=root.ownerDocument,box=doc.createElement('div'),canvas=doc.createElement('canvas');
  Object.assign(box.style,{position:'absolute',inset:'0',overflow:'hidden'});
  canvas.width=1280;canvas.height=720;
  Object.assign(canvas.style,{width:'640px',height:'360px',position:'absolute',inset:'0'});
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label',definition.name||'动效绿洲');
  box.append(canvas);root.replaceChildren(box);
  const markers=part?[]:breakdown.map(row=>{const n=doc.createElement('span');n.dataset.layer=row.id;n.hidden=true;box.append(n);return n;});
  const ctx=canvas.getContext('2d'),engine=createEngine(definition.catalog_data || global.MotionRegistry);
  let dead=false,last=0;
  const visible=()=>markers.some(n=>n.hasAttribute('data-composition-hidden'))?new Set(markers.filter(n=>!n.hasAttribute('data-composition-hidden')).map(n=>n.dataset.layer)):null;
  function render(ms) {
    if(dead)return;if(!Number.isFinite(ms))throw new TypeError('时间必须是有限数字');
    last=Math.max(0,Math.min(ms,definition.duration_ms||(part==='water'?5280:part?1800:COMPOSITION_DURATION_MS)));
    box.dataset.part=part||'composition';box.dataset.time=last.toFixed(6);
    if(!ctx)return;
    ctx.setTransform(1280/1066,0,0,720/600,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;ctx.shadowColor='rgba(0,0,0,0)';ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;ctx.filter='none';ctx.setLineDash([]);ctx.clearRect(0,0,1066,600);
    if(part)engine.drawAction(ctx,part,last);else engine.render(ctx,last/1000,visible());
  }
  const Observer=doc.defaultView?.MutationObserver;
  const observer=!part&&Observer?new Observer(()=>render(last)):null;
  observer?.observe(box,{subtree:true,attributes:true,attributeFilter:['data-composition-hidden']});
  render.frameRate=60;
  render.ready=Promise.resolve(doc.fonts?.ready).then(()=>{if(!dead)render(last);});
  render.destroy=(preserve=false)=>{if(dead)return;dead=true;observer?.disconnect();engine.dispose();markers.forEach(n=>n.remove());if(!preserve){canvas.width=1;canvas.height=1;root.replaceChildren();}};
  render.inspect=()=>engine.inspect();render(0);return render;
}
const F=global.MotionFactories=global.MotionFactories||{};
F['tile-ring-unfold']=(root,kit,def)=>make(root,kit,def,'ground');
F['terraced-rise']=(root,kit,def)=>make(root,kit,def,'buildings');
F['water-wave-handoff']=(root,kit,def)=>make(root,kit,def,'water');
F['motion-oasis-sequence']=(root,kit,def)=>make(root,kit,def);
F['motion-oasis-sequence'].breakdown=breakdown;
global.WiseMotionOasis=Object.freeze({createEngine,breakdown,catalogData:registry=>{const e=createEngine(registry),{counts,distributions}=e.gallery.metadata;e.dispose();return {counts,distributions};}});
})(globalThis);
