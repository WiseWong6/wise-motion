// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {JSDOM} from 'jsdom';
import {frameMarkup} from './helpers.mjs';

const source=await readFile(new URL('../catalog/effects/material-evolution.js',import.meta.url),'utf8');
const keys=await readFile(new URL('../catalog/assets/material-evolution/key-shapes.js',import.meta.url),'utf8');
test('开头与片尾道字共用古帖轮廓，字形完整落在绘制和粒子采样范围内',()=>{
 const context={};runInNewContext(keys,context);const data=context.WiseMaterialKeyShapes;
 assert.equal(data.traced_character.text,'道');
 assert.equal(data.traced_character.source_file,'vendor/duobaota/page-02.jpg');
 const numbers=data.opening.at(-1).layers[0].path.match(/-?\d+(?:\.\d+)?/g).map(Number);
 const ending=data.ending.find(pose=>pose.label==='道').shapes.flatMap(shape=>Array.from(shape.p,point=>Array.from(point)).flat());
 assert.deepEqual(numbers,Array.from(ending),'片尾不能用另一套拼凑字形代替开头原字');
 for(let i=0;i<numbers.length;i+=2){
  assert.ok(numbers[i]>=176&&numbers[i]<=459,'完整道字不得超出粒子横向采样区');
  assert.ok(numbers[i+1]>=27&&numbers[i+1]<=336,'完整道字不得超出粒子纵向采样区');
 }
 assert.ok(data.opening[0].layers.every(layer=>layer.path===''));
});
const ids=['brush-glyph-build','glyph-bar-collapse','dots-lines-cylinders','material-form-chain','spheres-material-merge','atlas-reveal-clear','glyph-cut-ending'];
const starts=[0,2500,3550,6100,8100,9250,356/30*1000];
const ends=[2500,3550,6100,8100,9250,356/30*1000,15054];
const definition=(id,extra={})=>({id,duration_ms:id==='material-evolution-sequence'?15054:ends[ids.indexOf(id)]-starts[ids.indexOf(id)],...extra});
const geometry=node=>{const copy=node.cloneNode(true);copy.querySelectorAll('.material-shared-paper,.kimi-paper').forEach(node=>node.remove());copy.querySelectorAll('[style=""]').forEach(node=>node.removeAttribute('style'));return frameMarkup(copy);};
// visibility 可由子节点覆盖，检查实际 display 祖先才能保证整段退出绘制树。
const displayed=node=>{
 for(let parent=node;parent;parent=parent.parentElement){
  if(parent.hidden||parent.getAttribute('display')==='none'||parent.ownerDocument.defaultView.getComputedStyle(parent).display==='none')return false;
 }
 return true;
};
const near=(actual,expected,message)=>assert.ok(Math.abs(Number(actual)-expected)<.000002,message||`${actual} 应接近 ${expected}`);

function setup({canvas=true,manualFrames=false,captureCharacters=false,url=new URL('../catalog/index.html',import.meta.url).href}={}){
 const dom=new JSDOM('<!doctype html><head></head><body><div id="root"></div></body>',{url,runScripts:'outside-only'}),w=dom.window;
 const canvases=[],draws=[],requests=[],imageLoads=[],frames=new Map();let serial=0;
 // 这里只记录绘制调用。合成的字形采样用于走完粒子分支，不代表任何像素验收。
 function context(node){
  const stack=[],gradient={addColorStop(){}};
  const c={globalAlpha:1,save(){stack.push({globalAlpha:this.globalAlpha});},restore(){Object.assign(this,stack.pop());},
   setTransform(){},clearRect(){draws.push({node,op:'clear'});},scale(){},translate(){},rotate(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},rect(...args){draws.push({node,op:'rect',args});},clip(rule){draws.push({node,op:'clip',rule});},ellipse(){},
   fillRect(...args){draws.push({node,op:'fillRect',...(captureCharacters?{args,alpha:this.globalAlpha}:{})});},strokeRect(...args){draws.push({node,op:'strokeRect',...(captureCharacters?{args,alpha:this.globalAlpha}:{})});},fill(path){draws.push({node,op:'fill',path:path?.data});},drawImage(image){draws.push({node,op:'image',image});},createLinearGradient(){return gradient;},
   getImageData(){draws.push({node,op:'pixels'});const data=new Uint8ClampedArray(1280*720*4);for(let i=0;i<data.length;i+=4){data[i]=25;data[i+3]=255;}return {data};}};
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
  assert.equal(e.requests.length,0,'球体无需载入书法与字标资料');
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

test('七个独立动作与整片都保留唯一静态纸面兄弟层，定位不重建纸纹',async()=>{
 const e=setup();let draw;
 try{
  for(const id of [...ids,'material-evolution-sequence']){
   const def=definition(id);draw=e.w.MotionFactories[id](e.root,{},def);
   const paper=e.root.querySelector('.material-shared-paper');assert.ok(paper);
   await draw.ready;
   assert.equal(e.root.querySelector('.material-shared-paper'),paper,'内容准备过程中应保留原纸面节点');
   assert.equal(paper.parentElement,e.root,'静态纸面直接作为动作内容的兄弟层');
   for(const time of [0,def.duration_ms*.4,def.duration_ms,def.duration_ms*.8,0]){
    draw(time);assert.equal(e.root.querySelector('.material-shared-paper'),paper,id+' 回拖不能重建纸纹');
    assert.equal(e.root.querySelectorAll('.kimi-paper').length,1);
    assert.equal(e.root.querySelector('.kimi-paper').closest('svg'),paper,'唯一纸纹属于静态纸面 SVG');
    assert.equal(e.root.querySelectorAll('svg.review-svg:not(.material-shared-paper) .kimi-paper').length,0,'动作 SVG 不再包含会被局部滤镜或混色重复处理的纸纹');
    const ending=id==='glyph-cut-ending'||id==='material-evolution-sequence'&&time>=starts.at(-1);
    for(const rect of paper.querySelectorAll('.kimi-paper>rect'))assert.equal(rect.getAttribute('fill'),ending?'#e3e4de':'#e2e3dd');
   }
   draw.destroy();draw=null;
  }
 }finally{draw?.destroy();e.close();}
});

test('字符压聚在正常播放帧之间连续移动，不能一两帧跳到横笔',async()=>{
 const e=setup({captureCharacters:true});let draw;
 try{
  draw=e.w.MotionFactories['glyph-bar-collapse'](e.root,{},definition('glyph-bar-collapse'));await draw.ready;
  const canvas=e.root.querySelector('canvas');
  const positions=[];
  for(let frame=15;frame<=28;frame++){
   const start=e.draws.length;draw(frame/30*1000,{playback:true});
   const strokes=e.draws.slice(start).filter(row=>row.node===canvas&&row.op==='fillRect');
   assert.ok(strokes.length>0);positions.push(strokes[0].args[1]);
  }
  const distance=positions.at(-1)-positions[0];assert.ok(distance>100);
  const steps=positions.slice(1).map((value,i)=>value-positions[i]);
  assert.ok(steps.filter(step=>step>0.001).length>=9,'主体压聚至少有九个不同的中间画面');
  assert.ok(steps.every(step=>step>=0&&step<distance*.18),'相邻正常播放帧不能突然跨过大部分位移');
  const strokesAt=ms=>{const start=e.draws.length;draw(ms);return e.draws.slice(start).filter(row=>row.node===canvas&&(row.op==='fillRect'||row.op==='strokeRect')).map(({op,args,alpha})=>({op,args,alpha}));};
  const middle=strokesAt(700);draw(1050);assert.deepEqual(strokesAt(700),middle,'回拖还原同一批字符的位置与透明度');
 }finally{draw?.destroy();e.close();}
});

test('线团转柱体全程不断线，中途不停在散点位置，末态仍接入下一段',async()=>{
 const e=setup();let draw,bridge;
 try{
  draw=e.w.MotionFactories['dots-lines-cylinders'](e.root,{},definition('dots-lines-cylinders'));await draw.ready;
  const points=[...e.root.querySelectorAll('.wire-points rect')],lines=[...e.root.querySelectorAll('.wire-lines path')];
  assert.equal(points.length,462);
  const perColumn=lines.length/3;assert.ok(Number.isInteger(perColumn));
  for(let ms=1350;ms<=2100;ms+=25){
   draw(ms);
   for(let c=0;c<3;c++){
    const column=lines.slice(c*perColumn,(c+1)*perColumn);
    const opacity=column.reduce((sum,line)=>sum+Number(line.getAttribute('opacity')),0)/column.length;
    assert.ok(opacity>.02,`${ms} 毫秒第 ${c+1} 列不可退成没有连线的空档`);
   }
  }
  const centers=ms=>{draw(ms);return points.map(point=>[Number(point.getAttribute('x'))+Number(point.getAttribute('width'))/2,Number(point.getAttribute('y'))+Number(point.getAttribute('height'))/2]);};
  const before=centers(1629),middle=centers(1630),after=centers(1631);
  const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const velocity=(a,b)=>a.reduce((sum,p,i)=>sum+distance(p,b[i]),0)/a.length;
  assert.ok(velocity(before,middle)>.1&&velocity(middle,after)>.1,'弧线中段保持移动，不先散开停住再重新启动');
  const turn=before.reduce((sum,p,i)=>sum+Math.hypot(after[i][0]-2*middle[i][0]+p[0],after[i][1]-2*middle[i][1]+p[1]),0)/before.length;
  assert.ok(turn<.01,'中段方向与速度连续变化');
  draw(1575);const saved=geometry(e.root);draw(2300);draw(1575);assert.equal(geometry(e.root),saved);
  draw(2550);const host=e.w.document.createElement('div');
  bridge=e.w.MotionFactories['material-form-chain'](host,{},definition('material-form-chain'));await bridge.ready;bridge(0);
  for(const selector of ['.wire-lines','.wire-points'])assert.equal(geometry(host.querySelector(selector)),geometry(e.root.querySelector(selector)),'下一段接住相同柱体末态');
 }finally{draw?.destroy();bridge?.destroy();e.close();}
});

test('字符窄柱展开为宽环经过多个中间帧，点阵不在切点整片跳出',async()=>{
 const e=setup();let draw;
 try{
  draw=e.w.MotionFactories['material-form-chain'](e.root,{},definition('material-form-chain'));await draw.ready;
  const band=e.root.querySelector('.bridge-code-band[data-column="0"][data-band="0"]'),text=band.querySelector('text');
  const xs=[],widths=[],shapes=[];
  for(const time of [400,430,460,490,520,550,580,610]){
   draw(time);xs.push(Number(text.getAttribute('x')));widths.push(Number(e.root.querySelector('.bridge-code-window').getAttribute('width')));
   shapes.push(e.root.querySelector('.bridge-code-morph').getAttribute('d'));
  }
  assert.equal(xs[0],202);assert.equal(xs.at(-1),128);
  assert.equal(widths[0],67);assert.equal(widths.at(-1),390);
  assert.ok(new Set(xs).size>=7,'字符横移有足够多的中间位置');
  assert.ok(new Set(shapes).size>=7,'环柄轮廓逐行展开而非直接换遮罩');
  xs.slice(1).forEach((x,i)=>assert.ok(x<=xs[i]&&xs[i]-x<20,'相邻帧不能横跳约七十四像素'));
  widths.slice(1).forEach((width,i)=>assert.ok(width>=widths[i]&&width-widths[i]<90));
  draw(431);const firstDot=e.root.querySelector('.bridge-dots').getAttribute('d');
  assert.ok(firstDot.length>0);assert.doesNotMatch(firstDot,/a1 1 /,'初始点阵从小点建立，不能整片直接出现满尺寸点');
  draw(500);const middle=geometry(e.root);draw(2000);draw(500);assert.equal(geometry(e.root),middle);
  draw(530);assert.equal(e.root.querySelector('.bridge-code-band[data-column="1"][data-band="0"]').getAttribute('visibility'),'visible','中柱等待展开时不能骤然消失');
 }finally{draw?.destroy();e.close();}
});

test('独立材质接续只准备实际桥接画布和纤维素材，不建立开头颗粒采样',async()=>{
 const e=setup();let draw;
 try{
  draw=e.w.MotionFactories['material-form-chain'](e.root,{},definition('material-form-chain'));await draw.ready;
  assert.equal(e.requests.length,0,'截取圆柱末态不应载入开头书法字形数据');
  assert.equal(e.imageLoads.length,1);assert.ok(e.imageLoads[0].endsWith('/material-evolution/fiber.webp'));
  const bridge=e.root.querySelector('.bridge-ball-layer');assert.ok(bridge);
  assert.equal(e.root.querySelectorAll('canvas').length,1,'在场只保留实际像素球画布');
  assert.equal(e.canvases.length,3,'只能建立能力探测、实际桥接和离屏像素拼图三个画布');
  const active=e.canvases.filter(node=>node.width>0);assert.equal(active.length,2);assert.ok(active.includes(bridge));
  assert.equal(active.filter(node=>node!==bridge).length,1,'另一个画布仅供像素拼图缩放');
  assert.equal(e.draws.some(row=>row.op==='pixels'),false,'不应对隐藏书法遮罩读取像素');
  assert.equal(e.root.querySelectorAll('.opening-notes,.wire-cloud').length,0);
  draw(0);const first=geometry(e.root);
  assert.equal(e.root.querySelector('.bridge-wire').getAttribute('visibility'),'visible');
  assert.ok(e.root.querySelector('.bridge-wire-clip').getAttribute('d').length>0);
  draw(1995);const tail=e.root.querySelector('.bridge-sphere-tail');assert.ok(tail);
  assert.ok(Number(tail.getAttribute('opacity'))>0,'末端纤维图层应接替实际像素球');
  assert.ok(Number(bridge.dataset.pixelSize)>0);const ending=geometry(e.root);
  draw(0);assert.equal(geometry(e.root),first,'任意回到开头仍恢复真实圆柱');
  draw(1995);assert.equal(geometry(e.root),ending,'再次定位末端恢复同样纤维接续');
  draw(2000);assert.equal(tail.getAttribute('opacity'),'1');assert.equal(bridge.style.opacity,'0');
  assert.equal(e.canvases.length,3,'回拖不能迟到地建立颗粒遮罩或姿态缓存');
  assert.equal(e.requests.length,0);assert.equal(e.draws.some(row=>row.op==='pixels'),false);
  draw.destroy();draw=null;assert.ok(e.canvases.every(node=>node.width===0),'释放桥接与离屏拼图画布');
 }finally{draw?.destroy();e.close();}
});

test('重组末尾补齐球体轮廓，合拢首态无缺口且反向定位不重新挖洞',async()=>{
 const e=setup();let bridge,merge;
 try{
  bridge=e.w.MotionFactories['material-form-chain'](e.root,{},definition('material-form-chain'));await bridge.ready;
  const host=e.w.document.createElement('div');
  merge=e.w.MotionFactories['spheres-material-merge'](host,{},definition('spheres-material-merge'));await merge.ready;
  const canvas=e.root.querySelector('.bridge-ball-layer');
  const frame=ms=>{const start=e.draws.length;bridge(ms);return e.draws.slice(start).filter(row=>row.node===canvas);};
  const building=frame(1940),filling=frame(1960),complete=frame(1975);
  assert.equal(building.filter(row=>row.op==='clip').length,3,'建立阶段仍逐球保留阶梯显现');
  for(const rows of [building,filling,complete])assert.ok(rows.every(row=>row.op!=='clip'||row.rule!=='evenodd'),'已经建立的轮廓不再被反向裁切挖洞');
  const before=building.filter(row=>row.op==='rect'),after=filling.filter(row=>row.op==='rect');
  assert.equal(before.length,after.length);assert.ok(before.length>0);
  before.forEach((row,i)=>{
   assert.ok(after[i].args[1]<row.args[1],'每列上缘继续向上补齐');
   assert.ok(after[i].args[1]+after[i].args[3]>row.args[1]+row.args[3],'每列下缘同时补齐');
  });
  assert.equal(complete.filter(row=>row.op==='clip').length,0,'交接前完整球体必须脱离阶梯裁切');
  bridge(2000);merge(0);
  const tail=e.root.querySelector('.bridge-sphere-tail'),first=host.querySelector('.fiber-spheres');
  assert.equal(tail.getAttribute('opacity'),'1');assert.equal(canvas.style.opacity,'0');
  assert.equal(tail.querySelector('.fiber-spheres').outerHTML,first.outerHTML,'两段交接包含同样的球心、比例、纤维方向和明暗');
  for(const group of [tail.querySelector('.fiber-spheres'),first]){
   assert.equal(group.querySelectorAll('image.fiber-image').length,3);
   for(const image of group.querySelectorAll('image'))for(let node=image;node;node=node.parentElement){
    assert.equal(node.hasAttribute('mask'),false,'球体及祖先没有残留阶梯遮罩');
    assert.equal(node.hasAttribute('clip-path'),false,'球体及祖先没有残留裁切');
   }
  }
  const end=geometry(tail),start=geometry(host);
  bridge(0);bridge(1940);bridge(2000);assert.equal(geometry(tail),end);
  merge(600);merge(33);merge(0);assert.equal(geometry(host),start);
 }finally{bridge?.destroy();merge?.destroy();e.close();}
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
  assert.equal(whole.frameRate,120);
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
   single=e.w.MotionFactories[id](host,{},definition(id));await single.ready;assert.equal(single.frameRate,120);
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
