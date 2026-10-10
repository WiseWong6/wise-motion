// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {history,state} from '../scripts/history.mjs';
import {environment,data,frameMarkup} from './helpers.mjs';
const effect=data.effects.find(e=>e.id==='radial-branch-flow');
const arrivals=[2600,3700,4800],center=[320,170];
const part=(root,id)=>root.querySelector(`[data-part="${id}"]`);
const number=(node,key)=>Number(node.getAttribute(key));
const xy=node=>['cx','cy'].map(k=>number(node,k));
const path=node=>node.getAttribute('d').match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi).map(Number);
const distance=p=>Math.hypot(p[0]-center[0],p[1]-center[1]);

test('圆心固定、涟漪外扩；三个光团到达后才显卡，结束停稳且回拖可还原',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,effect);
    const nodes=[...root.querySelectorAll('*')];
    assert.equal(part(root,'root').localName,'circle');assert.deepEqual(xy(part(root,'root')),center);
    player.seek(0);const beginning=root.innerHTML;player.seek(150);assert.equal(root.innerHTML,beginning);
    player.seek(550);const ring=part(root,'ring0'),radius=number(ring,'r'),opacity=number(ring,'opacity');
    player.seek(750);assert.ok(number(ring,'r')>radius);assert.ok(number(ring,'opacity')<opacity);
    assert.deepEqual(xy(ring),center);
    for(let i=0;i<3;i++){
      const card=part(root,'card'+i),pulse=part(root,'pulse'+i),branch=part(root,'branch'+i);
      player.seek(150+arrivals[i]-1);assert.equal(number(card,'opacity'),0);assert.equal(number(pulse,'opacity'),1);
      player.seek(150+arrivals[i]);assert.equal(number(card,'opacity'),0);assert.equal(number(pulse,'opacity'),0);
      assert.equal(branch.getAttribute('stroke-dasharray'),'none');
      player.seek(150+arrivals[i]+275);assert.ok(number(card,'opacity')>0&&number(card,'opacity')<1);
      player.seek(150+arrivals[i]+550);assert.equal(number(card,'opacity'),1);
      const labels=[...card.querySelectorAll('text')];
      assert.deepEqual(labels.map(n=>number(n,'font-size')),[12,16,12]);
      assert.deepEqual(labels.map(n=>number(n,'font-weight')),[700,300,300]);
      for(const label of labels)assert.ok(label.textContent.length*number(label,'font-size')<126,'卡内文字保留左右余量');
    }
    player.seek(5550);const end=root.innerHTML;player.seek(6000);assert.equal(root.innerHTML,end);
    assert.equal(number(part(root,'ripples'),'opacity'),0);
    player.seek(2100);const middle=root.innerHTML;player.seek(300);player.seek(2100);assert.equal(root.innerHTML,middle);
    assert.deepEqual([...root.querySelectorAll('*')],nodes);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true});
    player.seek(2100);assert.equal(observer.takeRecords().length,0);observer.disconnect();player.destroy();
  }finally{env.close();}
});

test('枝干从圆周向外生长，光点与亮尾共用曲线且不超前，发射光团单向抵达',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,effect);
    for(const t of [700,850,1050,1250,1500,2000,2500,3200,4300]){
      player.seek(150+t);
      for(let i=0;i<3;i++){
        const curve=path(part(root,'branch'+i)),tip=xy(part(root,'tip'+i)),tail=path(part(root,'tail'+i)),head=xy(part(root,'head'+i));
        assert.ok(Math.abs(distance(curve.slice(0,2))-26)<1e-8,'枝干起点位于圆周');
        assert.deepEqual(curve.slice(-2),tip);assert.deepEqual(tail.slice(-2),head);
        assert.deepEqual(xy(part(root,'head-glow'+i)),head);
        assert.ok(distance(head)<=distance(tip)+1e-8,'光流不能走到尚未长出的枝干之外');
        for(let j=0;j<curve.length;j+=2){assert.ok(curve[j]>=0&&curve[j]<=640);assert.ok(curve[j+1]>=0&&curve[j+1]<=360);}
      }
    }
    for(let i=0;i<3;i++){
      let prior=26;
      for(let offset=0;offset<=900;offset+=90){
        player.seek(150+arrivals[i]-900+offset);
        const head=xy(part(root,'pulse-core'+i)),r=distance(head);
        assert.ok(r>=prior-1e-8,'发射过程中光团不能倒退');prior=r;
        assert.deepEqual(xy(part(root,'pulse-glow'+i)),head);
      }
      assert.deepEqual(xy(part(root,'pulse-core'+i)),xy(part(root,'arrival'+i)));
    }
    const other=w.document.createElement('div'),second=w.MotionRuntime.create(other,effect);
    const ids=[...root.querySelectorAll('[id]'),...other.querySelectorAll('[id]')].map(n=>n.id);
    assert.equal(new Set(ids).size,ids.length);second.destroy();player.destroy();
  }finally{env.close();}
});

test('两个历史入口合为正式组合，旧名称可搜索，缩略图与主画面一致且原工程只读',async()=>{
  const historical=await history(data),cross=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
  assert.equal(effect.category,'compositions');assert.equal(effect.kind,'composition');
  for(const id of ['tutorial-capsule-ripple','tutorial-branch-flow']){
    assert.ok(!historical.recipes.some(e=>e.history_id===id));assert.ok(historical.excluded.some(e=>e.id===id));
    assert.equal(cross.rules[id].migration.effect,effect.id);
    for(const file of cross.rules[id].migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256);
  }
  const env=await environment(true,{staticPreview:true,hash:'#radial-branch-flow'});
  try{
    const {w}=env,d=w.document;await env.reveal('[data-effect="radial-branch-flow"] .thumb');assert.equal(d.getElementById('preview-title').textContent,effect.name);
    for(const query of [effect.name,'胶囊向外扩散涟漪','枝干生长与光点流动'])assert.equal(w.MotionMatch.rank(data,query)[0].effect.id,effect.id);
    const thumb=d.querySelector('[data-effect="radial-branch-flow"] .thumb .motion-stage'),root=d.createElement('div');
    const player=w.MotionRuntime.create(root,effect);player.seek(effect.preview_ms);
    assert.equal(frameMarkup(thumb),frameMarkup(root.firstElementChild));player.destroy();
    assert.match(d.getElementById('code').textContent,/catalog\/effects\/radial-branch-flow\.js/);
    assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});

test('五个相关动作直接隔离原组合节点，光流与发射共用原枝干且不因定位恢复隐藏层',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,effect);
    const layers=w.MotionFactories[effect.id].breakdown;
    assert.deepEqual(Array.from(layers,l=>l.id),['origin','branches','flow','delivery','cards']);
    const svg=root.querySelector('svg'),nodes=[...svg.querySelectorAll('[data-layer]')],allNodes=[...svg.querySelectorAll('*')];
    for(const node of svg.querySelectorAll('path,circle,rect,text')){
      assert.ok(node.closest('[data-layer]'),'原画每个可见元素均属于一个真实动作');
      assert.ok(layers.some(layer=>layer.id===node.closest('[data-layer]').dataset.layer));
    }
    for(const layer of layers){
      assert.ok(layer.start>=0&&layer.end<=effect.duration_ms&&layer.start<layer.end);
      player.seek(3200);
      const original=frameMarkup(svg);
      for(const node of nodes)if(node.dataset.layer!==layer.id)node.setAttribute('display','none');
      for(const time of [900,5000,3200])player.seek(time);
      for(const node of nodes)assert.equal(node.getAttribute('display')==='none',node.dataset.layer!==layer.id);
      const copy=svg.cloneNode(true);copy.querySelectorAll('[data-layer]').forEach(node=>node.removeAttribute('display'));
      assert.equal(frameMarkup(copy),original,'拆解仅隔离可见层，不更换原图或更改曲线');
      nodes.forEach(node=>node.removeAttribute('display'));
    }
    assert.deepEqual([...svg.querySelectorAll('*')],allNodes);assert.equal(w.MotionRuntime.instanceCount,1);player.destroy();
  }finally{env.close();}
});
