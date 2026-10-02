// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {environment,data,frameMarkup} from './helpers.mjs';
import {history,state} from '../scripts/history.mjs';
const effect=data.effects.find(e=>e.id==='door-halftone-illustration');
const cross=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
const migration=cross.rules['naive-halftone-reveal'].migration;
const source=await readFile(migration.files[0].file,'utf8');
const theme=await readFile(migration.files[1].file,'utf8');
const n=(node,key)=>Number(node.getAttribute(key));
function bezier(x,curve){
  x=Math.max(0,Math.min(1,x));if(x===0||x===1)return x;
  const value=(t,a,b)=>3*(1-t)**2*t*a+3*(1-t)*t*t*b+t**3;
  let lo=0,hi=1;
  for(let i=0;i<50;i++){const mid=(lo+hi)/2;if(value(mid,curve[0],curve[2])<x)lo=mid;else hi=mid;}
  return value((lo+hi)/2,curve[1],curve[3]);
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<.001,`${a} 与 ${b} 不一致`);

test('门形轮廓、点距、缩放与两条显现曲线保持原作，回拖和结束状态稳定',async()=>{
  const curve=name=>theme.match(new RegExp('const '+name+' = Easing.bezier\\(([^)]+)\\)'))[1].split(',').map(Number);
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,effect);
    const path=root.querySelector('[data-door]'),mark=root.querySelector('[data-mark]'),rect=root.querySelector('[data-reveal]');
    const pattern=root.querySelector('pattern'),dot=pattern.querySelector('circle');
    assert.equal(path.getAttribute('d'),source.match(/const DOOR_PATH = '([^']+)'/)[1]);
    assert.equal(path.getAttribute('transform'),'scale(4.6) translate(-8 -6)');
    for(const [node,attrs]of [[pattern,{width:1.5,height:1.5}],[dot,{cx:.75,cy:.75,r:.38}],[rect,{x:0,y:0,width:240}]])for(const [key,value]of Object.entries(attrs))assert.equal(n(node,key),value);
    const nodes=[...root.querySelectorAll('*')];
    player.seek(0);const start=root.innerHTML;assert.equal(n(mark,'opacity'),0);assert.equal(n(rect,'height'),0);
    player.seek(150);assert.equal(root.innerHTML,start);
    let last=-1;
    for(const elapsed of [0,50,100,200,300,400,500,650,800,1000]){
      player.seek(150+elapsed);
      near(n(rect,'height'),246*bezier(elapsed/1000,curve('inOut')));
      near(n(mark,'opacity'),bezier(elapsed/400,curve('outExpo')));
      assert.ok(n(rect,'height')>=last);last=n(rect,'height');
    }
    assert.equal(n(rect,'height'),246);assert.equal(n(mark,'opacity'),1);
    const end=root.innerHTML;player.seek(1600);assert.equal(root.innerHTML,end);
    player.seek(675);const middle=root.innerHTML;player.seek(0);player.seek(675);assert.equal(root.innerHTML,middle);
    assert.deepEqual([...root.querySelectorAll('*')],nodes);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true});
    player.seek(675);assert.equal(observer.takeRecords().length,0);observer.disconnect();player.destroy();
  }finally{env.close();}
});

test('插画分类、旧名搜索和缩略图完整，遮罩及点阵不串用，原工程只读',async()=>{
  assert.equal(effect.category,'illustration-object');
  const h=await history(data);assert.ok(!h.recipes.some(e=>e.history_id==='naive-halftone-reveal'));
  assert.ok(h.excluded.some(e=>e.id==='naive-halftone-reveal'));
  for(const file of migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256);
  const env=await environment(true,{hash:'#door-halftone-illustration'});
  try{
    const {w}=env,d=w.document;env.reveal();assert.equal(d.getElementById('preview-title').textContent,effect.name);
    for(const query of [effect.name,...effect.previous_names])assert.equal(w.MotionMatch.rank(data,query)[0].effect.id,effect.id);
    const thumb=d.querySelector('[data-effect="door-halftone-illustration"] .thumb .motion-stage'),root=d.createElement('div');
    const player=w.MotionRuntime.create(root,effect);player.seek(effect.preview_ms);assert.equal(frameMarkup(thumb),frameMarkup(root.firstElementChild));
    const ids=[...d.querySelectorAll('#preview [id]'),...root.querySelectorAll('[id]'),...thumb.querySelectorAll('[id]')].map(n=>n.id);
    assert.equal(new Set(ids).size,ids.length);assert.equal(ids.length,6);player.destroy();
    assert.match(d.getElementById('code').textContent,/catalog\/effects\/door-halftone\.js/);
    assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
