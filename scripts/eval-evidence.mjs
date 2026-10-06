// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
// 与模型工作区分开保存初始证据；评分器不写文件，也不渲染。
import {readFile,readdir,lstat,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {checkPlan} from './plan.mjs';
const root=path.resolve(import.meta.dirname,'..');
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function treeSnapshot(directory){
  const files={};
  async function visit(relative){
    const absolute=path.join(directory,relative),info=await lstat(absolute);
    if(info.isSymbolicLink())throw new Error('评测素材不允许链接：'+relative);
    if(info.isDirectory())for(const name of (await readdir(absolute)).sort())await visit(path.join(relative,name));
    else if(info.isFile())files[relative]=digest(await readFile(absolute));
  }
  await visit('');return files;
}
export function compareSnapshot(before,after){
  return [...new Set([...Object.keys(before),...Object.keys(after)])].sort().filter(file=>before[file]!==after[file]).map(file=>({file,change:!(file in before)?'added':!(file in after)?'deleted':'modified'}));
}
export async function sourceSnapshot(){
  const paths=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{cwd:root}).toString().split('\0').filter(Boolean).sort();
  const files={};for(const file of paths)try{files[file]=digest(await readFile(path.join(root,file)));}catch(error){if(error.code!=='ENOENT')throw error;}
  return files;
}
async function save(file,data){
  // 权威产物边界检查同时阻止写入技能、符号链接和覆盖既有证据。
  const {assertRenderWrite}=await import('./output-boundary.mjs');
  await assertRenderWrite(file);await mkdir(path.dirname(file),{recursive:true});
  await writeFile(file,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
}
async function main(){
  const [command,input,output,planFile]=process.argv.slice(2);
  if(command==='snapshot'&&input&&output){
    await save(path.resolve(output),{version:1,createdAt:new Date().toISOString(),assets:path.resolve(input),files:await treeSnapshot(input),source:await sourceSnapshot(),plan:planFile?JSON.parse(await readFile(planFile,'utf8')):null});
  }else if(command==='check'&&input&&output){
    const raw=await readFile(input),plan=JSON.parse(raw),result=checkPlan(plan);
    await save(path.resolve(output),{version:1,kind:'check',createdAt:new Date().toISOString(),planSha256:digest(raw),plan,result});
    console.log(JSON.stringify(result,null,2));process.exitCode=result.errors.length?1:0;
  }else throw new Error('用法：snapshot <素材目录> <新证据.json> [初始计划]；check <计划.json> <本轮新证据.json>。设置 WISE_MOTION_RENDER_DIR 为源码外的评测根目录。');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
