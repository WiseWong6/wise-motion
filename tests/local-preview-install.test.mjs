// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,lstat,link,symlink,readdir,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {installLocalPreview} from '../scripts/install-local-preview.mjs';

const effectId='point-domain-flow-sequence',painter='catalog/effects/point-domain-flow.js';
const sha256=value=>createHash('sha256').update(value).digest('hex');
async function fixture(t){
  const directory=await realpath(await mkdtemp(path.join(os.tmpdir(),'wise-local-preview-')));
  t.after(()=>rm(directory,{recursive:true,force:true}));
  const root=path.join(directory,'project'),video=path.join(directory,'verified.mp4'),reportPath=path.join(directory,'verified.json');
  await mkdir(path.join(root,'catalog/effects'),{recursive:true});
  const source='original painter';await writeFile(path.join(root,painter),source);
  const bytes=Buffer.alloc(64);bytes.writeUInt32BE(32,0);bytes.write('ftyp',4);bytes.write('isom',8);bytes.write('isomiso2avc1mp41',16);
  await writeFile(video,bytes);
  const report={completed:'2026-10-04T11:44:07.631Z',sourceChanged:[],fullDecodePassed:true,
    inputProps:{effectId,definition:{id:effectId},width:1280,height:720},
    composition:{width:1280,height:720,fps:60,durationInFrames:1553},
    video:{codec:'h264',fps:'60/1',frames:1553},bytes:bytes.length,hashes:{[painter]:sha256(source)},
    output:'/Users/private-user/unpublished-original.mp4'};
  const save=()=>writeFile(reportPath,JSON.stringify(report));await save();
  return {directory,root,video,reportPath,report,save,cache:path.join(root,'.local-previews'),install:()=>installLocalPreview(video,reportPath,{projectRoot:root})};
}

test('只复制到固定本地缓存，视频为独立实文件，清单不带机器路径',async t=>{
  const f=await fixture(t),result=await f.install();
  assert.equal(result.video,path.join(f.cache,effectId+'.mp4'));
  assert.equal(result.manifest,path.join(f.cache,effectId+'.json'));
  const original=await lstat(f.video),copy=await lstat(result.video);
  assert.equal(copy.isFile(),true);assert.equal(copy.isSymbolicLink(),false);assert.equal(copy.nlink,1);assert.notEqual(copy.ino,original.ino);
  assert.deepEqual(await readFile(result.video),await readFile(f.video));
  const text=await readFile(result.manifest,'utf8'),manifest=JSON.parse(text);
  assert.equal(manifest.generatedAt,f.report.completed);assert.equal(manifest.sourceHashes[painter],f.report.hashes[painter]);
  assert.doesNotMatch(text,/\/Users\/|private-user|unpublished-original|verified\.mp4/);
  await writeFile(f.video,'changed after copy');assert.equal((await readFile(result.video)).length,64);
  assert.deepEqual((await readdir(f.cache)).sort(),[effectId+'.json',effectId+'.mp4']);
});

test('源码过期拒绝安装，不修改已安装视频',async t=>{
  const f=await fixture(t),result=await f.install(),before=await readFile(result.video);
  await writeFile(path.join(f.root,painter),'modified painter');
  await assert.rejects(f.install(),/视频已过期/);
  assert.deepEqual(await readFile(result.video),before);
  assert.equal((await readdir(f.cache)).some(name=>name.includes('.pending-')),false);
});

for(const [name,change] of [
  ['渲染期间源码变化',r=>{r.sourceChanged=['catalog/runtime.js'];}],
  ['未通过完整解码',r=>{r.fullDecodePassed=false;}],
  ['错误动效',r=>{r.inputProps.effectId='other';}],
  ['错误画幅',r=>{r.composition.width=640;}],
  ['错误帧率',r=>{r.video.fps='30/1';}],
  ['错误帧数',r=>{r.video.frames=1552;}],
  ['错误文件大小',r=>{r.bytes=99;}],
  ['缺少绘制源码校验',r=>{r.hashes={};}],
  ['无效校验值',r=>{r.hashes[painter]='invalid';}],
  ['缺少生成时间',r=>{delete r.completed;}],
  ['上级路径',r=>{r.hashes['../outside.js']='0'.repeat(64);}],
  ['绝对路径',r=>{r.hashes['/outside.js']='0'.repeat(64);}],
  ['Windows路径',r=>{r.hashes['C:\\outside.js']='0'.repeat(64);}],
])test(name+'的报告拒绝安装',async t=>{
  const f=await fixture(t);change(f.report);await f.save();await assert.rejects(f.install());
  await assert.rejects(lstat(f.cache),{code:'ENOENT'});
});

test('拒绝伪装成 MP4 的输入',async t=>{
  const f=await fixture(t);await writeFile(f.video,Buffer.alloc(64));
  await assert.rejects(f.install(),/MP4 文件头/);
});

test('源码相对路径通过链接逃出工程也拒绝',async t=>{
  const f=await fixture(t),outside=path.join(f.directory,'outside.js');await writeFile(outside,'outside');
  await symlink(outside,path.join(f.root,'catalog/outside.js'));f.report.hashes['catalog/outside.js']=sha256('outside');await f.save();
  await assert.rejects(f.install(),/越过工程/);
});

for(const kind of ['directory','video-symlink','video-hardlink','manifest-symlink','manifest-hardlink'])test('拒绝缓存目标链接：'+kind,async t=>{
  const f=await fixture(t),outside=path.join(f.directory,'untouched');
  if(kind==='directory'){await mkdir(outside);await symlink(outside,f.cache);}
  else{
    await mkdir(f.cache);await writeFile(outside,'preserve external file');
    const target=path.join(f.cache,effectId+(kind.startsWith('video')?'.mp4':'.json'));
    if(kind.endsWith('symlink'))await symlink(outside,target);else await link(outside,target);
  }
  await assert.rejects(f.install(),/符号链接或硬链接/);
  if(kind==='directory')assert.deepEqual(await readdir(outside),[]);else assert.equal(await readFile(outside,'utf8'),'preserve external file');
});

test('已存在的普通缓存安全替换且没有残留临时文件',async t=>{
  const f=await fixture(t);await mkdir(f.cache);await writeFile(path.join(f.cache,effectId+'.mp4'),'old');await writeFile(path.join(f.cache,effectId+'.json'),'old');
  const result=await f.install();assert.equal((await lstat(result.video)).size,64);
  assert.equal((await readdir(f.cache)).some(name=>name.includes('.pending-')),false);
});
