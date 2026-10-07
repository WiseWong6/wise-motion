/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 迁入自有原作，绘制函数与原数据共用；移除原界面、独立时钟和音频。 */
(function(global){
 global.WiseSceneSources.ocean=function(S,opt,def){

 with(S.env){
// p5.js 海面日落：连续波峰与随波面朝向变化的碎金反射。
// 天空保留连续渐变，倒影由波面斜率计算为透明受光层。
let backdrop;
let starBrushes;
let sunlightBrush, horizonBrush, sunBrush;
const styleCaches = new Map();
const SCENE_STYLES = {
  blue: {
    sky: [[0, '#1265f3'], [1, '#1977f8']],
    sea: [[0, '#1469ee'], [1, '#2987fa']],
    sun: [[0, '#ff9a3a'], [.20, '#ff812b'], [.48, '#ff6023'], [.72, '#ff4420'], [.9, '#ff3520'], [1, '#ff4027']],
    reflection: [[255, 88, 34], [255, 172, 39], [255, 235, 112]],
    reflectionTail: [255, 245, 222],
    highlight: [255, 252, 238], trough: [18, 75, 183], ambient: [114, 187, 255],
    waveContrast: .23,
    glow: [255, 157, 71], skyGlow: [.18, .2, .045], seaGlow: [.28, .65, .035],
    nightSky: [6, 15, 49], nightSea: [6, 21, 50],
    nightHorizon: [31, 53, 92], horizonGlow: .15,
    board: [[224, 237, 255], [75, 113, 178], [43, 70, 128]],
    star: [243, 249, 255]
  },
  warm: {
    sky: [[0, '#f69b18'], [.36, '#e88d30'], [.67, '#ba6c50'], [.88, '#785b71'], [1, '#57576e']],
    sea: [[0, '#716470'], [.2, '#5b5e70'], [.6, '#414f65'], [1, '#2b4056']],
    sun: [[0, '#f8d379'], [.14, '#f5c454'], [.34, '#efac32'], [.58, '#eb8b2b'], [.8, '#dd602c'], [1, '#c84635']],
    reflection: [[230, 112, 49], [245, 177, 76], [247, 213, 146]],
    highlight: [255, 238, 200], trough: [17, 30, 43], ambient: [186, 151, 126],
    waveContrast: .38,
    glow: [255, 184, 111], skyGlow: [.58, .48, .065], seaGlow: [.58, .8, .09],
    nightSky: [12, 22, 39], nightSea: [10, 24, 38],
    nightHorizon: [99, 70, 66], horizonGlow: .105,
    board: [[255, 242, 213], [148, 137, 133], [85, 84, 99]],
    star: [255, 250, 239]
  }
};
let sceneStyle = 'blue';
let palette = SCENE_STYLES.blue;
let controlsStamp = -Infinity;
let horizonY, sunX, sunY, sunR;
let pickupTime = 19;
let sunExitTime = 53.7;
const AFTERGLOW_SECONDS = 8;
let waterContacts = [];
let waterDrops = [];
let soundEvents = [];
let waterRows = [];
let skyStars = [];
let motionPreference;
const SCENE_DURATION = 65;
// strength 改为 .35 即为轻微版；时间和形变支点不变。
const SUN_MOTION = Object.freeze({strength: 1, stretch: .06, squash: .09, rebound: .022,
  legLag: .14, emptyTilt: Math.PI / 36, ropeSlack: .015});
const playback = {time: 0, stamp: 0, playing: false, running: false, rate: 1};
let playButton, progressInput, timeOutput, speedButton, soundButton, styleInput, styleMenu;
const sceneSound={setEvents(){}};
let draggingProgress = false, resumeAfterDrag = false;



function sceneTime() {
  if (!playback.running) return playback.time;
  return Math.min(SCENE_DURATION, playback.time + Math.max(0, millis() - playback.stamp) / 1000 * playback.rate);
}





function updateStyleControl() {
  if (!styleInput) return;
  styleInput.value = sceneStyle;
  styleInput.textContent = sceneStyle === 'warm' ? '暖色' : '蓝橙';
  for (const option of styleMenu.querySelectorAll('[data-style]')) {
    option.setAttribute('aria-checked', String(option.dataset.style === sceneStyle));
  }
}



function setupControlsVisibility() {
  const controls = document.getElementById('play-controls');
  const reveal = () => {
    controls.classList.remove('is-hidden');
  };
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const bounds = controls.getBoundingClientRect();
    const nearControls = event.clientX >= bounds.left - 16 && event.clientX <= bounds.right + 16
      && event.clientY >= bounds.top - 16;
    if (nearControls || draggingProgress || (styleMenu && !styleMenu.hidden)) { reveal();return; }
    controls.classList.add('is-hidden');
  }, {passive: true});
}

function styleFromSearch(search) {
  return new URLSearchParams(search).get('style') === 'warm' ? 'warm' : 'blue';
}







// 竖版缩短两段横向飞行，入水、托举和负重动作仍保持原来的时长。
function storyTime(time) {
  const portrait = document.body.dataset.aspect === '3:4';
  const arrival = portrait ? 6.5 : 14.5;
  if (time <= .5) return time * 2 / .5;
  if (time <= arrival) return 2 + (time - .5) * 12.5 / (arrival - .5);
  if (!portrait) return time;
  if (time <= 24) return time + 8;
  if (time <= 37) return 32 + (time - 24) * 2;
  return time + 21;
}

// 动作事件先换算成当前版本的播放时刻，音效与画面共用同一时钟。
function sceneTimeForAction(time) {
  const portrait = document.body.dataset.aspect === '3:4';
  const arrival = portrait ? 6.5 : 14.5;
  if (time <= 2) return time * .5 / 2;
  if (time <= 14.5) return .5 + (time - 2) * (arrival - .5) / 12.5;
  if (!portrait) return time;
  if (time <= 32) return time - 8;
  if (time <= 58) return 24 + (time - 32) / 2;
  return time - 21;
}

function sceneSize() {
  if (document.body.dataset.aspect !== '3:4') return {width: windowWidth, height: windowHeight};
  // 竖版完整适配窗口，底部留出独立控制区，不裁切画面。
  const availableWidth = Math.max(3, windowWidth - 24);
  const availableHeight = Math.max(4, windowHeight - (windowWidth <= 720 ? 150 : 110));
  const width = Math.min(availableWidth, availableHeight * .75);
  return {width, height: width * 4 / 3};
}



function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function smoothstep(a, b, value) {
  const u = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return u * u * (3 - 2 * u);
}

function rgba(r, g, b, alpha) {
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`;
}

function buildScene() {
  // 太阳放大 1.2 倍：主体更醒目，海面倒影路更宽；海平面维持原位。
  horizonY = Math.round(height * 0.76);
  sunX = width * 0.5;
  sunR = Math.min(width * 0.0456, height * 0.054);
  sunY = horizonY - sunR * 0.76;
  pickupTime = findPickupTime();
  waterContacts = findWaterContacts();
  waterDrops = makeWaterDrops();
  sunExitTime = findSunExitTime();
  rebuildVisualLayers();
  skyStars = makeSkyStars();
  soundEvents = makeSoundEvents();
  sceneSound.setEvents(soundEvents);
  const next = seededRandom(860214);
  waterRows = Array.from({length: 72}, (_, i) => ({
    depth: Math.pow((i + .15 + next() * .7) / 72, 1.7),
    phase: next() * Math.PI * 2,
    weight: .65 + next() * .7
  }));
  buildWaterReflection();
}

function rebuildVisualLayers() {
  // 复用背景画布。当前 p5 的 Graphics.remove() 会在清理 2D 渲染器时
  // 访问不存在的元素列表并中断切换，造成角色换色、背景仍留在上一版。
  if (!backdrop) {
    backdrop = createGraphics(width, height);
    backdrop.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  } else if (backdrop.width !== width || backdrop.height !== height) {
    backdrop.resizeCanvas(width, height, true);
  }
  const ctx = backdrop.drawingContext;
  for (const sea of [false, true]) {
    const top = sea ? horizonY : 0, bottom = sea ? height : horizonY;
    const gradient = ctx.createLinearGradient(0, top, 0, bottom);
    for (const [position, color] of sea ? palette.sea : palette.sky) gradient.addColorStop(position, color);
    ctx.fillStyle = gradient;ctx.fillRect(0, top, width, bottom - top);
  }
  if (!styleCaches.has(sceneStyle)) {
    styleCaches.set(sceneStyle, {stars: makeStarBrushes(),
      glow: makeSunlightBrush(), horizon: makeHorizonBrush(), sun: makeSunBrush()});
  }
  const cache = styleCaches.get(sceneStyle);
  if (cache.sun.key !== sunRasterMetrics().key) cache.sun = makeSunBrush();
  starBrushes = cache.stars;
  sunlightBrush = cache.glow;
  horizonBrush = cache.horizon;
  sunBrush = cache.sun;
  if (waterReflectionField) buildWaterReflection();
}

function waveAt(x, row, time, scale) {
  const d = row.depth, u = x / (25 + d * 110);
  const a = u * .85 + d * 43 - time * .46;
  const b = u * 1.53 - d * 67 + time * .32;
  const c = u * 3.7 + d * 115 - time * .61;
  const swell = Math.sin(a) * .6 + Math.sin(b) * .28 + Math.sin(c) * .12;
  const facing = Math.cos(a) * .5 + Math.cos(b) * .32 + Math.cos(c) * .18;
  const patch = smoothstep(-.65, .65, Math.sin(u * .57 - d * 29 + time * .17)
    * .65 + Math.sin(u * 2.17 + d * 81 - time * .29) * .35);
  return {y: horizonY + d * (height - horizonY) + swell * (.2 + d * 4) * scale, facing, patch};
}

function waterFacet(ctx, x1, y1, x2, y2, thickness, color) {
  ctx.fillStyle = color;ctx.beginPath();ctx.moveTo(x1, y1);ctx.lineTo(x2, y2);
  ctx.lineTo(x2, y2 + thickness);ctx.lineTo(x1, y1 + thickness);ctx.closePath();ctx.fill();
}

// 72 行波面只决定受光强弱；反射不再变成按亮度鼓起的几何笔触。
// 水的折射率 1.333。菲涅耳项与半角方向按 PBRT 的介质反射关系计算；
// 波长、粗糙度和色层是这幅极简夕阳的美术参数，不是完整海洋模拟。
let waterReflectionField;
const WATER_FIELD = Object.freeze({rows: 72, columns: 192, pixelsWide: 384, pixelsHigh: 192,
  indexOfRefraction: 1.333, exposureBlue: 3.4, exposureWarm: 2.1});

function waterFresnel(cosine) {
  const c = Math.max(0, Math.min(1, cosine)), eta = WATER_FIELD.indexOfRefraction;
  const transmitted = Math.sqrt(Math.max(0, 1 - (1 - c * c) / (eta * eta)));
  const perpendicular = (c - eta * transmitted) / (c + eta * transmitted);
  const parallel = (eta * c - transmitted) / (eta * c + transmitted);
  return (perpendicular * perpendicular + parallel * parallel) * .5;
}

function buildWaterReflection() {
  let field = waterReflectionField;
  if (!field) {
    const canvas = document.createElement('canvas');
    canvas.width = WATER_FIELD.pixelsWide;canvas.height = WATER_FIELD.pixelsHigh;
    const ctx = canvas.getContext('2d');
    field = waterReflectionField = {canvas, ctx, image: ctx.createImageData(canvas.width, canvas.height),
      alpha: new Float32Array(WATER_FIELD.rows * WATER_FIELD.columns),
      depth: new Float32Array(WATER_FIELD.rows),
      rowAt: new Uint8Array(canvas.height), rowMix: new Float32Array(canvas.height),
      color: new Float32Array(canvas.height * 3)};
  }
  // 尺寸和配色改变只重算映射与颜色，像素缓冲继续复用。
  Object.assign(field, {width, height, horizon: horizonY, radius: sunR, style: sceneStyle, rows: waterRows});
  const canvas = field.canvas;
  for (let r = 0; r < WATER_FIELD.rows; r++) {
    // 保留现有 72 行的远密近疏位置，并为地平线/画面底端保留采样边界。
    field.depth[r] = r === 0 ? 0 : r === WATER_FIELD.rows - 1 ? 1 : waterRows[r].depth;
  }
  let row = 0;
  for (let y = 0; y < canvas.height; y++) {
    const d = y / (canvas.height - 1);
    while (row < WATER_FIELD.rows - 2 && field.depth[row + 1] < d) row++;
    field.rowAt[y] = row;
    field.rowMix[y] = (d - field.depth[row]) / (field.depth[row + 1] - field.depth[row]);
    const colorPhase = smoothstep(0, .98, d) * 2;
    const band = Math.min(1, Math.floor(colorPhase));
    const mix = colorPhase - band;
    // 奶白只落在最末端的一小段，不把整片近水洗成亮白色。
    const tailMix = palette.reflectionTail ? smoothstep(.88, 1, d) * .18 : 0;
    for (let channel = 0; channel < 3; channel++) {
      const color = palette.reflection[band][channel]
        + (palette.reflection[band + 1][channel] - palette.reflection[band][channel]) * mix;
      field.color[y * 3 + channel] = color + ((palette.reflectionTail || palette.reflection[2])[channel] - color) * tailMix;
    }
  }
  waterReflectionField = field;
  return field;
}

function drawWaterReflection(ctx, story, time) {
  let field = waterReflectionField;
  if (!field || field.width !== width || field.height !== height || field.horizon !== horizonY
    || field.radius !== sunR || field.style !== sceneStyle || field.rows !== waterRows) field = buildWaterReflection();
  const visibility = Math.max(0, Math.min(1, story.reflection));
  if (visibility < .001) return;
  const blue = sceneStyle === 'blue';
  const elevation = Math.max(0, story.light.elevation);
  const lifted = smoothstep(.012, .23, elevation);
  const reach = 1.14 - lifted * .76;
  // 计算范围始终围绕太阳，越界部分交给现有海面裁剪。
  // 两版沿用同样的波面散射范围，蓝橙不再额外放大成宽亮块。
  const halfWidth = sunR * 8.2 * (1 + elevation * .2);
  const left = story.sunX - halfWidth;
  const columns = WATER_FIELD.columns, rows = WATER_FIELD.rows;
  const localStep = halfWidth * 2 / sunR / (columns - 1);
  const localStart = -halfWidth / sunR;
  const lightY = .065 + elevation * .62;
  const lightInv = 1 / Math.sqrt(1 + lightY * lightY);
  const ly = lightY * lightInv, lz = -lightInv;
  const exposure = blue ? WATER_FIELD.exposureBlue : WATER_FIELD.exposureWarm;
  for (let r = 0; r < rows; r++) {
    const d = field.depth[r];
    const depthFade = 1 - smoothstep(Math.max(.04, reach - .27), reach, d);
    const rowEnergy = visibility * depthFade * (1 - d * .11);
    const vY = .025 + d * .46;
    const viewXScale = .0065 + d * .011;
    const roughX = .065 + d * .05;
    // 地平线内几像素包含许多波面：扩大法线分布来积分远处细波，
    // 避免单个相位刚好背光时，在太阳底部留下黑缝。
    const distantFootprint = 1 - smoothstep(.015, .13, d);
    const roughZ = .074 + d * .018 + distantFootprint * .20;
    const slopeFilter = 1 - distantFootprint * .70;
    // 亮蓝底上宽而透明的红色散射会混成灰紫色。只在远水区域收住日盘投影，
    // 保留较实的橙红亮核与短柔边，逐渐接回下方的波面反射；暖色仍用原响应。
    const blueDistance = blue ? (1 - smoothstep(.03, .18, d)) * (1 - lifted * .65) : 0;
    const rippleDetail = smoothstep(.002, .018, d);
    const solarWidth = (.72 + d * 5.2) * (1 + rippleDetail
      * (.16 * Math.sin(d * 147 - time * .21) + .10 * Math.sin(d * 83 + time * .17)));
    const solarDrift = (.14 * Math.sin(d * 29 - time * .18) + .08 * Math.sin(d * 107 + time * .27))
      * smoothstep(0, .12, d) + rippleDetail
      * (.28 * Math.sin(d * 165 - time * .29) + .12 * Math.sin(d * 79 + time * .19));
    // 细波来自不同波长的叠加；相位轻微弯曲，间距和朝向都不再排成等距横线。
    const ripplePhase = 52 * Math.log1p(d * 7.5) - time * .50
      + 1.3 * Math.sin(d * 53 - time * .17) + .6 * Math.sin(d * 119 + time * .23);
    const rippleCrossPhase = d * 487 + time * .38 + .7 * Math.sin(d * 73);
    const rippleTilt = .5 + .8 * Math.sin(d * 71 - time * .20);
    // 四组解析高度波的偏导给出法线；横向尺度补偿海面透视压缩。
    const phaseA = d * 63 - time * .43 + .44 * Math.sin(d * 13);
    const phaseB = d * 107 + time * .27;
    const phaseC = d * 29 - time * .18;
    const phaseD = d * 17 - time * .19;
    const depthWarp = 1 + 5.72 * Math.cos(d * 13) / 63;
    let sinA = Math.sin(phaseA + localStart * .105), cosA = Math.cos(phaseA + localStart * .105);
    let sinB = Math.sin(phaseB - localStart * .21), cosB = Math.cos(phaseB - localStart * .21);
    let sinC = Math.sin(phaseC + localStart * .36), cosC = Math.cos(phaseC + localStart * .36);
    let sinD = Math.sin(phaseD + localStart * .25), cosD = Math.cos(phaseD + localStart * .25);
    const sa = Math.sin(localStep * .105), ca = Math.cos(localStep * .105);
    const sb = Math.sin(-localStep * .21), cb = Math.cos(-localStep * .21);
    const sc = Math.sin(localStep * .36), cc = Math.cos(localStep * .36);
    const sd = Math.sin(localStep * .25), cd = Math.cos(localStep * .25);
    for (let x = 0; x < columns; x++) {
      const localX = localStart + x * localStep;
      const vx = -localX * viewXScale, vi = 1 / Math.sqrt(vx * vx + vY * vY + 1);
      const hx = vx * vi, hy = vY * vi + ly, hz = vi + lz;
      const hi = 1 / Math.sqrt(hx * hx + hy * hy + hz * hz);
      const slopeX = 70 * slopeFilter * (.215 * .105 / 63 * cosA - .068 * .21 / 107 * cosB
        + .038 * .36 / 29 * cosC + .055 * .25 / 17 * cosD);
      const slopeZ = cosA * .215 * depthWarp + cosB * .068 + cosC * .038 + cosD * .055;
      // 半角方向恰好是把太阳反射向观者的法线；斜率偏差决定受光。
      const errorX = (slopeX - hx / hy) / roughX;
      const errorZ = (slopeZ - hz / hy) / roughZ;
      const distribution = Math.exp(-.5 * (errorX * errorX + errorZ * errorZ));
      const fresnel = waterFresnel((ly * hy + lz * hz) * hi);
      const energy = distribution * fresnel * exposure;
      // 先算能量，再映射透明度；没有以透明度推导笔触宽度的步骤。
      // 采样范围外缘留足衰减距离，最后只收去已很弱的远尾，防止矩形截边。
      const viewportFeather = 1 - smoothstep(.70, 1, Math.abs(localX) / (halfWidth / sunR));
      const scattered = 1 - Math.exp(-energy);
      let reflection = scattered;
      if (blueDistance > 0) {
        const solarEdge = 1 - smoothstep(solarWidth * .60, solarWidth * 1.28, Math.abs(localX - solarDrift));
        // 细波留下蓝水缝，避免集中后的亮核变成太阳下面的一块实心梯形。
        const crest = .68 * Math.cos(ripplePhase + localX * rippleTilt
          + .3 * Math.sin(localX * 2.7 + d * 39 - time * .26))
          + .32 * Math.cos(rippleCrossPhase + localX * 1.7);
        const ripple = .14 + .86 * smoothstep(-.65, .75, crest);
        const fineRipples = 1 + (ripple - 1) * smoothstep(.002, .012, d);
        const blueCore = (1 - Math.exp(-energy * 1.45)) * solarEdge * fineRipples;
        reflection += (blueCore - scattered) * blueDistance;
      }
      field.alpha[r * columns + x] = reflection * rowEnergy * viewportFeather;
      let next = sinA * ca + cosA * sa;cosA = cosA * ca - sinA * sa;sinA = next;
      next = sinB * cb + cosB * sb;cosB = cosB * cb - sinB * sb;sinB = next;
      next = sinC * cc + cosC * sc;cosC = cosC * cc - sinC * sc;sinC = next;
      next = sinD * cd + cosD * sd;cosD = cosD * cd - sinD * sd;sinD = next;
    }
  }
  const pixels = field.image.data, pixelWidth = field.canvas.width, pixelHeight = field.canvas.height;
  const xRatio = (columns - 1) / (pixelWidth - 1);
  for (let y = 0; y < pixelHeight; y++) {
    const top = field.rowAt[y] * columns, bottom = top + columns, blend = field.rowMix[y];
    const red = field.color[y * 3], green = field.color[y * 3 + 1], blueChannel = field.color[y * 3 + 2];
    for (let x = 0; x < pixelWidth; x++) {
      const column = x * xRatio, x0 = Math.floor(column), x1 = Math.min(columns - 1, x0 + 1), dx = column - x0;
      const upper = field.alpha[top + x0] + (field.alpha[top + x1] - field.alpha[top + x0]) * dx;
      const lower = field.alpha[bottom + x0] + (field.alpha[bottom + x1] - field.alpha[bottom + x0]) * dx;
      const alpha = Math.max(0, Math.min(1, upper + (lower - upper) * blend));
      const index = (y * pixelWidth + x) * 4;
      pixels[index] = red;pixels[index + 1] = green;pixels[index + 2] = blueChannel;pixels[index + 3] = alpha * 255;
    }
  }
  field.ctx.putImageData(field.image, 0, 0);
  ctx.save();ctx.imageSmoothingEnabled = true;ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(field.canvas, left, horizonY, halfWidth * 2, height - horizonY);
  ctx.restore();
}

function draw(part) {
 const show=id=>!part||part===id;
  if (!backdrop) return;
  const t = sceneTime();
  if (t >= SCENE_DURATION && playback.running) {
    playback.time = SCENE_DURATION;
    playback.running = false;playback.playing = false;
    noLoop();
  }

  const ctx = drawingContext;
  const actionTime = storyTime(t);
  const story = flightAt(actionTime);
  const scale = Math.max(.55, Math.min(1.5, height / 900));
  if(show('sea')){image(backdrop, 0, 0);
  drawSunlight(ctx, story);
  drawSun(ctx, sunX, sunY, story.restOpacity, true, story.eyeOpen);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, horizonY, width, height - horizonY);
  ctx.clip();

  // 全海面只保留低对比波纹；倒影另外作为连续的透明受光层合成。
  for (const row of waterRows) {
    const d = row.depth;
    const cell = Math.max(6, width / 65) * (.6 + d * 1.5);
    const thickness = (.45 + Math.pow(d, 1.2) * 3.4) * scale * row.weight;
    let left = waveAt(0, row, t, scale);
    for (let x = 0; x < width;) {
      const end = Math.min(width, x + cell), right = waveAt(end, row, t, scale);
      const facing = (left.facing + right.facing) * .5, patch = (left.patch + right.patch) * .5;
      waterFacet(ctx, x, left.y + thickness * .45, end, right.y + thickness * .45,
        thickness, rgba(...palette.trough, (.025 + d * .055) * (.75 - facing * .25) * (.2 + .8 * patch) * palette.waveContrast));
      waterFacet(ctx, x, left.y, end, right.y, thickness * .36,
        rgba(...palette.ambient, (.015 + Math.max(0, facing) * .05) * patch * palette.waveContrast));
      left = right;x = end;
    }
  }
  drawWaterReflection(ctx, story, t);
  ctx.restore();
  drawWaterContact(ctx, actionTime);}
  if(show('night')){drawDusk(ctx, story);drawStars(ctx, t, story.darkness, story);}
  if(show('flight')){drawContrail(ctx, actionTime);drawFlight(ctx, story);}

}






// 找到回升的座板刚好托住太阳底部的时刻，而不是另做一个爬上去的动作。
function findPickupTime() {
  const deepY = horizonY + sunR * .55;
  const raisedY = horizonY - Math.max(sunR * 1.6, height * .065);
  const contactY = sunY + sunR;
  let low = 18.35, high = 24;
  for (let i = 0; i < 36; i++) {
    const mid = (low + high) / 2;
    const seatY = deepY + (raisedY - deepY) * smoothstep(18.35, 24, mid);
    if (seatY > contactY) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

// 全长 65 秒：秋千浅潜到太阳下方 → 收绳托起 → 负重爬升 → 夜色。
// 用随时间衰减的摆动近似绳索受风和负重后的反应，保持任意时刻可重绘。
function flightAt(time) {
  const t = Math.max(0, Math.min(time, SCENE_DURATION));
  const unit = Math.max(5, Math.min(24, sunR * 0.34));
  // 飞机到画框边缘时已经在飞行，进入后再逐渐减速靠近太阳。
  const approachTime = Math.max(0, Math.min(1, (t - 2) / 12.5));
  const approach = 1 - (1 - approachTime) ** 2;
  const depart = smoothstep(32, 58, t);
  const aboard = t >= pickupTime && t < 62;
  const board = aboard ? 1 : 0;
  const deploy = smoothstep(14, 18, t);
  const x = -unit * 1.41 + (sunX + unit * 1.41) * approach
    + (width + sunR * 2.5 - sunX) * depart;

  // 降低巡航高度，登板后先被重量拽下，再恢复并抬头爬升。
  const cruiseY = height * .22;
  const loadTime = 24.5; // 收绳已把太阳带离水面一段，再承受完整重量。
  const impactTime = waterContacts[0]?.time ?? 18;
  const awake = t < 62 ? smoothstep(impactTime, impactTime + .65, t) : 0;
  // 触水后才开始抓绳，手掌和绳线共用握点；空绳不会提前向隐形的手折弯。
  const ropeGrip = awake;
  const eyeOpen = awake * (.65 + .35 * smoothstep(impactTime + .7, impactTime + 1.7, t));
  const tug = smoothstep(loadTime, loadTime + 1.1, t) * (1 - smoothstep(loadTime + 1.1, loadTime + 5.5, t));
  const recovery = Math.sin(Math.max(0, t - (loadTime + 1.1)) * 2.1)
    * Math.exp(-Math.max(0, t - (loadTime + 1.1)) * .85) * smoothstep(loadTime + 1.1, loadTime + 1.7, t);
  const y = cruiseY + height * (.038 * tug + .005 * recovery) - height * .15 * depart;
  const pitch = .065 * tug - .12 * smoothstep(loadTime + 2, loadTime + 6, t) * (1 - smoothstep(52, 58, t));
  const pivotY = y + unit * .65;
  const seatY = horizonY - Math.max(sunR * 1.6, height * .065);
  const fullLength = seatY - (cruiseY + unit * .65);
  const releaseAge = Math.max(0, t - 14);
  const lowering = smoothstep(14, 15, t) * (1 - smoothstep(17, 18, t));
  const payout = Math.sin(releaseAge * 3.2) * sunR * .08 * lowering;
  const stretch = sunR * .08 * tug;
  // 只下探到太阳底部稍下方，座板被海水遮住；停顿 0.35 秒便收绳。
  const deepLength = horizonY + sunR * .55 - (cruiseY + unit * .65);
  const retrieve = smoothstep(18.35, 24, t);
  const length = Math.max(unit * .25,
    deepLength * deploy + (fullLength - deepLength) * retrieve + payout + stretch);
  const releaseSwing = Math.sin(releaseAge * 2.2) * .13 * Math.exp(-releaseAge * .18) * lowering;
  const loadAge = Math.max(0, t - loadTime);
  const loadSwing = Math.sin(loadAge * 1.75) * .055 * Math.exp(-loadAge * .3) * smoothstep(loadTime, loadTime + .5, t);
  const cruisingSwing = Math.sin((t - 32) * .85) * .035 * smoothstep(32, 36, t);
  const angle = releaseSwing + loadSwing + cruisingSwing;
  const emptyMotion = smoothstep(14, 14.7, t) * (1 - smoothstep(17.2, 18.25, t));
  const seatTilt = Math.sin((releaseAge - .22) * 2.6) * SUN_MOTION.emptyTilt
    * Math.exp(-releaseAge * .1) * emptyMotion;
  const ropeSlack = SUN_MOTION.ropeSlack * smoothstep(14, 14.6, t)
    * (1 - smoothstep(16.5, 17.8, t));
  const body = sunDeformationAt(t);
  // 变形围绕座板接触点发生；身体中心上移/下移，底部不会离板。
  const riderX = x - Math.sin(angle) * (length - sunR * body.y);
  const riderY = pivotY + Math.cos(angle) * (length - sunR * body.y);
  const lightX = t >= pickupTime ? riderX : sunX;
  const lightY = t >= pickupTime ? riderY : sunY;
  const light = sunlightAt(lightX, lightY, t);
  const darkness = light.darkness;
  return {t, unit, x, y, pitch, pivotY, length, angle, board, deploy, darkness, strain: tug,
    body, seatTilt, ropeSlack,
    eyeOpen, armOpacity: awake, ropeGrip,
    aboard, visible: t >= 2 && t < 62,
    restOpacity: t < pickupTime ? 1 : 0,
    sunX: lightX, sunY: lightY, light,
    reflection: light.reflection
  };
}

function sunDeformationAt(time) {
  // 下坠、托住、一次回弹，全部从剧情时间求值，拖动不积累弹簧状态。
  const stretch = smoothstep(24.5, 24.95, time) * (1 - smoothstep(24.95, 25.5, time));
  const squash = smoothstep(25.15, 25.6, time) * (1 - smoothstep(25.6, 26.35, time));
  const rebound = smoothstep(26.15, 26.65, time) * (1 - smoothstep(26.65, 27.6, time));
  const y = 1 + SUN_MOTION.strength * (SUN_MOTION.stretch * stretch
    - SUN_MOTION.squash * squash + SUN_MOTION.rebound * rebound);
  return {x: 1 / y, y};
}

function sunLegAt(story, side) {
  const r = sunR, body = story.body || {x: 1, y: 1};
  const age = Math.max(0, story.t - 24.5 - SUN_MOTION.legLag);
  const trailing = Math.sin(age * 4) * Math.exp(-age * 1.15)
    * smoothstep(0, .25, age) * SUN_MOTION.strength;
  const sway = Math.sin(story.t * .75 + side * .2) * .012 * story.board;
  const hipX = r * (side < 0 ? -.32 : .36) * body.x, hipY = r * .68 * body.y;
  return {hipX, hipY, footX: hipX - r * (.2 + sway + trailing * .11),
    footY: r * (.68 + (side < 0 ? .58 : .63) + body.y - 1 + trailing * .045)};
}

// 座板绘制、入水中心和滴水起点共用尺寸与旋转，避免视觉和碰撞各算各的。
function swingSeatGeometry(radius, deploy) {
  // 板面的透视中心与太阳对齐，两侧绳端不再随透视一起偏右。
  // 太阳放大后座板加宽约 1.2 倍：绳线外扩，握点才能离身体足够远、手臂不显短。
  return {left: -radius * 1.9 * deploy, right: radius * 1.7 * deploy,
    depth: radius * .25 * deploy, offset: radius * .2 * deploy,
    thickness: radius * .07 * deploy};
}

function seatLocalPoint(story, x, y) {
  const seat = swingSeatGeometry(sunR, story.deploy), centerY = story.length - seat.depth / 2;
  const angle = story.seatTilt || 0, c = Math.cos(angle), s = Math.sin(angle);
  return {x: x * c - (y - centerY) * s, y: centerY + x * s + (y - centerY) * c};
}

function seatWorldPoint(story, x, y) {
  ({x, y} = seatLocalPoint(story, x, y));
  return {x: story.x + x * Math.cos(story.angle) - y * Math.sin(story.angle),
    y: story.pivotY + x * Math.sin(story.angle) + y * Math.cos(story.angle)};
}

function seatContactPoint(story) {
  const seat = swingSeatGeometry(sunR, story.deploy);
  return seatWorldPoint(story, 0, story.length - seat.depth / 2 + seat.thickness);
}

function findWaterContacts() {
  return [{start: 14, end: 18, entering: true}, {start: 18.35, end: 24, entering: false}].map(event => {
    let low = event.start, high = event.end;
    for (let i = 0; i < 36; i++) {
      const mid = (low + high) / 2;
      const point = seatContactPoint(flightAt(mid));
      if (event.entering ? point.y < horizonY : point.y > horizonY) low = mid;
      else high = mid;
    }
    const time = (low + high) / 2;
    return {time, entering: event.entering, ...seatContactPoint(flightAt(time))};
  });
}

function makeWaterDrops() {
  const exit = waterContacts.find(contact => !contact.entering);
  if (!exit) return [];
  return Array.from({length: 10}, (_, i) => {
    const emitted = exit.time + .12 + i * .16;
    const story = flightAt(emitted);
    const seat = swingSeatGeometry(sunR, story.deploy);
    const edge = (i % 2 ? seat.left : seat.right) * (.78 + (i % 3) * .055);
    const start = seatWorldPoint(story, edge, story.length + seat.thickness);
    // 用同一条重力轨迹求落水时刻，声音不在水滴离板时触发。
    const gravity = height * .34;
    const fall = Math.sqrt(Math.max(0, 2 * (horizonY - start.y) / gravity));
    return {id: `drop-${i}`, emitted, time: emitted + fall, x: start.x, y: horizonY,
      startY: start.y, gravity, strength: .75 + (i % 3) * .1};
  }).filter(drop => drop.startY < horizonY);
}

function drawRipple(ctx, event, age, small = false) {
  const lifetime = small ? .85 : 3.1;
  const rings = small ? 1 : 3;
  ctx.save();ctx.beginPath();ctx.rect(0, horizonY, width, height - horizonY);ctx.clip();
  for (let i = 0; i < rings; i++) {
    const u = (age - i * .2) / lifetime;
    if (u <= 0 || u >= 1) continue;
    const spread = .5 + sunR * (small ? .38 : 3.8) * (1 - Math.pow(1 - u, 1.5));
    const opacity = smoothstep(0, .06, u) * Math.pow(1 - u, 2) * (small ? .32 : .42);
    ctx.strokeStyle = rgba(238, 224, 204, opacity);
    ctx.lineWidth = Math.max(.55, sunR * .018) * (1 - u * .35);
    ctx.beginPath();ctx.ellipse(event.x, event.y, spread, Math.max(.3, spread * .065), 0, 0, Math.PI * 2);ctx.stroke();
  }
  ctx.restore();
}

function drawWaterContact(ctx, time) {
  const r = sunR;
  ctx.save();ctx.lineCap = 'round';
  for (const event of waterContacts) {
    const age = time - event.time;
    if (age < 0 || age > 3.6) continue;
    drawRipple(ctx, event, age);
    if (!event.entering) continue;
    for (let i = 0; i < 10; i++) {
      const life = .55 + (i % 3) * .13;
      const u = age / life;
      if (u <= 0 || u >= 1) continue;
      const side = i % 2 ? -1 : 1;
      const x = event.x + side * r * u * (.8 + i * .055);
      const y = event.y - Math.sin(Math.PI * u) * r * (.16 + (i % 4) * .075);
      ctx.fillStyle = rgba(255, 231, 187, Math.sin(Math.PI * u) * .6);
      ctx.beginPath();ctx.ellipse(x, y, Math.max(.7, r * .018), Math.max(1, r * .04), side * .25, 0, Math.PI * 2);ctx.fill();
    }
  }
  for (const drop of waterDrops) {
    const elapsed = time - drop.emitted;
    if (elapsed < 0) continue;
    if (time >= drop.time) {
      drawRipple(ctx, drop, time - drop.time, true);
      continue;
    }
    const y = drop.startY + .5 * drop.gravity * elapsed * elapsed;
    ctx.fillStyle = rgba(255, 233, 210, .58);
    ctx.beginPath();ctx.ellipse(drop.x, y, Math.max(.65, r * .016), Math.max(1.2, r * .045), 0, 0, Math.PI * 2);ctx.fill();
  }
  ctx.restore();
}

function makeSoundEvents() {
  const events = waterContacts.map((contact, i) => ({...contact, id: `contact-${i}`,
    type: contact.entering ? 'splash' : 'lift', time: sceneTimeForAction(contact.time), strength: 1}));
  for (const drop of waterDrops) {
    const time = sceneTimeForAction(drop.time);
    const previous = events[events.length - 1];
    // 邻近滴答共用一个声音，所有小水环仍按各自落点绘制。
    if (previous.type === 'drop' && time - previous.time < .23) {
      previous.strength = Math.min(1.15, previous.strength + .15);
    } else events.push({...drop, time, type: 'drop'});
  }
  const bells = [];
  // 夜幕已稳定后才加入星光声，先让余晖和星点安静地交接。
  const firstBellTime = sceneTimeForAction(sunExitTime) + AFTERGLOW_SECONDS * .875;
  skyStars.filter(star => star.bright).forEach((star, index) => {
    for (const flash of star.flashes) {
      const time = flash.peak;
      if (time < firstBellTime || time > SCENE_DURATION - .75) continue;
      const story = flightAt(storyTime(time));
      const light = skyStarAt(star, time, localDarkness(story, star.x * width, star.y * horizonY));
      if (light.twinkle < .85 || light.visibility < .8) continue;
      bells.push({id: `star-${index}-${flash.id}`, time, x: star.x * width, y: star.y * horizonY,
        type: 'star', note: index % 3, strength: .85});
    }
  });
  let lastBell = -Infinity;
  for (const bell of bells.sort((a, b) => a.time - b.time)) {
    if (bell.time - lastBell < 2.2) continue;
    events.push(bell);lastBell = bell.time;
  }
  return events.sort((a, b) => a.time - b.time);
}

// 先找圆盘完全离开画面的时刻；余晖按当前版本的实际秒数消退，拖动也可复现。
function findSunExitTime() {
  let low = 32, high = 58;
  for (let i = 0; i < 36; i++) {
    const mid = (low + high) / 2;
    if (flightAt(mid).sunX - sunR < width) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

function sunlightAt(x, y, time) {
  const elevation = Math.max(0, (sunY - y) / height);
  const travel = Math.hypot((x - sunX) / (width * .56),
    Math.max(0, elevation - .16) / .65);
  const drift = smoothstep(.12, .98, travel);
  const leavingFrame = smoothstep(width - sunR, width + sunR, x);
  const exit = sceneTimeForAction(sunExitTime);
  const afterglow = smoothstep(exit, exit + AFTERGLOW_SECONDS, sceneTimeForAction(time));
  // 离框只消退少量直射光；天空与海面还有八秒余晖，不在边缘突然切到黑夜。
  const darkness = .2 * drift + .8 * (.22 * leavingFrame + .78 * afterglow);
  return {darkness, elevation,
    reflection: (1 - darkness) * (1 - .35 * smoothstep(.12, .4, elevation))};
}

function localDarkness(story, x, y, sea = false) {
  const d = story.darkness;
  const dy = sea ? (y - horizonY) / (height - horizonY) : (y - story.sunY) / height;
  const distance = Math.hypot((x - story.sunX) / (width * .55), dy * .4);
  const far = smoothstep(.1, 1.25, distance);
  return Math.max(0, Math.min(1, d + d * (1 - d) * (far - .45) * 1.1));
}

function drawSunlight(ctx, story) {
  const intensity = 1 - story.darkness;
  if (intensity <= 0) return;
  const glow = (x, y, rx, ry, sea, alpha) => {
    ctx.save();ctx.beginPath();ctx.rect(0, sea ? horizonY : 0, width, sea ? height - horizonY : horizonY);ctx.clip();
    ctx.globalAlpha *= alpha * intensity;
    ctx.drawImage(sunlightBrush, x - rx, y - ry, rx * 2, ry * 2);ctx.restore();
  };
  const sky = palette.skyGlow, sea = palette.seaGlow;
  glow(story.sunX, story.sunY, width * sky[0], height * sky[1], false, sky[2]);
  glow(story.sunX, horizonY + (height - horizonY) * Math.min(.65, story.light.elevation),
    width * sea[0], (height - horizonY) * sea[1], true, sea[2]);
}

function makeSunlightBrush() {
  const canvas = document.createElement('canvas');canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [stop, alpha] of [[0, 1], [.45, .45], [1, 0]]) gradient.addColorStop(stop, rgba(...palette.glow, alpha));
  ctx.fillStyle = gradient;ctx.fillRect(0, 0, 256, 256);
  return canvas;
}

function sunRasterMetrics() {
  const screenRatio = Math.max(1, window.devicePixelRatio || 1);
  const density = Math.max(1, (typeof pixelDensity === 'function' && pixelDensity())
    || Math.min(screenRatio, 2));
  const surface = typeof drawingContext !== 'undefined' ? drawingContext.canvas : null;
  const rect = surface && typeof surface.getBoundingClientRect === 'function'
    ? surface.getBoundingClientRect() : null;
  const displayScale = rect && rect.width > 0 && width > 0 ? rect.width / width : 1;
  const sampling = density * 4;
  // 和金叶化蝶的月亮一致：透明过渡按最终屏幕物理像素计算。
  const edge = 1.2 / (sunR * displayScale * screenRatio);
  const padding = Math.max(sunR * .065, 3 / density, sunR * edge);
  const size = Math.ceil((sunR + padding) * sampling) * 2;
  const extent = size / (2 * sampling * sunR);
  return {radius: sunR, density, screenRatio, displayScale, sampling, edge, size, extent,
    key: [sceneStyle, sunR, density, screenRatio, displayScale].join(':')};
}

function makeSunBrush() {
  const metrics = sunRasterMetrics();
  const {size, extent, edge} = metrics;
  const canvas = document.createElement('canvas');canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d'), image = ctx.createImageData(size, size);
  const pixels = image.data, blue = sceneStyle === 'blue';
  const stops = palette.sun.map(([at, hex]) => [at,
    [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16))]);
  const haloRGB = [255, 112, 47], edgeRGB = [255, 133, 47];
  // 颜色和圆周覆盖率一次合成，绘制时只缩放这张圆盘，避免二次裁剪的硬边。
  for (let y = 0; y < size; y++) {
    const ny = ((y + .5) / size * 2 - 1) * extent;
    const position = Math.max(0, Math.min(1, (ny + 1) / (blue ? 2 : 1.76)));
    let next = 1;
    while (next < stops.length - 1 && position > stops[next][0]) next++;
    const [a, rgbA] = stops[next - 1], [b, rgbB] = stops[next];
    const mix = (position - a) / (b - a);
    const rowRGB = rgbA.map((value, i) => value + (rgbB[i] - value) * mix);
    for (let x = 0; x < size; x++) {
      const nx = ((x + .5) / size * 2 - 1) * extent, radial = Math.hypot(nx, ny);
      const coverage = smoothstep(0, 1, (1 - radial) / edge + .5);
      const haloPosition = Math.max(0, Math.min(1, (radial - .985) / .08));
      const halo = blue ? haloPosition < .35
        ? .12 + (.045 - .12) * haloPosition / .35
        : .045 * (1 - (haloPosition - .35) / .65) : 0;
      const alpha = coverage + halo * (1 - coverage);
      if (alpha <= 0) continue;
      const rimPosition = Math.max(0, Math.min(1, (radial - .68) / .32));
      const rim = blue ? rimPosition < .75 ? .025 * rimPosition / .75
        : .025 + (.09 - .025) * (rimPosition - .75) / .25 : 0;
      const offset = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) {
        const color = rowRGB[c] + (edgeRGB[c] - rowRGB[c]) * rim;
        pixels[offset + c] = (color * coverage + haloRGB[c] * halo * (1 - coverage)) / alpha;
      }
      pixels[offset + 3] = alpha * 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return {canvas, ...metrics};
}

function makeHorizonBrush() {
  const canvas = document.createElement('canvas');canvas.width = 2;canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 128);
  for (const [stop, alpha] of [[0, 0], [.72, palette.horizonGlow], [1, 0]]) gradient.addColorStop(stop, rgba(...palette.nightHorizon, alpha));
  ctx.fillStyle = gradient;ctx.fillRect(0, 0, 2, 128);
  return canvas;
}

function drawDusk(ctx, story) {
  if (story.darkness <= 0) return;
  // 横向连续渐变：背离太阳的一边先暗，附近仍留暖光；海面同步跟随。
  ctx.save();
  for (const sea of [false, true]) {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    const y = sea ? horizonY : story.sunY;
    for (let i = 0; i <= 24; i++) {
      const d = localDarkness(story, width * i / 24, y, sea);
      gradient.addColorStop(i / 24, rgba(...(sea ? palette.nightSea : palette.nightSky), d * (sea ? .97 : .995)));
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, sea ? horizonY : 0, width, sea ? height - horizonY : horizonY);
  }
  ctx.globalAlpha *= story.darkness;
  ctx.drawImage(horizonBrush, 0, horizonY - height * .24, width, height / 3);
  ctx.restore();
}

// 大量微弱远星铺底，宽星带内有局部聚集和暗隙；固定种子保证拖动可复现。
function makeSkyStars() {
  const random = seededRandom(731029);
  const stars = [];
  const count = Math.round(Math.max(700, Math.min(3600, width * horizonY / 460)));
  const clusters = Array.from({length: 7}, (_, i) => ({
    x: .06 + i * .145, y: .73 - i * .079 + (random() - .5) * .14,
    sx: .035 + random() * .045, sy: .035 + random() * .05
  }));
  const gaussian = () => Math.sqrt(-2 * Math.log(Math.max(.00001, random()))) * Math.cos(random() * Math.PI * 2);
  for (let i = 0; i < count; i++) {
    let x, y;
    const layer = random();
    for (let attempt = 0; attempt < 20; attempt++) {
      if (layer < .43) {
        x = random();y = random() * .97;
      } else if (layer < .77) {
        x = random();
        y = .78 - x * .52 + Math.sin(x * 8) * .055 + gaussian() * .10;
      } else {
        const group = clusters[Math.floor(random() * clusters.length)];
        x = group.x + gaussian() * group.sx;y = group.y + gaussian() * group.sy;
      }
      if (x > .006 && x < .994 && y > .012 && y < .97) break;
    }
    if (!(x > 0 && x < 1 && y > 0 && y < 1)) continue;
    const seed = random();
    const rank = random();
    const medium = rank > .92;
    stars.push({x, y, seed, bright: false, medium,
      dust: layer >= .43 && !medium, twinkling: false});
  }
  // 少量主星横跨全幅，纵向自由错落，不形成网格，也不集中在一侧。
  const brightCount = Math.round(Math.max(9, Math.min(18, width / 100)));
  for (let i = 0; i < brightCount; i++) {
    stars.push({x: (i + .2 + random() * .6) / brightCount,
      y: .07 + random() * .76, seed: random(), bright: true,
      medium: false, dust: false, twinkling: true, twinklePhase: (i + random() * .35) / brightCount});
  }
  arrangeStarFlashes(stars);
  return stars;
}

// 闪光时间按实际播放秒数排好，拖动、倍速和配色切换都使用同一组亮峰。
function arrangeStarFlashes(stars) {
  const random = seededRandom(905117);
  const bright = stars.filter(star => star.bright);
  for (const star of bright) star.flashes = [];
  if (!bright.length) return;
  const active = [];
  let peak = sceneTimeForAction(sunExitTime) + AFTERGLOW_SECONDS * .875 + .045;
  let previous = -1, id = 0;
  while (peak < SCENE_DURATION - .12) {
    let index = Math.floor(random() * bright.length);
    if (index === previous) index = (index + 1 + Math.floor(random() * (bright.length - 1))) % bright.length;
    const rise = .055 + random() * .065;
    const tail = .23 + random() * .18;
    const start = peak - rise, end = peak + tail;
    for (let i = active.length - 1; i >= 0; i--) if (active[i] <= start) active.splice(i, 1);
    // 极少量相邻闪光可以交叠，任何时刻最多三处；同一颗不叠加。
    if (active.length < 3 && !bright[index].flashes.some(flash => flash.end > start)) {
      bright[index].flashes.push({id: id++, start, peak, end});
      active.push(end);previous = index;
    }
    peak += random() < .2 ? .16 + random() * .16 : .43 + random() * .59;
  }
}

function skyStarAt(star, time, darkness) {
  const visibility = smoothstep(star.bright ? .8 + star.seed * .04 : .36 + star.seed * .22,
    star.bright ? .98 : .86 + star.seed * .12, darkness);
  const sparkleVisibility = smoothstep(.82, .98, darkness);
  let pulse = 0;
  if (star.twinkling && !motionPreference.matches) {
    for (const flash of star.flashes) {
      if (time < flash.start || time > flash.end) continue;
      pulse = Math.max(pulse, smoothstep(flash.start, flash.peak, time)
        * Math.pow(1 - smoothstep(flash.peak, flash.end, time), 1.6));
    }
  }
  const twinkle = pulse * sparkleVisibility * (1 - smoothstep(SCENE_DURATION - .8, SCENE_DURATION, time));
  const restingAlpha = star.bright ? .65 : star.medium ? .42 + star.seed * .22
    : star.dust ? .13 + star.seed * .19 : .22 + star.seed * .23;
  const restingRadius = star.bright ? 1.05 + star.seed * .25 : star.medium ? .65 + star.seed * .2
    : .24 + star.seed * .3;
  return {
    visibility, twinkle,
    alpha: visibility * (restingAlpha + (1 - restingAlpha) * twinkle) * (1 - star.y * .22),
    radius: restingRadius + .22 * twinkle
  };
}

function makeStarBrushes() {
  const halo = document.createElement('canvas');halo.width = halo.height = 32;
  const hctx = halo.getContext('2d');
  const glow = hctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  for (const [stop, alpha] of [[0, .55], [.16, .17], [.48, .035], [1, 0]]) glow.addColorStop(stop, rgba(...palette.star, alpha));
  hctx.fillStyle = glow;hctx.fillRect(0, 0, 32, 32);
  const rays = document.createElement('canvas');rays.width = rays.height = 64;
  const ctx = rays.getContext('2d');ctx.translate(32, 32);
  for (const [vertical, reach] of [[false, 29], [true, 19]]) {
    ctx.save();if (vertical) ctx.rotate(Math.PI / 2);
    const ray = ctx.createLinearGradient(-reach, 0, reach, 0);
    for (const [stop, alpha] of [[0, 0], [.45, .55], [.5, 1], [.55, .55], [1, 0]]) ray.addColorStop(stop, rgba(...palette.star, alpha));
    ctx.strokeStyle = ray;ctx.lineWidth = .8;
    ctx.beginPath();ctx.moveTo(-reach, 0);ctx.lineTo(reach, 0);ctx.stroke();ctx.restore();
  }
  return {halo, rays};
}

function drawStars(ctx, time, darkness, story) {
  if (darkness <= .36) return;
  const scale = Math.max(.8, Math.min(1.25, Math.min(width / 1100, height / 850)));
  ctx.save();ctx.beginPath();ctx.rect(0, 0, width, horizonY);ctx.clip();
  for (const star of skyStars) {
    const light = skyStarAt(star, time, story ? localDarkness(story, star.x * width, star.y * horizonY) : darkness);
    if (light.alpha < .002) continue;
    const x = star.x * width, y = star.y * horizonY;
    // 远星保持细小，依靠数量与密度形成星带，不给每颗远星加光晕。
    if (!star.bright) {
      ctx.globalAlpha = light.alpha;ctx.fillStyle = rgba(...palette.star, 1);
      ctx.beginPath();ctx.arc(x, y, light.radius * scale, 0, Math.PI * 2);ctx.fill();
      continue;
    }
    ctx.save();ctx.translate(x, y);ctx.scale(scale, scale);
    ctx.globalAlpha = light.alpha;
    const radius = 3.5 + light.twinkle * 5;
    ctx.drawImage(starBrushes.halo, -radius, -radius, radius * 2, radius * 2);
    if (light.twinkle > .015) {
      ctx.globalAlpha = light.visibility * light.twinkle * .9;
      const reach = 7 + light.twinkle * (10 + star.seed * 5);
      ctx.drawImage(starBrushes.rays, -reach, -reach, reach * 2, reach * 2);
    }
    ctx.globalAlpha = light.alpha;ctx.fillStyle = rgba(...palette.star, 1);
    ctx.beginPath();ctx.arc(0, 0, light.radius, 0, Math.PI * 2);ctx.fill();ctx.restore();
  }
  ctx.restore();
}

function drawSun(ctx, x, y, opacity, behindHorizon = false, eyeOpen = 0, body = {x: 1, y: 1}) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  if (behindHorizon) {
    ctx.beginPath(); ctx.rect(0, 0, width, horizonY); ctx.clip();
  }
  const reach = sunR * sunBrush.extent;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sunBrush.canvas, x - reach * body.x, y - reach * body.y,
    reach * 2 * body.x, reach * 2 * body.y);
  // 入水时逐渐睁眼，此后保持平静的圆眼睛。
  if (eyeOpen > 0) {
    ctx.fillStyle = '#151515';
    const radius = Math.max(1.25, sunR * .085);
    for (const eyeX of [-.48, .18]) {
      ctx.beginPath();
      ctx.ellipse(x + eyeX * sunR * body.x, y - sunR * .24 * body.y,
        radius, radius * eyeOpen, 0, 0, Math.PI * 2);
      ctx.fill();
    }

  }
  ctx.restore();
}

function drawAirplane(ctx, unit) {
  ctx.save(); ctx.scale(unit, unit);
  // 深灰蓝机身与轻微的机翼明暗，在暖色天空中保持清晰。
  ctx.fillStyle = '#505969';
  ctx.beginPath();
  ctx.moveTo(-1.5, -.04);ctx.lineTo(-1.68, -.64);
  ctx.lineTo(-1.48, -.61);ctx.lineTo(-1.13, -.15);
  ctx.lineTo(-.34, -.08);ctx.lineTo(-.65, -.44);
  ctx.lineTo(-.39, -.42);ctx.lineTo(.18, -.12);
  ctx.quadraticCurveTo(1.04, -.16, 1.4, .08);
  ctx.quadraticCurveTo(1.46, .25, .87, .26);
  ctx.lineTo(-.1, .22);ctx.lineTo(-.67, .52);
  ctx.lineTo(-.89, .5);ctx.lineTo(-.57, .19);
  ctx.lineTo(-1.5, .08);ctx.closePath();ctx.fill();
  ctx.fillStyle = '#687181';
  ctx.beginPath();ctx.moveTo(-.34, -.08);ctx.lineTo(-.65, -.44);
  ctx.lineTo(-.39, -.42);ctx.lineTo(.18, -.12);ctx.closePath();ctx.fill();
  ctx.fillStyle = '#3e4859';
  ctx.beginPath();ctx.moveTo(.22, .13);ctx.lineTo(-.67, .52);
  ctx.lineTo(-.89, .5);ctx.lineTo(-.57, .19);ctx.closePath();ctx.fill();
  ctx.fillStyle = '#303b4c';
  ctx.beginPath();ctx.moveTo(.63, -.1);ctx.lineTo(.89, -.035);
  ctx.lineTo(1.06, .055);ctx.lineTo(.77, .015);ctx.closePath();ctx.fill();
  ctx.restore();
}

// 从飞机经过的历史位置绘制尾流，旧段逐渐变宽、漂移和消散。
// 不累积帧缓存，循环、缩放与减少动态效果设置都能得到一致的画面。
function contrailSegments(time) {
  const t = Math.max(0, Math.min(time, SCENE_DURATION));
  const fade = 1 - smoothstep(59, 64, t);
  const segments = [];
  const start = Math.max(2, t - 12);
  const end = Math.min(t, 61);
  const step = 0.15;
  const scale = Math.max(.6, Math.min(1.5, height / 900));
  for (let emitted = start; emitted < end; emitted += step) {
    const next = Math.min(end, emitted + step);
    const a = flightAt(emitted), b = flightAt(next);
    // 飞机接太阳时暂停，避免在停留处堆出一团烟。
    if (Math.hypot(b.x - a.x, b.y - a.y) < .05) continue;
    const age = t - (emitted + next) * .5;
    const alpha = Math.pow(Math.max(0, 1 - age / 12), 1.6) * .34 * fade;
    if (alpha < .002) continue;
    const point = (state, sampleTime, side) => {
      const elapsed = t - sampleTime;
      const tailX = -state.unit * 1.35;
      const tailY = state.unit * (.08 + side * .14);
      return {
        x: state.x + tailX * Math.cos(state.pitch) - tailY * Math.sin(state.pitch) - elapsed * scale * .9,
        y: state.y + tailX * Math.sin(state.pitch) + tailY * Math.cos(state.pitch)
          + elapsed * scale * .35
          + Math.sin(sampleTime * .7 + side) * elapsed * scale * .1
      };
    };
    for (const side of [-1, 1]) {
      segments.push({a: point(a, emitted, side), b: point(b, next, side),
        alpha, width: (.75 + age * .23) * scale});
    }
  }
  return segments;
}

function drawContrail(ctx, time) {
  ctx.save();ctx.lineCap = 'round';
  for (const segment of contrailSegments(time)) {
    for (const [spread, opacity] of [[3, .15], [1, 1]]) {
      ctx.strokeStyle = rgba(255, 244, 225, segment.alpha * opacity);
      ctx.lineWidth = segment.width * spread;
      ctx.beginPath();ctx.moveTo(segment.a.x, segment.a.y);
      ctx.lineTo(segment.b.x, segment.b.y);ctx.stroke();
    }
  }
  ctx.restore();
}

// 起初左右镜像；下拽时双手向下扣绳，恢复平稳后左手抬回、右手保持。
function sunHandPoseAt(story, side) {
  const brace = smoothstep(24.5, 24.95, story.t);
  const recover = side < 0 ? 1 - smoothstep(26.2, 29.5, story.t) : 1;
  const change = brace * recover;
  return {
    x: side * sunR * (1.3 - .06 * (story.strain || 0)),
    // 身体中心因压扁而下移时反向补偿，手掌不会随圆盘滑离握点。
    y: sunR * (-.055 + .26 * change + (story.body?.y || 1) - 1),
    wristLift: sunR * (-.015 + .135 * change),
    rotation: side * (.35 - .7 * change)
  };
}

function sunHandAt(story, side) {
  const hand = sunHandPoseAt(story, side);
  const {guide} = ropeAt(story, side, story.length);
  // 完整手势淡入时就贴绳，随后和绳子一起轻轻收紧，不旋转或长出手臂。
  if (story.aboard) {
    hand.x = guide.x;
    hand.y = guide.y - story.length + sunR * (story.body?.y || 1);
  } else {
    const c = Math.cos(story.angle), s = Math.sin(story.angle);
    hand.x = story.x + guide.x * c - guide.y * s - story.sunX;
    hand.y = story.pivotY + guide.x * s + guide.y * c - story.sunY;
  }
  return hand;
}

// 两条绳子连接机身与座板左右侧边的中点；握点使用相同的绳线位置。
function ropeAt(story, side, localY) {
  const mountX = side * story.unit * .75;
  const mountY = story.unit * .15;
  const anchorX = mountX * Math.cos(story.pitch) - mountY * Math.sin(story.pitch);
  const anchorY = mountX * Math.sin(story.pitch) + mountY * Math.cos(story.pitch) - story.unit * .65;
  const topX = anchorX * Math.cos(story.angle) + anchorY * Math.sin(story.angle);
  const topY = -anchorX * Math.sin(story.angle) + anchorY * Math.cos(story.angle);
  const seat = swingSeatGeometry(sunR, story.deploy);
  const bottom = seatLocalPoint(story,
    (side < 0 ? seat.left : seat.right) + seat.offset / 2, story.length - seat.depth / 2);
  const bottomX = bottom.x, bottomY = bottom.y;
  const hand = sunHandPoseAt(story, side);
  const handX = hand.x;
  const handY = hand.y;
  const c = Math.cos(story.angle), sn = Math.sin(story.angle);
  const dx = story.sunX + handX - story.x;
  const dy = story.sunY + handY - story.pivotY;
  const guideY = story.aboard ? story.length - sunR * (story.body?.y || 1) + handY : -dx * sn + dy * c;
  const span = bottomY - topY;
  const grip = story.ropeGrip || 0;
  const slack = side * (story.ropeSlack || 0) * (1 - grip);
  const clampedY = Math.max(topY + .001, Math.min(bottomY - .001, guideY));
  const u = (clampedY - topY) / span;
  const straightX = topX + (bottomX - topX) * u;
  const targetX = story.aboard ? handX : dx * c + dy * sn;
  const guideX = straightX + (targetX - straightX) * grip + 4 * u * (1 - u) * slack * span;
  const guide = {x: guideX, y: clampedY};
  const a = localY < guide.y ? {x: topX, y: topY} : guide;
  const b = localY < guide.y ? guide : {x: bottomX, y: bottomY};
  const fraction = Math.max(0, Math.min(1, (localY - a.y) / (b.y - a.y)));
  // 两段取自同一条柔弯：曲率按区段长度的平方分配，空绳中间不会出现折角。
  const bend = slack * (b.y - a.y) ** 2 / span;
  return {topX, topY, bottomX, bottomY, guide, slack,
    x: a.x + (b.x - a.x) * fraction + 4 * fraction * (1 - fraction) * bend};
}

function traceRope(ctx, rope) {
  ctx.beginPath();ctx.moveTo(rope.topX, rope.topY);
  const segment = (ax, ay, bx, by) => {
    if (Math.abs(rope.slack) < 1e-10) ctx.lineTo(bx, by);
    else ctx.quadraticCurveTo((ax + bx) / 2 + 2 * rope.slack * (by - ay) ** 2 / (rope.bottomY - rope.topY),
      (ay + by) / 2, bx, by);
  };
  segment(rope.topX, rope.topY, rope.guide.x, rope.guide.y);
  segment(rope.guide.x, rope.guide.y, rope.bottomX, rope.bottomY);
}

function drawReelingRope(ctx, story, side) {
  const reeling = smoothstep(18.35, 18.65, story.t) * (1 - smoothstep(23.5, 24, story.t));
  if (reeling <= 0) return;
  ctx.save();
  ctx.strokeStyle = rgba(255, 242, 195, reeling * .8);
  ctx.lineWidth = Math.max(1.6, sunR * .045);
  const spacing = Math.max(18, height * .045);
  const {topY, bottomY} = ropeAt(story, side, story.length);
  // 标记固定在绳子上，距座板不变；收绳时沿吊索向机身移动。
  for (let distance = spacing; distance < bottomY - topY; distance += spacing) {
    const y1 = bottomY - distance;
    const y2 = Math.min(bottomY, y1 + Math.max(3, sunR * .12));
    const a = ropeAt(story, side, y1), b = ropeAt(story, side, y2);
    ctx.beginPath();ctx.moveTo(a.x, y1);ctx.lineTo(b.x, y2);ctx.stroke();
  }
  ctx.restore();
}

function drawSwingSeat(ctx, y, radius, deploy, story) {
  const {left, right, depth, offset, thickness} = swingSeatGeometry(radius, deploy);
  const light = .76 + .24 * (1 - story.darkness);
  ctx.save();
  ctx.translate(0, y - depth / 2);ctx.rotate(story.seatTilt || 0);ctx.translate(0, -y + depth / 2);
  ctx.strokeStyle = rgba(255, 255, 255, .82 * light);ctx.lineWidth = Math.max(.7, radius * .021);
  ctx.lineJoin = 'round';
  // 斜向后延伸的板面与向下的前沿，组成一块薄座板。
  ctx.fillStyle = rgba(...palette.board[0], .3 * light);
  ctx.beginPath();ctx.moveTo(left, y);ctx.lineTo(right, y);
  ctx.lineTo(right + offset, y - depth);ctx.lineTo(left + offset, y - depth);
  ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle = rgba(...palette.board[1], .72);
  ctx.beginPath();ctx.moveTo(left, y);ctx.lineTo(right, y);
  ctx.lineTo(right, y + thickness);ctx.lineTo(left, y + thickness);
  ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle = rgba(255, 255, 255, .55 * light);
  ctx.fillStyle = rgba(...palette.board[2], .78);
  ctx.beginPath();ctx.moveTo(right, y);ctx.lineTo(right + offset, y - depth);
  ctx.lineTo(right + offset, y - depth + thickness);ctx.lineTo(right, y + thickness);
  ctx.closePath();ctx.fill();ctx.stroke();
  // 最靠近太阳的上沿保留一条细亮边，下面的暗面让座板读成薄板。
  ctx.strokeStyle = rgba(...palette.highlight, .94 * light);
  ctx.lineWidth = Math.max(.65, radius * .018);
  ctx.beginPath();ctx.moveTo(left, y);ctx.lineTo(right, y);ctx.lineTo(right + offset, y - depth);ctx.stroke();
  ctx.restore();
}

// 手臂以完整的抓绳姿态淡入，仅随绳索位置移动，不再旋转或切换姿态。
function drawSunArms(ctx, story) {
  if (story.armOpacity <= 0) return;
  const r = sunR;
  ctx.save();ctx.globalAlpha *= story.armOpacity;
  ctx.strokeStyle = '#151515';ctx.fillStyle = '#151515';
  ctx.lineWidth = Math.max(1.15, r * .065);ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    const body = story.body || {x: 1, y: 1};
    const shoulderX = side * r * .94 * body.x;
    const shoulderY = r * .055 * body.y;
    const hand = sunHandAt(story, side);
    const handX = hand.x;
    const handY = hand.y;
    ctx.beginPath();ctx.moveTo(shoulderX, shoulderY);
    ctx.bezierCurveTo(shoulderX + (handX - shoulderX) * .45, shoulderY,
      handX - side * r * .05, handY - hand.wristLift,
      handX, handY);ctx.stroke();
    ctx.beginPath();ctx.ellipse(handX, handY, r * .077, r * .09,
      hand.rotation, 0, Math.PI * 2);ctx.fill();
  }
  ctx.restore();
}

function drawFlight(ctx, story) {
  if (!story.visible) return;
  const r = sunR;
  // 海面遮住水下的绳索和座板，收绳时从同一位置自然露出。
  ctx.save();
  ctx.beginPath();ctx.rect(0, 0, width, horizonY);ctx.clip();
  ctx.translate(story.x, story.pivotY);ctx.rotate(story.angle);
  ctx.lineWidth = Math.max(0.9, r * .024);ctx.lineCap = 'round';
  if (story.deploy > 0) {
    for (const side of [-1, 1]) {
      const light = .88 + .07 * Math.cos(story.angle + side * .4) - story.darkness * .06;
      ctx.strokeStyle = rgba(255, 252, 244, light);
      const rope = ropeAt(story, side, story.length);
      traceRope(ctx, rope);ctx.stroke();
      drawReelingRope(ctx, story, side);
    }
    drawSwingSeat(ctx, story.length, r, story.deploy, story);
  }
  ctx.restore();

  if (story.restOpacity > 0 && story.armOpacity > 0) {
    ctx.save();ctx.beginPath();ctx.rect(0, 0, width, horizonY);ctx.clip();
    ctx.translate(sunX, sunY);ctx.globalAlpha = story.restOpacity;
    drawSunArms(ctx, story);ctx.restore();
  }

  if (story.aboard) {
    ctx.save();
    // 座板、太阳与手脚接受同一海面遮挡，随收绳一起露出水面。
    ctx.beginPath();ctx.rect(0, 0, width, horizonY);ctx.clip();
    ctx.translate(story.sunX, story.sunY);ctx.rotate(story.angle * story.board);
    ctx.strokeStyle = '#151515';ctx.fillStyle = '#151515';
    ctx.lineWidth = Math.max(1.15, r * .065);ctx.lineCap = 'round';
    // 双腿始终保持完整长度；身体与海面遮住上端和水下部分，提起时自然显露。
    for (const side of [-1, 1]) {
      const {hipX, hipY, footX, footY} = sunLegAt(story, side);
      ctx.beginPath();ctx.moveTo(hipX, hipY);
      ctx.bezierCurveTo(hipX - r * .31, hipY,
        footX + r * .04, footY - r * .23, footX, footY);ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(footX - r * .025, footY, r * .09,
        r * .072, -.15, 0, Math.PI * 2);ctx.fill();
    }
    drawSun(ctx, 0, 0, 1, false, story.eyeOpen, story.body);
    drawSunArms(ctx, story);
    ctx.restore();
  }
  ctx.save();ctx.translate(story.x, story.y);ctx.rotate(story.pitch);drawAirplane(ctx, story.unit);ctx.restore();
}

 sceneStyle='warm';palette=SCENE_STYLES.warm;motionPreference={matches:false};buildScene();
 // 组合按源时间加速；海浪、星空与飞机共用映射，定位不依赖播放历史。
 const sourceTime=t=>t*(opt.playback_rate||1);
 return {draw(t,mode,part){t=sourceTime(t);const c=S.ctx,story=flightAt(storyTime(t));playback.time=t;
  if(mode==='full'){draw(part==='art'?null:part);return;}
  if(mode==='water'){drawWaterReflection(c,story,t);drawWaterContact(c,storyTime(t));return;}
  // 托举动作共用原海面、夕阳倒影和接触水纹，再叠加飞机与座板。
  if(mode==='flight'){draw('sea');draw('flight');return;}
  if(mode==='airplane'){c.save();c.translate(width/2,height/2);drawAirplane(c,Math.min(width,height)*.16);c.restore();return;}
  if(mode==='seat'){
    // 独立样式共用同一姿态；绳子的终点与座板不能各取一段故事里的长度。
    const pose={...story,deploy:1,length:100,angle:0,pitch:0,seatTilt:0,darkness:0,ropeGrip:0,ropeSlack:0};
    const seat=swingSeatGeometry(sunR,pose.deploy);
    const ropes=[-1,1].map(side=>ropeAt(pose,side,pose.length));
    const left=Math.min(seat.left,...ropes.map(r=>r.topX));
    const right=Math.max(seat.right+seat.offset,...ropes.map(r=>r.topX));
    const top=Math.min(...ropes.map(r=>r.topY)),bottom=pose.length+seat.thickness;
    const zoom=Math.min(width*.78/(right-left),height*.7/(bottom-top));
    c.save();c.translate(width/2,height/2);c.scale(zoom,zoom);c.translate(-(left+right)/2,-(top+bottom)/2);
    c.strokeStyle=rgba(255,252,244,.92);c.lineWidth=Math.max(.9,sunR*.024);c.lineCap='round';
    for(const rope of ropes){traceRope(c,rope);c.stroke();}
    drawSwingSeat(c,pose.length,sunR,pose.deploy,pose);c.restore();
  }
 },inspect:t=>flightAt(storyTime(sourceTime(t)))};

}
};
})(globalThis);

/* SCENE ENTRIES */
WiseSceneRuntime.register("seat-water-lift",{"family": "ocean", "mode": "flight", "start": 0, "width": 900, "height": 1200});
WiseSceneRuntime.register("sunset-airplane-illustration",{"family": "ocean", "mode": "airplane", "start": 0, "width": 900, "height": 1200});
WiseSceneRuntime.register("sunset-swing-illustration",{"family": "ocean", "mode": "seat", "start": 0, "width": 900, "height": 1200});
WiseSceneRuntime.register("sunset-sea-illustration",{"family": "ocean", "mode": "water", "start": 0, "width": 900, "height": 1200});
WiseSceneRuntime.register("sunset-pickup-journey",{"family":"ocean","mode":"full","start":0,"width":900,"height":1200,"breakdown":[{"id":"sea","name":"夕阳、海面与接触水纹","start":0,"end":21500,"time":"0—21.5秒","detail":"暖色天空与海面保持低对比波纹；太阳、座板和滴水在各自接触位置引起倒影与涟漪。","actions":["sunset-sun-illustration","sunset-water-reflection","sunset-sea-illustration"]},{"id":"night","name":"暮色与星空","start":0,"end":21500,"time":"0—21.5秒","detail":"晚霞逐渐变暗，星点沿太阳被接走后的时序显现。","actions":["sunset-sea-illustration"]},{"id":"flight","name":"飞机、柔绳、座板与太阳","start":0,"end":21500,"time":"0—21.5秒","detail":"飞机减速放下绳索，座板入水托起握绳太阳；负重回升、滴水、收绳与巡航连续接续。","actions":["seat-water-lift","squash-bounce","advected-trail","sunset-airplane-illustration","sunset-swing-illustration","sunset-sun-illustration"]}],"layers":["sea","night","flight"],"playback_rate":2});
