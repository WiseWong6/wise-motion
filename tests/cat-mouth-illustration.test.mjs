// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {JSDOM} from 'jsdom';
import {environment,data,frameMarkup} from './helpers.mjs';
const source='/Users/wisewong/Documents/Developer/scenes/motion-catalog/packs/completed/source/cat/';
const cat={module:{exports:{}}},clock={module:{exports:{}}};
class NativePath{constructor(d=''){this.d=d;}addPath(p){this.d+=' '+p.d;}}
cat.Path2D=NativePath;
runInNewContext(await readFile(source+'cat.js','utf8'),cat);
runInNewContext(await readFile(source+'timeline.js','utf8'),clock);
const effect=data.effects.find(e=>e.id==='cat-mouth-illustration');
function originalPaths(ms){
 const paths=[],clips=[];const ctx={save(){},restore(){},translate(){},scale(){},beginPath(){},ellipse(){},fillRect(){},clip(p){if(p)clips.push(p.d);},fill(p){if(p)paths.push(p.d);},stroke(p){if(p)paths.push(p.d);}};
 const state={...clock.module.exports.catState(5+ms/1000,0),walking:0,walkDistance:0,coat:1,baseCoat:1,tailLift:1};
 cat.module.exports.draw(ctx,state,5+ms/1000,{x:320,y:315,scale:1.72,noBlink:true});return {paths,clips,state};
}
test('小葵原路径、灰白花纹与口型曲线逐时刻保留，重播定位稳定',async()=>{
 const env=await environment();try{
  const root=env.w.document.getElementById('root'),render=env.w.MotionFactories[effect.id](root,env.w.MotionKit,effect);
  for(const ms of [0,240,310,400,580,740,940,1060,1260,1440,1700]){
   render(ms);const expected=originalPaths(ms);
   assert.ok(Math.abs(Number(root.querySelector('svg').dataset.opening)-expected.state.reaction.hiss)<1e-10,ms+' 原叫声开合量');
   const painted=[...root.querySelectorAll('[data-part="cat"] path')].map(p=>p.getAttribute('d'));
   for(const path of expected.paths)assert.ok(painted.includes(path),ms+' 原填色及口型路径缺失');
   assert.deepEqual([...root.querySelectorAll('clipPath path')].map(p=>p.getAttribute('d')),expected.clips,ms+' 花纹裁切边界');
   assert.equal(root.querySelectorAll('image,text,foreignObject').length,0);
  }
  render(740);const peak=frameMarkup(root);render(1700);const end=frameMarkup(root);render(0);assert.equal(frameMarkup(root),end,'终点应回到闭嘴站姿');
  render(740);assert.equal(frameMarkup(root),peak,'来回定位相同表情');
 }finally{env.close();}
});
test('旧历史书签直接进入插画，独立代码只依赖本包脚本且能播放与释放',async()=>{
 const env=await environment(true,{hash:'#history-cat-mouth'});try{
  const d=env.w.document;assert.equal(d.querySelector('.effect-item[aria-current="true"]').dataset.effect,effect.id);
  assert.equal(d.querySelector('[data-kind="illustration"]').getAttribute('aria-pressed'),'true');
  assert.ok(!env.w.MotionHistory.recipes.some(e=>e.history_id==='cat-mouth'));
  const html=env.w.MotionExport.code(effect);assert.doesNotMatch(html,/history-data|history-runtime|source\/cat|CompletedAssets/);
  const dom=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true});try{
   const w=dom.window;w.ResizeObserver=class{observe(){}disconnect(){}};w.matchMedia=()=>({matches:false});
   for(const s of w.document.querySelectorAll('script'))w.eval(s.src?await readFile(new URL('../'+s.getAttribute('src'),import.meta.url),'utf8'):s.textContent);
   w.MotionDemo.pause();w.MotionDemo.seek(740);assert.ok(Number(w.document.querySelector('svg').dataset.opening)>.99);
   w.MotionDemo.seek(1700);assert.equal(w.document.querySelector('svg').dataset.opening,'0');w.MotionDemo.destroy();assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{dom.window.anime?.engine.pause();dom.window.close();}
 }finally{env.close();}
});
