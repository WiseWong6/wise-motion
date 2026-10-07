// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data} from './helpers.mjs';

// 记录变换后的花瓣路径，捕获“调用了绘制但整朵花落在画板外”的回归。
// 只验证几何位置，不代替浏览器像素验收。
function traceFlower(ctx){
 let matrix=[1,0,0,1,0,0],stack=[],points=[],fills=0;
 const point=(x,y)=>points.push([matrix[0]*x+matrix[2]*y+matrix[4],matrix[1]*x+matrix[3]*y+matrix[5]]);
 const multiply=([a,b,c,d,e,f])=>{
  const [A,B,C,D,E,F]=matrix;
  matrix=[A*a+C*b,B*a+D*b,A*c+C*d,B*c+D*d,A*e+C*f+E,B*e+D*f+F];
 };
 const hooks={
  setTransform(...m){matrix=m;},save(){stack.push([...matrix]);},restore(){matrix=stack.pop();},
  translate(x,y){multiply([1,0,0,1,x,y]);},scale(x,y){multiply([x,0,0,y,0,0]);},
  rotate(a){multiply([Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0]);},
  clearRect(){points=[];fills=0;},moveTo:point,
  bezierCurveTo(...args){for(let i=0;i<args.length;i+=2)point(args[i],args[i+1]);},
  ellipse(x,y,rx,ry){point(x-rx,y-ry);point(x+rx,y+ry);},fill(){fills++;}
 };
 for(const [key,hook]of Object.entries(hooks)){
  const native=ctx[key];ctx[key]=function(...args){hook(...args);return native.apply(this,args);};
 }
 return ()=>{
  assert.equal(fills,5,'四片花瓣与花心均须绘制');
  assert.ok(points.every(([x,y])=>x>=0&&x<=720&&y>=0&&y<=960),'整朵花必须位于画板内');
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
  assert.ok(Math.abs((left+right)/2-360)<1&&Math.abs((top+bottom)/2-480)<1,'花心须位于画板中央');
  assert.ok(right-left>300&&right-left<450,'单花应占画板约一半宽，缩略图可辨认');
 };
}

test('四瓣桂花的主预览、回看和静态缩略图保持居中可见',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');let render;
 try{
  const effect=data.effects.find(e=>e.id==='osmanthus-flower-illustration');
  const original=w.MotionFactories[effect.id],checks=new WeakMap();
  const factory=(host,...args)=>{
   const draw=original(host,...args),canvas=host.querySelector('canvas');
   checks.set(canvas,traceFlower(canvas.getContext('2d')));return draw;
  };
  Object.assign(factory,original);w.MotionFactories[effect.id]=factory;
  render=w.MotionKit.createRenderer(root,effect);await render.ready;
  const check=checks.get(root.querySelector('canvas'));
  for(const time of [0,effect.preview_ms,effect.duration_ms,0,effect.preview_ms]){render(time);check();}
  w.eval(await readFile(new URL('../catalog/thumbnails.js',import.meta.url),'utf8'));
  const thumb=w.document.createElement('div');w.document.body.append(thumb);
  w.MotionThumbs.attach(thumb,effect);env.reveal();await w.MotionThumbs.whenIdle();
  const canvas=thumb.querySelector('canvas');assert.ok(canvas,'缩略图必须保留画布');
  assert.equal(canvas.width,720);assert.equal(canvas.height,960);checks.get(canvas)();
 }finally{render?.destroy();w.MotionThumbs?.disposeAll();env.close();}
});
