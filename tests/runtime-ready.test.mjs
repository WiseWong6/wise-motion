// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const definition={id:'preparation-test',duration_ms:1000,preview_ms:640,default_ease:'linear',loop:false,parameters:{speed:{min:.5,max:2}}};
async function environment(thumbnails=false){
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'file:///wise-motion/catalog/index.html',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  w.ResizeObserver=class{observe(){}disconnect(){}};
  w.IntersectionObserver=undefined;
  for(const file of ['vendor/animejs/anime.umd.min.js','catalog/runtime.js',...(thumbnails?['catalog/thumbnails.js']:[])])w.eval(await readFile(new URL('../'+file,import.meta.url),'utf8'));
  return {w,root:w.document.getElementById('root'),close(){w.MotionThumbs?.disposeAll();w.MotionRuntime.disposeAll();w.anime.engine.pause();dom.window.close();}};
}
function delayedFactory(w,id=definition.id){
  let resolve,reject,destroyed=0;
  const frames=[],states=[],definitions=[];
  const ready=new Promise((yes,no)=>{resolve=yes;reject=no;});
  const factory=(stage,_kit,effect)=>{
    definitions.push(effect);
    const render=(time,state)=>{frames.push(time);states.push(state);stage.dataset.time=String(time);};
    render.ready=ready;
    render.destroy=()=>{destroyed++;};
    return render;
  };
  factory.requiresPreparation=true;
  w.MotionFactories[id]=factory;
  return {resolve,reject,frames,states,definitions,get destroyed(){return destroyed;}};
}

test('准备期间计时保持不动，定位和倍速保留，准备完成后才继续播放',async()=>{
  const env=await environment();
  try{
    const {w,root}=env,source=delayedFactory(w),updates=[];
    const player=w.MotionRuntime.create(root,definition,{autoplay:true,onUpdate(state){updates.push(state);}});
    assert.equal(player.preparing,true);assert.equal(player.paused,false);
    assert.equal(root.firstElementChild.dataset.preparation,'preparing');
    await delay(80);assert.equal(player.currentTime,0);
    player.seek(410);player.seek(670);player.setSpeed(.5);
    assert.equal(player.currentTime,670);assert.equal(player.elapsedTime,670);
    await delay(60);assert.equal(player.currentTime,670);
    source.resolve();assert.equal(await player.ready,true);
    assert.equal(player.preparing,false);assert.equal(player.error,null);
    assert.equal(source.frames.at(-1),670);assert.equal(player.speed,.5);
    assert.equal(root.firstElementChild.dataset.preparation,'ready');
    assert.equal(updates.at(-1).preparing,false);assert.equal(updates.at(-1).paused,false);
    await delay(90);assert.ok(player.currentTime>670,'准备完成后计时器才应前进');
    player.pause();const time=player.currentTime;await delay(45);assert.equal(player.currentTime,time);
  }finally{env.close();}
});

test('准备期间暂停和不播放重置会取消播放意图，循环定位保留累计时间',async()=>{
  const env=await environment();
  try{
    const {w,root}=env,source=delayedFactory(w);
    const player=w.MotionRuntime.create(root,{...definition,loop:true},{autoplay:true});
    player.pause();player.seekElapsed(3400);
    assert.equal(player.currentTime,400);assert.equal(player.elapsedTime,3400);assert.equal(player.paused,true);
    source.resolve();assert.equal(await player.ready,true);
    assert.equal(source.frames.at(-1),400);assert.equal(source.states.at(-1).elapsed,3400);
    await delay(60);assert.equal(player.currentTime,400);assert.equal(player.paused,true);
    player.destroy();
    const next=delayedFactory(w),restarted=w.MotionRuntime.create(root,definition,{autoplay:true});
    restarted.seek(800);restarted.restart(false);assert.equal(restarted.currentTime,0);assert.equal(restarted.paused,true);
    next.resolve();await restarted.ready;await delay(50);assert.equal(restarted.currentTime,0);assert.equal(restarted.paused,true);
  }finally{env.close();}
});

test('销毁后迟到准备成功或失败不会绘制、播放或通知',async()=>{
  const env=await environment();
  try{
    const {w,root}=env;
    for(const failure of [false,true]){
      const source=delayedFactory(w);let updates=0;
      const player=w.MotionRuntime.create(root,definition,{autoplay:true,onUpdate(){updates++;}});
      player.seek(620);player.destroy();player.destroy();
      const frames=source.frames.length,count=updates;
      if(failure)source.reject(new Error('迟到的测试错误'));else source.resolve();
      assert.equal(await player.ready,false);await delay(40);
      assert.equal(source.frames.length,frames);assert.equal(updates,count);
      assert.equal(source.destroyed,1);assert.equal(root.childElementCount,0);
      assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(w.MotionRuntime.runningCount,0);
    }
  }finally{env.close();}
});

test('准备失败显示可核对的错误并停止计时，等待接口不会产生未处理拒绝',async()=>{
  const env=await environment();
  try{
    const {w,root}=env,source=delayedFactory(w),player=w.MotionRuntime.create(root,definition,{autoplay:true});
    source.reject(new Error('形状文件不存在'));
    assert.equal(await player.ready,false);assert.match(player.error.message,/形状文件不存在/);
    assert.equal(player.preparing,false);assert.equal(player.paused,true);
    assert.equal(root.firstElementChild.dataset.preparation,'failed');
    assert.match(root.querySelector('[role="alert"]').textContent,/动画准备失败：形状文件不存在/);
    player.play();await delay(60);assert.equal(player.currentTime,0);assert.equal(player.paused,true);
  }finally{env.close();}
});

test('统一节奏包装传递准备与销毁，已有同步工厂仍立即播放',async()=>{
  const env=await environment();
  try{
    const {w,root}=env,source=delayedFactory(w);
    const timing={source_duration_ms:2000,source_preview_ms:1000,source_start_ms:400,source_end_ms:1600,start_ms:150,end_ms:850};
    const player=w.MotionRuntime.create(root,{...definition,timing});
    assert.equal(player.preparing,true);player.seek(500);source.resolve();await player.ready;
    assert.equal(source.definitions[0].duration_ms,2000);assert.equal(source.frames.at(-1),1000);
    player.destroy();assert.equal(source.destroyed,1);
    w.MotionFactories[definition.id]=stage=>time=>{stage.dataset.time=String(time);};
    const legacy=w.MotionRuntime.create(root,definition,{autoplay:true});
    assert.equal(legacy.preparing,false);assert.equal(legacy.paused,false);assert.equal(await legacy.ready,true);
    assert.equal(root.firstElementChild.dataset.preparation,undefined);
    await delay(70);assert.ok(legacy.currentTime>0);
  }finally{env.close();}
});

function host(w){const node=w.document.createElement('div');node.className='thumb';node.getBoundingClientRect=()=>({width:160,height:90});w.document.body.append(node);return node;}

test('异步缩略图逐个准备并仅画代表时刻，画完释放资源且不建立播放器',async()=>{
  const env=await environment(true);
  try{
    const {w}=env,first=delayedFactory(w),second=delayedFactory(w,'preparation-next');
    const a=host(w),b=host(w),next={...definition,id:'preparation-next',preview_ms:720};
    w.MotionThumbs.attach(a,definition);w.MotionThumbs.attach(b,next);
    let finished=false;const idle=w.MotionThumbs.whenIdle().then(()=>{finished=true;});
    await delay(0);assert.equal(first.definitions.length,1);assert.equal(second.definitions.length,0);assert.equal(finished,false);
    assert.equal(first.definitions[0].poster_only,true);assert.equal(first.definitions[0].poster_time_ms,640);
    assert.equal(w.MotionRuntime.instanceCount,0);
    first.resolve();await delay(0);
    assert.deepEqual(first.frames,[640]);assert.equal(first.destroyed,1);assert.equal(second.definitions.length,1);
    assert.equal(a.querySelector('.motion-stage').dataset.time,'640');assert.match(a.querySelector('.motion-stage').style.transform,/scale\(0\.25\)/);
    second.resolve();await idle;assert.equal(finished,true);
    assert.deepEqual(second.frames,[720]);assert.equal(second.destroyed,1);
    assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(w.MotionRuntime.runningCount,0);
  }finally{env.close();}
});

test('移除正在准备的缩略图会立即释放并让后续条目继续，迟到结果不覆盖新卡片',async()=>{
  const env=await environment(true);
  try{
    const {w}=env,old=delayedFactory(w),next=delayedFactory(w,'preparation-next'),node=host(w),other=host(w);
    w.MotionThumbs.attach(node,definition);w.MotionThumbs.attach(other,{...definition,id:'preparation-next'});
    await delay(0);assert.equal(old.definitions.length,1);
    w.MotionThumbs.release(node);assert.equal(old.destroyed,1);assert.equal(node.childElementCount,0);
    await delay(0);assert.equal(next.definitions.length,1,'取消等待后应开始后面的条目');
    const replacement=w.document.createElement('span');replacement.textContent='新的卡片';node.append(replacement);
    old.resolve();next.resolve();await w.MotionThumbs.whenIdle();
    assert.equal(old.frames.length,0);assert.equal(old.destroyed,1);assert.equal(node.textContent,'新的卡片');
    assert.deepEqual(next.frames,[640]);assert.equal(next.destroyed,1);
  }finally{env.close();}
});

test('一个异步缩略图准备失败不阻塞后续，同步缩略图沿原路径绘制',async()=>{
  const env=await environment(true);
  try{
    const {w}=env,failed=delayedFactory(w),next=delayedFactory(w,'preparation-next'),a=host(w),b=host(w),c=host(w);
    let legacyDraws=0,legacyDisposals=0;
    w.MotionFactories['preparation-legacy']=stage=>{
      const render=time=>{legacyDraws++;stage.dataset.time=String(time);};
      render.destroy=preserve=>{assert.equal(preserve,true);legacyDisposals++;};return render;
    };
    w.MotionThumbs.attach(a,definition);w.MotionThumbs.attach(b,{...definition,id:'preparation-next'});
    w.MotionThumbs.attach(c,{...definition,id:'preparation-legacy'});
    await delay(0);assert.equal(legacyDraws,1);assert.equal(legacyDisposals,1);assert.equal(c.querySelector('.motion-stage').dataset.time,'640');
    failed.reject(new Error('缩略图形状无法加载'));await delay(0);assert.equal(next.definitions.length,1);
    next.resolve();await w.MotionThumbs.whenIdle();
    assert.equal(a.textContent,'预览暂不可用');assert.match(a.title,/缩略图形状无法加载/);assert.equal(failed.destroyed,1);
    assert.deepEqual(next.frames,[640]);assert.equal(next.destroyed,1);
  }finally{env.close();}
});
