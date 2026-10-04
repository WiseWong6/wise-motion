// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data} from './helpers.mjs';
const composition=data.effects.find(e=>e.id==='point-domain-flow-sequence');
const fresh=data.effects.filter(e=>e.source.path==='catalog/effects/point-domain-flow.js');

function recordingCanvas(w){
 const cache=new WeakMap(),contexts=[];
 w.HTMLCanvasElement.prototype.getContext=function(){
  if(cache.has(this))return cache.get(this);
  const trace=[],stack=[],ctx=new Proxy({canvas:this,font:'10px sans-serif',globalAlpha:1,trace,
   save(){stack.push({font:this.font,globalAlpha:this.globalAlpha});},restore(){Object.assign(this,stack.pop()||{});},
   createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),
   createImageData:(width,height)=>({data:new Uint8ClampedArray(width*height*4),width,height}),
   measureText(value){return {width:String(value).length*(parseFloat(this.font.match(/([\d.]+)px/)?.[1])||10)*.6};},
   fillText(value,x,y){trace.push({type:'text',value,x,y,font:this.font});},
   arc(x,y,r){trace.push({type:'arc',x,y,r});},clip(){trace.push({type:'clip'});}
  },{get:(o,k)=>k in o?o[k]:()=>{}});
  cache.set(this,ctx);contexts.push(ctx);return ctx;
 };
 return contexts;
}

test('337至425帧两条亮线停在文字内侧，终点保留笔触余量',async()=>{
 const env=await environment();try{
  for(let frame=337;frame<=425;frame++)for(const trace of env.w.WisePointDomainFlow.traceGeometry((frame-1)/30)){
   assert.ok(trace.clearance.every(v=>v>=2.1-1e-8),`第${frame}帧第${trace.index+1}条亮线越界`);
  }
  const stopped=env.w.WisePointDomainFlow.traceGeometry(13);
  assert.ok(stopped[0].hitParameter<1&&stopped[1].hitParameter<.8,'终点应由文字厚度决定，不沿用穿字终点');
  for(const index of [0,1])assert.equal(stopped[index].progress,1);
  assert.ok(stopped[1].tip[0]>205,'第二条亮线应留在竖排字的右侧');
 }finally{env.close();}
});

test('触边火花实际绘制更大并受边界裁切，叙事字幕不进入任何段落',async()=>{
 const env=await environment();try{
  const {w}=env,contexts=recordingCanvas(w),root=w.document.createElement('div');
  const action=data.effects.find(e=>e.id==='boundary-curve-stop'),draw=w.MotionFactories[action.id](root,w.MotionKit,{...action,poster_only:true});
  contexts.forEach(c=>{c.trace.length=0;});draw((13-11.2)*1000);
  const traces=contexts.flatMap(c=>c.trace),sparks=traces.filter(x=>x.type==='arc'&&x.r>=.55&&x.r<=1.75);
  assert.equal(sparks.length,160);assert.ok(sparks.reduce((s,x)=>s+x.r,0)/sparks.length>1);
  assert.ok(traces.some(x=>x.type==='clip'),'火花须与亮线一起限制在文字内侧');draw.destroy();
  const full=w.MotionFactories[composition.id](root,w.MotionKit,{...composition,poster_only:true});
  for(const time of [1,3.8,5.4,8.8,11.4,13.0,15.1,17.7,21.2,23.4])full(time*1000);
  assert.ok(!contexts.flatMap(c=>c.trace).some(x=>x.type==='text'&&/Songti SC|Source Han Serif/.test(x.font)),'整片不可出现原底部叙事字幕');
  assert.ok(contexts.flatMap(c=>c.trace).some(x=>x.type==='text'&&x.value.includes('不要那样')),'作为边界的文字须保留');full.destroy();
 }finally{env.close();}
});

test('七个独立动作只建自身节点；组合有真实部件，任意定位和销毁不互相干扰',async()=>{
 const env=await environment();try{
  const {w}=env,roots=fresh.map(()=>w.document.createElement('div')),players=fresh.map((e,i)=>w.MotionRuntime.create(roots[i],{...e,poster_only:true},{autoplay:false}));
  await Promise.all(players.map(p=>p.ready));
  for(let i=0;i<fresh.length;i++){
   const e=fresh[i],p=players[i];p.seek(e.preview_ms);const first=roots[i].innerHTML;
   p.seek(e.duration_ms);p.seek(0);p.seek(e.preview_ms);assert.equal(roots[i].innerHTML,first,e.name);
   if(e.kind==='action')assert.equal(roots[i].querySelectorAll('canvas').length,1,e.name+'不能携带完整组合的画布');
  }
  const i=fresh.findIndex(e=>e.kind==='composition'),root=roots[i],canvas=root.querySelector('canvas:not([data-layer])'),layers=[...root.querySelectorAll('[data-layer]')];
  assert.deepEqual([...new Set(layers.map(n=>n.dataset.layer))].sort(),Array.from(w.MotionFactories[composition.id].breakdown,r=>r.id).sort());
  const other=roots[0].innerHTML;players[i].seek(12800);assert.equal(roots[0].innerHTML,other);
  layers[0].setAttribute('data-composition-hidden','');await Promise.resolve();assert.equal(canvas.style.visibility,'hidden');
  layers[0].removeAttribute('data-composition-hidden');await Promise.resolve();assert.equal(canvas.style.visibility,'visible');
  const all=roots.flatMap(r=>[...r.querySelectorAll('canvas')]);players.forEach(p=>p.destroy());
  assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(w.MotionRuntime.runningCount,0);
  assert.ok(all.every(c=>c.width===1&&c.height===1));assert.ok(roots.every(r=>r.childElementCount===0));
 }finally{env.close();}
});

test('星点复用为新示例；原示例保留，复制页带齐绘制依赖与实际画面说明',async()=>{
 const env=await environment();try{
  const {w}=env;w.eval(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'));
  const stars=data.effects.find(e=>e.id==='star-twinkle'),old=w.document.createElement('div'),night=w.document.createElement('div');
  const original=w.MotionRuntime.create(old,stars,{autoplay:false}),variant=w.MotionRuntime.create(night,{...stars,variant_id:'layered-night'},{autoplay:false});
  assert.ok(old.querySelector('[data-star]')||old.querySelector('svg'),'默认星点仍调用原固定星点绘制');assert.equal(night.querySelectorAll('canvas').length,1);
  const code=w.MotionExport.code(stars,{variantId:'layered-night'});
  assert.ok(code.indexOf('catalog/effects/reel-neon.js')<code.indexOf('catalog/effects/point-domain-flow.js'),'旧绘制须先注册，再接入星点新示例');
  const prompt=w.MotionExport.prompt(composition,{},data);
  assert.match(prompt,/暖棕|暖色/);assert.match(prompt,/字幕/);assert.match(prompt,/160/);assert.doesNotMatch(prompt,/强调色 #ff5a1f/);
  assert.deepEqual([...new Set(w.MotionFactories[composition.id].breakdown.flatMap(row=>Array.from(row.actions)))].sort(),[...composition.actions].sort());
  original.destroy();variant.destroy();
 }finally{env.close();}
});


test('删除独立光点条目，网格到多涡流线合为连续9.2秒动作，旧书签可定位合并条目',async()=>{
 const env=await environment();try{
  const {w}=env,merged=data.effects.find(e=>e.id==='grid-flow-unfold');
  for(const id of ['warm-light-anchor','grid-bend-spread','multivortex-release']){
   assert.ok(!data.effects.some(e=>e.id===id));assert.equal(w.MotionFactories[id],undefined);assert.ok(!composition.actions.includes(id));
  }
  assert.equal(merged.duration_ms,9200);assert.deepEqual(merged.source_clock,[500/30,776/30]);
  assert.equal(data.redirects['grid-bend-spread'],merged.id);assert.equal(data.redirects['multivortex-release'],merged.id);
  assert.ok(merged.aliases.includes('网格铺展弯曲')&&merged.aliases.includes('多涡流线展开'));
  assert.equal(w.MotionFactories[merged.id].requiresPreparation,true);
  const root=w.document.createElement('div'),p=w.MotionRuntime.create(root,{...merged,poster_only:true},{autoplay:false});await p.ready;
  for(const time of [0,6000,7199,7500,9000,9200]){p.seek(time);assert.equal(root.querySelector('[data-part]').dataset.part,'grid-flow');assert.ok(Math.abs(Number(root.querySelector('[data-part]').dataset.time)-Math.min(775/30,500/30+time/1000))<.00004);}
  assert.equal(root.querySelectorAll('canvas').length,1);p.destroy();
  const rows=w.MotionFactories[composition.id].breakdown;assert.equal(rows.find(r=>r.id==='light').actions.length,0);
  for(const id of ['grid','flow'])assert.equal(rows.find(r=>r.id===id).actions[0],merged.id);
 }finally{env.close();}
});
