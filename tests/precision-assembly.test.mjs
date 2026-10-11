// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,realpath,rm,mkdir,writeFile,stat,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {spawnSync} from 'node:child_process';
import {build} from 'esbuild';
import registry from '../catalog/registry.json' with {type:'json'};
import {exportEffect,projectFor} from '../scripts/export.mjs';
import {environment} from './helpers.mjs';

const root=path.resolve(import.meta.dirname,'..');
const effect=id=>registry.effects.find(e=>e.id===id);
const ids=['ordered-depth-assembly','precision-assembly-sequence'];
const hash=b=>createHash('sha256').update(b).digest('hex');
async function temporary(run){
  const dir=await realpath(await mkdtemp(path.join(tmpdir(),'wise-precision-')));
  try{return await run(dir);}finally{await rm(dir,{recursive:true,force:true});}
}

test('完整组合只关联缺失拆装机制，独立动作使用同一原生帧并无音轨',async()=>{
  const a=effect(ids[0]),c=effect(ids[1]);
  assert.deepEqual(c.actions,[a.id]);assert.equal(a.duration_ms,8000);assert.equal(c.duration_ms,22000);
  assert.equal(a.audio,undefined);assert.equal(c.audio.tracks.length,1);
  assert.deepEqual(a.source.remotion.binary_files,c.source.remotion.binary_files);
  const context={};runInNewContext(await readFile(path.join(root,'catalog/effects/precision-assembly-data.js'),'utf8'),context);
  const sample=context.WisePrecisionAssembly.sample;
  for(const ms of [0,1,41.666666667,999.5,4000,7999,8000,500,0,8000,4000]){
    assert.equal(sample(a.id,ms).frame,sample(c.id,10000+ms).frame-(ms===8000?1:0));
    assert.equal(sample(a.id,ms).frame,sample(a.id,ms).frame,'乱序与重复定位必须稳定');
  }
  assert.equal(sample(a.id,0).blenderFrame,241);assert.equal(sample(a.id,8000).blenderFrame,432);
  assert.equal(sample(c.id,22000).blenderFrame,528);
  assert.throws(()=>sample(a.id,NaN),/有限/);
});

test('真实工程与媒体按摘要复制，源码可编译，文字复制包含建模与安全素材准备程序',async()=>temporary(async dir=>{
  const c=effect(ids[1]),out=await exportEffect(c.id,{outDir:path.join(dir,'scene')});
  assert.equal(out.kind,'standalone');
  for(const asset of c.source.remotion.binary_files){
    const bytes=await readFile(path.join(out.directory,asset.target));
    assert.equal(bytes.length,asset.bytes);assert.equal(hash(bytes),asset.sha256);
  }
  assert.ok((await stat(path.join(out.directory,'public/precision-assembly/打开与制作.command'))).mode&0o100);
  const pkg=JSON.parse(await readFile(path.join(out.directory,'package.json'),'utf8'));
  assert.ok(pkg.scripts['check:source']);assert.ok(pkg.scripts['rebuild:scene']);assert.ok(pkg.scripts['render:scene']);
  const index=await readFile(path.join(out.directory,'index.jsx'),'utf8');
  assert.match(index,/durationInFrames=\{528\}/);
  const compiled=await build({entryPoints:[path.join(out.directory,'index.jsx')],bundle:true,write:false,format:'esm',platform:'node',external:['react','remotion'],logLevel:'silent'});
  assert.ok(compiled.outputFiles[0].text.includes('OffthreadVideo'));
  const context={};
  for(const f of ['catalog/runtime.js','catalog/content.js','catalog/remotion-sources.js','catalog/export.js'])runInNewContext(await readFile(path.join(root,f),'utf8'),context);
  const text=context.MotionExport.remotionCode(c);
  assert.ok(text.includes('def build_movement'));assert.ok(text.includes('def build_case'));
  assert.ok(text.includes('def animate_layers'));assert.ok(text.includes('def main()'));
  assert.ok(!text.includes('/Users/'));assert.ok(!text.includes('base64,'));
  for(const [file,content]of Object.entries(context.MotionExport.projectFiles(c).files))assert.equal(await readFile(path.join(out.directory,file),'utf8'),content);
  // The copied-text setup must also work without export.mjs or the original project.
  await rm(path.join(out.directory,'public/precision-assembly/分秒之间.blend'));
  const install=spawnSync(process.execPath,['prepare-assets.mjs',root],{cwd:out.directory,encoding:'utf8'});
  assert.equal(install.status,0,install.stderr);
  await writeFile(path.join(out.directory,'public/precision-assembly/分秒之间.blend'),'用户修改');
  const conflict=spawnSync(process.execPath,['prepare-assets.mjs',root],{cwd:out.directory,encoding:'utf8'});
  assert.notEqual(conflict.status,0);assert.match(conflict.stderr,/已有文件不同/);
  assert.equal(await readFile(path.join(out.directory,'public/precision-assembly/分秒之间.blend'),'utf8'),'用户修改');
}));

test('二进制目标冲突在写入之前整批停止，独立动作准确导出192帧',async()=>temporary(async dir=>{
  const target=path.join(dir,'conflict');await mkdir(path.join(target,'public/precision-assembly'),{recursive:true});
  await writeFile(path.join(target,'public/precision-assembly/分秒之间.blend'),'保留用户工程');
  await assert.rejects(exportEffect(ids[0],{outDir:target}),/目标文件已存在/);
  assert.deepEqual(await readdir(target),['public']);
  const project=await projectFor(ids[0]);
  assert.match(project.files['index.jsx'],/durationInFrames=\{192\}/);
  assert.ok(project.files['package.json'].includes('--part assembly'));
}));

test('缩略图与帧表按需载入，不提前读取视频或真实工程',async()=>{
  const page=await environment(true,{staticPreview:true,lazyAssets:true});
  try{
    assert.deepEqual(page.lazyRequests,[]);
    await page.w.MotionLazy.ensure(effect(ids[0]));
    assert.deepEqual(page.lazyRequests,['effects/precision-assembly-data.js','effects/precision-assembly.js']);
    const factory=page.w.MotionFactories[ids[0]],stage=page.w.document.createElement('div');
    const render=factory(stage,page.w.MotionKit,effect(ids[0]));await render.ready;render(4125);
    assert.ok(stage.querySelector('img').src.endsWith(encodeURI('/成片/分层.png')));
    assert.equal(stage.querySelector('video'),null);assert.equal(stage.dataset.nativeFrame,'340');
    render.destroy(true);assert.ok(stage.querySelector('img'));render.destroy(false);
  }finally{page.close();}
});

test('完整三维组合按镜头定位，拆装片段不伪装为可隐藏的二维图层',async()=>{
  const page=await environment(true,{staticPreview:true,hash:'#precision-assembly-sequence'});
  try{
    const {w}=page,d=w.document;
    await new Promise(resolve=>setImmediate(resolve));
    const modes=[...d.querySelectorAll('[data-composition-mode]')];
    assert.ok(modes.every(button=>button.hidden));
    d.querySelector('[data-composition-layer="assembly"]').click();
    assert.equal(d.querySelector('#preview .motion-stage').dataset.nativeFrame,'337');
    assert.match(d.getElementById('composition-status').textContent,/查看片段：分层拆解与回装/);
    assert.equal(w.MotionRuntime.runningCount,0);
    assert.equal(d.querySelector('#preview [data-composition-hidden]'),null);
    d.querySelector('[data-effect="paper-spiral-sequence"]').click();
    assert.ok(modes.every(button=>!button.hidden),'切回普通组合恢复图层模式');
  }finally{page.close();}
});
