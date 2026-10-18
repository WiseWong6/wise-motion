// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data} from './helpers.mjs';
import previewApi from '../catalog/preview-size.js';

const sizeFixture={aboutlove:{viewport:[0,0,1080,1440]},source:{remotion:{width:1920,height:1080}}};
test('独立示例采用实际取景尺寸，导出横幅不能覆盖竖幅、方形和宽幅取景',()=>{
 assert.deepEqual(previewApi.size(sizeFixture),{width:270,height:360});
 for(const [width,height] of [[880,880],[1080,320],[1080,1440]]){
  const result=previewApi.size({...sizeFixture,aboutlove:{viewport:[0,50,width,height]}});
  assert.ok(Math.abs(result.width/result.height-width/height)<1e-10);
 }
 assert.deepEqual(previewApi.size({...sizeFixture,aboutlove:null}),{width:640,height:360});
 assert.deepEqual(previewApi.size({...sizeFixture,aboutlove:{viewport:[0,0,0,1440]}}),{width:640,height:360});
});

test('主播放器首项竖幅后反复切换横幅和竖幅示例，并切到胶片时恢复横幅',async()=>{
 const env=await environment(true,{hash:'#zoom-transition',staticPreview:true});
 try{
  const {w}=env,d=w.document,shell=d.querySelector('.preview-shell');
  const ratio=()=>Number(shell.style.getPropertyValue('--preview-ratio'));
  assert.equal(ratio(),.75);
  const select=d.getElementById('effect-variant');
  for(const [variant,expected] of [['original',16/9],['aboutlove-40',.75],['original',16/9]]){
   select.value=variant;select.dispatchEvent(new w.Event('change'));assert.equal(ratio(),expected);
   const preview=d.querySelector('#preview .motion-stage');assert.equal(preview.dataset.variant,variant);
  }
  d.querySelector('[data-effect="film-scratch-flicker"]').click();
  assert.equal(ratio(),16/9);assert.equal(d.getElementById('effect-variant-field').hidden,true);
  d.querySelector('[data-effect="zoom-transition"]').click();assert.equal(ratio(),.75);
 }finally{env.close();}
});

test('相关动作弹窗在同一动作内切换横竖幅，也按当前示例更新',async()=>{
 const env=await environment(true,{hash:'#aboutlove-word-world-sequence',staticPreview:true});
 try{
  const {w}=env,d=w.document,dialog=w.MotionRelated.create({icon:()=>'',getMain:()=>null});
  try{
   dialog.open(data.effects.find(e=>e.id==='zoom-transition'));
   const host=d.getElementById('related-preview'),select=d.getElementById('related-variant');
   assert.equal(Number(host.style.getPropertyValue('--preview-ratio')),.75);
   for(const [variant,expected] of [['original',16/9],['aboutlove-40',.75]]){
    select.value=variant;select.dispatchEvent(new w.Event('change'));
    assert.equal(Number(host.style.getPropertyValue('--preview-ratio')),expected);
   }
  }finally{dialog.destroy();}
 }finally{env.close();}
});

test('全屏包含播放条、进入后保持可操作，退出及请求失败保留原播放器',async()=>{
 let fullscreen=null,requested=null,fail=false,player;
 const env=await environment(true,{hash:'#zoom-transition',staticPreview:true,beforeApp(w){
  const d=w.document;Object.defineProperty(d,'fullscreenElement',{get:()=>fullscreen});
  w.HTMLElement.prototype.requestFullscreen=async function(){if(fail)throw Error('拒绝');requested=this;fullscreen=this;d.dispatchEvent(new w.Event('fullscreenchange'));};
  d.exitFullscreen=async()=>{fullscreen=null;d.dispatchEvent(new w.Event('fullscreenchange'));};
  const create=w.MotionRuntime.create;w.MotionRuntime.create=(...args)=>(player=create(...args));
 }});
 try{
  const {w}=env,d=w.document,button=d.getElementById('fullscreen'),bar=d.querySelector('.playbar');
  const original=player;player.pause();player.seek(0);const time=player.currentTime;
  bar.classList.add('is-away');button.click();await Promise.resolve();
  assert.equal(requested,d.querySelector('.preview-shell'));assert.ok(requested.contains(bar));
  assert.ok(requested.contains(d.getElementById('scrub')));assert.equal(bar.classList.contains('is-away'),false);
  assert.equal(button.getAttribute('aria-label'),'退出全屏');
  d.querySelector('.stage').dispatchEvent(new w.Event('pointerleave'));
  assert.equal(bar.classList.contains('is-away'),false,'全屏时控制条不随指针离开隐藏');
  const scrub=d.getElementById('scrub');scrub.value=500;scrub.dispatchEvent(new w.Event('input'));
  assert.ok(player.currentTime>time);assert.equal(player,original);
  button.click();await Promise.resolve();assert.equal(fullscreen,null);assert.equal(button.title,'全屏预览');
  fail=true;button.click();await Promise.resolve();assert.equal(fullscreen,null);assert.equal(player.destroyed,false);
 }finally{env.close();}
});

test('全屏样式解除普通窗口宽度上限，横竖画面等比容纳并保留控制条空间',async()=>{
 const css=await readFile(new URL('../catalog/app.css',import.meta.url),'utf8');
 const rule=selector=>{const start=css.indexOf(selector+' {');assert.ok(start>=0,selector);return css.slice(start,css.indexOf('}',start));};
 assert.match(rule('.preview-shell:fullscreen'),/max-width:none/);
 const preview=rule('.preview-shell:fullscreen #preview').replace(/\/\*[\s\S]*?\*\//g,'');
 // 核对正式样式的尺寸公式；这不替代浏览器实际布局与播放验收。
 const dimension=(axis,screenWidth,screenHeight,ratio)=>{
  const value=new RegExp('(?:[;{]\\s*)'+axis+':([^;]+)').exec(preview)?.[1];
  assert.ok(value,'全屏画面必须有明确的'+axis);
  const expression=value.replaceAll('var(--preview-ratio)',String(ratio))
   .replace(/([\d.]+)dvw/g,(_,n)=>String(Number(n)*screenWidth/100))
   .replace(/([\d.]+)dvh/g,(_,n)=>String(Number(n)*screenHeight/100))
   .replace(/\bcalc\(/g,'(');
  assert.match(expression,/^[\d.\s(),*/+\-min]+$/,'全屏尺寸不能依赖自动高度或网格内的百分比');
  return Function('min','return ('+expression+')')(Math.min);
 };
 for(const [screenWidth,screenHeight] of [[1920,1080],[1080,1920],[3440,1440],[844,390]]){
  for(const ratio of [16/9,.75,1,1080/320]){
   const width=dimension('width',screenWidth,screenHeight,ratio),height=dimension('height',screenWidth,screenHeight,ratio);
   assert.ok(width>0&&height>0,'全屏画面不能塌成零尺寸');
   assert.ok(width<=screenWidth&&height<=screenHeight,'全屏画面不能超出屏幕');
   assert.ok(Math.abs(width/height-ratio)<1e-10,'横竖画面都应保持原比例');
   assert.ok(Math.abs(width-screenWidth)<1e-10||Math.abs(height-screenHeight)<1e-10,'画面至少一边应铺满屏幕');
  }
 }
 const bar=rule('.preview-shell:fullscreen .playbar');
 assert.match(bar,/position:absolute/);assert.match(bar,/safe-area-inset-bottom/);assert.match(bar,/opacity:1/);assert.match(bar,/pointer-events:auto/);
});
