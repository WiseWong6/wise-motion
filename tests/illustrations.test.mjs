// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {environment, data} from './helpers.mjs';

test('插画单图独立计数、筛选和搜索，直达链接切到插画目录', async () => {
  const env = await environment(true, {hash:'#rasengan-illustration'});
  try {
    const {w} = env, d = w.document;
    const art = data.effects.filter(e=>e.kind==='illustration');
    const tab = d.querySelector('[data-kind="illustration"]');
    assert.equal(art.length, 53);
    assert.equal(tab.getAttribute('aria-pressed'), 'true');
    assert.equal(tab.querySelector('.pill-count').textContent, String(art.length));
    assert.equal(d.querySelector('.effect-item[aria-current="true"]').dataset.effect, 'rasengan-illustration');
    assert.equal(d.querySelectorAll('.effect-item').length, art.length);
    assert.ok([...d.querySelectorAll('.effect-item')].every(card=>art.some(e=>e.id===card.dataset.effect)));
    const filter = d.getElementById('category-filter'), search = d.getElementById('search');
    assert.equal(filter.title, '全部插画');
    filter.value = 'illustration-object'; filter.dispatchEvent(new w.Event('change'));
    search.value = '螺旋丸'; search.dispatchEvent(new w.Event('input'));
    await new Promise(resolve=>setTimeout(resolve,160));
    assert.equal(filter.value, 'all');
    assert.ok(d.querySelector('[data-effect="rasengan-illustration"]'));
    d.getElementById('search-clear').click();
    d.querySelector('[data-kind="action"]').click();
    assert.equal(d.querySelectorAll('.effect-item').length, data.effects.filter(e=>e.kind==='action').length);
    assert.equal(d.querySelectorAll('[data-group^="illustration-"]').length, 0);
    assert.equal(d.querySelectorAll('#category-options [data-value^="illustration-"]').length, 0);
    assert.ok(!d.querySelector('#effects-list [data-effect="rasengan-illustration"]'));
    assert.equal(w.MotionRuntime.instanceCount, 1);
  } finally { env.close(); }
});

test('插画正式入口加载全部独立图形，缩略图可生成并可切换播放', async () => {
  const env = await environment(true);
  try {
    const {w} = env, d = w.document;
    d.querySelector('[data-kind="illustration"]').click();
    const filter = d.getElementById('category-filter');
    const cards=[];
    for(const category of ['illustration-nature','illustration-diagram','illustration-object']){
      filter.value=category;filter.dispatchEvent(new w.Event('change'));env.reveal();
      cards.push(...d.querySelectorAll('.effect-item'));
    }
    filter.value='all';filter.dispatchEvent(new w.Event('change'));env.reveal();
    assert.equal(cards.length, 53);
    for (const previous of cards) {
      const card=d.querySelector(`[data-effect="${previous.dataset.effect}"]`);
      assert.ok(card.querySelector('.thumb .pattern-svg,.thumb .pattern-canvas'), card.dataset.effect);
      if (card.dataset.effect === 'animal-illustration') assert.equal(card.querySelectorAll('.thumb [data-part^="a"]').length, 6);
      card.click();
      assert.equal(d.querySelector('#preview .motion-stage').dataset.effect, card.dataset.effect);
      assert.ok(d.querySelector('#preview .pattern-svg,#preview .pattern-canvas'), card.dataset.effect);
      assert.equal(d.querySelectorAll('#preview svg image,#preview svg foreignObject').length, card.dataset.effect === 'selfie-phone-illustration' ? 1 : 0);
      if (!card.dataset.effect.endsWith('-illustration') || !['moon-card-illustration','drafting-tools-illustration','archive-folder-illustration','folio-cards-illustration','chart-card-illustration','aperture-eye-illustration','terminal-window-illustration','archive-box-illustration','paper-scroll-illustration','steel-ruler-illustration','claude-glyph-rain-illustration','claude-frame-counter-illustration'].includes(card.dataset.effect)) assert.equal(d.querySelectorAll('#preview svg text').length, 0);
      assert.equal(w.MotionRuntime.instanceCount, 1);
    }
    assert.ok(!w.MotionHistory.recipes.some(e => e.history_id === 'naive-dot-wordmark'));
  } finally { env.close(); }
});

test('汇聚点沿原曲线内流，纸卷边缘与卷辊同步，双实例图形标识独立', async () => {
  const env = await environment();
  try {
    const {w} = env, root = w.document.getElementById('root');
    const def = id => data.effects.find(e => e.id === id);
    let player = w.MotionRuntime.create(root, def('heads-illustration'));
    player.seek(1500);
    for (let i = 0; i < 16; i++) {
      const p = root.querySelector(`[data-part="p${i}"]`), angle = i * Math.PI / 8;
      const t = (.5 * 2.7 + i / 16) % 1, b = 1 - t;
      assert.ok(Math.abs(+p.getAttribute('cx') - Math.cos(angle) * 116 * (b * b + .5 * b * t)) < 1e-8);
      assert.ok(Math.abs(+p.getAttribute('cy') - Math.sin(angle) * 94 * (b * b + .3 * b * t)) < 1e-8);
    }
    player.destroy();
    player = w.MotionRuntime.create(root, def('paper-scroll-illustration'));
    for (const t of [0, 300, 1100, 2100, 3000]) {
      player.seek(t);
      const paper = root.querySelector('[data-part="paper"]'), roll = root.querySelector('[data-part="roll"]');
      assert.ok(Math.abs(+paper.getAttribute('y') + +paper.getAttribute('height') - (+roll.getAttribute('y') + +roll.getAttribute('height') / 2)) < 1e-8);
    }
    const second = w.document.createElement('div'); root.after(second);
    const other = w.MotionRuntime.create(second, def('paper-scroll-illustration'));
    assert.notEqual(root.querySelector('clipPath').id, second.querySelector('clipPath').id);
    other.destroy(); player.destroy();
  } finally { env.close(); }
});

test('点阵插画保留原八百九十六个圆点和真实目标，连线抵达后才命中', async () => {
  const sourceRoot='/Users/wisewong/Documents/Developer/wise-video/kimi-k3-promo/';
  const source=await readFile(sourceRoot+'scenes/s2_params.html','utf8');
  const context=vm.createContext({window:{},GRID:{x0:470,y0:300,cols:32,rows:28},GSX:540/31,GSY:520/27,ROUTER:{x:378,y:560},targets:[]});
  vm.runInContext(await readFile(sourceRoot+'core/anim.js','utf8'),context);
  context.ANIM=context.window.ANIM;
  const selection=source.slice(source.indexOf('const Rt = ANIM.rng'),source.indexOf('// 铁粉：'));
  assert.ok(selection.includes('targets.sort'));
  vm.runInContext(selection,context);
  const env=await environment();
  try {
    const {w}=env,root=w.document.getElementById('root');
    const player=w.MotionRuntime.create(root,data.effects.find(e=>e.id==='dot-route-illustration'));
    const get=id=>root.querySelector(`[data-part="${id}"]`),number=(id,attr)=>+get(id).getAttribute(attr);
    const rows=[...root.querySelectorAll('[data-part^="row"]')];
    assert.equal(rows.length,28);
    assert.equal(rows.reduce((n,row)=>n+row.getAttribute('d').match(/M/g).length,0)+context.targets.length,896);
    assert.ok(root.querySelectorAll('*').length<100,'普通点按行合为静态路径，避免逐帧更新八百九十六个节点');
    assert.equal(root.querySelectorAll('text,image,foreignObject').length,0);
    assert.equal(root.textContent,'','只提取图形，不包含路由记录等文稿');
    player.seek(100);
    assert.ok(number('row0','opacity')>0);assert.equal(number('row4','opacity'),0);assert.equal(number('row27','opacity'),0);
    player.seek(1400);
    assert.ok(number('link0','opacity')>0);assert.equal(number('link2','opacity'),0);
    player.seek(1699);assert.equal(get('target0').getAttribute('fill'),'var(--ink)');
    player.seek(1750);
    assert.equal(get('target0').getAttribute('fill'),'var(--diagram-blue)');assert.equal(get('target2').getAttribute('fill'),'var(--ink)');
    assert.ok(number('target0','r')>2.1);assert.equal(number('halo0','opacity'),0);
    player.seek(1881);assert.ok(number('halo0','opacity')>0);
    player.seek(2600);
    context.targets.forEach((target,i)=>{
      assert.equal(number('target'+i,'cx'),target.x);assert.equal(number('target'+i,'cy'),target.y);
      assert.equal(get('target'+i).getAttribute('fill'),'var(--diagram-blue)');assert.ok(number('halo'+i,'opacity')>0);
      const coords=get('link'+i).getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
      assert.deepEqual(coords.slice(0,2),[378,560]);
      assert.ok(Math.abs(coords[2]-target.x)<1e-9);assert.ok(Math.abs(coords[3]-target.y)<1e-9);
      assert.equal(number('link'+i,'stroke-width'),1.6);
    });
    const final=root.innerHTML;
    player.seek(3000);assert.equal(root.innerHTML,final,'完成后留静止画面');
    player.seek(0);player.seek(2600);assert.equal(root.innerHTML,final,'反复定位不改变目标或时序');
    player.destroy();
  } finally {env.close();}
});
