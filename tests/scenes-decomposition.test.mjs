// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data} from './helpers.mjs';
const ids=['dandelion-wind-journey','balloon-drive-journey','cat-factory-journey','shenzhen-snow-journey','sunset-pickup-journey','osmanthus-butterfly-journey','star-letter-journey','xiaokui-selfie-journey','encore-full-journey','ring-construction-journey','mushroom-sphere-journey','ring-sphere-journey','energy-discharge-journey','ink-ocean-journey'];
test('十四个组合的拆解按钮对应真实画面节点，选择、回拖和恢复不替换主播放器',async()=>{
 const env=await environment(),{w}=env,d=w.document;
 d.body.insertAdjacentHTML('beforeend','<div id="composition-panel"><div id="composition-layers"></div><div id="composition-status"></div><div id="composition-detail"></div><button data-composition-mode="solo"></button><button data-composition-mode="stack"></button><button id="composition-full"></button><button id="composition-replay"></button></div><div id="preview"></div>');
 w.eval(await readFile(new URL('../catalog/composition-controls.js',import.meta.url),'utf8'));
 try{for(const id of ids){
  const def=data.effects.find(e=>e.id===id),root=d.getElementById('preview');let draw;
  try{
   draw=w.MotionKit.createRenderer(root,def);draw(def.preview_ms);await draw.ready;draw(def.preview_ms);
   const parts=w.MotionFactories[id].breakdown;assert.ok(parts.length>=2,id+' 未拆分');
   const used=new Set(parts.flatMap(p=>p.actions));assert.deepEqual([...used].sort(),[...new Set(def.actions)].sort(),id+' 组成动作遗漏');
   for(const part of parts)assert.ok(root.querySelector(`[data-layer="${part.id}"]`),id+' 缺少真实组成部分 '+part.name);
   const controller={stage:root,currentTime:def.preview_ms,destroyed:false,pause(){},restart(){draw(0);}};
   w.MotionComposition.select(def,controller);d.querySelector('[data-composition-mode="solo"]').click();
   const actualNodes=[...root.querySelectorAll('[data-layer]')];
   for(const part of parts){
    d.querySelector(`[data-composition-layer="${part.id}"]`).click();
    for(const node of actualNodes){const hidden=node.namespaceURI==='http://www.w3.org/2000/svg'?node.getAttribute('display')==='none':node.hasAttribute('data-composition-hidden');assert.equal(hidden,node.dataset.layer!==part.id,id+' 未隔离实际画面');}
    draw(part.start);draw(Math.min(def.duration_ms,part.end));draw(def.preview_ms);
    assert.ok(actualNodes.every(n=>root.contains(n)),id+' 定位替换了组成节点，导致隐藏状态失效');
   }
   d.getElementById('composition-full').click();assert.ok(actualNodes.every(n=>!n.hasAttribute('data-composition-hidden')&&n.getAttribute('display')!=='none'));
   assert.equal(w.MotionRuntime.instanceCount,0,id+' 拆解另外创建播放器');
  }finally{draw?.destroy?.();root.replaceChildren();}
 }}finally{env.close();}
});
