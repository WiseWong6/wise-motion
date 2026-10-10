// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {history,state} from '../scripts/history.mjs';
import {environment,data} from './helpers.mjs';
const {rank,describe}=createRequire(import.meta.url)('../catalog/matching.js');
const historical=await history(data);

test('改名后旧名称仍优先找到原动作，否定要求仍然有效',()=>{
  for(const effects of [data.effects,historical.recipes]){
    for(const effect of effects){
      for(const old of effect.previous_names||[]){
        assert.ok(effect.aliases.includes(old),effect.id+' 丢失旧名称');
        assert.equal(rank({effects},old)[0]?.effect.id,effect.id,old+' 匹配到了其他动作');
      }
    }
  }
  assert.equal(rank(data,'双带对向滚动后停住，不要循环')[0]?.effect.id,'dual-scroll-settle');
  assert.equal(rank(data,'逐字升入裁剪框，不要错峰').length,0);
});

test('提炼后的旧名称仍可找到标准动作，原题和各案例范围保留在审查依据中',async()=>{
  const snapshot=JSON.parse(await readFile(state+'/source-snapshot.json','utf8'));
  const crosswalk=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
  for(const [id,old,name] of [
    ['reel-char-scatter','逐字沿弧飞散','文字绕弧汇聚']
  ]){
    const original=snapshot.rules.find(r=>r.id===id),review=crosswalk.rules[id];
    const effect=data.effects.find(e=>e.id==='prompt-char-gather');
    assert.equal(original.title,old);assert.equal(effect.name,name);
    assert.equal(rank(data,old)[0]?.effect.id,effect.id);
    assert.ok(describe(effect,{},data).includes('动效说明：'+name));
    assert.equal(review.status,'excluded');assert.ok(review.patterns.includes(effect.id));
    assert.ok(original.cases.every(c=>c.end>c.start));
  }
  assert.equal(snapshot.rules.find(r=>r.id==='reel-striped-sun').title,'条纹落日');
  assert.equal(rank(data,'条纹落日')[0].effect.id,'striped-sun-rise');
  assert.ok(historical.excluded.some(r=>r.id==='reel-striped-sun'));
  const mask=snapshot.rules.find(r=>r.id==='reel-mask-transitions');
  const maskEffects=crosswalk.rules[mask.id].patterns.map(id=>data.effects.find(e=>e.id===id));
  assert.equal(mask.cases.length,8);assert.equal(maskEffects.length,8);
  assert.equal(new Set(maskEffects.map(e=>e.name)).size,8,'不能用配方总名抹掉八种转场的区别');
  assert.ok(historical.excluded.some(r=>r.id==='reel-bezier-editor'));
  const curve=data.effects.find(e=>e.id==='bezier-editor');
  for(const name of ['曲线手柄回弹定位','曲线驱动小球'])assert.ok(curve.aliases.includes(name));
});

test('旧名称搜索后，目录标题、复制标题、提示词和代码使用同一个新名称',async()=>{
  const env=await environment(true);
  try{
    const {w}=env,d=w.document,effect=data.effects.find(e=>e.id==='layout-reorder');
    let copied='';
    Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:{writeText:async text=>{copied=text;}}});
    const search=d.getElementById('search');search.value='布局重排';search.dispatchEvent(new w.Event('input'));
    await new Promise(resolve=>setTimeout(resolve,150));
    const card=d.querySelector('[data-effect="layout-reorder"]');assert.ok(card);
    assert.equal(card.querySelector('.effect-name').textContent,effect.name);
    card.click();
    assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,'layout-reorder');
    assert.equal(d.getElementById('preview-title').textContent,effect.name);
    assert.ok(d.getElementById('prompt').textContent.includes('动效说明：'+effect.name));
    assert.ok(d.getElementById('code').textContent.includes('/* '+effect.name+' · Remotion 组件示例'));
    d.getElementById('copy-title').click();await new Promise(resolve=>setTimeout(resolve,0));
    assert.equal(copied,effect.name);
    assert.equal(w.MotionRuntime.instanceCount,1);
  }finally{env.close();}
});
