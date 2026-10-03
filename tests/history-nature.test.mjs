// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {environment,data,frameMarkup} from './helpers.mjs';
import {history,state} from '../scripts/history.mjs';
const scenes='/Users/wisewong/Documents/Developer/scenes/';
const redirects={'osmanthus-event-moonphase':'moon-event-fill','sunset-specular-reflection':'sunset-water-reflection','recovered-forward-boat':'forward-boat-illustration','recovered-forward-plane':'forward-plane-illustration','drive-release':'drive-balloon-release','flow-radial-release':'dandelion-radial-release'};
const art=['osmanthus-moon-illustration','sunset-sun-illustration','forward-boat-illustration','forward-plane-illustration','drive-car-illustration','dandelion-subject-illustration','dandelion-seed-illustration'];
const ids=[...new Set([...Object.values(redirects),...art])],def=id=>data.effects.find(e=>e.id===id);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
// 记录原像素缓冲，不进行浏览器截图或声称完成视觉验收。
function context(){
 const stack=[],draws=[];let state={globalAlpha:1};
 const target={draws,puts:0,save(){stack.push({...state});},restore(){assert.ok(stack.length);state=stack.pop();},createImageData(width,height){return {width,height,data:new Uint8ClampedArray(width*height*4)};},putImageData(image){target.image=image;target.puts++;},drawImage(canvas,...args){args.forEach(n=>assert.ok(Number.isFinite(n)));draws.push([canvas,...args]);},createLinearGradient(){return {addColorStop(at){assert.ok(at>=0&&at<=1);}};},createRadialGradient(){return {addColorStop(at){assert.ok(at>=0&&at<=1);}};}};
 return new Proxy(target,{get(o,k){if(k in o)return o[k];if(k in state)return state[k];return (...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),String(k));};},set(o,k,v){state[k]=v;return true;}});
}
function canvasContexts(w){const contexts=new Map();w.HTMLCanvasElement.prototype.getContext=function(){if(!contexts.has(this))contexts.set(this,context());return contexts.get(this);};return contexts;}
async function originalMoon(){
 const node={value:'0',addEventListener(){},setAttribute(){}};
 const sandbox={document:{body:{dataset:{look:'gold-leaves'}},querySelector:()=>node,addEventListener(){}},window:{devicePixelRatio:1},matchMedia:()=>({matches:false,addEventListener(){}}),p5:function(callback){callback({});}};
 vm.createContext(sandbox);for(const f of ['tree-data.js','moon-map.js'])vm.runInContext(await readFile(scenes+'august-night-osmanthus/'+f,'utf8'),sandbox);
 const source=await readFile(scenes+'august-night-osmanthus/scene.js','utf8');vm.runInContext(source.replace('new p5(p=>{','globalThis.model={moonProgress,moonTravelers,createMoonRaster,paintMoonRaster,moon,VIEW};\nnew p5(p=>{'),sandbox);
 const m=sandbox.model;m.moon.r=90;m.VIEW.scale=1;return m;
}
test('月面按原八十四个抵达事件渐满，月貌及透明柔边逐像素一致，满月静止',async()=>{
 const env=await environment();try{
  const {w}=env,contexts=canvasContexts(w),o=await originalMoon(),raster=o.createMoonRaster(1,1,w.devicePixelRatio||1),root=w.document.getElementById('root'),e=def('moon-event-fill');assert.equal(o.moonTravelers.length,84);
  const render=w.MotionFactories[e.id](root,w.MotionKit,e),canvas=root.firstElementChild,ctx=contexts.get(canvas);
  for(const ms of [0,450,1300,2900,4500,5700,1300]){render(ms);const progress=o.moonProgress(11.5+ms/1000);near(+canvas.dataset.progress,progress);assert.equal(hash(contexts.get(ctx.draws.at(-1)[0]).image.data),hash(o.paintMoonRaster(raster,progress)));}
  render(0);assert.equal(+canvas.dataset.progress,0);render(e.duration_ms);assert.equal(+canvas.dataset.progress,1);const texture=ctx.draws.at(-1)[0];render.destroy();assert.equal(texture.width,1);
  const ar=w.document.createElement('div'),a=def('osmanthus-moon-illustration'),still=w.MotionFactories[a.id](ar,w.MotionKit,a),ac=contexts.get(ar.firstElementChild),pixels=contexts.get(ac.draws.at(-1)[0]).image.data;
  assert.equal(hash(pixels),hash(o.paintMoonRaster(raster,1)));assert.equal(pixels[3],0);const count=ac.draws.length;for(const ms of [0,1200,3000])still(ms);assert.equal(ac.draws.length,count);still.destroy();
 }finally{env.close();}
});
test('太阳路径及海面受光缓冲与原夕阳一致，独立太阳保留渐变与透明圆周',async()=>{
 const env=await environment();try{
  const {w}=env,contexts=canvasContexts(w),o={width:900,height:1200,window:{devicePixelRatio:1},document:w.document,pixelDensity:()=>1,SceneSound:class{}};w.document.body.dataset.aspect='3:4';vm.createContext(o);vm.runInContext(await readFile(scenes+'ocean-sunset/sketch.js','utf8'),o);
  vm.runInContext(`sceneStyle='warm';palette=SCENE_STYLES.warm;horizonY=Math.round(height*.76);sunX=width*.5;sunR=Math.min(width*.0456,height*.054);sunY=horizonY-sunR*.76;pickupTime=findPickupTime();waterContacts=findWaterContacts();sunExitTime=findSunExitTime();
   const next=seededRandom(860214);waterRows=Array.from({length:72},(_,i)=>({depth:Math.pow((i+.15+next()*.7)/72,1.7),phase:next()*Math.PI*2,weight:.65+next()*.7}));globalThis.model={flightAt,drawWaterReflection,makeSunBrush,field:()=>waterReflectionField};`,o);
  const root=w.document.getElementById('root'),e=def('sunset-water-reflection'),render=w.MotionFactories[e.id](root,w.MotionKit,e),canvas=root.firstElementChild,ctx=contexts.get(canvas),fingerprints=new Set();
  for(const ms of [0,2800,7700,14000,2800]){render(ms);const time=12+ms/1000*1.5,story=o.model.flightAt(time);near(+canvas.dataset.elevation,story.light.elevation);near(+canvas.dataset.sunX,story.sunX);o.model.drawWaterReflection(context(),story,time);const pixels=contexts.get(ctx.draws.at(-1)[0]).image.data;assert.equal(hash(pixels),hash(o.model.field().image.data));fingerprints.add(hash(pixels));}
  assert.equal(fingerprints.size,4);
  const ar=w.document.createElement('div'),a=def('sunset-sun-illustration'),still=w.MotionFactories[a.id](ar,w.MotionKit,a),ac=contexts.get(ar.firstElementChild),texture=ac.draws.at(-1)[0],expected=o.model.makeSunBrush();
  assert.equal(hash(contexts.get(texture).image.data),hash(contexts.get(expected.canvas).image.data));assert.equal(contexts.get(texture).image.data[3],0);const count=ac.draws.length;for(const ms of [0,1500,3000])still(ms);assert.equal(ac.draws.length,count);
 }finally{env.close();}
});
test('三十五只气球按原次序松开，位置和绳尾与原函数一致，定位可重复',async()=>{
 const o={XIAOKUI_MEOW:{frames:1,rate:1}};vm.createContext(o);vm.runInContext(await readFile(scenes+'motion-catalog/packs/completed/source/drive/scene.js','utf8')+'\nglobalThis.model={release,balloonState,balloonString};',o);
 const env=await environment();try{
  const {w}=env,root=w.document.getElementById('root'),e=def('drive-balloon-release'),render=w.MotionFactories[e.id](root,w.MotionKit,e);
  for(const t of [0,1.0999,1.1,1.1001,2,4.4,7.731,8]){render(t*1000);const svg=root.firstElementChild,p=o.model.balloonState(0,t).p,end=o.model.balloonString(0,t).end;near(+svg.dataset.firstX,p.x);near(+svg.dataset.firstY,p.y);near(+svg.dataset.firstEndX,end.x);near(+svg.dataset.firstEndY,end.y);assert.equal(+svg.dataset.released,Array.from({length:35},(_,i)=>t>o.model.release(i)).filter(Boolean).length);assert.equal(svg.querySelectorAll('radialGradient').length,35);}
  render(e.preview_ms);const before=frameMarkup(root);render(0);render(e.preview_ms);assert.equal(frameMarkup(root),before);
 }finally{env.close();}
});
function strokeContext(){
 let path='',state={transform:'',globalAlpha:1},stack=[];const lines=[];
 const c={lines,save(){stack.push({...state});},restore(){state=stack.pop();},translate(x,y){state.transform+=` translate(${x} ${y})`;},scale(x,y){state.transform+=` scale(${x} ${y})`;},rotate(a){state.transform+=` rotate(${a*180/Math.PI})`;},beginPath(){path='';},moveTo(x,y){path+=`M${x} ${y}`;},lineTo(x,y){path+=`L${x} ${y}`;},quadraticCurveTo(...n){path+='Q'+n.join(' ');},ellipse(){},fill(){},stroke(){lines.push({d:path,transform:state.transform,alpha:state.globalAlpha,width:state.lineWidth,color:state.strokeStyle});}};
 for(const k of ['globalAlpha','lineWidth','strokeStyle','fillStyle'])Object.defineProperty(c,k,{get:()=>state[k],set:v=>{state[k]=v;}});return c;
}
test('蒲公英原曲线保持，放大插画仍为细冠毛',async()=>{
 const o={window:{JourneyAir:class{},JourneyClouds:class{},JourneyWater:class{},JourneyEncounters:class{}}};vm.createContext(o);vm.runInContext(await readFile(scenes+'motion-catalog/source-projects/dandelion-scene/assets/js/dandelion.js','utf8'),o);const j=new o.window.DandelionJourney();
 const env=await environment();try{
  const {w}=env,root=w.document.getElementById('root'),e=def('dandelion-radial-release'),render=w.MotionFactories[e.id](root,w.MotionKit,e);for(const ms of [0,249,250,400,800,1000,400]){render(ms);near(+root.firstElementChild.dataset.radius,j.openingEvent(1.4+ms/1000).radius);}
  for(const [id,r,scale,y,hairs,thin] of [['dandelion-subject-illustration',42,1.25,116,137,.5],['dandelion-seed-illustration',8,6,128,11,1/9]]){
   const ar=w.document.createElement('div'),still=w.MotionFactories[id](ar,w.MotionKit,def(id));still(0);const ctx=strokeContext();ctx.translate(320,y);ctx.scale(scale,scale);j.floret(ctx,0,0,r,0,1,hairs===137?j.filamentState(4.5):null);ctx.lines.forEach(line=>line.width*=thin);
   const actual=[...ar.querySelectorAll('path[stroke]')].map(n=>({d:n.getAttribute('d'),transform:n.getAttribute('transform'),alpha:+n.getAttribute('opacity'),width:+n.getAttribute('stroke-width'),color:n.getAttribute('stroke')}));assert.equal(hash(JSON.stringify(actual)),hash(JSON.stringify(ctx.lines)),'原冠毛曲线、颜色、透明度或线宽有差异');assert.equal(actual.length,hairs+1);assert.ok(actual.every(line=>line.width*scale<.6),'冠毛放大后变成粗杆');assert.equal(ar.querySelectorAll('path:not([stroke])').length,1);
   const before=frameMarkup(ar);for(const ms of [0,1500,3000]){still(ms);assert.equal(frameMarkup(ar),before);}
  }
 }finally{env.close();}
});
test('无帆木船保留原船壳及归灯，纸飞机按原曲线折翼，渐变坐标不重复偏移',async()=>{
 const source=scenes+'motion-catalog/packs/recovered/source/forward/',items=[],o={window:{MotionStudies:{register:item=>items.push(item)}}};vm.createContext(o);vm.runInContext((await readFile(source+'boats.js','utf8')).replace('  window.MotionStudies.register','  window.BoatSource={hull,openCabin,lantern};\n  window.MotionStudies.register'),o);vm.runInContext(await readFile(source+'planes.js','utf8'),o);
 const env=await environment();try{
  const {w}=env,root=w.document.getElementById('root'),ctx=context(),captured=[],ink={line:d=>captured.push(d),wash:d=>captured.push(d),dot(){}};
  for(const t of [0,.7,2.2,4]){captured.length=0;o.window.BoatSource.hull(ctx,ink);o.window.BoatSource.openCabin(ink);o.window.BoatSource.lantern(ctx,ink,-8,82,t*Math.PI/2,1.1);const keep=new Set(captured);captured.length=0;items.find(e=>e.id==='boat-sail').draw(ctx,ink,{t,phase:t*Math.PI/2});const removed=[...new Set(captured.filter(d=>!keep.has(d)))];assert.ok(removed.length>5);
   const boat=w.MotionFactories['forward-boat-illustration'](root,w.MotionKit,def('forward-boat-illustration'));boat(t*1000);const actual=new Set([...root.querySelectorAll('path')].map(n=>n.getAttribute('d')));for(const d of keep)assert.ok(actual.has(d));for(const d of removed)assert.ok(!actual.has(d));assert.equal(root.querySelectorAll('linearGradient[gradientTransform]').length,0);
   captured.length=0;items.find(e=>e.id==='plane-glide').draw(ctx,ink,{t,phase:t*Math.PI/2});const plane=w.MotionFactories['forward-plane-illustration'](root,w.MotionKit,def('forward-plane-illustration'));plane(t*1000);const paper=new Set([...root.querySelectorAll('path')].map(n=>n.getAttribute('d')));for(const d of captured)assert.ok(paper.has(d));assert.equal(root.querySelectorAll('linearGradient').length,2);assert.equal(root.querySelectorAll('linearGradient[gradientTransform]').length,0);
  }
 }finally{env.close();}
});
// 包含贝塞尔控制点的保守外框；真实曲线必然位于这些控制点以内。
function bounds(root){
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 for(const n of root.querySelectorAll('[data-part="source-art"] path')){
  let m=[1,0,0,1,0,0];const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
  for(const [,op,args] of n.getAttribute('transform').matchAll(/(translate|scale|rotate)\(([^)]+)\)/g)){const a=args.trim().split(/[ ,]+/).map(Number);let b;if(op==='translate')b=[1,0,0,1,a[0],a[1]||0];else if(op==='scale')b=[a[0],0,0,a[1]??a[0],0,0];else{const r=a[0]*Math.PI/180;b=[Math.cos(r),Math.sin(r),-Math.sin(r),Math.cos(r),0,0];}m=mul(m,b);}
  const pad=(+n.getAttribute('stroke-width')||0)*Math.max(Math.hypot(m[0],m[1]),Math.hypot(m[2],m[3]))/2;
  const point=(x,y)=>{const X=m[0]*x+m[2]*y+m[4],Y=m[1]*x+m[3]*y+m[5];x0=Math.min(x0,X-pad);x1=Math.max(x1,X+pad);y0=Math.min(y0,Y-pad);y1=Math.max(y1,Y+pad);};
  const tokens=n.getAttribute('d').match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/gi);let at=0,op,x=0,y=0,sx=0,sy=0;
  while(at<tokens.length){if(/^[a-df-z]$/i.test(tokens[at]))op=tokens[at++];if(op==='Z'){x=sx;y=sy;op='';continue;}const count={M:2,L:2,Q:4,C:6,A:7,h:1,v:1}[op];assert.ok(count,op);const a=tokens.slice(at,at+count).map(Number);at+=count;
   if(op==='h')x+=a[0];else if(op==='v')y+=a[0];else if(op==='A'){const ex=a[5],ey=a[6];if(Math.abs(Math.hypot(ex-x,ey-y)-2*a[0])<1e-5){const cx=(ex+x)/2,cy=(ey+y)/2;for(const dx of [-a[0],a[0]])for(const dy of [-a[1],a[1]])point(cx+dx,cy+dy);}x=ex;y=ey;}else{for(let i=0;i<a.length;i+=2)point(a[i],a[i+1]);x=a.at(-2);y=a.at(-1);if(op==='M'){sx=x;sy=y;op='L';}}point(x,y);
  }
 }
 return {x0,y0,x1,y1};
}
test('七幅插画完整等比置入并避开底部播放条，汽车不裁猫耳或车轮，高清屏保留画布细节',async()=>{
 const env=await environment();try{
  const {w}=env;Object.defineProperty(w,'devicePixelRatio',{value:2,configurable:true});const contexts=canvasContexts(w),root=w.document.getElementById('root');
  for(const id of art){const e=def(id),render=w.MotionFactories[id](root,w.MotionKit,e);for(const ms of [0,e.preview_ms,e.duration_ms]){render(ms);if(root.querySelector('svg')){const b=bounds(root);assert.ok(b.x0>=36&&b.x1<=604&&b.y0>=38&&b.y1<=278,id+' '+JSON.stringify(b));}else{const canvas=root.firstElementChild;assert.equal(canvas.width,1280);assert.equal(canvas.height,720);const draw=contexts.get(canvas).draws.at(-1);if(id==='osmanthus-moon-illustration')assert.ok(draw[2]>=60&&draw[2]+draw[4]<=278);}}if(render.destroy)render.destroy();}
 }finally{env.close();}
});
test('十一项独立导出可定位和释放，六个历史入口已迁入，落入扩波已剔除',async()=>{
 const crosswalk=JSON.parse(await readFile(state+'/crosswalk.json','utf8')),historical=await history(data),env=await environment(true);try{
  assert.ok(!def('frog-impact-ripple'));assert.ok(!env.w.MotionFactories['frog-impact-ripple']);assert.equal(crosswalk.rules['tutorial-frog-ripple'].status,'excluded');assert.ok(!historical.recipes.some(r=>r.history_id==='tutorial-frog-ripple'));assert.ok(!data.redirects['history-tutorial-frog-ripple']);
  for(const [old,id] of Object.entries(redirects)){assert.equal(crosswalk.rules[old].status,'excluded');assert.ok(!historical.recipes.some(r=>r.history_id===old));assert.equal(data.redirects['history-'+old],id);const linked=await environment(true,{hash:'#history-'+old});try{assert.equal(linked.w.document.querySelector('.effect-item[aria-current="true"]').dataset.effect,id);}finally{linked.close();}}
  for(const id of ids){const e=def(id),html=env.w.MotionExport.code(e);assert.doesNotMatch(html,/history-data|history-runtime|\/Users\/|p5(?:\.min)?\.js|<audio/);const dom=new JSDOM(html,{url:'file:///wise-motion/demo.html',runScripts:'outside-only',pretendToBeVisual:true});try{
    const w=dom.window,contexts=canvasContexts(w);w.matchMedia=()=>({matches:false});w.ResizeObserver=class{observe(){}disconnect(){}};for(const s of w.document.querySelectorAll('script'))w.eval(s.src?await readFile(new URL('../'+s.getAttribute('src'),import.meta.url),'utf8'):s.textContent);
    w.MotionDemo.pause();w.MotionDemo.seek(e.preview_ms);assert.equal(w.MotionRuntime.instanceCount,1);const stage=w.document.querySelector('.motion-stage'),first=frameMarkup(stage),canvas=stage.querySelector('canvas'),image=canvas&&contexts.get(canvas).draws.at(-1)?.[0],pixels=image&&contexts.get(image)?.image?.data,fingerprint=pixels&&hash(pixels);assert.ok(stage.querySelector('svg path,canvas'));
    w.MotionDemo.seek(e.duration_ms);w.MotionDemo.seek(0);w.MotionDemo.seek(e.preview_ms);assert.equal(frameMarkup(stage),first);if(pixels)assert.equal(hash(pixels),fingerprint);w.MotionDemo.restart();w.MotionDemo.pause();w.MotionDemo.destroy();assert.equal(w.MotionRuntime.instanceCount,0);assert.equal(w.MotionRuntime.runningCount,0);
   }finally{dom.window.MotionRuntime?.disposeAll();dom.window.anime?.engine.pause();dom.window.close();}
  }
 }finally{env.close();}
});
