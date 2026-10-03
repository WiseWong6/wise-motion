// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {data,environment,frameMarkup,sourceDefinition} from './helpers.mjs';

const get=id=>data.effects.find(effect=>effect.id===id);
const mappings={
  'subtitle-focus':{cells:['stagger-in','subtitle-cell-focus','subtitle-block-shift'],statement:[]},
  'title-content':{title:[],content:['stagger-in']},
  'interface-feedback':{pointer:[],button:['button-press-status'],progress:['progress-fill-exit'],result:['fade-rise']}
};
const extracted={
  'subtitle-cell-focus':{parent:'subtitle-focus',selector:'.subtitle-cell',count:5,times:[1800,2449,2450,3100,4899,4900,7599,7600,9000],properties:['opacity'],className:true},
  'subtitle-block-shift':{parent:'subtitle-focus',selector:'.subtitle-block',count:5,times:[4100,4650,5200,6500,7600,8300,9000],properties:['transform','opacity']},
  'button-press-status':{parent:'interface-feedback',selector:'.action-button',count:2,times:[1600,1875,2149,2150,4000,5299,5300]},
  'progress-fill-exit':{parent:'interface-feedback',selector:'.progress-track',count:3,times:[2150,2325,2500,3725,5300,5600,5900]}
};
function cleanMarkup(node){
  const root=node.ownerDocument.createElement('div'),copy=node.cloneNode(true);
  root.append(copy);
  for(const element of root.querySelectorAll('[data-layer]'))element.removeAttribute('data-layer');
  return frameMarkup(root);
}
function raw(env,id){
  const root=env.w.document.createElement('div');
  const render=env.w.MotionFactories[id](root,env.w.MotionKit);
  const source=sourceDefinition(get(id));
  return {root,draw:(t,ease=source.default_ease)=>render(t,{ease,duration:source.duration_ms,elapsed:t})};
}

test('三个旧组合的动作关联与登记一致，独立条目剔除后仍保留组合文字与指针层',async()=>{
  const env=await environment();
  try{
    for(const [id,expected] of Object.entries(mappings)){
      const definition=get(id),rows=env.w.MotionFactories[id].breakdown;
      assert.equal(definition.kind,'composition');
      assert.deepEqual(Object.fromEntries(rows.map(row=>[row.id,Array.from(row.actions)])),expected,id);
      for(const layer of rows)assert.ok(layer.actions.length>0||layer.reason,`${id}/${layer.id} 未关联独立动作的图层必须说明保留依据`);
      const linked=[...new Set(rows.flatMap(row=>Array.from(row.actions)))];
      assert.deepEqual([...definition.actions].sort(),linked.sort(),id);
      for(const action of linked){assert.equal(get(action).kind,'action',action);assert.equal(typeof env.w.MotionFactories[action],'function');}
    }
    assert.deepEqual(Array.from(env.w.MotionFactories['subtitle-focus'].breakdown[0].actions),['stagger-in','subtitle-cell-focus','subtitle-block-shift'],'同一字幕层的出现、提亮、整体让位仍是三个动作');
    assert.ok(!data.effects.some(effect=>effect.id==='statement-rise-exit'),'已剔除的陈述不能重新进入目录');
    assert.equal(env.w.MotionFactories['statement-rise-exit'],undefined,'已剔除的陈述不再注册独立动作');
    for(const effect of data.effects)assert.ok(!effect.actions.includes('statement-rise-exit'),'组合不再链接已剔除的动作');
    for(const id of ['dual-scroll'])assert.equal(env.w.MotionFactories[id].breakdown,undefined,'连续同机制对象已归为普通动作');
  }finally{env.close();}
});

test('四个独立示例只创建自己的对象，不调用完整组合或隐藏其余层',async()=>{
  const env=await environment();
  try{
    for(const parent of Object.keys(mappings))env.w.MotionFactories[parent]=()=>{throw new Error('独立动作不能创建完整组合：'+parent);};
    for(const [id,expected] of Object.entries(extracted)){
      const scene=raw(env,id);
      assert.equal(scene.root.querySelectorAll('*').length,expected.count,id);
      assert.equal(scene.root.querySelectorAll('[data-layer],[hidden],[display="none"]').length,0,id);
      const nodes=[...scene.root.querySelectorAll('*')];
      assert.ok(nodes.every(node=>node.style.visibility!=='hidden'&&node.style.display!=='none'));
      for(const time of [0,...expected.times,0]){
        scene.draw(time);
        assert.equal(scene.root.querySelectorAll('*').length,nodes.length,id);
        assert.ok(nodes.every(node=>scene.root.contains(node)),id+'定位时间不重建对象');
      }
      if(id==='subtitle-cell-focus')assert.equal(scene.root.querySelector('.subtitle-block').style.transform,'','提亮动作不混入整组移动');
      if(id==='subtitle-block-shift')assert.equal(scene.root.querySelectorAll('.is-on').length,0,'整体让位不混入重点轮换');
    }
    assert.equal(env.w.MotionRuntime.instanceCount,0,'动作工厂不会创建额外播放器');
  }finally{env.close();}
});

test('抽取后的每项动作与原组合的对应对象逐时刻同源，反向定位也一致',async()=>{
  const env=await environment();
  try{
    for(const [id,expected] of Object.entries(extracted)){
      const solo=raw(env,id),combined=raw(env,expected.parent);
      for(const ease of ['linear','outCubic','inOutSine'])for(const time of [...expected.times,...expected.times.toReversed()]){
        solo.draw(time,ease);combined.draw(time,ease);
        const own=[...solo.root.querySelectorAll(expected.selector)],original=[...combined.root.querySelectorAll(expected.selector)];
        assert.equal(own.length,original.length,id);
        own.forEach((node,index)=>{
          if(expected.properties){
            for(const property of expected.properties)assert.equal(node.style[property],original[index].style[property],`${id}/${time}/${property}`);
            if(expected.className)assert.equal(node.className,original[index].className);
          }else assert.equal(cleanMarkup(node),cleanMarkup(original[index]),`${id}/${time}`);
        });
      }
    }
  }finally{env.close();}
});

test('已有动作和旧组合实际调用同一绘制函数，复用不是名称关联',async()=>{
  const env=await environment();
  try{
    const F=env.w.MotionFactories;
    for(const [action,method,parents] of [
      ['stagger-in','draw',['subtitle-focus','title-content']],
      ['fade-rise','draw',['interface-feedback']]
    ]){
      const original=F[action][method];let calls=0;
      F[action][method]=(...args)=>{calls++;return original(...args);};
      try{
        for(const id of [action,...parents]){
          calls=0;const scene=raw(env,id);scene.draw(3500);assert.ok(calls>0,`${id}必须调用${action}的共用绘制函数`);
        }
      }finally{F[action][method]=original;}
    }
  }finally{env.close();}
});

test('重点切换、按钮换字和进度收起保留各自的边界条件',async()=>{
  const env=await environment();
  try{
    const focus=raw(env,'subtitle-cell-focus'),cells=[...focus.root.querySelectorAll('.subtitle-cell')];
    for(const [time,index] of [[1700,-1],[1800,0],[2450,1],[3100,2],[3750,3],[4900,-1],[7600,3]]){
      focus.draw(time);assert.equal(cells.findIndex(node=>node.classList.contains('is-on')),index);
      cells.forEach((node,i)=>assert.equal(Number(node.style.opacity),index<0||index===i?1:.45));
    }
    const button=raw(env,'button-press-status'),node=button.root.querySelector('.action-button');
    button.draw(1875);assert.match(node.style.transform,/scale\(0\.955\)/);
    for(const [time,text] of [[2149,'开始整理'],[2150,'正在整理'],[5299,'正在整理'],[5300,'整理完成'],[1600,'开始整理']]){button.draw(time);assert.equal(node.textContent,text);}
    const progress=raw(env,'progress-fill-exit'),track=progress.root.querySelector('.progress-track'),fill=progress.root.querySelector('.progress-fill');
    progress.draw(3725);assert.equal(fill.style.transform,'scaleX(0.5)');assert.equal(track.style.opacity,'1');
    progress.draw(5300);assert.equal(fill.style.transform,'scaleX(1)');assert.equal(track.style.opacity,'1');
    progress.draw(5900);assert.equal(fill.style.transform,'scaleX(1)');assert.equal(track.style.opacity,'0');
  }finally{env.close();}
});

test('已删除的主体经过环境组合与四项动作不再登记、创建或关联',async()=>{
  const removed=new Set(['environment-chain','ripple','sine-route-travel','sine-offset-follow','proximity-grass-bend']);
  const env=await environment();
  try{
    for(const registry of [data,env.w.MotionRegistry]){
      for(const effect of registry.effects){
        assert.ok(!removed.has(effect.id),effect.id+'不应继续登记');
        for(const action of effect.actions)assert.ok(!removed.has(action),effect.id+'不应关联已删除动作');
      }
    }
    for(const id of removed)assert.equal(env.w.MotionFactories[id],undefined,id+'不应保留工厂');
    for(const [id,factory] of Object.entries(env.w.MotionFactories)){
      for(const layer of factory.breakdown||[]){
        for(const action of layer.actions)assert.ok(!removed.has(action),id+'的拆解不应关联已删除动作');
      }
    }
  }finally{env.close();}
});

test('新独立动作可按各自时段暂停、定位和销毁，不增加运行实例',async()=>{
  const env=await environment();
  try{
    const root=env.w.document.getElementById('root');
    for(const id of Object.keys(extracted)){
      const effect=get(id),player=env.w.MotionRuntime.create(root,effect);
      player.seek(effect.preview_ms);const before=frameMarkup(root);
      player.seek(effect.duration_ms);player.seek(0);player.seek(effect.preview_ms);
      assert.equal(frameMarkup(root),before,id);
      assert.equal(env.w.MotionRuntime.instanceCount,1);assert.equal(env.w.MotionRuntime.runningCount,0);
      player.destroy();assert.equal(env.w.MotionRuntime.instanceCount,0);
    }
  }finally{env.close();}
});
