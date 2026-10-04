/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
import React, {createRef} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {Player} from '@remotion/player';
import {WiseMotionEffect, getEffectMetadata, resolveEffect} from './index.jsx';
export {React, createRoot, Player, WiseMotionEffect, getEffectMetadata, resolveEffect};
const active = new Set();
const FPS = 60;
const scriptBase = new URL('../', document.currentScript?.src || document.baseURI).href;
const quantize = ms => Math.round(ms * FPS / 1000) * 1000 / FPS;
// 复制 DOM 和画布像素，卸载播放器后仅保留没有脚本、监听器或动画时钟的画面。
function captureStaticDocument(session) {
  const source = session.doc;
  // 画布副本必须属于仍存活的父文档；原 iframe 卸载会清掉它所属画布的像素。
  const snapshot = document.importNode(source.documentElement, true);
  snapshot.querySelectorAll('script').forEach(node => node.remove());
  const canvases = snapshot.querySelectorAll('canvas');
  source.querySelectorAll('canvas').forEach((canvas, index) => {
    const copy = canvases[index];
    copy.width = canvas.width; copy.height = canvas.height;
    if (copy.width && copy.height) {
      const context = copy.getContext('2d');
      if (!context) throw new Error('无法保留动效静态画布');
      context.drawImage(canvas, 0, 0);
    }
  });
  return snapshot;
}
function showStaticDocument(root, mount, snapshot) {
  root.replaceChildren(mount);
  const frame = document.createElement('iframe');
  frame.title = '动效静态画面'; frame.setAttribute('aria-hidden', 'true');frame.setAttribute('scrolling','no');
  const scale=parseFloat(mount.style.width)/640;
  Object.assign(frame.style, {position:'absolute',left:0,top:0,width:'640px',height:'360px',border:0,display:'block',
    transform:scale===1?'none':`scale(${scale})`,transformOrigin:'top left',pointerEvents:'none'});
  mount.append(frame);
  const frozen = frame.contentDocument;
  if(!frozen.doctype)frozen.insertBefore(frozen.implementation.createDocumentType('html','',''),frozen.documentElement);
  frozen.replaceChild(frozen.adoptNode(snapshot), frozen.documentElement);
}
export function create(root, supplied, options = {}) {
  const definition = globalThis.MotionKit.resolveVariant(supplied);
  const playerRef = createRef();
  const mount = document.createElement('div');
  Object.assign(mount.style, {position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)'});
  mount.dataset.remotionPlayer = definition.id;
  root.replaceChildren(mount);
  const reactRoot = createRoot(mount);
  let session, destroyed = false, playing = false, preparing = true, error = null;
  let time = 0, elapsed = 0, speed = 1, ease = options.ease || definition.default_ease;
  let seekFrame = 0, sampleMode = 'exact', timeOverrideMs, elapsedOverrideMs;
  let theme = document.documentElement.dataset.theme || 'dark';
  let resolveReady, readySettled = false;
  const ready = new Promise(resolve => {resolveReady=resolve;});
  const settleReady = value => {if(!readySettled){readySettled=true;resolveReady(value);}};
  const notify = () => { if(!destroyed) options.onUpdate?.({time,duration:definition.duration_ms,paused:!playing,preparing,error}); };
  const fail = reason => { if(destroyed)return; error = reason instanceof Error ? reason : new Error(String(reason));preparing=false;playing=false;playerRef.current?.pause();settleReady(false);notify(); };
  const onFrame = state => {if(destroyed)return;time=state.time;elapsed=state.elapsed;notify();};
  const onReady = value => {
    if(destroyed){value.destroy();return;}
    session=value;preparing=false;
    session.doc.documentElement.dataset.theme=theme;
    settleReady(true);if(playing)playerRef.current?.play();notify();
  };
  const metadata=getEffectMetadata(definition.id,{definition});
  function render() {
    if(destroyed)return;
    const props={effectId:definition.id,variantId:definition.variant_id,definition,assetBaseUrl:options.assetBaseUrl||scriptBase,
      width:640,height:360,theme,ease,speed:1,sampleMode,timeOverrideMs,elapsedOverrideMs,
      bookSettings:definition.paper_settings,onReady,onFrame,onError:fail};
    reactRoot.render(<Player ref={playerRef} component={WiseMotionEffect} inputProps={props}
      durationInFrames={definition.loop ? 2147483647 : metadata.durationInFrames}
      compositionWidth={640} compositionHeight={360} fps={FPS} playbackRate={speed}
      initialFrame={seekFrame} controls={false} autoPlay={false} clickToPlay={false}
      doubleClickToFullscreen={false} spaceKeyToPlayOrPause={false} moveToBeginningWhenEnded={false}
      numberOfSharedAudioTags={0} style={{width:'100%',height:'100%'}}
      errorFallback={({error:reason})=>{queueMicrotask(()=>fail(reason));return <div role="alert" style={{color:'#f4f1ea',background:'#151517',padding:24}}>动效准备失败：{reason.message}</div>;}}
    />);
  }
  function fit() {
    if(destroyed)return;
    const box=root.getBoundingClientRect();const ratio=globalThis.devicePixelRatio||1;
    const raw=Math.min(box.width/640,box.height/360)||1;
    const scale=Math.max(.01,Math.floor(raw*640*ratio)/(640*ratio));
    mount.style.width=640*scale+'px';mount.style.height=360*scale+'px';
  }
  function seek(ms,cumulative=false) {
    if(destroyed)return;if(!Number.isFinite(ms))throw new TypeError('时间必须是有限数字');
    const next=cumulative&&definition.loop?Math.max(0,ms):Math.max(0,Math.min(definition.duration_ms,ms));
    const sampled=next===definition.duration_ms&&!cumulative?next:quantize(next);
    elapsed=sampled;time=definition.loop&&cumulative?sampled%definition.duration_ms:Math.min(definition.duration_ms,sampled);
    seekFrame=Math.min(2147483646,!definition.loop&&sampled===definition.duration_ms?metadata.durationInFrames-1:Math.round(sampled*FPS/1000));
    sampleMode=playing?'playback':'exact';timeOverrideMs=playing?undefined:time;elapsedOverrideMs=playing?undefined:elapsed;
    flushSync(()=>{render();playerRef.current?.seekTo(seekFrame);});notify();
  }
  const controller={
    ready,
    play(){if(destroyed||error)return;if(!definition.loop&&time>=definition.duration_ms)seek(0);playing=true;sampleMode='playback';timeOverrideMs=elapsedOverrideMs=undefined;flushSync(render);if(!preparing)playerRef.current?.play();notify();},
    pause(){if(destroyed)return;playing=false;playerRef.current?.pause();notify();},
    restart(shouldPlay=true){if(destroyed)return;this.pause();seek(0);if(shouldPlay)this.play();},
    seek(ms){seek(ms);},seekElapsed(ms){seek(ms,true);},
    setSpeed(value){if(destroyed)return;if(!Number.isFinite(value))throw new TypeError('速度必须是有限数字');speed=Math.max(.5,Math.min(2,value));flushSync(render);},
    setEase(value){if(destroyed)return;const parameter=definition.parameters.ease;if(!parameter)ease=definition.default_ease;else if(parameter.options.includes(value))ease=value;else throw new TypeError('不支持的速度变化');flushSync(render);},
    destroy(preserve=false){if(destroyed)return;playing=false;playerRef.current?.pause();destroyed=true;preparing=false;observer?.disconnect();themeObserver.disconnect();active.delete(controller);settleReady(false);
      let snapshot;
      try {
        // 先让原绘制器把 WebGL 当前帧固化到二维画布，再释放图形资源。
        session?.destroy(preserve);
        if(preserve&&session)snapshot=captureStaticDocument(session);
      } finally {reactRoot.unmount();root.replaceChildren();session=null;}
      if(snapshot)showStaticDocument(root,mount,snapshot);
    },fit,
    get currentTime(){return time;},get elapsedTime(){return elapsed;},get paused(){return !playing;},get preparing(){return preparing;},get error(){return error;},get speed(){return speed;},get destroyed(){return destroyed;},get stage(){return session?.stage;},get frame(){return playerRef.current?.getCurrentFrame()||seekFrame;},get session(){return session;}
  };
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(fit):null;observer?.observe(root);
  const themeObserver=new MutationObserver(()=>{theme=document.documentElement.dataset.theme||'dark';if(session)session.doc.documentElement.dataset.theme=theme;flushSync(render);});themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  active.add(controller);fit();flushSync(render);
  playerRef.current?.addEventListener('ended',()=>{playing=false;time=definition.duration_ms;notify();});
  if(options.autoplay)controller.play();return controller;
}
export const RemotionRuntime={create,fit(root){for(const p of active)if(p.stage?.ownerDocument.defaultView.frameElement?.parentElement) p.fit();},disposeAll(){[...active].forEach(p=>p.destroy());},get runningCount(){return [...active].filter(p=>!p.paused).length;},get instanceCount(){return active.size;}};
globalThis.MotionLegacyRuntime=globalThis.MotionRuntime;
globalThis.MotionRuntime=RemotionRuntime;
