// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import {losslessWebpDimensions} from './image-assets.mjs';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const registry=JSON.parse(await read('catalog/registry.json'));
const entries=registry.effects.filter(e=>e.source.path==='catalog/effects/collage-film.js');
const composition=entries.find(e=>e.kind==='composition');
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
async function setup({gate=Promise.resolve(),fail=false,html='<div id="root"></div><script src="effects/collage-film.js"></script>',url='file:///relocated/wise-motion/catalog/index.html',exported=false}={}){
 const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.ResizeObserver=class{observe(){}disconnect(){}};w.CSS.supports=()=>false;
 const contexts=new WeakMap(),buffers=[],images=[];let serial=0;
 // 记录真实绘制指令与状态，用于验证回拖、部件隔离和取消；不假装进行像素视觉验收。
 w.HTMLCanvasElement.prototype.getContext=function(){
  if(contexts.has(this))return contexts.get(this);
  this.recordID=++serial;buffers.push(this);const trace=[],stack=[],state={font:'10px sans-serif',globalAlpha:1};
  const proxy=new Proxy({canvas:this,trace,
   save(){stack.push({...state});trace.push(['save']);},restore(){Object.assign(state,stack.pop());trace.push(['restore']);},
   clearRect(...args){trace.length=0;trace.push(['clearRect',...args]);},
   measureText(value){return {width:String(value).length*(parseFloat(state.font.match(/([\d.]+)px/)?.[1])||10)*.55};},
   drawImage(image,...args){trace.push(['drawImage',image.src||'canvas-'+image.recordID,...args]);}
  },{get:(o,k)=>k in o?o[k]:k in state?state[k]:(...args)=>trace.push([k,...args]),set:(o,k,v)=>{state[k]=v;trace.push([k,v]);return true;}});
  contexts.set(this,proxy);return proxy;
 };
 w.Image=class{
  constructor(){this.width=this.height=1254;images.push(this);}
  set src(value){this._src=value;gate.then(()=>{if(!this._src)return;if(fail)this.onerror?.();else this.onload?.();},()=>this.onerror?.());}
  get src(){return this._src;}
  removeAttribute(){this._src='';}
 };
 Object.defineProperty(w.document,'fonts',{value:{load:()=>Promise.resolve()}});
 const files=['vendor/animejs/anime.umd.min.js','catalog/runtime.js','catalog/effects/collage-film.js','catalog/matching.js','catalog/export.js'];
 if(exported){for(const script of w.document.scripts)w.eval(script.src?await read(script.getAttribute('src')):script.textContent);}
 else for(const file of files)w.eval(await read(file));
 return {w,images,buffers,trace:node=>JSON.stringify(contexts.get(node).trace),close(){w.MotionRuntime.disposeAll();w.anime.engine.pause();w.close();}};
}
function player(env,entry=composition){const root=env.w.document.createElement('div');env.w.document.body.append(root);const p=env.w.MotionRuntime.create(root,entry,{autoplay:false});return {root,p,canvas:root.querySelector('canvas')};}

test('剪贴素材保留原始像素、准确来源与离线可迁移路径',async()=>{
 const source=JSON.parse(await read('catalog/assets/collage-film/SOURCE.json'));
 assert.equal(source.tool,'Codex 内置 image_gen.imagegen');assert.equal(source.assets.length,5);
 for(const asset of source.assets){const bytes=await readFile(new URL('../catalog/assets/collage-film/'+asset.file,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);assert.deepEqual(losslessWebpDimensions(bytes),asset.dimensions);assert.ok(asset.prompt.length>100);}
 const env=await setup();try{
  const {p}=player(env);assert.equal(await p.ready,true);assert.deepEqual(env.images.map(im=>im.src),['hand.webp','flywheel.webp','runner-poses.webp','runner-run-cycle.webp','runner-rebound.webp'].map(name=>'file:///relocated/wise-motion/catalog/assets/collage-film/'+name));
  const prompt=env.w.MotionExport.prompt(composition,{},registry);assert.match(prompt,/14\.00 秒/);assert.match(prompt,/12格/);assert.match(prompt,/3\.45/);assert.doesNotMatch(prompt,/\/Users\/|验收|file:|PaperImpact/);
  const code=env.w.MotionExport.code(composition);for(const [,resource]of code.matchAll(/(?:src|href)="([^"]+)"/g))assert.ok((await stat(new URL('../'+resource,import.meta.url))).isFile());
  const demo=await setup({html:code,url:'file:///relocated/wise-motion/demo.html',exported:true});try{assert.equal(await demo.w.MotionDemo.ready,true);demo.w.MotionDemo.pause();assert.equal(demo.images[0].src,env.images[0].src);demo.w.dispatchEvent(new demo.w.Event('pagehide'));assert.equal(demo.w.MotionRuntime.instanceCount,0);}finally{demo.close();}
 }finally{env.close();}
});

test('完整组合与六个部件任意回拖确定、保留12帧节奏与两秒定格',async()=>{
 const env=await setup();try{
  assert.equal(entries.length,7);
  for(const e of entries){
   const {p,root,canvas}=player(env,e);assert.equal(await p.ready,true);
   assert.equal(root.querySelectorAll('canvas').length,1);
   assert.equal(root.querySelectorAll('[data-layer]').length,e.kind==='composition'?7:0);
   for(const time of [0,e.duration_ms*.37,e.duration_ms*.73,e.duration_ms,e.preview_ms]){
    p.seek(time);const before=env.trace(canvas);p.seek(e.duration_ms-time);p.seek(time);assert.equal(env.trace(canvas),before,e.name+' 同一时刻的绘制必须相同');
   }
   if(e.kind==='composition'){
    p.seek(5860);const before=env.trace(canvas);p.seek(5900);assert.equal(env.trace(canvas),before);p.seek(5940);assert.notEqual(env.trace(canvas),before);
    p.seek(12000);const end=env.trace(canvas);p.seek(14000);assert.equal(env.trace(canvas),end);
    const other=player(env,entries[0]);await other.p.ready;other.p.seek(500);assert.equal(env.trace(canvas),end);other.p.destroy();
   }
   p.destroy();assert.equal(canvas.width,1);assert.equal(root.childElementCount,0);
  }
  assert.equal(env.w.MotionRuntime.instanceCount,0);assert.equal(env.w.MotionRuntime.runningCount,0);assert.ok(env.buffers.every(c=>c.width===1&&c.height===1));
 }finally{env.close();}
});

test('拆解选择在当前时刻重绘真实部件；独立动作只加载自身所需素材',async()=>{
 const env=await setup();try{
  const {p,root,canvas}=player(env);await p.ready;p.seek(1800);const full=env.trace(canvas);
  root.querySelector('[data-layer="mechanics"]').setAttribute('data-composition-hidden','');await Promise.resolve();const hidden=env.trace(canvas);assert.notEqual(hidden,full);assert.ok(!hidden.includes('/flywheel.webp')&&!hidden.includes('/hand.webp'));
  root.querySelector('[data-layer="mechanics"]').removeAttribute('data-composition-hidden');await Promise.resolve();assert.equal(env.trace(canvas),full);
  const allowed=new Set(env.w.MotionFactories[composition.id].breakdown.flatMap(row=>Array.from(row.actions)));assert.deepEqual([...allowed].sort(),composition.actions.slice().sort());p.destroy();
  for(const e of entries.filter(e=>e.kind==='action')){const start=env.images.length,{p}=player(env,e);await p.ready;const loaded=env.images.slice(start).map(im=>im.src.split('/').pop());assert.deepEqual(loaded,(e.source.assets||[]).map(name=>name.split('/').pop()),e.name+'不加载整段素材');p.destroy();}
 }finally{env.close();}
});

test('素材准备期间保留暂停定位；失败与提前销毁均可释放等待和缓存',async()=>{
 const gate=deferred(),env=await setup({gate:gate.promise});try{
  const {p,canvas}=player(env);p.play();p.seek(6700);p.pause();p.setSpeed(1.5);assert.equal(p.preparing,true);gate.resolve();assert.equal(await p.ready,true);assert.equal(p.currentTime,6700);assert.equal(p.paused,true);assert.equal(p.speed,1.5);assert.equal(canvas.dataset.frame,'80');p.destroy();
 }finally{env.close();}
 for(const fail of [false,true]){
  const gate=deferred(),env=await setup({gate:gate.promise,fail});try{
   const {p,root}=player(env);await Promise.resolve();await Promise.resolve();
   if(!fail){p.destroy();assert.equal(await p.ready,false);gate.resolve();await Promise.resolve();assert.equal(root.childElementCount,0);assert.ok(env.buffers.every(c=>c.width===1));}
   else{gate.resolve();assert.equal(await p.ready,false);assert.match(root.textContent,/剪贴素材加载失败/);p.destroy();}
   assert.equal(env.w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
 }
 const env2=await setup();try{const {w}=env2,root=w.document.createElement('div'),draw=w.MotionFactories[composition.id](root,w.MotionKit,{...composition,poster_only:true});await draw.ready;draw(12000);const canvas=root.querySelector('canvas'),before=env2.trace(canvas);draw.destroy(true);draw(0);assert.equal(canvas.width,640);assert.equal(env2.trace(canvas),before);assert.ok(env2.buffers.filter(c=>c!==canvas).every(c=>c.width===1));}finally{env2.close();}
});


test('跑步实际使用八格，蓄力与弹离接续六格，图集取样不重复旧跑姿',async()=>{
 const env=await setup();try{
  const effect=entries.find(e=>e.id==='cutout-stride-leap'),{p,canvas}=player(env,effect);await p.ready;
  const samples=file=>JSON.parse(env.trace(canvas)).filter(call=>call[0]==='drawImage'&&call[1].endsWith(file));
  const poses=new Set();for(let ms=120;ms<1160;ms+=55){p.seek(ms);for(const row of samples('runner-run-cycle.webp'))poses.add(row.slice(2,6).join(','));}assert.equal(poses.size,8);
  const rebound=new Set();for(const ms of [2750,2950,3190,3380,3550,3790]){p.seek(ms);const rows=samples('runner-rebound.webp');assert.equal(rows.length,1);rebound.add(rows[0].slice(2,6).join(','));}assert.equal(rebound.size,6);
  p.seek(4590);assert.equal(samples('runner-rebound.webp').length,0,'人物要真正离开画面');p.destroy();
 }finally{env.close();}
});
