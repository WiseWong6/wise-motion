// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {data,environment,frameMarkup,motionTime,sourceDefinition} from './helpers.mjs';

const get=id=>data.effects.find(effect=>effect.id===id);
const geometry=root=>{const clone=root.cloneNode(true);for(const node of clone.querySelectorAll('[style]'))node.style.cssText=node.style.cssText;return frameMarkup(clone).replace(/ style=""/g,'');};
const groups={
  'dual-scroll':['upper','lower'],
  'subtitle-focus':['cells','statement'],
  'arc-cards':['card-0','card-1','card-2','card-3','card-4'],
  'title-content':['title','content'],
  'interface-feedback':['pointer','button','progress','result'],
  'environment-chain':['traveler','follower','plants','water'],
  'dual-scroll-settle':['upper','lower']
};

test('七个旧组合均标注真实画面对象，拆解没有另造近似演示或新增计时器',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    for(const [id,ids] of Object.entries(groups)){
      const effect=get(id),player=w.MotionRuntime.create(root,effect),layers=w.MotionFactories[id].breakdown;
      assert.deepEqual(Array.from(layers,layer=>layer.id),ids,id);
      assert.deepEqual([...new Set([...root.querySelectorAll('[data-layer]')].map(node=>node.dataset.layer))].sort(),[...ids].sort(),id);
      for(const layer of layers){
        assert.ok(layer.name&&layer.detail&&layer.time,id);
        assert.ok(layer.start>=0&&layer.end>layer.start&&layer.end<=effect.duration_ms,`${id}/${layer.id}`);
        const nodes=[...root.querySelectorAll(`[data-layer="${layer.id}"]`)];
        assert.ok(nodes.length,`${id}/${layer.id}`);
        assert.ok(nodes.every(node=>!node.parentElement.closest('[data-layer]')),'旧组合图层不互相嵌套，避免父层隐藏连带屏蔽子层');
      }
      const count=root.querySelectorAll('*').length;
      for(const p of [0,.2,.5,.8,1,0]){
        player.seek(effect.duration_ms*p);assert.equal(root.querySelectorAll('*').length,count,'拖动时间仅更新原节点');
        assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
      }
      player.destroy();assert.equal(w.MotionRuntime.instanceCount,0);
    }
  }finally{env.close();}
});

test('旧组合分层时保留全部原动画状态，重新定位不会冲掉隐藏标记',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    for(const [id,ids] of Object.entries(groups)){
      const effect=get(id),player=w.MotionRuntime.create(root,effect);
      for(const p of [.2,.5,.9]){
        const time=effect.duration_ms*p;player.seek(time);const original=geometry(root);
        for(const layer of ids){
          const hidden=[...root.querySelectorAll('[data-layer]')].filter(node=>node.dataset.layer!==layer);
          for(const node of hidden){node.setAttribute('display','none');node.style.setProperty('visibility','hidden','important');}
          player.seek(effect.duration_ms);player.seek(time);
          for(const node of hidden){
            assert.equal(node.getAttribute('display'),'none',id);
            assert.equal(node.style.visibility,'hidden',id);
            assert.equal(node.style.getPropertyPriority('visibility'),'important');
            node.removeAttribute('display');node.style.removeProperty('visibility');
          }
          assert.equal(geometry(root),original,`${id}/${layer}:隔离只改变可见层，不改绘制`);
        }
      }
      player.destroy();
    }
  }finally{env.close();}
});

test('拆解区间沿目录时钟显示，原时序中的进度、让位与草叶响应保持不变',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    const ranges={
      'subtitle-focus':[['cells',200,9000],['statement',4900,7600]],
      'title-content':[['title',200,1800],['content',2000,4000]],
      'interface-feedback':[['pointer',300,2700],['button',1600,5300],['progress',2150,5900],['result',5300,6100]],
      'environment-chain':[['traveler',0,9300],['follower',0,9300],['plants',154/760*9300,440/760*9300],['water',6900,8860]],
      'dual-scroll-settle':[['upper',0,1300],['lower',0,1300]]
    };
    for(const [id,rows] of Object.entries(ranges))for(const [layerId,start,end] of rows){
      const layer=w.MotionFactories[id].breakdown.find(layer=>layer.id===layerId);
      assert.equal(layer.start,Math.round(motionTime(get(id),start)));
      assert.equal(layer.end,Math.round(motionTime(get(id),end)));
    }
    const controls=w.MotionRuntime.create(root,sourceDefinition(get('interface-feedback')));
    controls.seek(1600);assert.equal(root.querySelector('.action-button').textContent,'开始整理');
    controls.seek(3725);assert.equal(root.querySelector('.progress-fill').style.transform,'scaleX(0.5)');assert.equal(root.querySelector('.action-button').textContent,'正在整理');
    controls.seek(6100);assert.equal(root.querySelector('.action-button').textContent,'整理完成');assert.equal(root.querySelector('.result').style.opacity,'1');
    controls.destroy();
    const field=w.MotionRuntime.create(root,sourceDefinition(get('environment-chain')));
    const first=root.querySelector('.chain-plant');
    field.seek(216/760*9300);assert.match(first.style.transform,/rotate\(32deg\)/,'主体经过第一根草叶时响应最强');
    field.seek(0);assert.match(first.style.transform,/rotate\(0deg\)/,'主体远离时草叶恢复');field.destroy();
    const belts=w.MotionRuntime.create(root,sourceDefinition(get('dual-scroll-settle')));
    belts.seek(1300);
    assert.match(root.querySelector('[data-belt="0"] [data-card="0"]').style.transform,/translate3d\(432px,0px,0px\)/);
    assert.match(root.querySelector('[data-belt="1"] [data-card="0"]').style.transform,/translate3d\(112px,0px,0px\)/);
    const still=frameMarkup(root);belts.seek(1500);assert.equal(frameMarkup(root),still,'减速停靠后保持');belts.destroy();
  }finally{env.close();}
});
