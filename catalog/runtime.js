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
  function fit(root) {
    const stage = root.querySelector('.motion-stage');
    if (!stage) return;
    const box = root.getBoundingClientRect();
    const raw = Math.min(box.width / 640, box.height / 360) || 1;
    const dpr = global.devicePixelRatio || 1;
    const scale = Math.max(0.01, Math.floor(raw * 640 * dpr) / (640 * dpr));
    stage.style.transform = `translate(-50%,-50%) scale(${scale})`;
  }
  const kit = {clamp, mix, ease, span, pose, scene, tile, cardSet, curve, escape};
  const live = new Set();
  function create(root, definition, options = {}) {
    if (!factories[definition.id]) throw new Error('缺少效果源码：' + definition.id);
    root.innerHTML = '<div class="motion-stage"></div>';
    const stage = root.firstElementChild;
    stage.dataset.effect = definition.id;
    const render = factories[definition.id](stage, kit, definition);
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
        if (!preserve) root.replaceChildren();
      },
      get currentTime() { return time; },
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
