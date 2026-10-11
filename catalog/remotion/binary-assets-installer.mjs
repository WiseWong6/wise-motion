// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const project=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(await readFile(path.join(project,'binary-assets.json'),'utf8'));
const base=process.argv[2];
if(!base)throw Error('请提供素材包根目录或网址；命令行导出包已含素材，无需执行本程序。');
const safe=file=>typeof file==='string'&&file&&!path.isAbsolute(file)&&!file.includes('\\')&&!file.split('/').some(p=>!p||p==='..'||p==='.');
const hash=b=>createHash('sha256').update(b).digest('hex');
const pending=[];
for(const item of manifest){
  if(!safe(item.source)||!safe(item.target))throw Error('素材路径无效');
  const target=path.join(project,item.target);
  let current=project;
  for(const part of item.target.split('/')){
    current=path.join(current,part);
    try{const info=await lstat(current);if(info.isSymbolicLink()||(info.isFile()&&info.nlink>1))throw Error('素材目标不能是链接：'+current);}catch(e){if(e.code!=='ENOENT')throw e;}
  }
  let bytes;
  if(/^https?:/.test(base)){
    const response=await fetch(new URL(item.source,base.replace(/\/?$/,'/')));
    if(!response.ok)throw Error('无法取得素材：'+item.source);
    bytes=Buffer.from(await response.arrayBuffer());
  }else{
    const folder=base.startsWith('file:')?fileURLToPath(base):path.resolve(base);
    bytes=await readFile(path.join(folder,item.source));
  }
  if(bytes.length!==item.bytes||hash(bytes)!==item.sha256)throw Error('素材内容不符：'+item.source);
  try{if(hash(await readFile(target))!==item.sha256)throw Error('已有文件不同，未覆盖：'+target);}
  catch(e){if(e.code!=='ENOENT')throw e;pending.push([target,bytes]);}
}
for(const [target,bytes]of pending){await mkdir(path.dirname(target),{recursive:true});await writeFile(target,bytes,{flag:'wx'});}
console.log('已准备 '+pending.length+' 个工程与素材文件；已有相同文件保留。');
