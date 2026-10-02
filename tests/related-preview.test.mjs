// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {data,environment,frameMarkup} from './helpers.mjs';

const click=(d,selector)=>{const node=d.querySelector(selector);assert.ok(node,selector);node.click();return node;};
function seek(w,id,value){const input=w.document.getElementById(id);input.value=value;input.dispatchEvent(new w.Event('input'));}
function geometry(root){
  const clone=root.cloneNode(true);
  for(const node of clone.querySelectorAll('[data-layer]')){node.removeAttribute('display');node.removeAttribute('data-composition-hidden');}
  return frameMarkup(clone);
}
function assertLayer(root,id){
  const nodes=[...root.querySelectorAll('[data-layer]')];
  assert.ok(nodes.some(node=>node.dataset.layer===id),id);
  for(const node of nodes){
    if(node.namespaceURI==='http://www.w3.org/2000/svg')assert.equal(node.getAttribute('display')==='none',node.dataset.layer!==id,node.dataset.layer);
    else {
      assert.equal(node.hasAttribute('data-composition-hidden'),node.dataset.layer!==id,node.dataset.layer);
      assert.notEqual(node.style.display,'none','普通布局内的隐藏层不能挤动相邻内容');
    }
  }
}

test('全部17个组合的66个真实组成部分在弹窗对照原画，主组合与选择均不跳走',async()=>{
  const env=await environment(true,{hash:'#paper-spiral-sequence'});
  try{
    const {w}=env,d=w.document;let count=0;
    for(const effect of data.effects.filter(e=>e.kind==='composition')){
      click(d,`[data-effect="${effect.id}"]`);
      const parts=w.MotionFactories[effect.id].breakdown;
      assert.deepEqual([...d.querySelectorAll('#related [data-related-layer]')].map(n=>n.dataset.relatedLayer),Array.from(parts,p=>p.id));
      for(const layer of parts){
        seek(w,'scrub',(layer.start+layer.end)/2/effect.duration_ms*1000);
        const time=d.getElementById('scrub').value,original=geometry(d.getElementById('preview')),hash=w.location.hash;
        const title=d.getElementById('preview-title').textContent,observers=env.listeners.size;
        const trigger=click(d,`#related [data-related-layer="${layer.id}"]`);
        assert.ok(d.getElementById('related-dialog').open);
        assert.equal(d.getElementById('related-title').textContent,layer.name);
        assert.equal(geometry(d.getElementById('related-preview')),original,`${effect.id}/${layer.id} 使用原组合绘制`);
        assertLayer(d.getElementById('related-preview'),layer.id);
        assert.equal(w.location.hash,hash);assert.equal(d.getElementById('preview-title').textContent,title);
        assert.equal(d.getElementById('scrub').value,time);assert.equal(geometry(d.getElementById('preview')),original);
        assert.equal(w.MotionRuntime.instanceCount,2);assert.equal(w.MotionRuntime.runningCount,0);
        for(const action of layer.actions||[])assert.ok(d.querySelector(`#related-example-buttons [data-related-example="${action}"]`));
        click(d,'#related-close');assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(env.listeners.size,observers);
        assert.equal(d.activeElement,trigger);count++;
      }
    }
    assert.equal(count,66);
  }finally{env.close();}
});

test('独立动作在同一弹窗切换，可返回组合层；主进度、拆解、提示词和筛选原样保留',async()=>{
  const env=await environment(true,{hash:'#paper-spiral-sequence'});
  try{
    const {w}=env,d=w.document;seek(w,'scrub',650);
    click(d,'[data-composition-mode="solo"]');click(d,'[data-composition-layer="disc"]');
    const before={frame:d.getElementById('preview').innerHTML,time:d.getElementById('scrub').value,
      prompt:d.getElementById('prompt').textContent,code:d.getElementById('code').textContent,hash:w.location.hash,
      filter:d.getElementById('category-filter').value,view:JSON.stringify(w.MotionComposition.view)};
    click(d,'[data-related-layer="spiral"]');
    click(d,'[data-related-example="spiral-draw-spin"]');
    assert.equal(d.getElementById('related-title').textContent,data.effects.find(e=>e.id==='spiral-draw-spin').name);
    assert.equal(d.activeElement.dataset.relatedExample,'spiral-draw-spin');
    assert.equal(w.MotionRuntime.instanceCount,2);
    click(d,'[data-related-example=""]');assertLayer(d.getElementById('related-preview'),'spiral');
    click(d,'#related-play');assert.equal(w.MotionRuntime.runningCount,1);
    seek(w,'related-scrub',900);assert.equal(w.MotionRuntime.runningCount,0);assertLayer(d.getElementById('related-preview'),'spiral');
    assert.equal(d.getElementById('related-scrub').value,'900');assert.match(d.getElementById('related-time').textContent,/^5\.4/);
    click(d,'#related-restart');assert.equal(w.MotionRuntime.runningCount,1);
    assert.match(d.getElementById('related-time').textContent,/^0\.0/);
    d.getElementById('related-play').dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    d.getElementById('related-dialog').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
    assert.equal(d.getElementById('related-dialog').open,false);assert.equal(w.MotionRuntime.runningCount,0);
    assert.deepEqual({frame:d.getElementById('preview').innerHTML,time:d.getElementById('scrub').value,
      prompt:d.getElementById('prompt').textContent,code:d.getElementById('code').textContent,hash:w.location.hash,
      filter:d.getElementById('category-filter').value,view:JSON.stringify(w.MotionComposition.view)},before);
  }finally{env.close();}
});

test('播放中的主组合开窗暂停，关闭恢复；反复开关、切换、页面离开不累积播放器',async()=>{
  const env=await environment(true,{hash:'#paper-spiral-sequence'});
  try{
    const {w}=env,d=w.document,baseline=env.listeners.size,dialog=d.getElementById('related-dialog');
    seek(w,'scrub',500);click(d,'#toggle-play');
    for(let i=0;i<6;i++){
      const trigger=click(d,'[data-related-layer="spiral"]');assert.equal(w.MotionRuntime.runningCount,0);
      click(d,'[data-related-example="spiral-draw-spin"]');click(d,'#related-play');assert.equal(w.MotionRuntime.runningCount,1);
      if(i%2)dialog.dispatchEvent(new w.Event('cancel',{cancelable:true}));else click(d,'#related-close');
      assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,1);
      assert.equal(env.listeners.size,baseline);assert.equal(d.activeElement,trigger);
    }
    click(d,'[data-related-layer="paper"]');
    dialog.dispatchEvent(new w.Event('close'));assert.ok(dialog.open,'上一轮延后派发的 close 不能清理新弹窗');
    assert.equal(w.MotionRuntime.instanceCount,2);
    const time=d.getElementById('scrub').value;
    w.dispatchEvent(new w.Event('pagehide'));assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(dialog.open,false);
    w.dispatchEvent(new w.Event('pageshow'));assert.equal(w.MotionRuntime.instanceCount,1);
    assert.equal(d.getElementById('scrub').value,time);assert.equal(dialog.open,false);
    click(d,'[data-related-layer="paper"]');click(d,'[data-kind="action"]');click(d,'[data-effect="fade-rise"]');
    assert.equal(dialog.open,false);assert.equal(w.MotionRuntime.instanceCount,1);
  }finally{env.close();}
});

test('后台和减少动态效果暂停弹窗，返回不误播主画面；点击遮罩关闭',async()=>{
  const env=await environment(true,{hash:'#interface-feedback'});
  try{
    const {w}=env,d=w.document,dialog=d.getElementById('related-dialog');
    env.media.matches=false;seek(w,'scrub',100);click(d,'#toggle-play');
    click(d,'[data-related-layer="result"]');
    assert.ok(Number(d.getElementById('related-scrub').value)>100,'尚未到达的层定位到自己的动作段，避免空画面');
    click(d,'#related-play');
    Object.defineProperty(d,'hidden',{configurable:true,value:true});d.dispatchEvent(new w.Event('visibilitychange'));
    assert.equal(w.MotionRuntime.runningCount,0);
    Object.defineProperty(d,'hidden',{configurable:true,value:false});d.dispatchEvent(new w.Event('visibilitychange'));
    assert.equal(w.MotionRuntime.runningCount,1);
    env.media.matches=true;env.media.dispatchEvent(new w.Event('change'));assert.equal(w.MotionRuntime.runningCount,0);
    dialog.getBoundingClientRect=()=>({left:20,top:20,right:800,bottom:600});
    dialog.dispatchEvent(new w.MouseEvent('pointerdown',{clientX:40,clientY:40}));
    dialog.dispatchEvent(new w.MouseEvent('pointerup',{clientX:40,clientY:40}));assert.ok(dialog.open);
    dialog.dispatchEvent(new w.MouseEvent('pointerdown',{clientX:4,clientY:4}));
    dialog.dispatchEvent(new w.MouseEvent('pointerup',{clientX:4,clientY:4}));assert.equal(dialog.open,false);
    assert.equal(w.MotionRuntime.runningCount,0);assert.equal(w.MotionRuntime.instanceCount,1);
  }finally{env.close();}
});

test('先关闭模态层再恢复按钮焦点，原生不可交互背景不会吞掉焦点恢复',async()=>{
  const env=await environment(true,{hash:'#paper-spiral-sequence'});
  try{
    const {w}=env,d=w.document,dialog=d.getElementById('related-dialog'),focus=w.HTMLElement.prototype.focus;
    w.HTMLElement.prototype.focus=function(...args){if(dialog.open&&!dialog.contains(this))return;return focus.apply(this,args);};
    const trigger=click(d,'[data-related-layer="paper"]');assert.equal(d.activeElement.id,'related-close');
    click(d,'#related-close');assert.equal(d.activeElement,trigger);
  }finally{env.close();}
});

test('弹窗复用界面深浅色变量和可见关闭按钮，隐藏普通图层只去掉不透明度',async()=>{
  const css=await readFile(new URL('../catalog/app.css',import.meta.url),'utf8');
  const dialog=css.match(/\.related-dialog \{([^}]+)\}/)[1];
  assert.match(dialog,/background:var\(--surface\)/);assert.match(dialog,/color:var\(--ink\)/);
  assert.match(css,/\.motion-stage \[data-composition-hidden\] \{ opacity:0 !important;/);
  assert.doesNotMatch(dialog,/display:\s*(flex|grid|block)/,'未打开的原生对话框必须继续隐藏');
});

test('循环组合第二轮打开相关层继承累计时间，只有重播才重新执行首次入场',async()=>{
  const env=await environment(true,{hash:'#dual-scroll'});
  try{
    const {w}=env,d=w.document,create=w.MotionRuntime.create;let main;
    w.MotionRuntime.create=(...args)=>{const player=create(...args);if(args[0].id==='preview')main=player;return player;};
    click(d,'[data-effect="dual-scroll"]');main.seekElapsed(8300);
    assert.equal(main.currentTime,300);assert.equal(main.elapsedTime,8300);
    const frame=geometry(d.getElementById('preview'));
    assert.match(d.querySelector('#preview .strip-row').style.transform,/translate3d\(0px/);
    click(d,'[data-related-layer="upper"]');
    assert.equal(geometry(d.getElementById('related-preview')),frame);
    click(d,'#related-restart');
    assert.match(d.querySelector('#related-preview .strip-row').style.transform,/-640px/);
    click(d,'#related-close');assert.equal(main.elapsedTime,8300);
    assert.equal(geometry(d.getElementById('preview')),frame);
  }finally{env.close();}
});
