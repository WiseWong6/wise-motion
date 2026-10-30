// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(await readFile(new URL('../../../binary-assets.json',import.meta.url),'utf8'));
for(const asset of manifest){const data=await readFile(new URL('../../../'+asset.target,import.meta.url));if(data.length!==asset.bytes||createHash('sha256').update(data).digest('hex')!==asset.sha256)throw Error('本地素材不完整：'+asset.target);}
console.log('本地字体完整，运行不依赖原工程。');
