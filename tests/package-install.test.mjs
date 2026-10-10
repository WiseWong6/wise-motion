// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,chmod,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {runInNewContext} from 'node:vm';
import {spawnSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const context={process};
runInNewContext(await readFile(path.join(root,'catalog/export.js'),'utf8'),context);
const {installPackage,packageInstaller}=context.MotionExport;
const version=JSON.parse(await readFile(path.join(root,'package.json'),'utf8')).version;
const dependencies={react:'19.3.0','react-dom':'19.3.0',remotion:'4.0.532','@remotion/cli':'4.0.532'};
const metadata=(version,deps=dependencies)=>({version,dependencies:deps});
const reply=data=>({status:0,stdout:JSON.stringify(data)});
const missing=code=>({status:1,stdout:JSON.stringify({error:{code,summary:'当前版本未上架'}})});

function simulate({responses,installed={version:'0.1.10'},config={version:'0.1.11'}}) {
  const calls=[],messages=[];
  const run=(command,args,options)=>{
    calls.push({command,args:Array.from(args),options});
    assert.ok(responses.length,'出现额外的 npm 调用');
    return responses.shift();
  };
  const execute=()=>installPackage(config,{run,readInstalled:()=>installed,log:message=>messages.push(message)});
  return {execute,calls,messages};
}

test('已上架时安装当前版本，不查询或安装旧版',()=>{
  const env=simulate({responses:[reply(metadata('0.1.11')),{status:0}],installed:{version:'0.1.11'}});
  assert.equal(env.execute(),'0.1.11');
  assert.deepEqual(env.calls.map(call=>call.args),[
    ['view','wise-motion@0.1.11','version','dependencies','--json'],
    ['install','--save-exact','wise-motion@0.1.11','react@19.3.0','react-dom@19.3.0','remotion@4.0.532','@remotion/cli@4.0.532']
  ]);
  assert.equal(env.calls[1].options.stdio,'inherit');
  assert.ok(env.messages.some(message=>message.includes('实际使用 wise-motion@0.1.11')));
});

for(const code of ['E404','ETARGET'])test('版本未上架时自动降级并同步配套依赖：'+code,()=>{
  const older={...dependencies,react:'19.2.0','react-dom':'19.2.0',remotion:'4.0.529','@remotion/cli':'4.0.529'};
  const env=simulate({responses:[missing(code),reply(['0.1.9','0.2.0','0.1.12','0.1.10-rc.1','0.1.8','0.1.10']),reply(metadata('0.1.10',older)),{status:0}]});
  assert.equal(env.execute(),'0.1.10');
  assert.deepEqual(env.calls[3].args,['install','--save-exact','wise-motion@0.1.10','react@19.2.0','react-dom@19.2.0','remotion@4.0.529','@remotion/cli@4.0.529']);
  assert.ok(env.messages.some(message=>message.includes('0.1.11 尚未上架，自动降级')&&message.includes('0.1.10')));
});

for(const code of ['ENOTFOUND','EAI_AGAIN','EACCES','E401','E403'])test('联网或权限错误不触发降级：'+code,()=>{
  const env=simulate({responses:[missing(code)]});
  assert.throws(env.execute,error=>error.code===code);
  assert.equal(env.calls.length,1);
});

test('没有同系列稳定旧版时停止，不跨版本系列或安装预发布版',()=>{
  const env=simulate({responses:[missing('ETARGET'),reply(['0.0.9','0.2.0','0.1.12','0.1.10-beta.1'])]});
  assert.throws(env.execute,/没有可降级的稳定版/);
  assert.equal(env.calls.length,2);
});

test('旧版列表查询失败时停止，单个旧版字符串也可正常解析',()=>{
  const failure=simulate({responses:[missing('E404'),missing('E401')]});
  assert.throws(failure.execute,error=>error.code==='E401');
  const single=simulate({responses:[missing('E404'),reply('0.1.10'),reply(metadata('0.1.10')),{status:0}]});
  assert.equal(single.execute(),'0.1.10');
});

test('版本已在发布列表中时，不把查询失败误判为尚未上架',()=>{
  const env=simulate({responses:[missing('E404'),reply(['0.1.10','0.1.11'])]});
  assert.throws(env.execute,error=>error.code==='E404');
  assert.equal(env.calls.length,2);
  assert.ok(!env.messages.some(message=>message.includes('自动降级')));
});

test('版本、配套依赖或仓库返回数据异常时，在安装前停止',()=>{
  for(const responses of [
    [reply(metadata('0.1.10'))],
    [reply(metadata('0.1.11',{...dependencies,remotion:'^4.0.532'}))],
    [{status:0,stdout:'not json'}],
    [{status:null,error:Error('找不到 npm 命令')}]
  ]){
    const env=simulate({responses});
    assert.throws(env.execute);
    assert.equal(env.calls.length,1);
  }
  const invalid=simulate({responses:[],config:{version:'0.1.11; echo unsafe'}});
  assert.throws(invalid.execute,/完整的稳定版本号/);
  assert.equal(invalid.calls.length,0);
});

test('实际安装失败不再试旧版，实际版本不符也不能报成功',()=>{
  const failure=simulate({responses:[reply(metadata('0.1.11')),{status:1}],installed:{version:'0.1.11'}});
  assert.throws(failure.execute,/安装失败/);
  assert.equal(failure.calls.length,2);
  const mismatch=simulate({responses:[reply(metadata('0.1.11')),{status:0}]});
  assert.throws(mismatch.execute,/实际安装版本/);
});

test('降级后确认动效和样式存在，缺失时给出明确提示',()=>{
  for(const [registry,accepted] of [
    [{effects:[{id:'terminal-code',variants:[{id:'command-log'}]}]},true],
    [{effects:[]},false],
    [{effects:[{id:'terminal-code',variants:[{id:'default'}]}]},false]
  ]){
    const env=simulate({config:{version:'0.1.11',effectId:'terminal-code',variantId:'command-log'},installed:{version:'0.1.10',registry},responses:[missing('E404'),reply(['0.1.10']),reply(metadata('0.1.10')),{status:0}]});
    if(accepted)assert.equal(env.execute(),'0.1.10');
    else {assert.throws(env.execute,/0.1.10.*terminal-code\/command-log/);assert.ok(!env.messages.some(message=>message.includes('安装完成')));}
  }
});

test('浏览器复制命令、导出安装文件和源码命令都可在空工程实际执行',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'wise-package-install-'));
  try {
    const bin=path.join(dir,'bin');await mkdir(bin);
    const log=path.join(dir,'calls.jsonl');
    // 用临时 npm 替身走真实子进程及文件读取，不联网或更改本工程依赖。
    const fakeNpm=`#!${process.execPath}
const fs=require('node:fs'),path=require('node:path');
const args=process.argv.slice(2);
fs.appendFileSync(process.env.WISE_INSTALL_TEST_LOG,JSON.stringify(args)+'\\n');
const target=process.env.WISE_INSTALL_TEST_TARGET;
const metadata={version:'0.1.10',dependencies:${JSON.stringify(dependencies)}};
if(args[0]==='view'){
  if(args[1]===target){console.log(JSON.stringify({error:{code:'E404',summary:'not published'}}));process.exitCode=1;}
  else console.log(JSON.stringify(args[1]==='wise-motion'?['0.1.9','0.1.10','0.1.12']:metadata));
}else if(args[0]==='install'){
  const destination=path.join(process.cwd(),'node_modules/wise-motion');
  fs.mkdirSync(path.join(destination,'dist'),{recursive:true});fs.mkdirSync(path.join(destination,'catalog'),{recursive:true});
  fs.writeFileSync(path.join(destination,'package.json'),JSON.stringify({...metadata,exports:'./dist/index.mjs'}));
  fs.writeFileSync(path.join(destination,'dist/index.mjs'),'');
  fs.writeFileSync(path.join(destination,'catalog/registry.json'),JSON.stringify({effects:[{id:'word-slam'}]}));
}else process.exitCode=2;
`;
    await writeFile(path.join(bin,'npm'),fakeNpm);await chmod(path.join(bin,'npm'),0o755);
    const env={...process.env,PATH:bin+path.delimiter+process.env.PATH,WISE_INSTALL_TEST_LOG:log,WISE_INSTALL_TEST_TARGET:'wise-motion@'+version};
    const config={effectId:'word-slam'};
    const installer=packageInstaller(config);
    const filename=path.join(dir,'install-wise-motion.cjs');await writeFile(filename,installer);
    const standalone=spawnSync(process.execPath,[filename],{cwd:dir,env,encoding:'utf8'});
    assert.equal(standalone.status,0,standalone.stderr);
    assert.match(standalone.stdout,/自动降级为已发布版本 0.1.10/);
    const stdin=spawnSync(process.execPath,['--input-type=commonjs'],{cwd:dir,env,input:installer,encoding:'utf8'});
    assert.equal(stdin.status,0,stdin.stderr);
    const cli=spawnSync(process.execPath,[path.join(root,'scripts/install-package.mjs'),'word-slam'],{cwd:dir,env,encoding:'utf8'});
    assert.equal(cli.status,0,cli.stderr);
    const calls=(await readFile(log,'utf8')).trim().split('\n').map(line=>JSON.parse(line));
    assert.equal(calls.filter(args=>args[0]==='install').length,3);
    assert.ok(calls.filter(args=>args[0]==='install').every(args=>args.includes('wise-motion@0.1.10')));
    const source=spawnSync(process.execPath,[path.join(root,'scripts/install-package.mjs')],{cwd:root,env,encoding:'utf8'});
    assert.equal(source.status,1);assert.match(source.stderr,/不能安装到 Wise Motion 源码目录/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
