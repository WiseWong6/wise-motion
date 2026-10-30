// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {resolveEffect,effectDefinitions} from '../remotion/clock.mjs';
import {createFrameDocument} from '../remotion/frame-document.mjs';
import {projectFor} from '../scripts/export.mjs';
const root=new URL('../',import.meta.url),require=createRequire(import.meta.url);
const compiled=await build({absWorkingDir:fileURLToPath(root),entryPoints:['catalog/remotion/deepseek-review/Scene.jsx'],bundle:true,write:false,format:'cjs',platform:'node',external:['react','remotion']});
const module={exports:{}};new Function('require','module','exports',compiled.outputFiles[0].text)(require,module,module.exports);
const {SPECS,ReviewScene,resolveMotion,sourceFrame}=module.exports;
const markup=(s,f)=>renderToStaticMarkup(React.createElement(ReviewScene,{spec:s,frame:f}));
const spec=id=>SPECS.find(s=>s.id===id);

test('仅保留性能开销独立数据动作，30帧边界可反向定位',()=>{
  assert.equal(SPECS.length,1);assert.equal(SPECS.filter(s=>s.kind==='composition').length,0);
  for(const s of SPECS){
   const d=resolveEffect(s.exportId||s.id,s.variantId);assert.equal(d.source.factory,s.id);
   assert.equal(resolveMotion(s.exportId||s.id,s.variantId),s);
   assert.equal(sourceFrame(s,-1),s.start);assert.equal(sourceFrame(s,100),s.start+s.frames-1);
   for(let i=0;i<s.frames;i++)assert.equal(sourceFrame(s,i/30),s.start+i);
   const frames=[s.start,s.start+Math.floor(s.frames/2),s.start+s.frames-1];
   const expected=frames.map(f=>markup(s,f));
   for(let i=2;i>=0;i--){assert.equal(markup(s,frames[i]),expected[i]);assert.doesNotMatch(expected[i],/NaN|Infinity|undefinedpx/);}
   assert.notEqual(expected[0],expected[1]);
   assert.equal(d.source.remotion.width,s.viewport[2]);assert.equal(d.source.remotion.height,s.viewport[3]);
  }
  assert.throws(()=>sourceFrame(SPECS[0],NaN),/有限/);
 });

test('性能开销只保留独立数据图，两个界面组合与拆解示例已下架',()=>{
  const s=spec('pareto-efficiency-sequence'),d=resolveEffect(s.id);
  assert.equal(d.kind,'action');assert.equal(d.category,'data');
  assert.deepEqual(d.actions,[]);assert.equal(d.audio,null);
  assert.deepEqual(s.viewport,[0,0,912,652]);
  assert.equal(effectDefinitions.some(e=>e.id==='benchmark-gain-sequence'),false);
  assert.equal(effectDefinitions.some(e=>e.id==='search-filter-delivery'),false);
  assert.equal(effectDefinitions.some(e=>e.id==='creative-cards-to-tracks'),false);
  assert.equal(effectDefinitions.find(e=>e.id==='bar-growth').variants,undefined);
  assert.equal(effectDefinitions.find(e=>e.id==='stroke-draw').variants.some(v=>v.id==='deepseek-pareto'),false);
  assert.equal(effectDefinitions.find(e=>e.id==='stagger-in').variants.some(v=>v.id==='deepseek-results'),false);
  assert.equal(effectDefinitions.find(e=>e.id==='curve-path').variants,undefined);
  assert.equal(effectDefinitions.find(e=>e.id==='layout-reorder').variants,undefined);
  const dom=new JSDOM(markup(s,196));
  try{
   const svg=dom.window.document.querySelector('svg');
   assert.equal(svg.getAttribute('viewBox'),'0 0 912 652');
   assert.deepEqual([...svg.querySelectorAll('text')].map(n=>n.textContent),['↑ 任务表现','每项任务的费用 / 时间 →','上一版','新版','同样任务，更少开销']);
   const oldMarker=svg.querySelector('circle'),newMarker=svg.querySelectorAll('circle')[1];
   assert.ok(Number(newMarker.getAttribute('cx'))<Number(oldMarker.getAttribute('cx')));
   assert.ok(Number(newMarker.getAttribute('cy'))<Number(oldMarker.getAttribute('cy')));
   assert.doesNotMatch(dom.window.document.body.textContent,/性能更高|任务开销更低|分数|耗时|输出|单价|基准成绩/);
  }finally{dom.window.close();}
 });

test('实际隔离页面加载新工厂，定位和重复播放不串用原有动作',async()=>{
  const cache=new Map();
  for(const s of SPECS){
   const definition=resolveEffect(s.exportId||s.id,s.variantId);
   const dom=new JSDOM(createFrameDocument({assetBaseUrl:root.href,definition}),{url:new URL('catalog/frame.html',root).href,runScripts:'outside-only',pretendToBeVisual:true});
   let session;
   try{
    for(const script of dom.window.document.scripts){if(script.src){const url=new URL(script.src);if(!cache.has(url.href))cache.set(url.href,await readFile(url,'utf8'));dom.window.eval(cache.get(url.href));}else dom.window.eval(script.textContent);}
    session=await dom.window.__wiseMotionCreateSession({definition:JSON.parse(JSON.stringify(definition)),theme:'dark'});
    for(const ms of [0,definition.preview_ms,definition.duration_ms,definition.preview_ms]){
     await session.draw(ms,ms,'exact');const node=session.stage.querySelector('[data-review-scene]');
     assert.equal(node.dataset.reviewScene,s.scene);assert.equal(Number(node.dataset.sourceFrame),sourceFrame(s,ms/1000));
     for(const svg of node.querySelectorAll('svg'))assert.ok(svg.style.width&&svg.style.height,'SVG尺寸不能受目录图标样式影响');
    }
   }finally{session?.destroy();dom.window.MotionRuntime?.disposeAll();dom.window.anime?.engine.pause();dom.window.close();}
  }
 });

test('导出包含实际绘制源码、本地原字体，不携带已下架场景与原声',async()=>{
  for(const s of SPECS){
   const project=await projectFor(s.exportId||s.id,{variantId:s.variantId});
   assert.ok(project.files['catalog/remotion/deepseek-review/S3Pareto.tsx']);
   assert.equal(project.files['catalog/remotion/deepseek-review/S5Search.tsx'],undefined);
   assert.equal(project.files['catalog/remotion/deepseek-review/S13Closing.tsx'],undefined);
   assert.equal(project.files['catalog/remotion/deepseek-review/timing.js'],undefined);
   assert.equal(Object.keys(project.files).some(name=>/deepseek-review\/(scores|pareto|search|closing)\.wav$/.test(name)),false);
   assert.ok(project.files['public/catalog/assets/deepseek-review/Oswald-Bold.ttf']);
   for(const [name,data] of Object.entries(project.files))if(typeof data==='string')assert.doesNotMatch(data,/\/Users\/|localhost:/,name+' 不能依赖原工程路径');
  }
  const {rank}=require('../catalog/matching.js');
  const effect=effectDefinitions.find(e=>e.id==='pareto-efficiency-sequence');
  assert.equal(rank({effects:effectDefinitions},effect.name)[0].effect.id,'pareto-efficiency-sequence');
 });
