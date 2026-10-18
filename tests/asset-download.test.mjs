// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,cp,rm,stat,symlink,link} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {assetDownloadUrl} from '../scripts/install-assets.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

// 模拟真实 npm 包：脚本、清单和普通素材齐全，大素材不在包内。
async function fixture(run){
 const dir=await mkdtemp(path.join(tmpdir(),'wise-download-')),originalFetch=globalThis.fetch;
 try{
  const root=path.join(dir,'package'),target=path.join(dir,'project/public/wise-motion');
  for(const folder of ['scripts','catalog','vendor'])await mkdir(path.join(root,folder),{recursive:true});
  await cp(new URL('../scripts/install-assets.mjs',import.meta.url),path.join(root,'scripts/install-assets.mjs'));
  const entries=[0,1,2].map(i=>{
   const bytes=Buffer.from('test fixture '+i),file='catalog/assets/lego-kingdom/layout/frame-00'+i+'.webp';
   return {bytes,item:{path:file,bytes:bytes.length,sha256:hash(bytes),delivery:'github'}};
  });
  await writeFile(path.join(root,'package.json'),JSON.stringify({version:'1.2.3'}));
  await writeFile(path.join(root,'ASSET-MANIFEST.json'),JSON.stringify({files:entries.map(e=>e.item)}));
  await writeFile(path.join(root,'catalog/registry.json'),JSON.stringify({effects:[
   {id:'plain',source:{assets:[]}},
   {id:'leader-callout',source:{assets:[]},variants:[{id:'original',source:{assets:[]}},{id:'lego-kingdom',source:{assets:entries.map(e=>e.item.path)}}]},
  ]}));
  await writeFile(path.join(root,'catalog/common.txt'),'included');
  const installer=await import(pathToFileURL(path.join(root,'scripts/install-assets.mjs')));
  const requests=[];
  const serve=()=>{globalThis.fetch=async(url,options)=>{
   requests.push(url);assert.ok(options.signal);
   const item=entries.find(e=>url==='https://raw.githubusercontent.com/WiseWong6/wise-motion/v1.2.3/'+e.item.path);
   assert.ok(item,'只能请求固定版本与清单路径：'+url);return new Response(item.bytes);
  };};
  serve();await run({root,target,entries,requests,serve,...installer});
 }finally{globalThis.fetch=originalFetch;await rm(dir,{recursive:true,force:true});}
}

test('按需入口只接受固定版本和已登记的大素材路径',()=>{
 assert.match(assetDownloadUrl('1.2.3','catalog/assets/lego-kingdom/layout/frame-000.webp'),/\/v1\.2\.3\//);
 for(const version of ['main','latest','../1.2.3'])assert.throws(()=>assetDownloadUrl(version,'catalog/assets/lego-kingdom/layout/frame-000.webp'));
 assert.throws(()=>assetDownloadUrl('1.2.3','../outside.webp'));
});

test('npm 缺少大素材时按样式准备，其他动作不下载；重复安装离线复用',async()=>fixture(async f=>{
 await f.installAssets(f.target,{effectId:'plain'});
 await f.installAssets(f.target,{effectId:'leader-callout'});
 assert.equal(f.requests.length,0);
 await assert.rejects(stat(path.join(f.target,f.entries[0].item.path)),{code:'ENOENT'});
 await f.installAssets(f.target,{effectId:'leader-callout',variantId:'lego-kingdom'});
 assert.equal(f.requests.length,3);
 for(const entry of f.entries)assert.deepEqual(await readFile(path.join(f.target,entry.item.path)),entry.bytes);
 globalThis.fetch=()=>{throw Error('离线不应请求网络');};
 await f.installAssets(f.target,{effectId:'leader-callout',variantId:'lego-kingdom'});
 await f.installAssets(f.target,{effectId:'plain'});
 await f.installAssets(f.target); // 全量旧命令仍可用，选其他动作后也保留大素材记录。
 const record=JSON.parse(await readFile(path.join(f.target,'.wise-motion-assets.json'),'utf8'));
 assert.equal(record.files[f.entries[0].item.path],f.entries[0].item.sha256);
}));

test('下载缺失、内容错误或超出长度时整批停止，目标工程不留半套素材',async()=>{
 for(const mode of ['404','hash','size'])await fixture(async f=>{
  const working=globalThis.fetch;
  globalThis.fetch=async(url,options)=>url.endsWith('001.webp')
   ? mode==='404'?new Response('',{status:404}):new Response(mode==='hash'?Buffer.alloc(f.entries[1].item.bytes):Buffer.alloc(100))
   :working(url,options);
  await assert.rejects(f.installAssets(f.target),/无法准备按需素材/);
  await assert.rejects(stat(f.target),{code:'ENOENT'});
 });
});

test('本地修改先阻止安装；明确覆盖后可修复，链接不会被写入',async()=>fixture(async f=>{
 await f.installAssets(f.target);
 const file=path.join(f.target,f.entries[0].item.path);
 await writeFile(file,'user edit');
 await rm(path.join(f.target,'catalog/common.txt'));
 f.requests.length=0;
 await assert.rejects(f.installAssets(f.target),/本地修改/);
 assert.equal(f.requests.length,0);
 await assert.rejects(stat(path.join(f.target,'catalog/common.txt')),{code:'ENOENT'});
 await f.installAssets(f.target,{overwrite:true});
 assert.deepEqual(await readFile(file),f.entries[0].bytes);
 const outside=path.join(f.root,'outside');await writeFile(outside,'keep');
 for(const make of [symlink,link]){
  await rm(file);await make(outside,file);
  await assert.rejects(f.installAssets(f.target,{overwrite:true}),/链接/);
  assert.equal(await readFile(outside,'utf8'),'keep');
 }
}));

test('完整 Git 源码直接复制原字节，缺少动效或样式时不写目标',async()=>fixture(async f=>{
 for(const entry of f.entries){
  const file=path.join(f.root,entry.item.path);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,entry.bytes);
 }
 for(const options of [{effectId:'missing'},{effectId:'plain',variantId:'missing'},{variantId:'lego-kingdom'}]){
  await assert.rejects(f.installAssets(f.target,options));await assert.rejects(stat(f.target),{code:'ENOENT'});
 }
 globalThis.fetch=()=>{throw Error('完整源码不应联网');};
 await f.installAssets(f.target);
 for(const entry of f.entries)assert.deepEqual(await readFile(path.join(f.target,entry.item.path)),entry.bytes);
}));

test('独立工程准备程序复用已校验的文件，离线重跑成功并保护修改',async()=>fixture(async f=>{
 const project=path.join(f.root,'native');await mkdir(project);
 const script=path.join(project,'prepare-assets.mjs');
 await cp(new URL('../catalog/remotion/binary-assets-installer.mjs',import.meta.url),script);
 const manifest=[];
 for(const entry of f.entries){
  const file=path.join(f.root,entry.item.path);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,entry.bytes);
  manifest.push({source:entry.item.path,target:'public/'+entry.item.path,bytes:entry.item.bytes,sha256:entry.item.sha256});
 }
 await writeFile(path.join(project,'binary-assets.json'),JSON.stringify(manifest));
 const invoke=base=>spawnSync(process.execPath,[script,base],{encoding:'utf8'});
 const first=invoke(f.root);assert.equal(first.status,0,first.stderr);
 await rm(path.join(f.root,'catalog/assets'),{recursive:true});
 const offline=invoke('https://unreachable.invalid/v1.2.3/');assert.equal(offline.status,0,offline.stderr);
 assert.match(offline.stdout,/已准备 0 个/);
 const file=path.join(project,manifest[0].target);await writeFile(file,'user edit');
 const conflict=invoke('https://unreachable.invalid/v1.2.3/');assert.notEqual(conflict.status,0);assert.match(conflict.stderr,/已有文件不同/);
 assert.equal(await readFile(file,'utf8'),'user edit');
}));
