// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {environment,data} from './helpers.mjs';
const origin='/Users/wisewong/Documents/Developer/scenes/motion-catalog/packs/recovered/source/weave/';
const code=await readFile(new URL('../catalog/effects/thread-weave.js',import.meta.url),'utf8');
const original={};
for(const file of ['assets/rhythm.js','src/artwork.js'])vm.runInNewContext(await readFile(origin+file,'utf8'),original);
const current={};vm.runInNewContext(code,current);
const plain=x=>JSON.parse(JSON.stringify(x));
const effect=data.effects.find(e=>e.id==='thread-weave');

test('织造与牵丝共用原72个事件、1284根羽丝和双梭曲线，末态全部织完',()=>{
 const a=current.WeaveArtwork.inspect,b=original.WeaveArtwork.inspect;
 assert.deepEqual(plain(current.WeaveRhythm),plain(original.WeaveRhythm));
 assert.deepEqual(plain(a.fibers),plain(b.fibers));assert.equal(a.events.length,72);assert.equal(a.fibers.length,1284);
 for(let t=0;t<=23.9;t+=.071){
  assert.deepEqual(plain(a.stateAt(t)),plain(b.stateAt(t)));
  for(const f of [a.fibers[0],a.fibers[301],a.fibers.at(-1)])assert.deepEqual(plain(a.fiberProgress(f,t)),plain(b.fiberProgress(f,t)));
  // 包含开场进针、两路末段退针，横版等比取景保留两枚梭子的完整活动空间。
  for(const s of a.stateAt(t).shuttles){const x=136.4+s.screen.x*.34,y=-64.8+s.screen.y*.34;assert.ok(x>15&&x<625&&y>15&&y<345,`${t}: ${x}, ${y}`);}
 }
 assert.equal(a.stateAt(23.9).fiberCount,1284);
});

function recordingCanvas(w){
 const contexts=[];
 w.HTMLCanvasElement.prototype.getContext=function(){
  if(this._ctx)return this._ctx;
  const calls=[],stack=[],state={globalAlpha:1};
  const fn=(name)=>(...args)=>{for(const x of args)if(typeof x==='number')assert.ok(Number.isFinite(x),name);calls.push([name,...args.map(x=>typeof x==='object'?'object':x)]);};
  const gradient={addColorStop:fn('colorStop')};
  const ctx=new Proxy(state,{get:(o,k)=>k==='calls'?calls:k==='save'?()=>{stack.push({...state});fn('save')();}:k==='restore'?()=>{assert.ok(stack.length);Object.assign(state,stack.pop());fn('restore')();}:String(k).startsWith('create')?()=>gradient:k in o?o[k]:fn(k),set:(o,k,v)=>{o[k]=v;calls.push([k,v]);return true;}});
  this._ctx=ctx;contexts.push(ctx);return ctx;
 };
 return contexts;
}

test('横版只适配背景与整体取景，牵丝和织羽仍用同一次原绘制，倒拖和释放稳定',async()=>{
 const env=await environment();try{
  const {w}=env,contexts=recordingCanvas(w),root=w.document.getElementById('root');
  const draw=w.MotionFactories['thread-weave'](root,w.MotionKit,effect),canvas=root.firstElementChild,ctx=contexts[0];
  assert.equal(canvas.width/canvas.height,16/9);assert.equal(root.dataset.art,'original');
  const digest=t=>{ctx.calls.length=0;draw(t);return createHash('sha256').update(JSON.stringify(ctx.calls)).digest('hex');};
  for(const t of [0,550,8650,12150,24050,24500]){const a=digest(t);digest(21000);digest(0);assert.equal(digest(t),a);}
  assert.equal(canvas.dataset.sourceTime,'23.9');
  digest(12150);assert.ok(ctx.calls.filter(c=>c[0]==='bezierCurveTo').length>=6,'同帧同时绘制牵丝与金属梭');
  assert.ok(ctx.calls.filter(c=>c[0]==='lineTo').length>8000,'保留细羽丝与轨迹细节');
  draw.destroy(true);assert.equal(canvas.width,640);ctx.calls.length=0;draw(1500);assert.equal(ctx.calls.length,0);
  assert.equal(contexts[1].calls.filter(c=>c[0]==='fillRect').length,14002,'保留固定颗粒背景');
 }finally{env.close();}
});

test('两个旧历史入口均进入唯一正式动作，说明和完整导出仅依赖包内源码',async()=>{
 for(const old of ['recovered-weave-grow','recovered-weave-trail']){
  const env=await environment(true,{hash:'#history-'+old});try{
   const {w}=env,d=w.document;assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,'thread-weave');
   assert.equal(d.querySelector('[data-kind="action"]').getAttribute('aria-pressed'),'true');
   assert.ok(!w.MotionHistory.recipes.some(e=>e.history_id===old));
   assert.equal(w.MotionRegistry.redirects['history-'+old],'thread-weave');
   assert.match(w.MotionExport.code(effect),/catalog\/effects\/thread-weave\.js/);assert.doesNotMatch(w.MotionExport.code(effect),/\/Users\/|history-data\.js/);
  }finally{env.close();}
 }
 assert.equal(data.effects.filter(e=>e.id==='thread-weave').length,1);
 assert.match(effect.phases.join(' '),/1284/);assert.match(effect.phases.join(' '),/54/);
});
