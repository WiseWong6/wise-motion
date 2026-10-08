// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {build} from 'esbuild';
import {random} from 'remotion';
import {environment,data,frameMarkup} from './helpers.mjs';
import {rnd} from '../catalog/remotion/reel-extract/math.mjs';
import {botEyePose,liveBotConfetti} from '../catalog/remotion/reel-extract/aiBotExpressions.mjs';
import {garbageTrashAt,garbageBoxAt,GARBAGE_OUTPUT_COUNT} from '../catalog/remotion/reel-extract/garbageMotion.mjs';
import CUES from '../catalog/remotion/reel-extract/butterfly-cues.json' with {type:'json'};
import {exportEffect} from '../scripts/export.mjs';
import {frameScriptsFor} from '../remotion/frame-document.mjs';
const ids=['confused-characters-illustration','celebrating-characters-illustration','trash-intake-output','fall-stack-grid','curved-image-picker','masked-image-scroll','wing-root-color-reveal','character-expression-response'];
const entry=id=>data.effects.find(e=>e.id===id);
const plain=x=>JSON.parse(JSON.stringify(x));

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
  assert.equal(GARBAGE_OUTPUT_COUNT,43);
  for(const t of [23.05,23.2,23.45,23.7,24.3])for(let i=0;i<43;i++)assert.deepEqual(plain(api.garbageTrashAt(t,i,'out')),garbageTrashAt(t,i,'out'));
  assert.equal(garbageBoxAt(23.35).y,760);assert.equal(garbageBoxAt(23.52).y,460);
  const epsilon=1e-5;
  for(const [stop,target] of [[43.7,1],[43.92,2],[44.14,1]]){
   assert.ok(Math.abs(api.wheelPosition(stop,42.6,stop,target)-target*296)<1e-8);
   const brake=stop-.32,left=(api.wheelPosition(brake,42.6,stop,target)-api.wheelPosition(brake-epsilon,42.6,stop,target))/epsilon;
   const right=(api.wheelPosition(brake+epsilon,42.6,stop,target)-api.wheelPosition(brake,42.6,stop,target))/epsilon;
   assert.ok(Math.abs(left-right)<.001);
  }
 }finally{env.close();}
});

test('图片、表情、堆叠终态、连续遮罩及四翼变色均保留实际结构',async()=>{
 const env=await environment();const root=env.w.document.getElementById('root');let draw;
 const show=async(id,time,state={})=>{draw?.destroy();draw=env.w.MotionKit.createRenderer(root,entry(id));await draw.ready;draw(time,state);};
 try{
  await show(ids[0],1500);assert.equal(root.querySelectorAll('[data-bot-face]').length,6);assert.ok(root.querySelector('[data-bot-thought-cloud]'));assert.match(root.querySelector('img').src,/confused-clean-base/);
  await show(ids[1],900);assert.equal(root.querySelectorAll('[data-bot-confetti]').length,88);assert.match(root.querySelector('img').src,/open-source-clean-base/);
  await show(ids[2],1900);assert.equal(root.querySelectorAll('[data-trash-phase="out"]').length,43);assert.equal(root.querySelectorAll('[data-trash-phase="in"]').length,0);
  await show(ids[3],2500);assert.equal(root.querySelectorAll('img').length,54);for(const card of root.querySelectorAll('[data-glass-frame="small"]'))assert.equal(card.style.transform,'rotate(0deg) scale(1)');
  await show(ids[4],1700);
  const selected=()=>[...root.querySelectorAll('[data-match-title]')].filter(n=>n.parentElement.style.color==='rgb(61, 173, 128)').map(n=>n.textContent);
  assert.deepEqual(selected(),[],'原停靠时刻仍在滚动');
  draw(2200);assert.deepEqual(selected(),['绕书脊翻页']);
  draw(2640);assert.deepEqual(selected(),['绕书脊翻页','几何网点插画']);
  draw(3080);assert.deepEqual(selected(),['绕书脊翻页','几何网点插画','纸张光影']);
  draw(entry(ids[4]).duration_ms);assert.equal(selected().length,3,'末帧保留全部选择结果');
  draw(3400);assert.equal(root.querySelectorAll('[data-match-preview]').length,3,'三个选中项应沿用原片最新浅色预览');
  for(const preview of root.querySelectorAll('[data-match-preview]')){assert.equal(preview.style.width,'280px');assert.equal(preview.style.height,'157.5px');}
  for(const title of root.querySelectorAll('[data-match-title]')){assert.equal(title.style.whiteSpace,'nowrap');assert.equal(title.children.length,0);}
  await show(ids[5],5000,{elapsed:5000});assert.equal(root.querySelectorAll('clipPath').length,1);assert.equal(root.querySelector('clipPath text').textContent,'288');const last=frameMarkup(root);draw(0,{elapsed:5000});assert.equal(frameMarkup(root),last);draw(1,{elapsed:5001});assert.notEqual(frameMarkup(root),last);
  await show(ids[6],0);draw(5200);assert.ok([...root.querySelectorAll('[data-wing-variant]')].every(n=>n.style.opacity==='0'));
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
  const variants=[...root.querySelectorAll('[data-wing-variant]')];
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
  draw(5200);assert.ok(variants.every(n=>n.style.opacity==='0'),'换色后露出蓝色原图');
  draw(1000);assert.ok(variants.every(n=>n.style.opacity==='1'),'倒序定位恢复彩色');
 }finally{draw?.destroy();env.close();}
});

test('新条目声明完整依赖和素材，源码导出在独立目录可编译',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'wise-reel-export-'));
 try{
  for(const id of ids){
   const e=entry(id);assert.ok(frameScriptsFor(e).includes(e.source.path));
   if(id==='wing-root-color-reveal')assert.ok(frameScriptsFor(e).indexOf('catalog/effects/butterfly.js')<frameScriptsFor(e).indexOf(e.source.path));
   const out=await exportEffect(id,{outDir:path.join(dir,id)});
   const code=await readFile(path.join(out.directory,'src/Root.jsx'),'utf8');
   assert.doesNotMatch(code,/\/Users\/|Desktop/);for(const asset of e.source.assets)assert.ok(code.includes(asset));
   const compiled=await build({entryPoints:[path.join(out.directory,'src/index.jsx')],bundle:true,write:false,platform:'node',format:'esm',alias:{'wise-motion':path.resolve('dist/index.mjs')},external:['react','remotion'],logLevel:'silent'});
   assert.ok(compiled.outputFiles[0].text.length>0);
  }
 }finally{await rm(dir,{recursive:true,force:true});}
});
