// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
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
import {ExtractScope} from './ActualEffect.jsx';

const scriptUrl=typeof document==='undefined'?null:document.currentScript?.src;
let serial=0;
const presets={
 'confused-characters-illustration':{start:12.85,crop:[-80,250,1240,970],component:AIBots,mood:'confused'},
 'celebrating-characters-illustration':{start:46.25,crop:[-30,220,1140,870],component:AIBots,mood:'happy'},
 'trash-intake-output':{start:22.35,crop:[0,70,1080,1300],component:GarbageFlow},
 'fall-stack-grid':{start:26.2,crop:[30,220,1020,1130],component:CardStack},
 'curved-image-picker':{start:42.6,timeScale:0.5,crop:[40,WHEEL_TOP,1000,760],component:ImagePicker},
 'masked-image-scroll':{start:48.1,crop:[0,250,1080,750],component:MaskScroll},
};
const urlFor=(doc,path)=>new URL(path.replace(/^catalog\//,''),scriptUrl?new URL('../',scriptUrl):
 doc.baseURI.includes('/catalog/')?new URL('./',doc.baseURI):new URL('catalog/',doc.baseURI)).href;
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
 const children=new Set();
 const draw=(ms,state={})=>{
  if(destroyed)return;
  const time=definition.loop?(state.elapsed??ms):ms;
  const t=spec.start+time*(spec.timeScale??1)/1000,Component=spec.component;
  flushSync(()=>reactRoot.render(<ExtractScope.Provider value={children}><div data-reel-extract={definition.source.factory} style={{position:'absolute',inset:0,overflow:'hidden'}}>
   <div style={{position:'absolute',left,top,width:1080,height:1440,transform:`scale(${scale})`,transformOrigin:'0 0'}}>
    <Component t={t} mood={spec.mood} asset={asset} fillKind={definition.variant_id||'action'} />
   </div>
  </div></ExtractScope.Provider>));
 };
 draw(0);
 draw.ready=Promise.all([assets.ready,...[...children].map(child=>child.ready)]);draw.ready.catch(()=>{});
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
 const doc=root.ownerDocument,outer=doc.createElement('div'),position=doc.createElement('div'),host=doc.createElement('div'),shadow=doc.createElement('div');
 Object.assign(outer.style,{position:'absolute',inset:'0',overflow:'hidden'});
 Object.assign(position.style,{position:'absolute',width:'1080px',height:'1440px',left:'147.2px',top:'-99.2px',transform:'scale(.32)',transformOrigin:'0 0'});
 const stage=globalThis.WiseButterflyMotion.STAGE;
 for(const node of [host,shadow])Object.assign(node.style,{position:'absolute',inset:'0',transformOrigin:`${stage.x}px ${stage.y}px`});
 host.dataset.tasteButterfly='true';host.style.filter='drop-shadow(-5px 9px 5px rgba(24,40,30,0.09))';
 shadow.dataset.tasteShadow='true';shadow.style.filter='brightness(0) blur(16px)';
 const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg'),line=doc.createElementNS('http://www.w3.org/2000/svg','path');
 svg.setAttribute('width','1080');svg.setAttribute('height','1440');Object.assign(svg.style,{position:'absolute',inset:'0',width:'1080px',height:'1440px',pointerEvents:'none'});
 line.dataset.tasteFlightLine='';
 for(const [name,value] of Object.entries({fill:'none',stroke:'#217756','stroke-width':'1.8','stroke-linecap':'round',pathLength:'1'}))line.setAttribute(name,value);
 svg.append(line);position.append(svg,shadow,host);outer.append(position);root.replaceChildren(outer);
 const mask=definition.variant_id==='sage'?globalThis.WiseButterflySageMask:globalThis.WiseButterflyMask;
 if(!mask)throw new Error('蝴蝶换色遮罩未载入');
 const atlas=definition.variant_id==='sage'?'sage-watercolor-wing-atlas.webp':'wing-atlas.webp';
 const options={atlasSrc:urlFor(doc,'catalog/assets/butterfly/'+atlas),alternateSrc:urlFor(doc,'catalog/assets/butterfly/ai-wing-atlas.webp'),maskSrc:mask};
 const instance=globalThis.WiseButterfly.mount(host,options),shadowInstance=globalThis.WiseButterfly.mount(shadow,options);
 let destroyed=false;
 const draw=ms=>{
  if(destroyed)return;
  const state=tasteButterflyState(CUES.enter+ms/1000);
  host.style.opacity=String(state.entered);
  host.style.transform=`translate(${state.offsetX}px,${state.offsetY}px) scale(${state.scale*.9},${state.scale*1.03})`;
  shadow.style.opacity=String(state.entered*.19);
  shadow.style.transform=`translate(${state.offsetX-88}px,${state.offsetY+108}px) scale(${state.scale*.86},${state.scale*.93})`;
  const bodyX=stage.x+state.offsetX,bodyY=stage.y+state.offsetY;
  line.setAttribute('d',`M 12 1318 C 176 1240 426 1172 352 1220 C 268 1276 316 1306 448 1226 C 550 1162 576 1072 ${bodyX-28} ${bodyY+76}`);
  line.setAttribute('opacity',state.selection*.62);line.setAttribute('stroke-dasharray',`${state.selection} 1`);
  const frame={selection:state.selection,wingSelections:state.wingSelections,revealFromRoot:true,motionState:state.motionState};
  instance.draw(state.seconds,frame);shadowInstance.draw(state.seconds,frame);
 };
 draw(0);draw.ready=Promise.all([instance.ready,shadowInstance.ready]);draw.ready.catch(()=>{});
 draw.destroy=preserve=>{if(destroyed)return;destroyed=true;instance.destroy(preserve);shadowInstance.destroy(preserve);if(!preserve)outer.remove();};
 return draw;
}
makeButterfly.requiresPreparation=true;
factories['wing-root-color-reveal']=makeButterfly;
// Mathematical samples are shared by regression checks and the actual painters.
globalThis.WiseReelExtract=Object.freeze({tasteButterflyState,botEyePose,liveBotConfetti,garbageTrashAt,garbageBoxAt,wheelPosition,presets});
