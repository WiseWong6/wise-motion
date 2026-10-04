// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {environment,data,sourceDefinition,frameMarkup} from './helpers.mjs';

const effect=data.effects.find(e=>e.id==='squash-bounce');
const value=(root,key)=>Number(root.querySelector('[data-part="ball"]').getAttribute(key));
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);

test('贴底三段形变逐时刻对应原源码，接触点、面积和单次回弹保持不变',async()=>{
  const source=await readFile('/Users/wisewong/Documents/Developer/scenes/ocean-sunset/sketch.js','utf8');
  const motion=source.match(/const SUN_MOTION = Object\.freeze\(\{[\s\S]*?\}\);/);
  const smooth=source.match(/function smoothstep\([^)]*\) \{[\s\S]*?\n\}/);
  const curve=source.match(/function sunDeformationAt\([^)]*\) \{[\s\S]*?\n\}/);
  assert.ok(motion&&smooth&&curve,'原曲线入口缺失');
  const original=vm.runInNewContext(motion[0]+'\n'+smooth[0]+'\n'+curve[0]+'\nsunDeformationAt');
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    const definition=sourceDefinition(w.MotionKit.resolveVariant(effect,'contact'));
    const draw=w.MotionFactories[effect.id](root,w.MotionKit,definition);
    const node=root.querySelector('[data-part="ball"]'),floor=root.querySelector('[data-part="floor"]').outerHTML;
    for(let time=0;time<=3100;time+=25){
      draw(time);const expected=original(24.5+time/1000);
      close(value(root,'rx'),64*expected.x);close(value(root,'ry'),64*expected.y);
      close(value(root,'cy'),252-64*expected.y);close(value(root,'cx'),320);
      close(value(root,'cy')+value(root,'ry'),252);close(value(root,'rx')*value(root,'ry'),4096);
      assert.equal(root.querySelector('[data-part="ball"]'),node);
      assert.equal(root.querySelector('[data-part="floor"]').outerHTML,floor);
    }
    for(const [time,ratio] of [[450,1.06],[1100,.91],[2150,1.022],[3100,1]]){
      draw(time);close(value(root,'ry'),64*ratio);
    }
    draw(1100);const frame=root.innerHTML;draw(0);draw(3100);draw(1100);assert.equal(root.innerHTML,frame);
  }finally{env.close();}
});

test('旧历史入口转入压缩回弹，切换两种示例同步播放、提示词和源码',async()=>{
  const env=await environment(true,{hash:'#history-sunset-load-deform',lazyHistory:true});
  try{
    const {w}=env,d=w.document,select=d.getElementById('effect-variant');
    assert.equal(d.querySelector('script[src="history-data.js"]'),null);
    assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,'squash-bounce');
    assert.equal(d.querySelector('#preview .motion-stage').dataset.variant,'contact');
    assert.deepEqual([...select.options].map(option=>option.value),['contact','drop']);
    assert.equal(select.value,'contact');assert.equal(w.MotionRuntime.instanceCount,1);
    assert.equal(w.MotionMatch.rank(data,'逐段形变')[0].effect.id,'squash-bounce');
    assert.match(d.getElementById('prompt').textContent,/0\.06L−0\.09C\+0\.022R/);
    assert.equal(value(d.getElementById('preview'),'ry'),64);
    select.value='drop';select.dispatchEvent(new w.Event('change',{bubbles:true}));
    assert.equal(d.querySelector('#preview .motion-stage').dataset.variant,'drop');
    assert.equal(d.getElementById('scrub').value,'0');assert.equal(w.MotionRuntime.instanceCount,1);
    assert.equal(w.MotionRuntime.runningCount,1);assert.equal(value(d.getElementById('preview'),'ry'),32);
    assert.match(d.getElementById('prompt').textContent,/落地回弹/);
    assert.ok(!d.getElementById('prompt').textContent.includes('0.022R'));
    assert.ok(d.getElementById('code').textContent.includes('"variantId": "drop"'));
    select.value='contact';select.dispatchEvent(new w.Event('change',{bubbles:true}));
    assert.equal(value(d.getElementById('preview'),'ry'),64);assert.equal(w.MotionRuntime.instanceCount,1);
  }finally{env.close();}
});

test('两种示例导出后无需原工程，同一时刻与目录一致并正确释放',async()=>{
  const env=await environment();
  env.w.eval(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'));
  try{
    for(const id of ['contact','drop']){
      const definition=env.w.MotionKit.resolveVariant(effect,id);
      const html=env.w.MotionExport.code(definition,{speed:1.25});
      const dom=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true});
      const {window:w}=dom,d=w.document;
      w.ResizeObserver=class{observe(){}disconnect(){}};
      w.HTMLCanvasElement.prototype.getContext=()=>null;
      try{
        for(const node of d.querySelectorAll('[src],link[href]')){
          const resource=node.getAttribute('src')||node.getAttribute('href');
          assert.ok(!/^(https?:|file:|\/\/)/.test(resource));
          assert.ok((await stat(new URL('../'+resource,import.meta.url))).isFile());
        }
        for(const script of d.querySelectorAll('script'))w.eval(script.src?await readFile(new URL('../'+script.getAttribute('src'),import.meta.url),'utf8'):script.textContent);
        assert.equal(w.MotionDemo.speed,1.25);assert.equal(w.MotionDemo.paused,false);w.MotionDemo.pause();
        const host=env.w.document.createElement('div'),reference=env.w.MotionRuntime.create(host,definition);
        try{
          for(const time of [0,150,410,789,1398,1950,2400,0,789]){
            reference.seek(time);w.MotionDemo.seek(time);
            assert.equal(frameMarkup(d.querySelector('.motion-stage')),frameMarkup(host.firstElementChild),id+' 导出与目录不同');
          }
          w.dispatchEvent(new w.Event('pagehide'));assert.equal(w.MotionRuntime.instanceCount,0);
        }finally{reference.destroy();}
      }finally{w.MotionRuntime?.disposeAll();w.anime?.engine.pause();dom.window.close();}
    }
  }finally{env.close();}
});
