/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function(global){global.WiseSceneSources.ink=function(S,opt){with(S.env){const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mix = (a, b, f) => a + (b - a) * f;
function createProjectionGeometry(grid, width = 224, halfWidth = 1.2) {
  const weights = new Float32Array(width * grid.nr);
  for (let column = 0; column < width; column++) {
    const x = ((column + 0.5) / width * 2 - 1) * halfWidth;
    for (let i = 0; i < grid.nr; i++) {
      const outer = (i + 1) * grid.dr;
      const inner = i * grid.dr;
      if (outer <= Math.abs(x)) continue;
      weights[column * grid.nr + i] = 2 * (Math.sqrt(Math.max(0, outer * outer - x * x)) - Math.sqrt(Math.max(0, inner * inner - x * x)));
    }
  }
  return { width, halfWidth, weights };
}
function projectConcentration(concentration, grid, geometry) {
  const { width, weights } = geometry;
  const projected = new Float32Array(width * grid.ny);
  for (let j = 0; j < grid.ny; j++) {
    const row = j * grid.nr;
    for (let x = 0; x < width; x++) {
      const offset = x * grid.nr;
      let sum = 0;
      for (let i = 0; i < grid.nr; i++) sum += weights[offset + i] * concentration[row + i];
      projected[j * width + x] = sum;
    }
  }
  return projected;
}
function getFramePosition(data2, time) {
  const last = data2.frames.length - 1;
  const t = clamp(time, data2.frames[0].time, data2.frames[last].time);
  let lo = 0;
  let hi = last;
  while (lo < hi) {
    const middle = lo + hi + 1 >> 1;
    if (data2.frames[middle].time <= t) lo = middle;
    else hi = middle - 1;
  }
  const next = Math.min(last, lo + 1);
  const dt = data2.frames[next].time - data2.frames[lo].time;
  return { index: lo, next, fraction: dt > 0 ? (t - data2.frames[lo].time) / dt : 0 };
}
function getSceneMeasure(data2, time) {
  const position = getFramePosition(data2, time);
  const a = data2.frames[position.index];
  const b = data2.frames[position.next];
  const f = position.fraction;
  return {
    ...position,
    center: mix(a.center, b.center, f),
    // The actual measured dye extent determines framing only, never geometry.
    height: mix(a.shape.maxY - a.shape.minY, b.shape.maxY - b.shape.minY, f),
    radius: mix(a.shape.widestRadius, b.shape.widestRadius, f)
  };
}
const WIDTH = 1080;
const HEIGHT = 1920;
const RASTER_HEIGHT = 256;
const CROP_BOTTOM = -2.6;
const CROP_TOP = 1.7;
const PROJECTION_CACHE_LIMIT = 24;
const caches = /* @__PURE__ */ new WeakMap();
function getCache(data2) {
  const known = caches.get(data2);
  if (known) return known;
  const cache2 = { geometry: createProjectionGeometry(data2.metadata.grid), projection: /* @__PURE__ */ new Map() };
  caches.set(data2, cache2);
  return cache2;
}
function getProjection(data2, cache2, index) {
  const known = cache2.projection.get(index);
  if (known) {
    cache2.projection.delete(index);
    cache2.projection.set(index, known);
    return known;
  }
  const projected = projectConcentration(data2.frames[index].concentration, data2.metadata.grid, cache2.geometry);
  cache2.projection.set(index, projected);
  if (cache2.projection.size > PROJECTION_CACHE_LIMIT) {
    const first = cache2.projection.keys().next().value;
    if (first !== void 0) cache2.projection.delete(first);
  }
  return projected;
}
const COLORS = {
  teal: { low: [15, 85, 91], high: [135, 231, 208], particle: [144, 241, 218], gold: [230, 195, 127] },
  gold: { low: [89, 49, 26], high: [241, 213, 158], particle: [243, 223, 177], gold: [255, 233, 173] },
  ink: { low: [18, 35, 57], high: [98, 176, 193], particle: [127, 211, 220], gold: [209, 176, 124] }
};
const rgba = (rgb, alpha) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
function makeColorTable(palette) {
  const table = new Uint8ClampedArray(4096 * 4);
  const colors = COLORS[palette];
  for (let i = 0; i < 4096; i++) {
    const density = i / 4095 * 0.9;
    const alpha = 1 - Math.exp(-density * 6.7);
    const light = Math.sqrt(alpha);
    const k = i * 4;
    for (let c = 0; c < 3; c++) table[k + c] = mix(colors.low[c], colors.high[c], light * 0.93);
    table[k + 3] = alpha * 231;
  }
  return table;
}
const colorTables = {
  teal: makeColorTable("teal"),
  gold: makeColorTable("gold"),
  ink: makeColorTable("ink")
};
function makeWorkspace(data2, width) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = RASTER_HEIGHT;
  const context = canvas.getContext("2d");
  const grid = data2.metadata.grid;
  const rows = Array.from({ length: RASTER_HEIGHT }, (_, j) => {
    const y = CROP_TOP - (j + 0.5) / RASTER_HEIGHT * (CROP_TOP - CROP_BOTTOM);
    const index = clamp((y - grid.ymin) / grid.dy - 0.5, 0, grid.ny - 1.00001);
    return { row: Math.floor(index), fraction: index - Math.floor(index) };
  });
  return { canvas, context, image: context.createImageData(width, RASTER_HEIGHT), rows };
}
function rasterize(data2, cache2, workspace2, index, next, fraction, palette) {
  const width = cache2.geometry.width;
  const a = getProjection(data2, cache2, index);
  const b = getProjection(data2, cache2, next);
  const pixels = workspace2.image.data;
  const table = colorTables[palette];
  for (let y = 0; y < RASTER_HEIGHT; y++) {
    const { row, fraction: fy } = workspace2.rows[y];
    const off0 = row * width;
    const off1 = Math.min(data2.metadata.grid.ny - 1, row + 1) * width;
    for (let x = 0; x < width; x++) {
      const above = mix(a[off0 + x], b[off0 + x], fraction);
      const below = mix(a[off1 + x], b[off1 + x], fraction);
      const density = mix(above, below, fy);
      const k = (y * width + x) * 4;
      const color = clamp(Math.round(density / 0.9 * 4095), 0, 4095) * 4;
      const left = Math.max(0, x - 1);
      const right = Math.min(width - 1, x + 1);
      const gradient = Math.abs(mix(a[off0 + right], b[off0 + right], fraction) - mix(a[off0 + left], b[off0 + left], fraction));
      const sheen = Math.min(22, gradient * 370);
      pixels[k] = table[color] + sheen;
      pixels[k + 1] = table[color + 1] + sheen;
      pixels[k + 2] = table[color + 2] + sheen * 0.8;
      pixels[k + 3] = table[color + 3];
    }
  }
  workspace2.context.putImageData(workspace2.image, 0, 0);
}
function drawTracers(context, data2, instance, measure, pixelsPerUnit, sparse) {
  const { index, next, fraction, center } = measure;
  const now = data2.frames[index].points;
  const future = data2.frames[next].points;
  const count = Math.min(data2.metadata.particleCount, now.length / 4);
  const cos = Math.cos(instance.yaw);
  const sin = Math.sin(instance.yaw);
  const colors = COLORS[instance.palette];
  const project = (x, y, z) => [
    instance.x + (x * cos + z * sin) * pixelsPerUnit,
    instance.y - (y - center) * pixelsPerUnit
  ];
  context.save();
  context.globalCompositeOperation = "screen";
  context.lineCap = "round";
  context.lineJoin = "round";
  const stride = sparse ? 7 : 3;
  const historyStart = Math.max(0, index - 13);
  for (let particle = 0; particle < count; particle += stride) {
    const k = particle * 4;
    const c = mix(now[k + 3], future[k + 3], fraction);
    if (c < 4e-3) continue;
    const z = mix(now[k + 2], future[k + 2], fraction);
    const depth = clamp(0.75 + (z * cos - mix(now[k], future[k], fraction) * sin) * 0.4, 0.35, 1);
    const warm = particle % 19 === 0;
    context.strokeStyle = rgba(
      warm ? colors.gold : colors.particle,
      Math.min(0.31, Math.sqrt(c) * 0.39) * depth * instance.alpha
    );
    context.lineWidth = (warm ? 1.35 : 0.8) * Math.sqrt(instance.scale);
    context.beginPath();
    let started = false;
    for (let f = historyStart; f <= index; f += 2) {
      const old = data2.frames[f].points;
      const [x2, y2] = project(old[k], old[k + 1], old[k + 2]);
      if (!started) {
        context.moveTo(x2, y2);
        started = true;
      } else context.lineTo(x2, y2);
    }
    const [x, y] = project(mix(now[k], future[k], fraction), mix(now[k + 1], future[k + 1], fraction), z);
    if (started) context.lineTo(x, y);
    context.stroke();
  }
  for (let particle = 0; particle < count; particle += sparse ? 3 : 1) {
    const k = particle * 4;
    const c = mix(now[k + 3], future[k + 3], fraction);
    if (c < 3e-3) continue;
    const x = mix(now[k], future[k], fraction);
    const y = mix(now[k + 1], future[k + 1], fraction);
    const z = mix(now[k + 2], future[k + 2], fraction);
    const depth = clamp(0.7 + (z * cos - x * sin) * 0.4, 0.35, 1);
    const warm = particle % 31 === 0;
    context.fillStyle = rgba(
      warm ? colors.gold : colors.particle,
      (0.1 + Math.sqrt(c) * 0.34) * instance.alpha * depth
    );
    const [sx, sy] = project(x, y, z);
    const size = (warm ? 1.3 : 0.72) * Math.sqrt(instance.scale);
    context.beginPath();
    context.arc(sx, sy, size, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}
const data = global.WiseSceneInkData, cache = getCache(data), workspace = makeWorkspace(data, cache.geometry.width);
function originalVolume(context, time, variant, centerY = 850, zoom = 1, opacity = 1, palette = "teal") {
  const centerX = 540, showParticles = true;
  const instances = variant === "ocean" ? [
    { x: centerX - 290 * zoom, y: centerY - 330 * zoom, scale: 0.48 * zoom, time: time - 0.8, alpha: opacity * 0.45, palette: "ink", yaw: 0.4 },
    { x: centerX + 300 * zoom, y: centerY - 250 * zoom, scale: 0.39 * zoom, time: time - 1.25, alpha: opacity * 0.5, palette, yaw: 1 },
    { x: centerX - 255 * zoom, y: centerY + 385 * zoom, scale: 0.48 * zoom, time: time - 0.4, alpha: opacity * 0.64, palette, yaw: -0.25 },
    { x: centerX + 290 * zoom, y: centerY + 360 * zoom, scale: 0.35 * zoom, time: time - 1, alpha: opacity * 0.56, palette: "gold", yaw: 1.3 },
    { x: centerX + 15 * zoom, y: centerY + 20 * zoom, scale: 0.84 * zoom, time, alpha: opacity, palette, yaw: 0.65 }
  ] : [{ x: centerX, y: centerY, scale: zoom, time, alpha: opacity, palette, yaw: 0.45 }];
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  for (const instance of instances) {
    const measure = getSceneMeasure(data, instance.time);
    const pixelsPerUnit = 690 / Math.max(0.9, measure.height + 0.24, measure.radius * 2.05) * instance.scale;
    if (variant === "ocean") instance.y += (1 - measure.center) * 33 * instance.scale;
    rasterize(data, cache, workspace, measure.index, measure.next, measure.fraction, instance.palette);
    const halfWidth = cache.geometry.halfWidth * pixelsPerUnit;
    const top = instance.y - (CROP_TOP - measure.center) * pixelsPerUnit;
    const height = (CROP_TOP - CROP_BOTTOM) * pixelsPerUnit;
    context.save();
    context.globalAlpha = instance.alpha;
    context.drawImage(workspace.canvas, instance.x - halfWidth, top, halfWidth * 2, height);
    context.restore();
    if (showParticles) drawTracers(context, data, instance, measure, pixelsPerUnit, variant === "ocean");
  }
}
return { draw(t, mode, part) {
  const c = S.ctx, palette = opt.palette || "teal";
  if (mode === "full") {
    const u = Math.max(0, Math.min(1, (t - 3) / 7)), o = u * u * (3 - 2 * u);
    if(part==='art'||part==='single')originalVolume(c, 4.3 + (6 - 4.3) * t / 25, "single", 930, 1.13 + (0.97 - 1.13) * o, 1 - o, palette);
    const v = Math.max(0, Math.min(1, t / 24)), e = v * v * (3 - 2 * v);
    if(part==='art'||part==='ocean')originalVolume(c, 4.3 + (6 - 4.3) * t / 25, "ocean", 960, 1.12 + (0.9 - 1.12) * e, o, palette);
  } else originalVolume(c, 0.6 + (6 - 0.6) * t / 20, opt.group ? "ocean" : "single", 875, 1.12, 1, palette);
}, inspect: (t) => getSceneMeasure(data, modeTime(t)) };
function modeTime(t) {
  return opt.mode === "full" ? 4.3 + 1.7 * t / 25 : 0.6 + 5.4 * t / 20;
}
}};})(globalThis);
/* SCENE ENTRIES */
WiseSceneRuntime.register("ink-volume-roll",{"family": "ink", "mode": "volume", "start": 0, "width": 1080, "height": 1920});
