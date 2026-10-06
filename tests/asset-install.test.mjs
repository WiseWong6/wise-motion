// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {installAssets} from '../scripts/install-assets.mjs';
import {FRAME_SCRIPTS,FRAME_STYLES} from '../remotion/frame-document.mjs';

test('素材安装移除旧版失效首页，保留所有绘制依赖和目标中的其它文件',async()=>{
 const temporary=await mkdtemp(path.join(tmpdir(),'wise-motion-assets-'));
 try{
  const target=path.join(temporary,'public/wise-motion');
  await mkdir(path.join(target,'catalog'),{recursive:true});
  await writeFile(path.join(target,'catalog/index.html'),'<script src="remotion-player.js"></script>');
  await writeFile(path.join(target,'catalog/local-cache.txt'),'keep');
  await installAssets(target);
  for(const file of ['catalog/index.html','catalog/remotion-player.js']){
   await assert.rejects(stat(path.join(target,file)),{code:'ENOENT'});
  }
  assert.equal(await readFile(path.join(target,'catalog/local-cache.txt'),'utf8'),'keep');
  const manifest=JSON.parse(await readFile(new URL('../ASSET-MANIFEST.json',import.meta.url),'utf8'));
  assert.ok(!manifest.files.some(file=>['catalog/index.html','catalog/remotion-player.js'].includes(file.path)));
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
  await writeFile(config,saved);
  await writeFile(modified,'// 项目的本地修改');await rm(missing);
  await assert.rejects(installAssets(target),/本地修改/);
  assert.equal(await readFile(modified,'utf8'),'// 项目的本地修改');
  await assert.rejects(stat(missing),{code:'ENOENT'}); // 冲突检查通过前不复制其它文件。
  await installAssets(target,{overwrite:true});
  assert.match(await readFile(modified,'utf8'),/count-up/);
  assert.equal(await readFile(config,'utf8'),saved);
  // 模拟目标还在上一版本：文件等于上次安装记录，允许正常更新。
  const recordFile=path.join(target,'.wise-motion-assets.json');
  const record=JSON.parse(await readFile(recordFile,'utf8'));
  await writeFile(modified,'// 未经修改的旧版本');
  record.files['catalog/effects/attention.js']=createHash('sha256').update('// 未经修改的旧版本').digest('hex');
  await writeFile(recordFile,JSON.stringify(record));await installAssets(target);
  assert.match(await readFile(modified,'utf8'),/count-up/);
 }finally{await rm(temporary,{recursive:true,force:true});}
});
