// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import {losslessWebpDimensions} from './image-assets.mjs';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
const registry=JSON.parse(await readFile(new URL('../catalog/registry.json',import.meta.url),'utf8'));
const effect=registry.effects.find(e=>e.id==='cyanotype');
const source=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
async function setup({decode=()=>Promise.resolve(),url='file:///relocated/wise-motion/catalog/index.html',html='<div id="root"></div><script src="effects/cyanotype.js"></script>',exported=false}={}){
  const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
  w.ResizeObserver=class{observe(){}disconnect(){}};
  w.matchMedia=()=>({matches:true});w.CSS.supports=()=>false;
  w.HTMLImageElement.prototype.decode=function(){return decode(this);};
  const files=exported?[]:['vendor/animejs/anime.umd.min.js','catalog/runtime.js',effect.source.path];
  for(const file of files)w.eval(await source(file));
  if(exported)for(const script of w.document.scripts)w.eval(script.src?await source(script.getAttribute('src')):script.textContent);
  return {w,dom,close(){w.MotionRuntime?.disposeAll();w.anime?.engine.pause();w.close();}};
}
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
function normalize(stage){
  const svg=stage.querySelector('svg').cloneNode(true);
  const ids=[...svg.querySelectorAll('[id]')].map(n=>n.id);
  let result=svg.outerHTML;ids.forEach((id,i)=>{result=result.replaceAll(id,'normalized-'+i);});return result;
}

test('纸面显影使用完整的本地图集，主目录与导出页均能按源码位置找到素材',async()=>{
  const bytes=await readFile(new URL('../catalog/assets/cyanotype/botanical-atlas.webp',import.meta.url));
  const record=JSON.parse(await source('catalog/assets/cyanotype/SOURCE.json'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256);
  assert.deepEqual(losslessWebpDimensions(bytes),[1536,1024]);
  assert.equal(record.tool,'Codex 内置 image_gen.imagegen');assert.ok(record.prompt);
  const index=await source('catalog/index.html');assert.match(index,/src="effects\/cyanotype\.js"/);
  for(const {url,html,expected} of [
    {url:'file:///relocated/wise-motion/catalog/index.html',html:'<div id="root"></div><script src="effects/cyanotype.js"></script>',expected:'file:///relocated/wise-motion/catalog/assets/cyanotype/botanical-atlas.webp'},
    {url:'file:///relocated/wise-motion/demo.html',html:'<div id="root"></div><script src="catalog/effects/cyanotype.js"></script>',expected:'file:///relocated/wise-motion/catalog/assets/cyanotype/botanical-atlas.webp'}
  ]){
    let decoded;const env=await setup({url,html,decode:image=>{decoded=image.src;return Promise.resolve();}});
    try{
      const player=env.w.MotionRuntime.create(env.w.document.getElementById('root'),effect),stage=env.w.document.getElementById('root').firstElementChild;
      assert.equal(await player.ready,true);assert.equal(decoded,expected);
      assert.equal(stage.dataset.art,'original');
      assert.equal(stage.querySelectorAll('image').length,3);
      for(const image of stage.querySelectorAll('image'))assert.equal(image.getAttribute('href'),expected);
    }finally{env.close();}
  }
});

test('纸面显影准备期间保留最后定位、暂停和速度，完成后不跳回开头',async()=>{
  const wait=deferred(),env=await setup({decode:()=>wait.promise});
  try{
    const player=env.w.MotionRuntime.create(env.w.document.getElementById('root'),effect,{autoplay:true}),stage=env.w.document.getElementById('root').firstElementChild;
    assert.equal(player.preparing,true);player.seek(875);player.setSpeed(1.5);player.pause();
    const picture=normalize(stage);wait.resolve();assert.equal(await player.ready,true);
    assert.equal(player.currentTime,875);assert.equal(player.speed,1.5);assert.equal(player.paused,true);
    assert.equal(normalize(stage),picture);
  }finally{env.close();}
});

test('纸面素材失败可见，准备中销毁不会重新建立播放器或修改已释放画面',async()=>{
  for(const destroyed of [false,true]){
    const wait=deferred(),env=await setup({decode:()=>wait.promise});
    try{
      const player=env.w.MotionRuntime.create(env.w.document.getElementById('root'),effect,{autoplay:true}),stage=env.w.document.getElementById('root').firstElementChild;
      player.seek(500);const picture=stage.innerHTML;
      if(destroyed)player.destroy();wait.reject(new Error('fixture missing asset'));
      assert.equal(await player.ready,false);
      if(destroyed){assert.equal(env.w.MotionRuntime.instanceCount,0);assert.equal(stage.innerHTML,picture);}
      else{assert.equal(stage.dataset.preparation,'failed');assert.match(stage.querySelector('[role="alert"]').textContent,/植物纸面素材未能加载/);assert.equal(player.paused,true);}
    }finally{env.close();}
  }
});

test('两份纸面显影不会串用滤镜，反复前后定位得到同一画面',async()=>{
  const env=await setup();
  try{
    const d=env.w.document,root=d.getElementById('root'),other=d.createElement('div');d.body.append(other);
    const a=env.w.MotionRuntime.create(root,effect),b=env.w.MotionRuntime.create(other,effect);await Promise.all([a.ready,b.ready]);
    const left=new Set([...root.firstElementChild.querySelectorAll('[id]')].map(e=>e.id));
    assert.ok([...other.firstElementChild.querySelectorAll('[id]')].every(e=>!left.has(e.id)));
    for(const stage of [root.firstElementChild,other.firstElementChild])for(const element of stage.querySelectorAll('[filter],[fill]')){
      for(const value of [element.getAttribute('filter'),element.getAttribute('fill')]){
        const id=value?.match(/^url\(#(.+)\)$/)?.[1];if(id)assert.ok(stage.querySelector('[id="'+id+'"]'));
      }
    }
    const cards=[...root.firstElementChild.querySelectorAll('.cy-card')].map(e=>e.getAttribute('transform'));
    for(const time of [0,150,289,290,508,756,780,860,875,1000,500,120,999,0,875]){
      a.seek(time);b.seek(time);assert.equal(normalize(root.firstElementChild),normalize(other.firstElementChild));
      const picture=normalize(root.firstElementChild);a.seek(1000-time);a.seek(time);assert.equal(normalize(root.firstElementChild),picture);
      assert.deepEqual([...root.firstElementChild.querySelectorAll('.cy-card')].map(e=>e.getAttribute('transform')),cards);
    }
    const still=d.createElement('div'),draw=env.w.MotionFactories.cyanotype(still,env.w.MotionKit,effect);await draw.ready;
    draw(875);const picture=normalize(still);draw.destroy(true);draw(0);assert.equal(normalize(still),picture,'缩略图释放后仍保留已完成的画面');
    assert.equal(env.w.MotionFactories.cyanotype.requiresPreparation,true);
  }finally{env.close();}
});

test('纸面显影的独立示例保持同一画面、播放条与完整素材，提示词包含实际制作参数',async()=>{
  const env=await setup();let demo;
  try{
    env.w.eval(await source('catalog/matching.js'));env.w.eval(await source('catalog/export.js'));
    const prompt=env.w.MotionExport.prompt(effect,{},registry);
    assert.match(prompt,/1\.00 秒/);assert.match(prompt,/1\.22倍/);assert.match(prompt,/18毫秒/);assert.match(prompt,/640×360/);
    assert.ok(!/file:|\/Users\/|审核|验收/.test(prompt));
    const html=env.w.MotionExport.code(effect,{speed:1.75});
    for(const resource of [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]))assert.ok((await stat(new URL('../'+resource,import.meta.url))).isFile());
    demo=await setup({url:'file:///relocated/wise-motion/demo.html',html,exported:true});
    const player=demo.w.MotionDemo,stage=demo.w.document.getElementById('motion').firstElementChild;assert.equal(await player.ready,true);player.pause();
    assert.equal(player.speed,1.75);
    const main=env.w.MotionRuntime.create(env.w.document.getElementById('root'),effect);await main.ready;
    for(const time of [0,290,500,756,875,1000,120]){main.seek(time);player.seek(time);assert.equal(normalize(env.w.document.getElementById('root').firstElementChild),normalize(stage));}
    const range=demo.w.document.getElementById('time');range.value=700;range.dispatchEvent(new demo.w.Event('input'));
    assert.equal(player.currentTime,700);assert.equal(player.paused,true);
    demo.w.dispatchEvent(new demo.w.Event('pagehide'));assert.equal(demo.w.MotionRuntime.instanceCount,0);
  }finally{demo?.close();env.close();}
});
