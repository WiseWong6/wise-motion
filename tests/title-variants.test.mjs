// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {environment,data,frameMarkup} from './helpers.mjs';

const title=()=>data.effects.find(effect=>effect.id==='title-stagger');
const durations={material:3000,outline:3000,handoff:8000};
const bookmarks={
  'material-label-stagger':'material',
  'generative-title-reveal':'outline',
  'keyframe-title-handoff':'handoff'
};
const compositions={
  'material-phone-sequence':'material',
  'generative-point-sequence':'outline',
  'keyframe-workbench':'handoff'
};
const click=(d,selector)=>{const node=d.querySelector(selector);assert.ok(node,selector);node.click();return node;};
function change(w,id,value){const node=w.document.getElementById(id);assert.ok(node,id);node.value=value;node.dispatchEvent(new w.Event('change',{bubbles:true}));return node;}
function seek(w,id,value){const node=w.document.getElementById(id);node.value=value;node.dispatchEvent(new w.Event('input',{bubbles:true}));}
const copy=value=>JSON.parse(JSON.stringify(value));

test('三套标题只占一个动作条目，变体解析保留各自时长并且不污染清单',async()=>{
  const env=await environment();
  try{
    const effect=title();assert.ok(effect);
    assert.deepEqual(effect.variants.map(variant=>variant.id),Object.keys(durations));
    for(const old of Object.keys(bookmarks))assert.equal(data.effects.some(item=>item.id===old),false,'旧名称不能继续占独立条目');
    const before=copy(effect);
    for(const variant of effect.variants){
      const resolved=env.w.MotionKit.resolveVariant(effect,variant.id);
      assert.equal(resolved.id,'title-stagger');assert.equal(resolved.variant_id,variant.id);
      assert.equal(resolved.duration_ms,durations[variant.id]);assert.ok(resolved.preview_ms>0&&resolved.preview_ms<=resolved.duration_ms);
      assert.equal(resolved.kind,'action');assert.ok(resolved.source.path);assert.ok(resolved.parameters.speed);
      if(variant.summary)assert.equal(resolved.summary,variant.summary);
    }
    const defaultVariant=env.w.MotionKit.resolveVariant(effect);
    assert.equal(defaultVariant.variant_id,effect.variants[0].id);
    assert.equal(env.w.MotionKit.resolveVariant(effect,'missing-variant').variant_id,defaultVariant.variant_id);
    assert.deepEqual(copy(effect),before,'解析示例不能把原清单中的默认时长改成上一次选择');
  }finally{env.close();}
});

test('主预览切换示例从头播放，说明和实际复制同步，离开后恢复原示例与暂停位置',async()=>{
  const env=await environment(true,{hash:'#title-stagger'});
  try{
    const {w}=env,d=w.document,effect=title(),copied=[];
    Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copied.push(value);}}});
    const select=d.getElementById('effect-variant');assert.ok(select);assert.equal(d.getElementById('effect-variant-field').hidden,false);
    assert.deepEqual([...select.options].map(option=>option.value),Object.keys(durations));
    const observers=env.listeners.size;let previousPrompt='',previousCode='';
    for(const id of ['outline','handoff','material','handoff']){
      seek(w,'scrub',650);change(w,'effect-variant',id);
      const resolved=w.MotionKit.resolveVariant(effect,id);
      assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,'title-stagger');
      assert.equal(d.getElementById('scrub').value,'0');assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,1);
      assert.equal(d.getElementById('toggle-play').getAttribute('aria-label'),'暂停当前动效');
      assert.equal(d.getElementById('preview-summary').textContent,resolved.summary);
      const prompt=d.getElementById('prompt').textContent,code=d.getElementById('code').textContent;
      assert.notEqual(prompt,previousPrompt);assert.notEqual(code,previousCode);
      assert.match(code,new RegExp('"variant_id"\\s*:\\s*"'+id+'"'));assert.match(code,new RegExp('"duration_ms"\\s*:\\s*'+durations[id]));
      click(d,'#copy-prompt');await Promise.resolve();assert.equal(copied.at(-1),prompt);
      click(d,'#copy-code');await Promise.resolve();assert.equal(copied.at(-1),code);
      previousPrompt=prompt;previousCode=code;assert.equal(env.listeners.size,observers);
    }
    seek(w,'scrub',425);
    const before={time:d.getElementById('scrub').value,frame:frameMarkup(d.getElementById('preview')),prompt:d.getElementById('prompt').textContent,code:d.getElementById('code').textContent};
    w.dispatchEvent(new w.Event('pagehide'));assert.equal(w.MotionRuntime.instanceCount,0);
    w.dispatchEvent(new w.Event('pageshow'));
    assert.equal(d.getElementById('effect-variant').value,'handoff');assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
    assert.equal(d.getElementById('scrub').value,before.time);assert.equal(frameMarkup(d.getElementById('preview')),before.frame);
    assert.equal(d.getElementById('prompt').textContent,before.prompt);assert.equal(d.getElementById('code').textContent,before.code);
    assert.equal(env.listeners.size,observers);
  }finally{env.close();}
});

test('组合关联自动选择实际使用的标题示例，弹窗切换独立播放且不改变主组合',async()=>{
  const env=await environment(true,{staticPreview:true,hash:'#material-phone-sequence'});
  try{
    const {w}=env,d=w.document,effect=title();
    click(d,'[data-kind="composition"]');
    for(const [id,variant] of Object.entries(compositions)){
      const composition=data.effects.find(item=>item.id===id);
      assert.equal(composition.action_variants['title-stagger'],variant);
      assert.ok(composition.actions.includes('title-stagger'));
      click(d,`[data-effect="${id}"]`);seek(w,'scrub',650);
      const snapshot=()=>({frame:frameMarkup(d.getElementById('preview')),time:d.getElementById('scrub').value,hash:w.location.hash,prompt:d.getElementById('prompt').textContent,code:d.getElementById('code').textContent});
      const main=snapshot(),observers=env.listeners.size;
      const trigger=click(d,'#related [data-related="title-stagger"]');
      assert.equal(d.getElementById('related-dialog').open,true);assert.equal(d.getElementById('related-variant-field').hidden,false);assert.equal(d.getElementById('related-variant').value,variant);
      assert.equal(d.getElementById('related-scrub').value,'0');assert.equal(w.MotionRuntime.instanceCount,2);assert.equal(w.MotionRuntime.runningCount,1);
      for(const chosen of [variant,...Object.keys(durations).filter(value=>value!==variant)]){
        change(w,'related-variant',chosen);
        const resolved=w.MotionKit.resolveVariant(effect,chosen);
        assert.equal(d.getElementById('related-scrub').value,'0');assert.equal(w.MotionRuntime.instanceCount,2);assert.equal(w.MotionRuntime.runningCount,1);
        assert.equal(d.getElementById('related-summary').textContent,resolved.summary);
        seek(w,'related-scrub',650);
        const host=d.createElement('div'),reference=w.MotionRuntime.create(host,resolved);
        try{
          reference.seek(resolved.duration_ms*.65);
          assert.equal(frameMarkup(d.querySelector('#related-preview .motion-stage')),frameMarkup(host.firstElementChild));
        }finally{reference.destroy();}
        assert.deepEqual(snapshot(),main);assert.equal(w.MotionRuntime.instanceCount,2);assert.equal(w.MotionRuntime.runningCount,0);
      }
      click(d,'#related-close');assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(env.listeners.size,observers);assert.equal(d.activeElement,trigger);
      // 再次打开须采用此组合对应的示例，不能串到上一回弹窗选择的另一套标题。
      click(d,'#related [data-related="title-stagger"]');assert.equal(d.getElementById('related-variant').value,variant);
      click(d,'#related-close');assert.equal(w.MotionRuntime.instanceCount,1);assert.deepEqual(snapshot(),main);
    }
  }finally{env.close();}
});

test('三个旧标题书签直达合并动作的对应示例，无需加载历史库',async()=>{
  for(const [old,variant] of Object.entries(bookmarks)){
    const env=await environment(true,{hash:'#'+old,lazyHistory:true});
    try{
      const {w}=env,d=w.document,resolved=w.MotionKit.resolveVariant(title(),variant);
      assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,'title-stagger');
      assert.equal(d.getElementById('effect-variant').value,variant);
      assert.equal(d.getElementById('preview-summary').textContent,resolved.summary);
      assert.equal(d.querySelector('script[src="history-data.js"]'),null);
      assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,1);assert.equal(w.MotionHistoryRuntime.instanceCount,0);
    }finally{env.close();}
  }
});

test('三个标题示例各自导出后可独立运行，同一时刻与目录一致并正确释放',async()=>{
  const env=await environment();
  env.w.eval(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'));
  try{
    for(const id of Object.keys(durations)){
      const effect=env.w.MotionKit.resolveVariant(title(),id),html=env.w.MotionExport.code(effect,{speed:1.25});
      const dom=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;
      w.matchMedia=()=>({matches:true});w.ResizeObserver=class{observe(){}disconnect(){}};w.HTMLCanvasElement.prototype.getContext=()=>null;
      try{
        for(const element of d.querySelectorAll('[src],link[href]')){
          const resource=element.getAttribute('src')||element.getAttribute('href');
          assert.ok(!/^(https?:|\/\/)/.test(resource));assert.ok((await stat(new URL('../'+resource,import.meta.url))).isFile());
        }
        for(const script of d.querySelectorAll('script'))w.eval(script.src?await readFile(new URL('../'+script.getAttribute('src'),import.meta.url),'utf8'):script.textContent);
        assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionDemo.speed,1.25);assert.equal(w.MotionDemo.paused,false);assert.equal(w.MotionDemo.currentTime,0);
        w.MotionDemo.pause();
        const host=env.w.document.createElement('div'),reference=env.w.MotionRuntime.create(host,effect);
        try{
          for(const time of [0,effect.duration_ms*.17,effect.duration_ms*.53,effect.preview_ms,effect.duration_ms,0,effect.duration_ms*.53]){
            reference.seek(time);w.MotionDemo.seek(time);
            assert.equal(frameMarkup(d.querySelector('.motion-stage')),frameMarkup(host.firstElementChild),id+' 导出与目录同帧不同');
          }
          const range=d.getElementById('time');range.value=700;range.dispatchEvent(new w.Event('input'));
          assert.equal(w.MotionDemo.currentTime,effect.duration_ms*.7);
          assert.equal(d.getElementById('readout').textContent,(effect.duration_ms*.7/1000).toFixed(1)+' / '+(effect.duration_ms/1000).toFixed(1)+' 秒');
          click(d,'#again');assert.equal(w.MotionDemo.currentTime,0);assert.equal(w.MotionDemo.paused,false);
          w.dispatchEvent(new w.Event('pagehide'));assert.equal(w.MotionRuntime.instanceCount,0);
        }finally{reference.destroy();}
      }finally{w.MotionRuntime?.disposeAll();w.anime?.engine.pause();dom.window.close();}
    }
    assert.equal(env.w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
});
