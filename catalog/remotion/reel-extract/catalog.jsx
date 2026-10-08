// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
// Extracted scene components use React only to update nodes. The existing catalog/Remotion clock owns time.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {AIBots} from './AIBots.jsx';
import {CardStack,GarbageFlow,ImagePicker,MaskScroll,WHEEL_TOP} from './Scenes.jsx';
import {tasteButterflyState} from './tasteMotion.mjs';
import CUES from './butterfly-cues.json';
import {botEyePose,liveBotConfetti} from './aiBotExpressions.mjs';
import {garbageTrashAt,garbageBoxAt} from './garbageMotion.mjs';
import {wheelPosition} from './Scenes.jsx';

const scriptUrl=typeof document==='undefined'?null:document.currentScript?.src;
let serial=0;
const presets={
 'confused-characters-illustration':{start:12.85,crop:[40,450,1000,700],component:AIBots,mood:'confused'},
 'celebrating-characters-illustration':{start:46.25,crop:[40,225,1000,825],component:AIBots,mood:'happy'},
 'trash-intake-output':{start:22.35,crop:[135,70,810,1250],component:GarbageFlow},
 'fall-stack-grid':{start:26.2,crop:[30,220,1020,1130],component:CardStack},
 'curved-image-picker':{start:42.6,timeScale:0.5,crop:[56,WHEEL_TOP,968,760],component:ImagePicker},
 'masked-image-scroll':{start:48.1,crop:[0,370,1080,500],component:MaskScroll},
};
const urlFor=(doc,path)=>new URL(path.replace(/^catalog\//,''),scriptUrl?new URL('../',scriptUrl):new URL('./',doc.baseURI)).href;
function prepareAssets(doc,definition){
 const pending=[];
 for(const file of definition.source.assets||[]){
  if(!/\.(png|webp|jpg)$/.test(file))continue;
  const image=doc.createElement('img');
  let stop;
  const ready=new Promise((resolve,reject)=>{
   const clear=()=>{image.onload=null;image.onerror=null;};
   const done=()=>{clear();(image.decode?image.decode():Promise.resolve()).then(resolve,reject);};
   image.onload=done;
   image.onerror=()=>{clear();reject(new Error('无法载入收录素材：'+file));};
   stop=()=>{clear();resolve();};
   image.src=urlFor(doc,file);
   if(image.complete&&image.naturalWidth)done();
  });
  pending.push({image,ready,stop});
 }
 return {ready:Promise.all(pending.map(p=>p.ready)),destroy(){pending.forEach(p=>p.stop());pending.length=0;}};
}
function make(root,kit,definition){
 const spec=presets[definition.source.factory],doc=root.ownerDocument;
 const assets=prepareAssets(doc,definition),reactRoot=createRoot(root,{identifierPrefix:'reel-'+(++serial)+'-'});
 const asset=file=>urlFor(doc,'catalog/assets/reel-extract/'+file);
 const [x,y,w,h]=spec.crop,scale=Math.min(640/w,360/h),left=(640-w*scale)/2-x*scale,top=(360-h*scale)/2-y*scale;
 let destroyed=false;
 const draw=(ms,state={})=>{
  if(destroyed)return;
  const time=definition.loop?(state.elapsed??ms):ms;
  const t=spec.start+time*(spec.timeScale??1)/1000,Component=spec.component;
  flushSync(()=>reactRoot.render(<div data-reel-extract={definition.id} style={{position:'absolute',inset:0,overflow:'hidden'}}>
   <div style={{position:'absolute',left,top,width:1080,height:1440,transform:`scale(${scale})`,transformOrigin:'0 0'}}>
    <Component t={t} mood={spec.mood} asset={asset} />
   </div>
  </div>));
 };
 draw(0);
 draw.ready=assets.ready;draw.ready.catch(()=>{});
 draw.destroy=(preserve=false)=>{
  if(destroyed)return;destroyed=true;assets.destroy();
  const snapshot=preserve?[...root.childNodes].map(node=>node.cloneNode(true)):[];
  flushSync(()=>reactRoot.unmount());if(preserve)root.replaceChildren(...snapshot);
 };
 return draw;
}
make.requiresPreparation=true;
const factories=globalThis.MotionFactories||={};
for(const id of Object.keys(presets))factories[id]=make;
function makeButterfly(root,kit,definition){
 const doc=root.ownerDocument,outer=doc.createElement('div'),position=doc.createElement('div'),host=doc.createElement('div');
 Object.assign(outer.style,{position:'absolute',inset:'0',overflow:'hidden'});
 Object.assign(position.style,{position:'absolute',width:'1080px',height:'1440px',left:'56px',top:'-233.76px',transform:'scale(.48)',transformOrigin:'0 0'});
 Object.assign(host.style,{position:'absolute',inset:'0',transformOrigin:'550px 862px'});
 position.append(host);outer.append(position);root.replaceChildren(outer);
 if(!globalThis.WiseButterflyMask)throw new Error('蝴蝶换色遮罩未载入');
 const instance=globalThis.WiseButterfly.mount(host,{atlasSrc:urlFor(doc,'catalog/assets/butterfly/wing-atlas.webp'),alternateSrc:urlFor(doc,'catalog/assets/butterfly/ai-wing-atlas.webp'),maskSrc:globalThis.WiseButterflyMask});
 let destroyed=false;
 const draw=ms=>{
  if(destroyed)return;
  const state=tasteButterflyState(CUES.enter+ms/1000);
  host.style.opacity=String(state.entered);
  host.style.transform=`translate(${state.offsetX}px,${state.offsetY}px) scale(${state.scale})`;
  instance.draw(state.seconds,{selection:state.selection,wingSelections:state.wingSelections,revealFromRoot:true,motionState:state.motionState});
 };
 draw(0);draw.ready=instance.ready;
 draw.destroy=preserve=>{if(destroyed)return;destroyed=true;instance.destroy(preserve);if(!preserve)outer.remove();};
 return draw;
}
makeButterfly.requiresPreparation=true;
factories['wing-root-color-reveal']=makeButterfly;
// Mathematical samples are shared by regression checks and the actual painters.
globalThis.WiseReelExtract=Object.freeze({tasteButterflyState,botEyePose,liveBotConfetti,garbageTrashAt,garbageBoxAt,wheelPosition,presets});
