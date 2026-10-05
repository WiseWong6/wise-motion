/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 目录卡片的静态缩略图。
   复用 effects 的渲染函数直接画一帧，不建立 Anime.js 计时器，也不注册 ResizeObserver，
   所以目录里有多少张卡片都不会拖慢预览或占用播放资源。
   历史案例沿用原作图片或单帧绘制；没有可见范围观察器时也正常绘制。 */
(function (global) {
  'use strict';
  const painted = new WeakSet();
  const pending = new WeakMap();
  const states = new Map();
  let queue = Promise.resolve(), suspended = false, resume = [];
  /* 和主预览共用完整 16:9 画板，不放大裁掉卡片底部。 */
  let observer = null;
  const supported = typeof IntersectionObserver === 'function';

  const current = (host,state) => !suspended && state.active && states.get(host)===state && host.isConnected;
  function unavailable(host,state,message){
    if(!current(host,state))return;
    const note=document.createElement('span');note.className='history-placeholder';note.textContent='预览暂不可用';
    host.replaceChildren(note);host.title=message;
  }
  function videoFrame(host,state,entry){
    const video=document.createElement('video');video.className='history-poster';
    video.muted=true;video.defaultMuted=true;video.volume=0;video.playsInline=true;video.preload='metadata';
    const fraction=typeof entry.preview.poster==='number'?Math.min(1,Math.max(0,entry.preview.poster)):.65;
    const loaded=()=>{if(current(host,state)){video.pause();video.currentTime=(entry.preview.start||0)+entry.preview.duration*fraction;}};
    const failed=()=>unavailable(host,state,'原作视频不存在或浏览器不支持此格式。');
    video.addEventListener('loadedmetadata',loaded);video.addEventListener('error',failed);
    state.cleanup.push(()=>{
      video.removeEventListener('loadedmetadata',loaded);video.removeEventListener('error',failed);
      video.pause();video.removeAttribute('src');video.load();
    });
    host.replaceChildren(video);video.src=entry.preview.file;
  }
  function historyFrame(host,effect,state){
    const entry=effect.entries[0],preview=entry.preview;
    if(typeof preview.poster==='string'){
      const img=document.createElement('img');img.src=preview.poster;img.alt='';img.className='history-poster';img.decoding='async';
      const failed=()=>{if(current(host,state))videoFrame(host,state,entry);};
      img.addEventListener('error',failed,{once:true});state.cleanup.push(()=>img.removeEventListener('error',failed));
      host.append(img);return;
    }
    if(preview.type==='original-crop'||preview.type==='source-clip'){videoFrame(host,state,entry);return;}
    if(preview.type!=='isolated'&&preview.type!=='web-isolated'){unavailable(host,state,'原作没有独立预览。');return;}
    const canvas=document.createElement('canvas');canvas.width=360;canvas.height=480;canvas.className='history-poster';host.append(canvas);
    // 重绘只发生一次；逐个载入绘制器，避免目录一次建立大量绘制资源。
    const job=async()=>{
      if(!current(host,state))return;
      try{await global.MotionHistoryRuntime.poster(canvas,entry,global.MotionHistory,{isCurrent:()=>current(host,state)});}
      catch(e){unavailable(host,state,e.message||'原作绘制器无法载入。');}
    };
    queue=queue.then(job,job);
  }

  function frame(host) {
    const box = host.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const raw = Math.min(box.width / 640, box.height / 360);
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.max(0.01, Math.floor(raw * 640 * dpr) / (640 * dpr));
    host.querySelector('.motion-stage').style.transform = `translate(-50%,-50%) scale(${scale})`;
  }

  function preparedFrame(host,effect,state,stage){
    const job=async()=>{
      if(!current(host,state))return;
      let render,disposed=false,hasFrame=false,cancelWait;
      const cancelled=new Promise(resolve=>{cancelWait=()=>resolve(false);});
      const dispose=preserve=>{if(disposed)return;disposed=true;render?.destroy?.(preserve);};
      const cancel=()=>{cancelWait();dispose(false);};
      state.cleanup.push(cancel);
      try{
        render=global.MotionKit.createRenderer(stage,{...effect,poster_only:true,poster_time_ms:effect.preview_ms});
        const ready=render.ready?await Promise.race([Promise.resolve(render.ready).then(()=>true),cancelled]):true;
        if(!ready||!current(host,state))return;
        render(effect.preview_ms,{ease:effect.default_ease,duration:effect.duration_ms});
        hasFrame=true;frame(host);
      }catch(error){unavailable(host,state,error.message||'动画预览准备失败。');}
      finally{
        dispose(hasFrame&&current(host,state));
        const index=state.cleanup.indexOf(cancel);if(index!==-1)state.cleanup.splice(index,1);
      }
    };
    queue=queue.then(job,job);
  }

  function paint(host, effect) {
    const state=states.get(host);
    if (painted.has(host)||!state||!current(host,state)) return;
    if(effect.kind==='recipe'){
      painted.add(host);historyFrame(host,effect,state);return;
    }
    effect = global.MotionKit.resolveVariant(effect);
    const factory = global.MotionFactories?.[effect.source?.factory || effect.id];
    if (!factory) { unavailable(host,state,'缺少效果源码：'+effect.id); return; }
    painted.add(host);
    try {
      const stage = document.createElement('div');
      stage.className = 'motion-stage';
      global.MotionKit.prepareStage(stage, effect);
      if(factory.requiresPreparation || global.MotionKit.resolveVariant(effect).requires_preparation){
        host.prepend(stage);frame(host);preparedFrame(host,effect,state,stage);return;
      }
      const render = global.MotionKit.createRenderer(stage, effect);
      try { render(effect.preview_ms, {ease: effect.default_ease, duration: effect.duration_ms}); }
      finally { render.destroy?.(true); }
      host.prepend(stage);
      frame(host);
    } catch (error) {
      // 真实绘制失败必须可见，不能用空底色掩盖缺失的实现或依赖。
      unavailable(host,state,error.message||'动效预览绘制失败。');
    }
  }

  /* 观察器只有一份，条目和效果的对应关系必须存在宿主节点上，
     不能靠回调闭包里的 effect——否则第一张卡片之后都会画成同一个场景。 */
  function watch(host, effect) {
    pending.set(host, effect);
    observer ||= new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        const target = pending.get(entry.target);
        pending.delete(entry.target);
        if (target) paint(entry.target, target);
      }
    }, {rootMargin:'160px 0px'});
    observer.observe(host);
  }

  function fitAll() {
    document.querySelectorAll('.thumb .motion-stage').forEach(stage => frame(stage.parentElement));
  }
  let resizeFrame = 0;
  function resize() {
    fitAll();
    if (resizeFrame) return;
    /* resize 事件及同一帧的回调里，浏览器可能还保留旧列宽。
       下一次布局结束后再量一次；所有缩略图共用这次更新，不建立播放计时器。 */
    resizeFrame = global.requestAnimationFrame(() => {
      resizeFrame = global.requestAnimationFrame(() => { resizeFrame = 0; fitAll(); });
    });
  }
  global.addEventListener('resize', resize);

  function release(host){
    if(!host)return;
    observer?.unobserve(host);
    const state=states.get(host);
    if(state){state.active=false;state.cleanup.forEach(fn=>fn());states.delete(host);}
    pending.delete(host);painted.delete(host);host.replaceChildren();host.removeAttribute('title');
  }
  function disposeAll(){
    [...states.keys()].forEach(release);observer?.disconnect();
    if(resizeFrame){global.cancelAnimationFrame(resizeFrame);resizeFrame=0;}
  }
  global.addEventListener('pagehide',()=>{
    suspended=true;resume=[...states].map(([host,state])=>[host,state.effect]);disposeAll();
  });
  global.addEventListener('pageshow',()=>{
    if(!suspended)return;suspended=false;
    const hosts=resume;resume=[];
    for(const [host,effect] of hosts)if(host.isConnected)global.MotionThumbs.attach(host,effect);
  });

  global.MotionThumbs = {
    /* 卡片进入列表时登记；真正绘制等到它滚动到可视区附近。 */
    attach(host, effect) {
      if (!host) return;
      if(states.has(host))release(host);
      const state={effect,active:true,cleanup:[]};states.set(host,state);
      if(supported)watch(host,effect);
      else Promise.resolve().then(()=>{
        // 列表先登记卡片再挂入页面，等本轮插入完成后绘制和测量。
        if(current(host,state)){paint(host,effect);resize();}
      });
    },
    /* 卡片从列表移除时交还缩略图，避免长期持有场景 DOM。 */
    release,
    disposeAll,
    whenIdle:async()=>{
      // 没有观察器时，挂载完成后的微任务才会登记绘制任务。
      await Promise.resolve();
      let waiting;
      do{waiting=queue;await waiting;}while(waiting!==queue);
    },
    resize,
    supported
  };
})(globalThis);
