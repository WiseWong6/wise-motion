// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
export const data = JSON.parse(await readFile(new URL('../catalog/registry.json', import.meta.url), 'utf8'));
export async function environment(withApp = false) {
  const html = withApp ? await readFile(new URL('../catalog/index.html', import.meta.url), 'utf8') : '<!doctype html><div id="root"></div>';
  const dom = new JSDOM(html, {url:'file:///wise-motion/catalog/index.html',runScripts:'outside-only',pretendToBeVisual:true});
  const w = dom.window;
  // 只做结构与控制检查。jsdom 没有像素绘制能力，显式返回空值，避免能力探测噪声。
  w.HTMLCanvasElement.prototype.getContext = () => null;
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
    constructor(callback) { this.callback = callback; this.nodes = new Set(); observers.push(this); }
    observe(node) { this.nodes.add(node); }
    unobserve(node) { this.nodes.delete(node); }
    disconnect() { this.nodes.clear(); }
  };
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
  const sources = ['vendor/animejs/anime.umd.min.js','catalog/registry-data.js','catalog/matching.js','catalog/runtime.js', ...[...new Set(data.effects.map(e => e.source.path))]];
  if (withApp) sources.push('vendor/liquid-glass/liquid-glass.js','catalog/player-glass.js','catalog/history-data.js','catalog/history-runtime.js','vendor/heroicons/icons.js','catalog/thumbnails.js','catalog/dropdown.js','catalog/export.js','catalog/app.js');
  for (const file of sources) w.eval(await readFile(new URL('../' + file, import.meta.url), 'utf8'));
  return {dom,w,listeners,media,directoryMedia,reveal() {
    for (const observer of observers) observer.callback([...observer.nodes].map(target => ({target,isIntersecting:true})));
  },close() { w.MotionRuntime.disposeAll(); w.MotionHistoryRuntime?.disposeAll(); w.anime.engine.pause(); dom.window.close(); }};
}
