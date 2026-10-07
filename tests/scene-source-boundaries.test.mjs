import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {frameScriptsFor} from '../remotion/frame-document.mjs';
import {installSceneCanvas} from './scene-canvas-fixture.mjs';
const data=JSON.parse(await readFile(new URL('../catalog/registry.json',import.meta.url),'utf8'));
const selected=data.effects.filter(e=>e.scene||['encore-full-journey','ring-construction','ring-construction-journey','energy-density-growth','energy-discharge-journey','mushroom-sphere-idealize','mushroom-sphere-journey','ring-sphere-journey'].includes(e.id));
const cache=new Map();async function source(path){if(!cache.has(path))cache.set(path,await readFile(new URL('../'+path,import.meta.url),'utf8'));return cache.get(path);}
test('新收录条目仅依赖自身声明的源码和本地素材，独立画面可准备并定位',async()=>{
 for(const effect of selected){
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'file:///wise-motion/catalog/index.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
  w.HTMLCanvasElement.prototype.getContext=()=>null;installSceneCanvas(w);
  for(const [name,value]of [['complete',true],['naturalWidth',1536]])Object.defineProperty(w.HTMLImageElement.prototype,name,{get:()=>value,configurable:true});
  w.HTMLImageElement.prototype.decode=()=>Promise.resolve();w.ResizeObserver=class{observe(){}disconnect(){}};
  let render;
  try{
   for(const path of frameScriptsFor(effect))w.eval(await source(path));
   const root=w.document.getElementById('root');render=w.MotionKit.createRenderer(root,effect);render(effect.preview_ms);await render.ready;render(effect.duration_ms);render(effect.preview_ms);
   assert.ok(root.querySelector('canvas,path'),effect.name+' 无绘制主体');assert.doesNotMatch(root.innerHTML,/NaN|Infinity/,effect.name+' 坐标无效');
   if(effect.scene)assert.ok(root.querySelector('canvas').dataset.sourceTime,effect.name+' 指定时间未生效');
  }catch(error){throw new Error(effect.name+' 独立使用失败：'+error.message,{cause:error});}
  finally{render?.destroy?.();w.anime?.engine.pause();w.close();}
 }
});
