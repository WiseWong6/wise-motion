// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {history,state} from '../scripts/history.mjs';
import {environment,data} from './helpers.mjs';
const historical=await history(data);
const {rank}=createRequire(import.meta.url)('../catalog/matching.js');
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function historyEnvironment(withApp=false){
  const env=await environment(withApp);
  if(!withApp)for(const file of ['catalog/history-data.js','catalog/history-runtime.js'])env.w.eval(await readFile(new URL('../'+file,import.meta.url),'utf8'));
  const media=env.w.HTMLMediaElement.prototype;media.pause=function(){};media.load=function(){};media.play=function(){return Promise.resolve();};
  return env;
}
test('每条历史审查均有出处，案例源码与原片范围没有混并，原源码保持只读',async()=>{
  const snapshot=JSON.parse(await readFile(state+'/source-snapshot.json','utf8'));
  assert.deepEqual(historical.counts,{reviewed:292,recipes:289,entries:311,animation:225,document:64});
  assert.equal(historical.excluded.length,3);
  for(const r of historical.recipes){
    const original=snapshot.rules.find(x=>x.id===r.history_id);
    assert.ok(r.review.reuse_contract.clock);assert.ok(r.retain.includes(r.review.extraction));
    for(const entry of r.entries){
      const expected=entry.cases.flatMap(c=>original.cases.find(x=>x.id===c.id).references.map(i=>original.references[i]));
      for(const ref of entry.code){
        assert.ok(expected.some(x=>x.file===ref.file),entry.id+' 混入其他案例的文件');
        for(const a of ref.anchors)assert.ok(expected.some(x=>x.file===ref.file&&x.anchors.some(b=>b.symbol===a.symbol)),entry.id+' 混入其他案例入口');
      }
      assert.ok(entry.cases.every(c=>c.end>c.start));
    }
  }
  const evidence=JSON.parse(await readFile(state+'/source-evidence.json','utf8'));
  for(const file of evidence)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256,file.file+' 在本次审查期间发生改变');
});
test('相似旧名称不偷换动作：柱高、内部翻卷、时间压缩与有停顿回放保持差别',()=>{
  const find=id=>historical.recipes.find(r=>r.history_id===id);
  assert.deepEqual(find('numeric').actions,['bar-growth']);
  assert.ok(!find('turnover').actions.includes('card-flip'));
  assert.ok(!find('row-mask').actions.includes('mask-stagger-text'));
  assert.deepEqual(find('resume-dissolve').actions,['stagger-crossfade']);
  assert.ok(!find('tutorial-time-compress').actions.includes('film-step'));
  assert.ok(!find('naive-gallery-replay').actions.includes('seamless-scroll'));
  assert.ok(!find('naive-attention-dual').actions.includes('dual-scroll'));
  assert.equal(find('reel-whitney-spiral').name,'螺线描画后持续旋转');
  assert.doesNotMatch(find('reel-whitney-spiral').summary,/匀加速/);
  assert.equal(rank(data,'滚动后刹停对齐')[0].effect.id,'scroll-brake');
  assert.equal(rank(data,'停留滑切轮播')[0].effect.id,'dwell-carousel');
  assert.equal(rank(data,'纵向内容续接')[0].effect.id,'vertical-feed');
});
test('原作绘制器载入迟到时释放，反复定位与观看倍率不改变原作时间关系',async()=>{
  const env=await historyEnvironment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    const effect=historical.recipes.find(r=>r.entries.some(e=>e.preview.type==='isolated'));
    const entry=effect.entries.find(e=>e.preview.type==='isolated');
    let resolve,disposed=0,draws=0;
    const late=w.MotionHistoryRuntime.create(root,effect,{caseId:entry.id,mount:()=>new Promise(r=>{resolve=r;})});
    late.seek(700);late.play();late.destroy();
    resolve({render(){draws++;},dispose(){disposed++;}});await late.ready;
    assert.equal(draws,0);assert.equal(disposed,1);assert.equal(root.children.length,0);assert.equal(w.MotionHistoryRuntime.instanceCount,0);
    const player=w.MotionHistoryRuntime.create(root,effect,{caseId:entry.id,mount:async canvas=>({render(t){canvas.dataset.time=String(t);},dispose(){disposed++;}})});
    await player.ready;
    player.seek(1200);const first=root.innerHTML;player.seek(0);player.setSpeed(2);player.seek(1200);
    assert.equal(root.innerHTML,first);assert.equal(player.duration,entry.preview.duration*1000);assert.equal(player.speed,2);
    assert.throws(()=>player.seek(NaN),/有限数字/);player.restart(false);assert.equal(player.currentTime,0);assert.ok(player.paused);
    player.destroy();assert.equal(disposed,2);assert.equal(w.MotionHistoryRuntime.runningCount,0);
  }finally{env.close();}
});
test('原视频强制静音，原片裁剪范围与预览定位分别计算，失败后可继续切换',async()=>{
  const env=await historyEnvironment();
  try{
    const {w}=env,root=w.document.getElementById('root');
    const effect=historical.recipes.find(r=>r.entries.some(e=>e.preview.type==='source-clip'&&e.preview.start>0));
    const entry=effect.entries.find(e=>e.preview.type==='source-clip'&&e.preview.start>0);
    const player=w.MotionHistoryRuntime.create(root,effect,{caseId:entry.id});
    const video=root.querySelector('video');assert.ok(video.muted);assert.ok(video.defaultMuted);assert.equal(video.volume,0);
    player.seek(1200);video.dispatchEvent(new w.Event('loadedmetadata'));await player.ready;
    assert.equal(video.currentTime,entry.preview.start+1.2);assert.equal(player.currentTime,1200);
    video.dispatchEvent(new w.Event('error'));assert.ok(player.paused);assert.match(root.textContent,/不存在或浏览器不支持/);
    player.destroy();video.dispatchEvent(new w.Event('error'));assert.equal(root.innerHTML,'');
  }finally{env.close();}
});
test('历史目录筛选与多案例切换同步输出、源码和时长，前后切换只保留一个播放器',async()=>{
  const env=await historyEnvironment(true);
  try{
    const {w}=env,d=w.document;
    const originalCreate=w.MotionHistoryRuntime.create;
    w.MotionHistoryRuntime.create=(root,e,options)=>originalCreate(root,e,{...options,mount:async canvas=>({render(t){canvas.dataset.time=String(t);},dispose(){}})});
    d.querySelector('[data-kind="recipe"]').click();assert.equal(d.querySelectorAll('#effects-list [data-effect]').length,289);
    d.querySelector('[data-domain="document"]').click();assert.equal(d.querySelectorAll('#effects-list [data-effect]').length,64);
    d.querySelector('[data-domain="animation"]').click();assert.equal(d.querySelectorAll('#effects-list [data-effect]').length,225);
    d.querySelector('[data-domain="all"]').click();
    const effect=w.MotionHistory.recipes.find(r=>r.entries.length>1&&new Set(r.entries.map(e=>e.preview.duration)).size>1);
    d.querySelector(`[data-effect="${effect.id}"]`).click();await tick();
    assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(w.MotionHistoryRuntime.instanceCount,1);
    const select=d.getElementById('history-case');select.value=effect.entries[1].id;select.dispatchEvent(new w.Event('change'));await tick();
    const entry=effect.entries[1];
    assert.equal(d.getElementById('time-total').textContent,entry.preview.duration.toFixed(1));
    assert.match(d.getElementById('code').textContent,new RegExp(entry.id));
    assert.ok(d.getElementById('prompt').textContent.includes(entry.name));
    assert.equal(decodeURI(new URL(d.querySelector('#history-details a').href).pathname),entry.code[0].file);
    d.getElementById('next-effect').click();await tick();assert.equal(w.MotionHistoryRuntime.instanceCount,1);
    d.querySelector('[data-kind="action"]').click();d.querySelector('[data-effect="fade-rise"]').click();
    assert.equal(w.MotionHistoryRuntime.instanceCount,0);assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(env.listeners.size,4);
    assert.equal(d.querySelectorAll('audio').length,0);
  }finally{env.close();}
});
