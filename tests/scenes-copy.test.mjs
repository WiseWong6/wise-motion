// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {environment,data} from './helpers.mjs';
import {installSceneCanvas} from './scene-canvas-fixture.mjs';
const codes=new Map();async function source(file){if(!codes.has(file))codes.set(file,await readFile(new URL('../'+file,import.meta.url),'utf8'));return codes.get(file);}
const tick=()=>new Promise(r=>setImmediate(r));
const native=data.effects.filter(e=>e.scene);
test('复制页面的全部造型选择传入对应绘制器，不退回默认配方',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');
 try{
  for(const effect of native)for(const variant of effect.variants||[{id:undefined,scene:effect.scene}]){
   const family=effect.scene.family,original=w.WiseSceneSources[family];let captured;
   w.WiseSceneSources[family]=(_s,opt)=>{captured=opt;return {draw(){}};};
   try{
    const def={id:effect.id,variant_id:variant.id,duration_ms:effect.duration_ms,loop:effect.loop,default_ease:effect.default_ease,parameters:effect.parameters};
    const render=w.MotionKit.createRenderer(root,def);await render.ready;render(def.duration_ms);
    for(const [key,value]of Object.entries(variant.scene))assert.deepEqual(JSON.parse(JSON.stringify(captured[key])),value,effect.id+'/'+variant.id+' 复制丢失 '+key);
    render.destroy();
   }finally{w.WiseSceneSources[family]=original;root.replaceChildren();}
  }
 }finally{env.close();}
});
test('复制页面保存于包根目录，图片与字体仍指向包内真实文件，准备、定位与释放可完成',async()=>{
 const env=await environment();env.w.eval(await source('catalog/export.js'));
 const ids=['cat-factory-journey','xiaokui-selfie-journey','star-letter-journey','star-letter-blue-journey','window-experiment-journey'];
 try{for(const id of ids){
  const effect=data.effects.find(e=>e.id===id),variantId=effect.variants?.at(-1)?.id;
  const html=env.w.MotionExport.previewCode(effect,{variantId});
  const dom=new JSDOM(html,{url:'file:///independent-bundle/demo.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,requests=[];
  w.HTMLCanvasElement.prototype.getContext=()=>null;installSceneCanvas(w);
  for(const [key,value]of [['complete',true],['naturalWidth',1536]])Object.defineProperty(w.HTMLImageElement.prototype,key,{get:()=>value,configurable:true});
  const imageSource=Object.getOwnPropertyDescriptor(w.HTMLImageElement.prototype,'src');Object.defineProperty(w.HTMLImageElement.prototype,'src',{get:imageSource.get,set(value){imageSource.set.call(this,value);requests.push(this.src);}});
  w.HTMLImageElement.prototype.decode=()=>Promise.resolve();
  w.ResizeObserver=class{observe(){}disconnect(){}};
  try{
   for(const script of [...w.document.querySelectorAll('script')]){
    Object.defineProperty(w.document,'currentScript',{get:()=>script,configurable:true});
    if(script.src){
     const relative=new URL(script.src).pathname.replace('/independent-bundle/','');
     // 与目录检查一致：jsdom 无媒体解码能力，素材与字体使用本地绘制器核对。
     if(relative==='catalog/remotion-player.js')continue;
     w.eval(await source(relative));
    }else w.eval(script.textContent);
   }
   await w.MotionDemo.ready;w.MotionDemo.pause();w.MotionDemo.seek(effect.duration_ms);w.MotionDemo.seek(effect.preview_ms);
   assert.ok(w.document.querySelector('canvas').dataset.sourceTime,id+' 未绘制复制页面');
   const fonts=[...w.document.querySelectorAll('.scene-letter-inner style')].flatMap(s=>[...s.textContent.matchAll(/url\('([^']+)'\)/g)].map(m=>m[1]));
   assert.ok(requests.length>0,id+' 没有载入素材');if(effect.scene?.family==='letter'){
    assert.deepEqual(fonts,[
     'file:///independent-bundle/catalog/fonts/LXGWWenKai-Regular.woff2',
     'file:///independent-bundle/catalog/assets/scene-sources/letter/fonts/MaShanZheng-Regular.ttf',
    ]);
   }
   for(const url of [...requests,...fonts]){
    if(url.startsWith('data:image/webp;base64,')){
     const pixels=Buffer.from(url.slice('data:image/webp;base64,'.length),'base64');
     const originals=await Promise.all((effect.source.assets||[]).filter(file=>file.endsWith('.webp')).map(file=>readFile(new URL('../'+file,import.meta.url))));
     assert.ok(originals.some(bytes=>bytes.equals(pixels)),id+' 图片封装必须保留原字节');
    }else{
     assert.ok(url.startsWith('file:///independent-bundle/catalog/assets/scene-sources/')||url==='file:///independent-bundle/catalog/fonts/LXGWWenKai-Regular.woff2',id+' 错误素材地址 '+url);
     const relative=decodeURI(new URL(url).pathname.replace('/independent-bundle/',''));assert.ok((await stat(new URL('../'+relative,import.meta.url))).isFile(),relative+' 包内缺失');
    }
   }
   w.MotionDemo.destroy();await tick();assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{w.MotionDemo?.destroy();w.anime?.engine.pause();w.close();}
 }}finally{env.close();}
});
