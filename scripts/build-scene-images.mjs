// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
// 将无损 WebP 原字节封装为按需脚本，避免本地直开和独立预览读取像素时受跨来源限制。
import {readFile,writeFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const checking=process.argv.includes('--check');
for(const family of ['selfie','letter']){
  const directory=new URL('../catalog/assets/scene-sources/'+family+'/',import.meta.url);
  const images={};
  for(const name of (await readdir(directory)).filter(name=>name.endsWith('.webp')).sort()){
    images['assets/scene-sources/'+family+'/'+name]='data:image/webp;base64,'+(await readFile(new URL(name,directory))).toString('base64');
  }
  const source='/* 无损 WebP 原字节封装；AGPL-3.0-only，来源记录见 assets/WEBP-SOURCES.json。 */\n'+
    'globalThis.WiseSceneImageData=Object.assign(globalThis.WiseSceneImageData||{},'+JSON.stringify(images)+');\n';
  const output=new URL('../catalog/effects/scene-'+family+'-images.js',import.meta.url);
  if(checking)assert.equal(await readFile(output,'utf8'),source,family+' 原图片封装与原件不同');
  else await writeFile(output,source);
}
