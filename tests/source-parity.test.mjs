// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {transform} from 'esbuild';
import {environment, data} from './helpers.mjs';
import {projectFor} from '../scripts/export.mjs';
import {getEffectMetadata, sampleEffectTime} from '../remotion/clock.mjs';
import {Canvas, digest, reset} from './seed-bloom-recorder.mjs';
import {artwork, recorder} from './civilization-recorder.mjs';
import {paintEffect} from '../catalog/assets/civilization-growth/engine.mjs';

const read = file => readFile(new URL('../' + file, import.meta.url), 'utf8');
const exportsScope = {};
for (const file of ['catalog/runtime.js', 'catalog/content.js', 'catalog/effects/civilization-images.js', 'catalog/remotion-sources.js', 'catalog/export.js']) {
  runInNewContext(await read(file), exportsScope, {filename:file});
}
const nativeEffects = data.effects.filter(effect => effect.source.remotion);
const speeds = [0.5, 0.75, 1, 1.25, 1.75, 2];

// 执行生成的入口，读取实际传给 Remotion 的帧数与参数。
async function compositionFrom(files) {
  let Root;
  const React = {createElement:(type, props) => ({type, props})};
  const remotion = {Composition() {}, registerRoot:root => { Root = root; }};
  const entry = (await transform(files['index.jsx'], {loader:'jsx', format:'cjs'})).code;
  runInNewContext(entry, {require:name => name === 'react' ? React : name === 'remotion' ? remotion : {SeedBloomBrand() {}, CivilizationGrowth() {}}});
  assert.equal(typeof Root, 'function');
  return Root().props;
}

test('切换外观后立即复制使用当前外观，来回切换保留播放位置', async () => {
  const env = await environment(true, {staticPreview:true, hash:'#fade-rise'});
  try {
    const {w} = env, d = w.document;
    d.querySelector('[data-tab="code"]').click();
    const scrub = d.getElementById('scrub');
    scrub.value = 625; scrub.dispatchEvent(new w.Event('input'));
    const position = scrub.value, instances = w.MotionRuntime.instanceCount;
    let copied;
    Object.defineProperty(w.navigator, 'clipboard', {value:{writeText:async text => { copied = text; }}});
    for (const theme of ['light', 'dark']) {
      d.getElementById('theme-toggle').click();
      assert.equal(d.documentElement.dataset.theme, theme);
      d.getElementById('copy-code').click();
      await Promise.resolve();
      const settings = JSON.parse(copied.match(/const settings = ([\s\S]*?);\nconst meta/)[1]);
      assert.equal(settings.theme, theme, '复制内容必须跟随当前预览外观');
      assert.equal(copied, d.getElementById('code').textContent);
      assert.equal(scrub.value, position, '切换外观不能重置播放位置');
      assert.equal(w.MotionRuntime.instanceCount, instances);
    }
  } finally { env.close(); }
});

test('十二个独立工程在六种速度下与目录帧数一致，准确末帧只出现一次', async () => {
  assert.equal(nativeEffects.length, 12);
  for (const effect of nativeEffects) {
    const cli = await projectFor(effect.id);
    for (const speed of speeds) {
      const project = exportsScope.MotionExport.projectFiles(effect, {speed});
      const composition = await compositionFrom(project.files);
      const meta = getEffectMetadata(effect.id, {fps:effect.source.remotion.fps, speed});
      const label = effect.id + ' / ' + speed;
      assert.equal(composition.durationInFrames, meta.durationInFrames, label);
      assert.equal(composition.fps, meta.fps);
      assert.equal(composition.defaultProps.effectId, effect.id);
      assert.equal(composition.defaultProps.speed, speed);
      const last = sampleEffectTime(effect, composition.durationInFrames - 1, composition.fps, {speed});
      assert.equal(last.time, effect.duration_ms, label + ' 缺少准确结束时刻');
      const previous = sampleEffectTime(effect, composition.durationInFrames - 2, composition.fps, {speed});
      assert.ok(previous.time < effect.duration_ms, label + ' 不重复结束帧');
      if (speed === 1) assert.deepEqual(cli.files, JSON.parse(JSON.stringify(project.files)), label + ' 命令行与复制不同');
    }
  }
});

test('独立工程最后一帧的原绘制指令与目录结束画面一致', async () => {
  const seedScope = {document:{createElement:() => new Canvas()}};
  runInNewContext(await read('catalog/effects/seed-bloom-brand.js'), seedScope);
  for (const effect of nativeEffects) {
    const isSeed = effect.source.remotion.component.endsWith('seed-bloom-brand.jsx');
    let engine, canvas;
    const drawing = recorder();
    if (isSeed) {
      canvas = new Canvas(); canvas.width = 2132; canvas.height = 1200;
      engine = seedScope.WiseSeedBloom.createEngine(canvas);
    }
    const frame = milliseconds => {
      if (!isSeed) return drawing.digest(ctx => paintEffect(ctx, artwork, effect.id, milliseconds));
      reset();
      if (effect.id === 'seed-bloom-brand-sequence') engine.render(milliseconds / 1000);
      else engine.drawAction(effect.id, milliseconds / 1000);
      return digest(canvas);
    };
    try {
      const expected = frame(effect.duration_ms);
      for (const speed of speeds) {
        const project = exportsScope.MotionExport.projectFiles(effect, {speed});
        const composition = await compositionFrom(project.files);
        // 原生组件按当前帧、帧率和速度传入时间；各自的原绘制负责钳制结束时刻。
        const elapsed = (composition.durationInFrames - 1) / composition.fps * 1000 * speed;
        assert.equal(frame(elapsed), expected, effect.id + ' / ' + speed + ' 最后画面不同');
      }
    } finally { engine?.dispose(); }
  }
});
