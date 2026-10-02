// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {environment,data,sourceDefinition} from './helpers.mjs';

test('尺寸线保留对称展开、固定引出线、跟随斜记和过半留白，缩略图与回放完整',async()=>{
  const env=await environment(true);
  try{
    const {w}=env,d=w.document,effect=sourceDefinition(data.effects.find(e=>e.id==='dimension-line'));
    assert.equal(effect.category,'data');assert.equal(effect.loop,false);
    assert.equal(w.MotionMatch.rank(data,'尺寸标注线')[0].effect.id,effect.id);
    env.reveal();
    const card=d.querySelector('[data-effect="dimension-line"]'),thumb=card.querySelector('.thumb');
    assert.equal(thumb.querySelector('[data-part="dimension-label"]').getAttribute('opacity'),'1');
    assert.equal(thumb.querySelector('[data-part="dimension-line"]').getAttribute('d'),'M140 180H279M361 180H500');
    card.click();assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,effect.id);
    const root=d.createElement('div'),draw=w.MotionFactories[effect.id](root,w.MotionKit,effect);
    const part=id=>root.querySelector(`[data-part="dimension-${id}"]`),group=root.querySelector('[data-part="dimension"]');
    const numbers=id=>part(id).getAttribute('d').match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g).map(Number);
    const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} 与 ${expected} 不同`);
    assert.equal(group.getAttribute('stroke'),'var(--muted)');assert.equal(Number(group.getAttribute('stroke-width')),.9);
    assert.equal(Number(part('ticks').getAttribute('stroke-width')),1.3);
    assert.equal(part('label').getAttribute('font-weight'),'700');assert.equal(part('label').textContent,'240 mm');
    draw(150);assert.equal(group.getAttribute('opacity'),'0');
    for(const ms of [250,500,649,651,900,1150,3000]){
      draw(ms);
      const line=numbers('line'),ticks=numbers('ticks');
      assert.equal(part('extensions').getAttribute('d'),'M140 160V185M500 160V185');
      close(line[0]+line.at(-1),640,'两端应绕同一中心展开');
      close(ticks[0]+5,line[0]);close(ticks[4]+5,line.at(-1));
      assert.equal(ticks[1],185);assert.equal(ticks[5],185);
      const labelOpacity=Number(part('label').getAttribute('opacity'));
      if(ms<650){assert.equal(line.length,3);assert.equal(labelOpacity,0);}
      else{assert.equal(line.length,6);assert.equal(line[2],279);assert.equal(line[3],361);assert.ok(labelOpacity>0);}
    }
    draw(650);close(numbers('line')[0],230);close(numbers('line').at(-1),410);
    draw(900);const middle=root.innerHTML;draw(3000);draw(0);draw(900);assert.equal(root.innerHTML,middle);
    draw(1150);const final=root.innerHTML;draw(1800);draw(3000);draw(6000);assert.equal(root.innerHTML,final);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true});draw(3000);
    assert.equal(observer.takeRecords().length,0);observer.disconnect();
    assert.equal(root.querySelector('canvas,video,image,filter'),null);
    assert.ok(w.MotionHistory.excluded.some(e=>e.id==='naive-dim-line'));
    assert.ok(!w.MotionHistory.recipes.some(e=>e.history_id==='naive-dim-line'));
    assert.ok(w.MotionHistory.excluded.some(e=>e.id==='naive-reduction-dim'));
    assert.ok(data.effects.some(e=>e.id==='reduction-dimension'&&e.category==='data'));
    const cross=JSON.parse(await readFile(new URL('../../../state/wise-motion/history/crosswalk.json',import.meta.url),'utf8'));
    for(const file of cross.rules['naive-dim-line'].migration.files){
      assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256);
    }
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
