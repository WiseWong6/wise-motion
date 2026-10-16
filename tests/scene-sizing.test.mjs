// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment} from './helpers.mjs';

test('切换不同原画比例后预览框同步适配，原作画布保持自身尺寸并恢复横画',async()=>{
 const env=await environment(true,{staticPreview:true});
 try{
  const {w}=env,d=w.document,preview=d.getElementById('preview'),shell=preview.closest('.preview-shell');
  d.querySelector('[data-kind="action"]').click();
  for(const [id,ratio,width,height] of [['galaxy-axis-reveal',3/4,660,880],['snow-arrival-window',5/6,900,1080],['fade-rise',16/9]]){
   d.querySelector(`[data-effect="${id}"]`).click();
   assert.equal(Number(shell.style.getPropertyValue('--preview-ratio')),ratio,id);
   if(width){const canvas=preview.querySelector('.pattern-canvas');assert.equal(canvas.width,width,id);assert.equal(canvas.height,height,id);}
  }
 }finally{env.close();}
});

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
      const bookArt=svg.closest('.wm-book__illustration');
      if(bookArt){
        // 原书页插画使用自己的竖向窗口，SVG 填满窗口，保留原裁切比例。
        assert.equal(w.getComputedStyle(bookArt).width,'220px');
        assert.equal(w.getComputedStyle(bookArt).height,'275px');
        assert.equal(size.width,'100%');assert.equal(size.height,'100%');
        assert.equal(svg.getAttribute('viewBox'),'0 0 240 320');
        assert.equal(svg.getAttribute('preserveAspectRatio'),'xMidYMid slice');
        return;
      }
      const label=svg.closest('[data-effect]')?.dataset.effect;
      if(size.width==='100%'&&size.height==='100%'){
        assert.equal(svg.closest('.motion-stage')?.style.width,'',label);
        const box=svg.getAttribute('viewBox')?.split(/\s+/).map(Number);
        assert.ok(box?.length===4&&box.every(Number.isFinite)&&box[2]>0&&box[3]>0,label+' 保留有效原画板并填满预览');
      }else{
        assert.equal(size.width,'640px',label);assert.equal(size.height,'360px',label);
      }
    };
    const covered=new Set();let sceneCount=0;
    for(const kind of ['action','illustration']){
      d.querySelector(`[data-kind="${kind}"]`).click();env.reveal();
      await w.MotionThumbs.whenIdle();
      const scenes=[...d.querySelectorAll('.thumb .pattern-svg')];
      sceneCount+=scenes.length;scenes.forEach(svg=>{fullSize(svg);covered.add(svg.closest('.effect-item').dataset.effect);});
      const posters=[...d.querySelectorAll('.thumb > .motion-stage[data-native-frame] > img')];
      sceneCount+=posters.length;
      for(const image of posters){
        const label=image.closest('.effect-item').dataset.effect,size=w.getComputedStyle(image);
        assert.equal(size.width,'100%',label);assert.equal(size.height,'100%',label);
        assert.equal(size.objectFit,'contain',label+' 原片封面等比容纳完整画面');
        covered.add(label);
      }
      for(const card of d.querySelectorAll('.effect-item'))assert.ok(card.querySelector('.thumb > .motion-stage'),card.dataset.effect+' 缩略图应完成');
    }
    assert.ok(sceneCount>=covered.size&&covered.size>0);
    for(const id of ['rigid-rebound','rect-aperture-breathe','paper-scroll-illustration'])assert.ok(covered.has(id),id+' 应参与尺寸检查');
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
