// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data} from './helpers.mjs';

test('独立桂花与叶片不分配整片树林、月亮和蝶翼的画布',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');
 const create=w.document.createElement.bind(w.document);let canvases=[];
 w.document.createElement=(tag,...args)=>{const node=create(tag,...args);if(tag==='canvas')canvases.push(node);return node;};
 try{for(const id of ['osmanthus-flower-illustration','osmanthus-leaf-illustration']){
  canvases=[];const draw=w.MotionKit.createRenderer(root,data.effects.find(e=>e.id===id));
  try{
   await draw.ready;
   assert.equal(canvases.length,2,'仅创建准备画布和实际展示画布');
   assert.ok(canvases.reduce((sum,c)=>sum+c.width*c.height*4,0)<6*1024*1024,'单图画布不应超过6 MiB');
   assert.ok(root.querySelector('canvas').getContext('2d').draws>0,'仍使用真实花叶绘制');
   assert.equal(root.dataset.pose,undefined,'播放不写入整棵树的诊断状态');
  }finally{draw.destroy();}
 }}finally{env.close();}
});

test('原作缩略图只生成代表帧，相同时间不重复绘制，诊断计算按需开启',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');
 const times=[];let inspections=0;
 w.WiseSceneSources.snow=()=>({draw:t=>times.push(t),inspect(){inspections++;return {frame:inspections};}});
 const effect=data.effects.find(e=>e.id==='shenzhen-skyline-illustration');
 let draw;
 try{
  draw=w.MotionKit.createRenderer(root,{...effect,poster_only:true,poster_time_ms:effect.preview_ms});
  await draw.ready;draw(effect.preview_ms);draw(effect.preview_ms);
  assert.deepEqual(times,[effect.preview_ms/1000]);assert.equal(inspections,0);
  draw(0);draw(0);draw(effect.preview_ms);
  assert.deepEqual(times,[effect.preview_ms/1000,0,effect.preview_ms/1000]);
  w.WiseSceneDiagnostics=true;draw(1000);
  assert.equal(inspections,1);assert.equal(JSON.parse(root.dataset.pose).frame,1);
 }finally{draw?.destroy();env.close();}
});

test('准备缩略图之间响应页面事件，切走的下一张卡片不再启动',async()=>{
 const env=await environment(),{w}=env;
 w.eval(await readFile(new URL('../catalog/thumbnails.js',import.meta.url),'utf8'));
 try{for(const cancel of [false,true]){
  const events=[],hosts=[w.document.createElement('div'),w.document.createElement('div')];
  const effects=['fade-rise','scale-in'].map(id=>data.effects.find(e=>e.id===id));
  for(let i=0;i<2;i++){
   const factory=()=>{
    events.push(i);
    if(i===0)w.setTimeout(()=>{events.push('input');if(cancel)w.MotionThumbs.release(hosts[1]);},0);
    const draw=()=>{};draw.ready=Promise.resolve();return draw;
   };
   factory.requiresPreparation=true;w.MotionFactories[effects[i].source.factory]=factory;
   w.document.body.append(hosts[i]);w.MotionThumbs.attach(hosts[i],effects[i]);
  }
  env.reveal();await w.MotionThumbs.whenIdle();
  assert.deepEqual(events,cancel?[0,'input']:[0,'input',1]);
  w.MotionThumbs.disposeAll();hosts.forEach(host=>host.remove());
 }}finally{w.MotionThumbs.disposeAll();env.close();}
});

test('组合的反光与运动状态每帧只准备一次，各层继续分别绘制',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');
 const times=[];let render;
 w.NightGlitter={create:()=>({available:true,render:t=>times.push(t),paint(){},highlights:()=>[],destroy(){}})};
 try{
  const effect=data.effects.find(e=>e.id==='osmanthus-butterfly-journey');
  render=w.MotionKit.createRenderer(root,effect);await render.ready;
  const canvases=[...root.querySelectorAll('canvas')];assert.equal(canvases.length,3);
  assert.deepEqual(times,[0],'三个画面层共用一次反光准备');
  const before=canvases.map(c=>c.getContext('2d').draws);
  render(effect.preview_ms);render(effect.preview_ms);
  assert.deepEqual(times,[0,effect.preview_ms/1000]);
  assert.ok(canvases.every((c,i)=>c.getContext('2d').draws>before[i]),'天空、树冠和飞行层仍各自重画');
  render(0);assert.deepEqual(times,[0,effect.preview_ms/1000,0],'回拖重新准备同一时间的状态');
 }finally{render?.destroy();env.close();}
});
