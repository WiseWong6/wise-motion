// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,frameMarkup} from './helpers.mjs';

const ids=['paper','disc','spiral','orbit','text'];
const setup=()=>environment(true,{hash:'#paper-spiral-sequence'});
const settle=()=>new Promise(resolve=>setTimeout(resolve,0));
const click=(d,selector)=>{const node=d.querySelector(selector);assert.ok(node,selector);node.click();};
function seek(w,milliseconds){
  const scrub=w.document.getElementById('scrub');scrub.value=milliseconds/6000*1000;scrub.dispatchEvent(new w.Event('input'));
}
function geometry(d){
  const clone=d.querySelector('#preview svg').cloneNode(true);
  clone.querySelectorAll('[data-layer]').forEach(node=>node.removeAttribute('display'));
  return frameMarkup(clone);
}
function assertLayers(d,expected){
  const included=new Set(expected);
  for(const node of d.querySelectorAll('#preview [data-layer]')){
    assert.equal(node.getAttribute('display')==='none',!included.has(node.dataset.layer),node.dataset.layer);
  }
  assert.equal(d.querySelector('#preview [data-part="bg"]').getAttribute('display'),null,'背景始终保留');
}

test('五层可单独或逐层对照，切换保持当前时刻和原动画几何，完整组合恢复边角标注',async()=>{
  const env=await setup();
  try{
    const {w}=env,d=w.document,panel=d.getElementById('composition-panel');
    assert.equal(panel.hidden,false);
    assert.deepEqual([...panel.querySelectorAll('[data-composition-layer]')].map(node=>node.dataset.compositionLayer),ids);
    assert.equal(d.querySelector('#preview [data-part="disc-center"]').dataset.layer,'disc','脉冲圆心属于圆盘');
    seek(w,3900);const original=geometry(d),svg=d.querySelector('#preview svg'),time=d.getElementById('scrub').value;
    assertLayers(d,[...ids,'labels']);
    click(d,'[data-composition-mode="solo"]');
    for(const id of ids){
      click(d,`[data-composition-layer="${id}"]`);
      assertLayers(d,[id]);assert.equal(geometry(d),original);assert.equal(d.getElementById('scrub').value,time);
      assert.equal(d.querySelector(`[data-composition-layer="${id}"]`).getAttribute('aria-pressed'),'true');
      assert.match(d.getElementById('composition-status').textContent,/单独查看/);
      assert.equal(d.querySelector('#preview svg'),svg);assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
    }
    click(d,'[data-composition-mode="stack"]');
    ids.forEach((id,index)=>{
      click(d,`[data-composition-layer="${id}"]`);
      assertLayers(d,ids.slice(0,index+1));assert.equal(geometry(d),original);
      assert.equal(d.getElementById('scrub').value,time);
      assert.match(d.getElementById('composition-status').textContent,/叠加到这里/);
    });
    click(d,'#composition-full');assertLayers(d,[...ids,'labels']);assert.equal(geometry(d),original);
    assert.equal(d.getElementById('composition-full').getAttribute('aria-pressed'),'true');
    assert.equal(d.querySelectorAll('#preview [display="none"]').length,0);
  }finally{env.close();}
});

test('拆解重播共用原播放器，反复切换和拖动不会让隐藏层重新显示或增加实例',async()=>{
  const env=await setup();
  try{
    const {w}=env,d=w.document,listenerCount=env.listeners.size,svg=d.querySelector('#preview svg');
    seek(w,3800);click(d,'[data-composition-mode="solo"]');click(d,'[data-composition-layer="spiral"]');
    click(d,'#composition-replay');
    assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,1);
    assert.equal(d.getElementById('time-current').textContent,'0.0');assertLayers(d,['spiral']);
    for(const time of [300,1800,3900,6000,0,2400]){seek(w,time);assertLayers(d,['spiral']);assert.equal(d.querySelector('#preview svg'),svg);}
    for(let turn=0;turn<12;turn++){
      click(d,`[data-composition-mode="${turn%2?'stack':'solo'}"]`);
      click(d,`[data-composition-layer="${ids[turn%ids.length]}"]`);
      assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);assert.equal(env.listeners.size,listenerCount);
    }
    assert.equal(d.querySelector('#preview svg'),svg);
  }finally{env.close();}
});

test('页面返回恢复拆解选择，切换其他条目后隐藏面板且不泄漏图层状态',async()=>{
  const env=await setup();
  try{
    const {w}=env,d=w.document;
    seek(w,3900);click(d,'[data-composition-mode="solo"]');click(d,'[data-composition-layer="disc"]');
    const time=d.getElementById('scrub').value,geometryBefore=geometry(d);
    w.dispatchEvent(new w.Event('pagehide'));assert.equal(w.MotionRuntime.instanceCount,0);
    w.dispatchEvent(new w.Event('pageshow'));
    assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);assertLayers(d,['disc']);
    assert.equal(w.MotionComposition.view.mode,'solo');assert.equal(w.MotionComposition.view.layer,'disc');
    assert.equal(d.getElementById('scrub').value,time);
    // 页面重建会重新生成裁剪标识，统一标识后逐项比对完整几何。
    assert.equal(geometry(d),geometryBefore);
    seek(w,3900);assertLayers(d,['disc']);
    click(d,'[data-kind="action"]');click(d,'[data-effect="fade-rise"]');
    assert.equal(d.getElementById('composition-panel').hidden,true);assert.equal(w.MotionComposition.view,undefined);
    assert.equal(w.MotionRuntime.instanceCount,1);const other=d.querySelector('#preview svg')||d.querySelector('#preview .motion-stage'),otherMarkup=other.outerHTML;
    click(d,'#composition-full');click(d,'#composition-replay');assert.equal(other.outerHTML,otherMarkup);assert.equal(w.MotionRuntime.runningCount,0);
    click(d,'[data-kind="composition"]');click(d,'[data-effect="paper-spiral-sequence"]');
    assert.equal(d.getElementById('composition-panel').hidden,false);assertLayers(d,[...ids,'labels']);
    assert.equal(w.MotionComposition.view.layer,undefined);assert.equal(w.MotionRuntime.instanceCount,1);
  }finally{env.close();}
});

test('单层查看时复制的提示词与代码仍包含完整组合，不导出临时拆解状态',async()=>{
  const env=await setup();
  try{
    const {w}=env,d=w.document,copied=[];
    Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copied.push(value);}}});
    const prompt=d.getElementById('prompt').textContent,code=d.getElementById('code').textContent;
    seek(w,3900);click(d,'[data-composition-mode="solo"]');click(d,'[data-composition-layer="spiral"]');
    const speed=d.getElementById('speed');speed.value='1';speed.dispatchEvent(new w.Event('input'));
    assert.equal(d.getElementById('prompt').textContent,prompt);assert.equal(d.getElementById('code').textContent,code);
    for(const name of ['纸条滑入','圆盘弹入','螺线绘转','圆点公转','文字升入'])assert.ok(prompt.includes(name),name);
    click(d,'#copy-prompt');await settle();click(d,'#copy-code');await settle();
    assert.deepEqual(copied,[prompt,code]);
    assert.match(code,/catalog\/effects\/reel-paper\.js/);assert.match(code,/paper-spiral-sequence/);
    assert.doesNotMatch(code,/MotionComposition|compositionView|display="none"/);
    assertLayers(d,['spiral']);assert.equal(w.MotionRuntime.instanceCount,1);
  }finally{env.close();}
});
