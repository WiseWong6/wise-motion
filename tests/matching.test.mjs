// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {data} from './helpers.mjs';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
import {historyTestData} from './history-fixture.mjs';
const {rank, describe} = createRequire(import.meta.url)('../catalog/matching.js');
test('历史目录清空后，来源标题片段匹配仍通过独立样例验证',async()=>{
  const context={};runInNewContext(await readFile(new URL('../catalog/history-data.js',import.meta.url),'utf8'),context);
  const effects=context.MotionHistory.recipes;
  const expected=Array.from(effects.filter(effect=>effect.original_sources.some(source=>/claude/i.test(source))),effect=>effect.id).sort();
  assert.equal(effects.length,0,'正式历史目录已清空');
  // 已删除来源可以没有结果，使用独立样例继续验证英文片段匹配。
  const sample={...historyTestData().recipes[0],id:'source-fragment-case',original_sources:['Claude 原作'],aliases:[]};
  for(const query of ['Claude','claude','  cLaUdE  '])assert.deepEqual(Array.from(rank({effects:[sample]},query),match=>match.effect.id),[sample.id]);
  for(const query of ['Claude','claude','  cLaUdE  ']){
    assert.deepEqual(Array.from(rank({effects},query),match=>match.effect.id).sort(),expected);
  }
  assert.equal(rank({effects},'动效演进史').length,0,'已提炼的演进史不重复留在历史列表');
  const pending=data.effects.filter(e=>e.aliases.includes('演进史待验收')).map(e=>e.id).sort();
  assert.equal(pending.length,41);
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

test('卡片按顺序放大与逐句字幕、金属材质均能找到实际对应候选', () => {
  assert.equal(rank(data, '六张卡片依次放大显现，落位后保留')[0].effect.id, 'group-expand');
  assert.equal(rank(data, '六张卡片按顺序缩放出现，不要上移')[0].effect.id, 'group-expand');
  const matches = rank(data, '字幕逐句出现，画面有金属质感转场').slice(0, 5);
  assert.ok(matches.some(x => x.effect.id === 'subtitle-focus'));
  assert.ok(matches.some(x => x.effect.id === 'polished-metal-sweep'));
  assert.ok(!rank(data, '逐句字幕，不要金属质感').some(x => x.matched.includes('金属材质')));
  assert.ok(!rank(data, '卡片依次显现，不要放大').some(x => x.effect.id === 'group-expand'));
});

test('缺少旧版推荐字段时仍提供用途，正式目录的推荐说明全部完整', () => {
  for (const effect of data.effects) assert.ok(typeof effect.recommendation === 'string' && effect.recommendation.trim(), effect.id);
  const legacy = structuredClone(data);
  delete legacy.effects.find(e => e.id === 'hud-ring-build').recommendation;
  const match = rank(legacy, '环圈分层展开')[0];
  assert.equal(match.effect.id, 'hud-ring-build');
  assert.equal(match.reason, match.effect.purpose);
});

test('检索命令默认展示五项，可限制数量和读取详情，无匹配和错误参数明确报告', () => {
  const run = (...args) => spawnSync(process.execPath, ['scripts/match.mjs', ...args], {cwd:new URL('../',import.meta.url),encoding:'utf8'});
  const query = '字幕逐句出现，画面有金属质感转场';
  const result = run(query);
  assert.equal(result.status, 0, result.stderr);
  assert.equal((result.stdout.match(/参考候选 \d+：/g) || []).length, 5);
  assert.doesNotMatch(result.stdout, /依据：undefined/);
  assert.match(result.stdout, /只覆盖需求的一部分/);
  const limited = run('--limit', '3', query);
  assert.equal(limited.status, 0, limited.stderr);
  assert.equal((limited.stdout.match(/参考候选 \d+：/g) || []).length, 3);
  const details = run(query, '--limit=1', '--details');
  assert.equal(details.status, 0, details.stderr);
  assert.match(details.stdout, /动作阶段：/);
  const none = run('让三维液体表面生成真实湍流');
  assert.equal(none.status, 0);assert.match(none.stdout, /没有找到/);
  for (const args of [[],[query,'--limit','0'],[query,'--limit','6'],[query,'--limit'],[query,'--unknown']]) assert.equal(run(...args).status,1);
});
