/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 目录首屏不需要的大体积绘制数据在第一次用到时才载入。
   预览本身运行在独立画面里，只加载条目声明的依赖；这里补的是主页面的缩略图、
   组合拆解和复制源码。载入顺序固定，已载入的文件不会重复执行。 */
(function (global) {
  'use strict';
  const EFFECT_FILES = ['effects/butterfly-mask.js','effects/sage-butterfly-mask.js', 'effects/reel-extract.js', 'effects/letter-settle.js', 'effects/hud-targeting.js', 'effects/data-motion.js', 'effects/osmanthus-motion.js', 'effects/settle-grow-spread.js', 'effects/history-nature.js', 'effects/claude-tile-illustrations.js', 'effects/motion-oasis.js', 'effects/material-evolution.js', 'effects/civilization-images.js', 'effects/rasengan-illustrations.js', 'effects/civilization-growth.js','effects/scene-source-runtime.js','effects/scene-osmanthus-data.js','effects/scene-ink-data.js','effects/scene-dandelion.js','effects/scene-drive.js','effects/scene-factory.js','effects/scene-ink.js','effects/scene-letter-images.js','effects/scene-letter.js','effects/scene-ocean.js','effects/scene-osmanthus.js','effects/scene-selfie-images.js','effects/scene-selfie.js','effects/scene-snow.js','effects/scene-window-data.js','effects/scene-window-media.js','effects/scene-window.js'];
  const SOURCES_FILE = 'remotion-sources.js';
  const loaded = new Set(), loading = new Map();

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
