/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
import React,{useRef,useState,useEffect,useLayoutEffect} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,useDelayRender} from 'remotion';
import {loadAssets,paintEffect,sequenceId,definitionFor} from '../assets/civilization-growth/engine.mjs';
export function CivilizationGrowth({effectId=sequenceId,speed=1}){
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),canvas=useRef(null),pending=useRef(null),[assets,setAssets]=useState(null),[error,setError]=useState(null);
 const {delayRender,continueRender,cancelRender}=useDelayRender();definitionFor(effectId);
 useEffect(()=>{
  let active=true;const handle=delayRender('准备书法、纸墨与文明群像');pending.current=handle;
  loadAssets().then(value=>{if(active)setAssets(value);}).catch(reason=>{if(active){setError(reason);cancelRender(reason);}continueRender(handle);pending.current=null;});
  return()=>{active=false;continueRender(handle);pending.current=null;};
 },[delayRender,continueRender,cancelRender]);
 useLayoutEffect(()=>{
  if(!assets||!canvas.current)return;
  try{const ctx=canvas.current.getContext('2d');if(!ctx)throw new Error('当前环境无法显示画布');paintEffect(ctx,assets,effectId,frame/fps*1000*Math.min(2,Math.max(.5,Number(speed)||1)));if(pending.current!==null){continueRender(pending.current);pending.current=null;}}
  catch(reason){setError(reason);cancelRender(reason);}
 },[assets,effectId,frame,fps,speed,continueRender,cancelRender]);
 if(error)throw error;
 return <AbsoluteFill style={{backgroundColor:'#e2e3dd',alignItems:'center',justifyContent:'center'}}><canvas ref={canvas} width={1920} height={1080} style={{width:'100%',height:'100%',objectFit:'contain'}}/></AbsoluteFill>;
}
