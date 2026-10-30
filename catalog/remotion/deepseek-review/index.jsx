// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React,{useLayoutEffect} from 'react';
import {AbsoluteFill,staticFile,useCurrentFrame,useDelayRender,useVideoConfig} from 'remotion';
import {FONT_FACES} from './fonts.js';
import {ReviewScene,resolveMotion,sourceFrame} from './Scene.jsx';
export function WiseReviewMotion({effectId='pareto-efficiency-sequence',variantId,speed=1}){
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const {delayRender,continueRender,cancelRender}=useDelayRender();
 useLayoutEffect(()=>{
  let alive=true,released=false;const handle=delayRender('准备动效原字体');
  const release=()=>{if(!released){released=true;continueRender(handle);}};
  const faces=FONT_FACES.map(({family,file,...options})=>new FontFace(family,`url(${JSON.stringify(staticFile(file))})`,options));
  Promise.all(faces.map(f=>f.load())).then(loaded=>{if(alive)loaded.forEach(f=>document.fonts.add(f));release();},error=>{if(alive)cancelRender(error);release();});
  return()=>{alive=false;faces.forEach(f=>document.fonts.delete(f));release();};
 },[delayRender,continueRender,cancelRender]);
 const spec=resolveMotion(effectId,variantId),rate=Math.max(.5,Math.min(2,Number(speed)||1));
 const [, ,w,h]=spec.viewport,scale=Math.min(width/w,height/h);
 return <AbsoluteFill style={{background:'#FFFFFF',overflow:'hidden'}}>
  <div style={{position:'absolute',left:(width-w*scale)/2,top:(height-h*scale)/2,width:w,height:h,transform:`scale(${scale})`,transformOrigin:'0 0'}}><ReviewScene spec={spec} frame={sourceFrame(spec,frame/fps*rate)}/></div>
 </AbsoluteFill>;
}
