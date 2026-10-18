// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {frameScriptsFor,createFrameDocument} from '../remotion/frame-document.mjs';
import {effectDefinitions,resolveEffect} from '../remotion/clock.mjs';

const root=new URL('../',import.meta.url);
const core=['vendor/animejs/anime.umd.min.js','catalog/content.js','catalog/runtime.js'];
const examples=effectDefinitions.flatMap(effect=>(effect.variants||[])
  .filter(variant=>variant.lego_motion)
  .map(variant=>({effect,current:resolveEffect(effect,variant.id)})));
const code=new Map();
async function load(w,file){
  if(!code.has(file))code.set(file,await readFile(new URL(file,root),'utf8'));
  w.eval(code.get(file));
}
function document(html='<!doctype html><body></body>'){
  const dom=new JSDOM(html,{url:new URL('catalog/frame.html',root).href,runScripts:'outside-only',pretendToBeVisual:true});
  // jsdom does not decode image resources. Confirm the actual referenced file
  // exists, then resolve the image event; pixel verification is separate.
  dom.window.Image=class {
    set src(value){this.url=value;readFile(new URL(value)).then(()=>this.onload?.(),()=>this.onerror?.());}
    decode(){return Promise.resolve();}
  };
  return dom;
}
function sample(w,definition){
  const stage=w.document.createElement('div');w.document.body.append(stage);
  let draw;
  try{
    w.MotionKit.prepareStage(stage,definition);
    draw=w.MotionKit.createRenderer(stage,definition);
    draw(definition.preview_ms,{duration:definition.duration_ms,elapsed:definition.preview_ms,playback:false});
    const scene=stage.querySelector('[data-lego-mode]');
    return {mode:scene?.dataset.legoMode,frame:scene?.dataset.sourceFrame};
  }finally{draw?.destroy?.();stage.remove();}
}
function close(dom){dom.window.MotionRuntime?.disposeAll();dom.window.anime?.engine.pause();dom.window.close();}

test('新旧示例使用独立绘制入口，脚本任意载入先后都不覆盖对方',async()=>{
  assert.ok(examples.some(({effect})=>effect.id==='follow'));
  assert.ok(examples.some(({effect})=>effect.id==='leader-callout'));
  const files=definition=>frameScriptsFor(definition).filter(file=>!core.includes(file));
  for(const {effect,current} of examples){
    assert.notEqual(current.source.factory,current.id,current.id+' 不得占用原动作绘制入口');
    const legacyVariant=effect.variants.find(variant=>variant.id==='original'&&!variant.lego_motion)
      ||effect.variants.find(variant=>!variant.lego_motion);
    assert.ok(legacyVariant,effect.id+' 应保留原示例');
    const legacy=resolveEffect(effect,legacyVariant.id),legacyFiles=files(legacy),newFiles=files(current);
    let legacyCode;
    for(const [label,first,second] of [['原脚本先加载',legacyFiles,newFiles],['新脚本先加载',newFiles,legacyFiles]]){
      const dom=document(),w=dom.window;
      try{
        for(const file of [...core,...first])await load(w,file);
        const key=label==='原脚本先加载'?legacy.source.factory:current.source.factory;
        const retained=w.MotionFactories[key];
        assert.equal(typeof retained,'function');
        for(const file of second)await load(w,file);
        assert.equal(w.MotionFactories[key],retained,label+'：另一组脚本不得替换已有绘制器');
        const original=w.MotionFactories[legacy.source.factory];
        assert.equal(typeof original,'function');
        if(legacyCode===undefined)legacyCode=original.toString();
        else assert.equal(original.toString(),legacyCode,'原示例应仍使用同一源码函数');
        const actual=sample(w,current);
        assert.equal(actual.mode,current.lego_motion.mode,label+'：'+current.id+'/'+current.variant_id);
        assert.equal(Number(actual.frame),Math.min(current.lego_motion.frames-1,Math.floor(current.preview_ms*30/1000+1e-7)));
      }finally{close(dom);}
    }
  }
});

test('实际隔离页面按声明载入每个新入口，首帧和后续帧都进入正确动作',async()=>{
  const definitions=effectDefinitions.filter(effect=>effect.lego_motion).concat(examples.map(({current})=>current));
  assert.ok(definitions.length>0);
  for(const definition of definitions){
    const dom=document(createFrameDocument({assetBaseUrl:root.href,definition})),w=dom.window;
    let session;
    try{
      for(const script of w.document.scripts){
        if(script.src)await load(w,new URL(script.src).href.slice(root.href.length));
        else w.eval(script.textContent);
      }
      session=await w.__wiseMotionCreateSession({definition:JSON.parse(JSON.stringify(definition)),theme:'dark'});
      const frames=[];
      for(const time of [0,definition.preview_ms,definition.duration_ms]){
        await session.draw(time,time,'exact');
        const scene=session.stage.querySelector('[data-lego-mode]');
        assert.equal(scene?.dataset.legoMode,definition.lego_motion.mode,definition.id);
        const expected=Math.min(definition.lego_motion.frames-1,Math.floor(time*30/1000+1e-7));
        assert.equal(Number(scene.dataset.sourceFrame),expected,definition.id);
        frames.push(scene.innerHTML);
      }
      if(definition.id==='lego-brick-illustration'){
        assert.equal(frames[0],frames[1],definition.id+' 静态插画预览应保持一致');
        assert.equal(frames[0],frames[2],definition.id+' 静态插画末帧应保持一致');
      }else assert.notEqual(frames[0],frames[1],definition.id+' 时间应推进而非卡住首帧');
    }finally{session?.destroy();close(dom);}
  }
});
