// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {environment, data} from './helpers.mjs';
import {frameScriptsFor, FRAME_STYLES} from '../remotion/frame-document.mjs';

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

test('触角在真实目录样式下保持绘图尺寸，曲线始终连接头部与尖端', async () => {
  const dom = await butterflyEnvironment();
  try {
    const w = dom.window, root = w.document.getElementById('root');
    for (const file of FRAME_STYLES) {
      const style = w.document.createElement('style');
      style.textContent = await readFile(new URL('../' + file, import.meta.url), 'utf8');
      w.document.head.append(style);
    }
    for (const catalogView of [true, false]) {
      const renderer = w.WiseButterfly.mount(root, {catalogView});
      root.querySelectorAll('img').forEach(img => img.dispatchEvent(new w.Event('load')));
      await renderer.ready;
      const svg = root.querySelector('[data-part="antennae"] svg');
      const style = w.getComputedStyle(svg);
      assert.equal(style.width, '390px');
      assert.equal(style.height, '280px');
      const [x, y, width, height] = svg.getAttribute('viewBox').split(' ').map(Number);
      for (const sample of [...fixture, ...fixture.toReversed()]) {
        renderer.draw(sample.seconds);
        sample.state.antennae.forEach((antenna, i) => {
          const path = svg.querySelector(`[data-part="${antenna.id}"]`);
          assert.equal(path.getAttribute('d'), antenna.path);
          for (const point of [antenna.root, antenna.c1, antenna.c2, antenna.end]) {
            assert.ok(point[0] >= x && point[0] <= x + width);
            assert.ok(point[1] >= y && point[1] <= y + height);
          }
          const club = w.WiseButterflyMotion.ANTENNAE[i].club;
          const tip = root.querySelector(`[data-part="${club.id}"]`);
          assert.ok(Math.abs(parseFloat(tip.style.left) + club.pivot[0] - antenna.end[0]) < 1e-9);
          assert.ok(Math.abs(parseFloat(tip.style.top) + club.pivot[1] - antenna.end[1]) < 1e-9);
        });
      }
      renderer.destroy();
    }
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

test('蝴蝶动作与插画的缩略图等待全部图片解码后保留，缺图时明确提示', async () => {
  const env = await environment(false, {realImagePreparation: true});
  const {w} = env, released = [], decodes = [];
  const original = w.MotionFactories['butterfly-illustration'];
  const factory = (...args) => {
    const render = original(...args), destroy = render.destroy;
    render.destroy = preserve => {released.push(preserve); destroy(preserve);};
    return render;
  };
  Object.assign(factory, original);
  w.MotionFactories['butterfly-illustration'] = factory;
  w.HTMLImageElement.prototype.decode = () => new Promise(resolve => decodes.push(resolve));
  const tick = () => new Promise(resolve => setImmediate(resolve));
  try {
    w.eval(await readFile(new URL('../catalog/thumbnails.js', import.meta.url), 'utf8'));
    const host = w.document.createElement('div'); w.document.body.append(host);
    for (const id of ['hinged-wing-flap', 'butterfly-illustration']) {
      released.length = 0; decodes.length = 0;
      const effect = def(id);
      w.MotionThumbs.attach(host, effect); env.reveal(); await tick();
      const images = [...host.querySelectorAll('img')];
      assert.equal(images.length, 7, '四翼、身体及两个触角尖端均保留原图');
      assert.deepEqual(released, [], '图片尚未读取时不能结束缩略图准备');
      images.forEach(img => img.dispatchEvent(new w.Event('load')));
      assert.equal(decodes.length, images.length);
      decodes.slice(0, -1).forEach(resolve => resolve()); await tick();
      assert.deepEqual(released, [], '最后一张图片尚未解码时不能保留半成品');
      decodes.at(-1)(); await w.MotionThumbs.whenIdle();
      assert.deepEqual(released, [true]);
      assert.ok(images.every(img => host.contains(img)));
      assert.equal(host.querySelector('.history-placeholder'), null);
      const state = w.WiseButterflyMotion.butterflyState(effect.preview_ms / 1000);
      for (const wing of state.wings) {
        assert.equal(host.querySelector(`[data-part="${wing.id}"]`).style.transform,
          `rotateY(${wing.yaw}deg) rotateZ(${wing.roll}deg)`);
      }
      // 每次都重新准备图片，末次缺图检查不能借用前次缓存的成功画面。
      w.MotionThumbs.release(host,false);
    }
    w.MotionThumbs.attach(host, def('hinged-wing-flap')); env.reveal(); await tick();
    host.querySelector('img').dispatchEvent(new w.Event('error'));
    await w.MotionThumbs.whenIdle();
    assert.equal(host.textContent, '预览暂不可用');
    assert.match(host.title, /蝴蝶图集读取失败/);
    assert.equal(w.MotionRuntime.instanceCount, 0);
  } finally {w.MotionThumbs?.disposeAll(); env.close();}
});

test('正式播放器重复载入蝴蝶后，插画和振翅缩略图仍读取目录内的原图', async () => {
  const env = await environment(), {w} = env;
  const script = w.document.createElement('script');
  Object.defineProperty(w.document, 'currentScript', {get: () => script, configurable: true});
  try {
    w.eval(await readFile(new URL('../catalog/thumbnails.js', import.meta.url), 'utf8'));
    // 使用正式构建的播放器，覆盖源码测试未执行的再次注册路径。
    for (const file of ['catalog/effects/butterfly.js', 'catalog/remotion-player.js']) {
      script.src = 'file:///wise-motion/' + file + '?revision=1';
      w.eval(await readFile(new URL('../' + file, import.meta.url), 'utf8'));
      for (const id of ['butterfly-illustration', 'hinged-wing-flap']) {
        const host = w.document.createElement('div'); w.document.body.append(host);
        w.MotionThumbs.attach(host, def(id)); env.reveal(); await w.MotionThumbs.whenIdle();
        assert.equal(host.dataset.previewState, 'ready');
        const images = [...host.querySelectorAll('img')];
        assert.equal(images.length, 7);
        for (const image of images) assert.equal(image.src, 'file:///wise-motion/catalog/assets/butterfly/wing-atlas.png', file + '：' + id);
        w.MotionThumbs.release(host, false); host.remove();
      }
    }
  } finally {w.MotionThumbs?.disposeAll(); env.close();}
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
