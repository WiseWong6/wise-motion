// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {historyTestData} from './history-fixture.mjs';
export const data = JSON.parse(await readFile(new URL('../catalog/registry.json', import.meta.url), 'utf8'));
// 原片对照测试使用设计时钟；目录节奏另测，避免把原动作关系也改成新预期。
export function sourceDefinition(effect) {
  if (!effect.timing) return effect;
  const {timing,...source} = effect;
  return {...source, duration_ms:timing.source_duration_ms, preview_ms:timing.source_preview_ms};
}
export function motionTime(effect, sourceTime) {
  const t = effect.timing;
  if (!t) return sourceTime;
  const p = Math.max(0,Math.min(1,(sourceTime-t.source_start_ms)/(t.source_end_ms-t.source_start_ms)));
  return t.start_ms+(t.end_ms-t.start_ms)*p;
}
// 不同画板的图形标识不同；只统一标识与浮点末位，仍逐项核对画面属性。
export function frameMarkup(root) {
  let value=root.innerHTML;
  [...root.querySelectorAll('[id]')].forEach((node,i)=>{value=value.replaceAll(node.id,'fixed-id-'+i);});
  return value.replace(/-?\d+\.\d+(?:e[-+]?\d+)?/gi,n=>String(Math.round(Number(n)*1e7)/1e7));
}
export async function environment(withApp = false, options = {}) {
  let html = withApp ? await readFile(new URL('../catalog/index.html', import.meta.url), 'utf8') : '<!doctype html><div id="root"></div>';
  // 历史兼容接口只用测试专属入口验证，正式页面不再提供历史页签。
  if(withApp&&options.historyFixture)html=html.replace('<button data-kind="action"','<button data-kind="recipe" aria-pressed="false">历史 <span class="pill-count">0</span></button><button data-kind="action"');
  const dom = new JSDOM(html, {url:'file:///wise-motion/catalog/index.html'+(options.hash||''),runScripts:'outside-only',pretendToBeVisual:true});
  const w = dom.window;
  if (options.sessionStorage) Object.defineProperty(w, 'sessionStorage', {value:options.sessionStorage});
  // 页面按需追加的脚本没有网络可取：直接从源码目录读取、执行，再触发 onload，并记录载入顺序。
  const lazyRequests = [];
  if (options.lazyAssets) {
    w.document.head.append = node => {
      if (node.tagName !== 'SCRIPT' || !node.src) return;
      const relative = new URL(node.src).pathname.replace('/wise-motion/catalog/', '');
      lazyRequests.push(relative);
      readFile(new URL('../catalog/' + relative, import.meta.url), 'utf8').then(code => { w.eval(code); node.onload?.(); }, error => node.onerror?.(error));
    };
  }
  // 只做结构与控制检查。jsdom 没有像素绘制能力，显式返回空值，避免能力探测噪声。
  w.HTMLCanvasElement.prototype.getContext = () => null;
  // jsdom 无图片解码能力；结构检查视本地图片为已准备。异步边界另用独立环境测试。
  if (!options.realImagePreparation) {
    Object.defineProperty(w.HTMLImageElement.prototype, 'complete', {get: () => true, configurable: true});
    Object.defineProperty(w.HTMLImageElement.prototype, 'naturalWidth', {get: () => 1536, configurable: true});
    w.HTMLImageElement.prototype.decode = () => Promise.resolve();
  }
  // jsdom 不渲染背景滤镜；播放器光学层的完整能力分支另用独立测试检查。
  w.CSS.supports = () => false;
  const listeners = new Set();
  w.ResizeObserver = class {
    observe() { listeners.add(this); }
    disconnect() { listeners.delete(this); }
  };
  const media = new w.EventTarget(); media.matches = true;
  const directoryMedia = new w.EventTarget(); directoryMedia.matches = false;
  w.matchMedia = query => query.includes('max-width') ? directoryMedia : media;
  // 目录缩略图靠 IntersectionObserver 懒绘制；这里放一个手动驱动的替身，
  // 既不改变页面默认表现，也让测试能主动触发绘制。
  const observers = [];
  w.IntersectionObserver = class {
    constructor(callback, options) { this.callback = callback; this.options = options; this.nodes = new Set(); observers.push(this); }
    observe(node) { this.nodes.add(node); }
    unobserve(node) { this.nodes.delete(node); }
    disconnect() { this.nodes.clear(); }
  };
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
  const sources = ['vendor/animejs/anime.umd.min.js','catalog/registry-data.js','catalog/remotion-sources.js','catalog/matching.js','catalog/runtime.js', ...[...new Set(data.effects.flatMap(e => [...(e.source.dependencies||[]),e.source.path]))]];
  if (withApp) {
    // 按正式页面的真实引用加载，避免测试替页面补齐漏引的效果源码。
    sources.length = 0;
    for (const script of w.document.querySelectorAll('script[src]')) {
      const file = 'catalog/' + script.getAttribute('src');
      // 历史数据在浏览器中按需加载；测试无网络，提前提供这份数据。
      if (file === 'catalog/app.js'&&!options.lazyHistory) sources.push('catalog/history-data.js');
      // 大体积素材在浏览器中按需载入；除非专项测试要检查载入过程，否则提前执行并登记为已就绪。
      if (file === 'catalog/app.js'&&!options.lazyAssets) sources.push('catalog/effects/civilization-images.js','catalog/effects/rasengan-illustrations.js','catalog/effects/civilization-growth.js','catalog/remotion-sources.js','mark-lazy-loaded');
      // jsdom检查原绘制和目录结构；Remotion由专项测试检查。
      // jsdom没有媒体解码器，这里不把无媒体能力误判为视频准备中。
      if(file !== 'catalog/remotion-player.js') sources.push(file);
    }
  }
  for (const file of sources) {
    if (file === 'mark-lazy-loaded') { w.MotionLazy.markLoaded(); continue; }
    w.eval(await readFile(new URL('../' + file, import.meta.url), 'utf8'));
    if(file==='catalog/history-data.js'&&options.historyFixture)w.MotionHistory=historyTestData();
  }
  // 原作画面对照显式选择静帧；默认环境完整保留正式页面的自动播放。
  // 使用真正的播放条暂停与定位，不替换播放器，也不改变系统偏好。
  if (withApp && options.staticPreview) {
    let previousStage;
    const freezeSelection = () => {
      const host=w.document.getElementById('preview'),stage=host?.firstElementChild;
      if (!stage || stage===previousStage) return;
      previousStage=stage;
      const selected=w.document.querySelector('.effect-item[aria-current="true"]')?.dataset.effect;
      const effect=w.MotionRegistry.effects.find(e=>e.id===selected)||w.MotionHistory?.recipes.find(e=>e.id===selected);
      if (!effect) return;
      const entry=effect.entries?.find(e=>e.id===w.document.getElementById('history-case')?.value)||effect.entries?.[0];
      const duration=entry?Math.round(entry.preview.duration*1000):effect.duration_ms;
      const time=entry?Math.round(duration*(typeof entry.preview.poster==='number'?entry.preview.poster:.65)):effect.preview_ms;
      const scrub=w.document.getElementById('scrub');
      scrub.value=1000*time/duration; scrub.dispatchEvent(new w.Event('input'));
    };
    freezeSelection();
    w.document.addEventListener('click',freezeSelection);
    w.document.addEventListener('keydown',freezeSelection);
    w.addEventListener('pageshow',()=>{previousStage=w.document.getElementById('preview')?.firstElementChild;});
  }
  return {dom,w,lazyRequests,listeners,media,directoryMedia,observers,reveal() {
    for (const observer of observers) observer.callback([...observer.nodes].map(target => ({target,isIntersecting:true})));
  },close() { w.MotionRuntime.disposeAll(); w.MotionHistoryRuntime?.disposeAll(); w.anime.engine.pause(); dom.window.close(); }};
}

// 原作形状和计时不变；颜色按本次统一的主题色位核对。
export const themed=value=>({"#0AE448": "var(--accent)", "#FFFCE1": "var(--ink)", "#BBBAA6": "var(--muted)", "#191919": "var(--card)", "#42433D": "var(--card-edge)", "#ABFF84": "var(--teal)", "#DDE8D8": "var(--ink)", "#AEB7A8": "var(--muted)", "#40614c": "var(--teal)", "#718074": "var(--muted)", "#416a86": "var(--blue)", "#bd5039": "var(--accent)", "#c8d3d3": "var(--path)", "#9C9C9E": "var(--faint)", "#30302E": "var(--ink)"})[value]||value;

// 已迁出的历史绘制类型用独立夹具验证兼容接口，不恢复正式目录入口。
export function historicalDrawingFixture(base, suffix='drawing-fixture', type='web-isolated') {
  const entry=base.entries[0];
  return {...base,id:base.id+'-'+suffix,duration_ms:4000,preview_ms:2600,
    entries:[{...entry,id:entry.id+'-'+suffix,preview:{type,duration:4,poster:.65,engine:'fixture',mode:'fixture'}}]};
}
