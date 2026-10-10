// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';
import {readFile} from 'node:fs/promises';
import {history} from '../scripts/history.mjs';
const historyData=await history(data);

async function changeHash(w, hash) {
  const changed = new Promise(resolve => w.addEventListener('hashchange', resolve, {once:true}));
  w.location.hash = hash;
  await changed;
}

test('同一窗口修改书签切换预览，清除筛选并同步目录，兼容旧书签和无效地址',async()=>{
  const env=await environment(true,{hash:'#tile-wave-transition'});
  try{
    const {w}=env,d=w.document;
    for(const [hash,id] of [
      ['#steel-ruler-illustration','steel-ruler-illustration'],
      ['#history-reel-core-rings','core-ring-expand'],
      ['#tile-wave-transition','tile-wave-transition'],
      ['#missing-effect','fade-rise'],
      ['','fade-rise']
    ]){
      const search=d.getElementById('search');
      search.value='zzzzzz';search.dispatchEvent(new w.Event('input'));
      await changeHash(w,hash);
      const effect=data.effects.find(e=>e.id===id);
      assert.equal(d.getElementById('preview-title').textContent,effect.name);
      assert.equal(d.querySelector('.effect-item[aria-current="true"]').dataset.effect,id);
      assert.equal(d.querySelector('[data-kind][aria-pressed="true"]').dataset.kind,effect.kind);
      assert.equal(search.value,'');
      assert.equal(d.getElementById('category-filter').value,'all');
      assert.equal(w.MotionRuntime.instanceCount,1);
    }
  }finally{env.close();}
});

test('更换书签后按当前地址保存选择，刷新恢复且不覆盖原地址记忆',async()=>{
  const values=new Map(),sessionStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  const env=await environment(true,{hash:'#tile-wave-transition',sessionStorage});
  try{
    await changeHash(env.w,'#steel-ruler-illustration');
    assert.equal(JSON.parse(values.get('wise-motion-selection:file:///wise-motion/catalog/index.html#tile-wave-transition')).id,'tile-wave-transition');
    assert.equal(JSON.parse(values.get('wise-motion-selection:file:///wise-motion/catalog/index.html#steel-ruler-illustration')).id,'steel-ruler-illustration');
  }finally{env.close();}
  const refreshed=await environment(true,{hash:'#steel-ruler-illustration',sessionStorage});
  try{assert.equal(refreshed.w.document.querySelector('.effect-item[aria-current="true"]').dataset.effect,'steel-ruler-illustration');}
  finally{refreshed.close();}
});

test('旧书签加载完成不会覆盖后来输入的新书签',async()=>{
  const env=await environment(true,{hash:'#fade-rise',lazyHistory:true});
  try{
    const {w}=env,d=w.document;
    await changeHash(w,'#history-recovered-outline');
    const script=d.querySelector('script[src="history-data.js"]');assert.ok(script);
    await changeHash(w,'#scale-in');
    w.eval(await readFile(new URL('../catalog/history-data.js',import.meta.url),'utf8'));
    script.dispatchEvent(new w.Event('load'));
    await new Promise(resolve=>setTimeout(resolve,0));
    assert.equal(d.querySelector('.effect-item[aria-current="true"]').dataset.effect,'scale-in');
    assert.equal(w.MotionRuntime.instanceCount,1);
  }finally{env.close();}
});

test('已提炼的历史书签直接打开对应动作，不额外加载历史库',async()=>{
  const env=await environment(true,{staticPreview:true,hash:'#history-reel-core-rings',lazyHistory:true});
  try{
    const {w}=env,d=w.document;
    assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,'core-ring-expand');
    assert.equal(d.getElementById('preview-title').textContent,data.effects.find(e=>e.id==='core-ring-expand').name);
    assert.equal(d.querySelector('script[src="history-data.js"]'),null);
    assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionHistoryRuntime.instanceCount,0);
  }finally{env.close();}
});

test('剔除的历史书签安全回到正式动作，历史目录清空且无旧媒体入口',async()=>{
  assert.equal(historyData.recipes.length,0);assert.equal(Object.keys(historyData.source_files).length,0);
  assert.equal(Object.keys(historyData.originals.sources).length,0);assert.equal(historyData.categories.length,0);
  const env=await environment(true,{staticPreview:true,hash:'#history-recovered-outline',lazyHistory:true});
  try{
    const {w}=env,d=w.document,script=d.querySelector('script[src="history-data.js"]');assert.ok(script);
    w.eval(await readFile(new URL('../catalog/history-data.js',import.meta.url),'utf8'));script.dispatchEvent(new w.Event('load'));
    await new Promise(resolve=>setTimeout(resolve,0));
    assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,'fade-rise');
    assert.equal(d.querySelector('[data-kind="recipe"]'),null);
    assert.equal(d.querySelectorAll('[data-kind]').length,3);
    assert.ok(d.querySelectorAll('.effect-item').length>0);
    assert.equal(w.MotionHistoryRuntime.instanceCount,0);assert.equal(d.querySelectorAll('video,audio').length,0);
  }finally{env.close();}
});

test('两侧切换遵循筛选与搜索顺序，首尾循环，切换同步输出并释放旧画面', async () => {
  const env = await environment(true,{staticPreview:true});
  try {
    const {w} = env, d = w.document;
    const previous = d.getElementById('previous-effect'), next = d.getElementById('next-effect');
    const current = () => d.querySelector('#preview .motion-stage').dataset.effect;
    const ids = () => [...d.querySelectorAll('.effect-item')].map(card => card.dataset.effect);
    const firstThumb = d.querySelector('.thumb');
    const original = ids();
    d.querySelector(`[data-effect="${original[0]}"]`).click();
    previous.click(); assert.equal(current(), original.at(-1));
    next.click(); assert.equal(current(), original[0]);
    next.click(); assert.equal(current(), original[1]);
    assert.ok(d.getElementById('prompt').textContent.includes('动效说明：'+w.MotionRegistry.effects.find(effect=>effect.id===current()).name));
    assert.equal(d.querySelector('.thumb'), firstThumb); assert.ok(firstThumb.isConnected);
    env.reveal();await w.MotionThumbs.whenIdle(); assert.equal(firstThumb.querySelector('.motion-stage').dataset.effect, original[0]);
    const category = d.getElementById('category-filter');
    category.value = 'continuous'; category.dispatchEvent(new w.Event('change'));
    env.reveal(); assert.equal(firstThumb.childElementCount, 0);
    const filtered = ids(); assert.equal(filtered.length, w.MotionRegistry.effects.filter(effect => effect.kind === 'action' && effect.category === 'continuous').length);
    previous.click(); assert.equal(current(), filtered.at(-1));
    next.click(); assert.equal(current(), filtered[0]);
    d.querySelector('[data-kind="composition"]').click();
    const combinations = ids(); assert.equal(combinations.length, w.MotionRegistry.effects.filter(effect => effect.kind === 'composition').length);
    next.click(); assert.equal(current(), combinations[0]);
    const search = d.getElementById('search');
    d.querySelector('[data-kind="action"]').click();
    search.value = '两排反向持续滚动，不要轮播，不要停顿'; search.dispatchEvent(new w.Event('input'));
    next.click(); assert.equal(current(), 'dual-scroll');
    assert.ok(previous.disabled && next.disabled);
    search.value = 'zzzzzz'; search.dispatchEvent(new w.Event('input'));
    await new Promise(resolve => setTimeout(resolve, 160));
    assert.equal(ids().length, 0); assert.ok(previous.disabled && next.disabled);
    assert.equal(current(), 'dual-scroll');
    assert.equal(w.MotionRuntime.instanceCount, 1); assert.equal(env.listeners.size, 3);
    assert.equal(w.MotionRuntime.runningCount, 0);
  } finally { env.close(); }
});

test('左右方向键切换画面，输入、滑块、菜单、输出页签及抽屉保留各自键盘操作', async () => {
  const env = await environment(true,{staticPreview:true});
  try {
    const {w, directoryMedia} = env, d = w.document;
    const current = () => d.querySelector('#preview .motion-stage').dataset.effect;
    const key = (target, name, options = {}) => target.dispatchEvent(new w.KeyboardEvent('keydown', {key:name,bubbles:true,cancelable:true,...options}));
    key(d.body, 'ArrowRight'); assert.equal(current(), 'scale-in');
    key(d.body, 'ArrowLeft'); assert.equal(current(), 'fade-rise');
    for (const selector of ['#search','#speed','#scrub','#prompt']) key(d.querySelector(selector), 'ArrowRight');
    for (const option of ['ctrlKey','metaKey','altKey','shiftKey','isComposing']) key(d.body, 'ArrowRight', {[option]:true});
    assert.equal(current(), 'fade-rise');
    d.querySelector('.search').getBoundingClientRect = () => ({top:100,bottom:136,left:12,width:280});
    d.getElementById('category-filter').click();
    key(d.body, 'ArrowRight'); assert.equal(current(), 'fade-rise');
    key(d.getElementById('category-options'), 'Escape');
    d.getElementById('tab-prompt').focus(); key(d.getElementById('tab-prompt'), 'ArrowRight');
    assert.equal(d.activeElement.id, 'tab-code'); assert.equal(current(), 'fade-rise');
    d.querySelector('[data-effect="fade-rise"]').focus();
    key(d.activeElement, 'ArrowRight');
    assert.equal(current(), 'scale-in'); assert.equal(d.activeElement.dataset.effect, 'scale-in');
    d.querySelector('[data-group="entrance"]').click();
    d.getElementById('next-effect').focus(); key(d.activeElement, 'ArrowRight');
    assert.equal(d.activeElement.id, 'next-effect');
    assert.equal(d.querySelector('[data-group="entrance"]').getAttribute('aria-expanded'), 'true');
    directoryMedia.matches = true; directoryMedia.dispatchEvent(new w.Event('change'));
    d.getElementById('toggle-directory').click();
    const before = current(); key(d.body, 'ArrowRight'); assert.equal(current(), before);
    key(d.getElementById('search'), 'Escape'); key(d.body, 'ArrowRight');
    assert.notEqual(current(), before); assert.equal(w.MotionRuntime.instanceCount, 1);
  } finally { env.close(); }
});
