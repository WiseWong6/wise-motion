/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 原作画布的固定帧接入。只提供原作实际使用的绘图调用，不建立第二个播放时钟。 */
(function(global){
 'use strict';
 const ownScript=global.document?.currentScript?.src;
 const assetURL=path=>new URL(path,ownScript?new URL('../',ownScript):new URL('./',global.document.baseURI)).href;
 const sources=global.WiseSceneSources=global.WiseSceneSources||{};
 const entries=global.WiseSceneEntries=global.WiseSceneEntries||{};
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 function session(root,width,height,look){
  const canvases=new Set(),images=new Set();let seed=24,current,ctx,fillOn=true,strokeOn=true,tint=1,shape=false;const stack=[];
  function canvas(w,h){const c=document.createElement('canvas');c.dataset.sceneSource='original';c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));canvases.add(c);return c;}
  function context(c){const x=c.getContext('2d');if(!x)throw Error('当前浏览器无法绘制原作画布');return x;}
  function graphics(w,h){const c=canvas(w,h);let density=1,data;const g={canvas:c,width:w,height:h,elt:c,get drawingContext(){return context(c);},pixels:[],pixelDensity(v){if(v===undefined)return density;density=v;c.width=Math.round(w*v);c.height=Math.round(h*v);context(c).setTransform(v,0,0,v,0,0);},loadPixels(){data=context(c).getImageData(0,0,c.width,c.height);g.pixels=data.data;},updatePixels(){context(c).putImageData(data,0,0);},clear(){const x=context(c);x.save();x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,c.width,c.height);x.restore();},remove(){c.width=c.height=1;canvases.delete(c);},resizeCanvas(a,b){g.width=w=a;g.height=h=b;g.pixelDensity(density);}};return g;}
  const color=(...v)=>{if(typeof v[0]==='string')return v[0];const gray=v.length<3,alpha=gray?(v[1]??255):(v[3]??255);return `rgba(${v[0]},${gray?v[0]:v[1]},${gray?v[0]:v[2]},${clamp(alpha/255)})`;};
  const paint=()=>{if(fillOn)ctx.fill();if(strokeOn)ctx.stroke();};
  const stub=()=>({style:{setProperty(){}},dataset:{},classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},querySelector(){return stub();},getBoundingClientRect(){return {width,height,left:0,top:0,right:width,bottom:height};}});
  const doc={createElement(tag){return tag==='canvas'?canvas(1,1):document.createElement(tag);},body:{dataset:{look,aspect:'3:4'}},querySelector(){return stub();},getElementById(){return stub();},addEventListener(){},hidden:false};
  const env={document:doc,devicePixelRatio:1,innerWidth:width,innerHeight:height,location:{search:''},windowWidth:width,windowHeight:height,width,height,
   PI:Math.PI,TWO_PI:Math.PI*2,HALF_PI:Math.PI/2,CLOSE:'close',ROUND:'round',CENTER:'center',CORNER:'corner',SQUARE:'butt',
   min:Math.min,max:Math.max,floor:Math.floor,ceil:Math.ceil,abs:Math.abs,pow:Math.pow,sqrt:Math.sqrt,sin:Math.sin,cos:Math.cos,atan2:Math.atan2,
   constrain:clamp,lerp:(a,b,t)=>a+(b-a)*t,map:(n,a,b,c,d)=>c+(d-c)*(n-a)/(b-a),dist:(a,b,c,d)=>Math.hypot(c-a,d-b),
   randomSeed(v){seed=v>>>0;},random(a,b){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const u=seed/4294967296;return Array.isArray(a)?a[Math.floor(u*a.length)]:a===undefined?u:b===undefined?u*a:a+(b-a)*u;},
   color,pixelDensity(){return 1;},frameRate(){},noLoop(){},loop(){},redraw(){},millis(){return 0;},addEventListener(){},matchMedia(){return {matches:false,addEventListener(){}};},
   // 原作通过场景环境调用此函数；浏览器仍要求它归属于原窗口。
   seedState(v){if(v!==undefined)seed=v>>>0;return seed;},Image:global.Image,URL:global.URL,getComputedStyle:global.getComputedStyle.bind(global),
   createCanvas(w,h){env.width=w;env.height=h;return {elt:current,parent(){return this;}};},createGraphics:graphics,
   push(){ctx.save();stack.push([fillOn,strokeOn,tint]);},pop(){ctx.restore();[fillOn,strokeOn,tint]=stack.pop();},
   fill(...v){fillOn=true;ctx.fillStyle=color(...v);},stroke(...v){strokeOn=true;ctx.strokeStyle=color(...v);},noFill(){fillOn=false;},noStroke(){strokeOn=false;},strokeWeight(v){ctx.lineWidth=v;},strokeCap(v){ctx.lineCap=v;},strokeJoin(v){ctx.lineJoin=v;},
   translate(x,y){ctx.translate(x,y);},rotate(a){ctx.rotate(a);},scale(x,y=x){ctx.scale(x,y);},clear(){ctx.clearRect(0,0,env.width,env.height);},background(...v){ctx.save();ctx.fillStyle=color(...v);ctx.fillRect(0,0,env.width,env.height);ctx.restore();},
   beginShape(){ctx.beginPath();shape=false;},vertex(x,y){shape?ctx.lineTo(x,y):ctx.moveTo(x,y);shape=true;},bezierVertex(...v){ctx.bezierCurveTo(...v);},endShape(close){if(close===env.CLOSE)ctx.closePath();paint();},
   line(...v){if(!strokeOn)return;ctx.beginPath();ctx.moveTo(v[0],v[1]);ctx.lineTo(v[2],v[3]);ctx.stroke();},
   rect(x,y,w,h,r=0){ctx.beginPath();r?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h);paint();},ellipse(x,y,w,h=w){ctx.beginPath();ctx.ellipse(x,y,Math.abs(w/2),Math.abs(h/2),0,0,Math.PI*2);paint();},circle(x,y,d){env.ellipse(x,y,d);},arc(x,y,w,h,a,b){ctx.beginPath();ctx.ellipse(x,y,Math.abs(w/2),Math.abs(h/2),0,a,b);paint();},
   triangle(a,b,c,d,e,f){ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.lineTo(e,f);ctx.closePath();paint();},bezier(...v){ctx.beginPath();ctx.moveTo(v[0],v[1]);ctx.bezierCurveTo(...v.slice(2));paint();},
   tint(gray,alpha=255){tint=alpha/255;},noTint(){tint=1;},image(g,...v){ctx.save();ctx.globalAlpha*=tint;ctx.drawImage(g.canvas||g,...(v.length===2?[...v,g.width,g.height]:v));ctx.restore();}
  };
  Object.defineProperty(env,'drawingContext',{get:()=>ctx});env.window=env;env.globalThis=env;env.Path2D=global.Path2D;
  function target(c){current=c;ctx=context(c);env.width=width;env.height=height;fillOn=true;strokeOn=true;tint=1;stack.length=0;}
  function layer(id){const c=canvas(width,height);c.dataset.layer=id;c.className='pattern-canvas';c.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain';root.append(c);return c;}
  async function image(path){const img=document.createElement('img');images.add(img);img.src=global.WiseSceneImageData?.[path]||assetURL(path);await new Promise((resolve,reject)=>{if(img.complete&&img.naturalWidth)return resolve();img.onload=resolve;img.onerror=()=>reject(Error('缺少原作素材：'+path));});await img.decode();return img;}
  const first=canvas(width,height);target(first);
  return {env,root,doc,canvas,graphics,context,target,layer,image,get ctx(){return ctx;},destroy(preserve=false){images.clear();for(const c of canvases){if(preserve&&c.isConnected)continue;c.width=c.height=1;c.remove();}canvases.clear();}};
 }
 function register(id,entry){entries[id]=entry;const factory=(root,K,def)=>{
  const config={...entry,...(entry.variants?.[def.variant_id]||{}),...(def.scene||{})};let dead=false,last=def.poster_only?(def.poster_time_ms||0):0,prepared=false,paintedTime;
  root.style.background='transparent';root.innerHTML='';root.dataset.art='original';
  const S=session(root,config.width,config.height,config.look);const layers=(config.layers||['art']).map(id=>[id,S.layer(id)]);
  const api=sources[config.family](S,config,def);function draw(ms){last=clamp(ms,0,def.duration_ms);if(dead||!prepared||last===paintedTime)return;const t=(config.start||0)+last/1000;
   api.prepare?.(t,config.mode||'full');
   for(const [part,c]of layers){S.target(c);const x=S.ctx;x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,config.width,config.height);x.globalAlpha=1;x.globalCompositeOperation='source-over';api.draw(t,config.mode||'full',part);c.dataset.sourceTime=String(t);}
   // 姿态明细仅供专项诊断；正常播放不逐帧计算、序列化整个粒子群。
   if(global.WiseSceneDiagnostics&&api.inspect)root.dataset.pose=JSON.stringify(api.inspect(t));
   paintedTime=last;
  }
  draw.ready=Promise.resolve(api.ready).then(()=>{if(dead)return;prepared=true;draw(last);});draw.frameRate=config.fps||60;
  draw.destroy=preserve=>{if(dead)return;dead=true;api.destroy?.(preserve);S.destroy(preserve);};return draw;
 };factory.requiresPreparation=true;
 if(entry.breakdown)factory.breakdown=entry.breakdown;
 global.MotionFactories[id]=factory;
 }
 global.WiseSceneRuntime={session,register,assetURL};
})(globalThis);
