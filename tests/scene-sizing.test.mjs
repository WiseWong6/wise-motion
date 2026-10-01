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
    env.reveal();
    const scenes=[...d.querySelectorAll('.thumb .pattern-svg')];
    assert.equal(scenes.length,54);
    const fullSize=svg=>{
      const size=w.getComputedStyle(svg);
      assert.equal(size.width,'640px',svg.parentElement.dataset.effect);
      assert.equal(size.height,'360px',svg.parentElement.dataset.effect);
    };
    scenes.forEach(fullSize);
    d.querySelector('[data-effect="rigid-rebound"]').click();
    fullSize(d.querySelector('#preview .pattern-svg'));
    // 控件图标仍使用自己的小尺寸，不能把所有 SVG 都放大。
    const icon=d.querySelector('.group-head svg');
    assert.equal(w.getComputedStyle(icon).width,'14px');
    assert.equal(w.getComputedStyle(icon).height,'14px');
    assert.equal(w.MotionRuntime.instanceCount,1);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
