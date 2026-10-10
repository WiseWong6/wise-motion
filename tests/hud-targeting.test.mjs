// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {createHash} from 'node:crypto';
import {data} from './helpers.mjs';
import {JSDOM} from 'jsdom';
const code=await readFile(new URL('../catalog/effects/hud-targeting.js',import.meta.url),'utf8');
const scope={MotionFactories:{}};runInNewContext(code,scope);
const api=scope.WiseHudTargeting;
const ids=['hud-acquisition-sequence',...api.parts.map(p=>p[1])];

// Only load this renderer: unrelated catalog edits must not mask its data and pixel tests.
async function environment(){
 const dom=new JSDOM('<!doctype html><body></body>',{runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,listeners=new Set();
 w.MotionFactories={};w.MotionKit={};w.HTMLCanvasElement.prototype.getContext=()=>null;
 w.ResizeObserver=class{observe(){listeners.add(this);}disconnect(){listeners.delete(this);}};
 w.eval(code);
 return {w,listeners,close(){w.close();}};
}


test('斜距对齐原片三个可读锚点并保留前导零，锁定之后继续降到77.9',()=>{
 for(const [frame,value]of [[1771,'1665.8'],[1803,'1648.3'],[1813,'0201.7'],[1870,'0077.9']])assert.equal(api.rangeAt((frame-1668)/60).text,value);
 assert.equal(api.rangeAt(0).text,'----.-');
 assert.ok(api.rangeAt((1824-1668)/60).value<api.rangeAt((1813-1668)/60).value);
 assert.equal(api.stateAt(3.36).magnification,21.2);assert.ok(Math.abs(api.stateAt(3.36).fov-.59)<1e-8);
 for(const t of [0,.9,1.7,2.43,3.36]){const a=JSON.stringify(api.stateAt(t));api.stateAt(3.7);api.stateAt(.1);assert.equal(JSON.stringify(api.stateAt(t)),a);}
});

test('十一个独立项只建立自己的真实图层，组合和单项均可倒拖并释放',async()=>{
 assert.equal(data.effects.some(e=>e.id==='hud-line-out'),false);
 assert.equal(scope.MotionFactories['hud-line-out'],undefined);
 assert.equal(api.parts.length,11);
 assert.equal(data.effects.some(e=>e.id==='hud-telemetry-sync'),false);
 const env=await environment();
 try{const {w}=env,root=w.document.createElement('div');
 for(const id of ids){const e=data.effects.find(e=>e.id===id);assert.ok(e,id);const render=w.MotionFactories[id](root,w.MotionKit,e);
  const expected=id==='hud-acquisition-sequence'?14:1;assert.equal(root.querySelectorAll('canvas[data-layer]').length,expected);
  render(e.preview_ms);const first=root.innerHTML;render(e.duration_ms);render(0);render(e.preview_ms);assert.equal(root.innerHTML,first,id);
  assert.equal(render.frameRate,30);render.destroy();assert.equal(root.childElementCount,0);render(400);assert.equal(root.childElementCount,0);
 }
 const comp=data.effects.find(e=>e.id===ids[0]);assert.deepEqual([...scope.MotionFactories[ids[0]].breakdown.flatMap(x=>[...x.actions])].sort(),[...comp.actions].sort());
 }finally{env.close();}
});

function recordingContext(canvas){
 const state={globalAlpha:1},stack=[],calls=[];
 const gradient={addColorStop:(n,c)=>{assert.ok(Number.isFinite(n));assert.equal(typeof c,'string');}};
 const fn=(name)=>(...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),name+' 出现非有限数值');calls.push([name,...args.map(x=>typeof x==='object'?'object':x)]);};
 const ctx=new Proxy(state,{get(target,key){if(key==='canvas')return canvas;if(key==='calls')return calls;if(key==='save')return()=>{stack.push({...state});fn('save')();};if(key==='restore')return()=>{Object.assign(state,stack.pop());fn('restore')();};if(key==='getTransform')return()=>({a:1,b:0,c:0,d:1,e:0,f:0});if(String(key).startsWith('create')&&String(key).endsWith('Gradient'))return()=>gradient;if(key==='measureText')return s=>({width:s.length*8});if(key in target)return target[key];return fn(key);},set(target,key,value){if(typeof value==='number')assert.ok(Number.isFinite(value),key);target[key]=value;calls.push([key,value]);return true;}});return ctx;
}

test('实际绘制分支在开机、扫描、锁定和退出均无无效坐标，重复定位输出相同指令',async()=>{
 const env=await environment();try{const {w}=env;
 w.HTMLCanvasElement.prototype.getContext=function(){return this._ctx||(this._ctx=recordingContext(this));};
 const painter=w.WiseHudTargeting.createPainter(),canvas=w.document.createElement('canvas'),c=canvas.getContext('2d');
 const digest=t=>{c.calls.length=0;painter.draw(c,t);return createHash('sha256').update(JSON.stringify(c.calls)).digest('hex');};
 for(const t of [0,.5,.9,1.7166667,2.4166667,3.3666667,3.43,3.6]){const first=digest(t);digest(3.7);digest(.1);assert.equal(digest(t),first,'time '+t);}
 painter.draw(c,1.7166667);assert.ok(c.calls.some(x=>x[0]==='fillText'&&x[1]==='1665.8'));
 assert.ok(c.calls.some(x=>x[0]==='fillText'&&x[1]==='观测斜距'));painter.destroy();
 }finally{env.close();}
});


test('数据条目覆盖标记区域且球面扫描与轨迹定位各自独立',()=>{
 const expected=['hud-range-readout','hud-navigation-bars','hud-signal-waves','hud-spectrum-bars','hud-data-stream','hud-candidate-status','hud-globe-scan','hud-radar-sweep'];
 for(const id of expected)assert.equal(data.effects.find(e=>e.id===id)?.category,'scanning',id);
 assert.equal(data.redirects['hud-telemetry-sync'],'hud-range-readout');
});

test('画布按显示像素重绘，暂停时扩大仍更新，组合按局部范围分配内存',async()=>{
 const env=await environment();try{const {w}=env,root=w.document.createElement('div');
 w.document.body.append(root);let width=640;root.getBoundingClientRect=()=>({width,height:width*9/16});
 Object.defineProperty(w,'devicePixelRatio',{value:2,configurable:true});
 w.HTMLCanvasElement.prototype.getContext=function(){return this._ctx||(this._ctx=recordingContext(this));};
 const def=data.effects.find(e=>e.id==='hud-signal-waves'),render=w.MotionFactories[def.id](root,w.MotionKit,def);
 await render.ready;render(1000);
 const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');assert.equal(canvas.width,1280);assert.equal(canvas.height,720);
 const count=ctx.calls.length;width=1280;render(1000);assert.equal(canvas.width,2560);assert.equal(canvas.height,1440);assert.ok(ctx.calls.length>count);
 width=1920;w.dispatchEvent(new w.Event('resize'));assert.equal(canvas.width,3840);assert.equal(canvas.height,2160);
 render.destroy();assert.equal(env.listeners.size,0);width=640;w.dispatchEvent(new w.Event('resize'));assert.equal(canvas.width,1);
 const comp=data.effects.find(e=>e.id==='hud-acquisition-sequence'),all=w.MotionFactories[comp.id](root,w.MotionKit,comp);
 const pixels=[...root.querySelectorAll('canvas')].reduce((n,c)=>n+c.width*c.height,0);
 assert.ok(pixels<5*1280*720,'组合不应为每个小面板分配整屏画布');
 all(1700);assert.equal(root.querySelector('[data-layer="nav"]').getContext('2d').calls.filter(x=>x[0]==='arc'&&x[3]===17.5).length,6);
 all.destroy();assert.equal(env.listeners.size,0);
 }finally{env.close();}
});

test('各数据图层只绘制自身内容，轨迹与球面使用不同几何且缓存跟随分辨率',async()=>{
 const env=await environment();try{const {w}=env;
 w.HTMLCanvasElement.prototype.getContext=function(){return this._ctx||(this._ctx=recordingContext(this));};
 const painter=w.WiseHudTargeting.createPainter(),canvas=w.document.createElement('canvas');canvas.width=2560;canvas.height=1440;
 const c=canvas.getContext('2d');
 for(const key of ['boot','nav']){c.calls.length=0;painter.drawPart(c,key,1.7);assert.ok(c.calls.some(x=>x[0]==='roundRect'),key+' 组合中也应有完整闭框');}
 const draw=key=>{c.calls.length=0;painter.drawPart(c,key,1.7,{isolated:true});return c.calls;};
 const textOf=key=>draw(key).filter(x=>x[0]==='fillText').map(x=>x[1]);
 assert.ok(textOf('waves').includes('有效占比'));assert.ok(textOf('waves').includes('主波'));
 assert.deepEqual(textOf('spectrum'),[]);
 assert.equal(textOf('stream').filter(s=>/^[0-9A-F]{2}$/.test(s)).length,45);
 assert.ok(textOf('nav').includes('方位'));assert.ok(!textOf('nav').includes('02 遥测仪表'));
 assert.ok(textOf('radar').includes('轨迹采样'));assert.equal(draw('radar').filter(x=>x[0]==='roundRect').length,1);
 for(const key of ['boot','range','nav','radar','waves','candidates','spectrum','stream']){
  const calls=draw(key);assert.ok(calls.some(x=>x[0]==='roundRect'),key+' 应有闭合外框');
  assert.ok(!calls.some(x=>x[0]==='fillText'&&/^(0[1-6] |观测斜距|遥测链路)/.test(x[1])),key+' 不应有面板标题');
 }
 c.calls.length=0;painter.drawPart(c,'radar',1.7);assert.ok(c.calls.some(x=>x[0]==='fillText'&&x[1]==='03 轨迹定位'));
 c.calls.length=0;painter.drawPart(c,'waves',1.7);assert.ok(c.calls.some(x=>x[0]==='fillText'&&x[1]==='04 通道占比'));
 assert.equal(draw('spectrum').filter(x=>x[0]==='moveTo'&&x[2]===473).length,51);
 assert.equal(draw('radar').filter(x=>x[0]==='drawImage').length,0);
 let cached;c.drawImage=(image)=>{cached=image;};draw('globe');assert.equal(cached.width,2560);assert.equal(cached.height,1440);
 canvas.width=1280;canvas.height=720;draw('globe');assert.equal(cached.width,1280);assert.equal(cached.height,720);
 painter.destroy();assert.equal(cached.width,1);
 }finally{env.close();}
});

test('原有地球开场保持，锁定后改为地中海区域且保持静止，狙击镜准星不遮住中心',async()=>{
 for(const t of [.8,1.7,2.22]){
  const view=api.stateAt(t).mapView;
  assert.equal(view.longitude,47+t*20,'锁定前沿用原有旋转视角');assert.equal(view.latitude,18);assert.equal(view.zoom,1);
 }
 const finalView=api.stateAt(2.8).mapView;
 assert.equal(finalView.longitude,12.5);assert.equal(finalView.latitude,42.5);assert.equal(finalView.zoom,3.6);
 const env=await environment();try{const {w}=env;
 w.HTMLCanvasElement.prototype.getContext=function(){return this._ctx||(this._ctx=recordingContext(this));};
 const painter=w.WiseHudTargeting.createPainter(),canvas=w.document.createElement('canvas'),c=canvas.getContext('2d');
 let cached,composites=0;c.drawImage=image=>{cached=image;composites++;};
 painter.drawPart(c,'globe',1.7,{isolated:true});assert.equal(composites,1);
 const border=cached.getContext('2d');
 const snapshot=t=>{c.calls.length=0;border.calls.length=0;composites=0;painter.drawPart(c,'globe',t,{isolated:true});
  assert.equal(composites,1,'扫描和锁定均需绘制国家轮廓');
  assert.ok(border.calls.filter(x=>x[0]==='lineTo').length>1000,'聚焦后仍需保留国家轮廓细节');
  return JSON.stringify([c.calls,border.calls]);
 };
 const hasSweep=()=>c.calls.some(x=>x[0]==='arc'&&x[3]===166&&x[5]-x[4]<.3);
 snapshot(1.7);assert.ok(hasSweep(),'开头保持旋转扫描光束');
 const locked=snapshot(2.8);assert.equal(hasSweep(),false,'锁定后扫描光束消失');
 assert.equal(snapshot(3.3),locked,'聚焦结束后地图应停止变化');snapshot(1.7);assert.equal(snapshot(2.8),locked);
 c.calls.length=0;painter.drawPart(c,'lock',2.8,{isolated:true});
 assert.ok(c.calls.some(x=>x[0]==='arc'&&x[1]===0&&x[2]===0&&x[3]===2.1),'红点对准准星中心');
 const labels=c.calls.filter(x=>x[0]==='fillText');
 assert.ok(labels.some(x=>x[1]==='锁定目标'));assert.ok(labels.some(x=>x[1]==='北纬42°30′  东经12°30′'));
 assert.ok(labels.every(x=>x[3]>100),'锁定文字应移到下方，不遮挡瞄准中心');
 assert.ok(!labels.some(x=>/锁定确认|错定确认/.test(x[1])));
 const root=w.document.createElement('div'),def=data.effects.find(e=>e.id==='hud-target-lock');
 const render=w.MotionFactories[def.id](root,w.MotionKit,def);render(def.preview_ms);
 const solo=root.querySelector('canvas'),calls=solo.getContext('2d').calls;
 assert.ok(calls.some(x=>x[0]==='arc'&&x[3]===166),'独立预览应包含完整狙击镜');
 render.destroy();painter.destroy();
 }finally{env.close();}
});

test('趋势图端点对应读数，热力图的峰值读数与锁定描边对应最强单元',async()=>{
 const env=await environment();try{const {w}=env;
 w.HTMLCanvasElement.prototype.getContext=function(){return this._ctx||(this._ctx=recordingContext(this));};
 const painter=w.WiseHudTargeting.createPainter(),canvas=w.document.createElement('canvas'),c=canvas.getContext('2d');
 const draw=(key,t)=>{c.calls.length=0;painter.drawPart(c,key,t,{isolated:true});return c.calls;};
 const curve=draw('boot',2.8);
 assert.ok(curve.filter(call=>call[0]==='lineTo').length>=32,'应绘制连续趋势曲线');
 assert.ok(curve.filter(call=>call[0]==='fill').length>=2,'曲线下方应填充面积并显示末端圆点');
 const dot=curve.find(call=>call[0]==='arc'&&call[3]===2.3);
 assert.equal(Math.round((168-dot[2])/(168-121)*100),95);
 assert.ok(curve.some(call=>call[0]==='fillText'&&call[1]==='95%'));
 assert.ok(!curve.some(call=>call[0]==='fillText'&&call[1]==='通过'));
 for(const t of [1.7,2.8]){
  const calls=draw('candidates',t),cells=[];
  for(let i=0;i<calls.length;i++){
   const call=calls[i];if(call[0]==='roundRect'&&call[3]<20&&calls[i+1]?.[0]==='fillStyle')cells.push({box:call,alpha:parseInt(calls[i+1][1].slice(-2),16)});
  }
  assert.equal(cells.length,40);
  const peak=cells.reduce((a,b)=>a.alpha>b.alpha?a:b);
  const percent=Number(calls.find(call=>call[0]==='fillText'&&/^\d+%$/.test(call[1]))[1].slice(0,-1));
  assert.ok(Math.abs(percent-(peak.alpha/255-.1)/.9*100)<1,'百分比应对应格子显示的最大强度');
  if(t>2.4){
   const outline=calls.find((call,i)=>call[0]==='roundRect'&&call[3]<20&&calls[i+1]?.[0]==='strokeStyle');
   assert.equal(outline[1]+1,peak.box[1]);assert.equal(outline[2]+1,peak.box[2]);
   assert.equal(cells.indexOf(peak),21,'锁定在第三行第六列');
  }
 }
 const locked=JSON.stringify(draw('candidates',2.8));assert.equal(JSON.stringify(draw('candidates',3.3)),locked);
 draw('candidates',1.7);assert.equal(JSON.stringify(draw('candidates',2.8)),locked);
 painter.destroy();
 }finally{env.close();}
});

test('新仪表弧长对应读数，轨迹到达终点，占比分区面积与三项读数一致',async()=>{
 const env=await environment();try{const {w}=env;
 w.HTMLCanvasElement.prototype.getContext=function(){return this._ctx||(this._ctx=recordingContext(this));};
 const painter=w.WiseHudTargeting.createPainter(),c=w.document.createElement('canvas').getContext('2d');
 const draw=(key,t)=>{c.calls.length=0;painter.drawPart(c,key,t,{isolated:true});return c.calls;};
 for(const t of [.8,1.7,2.4,3.3]){
  const q=w.WiseHudTargeting.stateAt(t),calls=draw('nav',t),arcs=calls.filter(x=>x[0]==='arc'&&x[3]===17.5);
  const values=[q.heading,q.tilt,q.snr],maxima=[180,90,60];assert.equal(arcs.length,6);
  for(let i=0;i<3;i++){
   const base=arcs[i*2],active=arcs[i*2+1],ratio=(active[5]-active[4])/(base[5]-base[4]);
   assert.ok(Math.abs(ratio-values[i]/maxima[i])<1e-9,'亮弧应与指标量程比例一致');
   assert.ok(calls.some(x=>x[0]==='fillText'&&x[1]===values[i].toFixed(1)));
   const dot=calls.find(x=>x[0]==='arc'&&x[3]===1.7&&Math.abs(Math.hypot(x[1]-active[1],x[2]-active[2])-17.5)<1e-8);
   assert.ok(dot,'白色端点应位于对应量程弧上');
  }
  const partition=draw('waves',t),cells=partition.filter(x=>x[0]==='roundRect'&&x[5]===.6);
  assert.equal(cells.length,3);
  const percentages=partition.filter(x=>x[0]==='fillText'&&/%$/.test(x[1])).map(x=>Number(x[1].match(/(\d+)%$/)[1]));
  assert.equal(percentages.reduce((a,b)=>a+b,0),100);
  // 分隔留白各占1.5，补回后应与原始矩形面积及读数一致。
  const areas=cells.map(x=>(x[3]+3)*(x[4]+3)),total=areas.reduce((a,b)=>a+b,0);
  areas.forEach((area,i)=>assert.ok(Math.abs(area/total*100-percentages[i])<1e-8,'分区面积应对应占比'));
  if(t>=2.4)assert.deepEqual(percentages,[68,21,11]);
 }
 const path=draw('radar',2.8);
 assert.ok(path.some(x=>x[0]==='fillText'&&x[1]==='100%'));assert.ok(path.some(x=>x[0]==='fillText'&&x[1]==='已定位'));
 const nodes=path.filter(x=>x[0]==='arc'&&x[3]===1.35);assert.equal(nodes.length,7);
 const last=nodes.at(-1),diamondStart=path.findIndex(x=>x[0]==='moveTo'&&x[1]===last[1]&&Math.abs(x[2]-(last[2]-3.3))<1e-8);
 assert.ok(diamondStart>=0,'锁定菱形应到达最后一个采样点');
 for(const key of ['radar','waves']){
  const locked=JSON.stringify(draw(key,2.8));assert.equal(JSON.stringify(draw(key,3.3)),locked,key+' 锁定后应保持稳定');
  draw(key,1.2);assert.equal(JSON.stringify(draw(key,2.8)),locked,key+' 回拖后应重现同一结果');
 }
 painter.destroy();
 }finally{env.close();}
});

test('独立卡面文字和图线保留内边距，组合侧栏锁定后仍在画面安全范围内',async()=>{
 const env=await environment();try{const {w}=env;
 w.HTMLCanvasElement.prototype.getContext=function(){return this._ctx||(this._ctx=recordingContext(this));};
 const painter=w.WiseHudTargeting.createPainter(),canvas=w.document.createElement('canvas'),c=canvas.getContext('2d');
 for(const t of [1.7,2.42,3.3])for(const key of ['boot','range','nav','radar','waves','candidates','spectrum','stream']){
  c.calls.length=0;painter.drawPart(c,key,t,{isolated:true});
  const [,x,y,width,height]=c.calls.find(call=>call[0]==='roundRect');
  for(const [,label,tx,ty]of c.calls.filter(call=>call[0]==='fillText')){
   assert.ok(tx>=x+12&&tx<=x+width-12,key+' 文字靠近横向边缘：'+label);
   assert.ok(ty>=y+18&&ty<=y+height-12,key+' 文字靠近纵向边缘：'+label);
  }
  if(key==='spectrum')for(const call of c.calls.filter(call=>(call[0]==='moveTo'||call[0]==='lineTo')&&call[2]>y+12&&call[2]<=473)){
   assert.ok(call[1]>=x+12&&call[1]<=x+width-12,'频谱应完整留在卡面内');
  }
 }
 const root=w.document.createElement('div'),def=data.effects.find(e=>e.id==='hud-acquisition-sequence');
 const render=w.MotionFactories[def.id](root,w.MotionKit,def);render(3300);
 for(const key of ['boot','range','nav','radar','waves','candidates','spectrum','stream']){
  const canvas=root.querySelector(`[data-layer="${key}"]`),left=parseFloat(canvas.style.left),right=left+parseFloat(canvas.style.width);
  assert.ok(left>18&&right<622,key+' 锁定时不得被左右画面裁切');
 }
 c.calls.length=0;painter.drawPart(c,'rings',1.7,{isolated:true});assert.ok(c.calls.some(call=>call[0]==='shadowBlur'&&call[1]>=8));
 painter.destroy();render.destroy();
 }finally{env.close();}
});
