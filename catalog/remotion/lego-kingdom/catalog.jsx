// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {FONT_FACES} from './fonts.js';
import {LEGO_SPECS,LegoScene,resolveMotion,sourceFrame} from './Scene.jsx';

let serial=0;
const scriptUrl=globalThis.document?.currentScript?.src;
function make(root,_kit,definition) {
  const document=root.ownerDocument;
  const assetRoot=new URL(scriptUrl?'../../':'../',scriptUrl||document.baseURI).href;
  const fontCss=FONT_FACES.map(([family,file,weight])=>`@font-face{font-family:${JSON.stringify(family)};src:url(${JSON.stringify(new URL(file,assetRoot).href)});font-weight:${weight};font-style:normal;font-display:block}`).join('');
  const spec=resolveMotion(definition.id,definition.variant_id);
  const reactRoot=createRoot(root,{identifierPrefix:'lego-motion-'+(++serial)+'-'});
  let destroyed=false;
  const draw=ms=>{
    if(destroyed)return;
    const frame=sourceFrame(spec,ms/1000);
    flushSync(()=>reactRoot.render(<div style={{position:'absolute',inset:0,overflow:'hidden'}}>
      <style>{fontCss}</style>
      <div style={{position:'absolute',width:1080,height:1440,left:185,top:0,transform:'scale(.25)',transformOrigin:'0 0'}}>
        <LegoScene effectId={definition.id} variantId={definition.variant_id} frame={frame} resolveAsset={path=>new URL(path,assetRoot).href}/>
      </div>
    </div>));
  };
  draw.destroy=(preserve=false)=>{
    if(destroyed)return;destroyed=true;
    const snapshot=preserve?[...root.childNodes].map(node=>node.cloneNode(true)):[];
    flushSync(()=>reactRoot.unmount());
    if(preserve)root.replaceChildren(...snapshot);
  };
  draw(0);
  if(document.fonts?.load)draw.ready=Promise.all(FONT_FACES.map(([family,,weight])=>document.fonts.load(`${weight} 32px "${family}"`)));
  return draw;
}
const factories=globalThis.MotionFactories||={};
for(const spec of LEGO_SPECS) {
  // Each imported example owns a factory key. Loading an older example later
  // must never replace this painter (or vice versa).
  const factory=(root,kit,definition)=>make(root,kit,definition);
  if(spec.kind==='composition')factory.breakdown=(spec.layers||[]).map((layer,i)=>({
    id:layer.id||'part-'+i,name:layer.name,detail:layer.detail,time:layer.time||'完整片段',
    start:layer.start??0,end:Math.min(layer.end??Infinity,spec.frames/30*1000),actions:layer.actions||[],
  }));
  factories[spec.id]=factory;
}
globalThis.WiseLegoMotion=Object.freeze({specs:LEGO_SPECS.map(({Component,...spec})=>spec),sourceFrame});
