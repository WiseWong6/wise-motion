// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';
const settle = () => new Promise(resolve => setTimeout(resolve, 0));
async function animationSettled(predicate){
  for(let i=0;i<24&&!predicate();i++)await new Promise(resolve=>setTimeout(resolve,40));
  assert.ok(predicate(),'界面动画应在一秒内到达稳定状态');
}
const name = id => data.effects.find(effect => effect.id === id).name;
test('搜索清空已选分类，空结果与清除按钮能恢复完整目录', async () => {
  const env = await environment(true,{staticPreview:true});
  try {
    const {w} = env, d = w.document;
    const search = d.getElementById('search'), filter = d.getElementById('category-filter');
    const clear = d.getElementById('search-clear');
    assert.ok(clear.hidden);
    filter.value = 'continuous'; filter.dispatchEvent(new w.Event('change'));
    search.value = name('fade-rise'); search.dispatchEvent(new w.Event('input'));
    assert.equal(filter.value, 'all');
    assert.equal(filter.title, '全部动作');
    assert.ok(!clear.hidden);
    await new Promise(resolve => setTimeout(resolve, 160));
    assert.ok(d.querySelector('[data-effect="fade-rise"]'));
    search.value = 'zzzzzz'; search.dispatchEvent(new w.Event('input'));
    await new Promise(resolve => setTimeout(resolve, 160));
    assert.ok(!d.getElementById('empty').hidden);
    assert.ok(d.getElementById('effects-list').hidden);
    assert.equal(d.getElementById('empty').querySelector('p'), null);
    d.getElementById('clear-search').click();
    assert.equal(search.value, ''); assert.equal(d.activeElement, search);
    assert.ok(d.getElementById('empty').hidden); assert.ok(!d.getElementById('effects-list').hidden);
    assert.equal(d.querySelectorAll('.effect-item').length, data.effects.filter(e=>e.kind==='action').length);
    // 在延迟搜索尚未绘制时清空，旧搜索不能重新覆盖目录。
    search.value = name('fade-rise'); search.dispatchEvent(new w.Event('input'));
    clear.click();
    await new Promise(resolve => setTimeout(resolve, 160));
    assert.equal(search.value, ''); assert.ok(clear.hidden);
    assert.equal(d.activeElement, search);
    assert.equal(d.querySelectorAll('.effect-item').length, data.effects.filter(e=>e.kind==='action').length);
  } finally { env.close(); }
});

test('搜索框 Esc 立即清空筛选，取消旧搜索且不关闭有搜索内容的目录抽屉', async () => {
  const env = await environment(true,{staticPreview:true});
  try {
    const {w,directoryMedia} = env, d = w.document;
    const search = d.getElementById('search'), filter = d.getElementById('category-filter');
    const escape = () => search.dispatchEvent(new w.KeyboardEvent('keydown', {key:'Escape',bubbles:true,cancelable:true}));
    filter.value = 'continuous'; filter.dispatchEvent(new w.Event('change'));
    search.focus(); escape();
    assert.equal(filter.value, 'all'); assert.equal(d.activeElement, search);
    directoryMedia.matches = true; directoryMedia.dispatchEvent(new w.Event('change'));
    d.getElementById('toggle-directory').click();
    search.value = 'zzzzzz'; search.dispatchEvent(new w.Event('input'));
    escape();
    assert.equal(search.value, ''); assert.ok(d.getElementById('search-clear').hidden);
    assert.ok(!d.getElementById('directory-panel').hidden); assert.equal(d.activeElement, search);
    await new Promise(resolve => setTimeout(resolve, 160));
    assert.equal(d.querySelectorAll('.effect-item').length, data.effects.filter(e=>e.kind==='action').length);
    escape(); assert.ok(d.getElementById('directory-panel').hidden);
  } finally { env.close(); }
});

test('三栏目录筛选与节奏输出一致，相关弹窗不替换主预览且关闭后回收', async () => {
  const env = await environment(true,{staticPreview:true});
  try {
    const {w,listeners} = env, d = w.document;
    const click = selector => d.querySelector(selector).click();
    assert.equal(d.querySelectorAll('.effect-item').length,data.effects.filter(e=>e.kind==='action').length);
    assert.equal(d.querySelector('[aria-current="true"]').dataset.effect,'fade-rise');
    assert.equal(w.MotionRuntime.instanceCount,1); assert.equal(listeners.size,3);
    assert.equal(w.MotionRuntime.runningCount,0); assert.notEqual(d.getElementById('scrub').value,'0');
    const category = d.getElementById('category-filter'); category.value = 'continuous'; category.dispatchEvent(new w.Event('change'));
    assert.equal(d.querySelectorAll('.effect-item').length,w.MotionRegistry.effects.filter(e=>e.category==='continuous').length);
    assert.equal(d.getElementById('preview-title').textContent,name('fade-rise'));
    click('[data-kind="composition"]'); assert.equal(d.querySelectorAll('.effect-item').length,data.effects.filter(e=>e.kind==='composition').length);
    click('[data-kind="action"]');
    const search = d.getElementById('search'); search.value = '两排反向持续滚动，不要轮播，不要停顿'; search.dispatchEvent(new w.Event('input'));
    await new Promise(resolve => setTimeout(resolve, 160));
    assert.equal(d.querySelectorAll('.effect-item').length,1);
    click('[data-effect="dual-scroll"]');
    assert.equal(d.getElementById('preview-title').textContent,name('dual-scroll'));
    assert.equal(w.MotionRuntime.instanceCount,1); assert.equal(w.MotionRuntime.runningCount,0);
    assert.ok(d.getElementById('ease-label').hidden); assert.equal(d.getElementById('fixed-ease'),null);
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
    assert.match(d.getElementById('code').textContent,/"speed"\s*:\s*2/);
    assert.equal(d.getElementById('composition-panel').hidden,true);
    const duration = w.MotionRegistry.effects.find(effect => effect.id === 'dual-scroll').duration_ms;
    const elapsed = Number(d.getElementById('time-current').textContent);
    const left = Number(d.getElementById('time-total').textContent);
    assert.equal((elapsed + left).toFixed(1), (duration / 1000).toFixed(1));
    speed.value = .75; speed.dispatchEvent(new w.Event('input'));
    w.dispatchEvent(new w.Event('pagehide'));
    assert.equal(w.MotionRuntime.instanceCount,0); assert.equal(listeners.size,2);
    w.dispatchEvent(new w.Event('pageshow'));
    assert.equal(w.MotionRuntime.instanceCount,1); assert.equal(listeners.size,3);
    assert.equal(speed.value,'0.75');
  } finally { env.close(); }
});
test('目录卡片懒绘制各自的场景，不共用第一张的渲染结果，也不占用播放资源', async () => {
  const env = await environment(true,{staticPreview:true});
  try {
    const {w} = env, d = w.document;
    assert.equal(d.querySelectorAll('.thumb .motion-stage').length,0);
    env.reveal();await w.MotionThumbs.whenIdle();
    const shown = [...d.querySelectorAll('.effect-item')].map(card => [card.dataset.effect, card.querySelector('.thumb .motion-stage')?.dataset.effect]);
    assert.equal(shown.length,data.effects.filter(e=>e.kind==='action').length);
    assert.ok(shown.every(([id,painted]) => painted === id),shown.find(([id,painted]) => id !== painted)?.join('→'));
    // 缩略图只是静态一帧：不建计时器、不注册 ResizeObserver。
    assert.equal(w.MotionRuntime.instanceCount,1); assert.equal(env.listeners.size,3); assert.equal(w.MotionRuntime.runningCount,0);
    d.querySelector('[data-kind="composition"]').click();
    env.reveal();await w.MotionThumbs.whenIdle();
    const mixed = [...d.querySelectorAll('.effect-item')].map(card => [card.dataset.effect, card.querySelector('.thumb .motion-stage')?.dataset.effect]);
    assert.ok(mixed.every(([id,painted]) => painted === id));
    assert.ok(mixed.every(([id]) => w.MotionRegistry.effects.some(e => e.id === id && e.kind === 'composition')));
  } finally {env.close();}
});
test('本地动作不误标第三方来源，明确的代码改编和样式参考分别呈现', async () => {
  const env = await environment(true,{staticPreview:true});
  try {
    const {w} = env, d = w.document, source = d.getElementById('preview-source');
    const block = source.closest('.preview-source');
    let visited = 0;
    for (const kind of ['action','illustration','composition']) {
      d.querySelector(`[data-kind="${kind}"]`).click();
      for (const card of d.querySelectorAll('#effects-list [data-effect]')) {
        card.click();
        visited++;
        const effect=w.MotionKit.resolveVariant(w.MotionRegistry.effects.find(e=>e.id===card.dataset.effect));
        const references=[effect.source.reference,...(effect.source.additional_references||[])].filter(Boolean);
        if(references.length){
          for(const reference of references){
            assert.ok(source.textContent.includes(reference.credit_prefix || '效果参考'),card.dataset.effect+'：'+source.textContent);
            assert.ok(source.textContent.includes(reference.name));assert.ok(!block.hidden);
            if(reference.credit_suffix)assert.ok(source.textContent.includes(reference.credit_suffix));
            const link=[...source.querySelectorAll('a')].find(a=>a.textContent===reference.name);
            if(reference.url)assert.equal(link?.href,reference.url);
            else assert.equal(link,undefined);
          }
        }else{
          assert.equal(source.textContent, '', card.dataset.effect);assert.ok(block.hidden, card.dataset.effect);
        }
      }
    }
    assert.equal(visited, data.effects.length);
    d.querySelector('[data-kind="action"]').click();
    d.querySelector('[data-effect="glass-card-stagger"]').click();
    const glass=w.MotionRegistry.effects.find(e=>e.id==='glass-card-stagger');
    for(const variant of glass.variants){
      const select=d.getElementById('effect-variant');
      select.value=variant.id;select.dispatchEvent(new w.Event('change'));
      const reference=w.MotionKit.resolveVariant(glass,variant.id).source.reference;
      assert.ok(source.textContent.includes(reference.name),variant.label+' 应保留实际来源');
      if(reference.url)assert.equal(source.querySelector('a')?.href,reference.url);
    }
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
    assert.doesNotMatch(source.textContent, /改编自|Apache-2.0|自行开发|重新开发/);
    assert.ok(source.querySelector('a[href="https://gsap.com/"]'));
    delete effect.source.reference;
    d.querySelector('[data-effect="fade-rise"]').click();
    assert.equal(source.textContent, '');
    assert.ok(block.hidden);
  } finally { env.close(); }
});
test('右栏名称与两个输出共用复制按钮，复制失败时选中对应内容', async () => {
  const env = await environment(true,{staticPreview:true});
  try {
    const {w} = env, d = w.document;
    let copied = '';
    d.execCommand = command => {assert.equal(command,'copy');copied=d.activeElement.value;return true;};
    const titleCopy = d.getElementById('copy-title');
    assert.equal(titleCopy.closest('.ins-intro-head').querySelector('h1').id,'preview-title');
    assert.equal(titleCopy.className,d.getElementById('copy-prompt').className);
    assert.equal(titleCopy.querySelector('.copy-morph').innerHTML,d.getElementById('copy-prompt').querySelector('.copy-morph').innerHTML);
    assert.equal(titleCopy.getAttribute('aria-label'),'复制动效名称');
    titleCopy.click(); await settle();
    assert.equal(copied,name('fade-rise'));
    await animationSettled(()=>titleCopy.querySelector('[data-icon="check"]').style.opacity==='1');
    assert.equal(titleCopy.querySelector('[data-icon="check"]').style.opacity,'1');
    d.querySelector('[data-effect="scale-in"]').click();
    await animationSettled(()=>titleCopy.querySelector('[data-icon="check"]').style.opacity==='0');
    assert.equal(titleCopy.querySelector('[data-icon="check"]').style.opacity,'0');
    titleCopy.click(); await settle();
    assert.equal(copied,d.getElementById('preview-title').textContent);
    assert.notEqual(copied,name('fade-rise'));
    d.querySelector('[data-effect="fade-rise"]').click();
    d.getElementById('copy-prompt').click(); await settle();
    assert.match(copied,/请使用 Remotion 实现以下动效/); assert.doesNotMatch(copied,/来源与许可：/); assert.match(copied,/需要保留：/);
    d.getElementById('tab-code').click();
    assert.ok(!d.getElementById('panel-code').hidden); assert.ok(d.getElementById('panel-prompt').hidden);
    assert.equal(d.querySelector('#panel-code .output-label').textContent,'接入示例与源码路径');
    assert.equal(d.getElementById('copy-code').getAttribute('aria-label'),'复制代码');
    d.getElementById('copy-code').click(); await settle();
    assert.match(copied,/import \{Composition\} from 'remotion'/); assert.match(copied,/catalog\/effects\/entrance\.js/);
    assert.ok(copied.includes('/wise-motion/catalog/effects/entrance.js'),'复制保留当前目录实际绘制源码路径');
    assert.equal(d.querySelectorAll('textarea').length,0); assert.equal(d.getElementById('copy-status-code').textContent,'');
    Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:{writeText:async text=>{copied=text;}}});
    titleCopy.click(); await settle();
    assert.equal(copied,name('fade-rise'));
    assert.ok(!d.getElementById('panel-code').hidden);
    delete w.navigator.clipboard;
    d.execCommand = () => false;
    titleCopy.click(); await settle();
    assert.equal(w.getSelection().toString(),name('fade-rise'));
    assert.match(d.getElementById('copy-status-title').textContent,/系统复制快捷键/);
    assert.ok(!d.getElementById('panel-code').hidden); assert.ok(d.getElementById('panel-prompt').hidden);
    assert.equal(d.querySelectorAll('textarea').length,0);
    d.getElementById('tab-prompt').click(); d.getElementById('copy-prompt').click(); await settle();
    assert.equal(d.getElementById('copy-status-title').textContent,'');
    assert.match(w.getSelection().toString(),/动效说明/);
    assert.match(d.getElementById('copy-status-prompt').textContent,/系统复制快捷键/);
  } finally {env.close();}
});
test('键盘可选动作和输出，隐藏目录可找回，系统偏好变化不暂停', async () => {
  const env = await environment(true,{staticPreview:true});
  try {
    const {w} = env, d = w.document;
    const first = d.querySelector('[data-effect="fade-rise"]'); first.focus();
    first.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));
    assert.equal(d.activeElement.dataset.effect,'scale-in');
    d.activeElement.click();
    assert.equal(d.activeElement.dataset.effect,'scale-in');
    assert.equal(d.querySelector('[aria-current="true"]').dataset.effect,'scale-in');
    const directoryIcon = d.getElementById('toggle-directory').innerHTML;
    d.getElementById('tab-prompt').focus();
    d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
    assert.equal(d.activeElement.id,'tab-code'); assert.equal(d.activeElement.getAttribute('aria-selected'),'true');
    d.getElementById('toggle-directory').click();
    assert.ok(d.getElementById('directory-panel').hidden);
    await animationSettled(()=>d.getElementById('toggle-directory').innerHTML!==directoryIcon);
    assert.notEqual(d.getElementById('toggle-directory').innerHTML,directoryIcon);
    assert.equal(d.getElementById('toggle-directory').getAttribute('aria-label'),'展开动效目录');
    d.body.dispatchEvent(new w.KeyboardEvent('keydown',{key:'/',bubbles:true,cancelable:true}));
    assert.ok(!d.getElementById('directory-panel').hidden); assert.equal(d.activeElement.id,'search');
    assert.equal(d.getElementById('toggle-directory').getAttribute('aria-expanded'),'true');
    await animationSettled(()=>d.getElementById('toggle-directory').innerHTML===directoryIcon);
    assert.equal(d.getElementById('toggle-directory').innerHTML,directoryIcon);
    d.getElementById('toggle-play').click(); assert.equal(w.MotionRuntime.runningCount,1);
    env.media.matches = true; env.media.dispatchEvent(new w.Event('change'));
    assert.equal(w.MotionRuntime.runningCount,1); assert.equal(d.getElementById('motion-setting'),null);
    env.media.matches = false; env.media.dispatchEvent(new w.Event('change'));
    assert.equal(w.MotionRuntime.runningCount,1);
    d.getElementById('toggle-play').click();assert.equal(w.MotionRuntime.runningCount,0);
  } finally {env.close();}
});

test('目录抽屉关闭背景交互，选择后回到预览，回到桌面恢复原来的目录状态', async () => {
  const env = await environment(true,{staticPreview:true});
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
    d.querySelector('[data-effect="scale-in"]').click();
    assert.ok(directory.hidden); assert.ok(!d.querySelector('.stage').inert);
    assert.ok(!d.querySelector('.sidebar-header').inert);
    assert.equal(d.activeElement,toggle); assert.equal(w.MotionRuntime.instanceCount,1);
    assert.equal(d.getElementById('preview-title').textContent, data.effects.find(e=>e.id==='scale-in').name);
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
  const env = await environment(true,{staticPreview:true});
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
    assert.equal(d.querySelectorAll('.effect-item').length,w.MotionRegistry.effects.filter(e=>e.category==='continuous').length);
    const search = d.getElementById('search');
    search.value = '滚动'; search.dispatchEvent(new w.Event('input'));
    root.dispatchEvent(enter);
    assert.ok(menu.hidden);
    search.value = ''; search.dispatchEvent(new w.Event('input'));
    root.dispatchEvent(enter);
    assert.ok(!menu.hidden);
    directoryMedia.matches = true; directoryMedia.dispatchEvent(new w.Event('change'));
    d.getElementById('toggle-directory').click(); trigger.click();
    menu.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
    assert.ok(menu.hidden); assert.ok(!d.getElementById('directory-panel').hidden);
    trigger.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
    assert.ok(d.getElementById('directory-panel').hidden);
  } finally {env.close();}
});

test('缩略图保留完整画板，尺寸变化后重算，仍然只持有一个播放实例', async () => {
  const env = await environment(true,{staticPreview:true});
  try {
    const {w} = env, d = w.document;
    const host = d.querySelector('.thumb'); let width = 160;
    host.getBoundingClientRect = () => ({width,height:width*9/16});
    env.reveal();await w.MotionThumbs.whenIdle();
    assert.match(host.querySelector('.motion-stage').style.transform,/scale\(0\.25\)/);
    width = 128; w.dispatchEvent(new w.Event('resize'));
    assert.match(host.querySelector('.motion-stage').style.transform,/scale\(0\.2\)/);
    assert.equal(w.MotionRuntime.instanceCount,1); assert.equal(env.listeners.size,3);
  } finally {env.close();}
});
