// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {environment,data,sourceDefinition,frameMarkup} from './helpers.mjs';

const effect=data.effects.find(e=>e.id==='squash-bounce');
const value=(root,key)=>Number(root.querySelector('[data-part="ball"]').getAttribute(key));
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);

test('默认落地示例保留接触形变、逐次衰减和重复定位',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    const definition=sourceDefinition(effect);
    const draw=w.MotionFactories[effect.id](root,w.MotionKit,definition);
    const node=root.querySelector('[data-part="ball"]'),floor=root.querySelector('[data-part="floor"]').outerHTML;
    for(let time=0;time<=4000;time+=25){
      draw(time);
      close(value(root,'cx'),320);close(value(root,'rx')*value(root,'ry'),1024);
      assert.ok(value(root,'cy')+value(root,'ry')<=285+1e-9);
      assert.equal(root.querySelector('[data-part="ball"]'),node);
      assert.equal(root.querySelector('[data-part="floor"]').outerHTML,floor);
    }
    draw(800);close(value(root,'cy')+value(root,'ry'),285);
    assert.ok(value(root,'rx')>32&&value(root,'ry')<32,'落地时压扁');
    const heights=[4000/3,2400,10400/3].map(time=>{
      draw(time);assert.ok(value(root,'ry')>32&&value(root,'rx')<32,'离地时拉长');
      return 285-value(root,'cy')-value(root,'ry');
    });
    assert.ok(heights[0]>heights[1]&&heights[1]>heights[2]&&heights[2]>0,'回跳逐次降低');
    draw(4000);close(value(root,'rx'),32);close(value(root,'ry'),32);close(value(root,'cy')+value(root,'ry'),285);
    draw(1338);const frame=root.innerHTML;draw(0);draw(4000);draw(1338);assert.equal(root.innerHTML,frame);
  }finally{env.close();}
});

test('旧历史入口默认落地回弹，保留三种示例并同步播放、提示词和源码',async()=>{
  const env=await environment(true,{hash:'#history-sunset-load-deform',lazyHistory:true});
  try{
    const {w}=env,d=w.document,select=d.getElementById('effect-variant');
    assert.equal(d.querySelector('script[src="history-data.js"]'),null);
    assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,'squash-bounce');
    assert.equal(d.querySelector('#preview .motion-stage').dataset.variant,'drop');
    assert.deepEqual([...select.options].map(option=>option.value),['drop','sunset-sun','pixel-motion']);
    assert.equal(select.value,'drop');assert.equal(w.MotionRuntime.instanceCount,1);
    assert.equal(w.MotionMatch.rank(data,'逐段形变')[0].effect.id,'squash-bounce');
    assert.equal(d.getElementById('scrub').value,'0');assert.equal(w.MotionRuntime.instanceCount,1);
    assert.equal(w.MotionRuntime.runningCount,1);assert.equal(value(d.getElementById('preview'),'ry'),32);
    assert.match(d.getElementById('prompt').textContent,/落地回弹/);
    assert.ok(!d.getElementById('prompt').textContent.includes('0.022R'));
    assert.ok(d.getElementById('code').textContent.includes('"variantId": "drop"'));
    select.value='sunset-sun';select.dispatchEvent(new w.Event('change',{bubbles:true}));
    assert.equal(d.querySelector('#preview .motion-stage').dataset.variant,'sunset-sun');
    assert.equal(d.querySelector('#preview .motion-stage').dataset.art,'original');
    assert.ok(d.querySelector('#preview canvas'));assert.match(d.getElementById('prompt').textContent,/暖色/);
    assert.ok(d.getElementById('code').textContent.includes('"variantId": "sunset-sun"'));
    assert.equal(w.MotionRuntime.instanceCount,1);
    d.getElementById('tab-code').click();
    select.value='pixel-motion';select.dispatchEvent(new w.Event('change',{bubbles:true}));
    assert.equal(d.querySelector('#preview .motion-stage').dataset.variant,'pixel-motion');
    assert.ok(d.querySelector('#preview canvas'));
    assert.match(d.getElementById('prompt').textContent,/像素角色上下拉压/);
    assert.match(d.getElementById('code').textContent,/"variantId"\s*:\s*"pixel-motion"/);
    select.value='drop';select.dispatchEvent(new w.Event('change',{bubbles:true}));
    assert.equal(value(d.getElementById('preview'),'ry'),32);assert.equal(w.MotionRuntime.instanceCount,1);
    assert.equal(d.getElementById('scrub').value,'0');
    const composition=data.effects.find(e=>e.id==='sunset-pickup-journey');
    assert.equal(composition.action_variants[effect.id],'sunset-sun');
  }finally{env.close();}
});

test('落地示例导出后无需原工程，同一时刻与目录一致并正确释放',async()=>{
  const env=await environment();
  env.w.eval(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'));
  try{
    for(const id of ['drop']){
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
