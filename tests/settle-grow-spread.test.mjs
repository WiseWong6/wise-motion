// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {data,environment} from './helpers.mjs';
import {state,root as projectRoot} from '../scripts/history.mjs';
const id='settle-grow-spread',effect=data.effects.find(e=>e.id===id);
const cross=JSON.parse(fs.readFileSync(state+'/crosswalk.json'));
const sourcePath=cross.rules['begin-end'].migration.files.find(f=>f.file.endsWith('/dandelion.js')).file;
const coursePath=cross.rules['begin-end'].migration.files.find(f=>f.file.endsWith('/isolated-source.js')).file;
const originalSource=fs.readFileSync(sourcePath,'utf8'),isolated=fs.readFileSync(coursePath,'utf8');
const sandbox={window:{JourneyAir:class{},JourneyClouds:class{},JourneyWater:class{},JourneyEncounters:class{},WiseExtracted:{}}};vm.createContext(sandbox);vm.runInContext(originalSource,sandbox);
const at=isolated.indexOf('window.WiseExtracted.course=');vm.runInContext(isolated.slice(at,isolated.indexOf('window.WiseExtracted.skyline=',at)),sandbox);
const original=new sandbox.window.DandelionJourney(),course=sandbox.window.WiseExtracted.course;
const plain=value=>JSON.parse(JSON.stringify(value));
function drawingContext(){
 const trace=[],stack=[];let state={globalAlpha:1};
 const target={trace,save(){stack.push({...state});trace.push(['save']);},restore(){assert.ok(stack.length);state=stack.pop();trace.push(['restore']);}};
 return new Proxy(target,{get(target,key){if(key in target)return target[key];if(key in state)return state[key];return (...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),String(key)+' 非有限数值');trace.push([key,...args]);};},set(target,key,value){if(key==='globalAlpha')assert.ok(Number.isFinite(value)&&value>=0&&value<=1,'透明度无效');state[key]=value;trace.push(['set',key,value]);return true;}});
}

test('两项历史生长合为一个正式动作，旧名称可搜索且复制输出包含实际复刻参数',async()=>{
 const env=await environment(true,{staticPreview:true});
 try{
  const {w}=env;assert.equal(effect.kind,'action');assert.equal(effect.category,'shape');
  for(const old of ['begin-end','flow-colony-spread']){
   assert.equal(cross.rules[old].status,'excluded');assert.equal(cross.rules[old].migration.effect,id);
   assert.equal(data.redirects['history-'+old],id);assert.ok(!w.MotionHistory.recipes.some(r=>r.history_id===old));
  }
  for(const query of ['生长扩散','落定生长'])assert.ok(effect.aliases.includes(query));
  w.document.querySelector('[data-effect="'+id+'"]').click();assert.ok(w.document.querySelector('#preview .pattern-canvas'));
  const prompt=w.MotionExport.prompt(effect,{},data),code=w.MotionExport.code(effect);
  for(const term of ['93','620','125','495','0.85','490','0.42','640×360','右下角','512,300','0.48','6900','33000','#4b9f27'])assert.ok(prompt.includes(term));
  assert.doesNotMatch(prompt,/原片范围|关键假设|本机原作|尚未.*验收/);
  assert.match(code,/catalog\/effects\/settle-grow-spread\.js/);assert.doesNotMatch(code,/\/Users\/|isolated-source|JourneyAir/);
 }finally{env.close();}
});

test('全部种子位置、植物分布、落地姿态和绘制函数与原工程一致',async()=>{
 const env=await environment();
 try{
  const m=env.w.MotionFactories[id].model();assert.equal(m.sowing.length,93);assert.equal(m.colony.length,620);
  assert.deepEqual(plain(m.colony),plain(original.colony));assert.deepEqual(plain(m.patches),plain(original.patches));
  assert.equal(m.localGrowthComplete,original.localGrowthComplete);
  for(let i=0;i<93;i++){
   const {origin,...seed}=m.sowing[i];assert.deepEqual(plain(seed),plain(original.sowing[i]));
   assert.deepEqual(plain(origin),plain(original.releasePose(original.sowing[i],course)));
   for(const t of [27.65,28,28.5,29,29.7,31,34.8])assert.deepEqual(plain(m.sowingPose(m.sowing[i],t)),plain(original.sowingPose(original.sowing[i],t,course)));
  }
  for(const t of [27.65,28.4,29.4,30.6,31.8,m.MATURE_AT]){
   const actual=drawingContext(),expected=drawingContext();m.ending(actual,t);original.ending(expected,t,course);
   assert.deepEqual(actual.trace,expected.trace,'原茎叶、花瓣或种子的绘制改变：'+t);
  }
 }finally{env.close();}
});

test('局部植物先长齐再向外传播，结束时全部茎叶和花瓣成熟且种子退出',async()=>{
 const env=await environment();
 try{
  const m=env.w.MotionFactories[id].model(),local=m.colony.filter(p=>p.local),outer=m.colony.filter(p=>!p.local);
  assert.equal(local.length,125);assert.equal(outer.length,495);
  for(const p of outer){
   assert.ok(p.born>m.localGrowthComplete+.16);
   const reach=Math.max(0,Math.hypot(p.x-720,p.y-1000)-175),patch=original.nearestPatch(p.x,p.y).patch;
   const jitter=p.born-(m.localGrowthComplete+.16+reach/490+patch.delay*.23);assert.ok(jitter>.02-1e-9&&jitter<.22+1e-9);
  }
  assert.ok(effect.duration_ms/1000>=m.MATURE_AT-m.START+.249);
  for(const p of m.colony){assert.equal(m.smooth(p.born,p.born+p.duration,m.MATURE_AT),1);if(p.bloom)assert.equal(m.smooth(p.flowerAt,p.flowerAt+p.flowerDuration,m.MATURE_AT),1);}
  assert.ok(m.sowing.every(s=>m.sowingPose(s,m.MATURE_AT).alpha===0));
 }finally{env.close();}
});

test('复制代码所需文件均在包内，独立页面可定位、保持末帧和释放画布',async()=>{
 const env=await environment();let dom;
 try{
  env.w.eval(fs.readFileSync(projectRoot+'catalog/export.js','utf8'));
  const code=env.w.MotionExport.code(effect);dom=new JSDOM(code,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window,contexts=new Map();
  w.HTMLCanvasElement.prototype.getContext=function(){if(!contexts.has(this))contexts.set(this,drawingContext());return contexts.get(this);};
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}disconnect(){}};
  w.CSS.supports=()=>false;
  for(const script of w.document.querySelectorAll('script'))w.eval(script.src?fs.readFileSync(projectRoot+script.getAttribute('src'),'utf8'):script.textContent);
  const player=w.MotionDemo;player.pause();const canvas=w.document.querySelector('#motion canvas'),ctx=contexts.get(canvas);
  assert.equal(canvas.dataset.renderState,'ready');player.seek(effect.duration_ms);assert.equal(canvas.dataset.plants,'620');assert.equal(canvas.dataset.seeds,'0');
  ctx.trace.length=0;player.seek(effect.preview_ms);const first=JSON.stringify(ctx.trace);
  player.seek(0);ctx.trace.length=0;player.seek(effect.preview_ms);assert.equal(JSON.stringify(ctx.trace),first);
  const standalone=w.document.createElement('div'),render=w.MotionKit.createRenderer(standalone,effect);render(effect.duration_ms);const final=contexts.get(standalone.querySelector('canvas'));const firstFinal=JSON.stringify(final.trace);final.trace.length=0;render(effect.duration_ms+1000);assert.equal(JSON.stringify(final.trace),firstFinal);
  player.destroy();render.destroy(false);assert.equal(canvas.width,0);w.anime.engine.pause();
 }finally{dom?.window.close();env.close();}
});


test('原草场和缓存纸纹完整恢复，右下角先长出花草再铺满横版，花草形状保持等比',async()=>{
 const env=await environment(),contexts=new Map();let render;
 try{
  const {w}=env,root=w.document.getElementById('root');
  w.HTMLCanvasElement.prototype.getContext=function(){if(!contexts.has(this))contexts.set(this,drawingContext());return contexts.get(this);};
  render=w.MotionKit.createRenderer(root,effect);
  const canvas=root.querySelector('canvas'),ctx=contexts.get(canvas),paper=[...contexts.keys()].find(c=>c!==canvas),m=w.MotionFactories[id].model();
  const bgSandbox={window:{},document:w.document};
  vm.runInNewContext(fs.readFileSync(sourcePath.replace(/dandelion\.js$/,'journey-grass.js'),'utf8'),bgSandbox);
  const nativeGrass=new bgSandbox.window.JourneyGrass({width:1600,height:900});
  const fingerprint=trace=>createHash('sha256').update(JSON.stringify(trace.map(row=>row.map(v=>v&&typeof v==='object'&&v.tagName==='CANVAS'?['canvas',v.width,v.height]:v)))).digest('hex');
  assert.equal(fingerprint(contexts.get(paper).trace),fingerprint(contexts.get(nativeGrass.paper).trace),'纸纹点和纤维保持原绘制');
  const paperPicture=fingerprint(contexts.get(paper).trace);
  for(const ms of [0,2100,effect.duration_ms]){
   ctx.trace.length=0;render(ms);
   const t=Math.min(m.MATURE_AT,m.START+ms/1000),expected=drawingContext();
   const ground={time:16+(t-23.5)*.7,distance:original.distance(t),gustAt:x=>original.gustAt(t,x*900/1600),growthCoverAt:(x,y)=>original.growthCover(t,x*900/1600,y*1200/900)};
   nativeGrass.background(expected,ground);nativeGrass.grass(expected,ground);
   const end=ctx.trace.findIndex(row=>row[0]==='restore');
   assert.deepEqual(ctx.trace.slice(0,4),[['setTransform',2,0,0,2,0,0],['clearRect',0,0,640,360],['save'],['scale',.4,.4]]);
   assert.equal(fingerprint(ctx.trace.slice(4,end)),fingerprint(expected.trace),'草场色带、细草姿态和生长覆盖对应原代码：'+ms);
   assert.equal(fingerprint(contexts.get(paper).trace),paperPicture,'逐帧绘制不重建纸纹');
  }
  const placements=ctx.trace.filter(row=>row[0]==='translate'&&row[1]>0&&row[2]>0);
  assert.deepEqual(placements,plain(m.colony).map(p=>['translate',p.x*640/900,p.y*360/1200]));
  assert.equal(ctx.trace.filter(row=>row[0]==='scale'&&row[1]===.48&&row[2]===.48).length,620,'每株绕自身落点等比绘制');
  assert.deepEqual([m.patches[0].x*640/900,m.patches[0].y*360/1200],[512,300]);
  const points=m.colony.map(p=>({x:p.x*640/900,y:p.y*360/1200}));
  assert.ok(Math.min(...points.map(p=>p.x))<20&&Math.max(...points.map(p=>p.x))>620);
  assert.ok(Math.min(...points.map(p=>p.y))<30&&Math.max(...points.map(p=>p.y))>340);
  for(let row=0;row<3;row++)for(let col=0;col<4;col++)assert.ok(points.some(p=>Math.floor(p.x/160)===col&&Math.floor(p.y/120)===row),'成熟花草覆盖整张横版画布');
  render.destroy(false);assert.equal(canvas.width,0);assert.equal(paper.width,0);render=null;
 }finally{render?.destroy(false);env.close();}
});
