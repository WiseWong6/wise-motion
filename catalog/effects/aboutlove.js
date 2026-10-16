/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
/* The author's original scene drawing, driven solely by the supplied frame time. */
(function(global){
 'use strict';
 const fontSessions=new WeakMap();
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function acquireFonts(doc,version,baseUrl){
  if(!doc.fonts||!doc.defaultView.FontFace)throw Error('当前浏览器不能准备动作所需字体');
  let cache=fontSessions.get(doc);if(!cache)fontSessions.set(doc,cache=new Map());
  const base=baseUrl?new URL(baseUrl,doc.baseURI):null;
  const held=[];
  for(const descriptor of global.WiseAboutLoveFonts.projects[version]){
   const blob=global.WiseAboutLoveFonts.blobs[descriptor.blob];
   const url=base?new URL(blob.file,base).href:'assets/aboutlove/fonts/'+blob.file;
   const key=descriptor.family+'|'+descriptor.weight+'|'+descriptor.style+'|'+url;
   let item=cache.get(key);
   if(!item){
    const face=new doc.defaultView.FontFace(descriptor.family,`url("${url}")`,{weight:descriptor.weight,style:descriptor.style});
    item={face,refs:0};cache.set(key,item);
    item.ready=face.load().then(()=>{if(item.refs)doc.fonts.add(face);return face;});
   }
   item.refs++;held.push([key,item]);
  }
  let released=false;
  return {ready:Promise.all(held.map(([,i])=>i.ready)),release(){
   if(released)return;released=true;
   for(const [key,item]of held)if(--item.refs===0){doc.fonts.delete(item.face);cache.delete(key);}
  }};
 }
 function create(root,config,duration,{fontBaseUrl=global.WiseAboutLoveFonts.baseUrl}={}){
  if(!config)throw Error('缺少动作示例配置');
  const doc=root.ownerDocument,view=doc.defaultView,canvases=new Set();
  let dead=false,prepared=false,last=0,lastPaint;
  root.replaceChildren();root.style.background='transparent';root.dataset.art='aboutlove';
  const host=doc.createElement('div');host.style.cssText='position:absolute;inset:0;width:640px;height:360px;overflow:hidden';root.append(host);
  const shadow=host.attachShadow({mode:'open'}),style=doc.createElement('style');
  style.textContent=global.WiseAboutLoveData.projects[config.version].css+`\n:host{display:block;overflow:hidden} .al-stage{position:absolute;width:1080px;height:1440px;overflow:hidden;transform-origin:0 0}.al-piece{position:absolute;inset:0;width:1080px;height:1440px;overflow:hidden} ${config.hide?config.hide+'{display:none!important}':''}`;
  shadow.append(style);
  const stage=doc.createElement('div');stage.className='al-stage';stage.id='root';stage.style.cssText='position:absolute;width:1080px;height:1440px';shadow.append(stage);
  const [x,y,w,h]=config.viewport,scale=Math.min(640/w,360/h);
  stage.style.transform=`translate(${(640-w*scale)/2-x*scale}px,${(360-h*scale)/2-y*scale}px) scale(${scale})`;
  const trackCanvas=c=>{
   if(canvases.has(c))return c;canvases.add(c);c.dataset.sceneSource='original';c.dataset.aboutlove='true';
   const get=c.getContext.bind(c);c.getContext=(type,...args)=>{const ctx=get(type,...args);if(!ctx)throw Error('当前浏览器无法绘制动作画布');return ctx;};return c;
  };
  const scoped={defaultView:view,fonts:doc.fonts,
   getElementById:id=>shadow.getElementById(id),querySelector:sel=>shadow.querySelector(sel),querySelectorAll:sel=>shadow.querySelectorAll(sel),
   createElement(tag,...args){const el=doc.createElement(tag,...args);return tag.toLowerCase()==='canvas'?trackCanvas(el):el;},
   createDocumentFragment:()=>doc.createDocumentFragment(),createTextNode:s=>doc.createTextNode(s)};
  const frames=global.WiseAboutLoveClock.create(scoped);
  const env={__timelines:{},__alMode:config.mode||'full',__alNoCaret:Boolean(config.omit_caret),__alAllows:group=>!config.mode||config.mode==='full'||config.mode===group};
  const mount=p=>{
   const scene=global.WiseAboutLoveData.scenes[p.scene];if(!scene)throw Error('动作场景不存在：'+p.scene);
   const el=doc.createElement('div');el.className='al-piece';el.dataset.sourceScene=scene.id;el.style.zIndex=String(scene.track);el.style.visibility='hidden';stage.append(el);
   if(!config.composition){el.innerHTML=scene.html;el.querySelectorAll('canvas').forEach(trackCanvas);}
   // Font loading, source initialization and all offscreen canvases belong to this instance.
   return {...p,el,scene};
  };
  const segments=(config.segments||[{scene:config.scene,scene_id:config.scene_id,start:config.start,at:0,duration:duration/1000}]).map(mount);
  const overlays=(config.overlays||[]).map(mount),pieces=[...segments,...overlays];
  const fonts=acquireFonts(doc,config.version,fontBaseUrl);
  function preparePiece(p){
   if(p.timeline)return;
   if(config.composition){p.el.innerHTML=p.scene.html;p.el.querySelectorAll('canvas').forEach(trackCanvas);}
   // Prepare a scene only when it is needed, including direct seeks to later scenes.
   scoped.getElementById=id=>p.el.querySelector('[id="'+id+'"]');
   scoped.querySelectorAll=sel=>p.el.querySelectorAll(sel);
   scoped.querySelector=sel=>p.el.querySelector(sel);
   p.scene.init(env,scoped,frames,view.Node);p.timeline=env.__timelines[p.scene_id];
   if(!p.timeline)throw Error('动作没有建立固定时间线：'+p.scene_id);
  }
  const visibility=(p,visible)=>{const value=visible?'visible':'hidden';if(p.el.style.visibility!==value)p.el.style.visibility=value;};
  function draw(ms){
   last=clamp(Number(ms)||0,0,duration);
   if(dead||!prepared||lastPaint===last)return;
   const seconds=last/1000;
   let active=segments[0];for(const p of segments)if(seconds>=p.at)active=p;
   preparePiece(active);
   for(const p of segments)visibility(p,p===active);
   const t=active.start+clamp(seconds-active.at,0,active.duration);
   const sourceTime=active.scene.start_s+t;
   for(const p of overlays){
    const local=sourceTime-p.scene.start_s;
    preparePiece(p);visibility(p,local>=0&&local<=p.scene.duration_s);
    p.timeline.seek(clamp(local,0,p.scene.duration_s));p.el.dataset.sourceTime=String(clamp(local,0,p.scene.duration_s));
   }
   active.timeline.seek(t);lastPaint=last;
   root.dataset.sourceTime=String(t);root.dataset.sourceScene=active.scene.id;
   root.dataset.sourceGlobalTime=String(sourceTime);
  }
  draw.ready=fonts.ready.then(()=>{
   if(dead)return;
   global.WiseAboutLoveData.projects[config.version].init(env,scoped,frames,view.Node);
   // Short extracted examples retain their original shared-scene preparation order.
   if(!config.composition)for(const p of pieces)preparePiece(p);
   prepared=true;draw(last);
  });
  draw.destroy=(preserve=false)=>{
   if(dead)return;dead=true;prepared=false;frames.destroy();fonts.release();
   for(const c of canvases){if(preserve&&c.isConnected)continue;c.width=c.height=1;c.remove();}canvases.clear();
   if(!preserve)host.remove();pieces.length=0;segments.length=0;overlays.length=0;
  };
  draw.frameRate=60;return draw;
 }
 const factories=global.MotionFactories=global.MotionFactories||{};
 function install(id){
  const wrap=original=>{
   const route=(root,K,definition)=>{
    if(definition?.aboutlove)return create(root,definition.aboutlove,definition.duration_ms);
    if(!original)throw Error('旧动作的绘制文件没有载入：'+id);
    return original(root,K,definition);
   };
   if(global.WiseAboutLoveEntries[id].breakdown)route.breakdown=global.WiseAboutLoveEntries[id].breakdown;
   // Keep a stable previous factory: legacy adapters can capture it before registering their replacement.
   return new Proxy(route,{
    get(target,key,receiver){return Reflect.has(target,key)?Reflect.get(target,key,receiver):original?.[key];},
    set(target,key,value){Object.defineProperty(target,key,{value,writable:true,configurable:true,enumerable:true});return true;},
    ownKeys(target){return [...new Set([...Reflect.ownKeys(target),...Reflect.ownKeys(original||{})])];},
    getOwnPropertyDescriptor(target,key){const own=Reflect.getOwnPropertyDescriptor(target,key);if(own)return own;const inherited=Reflect.getOwnPropertyDescriptor(original||{},key);return inherited?{...inherited,configurable:true}:undefined;}
   });
  };
  let dispatch=wrap(factories[id]);
  // Lazy source loading must not depend on whether the old factory loaded before or afterward.
  Object.defineProperty(factories,id,{configurable:true,enumerable:true,get:()=>dispatch,set:fn=>{if(fn!==dispatch)dispatch=wrap(fn);}});
 }
 for(const id of Object.keys(global.WiseAboutLoveEntries))install(id);
 global.WiseAboutLove={create};
})(globalThis);
