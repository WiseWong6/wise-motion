// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {environment,data} from './helpers.mjs';
test('复制的完整页面可加载包内源码，动作和组合都能重复定位和释放', async () => {
  const env = await environment(true);
  try {
    for (const id of ['fade-rise','dual-scroll','rolling-digits']) {
      const effect = data.effects.find(e => e.id === id);
      const html = env.w.MotionExport.code(effect,{speed:1.75,ease:'linear'});
      const dom = new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true});
      const w = dom.window; w.matchMedia = () => ({matches:true});
      w.ResizeObserver = class {observe() {} disconnect() {}};
      try {
        for (const element of w.document.querySelectorAll('[src],link[href]')) {
          const resource = element.getAttribute('src') || element.getAttribute('href');
          assert.ok(!/^(https?:|\/\/)/.test(resource));
          assert.ok((await stat(new URL('../'+resource,import.meta.url))).isFile());
        }
        for (const script of w.document.querySelectorAll('script')) {
          w.eval(script.src ? await readFile(new URL('../'+script.getAttribute('src'),import.meta.url),'utf8') : script.textContent);
        }
        assert.equal(w.MotionDemo.speed,1.75); assert.equal(w.MotionRuntime.instanceCount,1);
        assert.equal(w.document.querySelector('.motion-stage').dataset.effect,id);
        assert.equal(w.MotionDemo.currentTime,effect.preview_ms);
        w.MotionDemo.seek(effect.duration_ms*.5); const picture = w.document.getElementById('motion').innerHTML;
        w.MotionDemo.seek(0); w.MotionDemo.seek(effect.duration_ms*.5);
        assert.equal(w.document.getElementById('motion').innerHTML,picture);
        const d=w.document,range=d.getElementById('time');range.value=700;range.dispatchEvent(new w.Event('input'));
        assert.equal(w.MotionDemo.currentTime,effect.duration_ms*.7);assert.ok(w.MotionDemo.paused);
        assert.equal(d.getElementById('readout').textContent,(effect.duration_ms*.7/1000).toFixed(1)+' / '+(effect.duration_ms/1000).toFixed(1)+' 秒');
        d.getElementById('play').click();assert.ok(!w.MotionDemo.paused);d.getElementById('play').click();assert.ok(w.MotionDemo.paused);
        d.getElementById('again').click();assert.equal(w.MotionDemo.currentTime,0);assert.ok(!w.MotionDemo.paused);
        w.dispatchEvent(new w.Event('pagehide')); assert.equal(w.MotionRuntime.instanceCount,0);
      } finally { w.MotionRuntime?.disposeAll(); w.anime?.engine.pause(); dom.window.close(); }
    }
  } finally {env.close();}
});
test('导出的历史页面保持选中案例、静音与时间范围，播放条可以定位并释放',async()=>{
  const env=await environment(true);
  try{
    for(const type of ['original-crop','source-clip','isolated','web-isolated']){
      const effect=env.w.MotionHistory.recipes.find(r=>r.entries.some(e=>e.preview.type===type));
      assert.ok(effect,'缺少 '+type+' 的导出验证案例');
      const entry=effect.entries.find(e=>e.preview.type===type);
      const html=env.w.MotionExport.code(effect,{speed:1.75,caseId:entry.id});
      const dom=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
      w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.load=function(){};w.HTMLMediaElement.prototype.play=function(){return Promise.resolve();};
      let disposed=0;
      try{
        for(const el of d.querySelectorAll('[src],link[href]')){
          const resource=el.getAttribute('src')||el.getAttribute('href');
          assert.ok(!/^(https?:|\/\/)/.test(resource));assert.ok((await stat(new URL('../'+resource,import.meta.url))).isFile());
        }
        for(const script of d.querySelectorAll('script')){
          w.eval(script.src?await readFile(new URL('../'+script.getAttribute('src'),import.meta.url),'utf8'):script.textContent);
          if(script.getAttribute('src')==='catalog/history-runtime.js'){
            const create=w.MotionHistoryRuntime.create;
            // 不绘制像素；检查完整导出页与实际控制层的连接。
            w.MotionHistoryRuntime.create=(root,e,options)=>create(root,e,{...options,mount:async canvas=>({render(t){canvas.dataset.time=String(t);},dispose(){disposed++;}})});
          }
        }
        const video=d.querySelector('video');if(video)video.dispatchEvent(new w.Event('loadedmetadata'));
        await w.MotionDemo.ready;
        assert.equal(w.MotionDemo.entry.id,entry.id);assert.equal(w.MotionDemo.speed,1.75);assert.equal(w.MotionHistoryRuntime.instanceCount,1);
        const range=d.getElementById('time');range.value=700;range.dispatchEvent(new w.Event('input'));
        assert.equal(w.MotionDemo.currentTime,w.MotionDemo.duration*.7);assert.ok(w.MotionDemo.paused);
        assert.equal(d.getElementById('readout').textContent,(w.MotionDemo.duration*.7/1000).toFixed(1)+' / '+(w.MotionDemo.duration/1000).toFixed(1)+' 秒');
        if(video){assert.ok(video.muted);assert.equal(video.volume,0);assert.equal(video.currentTime,(entry.preview.start||0)+w.MotionDemo.duration*.7/1000);}
        d.getElementById('play').click();assert.ok(!w.MotionDemo.paused);d.getElementById('play').click();assert.ok(w.MotionDemo.paused);
        d.getElementById('again').click();assert.equal(w.MotionDemo.currentTime,0);assert.ok(!w.MotionDemo.paused);
        w.dispatchEvent(new w.Event('pagehide'));assert.equal(w.MotionHistoryRuntime.instanceCount,0);assert.equal(d.getElementById('motion').children.length,0);
        assert.equal(disposed,video?0:1);
      }finally{w.MotionHistoryRuntime?.disposeAll();w.anime?.engine.pause();w.close();}
    }
  }finally{env.close();}
});
