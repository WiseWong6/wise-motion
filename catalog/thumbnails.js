/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 目录卡片的静态缩略图。
   复用 effects 的渲染函数直接画一帧，不建立 Anime.js 计时器，也不注册 ResizeObserver，
   不占用播放资源；按列表顺序准备，每张之间让出页面线程。
   历史案例沿用原作图片或单帧绘制；没有可见范围观察器时也正常绘制。 */
(function (global) {
  'use strict';
  const painted = new WeakSet();
  const pending = new WeakMap();
  const states = new Map();
  // 只保留已完成、已释放绘制器的静帧；移走原节点，避免复制画布时丢失画面。
  const frames = new Map(), frameLimit = 128, canvasLimit = 64 * 1024 * 1024;
  let canvasBytes = 0;
  function forgetFrame(effect) {
    const saved = frames.get(effect);
    if (saved) { canvasBytes -= saved.bytes; frames.delete(effect); }
    return saved?.stage;
  }
  function saveFrame(effect, stage) {
    forgetFrame(effect);
    const bytes = [...stage.querySelectorAll('canvas')].reduce((sum, canvas) => sum + canvas.width * canvas.height * 4, 0);
    if (bytes > canvasLimit) return;
    frames.set(effect, {stage, bytes}); canvasBytes += bytes;
    while (frames.size > frameLimit || canvasBytes > canvasLimit) forgetFrame(frames.keys().next().value);
  }
  const jobs = new Map();
  let queue = Promise.resolve(), running = false, suspended = false, resume = [];
  /* 和主预览共用完整 16:9 画板，不放大裁掉卡片底部。 */
  let observer = null;
  const supported = typeof IntersectionObserver === 'function';
  function enqueue(host,effect){
    const state=states.get(host);
    if(!state||painted.has(host)||jobs.has(host))return;
    jobs.set(host,{host,effect,state});
    if(running)return;
    running=true;
    queue=Promise.resolve().then(async()=>{
      try{while(jobs.size){
        // 可见范围通知和素材返回的先后都不代表列表顺序；每次按当前页面顺序取下一张。
        const [job]=[...jobs.values()].sort((a,b)=>{
          const position=a.host.compareDocumentPosition(b.host);
          return position&1?0:position&4?-1:position&2?1:0;
        });
        jobs.delete(job.host);
        if(!current(job.host,job.state))continue;
        try{await paint(job.host,job.effect,job.state);}
        catch(error){unavailable(job.host,job.state,error.message||'动画预览准备失败。');}
        // 每张之间给点击、滚动和主预览留出机会。
        await new Promise(resolve=>global.setTimeout(resolve,0));
      }}finally{running=false;}
    });
  }

  const current = (host,state) => !suspended && state.active && states.get(host)===state && host.isConnected;
  function loading(host){
    const overlay=document.createElement('span');overlay.className='thumb-loading';overlay.setAttribute('aria-hidden','true');
    const dots=document.createElement('span');dots.className='apple-pulse-dots';
    for(let i=0;i<3;i++){
      const dot=document.createElement('span');dot.className='apple-pulse-dot';dot.style.setProperty('--dot-index',String(i));dots.append(dot);
    }
    overlay.append(dots);host.append(overlay);host.dataset.previewState='loading';
  }
  function complete(host,state){
    if(!current(host,state))return;
    host.querySelector('.thumb-loading')?.remove();host.dataset.previewState='ready';
  }
  function unavailable(host,state,message){
    if(!current(host,state))return;
    const note=document.createElement('span');note.className='history-placeholder';note.textContent='预览暂不可用';
    host.replaceChildren(note);host.title=message;host.dataset.previewState='error';
  }
  function videoFrame(host,state,entry){
    const video=document.createElement('video');video.className='history-poster';
    video.muted=true;video.defaultMuted=true;video.volume=0;video.playsInline=true;video.preload='metadata';
    const fraction=typeof entry.preview.poster==='number'?Math.min(1,Math.max(0,entry.preview.poster)):.65;
    const target=(entry.preview.start||0)+entry.preview.duration*fraction;
    const loaded=()=>{if(current(host,state)){video.pause();video.currentTime=(entry.preview.start||0)+entry.preview.duration*fraction;}};
    const shown=()=>{if(!video.seeking&&Math.abs(video.currentTime-target)<.05)complete(host,state);};
    const failed=()=>unavailable(host,state,'原作视频不存在或浏览器不支持此格式。');
    video.addEventListener('loadedmetadata',loaded);video.addEventListener('seeked',shown);video.addEventListener('loadeddata',shown);video.addEventListener('error',failed);
    state.cleanup.push(()=>{
      video.removeEventListener('loadedmetadata',loaded);video.removeEventListener('seeked',shown);video.removeEventListener('loadeddata',shown);video.removeEventListener('error',failed);
      video.pause();video.removeAttribute('src');video.load();
    });
    host.querySelector('img')?.remove();host.prepend(video);video.src=entry.preview.file;
  }
  function historyFrame(host,effect,state){
    const entry=effect.entries[0],preview=entry.preview;
    if(typeof preview.poster==='string'){
      const img=document.createElement('img');img.alt='';img.className='history-poster';img.decoding='async';
      const shown=()=>complete(host,state);
      const failed=()=>{if(current(host,state))videoFrame(host,state,entry);};
      img.addEventListener('load',shown,{once:true});img.addEventListener('error',failed,{once:true});
      state.cleanup.push(()=>{img.removeEventListener('load',shown);img.removeEventListener('error',failed);});
      host.prepend(img);img.src=preview.poster;if(img.complete&&img.naturalWidth)shown();return;
    }
    if(preview.type==='original-crop'||preview.type==='source-clip'){videoFrame(host,state,entry);return;}
    if(preview.type!=='isolated'&&preview.type!=='web-isolated'){unavailable(host,state,'原作没有独立预览。');return;}
    const canvas=document.createElement('canvas');canvas.width=360;canvas.height=480;canvas.className='history-poster';host.append(canvas);
    return global.MotionHistoryRuntime.poster(canvas,entry,global.MotionHistory,{isCurrent:()=>current(host,state)})
      .then(()=>complete(host,state));
  }

  function measureFrame(host, stage = host.querySelector('.motion-stage')) {
    if (!stage) return null;
    const box = host.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    const raw = Math.min(box.width / 640, box.height / 360);
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.max(0.01, Math.floor(raw * 640 * dpr) / (640 * dpr));
    return {stage, transform:`translate(-50%,-50%) scale(${scale})`};
  }
  function applyFrame(measured) {
    if (measured && measured.stage.style.transform !== measured.transform) measured.stage.style.transform = measured.transform;
  }
  function frame(host) {
    applyFrame(measureFrame(host));
  }

  async function paint(host,effect,state) {
    if (painted.has(host)||!state||!current(host,state)) return;
    observer?.unobserve(host);pending.delete(host);
    painted.add(host);
    let render,disposed=false,hasFrame=false,cancelWait;
    const cancelled=new Promise(resolve=>{cancelWait=()=>resolve(false);});
    const wait=promise=>Promise.race([Promise.resolve(promise).then(()=>true),cancelled]);
    const dispose=preserve=>{if(disposed)return;disposed=true;render?.destroy?.(preserve);};
    const cancel=()=>{cancelWait();dispose(false);};
    state.cleanup.push(cancel);
    try {
      if(effect.kind==='recipe'){await wait(historyFrame(host,effect,state));return;}
      effect=global.MotionKit.resolveVariant(effect);
      const lazy=global.MotionLazy?.ensure(effect);
      if(lazy&&(!await wait(lazy)||!current(host,state)))return;
      const factory=global.MotionFactories?.[effect.source?.factory||effect.id];
      if(!factory)throw new Error('缺少效果源码：'+effect.id);
      const stage = document.createElement('div');
      stage.className = 'motion-stage';
      global.MotionKit.prepareStage(stage, effect);
      host.prepend(stage);frame(host);
      const prepared=factory.requiresPreparation||effect.requires_preparation;
      render=global.MotionKit.createRenderer(stage,prepared?{...effect,poster_only:true,poster_time_ms:effect.preview_ms}:effect);
      if(render.ready&&(!await wait(render.ready)||!current(host,state)))return;
      render(effect.preview_ms,{ease:effect.default_ease,duration:effect.duration_ms});
      hasFrame=true;frame(host);complete(host,state);
    } catch (error) {
      // 真实绘制失败必须可见，不能用空底色掩盖缺失的实现或依赖。
      unavailable(host,state,error.message||'动效预览绘制失败。');
    } finally {
      dispose(hasFrame&&current(host,state));
      const index=state.cleanup.indexOf(cancel);if(index!==-1)state.cleanup.splice(index,1);
    }
  }

  /* 观察器只有一份，条目和效果的对应关系必须存在宿主节点上，
     不能靠回调闭包里的 effect——否则第一张卡片之后都会画成同一个场景。 */
  function watch(host, effect) {
    pending.set(host, effect);
    // 侧栏自己滚动，提前范围必须扩展侧栏的边界，不能只扩展整个窗口。
    observer ||= new IntersectionObserver(entries => {
      for (const entry of entries) {
        // 快速滚走时撤销尚未开始的工作，回来后仍可重新排队。
        if (!entry.isIntersecting) { jobs.delete(entry.target); continue; }
        const target = pending.get(entry.target);
        if (target) {
          if(painted.has(entry.target)){observer.unobserve(entry.target);pending.delete(entry.target);frame(entry.target);}
          else enqueue(entry.target, target);
        }
      }
    }, {root:document.getElementById('effects-list'),rootMargin:'320px 0px'});
    observer.observe(host);
  }

  function fitAll() {
    // 先统一量尺寸，再写缩放；避免每张卡片的写入触发下一张重新布局。
    [...document.querySelectorAll('.thumb .motion-stage')].map(stage => measureFrame(stage.parentElement, stage)).forEach(applyFrame);
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

  function release(host,keepFrame=true){
    if(!host)return;
    observer?.unobserve(host);
    const state=states.get(host);
    jobs.delete(host);
    const stage=keepFrame&&state&&!state.cleanup.length&&host.dataset.previewState==='ready'
      ?host.querySelector('.motion-stage'):null;
    if(state){state.active=false;state.cleanup.forEach(fn=>fn());states.delete(host);}
    if(stage){
      // 使用原定义区分不同示例与参数；最近使用的画面排在末尾。
      saveFrame(state.effect,stage);
    }
    pending.delete(host);painted.delete(host);host.replaceChildren();host.removeAttribute('title');delete host.dataset.previewState;
  }
  function disposeAll(){
    [...states.keys()].forEach(host=>release(host,false));frames.clear();canvasBytes=0;observer?.disconnect();
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
      const stage=forgetFrame(effect);
      if(stage){
        host.prepend(stage);painted.add(host);host.dataset.previewState='ready';
        // 卡片先登记再插入列表，插入完成后按新列宽测量，复用时不显示加载提示。
        Promise.resolve().then(()=>{if(current(host,state))frame(host);});
        if(supported)watch(host,effect);
        return;
      }
      loading(host);
      if(supported)watch(host,effect);
      else Promise.resolve().then(()=>{
        // 列表先登记卡片再挂入页面，等本轮插入完成后绘制和测量。
        if(current(host,state))enqueue(host,effect);
      });
    },
    /* 卡片移除时取消未完成任务，已完成画面最多保留 128 张供页签和筛选复用。 */
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
