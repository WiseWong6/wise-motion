// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {environment,data,frameMarkup} from './helpers.mjs';
import {history,state} from '../scripts/history.mjs';
const effect=data.effects.find(e=>e.id==='letter-settle');
const cross=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
const migration=cross.rules['letter-settle'].migration;
const original=await readFile(migration.files[0].file,'utf8');
const adapted=await readFile(new URL('../catalog/effects/letter-settle.js',import.meta.url),'utf8');
const n=(node,key)=>Number(node.getAttribute(key));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} 与 ${b} 不一致`);
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};

test('126 件物品的轨迹、减速与化星曲线对照原作，落点来自原银河数据',async()=>{
  const reference=vm.createContext({clamp,smooth});
  for(const [a,b]of [['function flightPoint(','function position('],['function poseAt(','function flashPulse('],['function starAmount(','// 参考花落成蝶']]){
    vm.runInContext(original.slice(original.indexOf(a),original.indexOf(b)),reference);
  }
  vm.runInContext(await readFile(migration.files[1].file,'utf8')+';globalThis.targets=GALAXY_STARS;',reference);
  const env=await environment();
  try{
    const {w}=env;
    w.eval(adapted.replace('let serial=0;','globalThis.settleMath={particles,pose,landing,trail};let serial=0;'));
    const math=w.settleMath;
    assert.equal(math.particles.length,126);assert.equal(new Set(math.particles.map(p=>p.kind)).size,10);
    assert.equal(math.particles.filter(p=>p.hasTrail).length,18);assert.equal(math.particles.filter(p=>p.settle.anchor).length,6);
    for(const p of math.particles){
      assert.ok(reference.targets.some(t=>Math.abs(t[0]*660-p.endX)<1e-9&&Math.abs(t[1]*880-p.endY)<1e-9));
      for(const age of [-1,0,.8,2,4,p.duration,p.duration+.3,p.duration+.7,p.duration+1.5]){
        const a=math.pose(p,age),b=reference.poseAt(p,age);
        for(const key of ['x','y','scale'])near(a[key],b[key]);
        near(math.landing(p,age-p.duration),reference.landingFlash(p,p.start+age));
        const tail=math.trail(p,age);
        near(tail.points[0][0],40+reference.poseAt(p,Math.min(Math.max(0,age),p.duration)).x*560/660);
        for(const q of tail.points){assert.ok(q[0]>=20&&q[0]<=620);assert.ok(q[1]>=20&&q[1]<=340);}
      }
    }
  }finally{env.close();}
});

test('完整群飞和一一对应落点可任意回拖，结尾全部成星，节点不反复重建',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,effect);
    const groups=[...root.querySelectorAll('[data-particle]')],symbols=[...root.querySelectorAll('[data-symbol]')],stars=[...root.querySelectorAll('[data-star]')],nodes=[...root.querySelectorAll('*')];
    assert.equal(groups.length,126);assert.equal(stars.length,126);assert.equal(new Set(groups.map(g=>g.querySelector('[data-settled]').getAttribute('transform'))).size,126);
    player.seek(0);const start=root.innerHTML;assert.ok(symbols.every(p=>n(p,'opacity')===0));
    player.seek(150);assert.equal(root.innerHTML,start);
    player.seek(4000);assert.equal(symbols.filter(p=>n(p,'opacity')>.1).length,126);assert.ok(stars.every(p=>n(p,'opacity')===0));
    player.seek(6500);assert.ok(symbols.some(p=>n(p,'opacity')>0)&&stars.some(p=>n(p,'opacity')>0));
    const middle=root.innerHTML;player.seek(900);player.seek(6500);assert.equal(root.innerHTML,middle);
    for(const g of groups.filter((_,i)=>i%13===0)){
      const arrival=n(g,'data-arrival');player.seek(150+arrival*1000);
      const luminosity=n(g.querySelector('[data-symbol]'),'opacity');
      for(const offset of [-.1,0,.2,.5,.95]){
        player.seek(150+(arrival+offset)*1000);
        near(n(g.querySelector('[data-symbol]'),'opacity'),luminosity*(1-smooth(offset/.95)));
      }
    }
    player.seek(11550);const end=root.innerHTML;player.seek(12000);assert.equal(root.innerHTML,end);
    assert.ok(symbols.every(p=>n(p,'opacity')===0));assert.ok(stars.every(p=>n(p,'opacity')>0));
    assert.ok([...root.querySelectorAll('[data-trail] path')].every(p=>n(p,'opacity')===0));
    assert.deepEqual([...root.querySelectorAll('*')],nodes);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true});
    player.seek(12000);assert.equal(observer.takeRecords().length,0);observer.disconnect();player.destroy();
  }finally{env.close();}
});

test('组合入口、旧名搜索与缩略图一致，原单物品入口合并，原工程保持只读',async()=>{
  const historical=await history(data);assert.equal(effect.kind,'composition');
  assert.ok(!historical.recipes.some(e=>e.history_id==='letter-settle'));
  assert.ok(historical.excluded.some(e=>e.id==='letter-settle'));
  for(const file of migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256);
  const env=await environment(true,{staticPreview:true,hash:'#letter-settle'});
  try{
    const {w}=env,d=w.document;env.reveal();assert.equal(d.getElementById('preview-title').textContent,effect.name);
    for(const query of [effect.name,...effect.previous_names])assert.equal(w.MotionMatch.rank(data,query)[0].effect.id,effect.id);
    const thumb=d.querySelector('[data-effect="letter-settle"] .thumb .motion-stage'),root=d.createElement('div');
    const player=w.MotionRuntime.create(root,effect);player.seek(effect.preview_ms);assert.equal(frameMarkup(thumb),frameMarkup(root.firstElementChild));
    const ids=[...d.querySelectorAll('#preview [id]'),...root.querySelectorAll('[id]'),...thumb.querySelectorAll('[id]')].map(n=>n.id);
    assert.equal(new Set(ids).size,ids.length);player.destroy();
    assert.match(d.getElementById('code').textContent,/catalog\/effects\/letter-settle\.js/);
    assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});

test('群飞、光丝、原位星点与星芒按真实节点分层，拆解不重建或重新撒点',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,effect);
    const layers=w.MotionFactories[effect.id].breakdown;
    assert.deepEqual(Array.from(layers,l=>l.id),['flight','trails','stars','sparkles']);
    const svg=root.querySelector('svg'),nodes=[...svg.querySelectorAll('[data-layer]')],allNodes=[...svg.querySelectorAll('*')];
    assert.equal(svg.querySelectorAll('[data-layer="flight"]').length,126);
    assert.equal(svg.querySelectorAll('[data-layer="stars"]').length,126);
    assert.equal(svg.querySelectorAll('[data-layer="sparkles"]').length,252);
    assert.equal(svg.querySelectorAll('[data-layer="trails"] [data-trail]').length,18);
    for(const node of svg.querySelectorAll('path,circle,ellipse'))assert.ok(node.closest('[data-layer]'));
    const arrivals=[...svg.querySelectorAll('[data-particle]')].map(node=>n(node,'data-arrival'));
    near(layers.find(l=>l.id==='stars').start,Math.min(...arrivals)*1000+150);
    near(layers.find(l=>l.id==='stars').end,Math.max(...arrivals)*1000+1100);
    for(const layer of layers){
      assert.ok(layer.start>=0&&layer.end<=effect.duration_ms&&layer.start<layer.end);
      player.seek(6500);const original=frameMarkup(svg);
      for(const node of nodes)if(node.dataset.layer!==layer.id)node.setAttribute('display','none');
      for(const time of [4000,10000,6500])player.seek(time);
      for(const node of nodes)assert.equal(node.getAttribute('display')==='none',node.dataset.layer!==layer.id);
      const copy=svg.cloneNode(true);copy.querySelectorAll('[data-layer]').forEach(node=>node.removeAttribute('display'));
      assert.equal(frameMarkup(copy),original,'不同图层仍使用同一批原物品、时钟和落点');
      nodes.forEach(node=>node.removeAttribute('display'));
    }
    assert.deepEqual([...svg.querySelectorAll('*')],allNodes);assert.equal(w.MotionRuntime.instanceCount,1);player.destroy();
  }finally{env.close();}
});
