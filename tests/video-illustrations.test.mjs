// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {data,environment} from './helpers.mjs';
import {installSceneCanvas} from './scene-canvas-fixture.mjs';
import {installAboutloveFixture} from './aboutlove-fixture.mjs';
import {frameScriptsFor} from '../remotion/frame-document.mjs';
import {resolveEffect} from '../remotion/clock.mjs';
import {exportEffect} from '../scripts/export.mjs';

const subjects=[
 ['pixel-robot-illustration','squash-bounce','pixel-motion'],
 ['lego-brick-illustration'],
 ['aboutlove-moon-illustration','spiral-draw-spin','aboutlove-51'],
 ['aboutlove-mountains-illustration','ridge-text-write'],
 ['aboutlove-river-illustration','word-river-evaporate'],
 ['aboutlove-word-sphere-illustration','orbit','aboutlove-28'],
 ['aboutlove-heart-illustration','particle-word','aboutlove-16'],
];
const definitions=subjects.map(([id])=>resolveEffect(id));
const rootURL=new URL('../',import.meta.url);
async function isolated(definition,html='<main></main>'){
 const dom=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 installSceneCanvas(w);installAboutloveFixture(w);
 w.ResizeObserver=class{observe(){}disconnect(){}};
 for(const file of frameScriptsFor(definition))w.eval(await readFile(new URL(file,rootURL),'utf8'));
 return {dom,w,root:w.document.querySelector('main'),close(){w.MotionRuntime?.disposeAll();w.anime?.engine.pause();w.close();}};
}
function recordedFrame(root){
 const shadow=root.firstElementChild?.shadowRoot;
 if(shadow)return {markup:shadow.innerHTML,draws:[...shadow.querySelectorAll('canvas')].map(c=>c.getContext('2d').hash)};
 return root.innerHTML;
}
function paint(draw,root,time){
 for(const c of root.firstElementChild?.shadowRoot?.querySelectorAll('canvas')||[])c.getContext('2d').hash=2166136261;
 draw(time);return recordedFrame(root);
}

test('新增视频主体全部进入插画分类，原动作与准确示例可独立找到',()=>{
 assert.equal(definitions.length,7);
 for(const [index,def]of definitions.entries()){
  assert.equal(def.kind,'illustration');assert.ok(def.category.startsWith('illustration-'));
  assert.ok(def.source.remotion);assert.ok(!def.audio?.tracks?.length);
  const [,action,variant]=subjects[index];
  if(action){assert.ok(def.actions.includes(action));assert.equal(def.action_variants[action],variant);}
  else assert.deepEqual(def.actions,[],'静态积木不虚构动作');
  for(const id of def.actions)assert.equal(resolveEffect(id,def.action_variants[id]).kind,'action');
 }
 assert.equal(data.effects.some(e=>e.id==='parallax-city-scroll'),false,'不恢复已删除的旧动作入口');
 assert.equal(data.effects.some(e=>e.id==='pixel-city-illustration'),false,'城市插画已撤下');
 assert.equal(resolveEffect('seamless-scroll').source.path,'catalog/effects/continuous.js','连续滚动保留原卡片示例');
 assert.ok(!resolveEffect('seamless-scroll').variants?.some(v=>v.id==='pixel-motion'),'附带的城市滚动示例已撤下');
});

test('仅加载声明依赖即可绘制所有新插画，倒回同一时间恢复同一状态',async()=>{
 for(const def of definitions){
  const env=await isolated(def);let draw;
  try{
   draw=env.w.MotionKit.createRenderer(env.root,def);await draw.ready;
   const expected=paint(draw,env.root,def.duration_ms*.37);
   assert.ok(env.root.firstElementChild,def.id);
   paint(draw,env.root,def.duration_ms*.87);paint(draw,env.root,0);
   assert.deepEqual(paint(draw,env.root,def.duration_ms*.37),expected,def.id+' 重复定位');
   if(def.aboutlove){
    const entry=env.w.WiseAboutLoveEntries[def.id];
    assert.deepEqual(JSON.parse(JSON.stringify(entry.aboutlove)),def.aboutlove);
    const [,action,variant]=subjects.find(([id])=>id===def.id);
    const original=resolveEffect(action,variant),other=env.w.document.createElement('div');
    const compare=env.w.WiseAboutLove.create(other,original.aboutlove,original.duration_ms);
    try{await compare.ready;assert.deepEqual(paint(compare,other,def.duration_ms*.37),expected,def.id+' 原图层与节奏一致');}
    finally{compare.destroy();}
   }
   if(def.id==='pixel-robot-illustration'){
    const api=env.w.WisePixelMotion,part='robots';
    assert.equal(env.root.querySelector('[data-pixel-motion]').dataset.pixelMotion,part);
    assert.equal(api.choices[def.id],part);
    assert.deepEqual(api.indices(.6,{part:api.choices[def.id]}),api.indices(.6,{part}));
   }
   if(def.id==='lego-brick-illustration'){
    const tiles=env.root.querySelector('[data-brick-illustration]');assert.equal(tiles.children.length,6);
    for(const tile of tiles.children)assert.equal(tile.children.length,3,'一块主体和两个凸点');
    const still=tiles.innerHTML;draw(0);assert.equal(env.root.querySelector('[data-brick-illustration]').innerHTML,still);
   }
  }finally{draw?.destroy();env.close();}
 }
});

test('插画目录可搜索新主体，相关动作打开准确示例且关闭后保留主插画',async()=>{
 const env=await environment(true,{staticPreview:true,hash:'#pixel-robot-illustration'});
 try{
  const {w}=env,d=w.document;
  for(const def of definitions){
   d.querySelector('[data-kind="illustration"]').click();
   const search=d.getElementById('search');search.value=def.name;search.dispatchEvent(new w.Event('input'));
   await new Promise(resolve=>setTimeout(resolve,160));
   const card=d.querySelector(`[data-effect="${def.id}"]`);assert.ok(card,def.name);card.click();
   const main=d.getElementById('preview').innerHTML;
   for(const action of def.actions){
    d.querySelector(`#related [data-related="${action}"]`).click();
    assert.equal(d.getElementById('related-variant').value,def.action_variants[action]||'');
    d.getElementById('related-close').click();
    assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,def.id);
    assert.equal(d.getElementById('preview').innerHTML,main);
   }
   d.getElementById('search-clear').click();
  }
 }finally{env.close();}
});

test('新插画复制的本地预览保留分层配置，独立工程全部能编译',async()=>{
 const env=await environment(true,{staticPreview:true}),temporary=await mkdtemp(path.join(tmpdir(),'wise-video-illustrations-export-'));
 try{
  for(const def of definitions){
   const html=env.w.MotionExport.previewCode(def),page=await isolated(def,html.replace(/<script[\s\S]*?<\/script>/g,''));
   try{
    const scripts=new JSDOM(html);try{
     for(const node of scripts.window.document.querySelectorAll('script:not([src])'))page.w.eval(node.textContent);
     await page.w.MotionDemo.ready;page.w.MotionDemo.pause();page.w.MotionDemo.seek(def.preview_ms);
     assert.ok(page.w.document.querySelector('.motion-stage').firstElementChild,def.id);
    }finally{scripts.window.close();}
   }finally{page.close();}
   const exported=await exportEffect(def.id,{outDir:path.join(temporary,def.id)});assert.equal(exported.kind,'standalone');
   const entry=await readFile(path.join(exported.directory,'index.jsx'),'utf8');assert.ok(entry.includes(JSON.stringify(def.id)));
   const compiled=await build({entryPoints:[path.join(exported.directory,'index.jsx')],bundle:true,write:false,platform:'node',format:'esm',external:['react','remotion'],logLevel:'silent'});
   assert.ok(compiled.outputFiles[0].text.length>0,def.id);
  }
 }finally{env.close();await rm(temporary,{recursive:true,force:true});}
});
