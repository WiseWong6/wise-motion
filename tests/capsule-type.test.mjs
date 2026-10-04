// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const registry=JSON.parse(await read('catalog/registry.json'));
const entries=registry.effects.filter(e=>e.source.path==='catalog/effects/capsule-type.js');
const composition=entries.find(e=>e.kind==='composition');
const source=await read('catalog/effects/capsule-type.js');
const hash=data=>createHash('sha256').update(Buffer.from(data.buffer,data.byteOffset,data.byteLength)).digest('hex');

async function environment({unsupported=false,shaderFailure=false,html='<div></div>',exported=false}={}){
 const dom=new JSDOM(html,{url:'file:///relocated/wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.ResizeObserver=class{observe(){}disconnect(){}};w.CSS.supports=()=>false;
 const contexts=new Map(),events=[],snapshots=[];let next=0;
 w.HTMLCanvasElement.prototype.getContext=function(type){
  if(type==='2d')return {drawImage:canvas=>snapshots.push(canvas)};
  if(unsupported)return null;
  if(contexts.has(this))return contexts.get(this).gl;
  const live=new Set(),bindings=new Map(),data=new Map(),uniforms={},attributes=new Map();let lost=false;
  const allocate=kind=>{const value={kind,id:++next};live.add(value);return value;};
  const release=value=>{assert.ok(live.delete(value),'资源重复释放或未创建');};
  let constant=100;const target={
   getShaderParameter:()=>!shaderFailure,getProgramParameter:()=>true,getShaderInfoLog:()=> '模拟材质编译失败',getProgramInfoLog:()=>'',
   checkFramebufferStatus:()=>gl.FRAMEBUFFER_COMPLETE,isContextLost:()=>lost,
   bindBuffer:(type,value)=>bindings.set(type,value),
   bufferData:(type,value)=>data.set(bindings.get(type),hash(value)),
   vertexAttribPointer:(id,...args)=>attributes.set(id,{buffer:bindings.get(gl.ARRAY_BUFFER),args}),
   getUniformLocation:(p,name)=>name,
   uniform1f:(key,value)=>{uniforms[key]=value;},uniform1i:(key,value)=>{uniforms[key]=value;},
   getExtension:name=>name==='ANGLE_instanced_arrays'?{vertexAttribDivisorANGLE(){},drawArraysInstancedANGLE:(...args)=>draw('arrays-instanced',args),drawElementsInstancedANGLE:(...args)=>draw('elements-instanced',args)}:name==='WEBGL_lose_context'?{loseContext(){live.clear();lost=true;}}:null
  };
  function draw(method,args){events.push({method,args,kind:uniforms.u_kind,time:uniforms.u_time,geometry:attributes.get(0)?.buffer.id,instances:data.get(attributes.get(2)?.buffer)});}
  for(const kind of ['Shader','Program','Buffer','Texture','Framebuffer','Renderbuffer']){target['create'+kind]=()=>allocate(kind);target['delete'+kind]=release;}
  target.drawArrays=(...args)=>draw('arrays',args);target.drawElements=(...args)=>draw('elements',args);
  const gl=new Proxy(target,{get:(o,key)=>{if(key in o)return o[key];if(String(key).toUpperCase()===key)return o[key]=constant++;return ()=>{};}});
  contexts.set(this,{gl,live,lose(){lost=true;live.clear();},restore(){lost=false;}});return gl;
 };
 const files=['vendor/animejs/anime.umd.min.js','catalog/runtime.js','catalog/matching.js','catalog/export.js','catalog/effects/capsule-type.js'];
 if(exported)for(const script of w.document.scripts)w.eval(script.src?await read(script.getAttribute('src')):script.textContent);
 else for(const file of files)w.eval(await read(file));
 return {w,contexts,events,snapshots,close(){w.MotionRuntime.disposeAll();w.anime.engine.pause();w.close();}};
}
function player(env,e=composition){const root=env.w.document.createElement('div');env.w.document.body.append(root);const p=env.w.MotionRuntime.create(root,e,{autoplay:false});return {root,p,canvas:root.querySelector('canvas')};}
function trace(env,p,t){const start=env.events.length;p.seek(t);return JSON.stringify(env.events.slice(start));}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));

test('登记一个完整组合与三个真实动作，提示词和复制页面可离线迁移',async()=>{
 assert.equal(entries.length,4);assert.equal(composition.duration_ms,5000);assert.equal(composition.actions.length,3);
 assert.match(await read('catalog/index.html'),/src="effects\/capsule-type\.js"/);
 const env=await environment({unsupported:true});try{
  const layers=env.w.MotionFactories[composition.id].breakdown;
  assert.deepEqual([...new Set(layers.flatMap(layer=>Array.from(layer.actions)))].sort(),composition.actions.slice().sort());
  for(const e of entries){
   const prompt=env.w.MotionExport.prompt(e,{},registry);assert.match(prompt,/亮粉、明黄、湖蓝/);assert.doesNotMatch(prompt,/\/Users\/|验收|file:|原片|近黑底/);
   const code=env.w.MotionExport.code(e);assert.match(code,/catalog\/effects\/capsule-type\.js/);assert.doesNotMatch(code,/\/Users\/|motion-model\.js|single-scenes/);
   for(const [,resource]of code.matchAll(/(?:src|href)="([^"]+)"/g))assert.ok((await stat(new URL('../'+resource,import.meta.url))).isFile());
  }
  const demo=await environment({unsupported:true,html:env.w.MotionExport.code(composition),exported:true});try{
   assert.equal(await demo.w.MotionDemo.ready,true);demo.w.MotionDemo.pause();demo.w.MotionDemo.seek(2300);assert.equal(demo.w.document.querySelector('canvas').dataset.sourceTime,'2.3');
   demo.w.dispatchEvent(new demo.w.Event('pagehide'));assert.equal(demo.w.MotionRuntime.instanceCount,0);
  }finally{demo.close();}
 }finally{env.close();}
});

test('部件仅生成自身对象与地面响应，同一时刻回拖一致',()=>{
 const context=vm.createContext({});vm.runInContext(source,context);const core=context.WiseCapsuleType;
 const a=core.frameDraws(2.3),again=()=>JSON.stringify(core.frameDraws(2.3));const first=again();core.frameDraws(0);core.frameDraws(5);assert.equal(again(),first);
 assert.equal(a.state.capsuleCount,5760);assert.ok(a.state.airborne>0);assert.equal(a.state.motionLetters.length,6);
 for(const part of ['wise','impact','motion']){
  const channels={wise:part==='wise',impact:part==='impact',motion:part==='motion'};const frame=core.frameDraws(2.3,channels);
  assert.equal(frame.state.letters.length,part==='wise'?4:0);assert.equal(frame.state.motionLetters.length,part==='motion'?6:0);assert.equal(frame.state.ballEnabled,part==='impact'?1:0);
  if(part!=='impact')assert.equal(frame.state.airborne,0);
  assert.deepEqual(Array.from(frame.draws.filter(x=>x.kind===2),x=>x.mesh),part==='wise'?['letter0','letter1','letter2','letter3']:part==='motion'?['letter4','letter5','letter6','letter1','letter5','letter7']:[]);
 }
 const empty={wise:false,impact:false,motion:false};assert.equal(hash(core.model.frameAt(0,empty).fieldInstances),hash(core.model.frameAt(5,empty).fieldInstances),'关掉所有因果来源后，地面不留下幽灵压痕或飞散');
 assert.equal(core.frameDraws(5,{field:false}).draws.filter(d=>d.kind<2).length,0);
 assert.equal(core.model.frameAt(5).airborne,0);
});

test('模型准备期间保留暂停与定位，四个入口共享绘制并释放资源',async()=>{
 const env=await environment();try{
  for(const e of entries){
   const {p,root,canvas}=player(env,e);p.play();p.seek(e.preview_ms);p.pause();p.setSpeed(1.5);
   assert.equal(p.preparing,true);assert.equal(await p.ready,true);assert.equal(p.paused,true);assert.equal(p.currentTime,e.preview_ms);assert.equal(p.speed,1.5);
   for(const t of [0,e.preview_ms,e.duration_ms]){const before=trace(env,p,t);p.seek(e.duration_ms-t);assert.equal(trace(env,p,t),before,e.name+'乱序重播不改变图形指令');}
   if(e.kind==='composition'){
    p.seek(2300);const before=trace(env,p,2300);root.querySelector('[data-layer="wise"]').setAttribute('data-composition-hidden','');await tick();assert.notEqual(trace(env,p,2300),before);
    root.querySelector('[data-layer="wise"]').removeAttribute('data-composition-hidden');await tick();assert.equal(trace(env,p,2300),before);
    const ctx=env.contexts.get(canvas);ctx.lose();canvas.dispatchEvent(new env.w.Event('webglcontextlost',{cancelable:true}));p.seek(4100);ctx.restore();canvas.dispatchEvent(new env.w.Event('webglcontextrestored'));assert.equal(canvas.dataset.sourceTime,'4.1');assert.ok(ctx.live.size>0);
   }
   p.destroy();assert.equal(root.childElementCount,0);assert.equal(canvas.width,1);assert.ok([...env.contexts.values()].every(c=>c.live.size===0));
  }
  assert.equal(env.w.MotionRuntime.instanceCount,0);assert.equal(env.w.MotionRuntime.runningCount,0);
 }finally{env.close();}
});

test('提前销毁、材质失败和静态缩略图均不保留活动图形资源',async()=>{
 for(const shaderFailure of [false,true]){
  const env=await environment({shaderFailure});try{
   const {p,root}=player(env,entries.find(e=>e.id==='capsule-impact-scatter'));
   if(shaderFailure){assert.equal(await p.ready,false);assert.match(root.textContent,/模拟材质编译失败/);p.destroy();}
   else{p.destroy();assert.equal(await p.ready,false);await tick();assert.equal(root.childElementCount,0);}
   assert.ok([...env.contexts.values()].every(c=>c.live.size===0));
  }finally{env.close();}
 }
 const env=await environment();try{
  const root=env.w.document.createElement('div');env.w.document.body.append(root);const e=entries.find(e=>e.id==='capsule-impact-scatter');
  const draw=env.w.MotionFactories[e.id](root,env.w.MotionKit,{...e,poster_only:true});await draw.ready;draw(e.preview_ms);draw.destroy(true);
  assert.equal(env.snapshots.length,1);assert.equal(root.querySelector('canvas').width,640);assert.equal(root.querySelector('canvas').dataset.sourceTime,'2.25');assert.ok([...env.contexts.values()].every(c=>c.live.size===0));
  const n=env.events.length;draw(0);assert.equal(env.events.length,n);
 }finally{env.close();}
});

test('远景覆盖整个可见地面，在边界出现前完全融入渐变背景',()=>{
 const context=vm.createContext({});vm.runInContext(source,context);const core=context.WiseCapsuleType,b=core.fringeBounds;
 const unit=a=>{const length=Math.hypot(...a);return a.map(v=>v/length);},cross=(a,c)=>[a[1]*c[2]-a[2]*c[1],a[2]*c[0]-a[0]*c[2],a[0]*c[1]-a[1]*c[0]];
 for(let frame=0;frame<=150;frame++){
  const state=core.sceneAt(frame/30),forward=unit(state.target.map((v,j)=>v-state.eye[j])),right=unit(cross(forward,[0,1,0])),up=cross(right,forward),scale=Math.tan(state.fov*Math.PI/360);
  for(let y=-1;y<=1.001;y+=.2)for(let x=-1;x<=1.001;x+=.2){
   const ray=forward.map((v,j)=>v+right[j]*x*scale*16/9+up[j]*y*scale);if(ray[1]>=0)continue;
   const depth=(.76-state.eye[1])/ray[1];if(depth<=0||depth>=b.fadeEnd)continue;
   const p=state.eye.map((v,j)=>v+ray[j]*depth);
   assert.ok(p[0]>b.minX+.34&&p[0]<b.maxX-.34&&p[2]>b.minZ+.34&&p[2]<b.maxZ-.34,'可见地面出现外边界：'+frame/30);
  }
 }
 const state=core.sceneAt(2.87),fringe=core.fringeAt(state);assert.ok(fringe.length>0);assert.equal(fringe.length%14,0);
 for(let i=0;i<fringe.length;i+=14){const x=fringe[i],z=fringe[i+2];assert.ok(Math.abs(x)>12.24||Math.abs(z)>13.6,'不与近景胶囊重叠');}
 assert.equal(hash(core.fringeAt(state)),hash(fringe));assert.match(core.sources.sky,/backdrop/);assert.match(core.sources.fragment,/backdrop\(gl_FragCoord/);
});
