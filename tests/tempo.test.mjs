// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {data,environment,sourceDefinition,motionTime,frameMarkup} from './helpers.mjs';

function sameFrame(actual,expected,message) {
  const a=frameMarkup(actual),b=frameMarkup(expected);
  if(a===b)return;
  let at=0;while(at<Math.min(a.length,b.length)&&a[at]===b[at])at++;
  assert.fail(message+'；不同处：'+a.slice(Math.max(0,at-35),at+100)+' / '+b.slice(Math.max(0,at-35),at+100));
}

test('同类动作共用主要时长与末尾停顿，循环和特殊节拍分别保留',()=>{
  const get=id=>data.effects.find(e=>e.id===id);
  for(const ids of [
    ['fade-rise','mask-reveal','scale-in','card-flip','wipe'],
    ['dimension-line','ruler-ticks','leader-callout'],
    ['count-up','progress-readout','bar-growth','sector-appear','trend-draw','map-paint','stroke-draw','tone-grow'],
    ['rigid-rebound','vertical-rebound','gauge-rebound','flat-to-volume','timeline-progress'],
    ['formula-evolve','experience-progress','terminal-code','theme-card-layout','benchmark-columns']
  ]) {
    const durations=ids.map(id=>get(id).timing.end_ms-get(id).timing.start_ms);
    assert.ok(durations.every(n=>n===durations[0]),ids.join('、'));
  }
  for(const effect of data.effects.filter(e=>e.timing&&!e.loop)) {
    assert.equal(effect.timing.start_ms,150,effect.id);
    assert.equal(effect.duration_ms-effect.timing.end_ms,450,effect.id);
  }
  for(const id of ['rapid-cut','card-conveyor','data-pulse','film-step','word-cloud-lift','dither-lab-book',
    ...data.effects.filter(e=>e.id.endsWith('-illustration')).map(e=>e.id)]) assert.equal(get(id).timing,undefined,id);
});

test('统一节奏只重新对应时间，保留原作画面、顺序、终点和连续累计时间',async()=>{
  const env=await environment();
  try {
    const {w}=env,d=w.document;
    for(const e of data.effects.filter(e=>e.timing)) {
      const actual=d.createElement('div'),expected=d.createElement('div'),source=sourceDefinition(e);
      const draw=w.MotionKit.createRenderer(actual,e),original=w.MotionFactories[e.id](expected,w.MotionKit,source),t=e.timing;
      try {
        for(const p of [0,.13,.4,.76,1]) {
          const ms=t.start_ms+(t.end_ms-t.start_ms)*p;
          const clock=p===1?t.source_end_ms:Math.round((t.source_start_ms+(t.source_end_ms-t.source_start_ms)*p)*1e9)/1e9;
          draw(ms,{ease:e.default_ease,elapsed:ms});
          original(clock,{ease:e.default_ease,duration:source.duration_ms,elapsed:e.loop?ms*source.duration_ms/e.duration_ms:clock});
          sameFrame(actual,expected,e.id+' 在 '+p+' 时改变了动作');
        }
        if(!e.loop) {
          draw(0);const start=frameMarkup(actual);draw(t.start_ms);assert.ok(frameMarkup(actual)===start,e.id+' 开头应短暂等待');
          draw(t.end_ms);const end=frameMarkup(actual);draw(e.duration_ms);assert.ok(frameMarkup(actual)===end,e.id+' 末尾应静止');
          original(source.duration_ms,{ease:e.default_ease,duration:source.duration_ms,elapsed:source.duration_ms});
          sameFrame(actual,expected,e.id+' 还未完成就结束了');
        } else {
          draw(0,{elapsed:e.duration_ms*2});
          original(0,{ease:e.default_ease,duration:source.duration_ms,elapsed:source.duration_ms*2});
          sameFrame(actual,expected,e.id+' 第二轮累计时间被重置');
        }
      } finally {draw.destroy?.();original.destroy?.();}
    }
  } finally {env.close();}
});

test('新节奏的入场与回摆可重新定位，速度滑块不改变定位画面',async()=>{
  const env=await environment();
  try {
    const {w}=env,root=w.document.getElementById('root');
    for(const id of ['fade-rise','count-up','timeline-progress','rigid-rebound']) {
      const e=data.effects.find(e=>e.id===id),player=w.MotionRuntime.create(root,e);
      const source=e.timing.source_start_ms+(e.timing.source_end_ms-e.timing.source_start_ms)*.4;
      player.seek(motionTime(e,source));const snapshot=root.innerHTML;
      player.setSpeed(.5);player.seek(player.currentTime);assert.equal(root.innerHTML,snapshot,id);
      player.setSpeed(2);player.seek(player.currentTime);assert.equal(root.innerHTML,snapshot,id);
      player.seek(e.duration_ms);player.restart(false);assert.equal(player.currentTime,0);player.destroy();
    }
  } finally {env.close();}
});

test('缩略图与主播放器在新预览时刻显示同一画面，不建立额外计时器',async()=>{
  const env=await environment(true,{staticPreview:true});
  try {
    const {w}=env,d=w.document;env.reveal();
    const instances=w.MotionRuntime.instanceCount,listeners=env.listeners.size;
    for(const e of data.effects.filter(e=>e.timing&&e.kind==='action')) {
      const thumb=d.querySelector(`.effect-item[data-effect="${e.id}"] .thumb .motion-stage`);
      assert.ok(thumb,e.id+' 缺少缩略图');
      const root=d.createElement('div'),player=w.MotionRuntime.create(root,e);
      try {player.seek(e.preview_ms);sameFrame(thumb,root.firstElementChild,e.id+' 缩略图与主预览不同');}
      finally {player.destroy();}
    }
    assert.equal(w.MotionRuntime.instanceCount,instances);
    assert.equal(env.listeners.size,listeners);
  } finally {env.close();}
});
