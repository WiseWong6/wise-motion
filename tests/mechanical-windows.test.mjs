// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm,mkdir,writeFile,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';
import registry from '../catalog/registry.json' with {type:'json'};
import {windowState as authorState,contains} from '../catalog/assets/mechanical-windows/production/windows-v2.mjs';
import {environment,frameMarkup} from './helpers.mjs';
import {resolveEffect} from '../remotion/clock.mjs';
import {projectFor,exportEffect} from '../scripts/export.mjs';
const root=path.resolve(import.meta.dirname,'..');
const ids=['cross-aperture-turn','rect-aperture-breathe','three-column-aperture','next-shot-preentry'];
const hash=b=>createHash('sha256').update(b).digest('hex');
const plain=v=>JSON.parse(JSON.stringify(v));

test('960帧窗口与作者原函数一致，跨镜几何连续，原稿和源媒体摘要可追溯',async()=>{
  const context={};
  runInNewContext(await readFile(path.join(root,'catalog/effects/mechanical-windows-data.js'),'utf8'),context);
  const api=context.WiseMechanicalWindows;
  for(let frame=0;frame<960;frame++)assert.deepEqual(plain(api.windowState(frame)),authorState(frame));
  for(const frame of [400,560,600,660,800,880]){
    const before=api.windowState(frame-.001),after=api.windowState(frame+.001);
    assert.equal(before.phrase,after.phrase);
    before.shapes.forEach((shape,index)=>{
      for(const [key,value]of Object.entries(shape))if(typeof value==='number')assert.ok(Math.abs(value-after.shapes[index][key])<1);
    });
  }
  for(let frame=80;frame<320;frame++)assert.ok(authorState(frame).shapes.some(s=>contains(s,0,0)&&contains(s,1920,1080)));
  for(const id of [...ids,'offset-aperture','registered-drawing']){
    const clip=api.clips[id];assert.equal(api.frameFor(id,0),clip.start);
    assert.equal(api.frameFor(id,1e9),clip.start+clip.frames-1);
  }
  assert.equal(api.stateFor('next-shot-preentry',0).shapes[0].r,0);
  assert.equal(api.stateFor('next-shot-preentry',400).shapes[0].r,1900);
  for(const [frame,visible]of [[9,false],[10,true],[16,true],[17,false],[30,true],[38,true],[39,false]])
    assert.equal(api.isDrawingFlash(frame/30*1000),visible);
  assert.throws(()=>api.frameFor(ids[0],NaN),/有限/);
  assert.throws(()=>api.windowState(Infinity),/有限/);
  const source=JSON.parse(await readFile(path.join(root,'catalog/assets/mechanical-windows/SOURCE.json'),'utf8'));
  for(const entry of source.source_code)assert.equal(hash(await readFile(path.join(root,entry.file))),entry.sha256);
  assert.equal(source.audio.distributed,false);
  const cache=await readFile(path.join(root,'catalog/assets/mechanical-windows/movie.mp4'));
  assert.equal(hash(cache),source.runtime.sha256);assert.ok(cache.length<10_000_000);
});

test('独立动作共享同一几何；偏心圆窗和同位短闪复用旧动作，乱序定位与双镜预入正确',async()=>{
  const env=await environment();
  try{
    const {w}=env,host=w.document.getElementById('root');
    const samples=[...ids.map(id=>[id,undefined]),['iris-open-transition','offset-aperture'],['rapid-cut','registered-drawing']];
    for(const [id,variant]of samples){
      const e=resolveEffect(id,variant),stage=w.document.createElement('div');host.replaceChildren(stage);
      assert.equal(e.kind,'action');assert.equal(e.audio,undefined);
      const draw=w.MotionFactories[id](stage,w.MotionKit,e);
      for(const ms of [0,e.preview_ms,e.duration_ms,100,e.preview_ms]){
        draw(ms);const one=frameMarkup(stage);draw(0);draw(e.duration_ms);draw(ms);
        assert.equal(hash(Buffer.from(frameMarkup(stage))),hash(Buffer.from(one)),id+' @ '+ms);
      }
      if(id==='cross-aperture-turn'){
        draw(79/30*1000);const a=stage.querySelector('clipPath').innerHTML;
        draw(80/30*1000);assert.notEqual(stage.querySelector('clipPath').innerHTML,a);
        assert.equal(stage.dataset.designFrame,'400');assert.equal(stage.dataset.picture,'after');
      }
      if(id==='next-shot-preentry'){
        draw(0);assert.equal(stage.querySelector('clipPath circle').getAttribute('r'),'0');
        draw(200);const a=stage.querySelector('[data-picture="before"] [data-disc]').getAttribute('transform');
        draw(300);assert.notEqual(stage.querySelector('[data-picture="before"] [data-disc]').getAttribute('transform'),a);
        assert.equal(stage.dataset.picture,'two-live-layers');
        draw(400);assert.equal(stage.querySelector('clipPath circle').getAttribute('r'),'1900');
      }
      if(variant==='registered-drawing')for(const [f,visible]of [[9,false],[10,true],[16,true],[17,false],[29,false],[30,true],[38,true],[39,false]]){
        draw(f/30*1000);assert.equal(stage.querySelector('[data-picture="drawing"]').style.display!=='none',visible);
      }
      if(variant==='offset-aperture'){draw(0);const circle=stage.querySelector('clipPath circle');assert.equal(circle.getAttribute('cx'),'430');assert.equal(circle.getAttribute('r'),'150');}
      draw.destroy();assert.equal(stage.childNodes.length,0);
    }
    const comp=resolveEffect('mechanical-window-sequence');
    assert.equal(comp.audio,undefined);
    assert.deepEqual([...new Set(w.MotionFactories[comp.id].breakdown.flatMap(x=>Array.from(x.actions)))].sort(),comp.actions.slice().sort());
    assert.equal(comp.action_variants['iris-open-transition'],'offset-aperture');
    assert.equal(comp.action_variants['rapid-cut'],'registered-drawing');
  }finally{env.close();}
});

test('圆孔与闪切的原有示例继续使用原绘制入口',async()=>{
  const env=await environment();
  try{
    const {w}=env,api=w.WiseMechanicalWindows,original=api.make;
    api.make=()=>{throw new Error('原有示例不应进入新增窗口绘制器');};
    try{
      for(const [id,variants]of [['iris-open-transition',['standard','paper-expand','black-cover']],['rapid-cut',['standard','print-burst']]]){
        for(const variant of variants){
          const stage=w.document.createElement('div'),definition=resolveEffect(id,variant);
          const draw=w.MotionFactories[id](stage,w.MotionKit,definition);
          await draw.ready;draw(definition.preview_ms);assert.ok(stage.querySelector('svg,canvas,div'));
          draw.destroy?.();
        }
      }
    }finally{api.make=original;}
  }finally{env.close();}
});

test('七个入口可独立编译，编辑版无新增媒体依赖和系统字体，媒体不嵌入源码',async()=>{
  const temporary=await mkdtemp(path.join(tmpdir(),'wise-windows-source-'));
  try{
    const selections=[...ids.map(id=>[id,undefined]),['iris-open-transition','offset-aperture'],['rapid-cut','registered-drawing'],['mechanical-window-sequence',undefined]];
    for(const [id,variantId]of selections){
      const out=await exportEffect(id,{variantId,outDir:path.join(temporary,id)});
      const result=await build({entryPoints:[path.join(out.directory,'index.jsx')],bundle:true,write:false,format:'esm',platform:'node',external:['react','remotion'],logLevel:'silent'});
      assert.ok(result.outputFiles[0].text.includes('WiseMechanicalWindows'));
      const project=await projectFor(id,{variantId});
      for(const [file,content]of Object.entries(project.files))if(typeof content==='string'&&/\.(jsx?|mjs|json)$/.test(file))assert.doesNotMatch(content,/data:video\/[^;]+;base64,/);
      if(id==='mechanical-window-sequence'){
        const editable=await build({entryPoints:[path.join(out.directory,'catalog/assets/mechanical-windows/editable/Root.jsx')],bundle:true,write:false,format:'esm',platform:'node',external:['react','remotion'],logLevel:'silent'});
        assert.ok(editable.outputFiles[0].text.includes('A WORLD'));
        assert.doesNotMatch(await readFile(path.join(out.directory,'catalog/assets/mechanical-windows/editable/Film.jsx'),'utf8'),/@remotion\/media|HelveticaNeue/);
        assert.equal(spawnSync(process.execPath,['verify-source.mjs'],{cwd:out.directory,encoding:'utf8'}).status,0);
        assert.ok((await stat(path.join(out.directory,'public/catalog/assets/mechanical-windows/movie.mp4'))).size<10_000_000);
      }
    }
  }finally{await rm(temporary,{recursive:true,force:true});}
});

test('原媒体默认只准备画面，配乐必须显式选择；有目标冲突时整批不写入',async()=>{
  const temporary=await mkdtemp(path.join(tmpdir(),'wise-windows-import-'));
  try{
    const original=path.join(temporary,'original'),target=path.join(temporary,'project');
    await mkdir(path.join(original,'public'),{recursive:true});await mkdir(target);
    const script=path.join(target,'import-originals.mjs');
    await writeFile(script,await readFile(path.join(root,'catalog/assets/mechanical-windows/editable/import-originals.mjs')));
    const entries=[];
    for(const [name,group]of [['visual.mp4','editable'],['music.wav','audio']]){
      const bytes=Buffer.from(group);await writeFile(path.join(original,'public',name),bytes);
      entries.push({source:'public/'+name,target:'public/'+name,group,bytes:bytes.length,sha256:hash(bytes)});
    }
    await writeFile(path.join(target,'original-assets.json'),JSON.stringify(entries));
    let result=spawnSync(process.execPath,[script,'--from',original],{cwd:target,encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);await assert.rejects(stat(path.join(target,'public/music.wav')),/ENOENT/);
    await writeFile(path.join(target,'public/visual.mp4'),'用户修改');
    result=spawnSync(process.execPath,[script,'--from',original],{cwd:target,encoding:'utf8'});
    assert.notEqual(result.status,0);assert.match(result.stderr,/已有文件不同/);
    assert.equal(await readFile(path.join(target,'public/visual.mp4'),'utf8'),'用户修改');
    result=spawnSync(process.execPath,[script,'--from',original,'--group','audio'],{cwd:target,encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);assert.equal(await readFile(path.join(target,'public/music.wav'),'utf8'),'audio');
  }finally{await rm(temporary,{recursive:true,force:true});}
});
