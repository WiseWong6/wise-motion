/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
/* 目录首屏不需要的大体积绘制数据在第一次用到时才载入。
   预览本身运行在独立画面里，只加载条目声明的依赖；这里补的是主页面的缩略图、
   组合拆解和复制源码。载入顺序固定，已载入的文件不会重复执行。 */
(function (global) {
  'use strict';
  const EFFECT_FILES = ["effects/mechanical-windows-data.js","effects/spatial-apertures-data.js","effects/time-in-motion-data.js","effects/time-in-motion.js","effects/time-in-motion-graphics.js","effects/pixel-motion-data.js","effects/pixel-motion.js","effects/entrance.js","effects/continuous.js","effects/attention.js","effects/theme-color-cycle.js","effects/space.js","effects/transition.js","effects/environment.js","effects/compositions.js","effects/radial-branch-flow.js","effects/rect-wave-field.js","effects/letter-ripple.js","effects/letter-settle.js","effects/flow-bands.js","effects/speech-caption.js","effects/history-patterns.js","effects/emission-trails.js","effects/promo-particles.js","effects/crt-collapse.js","effects/hud-targeting.js","effects/glass-light.js","effects/data-motion.js","effects/data-comparisons.js","effects/live-code-readout.js","effects/glyph-code-fill.js","effects/math-formula-drift.js","effects/word-slam.js","effects/step-hop.js","effects/concept-diagram.js","effects/illustrations.js","effects/door-halftone.js","effects/kimi-illustrations.js","effects/selfie-phone.js","effects/cat-mouth.js","effects/encore-dance.js","effects/osmanthus-motion.js","effects/settle-grow-spread.js","effects/history-nature.js","effects/particle-scenes.js","effects/cyanotype.js","effects/paper-showcase.js","effects/collage-film.js","effects/capsule-type.js","effects/metal-impact.js","effects/geometric-poster.js","effects/thread-weave.js","effects/claude-tile-illustrations.js","effects/rasengan-illustrations.js","effects/reel-opening.js","effects/reel-paper.js","effects/reel-neon.js","effects/point-domain-flow.js","effects/motion-oasis.js","effects/seed-bloom-brand.js","effects/civilization-images.js","effects/reel-transitions.js","effects/circular-reveal.js","effects/butterfly-motion.js","effects/butterfly.js","effects/reel-grit-key.js","effects/reel-flat-gen.js","effects/reel-prompt-outro.js","effects/material-evolution.js","effects/civilization-growth.js","effects/dither-book.js","effects/scene-source-runtime.js","effects/scene-osmanthus-data.js","effects/scene-ink-data.js","effects/scene-dandelion.js","effects/scene-drive.js","effects/scene-factory.js","effects/scene-ink.js","effects/scene-letter-images.js","effects/scene-letter.js","effects/scene-ocean.js","effects/scene-osmanthus.js","effects/scene-selfie-images.js","effects/scene-selfie.js","effects/scene-snow.js","effects/scene-window-data.js","effects/scene-window-media.js","effects/scene-window.js","effects/butterfly-mask.js","effects/sage-butterfly-mask.js","effects/reel-extract.js","effects/mechanical-windows.js","effects/spatial-apertures.js","effects/aboutlove-clock.js","effects/aboutlove-fonts.js","effects/aboutlove-data.js","effects/aboutlove-entries.js","effects/aboutlove.js"];
  const SOURCES_FILE = 'remotion-sources.js';
  const loaded = new Set([...document.querySelectorAll('script[src]')].map(script=>script.getAttribute('src'))), loading = new Map();

  function load(file) {
    if (loaded.has(file)) return Promise.resolve();
    if (!loading.has(file)) {
      const attempt = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = file;
        script.onload = () => resolve();
        script.onerror = () => { script.remove(); reject(new Error('无法载入动效资源：' + file)); };
        document.head.append(script);
      }).then(() => { loaded.add(file); }).finally(() => { loading.delete(file); });
      loading.set(file, attempt);
    }
    return loading.get(file);
  }
  function filesFor(effect) {
    const source = effect?.source;
    if (!source) return [];
    const declared = new Set([source.path, ...(source.dependencies || [])].map(path => String(path).replace(/^catalog\//, '')));
    return EFFECT_FILES.filter(file => declared.has(file));
  }
  // 依次载入，保证共享图片先于使用它的绘制器。
  function sequence(files) {
    const pending = files.filter(file => !loaded.has(file));
    if (!pending.length) return null;
    return pending.reduce((chain, file) => chain.then(() => load(file)), Promise.resolve());
  }

  global.MotionLazy = {
    effectFiles: EFFECT_FILES,
    sourcesFile: SOURCES_FILE,
    /* 返回 null 表示这个条目所需的文件都已就绪；否则返回载入完成的 Promise。 */
    ensure(effect) { return sequence(filesFor(effect)); },
    /* 复制源码需要打包后的源码表和该条目的共享素材。 */
    ensureCode(effect) {
      const files = [...filesFor(effect)];
      if (effect?.source?.remotion && !global.MotionRemotionSources) files.push(SOURCES_FILE);
      return sequence(files);
    },
    /* 测试或离线整合时声明文件已通过其他方式执行。 */
    markLoaded(files = [...EFFECT_FILES, SOURCES_FILE]) { for (const file of files) loaded.add(file); },
    get loaded() { return [...loaded]; }
  };
})(globalThis);
