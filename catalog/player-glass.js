/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function () {
  'use strict';
  const surface = document.querySelector('.playbar-glass');
  if (!surface) return;
  const preferences = ['(prefers-reduced-transparency: reduce)', '(prefers-contrast: more)', '(forced-colors: active)']
    .map(query => window.matchMedia(query));
  let glass = null, suspended = false;

  function release() {
    glass?.destroy();
    glass = null;
    delete surface.dataset.refraction;
  }
  function sync() {
    if (suspended || preferences.some(preference => preference.matches)) {
      release();
      return;
    }
    if (glass || typeof window.liquidGlass !== 'function') return;
    try {
      glass = window.liquidGlass(surface, {
        // 上游默认值。scale 再减弱、blur 再加大，边缘位移会被磨成普通磨砂。
        scale:-112, chroma:6, border:.07, mapBlur:12,
        blur:3, saturate:1.5, fallbackBlur:16
      });
      surface.dataset.refraction = glass.supported ? 'on' : 'fallback';
    } catch (_) {
      // 光学增强不可用时保留样式回退，不影响播放程序启动。
      surface.style.backdropFilter = '';
      surface.style.webkitBackdropFilter = '';
    }
  }
  preferences.forEach(preference => preference.addEventListener('change', sync));
  window.addEventListener('pagehide', () => { suspended = true; release(); });
  window.addEventListener('pageshow', () => { suspended = false; sync(); });
  sync();
})();
