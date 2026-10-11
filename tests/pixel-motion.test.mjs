// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {build} from 'esbuild';
import {exportEffect} from '../scripts/export.mjs';
import {selectEffect} from '../scripts/show.mjs';
import {environment,data} from './helpers.mjs';
import {frameScriptsFor} from '../remotion/frame-document.mjs';
const baseline=JSON.parse(await readFile(new URL('./pixel-motion-baseline.json',import.meta.url),'utf8'));
const cityBaseline=JSON.parse(await readFile(new URL('./pixel-motion-city-baseline.json',import.meta.url),'utf8'));
const context={atob,MotionFactories:{}};
for(const file of ['pixel-motion-data.js','pixel-motion.js'])runInNewContext(await readFile(new URL('../catalog/effects/'+file,import.meta.url),'utf8'),context);
const api=context.WisePixelMotion;
const reference=f=>f>=300&&f<540?cityBaseline.frames[f-300]:baseline.frames[f];
function digest(seconds,part){
 const rgba=api.rgba(api.indices(seconds,{part})),rgb=new Uint8Array(320*180*3);
 for(let i=0;i<320*180;i++)rgb.set(rgba.subarray(i*4,i*4+3),i*3);
 return createHash('sha256').update(rgb).digest('hex');
}

test('全部源像素格匹配Python参考；城市使用修正参考，基础速度1在20秒完成',()=>{
 assert.equal(api.baseRate,1.5);
 for(let f=0;f<900;f++)assert.equal(digest(f/30/1.5),reference(f),'源帧 '+f);
 for(let f=0;f<600;f++)assert.equal(digest(f/30),reference(Math.floor(f*1.5)),'30帧导出格 '+f);
 assert.equal(digest(20),baseline.frames[899],'准确末端保持最后一格');
});

test('同帧重复、倒序与乱序定位不改变像素；加速仍按原像素格取样',()=>{
 for(const f of [310,891,0,89,557,305,117,752,891,310])assert.equal(digest(f/30/1.5),reference(f));
 for(const f of [0,96,306,751,891])assert.equal(digest((f+.49)/30/1.5),reference(f));
 for(const t of [-1,NaN,Infinity])assert.throws(()=>api.indices(t));
 for(const part of api.parts){const before=digest(1.25,part);api.indices(0,{part});assert.equal(digest(1.25,part),before,part);}
});

test('组合关联11个真实动作，8个现有条目精确指向像素示例；独立动作只绘制对应主体',async()=>{
 const e=data.effects.find(e=>e.id==='pixel-motion-sequence');
 assert.equal(e.actions.length,11);assert.equal(Object.keys(e.action_variants).length,8);assert.equal(e.audio,undefined);
 assert.equal(context.MotionFactories[e.id].breakdown.length,5);
 for(const id of e.actions){
  const definition=selectEffect(id,e.action_variants[id]);
  assert.ok(frameScriptsFor(definition).includes('catalog/effects/pixel-motion.js'));
  assert.equal(definition.content_slots.length,0);
 }
 // Exact layer extraction retains position, pixel edges and source timing.
 for(const [part,seconds,globalSeconds,region]of [
  ['gather',3.1,3.1,[120,65,200,95]],['hop',2.75,6.75,[0,90,140,140]],
  ['pops',4.4,8.4,[125,55,310,110]],['ball',2.75,12.75,[15,25,170,150]],
  ['morph',3.5,13.5,[225,75,265,115]],['kinetic',3.45,21.45,[0,0,320,180]],
  ['idle',4,29,[140,110,180,151]]
 ]){
  const img=api.indices(seconds/1.5,{part}),full=api.indices(globalSeconds/1.5);const [x0,y0,x1,y1]=region;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*320+x;if(img[i]!==255)assert.equal(img[i],full[i],part+' pixel '+x+','+y);}
 }
 const page=await environment(false);
 try{
  for(const id of e.actions){
   const def=selectEffect(id,e.action_variants[id]),root=page.w.document.createElement('div');
   const draw=page.w.MotionFactories[id](root,page.w.MotionKit,def);draw(def.preview_ms);draw(0);draw(def.preview_ms);
   assert.equal(root.querySelectorAll('canvas').length,1);assert.equal(root.firstElementChild.dataset.pixelMotion,api.choices[id]);draw.destroy();
  }
  const root=page.w.document.createElement('div'),draw=page.w.MotionFactories[e.id](root,page.w.MotionKit,e);
  assert.deepEqual([...root.querySelectorAll('[data-layer]')].map(n=>n.dataset.layer),['opening','hop','city','words','ending']);
  for(const ms of [0,10000,18000,0,20000])draw(ms);
  const canvases=[...root.querySelectorAll('canvas')];draw.destroy(true);
  assert.ok(canvases.every(canvas=>canvas.width===320&&canvas.height===180),'缩略图销毁绘制器时保留已经画好的像素');
 }finally{page.close();}
});

test('完整组合与像素示例导出的独立工程可以编译，默认参数保留准确示例',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'wise-pixel-source-'));
 try{
  for(const [id,variantId]of [['pixel-motion-sequence'],['shape-morph','pixel-motion'],['parallax-city-scroll']]){
   const out=await exportEffect(id,{variantId,outDir:path.join(dir,id)});
   assert.equal(out.kind,'standalone');
   const entry=await readFile(path.join(out.directory,'index.jsx'),'utf8');
   assert.ok(entry.includes('WisePixelMotion'));assert.ok(entry.includes(JSON.stringify(id)));
   if(variantId)assert.match(entry,/"variantId":"pixel-motion"/);
   assert.match(entry,/"speed":1(?:,|})/);
   if(id==='pixel-motion-sequence')assert.match(entry,/durationInFrames=\{601\}/);
   const built=await build({entryPoints:[path.join(out.directory,'index.jsx')],bundle:true,write:false,platform:'node',format:'esm',external:['react','remotion'],logLevel:'silent'});
   assert.ok(built.outputFiles[0].text.includes('function indices'));
   const guide=await readFile(path.join(out.directory,'README.md'),'utf8');assert.match(guide,/320×180/);assert.match(guide,/无音乐/);
  }
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('本地目录按需载入像素组合，五段拆解可隔离，相关动作直接打开准确像素示例',async()=>{
 const page=await environment(true,{staticPreview:true,lazyAssets:true});
 try{
  const {w}=page,d=w.document,e=data.effects.find(e=>e.id==='pixel-motion-sequence');
  await w.MotionLazy.ensure(e);await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(page.lazyRequests,['effects/pixel-motion-data.js','effects/pixel-motion.js']);
  d.querySelector('[data-kind="composition"]').click();
  d.querySelector('[data-effect="pixel-motion-sequence"]').click();
  assert.equal(d.querySelectorAll('#preview [data-layer]').length,5);
  assert.match(d.getElementById('prompt').textContent,/WISE/);
  assert.match(d.getElementById('prompt').textContent,/20\.00 秒/);
  assert.equal(d.getElementById('speed').value,'1');
  const clock=w.MotionFactories[e.id].breakdown;
  assert.equal(e.duration_ms,20000);assert.equal(clock.at(-1).end,20000);
  assert.equal(clock[2].start,10000/1.5);assert.equal(clock[2].end,12000);
  assert.match(d.querySelector('[data-composition-layer="city"]').textContent,/6\.67–12 秒/);
  d.querySelector('[data-composition-mode="solo"]').click();
  d.querySelector('[data-composition-layer="city"]').click();
  const layers=[...d.querySelectorAll('#preview [data-layer]')];
  assert.equal(layers.filter(n=>!n.hasAttribute('data-composition-hidden')).length,1);
  assert.equal(layers.find(n=>!n.hasAttribute('data-composition-hidden')).dataset.layer,'city');
  d.querySelector('[data-related="shape-morph"]').click();
  await w.MotionLazy.ensure(selectEffect('shape-morph','pixel-motion'));await new Promise(resolve=>setImmediate(resolve));
  assert.equal(d.getElementById('related-variant').value,'pixel-motion');
  assert.equal(d.querySelector('#related-preview [data-pixel-motion]').dataset.pixelMotion,'morph');
  d.getElementById('related-close').click();
  assert.equal(d.querySelectorAll('#preview [data-layer]').length,5);
 }finally{page.close();}
});

test('三层城市逐格只平移固定纹理，离开边缘再进入时窗灯与楼形都不闪变',()=>{
 const layers=context.WisePixelMotionData.cityLayers;
 // Independent reference: paint each complete strip once, then read shifted pixels.
 // Unlike the production renderer, this uses a texture lookup and no wrapped buildings.
 const textures=layers.map(layer=>{
  const img=new Uint8Array(layer.span*180).fill(255);
  const box=(x,y,width,height,color)=>{for(let yy=y;yy<y+height;yy++)for(let xx=x;xx<x+width;xx++)img[yy*layer.span+xx]=color;};
  for(const b of layer.buildings){
   box(b.x,180-b.height,b.width,b.height,layer.color);
   for(const [x,y]of b.windows)box(b.x+x,y,2,2,layer.windowColor);
  }
  return img;
 });
 const snapshot=JSON.stringify(layers);
 for(let tick=0;tick<240;tick++){
  const nativeSeconds=tick/30/1.5,u=(300+tick)/30-10,expected=new Uint8Array(320*180).fill(255);
  layers.forEach((layer,i)=>{
   const shift=Math.floor(u*layer.speed%layer.span),texture=textures[i];
   for(let y=0;y<180;y++)for(let x=0;x<320;x++){
    const c=texture[y*layer.span+(x+shift+30)%layer.span];
    if(c!==255)expected[y*320+x]=c;
   }
  });
  assert.deepEqual(Array.from(api.indices(nativeSeconds,{part:'city'})),Array.from(expected),'城市源格 '+tick);
 }
 assert.equal(JSON.stringify(layers),snapshot);
});

test('60帧预览缓存以加速后的源格为准，不漏掉相邻源格；可重新从头定位',()=>{
 let pixels,writes=0;
 const canvas={style:{},getContext:()=>({createImageData:()=>({data:new Uint8ClampedArray(320*180*4)}),putImageData(image){pixels=image.data.slice();writes++;},clearRect(){}})};
 const engine=api.createEngine(canvas);
 for(const f of [2,3,4,3,0]){
  const time=f/60;engine.render(time);
  assert.deepEqual(Array.from(pixels),Array.from(api.rgba(api.indices(time))),'预览格 '+f);
 }
 assert.equal(writes,5);
 engine.dispose();
});
