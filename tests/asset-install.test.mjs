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
 }finally{await rm(temporary,{recursive:true,force:true});}
});
