// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';

function record(ctx){
 const calls=[];
 for(const method of ['fillRect','moveTo','lineTo','stroke','fill','translate','rotate']){
  const original=ctx[method];ctx[method]=function(...args){calls.push([method,...args,this.fillStyle,this.strokeStyle]);return original.apply(this,args);};
 }
 return calls;
}

test('汽车离场补回原蓝底和路面，标记随镜头减速而运动',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');let draw,full;
 try{
  w.WiseSceneDiagnostics=true;
  draw=w.MotionKit.createRenderer(root,data.effects.find(e=>e.id==='camera-lag-departure'));await draw.ready;
  const calls=record(root.querySelector('canvas').getContext('2d'));
  const other=w.document.createElement('div');root.after(other);
  full=w.MotionKit.createRenderer(other,data.effects.find(e=>e.id==='balloon-drive-journey'));await full.ready;
  const road=record(other.querySelector('[data-layer="road"]').getContext('2d'));
  draw(1);full(1);const frames=new Map();
  for(const ms of [0,1500,2750,5000,0,2750]){
   calls.length=0;road.length=0;draw(ms);full(9000+ms);
   assert.deepEqual(calls[0].slice(0,5),['fillRect',0,0,900,1200],'蓝色背景铺满原画板');
   assert.ok(road.length>30,'原路面应包含随镜头运动的标记');
   assert.deepEqual(calls.slice(0,road.length),road,'路面位置和颜色必须与原组合同一时刻一致');
   assert.equal(root.dataset.pose,other.dataset.pose,'汽车原速度和镜头减速不变');
   const frame=JSON.stringify(calls);if(frames.has(ms))assert.equal(frame,frames.get(ms),'回拖后背景与车辆可重现');else frames.set(ms,frame);
  }
 }finally{draw?.destroy();full?.destroy();env.close();}
});

function balloonTrace(ctx){
 let matrix=[1,0,0,1,0,0],stack=[],path=[],strokes=[],fills=[],colors=[],backgrounds=0;
 const point=(x,y)=>path.push([matrix[0]*x+matrix[2]*y+matrix[4],matrix[1]*x+matrix[3]*y+matrix[5]]);
 const multiply=([a,b,c,d,e,f])=>{const [A,B,C,D,E,F]=matrix;matrix=[A*a+C*b,B*a+D*b,A*c+C*d,B*c+D*d,A*e+C*f+E,B*e+D*f+F];};
 const hooks={
  setTransform(...m){matrix=m;},save(){stack.push([...matrix]);},restore(){matrix=stack.pop();},
  translate(x,y){multiply([1,0,0,1,x,y]);},scale(x,y){multiply([x,0,0,y,0,0]);},
  rotate(a){multiply([Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0]);},
  clearRect(){strokes=[];fills=[];colors=[];backgrounds=0;},fillRect(){backgrounds++;},
  beginPath(){path=[];},moveTo:point,lineTo:point,
  bezierCurveTo(...v){for(let i=0;i<v.length;i+=2)point(v[i],v[i+1]);},
  ellipse(x,y,rx,ry){point(x-rx,y-ry);point(x+rx,y+ry);},
  stroke(){strokes.push([...path]);},fill(){fills.push([...path]);}
 };
 for(const [name,hook]of Object.entries(hooks)){const native=ctx[name];ctx[name]=function(...args){hook(...args);return native.apply(this,args);};}
 const gradient=ctx.createRadialGradient;
 ctx.createRadialGradient=function(...args){
  const value=gradient.apply(this,args),stops=[];colors.push(stops);
  const add=value.addColorStop;value.addColorStop=function(...args){stops.push(args);return add.apply(this,args);};return value;
 };
 return ()=>({strokes,fills,colors,backgrounds});
}
const normalized=frame=>{
 const points=[...frame.strokes.flat(),...frame.fills.flat()];
 const left=Math.min(...points.map(p=>p[0])),top=Math.min(...points.map(p=>p[1]));
 const height=Math.max(...points.map(p=>p[1]))-top;
 const paths=list=>list.map(path=>path.map(([x,y])=>[x-left,y-top].map(n=>Math.round(n/height*1e8)/1e8)));
 return {strokes:paths(frame.strokes),fills:paths(frame.fills),colors:frame.colors};
};

test('气球插画提取原簇全部35只和完整绳尾，统一取景后排列、颜色及回拖保持一致',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');let draw,full;
 try{
  const effect=data.effects.find(e=>e.id==='drive-balloon-illustration');
  assert.equal(effect.name,'七色气球簇与绳尾');assert.equal(effect.variants,undefined,'全部入口展示整簇，不再切成单只');
  draw=w.MotionKit.createRenderer(root,effect);
  const read=balloonTrace(root.querySelector('canvas').getContext('2d'));
  const other=w.document.createElement('div');root.after(other);
  full=w.MotionKit.createRenderer(other,data.effects.find(e=>e.id==='balloon-drive-journey'));
  const original=balloonTrace(other.querySelector('[data-layer="balloons"]').getContext('2d'));
  await Promise.all([draw.ready,full.ready]);
  const reference=normalized(original());let frozen;
  for(const time of [0,1650,3000,0,1650]){
   draw(time);const frame=read();
   assert.equal(frame.colors.length,35,'完整保留35只原球体');
   assert.equal(frame.strokes.length,35,'每只气球保留一根完整柔绳');
   assert.equal(frame.fills.filter(path=>path.length===96).length,35,'保留35个完整球形');
   assert.equal(frame.backgrounds,0,'独立素材使用透明底');
   assert.deepEqual(normalized(frame),reference,'仅等比放大居中，球形、结口、反光、柔绳和叠放顺序与组合原簇一致');
   const points=[...frame.strokes.flat(),...frame.fills.flat()];
   assert.ok(points.every(([x,y])=>x>=0&&x<=900&&y>=0&&y<=1200),'整簇与完整绳尾位于画板内');
   assert.ok(Math.max(...points.map(p=>p[1]))-Math.min(...points.map(p=>p[1]))>950,'整簇完整放大，不沿用车后小尺寸');
   const saved=JSON.stringify(frame);frozen??=saved;assert.equal(saved,frozen,'暂停和回拖保持原簇布局');
  }
 }finally{draw?.destroy();full?.destroy();env.close();}
});
