// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
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
  const html = withApp ? await readFile(new URL('../catalog/index.html', import.meta.url), 'utf8') : '<!doctype html><div id="root"></div>';
  const dom = new JSDOM(html, {url:'file:///wise-motion/catalog/index.html'+(options.hash||''),runScripts:'outside-only',pretendToBeVisual:true});
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
  if (withApp) {
    // 按正式页面的真实引用加载，避免测试替页面补齐漏引的效果源码。
    sources.length = 0;
    for (const script of w.document.querySelectorAll('script[src]')) {
      const file = 'catalog/' + script.getAttribute('src');
      // 历史数据在浏览器中按需加载；测试无网络，提前提供这份数据。
      if (file === 'catalog/app.js'&&!options.lazyHistory) sources.push('catalog/history-data.js');
      sources.push(file);
    }
  }
  for (const file of sources) w.eval(await readFile(new URL('../' + file, import.meta.url), 'utf8'));
  return {dom,w,listeners,media,directoryMedia,reveal() {
    for (const observer of observers) observer.callback([...observer.nodes].map(target => ({target,isIntersecting:true})));
  },close() { w.MotionRuntime.disposeAll(); w.MotionHistoryRuntime?.disposeAll(); w.anime.engine.pause(); dom.window.close(); }};
}

// 原作形状和计时不变；颜色按本次统一的主题色位核对。
export const themed=value=>({"#0AE448": "var(--accent)", "#FFFCE1": "var(--ink)", "#BBBAA6": "var(--muted)", "#191919": "var(--card)", "#42433D": "var(--card-edge)", "#ABFF84": "var(--teal)", "#DDE8D8": "var(--ink)", "#AEB7A8": "var(--muted)", "#40614c": "var(--teal)", "#718074": "var(--muted)", "#416a86": "var(--blue)", "#bd5039": "var(--accent)", "#c8d3d3": "var(--path)", "#9C9C9E": "var(--faint)", "#30302E": "var(--ink)"})[value]||value;
