// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';

test('动物回应与伴飞合并后每个片段都有地景、主体和伴飞，共用原旅程时序',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');let draw,full,session;
 const source=w.WiseSceneSources.dandelion;
 w.WiseSceneSources.dandelion=(S,...args)=>{session=S;return source(S,...args);};
 try{
  w.WiseSceneDiagnostics=true;
  const effect=data.effects.find(e=>e.id==='passage-animal-response');
  assert.equal(data.effects.some(e=>e.id==='wind-companion-follow'),false);
  assert.equal(w.MotionFactories['wind-companion-follow'],undefined);
  assert.equal(data.redirects['wind-companion-follow'],effect.id);
  assert.equal(effect.variants.length,4);
  for(const variant of effect.variants){
   const def=w.MotionKit.resolveVariant(effect,variant.id);
   draw=w.MotionKit.createRenderer(root,def);await draw.ready;
   const events=[];
   for(const [proto,name] of [[session.env.DandelionJourney.prototype,'terrain'],[session.env.DandelionJourney.prototype,'main'],[session.env.JourneyAir.prototype,'companions']]){
    const native=proto[name];proto[name]=function(ctx,state,...args){events.push([name,state.time]);return native.call(this,ctx,state,...args);};
   }
   const other=w.document.createElement('div');root.after(other);
   full=w.MotionKit.createRenderer(other,data.effects.find(e=>e.id==='dandelion-wind-journey'));await full.ready;
   const poses=new Map();draw(1);
   for(const ms of [0,def.preview_ms,def.duration_ms,0,def.preview_ms]){
    events.length=0;draw(ms);const time=def.scene.start+ms/1000;
    assert.deepEqual(events,[['terrain',time],['companions',time],['main',time]],'原地景、伴飞和主体在同一时刻绘制');
    full(time*1000);assert.equal(root.dataset.pose,other.dataset.pose,'与原完整旅程的位置和时序一致');
    if(poses.has(ms))assert.equal(root.dataset.pose,poses.get(ms));else poses.set(ms,root.dataset.pose);
   }
   draw.destroy();full.destroy();draw=full=null;other.remove();
  }
 }finally{draw?.destroy();full?.destroy();env.close();}
});
