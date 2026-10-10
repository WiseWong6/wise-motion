// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {puppetHarness,samplePixels} from './selfie-puppet-fixture.mjs';
import {environment,data} from './helpers.mjs';
const source=await readFile(new URL('../catalog/effects/scene-selfie.js',import.meta.url),'utf8');
const digest=pixels=>createHash('sha256').update(pixels).digest('hex');

test('腿部计算优化保留四个视角的原像素、透明边缘和接缝',()=>{
 const h=puppetHarness(source,samplePixels);
 // Frozen from the original renderer before optimization, including translucent
 // edges, gray torso, white socks and low-alpha residue around the silhouette.
 const expected={rear:'7260027ad6f48cd7d81d45c7ad669caa3fda6b49cad930d333fbe58c850f658e',outbound:'a7b0a4c0c0262a1d5087e6922efcfa81d07ab78eb54bd6edacfbee23cf0b2970',front:'8e6f6d5af03d1623496f5b8b24a9c4662a6b940b86db6daf2d9dbf75e71b79d6',left:'819b4dda838e5f70654cb17f9ad2cc8ee4c8da2968db1b9bd7aa77174daacc58'};
 for(const view of Object.keys(expected)){
  const image={naturalWidth:256,naturalHeight:256};
  const options={view,x:300,y:800,scale:1,bodyBob:1.1,facing:1,footTargets:[{dx:3,dy:2},{dx:-5,dy:-3},{dx:7,dy:6},{dx:-2,dy:-4}]};
  h.puppet.draw(h.ctx,image,options);
  assert.equal(digest(h.uploads.at(-1).data),expected[view],view+' 像素不得改变');
  const count=h.uploads.length;
  h.puppet.draw(h.ctx,image,options);assert.equal(h.uploads.length,count,'相同姿态复用已绘制像素');
 }
});

test('接缝扫描保留横向优先、最近白色端点及上下边界结果',()=>{
 const fn=vm.runInNewContext('('+source.slice(source.indexOf('  function sealLegJoins('),source.indexOf('  function warpedTexture('))+')');
 for(const [top,bottom,radius,expected] of [[-4,65,4,'5cbf12d144e837418d735772cc776034d9288b8b0583a4d915418251ee485f92'],[12,49,7,'4e578346d8c5521a209dbc602262b15d837adfe79f0a4658e81d2a9b793fa3c2']]){
  const width=73,height=61,pixels=new Uint8ClampedArray(width*height*4);let seed=1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;const at=(y*width+x)*4;
   const opaque=x>width*.23&&x<width*.7&&y>height*.35&&y<height*.92&&seed%11>2;
   pixels[at]=seed%7?245:170;pixels[at+1]=240;pixels[at+2]=235;pixels[at+3]=opaque?255:seed%231;
  }
  fn(pixels,width,height,top,bottom,radius);assert.equal(digest(pixels),expected);
 }
});

test('转身与返回的场景隔离、足迹和乱序定位保持一致',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');
 const original=w.WiseSceneSources.selfie;let session,draw;
 w.WiseSceneSources.selfie=(S,...args)=>{session=S;return original(S,...args);};w.WiseSceneDiagnostics=true;
 try{
  draw=w.MotionKit.createRenderer(root,data.effects.find(e=>e.id==='selfie-foot-turn'));await draw.ready;
  for(const name of ['Film','ViewPuppet','CatMotion','Choreography']){
   assert.ok(session.env[name]);assert.equal(w[name],undefined,'模块不能泄露到页面全局');
  }
  const ctx=root.querySelector('canvas').getContext('2d'),images=[];
  const originalImage=ctx.drawImage;ctx.drawImage=function(...args){images.push(args);return originalImage.apply(this,args);};
  draw(1);
  const times=[0,300,600,1500,3300,4000,5500,7750],poses=new Map();
  for(const t of times){images.length=0;draw(t);
   assert.deepEqual(images[0].slice(1),[0,0,1086,1448],'手机与人物原底图先绘制，位置和比例保持');
   assert.ok(images.length>3,'手机透视屏幕和小葵应一起绘制');
   poses.set(t,root.dataset.pose);const pose=JSON.parse(root.dataset.pose);assert.equal(pose.feet.length,4);assert.ok(pose.feet.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));}
  for(const t of times.reverse()){draw(t);assert.equal(root.dataset.pose,poses.get(t),'回拖改变足迹或转身姿态');}
 }finally{draw?.destroy();env.close();}
});

test('两个独立自拍条目保留原手机底图，与完整组合的屏幕透视、镜像和倒计时一致',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');let draw;
 const contexts=new WeakMap(),native=w.HTMLCanvasElement.prototype.getContext;
 const imageNames=new Map(Object.entries(w.WiseSceneImageData).map(([path,url])=>[url,path]));
 w.HTMLCanvasElement.prototype.getContext=function(...args){
  const ctx=native.apply(this,args);if(!ctx||contexts.has(this))return ctx;
  const record={images:[],transforms:[],clips:[],scales:[],text:[],path:[]};contexts.set(this,record);
  for(const method of ['clearRect','drawImage','transform','clip','beginPath','moveTo','lineTo','scale','fillText']){
   const fn=ctx[method];ctx[method]=function(...values){
    if(method==='clearRect'){record.images=[];record.transforms=[];record.clips=[];record.scales=[];record.text=[];record.path=[];}
    if(method==='drawImage')record.images.push(values);
    if(method==='transform')record.transforms.push(values);
    if(method==='clip')record.clips.push(record.path.slice());
    if(method==='beginPath')record.path=[];
    if(method==='moveTo'||method==='lineTo')record.path.push([method,...values]);
    if(method==='scale')record.scales.push(values);
    if(method==='fillText')record.text.push(values);
    return fn.apply(this,values);
   };
  }
  return ctx;
 };
 const record=layer=>contexts.get(root.querySelector(`canvas[data-layer="${layer}"]`));
 const image=([node,...args])=>({name:imageNames.get(node.src)||'canvas',args});
 const screen=part=>{
  const preview=contexts.get(part.images[0][0]);
  return {images:part.images.map(image),transforms:part.transforms,clips:part.clips,
   preview:{images:preview.images.map(image),scales:preview.scales,text:preview.text}};
 };
 const times=[0,300,1500,2900,3800,5500,7750],reference=new Map();
 try{
  draw=w.MotionKit.createRenderer(root,data.effects.find(e=>e.id==='xiaokui-selfie-journey'));await draw.ready;
  for(const ms of times){
   draw(ms);reference.set(ms,{body:image(record('scene').images[0]),screen:screen(record('screen'))});
  }
  draw.destroy();draw=null;root.replaceChildren();
  for(const id of ['selfie-preview-illustration','selfie-phone-screen-illustration']){
   draw=w.MotionKit.createRenderer(root,data.effects.find(e=>e.id===id));await draw.ready;
   for(const ms of [...times,...times.slice().reverse()]){
    draw(ms);const actual=record('art'),expected=reference.get(ms);
    assert.equal(actual.images.length,97,id+' 必须先画手机底图，再画96片透视屏幕');
    assert.deepEqual(image(actual.images[0]),expected.body,'保留组合中的手机原图、位置和比例');
    assert.equal(expected.body.name,'assets/scene-sources/selfie/手机与人物.webp');
    assert.deepEqual(expected.body.args,[0,0,1086,1448]);
    assert.deepEqual(screen({...actual,images:actual.images.slice(1)}),expected.screen,'手机屏幕与原组合在同一时刻一致，回拖不改变画面');
    assert.deepEqual(expected.screen.preview.scales,[[-1,1]],'自拍只镜像一次');
    const before=actual.images.length;draw(ms);assert.equal(actual.images.length,before,'暂停定位不重复绘制');
   }
   draw.destroy();draw=null;root.replaceChildren();
  }
 }finally{draw?.destroy();env.close();}
});
