// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data,motionTime} from './helpers.mjs';

test('主色先落位，色阶从左到右着色展开，未来内容不提前泄露',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    const effect=data.effects.find(e=>e.id==='tone-grow');
    const player=w.MotionRuntime.create(root,effect);
    const columns=[...root.querySelectorAll('.palette')];
    const tones=columns.map(c=>[...c.querySelectorAll('.palette-tones i')]);
    player.seek(motionTime(effect,250));
    assert.ok(+columns[0].querySelector('.palette-main').style.opacity>0);
    assert.equal(+columns[1].querySelector('.palette-main').style.opacity,0);
    assert.ok(tones.flat().every(t=>+t.style.opacity===0));
    player.seek(motionTime(effect,650));
    assert.ok(+tones[0][0].style.opacity>0);
    assert.ok(tones[0].slice(1).concat(tones[1]).every(t=>+t.style.opacity===0));
    assert.match(tones[0][0].style.getPropertyValue('--tone-fill'),/color-mix.*var\(--stage\)/);
    assert.match(tones[0][0].style.transform,/scaleX\(0\./);
    player.seek(effect.duration_ms);
    assert.ok(tones.flat().every(t=>t.style.transform==='scaleX(1)'));
    const complete=root.innerHTML;
    player.seek(0);player.seek(effect.duration_ms);assert.equal(root.innerHTML,complete);
    player.destroy();
  }finally{env.close();}
});

test('正式目录展示双列配色缩略图，仅包含原上半部分',async()=>{
  const env=await environment(true);
  try{
    const {w}=env,d=w.document;await env.reveal('[data-effect="tone-grow"] .thumb');
    const card=d.querySelector('[data-effect="tone-grow"]');
    assert.ok(card.querySelector('.thumb .palette-pair'));
    assert.equal(card.querySelectorAll('.palette-tones i').length,10);
    card.click();
    const scene=d.querySelector('#preview .motion-stage');
    assert.equal(scene.querySelectorAll('.palette').length,2);
    assert.deepEqual([...scene.querySelectorAll('.palette-name strong')].map(el=>el.textContent),['爱马仕橙','克莱因蓝']);
    assert.match(scene.textContent,/#D95E00/);assert.match(scene.textContent,/#002FA7/);
    assert.doesNotMatch(scene.textContent,/TWO THEMES|定义配色|用途|强调落点/);
    assert.ok(w.MotionHistory.excluded.some(e=>e.id==='row-mask'));
    assert.ok(w.MotionHistory.excluded.some(e=>e.id==='tone-grow'));
    assert.equal(w.MotionRuntime.instanceCount,1);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
