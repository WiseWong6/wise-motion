// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {environment,data,frameMarkup} from './helpers.mjs';
import {history,state} from '../scripts/history.mjs';
const effect=data.effects.find(e=>e.id==='letter-ripple');
const cross=JSON.parse(await readFile(state+'/crosswalk.json','utf8'));
const files=cross.rules['letter-ripple'].migration.files;
const original=await readFile(files[0].file,'utf8');
const adapter=await readFile(files[1].file,'utf8');
const adapted=await readFile(new URL('../catalog/effects/letter-ripple.js',import.meta.url),'utf8');
const extract=(source,a,b)=>{
  const start=source.indexOf(a),end=source.indexOf(b,start+1);
  assert.ok(start>=0&&end>start,`找不到原函数：${a} → ${b}`);
  return source.slice(start,end);
};
const blocks=[
  ['function makeButterflyWing(','function createParticle('],
  ['function flightPoint(','function flashPulse('],
  ['function flashPulse(','// 参考动作库“自身轨迹光丝”'],
  ['function waterCenter(','let sourceBeamTexture=null;'],
  ['function waterGlyph(','// 落点来自底图'],
  ['function starAmount(','function drawStarfield('],
  ['function drawSettlingItem(','function composerOpacity('],
  ['let galaxyStarGlow=null;','function nearestStar(']
];
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
// 默认检查无需浏览器或额外依赖；像素对照可显式指定宿主已有的画布库。
const native=process.env.WISE_MOTION_CANVAS_MODULE?createRequire(import.meta.url)(process.env.WISE_MOTION_CANVAS_MODULE):null;
function fakeCanvas(width=300,height=150){
  const canvas={width,height,dataset:{},draws:0};
  const context=new Proxy({
    measureText:text=>({width:Array.from(text).length*17.82}),
    createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),
    createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
    getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)})
  },{get(target,key){return key in target?target[key]:(...args)=>{canvas.draws++;};}});
  canvas.getContext=()=>context;return canvas;
}
class EmptyPath{addPath(){}moveTo(){}lineTo(){}bezierCurveTo(){}quadraticCurveTo(){}closePath(){}arc(){}ellipse(){}rect(){}}
function factoryHost(fontPromise=Promise.resolve(),library){
  const canvases=[],make=(width=300,height=150)=>{
    const canvas=library?library.createCanvas(width,height):fakeCanvas(width,height);
    canvas.dataset={};canvases.push(canvas);return canvas;
  };
  const document={createElement:tag=>{assert.equal(tag,'canvas');return make();},fonts:{load:()=>fontPromise}};
  const context=vm.createContext({document,MotionFactories:{},Path2D:library?.Path2D||EmptyPath});
  vm.runInContext(adapted,context);
  const root={dataset:{},set innerHTML(value){assert.match(value,/width="1280" height="720"/);this.firstElementChild=make(1280,720);}};
  return {root,canvases,context,document,render:context.MotionFactories[effect.id](root)};
}

test('原水面、字形逐像素折射、模糊、符号与飞行函数逐段保持一致',()=>{
  for(const [a,b]of blocks)assert.ok(adapted.includes(extract(original,a,b).trim()),`${a} 被改写`);
  assert.doesNotMatch(adapted,/requestAnimationFrame|setInterval|setTimeout|fetch\(/);
});

test('字体异步到达后补画缩略图；销毁的预览不再绘制且缓存全部释放',async()=>{
  const pending=deferred(),thumb=factoryHost(pending.promise);
  thumb.render(2750);thumb.render.destroy(true);
  const canvas=thumb.root.firstElementChild,before=canvas.draws;
  pending.resolve();await thumb.render.ready;
  assert.ok(canvas.draws>before,'保留的缩略图须补画正确字体');
  assert.equal(canvas.dataset.time,'2.6');assert.equal(canvas.width,1280);
  assert.ok(thumb.canvases.length>10,'已真正执行水面和字形绘制');
  assert.ok(thumb.canvases.slice(1).every(c=>c.width===1&&c.height===1),'辅助画布应释放');
  const complete=canvas.draws;thumb.render(4000);assert.equal(canvas.draws,complete);
  const wait=deferred(),closed=factoryHost(wait.promise);
  closed.render(2750);closed.render.destroy();const draws=closed.root.firstElementChild.draws;
  wait.resolve();await closed.render.ready;
  assert.equal(closed.root.firstElementChild.draws,draws);assert.equal(closed.canvases.length,1);
  const failure=deferred(),missing=factoryHost(failure.promise);missing.render(1000);
  failure.reject(new Error('字体未加载'));await assert.rejects(missing.render.ready,/字体未加载/);
  assert.equal(missing.root.dataset.fontError,effect.id);assert.equal(missing.canvases.length,1);
  missing.render.destroy();
});

test('正式入口、缩略图、旧名搜索和导出完整，定位稳定且原工程未改动',async()=>{
  const historical=await history(data);assert.equal(effect.category,'writing');
  assert.ok(!historical.recipes.some(e=>e.history_id==='letter-ripple'));
  assert.ok(historical.excluded.some(e=>e.id==='letter-ripple'));
  for(const file of files)assert.equal(createHash('sha256').update(await readFile(file.file)).digest('hex'),file.sha256);
  const env=await environment(true,{staticPreview:true,hash:'#letter-ripple'});
  try{
    const {w}=env,d=w.document;env.reveal();assert.equal(d.getElementById('preview-title').textContent,effect.name);
    for(const query of [effect.name,...effect.previous_names])assert.equal(w.MotionMatch.rank(data,query)[0].effect.id,effect.id);
    const thumb=d.querySelector('[data-effect="letter-ripple"] .thumb .motion-stage'),root=d.createElement('div');
    const player=w.MotionRuntime.create(root,effect);player.seek(effect.preview_ms);
    assert.equal(frameMarkup(thumb),frameMarkup(root.firstElementChild));
    for(const stage of [thumb,root.firstElementChild])assert.equal(stage.dataset.art,'original','原画面不能叠加目录暗角或颗粒');
    const canvas=root.querySelector('canvas');assert.ok(canvas);assert.equal(root.querySelectorAll('svg').length,0);
    player.seek(0);const start=root.innerHTML;player.seek(150);assert.equal(root.innerHTML,start);
    player.seek(5550);const end=root.innerHTML;player.seek(6000);assert.equal(root.innerHTML,end);
    player.seek(2200);const middle=root.innerHTML;player.seek(900);player.seek(2200);assert.equal(root.innerHTML,middle);
    const observer=new w.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true});
    player.seek(2200);assert.equal(observer.takeRecords().length,0);observer.disconnect();
    assert.equal(root.querySelector('canvas'),canvas);player.destroy();
    assert.match(d.getElementById('code').textContent,/catalog\/effects\/letter-ripple\.js/);
    assert.equal(w.MotionRuntime.instanceCount,1);assert.equal(w.MotionRuntime.runningCount,0);
  }finally{env.w.MotionThumbs.disposeAll();env.close();}
});

test('去掉蓝底后前景与原适配器逐像素一致，字体一致，前进与回拖无残影', {skip:!native},async()=>{
  const originalFont=files.find(f=>f.file.endsWith('.ttf')).file;
  assert.ok(native.GlobalFonts.registerFromPath(originalFont,'Completed WenKai'));
  assert.ok(native.GlobalFonts.registerFromPath(new URL('../catalog/fonts/WiseMotionLetter-Regular.woff2',import.meta.url).pathname,'Wise Motion Letter'));
  const text='那些凌晨时分敲下的代码，是不会说谎的星星。';
  const pixels=canvas=>Buffer.from(canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data);
  const sha=canvas=>createHash('sha256').update(pixels(canvas)).digest('hex');
  const fontImages=['Completed WenKai','Wise Motion Letter'].map(f=>{
    const c=native.createCanvas(500,60),g=c.getContext('2d');g.font=`400 17.82px "${f}"`;g.fillText(text,10,35);return pixels(c);
  });
  assert.ok(fontImages[0].equals(fontImages[1]),'原字体和本地打包字体的绘制不同');
  const current=factoryHost(Promise.resolve(),native);await current.render.ready;
  const base=native.createCanvas(1280,720),ctx=base.getContext('2d');
  const reference=vm.createContext({document:current.document,Path2D:native.Path2D,base,ctx,window:{CompletedAssets:{font:()=>Promise.resolve()}}});
  const galaxy=await readFile(files.find(f=>f.file.endsWith('galaxy-stars.js')).file,'utf8');
  const setup=extract(original,'const W =','let particles =')+`
    const reduce=false,canvas=base,DEFAULT_TEXT=${JSON.stringify(text)};
    let clock=0,water=null,cycle=null,particles=[],seed=20261002;
    const random=(a,b)=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return a+(b-a)*seed/4294967296;};
    const clamp=x=>Math.max(0,Math.min(1,x));const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  `+blocks.map(([a,b])=>extract(original,a,b)).join('\n')+
    extract(original,'function createParticle(','function flightEnd(')+
    galaxy+extract(original,'function galaxyTargets(','function galaxyBand(')+
    extract(original,'function arrangeStarfield(','  cycle.symbols=burst;')+'}\n';
  // 参考对象直接执行原预览适配器，接入相同横向画板，并按用户要求去掉蓝底。
  const viewport='base.width=1280;base.height=720;const scale=base.width/W;ctx.setTransform(scale,0,0,scale,0,base.height*.7-H*.7*scale);';
  const transparentAdapter=adapter.replace("ctx.fillStyle='#164df2';ctx.fillRect(0,0,W,H);",'');
  assert.notEqual(transparentAdapter,adapter,'原适配器应仅移除蓝底填充');
  const referencePlayer=await vm.runInContext(`(async()=>{${setup}\nconst mode='ripple';\n${transparentAdapter.replace('base.width=W;base.height=H;',viewport)}\n})()`,reference);
  const hashes=new Set();
  for(const t of [0,.25,.8,1.4,2.2,3.2,5.4,2.2,.25,5.4]){
    referencePlayer.render(t);current.render(150+t*1000);
    const actual=pixels(current.root.firstElementChild),expected=pixels(base);
    assert.ok(actual.equals(expected),`原片段 ${t} 秒画面不一致`);
    assert.equal(actual[3],0,'画板左上角应透明');
    assert.equal(actual[actual.length-1],0,'画板右下角应透明');
    hashes.add(sha(current.root.firstElementChild));
  }
  assert.equal(hashes.size,7,'不同阶段必须真正改变像素');
  const retained=sha(current.root.firstElementChild);current.render(6000);assert.equal(sha(current.root.firstElementChild),retained);
  current.render.destroy();
});
