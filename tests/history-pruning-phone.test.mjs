// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {JSDOM} from 'jsdom';
import {environment,data} from './helpers.mjs';
const removed=['recovered-weave-trail','recovered-weave-grow','flow-stem-leaf','letter-wings','notes-wings','osmanthus-moving-front','cat-beans','flow-seed-shed','notes-hop','osmanthus-motion-ribbon','drive-drive','drive-wheels','flow-rabbit-bound','osmanthus-surface-flow','osmanthus-specular-flakes','snow-music-drops','snow-layered-snowfield','snow-meteor','snow-noise-fog','sunset-wave-facets','recovered-gait','recovered-press','recovered-fall-rise','recovered-turn','recovered-screen','recovered-dragon-grow','recovered-dragon-lift','recovered-dragon-away','recovered-forward-cat','recovered-forward-rabbit','cat-handle','cat-dye','cat-pucks','cat-collect','letter-beam','letter-flight','notes-camera','drive-steer','drive-depart','flight','sunset-rope-reel','sunset-swing-deploy','sunset-swing-lift','sunset-load-dip','sunset-cruise-swing','sunset-approach-ease','sunset-soft-rope','sunset-eye-open','sunset-hand-grip','sunset-water-drops','flow-tree-grow','flow-tuft-form','flow-lotus-open','flow-flower-open','recovered-neck','recovered-bow','flow-retreat-cover','shadow','disturbance','flow-wind-bend','osmanthus-bloom-clock','sunset-ripple','sunset-limb-lag','sunset-load-deform','letter-galaxy','cat-walk','recovered-weave-finish','flow-fish-escape','flow-terrain-handoff','notes-flight','recovered-drop','drive-exhaust','sunset-contrail'];
test('指定历史配方与专属案例全部剔除，织龙来源不再纳入',async()=>{
 const c={};runInNewContext(await readFile(new URL('../catalog/history-data.js',import.meta.url),'utf8'),c);const h=c.MotionHistory;
 for(const id of removed){
  assert.ok(h.excluded.some(e=>e.id===id),id);
  assert.ok(!h.recipes.some(e=>e.history_id===id),id);
  assert.ok(!h.recipes.some(e=>e.entries.some(entry=>entry.source_rule_id===id)),id);
  assert.ok(!h.recipes.some(e=>e.related_history.includes('history-'+id)),id);
 }
 assert.ok(!h.originals.sources.dragon);assert.ok(!h.originals.clips.some(e=>e.source==='dragon'));
});
test('手机插画在目录和根目录导出页面中指向同一个包内透明素材',async()=>{
 const env=await environment(true,{hash:'#selfie-phone-illustration'});
 try{
  const effect=data.effects.find(e=>e.id==='selfie-phone-illustration');const d=env.w.document;
  assert.equal(d.querySelector('[data-kind="illustration"]').getAttribute('aria-pressed'),'true');
  assert.equal(d.querySelector('#preview image').getAttribute('href'),'file:///wise-motion/catalog/assets/selfie-phone.webp');
  const html=env.w.MotionExport.code(effect);const dom=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only'});
  try{dom.window.eval(await readFile(new URL('../catalog/effects/selfie-phone.js',import.meta.url),'utf8'));
   const root=dom.window.document.getElementById('motion');const render=dom.window.MotionFactories[effect.id](root);
   const before=root.innerHTML;render(0);render(3000);assert.equal(root.innerHTML,before);
   assert.equal(root.querySelector('image').getAttribute('href'),'file:///wise-motion/catalog/assets/selfie-phone.webp');
  }finally{dom.window.close();}
  assert.ok((await stat(new URL('../catalog/assets/selfie-phone.webp',import.meta.url))).size>0);
 }finally{env.close();}
});
