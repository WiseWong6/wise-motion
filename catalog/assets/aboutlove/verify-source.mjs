// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const assets=JSON.parse(await readFile(path.join(root,'binary-assets.json'),'utf8'));
for(const asset of assets){
 if(path.isAbsolute(asset.target)||asset.target.split('/').includes('..'))throw Error('素材目标路径无效');
 const raw=await readFile(path.join(root,asset.target));
 if(raw.length!==asset.bytes||createHash('sha256').update(raw).digest('hex')!==asset.sha256)throw Error('字体或原声文件不完整：'+asset.target);
}
for(const file of ['catalog/remotion/aboutlove.jsx','catalog/effects/aboutlove.js','catalog/effects/aboutlove-clock.js','catalog/effects/aboutlove-data.js','catalog/effects/aboutlove-entries.js','catalog/effects/aboutlove-fonts.js','catalog/assets/aboutlove/SOURCE.json']){
 if(!(await stat(path.join(root,file))).isFile())throw Error('缺少绘制源码：'+file);
}
console.log('绘制源码及 '+assets.length+' 个本地字体、原声文件检查通过。');
