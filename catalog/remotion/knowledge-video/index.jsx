// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React,{useRef,useLayoutEffect}from'react';
import {AbsoluteFill,staticFile,useCurrentFrame,useVideoConfig,useDelayRender}from'remotion';
import {createKnowledgeMotion}from'./painter.js';
import {resolveSpec}from'./specs.js';
export function WiseKnowledgeMotion({effectId='dimensions-unfold-fold',variantId,speed=1,assetBaseUrl}){
 const host=useRef(null),painter=useRef(null),latest=useRef(0),frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const {delayRender,continueRender,cancelRender}=useDelayRender(),spec=resolveSpec(effectId,variantId);
 latest.current=frame/fps*Math.max(.5,Math.min(2,Number(speed)||1));
 useLayoutEffect(()=>{
  let alive=true,released=false;const handle=delayRender('准备动效字体与素材');
  const release=()=>{if(!released){released=true;continueRender(handle);}};
  let draw;try{const base=new URL((assetBaseUrl||staticFile('catalog/assets/knowledge-video'))+'/',document.baseURI).href;draw=createKnowledgeMotion(host.current,spec,base,{width,height});painter.current=draw;
  draw.ready.then(()=>{if(alive)draw(latest.current);release();},error=>{if(alive)cancelRender(error);release();});}catch(error){cancelRender(error);release();}
  return()=>{alive=false;draw?.destroy();if(painter.current===draw)painter.current=null;release();};
 },[spec,width,height,assetBaseUrl,delayRender,continueRender,cancelRender]);
 useLayoutEffect(()=>{painter.current?.(latest.current)},[frame,fps,speed]);
 return <AbsoluteFill style={{background:'#050505',overflow:'hidden'}}><div ref={host} style={{position:'absolute',inset:0}}/></AbsoluteFill>;
}
