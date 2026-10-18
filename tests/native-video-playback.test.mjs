// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {JSDOM,VirtualConsole} from 'jsdom';
import {resolveEffect} from '../remotion/clock.mjs';

// 使用真实播放器和视频组件，只替换浏览器媒体设备；不把静态预览图当作播放验证。
const bundle=await build({entryPoints:[new URL('../remotion/browser.jsx',import.meta.url).pathname],
 bundle:true,write:false,format:'iife',globalName:'WiseNativeTest',
 define:{'process.env.NODE_ENV':'"production"'}});
const tick=()=>new Promise(resolve=>setTimeout(resolve,30));

test('截取片段的视频地址覆盖源片帧范围，支持播放、暂停定位和重播',async()=>{
 for(const [id,variant]of [['wipe','overlap-copy-handoff'],['next-shot-preentry','paced-overlap'],['spatial-mechanical-sequence']]){
  const errors=[],virtualConsole=new VirtualConsole();
  virtualConsole.on('jsdomError',error=>errors.push(error.message));
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{
   url:'file:///wise-motion/catalog/index.html',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
  const w=dom.window,media=new WeakMap();let controller;
  const state=el=>{if(!media.has(el))media.set(el,{paused:true,time:0});return media.get(el);};
  w.HTMLElement.prototype.getBoundingClientRect=()=>({x:0,y:0,left:0,top:0,right:640,bottom:360,width:640,height:360});
  w.HTMLElement.prototype.getClientRects=function(){return [this.getBoundingClientRect()];};
  Object.defineProperty(w,'localStorage',{value:{getItem:()=>null,setItem(){}}});
  Object.defineProperties(w.HTMLMediaElement.prototype,{
   paused:{get(){return state(this).paused;}},readyState:{get:()=>4},duration:{get:()=>18},
   currentTime:{get(){return state(this).time;},set(value){state(this).time=value;
    w.queueMicrotask(()=>{if(this.isConnected)this.dispatchEvent(new w.Event('seeked'));});}},
   play:{value(){state(this).paused=false;return Promise.resolve();}},
   pause:{value(){state(this).paused=true;}},load:{value(){}}
  });
  w.MotionKit={resolveVariant:definition=>definition};w.eval(bundle.outputFiles[0].text);
  try{
   const definition=resolveEffect(id,variant),cache=definition.source.frame_cache;
   controller=w.WiseNativeTest.create(w.document.getElementById('root'),definition);
   await tick();
   const video=w.document.querySelector('video');assert.ok(video,id);
   const bounds=new URL(video.src).hash.match(/^#t=([^,]+),(.+)$/);
   assert.ok(bounds,'原生视频应声明真实源片范围');
   const [start,end]=bounds.slice(1).map(Number);
   for(const frame of [cache.start_frame,cache.start_frame+cache.frames-1]){
    const time=(frame+.5)/cache.fps;
    assert.ok(time>=start&&time<end,`${id} 源片第 ${frame} 帧须在视频地址允许的 ${start}–${end} 秒内`);
   }
   video.dispatchEvent(new w.Event('loadeddata'));
   assert.equal(await controller.ready,true);assert.equal(controller.error,null);
   controller.pause();controller.seek(0);await tick();
   const stage=w.document.querySelector('[data-native-frame]');
   assert.equal(Number(stage.dataset.nativeFrame),cache.start_frame);
   assert.ok(Math.abs(video.currentTime-(cache.start_frame+.5)/cache.fps)<1e-7,`${id}: ${video.currentTime} / ${(cache.start_frame+.5)/cache.fps}`);
   controller.play();await tick();await tick();controller.pause();
   assert.ok(Number(stage.dataset.nativeFrame)>cache.start_frame,'播放时源片帧应前进');
   const pausedFrame=stage.dataset.nativeFrame;await tick();assert.equal(stage.dataset.nativeFrame,pausedFrame);
   controller.seek(definition.duration_ms);await tick();
   assert.equal(Number(stage.dataset.nativeFrame),cache.start_frame+cache.frames-1);
   assert.ok(Math.abs(video.currentTime-(cache.start_frame+cache.frames-.5)/cache.fps)<1e-7);
   controller.restart(false);await tick();
   assert.equal(Number(stage.dataset.nativeFrame),cache.start_frame);assert.equal(controller.paused,true);
   controller.restart();await tick();await tick();
   assert.ok(Number(stage.dataset.nativeFrame)>cache.start_frame);assert.equal(controller.error,null);
   assert.deepEqual(errors,[]);
  }finally{controller?.destroy();await tick();w.close();}
 }
});
