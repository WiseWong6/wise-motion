// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {build} from 'esbuild';
import {environment,data,frameMarkup} from './helpers.mjs';
import {resolveEffect,getEffectMetadata} from '../remotion/clock.mjs';
import {exportEffect} from '../scripts/export.mjs';
import {selectEffect} from '../scripts/show.mjs';

const id='rigid-rebound';
test('左右入场与双层回摆合为一个动作，旧链接仍打开双层示例并能切换',async()=>{
 assert.equal(data.effects.some(e=>e.id==='vertical-rebound'),false);
 assert.equal(selectEffect('双层反向回摆').id,id);
 assert.equal(data.redirects['vertical-rebound'],id);
 assert.equal(data.variant_redirects['vertical-rebound'],'stacked');
 const env=await environment(true,{hash:'#vertical-rebound',staticPreview:true});
 try{
  const {w}=env,d=w.document;
  assert.equal(d.querySelector('.effect-item[aria-current="true"]').dataset.effect,id);
  const picker=d.getElementById('effect-variant');
  assert.deepEqual([...picker.options].map(o=>o.value),['original','stacked']);
  assert.equal(picker.value,'stacked');assert.ok(d.querySelector('#preview [data-part="top"]'));
  for(const [variant,part] of [['original','left'],['stacked','top']]){
   picker.value=variant;picker.dispatchEvent(new w.Event('change'));
   assert.ok(d.querySelector(`#preview [data-part="${part}"]`));
  }
 }finally{env.close();}
});

test('两种布局保留原尺寸、对向水平回摆、时间边界及可重复定位',async()=>{
 const env=await environment();try{
  const {w}=env;
  const roots=['original','stacked'].map(()=>w.document.createElement('div'));
  const effects=['original','stacked'].map(v=>resolveEffect(id,v));
  const draws=effects.map((e,i)=>w.MotionKit.createRenderer(roots[i],e));
  try{
   for(const e of effects){assert.equal(e.duration_ms,2400);assert.equal(getEffectMetadata(id,{variantId:e.variant_id}).durationInFrames,145);}
   const snapshots=new Map();
   for(const time of [0,150,498,721,982,1267,1571,1950,2400,721,0]){
    draws.forEach(draw=>draw(time));
    const parts=roots.map(r=>[...r.querySelectorAll('rect[data-part]')]);
    assert.deepEqual(parts[0].map(p=>[p.getAttribute('width'),p.getAttribute('height')]),[['112','144'],['112','144']]);
    assert.deepEqual(parts[1].map(p=>[p.getAttribute('y'),p.getAttribute('width'),p.getAttribute('height')]),[['60','144','96'],['204','144','96']]);
    for(let i=0;i<2;i++)assert.equal(parts[0][i].getAttribute('transform'),parts[1][i].getAttribute('transform'));
    const offsets=parts[0].map(p=>Number(p.getAttribute('transform').match(/translate\(([-\d.]+)/)[1]));
    assert.equal(offsets[0]+offsets[1],0);
    roots.forEach((root,i)=>{
     assert.doesNotMatch(root.innerHTML,/NaN|Infinity|scale\(/);
     const key=i+':'+time,frame=frameMarkup(root.querySelector('svg'));
     if(snapshots.has(key))assert.equal(frame,snapshots.get(key));
     snapshots.set(key,frame);
    });
   }
   for(let i=0;i<2;i++)assert.equal(snapshots.get(i+':1950'),snapshots.get(i+':2400'));
   for(const effect of effects){
    const host=w.document.createElement('div'),player=w.MotionRuntime.create(host,effect);
    try{
     player.pause();player.seek(721);const frame=frameMarkup(host.querySelector('svg'));
     for(const speed of [.5,2]){player.setSpeed(speed);player.seek(721);assert.equal(frameMarkup(host.querySelector('svg')),frame);}
     player.seek(effect.duration_ms);player.restart(false);assert.equal(player.currentTime,0);
    }finally{player.destroy();}
   }
  }finally{draws.forEach(draw=>draw.destroy?.());}
 }finally{env.close();}
});

test('合并后的两种布局分别导出正确示例并可编译',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'wise-rebound-'));
 try{for(const variantId of ['original','stacked']){
  const out=await exportEffect(id,{variantId,outDir:path.join(dir,variantId)});
  const source=await readFile(path.join(out.directory,'src/Root.jsx'),'utf8');
  assert.ok(source.includes(`"variantId": "${variantId}"`));
  assert.ok(source.includes('catalog/effects/history-patterns.js'));
  const result=await build({entryPoints:[path.join(out.directory,'src/index.jsx')],bundle:true,write:false,platform:'node',format:'esm',alias:{'wise-motion':path.resolve('dist/index.mjs')},external:['react','remotion'],logLevel:'silent'});
  assert.ok(result.outputFiles[0].text.includes('WiseMotionEffect'));
 }}finally{await rm(dir,{recursive:true,force:true});}
});
