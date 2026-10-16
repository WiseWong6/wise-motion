// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {build} from 'esbuild';
import {Easing} from 'remotion';
import {windowState as authorWindow} from '../catalog/assets/mechanical-pulse/production/windows-v4.mjs';
import {getAlignedFormLayout as authorLayout} from '../catalog/assets/mechanical-pulse/production/form-layout.mjs';
import {environment,frameMarkup} from './helpers.mjs';
import {resolveEffect} from '../remotion/clock.mjs';
import {exportEffect,projectFor} from '../scripts/export.mjs';
const root=path.resolve(import.meta.dirname,'..'),asset='catalog/assets/mechanical-pulse/';
const selections=[['diamond-aperture-release'],['cross-aperture-turn','continuous-diagonal'],
  ['three-column-aperture','vertical-column-rise'],['rapid-cut','full-frame-blueprint'],
  ['next-shot-preentry','paced-overlap'],['fan-object-rise','aligned-silhouette'],
  ['wipe','overlap-copy-handoff'],['spatial-mechanical-sequence']];
const hash=b=>createHash('sha256').update(b).digest('hex'),plain=x=>JSON.parse(JSON.stringify(x));
async function api(){const context={};runInNewContext(await readFile(path.join(root,'catalog/effects/spatial-apertures-data.js'),'utf8'),context);return context.WiseSpatialApertures;}

test('v4.2所有540帧匹配原创窗口，十字切点持续变宽、菱形跨三镜只展开一次',async()=>{
  const a=await api();for(let f=0;f<540;f++)assert.deepEqual(plain(a.windowState(f)),authorWindow(f),'F'+f);
  for(const f of [180,220,300,320]){
    const before=a.windowState(f-.0001).shapes,after=a.windowState(f+.0001).shapes;
    before.forEach((shape,i)=>Object.keys(shape).filter(k=>typeof shape[k]==='number').forEach(k=>assert.ok(Math.abs(shape[k]-after[i][k])<.1,k+' @ '+f)));
  }
  for(let f=203;f<240;f++)assert.ok(a.windowState(f).shapes[0].height>a.windowState(f-1).shapes[0].height);
  for(let f=281;f<330;f++)assert.ok(a.windowState(f).shapes[0].width>a.windowState(f-1).shapes[0].width);
  for(let f=40;f<140;f++)assert.equal(a.windowState(f).phrase,'full');
  for(const [mode,clip]of Object.entries(a.clips)){
    assert.equal(a.frameFor(mode,-100),clip.start);assert.equal(a.frameFor(mode,1e9),clip.start+clip.frames-1);
  }
  assert.throws(()=>a.frameFor('paced-overlap',NaN),/有限/);
  assert.throws(()=>a.windowState(Infinity),/有限/);
});

test('全部56帧真实轮廓等距且主体同高，入场后继续运动；泛化排版拒绝无效测量',async()=>{
  const a=await api(),settle=Easing.bezier(.16,1,.3,1);let last;
  const gap=a.getAlignedFormLayout(0)[0].gap.toFixed(6);
  assert.ok(resolveEffect('fan-object-rise','aligned-silhouette').reproduction.details.some(x=>x.includes(gap)));
  assert.ok(resolveEffect('spatial-mechanical-sequence').reproduction.details.some(x=>x.includes(gap)));
  for(let f=0;f<56;f++){
    const offset=48*(1-settle(Math.min(1,f/12)))-16*f/55;
    assert.ok(Math.abs(a.formOffset(f)-offset)<.0001);
    const own=a.getAlignedFormLayout(a.formOffset(f)),author=authorLayout(offset);
    for(let i=0;i<3;i++)for(const k of ['left','top','centerX','centerY','gap'])assert.ok(Math.abs(own[i][k]-author[i][k])<.0001);
    assert.equal(own[0].centerY,own[1].centerY);assert.equal(own[1].centerY,own[2].centerY);
    assert.ok(Math.abs((own[1].bounds.left-own[0].bounds.right)-(own[2].bounds.left-own[1].bounds.right))<1e-8);
    assert.equal(own[0].bounds.left,96);assert.ok(Math.abs(own[2].bounds.right-1824)<1e-8);
    if(f>12)assert.ok(own[0].centerY<last);last=own[0].centerY;
  }
  const custom=[0,1].map(i=>({id:String(i),sourceSize:[200,200],width:100,angle:0,anchorSource:[100,100],alphaExtents:{minX:-30,maxX:30,minY:-40,maxY:40}}));
  const row=a.layoutSilhouettes(custom,{canvasWidth:640,margin:20,centerY:200});
  assert.equal(row[0].bounds.left,20);assert.equal(row[1].bounds.right,620);assert.equal(row[0].gap,480);
  assert.throws(()=>a.layoutSilhouettes(custom,{canvasWidth:100}),/超出/);
  assert.throws(()=>a.layoutSilhouettes([{...custom[0],anchorSource:[NaN,0]},custom[1]]),/锚点/);
});

test('两次八帧全幅短闪、16帧双镜预入和错开文案交接边界准确',async()=>{
  const a=await api(),frames=[];for(let f=0;f<100;f++)if(a.isDrawingFlash(f/30*1000))frames.push(f);
  assert.deepEqual(frames,[8,9,10,11,12,13,14,15,28,29,30,31,32,33,34,35]);
  const curve=Easing.bezier(.16,1,.3,1);
  for(let f=0;f<=16;f++)assert.ok(Math.abs(a.stateFor('paced-overlap',f/30*1000).shapes[0].r-1640*curve(f/16))<.0001);
  for(let f=0;f<=20;f++){
    const s=a.stateFor('overlap-copy-handoff',f/30*1000);assert.equal(s.outgoingCopy,0);
    assert.equal(s.incomingCopy,Math.max(0,Math.min(1,(f-12)/8)));
    if(f>=16)assert.equal(s.shapes[0].width,1920);
  }
});

test('所有新动作与示例可乱序定位，原有默认入口继续使用；组合关联精确示例',async()=>{
  const env=await environment();try{
    const {w}=env;
    for(const [id,variant]of selections.slice(0,-1)){
      const e=resolveEffect(id,variant),stage=w.document.createElement('div');
      const draw=w.MotionKit.createRenderer(stage,e);await draw.ready;
      assert.equal(e.audio,undefined);
      if(variant==='aligned-silhouette'){
        assert.equal(stage.querySelectorAll('[data-silhouette]').length,3);
        assert.equal(stage.querySelectorAll('[data-disc],clipPath,text').length,0);
      }else{
        const cache=e.source.frame_cache;
        assert.deepEqual(cache,plain(w.WiseSpatialApertures.definitionFor(id,variant).source.frame_cache));
        assert.equal(e.duration_ms,cache.frames/30*1000);
        assert.equal(stage.querySelector('img').getAttribute('src'),cache.poster.replace(/^catalog\//,''));
        assert.equal(stage.querySelector('[data-disc],svg'),null,'原片不能被示意齿轮替代');
      }
      if(variant!=='full-frame-blueprint')assert.equal(stage.querySelector('[data-layer="drawing"]'),null);
      for(const ms of [0,e.preview_ms,e.duration_ms,100,e.preview_ms]){
        draw(ms);const before=frameMarkup(stage);draw(0);draw(e.duration_ms);draw(ms);assert.equal(frameMarkup(stage),before,id);
        if(variant!=='aligned-silhouette')assert.equal(Number(stage.dataset.nativeFrame),w.WiseSpatialApertures.frameFor(variant||id,ms));
      }
      if(variant!=='aligned-silhouette'){
        const cache=e.source.frame_cache;
        draw(0);assert.equal(Number(stage.dataset.nativeFrame),cache.start_frame);
        draw(1e9);assert.equal(Number(stage.dataset.nativeFrame),cache.start_frame+cache.frames-1);
      }
      draw.destroy();assert.equal(stage.childNodes.length,0);
    }
    const make=w.WiseSpatialApertures.make;w.WiseSpatialApertures.make=()=>{throw Error('默认动作被替换');};
    try{for(const id of ['cross-aperture-turn','three-column-aperture','next-shot-preentry','rapid-cut','wipe','fan-object-rise']){
      const stage=w.document.createElement('div'),e=resolveEffect(id),draw=w.MotionFactories[id](stage,w.MotionKit,e);
      await draw.ready;draw(e.preview_ms,{ease:'linear'});assert.ok(stage.childNodes.length);draw.destroy?.();
      if(id==='fan-object-rise'){
        const minimal=w.MotionFactories[id](stage);await minimal.ready;minimal(100);
        assert.ok(stage.querySelector('img'));minimal.destroy();
      }
    }}finally{w.WiseSpatialApertures.make=make;}
    const comp=resolveEffect('spatial-mechanical-sequence');
    assert.deepEqual([...new Set(w.MotionFactories[comp.id].breakdown.flatMap(x=>Array.from(x.actions)))].sort(),comp.actions.slice().sort());
    for(const[id,variant]of selections.slice(1,-1))assert.equal(comp.action_variants[id],variant);
  }finally{env.close();}
});

test('八个独立导出均可编译；完整编辑版无新媒体依赖，原稿与小体积缓存摘要正确',async()=>{
  const temp=await mkdtemp(path.join(tmpdir(),'wise-pulse-source-'));try{
    for(const[id,variantId]of selections){
      const out=await exportEffect(id,{variantId,outDir:path.join(temp,id)});
      const result=await build({entryPoints:[path.join(out.directory,'index.jsx')],bundle:true,write:false,format:'esm',platform:'node',external:['react','remotion'],logLevel:'silent'});
      assert.ok(result.outputFiles[0].text.includes('WiseSpatialApertures'));
      const project=await projectFor(id,{variantId});
      for(const[file,content]of Object.entries(project.files))if(typeof content==='string'&&/\.(jsx?|mjs|json)$/.test(file))assert.doesNotMatch(content,/data:video\/[^;]+;base64,/);
      const module={exports:{}};
      const compiled=await build({entryPoints:[path.join(out.directory,'catalog/remotion/spatial-apertures.jsx')],bundle:true,write:false,format:'cjs',platform:'node',external:['react','remotion'],logLevel:'silent'});
      // Match CommonJS module scope: the data API and React component deliberately share a name.
      runInNewContext('(function(module,exports,require){\n'+compiled.outputFiles[0].text+'\n})',{})(module,module.exports,createRequire(import.meta.url));
      assert.equal(typeof module.exports.WiseSpatialApertures,'function',id+' / '+variantId+': '+Object.keys(module.exports));
      const element=module.exports.WiseSpatialApertures({effectId:id,variantId});
      if(variantId!=='aligned-silhouette'){
        assert.equal(element.type.name,'WiseNativeVideo');
        assert.deepEqual(plain(element.props.definition.source.frame_cache),resolveEffect(id,variantId).source.frame_cache);
        assert.equal(hash(await readFile(path.join(out.directory,'public',asset,'movie.mp4'))),hash(await readFile(path.join(root,asset,'movie.mp4'))));
      }
      assert.equal(spawnSync(process.execPath,['verify-source.mjs'],{cwd:out.directory,encoding:'utf8'}).status,0);
      if(id==='spatial-mechanical-sequence'){
        const editable=await build({entryPoints:[path.join(out.directory,asset,'editable/Root.jsx')],bundle:true,write:false,format:'esm',platform:'node',external:['react','remotion'],logLevel:'silent'});assert.ok(editable.outputFiles[0].text.includes('SHAPED'));
        for(const file of ['FilmV3.jsx','FilmV4.jsx','SpatialScenes.jsx'])assert.doesNotMatch(await readFile(path.join(out.directory,asset,'editable',file),'utf8'),/@remotion\/media|HelveticaNeue/);
        assert.equal(spawnSync(process.execPath,['verify-source.mjs'],{cwd:out.directory,encoding:'utf8'}).status,0);
        assert.ok((await stat(path.join(out.directory,'public',asset,'movie.mp4'))).size<5_000_000);
      }
    }
    const s=JSON.parse(await readFile(path.join(root,asset,'SOURCE.json'),'utf8'));
    for(const x of s.source_code)assert.equal(hash(await readFile(path.join(root,x.file))),x.sha256);
    assert.equal(hash(await readFile(path.join(root,asset,'movie.mp4'))),s.runtime.sha256);assert.equal(s.audio.distributed,false);
    const originals=JSON.parse(await readFile(path.join(root,asset,'editable/original-assets.json'),'utf8'));
    assert.equal(originals.length,15);assert.equal(originals.filter(x=>x.group==='audio').length,1);
    assert.ok(originals.filter(x=>x.group==='editable').every(x=>!x.source.includes('alpha')));
  }finally{await rm(temp,{recursive:true,force:true});}
});
