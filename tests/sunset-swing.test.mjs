// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';

// 记录实际路径的坐标，验证两根绳端落在座板侧边中点；不代替浏览器视觉验收。
function trace(ctx){
 let matrix=[1,0,0,1,0,0],stack=[],path=[],strokes=[],fills=[];
 const point=(x,y)=>path.push([matrix[0]*x+matrix[2]*y+matrix[4],matrix[1]*x+matrix[3]*y+matrix[5]]);
 const multiply=([a,b,c,d,e,f])=>{const [A,B,C,D,E,F]=matrix;matrix=[A*a+C*b,B*a+D*b,A*c+C*d,B*c+D*d,A*e+C*f+E,B*e+D*f+F];};
 const hooks={
  setTransform(...m){matrix=m;},save(){stack.push([...matrix]);},restore(){matrix=stack.pop();},
  translate(x,y){multiply([1,0,0,1,x,y]);},scale(x,y){multiply([x,0,0,y,0,0]);},
  rotate(a){multiply([Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0]);},
  clearRect(){strokes=[];fills=[];},beginPath(){path=[];},moveTo:point,lineTo:point,
  quadraticCurveTo(...v){point(v[0],v[1]);point(v[2],v[3]);},
  stroke(){strokes.push([...path]);},fill(){fills.push([...path]);}
 };
 for(const [name,hook]of Object.entries(hooks)){const native=ctx[name];ctx[name]=function(...args){hook(...args);return native.apply(this,args);};}
 return ()=>({strokes,fills});
}

test('独立秋千的两根绳端连接座板左右侧边，定位及回看不漂移',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');let draw;
 try{
  const effect=data.effects.find(e=>e.id==='sunset-swing-illustration');
  draw=w.MotionKit.createRenderer(root,effect);
  const read=trace(root.querySelector('canvas').getContext('2d'));await draw.ready;
  let reference;
  for(const t of [0,1650,3000,0,1650]){
   draw(t);const {strokes,fills}=read();
   assert.equal(fills.length,3,'保留板面、前沿和侧面');assert.equal(strokes.length,6,'两根绳索及原座板边线');
   const [frontLeft,frontRight,backRight,backLeft]=fills[0];
   for(const [index,a,b]of [[0,frontLeft,backLeft],[1,frontRight,backRight]]){
    const end=strokes[index].at(-1);
    assert.ok(Math.hypot(end[0]-(a[0]+b[0])/2,end[1]-(a[1]+b[1])/2)<1e-8,'绳端必须落在座板侧边中点');
    assert.ok(strokes[index][0][1]<end[1],'绳索应从座板上方悬下');
   }
   const points=[...strokes.flat(),...fills.flat()];
   assert.ok(points.every(([x,y])=>x>=0&&x<=900&&y>=0&&y<=1200),'完整秋千位于画板内');
   assert.ok(Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0]))>650,'独立取景应放大完整秋千');
   const frame=JSON.stringify({strokes,fills});reference??=frame;assert.equal(frame,reference);
  }
  assert.equal(data.effects.some(e=>e.id==='sunset-character-illustration'),false);
  assert.equal(w.MotionFactories['sunset-character-illustration'],undefined);
  assert.equal(data.redirects['sunset-character-illustration'],'sunset-sun-illustration');
 }finally{draw?.destroy();env.close();}
});
