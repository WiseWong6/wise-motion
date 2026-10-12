// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';
import {resolveEffect,getEffectMetadata} from '../remotion/clock.mjs';
import {frameScriptsFor} from '../remotion/frame-document.mjs';

const paths=root=>[...root.querySelectorAll('[data-part="art"] path')].map(p=>[p.dataset.part,p.getAttribute('d'),p.getAttribute('stroke-width'),p.getAttribute('opacity')]);

test('粒子上升翻卷基础两倍速，气柱在云帽下方可见，倒序定位和末帧一致',async()=>{
 const env=await environment();try{
  const {w}=env,action=resolveEffect('plume-rise-curl'),art=resolveEffect('mushroom-cloud-illustration');
  assert.equal(action.duration_ms,1500);assert.equal(getEffectMetadata(action.id).durationInFrames,91);
  const root=w.document.getElementById('root'),original=w.document.createElement('div');
  const draw=w.MotionKit.createRenderer(root,action),reference=w.MotionKit.createRenderer(original,art);
  for(const time of [50,150,650,1300,1500,650,150]){
   draw(time);reference(time*2);assert.deepEqual(paths(root),paths(original));
   const stem=[...root.querySelectorAll('[data-part^="plume-stem-"]')].filter(p=>Number(p.getAttribute('opacity'))>0);
   const lower=stem.flatMap(p=>[...p.getAttribute('d').matchAll(/M(-?[\d.]+) (-?[\d.]+)/g)]).filter(m=>Number(m[2])>1000&&Number(m[2])<1462.5);
   assert.ok(lower.length>200,'气柱有足够粒子位于云帽下方且落在画板内');
   assert.ok(stem.every(p=>Number(p.getAttribute('stroke-width'))*.32>=.8),'缩小后的粒点仍可辨认');
  }
  draw(1300);const end=paths(root);draw(1500);assert.deepEqual(paths(root),end);
  draw.destroy();reference.destroy();
 }finally{env.close();}
});

test('套印与撞入合并后各示例仍可独立定位，旧套印书签和来源依赖准确',async()=>{
 const merged=data.effects.find(e=>e.id==='word-slam');
 assert.deepEqual(merged.variants.map(v=>v.id),['original','pixel-motion','overprint']);
 assert.equal(data.effects.some(e=>e.id==='ghost-type-overprint'),false);
 const overprint=resolveEffect(merged.id,'overprint');
 assert.equal(overprint.duration_ms,3000);assert.equal(overprint.timing,null);assert.deepEqual(overprint.content_slots,[]);
 assert.ok(frameScriptsFor(overprint).includes('catalog/effects/reel-grit-key.js'));
 const env=await environment(true,{hash:'#ghost-type-overprint',staticPreview:true});try{
  const {w}=env,d=w.document;
  assert.equal(d.querySelector('.effect-item[aria-current="true"]').dataset.effect,merged.id);
  assert.equal(d.getElementById('effect-variant').value,'overprint');
  assert.equal(d.querySelectorAll('#preview [data-print]').length,3);
  const root=w.document.createElement('div'),draw=w.MotionKit.createRenderer(root,overprint);
  draw(1250);const frame=root.innerHTML;draw(0);draw(2999);draw(1250);assert.equal(root.innerHTML,frame);draw.destroy?.();
 }finally{env.close();}
});
