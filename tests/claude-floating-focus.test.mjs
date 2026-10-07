// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
import {environment,data,frameMarkup} from './helpers.mjs';
import {history,state} from '../scripts/history.mjs';

const record=JSON.parse(await readFile(new URL('../../../state/wise-motion/claude-floating-focus-20261002/extraction.json',import.meta.url),'utf8'));
const source=await readFile(record.source_files[0].file,'utf8');
const math=source.slice(source.indexOf('const clamp ='),source.indexOf('const fi ='));
const original=runInNewContext(math+'\n({hash,E})');
const equations=source.slice(source.indexOf('const EQS ='),source.indexOf('const codeCv ='));
const eqStart=source.indexOf('  if (k.eq) {'),eqEnd=source.indexOf('\n  ctx.save();',eqStart);
const scene=source.slice(source.indexOf('function scene6(t)'),source.indexOf('// Scene 7'));
const effect=id=>data.effects.find(e=>e.id===id);
const drift=effect('math-formula-drift'),wall=effect('tile-wall-focus');
const near=(a,b,label='')=>assert.ok(Number.isFinite(Number(a))&&Math.abs(Number(a)-Number(b))<1e-8,`${label}: ${a} / ${b}`);
const nums=text=>(text.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/g)||[]).map(Number);
function sourceEquations(seconds){
  const rows=[],ctx={save(){},restore(){}};
  runInNewContext(equations+'\n'+source.slice(eqStart,eqEnd),{ctx,t:11.5+seconds,k:{eq:true},hash:original.hash,W:1920,H:1080,C:{soft:'var(--muted)'},text(value,x,y,font,color){rows.push({value,x,y,font,color,alpha:ctx.globalAlpha});}});
  return rows;
}
function sourceCamera(ms){
  const transforms=[],draws=[];
  const ctx={save(){},restore(){},fillRect(){},beginPath(){},roundRect(){},clip(){},strokeRect(){},stroke(){},fill(){},translate(x,y){transforms.push(['translate',x,y]);},scale(x,y){transforms.push(['scale',x,y]);}};
  const tiles=Array.from({length:16},(_,i)=>['tile-'+i,(_c,w,h,t)=>draws.push({i,w,h,t})]);
  runInNewContext(scene+'\nscene6(T);',{ctx,T:20.9+ms/1000,W:1920,H:1080,CX:960,CY:540,C:{bg:'',soft:'',white:''},E:original.E,seg:(t,a,b)=>Math.max(0,Math.min(1,(t-a)/(b-a))),lerp:(a,b,t)=>a+(b-a)*t,WH:()=>'',MONO:'',CN:'',TILES:tiles,text(){}});
  return {camera:[...transforms[0].slice(1),transforms[1][1],...transforms[2].slice(1)],draws};
}

test('公式只提取原数学卡背景，十条内容、坐标、字号及透明度与原源码一致',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),p=w.MotionRuntime.create(root,drift);
    assert.equal(root.querySelectorAll('text').length,10);
    assert.equal(root.querySelector('rect,image,video,audio,canvas,filter'),null);
    for(const ms of [0,25,125,350,499]){
      p.seek(ms);const expected=sourceEquations(ms/1000);
      [...root.querySelectorAll('[data-equation]')].forEach((node,i)=>{
        const want=expected[i];assert.equal(node.textContent,want.value);
        near(node.getAttribute('x'),want.x/3);near(node.getAttribute('y'),want.y/3);
        near(node.getAttribute('font-size'),Number(want.font.match(/([\d.]+)px/)[1])/3);
        near(node.getAttribute('opacity'),want.alpha);assert.equal(node.getAttribute('fill'),want.color);
        assert.equal(node.getAttribute('font-style'),'italic');assert.match(node.getAttribute('font-family'),/^Oswald/);
      });
    }
    p.destroy();
  }finally{env.close();}
});

test('公式跨轮次连续漂移，长时间仍在回收范围，拖回可复现且不创建额外节点',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),p=w.MotionRuntime.create(root,drift);
    const nodes=[...root.querySelectorAll('*')];p.seekElapsed(3999);
    const before=[...root.querySelectorAll('[data-equation]')].map(n=>Number(n.getAttribute('x')));
    p.seekElapsed(4001);
    [...root.querySelectorAll('[data-equation]')].forEach((n,i)=>near(Number(n.getAttribute('x'))-before[i],.002*(original.hash(i)-.5)*400/3));
    for(const ms of [1600,100000,3600000,1600]){
      p.seekElapsed(ms);for(const n of root.querySelectorAll('[data-equation]'))assert.ok(Number(n.getAttribute('x'))>=-320&&Number(n.getAttribute('x'))<960);
    }
    const picture=root.innerHTML;p.seek(0);p.seek(1600);assert.equal(root.innerHTML,picture);
    assert.deepEqual([...root.querySelectorAll('*')],nodes);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true});p.seek(1600);assert.equal(observer.takeRecords().length,0);observer.disconnect();
    p.destroy();assert.equal(root.childElementCount,0);assert.equal(w.MotionRuntime.instanceCount,0);
  }finally{env.close();}
});

test('图块墙的布局、镜头变换与原函数一致，内部图形持续到局部三点一秒',async()=>{
  const env=await environment();
  try{
    const {w}=env,root=w.document.getElementById('root'),p=w.MotionRuntime.create(root,wall);
    const tiles=[...root.querySelectorAll('[data-wall-tile]')],focus=root.querySelector('[data-tile="kick-rings"]');
    assert.equal(tiles.length,16);assert.equal(root.querySelector('canvas,image,video,audio'),null);
    tiles.forEach((n,i)=>assert.equal(n.getAttribute('transform'),`translate(${60+(i%4)*452.5} ${70+Math.floor(i/4)*237.5})`));
    for(const ms of [0,199,200,325,625,849,1000,1050,1200]){
      p.seek(ms);const wanted=sourceCamera(ms),got=nums(root.querySelector('[data-wall-camera]').getAttribute('transform'));
      wanted.camera.forEach((n,i)=>near(got[i],n,'镜头原曲线'));
      assert.equal(wanted.draws.length,16);wanted.draws.forEach(item=>{near(item.w,442.5);near(item.h,227.5);near(item.t,1.9+ms/1000);});
      assert.deepEqual([...root.querySelectorAll('[data-wall-tile]')],tiles,'放大不更换图块');assert.equal(root.querySelector('[data-tile="kick-rings"]'),focus);
      assert.ok(!/NaN|undefined|Infinity/.test(root.innerHTML));
      near(root.querySelector('[data-tile="frame-counter"] text').textContent,Math.round((20.9+ms/1000-19)*60)+1,'内部帧时钟不中断');
    }
    p.seek(1200);const final=root.innerHTML;p.seek(1600);assert.equal(root.innerHTML,final,'末尾保持');
    p.seek(800);const middle=root.innerHTML;p.seek(0);p.seek(800);assert.equal(root.innerHTML,middle);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true,characterData:true});p.seek(800);assert.equal(observer.takeRecords().length,0);observer.disconnect();
    p.destroy();assert.equal(root.childElementCount,0);assert.equal(env.listeners.size,0);
  }finally{env.close();}
});

test('两条历史入口去重、搜索和旧书签指向正式动作，原工程未改，导出能独立加载',async()=>{
  const historical=await history(data),cross=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
  const {rank}=createRequire(import.meta.url)('../catalog/matching.js');
  for(const [id,e] of [['promo-kinetic-cards',drift],['promo-grid-zoom',wall]]){
    assert.equal(cross.rules[id].status,'excluded');assert.equal(cross.rules[id].migration.effect,e.id);
    assert.ok(!historical.recipes.some(r=>r.history_id===id));assert.ok(!historical.originals.clips.some(c=>c.id===id));
    assert.equal(data.redirects['history-'+id],e.id);assert.equal(data.effects.filter(item=>item.id===e.id).length,1);
    assert.ok(rank(data,e.aliases[0]).some(r=>r.effect.id===e.id));
  }
  for(const item of record.source_files)assert.equal(createHash('sha256').update(await readFile(item.file)).digest('hex'),item.sha256);
  const env=await environment(true);
  try{
    const {w}=env,d=w.document;await env.reveal(`[data-effect="${drift.id}"] .thumb,[data-effect="${wall.id}"] .thumb`);
    for(const e of [drift,wall]){
      const thumb=d.querySelector(`[data-effect="${e.id}"] .thumb .motion-stage`);assert.ok(thumb);
      const standalone=d.createElement('div'),player=w.MotionRuntime.create(standalone,e);player.seek(e.preview_ms);
      assert.ok(frameMarkup(thumb)===frameMarkup(standalone.firstElementChild),'缩略图与正式预览一致');player.destroy();
      const output=w.MotionExport.code(e);assert.ok(output.includes('<script src="'+e.source.path+'"></script>'));
      assert.doesNotMatch(output,/history-runtime|history-data/);
      const dom=new JSDOM(output,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true}),exported=dom.window;
      try{
        for(const script of exported.document.querySelectorAll('script')){
          if(script.src)exported.eval(await readFile(new URL('../'+script.getAttribute('src'),import.meta.url),'utf8'));
          else exported.eval(script.textContent);
        }
        exported.MotionDemo.pause();exported.MotionDemo.seek(e.preview_ms);
        assert.ok(frameMarkup(thumb)===frameMarkup(exported.document.querySelector('#motion .motion-stage')),'复制代码独立打开可复现同一帧');
      }finally{exported.MotionRuntime?.disposeAll();exported.anime?.engine.pause();dom.window.close();}

      d.querySelector(`[data-effect="${e.id}"]`).click();assert.equal(d.querySelector('#preview .motion-stage').dataset.effect,e.id);
    }
  }finally{env.close();}
  for(const [id,e] of [['promo-kinetic-cards',drift],['promo-grid-zoom',wall]]){
    const env=await environment(true,{hash:'#history-'+id});
    try{assert.equal(env.w.document.querySelector('#preview .motion-stage').dataset.effect,e.id);}finally{env.close();}
  }
});
