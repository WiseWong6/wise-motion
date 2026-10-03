// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data} from './helpers.mjs';
const ids=['glass-interface-sequence','diffuse-light-drift','glass-card-stagger','convex-glass-lens'];

test('玻璃组合与三个独立动作可反复定位，各实例互不影响并能释放',async()=>{
 const env=await environment();try{
  const {w}=env,roots=ids.map(()=>w.document.createElement('div'));
  const players=ids.map((id,i)=>w.MotionRuntime.create(roots[i],data.effects.find(e=>e.id===id),{autoplay:false}));
  for(let i=0;i<players.length;i++){
   const e=data.effects.find(x=>x.id===ids[i]),player=players[i];player.seek(e.preview_ms);const first=roots[i].innerHTML;
   player.seek(e.duration_ms);player.seek(0);player.seek(e.preview_ms);assert.equal(roots[i].innerHTML,first,e.name);
   assert.equal(roots[i].querySelectorAll('canvas[data-layer]').length,i===0?7:1);
  }
  const standalone=roots[3].innerHTML;players[0].seek(3100);assert.equal(roots[3].innerHTML,standalone,'组合定位不能改动独立凸泡');
  const original=roots[0].querySelector('canvas:not([data-layer])'),layer=roots[0].querySelector('[data-layer="chat"]');
  layer.setAttribute('data-composition-hidden','');await Promise.resolve();assert.equal(original.style.visibility,'hidden');
  layer.removeAttribute('data-composition-hidden');await Promise.resolve();assert.equal(original.style.visibility,'visible');
  const canvases=roots.flatMap(root=>[...root.querySelectorAll('canvas')]);players.forEach(p=>p.destroy());
  assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(w.MotionRuntime.runningCount,0);
  for(const canvas of canvases)assert.equal(canvas.width,1,'销毁后释放像素缓冲');
  for(const root of roots)assert.equal(root.childElementCount,0);
 }finally{env.close();}
});

test('玻璃拆解对应真实独立动作，复制页携带正式绘制源码和验收配色',async()=>{
 const env=await environment();try{
  const {w}=env;w.eval(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'));
  const comp=data.effects.find(e=>e.id===ids[0]),rows=w.MotionFactories[comp.id].breakdown;
  assert.deepEqual([...new Set(rows.flatMap(row=>Array.from(row.actions)))].sort(),[...comp.actions].sort());
  for(const id of ids){const e=data.effects.find(x=>x.id===id),code=w.MotionExport.code(e,{speed:.75}),prompt=w.MotionExport.prompt(e,{},data);
   assert.match(code,/catalog\/effects\/glass-light\.js/);assert.doesNotMatch(code,/opus-glass-refinement|reference\.mp4|frames\//);
   assert.match(prompt,/紫.*蓝|紫蓝/);assert.doesNotMatch(prompt,/强调色 #ff5a1f/);
  }
  const root=w.document.createElement('div'),draw=w.MotionFactories[comp.id](root,w.MotionKit,comp);draw(comp.preview_ms);
  draw.destroy(true);assert.equal(root.querySelectorAll('canvas').length,1,'缩略图只保留最终像素面');draw(0);assert.equal(root.querySelectorAll('canvas').length,1);
 }finally{env.close();}
});

const cardIds=['glass-voice-card-illustration','glass-dialogue-card-illustration','glass-control-card-illustration'];
test('三张透光卡作为独立插画登记，透明居中、静态定位和导出保持一致',async()=>{
 const env=await environment();try{
  const {w}=env;w.eval(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'));
  for(const id of cardIds){
   const def=data.effects.find(e=>e.id===id),root=w.document.createElement('div');
   assert.equal(def.kind,'illustration');assert.equal(def.category,'illustration-interface');
   const player=w.MotionRuntime.create(root,def,{autoplay:false}),node=root.querySelector('canvas');
   assert.equal(root.querySelectorAll('canvas').length,1);assert.equal(node.className,'pattern-canvas');
   assert.equal(node.style.background,'transparent');assert.equal(node.width,1066);assert.equal(node.height,600);
   const initial=root.innerHTML;for(const t of [1000,500,0,700]){player.seek(t);assert.equal(root.innerHTML,initial);}
   const code=w.MotionExport.code(def),prompt=w.MotionExport.prompt(def,{},data);
   assert.match(code,/catalog\/effects\/glass-light\.js/);assert.match(prompt,/透明/);assert.match(prompt,/静态/);
   player.destroy();assert.equal(node.width,1);assert.equal(root.childElementCount,0);
   const draw=w.MotionFactories[id](root,w.MotionKit,def);draw.destroy(true);assert.equal(root.querySelectorAll('canvas').length,1);
   root.remove();
  }
  assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(w.MotionRuntime.runningCount,0);
 }finally{env.close();}
});

test('WISE 创作文案由共用绘制输出，片尾光环与 MOTION 的首个 O 在同一位置',async()=>{
 const env=await environment();try{
  const {w}=env,contexts=[],cache=new WeakMap();
  w.HTMLCanvasElement.prototype.getContext=function(){
   if(cache.has(this))return cache.get(this);
   const trace=[],ctx=new Proxy({canvas:this,globalAlpha:1,trace,
    createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),
    getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),
    fillText(value,x,y){trace.push({type:'text',value,x,y});},
    arc(x,y,r){trace.push({type:'arc',x,y,r});},
    getImageData:(x,y,width,height)=>({data:new Uint8ClampedArray(width*height*4),width,height}),
    createImageData:(width,height)=>({data:new Uint8ClampedArray(width*height*4),width,height})
   },{get:(o,k)=>k in o?o[k]:()=>{}});
   cache.set(this,ctx);contexts.push(ctx);return ctx;
  };
  const painter=w.WiseGlassLight.createPainter(w.document),canvas=w.document.createElement('canvas'),ctx=canvas.getContext('2d');
  for(const key of ['listening','chat','focus'])painter.drawCard(ctx,key);
  const words=contexts.flatMap(c=>c.trace).filter(x=>x.type==='text').map(x=>x.value);
  for(const word of ['Voice input','WISE','Bring this idea to life.','Start with a clear idea.','Give every move a purpose.','Let the details catch light.','Make the next frame matter.','Build a scene','Explore a variation','Create','Light'])assert.ok(words.includes(word),word);
  assert.ok(!words.includes('Aurora'));assert.ok(!words.some(x=>/Sunday|family|calendar/.test(x)));
  contexts.forEach(c=>{c.trace.length=0;});const end=painter.render(ctx,3.1),marks=contexts.flatMap(c=>c.trace),arcs=marks.filter(x=>x.type==='arc');
  assert.ok(arcs.some(x=>x.x===end.lens[0]&&x.y===end.lens[1]&&x.r===28.1),'气泡落点与首个 O 的光环中心重合');
  assert.ok(arcs.some(x=>x.x===739&&x.y===304&&x.r===28.1),'第二个 O 仍完整存在');
  for(const value of ['Motion with meaning.','让每一次运动，都有意义。'])assert.ok(marks.some(x=>x.type==='text'&&x.value===value&&x.x===533));
  painter.destroy();
 }finally{env.close();}
});
