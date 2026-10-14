// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdtemp, rm, mkdir, writeFile, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
import registry from '../catalog/registry.json' with {type: 'json'};
import {exportEffect, projectFor} from '../scripts/export.mjs';
import {environment} from './helpers.mjs';
const root=path.resolve(import.meta.dirname,'..');
const get=id=>registry.effects.find(e=>e.id===id);
const native=registry.effects.filter(e=>e.source.frame_cache);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('新动作精确定位最终1056帧，乱序与末帧稳定，旧条目不再占用运行素材',async()=>{
  assert.equal(native.length,9);
  const context={};runInNewContext(await readFile(path.join(root,'catalog/effects/time-in-motion-data.js'),'utf8'),context);
  const sample=context.WiseTimeInMotion.sample;
  for(const e of native){
    const c=e.source.frame_cache;
    assert.equal(c.frames/24*1000,e.duration_ms);
    assert.equal(sample(e.id,0).frame,c.start_frame);
    assert.equal(sample(e.id,e.duration_ms).frame,c.start_frame+c.frames-1);
    for(const ms of [0,41.666666667,400,1500,e.duration_ms,0,400]){
      assert.equal(sample(e.id,ms).frame,sample('time-in-motion-sequence',c.start_frame/24*1000+Math.min(ms,(c.frames-1)/24*1000)).frame);
    }
    if(e.kind==='action')assert.equal(e.audio,undefined);
  }
  assert.throws(()=>sample('inventory-contour-fit',NaN),/有限/);
  for(const id of ['precision-assembly-sequence','ordered-depth-assembly'])assert.equal(get(id),undefined);
  assert.equal(registry.redirects['precision-assembly-sequence'],'time-in-motion-sequence');
  const assets=JSON.parse(await readFile(path.join(root,'ASSET-MANIFEST.json'),'utf8')).files;
  assert.ok(assets.every(e=>!e.path.includes('precision-assembly')));
  assert.ok(assets.every(e=>!e.path.endsWith('.blend')&&!e.path.includes('/模型/')));
  assert.ok((await stat(path.join(root,'catalog/assets/time-in-motion/movie.mp4'))).size<10*1024*1024);
});

test('原机械运动与文字源码真实交付，独立导出可编译且没有嵌入大素材',async()=>{
  const temporary=await mkdtemp(path.join(tmpdir(),'wise-time-source-'));
  try{
    const out=await exportEffect('time-in-motion-sequence',{outDir:path.join(temporary,'film')});
    const spec=get('time-in-motion-sequence').source.remotion;
    for(const item of spec.binary_files){const bytes=await readFile(path.join(out.directory,item.target));assert.equal(hash(bytes),item.sha256);}
    const result=await build({entryPoints:[path.join(out.directory,'index.jsx')],bundle:true,write:false,format:'esm',platform:'node',external:['react','remotion'],logLevel:'silent'});
    assert.ok(result.outputFiles[0].text.includes('OffthreadVideo'));
    const editable=await build({entryPoints:[path.join(out.directory,'catalog/assets/time-in-motion/editable/Root.jsx')],bundle:true,write:false,format:'esm',platform:'node',external:['react','remotion'],logLevel:'silent'});
    assert.ok(editable.outputFiles[0].text.includes('THE ARCHITECTURE OF TIME'));
    const source=await readFile(path.join(out.directory,'catalog/assets/time-in-motion/production/project/修订版/源码/mechanics.py'),'utf8');
    assert.match(source,/def state\(t\)/);assert.match(source,/math\.radians\(145\)/);
    assert.ok(await stat(path.join(out.directory,'catalog/assets/time-in-motion/editable/graphics/KineticWord.jsx')));
    assert.equal(spawnSync(process.execPath,['catalog/assets/time-in-motion/verify-source.mjs'],{cwd:out.directory,encoding:'utf8'}).status,0);
    const project=await projectFor('word-block-rise');
    assert.ok(Object.keys(project.files).some(f=>f.endsWith('KineticWord.jsx')));
    for(const file of spec.files){const bytes=await readFile(path.join(root,file),'utf8');assert.doesNotMatch(bytes,/data:video\/[^;]+;base64,/);}
    const conflict=path.join(temporary,'conflict');await mkdir(conflict);await writeFile(path.join(conflict,'index.jsx'),'保留用户修改');
    await assert.rejects(exportEffect('inventory-contour-fit',{outDir:conflict}),/目标文件已存在/);
    assert.equal(await readFile(path.join(conflict,'index.jsx'),'utf8'),'保留用户修改');
  }finally{await rm(temporary,{recursive:true,force:true});}
});

test('词块和刻度按当前帧绘制，独立动作无声，完整组合拆解与关联保持一致',async()=>{
  const env=await environment(true,{staticPreview:true,hash:'#time-in-motion-sequence'});
  try{
    const {w}=env,d=w.document;
    assert.equal(w.MotionFactories['time-in-motion-sequence'].breakdown.length,13);
    d.querySelector('[data-composition-layer="Blueprint"]').click();
    assert.ok(Number(d.querySelector('#preview .motion-stage').dataset.nativeFrame)>=96);
    assert.ok([...d.querySelectorAll('[data-composition-mode]')].every(button=>button.hidden));
    const state=w.WiseTimeInMotionGraphics;
    assert.ok(state.wordState(0)[0].y>111);assert.equal(state.wordState(0)[1].visible,false);
    assert.ok(state.wordState(20).every(x=>Math.abs(x.y)<1e-5));
    assert.equal(state.dialState(48).angle,18);assert.equal(state.dialState(48).innerAngle,-9.36);
    const stage=d.createElement('div'),draw=w.MotionFactories['sparse-dial-counterturn'](stage);
    draw(1200);const saved=stage.innerHTML;draw(0);draw(4000);draw(1200);assert.equal(stage.innerHTML,saved);draw.destroy();
    assert.deepEqual(get('time-in-motion-sequence').actions.slice().sort(),[...new Set(w.MotionFactories['time-in-motion-sequence'].breakdown.flatMap(x=>x.actions))].sort());
  }finally{env.close();}
});
