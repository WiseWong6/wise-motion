// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {JSDOM} from 'jsdom';
const data=JSON.parse(await readFile(new URL('../catalog/registry.json',import.meta.url),'utf8'));
async function environment(){
 const dom=new JSDOM('<!doctype html><div id="root"></div>',{runScripts:'outside-only',url:'file:///wise-motion/catalog/index.html'}),w=dom.window;
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 for(const file of ['matching.js','runtime.js','effects/motion-oasis.js','export.js'])w.eval(await readFile(new URL('../catalog/'+file,import.meta.url),'utf8'));
 w.MotionRegistry=JSON.parse(JSON.stringify(data));
 return {w,close:()=>dom.window.close()};
}
const source=await readFile(new URL('../catalog/effects/motion-oasis.js',import.meta.url),'utf8');
const scope={MotionFactories:{}};runInNewContext(source,scope);
const fresh=data.effects.filter(e=>e.source.path==='catalog/effects/motion-oasis.js');
const duration=data.effects.find(e=>e.id==='motion-oasis-sequence').duration_ms/1000;
function recorder(){
 let hash,depth=0,calls=0;const state={},stack=[];
 const record=(key,args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),key);hash?.update(key+JSON.stringify(args));calls++;};
 const methods={save(){stack.push({...state});depth++;record('save',[]);},restore(){assert.ok(depth>0);depth--;Object.assign(state,stack.pop());record('restore',[]);},measureText:s=>({width:String(s).length*28}),setLineDash(){}};
 for(const key of ['createLinearGradient','createRadialGradient'])methods[key]=(...args)=>{record(key,args);return {addColorStop:(...v)=>record('colorStop',v)};};
 const ctx=new Proxy(methods,{get:(o,k)=>k in o?o[k]:k in state?state[k]:(...args)=>record(k,args),set:(o,k,v)=>{state[k]=v;return true;}});
 return {ctx,hash(draw){hash=createHash('sha256');calls=0;draw(ctx);assert.equal(depth,0,'画布保存与恢复必须配对');const value=hash.digest('hex');hash=null;return {value,calls};}};
}
test('完整城市任意定位保持几何一致，水面厚度与图形高度连续对应',()=>{
 const e=scope.WiseMotionOasis.createEngine(data),r=recorder();
 const times=[0,.11,.32,.54,.79,.95,1.4,1.82,2.24,2.48,2.70,2.89,3.12,3.32,3.5,3.61,3.75,3.90,3.92,4.03,4.20,4.33,4.55,duration];
 const samples=times.map(t=>r.hash(c=>e.render(c,t)).value);
 for(let i=times.length-1;i>=0;i--)assert.equal(r.hash(c=>e.render(c,times[i])).value,samples[i]);
 for(let frame=54;frame<=duration*60;frame++){
  const t=frame/60;e.render(r.ctx,t);const info=e.inspect();assert.equal(info.waterHeights.length,26);
  for(const cell of info.waterHeights){assert.ok(Math.abs(cell.bottom+8)<1e-8);assert.equal(cell.top,e.gallery.waterHeight(t,cell.i,cell.j));}
 }
 assert.equal(e.gallery.metadata.counts.action,data.effects.filter(x=>x.kind==='action').length);
 assert.equal(e.gallery.metadata.total,data.effects.length);e.dispose();
});

test('镜头逐帧平顺，收尾保持斜向构图，全程不旋转',()=>{
 const e=scope.WiseMotionOasis.createEngine(data);
 let previous=e.cameraAt(0);
 for(let frame=1;frame<=duration*60;frame++){
  const current=e.cameraAt(frame/60);
  assert.ok(Object.values(current).every(Number.isFinite));
  assert.ok(Math.hypot(current.x-previous.x,current.y-previous.y)<16,'每帧横移与升降不能突然跃动');
  assert.ok(Math.abs(current.scale-previous.scale)<.05,'每帧缩放不能突然跳变');
  assert.equal(current.yaw,Math.PI/4,'地块全程保留原斜向朝向');
  previous=current;
 }
 const step=1e-6;
 for(const time of [.24,.26,.86,.92,1.80,2.05,2.37,3.90,4.55]){
  const before=e.cameraAt(time-step),at=e.cameraAt(time),after=e.cameraAt(time+step);
  for(const key of ['x','y','scale','yaw'])assert.ok(Math.abs((at[key]-before[key])/step-(after[key]-at[key])/step)<.01,'运镜衔接的速度必须连续');
 }
 const ending=e.cameraAt(duration);
 for(const time of [4.55,4.70,duration])assert.deepEqual(e.cameraAt(time),ending,'镜头拉远后保持停稳');
 const frontLeft=e.projectAt([660,660,0],duration),frontRight=e.projectAt([660,0,0],duration),backLeft=e.projectAt([0,660,0],duration);
 assert.ok(frontLeft[1]>frontRight[1],'地块右侧边缘保留斜向');assert.ok(frontLeft[0]>backLeft[0],'地块左侧边缘保留斜向');
 e.dispose();
});

test('完整数据卡先停留阅读，地块缩小时卡片与底部文案同步交接',()=>{
 const e=scope.WiseMotionOasis.createEngine(data),texts=[],stack=[];
 let matrix=[1,0,0,1,0,0],font='',alpha=1;
 const compose=([a,b,c,d,x,y])=>{
  const [u,v,w,z,tx,ty]=matrix;
  matrix=[u*a+w*b,v*a+z*b,u*c+w*d,v*c+z*d,u*x+w*y+tx,v*x+z*y+ty];
 };
 const size=()=>Number(font.match(/([\d.]+)px/)[1]);
 const width=s=>[...s].reduce((n,char)=>n+size()*(/[\u4e00-\u9fff]/.test(char)?1:.7),0);
 const ctx=new Proxy({
  save(){stack.push({matrix:[...matrix],font,alpha});},restore(){({matrix,font,alpha}=stack.pop());},
  translate(x,y){compose([1,0,0,1,x,y]);},scale(x,y){compose([x,0,0,y,0,0]);},transform(...values){compose(values);},
  measureText:s=>({width:width(s)}),
  fillText(text,x,y){
   if(alpha<=0)return;
   const [a,b,c,d,tx,ty]=matrix,w=width(text),h=size();
   const points=[[x,y-h],[x+w,y-h],[x+w,y+h*.25],[x,y+h*.25]].map(([u,v])=>[a*u+c*v+tx,b*u+d*v+ty]);
   texts.push({text,matrix:[...matrix],points,alpha});
  },
  createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})
 },{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>{if(k==='font')font=v;if(k==='globalAlpha')alpha=v;return true;}});
 const labels=new Set(['brand','data']);
 let held;const reading=e.cameraAt(2.70);
 for(let frame=162;frame<=234;frame++){
  texts.length=0;e.render(ctx,frame/60,labels);
  assert.deepEqual(texts.filter(entry=>/^\d+$/.test(entry.text)).map(entry=>entry.text),['action','illustration','composition'].map(kind=>String(e.gallery.metadata.counts[kind])),'完整数字须保留1.2秒');
  assert.ok(!texts.some(entry=>entry.text==='M'),'读卡期间不能提前切到收尾文案');
  assert.deepEqual(e.cameraAt(frame/60),reading,'读卡时保持地块尺寸，缩小放在阅读之后');
  if(held)assert.deepEqual(texts,held,'阅读期间数字和卡面文字的位置与尺寸保持不变');else held=texts.map(entry=>({...entry}));
 }
 let previousCardAlpha=1,previousTitleAlpha=0;
 for(let frame=235;frame<273;frame++){
  const t=frame/60;texts.length=0;e.render(ctx,t,labels);
  const card=texts.find(entry=>entry.text==='ACTIONS'),title=texts.find(entry=>entry.text==='M');
  assert.ok(card&&title,'缩小期间卡片与底部文字须同时交接，不能空等');
  const shrinking=(reading.scale-e.cameraAt(t).scale)/(reading.scale-e.cameraAt(duration).scale);
  assert.ok(Math.abs(card.alpha-(1-shrinking))<1e-8,'卡片透明度跟随地块缩小进度');
  assert.ok(title.alpha>0&&title.alpha<=shrinking+1e-8,'地块开始缩小就显出底部文字');
  assert.ok(card.alpha<=previousCardAlpha&&title.alpha>=previousTitleAlpha,'卡片持续淡出，文字持续显现');
  previousCardAlpha=card.alpha;previousTitleAlpha=title.alpha;
 }
 texts.length=0;e.render(ctx,4.55,labels);assert.ok(!texts.some(entry=>entry.text==='ACTIONS'));assert.ok(texts.some(entry=>entry.text==='M'&&entry.alpha===1),'缩小结束时完成文字交接');
 const horizontal=e.brandFrameAt(4.08);assert.equal(horizontal[1],0);assert.equal(horizontal[2],0);
 for(let frame=235;frame<=duration*60;frame++){
  texts.length=0;e.render(ctx,frame/60,new Set(['brand']));
  for(const entry of texts)for(const [x,y] of entry.points)assert.ok(x>=28&&x<=1066-28&&y>=28&&y<=600-24,'文案入场过程不能越出画面');
 }
 texts.length=0;e.render(ctx,duration,labels);
 const cityBottom=Math.max(...[[-3,-3,-77],[663,-3,-77],[663,663,-77],[-3,663,-77]].map(point=>e.projectAt(point,duration)[1]));
 for(const entry of texts)for(const [x,y] of entry.points){
  assert.ok(x>=28&&x<=1066-28,'文案须保留画幅边距');
  assert.ok(y>=cityBottom+18&&y<=550,'所有文案须位于地块底边下方并保留间距');
 }
 const titleFrame=e.brandFrameAt(duration),titleStart=titleFrame[4],titleEnd=titleStart+620*titleFrame[0];
 assert.ok(Math.abs((titleStart+titleEnd)/2-e.cameraAt(duration).x)<1e-8,'整组文案在地块下方居中');
 const caption=texts.find(entry=>entry.text==='让动效在城市发生');
 const count=texts.find(entry=>entry.text.startsWith('WISE MOTION'));
 assert.ok(caption&&count);assert.equal(caption.matrix[1],0);assert.equal(caption.matrix[2],0);assert.equal(count.matrix[1],0);assert.equal(count.matrix[2],0);
 assert.ok(count.text.includes(String(data.effects.length)));assert.equal(stack.length,0);
 e.dispose();
});

test('动作卡以短直线从右下角连到左前方真实水格',()=>{
 const e=scope.WiseMotionOasis.createEngine(data),paths=[];let points=[];
 const ctx=new Proxy({
  beginPath(){points=[];},moveTo(x,y){points.push([x,y]);},lineTo(x,y){points.push([x,y]);},
  bezierCurveTo(){assert.fail('动作卡不再绕地块外侧弯行');},stroke(){if(points.length)paths.push([...points]);},
  measureText:s=>({width:String(s).length*28}),
  createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})
 },{get:(o,k)=>o[k]||(()=>{}),set:()=>true});
 e.render(ctx,3.5,new Set(['data']));
 const [start,ring,marker]=paths[0],anchor=e.gallery.metadata.panels[0].center;
 assert.equal(paths[0].length,3,'连线直接到标记点，不绕行');
 assert.ok(Math.abs(start[0]-(39.5+152.1))<1e-8);
 assert.ok(Math.abs(start[1]-(171.5+101.7-152.1/Math.sqrt(3)))<1e-8,'起点贴在斜卡面的右下角');
 const i=Math.floor(anchor[0]/55),j=Math.floor(anchor[1]/55);
 assert.equal(e.tileType(i,j),'water');assert.ok(i<9&&j===9,'落点位于左前方水面');
 assert.deepEqual(marker,[...e.projectAt([anchor[0],anchor[1],e.gallery.waterHeight(3.5,i,j)+1.1],3.5)]);
 assert.ok(Math.hypot(ring[0]-start[0],ring[1]-start[1])<300,'连线保留在卡片与附近水格之间');
 e.dispose();
});

test('静止构件复用几何，暖缓存与新实例的绘制指令保持一致',()=>{
 let normalCalls=0;
 const countedMath=Object.create(Math);
 countedMath.hypot=(...values)=>{normalCalls++;return Math.hypot(...values);};
 const isolated={MotionFactories:{},Math:countedMath};runInNewContext(source,isolated);
 const engine=isolated.WiseMotionOasis.createEngine(data),r=recorder();
 const cold=r.hash(c=>engine.render(c,3.5));const coldCalls=normalCalls;normalCalls=0;
 const warm=r.hash(c=>engine.render(c,3.5));
 assert.deepEqual(warm,cold,'复用模型不能改变路径、颜色渐变或绘制顺序');
 assert.ok(normalCalls<coldCalls*.75,`重复计算应减少，首次 ${coldCalls} 次，复用后 ${normalCalls} 次`);
 for(const time of [2.7,duration,.5,3.5,4.13,duration]){
  const freshEngine=isolated.WiseMotionOasis.createEngine(data);
  assert.equal(r.hash(c=>engine.render(c,time)).value,r.hash(c=>freshEngine.render(c,time)).value,'跳转和实例之间不能串用几何');
  freshEngine.dispose();
 }
 engine.dispose();
});
test('两种波次按距离传播，交接时旧图保留，新图已在运动',()=>{
 const e=scope.WiseMotionOasis.createEngine(data),g=e.gallery;
 for(let round=1;round<7;round++){
  const state=g.stateAt(1.4+round*.66+.001),ordered=[...state.cells].sort((a,b)=>a.distance-b.distance);
  assert.equal(state.mode,round%2?'wave-grid':'group-stagger');
  for(let i=1;i<ordered.length;i++)assert.ok(ordered[i].waveAt>=ordered[i-1].waveAt);
  for(const cell of state.cells){
   const before=g.stateAt(cell.waveAt-1e-6).cells[cell.index],after=g.stateAt(cell.waveAt+1e-6).cells[cell.index];
   assert.ok(after.layers.some(l=>l.effect.id===before.effect.id&&l.opacity>.999));
   for(let j=0;j<=12;j++){
    const live=g.stateAt(cell.waveAt+j/12*cell.waveDuration).cells[cell.index];
    assert.ok(Math.abs(live.layers.reduce((n,l)=>n+l.opacity,0)-1)<1e-8);
    assert.ok(live.layers.every(l=>l.age>=.9));
   }
  }
 }
 e.dispose();
});
test('独立动作只画自身对象，拆层改变实际绘制，同一时刻恢复完整画面',async()=>{
 const env=await environment();try{
  const r=recorder();env.w.HTMLCanvasElement.prototype.getContext=()=>r.ctx;
  const roots=fresh.map(()=>env.w.document.createElement('div'));
  const renders=fresh.map((e,i)=>env.w.MotionFactories[e.id](roots[i],env.w.MotionKit,e));
  await Promise.all(renders.map(x=>x.ready));
  for(let i=0;i<fresh.length;i++){
   const e=fresh[i],draw=renders[i];draw(e.preview_ms);const stats=draw.inspect();
   assert.equal(roots[i].querySelectorAll('canvas').length,1);
   if(e.id==='terraced-rise'){assert.equal(stats.tiles,0);assert.equal(stats.waterHeights.length,0);}
   if(e.id==='water-wave-handoff'){assert.equal(stats.tiles,26);assert.equal(stats.part,'water');}
   if(e.kind==='composition'){
    const full=r.hash(()=>draw(2700)).value,markers=[...roots[i].querySelectorAll('[data-layer]')];assert.equal(markers.length,6);
    markers.filter(n=>n.dataset.layer!=='water').forEach(n=>n.setAttribute('data-composition-hidden',''));await Promise.resolve();
    assert.equal(draw.inspect().tiles,26);assert.notEqual(r.hash(()=>draw(2700)).value,full);
    markers.forEach(n=>n.removeAttribute('data-composition-hidden'));await Promise.resolve();
    assert.equal(r.hash(()=>draw(2700)).value,full);
   }
  }
  const nodes=roots.flatMap(root=>[...root.querySelectorAll('canvas')]);renders.forEach(draw=>{draw.destroy();draw.destroy();});
  assert.ok(nodes.every(c=>c.width===1&&c.height===1));assert.ok(roots.every(r=>!r.childElementCount));
 }finally{env.close();}
});
test('目录可以搜索并复制独立源码页面，复制页面不依赖私有工程或视频',async()=>{
 const env=await environment();try{
  const html=await readFile(new URL('../catalog/index.html',import.meta.url),'utf8');
  assert.ok(html.includes('effects/motion-oasis.js'));
  assert.equal(env.w.MotionMatch.rank(data,'动效绿洲')[0].effect.id,'motion-oasis-sequence');
  for(const e of fresh){
   const code=env.w.MotionExport.code(e);assert.ok(code.includes('catalog/effects/motion-oasis.js'));if(e.kind==='composition'){assert.ok(code.includes('catalog_data'));assert.ok(code.includes('\"action\": '+env.w.MotionRegistry.effects.filter(x=>x.kind==='action').length));}assert.doesNotMatch(code,/\/Users\/|<video|opus-scene/);
   const prompt=env.w.MotionExport.prompt(e,{},data);assert.match(prompt,/暖沙色/);
  }
  assert.doesNotMatch(source,/\/Users\/|requestAnimationFrame|setInterval|Math\.random/);
  assert.ok(env.w.MotionMatch.rank(data,'动效绿洲').length);
 }finally{env.close();}
});
