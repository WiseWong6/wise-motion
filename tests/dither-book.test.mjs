// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {environment as sharedEnvironment,data} from './helpers.mjs';
async function environment(page=false){const env=await sharedEnvironment(page,{staticPreview:page});env.root=env.w.document.getElementById(page?'preview':'root');return env;}
test('翻页书接入既有版式，真实交互与时间演示切换保留纸页设置和输出',async()=>{
  const env=await environment(true,{staticPreview:true}),{w}=env,d=w.document,one=id=>d.getElementById(id),timer=clock();
  try{
    d.querySelector('[data-effect="dither-lab-book"]').click();
    assert.equal(one('preview-title').textContent,'绕脊翻页');assert.equal(one('book-panel').hidden,false);
    assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(one('book-timeline').getAttribute('aria-pressed'),'true');
    assert.match(one('preview-source').textContent,/效果参考 Amicro/);
    for(const [key,value] of [['padding',22],['radius',31],['crease',27]]){
      one('book-'+key).value=value;one('book-'+key).dispatchEvent(new w.Event('input'));
    }
    assert.equal(env.root.querySelector('.wm-book').style.getPropertyValue('--book-pad'),'22px');
    assert.match(one('prompt').textContent,/图片留白 22 像素，图片圆角 31 像素，书脊阴影 27%/);
    assert.match(one('code').textContent,/"paper_settings"/);
    w.anime.engine.pause();w.requestAnimationFrame=timer.requestFrame;w.cancelAnimationFrame=timer.cancelFrame;w.performance.now=timer.now;
    one('book-interactive').click();assert.equal(d.querySelector('.playbar').hidden,true);
    assert.equal(env.root.getAttribute('aria-hidden'),'false');assert.equal(one('ins-tempo').closest('.ins-section').hidden,true);
    const first=Number(env.root.querySelector('.wm-book').dataset.index);
    env.root.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
    timer.advance(450);assert.equal(Number(env.root.querySelector('.wm-book').dataset.index),(first+1)%6);
    assert.equal(one('preview-title').textContent,'绕脊翻页');
    one('book-prev').click();timer.advance(450);assert.equal(Number(env.root.querySelector('.wm-book').dataset.index),first);
    one('book-timeline').click();assert.equal(d.querySelector('.playbar').hidden,false);
    assert.equal(env.root.querySelector('.wm-book').style.getPropertyValue('--book-radius'),'31px');
    const scrub=one('scrub');scrub.value=750;scrub.dispatchEvent(new w.Event('input'));assert.equal(one('time-current').textContent,'5.7');
    assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
    one('book-reset').click();assert.equal(env.root.querySelector('.wm-book').style.getPropertyValue('--book-pad'),'10px');
  }finally{w.dispatchEvent(new w.Event('pagehide'));env.close();}
});
test('工作台隐藏或切换动效时暂停与释放真实翻页，方向键不会误选其他动效',async()=>{
  const env=await environment(true,{staticPreview:true}),{w,media}=env,d=w.document,one=id=>d.getElementById(id),timer=clock();
  try{
    d.querySelector('[data-effect="dither-lab-book"]').click();
    w.anime.engine.pause();w.requestAnimationFrame=timer.requestFrame;w.cancelAnimationFrame=timer.cancelFrame;w.performance.now=timer.now;
    one('book-interactive').click();
    media.matches=false;media.dispatchEvent(new w.Event('change'));
    one('book-next').click();assert.equal(timer.pending,1);timer.advance(90);
    assert(one('book-next').disabled);const before=visualState(env.root);
    Object.defineProperty(d,'hidden',{configurable:true,value:true});d.dispatchEvent(new w.Event('visibilitychange'));
    assert.equal(timer.pending,0);timer.advance(10000);assert.deepEqual(visualState(env.root),before);
    Object.defineProperty(d,'hidden',{configurable:true,value:false});d.dispatchEvent(new w.Event('visibilitychange'));
    timer.advance(360);assert.equal(one('book-next').disabled,false);assert.equal(timer.pending,0);
    one('book-next').click();assert.equal(timer.pending,1);
    d.querySelector('[data-effect="fade-rise"]').click();assert.equal(one('book-panel').hidden,true);assert.equal(timer.pending,0);
    assert.equal(d.querySelector('.playbar').hidden,false);assert.equal(w.MotionRuntime.instanceCount,1);
    assert.equal(env.root.querySelector('.wm-book'),null);
    const picture=env.root.innerHTML;one('book-next').click();assert.equal(env.root.innerHTML,picture);
  }finally{w.dispatchEvent(new w.Event('pagehide'));env.close();}
});
test('恢复页面保留交互方式、当前图稿与纸页设置，不残留旧控制器',async()=>{
  const env=await environment(true,{staticPreview:true}),{w}=env,d=w.document,one=id=>d.getElementById(id),timer=clock();
  try{
    d.querySelector('[data-effect="dither-lab-book"]').click();
    w.anime.engine.pause();w.requestAnimationFrame=timer.requestFrame;w.cancelAnimationFrame=timer.cancelFrame;w.performance.now=timer.now;
    one('book-interactive').click();one('book-next').click();timer.advance(450);
    const page=Number(env.root.querySelector('.wm-book').dataset.index);
    one('book-padding').value=19;one('book-padding').dispatchEvent(new w.Event('input'));
    w.dispatchEvent(new w.Event('pagehide'));assert.equal(w.MotionRuntime.instanceCount,0);
    w.dispatchEvent(new w.Event('pageshow'));assert.equal(w.MotionRuntime.instanceCount,1);
    assert.equal(one('book-interactive').getAttribute('aria-pressed'),'true');assert.equal(one('book-padding').value,'19');
    assert.equal(Number(env.root.querySelector('.wm-book').dataset.index),page);
    one('book-next').click();timer.advance(450);assert.equal(Number(env.root.querySelector('.wm-book').dataset.index),(page+1)%6);
  }finally{w.dispatchEvent(new w.Event('pagehide'));env.close();}
});
test('复制的翻页书代码可独立加载正式源码，保留三个设置并可重复定位',async()=>{
  const env=await environment(true,{staticPreview:true});
  try{
    const effect=data.effects.find(e=>e.id==='dither-lab-book');
    const html=env.w.MotionExport.code(effect,{speed:1.5,bookSettings:{padding:23,radius:32,crease:26}});
    const dom=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
    w.matchMedia=()=>({matches:true});w.ResizeObserver=class{observe(){}disconnect(){}};
    try{
      for(const script of w.document.querySelectorAll('script'))w.eval(script.src ? await readFile(new URL('../'+script.getAttribute('src'),import.meta.url),'utf8') : script.textContent);
      const shell=w.document.querySelector('.wm-book');
      assert.equal(shell.style.getPropertyValue('--book-pad'),'23px');assert.equal(shell.style.getPropertyValue('--book-radius'),'32px');assert.equal(shell.style.getPropertyValue('--book-crease'),'0.26');
      assert.equal(w.MotionDemo.speed,1.5);w.MotionDemo.seek(5590);const snapshot=w.document.getElementById('motion').innerHTML;
      w.MotionDemo.seek(0);w.MotionDemo.seek(5590);assert.equal(w.document.getElementById('motion').innerHTML,snapshot);
      w.dispatchEvent(new w.Event('pagehide'));assert.equal(w.MotionRuntime.instanceCount,0);
    }finally{w.MotionRuntime?.disposeAll();w.anime?.engine.pause();w.close();}
  }finally{env.w.dispatchEvent(new env.w.Event('pagehide'));env.close();}
});
function clock() {
  let time = 0, next = 0;
  const frames = new Map();
  return {now:()=>time,requestFrame:fn=>{frames.set(++next,fn);return next;},cancelFrame:id=>frames.delete(id),
    advance(ms){time+=ms;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(time));},
    get pending(){return frames.size;}};
}
const clean = value => JSON.parse(JSON.stringify(value));
const pages = root => [...root.querySelectorAll('.wm-book__paper')].map(node=>Number(node.dataset.page));
function visualState(root) {
  return [...root.querySelectorAll('.wm-book__body,.wm-book__leaf,.wm-book__paper,.wm-book__shade,.wm-book')].map(node=>({
    class:node.className,style:node.getAttribute('style'),hidden:node.hidden,page:node.dataset.page,index:node.dataset.index,busy:node.dataset.busy
  }));
}

await test('快速入场连续翻十次，停在第五幅，正常翻页先快后慢',async()=>{
  const env = await environment();
  try {
    const {introAt,introDuration,demoAt,duration} = env.w.WiseDitherBook;
    assert.equal(introAt(0).index,0);assert.equal(introAt(0).flip,null);
    for(let i=0;i<10;i++){
      const duration = i===9 ? 450 : 140;
      const state = introAt(300+i*210+duration/2);
      assert.equal(state.flip.from,i%6);assert.equal(state.flip.direction,1);
      assert.equal(state.flip.progress,i===9 ? .875 : .5);
    }
    assert.equal(introAt(introDuration).index,4);assert.equal(introAt(introDuration).flip,null);
    assert.equal(demoAt(duration).index,4);assert.equal(demoAt(duration).flip,null);
    assert.equal(demoAt(-999).index,0);assert.equal(demoAt(duration+999).index,4);
  }finally{env.close();}
});

await test('左右页真实点击与方向键翻页，循环边界正确，连续点击不会重入',async()=>{
  const env = await environment(), timer = clock();
  try {
    const book = env.w.WiseDitherBook.create(env.root,{interactive:true,intro:false,...timer});
    const left = env.root.querySelector('.wm-book__base--left'),right = env.root.querySelector('.wm-book__base--right');
    assert.deepEqual(pages(env.root).slice(0,2),[5,0]);
    right.click();assert(book.busy);assert.equal(book.next(),false);
    assert.deepEqual(pages(env.root),[5,1,0,0]);
    assert(env.root.querySelector('.wm-book__leaf').style.transform.includes('rotateY(0deg)'));
    timer.advance(90);
    const angle = Number(env.root.querySelector('.wm-book__leaf').style.transform.match(/rotateY\(([^d]+)deg\)/)[1]);
    assert(Math.abs(angle + 87.84)<1e-9);
    timer.advance(360);assert.equal(book.snapshot.index,1);assert.equal(book.busy,false);
    assert.deepEqual(pages(env.root).slice(0,2),[0,1]);
    left.click();assert.deepEqual(pages(env.root),[5,1,0,0]);
    assert(env.root.querySelector('.wm-book__leaf').style.transform.includes('rotateY(-180deg)'));
    timer.advance(450);assert.equal(book.snapshot.index,0);
    env.root.dispatchEvent(new env.w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));
    timer.advance(450);assert.equal(book.snapshot.index,5);
    env.root.dispatchEvent(new env.w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    timer.advance(450);assert.equal(book.snapshot.index,0);
    const input=env.w.document.createElement('input');env.root.append(input);
    input.dispatchEvent(new env.w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    assert.equal(book.busy,false);assert.equal(timer.pending,0);book.destroy();
  }finally{env.close();}
});

await test('翻页过程中修改纸页参数同步生效，数值限位，错误输入不污染状态',async()=>{
  const env = await environment(), timer = clock();
  try {
    const book = env.w.WiseDitherBook.create(env.root,{interactive:true,intro:false,...timer});book.next();timer.advance(90);
    const flip = clean(book.snapshot.flip);book.setSettings({padding:18,radius:33,crease:28});
    const shell = env.root.querySelector('.wm-book');
    assert.equal(shell.style.getPropertyValue('--book-pad'),'18px');assert.equal(shell.style.getPropertyValue('--book-radius'),'33px');
    assert.equal(shell.style.getPropertyValue('--book-crease'),'0.28');assert.deepEqual(clean(book.snapshot.flip),flip);
    book.setSettings({padding:-10,radius:200,crease:100});assert.deepEqual(clean(book.snapshot.settings),{padding:0,radius:40,crease:40});
    assert.throws(()=>book.setSettings({padding:12,radius:NaN}),/有限数字/);
    assert.deepEqual(clean(book.snapshot.settings),{padding:0,radius:40,crease:40});book.destroy();
  }finally{env.close();}
});

await test('暂停后等待不跳帧，恢复接续原角度，销毁后无待执行帧',async()=>{
  const env = await environment(),timer=clock();
  try {
    const book = env.w.WiseDitherBook.create(env.root,{interactive:true,intro:false,...timer});book.next();timer.advance(90);book.pause();
    const before=visualState(env.root);assert.equal(timer.pending,0);timer.advance(10000);assert.deepEqual(visualState(env.root),before);
    book.resume();timer.advance(360);assert.equal(book.snapshot.index,1);assert.equal(book.busy,false);
    book.prev();book.destroy();assert.equal(timer.pending,0);assert.equal(book.next(),false);assert.equal(env.root.children.length,0);
    book.destroy();assert.equal(timer.pending,0);
  }finally{env.close();}
});

await test('系统偏好为减少动态效果时仍保留入场与正常翻页动画',async()=>{
  const env=await environment(),timer=clock();
  try{
    assert.equal(env.media.matches,true);
    const intro=env.w.WiseDitherBook.create(env.root,{interactive:true,...timer});
    assert.equal(timer.pending,1);timer.advance(env.w.WiseDitherBook.introDuration);
    assert.equal(intro.snapshot.index,4);assert.equal(intro.busy,false);intro.destroy();
    const book=env.w.WiseDitherBook.create(env.root,{interactive:true,intro:false,...timer});
    book.next();assert.equal(book.busy,true);assert.equal(timer.pending,1);
    timer.advance(90);assert.ok(book.snapshot.flip.progress>0&&book.snapshot.flip.progress<1);
    env.media.matches=false;env.media.dispatchEvent(new env.w.Event('change'));
    env.media.matches=true;env.media.dispatchEvent(new env.w.Event('change'));
    assert.equal(book.busy,true);assert.equal(timer.pending,1);
    timer.advance(360);assert.equal(book.snapshot.index,1);assert.equal(book.busy,false);
    book.destroy();assert.equal(timer.pending,0);
  }finally{env.close();}
});

await test('任意顺序定位均还原同一纸面、角度和阴影，双实例图案标识不冲突',async()=>{
  const env = await environment(),timer=clock();
  try {
    const a=env.w.WiseDitherBook.create(env.root,{...timer});
    const second=env.w.document.createElement('div');env.w.document.body.append(second);
    const b=env.w.WiseDitherBook.create(second,{...timer});
    const times=[0,299,300,370,440,2190,2400,2640,3390,3749,3750,5590,6900,7600];
    for(const time of times){
      a.renderState(env.w.WiseDitherBook.demoAt(time));const before=visualState(env.root);
      for(const other of [7600,90,5590,0])a.renderState(env.w.WiseDitherBook.demoAt(other));
      a.renderState(env.w.WiseDitherBook.demoAt(time));assert.deepEqual(visualState(env.root),before);
      b.renderState(env.w.WiseDitherBook.demoAt(time));
      assert.deepEqual(pages(second),pages(env.root));
    }
    const ids=[...env.w.document.querySelectorAll('pattern[id]')].map(node=>node.id);assert.equal(new Set(ids).size,ids.length);
    assert.equal(timer.pending,0);a.destroy();b.destroy();
  }finally{env.close();}
});
