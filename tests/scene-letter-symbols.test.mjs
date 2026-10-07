// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data} from './helpers.mjs';

// 记录实际符号路径、材质和位置，不代替浏览器视觉验收。
function trace(w){
 const Path=w.Path2D;
 w.Path2D=class extends Path{constructor(...args){super(...args);this.commands=[];}};
 for(const method of ['moveTo','lineTo','bezierCurveTo','quadraticCurveTo','ellipse','rect','closePath','addPath']){
  w.Path2D.prototype[method]=function(...args){this.commands.push([method,...args]);return Path.prototype[method].apply(this,args);};
 }
 const context=w.HTMLCanvasElement.prototype.getContext,records=new WeakMap();
 w.HTMLCanvasElement.prototype.getContext=function(...args){
  const ctx=context.apply(this,args);if(!ctx||records.has(this))return ctx;
  const record={calls:[],images:[]};records.set(this,record);
  for(const method of ['clearRect','translate','scale','rotate','fill','stroke','drawImage']){
   const native=ctx[method];ctx[method]=function(...a){
    if(method==='clearRect'){record.calls=[];record.images=[];}
    else if(method==='drawImage')record.images.push(a[0]);
    else if(method==='fill'||method==='stroke')record.calls.push({method,path:a[0]?.commands||null,color:method==='fill'?this.fillStyle:this.strokeStyle,alpha:this.globalAlpha,width:this.lineWidth});
    else record.calls.push({method,args:a});
    return native.apply(this,a);
   };
  }
  return ctx;
 };
 return layer=>records.get(records.get(layer).images.at(-1)).calls;
}

test('整组默认展示原24件符号，保留材质、六种单件及定位一致性',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root'),read=trace(w);
 const effect=data.effects.find(e=>e.id==='letter-symbol-illustration');let render;
 try{
  assert.equal(w.MotionKit.resolveVariant(effect).variant_id,'all');
  render=w.MotionKit.createRenderer(root,effect);await render.ready;
  const layer=root.querySelector('canvas[data-layer="art"]'),frames=new Map();let group;
  const positions=Array.from({length:24},(_,i)=>[100+(i%4)*153,150+Math.floor(i/4)*116]);
  for(const time of [0,1650,3000,0,1650]){
   render(time);const calls=read(layer);
   assert.deepEqual(calls.filter(c=>c.method==='translate').map(c=>c.args),positions,'完整四列六行，不缩成一个符号');
   const paints=calls.filter(c=>c.path);
   for(const color of ['#ffffff','#f1f4f8','#ffe39a'])assert.ok(paints.some(c=>c.color===color),'不能丢失原材质 '+color);
   assert.ok(paints.some(c=>c.method==='fill')&&paints.some(c=>c.method==='stroke'),'保留实心与空心');
   const frame=JSON.stringify(calls);
   if(frames.has(time))assert.equal(frame,frames.get(time),'回拖后画面相同');else frames.set(time,frame);
   if(time===1650)group=paints.map(p=>JSON.stringify(p));
  }
  assert.notEqual(frames.get(0),frames.get(1650),'原蝴蝶振翅与材质亮纹按当前时间变化');
  render.destroy();render=null;root.replaceChildren();
  for(const variant of effect.variants.filter(v=>v.id!=='all')){
   render=w.MotionKit.createRenderer(root,{...effect,variant_id:variant.id});await render.ready;render(1650);
   const calls=read(root.querySelector('canvas[data-layer="art"]'));
   assert.deepEqual(calls.filter(c=>c.method==='translate').map(c=>c.args),[[330,440]],variant.label+'仍可居中单独查看');
   assert.ok(calls.filter(c=>c.path).every(p=>group.includes(JSON.stringify(p))),variant.label+'的原轮廓与材质应同时出现在整组里');
   render.destroy();render=null;root.replaceChildren();
  }
 }finally{render?.destroy();env.close();}
});

test('符号轮廓和材质绘制共用原作函数',async()=>{
 const original=await readFile('/Users/wisewong/Documents/Developer/scenes/星月来信/animation.js','utf8');
 const source=await readFile(new URL('../catalog/effects/scene-letter.js',import.meta.url),'utf8');
 for(const [begin,end]of [['function makeButterflyWing(','function createParticle('],['function butterflySpread(','// 参考动作库“自身轨迹光丝”']]){
  const start=original.indexOf(begin),finish=original.indexOf(end,start+1);assert.ok(start>=0&&finish>start);
  assert.ok(source.includes(original.slice(start,finish).trim()),'原造型、材质或振翅函数发生改写');
 }
});
