// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {cp,mkdir,realpath,readdir,lstat,rm,readFile,writeFile,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
// 仅供源码重建的原件；分发排除规则同步见 catalog/.npmignore、vendor/.npmignore。
const sourceOnlyFiles=new Set([
 'catalog/assets/scene-sources/letter/fonts/LXGWWenKai-Regular.ttf',
 'vendor/calligraphy/I.Ngaan.ttf',
 'vendor/duobaota/page-02.jpg',
 'vendor/duobaota/page-10.jpg',
]);
// 素材副本供帧组件读取；完整目录页面只保留在源码的 catalog 中。
export function isAssetFile(relativePath){
 const normalized=relativePath.split(path.sep).join('/');
 return !['.DS_Store','.npmignore'].includes(path.basename(relativePath))&&!sourceOnlyFiles.has(normalized)&&!['catalog/index.html','catalog/remotion-player.js'].includes(normalized);
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
export async function installAssets(destination,{overwrite=false}={}){
 const target=await validateAssetDestination(destination);
 const record=path.join(target,'.wise-motion-assets.json');
 for(const file of [record,record+'.tmp']){
  try{const info=await lstat(file);if(!info.isFile()||info.nlink>1)throw new Error('素材记录不得是链接或目录：'+file);}
  catch(error){if(error.code!=='ENOENT')throw error;}
 }
 let previous={};
 try{previous=JSON.parse(await readFile(record,'utf8')).files||{};}
 catch(error){if(error.code!=='ENOENT')throw new Error('无法读取已安装素材记录：'+error.message);}
 const files={},conflicts=[];
 const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
 async function inspect(directory){
  for(const entry of await readdir(path.join(root,directory),{withFileTypes:true})){
   const relative=path.join(directory,entry.name);
   if(entry.isDirectory()){await inspect(relative);continue;}
   if(!isAssetFile(relative))continue;
   const sourceHash=hash(await readFile(path.join(root,relative)));files[relative]=sourceHash;
   try{
    const file=path.join(target,relative),info=await lstat(file);
    if(info.nlink>1)throw new Error('素材目标不得覆盖硬链接：'+file);
    const current=hash(await readFile(file));
    if(!overwrite&&current!==sourceHash&&current!==previous[relative])conflicts.push(relative);
   }catch(error){if(error.code!=='ENOENT')throw error;}
  }
 }
 // 全部检查通过再复制，避免发现冲突前已经覆盖部分项目文件。
 await inspect('catalog');await inspect('vendor');
 if(conflicts.length)throw new Error('以下素材副本有本地修改，安装未执行：\n'+conflicts.join('\n')+'\n请保留修改；明确要替换时才使用 --overwrite。内容配置应写在项目源码或计划中。');
 await mkdir(target,{recursive:true});
 for(const name of ['catalog','vendor'])await cp(path.join(root,name),path.join(target,name),{recursive:true,force:true,filter:p=>isAssetFile(path.relative(root,p))});
 // 升级时只清理有安装记录且内容未被用户修改的旧文件。
 for(const relative of [...sourceOnlyFiles,'catalog/index.html']){
  if(!previous[relative])continue;
  const file=path.join(target,relative);
  try{
   const info=await lstat(file);
   if(info.isFile()&&info.nlink===1&&hash(await readFile(file))===previous[relative])await rm(file);
  }catch(error){if(error.code!=='ENOENT')throw error;}
 }
 const pending=record+'.tmp';
 await writeFile(pending,JSON.stringify({version:1,files},null,2)+'\n');
 await rename(pending,record);
 return target;
}
// 经 node_modules 符号链接（如 npm 安装本地目录）调用时，argv[1] 不是真实路径，须先解析再比较，否则会无提示地什么也不做。
const invokedDirectly=process.argv[1]&&await realpath(process.argv[1]).then(file=>file===fileURLToPath(import.meta.url),()=>false);
if(invokedDirectly){
 if(!process.argv[2])throw new Error('用法：node scripts/install-assets.mjs <目标工程/public/wise-motion>');
 console.log(await installAssets(process.argv[2],{overwrite:process.argv.includes('--overwrite')}));
}
