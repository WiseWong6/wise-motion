// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {data,environment} from './helpers.mjs';
import {state} from '../scripts/history.mjs';
const ids=['shape-contact-rebound','swarm-arc-flight'];
const crosswalk=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
const sourcePath=crosswalk.rules['osmanthus-fall-contact'].migration.files.find(e=>e.file.endsWith('/scene.js')).file;
const originalSource=await readFile(sourcePath,'utf8');
const treeData=await readFile(sourcePath.replace(/scene\.js$/,'tree-data.js'),'utf8');
function original(look){
 const node={value:'0',addEventListener(){},setAttribute(){}};
 const sandbox={document:{body:{dataset:{look}},querySelector:()=>node,addEventListener(){}},window:{devicePixelRatio:2},matchMedia:()=>({matches:false,addEventListener(){}}),p5:function(callback){callback({});}};
 vm.createContext(sandbox);vm.runInContext(treeData,sandbox);
 vm.runInContext(originalSource.replace('new p5(p=>{','globalThis.model={fallingFlowers,flowerPose,flightDepth,motionRibbon,butterflyWing,fallPhysics,groundOffset};\nnew p5(p=>{'),sandbox);
 return sandbox.model;
}
const plain=value=>JSON.parse(JSON.stringify(value));

test('依形回弹与群体弧飞已正式登记，旧历史入口转向独立代码',async()=>{
 const env=await environment(true,{staticPreview:true});
 try{
  const {w}=env;
  for(const id of ids){
   const e=data.effects.find(e=>e.id===id);assert.equal(e.kind,'action');assert.equal(e.source.path,'catalog/effects/osmanthus-motion.js');
   w.document.querySelector(`[data-effect="${id}"]`).click();assert.ok(w.document.querySelector('#preview .pattern-canvas'));
   const prompt=w.MotionExport.prompt(e,{},data),code=w.MotionExport.code(e);
   assert.match(prompt,id===ids[0]?/回弹系数 0.46/:/振翅开合/);
   assert.match(prompt,/640×360/);assert.doesNotMatch(prompt,/原片范围|尚未|本机原作|关键假设/);
   assert.match(code,/catalog\/effects\/osmanthus-motion\.js/);assert.doesNotMatch(code,/\/Users\/|isolated-source|p5(?:\.min)?\.js/);
  }
  for(const [old,id] of [['osmanthus-fall-contact',ids[0]],['osmanthus-moon-flight',ids[1]]]){
   assert.equal(crosswalk.rules[old].status,'excluded');assert.equal(crosswalk.rules[old].migration.effect,id);assert.equal(data.redirects['history-'+old],id);
  }
 }finally{env.close();}
});

test('固定零件的全部姿态、尾光和振翅与原运动函数一致，不依赖上次播放位置',async()=>{
 const env=await environment();
 try{
  for(const [id,look,start] of [[ids[0],'flowers',5],[ids[1],'gold-leaves',8.5]]){
   const m=env.w.MotionFactories[id].model(),o=original(look),duration=data.effects.find(e=>e.id===id).duration_ms/1000;
   assert.equal(m.fallingFlowers.length,112);
   for(let i=0;i<112;i++){
    const f=m.fallingFlowers[i],source=o.fallingFlowers[i];
    assert.deepEqual(plain(m.fallPhysics(f,f.origin)),plain(o.fallPhysics(source,source.origin)));
    for(let t=start;t<=start+duration;t+=.125){
     assert.deepEqual(plain(m.flowerPose(f,t)),plain(o.flowerPose(source,t)),id+' 位置或阶段变化');
     assert.deepEqual(plain(m.flightDepth(f,t)),plain(o.flightDepth(source,t)));
     assert.deepEqual(plain(m.motionRibbon(f,t)),plain(o.motionRibbon(source,t)));
     for(const side of [-1,1])assert.deepEqual(plain(m.butterflyWing(f,t,side)),plain(o.butterflyWing(source,t,side)));
    }
   }
  }
 }finally{env.close();}
});

test('实际旋转轮廓底边在触地时落在同一地面，回弹顶点由撞击速度决定',async()=>{
 const env=await environment();
 try{
  const m=env.w.MotionFactories[ids[0]].model();
  for(const f of m.fallingFlowers){
   const q=m.flowerMotion(f,f.contactAt),bottom=m.groundOffset(f,q.angle);
   assert.ok(Math.abs((q.y-m.PLACEMENT.rootY)*m.PLACEMENT.scale+m.PLACEMENT.y+bottom*m.PLACEMENT.scale-m.GROUND_Y)<1e-7,'实际底边未贴合地面');
   const peak=m.flowerMotion(f,f.morphAt);
   assert.ok(Math.abs(peak.y-(f.end.y-f.reboundSpeed**2/(2*m.GRAVITY*m.PLACEMENT.scale)))<1e-8);
   assert.equal(f.reboundSpeed,f.impactSpeed*.46);
  }
 }finally{env.close();}
});

function drawingContexts(w){
 const contexts=new Map();
 w.HTMLCanvasElement.prototype.getContext=function(){
  if(contexts.has(this))return contexts.get(this);
  const trace=[],stack=[];let state={globalAlpha:1};
  const gradient=(kind,args)=>{const stops=[];trace.push([kind,...args,stops]);return {addColorStop(at,color){assert.ok(at>=0&&at<=1);stops.push([at,color]);},toString(){return JSON.stringify([kind,args,stops]);}};};
  const target={trace,save(){stack.push({...state});trace.push(['save']);},restore(){assert.ok(stack.length);state=stack.pop();trace.push(['restore']);},createLinearGradient(...args){return gradient('linear',args);},createRadialGradient(...args){return gradient('radial',args);}};
  const ctx=new Proxy(target,{get(target,key){if(key in target)return target[key];if(key in state)return state[key];return (...args)=>{for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),String(key));trace.push([key,...args.map(value=>value instanceof w.HTMLCanvasElement?['canvas',value.width,value.height]:value)]);};},set(target,key,value){if(key==='globalAlpha')assert.ok(Number.isFinite(value)&&value>=0&&value<=1);state[key]=value;trace.push(['set',key,String(value)]);return true;}});
  contexts.set(this,ctx);return ctx;
 };
 return contexts;
}

test('独立画布能重复定位、绘制原材质并释放翅膀缓存，复制代码可直接使用',async()=>{
 const env=await environment();
 try{
  const {w}=env,contexts=drawingContexts(w);
  for(const id of ids){
   const e=data.effects.find(e=>e.id===id),root=w.document.createElement('div');
   const render=w.MotionKit.createRenderer(root,e),canvas=root.firstElementChild,ctx=contexts.get(canvas);
   render(e.preview_ms);assert.equal(canvas.dataset.renderState,'ready');assert.ok(Number(canvas.dataset.visible)>0);
   assert.ok(ctx.trace.some(row=>row[0]==='linear'),'没有原材质渐变');
   if(id===ids[1])assert.ok(ctx.trace.some(row=>row[0]==='drawImage'),'蝴蝶翅膀缓存未绘制');
   ctx.trace.length=0;render(0);ctx.trace.length=0;render(e.preview_ms);const first=JSON.stringify(ctx.trace);
   render(e.duration_ms);ctx.trace.length=0;render(e.preview_ms);assert.equal(JSON.stringify(ctx.trace),first,'回拖后画面变化');
   const graphics=[...contexts.keys()].filter(c=>c!==canvas&&c.width===44*11*2);
   render.destroy(false);assert.equal(canvas.width,0);for(const c of graphics)assert.equal(c.width,0);
  }
 }finally{env.close();}
});
