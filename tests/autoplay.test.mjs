// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {runInNewContext} from 'node:vm';
import {environment,data} from './helpers.mjs';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

test('全部四十三项插画正常自动播放，系统偏好变化不干预，手动和后台暂停仍有效',async()=>{
  // 不使用静帧夹具：系统偏好为 true，实际加载正式页面并等待真实计时器推进。
  const illustrations=data.effects.filter(e=>e.kind==='illustration');assert.equal(illustrations.length,43);
  const env=await environment(true,{hash:'#'+illustrations[0].id});
  try{
    const {w,media}=env,d=w.document,scrub=d.getElementById('scrub');
    assert.equal(media.matches,true);assert.equal(d.getElementById('motion-setting'),null);
    d.querySelector('[data-kind="illustration"]').click();
    for(const effect of illustrations){
      d.querySelector(`[data-effect="${effect.id}"]`).click();
      assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,effect.id);
      assert.equal(w.MotionRuntime.runningCount,1,effect.name+' 打开即播放');
      assert.equal(d.getElementById('toggle-play').getAttribute('aria-label'),'暂停当前动效');
      const start=Number(scrub.value);await wait(75);
      assert.ok(Number(scrub.value)>start,effect.name+' 真实时间前进');
      media.matches=false;media.dispatchEvent(new w.Event('change'));
      media.matches=true;media.dispatchEvent(new w.Event('change'));
      assert.equal(w.MotionRuntime.runningCount,1,effect.name+' 偏好切换不暂停');
    }
    d.getElementById('toggle-play').click();assert.equal(w.MotionRuntime.runningCount,0);
    const paused=scrub.value;await wait(40);assert.equal(scrub.value,paused,'手动暂停后时间保持');
    media.matches=false;media.dispatchEvent(new w.Event('change'));
    assert.equal(w.MotionRuntime.runningCount,0,'系统偏好变化不取消手动暂停');
    d.getElementById('toggle-play').click();assert.equal(w.MotionRuntime.runningCount,1);
    const hidden=value=>{Object.defineProperty(d,'hidden',{configurable:true,value});d.dispatchEvent(new w.Event('visibilitychange'));};
    hidden(true);assert.equal(w.MotionRuntime.runningCount,0);
    const background=scrub.value;await wait(40);assert.equal(scrub.value,background,'隐藏页面停止计时');
    hidden(false);assert.equal(w.MotionRuntime.runningCount,1);
    await wait(75);assert.ok(Number(scrub.value)>Number(background),'返回页面继续播放');
    d.getElementById('toggle-play').click();hidden(true);hidden(false);
    assert.equal(w.MotionRuntime.runningCount,0,'返回页面保留手动暂停');
  }finally{env.close();}
});

test('标准独立导出默认播放并推进时间，手动暂停、重播和离开页面正常',async()=>{
  const env=await environment();
  // 导出工具是正式页面脚本，但不需要载入主目录播放器。
  env.w.eval(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'));
  try{
    for(const id of ['claude-spectrum-illustration','rasengan-illustration','dither-lab-book']){
      const effect=data.effects.find(e=>e.id===id),html=env.w.MotionExport.code(effect);
      const dom=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
      w.matchMedia=()=>({matches:true});w.ResizeObserver=class{observe(){}disconnect(){}};w.HTMLCanvasElement.prototype.getContext=()=>null;
      try{
        for(const script of w.document.querySelectorAll('script'))w.eval(script.src?await readFile(new URL('../'+script.getAttribute('src'),import.meta.url),'utf8'):script.textContent);
        const p=w.MotionDemo;assert.equal(p.paused,false,id+' 默认播放');
        await wait(75);assert.ok(p.currentTime>0,id+' 时间前进');
        w.document.getElementById('play').click();assert.equal(p.paused,true);
        const time=p.currentTime;await wait(40);assert.equal(p.currentTime,time);
        w.document.getElementById('again').click();assert.equal(p.currentTime,0);assert.equal(p.paused,false);
        w.dispatchEvent(new w.Event('pagehide'));assert.equal(w.MotionRuntime.instanceCount,0);
      }finally{w.MotionRuntime?.disposeAll();w.anime?.engine.pause();dom.window.close();}
    }
  }finally{env.close();}
});

test('正式页面、脚本和样式不保留系统减少动态效果限制或提示入口',async()=>{
  async function inspect(directory){
    for(const entry of await readdir(directory,{withFileTypes:true})){
      const file=new URL(entry.name+(entry.isDirectory()?'/':''),directory);
      if(entry.isDirectory())await inspect(file);
      else if(/\.(?:js|css|html)$/.test(entry.name)){
        let content=await readFile(file,'utf8');
        // 打包的原实现只用于复制，保持原文件内容；检查实际预览数据及运行脚本。
        if(entry.name==='history-data.js'){
          const context={};runInNewContext(content,context);
          const {source_files,...preview}=context.MotionHistory;content=JSON.stringify(preview);
        }
        assert.doesNotMatch(content,/prefers-reduced-motion|reducedMotion|motion-setting/,file.pathname);
      }
    }
  }
  await inspect(new URL('../catalog/',import.meta.url));
});
