// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const source = await readFile(new URL('../catalog/local-preview.js', import.meta.url), 'utf8');
const definition = {id:'point-domain-flow-sequence', duration_ms:25866.666666666668, loop:false, default_ease:'linear', parameters:{}};
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function environment({url='file:///wise-motion/catalog/index.html', frames=true, pendingPlay=false, pendingCode=false} = {}) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {url, runScripts:'outside-only', pretendToBeVisual:true});
  const w = dom.window, root = w.document.getElementById('root'), codes = [], observers = new Set(), videos = [];
  const media = new WeakMap();
  function state(video) {
    if (!media.has(video)) { media.set(video, {ready:0, time:0, width:0, height:0, duration:NaN, played:0, paused:0, loads:0, callbacks:new Map(), plays:[]}); videos.push(video); }
    return media.get(video);
  }
  const proto = w.HTMLMediaElement.prototype;
  Object.defineProperties(proto, {
    currentTime:{get(){return state(this).time;}, set(value){state(this).time = value;}},
    readyState:{get(){return state(this).ready;}}, duration:{get(){return state(this).duration;}}
  });
  Object.defineProperties(w.HTMLVideoElement.prototype, {
    videoWidth:{get(){return state(this).width;}}, videoHeight:{get(){return state(this).height;}}
  });
  proto.load = function(){state(this).loads++;};
  proto.pause = function(){state(this).paused++;};
  proto.play = function(){const current = state(this); current.played++;
    return pendingPlay ? new Promise((resolve, reject) => current.plays.push({resolve, reject})) : Promise.resolve();};
  if (frames) {
    let id = 0;
    proto.requestVideoFrameCallback = function(callback){state(this).callbacks.set(++id, callback); return id;};
    proto.cancelVideoFrameCallback = function(key){state(this).callbacks.delete(key);};
  }
  w.ResizeObserver = class {observe(){observers.add(this);} disconnect(){observers.delete(this);}};
  root.getBoundingClientRect = () => ({width:960, height:800});
  w.MotionKit = {resolveVariant:value => value};
  w.MotionRuntime = {create(host, supplied, options) {
    const stage = w.document.createElement('div'); stage.className = 'real-code-stage'; host.replaceChildren(stage);
    let settle, reject;
    const c = {supplied, options, stage, session:{source:'real-code'}, currentTime:0, elapsedTime:0, paused:true, speed:1, preparing:pendingCode, error:null, destroyed:false,
      ready:pendingCode ? new Promise((resolve,fail)=>{settle=resolve;reject=fail;}) : Promise.resolve(true),
      complete(ok=true){c.preparing=false;settle?.(ok);},
      fail(reason){reject(reason);},
      play(){c.paused=false;c.update();}, pause(){c.paused=true;c.update();},
      seek(time){c.currentTime=c.elapsedTime=time;c.update();}, seekElapsed(time){c.seek(time);},
      setSpeed(value){c.speed=value;}, setEase(value){c.ease=value;},
      restart(){c.seek(0);c.play();}, fit(){c.fitted=true;},
      destroy(preserve){c.destroyed=true;c.preserved=preserve;host.replaceChildren();},
      update(){options.onUpdate?.({time:c.currentTime,duration:supplied.duration_ms,paused:c.paused,preparing:c.preparing,error:c.error});},
      get frame(){return Math.round(c.currentTime*60/1000);}
    };
    codes.push(c); return c;
  }};
  const runtime = w.MotionRuntime;
  w.eval(source);
  const controllers = [];
  function create(value=definition, options={}) { const c=w.MotionLocalPreview.create(root, value, options);controllers.push(c);return c; }
  function dispatch(video, event){video.dispatchEvent(new w.Event(event));}
  function metadata(video, {width=1280,height=720,duration=1553/60,ready=1}={}) {
    Object.assign(state(video), {width,height,duration,ready}); dispatch(video, 'loadedmetadata');
  }
  function decoded(video, {seeked=false}={}) {state(video).ready=2;dispatch(video,seeked?'seeked':'loadeddata');}
  function frame(video, time){const callbacks=[...state(video).callbacks.values()];state(video).callbacks.clear();callbacks.forEach(callback=>callback(0,{mediaTime:time}));}
  return {w,root,codes,observers,videos,state,runtime,create,metadata,decoded,dispatch,frame,
    close(){controllers.forEach(c=>c.destroy());dom.window.close();}};
}

test('仅本机默认完整组合选用视频，其它定义和网页直接透传真实运行器', () => {
  for (const [url, value, options] of [
    ['https://example.test/catalog/index.html', definition, {}],
    ['file:///wise-motion/catalog/index.html', {...definition,id:'boundary-curve-stop'}, {}],
    ['file:///wise-motion/catalog/index.html', {...definition,variant_id:'other'}, {}],
    ['file:///wise-motion/catalog/index.html', {...definition,duration_ms:25000}, {}],
    ['file:///wise-motion/catalog/index.html', definition, {ease:'easeInOutQuad'}]
  ]) {
    const env=environment({url});try {
      const controller=env.create(value,options);
      assert.equal(controller,env.codes[0]);assert.equal(env.codes[0].supplied,value);
      assert.equal(env.codes[0].options,options);assert.equal(env.root.querySelector('video'),null);
      assert.equal(env.w.MotionRuntime,env.runtime);
    } finally {env.close();}
  }
});

test('元数据前的播放、定位、倍速按最后命令执行，首帧解码后才准备完成', async () => {
  const env=environment();try {
    const updates=[],controller=env.create(definition,{onUpdate:state=>updates.push(state)}),video=env.root.querySelector('video');
    let settled=false;controller.ready.then(()=>{settled=true;});
    controller.play();controller.seek(2345);controller.setSpeed(1.5);
    assert.equal(controller.currentTime,2350);assert.equal(controller.paused,false);assert.equal(env.state(video).played,0);
    env.metadata(video);await tick();
    assert.equal(video.currentTime,2.35+.00001);assert.equal(video.playbackRate,1.5);assert.equal(settled,false);
    env.decoded(video);await tick();assert.equal(settled,false,'定位未完成时旧首帧不算成功');
    env.decoded(video,{seeked:true});await tick();assert.equal(settled,false);
    env.frame(video,0);await tick();assert.equal(settled,false,'旧帧不能确认目标帧已经显示');
    env.frame(video,2.35);assert.equal(await controller.ready,true);await tick();
    assert.equal(env.state(video).played,1);assert.equal(controller.preparing,false);
    assert.equal(controller.previewMode,'video');assert.equal(env.codes.length,0);
    assert.equal(video.src,'file:///wise-motion/.local-previews/point-domain-flow-sequence.mp4');
    assert.equal(video.parentNode.style.width,'960px');assert.equal(video.parentNode.style.height,'540px');
    assert.ok(updates.every(update=>update.previewMode==='video'));
    assert.equal(env.root.querySelector('canvas'),null);
  } finally {env.close();}
});

test('元数据前暂停不会在载入后自动恢复；解码帧回调更新毫秒定位', async () => {
  const env=environment();try {
    const controller=env.create(definition,{autoplay:true}),video=env.root.querySelector('video');
    controller.pause();env.metadata(video);env.decoded(video);await controller.ready;
    assert.equal(env.state(video).played,0);assert.equal(controller.paused,true);
    controller.play();env.frame(video,3.1166666666666667);
    assert.equal(controller.currentTime,3116.6666666666665);assert.equal(controller.frame,187);
    env.state(video).time=4;env.dispatch(video,'timeupdate');
    assert.equal(controller.frame,187,'支持逐帧回调时不能拿媒体时钟冒充已显示帧');
  } finally {env.close();}
});

test('视频缺失自动恢复真实代码，保留暂停状态、末尾定位与速度', async () => {
  const env=environment({pendingCode:true});try {
    const controller=env.create(),video=env.root.querySelector('video');
    controller.seekElapsed(definition.duration_ms);controller.setSpeed(2);controller.pause();
    const requestedVideo=controller.ensureVideo();
    env.dispatch(video,'error');
    assert.equal(controller.previewMode,'code');assert.equal(controller.preparing,true);
    const code=env.codes[0];assert.equal(code.supplied,definition);assert.equal(code.currentTime,definition.duration_ms);
    assert.equal(code.speed,2);assert.equal(code.paused,true);assert.equal(video.getAttribute('src'),null);
    let settled=false;controller.ready.then(()=>{settled=true;});await tick();assert.equal(settled,false);
    code.complete();assert.equal(await controller.ready,true);assert.equal(await requestedVideo,true);
    assert.equal(await controller.ensureVideo(),true);assert.equal(controller.previewMode,'code');
    assert.equal(env.codes.length,1);assert.equal(env.videos.length,1);assert.equal(controller.stage,code.stage);
    assert.equal(controller.session,code.session);assert.equal(controller.error,null);
  } finally {env.close();}
});

test('错误尺寸或错误时长不会播放冒充的本机视频', async () => {
  for (const invalid of [{width:640},{height:360},{duration:20}]) {
    const env=environment();try {
      const controller=env.create(definition,{autoplay:true}),video=env.root.querySelector('video');
      env.metadata(video,invalid);assert.equal(await controller.ready,true);
      assert.equal(controller.previewMode,'code');assert.equal(env.codes[0].paused,false);
      assert.equal(env.state(video).played,0);assert.equal(video.getAttribute('src'),null);
    } finally {env.close();}
  }
});

test('末尾保留最后一帧，播放从头开始，速度和定位保持旧接口范围', async () => {
  const env=environment();try {
    const controller=env.create(),video=env.root.querySelector('video');
    env.metadata(video);env.decoded(video);await controller.ready;
    controller.seek(definition.duration_ms);assert.equal(video.currentTime,1552/60+.00001);assert.equal(controller.frame,1552);
    controller.play();assert.equal(controller.currentTime,0);assert.equal(video.currentTime,.00001);
    env.dispatch(video,'ended');assert.equal(controller.paused,true);assert.equal(controller.currentTime,definition.duration_ms);
    controller.restart(false);assert.equal(controller.currentTime,0);assert.equal(controller.paused,true);
    controller.setSpeed(100);assert.equal(controller.speed,2);controller.setSpeed(.01);assert.equal(controller.speed,.5);
    assert.throws(()=>controller.seek(NaN),/时间必须是有限数字/);assert.throws(()=>controller.setSpeed(Infinity),/速度必须是有限数字/);
  } finally {env.close();}
});

test('拆解转代码再回视频，旧实例释放且保留同一时刻、速度与播放状态', async () => {
  const env=environment();try {
    const controller=env.create(),first=env.root.querySelector('video');
    env.metadata(first);env.decoded(first);await controller.ready;
    controller.seek(8000);controller.setSpeed(.75);controller.play();
    assert.equal(await controller.ensureCode(),true);assert.equal(controller.previewMode,'code');
    assert.equal(env.state(first).callbacks.size,0);assert.equal(first.getAttribute('src'),null);
    const code=env.codes[0];assert.equal(code.currentTime,8000);assert.equal(code.speed,.75);assert.equal(code.paused,false);
    code.currentTime=9000;code.update();assert.equal(controller.currentTime,9000);
    controller.pause();const switched=controller.ensureVideo(),second=env.root.querySelector('video');
    assert.notEqual(second,first);assert.equal(code.destroyed,true);assert.equal(controller.paused,true);
    env.metadata(second);env.decoded(second,{seeked:true});env.frame(second,9);assert.equal(await switched,true);
    assert.equal(second.currentTime,9+.00001);assert.equal(second.playbackRate,.75);assert.equal(env.state(second).played,0);
  } finally {env.close();}
});

test('快速切换和销毁拦截迟到视频事件、异步播放与代码准备', async () => {
  const env=environment({pendingPlay:true,pendingCode:true});try {
    const controller=env.create(),first=env.root.querySelector('video');
    env.metadata(first);env.decoded(first);await controller.ready;controller.play();
    const play=env.state(first).plays[0],codeTransition=controller.ensureCode(),code=env.codes[0];
    const videoTransition=controller.ensureVideo(),second=env.root.querySelector('video');
    code.complete();assert.equal(await codeTransition,false);assert.equal(code.destroyed,true);
    play.resolve();await tick();assert.ok(env.state(first).paused>0);
    controller.destroy();assert.equal(await videoTransition,false);
    env.metadata(second);env.decoded(second);env.dispatch(first,'error');
    assert.equal(controller.destroyed,true);assert.equal(controller.paused,true);assert.equal(env.root.childElementCount,0);
    assert.equal(env.observers.size,0);assert.equal(env.state(second).callbacks.size,0);assert.equal(second.getAttribute('src'),null);
    assert.equal(env.codes.length,1);
  } finally {env.close();}
});

test('播放中的真实代码直接切回视频，清理旧实例不会吞掉播放意图', async () => {
  const env=environment();try {
    const controller=env.create(),first=env.root.querySelector('video');
    env.metadata(first);env.decoded(first);await controller.ready;
    await controller.ensureCode();controller.seek(13400);controller.setSpeed(1.5);controller.play();
    const old=env.codes[0],switched=controller.ensureVideo(),video=env.root.querySelector('video');
    assert.equal(old.destroyed,true);assert.equal(controller.paused,false);assert.equal(controller.currentTime,13400);
    env.metadata(video);env.decoded(video,{seeked:true});env.frame(video,13.4);assert.equal(await switched,true);
    assert.equal(video.playbackRate,1.5);assert.equal(env.state(video).played,1);assert.equal(controller.paused,false);
  } finally {env.close();}
});

test('定位同步阻挡旧帧，只有最新目标帧可以结束等待并恢复播放', async () => {
  const env=environment();try {
    const controller=env.create(),video=env.root.querySelector('video');
    env.metadata(video);env.decoded(video);await controller.ready;controller.play();env.frame(video,2);
    controller.seek(13400);
    env.frame(video,2.0166666666666666);assert.equal(controller.currentTime,13400,'seeking 事件前排队的旧帧不得回写');
    controller.seek(14000);env.dispatch(video,'seeking');env.decoded(video,{seeked:true});
    env.frame(video,13.4);assert.equal(controller.currentTime,14000,'前一次定位的结果也必须丢弃');
    assert.equal(env.state(video).played,1,'等待新目标时不能提前恢复播放并跳过目标帧');
    env.frame(video,14);assert.equal(controller.currentTime,14000);assert.equal(env.state(video).played,2);
    env.frame(video,14+1/60);assert.equal(controller.frame,841);
  } finally {env.close();}
});

test('代码准备拒绝时返回明确失败，结束准备并通知错误', async () => {
  const env=environment({pendingCode:true});try {
    const updates=[],controller=env.create(definition,{onUpdate:value=>updates.push(value)}),video=env.root.querySelector('video');
    controller.seek(13400);controller.play();const transition=controller.ensureVideo();env.dispatch(video,'error');
    env.codes[0].fail(new Error('绘制素材损坏'));
    assert.equal(await transition,false);assert.equal(await controller.ready,false);
    assert.equal(controller.preparing,false);assert.equal(controller.paused,true);
    assert.match(controller.error.message,/绘制素材损坏/);assert.match(updates.at(-1).error.message,/绘制素材损坏/);
    assert.equal(updates.at(-1).preparing,false);
  } finally {env.close();}
});

test('定位暂停引起旧 play 拒绝时仍保留播放意图', async () => {
  const env=environment({pendingPlay:true});try {
    const controller=env.create(),video=env.root.querySelector('video');
    env.metadata(video);env.decoded(video);await controller.ready;controller.play();
    controller.seek(13400);env.state(video).plays[0].reject(new Error('定位打断旧播放'));await tick();
    assert.equal(controller.paused,false);env.frame(video,13.4);assert.equal(env.state(video).played,2);
    assert.equal(controller.paused,false);
  } finally {env.close();}
});

test('媒体时钟舍入到六位小数后重复定位同帧，不等待不存在的新画面回调', async () => {
  const env=environment();try {
    const controller=env.create(),video=env.root.querySelector('video'),target=797/60*1000;
    env.metadata(video);env.decoded(video);await controller.ready;
    controller.seek(target);env.state(video).time=13.283333;env.frame(video,13.283333);
    controller.play();controller.pause();const pauses=env.state(video).paused;
    controller.seek(target);controller.play();
    assert.equal(env.state(video).paused,pauses,'已经显示同一帧无需暂停并重新定位');
    assert.equal(env.state(video).played,2,'没有额外帧回调也必须能够继续播放');
    assert.equal(controller.frame,797);assert.equal(controller.paused,false);
    controller.seek(798/60*1000);env.frame(video,13.283333);
    assert.equal(env.state(video).played,2,'相邻但尚未显示的目标仍须等待');
    env.frame(video,13.3);assert.equal(env.state(video).played,3);assert.equal(controller.frame,798);
  } finally {env.close();}
});

test('微秒截断不会把非整秒目标定位到前一帧，旧画面仍不能解除等待', async () => {
  const env=environment();try {
    const controller=env.create(),video=env.root.querySelector('video'),target=797/60*1000;
    Object.defineProperty(video,'currentTime',{
      get(){return env.state(video).time;},
      set(value){env.state(video).time=Math.floor(value*1e6)/1e6;}
    });
    controller.seek(target);controller.play();let settled=false;controller.ready.then(()=>{settled=true;});
    env.metadata(video);env.decoded(video,{seeked:true});
    env.frame(video,13.266667);await tick();assert.equal(settled,false,'前一帧即使已 seeked 也不能误报准备好');
    assert.ok(video.currentTime>797/60 && video.currentTime<798/60,'媒体时钟写入目标帧内部');
    const decodedFrame=Math.floor(video.currentTime*60);
    assert.equal(decodedFrame,797);env.frame(video,Math.round(decodedFrame/60*1e6)/1e6);
    assert.equal(await controller.ready,true);assert.equal(controller.frame,797);assert.equal(controller.currentTime,target);
    assert.equal(env.state(video).played,1);
    controller.pause();controller.seek(target);controller.play();assert.equal(env.state(video).played,2);
  } finally {env.close();}
});

test('无逐帧回调时首次指定位置仍需定位结束且目标帧可解码', async () => {
  const env=environment({frames:false});try {
    const controller=env.create(),video=env.root.querySelector('video');controller.seek(13400);
    let settled=false;controller.ready.then(()=>{settled=true;});
    env.metadata(video);env.decoded(video);await tick();assert.equal(settled,false);
    env.state(video).ready=1;env.dispatch(video,'seeked');await tick();assert.equal(settled,false);
    env.decoded(video);assert.equal(await controller.ready,true);assert.equal(controller.currentTime,13400);
  } finally {env.close();}
});

test('隐藏和离开页面都会暂停，迟到的 play 不得重新播放', async () => {
  const env=environment({pendingPlay:true});try {
    const controller=env.create(),video=env.root.querySelector('video');
    env.metadata(video);env.decoded(video);await controller.ready;controller.play();
    Object.defineProperty(env.w.document,'hidden',{configurable:true,value:true});
    env.w.document.dispatchEvent(new env.w.Event('visibilitychange'));
    env.state(video).plays[0].resolve();await tick();
    assert.equal(controller.paused,true);assert.ok(env.state(video).paused>=2);
    controller.play();assert.equal(controller.paused,true);assert.equal(env.state(video).played,1);
    Object.defineProperty(env.w.document,'hidden',{configurable:true,value:false});
    env.w.document.dispatchEvent(new env.w.Event('visibilitychange'));assert.equal(controller.paused,true);
    controller.play();env.w.dispatchEvent(new env.w.Event('pagehide'));assert.equal(controller.paused,true);
  } finally {env.close();}
});

test('没有逐帧回调时退到媒体事件，准备中销毁 ready 明确失败', async () => {
  const env=environment({frames:false});try {
    const controller=env.create(),video=env.root.querySelector('video');
    env.metadata(video);env.decoded(video);assert.equal(await controller.ready,true);
    env.state(video).time=6.123;env.dispatch(video,'timeupdate');assert.equal(controller.currentTime,6116.666666666667);
    controller.destroy();
    const second=env.create();second.destroy();assert.equal(await second.ready,false);assert.equal(await second.ensureCode(),false);
  } finally {env.close();}
});
