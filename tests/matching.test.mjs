// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {data} from './helpers.mjs';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const {rank, describe} = createRequire(import.meta.url)('../catalog/matching.js');
test('历史配方可按来源标题片段搜索，英文不区分大小写',async()=>{
  const context={};runInNewContext(await readFile(new URL('../catalog/history-data.js',import.meta.url),'utf8'),context);
  const effects=context.MotionHistory.recipes;
  const expected=Array.from(effects.filter(effect=>effect.original_sources.some(source=>/claude/i.test(source))),effect=>effect.id).sort();
  assert.ok(effects.length>0,'历史库仍有真实条目');
  // 已删除来源可以没有结果，使用独立样例继续验证英文片段匹配。
  const sample={...effects[0],id:'source-fragment-case',original_sources:['Claude 原作'],aliases:[]};
  for(const query of ['Claude','claude','  cLaUdE  '])assert.deepEqual(Array.from(rank({effects:[sample]},query),match=>match.effect.id),[sample.id]);
  for(const query of ['Claude','claude','  cLaUdE  ']){
    assert.deepEqual(Array.from(rank({effects},query),match=>match.effect.id).sort(),expected);
  }
  assert.equal(rank({effects},'动效演进史').length,0,'已提炼的演进史不重复留在历史列表');
  const pending=data.effects.filter(e=>e.aliases.includes('演进史待验收')).map(e=>e.id).sort();
  assert.equal(pending.length,42);
  assert.ok(pending.includes('title-stagger'),'合并标题保留原待验收入口');
  for(const name of ['年份标题与词条错峰入场','轮廓年份与标题错峰呈现','年份说明退场与结语升入']){
    assert.equal(rank(data,name)[0].effect.id,'title-stagger','旧名称检索合并后的同一动作');
  }
  assert.deepEqual(rank(data,'演进史待验收').map(m=>m.effect.id).sort(),pending);
  assert.equal(rank({effects},'   ').length,0);
  assert.equal(rank({effects},'不存在的宣传片标题').length,0);
});
test('持续滚动保留双排反向，不退化成轮播', () => {
  const result = rank(data, '上下两排卡片反向持续滚动，不要轮播，不要停顿');
  assert.equal(result[0].effect.id, 'dual-scroll');
  assert.ok(result.every(x => x.effect.id === 'dual-scroll'));
  assert.ok(result[0].excluded.includes('逐张切换'));
  assert.equal(rank(data, '一排内容一直无缝滚动')[0].effect.id, 'seamless-scroll');
});
test('逐项呈现与标题关系得到对应本地参考', () => {
  assert.equal(rank(data, '四张卡片依次出现，按顺序')[0].effect.id, 'stagger-in');
  assert.equal(rank(data, '标题先出现，然后内容依次展开')[0].effect.id, 'title-content');
});
test('自然变成可解释的推荐，禁项与无匹配不被掩盖', () => {
  const natural = rank(data, '卡片自然一点，轻轻进入');
  assert.equal(natural[0].effect.id, 'fade-rise');
  assert.match(describe(natural[0].effect), /末尾减速/);
  assert.ok(!rank(data, '卡片翻转，不要翻面').some(x => x.effect.id === 'card-flip'));
  assert.ok(!rank(data, '卡片翻转，不翻面').some(x => x.effect.id === 'card-flip'));
  assert.equal(rank(data, '不要轮播而是两排卡片反向持续滚动')[0].effect.id, 'dual-scroll');
  assert.equal(rank(data, '无缝滚动，不要循环').length, 0);
  assert.equal(rank(data, '让三维液体表面生成真实湍流').length, 0);
});
test('动作说明同时提供要求、假设、当前节奏与源码', () => {
  const effect = data.effects.find(x => x.id === 'dual-scroll');
  const text = describe(effect, {speed:2,ease:'spring'}, data);
  for (const label of ['目的：','对象：','动作阶段：','节奏：','触发与联动：','需要保留：','明确排除：','对应参考：','源码：','关键假设：']) assert.ok(text.includes(label));
  assert.match(text, /4\.00 秒/); assert.match(text, /匀速/); assert.doesNotMatch(text, /轻微回弹/);
  assert.match(text, /首尾无缝衔接/);
  assert.doesNotMatch(text,/所用动作：/,'普通动作不再附带组合关联');
});
