// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {cp,mkdir,realpath,readdir,lstat,rm,readFile,writeFile,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
// 这组无损播放帧保留在源码仓库，npm 只带清单；不要把运行必需素材误归为制作原件。
export const isDownloadAsset=file=>/^catalog\/assets\/lego-kingdom\/layout\/frame-\d{3}\.webp$/.test(file.split(path.sep).join('/'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function assetDownloadUrl(version,file){
 if(!/^\d+\.\d+\.\d+$/.test(version)||!isDownloadAsset(file))throw Error('按需素材版本或路径无效');
 return `https://raw.githubusercontent.com/WiseWong6/wise-motion/v${version}/${file}`;
}
export async function downloadAsset(item,version,{fetchImpl=fetch}={}){
 const url=assetDownloadUrl(version,item.path);
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetchImpl(url,{signal:AbortSignal.timeout(60000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   const chunks=[];let size=0;
   for await(const chunk of response.body){
    size+=chunk.length;if(size>item.bytes)throw Error('文件大小不符');chunks.push(chunk);
   }
   const bytes=Buffer.concat(chunks);
   if(bytes.length!==item.bytes||hash(bytes)!==item.sha256)throw Error('文件大小或内容摘要不符');
   return bytes;
  }catch(error){
   if(attempt===2)throw Error('无法准备按需素材 '+item.path+'：'+error.message+'。请检查 GitHub 连接与版本标签，或使用完整源码离线安装。');
  }
 }
}
// 限制并发，所有下载成功并校验后才写目标工程。
export async function mapAssets(items,run){
 const results=new Array(items.length);let next=0;
 const workers=await Promise.allSettled(Array.from({length:Math.min(4,items.length)},async()=>{
  for(;;){const i=next++;if(i>=items.length)return;results[i]=await run(items[i]);}
 }));
 const failure=workers.find(result=>result.status==='rejected');if(failure)throw failure.reason;
 return results;
}
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
 const productionText=!normalized.startsWith('catalog/assets/time-in-motion/production/project/')||['.py','.json','.mjs','.jsx','.md','.txt'].includes(path.extname(normalized));
 return !['.DS_Store','.npmignore'].includes(path.basename(relativePath))&&!sourceOnlyFiles.has(normalized)&&productionText&&!['catalog/index.html','catalog/remotion-player.js'].includes(normalized);
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
export async function installAssets(destination,{overwrite=false,effectId,variantId}={}){
 const target=await validateAssetDestination(destination);
 const manifest=JSON.parse(await readFile(path.join(root,'ASSET-MANIFEST.json'),'utf8'));
 const {version}=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
 let selected;
 if(variantId&&!effectId)throw Error('--variant 必须同时指定 --effect');
 if(effectId){
  const registry=JSON.parse(await readFile(path.join(root,'catalog/registry.json'),'utf8'));
  const effect=registry.effects.find(item=>item.id===effectId);
  if(!effect)throw Error('未知动效：'+effectId);
  const variant=variantId?effect.variants?.find(item=>item.id===variantId):effect.variants?.[0];
  if(variantId&&!variant)throw Error('未知动效样式：'+effectId+'/'+variantId);
  selected=new Set((variant?.source||effect.source).assets||[]);
 }
 const downloads=manifest.files.filter(item=>isDownloadAsset(item.path)&&(!selected||selected.has(item.path)));
 const record=path.join(target,'.wise-motion-assets.json');
 for(const file of [record,record+'.tmp']){
  try{const info=await lstat(file);if(!info.isFile()||info.nlink>1)throw new Error('素材记录不得是链接或目录：'+file);}
  catch(error){if(error.code!=='ENOENT')throw error;}
 }
 let previous={};
 try{previous=JSON.parse(await readFile(record,'utf8')).files||{};}
 catch(error){if(error.code!=='ENOENT')throw new Error('无法读取已安装素材记录：'+error.message);}
 // 没选中的已安装大素材仍留在工程中，保留记录以继续保护本地修改。
 const files=Object.fromEntries(Object.entries(previous).filter(([file])=>isDownloadAsset(file))),conflicts=[];
 async function inspectTarget(relative,sourceHash){
  files[relative]=sourceHash;
  try{
   const file=path.join(target,relative),info=await lstat(file);
   if(!info.isFile()||info.nlink>1)throw new Error('素材目标必须是普通文件且不得覆盖硬链接：'+file);
   const current=hash(await readFile(file));
   if(!overwrite&&current!==sourceHash&&current!==previous[relative])conflicts.push(relative);
   return current===sourceHash;
  }catch(error){if(error.code!=='ENOENT')throw error;return false;}
 }
 async function inspect(directory){
  for(const entry of await readdir(path.join(root,directory),{withFileTypes:true})){
   const relative=path.join(directory,entry.name);
   if(entry.isDirectory()){await inspect(relative);continue;}
   if(!isAssetFile(relative)||isDownloadAsset(relative))continue;
   await inspectTarget(relative,hash(await readFile(path.join(root,relative))));
  }
 }
 // 全部检查通过再复制，避免发现冲突前已经覆盖部分项目文件。
 await inspect('catalog');await inspect('vendor');
 const needed=[];
 for(const item of downloads)if(!await inspectTarget(item.path,item.sha256))needed.push(item);
 if(conflicts.length)throw new Error('以下素材副本有本地修改，安装未执行：\n'+conflicts.join('\n')+'\n请保留修改；明确要替换时才使用 --overwrite。内容配置应写在项目源码或计划中。');
 const prepared=await mapAssets(needed,async item=>{
  let bytes;
  try{bytes=await readFile(path.join(root,item.path));}
  catch(error){if(error.code!=='ENOENT')throw error;bytes=await downloadAsset(item,version);}
  if(bytes.length!==item.bytes||hash(bytes)!==item.sha256)throw Error('素材清单与文件不符：'+item.path);
  return [item.path,bytes];
 });
 await mkdir(target,{recursive:true});
 for(const name of ['catalog','vendor'])await cp(path.join(root,name),path.join(target,name),{recursive:true,force:true,
  filter:async p=>(await lstat(p)).isDirectory()||(isAssetFile(path.relative(root,p))&&!isDownloadAsset(path.relative(root,p)))});
 for(const [relative,bytes]of prepared){const file=path.join(target,relative);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,bytes);}
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
 try{
  const [destination,...args]=process.argv.slice(2),options={};
  if(!destination||destination.startsWith('--'))throw Error('用法：node scripts/install-assets.mjs <目标工程/public/wise-motion> [--effect <动效>] [--variant <样式>] [--overwrite]');
  for(let i=0;i<args.length;i++){
   const flag=args[i];
   if(flag==='--overwrite'){options.overwrite=true;continue;}
   if(!['--effect','--variant'].includes(flag))throw Error('未知选项：'+flag);
   const value=args[++i];if(!value||value.startsWith('--'))throw Error(flag+' 后需要值');
   options[flag==='--effect'?'effectId':'variantId']=value;
  }
  console.log(await installAssets(destination,options));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
