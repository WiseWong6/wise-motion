/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
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
    for (const [role,size] of Object.entries(type)) stage.style.setProperty('--type-'+role, size+'px');
    // 以稳定标识判断，独立导出的定义没有目录分类；缩略图与主预览保持一致。
    if (definition.id.endsWith('-illustration')) stage.dataset.art = 'original';
  }
  function createRenderer(stage, definition) {
    const factory = factories[definition.id];
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
        elapsed:definition.loop ? elapsed * rate : clock(elapsed)});
    };
    if (render.destroy) draw.destroy = preserve => render.destroy(preserve);
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
  const kit = {clamp, mix, ease, span, pose, scene, tile, cardSet, curve, escape, prepareStage, createRenderer, type, textSize};
  const live = new Set();
  function create(root, definition, options = {}) {
    if (!factories[definition.id]) throw new Error('缺少效果源码：' + definition.id);
    root.innerHTML = '<div class="motion-stage"></div>';
    const stage = root.firstElementChild;
    prepareStage(stage, definition);
    const render = createRenderer(stage, definition);
    let destroyed = false, time = 0, elapsedTime = 0;
    let currentEase = options.ease || definition.default_ease;
    const notify = () => options.onUpdate?.({time, duration: definition.duration_ms, paused: timer.paused});
    const draw = (ms, elapsed = ms) => {
      time = clamp(ms, 0, definition.duration_ms);
      elapsedTime = elapsed;
      render(time, {ease: currentEase, duration: definition.duration_ms, elapsed});
    };
    const timer = global.anime.createTimer({
      duration: definition.duration_ms,
      loop: definition.loop,
      autoplay: false,
      onUpdate(self) { if (!destroyed) { draw(self.iterationCurrentTime, self.currentTime); notify(); } },
      onComplete() { if (!destroyed) notify(); }
    });
    const controller = {
      play() { if (destroyed) return; if (!definition.loop && time >= definition.duration_ms) this.seek(0); timer.play(); notify(); },
      pause() { if (destroyed) return; timer.pause(); notify(); },
      restart(shouldPlay = true) { if (destroyed) return; timer.pause(); this.seek(0); if (shouldPlay) this.play(); },
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
        destroyed = true; timer.pause(); timer.cancel(); observer?.disconnect();
        live.delete(controller);
        render.destroy?.(preserve);
        if (!preserve) root.replaceChildren();
      },
      get currentTime() { return time; },
      get elapsedTime() { return elapsedTime; },
      get paused() { return timer.paused; },
      get speed() { return timer.speed; },
      get destroyed() { return destroyed; }
    };
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => fit(root)) : null;
    observer?.observe(root);
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
