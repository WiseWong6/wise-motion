// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment, data} from './helpers.mjs';

const heavy = ['effects/civilization-images.js', 'effects/rasengan-illustrations.js', 'effects/civilization-growth.js', 'remotion-sources.js'];
const effect = id => data.effects.find(item => item.id === id);

test('浏览和复制提示词不加载完整源码表，打开需要它的代码页签才加载一次', async () => {
  const page = await environment(true, {staticPreview: true, lazyAssets: true});
  try {
    const {w} = page, d = w.document;
    assert.deepEqual(page.lazyRequests, []);
    assert.equal(w.MotionRemotionSources, undefined);
    assert.match(d.getElementById('prompt').textContent, /动效说明/);
    d.getElementById('tab-code').click();
    assert.equal(w.MotionLazy.ensureCode(effect('fade-rise')), null);
    assert.deepEqual(page.lazyRequests, [], '普通用法不需要完整源码表');

    d.getElementById('tab-prompt').click();
    d.querySelector('[data-effect="seed-sprout-bloom"]').click();
    assert.equal(w.MotionRemotionSources, undefined);
    assert.equal(d.getElementById('code').textContent, '', '隐藏时不生成大段源码');
    let copied = '';
    d.execCommand = () => { copied = d.activeElement.value; return true; };
    d.getElementById('copy-prompt').click();
    assert.match(copied, /动效说明/);
    assert.deepEqual(page.lazyRequests, []);

    d.getElementById('tab-code').click();
    assert.equal(d.getElementById('copy-code').disabled, true);
    assert.equal(d.getElementById('code').textContent, '正在准备源码…');
    await w.MotionLazy.ensureCode(effect('seed-sprout-bloom'));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(d.getElementById('copy-code').disabled, false);
    assert.match(d.getElementById('code').textContent, /Remotion 完整工程/);
    assert.deepEqual(page.lazyRequests, ['remotion-sources.js']);
    d.getElementById('tab-prompt').click();
    d.getElementById('tab-code').click();
    assert.deepEqual(page.lazyRequests, ['remotion-sources.js']);
  } finally { page.close(); }
});

test('源码准备期间切换条目，迟到结果不能覆盖新提示词和代码，也不能复制占位文字', async () => {
  const page = await environment(true, {staticPreview: true, lazyAssets: true});
  try {
    const {w} = page, d = w.document;
    let finish, copies = 0;
    const pending = new Promise(resolve => { finish = resolve; });
    w.MotionLazy.ensureCode = () => pending;
    d.execCommand = () => { copies++; return true; };
    d.querySelector('[data-effect="seed-sprout-bloom"]').click();
    d.getElementById('tab-code').click();
    d.getElementById('copy-code').click();
    assert.equal(copies, 0);
    d.querySelector('[data-effect="scale-in"]').click();
    const prompt = d.getElementById('prompt').textContent, code = d.getElementById('code').textContent;
    finish();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(d.getElementById('prompt').textContent, prompt);
    assert.equal(d.getElementById('code').textContent, code);
    assert.match(code, /catalog\/effects\/entrance\.js/);
    assert.equal(d.getElementById('copy-code').disabled, false);
  } finally { page.close(); }
});

test('目录首屏不同步载入大体积素材和源码表', async () => {
  const html = await readFile(new URL('../catalog/index.html', import.meta.url), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(match => match[1]);
  for (const file of heavy) assert.ok(!scripts.includes(file), '首屏不应同步载入：' + file);
  assert.ok(scripts.indexOf('lazy.js') > -1 && scripts.indexOf('lazy.js') < scripts.indexOf('app.js'), 'lazy.js 须先于 app.js');
});

test('用到时才按声明顺序载入，已载入的文件不重复执行', async () => {
  const page = await environment(true, {staticPreview: true, lazyAssets: true});
  try {
    const {w} = page;
    assert.equal(w.WiseCivilizationImages, undefined);
    assert.ok(!w.MotionFactories['rasengan-illustration']);
    assert.equal(w.MotionLazy.ensure(effect('stagger-in')), null, '不依赖大素材的条目不需要等待');

    await w.MotionLazy.ensureCode(effect('civilization-growth-sequence'));
    const requests = page.lazyRequests;
    assert.ok(requests.indexOf('effects/civilization-images.js') < requests.indexOf('effects/civilization-growth.js'), '共享图片须先于绘制器');
    assert.ok(w.WiseCivilizationImages && w.MotionRemotionSources);
    assert.ok(w.MotionFactories['civilization-growth-sequence'].breakdown.length > 0);
    assert.ok(!requests.includes('effects/rasengan-illustrations.js'), '无关素材不应被连带载入');

    const before = requests.length;
    assert.equal(w.MotionLazy.ensureCode(effect('civilization-growth-sequence')), null);
    assert.equal(requests.length, before);

    await w.MotionLazy.ensure(effect('rasengan-illustration'));
    assert.ok(w.MotionFactories['rasengan-illustration']);
    assert.equal(requests.filter(file => file === 'effects/rasengan-illustrations.js').length, 1);
  } finally { page.close(); }
});

test('载入失败时给出可读错误，且允许稍后重试', async () => {
  const page = await environment(true, {staticPreview: true, lazyAssets: true});
  try {
    const {w} = page;
    const original = w.document.head.append;
    w.document.head.append = node => { if (node.src.endsWith('rasengan-illustrations.js')) { node.onerror?.(new Error('offline')); return; } original.call(w.document.head, node); };
    await assert.rejects(w.MotionLazy.ensure(effect('rasengan-illustration')), /无法载入动效资源/);
    w.document.head.append = original;
    await w.MotionLazy.ensure(effect('rasengan-illustration'));
    assert.ok(w.MotionFactories['rasengan-illustration']);
  } finally { page.close(); }
});
