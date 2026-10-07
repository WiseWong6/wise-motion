// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';

function record(ctx){
 const calls=[];
 for(const method of ['fillRect','moveTo','lineTo','stroke','fill','translate','rotate']){
  const original=ctx[method];ctx[method]=function(...args){calls.push([method,...args,this.fillStyle,this.strokeStyle]);return original.apply(this,args);};
 }
 return calls;
}

test('汽车离场补回原蓝底和路面，标记随镜头减速而运动',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');let draw,full;
 try{
  w.WiseSceneDiagnostics=true;
  draw=w.MotionKit.createRenderer(root,data.effects.find(e=>e.id==='camera-lag-departure'));await draw.ready;
  const calls=record(root.querySelector('canvas').getContext('2d'));
  const other=w.document.createElement('div');root.after(other);
  full=w.MotionKit.createRenderer(other,data.effects.find(e=>e.id==='balloon-drive-journey'));await full.ready;
  const road=record(other.querySelector('[data-layer="road"]').getContext('2d'));
  draw(1);full(1);const frames=new Map();
  for(const ms of [0,1500,2750,5000,0,2750]){
   calls.length=0;road.length=0;draw(ms);full(9000+ms);
   assert.deepEqual(calls[0].slice(0,5),['fillRect',0,0,900,1200],'蓝色背景铺满原画板');
   assert.ok(road.length>30,'原路面应包含随镜头运动的标记');
   assert.deepEqual(calls.slice(0,road.length),road,'路面位置和颜色必须与原组合同一时刻一致');
   assert.equal(root.dataset.pose,other.dataset.pose,'汽车原速度和镜头减速不变');
   const frame=JSON.stringify(calls);if(frames.has(ms))assert.equal(frame,frames.get(ms),'回拖后背景与车辆可重现');else frames.set(ms,frame);
  }
 }finally{draw?.destroy();full?.destroy();env.close();}
});
