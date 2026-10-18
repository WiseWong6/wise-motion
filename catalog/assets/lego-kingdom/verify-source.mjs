// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../../',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('binary-assets.json',root),'utf8'));
for(const file of manifest){
  const data=await readFile(new URL(file.target,root));
  if(data.length!==file.bytes || createHash('sha256').update(data).digest('hex')!==file.sha256)throw new Error('素材内容不符：'+file.target);
}
console.log('本地素材与导出清单一致。');
