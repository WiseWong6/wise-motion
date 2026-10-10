// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {history,state} from '../scripts/history.mjs';
import {environment,data,frameMarkup} from './helpers.mjs';
const effect=data.effects.find(e=>e.id==='rect-wave-field');
const n=(node,key)=>Number(node.getAttribute(key));

test('点阵各列等高、数量固定；波浪全过程点不重叠、无裁切并保持点的身份',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,effect);
    const columns=[...root.querySelectorAll('[data-col]')],dots=[...root.querySelectorAll('circle')];
    assert.equal(columns.length,25);columns.forEach(col=>assert.equal(col.children.length,8));assert.equal(dots.length,200);
    assert.equal(root.querySelectorAll('path,polygon,polyline').length,0,'不保留分布轮廓或天平');
    for(const ms of [0,450,900,1500,2150,3150,4150,5150,5550,6000]){
      player.seek(ms);
      const points=dots.map(dot=>({x:n(dot,'cx'),y:n(dot,'cy'),r:n(dot,'r')}));
      for(let i=0;i<points.length;i++){
        const a=points[i];assert.ok(a.x-a.r>0&&a.x+a.r<640&&a.y-a.r>0&&a.y+a.r<360,'点及半径不能越出画板');
        for(let j=i+1;j<points.length;j++){
          const b=points[j];assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>a.r+b.r+2,'波浪经过时圆点也应留有空隙');
        }
      }
      assert.deepEqual([...root.querySelectorAll('circle')],dots);
    }
    for(const col of columns){
      assert.equal(new Set([...col.children].map(dot=>n(dot,'cx'))).size,1);
      assert.deepEqual([...col.children].map(dot=>n(dot,'cy')),[96,120,144,168,192,216,240,264]);
    }
    assert.deepEqual(columns.map(col=>n(col.firstElementChild,'cx')),Array.from({length:25},(_,i)=>104+i*18));
    player.destroy();
  }finally{env.close();}
});

test('亮波按列从左向右扫过，圆点有相位起伏，结束与反向定位可稳定还原',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),player=w.MotionRuntime.create(root,effect);
    const columns=[...root.querySelectorAll('[data-col]')],peaks=[];
    for(const ms of [2150,2650,3150,3650,4150]){
      player.seek(ms);const radii=columns.map(col=>n(col.firstElementChild,'r'));
      peaks.push(radii.indexOf(Math.max(...radii)));
      assert.ok(Math.max(...radii)>4,'波峰可见地放大');
      assert.ok(Math.min(...radii)<3.3,'不同时激活所有列');
    }
    assert.ok(peaks.every((p,i)=>!i||p>peaks[i-1]));
    assert.ok([...root.querySelectorAll('circle')].some(dot=>Math.abs(n(dot,'cy')-(96+Number(dot.dataset.row)*24))>3),'点位随相位起伏');
    player.seek(0);const start=root.innerHTML;player.seek(150);assert.equal(root.innerHTML,start);
    player.seek(5550);const end=root.innerHTML;player.seek(6000);assert.equal(root.innerHTML,end);
    assert.ok([...root.querySelectorAll('circle')].every(dot=>n(dot,'r')===3.2));
    player.seek(3150);const middle=root.innerHTML;player.seek(700);player.seek(3150);assert.equal(root.innerHTML,middle);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true});
    player.seek(3150);assert.equal(observer.takeRecords().length,0);observer.disconnect();player.destroy();
  }finally{env.close();}
});

test('矩形波浪正式纳入且历史去重，旧名称能找到；距离传播仍独立，缩略图一致且原工程未改',async()=>{
  const historical=await history(data),cross=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
  assert.equal(effect.kind,'action');assert.equal(effect.category,'environment');
  assert.ok(!historical.recipes.some(e=>e.history_id==='tutorial-probability'));
  assert.ok(historical.excluded.some(e=>e.id==='tutorial-probability'));
  for(const file of cross.rules['tutorial-probability'].migration.files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256);
  const env=await environment(true,{staticPreview:true,hash:'#rect-wave-field'});
  try{
    const {w}=env,d=w.document;await env.reveal('[data-effect="rect-wave-field"] .thumb');assert.equal(d.getElementById('preview-title').textContent,effect.name);
    for(const query of [effect.name,'概率点阵收拢','概率场收拢'])assert.equal(w.MotionMatch.rank(data,query)[0].effect.id,effect.id);
    assert.equal(w.MotionMatch.rank(data,'波浪按距离传播')[0].effect.id,'wave-grid');
    const thumb=d.querySelector('[data-effect="rect-wave-field"] .thumb .motion-stage'),root=d.createElement('div');
    const player=w.MotionRuntime.create(root,effect);player.seek(effect.preview_ms);
    assert.equal(frameMarkup(thumb),frameMarkup(root.firstElementChild));player.destroy();
    assert.match(d.getElementById('code').textContent,/catalog\/effects\/rect-wave-field\.js/);
    assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});
