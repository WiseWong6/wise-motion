/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function (global) {
  'use strict';
  const presets = Object.freeze({
    'paper-expand': {duration: 0.45, x: 540, y: 1180, background: '#EEECE5', before: '#0A0A0B'},
    'black-cover': {duration: 0.40, x: 540, y: 850, background: '#0A0A0B', before: '#EEECE5'},
  });
  const quint = p => p < 0.5 ? 16 * p ** 5 : 1 - (-2 * p + 2) ** 5 / 2;
  function sample(seconds, variantId = 'paper-expand') {
    const preset = presets[variantId];
    if (!preset) throw new Error('未知圆形转场示例：' + variantId);
    if (!Number.isFinite(seconds)) throw new TypeError('动作时间必须是有限秒数');
    const progress = quint(Math.max(0, Math.min(1, seconds / preset.duration)));
    return {...preset, progress, radiusPercent: progress * 120,
      clipPath: `circle(${progress * 120}% at ${preset.x}px ${preset.y}px)`};
  }
  // 演示页只提供可替换的前后画面。半径、圆心、曲线与 React 组件共用。
  function make(root, K, definition) {
    const variant = definition.variant_id;
    const preset = presets[variant];
    if (!preset) throw new Error('未知圆形转场示例：' + variant);
    const doc = root.ownerDocument;
    const page = doc.createElement('div');
    Object.assign(page.style, {position: 'absolute', width: '1080px', height: '1440px',
      left: '185px', top: '0', transform: 'scale(.25)', transformOrigin: '0 0',
      overflow: 'hidden', background: preset.before});
    const marker = doc.createElement('div');
    Object.assign(marker.style, {position: 'absolute', width: '300px', height: '300px',
      left: '390px', top: '570px', border: '6px solid #6675FF', borderRadius: '50%'});
    page.append(marker);
    const cover = doc.createElement('div');
    cover.dataset.circleCover = 'true';
    Object.assign(cover.style, {position: 'absolute', inset: '0', background: preset.background});
    const square = marker.cloneNode();
    Object.assign(square.style, {borderRadius: '0', transform: 'rotate(45deg)'});
    cover.append(square); page.append(cover); root.replaceChildren(page);
    const draw = ms => {cover.style.clipPath = sample((ms - 150) / 1000, variant).clipPath;};
    draw(0);
    return draw;
  }
  global.WiseCircularReveal = Object.freeze({presets, sample, make});
})(globalThis);
