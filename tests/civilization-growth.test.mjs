import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {paintEffect,segments,sequenceId} from '../catalog/assets/civilization-growth/engine.mjs';
import {artwork,recorder} from './civilization-recorder.mjs';
import {frameScriptsFor} from '../remotion/frame-document.mjs';
import {environment} from './helpers.mjs';
const read=name=>readFile(new URL('../'+name,import.meta.url),'utf8');
const sharedImagesFile='catalog/effects/civilization-images.js';
const entries=JSON.parse(await read('catalog/registry.json')).effects.filter(e=>e.source.path==='catalog/effects/civilization-growth.js');

test('收录完整保留已确认的画面命令；倒序与独立分段使用同一绘制',async()=>{
 const accepted=JSON.parse(await read('tests/fixtures/civilization-growth-accepted.json')),r=recorder();
 for(const [ms,hash] of [...accepted,...accepted.slice().reverse()])assert.equal(r.digest(c=>paintEffect(c,artwork,sequenceId,ms)),hash,'原画面 '+ms);
 for(const s of segments)for(const p of [.1,.5,.9]){
  const local=(s.end-s.start)*p,whole=r.digest(c=>paintEffect(c,artwork,sequenceId,s.start+local));
  assert.equal(r.digest(c=>paintEffect(c,artwork,s.id,local)),whole,s.id);
 }
 assert.throws(()=>paintEffect(r.context,artwork,sequenceId,NaN),/有限/);
});

test('原粒子入口不被覆盖，目录分层与销毁保持独立',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{runScripts:'outside-only'}),w=dom.window;
 try{
  const old=()=>{};w.MotionFactories={'particle-word':old};w.HTMLCanvasElement.prototype.getContext=()=>null;
  w.eval(await read(sharedImagesFile));
  w.eval(await read('catalog/effects/civilization-growth.js'));assert.equal(w.MotionFactories['particle-word'],old);
  for(const e of entries){
   const root=w.document.createElement('div'),render=w.MotionFactories[e.id](root,{},e);render(e.preview_ms);const snapshot=root.innerHTML;
   render(0);render(e.preview_ms);assert.equal(root.innerHTML,snapshot);
   assert.equal(root.querySelectorAll('[data-layer]').length,e.kind==='composition'?6:0);
   const canvas=root.querySelector('canvas');render.destroy(true);render(0);assert.equal(root.innerHTML,snapshot);assert.equal(canvas.width,1920);
  }
 }finally{dom.window.close();}
});

test('异步素材准备保留最后定位，提前销毁不复活，失败明确传出',async()=>{
 const bundle=await read('catalog/effects/civilization-growth.js');
 for(const fail of [false,true]){
  const dom=new JSDOM('<div></div>',{runScripts:'outside-only'}),w=dom.window;
  try{
   let release;const fontReady=new Promise((resolve,reject)=>{release=()=>fail?reject(new Error('font failed')):resolve();});
   w.FontFace=class{load(){return fontReady;}};
   Object.defineProperty(w.document,'fonts',{value:{add(){}}});
   w.Image=class{constructor(){this.width=1920;this.height=1080;}set src(value){queueMicrotask(()=>this.onload());}decode(){return Promise.resolve();}};
   const pixels=new Uint8ClampedArray(1920*1080*4).fill(30);for(let i=3;i<pixels.length;i+=4)pixels[i]=255;
   w.HTMLCanvasElement.prototype.getContext=function(){if(!this._context){this._context=recorder().context;this._context.getImageData=()=>({data:pixels});}return this._context;};
   w.eval(await read(sharedImagesFile));w.eval(bundle);
   const root=w.document.createElement('div'),other=w.document.createElement('div');
   const factory=w.MotionFactories[sequenceId],live=factory(root,{},{}),dead=factory(other,{},{});
   live(14200);live(17600);dead(10000);dead.destroy();const frozen=other.innerHTML;
   const settled=fail?assert.rejects(live.ready,/font failed/):live.ready;
   release();await settled;await dead.ready;
   assert.equal(other.innerHTML,frozen,'已销毁画面不能被迟到准备结果改写');
   assert.equal(root.firstChild.dataset.time,'17600');assert.equal(root.firstChild.dataset.renderState,fail?'error':'ready');live.destroy();
  }finally{dom.window.close();}
 }
});

test('素材校验完整，源码复制可在空目录构建独立逐帧工程',async()=>{
 const source=JSON.parse(await read('catalog/assets/civilization-growth/SOURCE.json'));
 for(const f of source.files){const bytes=await readFile(new URL('../catalog/assets/civilization-growth/'+f.path,import.meta.url));assert.equal(bytes.length,f.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256,f.path);}
 const scope={};vm.createContext(scope);
 for(const name of ['catalog/runtime.js',sharedImagesFile,'catalog/remotion-sources.js','catalog/export.js'])vm.runInContext(await read(name),scope);
 const e=entries.find(e=>e.id===sequenceId),code=scope.MotionExport.code(e,{speed:1});
 for(const file of e.source.remotion.files)assert.equal(scope.MotionRemotionSources[file],await read(file),'复制文件必须保持完整且逐字一致：'+file);
 assert.match(code,/component=\{CivilizationGrowth\}/);assert.doesNotMatch(code,/\/Users\/|file:\/\/|fetch\(|requestAnimationFrame/);
 const directory=await mkdtemp(path.join(os.tmpdir(),'wise-civilization-copy-'));
 try{
  let count=0;for(const m of code.matchAll(/^## ([^\n]+)\n\n(`{3,})[^\n]*\n([\s\S]*?)\n\2(?=\n|$)/gm)){
   const target=path.join(directory,m[1]);assert.ok(target.startsWith(directory+path.sep));await mkdir(path.dirname(target),{recursive:true});await writeFile(target,m[3]);count++;
  }
  assert.equal(count,e.source.remotion.files.length+3);
  const result=await build({absWorkingDir:directory,entryPoints:['index.jsx'],bundle:true,write:false,metafile:true,format:'esm',external:['react','react-dom','remotion']});
  assert.ok(Object.keys(result.metafile.inputs).every(name=>!name.includes('..')));
  assert.ok(result.outputFiles[0].text.includes('WISE MOTION'));
  const pkg=JSON.parse(await readFile(path.join(directory,'package.json')));assert.equal(pkg.dependencies.remotion,'4.0.532');
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('两张原图只保留一份；图片内容不变，页面与逐帧播放先加载共享数据',async()=>{
 const scope={};vm.createContext(scope);const shared=await read(sharedImagesFile);
 vm.runInContext(shared,scope);
 const source=JSON.parse(await read('catalog/assets/civilization-growth/SOURCE.json'));
 assert.equal(Buffer.byteLength(shared),source.shared_images.bytes);
 assert.equal(createHash('sha256').update(shared).digest('hex'),source.shared_images.sha256);
 const generated=await Promise.all(['catalog/effects/civilization-growth.js','catalog/remotion-sources.js'].map(read));
 for(const [key,uri]of Object.entries(scope.WiseCivilizationImages)){
  const bytes=Buffer.from(uri.split(',')[1],'base64');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sources[key].sha256,'原图不得被重绘或压缩');
  for(const text of generated)assert.ok(!text.includes(uri),'生成文件不能再次内嵌图片');
 }
 const html=await read('catalog/index.html');
 assert.ok(!html.includes('effects/civilization-images.js'),'目录首屏不同步载入大图，由 MotionLazy 按需载入');
 for(const e of entries){
  const page=await environment(true,{staticPreview:true,lazyAssets:true});
  let lazyFiles;
  try{await page.w.MotionLazy.ensure(e);lazyFiles=page.lazyRequests.map(file=>'catalog/'+file);}finally{page.close();}
  for(const files of [lazyFiles,frameScriptsFor(e),frameScriptsFor()]){
   assert.equal(files.filter(file=>file===sharedImagesFile).length,1);
   assert.ok(files.indexOf(sharedImagesFile)<files.indexOf(e.source.path));
  }
 }
 const other=JSON.parse(await read('catalog/registry.json')).effects.find(e=>e.id==='stagger-in');
 assert.ok(!frameScriptsFor(other).includes(sharedImagesFile),'无关动效不加载大图');
});

test('复制文件按需还原共享图片，缺少数据时明确报错且不影响其他工程',async()=>{
 const scope={};vm.createContext(scope);
 vm.runInContext(await read('catalog/remotion-sources.js'),scope);
 assert.equal(typeof scope.MotionRemotionSources['catalog/remotion/seed-bloom-brand.jsx'],'string');
 assert.throws(()=>scope.MotionRemotionSources[sharedImagesFile],/共享图片尚未加载/);
 vm.runInContext(await read(sharedImagesFile),scope);
 assert.equal(scope.MotionRemotionSources[sharedImagesFile],await read(sharedImagesFile));
 const dom=new JSDOM('<div></div>',{runScripts:'outside-only'}),w=dom.window;
 try{
  w.HTMLCanvasElement.prototype.getContext=()=>({});
  w.eval(await read('catalog/effects/civilization-growth.js'));
  const render=w.MotionFactories[sequenceId](w.document.createElement('div'),{},{});
  await assert.rejects(render.ready,/共享图片尚未加载/);render.destroy();
 }finally{w.close();}
});
