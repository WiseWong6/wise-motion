// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {history,state} from '../scripts/history.mjs';
import {data} from './helpers.mjs';
const snapshot=JSON.parse(await readFile(state+'/source-snapshot.json','utf8'));
const crosswalk=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
const imported=snapshot.imports.find(x=>x.source==='showreel'&&x.date==='2026-10-02');
const historical=await history(data);
const source=await readFile(imported.video.file.replace(/[^/]+$/, 'reel.js'),'utf8');
const sources=new Map(await Promise.all([...new Set(snapshot.rules.filter(r=>r.id.startsWith('reel-')).flatMap(r=>r.references.map(ref=>ref.file)))].map(async file=>[file,(await readFile(file,'utf8')).split('\n')])));
const scenes=[...source.matchAll(/\{ s: (\d+), e: (\d+), draw: (\w+) \}/g)].map(([,s,e,draw])=>({s:Number(s),e:Number(e),draw}));

test('演进史所有配方均有提炼或去重结论，既有剔除结论没有被恢复',()=>{
  assert.equal(imported.added_rules.length,19);
  const rules=snapshot.rules.filter(r=>r.id.startsWith('reel-'));assert.equal(rules.length,51);
  for(const rule of rules){
    const audit=crosswalk.rules[rule.id];
    assert.equal(audit.status,'excluded',rule.title+' 尚未完成');
    assert.ok(audit.reason,rule.title+' 未说明后续去向');
    assert.ok(!historical.recipes.some(r=>r.history_id===rule.id),rule.title+' 重复留在历史列表');
    if(audit.completion_batch==='20261002')for(const id of audit.patterns)assert.ok(data.effects.some(e=>e.id===id),rule.title+' 缺少已提取动作 '+id);
  }
  for(const id of imported.excluded_unchanged)assert.ok(historical.excluded.some(e=>e.id===id));
  for(const id of ['reel-era-sweep','reel-shine-sweep','reel-scanlines','reel-wobble-underline'])assert.ok(historical.excluded.some(e=>e.id===id));
});

test('八处转场保留原片案例和源码依据，标准动作时长对应真实交接边界',()=>{
  assert.equal(scenes.length,9);
  const transitions=runInNewContext('('+source.match(/const TRANS = (\[[\s\S]*?\n\]);/)[1]+')');
  const ids=['reel-mask-iris','reel-mask-slats','reel-mask-glitch','reel-mask-flash','reel-mask-tiles','reel-mask-diag','reel-mask-pixel','reel-mask-iris-flash'];
  const standard=['iris-open-transition','slat-alternate-transition','glitch-band-transition','radial-flash-transition','tile-wave-transition','diagonal-edge-transition','pixel-dissolve-transition','iris-flash-transition'];
  const rule=snapshot.rules.find(r=>r.id==='reel-mask-transitions');assert.equal(rule.cases.length,8);
  ids.forEach((id,i)=>{
    const c=rule.cases.find(c=>c.id===id),start=scenes[i+1].s-transitions[i+1].d/2,end=scenes[i+1].s+transitions[i+1].d/2;
    assert.ok(c.start<=start+1e-9&&c.end>=end-1e-9,id+' 未覆盖真实交接');
    if(imported.added_cases.includes(id)){assert.ok(Math.abs(c.start-start)<1e-9);assert.ok(Math.abs(c.end-end)<1e-9);}
    const e=data.effects.find(e=>e.id===standard[i]);assert.ok(e);assert.match(e.tempo_note,new RegExp(String(transitions[i+1].d).replace('.','\\.')+'秒'));
  });
  for(const rule of snapshot.rules.filter(r=>r.id.startsWith('reel-')))for(const c of rule.cases){
    assert.ok(c.start>=0&&c.end<=60&&c.end>c.start);
    for(const index of c.references){const ref=rule.references[index];for(const anchor of ref.anchors){
      assert.ok(sources.get(ref.file)[anchor.line-1].includes(anchor.symbol),rule.title+' 源码定位失效');
    }}
  }
});

test('已核实的原片描述修正保留在审查记录中，不能因归档重新丢失',()=>{
  const track=crosswalk.rules['reel-timeline-playhead'];
  assert.match(track.extraction,/跳回/);assert.doesNotMatch(track.reuse_contract.input,/往返循环/);
  assert.match(data.effects.find(e=>e.id==='striped-sun-rise').retain,/条纹下移/);
  assert.doesNotMatch(data.effects.find(e=>e.id==='bezier-editor').summary,/三次/);
  for(const id of ['reel-striped-sun','reel-grid-floor','reel-star-twinkle','reel-chrome-echo','reel-neon-flicker'])assert.ok(historical.excluded.some(e=>e.id===id));
});
