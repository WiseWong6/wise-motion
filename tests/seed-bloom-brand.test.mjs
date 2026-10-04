// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {JSDOM} from 'jsdom';
import {Canvas,digest,reset} from './seed-bloom-recorder.mjs';
const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
const source=await read('catalog/effects/seed-bloom-brand.js');
const registry=JSON.parse(await read('catalog/registry.json'));
const entries=registry.effects.filter(e=>e.source.path==='catalog/effects/seed-bloom-brand.js');
const accepted=JSON.parse(await read('tests/fixtures/seed-bloom-brand-accepted.json'));
const scope={document:{createElement:()=>new Canvas()}};runInNewContext(source,scope);
const create=()=>{const canvas=new Canvas();canvas.width=2132;canvas.height=1200;return {canvas,engine:scope.WiseSeedBloom.createEngine(canvas)};};
function frame(pair,t){reset();pair.engine.render(t);return digest(pair.canvas);}

test('已确认品牌片基线保持，倒序、多实例和末尾静止不会串色或改变画面',()=>{
 const a=create(),b=create();
 try{
  for(const [f,hash]of accepted)assert.equal(frame(a,f/60),hash,'原版帧 '+f);
  for(const [f,hash]of [...accepted].reverse()){
   frame(b,(492-f)/60);assert.equal(frame(a,f/60),hash,'倒序帧 '+f);
  }
  assert.equal(frame(a,7.2),frame(a,8.2));
  const brand=a.engine.brand;
  assert.equal(brand.accent(576).y+brand.style.dotRadius,300+brand.style.capHeight/2);
  assert.equal(a.engine.sun.corona(a.engine.sun.state(5,1,96)).length,16);
  assert.equal(a.engine.morph.COUNT,96);
  assert.equal(a.engine.film.duration,8.2);
 }finally{a.engine.dispose();b.engine.dispose();}
});

test('四个独立动作只调用各自绘制；分层可恢复，销毁后不会再次绘制',()=>{
 const a=create();
 try{
  for(const e of entries.filter(e=>e.kind==='action')){
   reset();a.engine.drawAction(e.id,e.preview_ms/1000);const expected=digest(a.canvas);
   reset();a.engine.drawAction(e.id,0);reset();a.engine.drawAction(e.id,e.preview_ms/1000);assert.equal(digest(a.canvas),expected);
   assert.notEqual(expected,frame(a,e.preview_ms/1000),'独立动作不等于从头播放完整组合');
  }
  const full=frame(a,3);reset();a.engine.render(3,new Set(['sun']));assert.notEqual(digest(a.canvas),full);assert.equal(frame(a,3),full);
  a.engine.dispose();reset();a.engine.render(3);assert.equal(a.canvas.context.commands.length,0);
  assert.doesNotMatch(source,/requestAnimationFrame|setInterval|Math\.random|\/Users\//);
 }finally{a.engine.dispose();}
});

async function environment(){
 const dom=new JSDOM('<div id="root"></div>',{url:'file:///wise-motion/catalog/index.html',runScripts:'outside-only'}),w=dom.window;
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 for(const file of ['catalog/runtime.js','catalog/matching.js','catalog/remotion-sources.js','catalog/effects/seed-bloom-brand.js','catalog/export.js'])w.eval(await read(file));
 return {dom,w};
}

test('收录可搜索，复制提供完整逐帧工程，预览页继续可静态直开',async()=>{
 const {dom,w}=await environment();try{
  assert.equal(entries.length,5);
  assert.equal(w.MotionMatch.rank(registry,'完整品牌动效')[0].effect.id,'seed-bloom-brand-sequence');
  for(const e of entries){
   const code=w.MotionExport.code(e,{speed:1.25}),prompt=w.MotionExport.prompt(e,{speed:1.25},registry);
   assert.match(code,/## package.json/);assert.match(code,/## index.jsx/);assert.match(code,/useCurrentFrame/);assert.match(code,/Outfit Medium/);
   assert.ok(code.includes(source));assert.doesNotMatch(code,/\/Users\/|file:\/\/|<iframe|requestAnimationFrame/);
   assert.match(prompt,/请使用 Remotion/);assert.doesNotMatch(prompt,/Oswald|本机|验收|AGPL/);
   const html=w.MotionExport.previewCode(e);assert.match(html,/<script src="catalog\/effects\/seed-bloom-brand.js">/);assert.match(html,/player.play\(\)/);
   const root=w.document.createElement('div'),render=w.MotionFactories[e.id](root,w.MotionKit,e);await render.ready;
   render(e.preview_ms);assert.equal(Number(root.firstChild.dataset.time),e.preview_ms);
   assert.equal(root.querySelectorAll('[data-layer]').length,e.kind==='composition'?5:0);
   const canvas=root.querySelector('canvas');render.destroy(true);assert.equal(canvas.width,2132,'缩略图保留最后画面');
  }
 }finally{dom.window.close();}
});
