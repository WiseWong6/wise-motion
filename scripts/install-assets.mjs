// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {cp,mkdir,realpath,readdir,lstat,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
// 素材副本供帧组件读取；完整目录页面只保留在源码的 catalog 中。
export function isAssetFile(relativePath){
 const normalized=relativePath.split(path.sep).join('/');
 return path.basename(relativePath)!=='.DS_Store'&&!['catalog/index.html','catalog/remotion-player.js'].includes(normalized);
}
const contains=(parent,child)=>child===parent||child.startsWith(parent+path.sep);
async function canonicalPath(value){
 const absolute=path.resolve(value);
 try{return await realpath(absolute);}
 catch(error){
  if(error.code!=='ENOENT')throw error;
  const parent=path.dirname(absolute);
  if(parent===absolute)throw error;
  return path.join(await canonicalPath(parent),path.basename(absolute));
 }
}
async function rejectLinkedDestinations(directory){
 let entries;
 try{entries=await readdir(directory,{withFileTypes:true});}
 catch(error){if(error.code==='ENOENT')return;throw error;}
 for(const entry of entries){
  if(entry.isSymbolicLink())throw new Error('素材目标内不得包含符号链接：'+path.join(directory,entry.name));
  if(entry.isDirectory())await rejectLinkedDestinations(path.join(directory,entry.name));
 }
}
export async function validateAssetDestination(destination=path.join(root,'public/wise-motion')){
 const requested=path.resolve(destination),source=await canonicalPath(root),target=await canonicalPath(requested);
 if(contains(target,source))throw new Error('素材目标不得覆盖源码根目录或上层目录');
 // 目录制作只写自身 public；独立复用的调用方须显式传入某工程 public 内的子目录。
 const parts=requested.split(path.sep),publicIndex=parts.lastIndexOf('public');
 if(publicIndex<0||publicIndex===parts.length-1)throw new Error('素材目标必须是显式工程 public 下的子目录');
 const publicRoot=await canonicalPath(parts.slice(0,publicIndex+1).join(path.sep)||path.sep);
 if(!contains(publicRoot,target)||target===publicRoot)throw new Error('素材目标必须位于对应 public 子目录内');
 if(contains(source,target)&&!contains(await canonicalPath(path.join(source,'public')),target))throw new Error('当前源码内只能安装到 public 子目录');
 // 检查将要覆盖的两棵目录，防止内部链接把复制结果带到目标之外。
 for(const name of ['catalog','vendor']){
  const nested=path.join(target,name);
  try{if((await lstat(nested)).isSymbolicLink())throw new Error('素材目标内不得包含符号链接：'+nested);}
  catch(error){if(error.code!=='ENOENT')throw error;}
  await rejectLinkedDestinations(nested);
 }
 return target;
}
export async function installAssets(destination){
 const target=await validateAssetDestination(destination);
 await mkdir(target,{recursive:true});
 for(const name of ['catalog','vendor'])await cp(path.join(root,name),path.join(target,name),{recursive:true,force:true,filter:p=>isAssetFile(path.relative(root,p))});
 // 旧版曾复制首页但没有播放器，更新时移除这一个已知失效入口。
 await rm(path.join(target,'catalog/index.html'),{force:true});
 return target;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!process.argv[2])throw new Error('用法：node scripts/install-assets.mjs <目标工程/public/wise-motion>');
 console.log(await installAssets(process.argv[2]));
}
