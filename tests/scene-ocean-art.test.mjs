// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';

test('座板托举在原海面背景上绘制，回看保持相同画面和原组合姿态',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');let render,full;
 try{
  w.WiseSceneDiagnostics=true;
  const effect=data.effects.find(e=>e.id==='seat-water-lift');
  render=w.MotionKit.createRenderer(root,effect);await render.ready;
  const ctx=root.querySelector('canvas').getContext('2d'),calls=[];
  for(const method of ['drawImage','rect','fill','stroke']){
   const original=ctx[method];
   ctx[method]=function(...args){calls.push([method,...args.map(a=>typeof a==='object'?[a.width,a.height]:a)]);return original.apply(this,args);};
  }
  const other=w.document.createElement('div');root.after(other);
  const fullEffect=data.effects.find(e=>e.id==='sunset-pickup-journey');
  const rate=fullEffect.scene.playback_rate||1;
  full=w.MotionKit.createRenderer(other,fullEffect);await full.ready;
  render(1);full(1/rate);
  const frames=new Map();
  for(const time of [0,15400,19500,24000,28000,0,19500,15400]){
   calls.length=0;render(time);full(time/rate);
   assert.deepEqual(calls[0],['drawImage',[900,1200],0,0,900,1200],'原天空和海面先铺满画板');
   assert.ok(calls.some(([m,x,y,width,height])=>m==='rect'&&x===0&&y>0&&width===900&&height===1200-y),'水面沿原地平线裁切');
   assert.ok(calls.filter(c=>c[0]==='fill').length>100,'原海面保留连续波纹');
   assert.ok(root.dataset.pose,'应记录实际托举姿态');
   assert.equal(root.dataset.pose,other.dataset.pose,'托举姿态与原组合共用时序');
   const frame=JSON.stringify(calls);if(frames.has(time))assert.equal(frame,frames.get(time),'倒放后背景和动作可重现');else frames.set(time,frame);
  }
 }finally{render?.destroy();full?.destroy();env.close();}
});
