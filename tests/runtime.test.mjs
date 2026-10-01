// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {data, environment} from './helpers.mjs';
test('全部标准样例在任意定位后均可回到相同画面，资源可全部释放', async () => {
  const env = await environment();
  try {
    const {w,listeners} = env, root = w.document.getElementById('root');
    for (const e of data.effects) {
      const player = w.MotionRuntime.create(root, e);
      assert.equal(w.MotionRuntime.instanceCount, 1, e.id);
      assert.equal(w.MotionRuntime.runningCount, 0, e.id);
      for (const p of [0,.2,.48,.8,1]) {
        const time = e.duration_ms * p;
        player.seek(time); const snapshot = root.innerHTML;
        assert.ok(!/NaN|Infinity|undefined/.test(snapshot), e.id + ' 有无效画面参数');
        player.seek(e.duration_ms * (1 - p)); player.seek(time);
        assert.equal(root.innerHTML, snapshot, e.id + ' 反复定位改变了结果');
      }
      for (const easing of e.parameters.ease?.options || ['linear']) {
        player.setEase(easing); player.seek(e.preview_ms); const snapshot = root.innerHTML;
        player.seek(0); player.seek(e.preview_ms); assert.equal(root.innerHTML, snapshot, e.id + ' 调节节奏后不可重复');
      }
      player.setSpeed(.5); assert.equal(player.speed, .5);
      player.setSpeed(2); assert.equal(player.speed, 2);
      player.play(); assert.equal(w.MotionRuntime.runningCount, 1);
      player.pause(); assert.equal(w.MotionRuntime.runningCount, 0);
      player.restart(false); assert.equal(player.currentTime, 0); assert.ok(player.paused);
      player.destroy(); player.destroy();
      assert.equal(w.MotionRuntime.instanceCount, 0);
      assert.equal(listeners.size, 0);
      assert.equal(root.innerHTML, '');
    }
  } finally { env.close(); }
});
test('持续滚动周期接缝、逐项顺序和环境触发按定义执行', async () => {
  const env = await environment();
  try {
    const {w} = env, root = w.document.getElementById('root'), M = w.MotionKit;
    const e = data.effects.find(x => x.id === 'dual-scroll');
    const render = w.MotionFactories[e.id](root, M, e);
    render(0,{ease:'linear',duration:e.duration_ms,elapsed:0}); const initial = root.innerHTML;
    assert.match(root.querySelectorAll('.strip-row')[0].style.transform, /-640px/);
    assert.match(root.querySelectorAll('.strip-row')[1].style.transform, /640px/);
    render(0,{ease:'linear',duration:e.duration_ms,elapsed:e.duration_ms}); const loop = root.innerHTML;
    render(e.duration_ms,{ease:'linear',duration:e.duration_ms,elapsed:e.duration_ms});
    assert.equal(root.innerHTML, loop); assert.notEqual(initial, loop);
    const tracks = root.querySelectorAll('.scroll-track');
    assert.match(tracks[0].style.transform, /-672px/); assert.match(tracks[1].style.transform, /0px/);
    let player = w.MotionRuntime.create(root, data.effects.find(x => x.id === 'stagger-in'));
    player.seek(700); const cards = [...root.querySelectorAll('.mini-card')];
    assert.ok(Number(cards[0].style.opacity) > Number(cards[1].style.opacity));
    assert.ok(Number(cards[1].style.opacity) > Number(cards[2].style.opacity)); player.destroy();
    player = w.MotionRuntime.create(root, data.effects.find(x => x.id === 'ripple'));
    player.seek(1200); assert.ok([...root.querySelectorAll('.ripple-ring')].every(x => x.style.opacity === '0'));
    player.seek(1700); assert.ok([...root.querySelectorAll('.ripple-ring')].some(x => Number(x.style.opacity) > 0)); player.destroy();
    player = w.MotionRuntime.create(root, data.effects.find(x => x.id === 'environment-chain'));
    player.seek(6000); assert.ok([...root.querySelectorAll('.ripple-ring')].every(x => x.style.opacity === '0'));
    player.seek(7400); assert.ok([...root.querySelectorAll('.ripple-ring')].some(x => Number(x.style.opacity) > 0)); player.destroy();
  } finally { env.close(); }
});
test('数字和逐字显现的允许节奏不会反向退回', async () => {
  const env = await environment();
  try {
    const {w} = env, root = w.document.getElementById('root');
    for (const id of ['count-up','type-reveal']) {
      const e = data.effects.find(x => x.id === id);
      const player = w.MotionRuntime.create(root,e);
      for (const easing of e.parameters.ease.options) {
        player.setEase(easing); let previous = 0;
        for (let t = 0; t <= e.duration_ms; t += 50) {
          player.seek(t);
          const value = id === 'count-up' ? Number(root.querySelector('.big-number').textContent) : [...root.querySelectorAll('.headline span')].filter(c => c.style.opacity === '1').length;
          assert.ok(value >= previous, id + ' 的已显示内容退回了'); previous = value;
        }
      }
      player.destroy();
    }
  } finally {env.close();}
});
test('真实 Anime.js 计时器可前进和暂停，销毁后不再回调', async () => {
  const env = await environment();
  try {
    const {w} = env; let callbacks = 0;
    const player = w.MotionRuntime.create(w.document.getElementById('root'), data.effects[0], {onUpdate() {callbacks++;}});
    player.play(); await new Promise(resolve => setTimeout(resolve, 100));
    assert.ok(player.currentTime > 0); player.pause(); const time = player.currentTime;
    await new Promise(resolve => setTimeout(resolve, 40)); assert.equal(player.currentTime, time);
    player.destroy(); const count = callbacks;
    await new Promise(resolve => setTimeout(resolve, 40)); assert.equal(callbacks, count);
    assert.throws(() => {const p = w.MotionRuntime.create(w.document.getElementById('root'),data.effects[0]); try {p.seek(NaN);} finally {p.destroy();}}, /有限数字/);
  } finally { env.close(); }
});
