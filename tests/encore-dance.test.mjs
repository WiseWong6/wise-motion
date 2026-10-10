// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {JSDOM} from 'jsdom';
import {environment,data,frameMarkup} from './helpers.mjs';
const source='/Users/wisewong/Documents/Developer/scenes/未完成/singintherain-encore/app/';
const clips=[['hook',0,3.81],['tap',4.678,9.373],['flight',9.373,13.064],['tip',13.064,17],['roll',17,20.752],['shed',20.752,24.543]];
// 用原画布绘制记录线条；逐条比较，包含遮挡后的伞骨、水花、倒影与历史尾迹。
let lines=[],path='',state={transform:'',globalAlpha:1},stack=[];
const ctx={save(){stack.push({...state});},restore(){state=stack.pop();},setTransform(...n){state.transform=`matrix(${n.join(' ')})`;},translate(x,y){state.transform+=` translate(${x} ${y})`;},scale(x,y){state.transform+=` scale(${x} ${y})`;},rotate(a){state.transform+=` rotate(${a*180/Math.PI})`;},beginPath(){path='';},moveTo(x,y){path+=`M${x} ${y}`;},lineTo(x,y){path+=`L${x} ${y}`;},rect(){},clip(){},fill(){},fillRect(){},arc(){},ellipse(x,y,rx,ry){path+=`M${x-rx} ${y}a${rx} ${ry} 0 1 0 ${rx*2} 0a${rx} ${ry} 0 1 0 ${-rx*2} 0Z`;},createRadialGradient(){return {addColorStop(){}};},stroke(){lines.push({d:path,transform:state.transform,alpha:state.globalAlpha,width:state.lineWidth,color:state.strokeStyle});}};
for(const key of ['globalAlpha','lineWidth','strokeStyle','fillStyle','lineCap','lineJoin'])Object.defineProperty(ctx,key,{get:()=>state[key],set:v=>{state[key]=v;}});
const original={window:{},document:{getElementById:()=>({width:1280,height:800,getContext:()=>ctx})}};
for(const f of ['music-data.js','umbrella.js','choreography.js','renderer.js'])runInNewContext(await readFile(source+f,'utf8'),original);
const D=original.window.EncoreDance,U=original.window.EncoreUmbrella;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('雨中曲六项原姿态、遮挡后伞骨、水花及尾迹逐时刻一致，定位可重复',async()=>{
 const env=await environment();try{
  const root=env.w.document.getElementById('root');
  for(const [mode,start,end] of clips){
   const e=data.effects.find(e=>e.id==='encore-'+mode);assert.ok(e);const render=env.w.MotionFactories[e.id](root,env.w.MotionKit,e);
   for(const fraction of [0,.12,.4,.7,1]){
    const ms=e.duration_ms*fraction,t=start+(end-start)*fraction;render(ms);const p=D.sample(t),svg=root.querySelector('svg');
    for(const k of ['x','y','angle','roll'])near(Number(svg.dataset[k]),p[k]);
    lines=[];original.window.EncoreScene.render(t);
    const actual=[...svg.querySelectorAll('[data-part="scene"] path[stroke]')].map(n=>({d:n.getAttribute('d'),transform:n.getAttribute('transform'),alpha:Number(n.getAttribute('opacity')),width:Number(n.getAttribute('stroke-width')),color:n.getAttribute('stroke')}));
    assert.deepEqual(actual,lines,e.name+' 原绘制线条');
    if(mode==='tip'){const q=U.world([0,-U.L/2],p);near(q[0],D.sample(start).x);near(q[1],D.FLOOR);}
    if(mode==='roll')near(U.bounds(p).maxY,D.FLOOR);
   }
   render(e.preview_ms);const before=frameMarkup(root);render(0);render(e.preview_ms);assert.equal(frameMarkup(root),before,e.name+' 回拖不改变画面');
  }
 }finally{env.close();}
});
test('雨中曲历史入口已迁移到正式动作，六项独立导出均能播放定位与释放',async()=>{
 for(const [mode] of clips){
  const env=await environment(true,{hash:'#history-recovered-'+mode});try{
   const e=data.effects.find(e=>e.id==='encore-'+mode),d=env.w.document;
   assert.equal(d.querySelector('.effect-item[aria-current="true"]').dataset.effect,e.id);
   assert.equal(d.querySelector('[data-kind="action"]').getAttribute('aria-pressed'),'true');
   assert.ok(!env.w.MotionHistory.recipes.some(r=>r.history_id==='recovered-'+mode));
   assert.ok(env.w.MotionHistory.excluded.some(r=>r.id==='recovered-'+mode));
   const html=env.w.MotionExport.code(e);assert.doesNotMatch(html,/history-data|history-runtime|audio\/|source\/encore/);
   const dom=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true});try{
    const w=dom.window;w.ResizeObserver=class{observe(){}disconnect(){}};w.matchMedia=()=>({matches:false});
    for(const s of w.document.querySelectorAll('script'))w.eval(s.src?await readFile(new URL('../'+s.getAttribute('src'),import.meta.url),'utf8'):s.textContent);
    w.MotionDemo.pause();w.MotionDemo.seek(e.preview_ms);assert.ok(w.document.querySelectorAll('svg path[stroke]').length>90);
    w.MotionDemo.seek(e.duration_ms);w.MotionDemo.restart();w.MotionDemo.pause();w.MotionDemo.destroy();assert.equal(w.MotionRuntime.instanceCount,0);
   }finally{dom.window.anime?.engine.pause();dom.window.close();}
  }finally{env.close();}
 }
});
test('独立伞插画保留原伞路径与遮挡，透明背景下恢复整段编舞，导出可用',async()=>{
 const env=await environment(true,{hash:'#encore-umbrella-illustration'});try{
  const e=data.effects.find(e=>e.id==='encore-umbrella-illustration'),root=env.w.document.createElement('div');
  assert.equal(env.w.document.querySelector('.effect-item[aria-current="true"]').dataset.effect,e.id);
  assert.equal(env.w.document.querySelector('[data-kind="illustration"]').getAttribute('aria-pressed'),'true');
  const render=env.w.MotionFactories[e.id](root,env.w.MotionKit,e);render(0);
  const frames=[];
  for(const ms of [0,1800,6700,11300,15100,18400,22400,e.duration_ms,11300]){
   render(ms);const pose=D.sample(ms/1000);
   lines=[];state={transform:'',globalAlpha:1};stack=[];U.draw(ctx,pose);
   const actual=[...root.querySelectorAll('path[stroke]')].map(n=>({d:n.getAttribute('d'),transform:n.getAttribute('transform'),alpha:Number(n.getAttribute('opacity')),width:Number(n.getAttribute('stroke-width')),color:n.getAttribute('stroke')}));
   assert.deepEqual(actual,lines);assert.equal(actual.length,12);assert.equal(root.querySelectorAll('path:not([stroke])').length,1);
   assert.ok(!root.querySelector('rect,image,radialGradient'));frames.push(frameMarkup(root));
  }
  assert.equal(frames[3],frames[8]);assert.ok(new Set(frames).size>6);
  const html=env.w.MotionExport.code(e),dom=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true});try{
   const w=dom.window;w.ResizeObserver=class{observe(){}disconnect(){}};w.matchMedia=()=>({matches:false});
   for(const s of w.document.querySelectorAll('script'))w.eval(s.src?await readFile(new URL('../'+s.getAttribute('src'),import.meta.url),'utf8'):s.textContent);
   w.MotionDemo.pause();w.MotionDemo.seek(e.preview_ms);assert.equal(w.document.querySelectorAll('svg path[stroke]').length,12);
   w.MotionDemo.destroy();assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{dom.window.anime?.engine.pause();dom.window.close();}
 }finally{env.close();}
});
