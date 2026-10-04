// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {lstat,readdir,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const within=(base,target)=>{const relative=path.relative(base,target);return relative===''||relative!=='..'&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative);};
async function resolvedTarget(target){
 try{return await realpath(target);}catch(error){if(error.code!=='ENOENT')throw error;const parent=path.dirname(target);if(parent===target)throw error;return path.join(await resolvedTarget(parent),path.basename(target));}
}
async function rejectSharedTree(target){
 let info;try{info=await lstat(target);}catch(error){if(error.code==='ENOENT')return;throw error;}
 if(info.isSymbolicLink()||info.isFile()&&info.nlink>1)throw new Error('写入目标不能通过链接共享可修改内容：'+target);
 if(info.isDirectory())for(const name of await readdir(target))await rejectSharedTree(path.join(target,name));
}
export async function assertProjectWrite(target){
 const absolute=path.resolve(target);
 const allowed=[await realpath(root)];
 const base=allowed.find(base=>within(base,absolute));
 if(base){let ancestor=base;for(const segment of path.relative(base,absolute).split(path.sep).filter(Boolean)){ancestor=path.join(ancestor,segment);try{if((await lstat(ancestor)).isSymbolicLink())throw new Error('写入路径不能穿过符号链接：'+ancestor);}catch(error){if(error.code==='ENOENT')break;throw error;}}}
 const actual=await resolvedTarget(absolute);
 if(!allowed.some(base=>within(base,absolute)&&within(base,actual)))throw new Error('写入目标越过当前工程目录：'+target);
 await rejectSharedTree(absolute);return absolute;
}

// 视频是独立产物，不写入技能源码；环境变量可选定其他工程的独立输出目录。
async function rejectSymbolicAncestors(target){
 const absolute=path.resolve(target);let current=path.parse(absolute).root;
 for(const segment of absolute.slice(current.length).split(path.sep).filter(Boolean)){
  current=path.join(current,segment);
  try{if((await lstat(current)).isSymbolicLink())throw new Error('视频输出路径不能穿过符号链接：'+current);}
  catch(error){if(error.code==='ENOENT')break;throw error;}
 }
}
export async function getRenderDirectory(){
 const configured=process.env.WISE_MOTION_RENDER_DIR?.trim();
 const directory=path.resolve(configured||path.resolve(root,'../../state/wise-motion/renders'));
 const source=await realpath(root),actual=await resolvedTarget(directory);
 if(within(source,actual)||within(actual,source)||within(root,directory)||within(directory,root))throw new Error('视频输出目录不得位于技能源码内或使用其祖先目录');
 await rejectSymbolicAncestors(directory);
 try{if(!(await lstat(directory)).isDirectory())throw new Error('视频输出根必须是目录：'+directory);}
 catch(error){if(error.code!=='ENOENT')throw error;}
 return directory;
}
export async function assertRenderWrite(target){
 const directory=await getRenderDirectory(),absolute=path.resolve(target);
 if(absolute===directory||!within(directory,absolute))throw new Error('视频输出只能位于指定的产物目录内：'+directory);
 await rejectSymbolicAncestors(absolute);
 if(!within(await resolvedTarget(directory),await resolvedTarget(absolute)))throw new Error('视频输出路径越过产物目录');
 await rejectSharedTree(absolute);
 return absolute;
}
export async function resolveRenderOutput(target,effectId){
 if(target===undefined){
  if(typeof effectId!=='string'||!/^[a-z0-9-]+$/i.test(effectId))throw new Error('默认视频文件名需要有效动效名称');
  target=effectId+'.mp4';
 }
 if(typeof target!=='string'||path.extname(target).toLowerCase()!=='.mp4')throw new Error('视频目标必须是产物目录中的 .mp4 文件');
 return assertRenderWrite(path.resolve(await getRenderDirectory(),target));
}
