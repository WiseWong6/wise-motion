// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {SPECS}from'./specs.js';
import {createKnowledgeMotion}from'./painter.js';
const scriptUrl=globalThis.document?.currentScript?.src;
for(const spec of SPECS){
 (globalThis.MotionFactories||={})[spec.factory]=(root,viewport)=>{
 const base=new URL(scriptUrl?'../assets/knowledge-video/':'assets/knowledge-video/',scriptUrl||root.ownerDocument.baseURI).href;
 const paint=createKnowledgeMotion(root,spec,base,viewport),draw=ms=>paint(ms/1000);
 draw.ready=paint.ready;draw.destroy=paint.destroy;return draw;
 };
}
