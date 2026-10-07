// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {frameScriptsFor} from '../remotion/frame-document.mjs';
import {installSceneCanvas} from './scene-canvas-fixture.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url));
const registry=JSON.parse(await read('catalog/registry.json'));
const provenance=JSON.parse(await read('catalog/assets/scene-sources/window/SOURCE.json'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceCache=new Map();
async function source(path){if(!sourceCache.has(path))sourceCache.set(path,(await read(path)).toString());return sourceCache.get(path);}
const effect=id=>registry.effects.find(e=>e.id===id);

test('删除浓度墨团插画，实验树的原数据、花期、绘制及八张素材完整保留',async()=>{
 assert.equal(effect('ink-volume-illustration'),undefined);
 assert.ok(effect('ink-volume-roll'),'独立墨团动作仍可使用');
 assert.doesNotMatch(await source('catalog/effects/scene-ink.js'),/register\(['"]ink-volume-illustration['"]/);
 const originalData=(await source('catalog/effects/scene-window-data.js')).replace(/^\/\* Copyright[^\n]+\n/,'').replace('globalThis.WiseWindowTreeData','globalThis.NightTreeData');
 assert.equal(hash(originalData),provenance.original_files['lab-data.js'].sha256,'树和花的原始固定数据');
 const drawing=await source('catalog/effects/scene-window.js');
 for(const section of provenance.preserved_sections){
  const begin=drawing.indexOf(section.begin),end=drawing.indexOf(section.end,begin);
  assert.ok(begin>=0&&end>begin,section.name+'缺失');
  assert.equal(hash(drawing.slice(begin,end).trim()),section.sha256,section.name+'发生改写');
 }
 assert.equal(Object.keys(provenance.assets).length,8);
 for(const [path,record]of Object.entries(provenance.assets)){
  const bytes=await read('catalog/assets/scene-sources/window/'+path);
  assert.equal(bytes.length,record.bytes,path);assert.equal(hash(bytes),record.sha256,path+'必须保留原 PNG 字节');
 }
});

// 仅核对绘图调用和定位状态，不代替浏览器像素或人工视觉验收。
async function environment(id){
 const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'file:///independent/catalog/index.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.HTMLCanvasElement.prototype.getContext=()=>null;installSceneCanvas(w);
 const sizes=new Map();
 for(const path of Object.keys(provenance.assets)){
  const bytes=await read('catalog/assets/scene-sources/window/'+path);sizes.set('/window/'+path,[bytes.readUInt32BE(16),bytes.readUInt32BE(20)]);
 }
 for(const [name,index]of [['naturalWidth',0],['naturalHeight',1]])Object.defineProperty(w.HTMLImageElement.prototype,name,{get(){return [...sizes].find(([path])=>this.src.endsWith(path))?.[1][index]||1536;},configurable:true});
 Object.defineProperty(w.HTMLImageElement.prototype,'complete',{get:()=>true,configurable:true});
 w.HTMLImageElement.prototype.decode=()=>Promise.resolve();w.ResizeObserver=class{observe(){}disconnect(){}};
 w.WiseSceneDiagnostics=true;
 const contexts=new WeakMap(),native=w.HTMLCanvasElement.prototype.getContext;
 w.HTMLCanvasElement.prototype.getContext=function(...args){
  const ctx=native.apply(this,args);if(!ctx||contexts.has(this))return ctx;
  const record={calls:[],images:[]};contexts.set(this,record);
  for(const method of ['clearRect','setTransform','translate','scale','rotate','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','rect','clip','fillRect','stroke','drawImage']){
   const fn=ctx[method];ctx[method]=function(...values){
    if(method==='clearRect'){record.calls=[];record.images=[];}
    else if(method==='drawImage'){
     record.images.push(values[0]);record.calls.push([method,values[0].src||'canvas',values[0].width,values[0].height,...values.slice(1)]);
    }else record.calls.push([method,...values]);
    return fn.apply(this,values);
   };
  }
  return ctx;
 };
 for(const path of frameScriptsFor(effect(id)))w.eval(await source(path));
 const root=w.document.getElementById('root');
 return {w,root,frame(){return [...root.querySelectorAll('canvas')].map(layer=>({part:layer.dataset.layer,calls:contexts.get(contexts.get(layer).images.at(-1)).calls}));},close(){w.anime?.engine.pause();w.close();}};
}

test('完整窗框组合与独立开花共用原花位和花期，暂停、回拖、末帧及插画状态稳定',async()=>{
 const env=await environment('window-experiment-journey'),{w,root}=env;let render;
 const frames=new Map(),poses=new Map(),combo=effect('window-experiment-journey');
 try{
  render=w.MotionKit.createRenderer(root,combo);await render.ready;
  assert.deepEqual([...root.querySelectorAll('canvas')].map(c=>c.dataset.layer),['background','frame','bloom']);
  for(const canvas of root.querySelectorAll('canvas'))assert.deepEqual([canvas.width,canvas.height],[1440,1920]);
  for(const ms of [0,600,2000,3000,3891,2000,0,600,3891,6000]){
   render(ms);const time=Math.min(ms,3891),pose=JSON.parse(root.dataset.pose),frame=JSON.stringify(env.frame());
   assert.equal(pose.branches,2017);assert.equal(pose.first,344);assert.equal(pose.later,600);assert.equal(pose.background,167);assert.equal(pose.accents,2);
   assert.equal(pose.flowers.length,944);assert.equal(pose.duration,provenance.duration_seconds);assert.equal(pose.playbackSpeed,provenance.playback_speed);
   if(frames.has(time))assert.equal(frame,frames.get(time),'暂停与回拖后的原绘图调用一致');else {frames.set(time,frame);poses.set(time,pose);}
   assert.ok(env.frame().every(layer=>layer.calls.length>0),'拆解层必须有实际画面');
  }
  assert.ok(poses.get(0).flowers.every(f=>f.progress===0),'从原枯枝开始');
  assert.ok(poses.get(3891).flowers.every(f=>f.progress>0),'末尾保留全部盛放花簇');
  assert.notEqual(frames.get(0),frames.get(2000),'实际展开过程会改变画面');
  render.destroy();render=null;root.replaceChildren();
  for(const id of ['window-flower-bloom','window-experiment-tree-illustration']){
   const entry=effect(id),options=id.endsWith('illustration')?['bloom','bare']:[undefined];
   for(const variant of options){
    render=w.MotionKit.createRenderer(root,{...entry,variant_id:variant});await render.ready;let staticFrame;
    for(const ms of [0,600,2000,entry.duration_ms,600]){
     render(ms);const pose=JSON.parse(root.dataset.pose);
     if(id==='window-flower-bloom')assert.deepEqual(pose.flowers,poses.get(ms).flowers,'独立动作与组合使用同一批原花');
     else {
      assert.deepEqual(pose.flowers,poses.get(variant==='bare'?0:3891).flowers,'两种插画均取原作姿态');
      const frame=JSON.stringify(env.frame());if(staticFrame)assert.equal(frame,staticFrame,'插画不自行开花');else staticFrame=frame;
     }
    }
    render.destroy();render=null;root.replaceChildren();
   }
  }
  // 素材准备尚未完成就离开时，不再创建后台花簇和满幅缓存。
  render=w.MotionKit.createRenderer(root,combo);render.destroy();await render.ready;render=null;
  assert.equal(root.querySelectorAll('canvas').length,0);
 }finally{render?.destroy();env.close();}
});

test('接入时钟和花位对照原实验页面的现行计算',async t=>{
 let original;
 try{original=await readFile(provenance.source_project+'/lab.js','utf8');}
 catch(error){if(error.code==='ENOENT'){t.skip('未附原工程；原数据、绘制段和素材仍由来源记录校验');return;}throw error;}
 assert.equal(hash(original),provenance.original_files['lab.js'].sha256);
 const reference=vm.createContext({document:{querySelector(){return{};}},matchMedia(){return{matches:false};},window:{devicePixelRatio:2}});
 vm.runInContext(await source('catalog/effects/scene-window-data.js'),reference);reference.NightTreeData=reference.WiseWindowTreeData;
 vm.runInContext(await readFile(provenance.source_project+'/flower-assets.js','utf8'),reference);
 vm.runInContext(original.slice(0,original.indexOf('function stageName(t)'))+`globalThis.sample=time=>({clock:bloomClock(time),flowers:canopyFlowers.filter(flowerIsVisible).map(f=>({position:flowerPosition(f),style:flowerPane(f),variant:f.variant,progress:flowerProgress(f,bloomClock(time)),clock:flowerClocks.get(f)}))});})();`,reference);
 const env=await environment('window-experiment-journey');let render;
 try{
  render=env.w.MotionKit.createRenderer(env.root,effect('window-experiment-journey'));await render.ready;
  for(const ms of [0,600,2000,3000,3891,600]){
   render(ms);const actual=JSON.parse(env.root.dataset.pose),expected=JSON.parse(JSON.stringify(reference.sample(ms/1000)));
   assert.equal(actual.clock,expected.clock);assert.deepEqual(actual.flowers,expected.flowers,'原作的每个花位和开花进度保持一致');
  }
 }finally{render?.destroy();env.close();}
});
