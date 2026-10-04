// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {lstat,mkdir,open,readFile,realpath,rename,rm} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const effectId='point-domain-flow-sequence';
const painter='catalog/effects/point-domain-flow.js';
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const inside=(root,target)=>target===root||target.startsWith(root+path.sep);
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

async function targetInfo(target,directory=false){
  let info;
  try{info=await lstat(target);}catch(error){if(error.code==='ENOENT')return;throw error;}
  if(info.isSymbolicLink()||info.isFile()&&info.nlink!==1)throw new Error('本地预览目标不得使用符号链接或硬链接：'+target);
  if(directory?!info.isDirectory():!info.isFile())throw new Error('本地预览目标类型不正确：'+target);
}

function validateReport(report){
  if(!object(report)||!Array.isArray(report.sourceChanged)||report.sourceChanged.length||report.fullDecodePassed!==true)
    throw new Error('视频报告必须确认完整解码通过，且渲染期间源码未变化');
  if(report.inputProps?.effectId!==effectId||report.inputProps?.definition?.id!==effectId)
    throw new Error('本地视频报告不是光点建网流线展开');
  const composition=report.composition,video=report.video;
  if(report.inputProps.width!==1280||report.inputProps.height!==720||composition?.width!==1280||composition?.height!==720||composition?.fps!==60||composition?.durationInFrames!==1553||video?.fps!=='60/1'||video?.frames!==1553||video?.codec!=='h264')
    throw new Error('视频必须为 1280×720、每秒 60 帧、共 1553 帧的 H.264 文件');
  if(!Number.isSafeInteger(report.bytes)||report.bytes<24)throw new Error('视频报告缺少有效文件大小');
  if(typeof report.completed!=='string'||!Number.isFinite(Date.parse(report.completed)))throw new Error('视频报告缺少有效生成时间');
  if(!object(report.hashes)||!Object.hasOwn(report.hashes,painter))throw new Error('视频报告必须包含实际绘制源码校验值');
  for(const [relative,hash] of Object.entries(report.hashes)){
    if(!relative||relative.includes('\\')||relative.includes('\0')||path.posix.isAbsolute(relative)||/^[a-z]:/i.test(relative)||relative.split('/').some(part=>!part||part==='.'||part==='..'))
      throw new Error('源码校验路径必须是工程内的安全相对路径：'+relative);
    if(typeof hash!=='string'||!/^[a-f0-9]{64}$/.test(hash))throw new Error('源码校验值无效：'+relative);
  }
}

async function verifySources(root,hashes){
  for(const [relative,expected] of Object.entries(hashes)){
    const source=await realpath(path.join(root,relative));
    if(!inside(root,source)||!(await lstat(source)).isFile())throw new Error('源码校验路径越过工程或不是文件：'+relative);
    if(sha256(await readFile(source))!==expected)throw new Error('视频已过期，当前源码与渲染时不同：'+relative);
  }
}

async function verifyVideo(videoPath,bytes){
  const handle=await open(videoPath,'r');
  try{
    const info=await handle.stat();
    if(!info.isFile()||info.size!==bytes)throw new Error('实际视频文件大小与渲染报告不一致');
    const header=Buffer.alloc(Math.min(info.size,4096));
    await handle.read(header,0,header.length,0);
    const size=header.readUInt32BE(0),brands=[];
    if(size<24||size>header.length||(size-16)%4||header.toString('ascii',4,8)!=='ftyp')throw new Error('视频缺少有效 MP4 文件头');
    brands.push(header.toString('ascii',8,12));
    for(let offset=16;offset<size;offset+=4)brands.push(header.toString('ascii',offset,offset+4));
    if(!brands.some(brand=>['isom','iso2','mp41','mp42','avc1'].includes(brand)))throw new Error('视频 MP4 文件头品牌不受支持');
  }finally{await handle.close();}
}

/** 只安装当前源码对应的已验证视频，不重新渲染或解码。测试可显式传临时工程。 */
export async function installLocalPreview(videoPath,reportPath,{projectRoot:requestedRoot=projectRoot}={}){
  if(typeof videoPath!=='string'||typeof reportPath!=='string')throw new Error('需要提供视频与渲染报告路径');
  const root=path.resolve(requestedRoot);
  await targetInfo(root,true);
  const actualRoot=await realpath(root);
  const report=JSON.parse(await readFile(reportPath,'utf8'));
  validateReport(report);
  await verifySources(actualRoot,report.hashes);
  await verifyVideo(videoPath,report.bytes);
  const directory=path.join(actualRoot,'.local-previews');
  const videoTarget=path.join(directory,effectId+'.mp4');
  const manifestTarget=path.join(directory,effectId+'.json');
  const pending=[];
  async function checkTargets(){
    await targetInfo(directory,true);
    await targetInfo(videoTarget);
    await targetInfo(manifestTarget);
  }
  await checkTargets();
  await mkdir(directory,{recursive:false}).catch(error=>{if(error.code!=='EEXIST')throw error;});
  await checkTargets();
  const suffix='.pending-'+randomUUID();
  const videoPending=videoTarget+suffix,manifestPending=manifestTarget+suffix;
  try{
    // wx 独占创建普通文件；打开成功后立刻登记，写入中断也会清理。
    const copied=await open(videoPending,'wx');pending.push(videoPending);
    try{await pipeline(createReadStream(videoPath),copied.createWriteStream());}
    finally{await copied.close();}
    await verifyVideo(videoPending,report.bytes);
    const manifest={effectId,file:effectId+'.mp4',generatedAt:new Date(report.completed).toISOString(),
      installedAt:new Date().toISOString(),bytes:report.bytes,width:1280,height:720,fps:60,frames:1553,
      fullDecodePassed:true,sourceHashes:report.hashes};
    const saved=await open(manifestPending,'wx');pending.push(manifestPending);
    try{await saved.writeFile(JSON.stringify(manifest,null,2)+'\n');}
    finally{await saved.close();}
    // 复制期间可能有另一个会话修改绘制；发布缓存前再核对一次。
    await verifySources(actualRoot,report.hashes);
    await checkTargets();
    await rename(videoPending,videoTarget);
    await rename(manifestPending,manifestTarget);
    return {video:videoTarget,manifest:manifestTarget};
  }finally{
    for(const file of pending)await rm(file,{force:true});
  }
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length!==4)throw new Error('用法：node scripts/install-local-preview.mjs <已验证视频.mp4> <渲染报告.json>');
  const installed=await installLocalPreview(process.argv[2],process.argv[3]);
  console.log('已安装本地视频预览：'+installed.video);
}
