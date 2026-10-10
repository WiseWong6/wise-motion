// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,realpath,mkdir,writeFile,readFile,rm,symlink,link} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {assertProjectWrite,assertRenderWrite,getRenderDirectory,resolveRenderOutput} from '../scripts/output-boundary.mjs';

const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const renderScript=path.join(root,'scripts/render-remotion.mjs');
async function withDirectory(directory,run){
 const previous=process.env.WISE_MOTION_RENDER_DIR;
 if(directory===undefined)delete process.env.WISE_MOTION_RENDER_DIR;
 else process.env.WISE_MOTION_RENDER_DIR=directory;
 try{return await run();}finally{
  if(previous===undefined)delete process.env.WISE_MOTION_RENDER_DIR;
  else process.env.WISE_MOTION_RENDER_DIR=previous;
 }
}
async function fixture(run){
 const temporary=await realpath(await mkdtemp(path.join(tmpdir(),'wise-motion-output-')));
 try{return await withDirectory(path.join(temporary,'renders'),()=>run(temporary));}
 finally{await rm(temporary,{recursive:true,force:true});}
}

test('正式视频默认保存在源码之外的 state 目录',async()=>{
 await withDirectory(undefined,async()=>{
  const expected=path.resolve(root,'../../state/wise-motion/renders');
  assert.equal(await getRenderDirectory(),expected);
  assert.equal(await resolveRenderOutput(undefined,'seed-bloom-brand'),path.join(expected,'seed-bloom-brand.mp4'));
 });
});

test('独立输出目录支持内部相对路径和绝对路径',async()=>fixture(async temporary=>{
 const outputRoot=path.join(temporary,'renders');
 assert.equal(await resolveRenderOutput('nested/movie.mp4','stagger-in'),path.join(outputRoot,'nested/movie.mp4'));
 assert.equal(await resolveRenderOutput(path.join(outputRoot,'movie.mp4'),'stagger-in'),path.join(outputRoot,'movie.mp4'));
 assert.equal(await assertRenderWrite(path.join(outputRoot,'movie.mp4.json')),path.join(outputRoot,'movie.mp4.json'));
}));

test('视频路径拒绝越界、同名前缀目录以及非 mp4 文件',async()=>fixture(async temporary=>{
 for(const target of ['../escape.mp4',path.join(temporary,'outside.mp4'),path.join(temporary,'renders-other/movie.mp4'),'movie.webm','movie.mp4.json','']){
  await assert.rejects(resolveRenderOutput(target,'stagger-in'));
 }
 await assert.rejects(assertRenderWrite(path.join(temporary,'renders')));
 for(const name of ['../escape','foo/bar','',null])await assert.rejects(resolveRenderOutput(undefined,name));
}));

test('输出根拒绝技能源码、源码子目录及源码祖先',async()=>{
 for(const directory of [root,path.join(root,'catalog'),path.dirname(root),path.parse(root).root]){
  await withDirectory(directory,()=>assert.rejects(getRenderDirectory(),/源码/));
 }
});

test('输出根必须是目录',async()=>fixture(async temporary=>{
 const file=path.join(temporary,'file');await writeFile(file,'keep');
 await withDirectory(file,()=>assert.rejects(getRenderDirectory(),/必须是目录/));
 assert.equal(await readFile(file,'utf8'),'keep');
}));

test('视频和附属信息文件拒绝符号链接与硬链接',async()=>fixture(async temporary=>{
 const outputRoot=path.join(temporary,'renders');await mkdir(outputRoot);
 const original=path.join(temporary,'original');await writeFile(original,'keep');
 for(const suffix of ['.mp4','.mp4.json']){
  const symbolic=path.join(outputRoot,'symbolic'+suffix),hard=path.join(outputRoot,'hard'+suffix);
  await symlink(original,symbolic);await link(original,hard);
  await assert.rejects(assertRenderWrite(symbolic),/链接/);
  await assert.rejects(assertRenderWrite(hard),/链接/);
 }
 assert.equal(await readFile(original,'utf8'),'keep');
}));

test('输出根及内部路径不能穿过符号链接',async()=>fixture(async temporary=>{
 const outputRoot=path.join(temporary,'renders'),outside=path.join(temporary,'outside');
 await mkdir(outputRoot);await mkdir(outside);
 await symlink(outside,path.join(outputRoot,'redirect'));
 await assert.rejects(resolveRenderOutput('redirect/movie.mp4','stagger-in'),/链接/);
 const rootLink=path.join(temporary,'linked-root');await symlink(outputRoot,rootLink);
 await withDirectory(rootLink,()=>assert.rejects(getRenderDirectory(),/链接/));
 const sourceLink=path.join(temporary,'linked-source');await symlink(root,sourceLink);
 await withDirectory(path.join(sourceLink,'output'),()=>assert.rejects(getRenderDirectory(),/源码/));
}));

test('构建输出仍限制在当前源码目录内',async()=>{
 assert.equal(await assertProjectWrite(path.join(root,'dist','new-build.js')),path.join(root,'dist','new-build.js'));
 await assert.rejects(assertProjectWrite(path.join(path.dirname(root),'outside.js')),/越过/);
});

test('正式脚本不依赖隔离迁移目录或报告清单',async()=>{
 for(const relative of ['scripts/render-remotion.mjs','scripts/output-boundary.mjs','scripts/build-remotion.mjs','remotion/root.jsx']){
  const source=await readFile(path.join(root,relative),'utf8');
  assert.doesNotMatch(source,/migration\.json|\.migration-history|baseline-update-|maintenance\/|reports\//,relative);
 }
 const source=await readFile(path.join(root,'remotion/root.jsx'),'utf8');
 assert.doesNotMatch(source,/UpdateAssembly|assembly|BaselineEffect/);
});

// 执行真实导出脚本正文，只替换外部依赖；不会启动浏览器、写出视频或改动源码。
async function runRender(argv,options={}){
 const source=(await readFile(renderScript,'utf8')).replace(/^import[^\n]*\n/gm,'').replaceAll('import.meta.url',JSON.stringify(pathToFileURL(renderScript).href));
 const calls=Object.assign(options.calls||{},{projectWrites:[],renderWrites:[],mkdir:[],writes:[],bundles:[],selections:[],renders:[],resolves:[],outputs:[],layerChecks:0});
 const mocks={
  process:{argv:['node',renderScript,...argv],env:{}},path,fileURLToPath,URL,
  console:{log(){}},
  assertLayerBuildCurrent:()=>{calls.layerChecks++;if(options.layerError)throw options.layerError;},
  assertProjectWrite:async target=>{calls.projectWrites.push(target);return target;},
  assertRenderWrite:async target=>{calls.renderWrites.push(target);return target;},
  resolveRenderOutput:async(target,effectId)=>{calls.outputs.push({target,effectId});return path.join('/virtual/renders',target||effectId+'.mp4');},
  resolveEffect:(effect,variantId)=>{calls.resolves.push({effect,variantId});return typeof effect==='object'?effect:{id:effect,source:{path:effect==='metal-drop-split'?'catalog/effects/metal-impact.js':'catalog/effects/entrance.js'}};},
  mkdir:async(...args)=>{calls.mkdir.push(args);},
  writeFile:async(...args)=>{calls.writes.push(args);},
  bundle:async options=>{calls.bundles.push(options);return 'http://mock.invalid/';},
  ensureBrowser:async()=>({path:'/virtual/browser'}),
  execFileSync:()=> 'Chromium test\n',
  selectComposition:async options=>{calls.selections.push(options);return {id:'WiseMotion',durationInFrames:60,fps:60,width:640,height:360};},
  renderMedia:async options=>{calls.renders.push(options);}
 };
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 await new AsyncFunction(...Object.keys(mocks),source)(...Object.values(mocks));
 return calls;
}

test('实际 effectId 覆盖导出参数并为金属效果选择对应绘图后端',async()=>{
 const calls=await runRender(['stagger-in','nested/metal.mp4',JSON.stringify({effectId:'metal-drop-split',variantId:'cut'})]);
 assert.deepEqual(calls.resolves,[{effect:'metal-drop-split',variantId:'cut'}]);
 assert.deepEqual(calls.outputs,[{target:'nested/metal.mp4',effectId:'metal-drop-split'}]);
 assert.equal(calls.selections[0].chromiumOptions.gl,'angle');
 assert.equal(calls.renders[0].inputProps.effectId,'metal-drop-split');
 assert.equal(calls.renderWrites[0],'/virtual/renders/nested/metal.mp4.json');
 assert.equal(calls.writes.length,1);
 assert.equal(JSON.parse(calls.writes[0][1]).browser.gl,'angle');
});

test('默认输出名称来自实际解析后的动效',async()=>{
 const calls=await runRender(['stagger-in']);
 assert.deepEqual(calls.outputs,[{target:undefined,effectId:'stagger-in'}]);
 assert.equal(calls.renders[0].outputLocation,'/virtual/renders/stagger-in.mp4');
 assert.equal(calls.renders[0].chromiumOptions.gl,null);
 assert.equal(calls.layerChecks,1);
});

test('透明审计过期时，正式导出在创建目录和启动构建前停止',async()=>{
 const calls={};
 await assert.rejects(runRender(['stagger-in'],{calls,layerError:new Error('透明审计过期')}),/透明审计过期/);
 assert.equal(calls.layerChecks,1);
 for(const field of ['projectWrites','renderWrites','mkdir','writes','bundles','selections','renders','outputs'])assert.deepEqual(calls[field],[],field);
});

test('覆盖定义及其金属依赖参与真实来源选择',async()=>{
 const definition={id:'custom-composition',source:{path:'catalog/effects/custom.js',dependencies:['catalog/effects/metal-impact.js']}};
 const calls=await runRender(['stagger-in','custom.mp4',JSON.stringify({definition})]);
 assert.deepEqual(calls.resolves[0].effect,definition);
 assert.equal(calls.outputs[0].effectId,'custom-composition');
 assert.equal(calls.renders[0].chromiumOptions.gl,'angle');
});

test('正式导出拒绝迁移基准参数',async()=>{
 await assert.rejects(runRender(['stagger-in','test.mp4',JSON.stringify({baseline:true})]),/不接受迁移基准/);
});
