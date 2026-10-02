// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {JSDOM} from 'jsdom';
import {history,state} from '../scripts/history.mjs';
import {environment,data,sourceDefinition} from './helpers.mjs';
const crosswalk=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
const migrated=['resume-count','reel-bezier-editor','naive-reduction-dim'];
const effect=id=>sourceDefinition(data.effects.find(e=>e.id===id));
const closeTo=(actual,expected,tolerance=1e-7)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);
const access=root=>({get:id=>root.querySelector(`[data-part="${id}"]`),num:(id,key)=>Number(root.querySelector(`[data-part="${id}"]`).getAttribute(key))});
function reversible(w,root,player){
  player.seek(500);const nodes=[...root.querySelectorAll('*')],frame=root.innerHTML;
  player.seek(10000);const final=root.innerHTML;player.seek(0);player.seek(500);assert.equal(root.innerHTML,frame);
  assert.deepEqual([...root.querySelectorAll('*')],nodes,'倒拖不应重建节点');
  player.seek(10000);assert.equal(root.innerHTML,final);
  const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,characterData:true});
  player.seek(10000);assert.equal(observer.takeRecords().length,0,'停住后不反复写入画面');observer.disconnect();
}

test('三项迁入数据分类且原文件未改，五个历史入口剔除，名称仍可查到新动作',async()=>{
  const historical=await history(data),{rank}=createRequire(import.meta.url)('../catalog/matching.js');
  for(const id of [...migrated,'density','naive-latency-compare']){
    assert.ok(historical.excluded.some(e=>e.id===id));assert.ok(!historical.recipes.some(e=>e.history_id===id));
  }
  for(const id of migrated){
    const migration=crosswalk.rules[id].migration,e=effect(migration.effect);
    assert.equal(e.kind,'action');assert.equal(e.category,'data');assert.equal(rank(data,e.name)[0].effect.id,e.id);
    for(const file of migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256);
  }
});

test('双百分数按原讲述词点先后增长，读数、柱高和柱顶位置共用进度',async()=>{
  const files=crosswalk.rules['resume-count'].migration.files;
  const original=new JSDOM(await readFile(files.find(f=>f.file.endsWith('preview.html')).file,'utf8'));
  const timing=JSON.parse(await readFile(files.find(f=>f.file.endsWith('timing.json')).file,'utf8'));
  const values=[...original.window.document.querySelectorAll('[data-count-to]')].map(n=>{
    const cue=timing.cues.find(c=>c.id===n.dataset.countCue),start=cue.start+cue.charAt[cue.text.indexOf(n.dataset.countWord)];
    const rise=JSON.parse(n.parentElement.dataset.evolve)[0];
    return {target:+n.dataset.countTo,duration:+n.dataset.countDuration*1000,start,y:+n.getAttribute('y'),height:+rise.from.attr.transform.match(/0 ([\d.]+)/)[1]};
  });original.window.close();
  const env=await environment();try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,effect('narrated-count')),{get,num}=access(root);
    const second=(values[1].start-values[0].start)*1000;
    player.seek(1000);assert.equal(get('value0').textContent,'60%');assert.equal(get('value1').textContent,'0%');
    for(const time of [0,320,640,second,second+280,second+560,3000]){
      player.seek(time);
      values.forEach((v,i)=>{
        const elapsed=time-(v.start-values[0].start)*1000,p=Math.max(0,Math.min(1,elapsed/v.duration)),q=1-(1-p)**3;
        assert.equal(get('value'+i).textContent,Math.round(v.target*q)+'%');closeTo(num('bar'+i,'height'),v.height*q);
        closeTo(num('bar'+i,'y')+num('bar'+i,'height'),1048);closeTo(num('value'+i,'y'),v.y+v.height*(1-q));
      });
    }
    reversible(w,root,player);
  }finally{env.close();}
});

test('曲线手柄沿原作回弹，曲线点与匀速对照由横坐标求值，大曲线和小球同高',async()=>{
  const source=await readFile(crosswalk.rules['reel-bezier-editor'].migration.files[0].file,'utf8');
  const definitions=['const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)); const prog = (t,a,b) => clamp((t-a)/(b-a)); const lerp=(a,b,p)=>a+(b-a)*p;',source.match(/const E = \{[\s\S]*?\n\};/)[0],
    source.match(/function bez1[^\n]+/)[0],source.match(/function cubicEase[\s\S]*?\n\}/)[0],source.match(/function easeHandles[\s\S]*?\n\}/)[0]].join('\n');
  const original=runInNewContext(definitions+';({easeHandles,cubicEase})');
  const env=await environment();try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,effect('bezier-editor')),{get,num}=access(root);
    for(const time of [0,750,1300,1500,1700,2100,2800,3400]){
      player.seek(time);const [a,b]=original.easeHandles(time/1000+.5);
      for(const [i,h]of [a,b].entries()){closeTo(num('handle'+i,'cx'),72+300*h[0]);closeTo(num('handle'+i,'cy'),278-190*h[1]);}
      const x=(num('point','cx')-72)/300,expected=x===0||x===1?x:original.cubicEase(x,a,b),y=(278-num('point','cy'))/190;
      closeTo(y,expected);closeTo((num('linear','x')-420)/128,x);closeTo((num('eased','x')-420)/128,y);
    }
    player.seek(1600);assert.ok(num('handle0','cx')>72+300*.8,'手柄应越过目标后回弹');
    player.seek(4900);assert.equal(num('comparison','opacity'),0);assert.equal(num('large-companion','opacity'),1);
    assert.equal(num('ball','cy'),num('point','cy'));assert.ok(num('point','cy')<125,'曲线应超出最终数值');
    player.seek(5500);closeTo(num('point','cx'),498);closeTo(num('point','cy'),125);const settled=root.innerHTML;
    player.seek(6000);assert.equal(root.innerHTML,settled);assert.ok(get('curve').getAttribute('d').split('L').length===81);
    reversible(w,root,player);
  }finally{env.close();}
});

test('降幅始终等于节省段比例，尺寸两端贴合节省范围，数字轮最终为 44%',async()=>{
  const env=await environment();try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,effect('reduction-dimension')),{get,num}=access(root);
    const path=id=>get(id).getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
    for(const time of [0,200,500,800,1000,1800]){
      player.seek(time);const current=num('current','width'),saved=num('saved','width'),percent=num('readout','data-value');
      closeTo(current+saved,330);closeTo(percent,saved/330*100);closeTo(num('saved','x'),900+current);
      const extensions=path('extensions');closeTo(extensions[0],900+current);closeTo(extensions[3],1230);
      const dimension=path('dimension-line');closeTo(dimension[2]-dimension[0],saved*percent/44);closeTo((dimension[0]+dimension[2])/2,(900+current+1230)/2);
      if(time===500){closeTo(percent,22,1e-3);closeTo(current,257.4,1e-3);}
    }
    closeTo(num('current','width'),184.8);assert.equal(get('digit0-a').textContent+get('digit1-a').textContent,'44');
    assert.equal(num('digit0-a','y'),872);assert.equal(num('digit1-a','y'),872);assert.equal(num('digit1-b','opacity'),0);
    assert.equal(get('readout').getAttribute('fill'),'var(--ink)');reversible(w,root,player);
  }finally{env.close();}
});

test('指定的三项历史配方及其专属案例从目录剔除',async()=>{
  const historical=await history(data);
  for(const id of ['promo-stats-decode','naive-result-swap','promo-screen-card']){
    assert.ok(historical.excluded.some(e=>e.id===id));
    assert.ok(!historical.recipes.some(e=>e.history_id===id));
  }
  const activeCases=new Set(historical.recipes.flatMap(r=>r.entries.flatMap(e=>e.cases.map(c=>c.id))));
  assert.ok(historical.originals.clips.every(c=>activeCases.has(c.id)));
});
