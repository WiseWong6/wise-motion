// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_FPS, effectDefinitions, getEffectMetadata, normalizeSpeed, resolveEffect, sampleEffectTime} from '../remotion/clock.mjs';
import {createFrameDocument, FRAME_SCRIPTS, frameScriptsFor} from '../remotion/frame-document.mjs';

const regular = {id:'test', duration_ms:1000, loop:false};
const loop = {...regular, loop:true};

test('以60帧为默认值，实际帧换算保留小数，原绘制决定逐格节奏', () => {
  assert.equal(DEFAULT_FPS, 60);
  const state = sampleEffectTime(regular, 1);
  assert.ok(Math.abs(state.time - 1000 / 60) < 1e-8);
  assert.equal(state.playback, true);
  assert.equal(sampleEffectTime(regular, 1, 60, {sampleMode:'exact'}).playback, false);
});

test('循环保留两周期以上的累计时间，不重播首次入场', () => {
  assert.deepEqual(sampleEffectTime(loop, 123), {frame:123,fps:60,time:50,elapsed:2050,sampleMode:'playback',playback:true});
  assert.equal(sampleEffectTime(loop, 120).time, 0);
  assert.equal(sampleEffectTime(loop, 120).elapsed, 2000);
});

test('非循环停在准确末帧，无浮点越界', () => {
  assert.equal(sampleEffectTime(regular, 60).time, 1000);
  assert.equal(sampleEffectTime(regular, 80).time, 1000);
  assert.equal(sampleEffectTime(regular, 80).elapsed, 1000);
});

test('倍速影响实际源时刻但沿用既有半倍至两倍的范围', () => {
  assert.equal(sampleEffectTime(regular, 15, 60, {speed:2}).time, 500);
  assert.equal(sampleEffectTime(regular, 60, 60, {speed:0.5}).time, 500);
  assert.equal(normalizeSpeed(8), 2);
  assert.equal(normalizeSpeed(0), 0.5);
  assert.throws(() => normalizeSpeed(NaN));
});

test('逆序、乱序及重复取样完全由输入决定', () => {
  const order = [36, 5, 120, 0, 5, 119, 36];
  const first = new Map(order.map(frame => [frame, sampleEffectTime(loop, frame)]));
  for (const frame of [...order].reverse()) assert.deepEqual(sampleEffectTime(loop, frame), first.get(frame));
});

test('无效帧率、帧号和取样模式明确报错', () => {
  for (const frame of [-1, 0.5, Infinity, NaN]) assert.throws(() => sampleEffectTime(loop, frame));
  for (const fps of [0,-1,Infinity,NaN]) assert.throws(() => sampleEffectTime(loop, 0, fps));
  assert.throws(() => sampleEffectTime(loop, 0, 60, {sampleMode:'unknown'}));
  assert.throws(() => sampleEffectTime({...loop,duration_ms:0}, 0));
});

test('所有条目和变体可解析，元数据与末帧一致，原注册表不被改变', () => {
  const before = JSON.stringify(effectDefinitions);
  assert.equal(effectDefinitions.length,420);
  let count = 0;
  for (const effect of effectDefinitions) for (const variantId of effect.variants?.map(variant => variant.id) || [undefined]) {
    count++;
    const resolved = resolveEffect(effect.id, variantId);
    for (const speed of [0.5,1,2]) {
      const metadata = getEffectMetadata(effect.id, {variantId, speed});
      assert.equal(metadata.width, 640);
      assert.equal(metadata.height, 360);
      assert.equal(metadata.durationMs, resolved.duration_ms);
      const end = sampleEffectTime(resolved, metadata.durationInFrames - 1, metadata.fps, {speed});
      if (!resolved.loop) {
        assert.equal(end.time, resolved.duration_ms, effect.id);
        if (metadata.durationInFrames > 1) assert.ok(sampleEffectTime(resolved, metadata.durationInFrames - 2, metadata.fps, {speed}).time < resolved.duration_ms, effect.id + ' 不得额外重复末帧');
      }
      else assert.ok(end.elapsed < resolved.duration_ms, effect.id);
    }
  }
  assert.equal(count, 544);
  assert.equal(JSON.stringify(effectDefinitions), before);
});

test('目录额外纸张配置和已选变体可以作为定义传入', () => {
  const effect = effectDefinitions.find(entry => entry.variants?.length > 1);
  const variant = effect.variants[1];
  const resolved = resolveEffect({...effect,paper_settings:{padding:20}}, variant.id);
  assert.equal(resolved.variant_id, variant.id);
  assert.equal(resolved.duration_ms, variant.duration_ms ?? effect.duration_ms);
  assert.equal(resolved.paper_settings.padding, 20);
  assert.equal(getEffectMetadata(effect.id, {definition:resolved}).durationMs, resolved.duration_ms);
  assert.throws(() => resolveEffect(effect.id, 'missing'));
  assert.throws(() => resolveEffect('missing'));
});

test('源时间映射交给原绘制核心，取样模块不再次缩放', () => {
  const effect = effectDefinitions.find(entry => entry.timing);
  const halfFrame = Math.round(effect.duration_ms * 60 / 2000);
  const state = sampleEffectTime(effect, halfFrame);
  assert.ok(Math.abs(state.time - halfFrame * 1000 / 60) < 1e-8);
  assert.deepEqual(resolveEffect(effect.id).timing, effect.timing);
});

test('隔离页保持全部效果脚本的原始加载顺序，排除目录控制脚本', async () => {
  const html = await readFile(new URL('../catalog/index.html', import.meta.url), 'utf8');
  const originals = [...html.matchAll(/<script src="(effects\/[^\"]+)"/g)].map(match => 'catalog/' + match[1]);
  const lazy = (await readFile(new URL('../catalog/lazy.js', import.meta.url), 'utf8')).match(/EFFECT_FILES = \[([^\]]+)\]/)[1].match(/effects\/[^']+/g).map(file => 'catalog/' + file);
  assert.equal(lazy.length, 29);
  const frameEffects = FRAME_SCRIPTS.filter(path => path.startsWith('catalog/effects/'));
  assert.deepEqual(frameEffects.filter(path => !lazy.includes(path)), originals, '目录页同步载入的绘制与隔离页顺序一致');
  assert.deepEqual(frameEffects.filter(path => lazy.includes(path)).sort(), lazy.slice().sort(), '按需载入的绘制仍在隔离页里');
  assert.ok(!FRAME_SCRIPTS.includes('catalog/app.js'));
  assert.ok(!FRAME_SCRIPTS.includes('catalog/player-glass.js'));
  const document = createFrameDocument({assetBaseUrl:'file:///project/',theme:'light'});
  assert.ok(document.includes('data-theme="light"'));
  assert.ok(document.includes('<base href="file:///project/catalog/">'));
  assert.ok(document.includes('file:///project/vendor/animejs/anime.umd.min.js'));
  assert.ok(document.includes('window.anime.engine?.pause()'));
  assert.ok(!document.includes('MotionRuntime.create('));
});

test('素材根地址嵌入页面前转义，不允许注入新属性', () => {
  const html = createFrameDocument({assetBaseUrl:'https://example.test/" onload="bad'});
  assert.ok(html.includes('&quot;'));
  assert.ok(!html.includes(' onload="bad'));
  assert.throws(() => createFrameDocument({assetBaseUrl:''}));
  assert.throws(() => createFrameDocument({assetBaseUrl:'file:///project',theme:'unknown'}));
});

test('普通预览不载入无关绘制，组合保留依赖，目录数据场景保留真实统计', () => {
  const normal = frameScriptsFor(resolveEffect('stagger-in'));
  assert.deepEqual(normal, ['vendor/animejs/anime.umd.min.js', 'catalog/content.js', 'catalog/runtime.js', 'catalog/effects/entrance.js']);
  const composition = frameScriptsFor(resolveEffect('result-anchors'));
  for (const name of ['illustrations', 'kimi-illustrations', 'claude-tile-illustrations', 'paper-showcase']) {
    assert.ok(composition.includes('catalog/effects/' + name + '.js'));
  }
  assert.ok(!composition.includes('catalog/effects/rasengan-illustrations.js'));
  assert.ok(frameScriptsFor(resolveEffect('motion-oasis-sequence')).includes('catalog/registry-data.js'));
  for (const effect of effectDefinitions) {
    for (const variant of effect.variants || [null]) {
      const definition = resolveEffect(effect.id, variant?.id);
      const scripts = frameScriptsFor(definition);
      assert.ok(scripts.includes(definition.source.path), effect.id);
      assert.ok((definition.source.dependencies || []).every(file => scripts.includes(file)), effect.id);
      assert.equal(new Set(scripts).size, scripts.length);
    }
  }
  assert.throws(() => frameScriptsFor({id:'missing'}), /绘制来源/);
  assert.throws(() => frameScriptsFor({source:{path:'catalog/effects/not-registered.js'}}), /未登记/);
});
