// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {environment, data} from './helpers.mjs';

test('播放条同一帧不重复写入，播放期间声音按钮只在开关变化时更新', async () => {
  let update;
  const env = await environment(true, {staticPreview:true, beforeApp(w) {
    const create=w.MotionRuntime.create;
    w.MotionRuntime.create=(root,effect,options)=>{update=options.onUpdate;return create(root,effect,options);};
  }});
  try {
    const {w}=env,d=w.document,observer=new w.MutationObserver(()=>{});
    observer.observe(d.querySelector('.playbar'),{subtree:true,attributes:true,childList:true,characterData:true});
    const state={time:1000,duration:2400,paused:true,hasAudio:true,muted:true};
    update(state);observer.takeRecords();
    const sound=d.getElementById('toggle-sound');
    assert.equal(sound.parentElement.className,'playback-timeline');
    assert.equal(sound.previousElementSibling.id,'time-current');
    assert.ok(sound.nextElementSibling.matches('.scrub'));
    assert.ok(sound.querySelector('[data-icon="speaker-muted"] svg'));
    const mutedIcon=sound.innerHTML;
    for(let i=0;i<120;i++)update(state);
    assert.equal(observer.takeRecords().length,0);
    for(let i=0;i<120;i++)update({...state,time:i*1000/60});
    assert.equal(observer.takeRecords().filter(item=>item.target.id==='toggle-sound').length,0);
    update({...state,muted:false});
    assert.equal(sound.getAttribute('aria-pressed'),'true');
    assert.equal(sound.getAttribute('aria-label'),'关闭组合声音');
    assert.ok(sound.querySelector('[data-icon="speaker-on"] svg'));
    assert.notEqual(sound.innerHTML,mutedIcon);
    update(state);
    assert.equal(sound.getAttribute('aria-pressed'),'false');
    assert.equal(sound.getAttribute('aria-label'),'开启组合声音');
    assert.equal(sound.innerHTML,mutedIcon);
    update({...state,hasAudio:false});assert.equal(d.getElementById('toggle-sound').hidden,true);
    observer.disconnect();observer.observe(d.getElementById('effects-list'),{subtree:true,attributes:true,attributeFilter:['aria-current']});
    d.querySelector('[data-effect="scale-in"]').click();assert.equal(observer.takeRecords().length,2);
    observer.disconnect();
  } finally {env.w.MotionThumbs.disposeAll();env.close();}
});

test('首屏脚本控制在预算内，浏览器播放器复用页面数据且保留组合原声', async () => {
  const html=await readFile(new URL('../catalog/index.html',import.meta.url),'utf8');
  const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(match=>match[1]);
  const sizes=await Promise.all(scripts.map(file=>stat(new URL('../catalog/'+file,import.meta.url))));
  assert.ok(sizes.reduce((sum,file)=>sum+file.size,0)<3_600_000,'首屏不应恢复重复目录或大体积绘制数据');
  const env=await environment();
  try {
    const {w}=env;
    w.MotionRegistry.effects=w.MotionRegistry.effects.map(effect=>effect.id==='stagger-in'?{...effect,name:'页面中的当前定义'}:effect);
    w.eval(await readFile(new URL('../catalog/remotion-player.js',import.meta.url),'utf8'));
    assert.equal(w.WiseRemotion.resolveEffect('stagger-in').name,'页面中的当前定义');
    assert.ok(w.WiseRemotion.resolveEffect('balloon-drive-journey').audio.tracks.length);
  } finally {env.close();}
});

test('筛选保留已有卡片与缩略图，移出的卡片释放内容', async () => {
  const env = await environment(true);
  try {
    const {w} = env, d = w.document;
    env.reveal();await w.MotionThumbs.whenIdle();
    const card = d.querySelector('[data-effect="countdown-dial"]');
    const stage = card.querySelector('.motion-stage');
    const removed = d.querySelector('[data-effect="fade-rise"] .thumb');
    const filter = d.getElementById('category-filter');
    filter.value = 'data'; filter.dispatchEvent(new w.Event('change'));
    assert.equal(d.querySelector('[data-effect="countdown-dial"]'), card);
    assert.equal(card.querySelector('.motion-stage'), stage);
    assert.equal(removed.childElementCount, 0);
    assert.equal(d.querySelectorAll('.effect-item').length, data.effects.filter(e=>e.category==='data').length);
    assert.equal(w.MotionRuntime.instanceCount, 1);
  } finally { env.close(); }
});

test('静止终态不重复写图形属性，频谱避免逐帧三角运算及重复修改', async () => {
  const env = await environment();
  try {
    const {w} = env, root = w.document.getElementById('root');
    for (const id of ['map-paint', 'rigid-rebound', 'benchmark-columns', 'dot-route-illustration', 'scene-carry']) {
      const e = data.effects.find(e => e.id === id);
      const render = w.MotionKit.createRenderer(root, e);
      const options={ease:e.default_ease,duration:e.duration_ms};
      render(e.duration_ms,options);
      const observer = new w.MutationObserver(() => {});
      observer.observe(root, {subtree:true, attributes:true, childList:true, characterData:true});
      render(e.duration_ms,options);
      assert.equal(observer.takeRecords().length, 0, id);
      observer.disconnect();
    }
    const e = data.effects.find(e => e.id === 'data-pulse');
    const render = w.MotionFactories[e.id](root, w.MotionKit, e);
    const originalSin = w.Math.sin; let calls = 0;
    w.Math.sin = value => { calls++; return originalSin(value); };
    try {
      const observer = new w.MutationObserver(() => {});
      observer.observe(root,{subtree:true,attributes:true,childList:true,characterData:true});
      for (const p of [0, .17, .5, .83, 1]) {
        calls = 0; render(p * e.duration_ms);
        assert.equal(calls, 0);
        assert.ok(observer.takeRecords().length <= 205,'镜像条与外圈粒点应合并绘制');
        render(p * e.duration_ms);
        assert.equal(observer.takeRecords().length,0,'同一帧不应再次修改图形');
      }
      observer.disconnect();
    } finally { w.Math.sin = originalSin; }
  } finally { env.close(); }
});
