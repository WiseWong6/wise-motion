// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React from 'react';
import {S3Pareto} from './S3Pareto';
export const SPECS = [
 {id:'pareto-efficiency-sequence',scene:'pareto',start:57,frames:140,preview:129,viewport:[0,0,912,652]},
].map(spec=>Object.freeze({kind:'action',start:0,viewport:[0,0,1080,1440],...spec}));
const COMPONENTS={pareto:S3Pareto};
export function resolveMotion(effectId,variantId){
 const spec=SPECS.find(s=>(s.exportId||s.id)===effectId&&s.variantId===variantId);
 if(!spec)throw new Error('未知测评动效：'+effectId+'/'+variantId);
 return spec;
}
export function sourceFrame(spec,seconds){
 if(!Number.isFinite(seconds))throw new TypeError('动作时间必须是有限数字');
 return Math.min(spec.frames-1,Math.max(0,Math.floor(seconds*30+1e-7)))+spec.start;
}
export function ReviewScene({spec,frame}){
 if(!Number.isFinite(frame))throw new TypeError('动作帧必须是有限数字');
 const sampled=Math.max(spec.start,Math.min(spec.start+spec.frames-1,Math.floor(frame)));
 const Component=COMPONENTS[spec.scene], [x,y,width,height]=spec.viewport;
 return <div data-review-scene={spec.scene} data-source-frame={sampled} style={{position:'absolute',width,height,overflow:'hidden',background:'#FFFFFF',fontSynthesis:'none'}}>
  <div style={{position:'absolute',left:-x,top:-y,width:1080,height:1440}}><Component frame={sampled}/></div>
 </div>;
}
