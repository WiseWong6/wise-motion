// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data,historicalDrawingFixture} from './helpers.mjs';
import {historyTestData} from './history-fixture.mjs';

test('缩略图观察侧栏滚动区并提前准备附近卡片，远处卡片保持未绘制', async () => {
  const env = await environment(true, {staticPreview: true});
  try {
    const {w} = env, d = w.document, list = d.getElementById('effects-list');
    const observer = env.observers.find(item => item.nodes.has(list.querySelector('.thumb')));
    assert.equal(observer.options.root, list, '提前范围须应用到真正滚动的侧栏');
    assert.equal(observer.options.rootMargin, '320px 0px');
    const nearby = d.querySelector('[data-effect="scale-in"] .thumb');
    const distant = d.querySelector('[data-effect="countdown-dial"] .thumb');
    assert.equal(d.querySelectorAll('.thumb .motion-stage').length, 0);
    assert.equal(list.getAttribute('aria-busy'), 'false', '卡片已挂入后，目录加载状态结束');
    assert.equal(nearby.querySelectorAll('.thumb-loading .apple-pulse-dot').length, 3);
    observer.callback([{target: nearby, isIntersecting: true}, {target: distant, isIntersecting: false}]);
    await w.MotionThumbs.whenIdle();
    assert.ok(nearby.querySelector('.motion-stage'));
    assert.equal(nearby.querySelector('.thumb-loading'), null, '真实画面绘制完成才移除加载提示');
    assert.equal(nearby.dataset.previewState, 'ready');
    assert.equal(distant.querySelector('.motion-stage'), null);
    assert.equal(distant.querySelectorAll('.thumb-loading .apple-pulse-dot').length, 3);
    assert.equal(distant.dataset.previewState, 'loading');
    assert.equal(w.MotionRuntime.instanceCount, 1, '预备缩略图不能新增播放器');
    assert.ok(!observer.nodes.has(nearby));
    assert.ok(observer.nodes.has(distant));
  } finally { env.close(); }
});

test('缺失或抛错的绘制器明确标注缩略图失败，其他条目仍能绘制', async () => {
  const env = await environment();
  try {
    await load(env, 'thumbnails.js');
    const {w} = env;
    const missing = data.effects.find(effect => effect.id === 'fade-rise');
    const broken = data.effects.find(effect => effect.id === 'stagger-in');
    const good = data.effects.find(effect => effect.id === 'scale-in');
    assert.ok(good);
    delete w.MotionFactories[missing.id];
    w.MotionFactories[broken.id] = () => { throw new Error('测试绘制失败'); };
    const hosts = [missing, broken, good].map(effect => {
      const host = w.document.createElement('div'); w.document.body.append(host);
      w.MotionThumbs.attach(host, effect); return host;
    });
    env.reveal(); await w.MotionThumbs.whenIdle();
    assert.equal(hosts[0].textContent, '预览暂不可用');
    assert.match(hosts[0].title, /缺少效果源码/);
    assert.equal(hosts[0].querySelector('.thumb-loading'), null);
    assert.equal(hosts[0].dataset.previewState, 'error');
    assert.equal(hosts[1].textContent, '预览暂不可用');
    assert.equal(hosts[1].title, '测试绘制失败');
    assert.ok(hosts[2].querySelector('.motion-stage'));
    w.MotionThumbs.disposeAll();
    assert.ok(hosts.every(host => host.childElementCount === 0));
  } finally { env.close(); }
});
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));

test('快速滚走取消尚未开始的缩略图，重新进入后再准备',async()=>{
  const env=await environment();
  try{
    await load(env,'thumbnails.js');const {w}=env,drawn=[];let finish;
    const ready=new Promise(resolve=>{finish=resolve;});
    const effects=['scroll-first','scroll-later'].map(id=>({id,duration_ms:1000,preview_ms:500}));
    effects.forEach((effect,index)=>{w.MotionFactories[effect.id]=()=>{drawn.push(effect.id);const render=()=>{};if(!index)render.ready=ready;return render;};});
    const hosts=effects.map(effect=>{const host=w.document.createElement('span');w.document.body.append(host);w.MotionThumbs.attach(host,effect);return host;});
    const observer=env.observers.find(item=>item.nodes.has(hosts[0]));
    observer.callback(hosts.map(target=>({target,isIntersecting:true})));await tick();
    observer.callback([{target:hosts[1],isIntersecting:false}]);finish();await w.MotionThumbs.whenIdle();
    assert.deepEqual(drawn,['scroll-first']);assert.ok(observer.nodes.has(hosts[1]));
    observer.callback([{target:hosts[1],isIntersecting:true}]);await w.MotionThumbs.whenIdle();
    assert.deepEqual(drawn,['scroll-first','scroll-later']);assert.equal(hosts[1].dataset.previewState,'ready');
  }finally{close(env);}
});

test('离开列表的画布缓存不超过64 MiB，尺寸调整先统一读取再写入',async()=>{
  const env=await environment();
  try{
    const {w}=env;w.IntersectionObserver=undefined;await load(env,'thumbnails.js');
    const draws=new Map(),events=[];
    w.MotionFactories['large-cache']=stage=>{const canvas=w.document.createElement('canvas');canvas.width=canvas.height=2048;stage.append(canvas);return()=>draws.set(stage.dataset.effect,(draws.get(stage.dataset.effect)||0)+1);};
    const effects=Array.from({length:5},(_,i)=>({id:'large-cache-'+i,source:{factory:'large-cache'},duration_ms:1000,preview_ms:500}));
    const host=w.document.createElement('span');w.document.body.append(host);
    async function visit(effect){w.MotionThumbs.attach(host,effect);await w.MotionThumbs.whenIdle();w.MotionThumbs.release(host);}
    for(const effect of effects)await visit(effect);
    await visit(effects[4]);assert.equal(draws.get(effects[4].id),1);
    await visit(effects[0]);assert.equal(draws.get(effects[0].id),2,'第五张16 MiB画布应淘汰最早的缓存');
    for(let i=0;i<2;i++){
      const node=w.document.createElement('span'),stage=w.document.createElement('div');node.className='thumb';stage.className='motion-stage';node.append(stage);w.document.body.append(node);
      node.getBoundingClientRect=()=>{events.push('read');return{width:160,height:90};};
      Object.defineProperty(stage.style,'transform',{get:()=>'',set:()=>events.push('write')});
    }
    w.MotionThumbs.resize();assert.deepEqual(events,['read','read','write','write']);
  }finally{close(env);}
});
async function load(env,...files){
  for(const file of files)env.w.eval(await readFile(new URL('../catalog/'+file,import.meta.url),'utf8'));
}
function mediaStub(w){
  let played=0;
  w.HTMLMediaElement.prototype.pause=function(){};
  w.HTMLMediaElement.prototype.load=function(){};
  w.HTMLMediaElement.prototype.play=function(){played++;return Promise.resolve();};
  return ()=>played;
}
function close(env){env.w.MotionThumbs?.disposeAll();env.close();}

test('素材加载、耗时准备与普通缩略图按页面顺序共用队列，通知逆序也不抢先显示',async()=>{
  const env=await environment();
  try{
    await load(env,'thumbnails.js');
    const {w}=env,events=[],effects=['ordered-first','ordered-second','ordered-third'].map(id=>({id,duration_ms:1000,preview_ms:500}));
    let loadReady,drawReady,loaded=false,idle=false;
    const resource=new Promise(resolve=>{loadReady=()=>{loaded=true;resolve();};});
    const prepared=new Promise(resolve=>{drawReady=resolve;});
    w.MotionLazy={ensure(effect){if(effect.id===effects[0].id&&!loaded){events.push('load-first');return resource;}return null;}};
    for(const [index,effect] of effects.entries()){
      const factory=()=>{events.push('start-'+index);const draw=()=>events.push('show-'+index);if(index===0)draw.ready=prepared;return draw;};
      if(index===0)factory.requiresPreparation=true;
      w.MotionFactories[effect.id]=factory;
    }
    const hosts=effects.map(effect=>{const node=w.document.createElement('div');w.document.body.append(node);w.MotionThumbs.attach(node,effect);return node;});
    const observer=env.observers.find(item=>item.nodes.has(hosts[0]));
    observer.callback(hosts.toReversed().map(target=>({target,isIntersecting:true})));
    const done=w.MotionThumbs.whenIdle().then(()=>{idle=true;});
    await tick();assert.deepEqual(events,['load-first']);assert.equal(idle,false);
    loadReady();await tick();assert.deepEqual(events,['load-first','start-0']);assert.equal(idle,false);
    assert.ok(hosts.every(host=>host.dataset.previewState==='loading'));
    drawReady();await done;
    assert.deepEqual(events,['load-first','start-0','show-0','start-1','show-1','start-2','show-2']);
    assert.ok(hosts.every(host=>host.dataset.previewState==='ready'));
    assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{close(env);}
});

test('取消等待脚本的卡片立即继续下一张，迟到结果不能覆盖同位置的新卡片',async()=>{
  const env=await environment();
  try{
    await load(env,'thumbnails.js');
    const {w}=env,drawn=[],effects=['loading-old','loading-next','loading-new'].map(id=>({id,duration_ms:1000,preview_ms:500}));
    let finish;
    const resource=new Promise(resolve=>{finish=resolve;});
    w.MotionLazy={ensure:effect=>effect.id===effects[0].id?resource:null};
    for(const effect of effects)w.MotionFactories[effect.id]=()=>()=>drawn.push(effect.id);
    const hosts=effects.slice(0,2).map(effect=>{const node=w.document.createElement('div');w.document.body.append(node);w.MotionThumbs.attach(node,effect);return node;});
    env.reveal();await tick();assert.deepEqual(drawn,[]);
    w.MotionThumbs.release(hosts[0]);
    w.MotionThumbs.attach(hosts[0],effects[2]);env.reveal();
    await w.MotionThumbs.whenIdle();
    assert.deepEqual(drawn,['loading-new','loading-next']);
    finish();await tick();
    assert.deepEqual(drawn,['loading-new','loading-next']);
    assert.equal(hosts[0].querySelector('.motion-stage').dataset.effect,'loading-new');
  }finally{close(env);}
});

test('切换目录页签、分类与搜索后复用已完成缩略图，不再次绘制或显示加载提示',async()=>{
  const env=await environment(true,{staticPreview:true});
  try{
    const {w}=env,d=w.document,original=w.MotionFactories['scale-in'];let draws=0;
    w.MotionFactories['scale-in']=(...args)=>{draws++;return original(...args);};
    const first=d.querySelector('[data-effect="scale-in"] .thumb');
    const observer=env.observers.find(item=>item.nodes.has(first));
    observer.callback([{target:first,isIntersecting:true}]);await w.MotionThumbs.whenIdle();
    const stage=first.querySelector('.motion-stage');assert.equal(draws,1);
    function restored(){
      const host=d.querySelector('[data-effect="scale-in"] .thumb');
      assert.notEqual(host,first);assert.equal(host.querySelector('.motion-stage'),stage);
      assert.equal(host.querySelector('.thumb-loading'),null);assert.equal(host.dataset.previewState,'ready');
      observer.callback([{target:host,isIntersecting:true}]);assert.equal(draws,1);
    }
    for(const kind of ['composition','illustration']){
      d.querySelector(`[data-kind="${kind}"]`).click();assert.equal(first.childElementCount,0);
      d.querySelector('[data-kind="action"]').click();restored();
    }
    const category=d.getElementById('category-filter');category.value='continuous';category.dispatchEvent(new w.Event('change'));
    assert.equal(d.querySelector('[data-effect="scale-in"]'),null);
    category.value='all';category.dispatchEvent(new w.Event('change'));restored();
    const search=d.getElementById('search');search.value='__不存在的参考__';search.dispatchEvent(new w.Event('input'));
    await new Promise(resolve=>setTimeout(resolve,160));assert.equal(d.querySelector('[data-effect="scale-in"]'),null);
    d.getElementById('search-clear').click();restored();
    assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);assert.equal(env.listeners.size,3);
  }finally{close(env);}
});

test('缓存保留原画布并按新卡片尺寸缩放，同一标识的不同定义不会共用画面',async()=>{
  const env=await environment();
  try{
    const {w}=env;w.IntersectionObserver=undefined;await load(env,'thumbnails.js');
    const effect={id:'cached-canvas',duration_ms:1000,preview_ms:640,default_ease:'linear'};
    let draws=0,destroyed=0;
    const factory=stage=>{
      const canvas=w.document.createElement('canvas');canvas.width=640;canvas.height=360;stage.append(canvas);
      const draw=time=>{draws++;canvas.dataset.time=String(time);};draw.ready=Promise.resolve();
      draw.destroy=preserve=>{destroyed++;assert.equal(preserve,true);assert.ok(canvas.isConnected);};
      return draw;
    };
    factory.requiresPreparation=true;w.MotionFactories[effect.id]=factory;
    const first=w.document.createElement('span');first.className='thumb';first.getBoundingClientRect=()=>({width:160,height:90});
    w.document.body.append(first);w.MotionThumbs.attach(first,effect);await w.MotionThumbs.whenIdle();
    const stage=first.querySelector('.motion-stage'),canvas=stage.querySelector('canvas');
    assert.equal(draws,1);assert.equal(destroyed,1);w.MotionThumbs.release(first);
    assert.equal(first.childElementCount,0);assert.equal(canvas.width,640);assert.equal(canvas.height,360);
    const next=w.document.createElement('span');next.className='thumb';next.getBoundingClientRect=()=>({width:128,height:72});
    w.MotionThumbs.attach(next,effect);w.document.body.append(next);await w.MotionThumbs.whenIdle();
    assert.equal(next.querySelector('canvas'),canvas);assert.equal(canvas.dataset.time,'640');
    assert.match(stage.style.transform,/scale\(0\.2\)/);assert.equal(draws,1);assert.equal(destroyed,1);
    assert.equal(next.querySelector('.thumb-loading'),null);
    w.MotionThumbs.release(next);
    w.MotionThumbs.attach(next,{...effect,preview_ms:720});await w.MotionThumbs.whenIdle();
    assert.notEqual(next.querySelector('canvas'),canvas);assert.equal(next.querySelector('canvas').dataset.time,'720');
    assert.equal(draws,2);assert.equal(destroyed,2);assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{close(env);}
});

test('离开列表的缓存最多保留128张，淘汰久未使用的画面，完整释放后重新绘制',async()=>{
  const env=await environment();
  try{
    const {w}=env;w.IntersectionObserver=undefined;await load(env,'thumbnails.js');
    const draws=new Map();
    w.MotionFactories['cache-budget']=stage=>()=>{
      draws.set(stage.dataset.effect,(draws.get(stage.dataset.effect)||0)+1);
    };
    const effects=Array.from({length:129},(_,i)=>({id:'cache-budget-'+i,source:{factory:'cache-budget'},duration_ms:1000,preview_ms:640}));
    const node=w.document.createElement('span');w.document.body.append(node);
    async function visit(effect){w.MotionThumbs.attach(node,effect);await w.MotionThumbs.whenIdle();w.MotionThumbs.release(node);}
    // 先填满缓存，再复用最早的一张；新条目应淘汰其次久未使用的画面。
    for(const effect of effects.slice(0,128))await visit(effect);
    await visit(effects[0]);assert.equal(draws.get(effects[0].id),1);
    await visit(effects[128]);await visit(effects[0]);assert.equal(draws.get(effects[0].id),1);
    await visit(effects[1]);assert.equal(draws.get(effects[1].id),2);
    await visit(effects[128]);assert.equal(draws.get(effects[128].id),1);
    w.dispatchEvent(new w.Event('pagehide'));w.dispatchEvent(new w.Event('pageshow'));
    await visit(effects[128]);assert.equal(draws.get(effects[128].id),2,'离开页面须清空未显示的缓存');
    w.MotionThumbs.disposeAll();await visit(effects[128]);assert.equal(draws.get(effects[128].id),3);
    assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(env.listeners.size,0);
  }finally{close(env);}
});

test('历史左栏全部接入对应原作缩略图，静态单帧与原片定位不增加播放器',async()=>{
  const env=await environment(true,{staticPreview:true,historyFixture:true});
  try{
    const {w}=env,d=w.document,played=mediaStub(w),drawn=[];
    // 原作绘制器另测；这里核对真实目录条目接到各自的图片、画布或原片。
    w.MotionHistoryRuntime.poster=async(canvas,entry,_data,{isCurrent})=>{
      if(!isCurrent())return false;
      canvas.dataset.entry=entry.id;drawn.push(entry.id);return true;
    };
    d.querySelector('[data-kind="recipe"]').click();
    const cards=[...d.querySelectorAll('#effects-list .effect-item')];
    assert.equal(cards.length,w.MotionHistory.recipes.length);assert.equal(drawn.length,0);
    env.reveal();await w.MotionThumbs.whenIdle();
    const counts={image:0,canvas:0,video:0};
    for(const card of cards){
      const effect=w.MotionHistory.recipes.find(e=>e.id===card.dataset.effect),entry=effect.entries[0],preview=entry.preview;
      const host=card.querySelector('.thumb');
      assert.equal(host.querySelector('.history-placeholder'),null,effect.name);
      if(typeof preview.poster==='string'){
        counts.image++;assert.equal(host.querySelector('img')?.src,preview.poster,effect.name);
      }else if(preview.type==='isolated'||preview.type==='web-isolated'){
        counts.canvas++;assert.equal(host.querySelector('canvas')?.dataset.entry,entry.id,effect.name);
      }else{
        counts.video++;const video=host.querySelector('video');assert.equal(video?.src,preview.file,effect.name);
        assert.ok(video.muted&&video.defaultMuted&&video.paused);assert.equal(video.volume,0);
        video.dispatchEvent(new w.Event('loadedmetadata'));
        assert.equal(video.currentTime,(preview.start||0)+preview.duration*.65,effect.name);
      }
    }
    const expected={image:0,canvas:0,video:0};
    for(const effect of w.MotionHistory.recipes){const p=effect.entries[0].preview;expected[typeof p.poster==='string'?'image':['isolated','web-isolated'].includes(p.type)?'canvas':'video']++;}
    assert.deepEqual(counts,expected);assert.equal(new Set(drawn).size,expected.canvas);
    assert.equal(played(),0);assert.equal(w.MotionRuntime.instanceCount,1);
    assert.equal(w.MotionHistoryRuntime.instanceCount,0);assert.equal(env.listeners.size,3);
    assert.equal(w.MotionRuntime.runningCount,0);assert.equal(w.MotionHistoryRuntime.runningCount,0);
    const oldVideos=[...d.querySelectorAll('.thumb video')];
    d.querySelector('[data-kind="action"]').click();env.reveal();await w.MotionThumbs.whenIdle();
    for(const video of oldVideos)assert.equal(video.getAttribute('src'),null);
    assert.equal(d.querySelectorAll('.thumb .motion-stage').length,data.effects.filter(e=>e.kind==='action').length);assert.equal(w.MotionRuntime.instanceCount,1);
  }finally{close(env);}
});

test('原作单帧复制后保留画面并释放绘制器，迟到载入不能绘制被移除的卡片',async()=>{
  const env=await environment();
  try{
    await load(env,'history-data.js','history-runtime.js');env.w.MotionHistory=historyTestData();
    const {w}=env,entry=historicalDrawingFixture(w.MotionHistory.recipes[0]).entries[0];
    const canvas=w.document.createElement('canvas');canvas.width=360;canvas.height=480;
    let copies=0,disposed=0,source;
    canvas.getContext=()=>({drawImage(frame,x,y){
      copies++;assert.equal(x,0);assert.equal(y,0);assert.equal(disposed,0);
      assert.equal(frame.width,360);assert.equal(frame.height,480);
      canvas.dataset.time=frame.dataset.time;
    }});
    assert.ok(await w.MotionHistoryRuntime.poster(canvas,entry,w.MotionHistory,{mount:async frame=>{
      source=frame;
      return {render(t){frame.dataset.time=String(t);},dispose(){disposed++;frame.width=frame.height=1;}};
    }}));
    assert.equal(canvas.dataset.time,String(entry.preview.duration*entry.preview.poster));
    assert.equal(copies,1);assert.equal(disposed,1);assert.equal(source.width,1);
    assert.equal(canvas.width,360);assert.equal(canvas.height,480);assert.equal(w.MotionHistoryRuntime.instanceCount,0);
    let active=true,resolve,lateDraws=0,lateDisposals=0;
    const late=w.MotionHistoryRuntime.poster(canvas,entry,w.MotionHistory,{
      isCurrent:()=>active,mount:()=>new Promise(r=>{resolve=r;})
    });
    active=false;resolve({render(){lateDraws++;},dispose(){lateDisposals++;}});
    assert.equal(await late,false);assert.equal(lateDraws,0);assert.equal(lateDisposals,1);assert.equal(copies,1);
  }finally{close(env);}
});

test('单个原作绘制失败不挡后续缩略图，失效图片可用静音原片代表帧',async()=>{
  const env=await environment(true,{staticPreview:true,historyFixture:true});
  try{
    const {w}=env,d=w.document,played=mediaStub(w);let calls=0;
    w.MotionHistoryRuntime.poster=async(canvas,entry)=>{
      if(++calls===1)throw new Error('测试原作无法加载');canvas.dataset.entry=entry.id;return true;
    };
    d.querySelector('[data-kind="recipe"]').click();env.reveal();await w.MotionThumbs.whenIdle();
    const expected=w.MotionHistory.recipes.filter(e=>['isolated','web-isolated'].includes(e.entries[0].preview.type)&&typeof e.entries[0].preview.poster!=='string').length;
    assert.equal(calls,expected);assert.equal(d.querySelectorAll('.thumb .history-placeholder').length,1);
    assert.equal(d.querySelectorAll('.thumb canvas[data-entry]').length,expected-1);
    const img=d.querySelector('.thumb img'),host=img.parentElement;
    const effect=w.MotionHistory.recipes.find(e=>e.id===host.closest('.effect-item').dataset.effect);
    img.dispatchEvent(new w.Event('error'));const video=host.querySelector('video');
    assert.equal(video.src,effect.entries[0].preview.file);assert.ok(video.muted&&video.defaultMuted&&video.paused);
    video.dispatchEvent(new w.Event('loadedmetadata'));
    assert.equal(video.currentTime,(effect.entries[0].preview.start||0)+effect.entries[0].preview.duration*.65);
    assert.equal(played(),0);
    video.dispatchEvent(new w.Event('error'));assert.equal(host.textContent,'预览暂不可用');
    assert.equal(w.MotionRuntime.instanceCount,1);
  }finally{close(env);}
});

test('离开页面释放缩略图，返回后恢复，旧的异步绘制不能覆盖新卡片',async()=>{
  const env=await environment(true,{staticPreview:true,historyFixture:true});
  try{
    const {w}=env,d=w.document;mediaStub(w);let resolve,started;
    const preparing=new Promise(r=>{started=r;});
    w.MotionHistory.recipes[3].entries[0].preview={...w.MotionHistory.recipes[0].entries[0].preview};
    w.MotionHistoryRuntime.poster=(canvas,entry,_data,{isCurrent})=>new Promise(r=>{
      resolve=()=>{if(isCurrent())canvas.dataset.entry=entry.id;r(isCurrent());};
      started();
    });
    d.querySelector('[data-kind="recipe"]').click();env.reveal();await preparing;
    const oldCanvas=d.querySelector('.thumb canvas'),oldVideos=[...d.querySelectorAll('.thumb video')];
    w.dispatchEvent(new w.Event('pagehide'));
    assert.equal(d.querySelectorAll('.thumb > *').length,0);assert.equal(w.MotionRuntime.instanceCount,0);
    for(const video of oldVideos)assert.equal(video.getAttribute('src'),null);
    const pending=w.MotionThumbs.whenIdle();resolve();await pending;
    assert.equal(oldCanvas.dataset.entry,undefined);
    w.MotionHistoryRuntime.poster=async(canvas,entry,_data,{isCurrent})=>{
      if(isCurrent())canvas.dataset.entry=entry.id;return isCurrent();
    };
    w.dispatchEvent(new w.Event('pageshow'));env.reveal();await w.MotionThumbs.whenIdle();
    const counts={image:0,canvas:0,video:0};
    for(const effect of w.MotionHistory.recipes){const p=effect.entries[0].preview;counts[typeof p.poster==='string'?'image':['isolated','web-isolated'].includes(p.type)?'canvas':'video']++;}
    assert.equal(d.querySelectorAll('.thumb canvas[data-entry]').length,counts.canvas);
    assert.equal(d.querySelectorAll('.thumb img').length,counts.image);assert.equal(d.querySelectorAll('.thumb video').length,counts.video);
    assert.notEqual(d.querySelector('.thumb canvas'),oldCanvas);assert.equal(w.MotionRuntime.instanceCount,1);
    assert.equal(w.MotionHistoryRuntime.instanceCount,0);assert.equal(env.listeners.size,3);
  }finally{close(env);}
});

test('浏览器没有可见范围观察器时，先登记后挂入页面的卡片仍会绘制',async()=>{
  const env=await environment();
  try{
    const {w}=env;w.IntersectionObserver=undefined;await load(env,'thumbnails.js');
    const host=w.document.createElement('span');host.className='thumb';
    host.getBoundingClientRect=()=>({width:160,height:90});
    w.MotionThumbs.attach(host,data.effects.find(e=>e.id==='fade-rise'));w.document.body.append(host);
    await tick();
    const stage=host.querySelector('.motion-stage');assert.equal(stage?.dataset.effect,'fade-rise');
    assert.match(stage.style.transform,/scale\(0\.25\)/);assert.equal(w.MotionThumbs.supported,false);
    assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(env.listeners.size,0);
    w.MotionThumbs.release(host);assert.equal(host.childElementCount,0);
  }finally{close(env);}
});
