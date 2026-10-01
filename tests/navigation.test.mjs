// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment} from './helpers.mjs';

test('两侧切换遵循筛选与搜索顺序，首尾循环，切换同步输出并释放旧画面', async () => {
  const env = await environment(true);
  try {
    const {w} = env, d = w.document;
    const previous = d.getElementById('previous-effect'), next = d.getElementById('next-effect');
    const current = () => d.querySelector('#preview .motion-stage').dataset.effect;
    const ids = () => [...d.querySelectorAll('.effect-item')].map(card => card.dataset.effect);
    const firstThumb = d.querySelector('.thumb');
    const original = ids();
    previous.click(); assert.equal(current(), original.at(-1));
    next.click(); assert.equal(current(), original[0]);
    next.click(); assert.equal(current(), original[1]);
    assert.match(d.getElementById('prompt').textContent, /遮罩显现/);
    assert.equal(d.querySelector('.thumb'), firstThumb); assert.ok(firstThumb.isConnected);
    env.reveal(); assert.equal(firstThumb.querySelector('.motion-stage').dataset.effect, original[0]);
    const category = d.getElementById('category-filter');
    category.value = 'continuous'; category.dispatchEvent(new w.Event('change'));
    env.reveal(); assert.equal(firstThumb.childElementCount, 0);
    const filtered = ids(); assert.equal(filtered.length, w.MotionRegistry.effects.filter(effect => effect.kind === 'action' && effect.category === 'continuous').length);
    previous.click(); assert.equal(current(), filtered.at(-1));
    next.click(); assert.equal(current(), filtered[0]);
    d.querySelector('[data-kind="composition"]').click();
    const combinations = ids(); assert.equal(combinations.length, w.MotionRegistry.effects.filter(effect => effect.kind === 'composition').length);
    next.click(); assert.equal(current(), combinations[0]);
    const search = d.getElementById('search');
    search.value = '两排反向持续滚动，不要轮播，不要停顿'; search.dispatchEvent(new w.Event('input'));
    next.click(); assert.equal(current(), 'dual-scroll');
    assert.ok(previous.disabled && next.disabled);
    search.value = 'zzzzzz'; search.dispatchEvent(new w.Event('input'));
    await new Promise(resolve => setTimeout(resolve, 160));
    assert.equal(ids().length, 0); assert.ok(previous.disabled && next.disabled);
    assert.equal(current(), 'dual-scroll');
    assert.equal(w.MotionRuntime.instanceCount, 1); assert.equal(env.listeners.size, 4);
    assert.equal(w.MotionRuntime.runningCount, 0);
  } finally { env.close(); }
});

test('左右方向键切换画面，输入、滑块、菜单、输出页签及抽屉保留各自键盘操作', async () => {
  const env = await environment(true);
  try {
    const {w, directoryMedia} = env, d = w.document;
    const current = () => d.querySelector('#preview .motion-stage').dataset.effect;
    const key = (target, name, options = {}) => target.dispatchEvent(new w.KeyboardEvent('keydown', {key:name,bubbles:true,cancelable:true,...options}));
    key(d.body, 'ArrowRight'); assert.equal(current(), 'mask-reveal');
    key(d.body, 'ArrowLeft'); assert.equal(current(), 'fade-rise');
    for (const selector of ['#search','#speed','#scrub','#prompt']) key(d.querySelector(selector), 'ArrowRight');
    for (const option of ['ctrlKey','metaKey','altKey','shiftKey','isComposing']) key(d.body, 'ArrowRight', {[option]:true});
    assert.equal(current(), 'fade-rise');
    d.querySelector('.search').getBoundingClientRect = () => ({top:100,bottom:136,left:12,width:280});
    d.getElementById('category-filter').click();
    key(d.body, 'ArrowRight'); assert.equal(current(), 'fade-rise');
    key(d.getElementById('category-options'), 'Escape');
    d.getElementById('tab-prompt').focus(); key(d.getElementById('tab-prompt'), 'ArrowRight');
    assert.equal(d.activeElement.id, 'tab-code'); assert.equal(current(), 'fade-rise');
    d.querySelector('[data-effect="fade-rise"]').focus();
    key(d.activeElement, 'ArrowRight');
    assert.equal(current(), 'mask-reveal'); assert.equal(d.activeElement.dataset.effect, 'mask-reveal');
    d.querySelector('[data-group="entrance"]').click();
    d.getElementById('next-effect').focus(); key(d.activeElement, 'ArrowRight');
    assert.equal(d.activeElement.id, 'next-effect');
    assert.equal(d.querySelector('[data-group="entrance"]').getAttribute('aria-expanded'), 'true');
    directoryMedia.matches = true; directoryMedia.dispatchEvent(new w.Event('change'));
    d.getElementById('toggle-directory').click();
    const before = current(); key(d.body, 'ArrowRight'); assert.equal(current(), before);
    key(d.getElementById('search'), 'Escape'); key(d.body, 'ArrowRight');
    assert.notEqual(current(), before); assert.equal(w.MotionRuntime.instanceCount, 1);
  } finally { env.close(); }
});
