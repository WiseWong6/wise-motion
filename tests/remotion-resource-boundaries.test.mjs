// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createFrameDocument} from '../remotion/frame-document.mjs';

function harness({id,path,dependencies=[],type,available=false}) {
 const dom=new JSDOM(createFrameDocument({assetBaseUrl:'file:///independent-project/public/wise-motion/'}),{runScripts:'outside-only'}),w=dom.window;
 const context={canvasContext:type},calls={dispose:0,destroy:0,draw:0};
 const original=function(requested){assert.equal(requested,type);return available?context:null;};
 w.HTMLCanvasElement.prototype.getContext=original;
 w.anime={engine:{pause(){}}};w.MotionRuntime={disposeAll(){calls.dispose++;}};
 let canvas;
 w.MotionKit={prepareStage(){},createRenderer(stage){
  canvas=w.document.createElement('canvas');stage.append(canvas);
  const actual=canvas.getContext(type);
  if(available)assert.equal(actual,context,'成功请求必须返回原上下文，不能替换材质或绘图实现');
  const render=()=>{calls.draw++;};render.ready=Promise.resolve();render.destroy=()=>{calls.destroy++;};return render;
 }};
 w.eval(w.document.querySelector('script').textContent);
 const definition={id,duration_ms:2000,default_ease:'linear',source:{path,dependencies}};
 return {w,original,calls,definition,get canvas(){return canvas;},create:()=>w.__wiseMotionCreateSession({definition}),close(){w.__wiseMotionSession?.destroy();w.close();}};
}

for(const item of [
 {id:'metal-impact-type-sequence',path:'catalog/effects/metal-impact.js',type:'webgl'},
 {id:'geometric-poster-sequence',path:'catalog/effects/geometric-poster.js',type:'2d'},
 {id:'motion-oasis-sequence',path:'catalog/effects/motion-oasis.js',type:'2d'},
 {id:'seed-bloom-brand-sequence',path:'catalog/effects/seed-bloom-brand.js',type:'2d'},
 {id:'civilization-growth-sequence',path:'catalog/effects/civilization-growth.js',type:'2d'},
 {id:'rapid-cut',path:'catalog/effects/transition.js',dependencies:['catalog/effects/geometric-poster.js'],type:'2d'}
])test(item.id+' 的画布不可用时明确失败并恢复资源接口',async()=>{
 const h=harness(item);try{
  await assert.rejects(h.create(),error=>{assert.ok(error.message.includes(item.id));assert.ok(error.message.includes(item.type));return true;});
  assert.equal(h.w.__wiseMotionSession.destroyed,true);
  assert.equal(h.w.document.querySelector('.motion-stage').childElementCount,0);
  assert.equal(h.w.HTMLCanvasElement.prototype.getContext,h.original);
  assert.equal(h.calls.dispose,1);
  h.w.__wiseMotionSession.destroy();assert.equal(h.calls.dispose,1);
 }finally{h.close();}
});

test('成功绘制保留原图形上下文，销毁只释放一次且恢复接口',async()=>{
 const h=harness({id:'metal-impact-type-sequence',path:'catalog/effects/metal-impact.js',type:'webgl',available:true});try{
  const session=await h.create();await session.draw(500);
  assert.equal(h.calls.draw,2);assert.equal(session.stage.dataset.remotionTime,'500');
  session.destroy();session.destroy();
  assert.equal(h.calls.destroy,1);assert.equal(h.calls.dispose,1);
  assert.equal(h.w.HTMLCanvasElement.prototype.getContext,h.original);
  await assert.rejects(session.draw(750),/销毁/);
 }finally{h.close();}
});

test('图形上下文丢失后拒绝输出成功帧',async()=>{
 const h=harness({id:'metal-impact-type-sequence',path:'catalog/effects/metal-impact.js',type:'webgl',available:true});try{
  const session=await h.create();await session.draw(500);
  h.canvas.dispatchEvent(new h.w.Event('webglcontextlost'));
  await assert.rejects(session.draw(750));
  assert.equal(session.stage.dataset.remotionTime,'500','失败后不能把未完成画面标为下一帧');
  session.destroy();assert.equal(h.w.HTMLCanvasElement.prototype.getContext,h.original);
 }finally{h.close();}
});

test('首帧按文字准备共用字体，不下载未使用的完整字库，并等待实际画面字体',async()=>{
 const h=harness({id:'font-fixture',path:'catalog/effects/entrance.js',type:'2d',available:true});
 const requested=[];let release;
 const fonts=[{load(){assert.fail('不能逐一下载全部字体');}}];
 fonts.load=async(font,text)=>{requested.push({font,text});return [];};
 fonts.ready=new Promise(resolve=>{release=resolve;});
 Object.defineProperty(h.w.document,'fonts',{value:fonts});
 h.definition.content={title:'𠮷野家，测试自定义字形'};
 try{
  let done=false;const preparation=h.create().then(session=>{done=true;return session;});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(done,false,'实际画面的字体尚未准备好时不可宣告首帧成功');
  assert.equal(h.calls.draw,1);
  assert.equal(requested.length,4);
  assert.ok(requested.every(row=>row.text.includes('𠮷野家')),'自定义字符必须参与字体分片匹配');
  assert.ok(requested.every(row=>!row.font.includes('WenKai')),'无关楷体不阻塞普通动效');
  release();const session=await preparation;
  assert.equal(h.calls.draw,2,'字体就绪后重新绘制，避免保留后备字形');
  await session.draw(200);assert.equal(h.calls.draw,3);
 }finally{release();h.close();}
});

test('字体准备失败时报告错误，取消中的预览不会创建绘制器',async()=>{
 for(const failed of [true,false]){
  const h=harness({id:'font-fixture',path:'catalog/effects/entrance.js',type:'2d',available:true});
  let release;const pending=new Promise((resolve,reject)=>{release=()=>failed?reject(new Error('font unavailable')):resolve([]);});
  Object.defineProperty(h.w.document,'fonts',{value:{load:()=>pending,ready:Promise.resolve()}});
  try{
   const preparation=h.create();const checked=assert.rejects(preparation,failed?/font unavailable/:/销毁/);
   if(!failed)h.w.__wiseMotionSession.destroy();
   release();await checked;assert.equal(h.calls.draw,0);assert.equal(h.calls.dispose,1);
  }finally{h.close();}
 }
});

test('实时播放只在新图片加载和解码期间等待，暖帧、错误及销毁保持正确',async()=>{
 const dom=new JSDOM(createFrameDocument({assetBaseUrl:'file:///independent-project/public/wise-motion/'}),{runScripts:'outside-only'}),w=dom.window;
 const requests=[];let source='',waits=0;
 w.Image=class {set src(value){this.url=value;requests.push(this);}decode(){return new Promise(resolve=>{this.decoded=resolve;});}};
 w.anime={engine:{pause(){}}};w.MotionRuntime={disposeAll(){}};
 w.MotionKit={prepareStage(){},createRenderer(stage){const image=w.document.createElement('img');return ()=>{if(source){image.src=source;stage.append(image);}};}};
 w.eval(w.document.querySelector('script').textContent);
 const tick=()=>new Promise(resolve=>setImmediate(resolve));
 try{
  const session=await w.__wiseMotionCreateSession({definition:{id:'image-fixture',duration_ms:2000,default_ease:'linear'}});
  await session.draw(0,0,'playback',undefined,()=>{waits++;});assert.equal(waits,0);
  source='first.png';let done=false;
  const first=session.draw(100,100,'playback',undefined,()=>{waits++;}).then(()=>{done=true;});await tick();
  assert.equal(waits,1);assert.equal(done,false);assert.equal(session.stage.dataset.remotionTime,'0');
  const queued=session.draw(150,150,'playback',undefined,()=>{waits++;});
  assert.equal(waits,2,'快速定位的新帧须接管上一帧尚未完成的等待');
  requests[0].onload();await tick();assert.equal(done,false,'下载完成但尚未解码仍须等待');
  requests[0].decoded();await first;await queued;assert.equal(session.stage.dataset.remotionTime,'150');
  await session.draw(200,200,'playback',undefined,()=>{waits++;});assert.equal(waits,2);assert.equal(requests.length,1,'已准备图片不能重复加载或阻塞暖帧');
  source='missing.png';const failed=session.draw(300,300,'playback',undefined,()=>{waits++;});const rejected=assert.rejects(failed,/无法加载/);await tick();
  requests[1].onerror();await rejected;assert.equal(waits,3);assert.equal(session.stage.dataset.remotionTime,'200');
  source='pending.png';const pending=session.draw(400,400,'playback',undefined,()=>{waits++;});const cancelled=assert.rejects(pending,/销毁/);await tick();
  session.destroy();requests[2].onload();await tick();requests[2].decoded();await cancelled;
  assert.equal(session.stage.dataset.remotionTime,'200');assert.equal(session.stage.childElementCount,0);
 }finally{w.__wiseMotionSession?.destroy();w.close();}
});
