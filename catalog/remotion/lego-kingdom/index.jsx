// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React,{useLayoutEffect,useState} from 'react';
import {AbsoluteFill,Img,staticFile,useCurrentFrame,useDelayRender,useVideoConfig} from 'remotion';
import {LegoScene,resolveMotion,sourceFrame} from './Scene.jsx';

import {FONT_FACES} from './fonts.js';
export function WiseLegoMotion({effectId='lego-engine-flow',variantId,speed=1,children}) {
  const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
  const {delayRender,continueRender,cancelRender}=useDelayRender();
  const [failure,setFailure]=useState(null);
  useLayoutEffect(()=>{
    let alive=true,released=false;
    const handle=delayRender('准备动作示例的本地字体');
    const release=()=>{if(!released){released=true;continueRender(handle);}};
    const fonts=FONT_FACES.map(([family,file,weight])=>new FontFace(family,`url(${JSON.stringify(staticFile(file))})`,{weight}));
    Promise.all(fonts.map(face=>face.load())).then(loaded=>{
      if(alive)loaded.forEach(face=>document.fonts.add(face));
      release();
    },error=>{if(alive){setFailure(error);cancelRender(error);}release();});
    return()=>{alive=false;fonts.forEach(face=>document.fonts.delete(face));release();};
  },[delayRender,continueRender,cancelRender]);
  if(failure)throw failure;
  const spec=resolveMotion(effectId,variantId),rate=Math.max(.5,Math.min(2,Number(speed)||1));
  const sampled=sourceFrame(spec,frame/fps*rate),scale=Math.min(width/1080,height/1440);
  return <AbsoluteFill style={{background:'#0a0a0b',overflow:'hidden'}}>
    <div style={{position:'absolute',left:(width-1080*scale)/2,top:(height-1440*scale)/2,width:1080,height:1440,transform:`scale(${scale})`,transformOrigin:'0 0'}}>
      <LegoScene effectId={effectId} variantId={variantId} frame={sampled} resolveAsset={staticFile} ImageComponent={Img}>{children}</LegoScene>
    </div>
  </AbsoluteFill>;
}
