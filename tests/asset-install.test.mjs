// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {installAssets} from '../scripts/install-assets.mjs';
import {FRAME_SCRIPTS,FRAME_STYLES} from '../remotion/frame-document.mjs';
const sourceOnly=[
 'vendor/duobaota/page-02.jpg','vendor/duobaota/page-10.jpg',
 'vendor/calligraphy/I.Ngaan.ttf','catalog/assets/scene-sources/letter/fonts/LXGWWenKai-Regular.ttf',
];
const retained=[
 'catalog/fonts/LXGWWenKai-Regular.woff2',
 'catalog/assets/scene-sources/letter/fonts/MaShanZheng-Regular.ttf',
 'vendor/duobaota/SOURCE.json','vendor/duobaota/README.md',
 'vendor/calligraphy/SOURCE.json','vendor/calligraphy/GPL-2.0.txt','vendor/calligraphy/README.md',
 'vendor/calligraphy/prepare-calligraphy.py',
];

test('实际分发清单排除重建原件和文档预览，保留运行字体与来源许可',()=>{
 const result=spawnSync('npm',['pack','--dry-run','--json','--ignore-scripts'],{
  cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8',maxBuffer:4*1024*1024,
 });
 assert.equal(result.status,0,result.stderr);
 const files=new Set(JSON.parse(result.stdout)[0].files.map(file=>file.path));
 for(const file of sourceOnly)assert.ok(!files.has(file),'原件不应进入分发：'+file);
 for(const file of retained)assert.ok(files.has(file),'分发遗漏依赖或署名：'+file);
 assert.ok(![...files].some(file=>file.startsWith('docs/previews/')));
});

test('素材安装移除旧版失效首页，保留所有绘制依赖和目标中的其它文件',async()=>{
 const temporary=await mkdtemp(path.join(tmpdir(),'wise-motion-assets-'));
 try{
  const target=path.join(temporary,'public/wise-motion');
  await mkdir(path.join(target,'catalog'),{recursive:true});
  const homepage='<script src="remotion-player.js"></script>';
  await writeFile(path.join(target,'catalog/index.html'),homepage);
  await writeFile(path.join(target,'.wise-motion-assets.json'),JSON.stringify({version:1,files:{
   'catalog/index.html':createHash('sha256').update(homepage).digest('hex'),
  }}));
  await writeFile(path.join(target,'catalog/local-cache.txt'),'keep');
  await installAssets(target);
  for(const file of sourceOnly){
   assert.ok((await stat(new URL('../'+file,import.meta.url))).isFile(),'源码原件仍可重建：'+file);
   await assert.rejects(stat(path.join(target,file)),{code:'ENOENT'});
  }
  for(const file of retained)assert.ok((await stat(path.join(target,file))).isFile(),file);
  for(const file of ['catalog/index.html','catalog/remotion-player.js']){
   await assert.rejects(stat(path.join(target,file)),{code:'ENOENT'});
  }
  assert.equal(await readFile(path.join(target,'catalog/local-cache.txt'),'utf8'),'keep');
  const manifest=JSON.parse(await readFile(new URL('../ASSET-MANIFEST.json',import.meta.url),'utf8'));
  assert.ok(!manifest.files.some(file=>['catalog/index.html','catalog/remotion-player.js'].includes(file.path)));
  assert.ok(!manifest.files.some(file=>sourceOnly.includes(file.path)));
  for(const file of manifest.files){
   const bytes=await readFile(path.join(target,file.path));
   assert.equal(bytes.length,file.bytes,file.path);
   assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path);
  }
  for(const file of [...FRAME_SCRIPTS,...FRAME_STYLES]){
   assert.ok(manifest.files.some(entry=>entry.path===file),'素材清单缺少绘制依赖：'+file);
  }
  const modified=path.join(target,'catalog/effects/attention.js'),missing=path.join(target,'catalog/content.js');
  const config=path.join(temporary,'plan.json'),saved=JSON.stringify({content:{text:'保留我的内容'}});
  const homepagePath=path.join(target,'catalog/index.html');
  await writeFile(homepagePath,'用户自建首页');
  await writeFile(config,saved);
  await writeFile(modified,'// 项目的本地修改');await rm(missing);
  await assert.rejects(installAssets(target),/本地修改/);
  assert.equal(await readFile(modified,'utf8'),'// 项目的本地修改');
  await assert.rejects(stat(missing),{code:'ENOENT'}); // 冲突检查通过前不复制其它文件。
  await installAssets(target,{overwrite:true});
  assert.match(await readFile(modified,'utf8'),/count-up/);
  assert.equal(await readFile(config,'utf8'),saved);
  assert.equal(await readFile(homepagePath,'utf8'),'用户自建首页','未登记首页在允许覆盖素材时也保留');
  // 模拟目标还在上一版本：文件等于上次安装记录，允许正常更新。
  const recordFile=path.join(target,'.wise-motion-assets.json');
  const record=JSON.parse(await readFile(recordFile,'utf8'));
  record.files['catalog/index.html']=createHash('sha256').update(homepage).digest('hex');
  await writeFile(homepagePath,'用户修改过的旧首页');
  // 旧版原件：未改动的移除；用户改写或没有安装记录的副本保留。
  for(const [i,file]of sourceOnly.entries()){
   const destination=path.join(target,file);await mkdir(path.dirname(destination),{recursive:true});
   await writeFile(destination,i===1?'用户修改':'旧版原件');
   if(i!==2)record.files[file]=createHash('sha256').update('旧版原件').digest('hex');
  }
  await writeFile(modified,'// 未经修改的旧版本');
  record.files['catalog/effects/attention.js']=createHash('sha256').update('// 未经修改的旧版本').digest('hex');
  await writeFile(recordFile,JSON.stringify(record));await installAssets(target);
  assert.match(await readFile(modified,'utf8'),/count-up/);
  for(const i of [0,3])await assert.rejects(stat(path.join(target,sourceOnly[i])),{code:'ENOENT'});
  assert.equal(await readFile(path.join(target,sourceOnly[1]),'utf8'),'用户修改');
  assert.equal(await readFile(path.join(target,sourceOnly[2]),'utf8'),'旧版原件');
  assert.equal(await readFile(homepagePath,'utf8'),'用户修改过的旧首页','已登记但修改过的首页保留');
  assert.ok(!JSON.parse(await readFile(recordFile,'utf8')).files['catalog/index.html'],'保留的用户首页不登记为可覆盖素材');
 }finally{await rm(temporary,{recursive:true,force:true});}
});
