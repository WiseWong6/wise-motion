// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {FONT_FACES} from './fonts.js';
import {SPECS,ReviewScene,sourceFrame} from './Scene.jsx';
const scriptUrl=globalThis.document?.currentScript?.src;
let serial=0;
for(const spec of SPECS){
 const make=(root)=>{
  const doc=root.ownerDocument,base=new URL(scriptUrl?'../../':'../',scriptUrl||doc.baseURI).href;
  const css=FONT_FACES.map(f=>`@font-face{font-family:${JSON.stringify(f.family)};src:url(${JSON.stringify(new URL(f.file,base).href)});font-weight:${f.weight};font-display:block;${f.unicodeRange?'unicode-range:'+f.unicodeRange+';':''}}`).join('');
  const react=createRoot(root,{identifierPrefix:'ds-review-'+(++serial)+'-'});
  const [, ,w,h]=spec.viewport,scale=Math.min(640/w,360/h);
  let destroyed=false;
  const draw=ms=>{if(destroyed)return;flushSync(()=>react.render(<div style={{position:'absolute',inset:0,overflow:'hidden'}}><style>{css}</style><div style={{position:'absolute',left:(640-w*scale)/2,top:(360-h*scale)/2,width:w,height:h,transform:`scale(${scale})`,transformOrigin:'0 0'}}><ReviewScene spec={spec} frame={sourceFrame(spec,ms/1000)}/></div></div>));};
  draw.destroy=(preserve=false)=>{if(destroyed)return;destroyed=true;const snapshot=preserve?[...root.childNodes].map(n=>n.cloneNode(true)):[];flushSync(()=>react.unmount());if(preserve)root.replaceChildren(...snapshot);};
  draw(0);
  if(doc.fonts?.load)draw.ready=Promise.all(FONT_FACES.map(f=>doc.fonts.load(`${f.weight.split(' ')[0]} 32px "${f.family}"`,f.unicodeRange?'DeepSeek 11':'模型')));
  return draw;
 };
 (globalThis.MotionFactories||={})[spec.id]=make;
}
