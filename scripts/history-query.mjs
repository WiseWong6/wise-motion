// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {history} from './history.mjs';
const registry=JSON.parse(await readFile(new URL('../catalog/registry.json',import.meta.url),'utf8'));
const data=await history(registry),query=process.argv.slice(2).join(' ').trim();
const {describe}=createRequire(import.meta.url)('../catalog/matching.js');
if(!query){console.error('用法：node scripts/history-query.mjs "原条目名称或标识"');process.exitCode=1;}
else{
  const exact=data.recipes.filter(r=>[r.id,r.history_id,r.name].includes(query));
  const matches=exact.length?exact:data.recipes.filter(r=>r.name.includes(query)||r.aliases.includes(query));
  if(!matches.length){console.log('没有找到历史配方。');process.exitCode=1;}
  else if(matches.length>1)console.log(matches.map(r=>r.name+'：'+r.history_id).join('\n')+'\n请按上面的具体名称或标识读取单项。');
  else{
    const r=matches[0];console.log(describe(r,{},registry));
    console.log('\n案例级源码：');
    for(const entry of r.entries){console.log('\n'+entry.name+'，预览 '+entry.preview.duration+' 秒。');for(const ref of entry.code)console.log(ref.file+'\n'+ref.anchors.map(a=>a.symbol+'（第 '+a.line+' 行）').join('、'));}
  }
}
