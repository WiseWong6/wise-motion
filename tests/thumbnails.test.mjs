// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data} from './helpers.mjs';
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
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

test('历史左栏全部接入对应原作缩略图，静态单帧与原片定位不增加播放器',async()=>{
  const env=await environment(true,{staticPreview:true});
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
    d.querySelector('[data-kind="action"]').click();env.reveal();
    for(const video of oldVideos)assert.equal(video.getAttribute('src'),null);
    assert.equal(d.querySelectorAll('.thumb .motion-stage').length,data.effects.filter(e=>e.kind==='action').length);assert.equal(w.MotionRuntime.instanceCount,1);
  }finally{close(env);}
});

test('原作单帧复制后保留画面并释放绘制器，迟到载入不能绘制被移除的卡片',async()=>{
  const env=await environment();
  try{
    await load(env,'history-data.js','history-runtime.js');
    const {w}=env,entry=w.MotionHistory.recipes.find(e=>e.entries[0].preview.type==='isolated').entries[0];
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
  const env=await environment(true,{staticPreview:true});
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
  const env=await environment(true,{staticPreview:true});
  try{
    const {w}=env,d=w.document;mediaStub(w);let resolve;
    w.MotionHistoryRuntime.poster=(canvas,entry,_data,{isCurrent})=>new Promise(r=>{
      resolve=()=>{if(isCurrent())canvas.dataset.entry=entry.id;r(isCurrent());};
    });
    d.querySelector('[data-kind="recipe"]').click();env.reveal();await tick();
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
