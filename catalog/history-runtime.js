/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
/* 本机原作预览适配层：单次播放、统一控制、无音频、按需加载。 */
(function(global){
  'use strict';
  const live=new Set(),scripts=new Map();
  function load(url){
    if(!scripts.has(url))scripts.set(url,new Promise((resolve,reject)=>{
      const s=document.createElement('script');s.src=url;s.onload=resolve;
      s.onerror=()=>{scripts.delete(url);s.remove();reject(new Error('原作绘制脚本无法加载。'));};document.head.append(s);
    }));
    return scripts.get(url);
  }
  async function mount(canvas,entry,data){
    const type=entry.preview.type;
    if(type==='isolated'){
      global.WISE_GALLERY=data.originals;
      await load(new URL('runtime/isolated-source.js',data.source_root).href);
      await load(new URL('isolated-player.js',data.source_root).href);
      return {render:t=>global.WiseIsolated.draw(canvas,entry.entry,t),dispose(){canvas.width=canvas.height=1;}};
    }
    if(type==='web-isolated'){
      await load(new URL('packs/completed/runtime.js',data.source_root).href);
      return global.WiseCompleted.mount(canvas,entry.entry);
    }
    throw new Error('这个案例需要打开原作查看。');
  }
  // 用原绘制器画一帧，再把画面留在目标画布；释放原绘制器不会抹掉缩略图。
  async function poster(canvas,entry,data=global.MotionHistory,options={}){
    const current=options.isCurrent||(()=>true);
    if(!current())return false;
    const frame=document.createElement('canvas');frame.width=canvas.width;frame.height=canvas.height;
    let provider;
    try{
      provider=await (options.mount||mount)(frame,entry,data);
      if(!current())return false;
      const fraction=typeof entry.preview.poster==='number'?Math.min(1,Math.max(0,entry.preview.poster)):.65;
      provider.render(entry.preview.duration*fraction);
      const context=canvas.getContext('2d');
      if(!context)throw new Error('浏览器不支持画布预览。');
      context.drawImage(frame,0,0);return true;
    }finally{provider?.dispose();frame.width=frame.height=1;}
  }
  function create(root,definition,options={}){
    const data=options.data||global.MotionHistory;
    const entry=definition.entries.find(x=>x.id===options.caseId)||definition.entries[0];
    const duration=Math.round(entry.preview.duration*1000),base=(entry.preview.start||0)*1000;
    let time=0,destroyed=false,provider=null,video=null;
    const cleanup=[];
    root.replaceChildren();
    const notice=document.createElement('p');notice.className='history-notice';notice.textContent='正在载入原作预览…';root.append(notice);
    const error=message=>{if(destroyed)return;notice.hidden=false;notice.textContent=message+' 可从右侧源码或原作链接继续核对。';};
    const draw=(ms,force=false)=>{
      time=Math.min(duration,Math.max(0,ms));
      if(provider)provider.render(time/1000);
      if(video && (force||Math.abs(video.currentTime*1000-base-time)>300))try{video.currentTime=(base+time)/1000;}catch(_){/* 元数据未载入时稍后再定位。 */}
    };
    const notify=()=>{if(!destroyed)options.onUpdate?.({time,duration,paused:timer.paused});};
    const timer=global.anime.createTimer({duration,loop:false,autoplay:false,
      onUpdate(self){if(!destroyed){draw(self.iterationCurrentTime);notify();}},
      onComplete(){if(!destroyed){video?.pause();draw(duration,true);notify();}}
    });
    const controller={
      play(){if(destroyed)return;if(time>=duration)this.seek(0);timer.play();if(video){const task=video.play();task?.catch(()=>{if(!destroyed&&!timer.paused){timer.pause();error('浏览器暂时无法播放这个本机视频。');notify();}});}notify();},
      pause(){if(destroyed)return;timer.pause();video?.pause();notify();},
      restart(shouldPlay=true){if(destroyed)return;this.pause();this.seek(0);if(shouldPlay)this.play();},
      seek(ms){if(destroyed)return;if(!Number.isFinite(ms))throw new TypeError('时间必须是有限数字');const next=Math.min(duration,Math.max(0,ms));timer.seek(next,true);draw(next,true);notify();},
      setSpeed(value){if(destroyed)return;if(!Number.isFinite(value))throw new TypeError('速度必须是有限数字');timer.speed=Math.min(2,Math.max(.5,value));if(video)video.playbackRate=timer.speed;},
      setEase(){/* 原作曲线保留，只提供观看倍率。 */},
      destroy(preserve=false){if(destroyed)return;destroyed=true;timer.pause();timer.cancel();cleanup.forEach(fn=>fn());if(video){video.pause();video.removeAttribute('src');video.load();}provider?.dispose();provider=null;live.delete(controller);if(!preserve)root.replaceChildren();},
      get currentTime(){return time;},get duration(){return duration;},get paused(){return timer.paused;},get speed(){return timer.speed;},get destroyed(){return destroyed;},entry
    };
    live.add(controller);
    const ready=(async()=>{
      try{
        if(entry.preview.type==='original-crop'||entry.preview.type==='source-clip'){
          video=document.createElement('video');video.className='history-media';video.muted=true;video.defaultMuted=true;video.volume=0;video.playsInline=true;video.preload='metadata';
          if(typeof entry.preview.poster==='string')video.poster=entry.preview.poster;
          let finish;
          const metadata=new Promise(resolve=>{finish=resolve;});
          const loaded=()=>{if(!destroyed){notice.hidden=true;draw(time,true);}finish();};
          const failed=()=>{if(!destroyed){controller.pause();error('原作视频不存在或浏览器不支持此格式。');}finish();};
          video.addEventListener('loadedmetadata',loaded);video.addEventListener('error',failed);
          cleanup.push(()=>video.removeEventListener('loadedmetadata',loaded),()=>video.removeEventListener('error',failed),()=>finish());
          root.prepend(video);video.src=entry.preview.file;
          await metadata;
        }else if(entry.preview.type==='source-link'){
          error('这个案例保留为原作页面链接，尚无独立播放器。');
        }else{
          const canvas=document.createElement('canvas');canvas.width=900;canvas.height=1200;canvas.className='history-media';root.prepend(canvas);
          const next=await (options.mount||mount)(canvas,entry,data);
          if(destroyed){next.dispose();return;}
          provider=next;draw(time);notice.hidden=true;
        }
      }catch(e){if(!destroyed){controller.pause();error(e.message||'原作预览载入失败。');}}
    })();
    controller.ready=ready;draw(0);notify();return controller;
  }
  global.MotionHistoryRuntime={create,load,mount,poster,disposeAll(){[...live].forEach(c=>c.destroy());},get instanceCount(){return live.size;},get runningCount(){return [...live].filter(c=>!c.paused).length;}};
})(globalThis);
