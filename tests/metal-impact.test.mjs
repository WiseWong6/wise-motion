// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const registry=JSON.parse(await read('catalog/registry.json'));
const entries=registry.effects.filter(e=>e.source.path==='catalog/effects/metal-impact.js');
const composition=entries.find(e=>e.kind==='composition');
const source=await read('catalog/effects/metal-impact.js');
const hash=data=>createHash('sha256').update(Buffer.from(data.buffer,data.byteOffset,data.byteLength)).digest('hex');
async function environment({unsupported=false,shaderFailure=false,shaderFailureAt=0,html='<div></div>',exported=false}={}){
 const dom=new JSDOM(html,{url:'file:///relocated/wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.ResizeObserver=class{observe(){}disconnect(){}};w.CSS.supports=()=>false;
 const contexts=new Map(),events=[],snapshots=[];let next=0;
 w.HTMLCanvasElement.prototype.getContext=function(type){
  if(type==='2d')return new Proxy({drawImage:canvas=>snapshots.push(canvas),measureText:()=>({width:12})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
  if(unsupported)return null;
  if(contexts.has(this))return contexts.get(this).gl;
  const live=new Set(),bindings=new Map(),data=new Map(),uniforms={},attributes=new Map();let lost=false;
  const allocate=kind=>{const value={kind,id:++next};live.add(value);return value;};
  const release=value=>{assert.ok(live.delete(value),'资源重复释放或未创建');};
  let constant=100,compiled=0;const target={
   compileShader:()=>{compiled++;},getShaderParameter:()=>!shaderFailure&&compiled!==shaderFailureAt,getProgramParameter:()=>true,getShaderInfoLog:()=> '模拟材质编译失败',getProgramInfoLog:()=>'',
   checkFramebufferStatus:()=>gl.FRAMEBUFFER_COMPLETE,isContextLost:()=>lost,
   bindBuffer:(type,value)=>bindings.set(type,value),
   bufferData:(type,value)=>data.set(bindings.get(type),hash(value)),
   vertexAttribPointer:(id,...args)=>attributes.set(id,{buffer:bindings.get(gl.ARRAY_BUFFER),args}),
   getUniformLocation:(p,name)=>name,
   uniform1f:(key,value)=>{uniforms[key]=value;},uniform1i:(key,value)=>{uniforms[key]=value;},
   getExtension:name=>name==='ANGLE_instanced_arrays'?{vertexAttribDivisorANGLE(){},drawArraysInstancedANGLE:(...args)=>draw('arrays-instanced',args),drawElementsInstancedANGLE:(...args)=>draw('elements-instanced',args)}:name==='WEBGL_lose_context'?{loseContext(){live.clear();lost=true;}}:null
  };
  function draw(method,args){events.push({method,args,points:args[0]===gl.POINTS,phase:uniforms.phase,body:uniforms.showBody,sweep:uniforms.showSweep,geometry:attributes.get(0)?.buffer.id,vertices:data.get(attributes.get(0)?.buffer),instances:data.get(attributes.get(2)?.buffer)});}
  for(const kind of ['Shader','Program','Buffer','Texture','Framebuffer','Renderbuffer']){target['create'+kind]=()=>allocate(kind);target['delete'+kind]=release;}
  target.drawArrays=(...args)=>draw('arrays',args);target.drawElements=(...args)=>draw('elements',args);
  const gl=new Proxy(target,{get:(o,key)=>{if(key in o)return o[key];if(String(key).toUpperCase()===key)return o[key]=constant++;return ()=>{};}});
  contexts.set(this,{gl,live,lose(){lost=true;live.clear();},restore(){lost=false;}});return gl;
 };
 const files=['vendor/animejs/anime.umd.min.js','catalog/runtime.js','catalog/matching.js','catalog/export.js','catalog/effects/metal-impact.js'];
 if(exported)for(const script of w.document.scripts)w.eval(script.src?await read(script.getAttribute('src')):script.textContent);
 else for(const file of files)w.eval(await read(file));
 return {w,contexts,events,snapshots,close(){w.MotionRuntime.disposeAll();w.anime.engine.pause();w.close();}};
}
function player(env,e=composition){const root=env.w.document.createElement('div');env.w.document.body.append(root);const p=env.w.MotionRuntime.create(root,e,{autoplay:false});return {root,p,canvas:root.querySelector('canvas')};}
function trace(env,p,t){const start=env.events.length;p.seek(t);return JSON.stringify(env.events.slice(start));}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));


test('金属组合及三个独立动作的离线复制和目录入口有效',async()=>{
 assert.equal(entries.length,4);assert.equal(composition.duration_ms,5300);assert.equal(composition.actions.length,3);
 assert.match(await read('catalog/index.html'),/src="effects\/metal-impact\.js"/);
 const env=await environment({unsupported:true});try{
  const layers=env.w.MotionFactories[composition.id].breakdown;
  assert.deepEqual([...new Set(layers.flatMap(layer=>Array.from(layer.actions)))].sort(),composition.actions.slice().sort());
  for(const e of entries){
   const prompt=env.w.MotionExport.prompt(e,{},registry);assert.doesNotMatch(prompt,/\/Users\/|验收|file:/);
   const code=env.w.MotionExport.code(e);assert.match(code,/catalog\/effects\/metal-impact\.js/);assert.doesNotMatch(code,/\/Users\/|scenes-motion|liquid-studies/);
   for(const [,resource]of code.matchAll(/(?:src|href)="([^"]+)"/g))assert.ok((await stat(new URL('../'+resource,import.meta.url))).isFile());
  }
  const demo=await environment({unsupported:true,html:env.w.MotionExport.code(composition),exported:true});try{
   assert.equal(await demo.w.MotionDemo.ready,true);demo.w.MotionDemo.pause();demo.w.MotionDemo.seek(820);assert.equal(demo.w.document.querySelector('canvas').dataset.sourceTime,'0.82');
   demo.w.dispatchEvent(new demo.w.Event('pagehide'));assert.equal(demo.w.MotionRuntime.instanceCount,0);
  }finally{demo.close();}
 }finally{env.close();}
});

test('三个动作隔离自身运动和字形，同一时刻回拖一致',async()=>{
 const env=await environment();try{
  const api=env.w.WiseMetalImpact;
  assert.match(api.fragmentFor('drop'),/return metalBallsMap\(p\);/);
  assert.match(api.fragmentFor('sweep'),/return wordmark\(p\);/);
  assert.equal(api.phaseAt(840,'drop'),.54);assert.equal(api.phaseAt(0,'collision'),.54);assert.equal(api.phaseAt(2960,'collision'),3.02);assert.equal(api.phaseAt(0,'sweep'),3.10);
  for(const e of entries){
   const {p,root,canvas}=player(env,e);p.play();p.seek(e.preview_ms);p.pause();p.setSpeed(1.5);
   assert.equal(p.preparing,true);assert.equal(await p.ready,true);assert.equal(p.paused,true);assert.equal(p.currentTime,e.preview_ms);assert.equal(p.speed,1.5);
   for(const t of [0,e.preview_ms,e.duration_ms]){const before=trace(env,p,t);p.seek(e.duration_ms-t);assert.equal(trace(env,p,t),before);}
   if(e.kind==='composition'){
    const before=trace(env,p,820);root.querySelector('[data-layer="body"]').setAttribute('data-composition-hidden','');await tick();assert.notEqual(trace(env,p,820),before);
    root.querySelector('[data-layer="body"]').removeAttribute('data-composition-hidden');await tick();assert.equal(trace(env,p,820),before);
    root.querySelector('[data-layer="sweep"]').setAttribute('data-composition-hidden','');await tick();assert.equal(env.events.at(-2).sweep,0);
   }
   p.destroy();assert.equal(root.childElementCount,0);assert.equal(canvas.width,1);assert.ok([...env.contexts.values()].every(c=>c.live.size===0));
  }
  assert.equal(env.w.MotionRuntime.instanceCount,0);assert.equal(env.w.MotionRuntime.runningCount,0);
 }finally{env.close();}
});

test('六色粒子从同一中心向四周散射，再沿原粒子身份汇聚到字形，最终不留散点',()=>{
 const sandbox={};vm.createContext(sandbox);vm.runInContext(source,sandbox);
 const {particles,particleFrame,glyphDistance}=sandbox.WiseMetalImpact;
 const centers=[-2.34,-1.22,-.16,.50,1.31,2.385];
 assert.equal(particles.length,753);assert.equal(new Set(particles.map(p=>p.letter)).size,6);
 for(const p of particles){
  assert.ok(Math.hypot(p.start[0],p.start[1]-.33,p.start[2])<.305,'六色粒子起点都位于同一个中心撞点内');
  const [x,y,z]=p.target;
  assert.ok(glyphDistance(x-centers[p.letter],y-.52,z,p.letter)<0,'终点位于真正的金属字面内');
  if(p.letter===1||p.letter===4)assert.ok(Math.hypot(x-centers[p.letter],y-.52)>.295,'O 的圆形中空不能被粒子填满');
 }
 for(const t of [0,1.30,1.35,2.74,2.96,3.5,5.3])assert.equal(particleFrame(t).length,0);
 for(const part of ['drop','sweep'])assert.equal(particleFrame(1.50,part).length,0);
 for(let ms=1351;ms<2740;ms+=7){
  const frame=particleFrame(ms/1000);assert.equal(frame.length,particles.length*6);
  assert.equal(hash(frame),hash(particleFrame(ms/1000)),'同一时刻回拖必须完全一致');
  for(let i=0;i<frame.length;i+=6){
   assert.ok(Array.from(frame.slice(i,i+6)).every(Number.isFinite));
   assert.ok(frame[i+3]>0&&frame[i+3]<.060);assert.ok(frame[i+5]>=0&&frame[i+5]<=1);
  }
 }

 // Each colour reaches every quadrant instead of reversing as a left/right group.
 for(let letter=0;letter<6;letter++){
  const group=particles.filter(p=>p.letter===letter);
  for(const sx of [-1,1])for(const sy of [-1,1])
   assert.ok(group.some(p=>p.burst[0]*sx>1&&(p.burst[1]-.33)*sy>1),'每种颜色都从中心散向四周');
  for(const p of group){
   const outgoing=[p.burst[0]-p.start[0],p.burst[1]-p.start[1]];
   assert.ok(p.start[0]*outgoing[0]+(p.start[1]-.33)*outgoing[1]>0,'从撞点向外散射，不按字母位置反弹');
  }
 }
 const outside=frame=>Array.from({length:frame.length/6},(_,i)=>{const x=frame[i*6],y=frame[i*6+1]-.33-.16*frame[i*6+2];return Math.abs(x)>3.55||Math.abs(y)>2;}).filter(Boolean).length;
 const peak=particleFrame(1.70),escaped=outside(peak);
 assert.ok(escaped>particles.length*.60&&escaped<particles.length*.85,'多数冲出画面，但保留一簇可见粒子延续动势');
 assert.ok(Math.max(...Array.from(peak).filter((_,i)=>i%6===0).map(Math.abs))>7.1,'爆散距离明显超过画面边缘');
 for(const [axis,sign,edge]of [[0,-1,3.55],[0,1,3.55],[1,-1,2],[1,1,2]]){
  const count=Array.from({length:peak.length/6},(_,i)=>(axis===0?peak[i*6]:peak[i*6+1]-.33-.16*peak[i*6+2])*sign>edge).filter(Boolean).length;
  assert.ok(count>100,'四个方向都应有明显飞出画面的粒子');
 }
 let lastOutside=escaped;
 for(let ms=1750;ms<=2550;ms+=50){const count=outside(particleFrame(ms/1000));assert.ok(count<=lastOutside,'回收不能突然再次向画外跳动');lastOutside=count;}
 assert.equal(lastOutside,0,'成字前全部粒子已回到画面');
 const points=frame=>Array.from({length:frame.length/6},(_,i)=>Array.from(frame.slice(i*6,i*6+3)));
 for(const [time,key]of [[1.3500001,'start'],[1.70,'burst']]){
  const actual=points(particleFrame(time)),expected=particles.map(p=>p[key]).sort((a,b)=>a[2]-b[2]);
  expected.forEach((p,i)=>assert.ok(Math.hypot(...p.map((v,k)=>v-actual[i][k]))<1e-6,'粒子没有更换身份或跳到新位置'));
 }
 const visible=frame=>Array.from(frame).filter((_,i)=>i%6===5).filter(alpha=>alpha>.001).length;
 let lastVisible=particles.length;
 for(let ms=2350;ms<=2700;ms+=10){
  const count=visible(particleFrame(ms/1000));
  assert.ok(count<=lastVisible,'粒子融入金属后不能重新出现');lastVisible=count;
 }
 const midAlpha=Array.from(particleFrame(2.50)).filter((_,i)=>i%6===5);
 assert.ok(midAlpha.some(alpha=>alpha<.5)&&midAlpha.some(alpha=>alpha>.99),'较早抵达的粒子先融入金属，仍在回收的粒子继续可见');
 assert.equal(visible(particleFrame(2.70)),0,'全部粒子必须在落定前融入金属，不能形成完整粒子字后继续停留');
 assert.equal(particleFrame(2.82).length,0,'原先粒子字停留时刻只保留实体金属');

});

test('粒子只在组合与对撞动作中绘制，隐藏主体后停止绘制，独立动作与组合完全一致',async()=>{
 const env=await environment();try{
  const full=player(env),part=player(env,entries.find(e=>e.id==='horizontal-metal-type'));
  await Promise.all([full.p.ready,part.p.ready]);
  const draws=(p,t)=>JSON.parse(trace(env,p,t)).filter(e=>e.points);
  const fullPoints=draws(full.p,1520),partPoints=draws(part.p,980);
  assert.equal(fullPoints.length,1);assert.equal(partPoints.length,1);
  assert.equal(fullPoints[0].args[2],753);assert.equal(fullPoints[0].vertices,partPoints[0].vertices);
  for(const t of [1300,1350,2960,5300])assert.equal(draws(full.p,t).length,0);
  full.root.querySelector('[data-layer="body"]').setAttribute('data-composition-hidden','');await tick();assert.equal(draws(full.p,1520).length,0);
  for(const id of ['metal-drop-split','polished-metal-sweep']){
   const isolated=player(env,entries.find(e=>e.id===id));await isolated.p.ready;assert.equal(draws(isolated.p,500).length,0);isolated.p.destroy();
  }
  full.p.destroy();part.p.destroy();assert.ok([...env.contexts.values()].every(c=>c.live.size===0));
 }finally{env.close();}
});

test('新增粒子材质任一阶段编译失败时释放已创建的金属资源',async()=>{
 for(const shaderFailureAt of [4,5]){
  const env=await environment({shaderFailureAt});try{
   const {p,root}=player(env);assert.equal(await p.ready,false);assert.match(root.textContent,/模拟材质编译失败/);p.destroy();
   assert.ok([...env.contexts.values()].every(c=>c.live.size===0));
  }finally{env.close();}
 }
});

test('提前销毁、字体失败、材质失败及缩略图均释放金属资源',async()=>{
 for(const shaderFailure of [false,true]){
  const env=await environment({shaderFailure});try{
   const {p,root}=player(env);
   if(shaderFailure){assert.equal(await p.ready,false);assert.match(root.textContent,/模拟材质编译失败/);p.destroy();}
   else{p.destroy();assert.equal(await p.ready,false);await tick();assert.equal(root.childElementCount,0);}
   assert.ok([...env.contexts.values()].every(c=>c.live.size===0));
  }finally{env.close();}
 }
 const env=await environment();try{
  const root=env.w.document.createElement('div');env.w.document.body.append(root);
  const draw=env.w.MotionFactories[composition.id](root,env.w.MotionKit,{...composition,poster_only:true});await draw.ready;draw(1800);draw.destroy(true);
  assert.equal(root.querySelector('canvas').width,640);assert.equal(root.querySelector('canvas').dataset.sourceTime,'1.8');assert.ok([...env.contexts.values()].every(c=>c.live.size===0));
  const n=env.events.length;draw(0);assert.equal(env.events.length,n);
  Object.defineProperty(env.w.document,'fonts',{value:{load:async()=>[]},configurable:true});const failed=player(env);assert.equal(await failed.p.ready,false);assert.match(failed.root.textContent,/字体未载入/);failed.p.destroy();
 }finally{env.close();}
});
