/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 原生印刷图层与用户确认的快闪时钟；目录、独立动作共用绘制，不加载整张海报图片。 */
(function (global) {
  'use strict';
  const WIDTH = 1672, HEIGHT = 941, ART_BOTTOM = 654;
  const PAPER = '#efeada', INK = '#23241f', ORANGE = '#ee5427';
  const BURST_RATE = 40;
  const TIME_SAVED = 23 / 30 - 23 / BURST_RATE;
  const DURATION = 4.5 - TIME_SAVED - (23 / BURST_RATE - .45);
  const BRAND_START = 3.02 - TIME_SAVED - (23 / BURST_RATE - .45);
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const phase = (time, start, length) => clamp((time - start) / length);
  const easeOut = value => 1 - (1 - value) ** 4;
  const easeInOut = value => value < .5 ? 8 * value ** 4 : 1 - (-2 * value + 2) ** 4 / 2;
  const entrances = [
    { id: 'orange-plane', start: 0, duration: .34, x: 0, y: 740, rotation: -12 },
    { id: 'optical-arcs', start: .22, duration: .34, x: -850, y: -180, rotation: 0 },
    { id: 'black-plane', start: .48, duration: .30, x: 550, y: -420, rotation: 8 },
    { id: 'diagonal-lines', start: 1.08, duration: .30, x: 420, y: -420, rotation: 0 },
    { id: 'right-stipple', start: 1.27, duration: .29, x: 470, y: 0, rotation: 0 },
    { id: 'vertical-lines', start: 1.45, duration: .28, x: 0, y: 530, rotation: 0 },
    { id: 'left-stipple', start: 1.63, duration: .27, x: -320, y: 190, rotation: 0 }
  ];
  // Borrowed rhythm from catalog/effects/transition.js: hard cuts every 4–5 frames at 30 fps.
  // Five print arrangements run at 40 frames per second; small cutouts change every four frames.
  const BURST_START = 2.14, BURST_END = BURST_START + 23 / BURST_RATE;
  const cuts = [0, 5, 10, 15, 19].map(frame => BURST_START + frame / BURST_RATE);
  const INTERMITTENT_START = 1.90, INTERMITTENT_END = INTERMITTENT_START + .45;
  const cutHash = n => {
    const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  };
  function intermittentCut(time) {
    const elapsed = time - INTERMITTENT_START;
    if (time < INTERMITTENT_START || time >= INTERMITTENT_END) return null;
    const progress = elapsed / .45;
    const frame = Math.floor((16 - .45 / 2 + elapsed) * 30);
    const active = progress > .05 && progress < .95;
    const reveal = Array.from({length:18}, (_, j) =>
      progress > .92 || cutHash(j * 3.7 + frame * .131) < progress * 1.25 - .12);
    const fragments = active ? Array.from({length:7}, (_, k) => ({
      x: cutHash(frame + k) - 200 / 1920,
      y: cutHash(frame * 2 + k),
      width: (200 + cutHash(frame * 3 + k) * 700) / 1920,
      height: (6 + cutHash(k + frame * 5) * 40) / 1080
    })) : [];
    return {frame, active, reveal, fragments};
  }
  function samplePrintBurst(time) {
    const burst = time >= BURST_START && time < BURST_END ? cuts.filter(at => time >= at).length - 1 : -1;
    return {burst, cutout: burst >= 0 ? Math.floor((time - BURST_START) * BURST_RATE / 4 + 1e-8) % 6 : -1};
  }
  function sample(value) {
    const time = clamp(Number.isFinite(value) ? value : 0, 0, DURATION);
    const states = {};
    for (const entrance of entrances) {
      const progress = easeOut(phase(time, entrance.start, entrance.duration));
      states[entrance.id] = {
        visible: time > entrance.start,
        x: entrance.x * (1 - progress), y: entrance.y * (1 - progress),
        rotation: entrance.rotation * (1 - progress)
      };
    }
    const settle = easeInOut(phase(time, INTERMITTENT_END, .27));
    const words = [easeOut(phase(time, BRAND_START, .35)), easeOut(phase(time, BRAND_START + .11, .40))];
    states.brand = { visible: time > BRAND_START, words };
    return {
      time, states,
      scene: {
        zoom: 1 + (941 / 654 - 1) * (1 - settle),
        rotation: -90 * (1 - easeInOut(phase(time, .78, .34))),
        burst: -1, cutout: -1,
        bandCut: intermittentCut(time)
      }
    };
  }

  function createPainter(canvas, ids, withBrand) {
    const doc = canvas.ownerDocument, buffers = [];
    const context = canvas.getContext('2d', { alpha: false });
  function random(seed) {
    return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  }
  function surface(width, height) {
    const element = doc.createElement('canvas');
    buffers.push(element);
    element.width = width;
    element.height = height;
    return element;
  }
  function path(draw) {
    const shape = new doc.defaultView.Path2D();
    draw(shape);
    return shape;
  }

  // Grain is generated once from fixed seeds and remains attached to each printed plane.
  function grain(seed, light) {
    const tile = surface(512, 512), ctx = tile.getContext('2d');
    const pixels = ctx.createImageData(512, 512), r = random(seed);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const value = light ? 249 : 48;
      pixels.data[i] = value;
      pixels.data[i + 1] = light ? 244 : 44;
      pixels.data[i + 2] = light ? 228 : 35;
      pixels.data[i + 3] = Math.floor(r() ** 3 * (light ? 55 : 30));
    }
    ctx.putImageData(pixels, 0, 0);
    return tile;
  }
  const darkGrain = grain(38479, false), lightGrain = grain(720193, true);

  function printTexture(ctx, strength = 1) {
    ctx.save();
    ctx.globalAlpha = strength;
    ctx.fillStyle = ctx.createPattern(lightGrain, 'repeat');
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = strength * .6;
    ctx.fillStyle = ctx.createPattern(darkGrain, 'repeat');
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }

  const orangeShape = path(p => {
    p.moveTo(814, -2);
    p.lineTo(1070, -2);
    p.bezierCurveTo(1056, 160, 1019, 309, 913, 455);
    p.bezierCurveTo(836, 559, 739, 618, 619, 655);
    p.lineTo(294, 655);
    p.bezierCurveTo(316, 498, 376, 342, 516, 256);
    p.bezierCurveTo(664, 163, 798, 181, 998, 182);
    p.closePath();
  });
  const blackShape = path(p => {
    p.moveTo(1069, -2);
    p.lineTo(1527, -2);
    p.lineTo(1172, 347);
    p.lineTo(1024, 205);
    p.bezierCurveTo(1049, 125, 1060, 50, 1069, -2);
    p.closePath();
  });
  const diagonalShape = path(p => {
    p.moveTo(1024, 190);
    p.lineTo(1179, 341);
    p.lineTo(865, 655);
    p.lineTo(614, 655);
    p.closePath();
  });
  const rightCircle = path(p => p.ellipse(1719, 336, 330, 322, 0, 0, Math.PI * 2));
  const leftCircle = path(p => p.ellipse(-12, 719, 250, 254, 0, 0, Math.PI * 2));

  function stipple(ctx, shape, box, seed, tone) {
    const [x, y, width, height] = box;
    const tile = surface(width, height), local = tile.getContext('2d');
    const pixels = local.createImageData(width, height), r = random(seed);
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const i = (row * width + col) * 4;
        const pressure = tone(col / width, row / height);
        const ink = r() < pressure;
        const shade = ink ? 29 + r() * 65 : 225 + r() * 22;
        pixels.data[i] = shade;
        pixels.data[i + 1] = shade - 1;
        pixels.data[i + 2] = shade - (ink ? 5 : 14);
        pixels.data[i + 3] = 255;
      }
    }
    local.putImageData(pixels, 0, 0);
    ctx.save();
    ctx.clip(shape);
    ctx.drawImage(tile, x, y);
    ctx.restore();
    tile.width = tile.height = 1;
  }

  const layerDefinitions = [
    {
      id: 'left-stipple', label: '左下网点圆面', pivot: [0, 719],
      paint(ctx) { stipple(ctx, leftCircle, [0, 460, 240, 200], 37811, (x, y) => .23 + .19 * y + .11 * x); }
    },
    {
      id: 'diagonal-lines', label: '斜向细线', pivot: [896, 452],
      paint(ctx) {
        ctx.save();
        ctx.clip(diagonalShape);
        ctx.strokeStyle = INK;
        ctx.lineWidth = .95;
        ctx.beginPath();
        for (let x = 200; x < 1250; x += 4.15) {
          ctx.moveTo(x, 664);
          ctx.lineTo(x + 675, -66);
        }
        ctx.stroke();
        ctx.restore();
      }
    },
    {
      id: 'orange-plane', label: '橙色曲面', pivot: [698, 320],
      paint(ctx) {
        ctx.save();
        ctx.clip(orangeShape);
        ctx.fillStyle = ORANGE;
        ctx.fillRect(0, 0, WIDTH, ART_BOTTOM);
        printTexture(ctx, 1.05);
        ctx.restore();
      }
    },
    {
      id: 'black-plane', label: '黑色斜面', pivot: [1245, 150],
      paint(ctx) {
        ctx.save();
        ctx.clip(blackShape);
        ctx.fillStyle = INK;
        ctx.fillRect(0, 0, WIDTH, ART_BOTTOM);
        printTexture(ctx, .7);
        ctx.restore();
      }
    },
    {
      id: 'right-stipple', label: '右侧网点圆面', pivot: [1719, 336],
      paint(ctx) {
        stipple(ctx, rightCircle, [1385, 10, 287, 650], 75121,
          (x, y) => Math.min(.94, .19 + .53 * y ** 1.4 + .12 * x));
      }
    },
    {
      id: 'vertical-lines', label: '右侧疏密竖纹', pivot: [1418, 494],
      paint(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(1168, 334, 504, 320);
        ctx.clip();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.65;
        ctx.beginPath();
        for (let x = 1170; x < WIDTH + 10; x += 10.9) {
          ctx.moveTo(x, 334);
          ctx.lineTo(x, 654);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(1168, 334);
        ctx.lineTo(WIDTH, 334);
        ctx.lineTo(WIDTH, 654);
        ctx.lineTo(1550, 654);
        ctx.closePath();
        ctx.clip();
        ctx.lineWidth = 8.9;
        ctx.beginPath();
        for (let x = 1170; x < WIDTH + 10; x += 10.9) {
          ctx.moveTo(x, 334);
          ctx.lineTo(x, 654);
        }
        ctx.stroke();
        printTexture(ctx, .35);
        ctx.restore();
      }
    },
    {
      id: 'optical-arcs', label: '左上弧形线纹', pivot: [323, -10],
      paint(ctx) {
        ctx.strokeStyle = INK;
        for (let i = 0; i <= 64; i++) {
          ctx.beginPath();
          ctx.ellipse(80 + i * 3.8, -6 - i * .06, 10 + i * 7.4, 10 + i * 8.55, 0, 0, Math.PI * 2);
          ctx.lineWidth = .9 + 2.25 * Math.min(1, i / 20);
          ctx.stroke();
        }
      }
    }
  ];

  const layers = layerDefinitions.filter(layer => ids.includes(layer.id));
  const paper = surface(WIDTH, HEIGHT), paperContext = paper.getContext('2d');
  paperContext.fillStyle = PAPER;
  paperContext.fillRect(0, 0, WIDTH, HEIGHT);
  paperContext.globalAlpha = .42;
  paperContext.fillStyle = paperContext.createPattern(darkGrain, 'repeat');
  paperContext.fillRect(0, 0, WIDTH, HEIGHT);
  for (const layer of layers) {
    layer.surface = surface(WIDTH, ART_BOTTOM);
    layer.paint(layer.surface.getContext('2d'));
  }

  const brand = withBrand ? surface(WIDTH, HEIGHT) : null, brandContext = brand?.getContext('2d');
  let fontReady = false, fontSize = 0, wordSplit = 0;
  function prepareBrand() {
    const text = 'WISE MOTION';
    brandContext.font = '700 300px Oswald';
    const sample = brandContext.measureText(text);
    const sampleWidth = sample.actualBoundingBoxLeft + sample.actualBoundingBoxRight;
    const sampleHeight = sample.actualBoundingBoxAscent + sample.actualBoundingBoxDescent;
    fontSize = 300 * Math.min(1590 / sampleWidth, 250 / sampleHeight);
    brandContext.font = `700 ${fontSize}px Oswald`;
    brandContext.textBaseline = 'alphabetic';
    const metrics = brandContext.measureText(text);
    const width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    const x = (WIDTH - width) / 2 + metrics.actualBoundingBoxLeft;
    const baseline = 917 - metrics.actualBoundingBoxDescent;
    wordSplit = x + brandContext.measureText('WISE ').width;
    brandContext.fillStyle = INK;
    brandContext.fillText(text, x, baseline);
    brandContext.globalCompositeOperation = 'source-atop';
    brandContext.globalAlpha = .42;
    brandContext.fillStyle = brandContext.createPattern(lightGrain, 'repeat');
    brandContext.fillRect(0, ART_BOTTOM, WIDTH, HEIGHT - ART_BOTTOM);
    brandContext.globalCompositeOperation = 'source-over';
    brandContext.globalAlpha = 1;
    fontReady = true;
  }

  const layerById = new Map(layers.map(layer => [layer.id, layer]));
  // The short cuts reuse the poster's own print layers, never replacing its palette.
  const burstLayouts = [
    [['optical-arcs', 820, 580, 180, .9], ['vertical-lines', -1170, 400, 0, 1]],
    [['diagonal-lines', -650, 400, 0, 1.7], ['orange-plane', 580, 560, 90, .65], ['optical-arcs', 130, 820, 180, 1]],
    [['vertical-lines', -780, 290, 90, 1.8], ['right-stipple', -1400, 580, 0, 1.4], ['optical-arcs', 1050, 500, 180, 1.1]],
    [['orange-plane', -300, 500, 180, 1], ['optical-arcs', 900, 850, 180, 1.5], ['vertical-lines', -600, 180, 90, 1.4]],
    [['vertical-lines', -1120, 600, 0, 1.3], ['diagonal-lines', 300, 350, 0, 2], ['optical-arcs', 50, 620, 0, 1.2]]
  ];
  // 纸色缺口切进已成形的印刷层；36处小形状每组显示24处，六组每四格交换一次，快闪结束后完全恢复。
  const cutoutPositions = [
    [90,72],[215,98],[350,92],[455,136],[574,142],
    [140,244],[274,260],[401,291],[505,343],[604,319],
    [713,236],[827,228],[915,177],[1008,106],[1138,90],
    [1280,71],[1380,92],[1269,207],[1175,239],[1087,285],
    [438,475],[536,521],[650,511],[744,471],[843,530],
    [912,416],[1013,470],[1042,583],
    [1212,392],[1334,419],[1484,397],[1603,365],
    [1290,548],[1432,565],[1573,542],[90,550]
  ];
  const cutoutShapes = cutoutPositions.map(([x,y], i) => {
    const kind = ['quarter','slash','circle','bars','steps','half'][i % 6];
    const w = [54,64,58,70,52,62][i % 6];
    return {kind, x, y, w, h: ['half','slash','bars'].includes(kind) ? w * .52 : w, rotation:[-16,8,0,24,-12,18][i % 6]};
  });
  const cutoutPatterns = Array.from({length:6}, (_, pattern) =>
    Array.from({length:24}, (_, i) => (i * 7 + pattern * 5) % cutoutShapes.length));
  // 原始几何与缺口共用六拍：每拍暂隐两至三个图层，保留其余构图，结束后全部复原。
  const blinkGroups = [
    ['optical-arcs', 'right-stipple'],
    ['orange-plane', 'diagonal-lines', 'left-stipple'],
    ['black-plane', 'vertical-lines'],
    ['optical-arcs', 'orange-plane', 'right-stipple'],
    ['black-plane', 'diagonal-lines', 'left-stipple'],
    ['vertical-lines', 'orange-plane']
  ];
  function cutoutPath(ctx, shape) {
    const {kind, x, y, w, h, rotation} = shape;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation * Math.PI / 180);
    if (kind === 'quarter') {
      ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.ellipse(0, 0, w, h, 0, 0, Math.PI / 2); ctx.closePath();
    } else if (kind === 'circle' || kind === 'half') {
      ctx.moveTo(w / 2, 0); ctx.ellipse(0, 0, w / 2, h / (kind === 'circle' ? 2 : 1), 0, 0, kind === 'circle' ? Math.PI * 2 : Math.PI); ctx.closePath();
    } else if (kind === 'bars') {
      for (let i = 0; i < 3; i++) ctx.rect(i * 12, i * h / 3, w - i * 24, 9);
    } else {
      const points = kind === 'slash' ? [[.28,0],[1,0],[.72,1],[0,1]] : [[0,0],[.66,0],[.66,.33],[1,.33],[1,1],[.33,1],[.33,.66],[0,.66]];
      ctx.moveTo(points[0][0] * w, points[0][1] * h);
      for (const [px, py] of points.slice(1)) ctx.lineTo(px * w, py * h);
      ctx.closePath();
    }
    ctx.restore();
  }
  const bandCutPoses = {
    'orange-plane': {x:-38, y:26, rotation:-8, scale:1.075},
    'optical-arcs': {x:48, y:12, rotation:12, scale:1.055},
    'black-plane': {x:-30, y:20, rotation:7, scale:1.035},
    'diagonal-lines': {x:55, y:-18, rotation:-5, scale:1.04},
    'right-stipple': {x:-60, y:22, rotation:0, scale:1.08},
    'vertical-lines': {x:35, y:-16, rotation:5, scale:1.035},
    'left-stipple': {x:28, y:-22, rotation:0, scale:1.10}
  };
  function drawLayer(layer, state = {}) {
    if (state.visible === false || state.opacity === 0) return;
    context.save();
    context.globalAlpha = state.opacity ?? 1;
    context.translate(layer.pivot[0] + (state.x ?? 0), layer.pivot[1] + (state.y ?? 0));
    context.rotate((state.rotation ?? 0) * Math.PI / 180);
    const scale = state.scale ?? 1;
    context.scale(scale, scale);
    context.translate(-layer.pivot[0], -layer.pivot[1]);
    context.drawImage(layer.surface, 0, 0);
    context.restore();
  }
  // Defaults exactly reproduce the approved static layout; time is owned by motion.js.
  function render(states = {}, scene = {}, channels = {}) {
    context.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
    context.globalAlpha = 1;
    context.drawImage(paper, 0, 0);
    if (channels.burst !== false && Number.isInteger(scene.burst) && burstLayouts[scene.burst]) {
      for (const [id, x, y, rotation, scale] of burstLayouts[scene.burst]) {
        drawLayer(layerById.get(id), { x, y, rotation, scale });
      }
    }
    const zoom = scene.zoom ?? 1;
    context.save();
    context.beginPath();
    context.rect(0, 0, WIDTH, Math.min(HEIGHT, ART_BOTTOM * zoom));
    context.clip();
    context.translate(WIDTH / 2, ART_BOTTOM / 2 * zoom);
    context.scale(zoom, zoom);
    context.rotate((scene.rotation ?? 0) * Math.PI / 180);
    context.translate(-WIDTH / 2, -ART_BOTTOM / 2);
    const hiddenLayers = channels.burst === false ? [] : blinkGroups[scene.cutout] ?? [];
    const bandCut = channels.burst !== false && scene.bandCut?.active ? scene.bandCut : null;
    for (const layer of layers) {
      if (channels.geometry !== false && !hiddenLayers.includes(layer.id)) drawLayer(layer, bandCut ? bandCutPoses[layer.id] : states[layer.id]);
    }
    context.restore();
    if (bandCut) {
      const cutHeight = Math.min(HEIGHT, ART_BOTTOM * zoom);
      context.save(); context.beginPath();
      for (let j = 0; j < 18; j++) {
        if (bandCut.reveal[j]) context.rect(0, j * cutHeight / 18, WIDTH, cutHeight * 61 / 1080);
      }
      context.clip(); context.drawImage(paper, 0, 0);
      // 切回的原图与错位图共用满幅坐标，避免闪切期间提前露出下方文字区。
      context.translate(WIDTH / 2, ART_BOTTOM / 2 * zoom);
      context.scale(zoom, zoom);
      context.rotate((scene.rotation ?? 0) * Math.PI / 180);
      context.translate(-WIDTH / 2, -ART_BOTTOM / 2);
      for (const layer of layers) if (channels.geometry !== false) drawLayer(layer, states[layer.id]);
      context.restore();
      context.save(); context.beginPath(); context.rect(0, 0, WIDTH, cutHeight); context.clip();
      bandCut.fragments.forEach((fragment, k) => {
        context.fillStyle = [ORANGE, INK, PAPER][k % 3];
        context.globalAlpha = k % 3 === 2 ? .5 : .55;
        context.fillRect(fragment.x * WIDTH, fragment.y * cutHeight, fragment.width * WIDTH, fragment.height * cutHeight);
      });
      context.restore();
    }
    if (channels.burst !== false && Number.isInteger(scene.cutout) && cutoutPatterns[scene.cutout]) {
      context.save(); context.beginPath();
      for (const index of cutoutPatterns[scene.cutout]) cutoutPath(context, cutoutShapes[index]);
      context.clip(); context.drawImage(paper, 0, 0); context.restore();
    }
    if (fontReady && channels.brand !== false && states.brand?.visible !== false) {
      context.save();
      context.globalAlpha = states.brand?.opacity ?? 1;
      context.translate(0, scene.brandOffsetY ?? 0);
      const words = states.brand?.words;
      if (words && words.some(value => value < 1)) {
        for (let i = 0; i < 2; i++) {
          if (words[i] <= 0) continue;
          context.save();
          context.beginPath();
          context.rect(i ? wordSplit : 0, ART_BOTTOM, i ? WIDTH - wordSplit : wordSplit, HEIGHT - ART_BOTTOM);
          context.clip();
          context.drawImage(brand, 0, (1 - words[i]) * (HEIGHT - ART_BOTTOM));
          context.restore();
        }
      } else context.drawImage(brand, states.brand?.x ?? 0, states.brand?.y ?? 0);
      context.restore();
    }
  }

    return {
      render, prepareBrand,
      destroy() { for (const buffer of buffers) buffer.width = buffer.height = 1; buffers.length = 0; }
    };
  }

  const geometryIds = ['left-stipple', 'diagonal-lines', 'orange-plane', 'black-plane', 'right-stipple', 'vertical-lines', 'optical-arcs'];
  function make(root, K, definition, part = 'composition') {
    const doc = root.ownerDocument, win = doc.defaultView, canvas = doc.createElement('canvas');
    canvas.width = definition.poster_only ? 640 : WIDTH;
    canvas.height = definition.poster_only ? 360 : HEIGHT;
    Object.assign(canvas.style, {position:'absolute', inset:'0', width:'640px', height:'360px'});
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', definition.name || '几何旋转与海报成形');
    const ids = part === 'brand' ? [] : geometryIds;
    const withBrand = part === 'brand' || part === 'composition';
    canvas.dataset.parts = ids.join(' ');
    canvas.dataset.typography = withBrand ? 'Oswald Bold · WISE MOTION' : '';
    canvas.dataset.part = part;
    root.dataset.art = 'original';
    root.style.background = PAPER;
    root.replaceChildren(canvas);
    const markers = new Map();
    if (part === 'composition') for (const id of ['geometry', 'burst', 'brand']) {
      const marker = doc.createElement('span'); marker.hidden = true; marker.dataset.layer = id;
      root.append(marker); markers.set(id, marker);
    }
    let dead = false, painter = null, previous = 0, cancelPreparation;
    const cancelled = new Promise(resolve => { cancelPreparation = resolve; });
    function render(ms) {
      if (dead) return;
      if (!Number.isFinite(ms)) throw new TypeError('时间必须是有限数字');
      previous = clamp(ms, 0, definition.duration_ms);
      const t = previous / 1000;
      let pose;
      if (part === 'burst') {
        pose = {states:{brand:{visible:false}}, scene:samplePrintBurst(t + BURST_START - .15)};
      } else if (part === 'intermittent') {
        pose = {states:{brand:{visible:false}}, scene:{zoom:HEIGHT / ART_BOTTOM, rotation:0, bandCut:intermittentCut(t + INTERMITTENT_START - .15)}};
      } else if (part === 'brand') {
        const frame = sample(t + BRAND_START - .15);
        pose = {states:{brand:frame.states.brand}, scene:{brandOffsetY:-320}};
      } else {
        pose = sample(part === 'geometry' && t >= INTERMITTENT_START ? t + .45 : t);
        if (part === 'geometry') { pose.scene.bandCut = null; pose.states.brand.visible = false; }
      }
      canvas.dataset.sourceTime = String(t);
      canvas.dataset.burst = String(pose.scene.burst ?? -1);
      canvas.dataset.cutout = String(pose.scene.cutout ?? -1);
      canvas.dataset.bandFrame = String(pose.scene.bandCut?.active ? pose.scene.bandCut.frame : -1);
      const channels = Object.fromEntries([...markers].map(([id, node]) => [id, !node.hasAttribute('data-composition-hidden')]));
      painter?.render(pose.states, pose.scene, channels);
    }
    const observer = markers.size && win?.MutationObserver ? new win.MutationObserver(() => render(previous)) : null;
    observer?.observe(root, {subtree:true, attributes:true, attributeFilter:['data-composition-hidden']});
    const preparation = Promise.resolve().then(async () => {
      if (dead) return;
      if (!canvas.getContext('2d')) {
        const notice = doc.createElement('span'); notice.setAttribute('role','status');
        notice.textContent = '当前环境无法绘制画面，请使用支持画布的浏览器。'; root.append(notice); return;
      }
      // Wait for the real bundled face before measuring; the project and catalogue font bytes are identical.
      if (withBrand) {
        const fonts = await doc.fonts.load('700 300px Oswald', 'WISE MOTION');
        if (!fonts.length) throw new Error('Oswald Bold 字体加载失败，请重新选择该效果。');
      }
      if (dead) return;
      painter = createPainter(canvas, ids, withBrand);
      if (withBrand) painter.prepareBrand();
      render(previous);
    });
    render.ready = Promise.race([preparation, cancelled]);
    render.frameRate = 60;
    render.destroy = (preserve = false) => {
      if (dead) return;
      dead = true; cancelPreparation(); observer?.disconnect(); painter?.destroy(); painter = null;
      for (const marker of markers.values()) marker.remove(); markers.clear();
      if (!preserve) { canvas.width = canvas.height = 1; root.replaceChildren(); }
    };
    render(0);
    return render;
  }
  const F = global.MotionFactories = global.MotionFactories || {};
  F['geometry-turn-build'] = (root, K, definition) => make(root, K, definition, 'geometry');
  F['geometric-poster-sequence'] = (root, K, definition) => make(root, K, definition);
  F['geometry-turn-build'].requiresPreparation = F['geometric-poster-sequence'].requiresPreparation = true;
  F['geometric-poster-sequence'].breakdown = [
    {id:'geometry', name:'图层进入、旋转与闪切后上移', actions:['geometry-turn-build'], start:0, end:2620, time:'0–1.90秒；2.35–2.62秒', detail:'七个印刷图层错峰进入；0.78–1.12秒共同旋转90度，继续叠入网点与线纹。1.90秒全部进入后维持满幅，等闪切结束，2.35–2.62秒才缩回并上移至海报上部。'},
    {id:'burst', name:'满幅横带间歇闪切', actions:['glitch-band-transition'], start:INTERMITTENT_START*1000, end:INTERMITTENT_END*1000, time:'1.90–2.35秒', detail:'图形暂时错位，十八个横向区域按每秒30格的固定取值间歇切回原构图，同时出现七条短碎带；0.45秒后完全复原，才开始上移。'},
    {id:'brand', name:'同字号标题升入', actions:['mask-stagger-text'], start:BRAND_START*1000, end:DURATION*1000, time:'2.70–4.18秒', detail:'WISE与MOTION使用Oswald Bold，同字号、同一基线；间隔0.11秒升入，完成后保持约0.97秒。'}
  ];
  global.WiseGeometricPoster = Object.freeze({sample, make, duration:DURATION, burstStart:INTERMITTENT_START, burstEnd:INTERMITTENT_END, brandStart:BRAND_START});
})(globalThis);
