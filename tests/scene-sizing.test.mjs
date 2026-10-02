// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment} from './helpers.mjs';

test('标准动作画面保持完整画板尺寸，不被页面图标样式缩小',async()=>{
  const env=await environment(true);
  try{
    const {w}=env,d=w.document;
    // 使用页面真实的样式顺序，覆盖仅检查节点存在时遗漏的样式冲突。
    for(const link of d.querySelectorAll('link[rel="stylesheet"]')){
      const style=d.createElement('style');
      style.textContent=await readFile(new URL('../catalog/'+link.getAttribute('href'),import.meta.url),'utf8');
      d.head.append(style);
    }
    const fullSize=svg=>{
      const size=w.getComputedStyle(svg);
      assert.equal(size.width,'640px',svg.parentElement.dataset.effect);
      assert.equal(size.height,'360px',svg.parentElement.dataset.effect);
    };
    let sceneCount=0;
    for(const kind of ['action','illustration']){
      d.querySelector(`[data-kind="${kind}"]`).click();env.reveal();
      const scenes=[...d.querySelectorAll('.thumb .pattern-svg')];
      sceneCount+=scenes.length;scenes.forEach(fullSize);
    }
    assert.equal(sceneCount,152);
    d.querySelector('[data-kind="action"]').click();
    d.querySelector('[data-effect="rigid-rebound"]').click();
    fullSize(d.querySelector('#preview .pattern-svg'));
    d.querySelector('[data-effect="text-edit"]').click();
    const input=d.querySelector('#preview .edit-input');
    // 计算样式会对小数取舍；允许不到千分之一像素的精度差。
    assert.ok(Math.abs(parseFloat(w.getComputedStyle(input).width)-1520/3)<.001);
    const strike=input.querySelector('[data-part="strike"]');
    assert.ok(Math.abs(parseFloat(w.getComputedStyle(strike).width)-Number(strike.getAttribute('width')))<.001,'草稿叉号被控件图标样式缩小');
    assert.ok(Math.abs(parseFloat(w.getComputedStyle(input.querySelector('.edit-send svg')).width)-32/3)<.001);
    assert.equal(w.getComputedStyle(input.querySelector('[data-part="plus"]')).width,'10px');
    assert.equal(w.getComputedStyle(input.querySelector('[data-part="bot"]')).width,'8px');
    // 控件图标仍使用自己的小尺寸，不能把所有 SVG 都放大。
    const icon=d.querySelector('.group-head svg');
    assert.equal(w.getComputedStyle(icon).width,'14px');
    assert.equal(w.getComputedStyle(icon).height,'14px');
    assert.equal(w.MotionRuntime.instanceCount,1);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
