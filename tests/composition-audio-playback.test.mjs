// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {JSDOM, VirtualConsole} from 'jsdom';
import {fileURLToPath} from 'node:url';

// 使用真实 React、Remotion Player 和音轨组件；只替换画面与浏览器媒体设备。
const bundle = await build({
  absWorkingDir:fileURLToPath(new URL('../',import.meta.url)),entryPoints:['remotion/browser.jsx'],
  bundle:true,write:false,format:'iife',globalName:'WiseAudioTest',define:{'process.env.NODE_ENV':'"production"'},
  plugins:[{name:'audio-only-picture',setup(builder){
    builder.onLoad({filter:/\/remotion\/index\.jsx$/},()=>({loader:'jsx',contents:`
      import React, {useEffect} from 'react';
      export const resolveEffect = value => value;
      export const getEffectMetadata = (id, {definition}) => ({durationInFrames:Math.ceil(definition.duration_ms*60/1000)});
      export function WiseMotionEffect({onReady}) {
        useEffect(()=>{const doc=document.implementation.createHTMLDocument('picture');onReady?.({doc,stage:doc.body,destroy(){}});},[onReady]);
        return null;
      }`,resolveDir:fileURLToPath(new URL('../remotion/',import.meta.url))}));
  }}]
});

for (const preferredVolume of ['1','0']) test(`真实播放器在用户开启声音时启动音轨，历史音量为 ${preferredVolume}`,async()=>{
  const errors=[],virtualConsole=new VirtualConsole();
  virtualConsole.on('jsdomError',error=>errors.push(error.message));
  virtualConsole.on('error',error=>errors.push(String(error)));
  const dom=new JSDOM('<!doctype html><div id="root"></div><button id="sound">声音</button>',{
    url:'file:///wise-motion/catalog/index.html',runScripts:'outside-only',pretendToBeVisual:true,
    virtualConsole
  });
  const w=dom.window,played=[],unmuted=[],media=new WeakMap();let inGesture=false,userActivated=false,controller;
  // 首次解除静音会创建声音设备；必须覆盖这次上下文切换，不能省略 AudioContext。
  w.AudioContext=class extends w.EventTarget {
    state='suspended';destination={};sampleRate=48000;
    get currentTime(){return this.state==='running'?w.performance.now()/1000:0;}
    createGain(){return {gain:{value:1,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};}
    getOutputTimestamp(){return {contextTime:this.currentTime,performanceTime:w.performance.now()};}
    resume(){this.state='running';this.dispatchEvent(new w.Event('statechange'));return Promise.resolve();}
    suspend(){this.state='suspended';this.dispatchEvent(new w.Event('statechange'));return Promise.resolve();}
    close(){this.state='closed';return Promise.resolve();}
  };
  w.HTMLElement.prototype.getBoundingClientRect=()=>({x:0,y:0,left:0,top:0,right:640,bottom:360,width:640,height:360});
  w.HTMLElement.prototype.getClientRects=function(){return [this.getBoundingClientRect()];};
  const state=element=>{if(!media.has(element))media.set(element,{paused:true});return media.get(element);};
  Object.defineProperty(w,'localStorage',{value:{getItem:()=>preferredVolume,setItem(){}}});
  const nativeMuted=Object.getOwnPropertyDescriptor(w.HTMLMediaElement.prototype,'muted');
  Object.defineProperties(w.HTMLMediaElement.prototype,{
    muted:{get:nativeMuted.get,set(value){nativeMuted.set.call(this,value);if(!value){unmuted.push({src:this.src,gesture:inGesture});if(!userActivated)state(this).paused=true;}}},
    paused:{get(){return state(this).paused;}},readyState:{get:()=>4},duration:{get:()=>240},
    play:{value:function(){
      if(!this.muted&&!userActivated) return Promise.reject(new w.DOMException('user didn\'t interact with the document','NotAllowedError'));
      state(this).paused=false;
      played.push({src:this.src,muted:this.muted,volume:this.volume,gesture:inGesture,time:this.currentTime});
      return Promise.resolve();
    }},
    pause:{value:function(){state(this).paused=true;}},load:{value(){}}
  });
  w.MotionKit={resolveVariant:definition=>definition};
  w.eval(bundle.outputFiles[0].text);
  try {
    controller=w.WiseAudioTest.create(w.document.getElementById('root'),{
      id:'test-audio',kind:'composition',duration_ms:10000,parameters:{},default_ease:'linear',
      audio:{tracks:[{src:'catalog/assets/composition-audio/drive/mix.mp3',start_ms:0,duration_ms:10000,volume:.7}]}
    });
    let timeout;
    try {assert.equal(await Promise.race([controller.ready,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('播放器未准备好：'+errors.join(';')+' '+w.document.body.innerHTML.slice(0,1200))),2000);})]),true);}
    finally {clearTimeout(timeout);}
    controller.play();
    await new Promise(resolve=>setTimeout(resolve,40));
    const button=w.document.getElementById('sound');
    button.addEventListener('click',event=>{
      inGesture=userActivated=true;
      try {controller.setMuted(false,event);} finally {inGesture=false;}
    });
    button.click();
    const tracks=()=>[...w.document.querySelectorAll('audio')].filter(element=>element.src.includes('/composition-audio/'));
    assert.equal(tracks().length,1,'解除静音初始化声音设备时，原音轨不能被替换成空白音频');
    assert.ok(unmuted.some(entry=>entry.src.endsWith('/composition-audio/drive/mix.mp3')&&entry.gesture),'原音轨应在点击中解除静音');
    await new Promise(resolve=>setTimeout(resolve,40));
    assert.ok(tracks().every(a=>!a.muted&&!a.paused&&a.volume===.7),'开启声音后原音轨仍在以非零音量播放');
    assert.equal(controller.muted,false);
    controller.pause();
    await new Promise(resolve=>setTimeout(resolve,20));
    assert.ok(tracks().every(element=>element.paused));
    controller.setMuted(true);
    button.click();
    assert.equal(controller.paused,true,'暂停时开启声音不擅自播放');
    controller.seek(2000);
    const playButton=w.document.createElement('button');
    playButton.addEventListener('click',event=>{
      inGesture=true;
      try {controller.play(event);} finally {inGesture=false;}
    });
    playButton.click();
    await new Promise(resolve=>setTimeout(resolve,40));
    assert.ok(played.some(entry=>entry.src.endsWith('/composition-audio/drive/mix.mp3')&&!entry.muted&&Math.abs(entry.time-2)<=1/60),JSON.stringify(played));
    assert.deepEqual(errors,[]);
  } finally {controller?.destroy();await new Promise(resolve=>setTimeout(resolve,20));w.close();}
});
