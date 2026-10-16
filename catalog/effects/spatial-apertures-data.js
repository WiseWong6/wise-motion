/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function (global) {
  'use strict';
  const clamp = p => Math.max(0, Math.min(1, p));
  const curves = {linear: p => p, inCubic: p => p ** 3, outCubic: p => 1 - (1 - p) ** 3};
  function tween(frame, start, end, from, to, easing = 'linear') {
    const p = end === start ? Number(frame >= end) : clamp((frame - start) / (end - start));
    const curve = typeof easing === 'function' ? easing : curves[easing];
    if (!curve) throw new RangeError('未知缓动：' + easing);
    return from + (to - from) * curve(p);
  }
  function key(frame, points) {
    if (!points.length) throw new RangeError('关键点不能为空');
    if (frame <= points[0][0]) return points[0][1];
    for (let i = 1; i < points.length; i++) if (frame <= points[i][0])
      return tween(frame, points[i - 1][0], points[i][0], points[i - 1][1], points[i][1], points[i][2] ?? 'linear');
    return points.at(-1)[1];
  }
  // Solve x(t)=p by bounded bisection, then evaluate y(t). No wall clock or prior frame.
  function bezier(p, x1, y1, x2, y2) {
    p = clamp(p); if (p === 0 || p === 1) return p;
    const value = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
    let lo = 0, hi = 1;
    for (let i = 0; i < 32; i++) {const t = (lo + hi) / 2; if (value(t, x1, x2) < p) lo = t; else hi = t;}
    return value((lo + hi) / 2, y1, y2);
  }
  const settle = p => bezier(p, .16, 1, .3, 1);
  const wipeEase = p => bezier(p, .45, 0, .2, 1);
  const rect = (cx, cy, width, height, angle = 0) => ({type: 'rect', cx, cy, width, height, angle});
  const full = () => ({phrase: 'full', shapes: [rect(960, 540, 1924, 1084)]});
  const rotation = 28 * Math.PI / 180;
  const crossOpenWidth = 2 * Math.max(...[[-2,-2],[1922,-2],[-2,1082],[1922,1082]].map(([x,y]) =>
    Math.abs((x - 1190) * Math.sin(rotation) + (y - 450) * Math.cos(rotation)))) + 4;
  function windowState(frame) {
    if (!Number.isFinite(frame)) throw new TypeError('帧必须为有限数字');
    if (frame >= 330) return full();
    if (frame >= 158 && frame < 248) {
      const cx = key(frame, [[158,1230],[180,1230],[220,1190]]);
      const cy = key(frame, [[158,540],[180,540],[220,450]]);
      const stroke = key(frame, [[158,1084],[168,600,'inCubic'],[170,600],[179,520],[202,520],[240,crossOpenWidth,p => p*p],[248,crossOpenWidth]]);
      const angle = key(frame, [[158,0],[170,0],[179,-28,'outCubic'],[248,-28]]);
      return {phrase: 'moving-cross-through-tool', shapes: [rect(cx,cy,3600,stroke,angle),rect(cx,cy,stroke,3600,angle)]};
    }
    if (frame >= 280 && frame < 330) {
      const side = key(frame, [[280,720],[300,1300],[320,1900],[330,2132]]);
      return {phrase: 'one-macro-diamond-release', shapes: [rect(960,540,side,side,45)]};
    }
    const f = Math.max(0, frame);
    if (f < 22) return {phrase: 'opening-columns', shapes: [
      rect(320,540,644,tween(f,0,12,0,1084,'outCubic')),
      rect(960,540,644,tween(f,4,17,0,1084,'outCubic')),
      rect(1600,540,644,tween(f,8,22,0,1084,'outCubic')),
    ]};
    return full();
  }
  const clips = {
    'continuous-diagonal': {start:158,frames:90},
    'diamond-aperture-release': {start:280,frames:60},
    'vertical-column-rise': {start:0,frames:23},
    'full-frame-blueprint': {start:40,frames:100},
    'paced-overlap': {start:372,frames:17},
    'aligned-silhouette': {start:420,frames:56},
    'overlap-copy-handoff': {start:460,frames:21},
    'spatial-mechanical-sequence': {start:0,frames:540},
  };
  function frameFor(mode, ms) {
    if (!Number.isFinite(ms)) throw new TypeError('时间必须为有限数字');
    const c = clips[mode]; if (!c) throw new Error('未知空间动作：' + mode);
    return c.start + Math.max(0, Math.min(c.frames - 1, Math.floor(ms * 30 / 1000 + 1e-9)));
  }
  function stateFor(mode, ms) {
    const frame = frameFor(mode, ms), local = frame - clips[mode].start;
    if (mode === 'paced-overlap') return {frame, local, phrase: mode,
      shapes: [{type:'circle',cx:1430,cy:540,r:tween(local,0,16,0,1640,settle)}]};
    if (mode === 'overlap-copy-handoff') {
      const left = tween(local,0,16,1920,0,wipeEase);
      return {frame, local, phrase: mode, shapes:[rect((left+1920)/2,540,1920-left,1080)],
        outgoingCopy:0, incomingCopy:tween(local,12,20,0,1)};
    }
    return {frame, local, ...windowState(frame)};
  }
  const drawingFlashes = [[48,56],[68,76]];
  const isDrawingFlash = ms => drawingFlashes.some(([a,b]) => {const f=frameFor('full-frame-blueprint',ms);return f>=a&&f<b;});
  // Native-image anchors and rotated, scaled alpha extents are appended below.
  const formItems = [
  {
    "id": "left",
    "src": "watch-front.png",
    "sourceSize": [
      1800,
      2400
    ],
    "width": 700,
    "angle": -11,
    "anchorSource": [
      923.5110279969489,
      1310.6218279235932
    ],
    "transformOriginPercent": [
      51.30616822205272,
      54.60924283014972
    ],
    "alphaExtents": {
      "minX": -233.26061330163924,
      "minY": -357.4983831234796,
      "maxX": 233.61585734886276,
      "maxY": 240.02119563232188
    }
  },
  {
    "id": "middle",
    "src": "watch-angle.png",
    "sourceSize": [
      1800,
      2400
    ],
    "width": 720,
    "angle": 0,
    "anchorSource": [
      941.0588769120457,
      1309.1656072317098
    ],
    "transformOriginPercent": [
      52.281048717335864,
      54.54856696798791
    ],
    "alphaExtents": {
      "minX": -212.02355076481825,
      "minY": -366.46624289268397,
      "maxX": 213.17644923518174,
      "maxY": 247.53375710731606
    }
  },
  {
    "id": "right",
    "src": "watch-front.png",
    "sourceSize": [
      1800,
      2400
    ],
    "width": 700,
    "angle": 11,
    "anchorSource": [
      923.5110279969489,
      1310.6218279235932
    ],
    "transformOriginPercent": [
      51.30616822205272,
      54.60924283014972
    ],
    "alphaExtents": {
      "minX": -230.10453343360882,
      "minY": -344.1541164926891,
      "maxX": 230.86695520427944,
      "maxY": 240.6239133996984
    }
  }
];
  function layoutSilhouettes(items = formItems, {canvasWidth=1920, margin=96, centerY=710, offsetY=0} = {}) {
    if (!Array.isArray(items) || items.length < 2) throw new RangeError('至少需要两个轮廓');
    if (![canvasWidth,margin,centerY,offsetY].every(Number.isFinite) || canvasWidth<=0 || margin<0) throw new RangeError('画板参数无效');
    for (const item of items) {
      if (!(item.width>0) || item.sourceSize?.length!==2 || !item.sourceSize.every(n=>Number.isFinite(n)&&n>0) ||
          item.anchorSource?.length!==2 || !item.anchorSource.every(Number.isFinite) || !Number.isFinite(item.angle) ||
          !['minX','minY','maxX','maxY'].every(k=>Number.isFinite(item.alphaExtents?.[k])) ||
          item.alphaExtents.maxX<=item.alphaExtents.minX || item.alphaExtents.maxY<=item.alphaExtents.minY)
        throw new RangeError('需要有效的显示尺寸、主体锚点和旋转后轮廓边界');
    }
    const widths = items.map(x => x.alphaExtents.maxX - x.alphaExtents.minX);
    const gap = (canvasWidth - 2 * margin - widths.reduce((a,b)=>a+b,0)) / (items.length - 1);
    if (gap < 0) throw new RangeError('主体轮廓超出可用画幅');
    let visibleLeft = margin;
    return items.map((item,i) => {
      const b=item.alphaExtents, scale=item.width/item.sourceSize[0], cx=visibleLeft-b.minX, cy=centerY+offsetY;
      const result={...item,gap,centerX:cx,centerY:cy,left:cx-item.anchorSource[0]*scale,top:cy-item.anchorSource[1]*scale,
        transformOriginPercent:item.anchorSource.map((n,j)=>100*n/item.sourceSize[j]),
        bounds:{left:visibleLeft,right:visibleLeft+widths[i],top:cy+b.minY,bottom:cy+b.maxY}};
      visibleLeft += widths[i]+gap;return result;
    });
  }
  const formOffset = frame => tween(frame,0,12,48,0,settle) + tween(frame,0,55,0,-16);
  const getAlignedFormLayout = (offsetY=0) => layoutSilhouettes(formItems,{offsetY});
  const sequence = {"id":"spatial-mechanical-sequence","kind":"composition","duration_ms":18000,"source":{"frame_cache":{"video":"catalog/assets/mechanical-pulse/movie.mp4","start_frame":0,"frames":540,"fps":30,"width":1280,"height":720,"poster":"catalog/assets/mechanical-pulse/posters/F0300.jpg"}}};
  const breakdown = [{"id":"Opening","name":"三列开窗","start":0.0,"end":1333.3333333333333,"time":"0.00–1.33秒","detail":"三列高度错峰展开，后方标题与完整产品上移。","actions":["three-column-aperture"]},{"id":"Board","name":"完整图纸双闪","start":1333.3333333333333,"end":4666.666666666667,"time":"1.33–4.67秒","detail":"陈列装配与两次各8帧的全幅同位图纸短闪。","actions":["rapid-cut","inventory-contour-fit"]},{"id":"Cross","name":"旋转斜十字跨镜","start":4666.666666666667,"end":9333.333333333334,"time":"4.67–9.33秒","detail":"十字先收窄后旋转，持续加宽穿过结构与工具换镜。","actions":["cross-aperture-turn","axial-layer-reseat","helical-screw-seat"]},{"id":"Macros","name":"一窗三镜","start":9333.333333333334,"end":11333.333333333334,"time":"9.33–11.33秒","detail":"45度方窗跨三段微距一次展开，每镜20帧。","actions":["diamond-aperture-release","barrel-stored-energy","meshed-gears-drive","balance-reciprocate"]},{"id":"Detail","name":"细节实景","start":11333.333333333334,"end":12933.333333333334,"time":"11.33–12.93秒","detail":"真实背景与阴影保留；下一个材质镜头提前16帧进入。","actions":["next-shot-preentry"]},{"id":"Material","name":"材质圆窗预入","start":12400.0,"end":14000.0,"time":"12.40–14.00秒","detail":"右偏圆窗16帧展开，竖幅原视频完整装入全高分栏。","actions":["next-shot-preentry"]},{"id":"Form","name":"轮廓等距同步升入","start":14000.0,"end":15866.666666666668,"time":"14.00–15.87秒","detail":"主体中心同高，可见轮廓等距，全组共用入场与持续上移。","actions":["fan-object-rise"]},{"id":"Finale","name":"矩窗与文案交接","start":15333.333333333334,"end":18000.0,"time":"15.33–18.00秒","detail":"旧主体在底层延续，新画面矩形展开16帧；新文案稍后出现，最后12帧淡出。","actions":["wipe"]}];
  global.WiseSpatialApertures = {sequence,breakdown,clamp,tween,key,bezier,settle,windowState,stateFor,frameFor,clips,
    drawingFlashes,isDrawingFlash,crossOpenWidth,formItems,layoutSilhouettes,formOffset,getAlignedFormLayout};
})(globalThis);
