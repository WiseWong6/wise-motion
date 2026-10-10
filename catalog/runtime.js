/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function (global) {
  'use strict';
  const factories = global.MotionFactories = global.MotionFactories || {};
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const mix = (a, b, p) => a + (b - a) * p;
  const ease = (p, name = 'outCubic') => {
    p = clamp(p);
    if (name === 'spring') return p === 1 ? 1 : 1 - Math.exp(-6 * p) * Math.cos(9 * p);
    return (global.anime.eases[name] || global.anime.eases.outCubic)(p);
  };
  const span = (t, a, b, name = 'linear') => ease((t - a) / (b - a), name);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function pose(el, {x = 0, y = 0, scale = 1, rotate = 0, ry = 0, z = 0, opacity = 1, blur = 0} = {}) {
    el.style.transform = `translate3d(${x}px,${y}px,${z}px) rotate(${rotate}deg) rotateY(${ry}deg) scale(${scale})`;
    el.style.opacity = String(clamp(opacity));
    el.style.filter = blur ? `blur(${blur}px)` : '';
  }
  function scene(root, html) {
    root.innerHTML = html;
    return {one: s => root.querySelector(s), all: s => [...root.querySelectorAll(s)]};
  }
  const tile = (title = '一个好想法', subtitle = '让表达更加清楚', extra = '') => `<div class="tile ${extra}"><span class="tile-symbol">✦</span><strong>${escape(title)}</strong><small>${escape(subtitle)}</small></div>`;
  const cardSet = (count = 4, cls = 'mini-card') => Array.from({length: count}, (_, i) => `<div class="${cls} tone-${i % 4}"><span class="tiny-mark">${String(i + 1).padStart(2, '0')}</span><strong>${['想法','内容','细节','结果','灵感'][i % 5]}</strong><i></i><i></i></div>`).join('');
  const curve = p => ({x: 320 + 210 * Math.sin(p * Math.PI * 2), y: 180 - 75 * Math.sin(p * Math.PI * 4)});
  // 640×360 画板中的实际字号；原图被等比缩小时，只补偿文字，不改变图形。
  const type = Object.freeze({micro:10, caption:12, body:16, title:24, subhead:32, heading:48, display:64});
  function textSize(role, scale = 1) {
    if (!Number.isFinite(scale) || scale <= 0 || (typeof role === 'number' && (!Number.isFinite(role) || role <= 0))) throw new TypeError('字号角色或缩放比例无效');
    if (typeof role === 'number') {
      // 粒子字形中的微小数字是图形的一部分，保持其尺寸。
      if (role < type.micro) return role / scale;
      role = Object.keys(type).reduce((a,b) => Math.abs(type[a]-role) <= Math.abs(type[b]-role) ? a : b);
    }
    if (!Object.hasOwn(type, role)) throw new TypeError('字号角色或缩放比例无效');
    return type[role] / scale;
  }
  function prepareStage(stage, definition) {
    stage.dataset.effect = definition.id;
    if (definition.variant_id) stage.dataset.variant = definition.variant_id;
    for (const [role,size] of Object.entries(type)) stage.style.setProperty('--type-'+role, size+'px');
    // 以稳定标识判断，独立导出的定义没有目录分类；缩略图与主预览保持一致。
    if ((definition.source?.factory || definition.id).endsWith('-illustration')) stage.dataset.art = 'original';
  }
  // 同一个动作的不同原作示例，共用目录入口，各自保留时长和绘制。
  function resolveVariant(definition, variantId = definition.variant_id) {
    if (!definition.variants?.length) return definition;
    const variant = definition.variants.find(item => item.id === variantId) || definition.variants[0];
    const {id, label, ...details} = variant;
    return {...definition, ...details, variant_id:id, variant_name:label};
  }
  function createRenderer(stage, definition) {
    definition = resolveVariant(definition);
    if (definition.content !== undefined) definition = global.MotionContent.withContent(definition);
    const factory = factories[definition.source?.factory || definition.id];
    if (!factory) throw new Error('缺少效果源码：' + definition.id);
    const timing = definition.timing;
    if (!timing) return factory(stage, kit, definition);
    // 原画面的相对顺序、回弹和逐字关系不变，只把设计时钟对应到目录的统一节奏。
    const source = {...definition, duration_ms:timing.source_duration_ms, preview_ms:timing.source_preview_ms};
    const render = factory(stage, kit, source);
    const rate = (timing.source_end_ms - timing.source_start_ms) / (timing.end_ms - timing.start_ms);
    const clock = ms => {
      const p = clamp((ms - timing.start_ms) / (timing.end_ms - timing.start_ms));
      if (p === 0) return timing.source_start_ms;
      if (p === 1) return timing.source_end_ms;
      // 收齐浮点末位，避免逐字、逐帧事件提前或推后一格。
      return Math.round((timing.source_start_ms + (timing.source_end_ms - timing.source_start_ms) * p) * 1e9) / 1e9;
    };
    const draw = (ms, state = {}) => {
      const time = clock(ms), elapsed = state.elapsed ?? ms;
      // 循环用累计时间保持连续位移；首轮入场不会在下一轮重播。
      render(time, {ease:state.ease || definition.default_ease, duration:source.duration_ms,
        elapsed:definition.loop ? elapsed * rate : clock(elapsed), playback:state.playback === true});
    };
    if (render.destroy) draw.destroy = preserve => render.destroy(preserve);
    if (render.ready) draw.ready = render.ready;
    if (render.frameRate !== undefined) draw.frameRate = render.frameRate;
    return draw;
  }
  function fit(root) {
    const stage = root.querySelector('.motion-stage');
    if (!stage) return;
    const box = root.getBoundingClientRect();
    const raw = Math.min(box.width / 640, box.height / 360) || 1;
    const dpr = global.devicePixelRatio || 1;
    const scale = Math.max(0.01, Math.floor(raw * 640 * dpr) / (640 * dpr));
    stage.style.transform = `translate(-50%,-50%) scale(${scale})`;
  }
  const slot = (definition, id, fallback) => definition?.content === undefined ? fallback : global.MotionContent.readSlot(definition, id, fallback);
  const textFont = text => /[^\x20-\x7e]/.test(text) ? 'Source Han Sans SC' : 'Oswald';
  function measureText(root, text, size, family, weight = 700) {
    const ctx = root.ownerDocument.createElement('canvas').getContext('2d');
    if (!ctx) throw new Error('无法测量自定义文字：需要画布环境');
    ctx.font = `${weight} ${size}px "${family}"`;
    return ctx.measureText(text).width;
  }
  function textReady(root, fonts, build) {
    const set = root.ownerDocument.fonts;
    if (!set) throw new Error('无法确认自定义文字的字体是否就绪');
    let painter, last, destroyed = false;
    const draw = (...args) => { last = args; if (painter && !destroyed) painter(...args); };
    draw.ready = Promise.all(fonts.map(async ({family, weight = 700, text}) => {
      const font = `${weight} 32px "${family}"`;
      const loaded = await set.load(font, text || 'A');
      if (!loaded.length || !set.check(font, text || 'A')) throw new Error('无法加载自定义文字字体：' + family);
    })).then(() => { if (destroyed) return; painter = build(); if (last) painter(...last); });
    draw.destroy = preserve => { destroyed = true; painter?.destroy?.(preserve); };
    return draw;
  }
  // 只为自定义内容准备字体；默认路径保持原同步绘制。
  function contentReady(root, definition, build) {
    if (!definition?.content) return build();
    const strings = value => typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];
    const text = strings(definition.content).join('');
    return textReady(root, [300,700].flatMap(weight => ['Source Han Sans SC','Oswald'].map(family => ({family,weight,text}))), build);
  }
  function fitText(root, node, text, width, size, min = size, weight = 700) {
    const family = textFont(text), measured = measureText(root, text, size, family, weight);
    const fitted = Math.min(size, size * width / Math.max(1, measured));
    if (fitted < min) throw new Error('文字过宽，请缩短内容：' + text);
    node.style.fontFamily = '"' + family + '"'; node.style.fontWeight = String(weight);
    node.style.fontSize = fitted + 'px'; node.style.whiteSpace = 'pre'; node.style.letterSpacing = '0px';
    return fitted;
  }
  const kit = {clamp, mix, ease, span, pose, scene, tile, cardSet, curve, escape, prepareStage, createRenderer, resolveVariant, type, textSize, slot, textFont, measureText, textReady, contentReady, fitText};
  const live = new Set();
  function create(root, definition, options = {}) {
    definition = resolveVariant(definition);
    if (!factories[definition.source?.factory || definition.id]) throw new Error('缺少效果源码：' + definition.id);
    root.innerHTML = '<div class="motion-stage"></div>';
    const stage = root.firstElementChild;
    prepareStage(stage, definition);
    const render = createRenderer(stage, definition);
    const preparation = render.ready;
    const frameRate = render.frameRate;
    let preparing = !!preparation && typeof preparation.then === 'function';
    let pendingPlay = false, preparationError = null;
    let destroyed = false, time = 0, elapsedTime = 0;
    let currentEase = options.ease || definition.default_ease;
    const paused = () => preparing ? !pendingPlay : timer.paused;
    const notify = () => options.onUpdate?.({time, duration: definition.duration_ms, paused: paused(), preparing, error: preparationError});
    const draw = (ms, elapsed = ms, playback = false) => {
      time = clamp(ms, 0, definition.duration_ms);
      elapsedTime = elapsed;
      render(time, {ease: currentEase, duration: definition.duration_ms, elapsed, playback});
    };
    const timer = global.anime.createTimer({
      ...(Number.isFinite(frameRate) && frameRate > 0 ? {frameRate} : {}),
      duration: definition.duration_ms,
      loop: definition.loop,
      autoplay: false,
      onUpdate(self) { if (!destroyed) { draw(self.iterationCurrentTime, self.currentTime, true); notify(); } },
      onComplete() { if (!destroyed) notify(); }
    });
    const controller = {
      play() {
        if (destroyed || preparationError) return;
        if (!definition.loop && time >= definition.duration_ms) this.seek(0);
        if (preparing) pendingPlay = true;
        else timer.play();
        notify();
      },
      pause() { if (destroyed) return; pendingPlay = false; timer.pause(); notify(); },
      restart(shouldPlay = true) { if (destroyed) return; this.pause(); this.seek(0); if (shouldPlay) this.play(); },
      seek(ms) {
        if (destroyed) return;
        if (!Number.isFinite(ms)) throw new TypeError('时间必须是有限数字');
        const next = clamp(ms, 0, definition.duration_ms);
        timer.seek(next, true); draw(next); notify();
      },
      seekElapsed(ms) {
        if (destroyed) return;
        if (!Number.isFinite(ms)) throw new TypeError('时间必须是有限数字');
        const next = definition.loop ? Math.max(0, ms) : clamp(ms, 0, definition.duration_ms);
        timer.seek(next, true); draw(timer.iterationCurrentTime, next); notify();
      },
      setSpeed(value) {
        if (destroyed) return;
        if (!Number.isFinite(value)) throw new TypeError('速度必须是有限数字');
        timer.speed = clamp(value, .5, 2);
      },
      setEase(value) {
        if (destroyed) return;
        const parameter = definition.parameters.ease;
        if (!parameter) currentEase = definition.default_ease;
        else if (parameter.options.includes(value)) currentEase = value;
        else throw new TypeError('不支持的速度变化');
        draw(time, elapsedTime);
      },
      destroy(preserve = false) {
        if (destroyed) return;
        destroyed = true; preparing = false; pendingPlay = false; timer.pause(); timer.cancel(); observer?.disconnect();
        live.delete(controller);
        render.destroy?.(preserve);
        if (!preserve) root.replaceChildren();
      },
      get currentTime() { return time; },
      get elapsedTime() { return elapsedTime; },
      // 准备期间仍保留播放意图，让暂停按钮和页面隐藏能取消它。
      get paused() { return paused(); },
      get preparing() { return preparing; },
      get error() { return preparationError; },
      get speed() { return timer.speed; },
      get destroyed() { return destroyed; }
    };
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => fit(root)) : null;
    observer?.observe(root);
    if (preparing) stage.dataset.preparation = 'preparing';
    const failPreparation = reason => {
      if (destroyed) return false;
      preparing = false; pendingPlay = false; timer.pause();
      preparationError = reason instanceof Error ? reason : new Error(reason?.message || String(reason || '动画准备失败'));
      stage.dataset.preparation = 'failed';
      stage.dataset.preparationError = preparationError.message;
      const notice = stage.ownerDocument.createElement('div');
      notice.className = 'motion-ready-error';
      notice.setAttribute('role', 'alert');
      notice.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;color:#f4f2e8;background:#161715;z-index:1000;text-align:center';
      notice.textContent = '动画准备失败：' + preparationError.message;
      stage.append(notice);
      notify();
      return false;
    };
    controller.ready = preparing ? Promise.resolve(preparation).then(() => {
      if (destroyed) return false;
      preparing = false;
      stage.dataset.preparation = 'ready';
      draw(time, elapsedTime);
      if (pendingPlay) { pendingPlay = false; timer.play(); }
      notify();
      return true;
    }).catch(failPreparation) : Promise.resolve(true);
    live.add(controller); draw(0); fit(root);
    if (options.autoplay) controller.play();
    return controller;
  }
  global.MotionKit = kit;
  global.MotionRuntime = {
    create, fit,
    disposeAll() { [...live].forEach(c => c.destroy()); },
    get runningCount() { return [...live].filter(c => !c.paused).length; },
    get instanceCount() { return live.size; }
  };
})(globalThis);
