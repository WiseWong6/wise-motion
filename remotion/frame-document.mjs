// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
// 顺序与原目录一致；不载入目录、播放器或交互控制，所有画面时间由父组件传入。
export const FRAME_SCRIPTS = Object.freeze([
  "vendor/animejs/anime.umd.min.js",
  "catalog/registry-data.js",
  "catalog/runtime.js",
  "catalog/history-runtime.js",
  "catalog/effects/entrance.js",
  "catalog/effects/continuous.js",
  "catalog/effects/attention.js",
  "catalog/effects/theme-color-cycle.js",
  "catalog/effects/space.js",
  "catalog/effects/transition.js",
  "catalog/effects/environment.js",
  "catalog/effects/compositions.js",
  "catalog/effects/radial-branch-flow.js",
  "catalog/effects/rect-wave-field.js",
  "catalog/effects/letter-ripple.js",
  "catalog/effects/letter-settle.js",
  "catalog/effects/flow-bands.js",
  "catalog/effects/history-patterns.js",
  "catalog/effects/emission-trails.js",
  "catalog/effects/promo-particles.js",
  "catalog/effects/crt-collapse.js",
  "catalog/effects/hud-targeting.js",
  "catalog/effects/glass-light.js",
  "catalog/effects/data-motion.js",
  "catalog/effects/data-comparisons.js",
  "catalog/effects/live-code-readout.js",
  "catalog/effects/glyph-code-fill.js",
  "catalog/effects/math-formula-drift.js",
  "catalog/effects/word-slam.js",
  "catalog/effects/step-hop.js",
  "catalog/effects/concept-diagram.js",
  "catalog/effects/illustrations.js",
  "catalog/effects/door-halftone.js",
  "catalog/effects/kimi-illustrations.js",
  "catalog/effects/selfie-phone.js",
  "catalog/effects/cat-mouth.js",
  "catalog/effects/encore-dance.js",
  "catalog/effects/osmanthus-motion.js",
  "catalog/effects/settle-grow-spread.js",
  "catalog/effects/history-nature.js",
  "catalog/effects/particle-scenes.js",
  "catalog/effects/cyanotype.js",
  "catalog/effects/paper-showcase.js",
  "catalog/effects/collage-film.js",
  "catalog/effects/capsule-type.js",
  "catalog/effects/metal-impact.js",
  "catalog/effects/geometric-poster.js",
  "catalog/effects/thread-weave.js",
  "catalog/effects/claude-tile-illustrations.js",
  "catalog/effects/rasengan-illustrations.js",
  "catalog/effects/reel-opening.js",
  "catalog/effects/reel-paper.js",
  "catalog/effects/reel-neon.js",
  "catalog/effects/point-domain-flow.js",
  "catalog/effects/motion-oasis.js",
  "catalog/effects/seed-bloom-brand.js",
  "catalog/effects/reel-transitions.js",
  "catalog/effects/reel-grit-key.js",
  "catalog/effects/reel-flat-gen.js",
  "catalog/effects/reel-prompt-outro.js",
  "catalog/effects/material-evolution.js",
  "catalog/effects/civilization-growth.js",
  "catalog/effects/dither-book.js"
]);
export const FRAME_STYLES = Object.freeze(['catalog/scenes.css', 'catalog/app.css', 'catalog/history.css', 'catalog/book-controls.css']);
// 未指定条目时保留完整加载，供基准检查和兼容调用使用。
// 指定条目只加载它声明的真实依赖；不能靠整套目录掩盖漏报的依赖。
export function frameScriptsFor(definition) {
  if (!definition) return FRAME_SCRIPTS;
  const source = definition.source;
  if (!source?.path || !Array.isArray(source.dependencies ?? [])) throw new TypeError('动效缺少有效的绘制来源');
  const required = new Set(['vendor/animejs/anime.umd.min.js', 'catalog/runtime.js',
    ...(source.dependencies || []), source.path]);
  // 这组场景从真实目录统计数据生成图表，其他绘制器不读取目录清单。
  if (required.has('catalog/effects/motion-oasis.js')) required.add('catalog/registry-data.js');
  for (const file of required) if (!FRAME_SCRIPTS.includes(file)) throw new Error('未登记的动效绘制依赖：' + file);
  return FRAME_SCRIPTS.filter(file => required.has(file));
}
const escapeAttribute = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// 此函数完整运行在独立 iframe 内。不得捕获外部变量。
function bootstrapFrame() {
  'use strict';
  const failures = [];
  window.addEventListener('error', event => {
    const target = event.target;
    const url = target?.src || target?.href;
    failures.push(event.error || new Error(url ? '无法加载动效资源：' + url : event.message || '动效脚本执行失败'));
  }, true);
  window.addEventListener('unhandledrejection', event => failures.push(event.reason instanceof Error ? event.reason : new Error(String(event.reason))));
  window.__wiseMotionCreateSession = async function (options) {
    if (failures.length) throw failures[0];
    if (!window.MotionKit || !window.anime) throw new Error('动效绘制核心未加载');
    document.documentElement.dataset.theme = options.theme || document.documentElement.dataset.theme;
    // 只使用 Anime.js 的数学曲线。保留浏览器逐帧回调供原材质预热。
    window.anime.engine?.pause();
    const definition = options.definition;
    const stage = document.querySelector('.motion-stage');
    let destroyed = false;
    let renderer;
    const preparedImages = new Map();
    const pendingImages = new Set();
    // 新画布绘制的原目录有静默降级提示；导出必须明确失败，不能把提示或空画布当作成功帧。
    // 仅保护指定画布绘制来源，成功的上下文和所有绘制参数原样传回原函数。
    const strictCanvasSources = ['catalog/effects/metal-impact.js', 'catalog/effects/geometric-poster.js', 'catalog/effects/motion-oasis.js', 'catalog/effects/seed-bloom-brand.js', 'catalog/effects/civilization-growth.js'];
    const strictCanvas = [definition.source?.path, ...(definition.source?.dependencies || [])].some(path => strictCanvasSources.includes(path));
    const canvasPrototype = window.HTMLCanvasElement?.prototype;
    const nativeGetContext = canvasPrototype?.getContext;
    const watchedCanvases = new WeakSet();
    const guardedGetContext = function (...args) {
      const context = nativeGetContext.apply(this, args);
      if (!context && ['2d', 'webgl', 'webgl2', 'experimental-webgl'].includes(args[0])) {
        throw new Error('无法准备动效绘制环境：' + definition.id + '（' + args[0] + '）');
      }
      if (context && String(args[0]).includes('webgl') && !watchedCanvases.has(this)) {
        watchedCanvases.add(this);
        this.addEventListener('webglcontextlost', () => {
          if (!destroyed) failures.push(new Error('动效图形环境已丢失：' + definition.id));
        });
      }
      return context;
    };
    if (strictCanvas && nativeGetContext) canvasPrototype.getContext = guardedGetContext;
    const ensureAlive = () => { if (destroyed) throw new Error('动效实例已经销毁'); if (failures.length) throw failures[0]; };
    const loadImage = value => {
      if (!value || value.startsWith('#')) return Promise.resolve();
      const url = new URL(value, document.baseURI).href;
      if (preparedImages.has(url)) return preparedImages.get(url);
      const job = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => image.decode ? image.decode().then(resolve, reject) : resolve();
        image.onerror = () => reject(new Error('无法加载动效图片：' + url));
        image.src = url;
      });
      preparedImages.set(url, job);
      pendingImages.add(job);
      job.then(() => pendingImages.delete(job), () => pendingImages.delete(job));
      return job;
    };
    const prepareImages = async (includeBackgrounds = false, onWait) => {
      const jobs = [];
      for (const element of stage.querySelectorAll('img,image')) {
        jobs.push(loadImage(element.currentSrc || element.getAttribute('src') || element.getAttribute('href') || element.getAttribute('xlink:href')));
      }
      if (includeBackgrounds) for (const element of [stage, ...stage.querySelectorAll('*')]) {
        const style = getComputedStyle(element);
        for (const value of [style.backgroundImage, style.maskImage]) {
          for (const match of (value || '').matchAll(/url\(["']?([^"')]+)["']?\)/g)) jobs.push(loadImage(match[1]));
        }
      }
      if (jobs.some(job => pendingImages.has(job))) onWait?.();
      await Promise.all(jobs);
      ensureAlive();
    };
    let pending = Promise.resolve();
    const session = {
      stage, doc: document, window,
      get destroyed() { return destroyed; },
      draw(time, elapsed = time, sampleMode = 'playback', ease = options.ease, onWait) {
        if (!Number.isFinite(time) || !Number.isFinite(elapsed)) return Promise.reject(new TypeError('绘制时间必须是有限数字'));
        if (sampleMode !== 'playback' && sampleMode !== 'exact') return Promise.reject(new TypeError('取样方式必须为 playback 或 exact'));
        // 快速定位会清理上一帧的等待句柄；新帧须接管尚未完成的素材等待。
        if (pendingImages.size) onWait?.();
        const job = pending.then(async () => {
          ensureAlive();
          renderer(time, {ease: ease || definition.default_ease, duration: definition.duration_ms, elapsed, playback: sampleMode === 'playback'});
          await prepareImages(false, onWait);
          ensureAlive();
          stage.dataset.remotionTime = String(time);
          stage.dataset.remotionElapsed = String(elapsed);
          return {time, elapsed, sampleMode};
        });
        pending = job.catch(() => {});
        return job;
      },
      destroy(preserve = false) {
        if (destroyed) return;
        destroyed = true;
        if (canvasPrototype?.getContext === guardedGetContext) canvasPrototype.getContext = nativeGetContext;
        renderer?.destroy?.(preserve);
        window.MotionRuntime?.disposeAll();
        window.anime.engine?.pause();
        if (!preserve) stage.replaceChildren();
        preparedImages.clear();
        pendingImages.clear();
      }
    };
    // 让父组件在初始化尚未完成时也能立即释放昂贵的材质准备。
    window.__wiseMotionSession = session;
    try {
      if (document.fonts) {
        await Promise.all([...document.fonts].map(font => font.load()));
        await document.fonts.ready;
      }
      ensureAlive();
      window.MotionKit.prepareStage(stage, definition);
      renderer = window.MotionKit.createRenderer(stage, definition);
      renderer(0, {ease: options.ease || definition.default_ease, duration: definition.duration_ms, elapsed: 0, playback: false});
      if (renderer.ready) await renderer.ready;
      ensureAlive();
      await prepareImages(true);
      ensureAlive();
      return session;
    } catch (error) {
      session.destroy();
      throw error;
    }
  };
}

export function createFrameDocument({assetBaseUrl, theme = 'dark', definition}) {
  if (!assetBaseUrl || typeof assetBaseUrl !== 'string') throw new TypeError('必须提供素材根地址');
  if (theme !== 'dark' && theme !== 'light') throw new TypeError('外观必须为 dark 或 light');
  const base = assetBaseUrl.replace(/\/?$/, '/');
  const url = path => escapeAttribute(base + path);
  return `<!doctype html><html lang="zh-CN" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=640,initial-scale=1"><base href="${url('catalog/')}">
<script>(${bootstrapFrame.toString()})()<\/script>
${FRAME_STYLES.map(path => `<link rel="stylesheet" href="${url(path)}">`).join('\n')}
<style>html,body{margin:0;padding:0;width:640px;height:360px;overflow:hidden}#wise-motion-viewport{position:relative;width:640px;height:360px;min-width:0;min-height:0;border:0;border-radius:0;margin:0;box-shadow:none}.motion-stage{transform:translate(-50%,-50%) scale(1)}</style>
</head><body><div id="wise-motion-viewport" class="motion-viewport"><div class="motion-stage"></div></div>
${frameScriptsFor(definition).map(path => `<script src="${url(path)}"><\/script>`).join('\n')}
</body></html>`;
}
