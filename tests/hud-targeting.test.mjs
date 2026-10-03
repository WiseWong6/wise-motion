// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
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
 assert.ok(c.calls.some(x=>x[0]==='fillText'&&x[1]==='目标斜距'));painter.destroy();
 }finally{env.close();}
});


test('数据条目覆盖标记区域且球面扫描与雷达扫描各自独立',()=>{
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
 all(1700);assert.ok(root.querySelector('[data-layer="nav"]').getContext('2d').calls.some(x=>x[0]==='lineTo'&&x[1]>=173&&x[1]<=214));
 all.destroy();assert.equal(env.listeners.size,0);
 }finally{env.close();}
});

test('各数据图层只绘制自身内容，两次扫描使用不同几何且球面缓存跟随分辨率',async()=>{
 const env=await environment();try{const {w}=env;
 w.HTMLCanvasElement.prototype.getContext=function(){return this._ctx||(this._ctx=recordingContext(this));};
 const painter=w.WiseHudTargeting.createPainter(),canvas=w.document.createElement('canvas');canvas.width=2560;canvas.height=1440;
 const c=canvas.getContext('2d');
 const draw=key=>{c.calls.length=0;painter.drawPart(c,key,1.7,{isolated:true});return c.calls;};
 const textOf=key=>draw(key).filter(x=>x[0]==='fillText').map(x=>x[1]);
 assert.deepEqual(textOf('waves'),[]);
 assert.deepEqual(textOf('spectrum'),[]);
 assert.equal(textOf('stream').filter(s=>/^[0-9A-F]{2}$/.test(s)).length,45);
 assert.ok(textOf('nav').includes('方位'));assert.ok(!textOf('nav').includes('02 导航遥测'));
 assert.deepEqual(textOf('radar'),[]);assert.equal(draw('radar').filter(x=>x[0]==='roundRect').length,0);
 for(const key of ['boot','range','nav','waves','candidates','spectrum','stream']){
  const calls=draw(key);assert.ok(calls.some(x=>x[0]==='roundRect'),key+' 应有闭合外框');
  assert.ok(!calls.some(x=>x[0]==='fillText'&&/^(0[1-6] |目标斜距|数据链路)/.test(x[1])),key+' 不应有面板标题');
 }
 c.calls.length=0;painter.drawPart(c,'radar',1.7);assert.ok(c.calls.some(x=>x[0]==='fillText'&&x[1]==='目标位置'));
 c.calls.length=0;painter.drawPart(c,'waves',1.7);assert.ok(c.calls.some(x=>x[0]==='fillText'&&x[1]==='04 信号分析'));
 assert.equal(draw('spectrum').filter(x=>x[0]==='moveTo'&&x[2]===477).length,51);
 assert.equal(draw('radar').filter(x=>x[0]==='drawImage').length,0);
 let cached;c.drawImage=(image)=>{cached=image;};draw('globe');assert.equal(cached.width,2560);assert.equal(cached.height,1440);
 canvas.width=1280;canvas.height=720;draw('globe');assert.equal(cached.width,1280);assert.equal(cached.height,720);
 painter.destroy();assert.equal(cached.width,1);
 }finally{env.close();}
});
