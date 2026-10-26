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

test('四个完整组合与六个复用示例保留30帧边界，可反向定位',()=>{
 assert.equal(SPECS.filter(s=>s.kind==='composition').length,4);assert.equal(SPECS.length,10);
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

test('搜索先剔除中间项再递送，三张创作卡保持节点身份变轨道',()=>{
 const dom=new JSDOM('<main></main>'),host=dom.window.document.querySelector('main');
 try{
  host.innerHTML=markup(spec('search-filter-delivery'),160);
  const bad=[...host.querySelectorAll('div')].find(n=>n.textContent==='要求模型只引用本站');
  assert.ok(bad);const rejected=bad.parentElement;
  assert.ok(Number(rejected.style.opacity)>0);
  host.innerHTML=markup(spec('search-filter-delivery'),220);
  const badEnd=[...host.querySelectorAll('div')].find(n=>n.textContent==='要求模型只引用本站').parentElement;
  assert.equal(badEnd.style.opacity,'0');assert.match(badEnd.style.translate,/1080px/);
  const third=[...host.querySelectorAll('div')].find(n=>n.textContent==='公开模型卡'&&n.nextElementSibling?.textContent.includes('huggingface'));
  assert.equal(third.parentElement.style.top,'168px');
  host.innerHTML=markup(spec('creative-cards-to-tracks'),95);
  const cards=()=>['剧本','镜头','声音'].map(t=>[...host.querySelectorAll('svg text')].find(n=>n.textContent===t).parentElement);
  assert.deepEqual(cards().map(g=>g.querySelector('rect').getAttribute('width')),['268','268','268']);
  host.innerHTML=markup(spec('creative-cards-to-tracks'),122);
  assert.deepEqual(cards().map(g=>g.getAttribute('transform')),['translate(184 806)','translate(184 894)','translate(184 982)']);
  assert.deepEqual(cards().map(g=>[g.querySelector('rect').getAttribute('width'),g.querySelector('rect').getAttribute('height')]),Array(3).fill(['712','68']));
 }finally{dom.window.close();}
});

test('十一柱数值与比例一致，两个图表保留原始绘制曲线',()=>{
 const dom=new JSDOM(markup(spec('benchmark-gain-sequence'),136));
 try{
  const svg=dom.window.document.querySelector('svg');const bars=[...svg.querySelectorAll('g')].filter(g=>g.querySelector('rect'));
  assert.equal(bars.length,11);
  assert.equal(bars[0].querySelector('rect').getAttribute('height'),'256');
  assert.equal(bars[0].querySelector('text').textContent,'+11.1');
  assert.equal(bars[10].querySelector('text').textContent,'+2.0');
  assert.match(markup(spec('pareto-efficiency-sequence'),196),/同样任务，更少开销/);
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
   let sameNodes;
   for(const ms of [0,definition.preview_ms,definition.duration_ms,definition.preview_ms]){
    await session.draw(ms,ms,'exact');const node=session.stage.querySelector('[data-review-scene]');
    assert.equal(node.dataset.reviewScene,s.scene);assert.equal(Number(node.dataset.sourceFrame),sourceFrame(s,ms/1000));
    for(const svg of node.querySelectorAll('svg'))assert.ok(svg.style.width&&svg.style.height,'SVG尺寸不能受目录图标样式影响');
    if(s.scene==='closing'){
     const cards=[...node.querySelectorAll('svg text')].filter(n=>['剧本','镜头','声音'].includes(n.textContent)).map(n=>n.parentElement);
     if(sameNodes)assert.ok(cards.every((n,i)=>n===sameNodes[i]),'卡片必须复用同一节点');sameNodes=cards;
    }
   }
  }finally{session?.destroy();dom.window.MotionRuntime?.disposeAll();dom.window.anime?.engine.pause();dom.window.close();}
 }
});

test('导出包含实际绘制源码、本地原字体，只有完整组合携带原声',async()=>{
 for(const s of SPECS){
  const project=await projectFor(s.exportId||s.id,{variantId:s.variantId});
  assert.ok(project.files['catalog/remotion/deepseek-review/S5Search.tsx']);
  assert.ok(project.files['catalog/remotion/deepseek-review/S13Closing.tsx']);
  assert.ok(project.files['public/catalog/assets/deepseek-review/Oswald-Bold.ttf']);
  assert.equal(!!project.files['public/catalog/assets/deepseek-review/search.wav'],s.kind==='composition');
  for(const [name,data] of Object.entries(project.files))if(typeof data==='string')assert.doesNotMatch(data,/\/Users\/|localhost:/,name+' 不能依赖原工程路径');
 }
 const {rank}=require('../catalog/matching.js');
 for(const id of ['search-filter-delivery','creative-cards-to-tracks','benchmark-gain-sequence','pareto-efficiency-sequence']){
  const effect=effectDefinitions.find(e=>e.id===id);assert.equal(rank({effects:effectDefinitions},effect.name)[0].effect.id,id);
 }
});
