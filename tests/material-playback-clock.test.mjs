// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';

const require=createRequire(import.meta.url);
const anime=require('../vendor/animejs/anime.umd.min.js');
anime.engine.useDefaultMainLoop=false;
const source=await readFile(new URL('../catalog/effects/material-evolution.js',import.meta.url),'utf8');
const registry=JSON.parse(await readFile(new URL('../catalog/registry.json',import.meta.url),'utf8'));
const ids=['material-evolution-sequence','dots-lines-cylinders','material-form-chain'];
const patterns=['none','random','alternate','sine'];
const tolerance=.00005;

function environment(){
 const dom=new JSDOM('<!doctype html><head></head><body></body>',{url:new URL('../catalog/index.html',import.meta.url).href,runScripts:'outside-only'}),w=dom.window;
 // 本测试只核查实际工厂的设计时钟；不模拟像素、材质或浏览器绘制速度。
 w.HTMLCanvasElement.prototype.getContext=()=>null;
 w.eval(source);
 const entries=ids.map(id=>{
  const definition=registry.effects.find(effect=>effect.id===id),root=w.document.createElement('div');
  w.document.body.append(root);
  const render=w.MotionFactories[id](root,{},definition);
  assert.equal(render.ready,undefined);
  return {definition,root,render};
 });
 return {entries,close(){entries.forEach(entry=>entry.render.destroy());dom.window.close();}};
}

// 使用库本身的回调准入逻辑，保留其提前回调容差；只将真实墙钟换为可重复的屏幕时刻。
// 不在测试中复制材质工厂的取整公式，直接读工厂写出的 sourceTime。
function runScreens(entry,timer,{hz,speed=1,phase=0,pattern='none',sampleRate=entry.render.frameRate}){
 timer.fps=sampleRate;
 timer._lastTickTime=0;
 entry.render(0);
 let previous=Number(entry.root.dataset.sourceTime)*30,seed=314159,updates=0,changes=0;
 const steps=[];
 const duration=Math.min(2500,entry.definition.duration_ms),wallDuration=duration/speed;
 for(let index=0;;index++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const jitter=pattern==='random'?seed/4294967296*4-2:
   pattern==='alternate'?(index%2?2:-2):pattern==='sine'?2*Math.sin(index*1.1):0;
  const wallTime=Math.max(0,phase+index*1000/hz+jitter);
  if(wallTime>=wallDuration)break;
  if(!timer.requestTick(wallTime))continue;
  updates++;
  entry.render(wallTime*speed,{playback:true});
  const frame=Number(entry.root.dataset.sourceTime)*30,step=frame-previous;
  if(Math.abs(step)>tolerance){steps.push(step);changes++;}
  previous=frame;
 }
 return {steps,updates,changes,duration};
}

function cases(hz,speed){
 const rows=[];
 for(let index=0;index<=16;index++)for(const pattern of patterns)
  rows.push({hz,speed,phase:index*(1000/hz)/16,pattern});
 return rows;
}

function continuous(result,label){
 assert.ok(result.steps.length>10,label+' 必须实际推进多帧');
 // 半帧起点第一次进入完整原帧可只前进半帧；其余必须逐帧前进。
 result.steps.forEach((step,index)=>assert.ok(Math.abs(step-1)<tolerance||index===0&&Math.abs(step-.5)<tolerance,
  label+' 出现不连续原帧：'+step));
 assert.ok(result.changes<=Math.ceil(result.duration*30/1000)+1,label+' 不能因轻量检查增多而生成额外画面');
}

test('材质原速一次播放在六十与一百二十赫兹屏幕的不同起相和轻微抖动下逐帧前进',()=>{
 const env=environment(),defaults=anime.engine.defaults.frameRate;
 const timer=anime.createTimer({duration:10000,autoplay:false});
 try{
  for(const entry of env.entries){
   assert.equal(entry.render.frameRate,120,'高刷新轻量检查只由材质动作自己声明');
   for(const hz of [60,120])for(const settings of cases(hz,1)){
    const label=entry.definition.name+' / '+hz+'赫兹 / 起相'+settings.phase+' / '+settings.pattern;
    continuous(runScreens(entry,timer,settings),label);
   }
  }
  assert.equal(anime.engine.defaults.frameRate,defaults,'不得调整其他动效的全局默认帧率');
 }finally{timer.cancel();env.close();}
});

test('材质全部允许速度在一百二十赫兹屏幕上保留原帧格，不因轻微抖动跨帧',()=>{
 const env=environment(),timer=anime.createTimer({duration:10000,autoplay:false});
 try{
  for(const entry of env.entries){
   const parameter=entry.definition.parameters.speed;
   for(let speed=parameter.min;speed<=parameter.max;speed+=parameter.step){
    for(const settings of cases(120,speed)){
     const label=entry.definition.name+' / '+speed+'倍 / 起相'+settings.phase+' / '+settings.pattern;
     continuous(runScreens(entry,timer,settings),label);
    }
   }
  }
  // 六十赫兹高速播放的部分间隔会长于一个原帧，屏幕自身跳过的帧不属于此断言范围。
 }finally{timer.cancel();env.close();}
});

test('真实计时器可复现旧的每秒三十次检查与原帧取整叠加造成的跨帧',()=>{
 const env=environment(),timer=anime.createTimer({duration:10000,autoplay:false});
 try{
  const entry=env.entries.find(entry=>entry.definition.id==='material-form-chain');
  for(const hz of [60,120]){
   const failures=cases(hz,1).filter(settings=>runScreens(entry,timer,{...settings,sampleRate:30}).steps.some(step=>step>1+tolerance));
   assert.ok(failures.length>0,hz+'赫兹必须能复现原速跨帧，证明检查覆盖实际故障');
   for(const settings of failures)continuous(runScreens(entry,timer,settings),entry.definition.name+' 修复旧故障');
  }
 }finally{timer.cancel();env.close();}
});
