// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data} from './helpers.mjs';

const ids=['energy-discharge-journey','ring-sphere-journey','ring-construction-journey','mushroom-sphere-journey'];
test('能量球和环涡组合进入拆解图层后仍保持完整画板尺寸',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');root.className='motion-stage';
 try{
  // 沿用页面的真实样式顺序；同时覆盖无法使用显卡时的矢量绘制路径。
  for(const file of ['scenes.css','frame.css','app.css']){
   const style=w.document.createElement('style');style.textContent=await readFile(new URL('../catalog/'+file,import.meta.url),'utf8');w.document.head.append(style);
  }
  for(const id of ids){
   const effect=data.effects.find(e=>e.id===id),draw=w.MotionKit.createRenderer(root,effect);
   try{
    for(const time of [effect.preview_ms,effect.duration_ms,1000,effect.preview_ms]){
     draw(time);const svg=root.querySelector('.pattern-svg');
     assert.ok(svg?.parentElement.dataset.layer,effect.name+' 应保留真实拆解图层');
     const style=w.getComputedStyle(svg);
     assert.equal(style.width,'640px',effect.name+' 被图标样式缩小');
     assert.equal(style.height,'360px',effect.name+' 被图标样式缩小');
     assert.ok([...svg.querySelectorAll('path')].some(p=>p.getAttribute('d')&&Number(p.getAttribute('opacity'))>0),effect.name+' 应绘制可见线条');
     assert.doesNotMatch(svg.innerHTML,/NaN|Infinity/);
    }
   }finally{draw.destroy?.();root.replaceChildren();}
  }
  const icon=w.document.createElementNS('http://www.w3.org/2000/svg','svg');w.document.body.append(icon);
  assert.equal(w.getComputedStyle(icon).width,'15px','页面图标仍保持小尺寸');
 }finally{env.close();}
});

test('能量球开场可见，增密过程持续变化，电弧在后半段逐步接入',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');let draw;
 try{
  const effect=data.effects.find(e=>e.id==='energy-discharge-journey');
  assert.equal(effect.duration_ms,6000,'完整二十四秒片段按四倍速播放');
  draw=w.MotionKit.createRenderer(root,effect);const frames=new Map();
  for(const time of [0,250,1000,2000,3000,4000,5000,6000,0,2000]){
   draw(time);const svg=root.querySelector('.pattern-svg'),paths=[...svg.querySelectorAll('path')];
   const visible=paths.filter(p=>Number(p.getAttribute('opacity'))>0);
   assert.ok(visible.length>0,'开场必须已有可见流线');
   const coordinates=visible.flatMap(p=>[...p.getAttribute('d').matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(m=>[Number(m[1]),Number(m[2])]));
   const xs=coordinates.map(p=>p[0]),ys=coordinates.map(p=>p[1]);
   assert.ok(Math.max(...xs)-Math.min(...xs)>300&&Math.max(...ys)-Math.min(...ys)>300,'流线必须形成球体，不能挤成点');
   const arcs=visible.filter(p=>p.dataset.part.startsWith('discharge-'));
   if(time<=3000)assert.equal(arcs.length,0,'留出完整显影过程后再接入电弧');
   if(time>=4000)assert.ok(arcs.length>0,'后半段逐步加入可见电弧');
   const frame=visible.map(p=>[p.dataset.part,p.getAttribute('d'),p.getAttribute('opacity')]);
   const saved=JSON.stringify(frame);if(frames.has(time))assert.equal(saved,frames.get(time),'回拖应还原相同画面');else frames.set(time,saved);
  }
  assert.equal(new Set([...frames.values()]).size,frames.size,'各阶段不能因越界采样而停在同一幅画');
 }finally{draw?.destroy();env.close();}
});

test('独立能量增密从第一帧就形成球体，后半段不因轨迹越界而停住',async()=>{
 const env=await environment(),{w}=env,root=w.document.getElementById('root');let draw;
 try{
  draw=w.MotionKit.createRenderer(root,data.effects.find(e=>e.id==='energy-density-growth'));
  const frames=new Map();
  for(const time of [0,1000,4000,8000,12000,18000,22000,24000,0,12000]){
   draw(time);const paths=[...root.querySelectorAll('path')].filter(p=>+p.getAttribute('opacity')>0);
   assert.ok(paths.length>0,'第一帧就应有流线');
   const points=paths.flatMap(p=>[...p.getAttribute('d').matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(m=>[+m[1],+m[2]]));
   const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
   assert.ok(Math.max(...xs)-Math.min(...xs)>300&&Math.max(...ys)-Math.min(...ys)>300,'流线应形成可见球体');
   assert.ok(paths.every(p=>!p.dataset.part.startsWith('discharge-')),'独立增密不混入组合电弧');
   const frame=JSON.stringify(paths.map(p=>[p.dataset.part,p.getAttribute('d')]));
   if(frames.has(time))assert.equal(frame,frames.get(time),'回看必须还原相同画面');else frames.set(time,frame);
  }
  assert.equal(new Set(frames.values()).size,frames.size,'全程应持续翻卷，不能停在采样边界');
 }finally{draw?.destroy();env.close();}
});
