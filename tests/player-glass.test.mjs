// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

const vendor = await readFile(new URL('../vendor/liquid-glass/liquid-glass.js', import.meta.url), 'utf8');
const adapter = await readFile(new URL('../catalog/player-glass.js', import.meta.url), 'utf8');

// 只验证滤镜结构、能力回退与资源生命周期；画布替身不证明浏览器像素效果。
function environment({ua='Chrome/140 Safari/537.36', failMap=false} = {}) {
  const dom = new JSDOM('<!doctype html><div class="playbar"><span class="playbar-glass" aria-hidden="true"></span><button>播放</button></div>', {runScripts:'outside-only'});
  const w = dom.window, surface = w.document.querySelector('.playbar-glass');
  Object.defineProperty(w.navigator, 'userAgent', {value:ua});
  w.CSS.supports = () => true;
  let width=380, height=88, maps=0;
  Object.defineProperties(surface, {offsetWidth:{get:()=>width}, offsetHeight:{get:()=>height}});
  surface.style.borderRadius = '24px';
  const preferences = new Map(), observers = new Set(), timers = new Map();
  let timerId=0;
  w.matchMedia = query => {
    if (!preferences.has(query)) {
      const preference = new w.EventTarget(); preference.matches=false;
      preferences.set(query, preference);
    }
    return preferences.get(query);
  };
  w.ResizeObserver = class {
    constructor(callback) { this.callback=callback; }
    observe() { observers.add(this); }
    disconnect() { observers.delete(this); }
  };
  w.setTimeout = callback => { const id=++timerId; timers.set(id,callback); return id; };
  w.clearTimeout = id => timers.delete(id);
  w.HTMLCanvasElement.prototype.getContext = () => ({
    getImageData() { return {}; },
    createLinearGradient() { return {addColorStop() {}}; },
    fillRect() {}, beginPath() {}, roundRect() {}, fill() {}
  });
  w.HTMLCanvasElement.prototype.toDataURL = () => {
    if (failMap) throw new Error('画布不可用');
    maps++;
    return 'data:image/png;base64,AA==';
  };
  w.eval(vendor); w.eval(adapter);
  return {w, surface, observers, timers, preferences,
    get maps() { return maps; },
    resize(nextWidth, nextHeight) {
      width=nextWidth; height=nextHeight;
      [...observers].forEach(observer => observer.callback());
      const queued=[...timers.values()]; timers.clear(); queued.forEach(callback => callback());
    },
    close() { w.dispatchEvent(new w.Event('pagehide')); w.close(); }
  };
}

test('玻璃只过滤材质层，随尺寸更新，暂停页面时释放并在返回后重建', () => {
  const env=environment();
  try {
    const {w,surface}=env, doc=w.document;
    assert.equal(surface.dataset.refraction,'on');
    assert.equal(doc.querySelectorAll('feDisplacementMap').length,3);
    assert.match(surface.style.backdropFilter,/url\(#lg-filter-/);
    assert.equal(doc.querySelector('button').style.backdropFilter,'');
    assert.equal(doc.querySelector('.playbar').style.backdropFilter,'');
    assert.equal(doc.querySelector('filter').getAttribute('color-interpolation-filters'),'sRGB');
    assert.equal(doc.querySelector('feImage').getAttribute('width'),'380');
    assert.equal(env.observers.size,1);
    env.resize(300,96);
    assert.equal(doc.querySelector('feImage').getAttribute('width'),'300');
    assert.equal(doc.querySelector('feImage').getAttribute('height'),'96');
    assert.equal(env.maps,2);
    const id=doc.querySelector('filter').id;
    w.dispatchEvent(new w.Event('pagehide'));
    assert.equal(env.observers.size,0); assert.equal(env.timers.size,0);
    assert.equal(doc.querySelector('svg'),null);
    assert.equal(surface.style.backdropFilter,'');
    w.dispatchEvent(new w.Event('pageshow'));
    w.dispatchEvent(new w.Event('pageshow'));
    assert.equal(doc.querySelectorAll('filter').length,1);
    assert.notEqual(doc.querySelector('filter').id,id);
    assert.equal(env.observers.size,1);
  } finally { env.close(); }
});

test('降低透明度、增强对比与强制配色都会停用折射，恢复后仅有一个实例', () => {
  const env=environment();
  try {
    for (const preference of env.preferences.values()) {
      preference.matches=true; preference.dispatchEvent(new env.w.Event('change'));
      assert.equal(env.w.document.querySelector('filter'),null);
      assert.equal(env.surface.style.backdropFilter,'');
      assert.equal(env.observers.size,0);
      preference.matches=false; preference.dispatchEvent(new env.w.Event('change'));
      assert.equal(env.w.document.querySelectorAll('filter').length,1);
      assert.equal(env.observers.size,1);
    }
  } finally { env.close(); }
});

// 磨砂强度随光学参数调整，测试从适配层读取实际配置，不写死数值。
const FALLBACK_BLUR = /fallbackBlur:\s*([\d.]+)/.exec(adapter)?.[1];
assert.ok(FALLBACK_BLUR, '适配层需要声明 fallbackBlur');

test('Safari 与 Firefox 使用磨砂回退，不分配折射图或尺寸监听', () => {
  for (const ua of ['Version/26.0 Safari/605.1.15', 'Firefox/142.0']) {
    const env=environment({ua});
    try {
      assert.equal(env.surface.dataset.refraction,'fallback');
      assert.match(env.surface.style.backdropFilter,new RegExp(`blur\\(${FALLBACK_BLUR}px\\)`));
      assert.equal(env.w.document.querySelector('filter'),null);
      assert.equal(env.observers.size,0); assert.equal(env.maps,0);
      env.w.dispatchEvent(new env.w.Event('pagehide'));
      assert.equal(env.surface.style.backdropFilter,'');
      assert.equal(env.surface.classList.contains('lg-fallback'),false);
    } finally { env.close(); }
  }
});

test('位移图初始化失败时不留空滤镜，播放按钮仍保留', () => {
  const env=environment({failMap:true});
  try {
    assert.equal(env.w.document.querySelector('svg'),null);
    assert.equal(env.surface.style.backdropFilter,'');
    assert.equal(env.observers.size,0);
    assert.equal(env.w.document.querySelector('button').textContent,'播放');
  } finally { env.close(); }
});
