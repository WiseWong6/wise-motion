// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {environment, data} from './helpers.mjs';
import {frameScriptsFor} from '../remotion/frame-document.mjs';

const fixture = JSON.parse(await readFile(new URL('./butterfly-fixture.json', import.meta.url), 'utf8'));
const def = id => data.effects.find(effect => effect.id === id);
async function butterflyEnvironment() {
  const dom = new JSDOM('<div id="root"></div>', {url: 'file:///wise-motion/catalog/index.html', runScripts: 'outside-only'});
  for (const file of ['butterfly-motion.js', 'butterfly.js']) dom.window.eval(await readFile(new URL('../catalog/effects/' + file, import.meta.url), 'utf8'));
  return dom;
}

test('蝴蝶图集原样保留，插画与动作只共享一个实际绘制入口', async () => {
  const source = JSON.parse(await readFile(new URL('../catalog/assets/butterfly/SOURCE.json', import.meta.url), 'utf8'));
  for (const file of source.files) {
    const bytes = await readFile(new URL('../catalog/assets/butterfly/' + file.path, import.meta.url));
    assert.equal(bytes.length, file.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
  }
  const illustration = def('butterfly-illustration'), action = def('hinged-wing-flap');
  assert.deepEqual(illustration.actions, [action.id]);
  assert.deepEqual(illustration.source, action.source);
  assert.deepEqual(frameScriptsFor(action).slice(-2), ['catalog/effects/butterfly-motion.js', 'catalog/effects/butterfly.js']);
});

test('原振翅、触角与身体状态在首尾、倒序、跨周期时保持一致', async () => {
  const dom = await butterflyEnvironment();
  try {
    for (const sample of [...fixture, ...fixture.toReversed()]) {
      const state = dom.window.WiseButterflyMotion.butterflyState(sample.seconds);
      assert.deepEqual(JSON.parse(JSON.stringify(state)), sample.state);
    }
    assert.deepEqual(dom.window.WiseButterflyMotion.butterflyState(0), dom.window.WiseButterflyMotion.butterflyState(6));
  } finally {dom.window.close();}
});

test('两个绘制实例独立，定位直接更新四翼与触角，准备成功后无迟到复活', async () => {
  const dom = await butterflyEnvironment();
  try {
    const w = dom.window, root = w.document.getElementById('root'), other = w.document.createElement('div');
    const first = w.WiseButterfly.mount(root), second = w.WiseButterfly.mount(other);
    for (const img of [...root.querySelectorAll('img'), ...other.querySelectorAll('img')]) img.dispatchEvent(new w.Event('load'));
    await Promise.all([first.ready, second.ready]);
    first.draw(1.12); const frozen = root.innerHTML;
    second.draw(3.17); assert.equal(root.innerHTML, frozen);
    const expected = fixture.find(sample => sample.seconds === 1.12).state;
    for (const wing of expected.wings) assert.equal(root.querySelector(`[data-part="${wing.id}"]`).style.transform, `rotateY(${wing.yaw}deg) rotateZ(${wing.roll}deg)`);
    for (const antenna of expected.antennae) assert.equal(root.querySelector(`[data-part="${antenna.id}"]`).getAttribute('d'), antenna.path);
    first.draw(0); first.draw(1.12); assert.equal(root.innerHTML, frozen);
    first.destroy(true); first.draw(2); assert.equal(root.innerHTML, frozen);
    second.destroy(); second.destroy(); second.draw(1); assert.equal(other.innerHTML, '');
  } finally {dom.window.close();}
});

test('缺图明确失败，准备中销毁不会恢复画面或留下监听', async () => {
  const dom = await butterflyEnvironment();
  try {
    const w = dom.window, root = w.document.getElementById('root');
    const failed = w.WiseButterfly.mount(root);
    root.querySelector('img').dispatchEvent(new w.Event('error'));
    await assert.rejects(failed.ready, /图集读取失败/); failed.destroy();
    const cancelled = w.WiseButterfly.mount(root), images = [...root.querySelectorAll('img')];
    cancelled.destroy(); await cancelled.ready;
    images.forEach(img => img.dispatchEvent(new w.Event('load')));
    cancelled.draw(3); assert.equal(root.innerHTML, '');
  } finally {dom.window.close();}
});

test('逐翼换色、翼根显露与外部飞行姿态可倒序定位', async () => {
  const dom = await butterflyEnvironment();
  try {
    const w = dom.window, root = w.document.getElementById('root');
    const renderer = w.WiseButterfly.mount(root, {alternateSrc: 'ai-wing-atlas.png'});
    root.querySelectorAll('img').forEach(img => img.dispatchEvent(new w.Event('load')));
    await renderer.ready;
    const motionState = w.WiseButterflyMotion.butterflyState(1.12);
    motionState.bank += 5; motionState.wings[0].yaw = -20;
    const wingSelections = [0, 0.25, 0.5, 1];
    const options = {wingSelections, revealFromRoot: true, motionState};
    renderer.draw(0, options);
    w.WiseButterflyMotion.PARTS.forEach((part, i) => {
      const wing = root.querySelector(`[data-part="${part.id}"]`);
      const [px, py] = part.pivot;
      const radius = wingSelections[i] * Math.hypot(Math.max(px, part.crop[2] - px), Math.max(py, part.crop[3] - py));
      assert.equal(wing.querySelector('[data-wing-variant]').style.opacity, i === 3 ? '0' : '1');
      assert.equal(wing.querySelector('[data-wing-reveal]').style.display, i === 1 || i === 2 ? 'block' : 'none');
      assert.equal(wing.querySelector('[data-wing-reveal]').style.clipPath, `circle(${radius}px at ${px}px ${py}px)`);
    });
    assert.match(root.querySelector('[data-part="left-hind"]').style.transform, /rotateY\(-20deg\)/);
    const frozen = root.innerHTML;
    renderer.draw(5, {selection: 1}); renderer.draw(0, options);
    assert.equal(root.innerHTML, frozen);
    renderer.draw(0, {selection: 0.4});
    assert.equal(root.querySelector('[data-wing-variant]').style.opacity, '0.6');
    assert.equal(root.querySelector('[data-wing-reveal]').style.display, 'none');
    renderer.destroy();
  } finally {dom.window.close();}
});

test('新增圆面示例保留零半径、中点、终态与原来的标准转场', async () => {
  const env = await environment();
  try {
    const iris = def('iris-open-transition');
    assert.deepEqual(iris.variants.map(variant => variant.id), ['standard', 'paper-expand', 'black-cover']);
    for (const [variant, duration, x, y] of [['paper-expand', 0.45, 540, 1180], ['black-cover', 0.4, 540, 850]]) {
      const sample = env.w.WiseCircularReveal.sample;
      assert.equal(sample(-1, variant).radiusPercent, 0);
      assert.equal(sample(duration / 2, variant).radiusPercent, 60);
      assert.equal(sample(duration, variant).clipPath, `circle(120% at ${x}px ${y}px)`);
      assert.equal(sample(duration + 10, variant).radiusPercent, 120);
      const originalRoot = env.w.document.createElement('div');
      const effect = env.w.MotionKit.resolveVariant(iris, variant);
      assert.ok(frameScriptsFor(effect).includes('catalog/effects/circular-reveal.js'));
      const player = env.w.MotionRuntime.create(originalRoot, effect);
      player.seek(150); assert.equal(originalRoot.querySelector('[data-circle-cover]').style.clipPath, sample(0, variant).clipPath);
      player.seek(150 + duration * 1000); const complete = originalRoot.innerHTML;
      player.seek(0); player.seek(150 + duration * 1000); assert.equal(originalRoot.innerHTML, complete);
      player.destroy();
    }
    const standard = env.w.MotionRuntime.create(env.w.document.getElementById('root'), env.w.MotionKit.resolveVariant(iris, 'standard'));
    standard.seek(900); assert.ok(env.w.document.querySelector('[data-mask]')); standard.destroy();
  } finally {env.close();}
});
