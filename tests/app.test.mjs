// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';
const settle = () => new Promise(resolve => setTimeout(resolve, 0));
test('三栏目录筛选、常驻预览和节奏输出一致，只持有一个动画', async () => {
  const env = await environment(true);
  try {
    const {w,listeners} = env, d = w.document;
    const click = selector => d.querySelector(selector).click();
    assert.equal(d.querySelectorAll('.effect-item').length,72);
    assert.equal(d.querySelector('[aria-current="true"]').dataset.effect,'fade-rise');
    assert.equal(w.MotionRuntime.instanceCount,1); assert.equal(listeners.size,4);
    assert.equal(w.MotionRuntime.runningCount,0); assert.notEqual(d.getElementById('scrub').value,'0');
    const category = d.getElementById('category-filter'); category.value = 'continuous'; category.dispatchEvent(new w.Event('change'));
    assert.equal(d.querySelectorAll('.effect-item').length,4);
    assert.equal(d.getElementById('preview-title').textContent,'渐入上移');
    click('[data-kind="composition"]'); assert.equal(d.querySelectorAll('.effect-item').length,6);
    const search = d.getElementById('search'); search.value = '两排反向持续滚动，不要轮播，不要停顿'; search.dispatchEvent(new w.Event('input'));
    await new Promise(resolve => setTimeout(resolve, 160));
    assert.equal(d.querySelectorAll('.effect-item').length,1);
    click('[data-effect="dual-scroll"]');
    assert.equal(d.getElementById('preview-title').textContent,'双排反向持续滚动');
    assert.equal(w.MotionRuntime.instanceCount,1); assert.equal(w.MotionRuntime.runningCount,0);
    assert.ok(d.getElementById('ease-label').hidden); assert.ok(!d.getElementById('fixed-ease').hidden);
    click('#toggle-play'); assert.equal(w.MotionRuntime.runningCount,1);
    assert.equal(d.getElementById('toggle-play').getAttribute('aria-label'),'暂停当前动效');
    click('#toggle-play'); assert.equal(w.MotionRuntime.runningCount,0);
    assert.equal(d.getElementById('toggle-play').getAttribute('aria-label'),'播放当前动效');
    const scrub = d.getElementById('scrub'); scrub.value = 500; scrub.dispatchEvent(new w.Event('input'));
    assert.equal(d.getElementById('time').textContent,'已播放 4.0 秒，剩余 4.0 秒');
    assert.equal(d.getElementById('time-current').textContent,'4.0');
    assert.equal(d.getElementById('time-total').textContent,'4.0');
    assert.equal(scrub.getAttribute('aria-valuetext'),'4.0 秒，剩余 4.0 秒');
    assert.equal(scrub.style.getPropertyValue('--fill'),'50%');
    for (const [value, current, left] of [[0,'0.0','8.0'],[1000,'8.0','0.0']]) {
      scrub.value = value; scrub.dispatchEvent(new w.Event('input'));
      assert.equal(d.getElementById('time-current').textContent,current);
      assert.equal(d.getElementById('time-total').textContent,left);
      assert.equal(w.MotionRuntime.runningCount,0);
    }
    click('#restart');
    assert.equal(d.getElementById('time-current').textContent,'0.0');
    assert.equal(d.getElementById('time-total').textContent,'8.0');
    assert.equal(w.MotionRuntime.runningCount,1);
    click('#toggle-play'); assert.equal(w.MotionRuntime.runningCount,0);
    const speed = d.getElementById('speed'); speed.value = 2; speed.dispatchEvent(new w.Event('input'));
    assert.match(d.getElementById('prompt').textContent,/4\.00 秒/);
    assert.match(d.getElementById('code').textContent,/player\.setSpeed\(2\)/);
    click('[data-related="seamless-scroll"]');
    assert.equal(w.MotionRuntime.instanceCount,1); assert.equal(listeners.size,4);
    assert.equal(d.getElementById('preview-title').textContent,'无缝滚动');
    assert.equal(d.querySelector('[aria-current="true"]').dataset.effect,'seamless-scroll');
    const duration = w.MotionRegistry.effects.find(effect => effect.id === 'seamless-scroll').duration_ms;
    const elapsed = Number(d.getElementById('time-current').textContent);
    const left = Number(d.getElementById('time-total').textContent);
    assert.equal((elapsed + left).toFixed(1), (duration / 1000).toFixed(1));
    speed.value = .75; speed.dispatchEvent(new w.Event('input'));
    w.dispatchEvent(new w.Event('pagehide'));
    assert.equal(w.MotionRuntime.instanceCount,0); assert.equal(listeners.size,3);
    w.dispatchEvent(new w.Event('pageshow'));
    assert.equal(w.MotionRuntime.instanceCount,1); assert.equal(listeners.size,4);
    assert.equal(speed.value,'0.75');
  } finally { env.close(); }
});
test('目录卡片懒绘制各自的场景，不共用第一张的渲染结果，也不占用播放资源', async () => {
  const env = await environment(true);
  try {
    const {w} = env, d = w.document;
    assert.equal(d.querySelectorAll('.thumb .motion-stage').length,0);
    env.reveal();
    const shown = [...d.querySelectorAll('.effect-item')].map(card => [card.dataset.effect, card.querySelector('.thumb .motion-stage')?.dataset.effect]);
    assert.equal(shown.length,72);
    assert.ok(shown.every(([id,painted]) => painted === id),shown.find(([id,painted]) => id !== painted)?.join('→'));
    // 缩略图只是静态一帧：不建计时器、不注册 ResizeObserver。
    assert.equal(w.MotionRuntime.instanceCount,1); assert.equal(env.listeners.size,4); assert.equal(w.MotionRuntime.runningCount,0);
    d.querySelector('[data-kind="composition"]').click();
    env.reveal();
    const mixed = [...d.querySelectorAll('.effect-item')].map(card => [card.dataset.effect, card.querySelector('.thumb .motion-stage')?.dataset.effect]);
    assert.ok(mixed.every(([id,painted]) => painted === id));
    assert.ok(mixed.every(([id]) => w.MotionRegistry.effects.some(e => e.id === id && e.kind === 'composition')));
  } finally {env.close();}
});
test('本地动作不误标第三方来源，明确的代码改编和样式参考分别呈现', async () => {
  const env = await environment(true);
  try {
    const {w} = env, d = w.document, source = d.getElementById('preview-source');
    const block = source.closest('.preview-source');
    let visited = 0;
    for (const kind of ['action','composition']) {
      d.querySelector(`[data-kind="${kind}"]`).click();
      for (const card of d.querySelectorAll('#effects-list [data-effect]')) {
        card.click();
        visited++;
        assert.equal(source.textContent, '', card.dataset.effect);
        assert.ok(block.hidden, card.dataset.effect);
      }
    }
    assert.equal(visited, 78);
    d.querySelector('[data-kind="action"]').click();
    const effect = w.MotionRegistry.effects.find(e => e.id === 'fade-rise');
    effect.source.origin = 'adapted';
    effect.source.upstream = {name:'授权示例',url:'https://example.com/source',license:'MIT',license_url:'https://example.com/license'};
    d.querySelector('[data-effect="fade-rise"]').click();
    assert.match(source.textContent, /AI 改编自 授权示例 的代码，遵循 MIT 许可/);
    assert.ok(!block.hidden);
    assert.doesNotMatch(source.textContent, /本动作由 AI 自行开发/);
    for (const link of source.querySelectorAll('a')) {
      assert.equal(link.target, '_blank');
      assert.equal(link.rel, 'noopener noreferrer');
      assert.equal(new URL(link.href).protocol, 'https:');
    }
    effect.source.upstream.license = '';
    d.querySelector('[data-effect="fade-rise"]').click();
    assert.match(source.textContent, /代码来源与协议待核实/);
    assert.doesNotMatch(source.textContent, /改编自|本动作由 AI 自行开发/);
    effect.source.origin = 'original';
    effect.source.reference = {name:'GSAP 动作样式参考',url:'https://gsap.com/'};
    d.querySelector('[data-effect="fade-rise"]').click();
    assert.match(source.textContent, /效果参考 GSAP 动作样式参考/);
    assert.ok(!block.hidden);
    assert.doesNotMatch(source.textContent, /改编自|AGPL|自行开发|重新开发/);
    assert.ok(source.querySelector('a[href="https://gsap.com/"]'));
    delete effect.source.reference;
    d.querySelector('[data-effect="fade-rise"]').click();
    assert.equal(source.textContent, '');
    assert.ok(block.hidden);
  } finally { env.close(); }
});
test('右栏两个输出的小按钮可直接复制，复制失败时选中当前内容', async () => {
  const env = await environment(true);
  try {
    const {w} = env, d = w.document;
    let copied = '';
    d.execCommand = command => {assert.equal(command,'copy');copied=d.activeElement.value;return true;};
    d.getElementById('copy-prompt').click(); await settle();
    assert.match(copied,/请实现以下动效/); assert.doesNotMatch(copied,/来源与许可：/); assert.match(copied,/需要保留：/);
    d.getElementById('tab-code').click();
    assert.ok(!d.getElementById('panel-code').hidden); assert.ok(d.getElementById('panel-prompt').hidden);
    assert.equal(d.getElementById('copy-code').getAttribute('aria-label'),'复制代码');
    d.getElementById('copy-code').click(); await settle();
    assert.match(copied,/<!doctype html>/); assert.match(copied,/catalog\/effects\/entrance\.js/);
    assert.equal(d.querySelectorAll('textarea').length,0); assert.equal(d.getElementById('copy-status-code').textContent,'');
    d.execCommand = () => false;
    d.getElementById('tab-prompt').click(); d.getElementById('copy-prompt').click(); await settle();
    assert.match(w.getSelection().toString(),/动效说明/);
    assert.match(d.getElementById('copy-status-prompt').textContent,/系统复制快捷键/);
  } finally {env.close();}
});
test('键盘可选动作和输出，隐藏目录可找回，系统减少动态效果会暂停', async () => {
  const env = await environment(true);
  try {
    const {w} = env, d = w.document;
    const first = d.querySelector('[data-effect="fade-rise"]'); first.focus();
    first.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));
    assert.equal(d.activeElement.dataset.effect,'mask-reveal');
    d.activeElement.click();
    assert.equal(d.activeElement.dataset.effect,'mask-reveal');
    assert.equal(d.querySelector('[aria-current="true"]').dataset.effect,'mask-reveal');
    const directoryIcon = d.getElementById('toggle-directory').innerHTML;
    d.getElementById('tab-prompt').focus();
    d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
    assert.equal(d.activeElement.id,'tab-code'); assert.equal(d.activeElement.getAttribute('aria-selected'),'true');
    d.getElementById('toggle-directory').click();
    assert.ok(d.getElementById('directory-panel').hidden);
    assert.notEqual(d.getElementById('toggle-directory').innerHTML,directoryIcon);
    assert.equal(d.getElementById('toggle-directory').getAttribute('aria-label'),'展开动效目录');
    d.body.dispatchEvent(new w.KeyboardEvent('keydown',{key:'/',bubbles:true,cancelable:true}));
    assert.ok(!d.getElementById('directory-panel').hidden); assert.equal(d.activeElement.id,'search');
    assert.equal(d.getElementById('toggle-directory').getAttribute('aria-expanded'),'true');
    assert.equal(d.getElementById('toggle-directory').innerHTML,directoryIcon);
    d.getElementById('toggle-play').click(); assert.equal(w.MotionRuntime.runningCount,1);
    env.media.matches = true; env.media.dispatchEvent(new w.Event('change'));
    assert.equal(w.MotionRuntime.runningCount,0); assert.ok(!d.getElementById('motion-setting').hidden);
    env.media.matches = false; env.media.dispatchEvent(new w.Event('change'));
    assert.equal(w.MotionRuntime.runningCount,0); // 取消系统限制不自行播放。
  } finally {env.close();}
});

test('目录抽屉关闭背景交互，选择后回到预览，回到桌面恢复原来的目录状态', async () => {
  const env = await environment(true);
  try {
    const {w,directoryMedia} = env, d = w.document;
    const directory = d.getElementById('directory-panel'), toggle = d.getElementById('toggle-directory');
    directoryMedia.matches = true; directoryMedia.dispatchEvent(new w.Event('change'));
    assert.ok(directory.hidden); assert.equal(w.MotionRuntime.instanceCount,1);
    toggle.focus(); toggle.click();
    assert.ok(!directory.hidden); assert.equal(directory.getAttribute('aria-modal'),'true');
    assert.equal(d.activeElement.id,'search'); assert.ok(d.querySelector('.stage').inert);
    assert.ok(d.querySelector('.sidebar-header').inert);
    assert.ok(!d.getElementById('directory-backdrop').hidden);
    d.querySelector('[data-effect="mask-reveal"]').click();
    assert.ok(directory.hidden); assert.ok(!d.querySelector('.stage').inert);
    assert.ok(!d.querySelector('.sidebar-header').inert);
    assert.equal(d.activeElement,toggle); assert.equal(w.MotionRuntime.instanceCount,1);
    assert.equal(d.getElementById('preview-title').textContent,'遮罩显现');
    toggle.click();
    d.getElementById('search').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
    assert.ok(directory.hidden);
    directoryMedia.matches = false; directoryMedia.dispatchEvent(new w.Event('change'));
    assert.ok(!directory.hidden); assert.equal(directory.getAttribute('role'),null);
    toggle.click();
    directoryMedia.matches = true; directoryMedia.dispatchEvent(new w.Event('change'));
    directoryMedia.matches = false; directoryMedia.dispatchEvent(new w.Event('change'));
    assert.ok(directory.hidden); // 桌面主动收起的状态不会被窄屏切换丢掉。
  } finally {env.close();}
});

test('悬停菜单能接住点击和键盘，浮层选中后回到原处，先关闭菜单再关闭目录抽屉', async () => {
  const env = await environment(true);
  try {
    const {w,directoryMedia} = env, d = w.document;
    const root = d.querySelector('.search-control'), menu = d.getElementById('category-options');
    const trigger = d.getElementById('category-filter');
    root.querySelector('.search').getBoundingClientRect = () => ({top:100,bottom:136,left:12,width:280});
    const enter = new w.Event('pointerenter'); Object.defineProperty(enter,'pointerType',{value:'mouse'});
    root.dispatchEvent(enter);
    assert.ok(!menu.hidden); assert.equal(menu.parentElement,d.body);
    trigger.click(); // 鼠标已悬停打开，此时点击应进入选择而不是误关。
    assert.ok(!menu.hidden); assert.equal(d.activeElement.getAttribute('role'),'option');
    menu.querySelector('[data-value="continuous"]').click();
    assert.ok(menu.hidden); assert.equal(menu.parentElement,root);
    assert.equal(d.querySelectorAll('.effect-item').length,4);
    directoryMedia.matches = true; directoryMedia.dispatchEvent(new w.Event('change'));
    d.getElementById('toggle-directory').click(); trigger.click();
    menu.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
    assert.ok(menu.hidden); assert.ok(!d.getElementById('directory-panel').hidden);
    trigger.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
    assert.ok(d.getElementById('directory-panel').hidden);
  } finally {env.close();}
});

test('缩略图保留完整画板，尺寸变化后重算，仍然只持有一个播放实例', async () => {
  const env = await environment(true);
  try {
    const {w} = env, d = w.document;
    const host = d.querySelector('.thumb'); let width = 160;
    host.getBoundingClientRect = () => ({width,height:width*9/16});
    env.reveal();
    assert.match(host.querySelector('.motion-stage').style.transform,/scale\(0\.25\)/);
    width = 128; w.dispatchEvent(new w.Event('resize'));
    assert.match(host.querySelector('.motion-stage').style.transform,/scale\(0\.2\)/);
    assert.equal(w.MotionRuntime.instanceCount,1); assert.equal(env.listeners.size,4);
  } finally {env.close();}
});
