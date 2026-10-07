// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data} from './helpers.mjs';

function enforcePixelOrigin(w){
 const create=w.document.createElement.bind(w.document),native=w.HTMLCanvasElement.prototype.getContext,tainted=new WeakSet(),requests=[];
 w.document.createElement=(tag,...args)=>{const node=create(tag,...args);if(tag==='canvas')node.dataset.sceneSource='original';return node;};
 const contexts=new WeakMap();
 w.HTMLCanvasElement.prototype.getContext=function(type){
  const ctx=native.call(this,type);if(!ctx)return ctx;if(contexts.has(ctx))return contexts.get(ctx);
  const canvas=this,guard=new Proxy(ctx,{get(target,key){
   if(key==='drawImage')return(image,...args)=>{
    if(image.src?.startsWith('file:')||tainted.has(image))tainted.add(canvas);
    return target.drawImage(image,...args);
   };
   if(key==='getImageData')return(...args)=>{if(tainted.has(canvas))throw new w.DOMException('The canvas has been tainted by cross-origin data.','SecurityError');return target.getImageData(...args);};
   const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;
  },set(target,key,value){return Reflect.set(target,key,value);}});contexts.set(ctx,guard);return guard;
 };
 w.OffscreenCanvas=class{constructor(width,height){const canvas=w.document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;}};
 const descriptor=Object.getOwnPropertyDescriptor(w.HTMLImageElement.prototype,'src');
 Object.defineProperty(w.HTMLImageElement.prototype,'src',{get:descriptor.get,set(value){descriptor.set.call(this,value);requests.push(this.src);}});
 return requests;
}

test('本地直开时原图片封装逐字节一致，缩略图与独立画面都无需跨来源读取像素',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');
 try{
  const requests=enforcePixelOrigin(w);
  // 模型必须能复现旧载入方式的限制，不能只让所有像素读取无条件成功。
  const old=w.document.createElement('canvas'),legacy=w.document.createElement('img');legacy.src='file:///original.png';old.getContext('2d').drawImage(legacy,0,0);
  assert.throws(()=>old.getContext('2d').getImageData(0,0,1,1),{name:'SecurityError'});requests.length=0;
  for(const effect of data.effects.filter(e=>['selfie','letter'].includes(e.scene?.family))){
   const render=w.MotionKit.createRenderer(root,effect);await render.ready;
   for(const ms of [0,effect.preview_ms,effect.duration_ms*.3,effect.duration_ms*.8,effect.duration_ms])render(ms);
   render.destroy();root.replaceChildren();
  }
  assert.ok(requests.length>=7);assert.ok(requests.every(url=>url.startsWith('data:image/png;base64,')));
  for(const [path,url]of Object.entries(w.WiseSceneImageData)){
   assert.ok(url.startsWith('data:image/png;base64,'));
   assert.deepEqual(Buffer.from(url.slice('data:image/png;base64,'.length),'base64'),await readFile(new URL('../catalog/'+path,import.meta.url)),path+' 必须保留原图');
  }
 }finally{env.close();}
});

test('星月和自拍缩略图读完原图后保留画面，螺旋丸组合有实际可见路径',async()=>{
 const env=await environment(),{w}=env;
 try{
  enforcePixelOrigin(w);w.eval(await readFile(new URL('../catalog/thumbnails.js',import.meta.url),'utf8'));
  const ids=['star-letter-journey','xiaokui-selfie-journey','ring-construction-journey','mushroom-sphere-journey','ring-sphere-journey','energy-discharge-journey'];
  const hosts=ids.map(id=>{const host=w.document.createElement('div');host.className='thumb';w.document.body.append(host);w.MotionThumbs.attach(host,data.effects.find(e=>e.id===id));return host;});
  env.reveal();await w.MotionThumbs.whenIdle();
  for(const [i,host]of hosts.entries()){
   assert.equal(host.querySelector('.history-placeholder'),null,ids[i]+' '+host.title);
   if(i<2)assert.ok([...host.querySelectorAll('canvas')].some(c=>c.width>1&&c.height>1),ids[i]+' 缩略图被清空');
   else assert.ok([...host.querySelectorAll('path[d]')].some(p=>Number(p.getAttribute('opacity'))>.1),ids[i]+' 缩略图没有可见绘制');
  }
  assert.ok(hosts[0].querySelector('.scene-letter-inner .composer'),'星月输入发送界面必须保留在缩略图');
  assert.equal(w.MotionRuntime.instanceCount,0);w.MotionThumbs.disposeAll();
 }finally{env.close();}
});
