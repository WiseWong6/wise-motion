// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {environment,data} from './helpers.mjs';
const composition=data.effects.find(e=>e.id==='point-domain-flow-sequence');
const fresh=data.effects.filter(e=>e.source.path==='catalog/effects/point-domain-flow.js');

function recordingCanvas(w){
 const cache=new WeakMap(),contexts=[];
 w.HTMLCanvasElement.prototype.getContext=function(){
  if(cache.has(this))return cache.get(this);
  const trace=[],stack=[],ctx=new Proxy({canvas:this,font:'10px sans-serif',globalAlpha:1,trace,
   save(){stack.push({font:this.font,globalAlpha:this.globalAlpha});},restore(){Object.assign(this,stack.pop()||{});},
   createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),
   createImageData:(width,height)=>({data:new Uint8ClampedArray(width*height*4),width,height}),
   measureText(value){return {width:String(value).length*(parseFloat(this.font.match(/([\d.]+)px/)?.[1])||10)*.6};},
   fillText(value,x,y){trace.push({type:'text',value,x,y,font:this.font});},
   arc(x,y,r){trace.push({type:'arc',x,y,r});},clip(){trace.push({type:'clip'});}
  },{get:(o,k)=>k in o?o[k]:()=>{}});
  cache.set(this,ctx);contexts.push(ctx);return ctx;
 };
 return contexts;
}

test('337至425帧两条亮线停在文字内侧，终点保留笔触余量',async()=>{
 const env=await environment();try{
  for(let frame=337;frame<=425;frame++)for(const trace of env.w.WisePointDomainFlow.traceGeometry((frame-1)/30)){
   assert.ok(trace.clearance.every(v=>v>=2.1-1e-8),`第${frame}帧第${trace.index+1}条亮线越界`);
  }
  const stopped=env.w.WisePointDomainFlow.traceGeometry(13);
  assert.ok(stopped[0].hitParameter<1&&stopped[1].hitParameter<.8,'终点应由文字厚度决定，不沿用穿字终点');
  for(const index of [0,1])assert.equal(stopped[index].progress,1);
  assert.ok(stopped[1].tip[0]>205,'第二条亮线应留在竖排字的右侧');
 }finally{env.close();}
});

test('触边火花实际绘制更大并受边界裁切，叙事字幕不进入任何段落',async()=>{
 const env=await environment();try{
  const {w}=env,contexts=recordingCanvas(w),root=w.document.createElement('div');
  const action=data.effects.find(e=>e.id==='boundary-curve-stop'),draw=w.MotionFactories[action.id](root,w.MotionKit,{...action,poster_only:true});
  contexts.forEach(c=>{c.trace.length=0;});draw((13-11.2)*1000);
  const traces=contexts.flatMap(c=>c.trace),sparks=traces.filter(x=>x.type==='arc'&&x.r>=.55&&x.r<=1.75);
  assert.equal(sparks.length,160);assert.ok(sparks.reduce((s,x)=>s+x.r,0)/sparks.length>1);
  assert.ok(traces.some(x=>x.type==='clip'),'火花须与亮线一起限制在文字内侧');draw.destroy();
  const full=w.MotionFactories[composition.id](root,w.MotionKit,{...composition,poster_only:true});
  for(const time of [1,3.8,5.4,8.8,11.4,13.0,15.1,17.7,21.2,23.4])full(time*1000);
  assert.ok(!contexts.flatMap(c=>c.trace).some(x=>x.type==='text'&&/Songti SC|Source Han Serif/.test(x.font)),'整片不可出现原底部叙事字幕');
  assert.ok(contexts.flatMap(c=>c.trace).some(x=>x.type==='text'&&x.value.includes('不要那样')),'作为边界的文字须保留');full.destroy();
 }finally{env.close();}
});

test('七个独立动作只建自身节点；组合有真实部件，任意定位和销毁不互相干扰',async()=>{
 const env=await environment();try{
  const {w}=env,roots=fresh.map(()=>w.document.createElement('div')),players=fresh.map((e,i)=>w.MotionRuntime.create(roots[i],{...e,poster_only:true},{autoplay:false}));
  await Promise.all(players.map(p=>p.ready));
  for(let i=0;i<fresh.length;i++){
   const e=fresh[i],p=players[i];p.seek(e.preview_ms);const first=roots[i].innerHTML;
   p.seek(e.duration_ms);p.seek(0);p.seek(e.preview_ms);assert.equal(roots[i].innerHTML,first,e.name);
   if(e.kind==='action')assert.equal(roots[i].querySelectorAll('canvas').length,1,e.name+'不能携带完整组合的画布');
  }
  const i=fresh.findIndex(e=>e.kind==='composition'),root=roots[i],canvas=root.querySelector('canvas:not([data-layer])'),layers=[...root.querySelectorAll('[data-layer]')];
  assert.deepEqual([...new Set(layers.map(n=>n.dataset.layer))].sort(),Array.from(w.MotionFactories[composition.id].breakdown,r=>r.id).sort());
  const other=roots[0].innerHTML;players[i].seek(12800);assert.equal(roots[0].innerHTML,other);
  layers[0].setAttribute('data-composition-hidden','');await Promise.resolve();assert.equal(canvas.style.visibility,'hidden');
  layers[0].removeAttribute('data-composition-hidden');await Promise.resolve();assert.equal(canvas.style.visibility,'visible');
  const all=roots.flatMap(r=>[...r.querySelectorAll('canvas')]);players.forEach(p=>p.destroy());
  assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(w.MotionRuntime.runningCount,0);
  assert.ok(all.every(c=>c.width===1&&c.height===1));assert.ok(roots.every(r=>r.childElementCount===0));
 }finally{env.close();}
});

test('星点复用为新示例；原示例保留，复制页带齐绘制依赖与实际画面说明',async()=>{
 const env=await environment();try{
  const {w}=env;w.eval(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'));
  const stars=data.effects.find(e=>e.id==='star-twinkle'),old=w.document.createElement('div'),night=w.document.createElement('div');
  const original=w.MotionRuntime.create(old,stars,{autoplay:false}),variant=w.MotionRuntime.create(night,{...stars,variant_id:'layered-night'},{autoplay:false});
  assert.ok(old.querySelector('[data-star]')||old.querySelector('svg'),'默认星点仍调用原固定星点绘制');assert.equal(night.querySelectorAll('canvas').length,1);
  const code=w.MotionExport.code(stars,{variantId:'layered-night'});
  assert.ok(code.indexOf('catalog/effects/reel-neon.js')<code.indexOf('catalog/effects/point-domain-flow.js'),'旧绘制须先注册，再接入星点新示例');
  const prompt=w.MotionExport.prompt(composition,{},data);
  assert.match(prompt,/暖棕|暖色/);assert.match(prompt,/字幕/);assert.match(prompt,/160/);assert.doesNotMatch(prompt,/强调色 #ff5a1f/);
  assert.deepEqual([...new Set(w.MotionFactories[composition.id].breakdown.flatMap(row=>Array.from(row.actions)))].sort(),[...composition.actions].sort());
  original.destroy();variant.destroy();
 }finally{env.close();}
});


test('删除独立光点条目，网格到多涡流线合为连续9.2秒动作，旧书签可定位合并条目',async()=>{
 const env=await environment();try{
  const {w}=env,merged=data.effects.find(e=>e.id==='grid-flow-unfold');
  for(const id of ['warm-light-anchor','grid-bend-spread','multivortex-release']){
   assert.ok(!data.effects.some(e=>e.id===id));assert.equal(w.MotionFactories[id],undefined);assert.ok(!composition.actions.includes(id));
  }
  assert.equal(merged.duration_ms,9200);assert.deepEqual(merged.source_clock,[500/30,776/30]);
  assert.equal(data.redirects['grid-bend-spread'],merged.id);assert.equal(data.redirects['multivortex-release'],merged.id);
  assert.ok(merged.aliases.includes('网格铺展弯曲')&&merged.aliases.includes('多涡流线展开'));
  assert.equal(w.MotionFactories[merged.id].requiresPreparation,true);
  const root=w.document.createElement('div'),p=w.MotionRuntime.create(root,{...merged,poster_only:true},{autoplay:false});await p.ready;
  for(const time of [0,6000,7199,7500,9000,9200]){p.seek(time);assert.equal(root.querySelector('[data-part]').dataset.part,'grid-flow');assert.ok(Math.abs(Number(root.querySelector('[data-part]').dataset.time)-Math.min(775/30,500/30+time/1000))<.00004);}
  assert.equal(root.querySelectorAll('canvas').length,1);p.destroy();
  const rows=w.MotionFactories[composition.id].breakdown;assert.equal(rows.find(r=>r.id==='light').actions.length,0);
  for(const id of ['grid','flow'])assert.equal(rows.find(r=>r.id===id).actions[0],merged.id);
 }finally{env.close();}
});

// 记录实际提交给画布的笔画与文字，忽略等价的路径重建及文字测量次数。
function performanceCanvas(w,{recordCommands=false}={}){
 const contexts=[],cache=new WeakMap();let widthScale=1;
 w.HTMLCanvasElement.prototype.getContext=function(){
  if(cache.has(this))return cache.get(this);
  const canvas=this;let style={font:'10px sans-serif',globalAlpha:1},transforms=[],stack=[],currentPath=[],hash=createHash('sha256');
  const commands=[];
  const record=(op,args)=>{const keys=op==='stroke'?['globalAlpha','globalCompositeOperation','filter','shadowBlur','shadowColor','strokeStyle','lineWidth','lineDash','lineDashOffset']:op==='clip'||op==='clearRect'?[]:['globalAlpha','globalCompositeOperation','filter','shadowBlur','shadowColor',...(op==='drawImage'?[]:['fillStyle']),...(op==='fillText'?['font']:[])];const command={op,args,style:Object.fromEntries(keys.map(k=>[k,style[k]])),transforms};hash.update(JSON.stringify(command)+'\n');if(recordCommands)commands.push(command);};
  const api={canvas,commands,measures:0,segments:0,reset(){hash=createHash('sha256');this.measures=0;this.segments=0;commands.length=0;},digest(){return hash.copy().digest('hex');},
   save(){stack.push({style:{...style},transforms:transforms.slice()});},restore(){const saved=stack.pop();if(saved){style=saved.style;transforms=saved.transforms;}},
   measureText(value){this.measures++;return {width:String(value).length*(parseFloat(style.font.match(/([\d.]+)px/)?.[1])||10)*.6*widthScale};},
   beginPath(){currentPath=[];},moveTo(...a){currentPath.push(['moveTo',...a]);},lineTo(...a){this.segments++;currentPath.push(['lineTo',...a]);},arc(...a){currentPath.push(['arc',...a]);},rect(...a){currentPath.push(['rect',...a]);},closePath(){currentPath.push(['closePath']);},
   stroke(){record('stroke',currentPath);},fill(){record('fill',currentPath);},clip(){record('clip',currentPath);},fillText(...a){record('fillText',a);},fillRect(...a){record('fillRect',a);},clearRect(...a){record('clearRect',a);},
   setLineDash(a){style.lineDash=a.slice();},setTransform(...a){transforms=[['setTransform',...a]];},translate(...a){transforms.push(['translate',...a]);},rotate(...a){transforms.push(['rotate',...a]);},scale(...a){transforms.push(['scale',...a]);},transform(...a){transforms.push(['transform',...a]);},
   createRadialGradient(...a){const stops=[];return {type:'radial',args:a,stops,addColorStop(...s){stops.push(s);}};},createLinearGradient(...a){const stops=[];return {type:'linear',args:a,stops,addColorStop(...s){stops.push(s);}};},
   createImageData:(width,height)=>({data:new Uint8ClampedArray(width*height*4),width,height}),putImageData(){},drawImage(image,...a){record('drawImage',[image.width,image.height,...a]);}
  };
  const ctx=new Proxy(api,{get:(o,k)=>k in o?o[k]:style[k],set(o,k,value){if(k in o)o[k]=value;else style[k]=value;return true;}});
  cache.set(canvas,ctx);contexts.push(ctx);return ctx;
 };
 return {contexts,setWidthScale(value){widthScale=value;}};
}

test('第三次向右通道只绘一排文字，上下边界随原时序保留',async()=>{
 const env=await environment();try{
  const {w}=env;performanceCanvas(w,{recordCommands:true});
  const ctx=w.document.createElement('canvas').getContext('2d'),painter=w.WisePointDomainFlow.createPainter(w.document);
  const phrase='不要自作主张。不要解释推理。只回答被问到的问题。Always follow the format. Do not exceed 200 words。只能这样。';
  try{for(const [time,gap] of [[13.28,13],[13.4,13],[13.8,10],[15.1,10]]){
   ctx.reset();painter.drawLayer(ctx,'constraints',time);
   const visible=time>13.29,letters=ctx.commands.filter(c=>c.op==='fillText'&&c.args[0]===phrase);
   assert.equal(letters.length,visible?1:0,`${time}秒通道文字不能重复或提前出现`);
   const {P,scale}=painter.pose(time);
   for(const side of [-1,1]){
    const expectedPath=[['moveTo',...P(333,189+side*gap)],['lineTo',...P(460,189+side*gap)]];
    const lines=ctx.commands.filter(c=>c.op==='stroke'&&c.style.strokeStyle==='#e5e6e7'&&JSON.stringify(c.args)===JSON.stringify(expectedPath));
    assert.equal(lines.length,visible?1:0,`${time}秒${side<0?'上':'下'}边界必须保留原位置与出现时刻`);
    if(visible){assert.equal(lines[0].style.lineWidth,.68*scale);assert.equal(lines[0].style.globalAlpha,letters[0].style.globalAlpha);}
   }
  }}finally{painter.destroy();}
 }finally{env.close();}
});

test('字宽与径向静态系数复用，暖帧仍提交相同绘制并支持乱序定位',async()=>{
 const env=await environment();try{
  const {w}=env,{contexts}=performanceCanvas(w),root=w.document.createElement('div'),draw=w.MotionFactories[composition.id](root,w.MotionKit,{...composition,poster_only:true});await draw.ready;
  const ctx=contexts.find(c=>c.canvas===root.querySelector('canvas:not([data-layer])'));
  // 优化前冻结源码的画布绘制记录；保留原笔画顺序、样式、变换和全部点坐标。
  // 15.1 秒仅更新用户要求移除的通道下排重复文字，其余时刻沿用原基准。
  const expected={"9300":"2aec1cc132027aba5f6de1faa9da2e60891282205e311d7a7148341a95aff1c6","11400":"5f8f6154825aacbdf682c3fee468f29d9bce410450c44f9f7cf17058612f5992","15100":"4ab1d51a804e953800052c46d6a59d78851bd6c98c76bedc1e3c378da1a43125","17700":"0f400ac9761c735be8855259a6be3b5c69af373562aa29380fdd78ea0d2f1f8a","21200":"c98ac7b0ab23d06f1804dbdb408e8b48e35d4f9ee02a17b150fe167d09ca7d6e","23400":"245bb8d7f208dd66b826d18a5791db32505d69243b6e3d0265b5ff37bc5a3c57"};
  for(const time of [9300,11400,15100,17700,21200,23400]){ctx.reset();draw(time,{force:true});assert.equal(ctx.digest(),expected[time],String(time));}
  ctx.reset();draw(11400,{force:true});assert.equal(ctx.measures,0,'已准备字体的重复字宽不应重新测量');
  for(const time of [23400,9300,21200,15100,21200]){ctx.reset();draw(time,{force:true});assert.equal(ctx.digest(),expected[time],String(time));}
  assert.ok(ctx.segments<320*76*2,'细线的第二遍虚线描边不应重建同一路径');draw.destroy();
 }finally{env.close();}
});

test('字体就绪会清除准备阶段字宽，画布间缓存独立',async()=>{
 const env=await environment();try{
  const {w}=env,record=performanceCanvas(w);let resolveFonts;
  Object.defineProperty(w.document,'fonts',{configurable:true,value:{ready:new Promise(resolve=>{resolveFonts=resolve;})}});
  const action=fresh.find(e=>e.id==='text-plane-tilt'),first=w.document.createElement('div'),draw=w.MotionFactories[action.id](first,w.MotionKit,{...action,poster_only:true}),ctx=record.contexts[0];
  draw(2000);assert.ok(ctx.measures>0);record.setWidthScale(1.1);ctx.reset();draw(2000,{force:true});assert.equal(ctx.measures,0);
  resolveFonts();await draw.ready;assert.ok(ctx.measures>0,'字体准备完成必须重新测量');ctx.reset();draw(2000,{force:true});const readyFrame=ctx.digest();
  const second=w.document.createElement('div'),other=w.MotionFactories[action.id](second,w.MotionKit,{...action,poster_only:true});await other.ready;
  const otherContext=record.contexts.find(c=>c.canvas===second.querySelector('canvas'));otherContext.reset();other(2000,{force:true});assert.ok(otherContext.measures>0);assert.equal(otherContext.digest(),readyFrame);draw.destroy();other.destroy();
  const painter=w.WisePointDomainFlow.createPainter(w.document);ctx.reset();painter.drawLayer(ctx,'plane',11.4);assert.ok(ctx.measures>0);ctx.reset();painter.drawLayer(ctx,'plane',11.4);assert.equal(ctx.measures,0);painter.destroy();
  const replacement=w.WisePointDomainFlow.createPainter(w.document);ctx.reset();replacement.drawLayer(ctx,'plane',11.4);assert.ok(ctx.measures>0,'直接使用的绘制器销毁后也应释放字宽缓存');replacement.destroy();
 }finally{env.close();}
});
