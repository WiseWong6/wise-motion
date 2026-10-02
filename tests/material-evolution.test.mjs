// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {JSDOM} from 'jsdom';
import {frameMarkup} from './helpers.mjs';

const source=await readFile(new URL('../catalog/effects/material-evolution.js',import.meta.url),'utf8');
const keys=await readFile(new URL('../catalog/assets/material-evolution/key-shapes.js',import.meta.url),'utf8');
const ids=['brush-glyph-build','glyph-bar-collapse','dots-lines-cylinders','material-form-chain','spheres-material-merge','atlas-reveal-clear','glyph-cut-ending'];
const starts=[0,2500,3550,6100,8100,9250,356/30*1000];
const ends=[2500,3550,6100,8100,9250,356/30*1000,15054];
const definition=(id,extra={})=>({id,duration_ms:id==='material-evolution-sequence'?15054:ends[ids.indexOf(id)]-starts[ids.indexOf(id)],...extra});
const geometry=node=>{const copy=node.cloneNode(true);copy.querySelectorAll('.kimi-paper').forEach(node=>node.remove());copy.querySelectorAll('[style=""]').forEach(node=>node.removeAttribute('style'));return frameMarkup(copy);};

function setup({canvas=true,manualFrames=false,url=new URL('../catalog/index.html',import.meta.url).href}={}){
 const dom=new JSDOM('<!doctype html><head></head><body><div id="root"></div></body>',{url,runScripts:'outside-only'}),w=dom.window;
 const canvases=[],draws=[],requests=[],imageLoads=[],frames=new Map();let serial=0;
 // 这里只记录绘制调用。合成的字形采样用于走完粒子分支，不代表任何像素验收。
 function context(node){
  const stack=[],gradient={addColorStop(){}};
  const c={globalAlpha:1,save(){stack.push({globalAlpha:this.globalAlpha});},restore(){Object.assign(this,stack.pop());},
   setTransform(){},clearRect(){},scale(){},translate(){},rotate(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},rect(){},clip(){},ellipse(){},
   fillRect(){draws.push({node,op:'fillRect'});},strokeRect(){draws.push({node,op:'strokeRect'});},fill(path){draws.push({node,op:'fill',path:path?.data});},drawImage(image){draws.push({node,op:'image',image});},createLinearGradient(){return gradient;},
   getImageData(){const data=new Uint8ClampedArray(1280*720*4);for(let i=0;i<data.length;i+=4){data[i]=25;data[i+3]=255;}return {data};}};
  return c;
 }
 w.HTMLCanvasElement.prototype.getContext=function(type,options){
  if(!canvas)return null;
  if(!this._context){canvases.push(this);this._context=context(this);this._options=options;}
  return this._context;
 };
 w.Path2D=class {constructor(data){this.data=data;}};
 w.Image=class {
  complete=false;naturalWidth=0;
  set src(value){this._src=value;imageLoads.push(value);queueMicrotask(()=>{this.complete=true;this.naturalWidth=1254;this.onload?.();});}
  get src(){return this._src;}
  async decode(){}
 };
 w.requestAnimationFrame=callback=>{const id=++serial;frames.set(id,callback);if(!manualFrames)queueMicrotask(()=>{const cb=frames.get(id);frames.delete(id);cb?.(id);});return id;};
 w.cancelAnimationFrame=id=>frames.delete(id);
 const append=w.document.head.append.bind(w.document.head);
 w.document.head.append=(node)=>{append(node);if(node.localName==='script'){requests.push(node.src);queueMicrotask(()=>{w.eval(keys);node.onload?.();});}};
 w.eval(source);
 return {w,dom,canvases,draws,requests,imageLoads,frames,root:w.document.getElementById('root'),close:()=>dom.window.close()};
}

test('接入仅登记七个实际单段及一个组合，组合时间表覆盖完整设计时钟',()=>{
 const context={MotionFactories:{}};runInNewContext(source,context);
 assert.deepEqual(Object.keys(context.MotionFactories),[...ids,'material-evolution-sequence']);
 const rows=context.MotionFactories['material-evolution-sequence'].breakdown;
 assert.equal(rows.length,7);
 rows.forEach((row,i)=>{assert.equal(row.id,ids[i]);assert.equal(row.start,starts[i]);assert.equal(row.end,ends[i]);assert.deepEqual(Array.from(row.actions),[ids[i]]);});
 assert.ok(Object.values(context.MotionFactories).every(factory=>factory.requiresPreparation===true));
 assert.doesNotMatch(source,/fetch\s*\(|XMLHttpRequest|Math\.random|setInterval|import\s*\(/);
 assert.doesNotMatch(source,/assets\/kimi-open\//);
});

test('无画布环境明确标记能力缺失，稳定定位且不请求素材或假装完成绘制',()=>{
 const e=setup({canvas:false});
 try{
  for(const id of [...ids,'material-evolution-sequence']){
   const draw=e.w.MotionFactories[id](e.root,{},definition(id));
   assert.equal(draw.ready,undefined);assert.equal(e.root.dataset.renderState,'canvas-unavailable');
   assert.equal(e.root.querySelectorAll('[data-layer]').length,id==='material-evolution-sequence'?7:0);
   draw(800);const before=e.root.innerHTML;draw(0);draw(800);assert.equal(e.root.innerHTML,before);
   draw.destroy();
  }
  assert.equal(e.requests.length,0);assert.equal(e.imageLoads.length,0);assert.equal(e.draws.length,0);
 }finally{e.close();}
});

test('实际分段各自构建自己的绘制节点，共享大字形资料而按需加载材料',async()=>{
 const e=setup();
 try{
  const sphere=e.w.MotionFactories['spheres-material-merge'](e.root,{},definition('spheres-material-merge'));
  await sphere.ready;
  assert.equal(e.requests.length,0,'球体无需载入六兆字形资料');
  assert.equal(e.imageLoads.length,2);assert.equal(e.root.querySelectorAll('.fiber-sphere').length,3);
  assert.equal(e.root.querySelectorAll('.atlas-object,.wire-lines,.ending-shape').length,0);
  sphere(2000/3);assert.match(e.root.querySelector('.fiber-sphere[data-sphere="1"]').getAttribute('transform'),/scale\(1\.7364 1\.5078\)/,'合体仍保留原片压扁的实测半径');
  sphere.destroy();
  const brush=e.w.MotionFactories['brush-glyph-build'](e.root,{},definition('brush-glyph-build'));
  brush(1800);await brush.ready;
  assert.equal(e.root.dataset.materialTime,'1800');assert.equal(e.root.dataset.renderState,'ready');
  assert.equal(e.root.querySelectorAll('canvas').length,1);assert.equal(e.root.querySelectorAll('.wire-lines,.fiber-spheres,.atlas-object').length,0);
  assert.equal(e.requests.length,1);assert.ok(e.requests[0].endsWith('/catalog/assets/material-evolution/key-shapes.js'));
  assert.ok(e.draws.some(draw=>draw.op==='fill'&&typeof draw.path==='string'&&draw.path.length>100),'必须实际填充精修后的字形路径');
  brush.destroy();
  const dots=e.w.MotionFactories['dots-lines-cylinders'](e.root,{},definition('dots-lines-cylinders'));
  await dots.ready;assert.equal(e.requests.length,1,'后续颗粒继续共享同一份字形资料');
  assert.equal(e.root.querySelectorAll('.wire-points rect').length,462);
  assert.equal(e.root.querySelectorAll('.fiber-spheres,.atlas-object,.bridge-code').length,0);
  dots.destroy();
 }finally{e.close();}
});

test('组合的七个稳定节点复用单段实际绘制，边界和反向定位保持同一几何',async()=>{
 const e=setup();let whole;
 try{
  whole=e.w.MotionFactories['material-evolution-sequence'](e.root,{},definition('material-evolution-sequence'));
  const layers=[...e.root.querySelectorAll('[data-layer]')];await whole.ready;
  assert.deepEqual([...e.root.querySelectorAll('[data-layer]')],layers,'准备完成不得替换拆解面板持有的节点');
  assert.equal(e.root.querySelectorAll('.kimi-paper').length,1);
  for(let i=0;i<ids.length;i++){
   const host=e.w.document.createElement('div'),single=e.w.MotionFactories[ids[i]](host,{},definition(ids[i]));await single.ready;
   for(const local of [0,(ends[i]-starts[i])*.45,ends[i]-starts[i]-.1]){
    single(local);whole(starts[i]+local);
    assert.ok(geometry(layers[i])===geometry(host),ids[i]+' 组合必须复用单段真实绘制');
    assert.equal(layers.filter(node=>node.style.visibility==='visible').length,1);assert.equal(layers[i].style.visibility,'visible');
    const before=e.root.innerHTML;whole(15054-(starts[i]+local));whole(starts[i]+local);assert.ok(e.root.innerHTML===before,ids[i]+' 回拖后所有图层保持确定');
   }
   single.destroy();
  }
  whole(1800);const changes=new e.w.MutationObserver(()=>{});changes.observe(e.root,{subtree:true,attributes:true,childList:true});whole(1800);assert.equal(changes.takeRecords().length,0,'同帧不可再写入绘制节点');changes.disconnect();
  whole(10000);const count=e.draws.length;whole(10033);whole(12500);whole(12533);assert.equal(e.draws.length,count,'图鉴和结尾阶段不能继续绘制隐藏的书法及一万七千颗粒');
  for(const svg of e.root.querySelectorAll('svg.review-svg')){assert.equal(svg.style.width,'640px');assert.equal(svg.style.height,'360px');assert.equal(svg.style.position,'absolute');assert.equal(svg.style.display,'block');}
  whole(15054);assert.equal(e.root.querySelector('.ending-black').getAttribute('opacity'),'1');
  assert.ok(e.canvases.filter(node=>node._options?.willReadFrequently).every(node=>node.classList.contains('bridge-ball-layer')||!node.isConnected),'只有桥接读像素画布使用频繁读取配置');
 }finally{whole?.destroy();e.close();}
});

test('双实例的内部图形引用唯一，预览销毁不会清除另一个实例的缓存',async()=>{
 const e=setup();let first,second;
 try{
  const host=e.w.document.createElement('div');e.w.document.body.append(host);
  first=e.w.MotionFactories['material-evolution-sequence'](e.root,{},definition('material-evolution-sequence'));
  second=e.w.MotionFactories['material-evolution-sequence'](host,{},definition('material-evolution-sequence'));await Promise.all([first.ready,second.ready]);
  const names=[...e.w.document.querySelectorAll('svg [id]')].map(node=>node.id);assert.equal(new Set(names).size,names.length);
  for(const svg of e.w.document.querySelectorAll('svg')){
   const localIds=new Set([...svg.querySelectorAll('[id]')].map(node=>node.id));
   for(const node of svg.querySelectorAll('*'))for(const attr of node.attributes){
    const refs=[...attr.value.matchAll(/url\(#([^)]*)\)/g)].map(match=>match[1]);if(attr.name==='href'&&attr.value.startsWith('#'))refs.push(attr.value.slice(1));
    refs.forEach(id=>assert.ok(localIds.has(id),'每个 SVG 必须引用自身拥有的图形：'+id));
   }
  }
  second(1833);first.destroy();first=null;second(1867);assert.ok(host.querySelector('canvas').width>0);assert.equal(host.dataset.renderState,'ready');
 }finally{first?.destroy();second?.destroy();e.close();}
});

test('单帧缩略图只准备当前段，保留画布像素时仍清理异步任务和离屏缓存',async()=>{
 const e=setup();let draw;
 try{
  draw=e.w.MotionFactories['material-evolution-sequence'](e.root,{},definition('material-evolution-sequence',{poster_only:true,poster_time_ms:1800}));await draw.ready;
  assert.equal(e.imageLoads.length,0);assert.equal(e.requests.length,1);
  assert.equal(e.root.querySelectorAll('.fiber-spheres,.atlas-object,.bridge-code').length,0);
  const visible=e.root.querySelector('canvas'),canvasCount=e.canvases.length;
  const before=e.root.innerHTML;draw.destroy(true);draw=null;
  assert.equal(visible.width,1280);assert.equal(visible.height,720);assert.equal(e.root.innerHTML,before);
  assert.ok(e.canvases.filter(node=>node!==visible).every(node=>node.width===0),'失活后释放所有离屏姿态和探测画布');
  assert.ok(canvasCount<8,'缩略图不得准备全部动作姿态');
  assert.equal(e.frames.size,0);
 }finally{draw?.destroy();e.close();}
});

test('准备中的定位以最后用户时间为准，销毁会结束等待并保留其他实例可用',async()=>{
 const e=setup({manualFrames:true});let draw;
 try{
  draw=e.w.MotionFactories['brush-glyph-build'](e.root,{},definition('brush-glyph-build'));
  draw(600);draw(2100);assert.equal(e.root.dataset.materialTime,'2100');
  for(let i=0;i<8&&e.frames.size===0;i++)await Promise.resolve();
  assert.ok(e.frames.size>0);draw.destroy();await draw.ready;assert.equal(e.frames.size,0);
  assert.ok(e.canvases.every(node=>node.width===0),'取消准备后不得留活画布');
 }finally{draw?.destroy();e.close();}
});

test('实际预热恢复最新定位，准备过程不改变用户请求的播放时钟',async()=>{
 const e=setup({manualFrames:true});let draw;
 try{
  draw=e.w.MotionFactories['brush-glyph-build'](e.root,{},definition('brush-glyph-build'));draw(2100);
  for(let i=0;i<40&&e.root.dataset.renderState!=='ready';i++){
   for(const [id,callback] of [...e.frames]){e.frames.delete(id);callback(id);}
   await Promise.resolve();
  }
  await draw.ready;assert.equal(e.root.dataset.materialTime,'2100');assert.equal(e.root.dataset.sourceTime,'2.1');assert.equal(e.root.dataset.renderState,'ready');
 }finally{draw?.destroy();e.close();}
});

test('正式预览与根目录独立导出均从实际效果脚本定位本地素材',async()=>{
 for(const page of [new URL('../catalog/index.html',import.meta.url).href,new URL('../demo.html',import.meta.url).href]){
  const e=setup({url:page});let draw;
  try{
   // 导出页面通过与目录相同的本地脚本引用加载，不能把资产相对到 HTML 的目录。
   const script=e.w.document.createElement('script');script.src=new URL('../catalog/effects/material-evolution.js',import.meta.url).href;e.w.document.body.append(script);e.w.eval(source);
   draw=e.w.MotionFactories['atlas-reveal-clear'](e.root,{},definition('atlas-reveal-clear',{poster_only:true,poster_time_ms:700}));await draw.ready;
   assert.equal(e.requests.length,0);assert.ok(e.imageLoads.every(url=>url.includes('/catalog/assets/material-evolution/')));
   assert.equal(e.root.querySelectorAll('.atlas-object').length,37);
   assert.ok([...e.root.querySelectorAll('image')].every(node=>node.getAttribute('href').includes('/catalog/assets/material-evolution/')));
  }finally{draw?.destroy();e.close();}
 }
});
