// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {environment as catalogue} from './helpers.mjs';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const registry=JSON.parse(await read('catalog/registry.json'));
const by=id=>registry.effects.find(e=>e.id===id);
const composition=by('geometric-poster-sequence');
const definitions=[composition,by('geometry-turn-build'),{...by('glitch-band-transition'),variant_id:'poster-cut'},{...by('mask-stagger-text'),variant_id:'poster-words'},{...by('rapid-cut'),variant_id:'print-burst'}];
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const digest=data=>createHash('sha256').update(typeof data==='string'?data:Buffer.from(data)).digest('hex');
export async function setup({font=Promise.resolve([{}]),html='<div id="root"></div>',exported=false}={}){
 const dom=new JSDOM(html,{url:'file:///relocated/wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.ResizeObserver=class{observe(){}disconnect(){}};w.CSS.supports=()=>false;
 const buffers=[],contexts=new Map(),fontCalls=[];
 w.Path2D=class{constructor(){this.commands=[];}};
 for(const key of ['moveTo','lineTo','bezierCurveTo','closePath','ellipse'])w.Path2D.prototype[key]=function(...args){this.commands.push([key,...args]);};
 Object.defineProperty(w.document,'fonts',{value:{load:family=>{fontCalls.push(family);return font;}}});
 w.HTMLCanvasElement.prototype.getContext=function(){
  if(contexts.has(this))return contexts.get(this);
  buffers.push(this);const trace=[],state={font:'10px sans-serif'},stack=[];
  const normalize=v=>v?.commands||v;
  const ctx=new Proxy({trace,
   setTransform(...args){trace.length=0;trace.push(['setTransform',...args]);},
   save(){stack.push({...state});trace.push(['save']);},restore(){Object.assign(state,stack.pop());trace.push(['restore']);},
   createImageData:(width,height)=>({data:new Uint8ClampedArray(width*height*4)}),
   putImageData:(value,...args)=>trace.push(['pixels',digest(value.data),...args]),
   createPattern:(canvas,mode)=>({pattern:digest(JSON.stringify(contexts.get(canvas).trace)),mode}),
   measureText(text){const size=Number(state.font.match(/([\d.]+)px/)[1]);return {width:text.length*size*.5,actualBoundingBoxLeft:0,actualBoundingBoxRight:text.length*size*.5,actualBoundingBoxAscent:size*.7,actualBoundingBoxDescent:size*.02};},
   drawImage(canvas,...args){trace.push(['drawImage',digest(JSON.stringify(contexts.get(canvas).trace)),...args]);}
  },{get:(o,k)=>k in o?o[k]:k in state?state[k]:(...args)=>trace.push([k,...args.map(normalize)]),set:(o,k,v)=>{state[k]=v;trace.push([k,k==='font'?v.replace('WiseMotionOswald','Oswald'):v]);return true;}});
  contexts.set(this,ctx);return ctx;
 };
 const files=['vendor/animejs/anime.umd.min.js','catalog/runtime.js','catalog/matching.js','catalog/export.js','catalog/effects/geometric-poster.js','catalog/effects/transition.js','catalog/effects/reel-transitions.js','catalog/effects/history-patterns.js'];
 if(exported)for(const script of w.document.scripts)w.eval(script.src?await read(script.getAttribute('src')):script.textContent);
 else for(const file of files)w.eval(await read(file));
 return {w,buffers,contexts,fontCalls,trace:canvas=>JSON.stringify(contexts.get(canvas).trace.filter(c=>!(c[0]==='translate'&&c[1]===0&&c[2]===0))),close(){w.MotionRuntime.disposeAll();w.anime.engine.pause();w.close();}};
}
function player(env,e=composition){const root=env.w.document.createElement('div');env.w.document.body.append(root);const p=env.w.MotionRuntime.create(root,e,{autoplay:false});return {root,p,canvas:root.querySelector('canvas')};}
function geometryDraws(env,canvas){
 const trace=env.contexts.get(canvas).trace,start=trace.findIndex(c=>c[0]==='rect'&&c[1]===0&&c[2]===0&&c[3]===1672&&Math.abs(c[4]-654)<.001),draws=[];
 assert.ok(start>=0,'完整构图的绘制区域存在');let depth=1;
 for(const c of trace.slice(start+1)){
  if(c[0]==='save')depth++;if(c[0]==='restore')depth--;
  if(!depth)break;if(c[0]==='drawImage')draws.push(c[1]);
 }
 return draws;
}

test('先满幅闪切，结束后上移，最后同字号标题升入',async()=>{
 const env=await setup();try{
  const {sample,duration,burstStart,burstEnd,brandStart}=env.w.WiseGeometricPoster;
  assert.ok(Math.abs(duration-composition.duration_ms/1000)<1e-12);
  assert.equal(sample(0).scene.zoom,941/654);assert.equal(sample(.78).scene.rotation,-90);assert.ok(sample(1.12).scene.rotation===0);
  assert.equal(burstStart,1.9);assert.equal(burstEnd,2.35);
  for(let i=0;i<=450;i++){
   const t=1.9+i/1000,frame=sample(t);assert.equal(frame.scene.zoom,941/654);
   assert.equal(frame.scene.burst,-1);assert.equal(frame.scene.cutout,-1);assert.equal(frame.states.brand.visible,false);
  }
  assert.equal(sample(burstStart-.00001).scene.bandCut,null);assert.equal(sample(burstEnd).scene.bandCut,null);
  assert.equal(sample(1.92).scene.bandCut.active,false);assert.equal(sample(1.93).scene.bandCut.active,true);
  assert.equal(sample(2.32).scene.bandCut.active,true);assert.equal(sample(2.33).scene.bandCut.active,false);
  assert.ok(sample(2.48).scene.zoom<941/654&&sample(2.48).scene.zoom>1);assert.equal(sample(2.62).scene.zoom,1);
  assert.ok(brandStart>2.62);assert.equal(sample(brandStart).states.brand.visible,false);
  assert.ok(sample(brandStart+.05).states.brand.words[0]>0);assert.equal(sample(brandStart+.05).states.brand.words[1],0);
  assert.deepEqual(Array.from(sample(brandStart+.51).states.brand.words),[1,1]);
  const {p,canvas}=player(env);assert.equal(await p.ready,true);p.seek(duration*1000);const end=env.trace(canvas);p.seek((brandStart+.6)*1000);assert.equal(env.trace(canvas),end);
 }finally{env.close();}
});

test('组合与各动作示例独立准备资源，任意回拖保持相同绘制',async()=>{
 const env=await setup();try{
  for(const [i,e] of definitions.entries()){
   const start=env.buffers.length,fontStart=env.fontCalls.length,{p,root,canvas}=player(env,e);assert.equal(await p.ready,true);
   const parts=canvas.dataset.parts.split(' ').filter(Boolean);assert.equal(parts.length,[7,7,7,0,7][i]);
   assert.equal(env.fontCalls.length-fontStart,i===0||i===3?1:0);
   assert.equal(root.querySelectorAll('[data-layer]').length,i===0?3:0);
   if(i===1){p.seek(2350);assert.equal(canvas.dataset.cutout,'-1');}
   const owned=env.buffers.slice(start);assert.equal(owned.filter(c=>c.width===1672&&c.height===654).length,[7,7,7,0,7][i]);
   assert.equal(owned.filter(c=>c!==canvas&&c.width===1672&&c.height===941).length,i===0||i===3?2:1);
   const duration=env.w.MotionKit.resolveVariant(e).duration_ms;
   for(const t of [0,duration*.2,duration*.6,duration,duration*.4]){p.seek(t);const first=env.trace(canvas);p.seek(duration-t);p.seek(t);assert.equal(env.trace(canvas),first,e.id);}
   if(i===0){
    for(const [id,t] of [['geometry',1300],['burst',2100],['brand',3700]]){
     p.seek(t);const before=env.trace(canvas),marker=root.querySelector(`[data-layer="${id}"]`);marker.setAttribute('data-composition-hidden','');await Promise.resolve();assert.notEqual(env.trace(canvas),before);marker.removeAttribute('data-composition-hidden');await Promise.resolve();assert.equal(env.trace(canvas),before);
    }
   }
   p.destroy();assert.ok(owned.every(c=>c.width===1&&c.height===1));assert.equal(root.childElementCount,0);
  }
 }finally{env.close();}
});

test('海报闪切与参考节拍一致，独立动作与组合共用同一画面',async()=>{
 const env=await setup();try{
  const {burstStart,burstEnd,sample}=env.w.WiseGeometricPoster;
  const full=player(env),flash=player(env,definitions[2]),build=player(env,definitions[1]),reference=player(env,by('glitch-band-transition'));
  await Promise.all([full.p.ready,flash.p.ready,build.p.ready,reference.p.ready]);
  for(const offset of [0,.02,.03,.05,.1,.15,.2,.25,.3,.35,.4,.43,.45]){
   const pose=sample(burstStart+offset).scene.bandCut;
   full.p.seek((burstStart+offset)*1000);flash.p.seek((.15+offset)*1000);
   assert.equal(env.trace(flash.canvas),env.trace(full.canvas),'独立闪切与组合对应时刻一致');
   reference.p.seek(500+offset*1000);
   const active=reference.root.querySelector('[data-layer="glitch"]').getAttribute('opacity')==='1';
   assert.equal(pose?.active??false,active);
   if(active){
    const d=reference.root.querySelector('[data-mask]').getAttribute('d');
    const bands=[...d.matchAll(/M0 ([\d.]+)/g)].map(m=>Number(m[1])/60);
    assert.deepEqual(Array.from(pose.reveal).flatMap((yes,j)=>yes?[j]:[]),bands);
    const fragments=[...reference.root.querySelectorAll('[data-fragment]')];
    fragments.forEach((node,k)=>{for(const [key,factor] of [['x',1920],['y',1080],['width',1920],['height',1080]]) assert.ok(Math.abs(Number(node.getAttribute(key))-pose.fragments[k][key]*factor)<1e-8);});
   }
  }
  full.p.seek(2350);const restored=env.trace(full.canvas);flash.p.seek(1050);assert.equal(env.trace(flash.canvas),restored);
  for(const time of [0,.5,1.1,1.8,1.9,2,2.1,2.17,2.5]){
   full.p.seek((time>=1.9?time+.45:time)*1000);build.p.seek(time*1000);
   full.root.querySelector('[data-layer="brand"]').setAttribute('data-composition-hidden','');await Promise.resolve();
   assert.equal(env.trace(build.canvas),env.trace(full.canvas),'独立入场只省去闪切等待，速度与绘制相同');
  }
  full.p.seek(2100);full.root.querySelector('[data-layer="burst"]').setAttribute('data-composition-hidden','');await Promise.resolve();
  assert.equal(env.trace(full.canvas),restored,'关闭闪切显示完整满幅几何');
  full.p.seek(2700);assert.equal(new Set(geometryDraws(env,full.canvas)).size,7);
 }finally{env.close();}
});

test('字体准备期间保留定位与暂停，失败或销毁不留下绘制缓存',async()=>{
 const gate=deferred(),env=await setup({font:gate.promise});try{
  const {p,canvas}=player(env);p.play();p.seek(2100);p.pause();p.setSpeed(1.5);assert.equal(p.preparing,true);
  gate.resolve([{}]);assert.equal(await p.ready,true);assert.equal(p.currentTime,2100);assert.equal(p.paused,true);assert.equal(p.speed,1.5);assert.equal(canvas.dataset.bandFrame,'479');p.destroy();
 }finally{env.close();}
 const gate2=deferred(),dead=await setup({font:gate2.promise});try{
  const {p,root}=player(dead);await Promise.resolve();p.destroy();assert.equal(await p.ready,false);gate2.resolve([{}]);await Promise.resolve();await Promise.resolve();assert.equal(root.childElementCount,0);assert.ok(dead.buffers.every(c=>c.width===1));
 }finally{dead.close();}
 const fail=await setup({font:Promise.resolve([])});try{const {p,root}=player(fail);assert.equal(await p.ready,false);assert.match(root.textContent,/字体加载失败/);p.destroy();assert.ok(fail.buffers.every(c=>c.width===1));}finally{fail.close();}
 const still=await setup();try{
  const root=still.w.document.createElement('div'),render=still.w.MotionKit.createRenderer(root,{...composition,poster_only:true});await render.ready;render(composition.preview_ms);const canvas=root.querySelector('canvas'),before=still.trace(canvas);render.destroy(true);render(0);
  assert.equal(canvas.width,640);assert.equal(still.trace(canvas),before);assert.ok(still.buffers.filter(c=>c!==canvas).every(c=>c.width===1));
 }finally{still.close();}
});

test('已有动作默认示例保持原样，新增示例与组合均可离线复制',async()=>{
 const env=await setup();try{
  for(const id of ['rapid-cut','glitch-band-transition','mask-stagger-text']){const {p,root}=player(env,by(id));assert.equal(root.querySelector('canvas'),null);assert.ok(root.querySelector('svg'));p.seek(by(id).preview_ms);p.destroy();}
  for(const e of definitions){
   const code=env.w.MotionExport.code(e);assert.match(code,/catalog\/effects\/geometric-poster\.js/);assert.doesNotMatch(code,/\/Users\/|state\/wise-motion|src="(?:poster|motion)\.js"/);
   for(const [,resource]of code.matchAll(/(?:src|href)="([^"]+)"/g))assert.ok((await stat(new URL('../'+resource,import.meta.url))).isFile());
   const prompt=env.w.MotionExport.prompt(e,{},registry);assert.doesNotMatch(prompt,/近黑底|本机|验收/);assert.match(prompt,/暖纸/);
   const exported=await setup({html:code,exported:true});try{assert.equal(await exported.w.MotionDemo.ready,true);exported.w.MotionDemo.pause();exported.w.MotionDemo.seek(300);assert.equal(exported.w.document.querySelector('canvas').dataset.sourceTime,'0.3');exported.w.dispatchEvent(new exported.w.Event('pagehide'));assert.equal(exported.w.MotionRuntime.instanceCount,0);}finally{exported.close();}
  }
 }finally{env.close();}
});

test('目录书签进入组合并关联正确的动作示例',async()=>{
 const env=await catalogue(true,{hash:'#geometric-poster-sequence'});try{
  assert.equal(env.w.document.querySelector('.effect-item[aria-current="true"]').dataset.effect,composition.id);
  assert.ok(env.w.document.querySelector('#preview canvas'));
  assert.equal(composition.action_variants['glitch-band-transition'],'poster-cut');assert.equal(composition.action_variants['mask-stagger-text'],'poster-words');
  for(const [id,variant,part] of [['glitch-band-transition','poster-cut','intermittent'],['mask-stagger-text','poster-words','brand']]){
   env.w.document.querySelector(`[data-related="${id}"]`).click();
   assert.equal(env.w.document.getElementById('related-dialog').open,true);
   assert.equal(env.w.document.getElementById('related-variant').value,variant);
   assert.equal(env.w.document.querySelector('#related-preview canvas').dataset.part,part);
   assert.equal(env.w.document.querySelector('#preview canvas').dataset.part,'composition');
   env.w.document.getElementById('related-close').click();
   assert.equal(env.w.document.getElementById('related-dialog').open,false);
   assert.equal(env.w.document.querySelector('#related-preview canvas'),null);
  }
 }finally{env.close();}
});

test('旧示例缩略图同步绘制，海报示例等待准备后留下一张静态图',async()=>{
 const env=await setup();try{
  env.w.eval(await read('catalog/thumbnails.js'));
  for(const e of definitions.slice(2)){
   const start=env.buffers.length;
   const host=env.w.document.createElement('div');env.w.document.body.append(host);
   env.w.MotionThumbs.attach(host,by(e.id));await env.w.MotionThumbs.whenIdle();assert.ok(host.querySelector('.pattern-svg'));
   env.w.MotionThumbs.release(host);
   env.w.MotionThumbs.attach(host,env.w.MotionKit.resolveVariant(e));
   await env.w.MotionThumbs.whenIdle();
   const canvas=host.querySelector('canvas');assert.ok(canvas);assert.equal(canvas.width,640);
   assert.ok(env.contexts.get(canvas)?.trace.some(c=>c[0]==='drawImage'));
   assert.equal(env.w.MotionRuntime.instanceCount,0);
   assert.ok(env.buffers.slice(start).filter(c=>c!==canvas).every(c=>c.width===1));
   env.w.MotionThumbs.release(host);host.remove();
  }
 }finally{env.close();}
});
