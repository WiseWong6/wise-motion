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
// visibility 可由子节点覆盖，检查实际 display 祖先才能保证整段退出绘制树。
const displayed=node=>{
 for(let parent=node;parent;parent=parent.parentElement){
  if(parent.hidden||parent.getAttribute('display')==='none'||parent.ownerDocument.defaultView.getComputedStyle(parent).display==='none')return false;
 }
 return true;
};
const near=(actual,expected,message)=>assert.ok(Math.abs(Number(actual)-expected)<.000002,message||`${actual} 应接近 ${expected}`);

function setup({canvas=true,manualFrames=false,url=new URL('../catalog/index.html',import.meta.url).href}={}){
 const dom=new JSDOM('<!doctype html><head></head><body><div id="root"></div></body>',{url,runScripts:'outside-only'}),w=dom.window;
 const canvases=[],draws=[],requests=[],imageLoads=[],frames=new Map();let serial=0;
 // 这里只记录绘制调用。合成的字形采样用于走完粒子分支，不代表任何像素验收。
 function context(node){
  const stack=[],gradient={addColorStop(){}};
  const c={globalAlpha:1,save(){stack.push({globalAlpha:this.globalAlpha});},restore(){Object.assign(this,stack.pop());},
   setTransform(){},clearRect(){draws.push({node,op:'clear'});},scale(){},translate(){},rotate(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},rect(){},clip(){},ellipse(){},
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
    assert.equal(layers.filter(displayed).length,1);assert.ok(displayed(layers[i]));
    const before=geometry(layers[i]);whole(15054-(starts[i]+local));whole(starts[i]+local);
    assert.equal(geometry(layers[i]),before,ids[i]+' 回拖后当前可见画面保持确定，隐藏段可以保留自己的缓存');
    assert.equal(layers.filter(displayed).length,1);assert.ok(displayed(layers[i]));
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

test('整段隐藏能遮住自身显式可见的圆柱、字符和图鉴物件',async()=>{
 const e=setup();let whole;
 try{
  whole=e.w.MotionFactories['material-evolution-sequence'](e.root,{},definition('material-evolution-sequence'));await whole.ready;
  const bridge=e.root.querySelector('[data-layer="material-form-chain"]'),atlas=e.root.querySelector('[data-layer="atlas-reveal-clear"]');
  whole(6100);const wire=bridge.querySelector('.bridge-wire');
  assert.equal(wire.getAttribute('visibility'),'visible');assert.ok(displayed(wire));
  assert.ok(bridge.querySelector('.bridge-wire-clip').getAttribute('d').length>0);
  whole(9250);const stair=atlas.querySelector('.atlas-object[data-region="stair-plan"]');
  assert.equal(stair.getAttribute('visibility'),'visible');assert.ok(displayed(stair));
  assert.ok(Number(stair.dataset.progress)>0,'图鉴首态确实已显影，不用空节点代替穿帮复现');
  for(const time of [0,1800,2499,3550,8100,12500]){
   whole(time);
   for(const layer of [bridge,atlas])if(layer.dataset.layer!==e.root.dataset.materialPhase){
    assert.equal(layer.style.display,'none');
    for(const node of layer.querySelectorAll('[visibility="visible"]'))assert.equal(displayed(node),false,'显式可见的子项必须受整段 display 隐藏约束');
   }
  }
 }finally{whole?.destroy();e.close();}
});

test('切段只绘制接棒画面，不再为已隐藏的书法和颗粒补画末帧',async()=>{
 const e=setup();let whole;
 try{
  whole=e.w.MotionFactories['material-evolution-sequence'](e.root,{},definition('material-evolution-sequence'));await whole.ready;
  for(const [id,before,after] of [['glyph-bar-collapse',3549,3550],['dots-lines-cylinders',6099,6100],['material-form-chain',8099,8100]]){
   whole(before);const layer=e.root.querySelector(`[data-layer="${id}"]`),canvas=layer.querySelector('canvas');
   const operations=()=>e.draws.filter(row=>row.node===canvas).length;
   const count=operations();assert.ok(count>0,'退出前确实运行过该段画布');
   whole(after);assert.equal(layer.style.display,'none');assert.equal(operations(),count,id+' 隐藏后不能再清空或重画其画布');
  }
 }finally{whole?.destroy();e.close();}
});

test('播放使用原片帧格并跳过重复画面，手动定位仍保留精确毫秒',async()=>{
 const e=setup();let whole;
 try{
  whole=e.w.MotionFactories['material-evolution-sequence'](e.root,{},definition('material-evolution-sequence'));await whole.ready;
  assert.equal(whole.frameRate,30);
  whole(1000.1,{playback:true});const count=e.draws.length,layer=e.root.querySelector('[data-layer="brush-glyph-build"]'),before=geometry(layer);
  whole(1001,{playback:true});whole(1015,{playback:true});whole(1033.2,{playback:true});
  assert.equal(e.draws.length,count,'同一原片帧内的刷新不能重复绘制');assert.equal(geometry(layer),before);
  near(e.root.dataset.sourceTime,1);
  whole(1034,{playback:true});assert.ok(e.draws.length>count,'跨入下一原片帧应真正绘制');near(e.root.dataset.sourceTime,31/30);
  whole(1001);near(e.root.dataset.materialTime,1001);near(e.root.dataset.sourceTime,1.001);
  const manual=e.draws.length;whole(1001);assert.equal(e.draws.length,manual,'重复手动定位也不重画');
  whole(11850,{playback:true});assert.equal(e.root.querySelector('.atlas-world').style.display,'','原片帧格略过不足一帧的清场光标，不提前露空场');
  whole(11867,{playback:true});assert.equal(e.root.dataset.materialPhase,'glyph-cut-ending');
  whole(15054,{playback:true});near(e.root.dataset.materialTime,15054);assert.equal(e.root.querySelector('.ending-black').getAttribute('opacity'),'1');
 }finally{whole?.destroy();e.close();}
});

test('半帧起点的独立段沿全片帧格播放，末端和手动定位保持精确',async()=>{
 const e=setup();let whole,single;
 try{
  whole=e.w.MotionFactories['material-evolution-sequence'](e.root,{},definition('material-evolution-sequence'));await whole.ready;
  for(const id of ['dots-lines-cylinders','atlas-reveal-clear']){
   const index=ids.indexOf(id),start=starts[index],limit=ends[index]-start,host=e.w.document.createElement('div');
   single=e.w.MotionFactories[id](host,{},definition(id));await single.ready;assert.equal(single.frameRate,30);
   single(1,{playback:true});near(host.dataset.materialTime,0);near(host.dataset.sourceTime,start/1000);
   single(20,{playback:true});whole(start+20,{playback:true});
   near(host.dataset.materialTime,1000/60);near(host.dataset.sourceTime,(start+1000/60)/1000);
   assert.equal(geometry(host),geometry(e.root.querySelector(`[data-layer="${id}"]`)),'独立段和组合对齐完整原片时间，不能从局部起点另开帧格');
   single(21,{playback:true});near(host.dataset.materialTime,1000/60);
   single(20);near(host.dataset.materialTime,20);near(host.dataset.sourceTime,(start+20)/1000);
   single(limit,{playback:true});near(host.dataset.materialTime,limit);near(host.dataset.sourceTime,ends[index]/1000);
   single.destroy();single=null;
  }
 }finally{single?.destroy();whole?.destroy();e.close();}
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

test('准备遮罩在恢复最后定位并给出两次绘制机会后才撤下',async()=>{
 const e=setup({manualFrames:true});let draw;
 const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
 const paint=async()=>{for(const [id,callback] of [...e.frames]){e.frames.delete(id);callback(id);}await settle();};
 try{
  draw=e.w.MotionFactories['brush-glyph-build'](e.root,{},definition('brush-glyph-build'));draw(2100);await settle();
  assert.equal(e.root.dataset.materialTime,'1800','先实际预绘书法昂贵姿态');
  assert.ok(e.root.querySelector('[data-material-preparing]'));
  await paint();assert.equal(e.root.dataset.materialTime,'1800');
  await paint();assert.equal(e.root.dataset.materialTime,'2100','预热后恢复用户最后定位');
  assert.ok(e.root.querySelector('[data-material-preparing]'),'刚恢复画面仍须保留遮罩');
  assert.ok(e.frames.size>0,'恢复后应真正等待浏览器绘制机会');
  await paint();assert.ok(e.root.querySelector('[data-material-preparing]'),'只经过一次绘制机会不能撤遮罩');
  await paint();await draw.ready;
  assert.equal(e.root.querySelector('[data-material-preparing]'),null);assert.equal(e.root.dataset.renderState,'ready');
  near(e.root.dataset.materialTime,2100);assert.equal(e.frames.size,0);
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
