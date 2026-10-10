// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const files=['data-comparisons','reel-paper','reel-neon','reel-grit-key','reel-flat-gen','reel-prompt-outro'];
const context={MotionFactories:{}};
for(const file of files)runInNewContext(await readFile(new URL(`../catalog/effects/${file}.js`,import.meta.url),'utf8'),context);
const factories=context.MotionFactories;
const {effects}=JSON.parse(await readFile(new URL('../catalog/registry.json',import.meta.url),'utf8'));
const definitions=new Map(effects.map(effect=>[effect.id,effect]));

// 按真实绘制函数核对关系；这些行的顺序与目录 actions 顺序不同，不能按位置配对。
const horizon={stars:['star-twinkle'],sun:['striped-sun-rise'],grid:['perspective-grid-flow']};
const expected={
  'paper-spiral-sequence':{paper:['paper-strip-stagger'],disc:['paper-disc-pop'],spiral:['spiral-draw-spin'],orbit:['planar-dot-orbit'],text:['paper-title-stagger']},
  'neon-horizon':horizon,
  'neon-title-sequence':{...horizon,chrome:['chrome-outline-echo'],neon:['neon-type-flicker'],flare:['cross-flare-travel'],caption:['caption-type-caret']},
  'keyframe-workbench':{panels:['panel-rise-collapse'],bounce:['ball-bounce-trails'],graph:['bezier-editor'],timeline:['timeline-keyframe-playhead'],'large-graph':['bezier-editor'],labels:['title-stagger']},
  'material-phone-sequence':{shapes:['shape-pop-float'],labels:['title-stagger'],phone:['material-phone-rise'],cards:['material-card-stagger'],switch:['material-switch-spring'],spinner:['material-spinner-arc'],like:['material-like-pop'],fab:['material-fab-panel']},
  'generative-point-sequence':{field:['generative-flow-field'],points:['generative-point-morph'],frame:['generative-frame-readout'],title:['title-stagger'],code:[]},
  'prompt-to-core-sequence':{ui:['prompt-ui-push'],border:['prompt-border-trace'],letters:['prompt-chinese-type','prompt-char-gather'],send:['send-press-ring'],core:['core-ring-expand'],labels:[]},
  'outro-recap-sequence':{burst:['radial-line-burst'],axis:['timeline-dock-down'],credits:['outro-credit-lift'],segments:['color-segment-stagger']}
};

test('八个组合的四十四个拆解行都明确声明独立动作，每层保留准确的动作关联',()=>{
  let count=0;
  for(const id of Object.keys(expected)){
    const rows=factories[id].breakdown;
    assert.equal(definitions.get(id)?.kind,'composition',id);
    assert.equal(new Set(rows.map(row=>row.id)).size,rows.length,`${id} 图层重复`);
    for(const row of rows){
      assert.ok(Object.hasOwn(row,'actions'),`${id}/${row.id} 缺少关联声明`);
      assert.ok(Array.isArray(row.actions),`${id}/${row.id}`);
      assert.equal(new Set(row.actions).size,row.actions.length,`${id}/${row.id} 动作重复`);
      for(const action of row.actions)assert.equal(typeof action,'string');
      count++;
    }
  }
  assert.equal(count,44);
});

test('所有关联均有可运行的独立示例，并且完整对应组合登记的组成动作',()=>{
  for(const id of Object.keys(expected)){
    const definition=definitions.get(id),linked=new Set();
    for(const row of factories[id].breakdown)for(const target of row.actions){
      const action=definitions.get(target);
      assert.ok(action,`${id}/${row.id} 不存在的动作 ${target}`);
      assert.ok(['action','illustration'].includes(action.kind),`${target} 必须是独立示例`);
      assert.equal(typeof factories[target],'function',`${target} 缺少实现`);
      assert.ok(definition.actions.includes(target),`${target} 不属于 ${id}`);
      linked.add(target);
    }
    assert.deepEqual([...linked].sort(),[...definition.actions].sort(),`${id} 有遗漏或额外动作`);
  }
});

test('真实图层关系不依赖列表顺序，同一文字层保留写入和汇聚两项关联',()=>{
  for(const [id,mapping] of Object.entries(expected)){
    const actual=Object.fromEntries(factories[id].breakdown.map(row=>[row.id,Array.from(row.actions)]));
    assert.deepEqual(actual,mapping,id);
  }
  const rows=factories['neon-horizon'].breakdown;
  assert.equal(rows[0].id,'stars');
  assert.equal(rows[0].actions[0],'star-twinkle');
  assert.notEqual(rows[0].actions[0],definitions.get('neon-horizon').actions[0]);
  assert.deepEqual(Array.from(factories['prompt-to-core-sequence'].breakdown.find(row=>row.id==='letters').actions),['prompt-chinese-type','prompt-char-gather']);
});


test('合并后的标题动作在三个组合中仍指向各自原样式和原时长',()=>{
  const title=definitions.get('title-stagger');assert.ok(title);
  const variants=new Map(title.variants.map(variant=>[variant.id,variant]));
  for(const [composition,variant,duration] of [
    ['material-phone-sequence','material',3000],
    ['generative-point-sequence','outline',3000],
    ['keyframe-workbench','handoff',8000]
  ]){
    assert.equal(definitions.get(composition).action_variants?.['title-stagger'],variant,composition+' 应匹配原标题样式');
    assert.equal(variants.get(variant)?.duration_ms,duration,variant+' 保留原时长');
    assert.equal(variants.get(variant)?.timing,undefined,variant+' 不额外压缩原时序');
  }
  assert.equal(title.timing,undefined,'三种标题保留各自原时钟');
});
