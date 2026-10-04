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
