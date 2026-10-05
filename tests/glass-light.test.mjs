// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {environment,data} from './helpers.mjs';
const ids=['glass-interface-sequence','diffuse-light-drift','glass-card-stagger','convex-glass-lens'];

test('六卡以真实透视侧转，前景阅读窗完整，全段逐帧空间状态连续',async()=>{
 const env=await environment();try{
  const {sample,project,specs,perimeter,thickness}=env.w.WiseGlassLight.spatial;
  assert.equal(env.w.WiseGlassLight.duration,7200);
  const musicAt=t=>sample(t).cards.find(card=>card.key==='music').pose;
  assert.ok(musicAt(1.446)[2]<musicAt(1.8)[2],'前移不再冲过目标后回弹');
  assert.ok(musicAt(1.9)[2]>musicAt(1.8)[2],'展示时仍轻微前行，不停住再启动');
  const voiceAt=t=>sample(t).cards.find(card=>card.key==='listening').pose;
  assert.ok(voiceAt(0)[0]<-800);assert.ok(voiceAt(.35)[0]<voiceAt(.65)[0],'语音卡从左向右进入');
  assert.equal(thickness,10);assert.equal(perimeter(520,300,36).length,36);
  const pose=[0,0,120,8,48,-5,1],near=[project([-260,-150,0],pose),project([-260,150,0],pose)],far=[project([260,-150,0],pose),project([260,150,0],pose)];
  const length=([a,b])=>Math.hypot(a[0]-b[0],a[1]-b[1]);assert.ok(length(near)>length(far),'近边必须更大，不能只做平面剪切');
  assert.ok(length([near[0],project([-260,-150,-10],pose)])>4,'侧转确实露出前后表面的间距');
  assert.throws(()=>project([0,0,0],[0,0,1250,0,0,0,1]));
  const previous=new Map();let maxJump=0;
  for(let frame=0;frame<=432;frame++){
   const state=sample(frame/60);assert.equal(state.cards.length,6);
   for(let i=1;i<6;i++)assert.ok(state.cards[i].depth>=state.cards[i-1].depth);
   for(const card of state.cards){
    const [w,h]=specs[card.key],points=[[-w/2,-h/2,0],[w/2,-h/2,0],[w/2,h/2,0],[-w/2,h/2,0]].map(v=>project(v,card.pose,state.camera));
    assert.ok(points.flat().every(Number.isFinite));assert.ok(card.opacity>=0&&card.opacity<=1);
    if(previous.has(card.key))points.forEach((p,i)=>{const old=previous.get(card.key)[i];maxJump=Math.max(maxJump,Math.hypot(p[0]-old[0],p[1]-old[1]));});previous.set(card.key,points);
   }
  }
  assert.ok(maxJump<65,'相邻帧不能跳变');
  for(const [time,key]of [[1.8,'music'],[2.65,'weather'],[3.5,'controls'],[5.2,'chat']]){
   const state=sample(time),card=state.cards.at(-1);assert.equal(card.key,key);assert.equal(card.opacity,1);
   const [w,h]=specs[key];for(const v of [[-w/2,-h/2,0],[w/2,-h/2,0],[w/2,h/2,0],[-w/2,h/2,0]]){const [x,y]=project(v,card.pose,state.camera);assert.ok(x>25&&x<1041&&y>15&&y<585,key+' 阅读窗不得裁切');}
   const first=JSON.stringify(state);sample(7.2);sample(0);assert.equal(JSON.stringify(sample(time)),first,'乱序定位不得依赖前一帧');
  }
  assert.ok(sample(7.2).cards.every(card=>card.opacity===0));
 }finally{env.close();}
});

test('苹果空间卡按展示顺序衔接，滑杆有界、短信逐条输出，蓝牙为贯穿中轴的双三角',async()=>{
 const env=await environment();try{
  const {content,bluetoothPaths}=env.w.WiseGlassLight.spatial;
  assert.ok(content(1.8).ripplePhase>content(1.1).ripplePhase);
  assert.ok(content(1.8).musicProgress>content(1.1).musicProgress);
  assert.ok(content(3.15).brightness>content(2.7).brightness);
  assert.ok(content(3.55).volume>content(3.1).volume);
  for(let frame=0;frame<=432;frame++){
   const state=content(frame/60);for(const key of ['brightness','volume'])assert.ok(state[key]>=0&&state[key]<=1);
   state.replies.forEach((value,i)=>{assert.ok(value>=0&&value<=1);if(i&&value>0)assert.equal(state.replies[i-1],1,'上一行结束才输出下一行');});
  }
  assert.ok(content(4.4).replies[0]>0&&content(4.4).replies[0]<1);
  assert.ok(content(5.3).replies.every(q=>q===1));
  const initial=JSON.stringify(content(3.2));content(7.2);content(0);assert.equal(JSON.stringify(content(3.2)),initial);
  const paths=JSON.parse(JSON.stringify(bluetoothPaths));
  assert.deepEqual(paths[0].slice(0,2),[[0,-10],[0,10]],'中轴完整');
  for(const [a,b]of [[paths[0][2],paths[0][3]],[paths[1][0],paths[1][1]]])assert.deepEqual(a.map((v,i)=>v+b[i]),[0,0],'两条斜线穿过中心');
 }finally{env.close();}
});

test('空间网格、折射与拆解可反复取样，销毁释放所有卡面缓冲',async()=>{
 const env=await environment();try{
  const {w}=env,contexts=[],cache=new WeakMap(),canvasIds=new WeakMap();let serial=0;
  const identify=canvas=>{if(!canvasIds.has(canvas))canvasIds.set(canvas,++serial);return canvasIds.get(canvas);};
  w.HTMLCanvasElement.prototype.getContext=function(){
   if(cache.has(this))return cache.get(this);
   const trace=[],target={canvas:this,trace,globalAlpha:1,
    createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),
    getImageData:(x,y,width,height)=>({data:new Uint8ClampedArray(width*height*4),width,height}),createImageData:(width,height)=>({data:new Uint8ClampedArray(width*height*4),width,height}),
    drawImage(image,...args){trace.push(['image',identify(image),...args]);},
    setTransform(...args){assert.ok(args.every(n=>typeof n!=='number'||Number.isFinite(n)));trace.push(['transform',...args]);}
   },ctx=new Proxy(target,{get:(o,k)=>k in o?o[k]:(...args)=>{if(['moveTo','lineTo','arc','fillRect','fillText'].includes(k))trace.push([k,...args]);}});
   identify(this);cache.set(this,ctx);contexts.push(ctx);return ctx;
  };
  const painter=w.WiseGlassLight.createPainter(w.document),out=w.document.createElement('canvas'),c=out.getContext('2d');
  painter.render(c,5.2); // Prepare all six material textures before comparing draw commands.
  const capture=t=>{contexts.forEach(c=>{c.trace.length=0;});painter.render(c,t);return JSON.stringify(contexts.map(c=>c.trace));};
  const first=capture(5.2);capture(7.2);capture(0);assert.equal(capture(5.2),first);
  const keys=['background','aperture','wordmark','listening','chat','focus','music','weather','controls','lens'];
  const layers=Object.fromEntries(keys.map(key=>{const node=w.document.createElement('canvas');node.width=1066;node.height=600;return [key,node.getContext('2d')];}));
  const separate=painter.drawLayers(layers,5.2),full=painter.render(c,5.2);assert.equal(JSON.stringify(separate),JSON.stringify(full));
  for(const key of ['music','weather','controls'])assert.ok(layers[key].trace.some(row=>row[0]==='image'),'拆解必须绘制新增卡片');
  // 单卡入口逐时刻对照原空间绘制，包括离屏卡面上的波形、文字、滑杆和涟漪。
  out.width=1066;out.height=600;
  const canonical=items=>items.filter(ctx=>ctx.trace.length).map(ctx=>JSON.stringify([
   ctx.canvas.width,ctx.canvas.height,ctx.trace.map(row=>row[0]==='image'?['image',...row.slice(2)]:row)
  ])).sort();
  const referenceContexts=[...contexts];
  for(const [key,id]of w.WiseGlassLight.cards){
   const start=contexts.length,root=w.document.createElement('div'),definition=data.effects.find(e=>e.id===id);
   const draw=w.MotionFactories[id](root,w.MotionKit,definition),owned=contexts.slice(start),frames=[];
   for(const time of [.3,.8,1.8,2.65,3.5,5.2,.8]){
    contexts.forEach(ctx=>{ctx.trace.length=0;});draw(time*1000);const actual=canonical(owned);
    contexts.forEach(ctx=>{ctx.trace.length=0;});c.setTransform(1,0,0,1,0,0);
    const state=w.WiseGlassLight.spatial.sample(time),card=state.cards.find(item=>item.key===key);
    painter.drawSpatialCard(c,key,card.pose,state.camera,card.opacity,w.WiseGlassLight.spatial.content(time));
    assert.deepEqual(actual,canonical(referenceContexts),id+' @ '+time);frames.push(JSON.stringify(actual));
   }
   assert.equal(frames[1],frames[6]);assert.ok(new Set(frames).size>3,id+' 必须改变真实绘图命令');
   const node=root.firstElementChild;draw.destroy(true);for(const ctx of owned)if(ctx.canvas!==node)assert.equal(ctx.canvas.width,1);
   const kept=node.width;draw(1200);assert.equal(node.width,kept);
   // 缩略图保留的表面由调用方持有，不计入离屏缓冲释放检查。
   node.width=1;
  }
  const protectedCanvases=new Set([out,...Object.values(layers).map(ctx=>ctx.canvas)]);painter.destroy();
  for(const ctx of contexts)if(!protectedCanvases.has(ctx.canvas))assert.equal(ctx.canvas.width,1,'离屏卡面应释放');
 }finally{env.close();}
});

test('玻璃组合与三个独立动作可反复定位，各实例互不影响并能释放',async()=>{
 const env=await environment();try{
  const {w}=env,roots=ids.map(()=>w.document.createElement('div'));
  const players=ids.map((id,i)=>w.MotionRuntime.create(roots[i],data.effects.find(e=>e.id===id),{autoplay:false}));
  for(let i=0;i<players.length;i++){
   const e=data.effects.find(x=>x.id===ids[i]),player=players[i];player.seek(e.preview_ms);const first=roots[i].innerHTML;
   player.seek(e.duration_ms);player.seek(0);player.seek(e.preview_ms);assert.equal(roots[i].innerHTML,first,e.name);
   assert.equal(roots[i].querySelectorAll('canvas[data-layer]').length,i===0?10:1);
  }
  const standalone=roots[3].innerHTML;players[0].seek(3100);assert.equal(roots[3].innerHTML,standalone,'组合定位不能改动独立凸泡');
  const original=roots[0].querySelector('canvas:not([data-layer])'),layer=roots[0].querySelector('[data-layer="chat"]');
  layer.setAttribute('data-composition-hidden','');await Promise.resolve();assert.equal(original.style.visibility,'hidden');
  layer.removeAttribute('data-composition-hidden');await Promise.resolve();assert.equal(original.style.visibility,'visible');
  const canvases=roots.flatMap(root=>[...root.querySelectorAll('canvas')]);players.forEach(p=>p.destroy());
  assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(w.MotionRuntime.runningCount,0);
  for(const canvas of canvases)assert.equal(canvas.width,1,'销毁后释放像素缓冲');
  for(const root of roots)assert.equal(root.childElementCount,0);
 }finally{env.close();}
});

test('玻璃拆解对应真实独立动作，复制页携带正式绘制源码和验收配色',async()=>{
 const env=await environment();try{
  const {w}=env;w.eval(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'));
  const comp=data.effects.find(e=>e.id===ids[0]),rows=w.MotionFactories[comp.id].breakdown;
  assert.deepEqual([...new Set(rows.flatMap(row=>Array.from(row.actions)))].sort(),[...comp.actions].sort());
  for(const id of ids){const e=data.effects.find(x=>x.id===id),code=w.MotionExport.code(e,{speed:.75}),prompt=w.MotionExport.prompt(e,{},data);
   assert.match(code,/catalog\/effects\/glass-light\.js/);assert.doesNotMatch(code,/opus-glass-refinement|reference\.mp4|frames\//);
   assert.match(prompt,/黑银/);assert.match(prompt,/苹果空间/);assert.doesNotMatch(prompt,/强调色 #ff5a1f|WISE 创作|Opus|旧三卡/);
  }
  for(const e of data.effects.filter(e=>e.source.path==='catalog/effects/glass-light.js')){
   for(const def of [e,...(e.variants||[]).map(v=>w.MotionKit.resolveVariant(e,v.id))]){
    assert.equal(def.source.reference.name,'Apple Vision Pro 空间界面');
    assert.equal(def.source.reference.url,'https://www.apple.com/newsroom/2023/06/introducing-apple-vision-pro/');
    assert.ok(def.source.additional_references.every(ref=>ref.url.startsWith('https://www.apple.com/')));
    assert.doesNotMatch(JSON.stringify(def),/Opus|WISE 创作|原三卡|新增三卡|固定完整画面/);
    const prompt=w.MotionExport.prompt(def,{},data);assert.match(prompt,/苹果空间/);
   }
  }
  const root=w.document.createElement('div'),draw=w.MotionFactories[comp.id](root,w.MotionKit,comp);draw(comp.preview_ms);
  draw.destroy(true);assert.equal(root.querySelectorAll('canvas').length,1,'缩略图只保留最终像素面');draw(0);assert.equal(root.querySelectorAll('canvas').length,1);
 }finally{env.close();}
});

const cardIds=['glass-voice-card-illustration','glass-dialogue-card-illustration','glass-control-card-illustration','glass-music-card-illustration','glass-weather-card-illustration','glass-controls-card-illustration'];
test('六张玻璃卡作为独立插画登记，透明背景、动态定位和导出保持一致',async()=>{
 const env=await environment();try{
  const {w}=env;w.eval(await readFile(new URL('../catalog/export.js',import.meta.url),'utf8'));
  for(const id of cardIds){
   const def=data.effects.find(e=>e.id===id),root=w.document.createElement('div');
   assert.equal(def.kind,'illustration');assert.equal(def.category,'illustration-interface');
   const player=w.MotionRuntime.create(root,def,{autoplay:false}),node=root.querySelector('canvas');
   assert.equal(root.querySelectorAll('canvas').length,1);assert.equal(node.className,'pattern-canvas');
   assert.equal(node.style.background,'transparent');assert.equal(node.width,1066);assert.equal(node.height,600);
   const frames=[];for(const t of [1000,500,0,700,1000]){player.seek(t);assert.equal(+node.dataset.sourceTime,t/1000);frames.push(root.innerHTML);}assert.equal(frames[0],frames[4]);assert.notEqual(frames[0],frames[1]);
   const code=w.MotionExport.code(def),prompt=w.MotionExport.prompt(def,{},data);
   assert.match(code,/catalog\/effects\/glass-light\.js/);assert.match(prompt,/透明/);assert.doesNotMatch(prompt,/保持静态|固定展示状态/);
   player.destroy();assert.equal(node.width,1);assert.equal(root.childElementCount,0);
   const draw=w.MotionFactories[id](root,w.MotionKit,def);draw.destroy(true);assert.equal(root.querySelectorAll('canvas').length,1);
   root.remove();
  }
  assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(w.MotionRuntime.runningCount,0);
 }finally{env.close();}
});

test('六张卡共用苹果空间内容，短信气泡逐字出现，片尾由原生 O 接管凸泡',async()=>{
 const env=await environment();try{
  const {w}=env,contexts=[],colors=[],lensFrames=[],cache=new WeakMap();
  w.HTMLCanvasElement.prototype.getContext=function(){
   if(cache.has(this))return cache.get(this);
   const trace=[],ctx=new Proxy({canvas:this,globalAlpha:1,trace,
    createRadialGradient:()=>({addColorStop(offset,color){colors.push(color);}}),createLinearGradient:()=>({addColorStop(offset,color){colors.push(color);}}),
    getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),
    fillText(value,x,y){trace.push({type:'text',value,x,y});},
    roundRect(x,y,width,height,radius){trace.push({type:'bubble',x,y,width,height,radius});},
    arc(x,y,r){trace.push({type:'arc',x,y,r});},
    quadraticCurveTo(...values){trace.push({type:'glyph-curve',values});},
    getImageData:(x,y,width,height)=>({data:new Uint8ClampedArray(width*height*4),width,height}),
    createImageData:(width,height)=>({data:new Uint8ClampedArray(width*height*4),width,height}),
    putImageData(frame){lensFrames.push(frame);}
   },{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>{if(['fillStyle','strokeStyle','shadowColor'].includes(k)&&typeof v==='string')colors.push(v);o[k]=v;return true;}});
   cache.set(this,ctx);contexts.push(ctx);return ctx;
  };
  const painter=w.WiseGlassLight.createPainter(w.document),canvas=w.document.createElement('canvas'),ctx=canvas.getContext('2d');
  for(const key of ['listening','chat','focus','music','weather','controls'])painter.drawCard(ctx,key);
  const words=contexts.flatMap(c=>c.trace).filter(x=>x.type==='text').map(x=>x.value);
  for(const word of ['Siri','Listening…','“Siri, play some music.”','Messages','Alex','Today 9:41','Are we still meeting today?','Yes, at 6:30.','I booked a table for us.','I’ll send you the address.','See you there.','iMessage','Settings','Do Not Disturb','Brightness'])assert.ok(words.includes(word),word);
  for(const word of ['After Hours','Apple Music','1:24','−2:16','Cupertino','21°','Partly Cloudy','Control Center','Focus','On'])assert.ok(words.includes(word),word);
  assert.ok(!words.some(value=>/WISE|Bring this idea|Start with|Build a scene|Explore a variation|Create|Voice input|Aurora/.test(value)),'卡面不能带回创作助手内容');
  const bubbles=contexts.flatMap(c=>c.trace).filter(x=>x.type==='bubble');
  for(const y of [178,218,258,298])assert.ok(bubbles.some(x=>x.x===28&&x.y===y&&x.height===34),'每条收到的短信有独立气泡');
  assert.ok(bubbles.some(x=>x.x===280&&x.y===119),'发送消息在右侧');
  assert.ok(bubbles.some(x=>x.x===65&&x.y===356),'输入栏保留在底部');
  contexts.forEach(c=>{c.trace.length=0;});painter.render(ctx,4.4);
  const partial=contexts.flatMap(c=>c.trace).filter(x=>x.type==='text').map(x=>x.value);
  assert.ok(partial.some(value=>value.startsWith('Yes')&&value!=='Yes, at 6:30.'),'实际短信逐字输出而不是整条突然出现');
  assert.ok(!partial.includes('I booked a table for us.'),'后续消息等待上一条结束');
  contexts.forEach(c=>{c.trace.length=0;});const end=painter.render(ctx,7),marks=contexts.flatMap(c=>c.trace),arcs=marks.filter(x=>x.type==='arc');
  const brand=w.WiseGlassLight.brand;assert.equal(brand.family,'Helvetica Neue');assert.equal(brand.weight,700);
  const reference=JSON.parse((await readFile(new URL('../catalog/effects/reel-opening.js',import.meta.url),'utf8')).match(/const glyphs = (.*);/)[1]);
  for(const letter of 'MOTION'){
   assert.equal(brand.glyphs[letter].advance,reference[letter].width);
   assert.deepEqual(Array.from(brand.glyphs[letter].bounds),reference[letter].bounds,'沿用参考字标的原生字形比例');
  }
  assert.equal(brand.scale,56/714);assert.equal(brand.tracking,-20*brand.scale);
  assert.deepEqual(Array.from(end.lens.slice(0,2)),Array.from(brand.oCenters[0]),'凸泡对准真实 O 的中心');
  assert.ok(!arcs.some(x=>x.r>20),'片尾不得用圆圈代替任一字母');
  const expectedCurves=Array.from(brand.letters).reduce((n,item)=>n+brand.glyphs[item.letter].path.filter(row=>row[0]==='Q').length,0);
  assert.equal(marks.filter(x=>x.type==='glyph-curve').length,expectedCurves,'所有字母包括两个 O 均绘制真实轮廓');
  for(const value of ['Motion with meaning.','让每一次运动，都有意义。'])assert.ok(marks.some(x=>x.type==='text'&&x.value===value&&x.x===533));
  // Exercise the optical pass and both aperture transitions, including the final dot.
  for(const time of [0,.3,1.8,2.65,3.5,4.3,5.2,6.25,7.2])painter.render(ctx,time);
  for(const color of colors){
   const hex=color.match(/^#([\da-f]{3,8})$/i),rgba=color.match(/^rgba?\(([^)]+)\)$/);
   const rgb=hex?(hex[1].length<=4?[...hex[1].slice(0,3)].map(n=>parseInt(n+n,16)):[0,2,4].map(i=>parseInt(hex[1].slice(i,i+2),16))):rgba?rgba[1].split(',').slice(0,3).map(Number):null;
   assert.ok(rgb,'颜色应为明确的中性值：'+color);assert.equal(rgb[0],rgb[1],color);assert.equal(rgb[1],rgb[2],color);
  }
  assert.ok(lensFrames.length,'实际执行凸泡的像素折射');
  for(const {data} of lensFrames)for(let i=0;i<data.length;i+=4){assert.equal(data[i],data[i+1]);assert.equal(data[i+1],data[i+2]);}
  painter.destroy();
 }finally{env.close();}
});
