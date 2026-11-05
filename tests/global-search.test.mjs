// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment, data} from './helpers.mjs';

const searchFor = async (w, value) => {
  const search = w.document.getElementById('search');
  search.value = value;
  search.dispatchEvent(new w.Event('input'));
  await new Promise(resolve => setTimeout(resolve, 160));
};
const listedIds = d => [...d.querySelectorAll('.effect-item')].map(card => card.dataset.effect);
const kindOf = id => data.effects.find(effect => effect.id === id).kind;

test('三个页签共用全局搜索，动作、组合和插画同时出现且切页签不丢结果', async () => {
  const env = await environment(true, {staticPreview:true});
  try {
    const {w} = env, d = w.document;
    await searchFor(w, '图形');
    const expected = listedIds(d);
    assert.deepEqual(new Set(expected.map(kindOf)), new Set(['action','composition','illustration']));
    for (const kind of ['composition','illustration','action']) {
      d.querySelector(`[data-kind="${kind}"]`).click();
      assert.equal(d.getElementById('search').value, '图形');
      assert.deepEqual(listedIds(d), expected);
    }
    for (const title of ['单个动作 · ', '组合片段 · ', '插画素材 · ']) {
      assert.ok([...d.querySelectorAll('.group-name')].some(node => node.textContent.startsWith(title)));
    }
    d.getElementById('search-clear').click();
    assert.equal(listedIds(d).length, data.effects.filter(effect => effect.kind === 'action').length);
    assert.ok(listedIds(d).every(id => kindOf(id) === 'action'));
  } finally { env.close(); }
});

test('原来收起的分类也展示搜索命中，跨类选择后清空搜索回到选中动效所在分类', async () => {
  const env = await environment(true, {staticPreview:true});
  try {
    const {w} = env, d = w.document;
    d.querySelector('[data-kind="composition"]').click();
    d.querySelector('[data-group="composition-text"]').click();
    d.querySelector('[data-kind="action"]').click();
    const filter = d.getElementById('category-filter');
    filter.value = 'continuous'; filter.dispatchEvent(new w.Event('change'));
    await searchFor(w, '人物告别与三连点亮');
    assert.equal(filter.value, 'all');
    assert.equal(d.querySelector('[data-group="composition-text"]').getAttribute('aria-expanded'), 'true');
    const results = listedIds(d);
    d.querySelector('[data-effect="farewell-actions"]').click();
    assert.equal(d.querySelector('[data-kind][aria-pressed="true"]').dataset.kind, 'composition');
    assert.equal(d.getElementById('search').value, '人物告别与三连点亮');
    assert.deepEqual(listedIds(d), results);
    assert.equal(d.getElementById('preview-title').textContent, '人物告别与三连点亮');
    assert.equal(d.querySelector('.effect-item[aria-current="true"]').dataset.effect, 'farewell-actions');
    d.getElementById('search-clear').click();
    assert.equal(listedIds(d).length, data.effects.filter(effect => effect.kind === 'composition').length);
    assert.ok(listedIds(d).every(id => kindOf(id) === 'composition'));
    assert.equal(d.querySelector('[data-group="composition-text"]').getAttribute('aria-expanded'), 'true');
    assert.equal(d.querySelector('.effect-item[aria-current="true"]').dataset.effect, 'farewell-actions');
  } finally { env.close(); }
});

test('搜索结果的前后切换可跨页签，顺序、选中状态和输出保持一致', async () => {
  const env = await environment(true, {staticPreview:true});
  try {
    const {w} = env, d = w.document;
    await searchFor(w, '图形');
    const results = listedIds(d);
    const boundary = results.findIndex((id, index) => index > 0 && kindOf(id) !== kindOf(results[index - 1]));
    assert.ok(boundary > 0, '应有跨分类的相邻结果');
    d.querySelector(`[data-effect="${results[boundary - 1]}"]`).click();
    for (const [button, id] of [['next-effect', results[boundary]], ['previous-effect', results[boundary - 1]]]) {
      d.getElementById(button).click();
      const effect = data.effects.find(item => item.id === id);
      assert.equal(d.querySelector('.effect-item[aria-current="true"]').dataset.effect, id);
      assert.equal(d.querySelector('[data-kind][aria-pressed="true"]').dataset.kind, effect.kind);
      assert.equal(d.getElementById('preview-title').textContent, effect.name);
      assert.ok(d.getElementById('prompt').textContent.includes(effect.name));
      assert.deepEqual(listedIds(d), results);
      assert.equal(w.MotionRuntime.instanceCount, 1);
    }
  } finally { env.close(); }
});
