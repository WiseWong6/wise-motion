// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {state} from '../scripts/history.mjs';

const crosswalk=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
const evidence=JSON.parse(await readFile(state+'/source-evidence.json','utf8'));
const records=[...evidence,...Object.values(crosswalk.rules).flatMap(rule=>rule.migration?.files||[])];
const cached=new Map();

// 对照收录时的原作；原工程可以继续创作，历史指纹不能随之改成新预期。
export async function readHistorySource(source,encoding){
  const record=typeof source==='string'?records.find(record=>record.file===source):source;
  assert.ok(record?.sha256,'缺少历史来源指纹：'+source);
  const key=record.file+'#'+record.sha256;
  if(!cached.has(key))cached.set(key,(async()=>{
    const candidates=[record.file,
      record.file.replace('/scenes/未完成/小葵和我的短片/','/scenes/小葵和我的短片/'),
      record.file.replace('/scenes/星月来信/','/scenes/motion-catalog/packs/completed/source/letter/')];
    const matches=bytes=>createHash('sha256').update(bytes).digest('hex')===record.sha256;
    for(const file of new Set(candidates)){
      try{const bytes=await readFile(file);if(matches(bytes))return bytes;}
      catch(error){if(error.code!=='ENOENT')throw error;}
    }
    // 简历原作的收录版本保存在其 Git 历史中；只读提取并核对原指纹。
    const root='/Users/wisewong/Documents/Developer/wise-video/';
    if(record.file.startsWith(root)){
      const bytes=execFileSync('git',['-C',root,'show','3a2ef4d53823a26762f6b27ff65a6865ee0ef68f:'+record.file.slice(root.length)],{maxBuffer:8*1024*1024});
      if(matches(bytes))return bytes;
    }
    throw new Error('找不到指纹一致的历史原作：'+record.file);
  })());
  const bytes=await cached.get(key);
  return encoding?bytes.toString(encoding):Buffer.from(bytes);
}
