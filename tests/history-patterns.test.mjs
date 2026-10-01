// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {environment,data} from './helpers.mjs';
function render(w,root,id){const e=data.effects.find(e=>e.id===id),draw=w.MotionFactories[id](root,w.MotionKit,e);return p=>draw(p*e.duration_ms,{duration:e.duration_ms,ease:e.default_ease});}
const part=(root,id)=>root.querySelector(`[data-part="${id}"]`);
const number=(root,id,key)=>Number(part(root,id).getAttribute(key));
test('滚动、刹停和轮播按不同的速度与停留关系执行',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    let draw=render(w,root,'scroll-brake');
    const x=p=>{draw(p);return Number(part(root,'belt').getAttribute('transform').match(/translate\(([-.\d]+)/)[1]);};
    const fast=Math.abs(x(.31)-x(.3)),slow=Math.abs(x(.81)-x(.8));assert.ok(slow<fast*.2);
    draw(.9);const stopped=root.innerHTML;draw(1);assert.equal(root.innerHTML,stopped);
    assert.equal(number(root,'r2','x')+65+x(1),320,'终点卡片未与标记对齐');
    draw=render(w,root,'dwell-carousel');draw(.08);const first=root.innerHTML;draw(.18);assert.equal(root.innerHTML,first);
    draw(.3);assert.notEqual(root.innerHTML,first);draw(.45);const second=root.innerHTML;draw(.6);assert.equal(root.innerHTML,second);
  }finally{env.close();}
});
test('文稿公共前缀、清墨间隔与不缩放强调得到保留',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    let draw=render(w,root,'text-edit');draw(0);assert.equal(part(root,'word').textContent,'先说清楚问题');
    draw(.5);assert.equal(part(root,'word').textContent,'先说清楚');draw(1);assert.equal(part(root,'word').textContent,'先说清楚做法');
    draw=render(w,root,'stagger-crossfade');draw(.5);assert.equal(number(root,'old','opacity'),0);assert.equal(number(root,'new','opacity'),0);
    draw=render(w,root,'underline-draw');const body=part(root,'body').outerHTML;draw(.2);draw(.8);assert.equal(part(root,'body').outerHTML,body);
    assert.ok(number(root,'u0','x2')>number(root,'u0','x1'));assert.ok(number(root,'u1','x2')>number(root,'u1','x1'));
    draw=render(w,root,'rolling-digits');draw(.2);const hundreds=part(root,'d0').getAttribute('transform');draw(.25);assert.equal(part(root,'d0').getAttribute('transform'),hundreds);
    assert.equal(number(root,'d0','opacity'),1);assert.ok(number(root,'d2','opacity')<1);
    draw(.5);assert.notEqual(part(root,'d0').getAttribute('transform'),hundreds);draw(1);
    assert.ok(['d0','d1','d2'].every(id=>number(root,id,'opacity')===1),'未落定的位不得表现为真实读数');
  }finally{env.close();}
});
test('事件在指针到达对应位置时才触发，遮挡带闭合时覆盖完整',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');let draw=render(w,root,'event-clock');
    for(const [i,p] of [[0,.22],[1,.48],[2,.73]]){
      draw(p-1e-5);assert.ok(number(root,'c'+i,'opacity')<1);draw(p);assert.equal(number(root,'c'+i,'opacity'),1);
      assert.equal(number(root,'now','x1'),number(root,'c'+i,'cx'));
    }
    draw=render(w,root,'shutter-transition');draw(.5);
    for(let i=0;i<8;i++){assert.equal(number(root,'shade'+i,'rx'),0);assert.equal(part(root,'shade'+i).getAttribute('transform'),'translate(0 0)');}
  }finally{env.close();}
});
test('物理关系保持挂点、面积、根部以及轮子随行程转动',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    let draw=render(w,root,'pivot-swing');const pin=part(root,'pin').outerHTML;draw(.25);draw(.7);assert.equal(part(root,'pin').outerHTML,pin);
    draw=render(w,root,'squash-bounce');for(const p of [.1,.2,.33,.6,1]){draw(p);assert.ok(Math.abs(number(root,'ball','rx')*number(root,'ball','ry')-1024)<1e-8);}
    draw=render(w,root,'anchored-growth');draw(.1);draw(.8);assert.equal(number(root,'stem','y1'),290);assert.ok(number(root,'stem','y2')<number(root,'stem','y1'));
    draw=render(w,root,'rolling-distance');
    const measure=p=>{draw(p);return [Number(part(root,'car').getAttribute('transform').match(/translate\(([-.\d]+)/)[1]),Number(part(root,'wheel0').getAttribute('transform').match(/rotate\(([-.\d]+)/)[1])];};
    const [x0,a0]=measure(.2),[x1,a1]=measure(.7),r=number(root,'hub0','r');assert.ok(Math.abs((x1-x0)-(a1-a0)*Math.PI/180*r)<1e-7);
  }finally{env.close();}
});
test('轨迹来自实际经过的位置，固定点身份不因换形重建，流点在窄处连续加速',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    let draw=render(w,root,'path-trail');draw(.55);const last=part(root,'trail').getAttribute('d').split(' ').at(-1).slice(1).split(',').map(Number);
    assert.deepEqual(last,[number(root,'body','cx'),number(root,'body','cy')]);
    draw=render(w,root,'point-morph');const nodes=[...root.querySelectorAll('circle')];draw(.1);draw(.7);assert.ok(nodes.every(node=>node.isConnected));assert.equal(root.querySelectorAll('circle').length,nodes.length);
    draw=render(w,root,'field-speed');const x=p=>{draw(p);return number(root,'p0','cx');};
    const wide=x(.101)-x(.1),narrow=x(.561)-x(.56);assert.ok(narrow>wide*2.4);
    let previous=x(.49),maxStep=0;for(let p=.491;p<.63;p+=.001){const next=x(p);maxStep=Math.max(maxStep,next-previous);assert.ok(next>previous);previous=next;}assert.ok(maxStep<1.1);
  }finally{env.close();}
});
