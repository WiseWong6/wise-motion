// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {readFile}from'node:fs/promises';import{createHash}from'node:crypto';
const root=new URL('../../../',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('binary-assets.json',root),'utf8'));
for(const item of manifest){const bytes=await readFile(new URL(item.target,root));if(bytes.length!==item.bytes||createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error('素材不匹配：'+item.target);}
console.log('已核对 '+manifest.length+' 个原始素材。');
