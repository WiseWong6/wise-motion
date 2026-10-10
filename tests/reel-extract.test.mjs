// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {random} from 'remotion';
import {environment,data,frameMarkup} from './helpers.mjs';
import {rnd} from '../catalog/remotion/reel-extract/math.mjs';
import {botEyePose,liveBotConfetti} from '../catalog/remotion/reel-extract/aiBotExpressions.mjs';
import {garbageTrashAt,garbageBoxAt,GARBAGE_OUTPUT_COUNT} from '../catalog/remotion/reel-extract/garbageMotion.mjs';
import CUES from '../catalog/remotion/reel-extract/butterfly-cues.json' with {type:'json'};
import {exportEffect} from '../scripts/export.mjs';
import {frameScriptsFor} from '../remotion/frame-document.mjs';
import NESTED from '../catalog/remotion/reel-extract/nested-data.json' with {type:'json'};
import {installSceneCanvas} from './scene-canvas-fixture.mjs';
const ids=['confused-characters-illustration','celebrating-characters-illustration','trash-intake-output','fall-stack-grid','curved-image-picker','masked-image-scroll','wing-root-color-reveal','character-expression-response'];
const entry=id=>data.effects.find(e=>e.id===id);
const plain=x=>JSON.parse(JSON.stringify(x));
const butterflyFixture=JSON.parse(await readFile(new URL('./reel-butterfly-fixture.json',import.meta.url),'utf8'));
const garbageFixture=JSON.parse(await readFile(new URL('./reel-garbage-fixture.json',import.meta.url),'utf8'));

test('蝴蝶显现、换色、转身与飞行的状态逐项符合新版原工程样本',async()=>{
 const env=await environment();
 try{
  for(const sample of [...butterflyFixture.samples,...butterflyFixture.samples.toReversed()])
   assert.deepEqual(plain(env.w.WiseReelExtract.tasteButterflyState(sample.time)),sample.state,'原工程时间 '+sample.time);
  assert.ok(CUES.enter<CUES.entered&&CUES.entered<CUES.chosen);
  assert.ok(entry('wing-root-color-reveal').duration_ms/1000+CUES.enter>=CUES.flightEnd);
 }finally{env.close();}
});

test('三组数字均固定绑定原素材，内部连续播放且支持倒序定位',async()=>{
 const env=await environment(),root=env.w.document.getElementById('root');
 try{
  for(const kind of ['action','composition','illustration']){
   const definition=env.w.MotionKit.resolveVariant(entry('masked-image-scroll'),kind);
   const draw=env.w.MotionKit.createRenderer(root,definition);await draw.ready;
   try{
    const items=NESTED.fills[kind].items;
    assert.equal([...root.querySelectorAll('clipPath text')].map(n=>n.textContent).join(''),NESTED.counts[kind]);
    assert.equal(root.querySelectorAll('[data-actual-effect]').length,items.length);
    for(const time of [1300,2800,5000,0,1300]){
     draw(time,{elapsed:time});
     for(const [i,node] of [...root.querySelectorAll('[data-number-fill]')].entries()){
      const item=items[i],nested=NESTED.definitions[item.definitionId||item.id];
      assert.equal(node.dataset.numberFill,item.id);
      assert.ok(Math.abs(Number(node.dataset.numberTime)-Math.min(nested.duration_ms,item.offset+time*item.speed))<1e-8);
      assert.ok(node.querySelector('.motion-stage').children.length,'数字内必须有真实绘制内容');
      assert.equal(node.querySelector('.motion-stage').style.getPropertyValue('--stage'),'#0a0a0b');
     }
     for(const text of root.querySelectorAll('clipPath text')){assert.equal(text.closest('svg').style.width,'1080px');assert.equal(text.closest('svg').style.height,'1440px');}
    }
    const first=frameMarkup(root);draw(0,{elapsed:8000});draw(1300);assert.equal(frameMarkup(root),first,'父时间不会累积进子画面');
   }finally{draw.destroy();}
  }
 }finally{env.close();}
});

test('真实子画面只靠所选示例声明的源码即可创建，销毁后释放全部子实例',async()=>{
 for(const id of ['curved-image-picker','masked-image-scroll']){
  for(const variant of entry(id).variants||[{}]){
   const definition={...entry(id),...variant,variant_id:variant.id},dom=new JSDOM('<div id="root"></div>',{url:'file:///wise-motion/catalog/index.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
   let draw;
   try{
    w.HTMLCanvasElement.prototype.getContext=()=>null;installSceneCanvas(w);
    Object.defineProperty(w.HTMLImageElement.prototype,'complete',{get:()=>true});Object.defineProperty(w.HTMLImageElement.prototype,'naturalWidth',{get:()=>1536});w.HTMLImageElement.prototype.decode=()=>Promise.resolve();
    for(const file of frameScriptsFor(definition))w.eval(await readFile(new URL('../'+file,import.meta.url),'utf8'));
    const original=w.MotionKit.createRenderer,children=[];
    w.MotionKit.createRenderer=(root,definition)=>{const child=original(root,definition),destroy=child.destroy;let count=0;child.destroy=(...args)=>{count++;return destroy?.(...args);};children.push(()=>count);return child;};
    const root=w.document.getElementById('root');draw=original(root,definition);await draw.ready;draw(definition.duration_ms);draw(0);draw.destroy();draw.destroy();
    assert.ok(children.length>0);assert.ok(children.every(count=>count()===1),'每个实际子画面都应销毁一次');assert.equal(root.childNodes.length,0);
   }finally{draw?.destroy();w.anime?.engine.pause();w.close();}
  }
 }
});

test('绿色蝴蝶是独立插画，蓝绿动作使用各自图集，投影和飞行线跟随同一状态',async()=>{
 const env=await environment(),root=env.w.document.getElementById('root');
 try{
  const examples=[['butterfly-illustration',undefined,'blue'],['sage-butterfly-illustration',undefined,'sage'],
   ...['hinged-wing-flap','wing-root-color-reveal'].flatMap(id=>['blue','sage'].map(variant=>[id,variant,variant]))];
  for(const [id,variantId,variant] of examples){
    const definition=env.w.MotionKit.resolveVariant(entry(id),variantId),draw=env.w.MotionKit.createRenderer(root,definition);await draw.ready;
    try{
     draw(id==='wing-root-color-reveal'?definition.duration_ms:1200);
     const host=id==='wing-root-color-reveal'?root.querySelector('[data-taste-butterfly]'):root;
     assert.ok([...host.querySelectorAll('img')].some(n=>n.src.endsWith(variant==='sage'?'sage-watercolor-wing-atlas.webp':'/wing-atlas.webp')));
     assert.ok([...host.querySelectorAll('img')].every(n=>!n.src.includes(variant==='sage'?'/wing-atlas.webp':'sage-watercolor-wing-atlas.webp')));
     if(id==='wing-root-color-reveal'){
      const state=env.w.WiseReelExtract.tasteButterflyState(CUES.enter+definition.duration_ms/1000),shadow=root.querySelector('[data-taste-shadow]'),line=root.querySelector('[data-taste-flight-line]');
      assert.equal(shadow.style.opacity,String(state.entered*.19));assert.equal(shadow.style.filter,'brightness(0) blur(16px)');
      assert.equal(line.getAttribute('opacity'),String(state.selection*.62));assert.equal(line.getAttribute('stroke-dasharray'),`${state.selection} 1`);
      assert.equal(shadow.querySelector('[data-part="left-fore"]').style.transform,host.querySelector('[data-part="left-fore"]').style.transform);
      const atlas=await readFile(new URL('../catalog/assets/butterfly/'+(variant==='sage'?'sage-watercolor-wing-atlas.webp':'wing-atlas.webp'),import.meta.url));
      for(const wing of root.querySelectorAll('[data-wing-variant]')){
       const encoded=wing.style.maskImage.match(/base64,([A-Za-z0-9+/=]+)/)[1];
       assert.ok(Buffer.from(encoded,'base64').equals(atlas),'实际蝶翼和投影均须使用所选图集的透明轮廓');
      }
     }
    }finally{draw.destroy();}
  }
 }finally{env.close();}
});

test('蓝绿蝴蝶是两个目录入口，无配色下拉框；绿蝶关联动作与复制页面保留绿色',async()=>{
 const controllers=[];
 const env=await environment(true,{staticPreview:true,hash:'#sage-butterfly-illustration',beforeApp:w=>{
  const create=w.MotionRuntime.create;w.MotionRuntime.create=(...args)=>{const controller=create(...args);controllers.push(controller);return controller;};
 }});
 try{
  const w=env.w,d=w.document;
  for(const id of ['butterfly-illustration','sage-butterfly-illustration']){
   assert.ok(d.querySelector(`[data-effect="${id}"]`),'目录须直接展示两种蝴蝶');
   d.querySelector(`[data-effect="${id}"]`).click();
   assert.equal(d.getElementById('effect-variant-field').hidden,true,'蝴蝶插画无需通过下拉框选颜色');
  }
  await controllers.at(-1).ready;
  const scrub=d.getElementById('scrub'),art=entry('sage-butterfly-illustration');scrub.value=1000*art.preview_ms/art.duration_ms;scrub.dispatchEvent(new w.Event('input'));
  assert.ok([...d.querySelectorAll('#preview img')].every(n=>n.src.endsWith('sage-watercolor-wing-atlas.webp')));
  const html=w.MotionExport.previewCode(art);assert.ok(html.includes('sage-butterfly-illustration'));
  const copy=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true});
  copy.window.ResizeObserver=class{observe(){}disconnect(){}};
  try{
   for(const script of copy.window.document.querySelectorAll('script'))copy.window.eval(script.src
    ?await readFile(new URL('../'+script.getAttribute('src'),import.meta.url),'utf8'):script.textContent);
   const images=[...copy.window.document.querySelectorAll('.motion-stage img')];
   assert.ok(images.length>0);assert.ok(images.every(n=>n.src.endsWith('sage-watercolor-wing-atlas.webp')));
  }finally{copy.window.MotionRuntime?.disposeAll();copy.window.anime?.engine.pause();copy.window.close();}
  const before=frameMarkup(d.getElementById('preview'));
  for(const id of ['hinged-wing-flap','wing-root-color-reveal']){
   d.querySelector(`#related [data-related="${id}"]`).click();
   assert.equal(d.getElementById('related-variant').value,'sage');
   d.getElementById('related-close').click();assert.equal(frameMarkup(d.getElementById('preview')),before);
  }
 }finally{env.close();}
});

test('八项全部可定位、倒序重播、独立创建并安全销毁，缩略图保留最终节点',async()=>{
 const env=await environment();
 try{
  for(const id of ids){
   const definition=entry(id);
   for(const variant of definition.variants||[{}]){
    const resolved=env.w.MotionKit.resolveVariant(definition,variant.id);
    const root=env.w.document.createElement('div');env.w.document.body.append(root);
    const draw=env.w.MotionKit.createRenderer(root,resolved);await draw.ready;
    draw(resolved.preview_ms,{elapsed:resolved.preview_ms});const initial=frameMarkup(root);
    assert.ok(root.children.length,id);
    assert.doesNotMatch(root.innerHTML.replace(/data:image\/webp;base64,[A-Za-z0-9+/=]+/g,'embedded-webp'),/NaN|undefinedpx|Infinity/);
    draw(resolved.duration_ms,{elapsed:resolved.duration_ms});draw(0,{elapsed:0});
    draw(resolved.preview_ms,{elapsed:resolved.preview_ms});assert.equal(frameMarkup(root),initial,id+'/'+variant.id);
    const second=env.w.document.createElement('div');env.w.document.body.append(second);
    const other=env.w.MotionKit.createRenderer(second,resolved);await other.ready;other(0);
    assert.equal(frameMarkup(root),initial,'其他实例不能改动首个实例');other.destroy();second.remove();
    draw.destroy(true);assert.equal(frameMarkup(root),initial,'静态缩略图应保留');draw(0);draw.destroy(true);
    assert.equal(frameMarkup(root),initial);root.remove();
   }
  }
 }finally{env.close();}
});

test('随机下落、表情与垃圾保留原公式，滚轮准确停靠且制动速度连续',async()=>{
 for(const seed of ['ga','px','py','pr'])for(let i=0;i<54;i++)assert.equal(rnd(seed,i),random(`${seed}-${i}`));
 const env=await environment();
 try{
  const api=env.w.WiseReelExtract;
  for(const t of [12.85,13.41,14.55,46.25,46.9,47.7]){
   for(const mood of ['confused','happy'])for(let i=0;i<6;i++)assert.deepEqual(plain(api.botEyePose(t,mood,i)),botEyePose(t,mood,i));
   assert.deepEqual(plain(api.liveBotConfetti(t)),liveBotConfetti(t));
  }
  assert.equal(GARBAGE_OUTPUT_COUNT,61);
  assert.equal(GARBAGE_OUTPUT_COUNT,garbageFixture.outputCount);
  for(const sample of [...garbageFixture.samples,...garbageFixture.samples.toReversed()]){
   assert.deepEqual(garbageTrashAt(sample.time,sample.index,sample.phase),sample.state,'源码与原工程样本一致');
   assert.deepEqual(plain(api.garbageTrashAt(sample.time,sample.index,sample.phase)),sample.state,'分发绘制与原工程样本一致');
  }
  for(const sample of garbageFixture.box)assert.deepEqual(plain(api.garbageBoxAt(sample.time)),sample.state);
  assert.equal(garbageBoxAt(23.35).y,760);assert.equal(garbageBoxAt(23.52).y,300);
  const epsilon=1e-5;
  for(const [stop,target] of [[43.7,1],[43.92,2],[44.14,1]]){
   assert.ok(Math.abs(api.wheelPosition(stop,42.6,stop,target)-target*296)<1e-8);
   const brake=stop-.32,left=(api.wheelPosition(brake,42.6,stop,target)-api.wheelPosition(brake-epsilon,42.6,stop,target))/epsilon;
   const right=(api.wheelPosition(brake+epsilon,42.6,stop,target)-api.wheelPosition(brake,42.6,stop,target))/epsilon;
   assert.ok(Math.abs(left-right)<.001);
  }
 }finally{env.close();}
});

test('人物分层、堆叠终态、真实书本预览及四翼变色均保留实际结构',async()=>{
 const env=await environment();const root=env.w.document.getElementById('root');let draw;
 const show=async(id,time,state={})=>{draw?.destroy();draw=env.w.MotionKit.createRenderer(root,entry(id));await draw.ready;draw(time,state);};
 try{
  await show(ids[0],1500);assert.deepEqual([...root.querySelectorAll('[data-ai-depth]')].map(n=>n.dataset.aiDepth),['back','deepseek','glm','gpt']);
  for(const layer of root.querySelectorAll('[data-ai-depth]'))assert.equal(layer.querySelectorAll('[data-bot-face]').length,6,'表情应跟随分层人物');
  assert.ok(root.querySelector('[data-bot-thought-cloud]'));assert.match(root.querySelector('img').src,/confused-clean-base/);
  await show(ids[1],900);assert.equal(root.querySelectorAll('[data-bot-confetti]').length,62);assert.match(root.querySelector('img').src,/open-source-clean-base/);
  await show(ids[2],1900);assert.equal(root.querySelectorAll('[data-trash-phase="out"]').length,61);assert.equal(root.querySelectorAll('[data-trash-phase="in"]').length,0);assert.doesNotMatch(root.textContent,/垃圾出/);
  assert.equal(root.querySelectorAll('div[aria-hidden="true"]').length,0,'新版不保留绿色光晕与漂浮光点');
  for(const image of root.querySelectorAll('[data-trash-phase="out"]'))assert.match(image.style.filter,/^blur\(0px\) drop-shadow/,'碎物仅保留投影，不使用前景模糊');
  await show(ids[3],2500);assert.equal(root.querySelectorAll('img').length,54);
  const cards=[...root.querySelectorAll('[data-catalog-slot]')],visible=cards.filter(n=>n.style.opacity==='1');
  assert.equal(visible.length,20);assert.equal(new Set(visible.map(n=>n.style.left)).size,4);assert.equal(new Set(visible.map(n=>n.style.top)).size,5);
  for(const card of cards){assert.equal(card.style.transform,'rotate(0deg) scale(1)');if(Number(card.dataset.catalogSlot)<0)assert.equal(card.style.opacity,'0');}
  await show(ids[4],1700);
  const selected=()=>[...root.querySelectorAll('[data-match-title]')].filter(n=>n.parentElement.style.color==='rgb(61, 173, 128)').map(n=>n.textContent);
  assert.deepEqual(selected(),[],'原停靠时刻仍在滚动');
  draw(2200);assert.deepEqual(selected(),['绕书脊翻页']);
  draw(2640);assert.deepEqual(selected(),['绕书脊翻页','几何网点插画']);
  draw(3080);assert.deepEqual(selected(),['绕书脊翻页','几何网点插画','纸张光影']);
  draw(entry(ids[4]).duration_ms);assert.equal(selected().length,3,'末帧保留全部选择结果');
  draw(3400);assert.equal(root.querySelectorAll('[data-match-preview]').length,3,'三个选中项应沿用原片最新浅色预览');
  assert.equal(root.querySelector('[data-match-lighting] svg').style.width,'1080px');assert.equal(root.querySelector('[data-match-lighting] svg').style.height,'1440px');
  for(const preview of root.querySelectorAll('[data-match-preview]')){assert.equal(preview.style.width,'280px');assert.equal(preview.style.height,'157.5px');assert.ok(preview.querySelector('.wm-book'));assert.equal(preview.querySelector('.motion-stage').style.getPropertyValue('--card'),'#fdfbf7');}
  for(const title of root.querySelectorAll('[data-match-title]')){assert.equal(title.style.whiteSpace,'nowrap');assert.equal(title.children.length,0);assert.equal(title.style.fontSize,'24px');}
  await show(ids[6],0);draw(entry(ids[6]).duration_ms);assert.ok([...root.querySelectorAll('[data-wing-variant]')].every(n=>n.style.opacity==='0'));
  const api=env.w.WiseReelExtract;
  assert.ok(api.tasteButterflyState(CUES.chosen-.01).wingSelections.every(v=>v===0));
  assert.ok(api.tasteButterflyState(CUES.chosen+.5).wingSelections.every(v=>v===1));
  const mid=api.tasteButterflyState(CUES.chosen+.02).wingSelections;assert.ok(mid[2]>mid[0]);
 }finally{draw?.destroy();env.close();}
});

test('新图片读取失败时明确报错，销毁后不会重建画面',async()=>{
 const env=await environment(false,{realImagePreparation:true});
 try{
  const doc=env.w.document,create=doc.createElement.bind(doc);let images=[];
  doc.createElement=(...args)=>{const node=create(...args);if(args[0]==='img')images.push(node);return node;};
  const root=doc.getElementById('root'),draw=env.w.MotionKit.createRenderer(root,entry(ids[0]));
  assert.ok(images.length);images[0].dispatchEvent(new env.w.Event('error'));
  await assert.rejects(draw.ready,/无法载入收录素材/);draw.destroy();draw(2000);assert.equal(root.childNodes.length,0);
 }finally{env.close();}
});

test('彩色蝶翼使用原图内嵌遮罩，支持本地直开并保留由彩到蓝的阶段',async()=>{
 const env=await environment();const root=env.w.document.getElementById('root');let draw;
 try{
  draw=env.w.MotionKit.createRenderer(root,entry('wing-root-color-reveal'));await draw.ready;
  draw(1000);
  const variants=[...root.querySelectorAll('[data-taste-butterfly] [data-wing-variant]')];
  assert.equal(variants.length,4);
  const atlas=await readFile(new URL('../catalog/assets/butterfly/wing-atlas.webp',import.meta.url));
  for(const wing of variants){
   assert.equal(wing.style.opacity,'1','换色前彩色层必须可见');
   const encoded=wing.style.maskImage.match(/^url\(["']?data:image\/webp;base64,([A-Za-z0-9+/=]+)["']?\)$/);
   assert.ok(encoded,'本地直开不能把文件地址用作图片遮罩');
   assert.ok(Buffer.from(encoded[1],'base64').equals(atlas),'遮罩保留原图全部字节');
   assert.match(wing.querySelector('img').src,/ai-wing-atlas\.webp$/);
  }
  draw((CUES.chosen-CUES.enter+.17)*1000);
  assert.ok([...root.querySelectorAll('[data-wing-reveal]')].every(n=>n.style.display==='block'));
  draw(entry('wing-root-color-reveal').duration_ms);assert.ok(variants.every(n=>n.style.opacity==='0'),'换色后露出蓝色原图');
  draw(1000);assert.ok(variants.every(n=>n.style.opacity==='1'),'倒序定位恢复彩色');
 }finally{draw?.destroy();env.close();}
});

test('新条目及新配色声明完整依赖和素材，源码导出在独立目录可编译',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'wise-reel-export-'));
 try{
  for(const [id,variantId] of ids.flatMap(id=>(entry(id).variants||[{}]).map(v=>[id,v.id])).concat([['sage-butterfly-illustration',undefined],['hinged-wing-flap','sage']])){
   const definition=entry(id),variant=definition.variants?.find(v=>v.id===variantId),e={...definition,...variant};assert.ok(frameScriptsFor(e).includes(e.source.path));
   if(id==='wing-root-color-reveal')assert.ok(frameScriptsFor(e).indexOf('catalog/effects/butterfly.js')<frameScriptsFor(e).indexOf(e.source.path));
   const out=await exportEffect(id,{variantId,outDir:path.join(dir,id+(variantId?'-'+variantId:''))});
   const code=await readFile(path.join(out.directory,'src/Root.jsx'),'utf8');
   assert.doesNotMatch(code,/\/Users\/|Desktop/);for(const asset of e.source.assets)assert.ok(code.includes(asset));
   const compiled=await build({entryPoints:[path.join(out.directory,'src/index.jsx')],bundle:true,write:false,platform:'node',format:'esm',alias:{'wise-motion':path.resolve('dist/index.mjs')},external:['react','remotion'],logLevel:'silent'});
   assert.ok(compiled.outputFiles[0].text.length>0);
  }
 }finally{await rm(dir,{recursive:true,force:true});}
});
