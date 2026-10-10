// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {data,environment} from './helpers.mjs';
const sources=Object.fromEntries(await Promise.all(['radial-branch-flow','letter-settle'].map(async id=>[id,await readFile(new URL('../catalog/effects/'+id+'.js',import.meta.url),'utf8')])));
const normalize=markup=>markup.replaceAll(/motion-(?:radial-branch|letter-settle)-\d+/g,'fixed');
const kernel={textSize:key=>key==='body'?16:12};
function setup(instrument=false){
  const dom=new JSDOM('<div id="root"></div>',{runScripts:'outside-only'}),w=dom.window;
  w.MotionFactories={};w.drawCounts={pose:0,trail:0,flight:0};
  for(let source of Object.values(sources)){
    if(instrument)source=source.replace('function pose(p,age){','function pose(p,age){globalThis.drawCounts.pose++;').replace('function trail(p,age){','function trail(p,age){globalThis.drawCounts.trail++;').replace('function drawFlight(e,t){','function drawFlight(e,t){globalThis.drawCounts.flight++;');
    w.eval(source);
  }
  return {w,close:()=>w.close()};
}
// 重构前直接从组合源码取出的节点状态摘要；不依赖独立动作的实现生成预期。
const baseline={
  "radial-branch-flow": {
    "0": "39f9cfae2cef79395a55470ec08337c8dab23d9a8b8aafcddc367f02305941f3",
    "150": "39f9cfae2cef79395a55470ec08337c8dab23d9a8b8aafcddc367f02305941f3",
    "900": "00c1a5e235bfc2bbb418cecd48a09602660df1a78118581a3b637e051c6984b2",
    "1850": "1ec7ded10be27fe837d067ff2c3e2cfd6a1bd810da6d4895aefba0c7ba6e4103",
    "2750": "9044536f02f2cfde0c305b16c96133587836bbf6ce12593851bd8c87f7713eb4",
    "4000": "196dcdce643e3c12f0b7156e3f8dfe80c7540c963053c7b2214533139fcb57a5",
    "6500": "25493dd22c0e690cb663cff9fb6676a7f1e2d06a8e4bce7ef8afbd55390ba3f8",
    "9500": "25493dd22c0e690cb663cff9fb6676a7f1e2d06a8e4bce7ef8afbd55390ba3f8",
    "12000": "25493dd22c0e690cb663cff9fb6676a7f1e2d06a8e4bce7ef8afbd55390ba3f8"
  },
  "letter-settle": {
    "0": "b449c39366c95db3d861603ca8e343474f7c6b885b9e0a7504b073f6ebd9b64b",
    "150": "b449c39366c95db3d861603ca8e343474f7c6b885b9e0a7504b073f6ebd9b64b",
    "900": "113c73cffcc41a5716e413b8a5d43cbf99c5dca8a624087234af35b0786a8ffc",
    "1850": "3ceb21fd98ed9634e183a155e57b07e28efe068debb451d448a05cf77fa861cb",
    "2750": "62f7dfa20df4fa06f53fd5c151ccc9efda51be33f8299663dc6275d0c2c915bf",
    "4000": "b62c54e04cd7f8184533d150056ff9ebc96e4c93386665e821c4212f69400170",
    "6500": "ad251eb11bda96a00d00e4798fca87cb5bd0568b357bb38c4d4bc13c5cc887a6",
    "9500": "9e9f9881974ed71b0b3cdda283fb961ca35c54d7ddf1ab49bd042e60f32e3fd7",
    "12000": "913c6839a05438f52f5dd9f37042144928b12574c0b1e2d685d1f2d478d21db8"
  }
};
const definitions=[
  ['radial-branch-flow','origin','center-ripple-emit',0,6000],
  ['letter-settle',['flight','trails'],'symbol-flight-settle',0,10569],
  ['letter-settle','stars','arrival-star-reveal',5028,6972],
  ['letter-settle','sparkles','arrival-star-sparkle',5028,6972]
];
const layerState=(root,layer)=>[...root.querySelectorAll(`[data-layer="${layer}"]`)].map(node=>({
  markup:normalize(node.outerHTML),
  position:node.closest('[data-settled]')?.getAttribute('transform')??null,
  particle:node.closest('[data-particle]')?.dataset.particle??null
}));

test('两个组合在抽取前后的完整节点状态一致，固定轨迹、颜色和时序不变',()=>{
  const env=setup();
  try{
    const root=env.w.document.querySelector('#root');
    for(const id of ['endpoint-card-reveal','radial-branch-grow','branch-comet-flow','branch-pulse-arrive'])assert.equal(env.w.MotionFactories[id],undefined,'已剔除的动作不再注册：'+id);
    for(const id of ['branches','flow','delivery','cards']){
      const layer=env.w.MotionFactories['radial-branch-flow'].breakdown.find(layer=>layer.id===id);
      assert.deepEqual(Array.from(layer.actions),[],'组合不再关联已剔除的动作');
      assert.ok(layer.reason,'组合保留图层需要明确依据：'+id);
    }
    for(const [id,frames]of Object.entries(baseline)){
      const draw=env.w.MotionFactories[id](root,kernel);
      for(const [ms,expected]of Object.entries(frames)){
        draw(Number(ms));
        assert.equal(createHash('sha256').update(normalize(root.innerHTML)).digest('hex'),expected,`${id} 在 ${ms} 毫秒发生改变`);
      }
    }
  }finally{env.close();}
});

test('四个独立动作只创建对应真实层，前移等待后逐节点等同于原组合',()=>{
  const env=setup();
  try{
    const {w}=env;
    for(const [composition,layer,action,offset,duration] of definitions){
      const full=w.document.createElement('div'),part=w.document.createElement('div');
      const fullDraw=w.MotionFactories[composition](full,kernel),partDraw=w.MotionFactories[action](part,kernel);
      const layers=Array.isArray(layer)?layer:[layer];
      for(const id of layers){
        const breakdown=w.MotionFactories[composition].breakdown.find(item=>item.id===id);
        assert.deepEqual(Array.from(breakdown.actions),[action]);
      }
      assert.deepEqual([...new Set([...part.querySelectorAll('[data-layer]')].map(node=>node.dataset.layer))].sort(),[...layers].sort());
      assert.equal(part.querySelectorAll('[display="none"],[visibility="hidden"]')[0],undefined,'不能隐藏整套组合充当独立动作');
      for(const ms of [0,150,600,duration*.4,duration*.8,duration]){
        partDraw(ms);fullDraw(ms+offset);
        for(const id of layers)assert.deepEqual(layerState(part,id),layerState(full,id),`${action}/${id} 与原组合相应时刻不一致`);
      }
      const nodes=[...part.querySelectorAll('*')];
      partDraw(duration*.6);const middle=part.innerHTML;
      partDraw(0);partDraw(duration*.6);assert.equal(part.innerHTML,middle);
      assert.deepEqual([...part.querySelectorAll('*')],nodes,'定位不能重建节点');
      const observer=new w.MutationObserver(()=>{});observer.observe(part,{subtree:true,attributes:true,childList:true});
      partDraw(duration*.6);assert.equal(observer.takeRecords().length,0,'重复定位不写入相同属性');observer.disconnect();
      assert.ok(part.querySelectorAll('*').length<full.querySelectorAll('*').length);
    }
  }finally{env.close();}
});

test('独立星光不计算飞行，合并群飞保留原十八条光丝及完整物品',()=>{
  const env=setup(true);
  try{
    const {w}=env,root=w.document.querySelector('#root');
    for(const action of ['arrival-star-reveal','arrival-star-sparkle']){
      const draw=w.MotionFactories[action](root);w.drawCounts={pose:0,trail:0,flight:0};draw(1600);
      assert.equal(w.drawCounts.pose,0);assert.equal(w.drawCounts.trail,0);assert.equal(w.drawCounts.flight,0);
      assert.equal(root.querySelectorAll('[data-symbol],[data-trail]').length,0);
      assert.equal(root.querySelectorAll(action==='arrival-star-reveal'?'[data-star]':'[data-glint]').length,126);
      assert.equal(root.querySelectorAll(action==='arrival-star-reveal'?'[data-halo],[data-glint]':'[data-star]').length,0);
    }
    assert.equal(w.MotionFactories['flight-history-trails'],undefined,'光丝独立入口已并入群飞');
    const flight=w.MotionFactories['symbol-flight-settle'](root);w.drawCounts={pose:0,trail:0,flight:0};flight(4000);
    assert.equal(root.querySelectorAll('[data-symbol]').length,126);
    assert.equal(root.querySelectorAll('[data-trail]').length,18);
    assert.equal(root.querySelectorAll('[data-trail] path').length,432);
    assert.equal(root.querySelectorAll('[data-settled],[data-star],[data-halo],[data-glint]').length,0);
    assert.equal(w.drawCounts.flight,126);assert.equal(w.drawCounts.pose,126+18*26);assert.equal(w.drawCounts.trail,18);
    flight(10569);
    assert.ok([...root.querySelectorAll('[data-symbol],[data-trail] path')].every(node=>Number(node.getAttribute('opacity'))===0),'物品与光丝均消退后才结束');
  }finally{env.close();}
});


test('群飞与光丝共用一个目录入口，两种旧名称及旧光丝书签均能找到合并动作',async()=>{
  const env=await environment(true,{hash:'#flight-history-trails',staticPreview:true});
  try{
    const effect=data.effects.find(e=>e.id==='symbol-flight-settle');
    assert.ok(!data.effects.some(e=>e.id==='flight-history-trails'));
    assert.equal(data.redirects['flight-history-trails'],effect.id);
    for(const name of ['物品群飞减速落定','群飞轨迹光丝渐退','群飞落定','轨迹渐退'])assert.equal(env.w.MotionMatch.rank(data,name)[0]?.effect.id,effect.id,name);
    assert.equal(env.w.document.querySelector('.effect-item[aria-current="true"]').dataset.effect,effect.id);
    const prompt=env.w.MotionExport.prompt(effect,{speed:1},data);
    assert.match(prompt,/126 件/);assert.match(prompt,/18 (?:件|条)/);assert.match(prompt,/10\.57 秒/);
  }finally{env.close();}
});
