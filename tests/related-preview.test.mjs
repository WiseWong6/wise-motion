// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {data,environment,frameMarkup} from './helpers.mjs';
const click=(d,selector)=>{const node=d.querySelector(selector);assert.ok(node,selector);node.click();return node;};
function seek(w,id,value){const input=w.document.getElementById(id);input.value=value;input.dispatchEvent(new w.Event('input'));}

test('全部组合直接关联独立动作，弹窗从头自动播放且不改变主组合',async()=>{
  const env=await environment(true,{staticPreview:true,hash:'#paper-spiral-sequence'});
  try{
    const {w}=env,d=w.document;
    for(const effect of data.effects.filter(e=>e.kind==='composition')){
      click(d,`[data-effect="${effect.id}"]`);seek(w,'scrub',650);
      assert.deepEqual([...d.querySelectorAll('#related [data-related]')].map(n=>n.dataset.related),effect.actions);
      assert.ok(effect.actions.length);
      for(const id of effect.actions){
        const target=w.MotionKit.resolveVariant(data.effects.find(e=>e.id===id),effect.action_variants?.[id]),time=d.getElementById('scrub').value,original=frameMarkup(d.getElementById('preview')),hash=w.location.hash,observers=env.listeners.size;
        const trigger=click(d,`#related [data-related="${id}"]`);
        assert.ok(d.getElementById('related-dialog').open);
        assert.equal(d.getElementById('related-title').textContent,target.name);
        assert.equal(d.querySelector('#related-preview .motion-stage').dataset.effect,id);
        assert.equal(d.getElementById('related-scrub').value,'0');
        assert.equal(d.getElementById('related-play').getAttribute('aria-label'),'暂停相关动作');
        assert.equal(w.MotionRuntime.instanceCount,2);assert.equal(w.MotionRuntime.runningCount,1);
        assert.equal(d.querySelector('#related-preview [data-composition-hidden]'),null);
        // 用独立动作自身的工厂对照中间态，弹窗不再渲染完整组合后隐藏其它层。
        seek(w,'related-scrub',500);
        const host=d.createElement('div'),reference=w.MotionRuntime.create(host,target);reference.seek(target.duration_ms*.5);
        assert.equal(frameMarkup(d.querySelector('#related-preview .motion-stage')),frameMarkup(host.firstElementChild));reference.destroy();
        assert.equal(w.location.hash,hash);assert.equal(d.getElementById('scrub').value,time);assert.equal(frameMarkup(d.getElementById('preview')),original);
        click(d,'#related-close');assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(env.listeners.size,observers);assert.equal(d.activeElement,trigger);
      }
    }
  }finally{env.close();}
});

test('弹窗独立拖动与重播，主进度、拆解、输出及筛选保持原样',async()=>{
  const env=await environment(true,{staticPreview:true,hash:'#paper-spiral-sequence'});
  try{
    const {w}=env,d=w.document;seek(w,'scrub',650);
    click(d,'[data-composition-mode="solo"]');click(d,'[data-composition-layer="disc"]');
    const snapshot=()=>({frame:d.getElementById('preview').innerHTML,time:d.getElementById('scrub').value,prompt:d.getElementById('prompt').textContent,code:d.getElementById('code').textContent,hash:w.location.hash,filter:d.getElementById('category-filter').value,view:JSON.stringify(w.MotionComposition.view)}),before=snapshot();
    click(d,'[data-related="spiral-draw-spin"]');
    seek(w,'related-scrub',900);assert.equal(w.MotionRuntime.runningCount,0);assert.equal(d.getElementById('related-scrub').value,'900');
    click(d,'#related-restart');assert.equal(w.MotionRuntime.runningCount,1);assert.match(d.getElementById('related-time').textContent,/^0\.0/);
    d.getElementById('related-play').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    d.getElementById('related-dialog').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
    assert.equal(d.getElementById('related-dialog').open,false);assert.equal(w.MotionRuntime.runningCount,0);assert.deepEqual(snapshot(),before);
  }finally{env.close();}
});

test('打开时暂停主画面，关闭恢复；反复开关和离开页面不累积播放器',async()=>{
  const env=await environment(true,{staticPreview:true,hash:'#paper-spiral-sequence'});
  try{
    const {w}=env,d=w.document,baseline=env.listeners.size,dialog=d.getElementById('related-dialog');
    seek(w,'scrub',500);click(d,'#toggle-play');
    for(let i=0;i<6;i++){
      const trigger=click(d,'[data-related="spiral-draw-spin"]');assert.equal(w.MotionRuntime.runningCount,1);
      seek(w,'related-scrub',500);assert.equal(w.MotionRuntime.runningCount,0,'此时主播放器确实暂停');
      if(i%2)dialog.dispatchEvent(new w.Event('cancel',{cancelable:true}));else click(d,'#related-close');
      assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,1);assert.equal(env.listeners.size,baseline);assert.equal(d.activeElement,trigger);
    }
    click(d,'[data-related="paper-strip-stagger"]');
    dialog.dispatchEvent(new w.Event('close'));assert.ok(dialog.open,'旧 close 事件不能清理新弹窗');assert.equal(w.MotionRuntime.instanceCount,2);
    const time=d.getElementById('scrub').value;
    w.dispatchEvent(new w.Event('pagehide'));assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(dialog.open,false);
    w.dispatchEvent(new w.Event('pageshow'));assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(d.getElementById('scrub').value,time);
    click(d,'[data-related="paper-strip-stagger"]');click(d,'[data-kind="action"]');click(d,'[data-effect="fade-rise"]');
    assert.equal(dialog.open,false);assert.equal(w.MotionRuntime.instanceCount,1);
  }finally{env.close();}
});

test('后台暂停弹窗，系统偏好不改变播放，点击遮罩关闭后恢复主画面',async()=>{
  const env=await environment(true,{staticPreview:true,hash:'#paper-spiral-sequence'});
  try{
    const {w}=env,d=w.document,dialog=d.getElementById('related-dialog');
    env.media.matches=false;seek(w,'scrub',100);click(d,'#toggle-play');click(d,'[data-related="paper-strip-stagger"]');
    Object.defineProperty(d,'hidden',{configurable:true,value:true});d.dispatchEvent(new w.Event('visibilitychange'));assert.equal(w.MotionRuntime.runningCount,0);
    Object.defineProperty(d,'hidden',{configurable:true,value:false});d.dispatchEvent(new w.Event('visibilitychange'));assert.equal(w.MotionRuntime.runningCount,1);
    env.media.matches=true;env.media.dispatchEvent(new w.Event('change'));assert.equal(w.MotionRuntime.runningCount,1);
    dialog.getBoundingClientRect=()=>({left:20,top:20,right:800,bottom:600});
    dialog.dispatchEvent(new w.MouseEvent('pointerdown',{clientX:40,clientY:40}));dialog.dispatchEvent(new w.MouseEvent('pointerup',{clientX:40,clientY:40}));assert.ok(dialog.open);
    dialog.dispatchEvent(new w.MouseEvent('pointerdown',{clientX:4,clientY:4}));dialog.dispatchEvent(new w.MouseEvent('pointerup',{clientX:4,clientY:4}));assert.equal(dialog.open,false);
    assert.equal(w.MotionRuntime.runningCount,1);assert.equal(w.MotionRuntime.instanceCount,1);
    click(d,'#toggle-play');assert.equal(w.MotionRuntime.runningCount,0);
  }finally{env.close();}
});

test('先关闭模态层再恢复按钮焦点',async()=>{
  const env=await environment(true,{staticPreview:true,hash:'#paper-spiral-sequence'});
  try{
    const {w}=env,d=w.document,dialog=d.getElementById('related-dialog'),focus=w.HTMLElement.prototype.focus;
    w.HTMLElement.prototype.focus=function(...args){if(dialog.open&&!dialog.contains(this))return;return focus.apply(this,args);};
    const trigger=click(d,'[data-related="paper-strip-stagger"]');assert.equal(d.activeElement.id,'related-close');click(d,'#related-close');assert.equal(d.activeElement,trigger);
  }finally{env.close();}
});

test('弹窗使用深浅色变量，三项普通动作不再出现组合拆解',async()=>{
  const css=await readFile(new URL('../catalog/app.css',import.meta.url),'utf8'),dialog=css.match(/\.related-dialog \{([^}]+)\}/)[1];
  assert.match(dialog,/background:var\(--surface\)/);assert.match(dialog,/color:var\(--ink\)/);assert.doesNotMatch(dialog,/display:\s*(flex|grid|block)/);
  const env=await environment(true,{staticPreview:true,hash:'#dual-scroll'});
  try{
    const {w}=env,d=w.document;
    for(const id of ['dual-scroll','dual-scroll-settle','arc-cards']){
      assert.equal(data.effects.find(e=>e.id===id).kind,'action');click(d,`[data-effect="${id}"]`);
      assert.equal(d.getElementById('composition-panel').hidden,true);assert.equal(w.MotionFactories[id].breakdown,undefined);
    }
  }finally{env.close();}
});
