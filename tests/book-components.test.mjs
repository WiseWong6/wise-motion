// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {resolveEffect,getEffectMetadata} from '../remotion/clock.mjs';
import {environment} from './helpers.mjs';
const source=await readFile(new URL('../catalog/effects/dither-book.js',import.meta.url),'utf8');
const components=['book-spine-turn','book-geometric-illustration','book-paper-light'];
function setup(){
  const dom=new JSDOM('<div id="a"></div><div id="b"></div>',{runScripts:'outside-only',pretendToBeVisual:true});
  dom.window.MotionKit={textSize:()=>10};dom.window.eval(source);
  return {dom,w:dom.window,a:dom.window.document.getElementById('a'),b:dom.window.document.getElementById('b')};
}
const visible=(root,id)=>{const nodes=[...root.querySelectorAll(`[data-layer="${id}"]`)];return nodes.length>0&&nodes.every(node=>!node.hasAttribute('data-composition-hidden'));};
function drawing(node){
  let html=node.innerHTML;
  [...node.querySelectorAll('[id]')].forEach((part,i)=>{html=html.replaceAll(part.id,'drawing-'+i);});
  return html;
}
test('整本书是三个真实入口的组合，原引用与六个插画示例可复用',()=>{
  const book=resolveEffect('dither-lab-book');
  assert.equal(book.kind,'composition');assert.deepEqual(book.actions,components);
  assert.equal(resolveEffect(components[0]).kind,'action');assert.equal(resolveEffect(components[1]).kind,'illustration');assert.equal(resolveEffect(components[2]).kind,'action');
  assert.equal(resolveEffect(components[1]).variants.length,6);
  const env=setup();
  try{
    const layers=env.w.MotionFactories[book.id].breakdown;
    assert.deepEqual(Array.from(layers.flatMap(layer=>Array.from(layer.actions))),components);
    for(const id of [book.id,...components])assert(getEffectMetadata(id).durationInFrames>0);
  }finally{env.dom.window.close();}
});
test('独立翻页只去掉插画与材质，纸页运动始终与完整组合相同',()=>{
  const {dom,w,a,b}=setup();
  try{
    const full=w.MotionFactories['dither-lab-book'](a,null,resolveEffect('dither-lab-book'));
    const turn=w.MotionFactories[components[0]](b,null,resolveEffect(components[0]));
    for(const ms of [0,370,2380,2640,3390,3500,3750,4490,5680,7600,3390,0,4490]){
      full(ms);turn(ms);
      for(const selector of ['.wm-book__body','.wm-book__leaf'])assert.equal(a.querySelector(selector).getAttribute('style'),b.querySelector(selector).getAttribute('style'));
      assert.equal(a.querySelector('.wm-book__leaf').hidden,b.querySelector('.wm-book__leaf').hidden);
      assert(visible(b,'turn'));assert(!visible(b,'art'));assert(!visible(b,'light'));
      assert.equal(b.querySelector('.wm-book__art,.wm-book__grain,.wm-book__shade,.wm-book__spine,[data-composition-hidden]'),null);
      assert.equal(a.querySelectorAll('[data-composition-hidden]').length,0);
    }
    full.destroy();turn.destroy();assert.equal(a.children.length,0);assert.equal(b.children.length,0);
  }finally{dom.window.close();}
});
test('六个独立插画直接来自原书页，重复定位与多实例图案引用独立',()=>{
  const {dom,w,a,b}=setup();
  try{
    const book=w.WiseDitherBook.create(a,{interactive:false,intro:false});
    const variants=resolveEffect(components[1]).variants;
    for(let i=0;i<variants.length;i++){
      book.renderState({index:i,flip:null,entrance:1});
      const render=w.MotionFactories[components[1]](b,null,resolveEffect(components[1],variants[i].id));
      const illustration=b.querySelector('svg');
      assert.equal(drawing(illustration),drawing(a.querySelector('.wm-book__base--right svg')));
      assert.equal(b.querySelector('.wm-book__art').dataset.page,String(i));
      const state=b.innerHTML;for(const ms of [0,1000,440,0]){render(ms);assert.equal(b.innerHTML,state);}
      const ids=[...a.querySelectorAll('[id]'),...b.querySelectorAll('[id]')].map(node=>node.id);
      assert.equal(new Set(ids).size,ids.length);
    }
    book.destroy();
  }finally{dom.window.close();}
});
test('独立纸张光影保持纸页姿态，只按原角度映射改变正反面明暗',()=>{
  const {dom,w,a}=setup();
  try{
    const render=w.MotionFactories[components[2]](a,null,resolveEffect(components[2]));
    const leaf=a.querySelector('.wm-book__leaf'),pose=leaf.style.transform;
    const shades=a.querySelectorAll('.wm-book__leaf .wm-book__shade');
    const states=new Map();
    for(const ms of [0,3390,3500,3750,4490,5680,6600,7600]){
      render(ms);const flip=w.WiseDitherBook.demoAt(ms).flip,sweep=flip?(flip.direction>0?flip.progress:1-flip.progress):0;
      assert(Math.abs(Number(shades[0].style.opacity)-.36*sweep)<1e-9);
      assert(Math.abs(Number(shades[1].style.opacity)-.36*(1-sweep))<1e-9);
      assert.equal(leaf.style.transform,pose);assert(visible(a,'light'));assert(!visible(a,'art'));
      assert.equal(a.querySelector('.wm-book__art,[data-layer="turn"],[data-composition-hidden]'),null);
      states.set(ms,shades[0].style.opacity+' '+shades[1].style.opacity);
    }
    for(const [ms,state] of [...states].reverse()){render(ms);assert.equal(shades[0].style.opacity+' '+shades[1].style.opacity,state);}
    render.destroy();render(3390);assert.equal(a.children.length,0);
  }finally{dom.window.close();}
});
test('目录中三层可单独与逐层查看，恢复组合保留纸页参数与当前翻页',async()=>{
  const env=await environment(true,{staticPreview:true,hash:'#dither-lab-book'});
  try{
    const {w}=env,d=w.document,root=d.getElementById('preview');
    assert.equal(d.getElementById('composition-panel').hidden,false);assert.equal(d.getElementById('book-panel').hidden,false);
    d.getElementById('scrub').value=3500/7600*1000;d.getElementById('scrub').dispatchEvent(new w.Event('input'));
    d.getElementById('book-padding').value=22;d.getElementById('book-padding').dispatchEvent(new w.Event('input'));
    const leaf=root.querySelector('.wm-book__leaf'),pose=leaf.style.transform,time=d.getElementById('scrub').value;
    d.querySelector('[data-composition-mode="solo"]').click();
    for(const id of ['turn','art','light']){
      d.querySelector(`[data-composition-layer="${id}"]`).click();
      assert(visible(root,id));assert.equal(root.querySelector('.wm-book__leaf'),leaf);assert.equal(leaf.style.transform,pose);assert.equal(d.getElementById('scrub').value,time);
    }
    d.querySelector('[data-composition-mode="stack"]').click();d.querySelector('[data-composition-layer="art"]').click();
    assert(visible(root,'turn'));assert(visible(root,'art'));assert(!visible(root,'light'));
    d.getElementById('composition-full').click();assert.equal(root.querySelectorAll('[data-composition-hidden]').length,0);
    assert.equal(root.querySelector('.wm-book').style.getPropertyValue('--book-pad'),'22px');
    assert.equal(leaf.style.transform,pose);assert.equal(w.MotionRuntime.instanceCount,1);
    assert.deepEqual([...d.querySelectorAll('#related [data-related]')].map(node=>node.dataset.related),components);
  }finally{env.close();}
});

test('三个独立入口的复制输出可离开目录加载，保留变体并重复定位',async()=>{
  const env=await environment();
  env.w.eval(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'));
  try{
    for(const id of components){
      const html=env.w.MotionExport.code(resolveEffect(id),{variantId:id===components[1]?'water':undefined});
      const dom=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
      w.ResizeObserver=class{observe(){}disconnect(){}};
      try{
        for(const script of w.document.querySelectorAll('script'))w.eval(script.src?await readFile(new URL('../'+script.getAttribute('src'),import.meta.url),'utf8'):script.textContent);
        w.MotionDemo.pause();
        const root=w.document.getElementById('motion'),ms=id===components[1]?500:3390;
        w.MotionDemo.seek(ms);const snapshot=root.innerHTML;
        assert(root.querySelector('.wm-book'));assert.equal(root.querySelector('[data-composition-hidden]'),null);
        if(id===components[1])assert.equal(root.querySelector('[data-page]').dataset.page,'4');
        else assert.equal(root.querySelector('svg'),null);
        w.MotionDemo.seek(0);w.MotionDemo.seek(ms);assert.equal(root.innerHTML,snapshot);
        w.dispatchEvent(new w.Event('pagehide'));assert.equal(w.MotionRuntime.instanceCount,0);
      }finally{w.MotionRuntime?.disposeAll();w.anime?.engine.pause();w.close();}
    }
  }finally{env.close();}
});
