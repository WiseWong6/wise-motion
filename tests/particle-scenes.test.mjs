// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {environment,data,frameMarkup} from './helpers.mjs';
const source='/Users/wisewong/Documents/Developer/scenes/motion-catalog/';
const links={'cat-beans':'particle-hopper','flow-seed-shed':'seed-shedding-illustration','notes-hop':'note-hop-illustration'};
const def=id=>data.effects.find(e=>e.id===id),plain=value=>JSON.parse(JSON.stringify(value));

test('十二颗豆粒的出生、落点、旋转和下料逐时刻对应原模型，透明素材未改',async()=>{
 const original={};vm.runInNewContext(await readFile(source+'packs/completed/source/cat/timeline.js','utf8'),original);
 const env=await environment();try{
  for(let t=0;t<1.6;t+=.007)assert.deepEqual(plain(env.w.MotionParticles.hopperBeans(t)),plain(original.FactoryTimeline.hopperBeans(t)));
  assert.equal(env.w.MotionParticles.hopperBeans(1.433).length,0);
  const records=JSON.parse(await readFile(new URL('../catalog/assets/WEBP-SOURCES.json',import.meta.url),'utf8'));
  const record=records.assets.find(a=>a.target==='catalog/assets/particle-scenes/coffee-bean.webp');
  const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash(await readFile(source+'packs/completed/assets/coffee-bean.png')),record.original_sha256);
  assert.equal(hash(await readFile(new URL('../'+record.target,import.meta.url))),record.sha256);
 }finally{env.close();}
});

test('蒲公英冠毛身份、脱落姿态与漂移逐时刻对应原作，回拖完整复现',async()=>{
 const o={window:{JourneyAir:class{},JourneyClouds:class{},JourneyWater:class{},JourneyEncounters:class{}}};
 vm.runInNewContext(await readFile(source+'source-projects/dandelion-scene/assets/js/dandelion.js','utf8'),o);
 const original=new o.window.DandelionJourney(),env=await environment();try{
  const {w}=env,api=w.MotionDandelion,j=api.journey(),root=w.document.getElementById('root');
  for(let t=5.6;t<=9.4;t+=.019){
   assert.deepEqual(plain(j.filamentState(t)),plain(original.filamentState(t)));
   assert.deepEqual(plain(j.subjectPose(t,api.course)),plain(original.subjectPose(t,api.course)));
   for(const seed of j.drifters)assert.deepEqual(plain(j.driftingPose(seed,t,api.course)),plain(original.driftingPose(seed,t,api.course)));
  }
  const draw=w.MotionFactories['seed-shedding-illustration'](root,w.MotionKit,def('seed-shedding-illustration'));
  draw(2500);const frame=frameMarkup(root);assert.ok(root.querySelectorAll('path').length>100);
  draw(4400);draw(0);draw(2500);assert.equal(frameMarkup(root),frame);
  const svg=root.firstElementChild;assert.equal(svg.style.backgroundColor,'rgb(82, 105, 87)');
  assert.equal(root.dataset.art,'original');
 }finally{env.close();}
});

test('音符插画替换谱面输入并保留完整绘制、运动与资源释放程序，许可随包提供',async()=>{
 const original=await readFile(source+'packs/completed/notes-source.js','utf8'),actual=await readFile(new URL('../catalog/assets/particle-scenes/notes-source.js',import.meta.url),'utf8');
 const stripScore=text=>text.replace(/\/\* wise-score:start \*\/[\s\S]*?\/\* wise-score:end \*\//,'SCORE_INPUT').replace(/var ce=[\s\S]*?;var Yd=`[\s\S]*?`;/,'SCORE_INPUT');
 assert.equal(stripScore(actual),stripScore(original.replace('Ym(t,600,800,e,s)','Ym(t,t.width,t.height,e,s)')));
 for(const name of ['motion.js','orb.js','trail.js','note-glow.js','isolated-scene.js']){
  const old=await readFile(source+'packs/completed/source/notes/src/'+name,'utf8');
  assert.equal(await readFile(new URL('../catalog/assets/particle-scenes/notes/src/'+name,import.meta.url),'utf8'),old.replace('辅助谱也是当前《晴天》的真实小节','辅助谱复用当前古老旋律的小节'));
 }
 assert.match(await readFile(new URL('../catalog/assets/particle-scenes/THREE-LICENSE.txt',import.meta.url),'utf8'),/Permission is hereby granted/);
});

test('公开谱面、实际落点与离线包使用同一古老旋律，不再携带原晴天曲谱',async()=>{
 const file=name=>readFile(new URL('../catalog/assets/particle-scenes/'+name,import.meta.url),'utf8');
 const d=JSON.parse(await file('notes/assets/score-data.json')),svg=await file('notes/assets/score-clean.svg'),bundle=await file('notes-source.js');
 const embedded=bundle.match(/\/\* wise-score:start \*\/var ce=([\s\S]*?);var Yd=([\s\S]*?);\/\* wise-score:end \*\//);
 assert.ok(embedded);assert.deepEqual(JSON.parse(embedded[1]),d);assert.equal(JSON.parse(embedded[2]),svg);
 assert.equal(d.melody_rights,'public-domain');assert.equal(d.events.length,44);
 assert.deepEqual(d.events.filter(e=>e.staff===1).slice(0,7).map(e=>e.pitch),[60,60,67,67,69,69,67]);
 const dom=new JSDOM(svg,{contentType:'image/svg+xml'});
 try{
  assert.equal(dom.window.document.querySelectorAll('g.measure').length,8);
  assert.equal(dom.window.document.querySelectorAll('g.note').length,d.events.length);
  for(const e of d.events){const node=dom.window.document.getElementById(e.id);assert.equal(Number(node.dataset.x),e.x);assert.equal(Number(node.dataset.z),e.z);assert.ok(d.noteheadGlyphs[e.glyph]);assert.ok(e.time>=d.entrance&&e.time+e.duration<=d.musicEnd);}
 }finally{dom.window.close();}
 assert.doesNotMatch(bundle,/晴天|Steven Law|E0A4-w1p0iuxj|qingtian|\\u6674\\u5929/);
});

function canvasStub(w){
 const calls=[],contexts=new Map();
 const make=()=>new Proxy({getExtension:()=>({loseContext(){calls.push(['lost']);}})}, {
  get(o,k){if(k in o)return o[k];return(...a)=>{calls.push([k,...a]);};},set(o,k,v){o[k]=v;return true;}
 });
 w.HTMLCanvasElement.prototype.getContext=function(){if(!contexts.has(this))contexts.set(this,make());return contexts.get(this);};
 w.Path2D=class{constructor(d){this.d=d;}};
 return calls;
}

test('原豆粒异步加载后按最后定位绘制，重播相同，离开后不复活',async()=>{
 const env=await environment();try{
  const {w}=env;canvasStub(w);const images=[];
  w.Image=class{constructor(){images.push(this);this.complete=true;this.naturalWidth=1240;}};
  const root=w.document.getElementById('root'),draw=w.MotionFactories['particle-hopper'](root,w.MotionKit,def('particle-hopper'));
  draw(900);images[0].onload();await draw.ready;const canvas=root.firstElementChild;
  assert.equal(canvas.dataset.sourceTime,'0.75');draw(0);draw(900);assert.equal(canvas.dataset.sourceTime,'0.75');
  draw(2100);assert.equal(canvas.dataset.sourceTime,'1.5');draw.destroy();assert.equal(canvas.width,1);
  const late=w.MotionFactories['particle-hopper'](root,w.MotionKit,def('particle-hopper'));late.destroy();images[1].onload();await late.ready;assert.equal(root.firstElementChild.width,1);
 }finally{env.close();}
});

test('谱面加载迟到时释放，已载入插画可定位和释放，静态缩略图留存后关闭三维资源',async()=>{
 const env=await environment();try{
  const {w}=env;const calls=canvasStub(w),root=w.document.getElementById('root');let resolve,disposed=0;const times=[];
  w.CompletedFactories={notes:()=>new Promise(r=>{resolve=r;})};
  const late=w.MotionFactories['note-hop-illustration'](root,w.MotionKit,def('note-hop-illustration'));await Promise.resolve();late.destroy();resolve({render(){assert.fail('已销毁实例不得绘制');},dispose(){disposed++;}});await late.ready;assert.equal(disposed,1);
  w.CompletedFactories.notes=async(mode,canvas)=>{assert.equal(mode,'hop');assert.equal(canvas.width/canvas.height,16/9);return {render:t=>times.push(t),dispose(){disposed++;}};};
  const draw=w.MotionFactories['note-hop-illustration'](root,w.MotionKit,def('note-hop-illustration'));draw(3150);await draw.ready;assert.equal(times.at(-1),3);
  draw(0);draw(3150);assert.equal(times.at(-1),3);draw(8600);assert.equal(times.at(-1),8);
  const canvas=root.firstElementChild;draw.destroy(true);assert.notEqual(root.firstElementChild,canvas);assert.equal(disposed,2);assert.ok(calls.some(c=>c[0]==='drawImage'));
 }finally{env.close();}
});

test('三项迁入后分类、旧书签和导出一致，剔除项无历史入口',async()=>{
 for(const [old,id]of Object.entries(links)){
  const env=await environment(true,{hash:'#history-'+old,lazyHistory:true});try{
   const {w}=env,e=def(id),d=w.document;
   assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,id);
   assert.equal(d.querySelector('[data-kind="'+e.kind+'"]').getAttribute('aria-pressed'),'true');
   assert.equal(w.MotionMatch.rank(data,e.name)[0].effect.id,id);
   const html=w.MotionExport.code(e);assert.doesNotMatch(html,/\/Users\/|history-data\.js/);
   const dom=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true});
   try{
    const out=dom.window;out.ResizeObserver=class{observe(){}disconnect(){}};out.HTMLCanvasElement.prototype.getContext=()=>null;
    for(const script of out.document.querySelectorAll('script'))out.eval(script.src?await readFile(new URL('../'+script.getAttribute('src'),import.meta.url),'utf8'):script.textContent);
    out.MotionDemo.pause();out.MotionDemo.seek(e.preview_ms);const frame=frameMarkup(out.document.querySelector('.motion-stage'));out.MotionDemo.seek(0);out.MotionDemo.seek(e.preview_ms);assert.equal(frameMarkup(out.document.querySelector('.motion-stage')),frame);
    if(id!=='seed-shedding-illustration')assert.equal(out.MotionParticles.assetURL('coffee-bean.webp'),'file:///wise-motion/catalog/assets/particle-scenes/coffee-bean.webp');
   }finally{dom.window.MotionRuntime?.disposeAll();dom.window.anime?.engine.pause();dom.window.close();}
  }finally{env.close();}
 }
 const c={};vm.runInNewContext(await readFile(new URL('../catalog/history-data.js',import.meta.url),'utf8'),c);
 for(const id of ['flow-stem-leaf','letter-wings','notes-wings','osmanthus-moving-front',...Object.keys(links)])assert.ok(!c.MotionHistory.recipes.some(r=>r.history_id===id));
});
