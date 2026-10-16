/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
import React,{useLayoutEffect,useRef,useState} from 'react';
import {AbsoluteFill,Html5Audio,Sequence,staticFile,useCurrentFrame,useVideoConfig,useDelayRender} from 'remotion';
import '../effects/aboutlove-clock.js';
import '../effects/aboutlove-fonts.js';
import '../effects/aboutlove-data.js';
import '../effects/aboutlove-entries.js';
import '../effects/aboutlove.js';

export function WiseAboutLove({effectId='sentence-depth-tunnel',variantId,speed=1,includeAudio=true}){
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),target=useRef(null),engine=useRef(null);
 const {delayRender,continueRender,cancelRender}=useDelayRender();
 const [failure,setFailure]=useState(null);
 const entry=globalThis.WiseAboutLoveEntries[effectId];
 const definition=variantId?entry?.variants[variantId]:entry?.aboutlove?entry:Object.values(entry?.variants||{})[0];
 if(!definition?.aboutlove)throw Error('请选择此组件支持的动作示例：'+effectId+'/'+(variantId||''));
 useLayoutEffect(()=>{
  let active=true;
  const handle=delayRender('准备动作字形与绘图');
  const draw=globalThis.WiseAboutLove.create(target.current,definition.aboutlove,definition.duration_ms,
   {fontBaseUrl:staticFile('catalog/assets/aboutlove/fonts/')});engine.current=draw;
  draw.ready.then(()=>{if(active)continueRender(handle);},error=>{if(active){setFailure(error);cancelRender(error);}});
  return()=>{active=false;draw.destroy();continueRender(handle);if(engine.current===draw)engine.current=null;};
 },[effectId,variantId,definition,delayRender,continueRender,cancelRender]);
 useLayoutEffect(()=>{engine.current?.(frame/fps*1000*Math.min(2,Math.max(.5,Number(speed)||1)));},[frame,fps,speed,effectId,variantId]);
 if(failure)throw failure;
 const logicalWidth=definition.aboutlove.composition?360*definition.aboutlove.viewport[2]/definition.aboutlove.viewport[3]:640;
 const scale=Math.min(width/logicalWidth,height/360);
 const rate=Math.min(2,Math.max(.5,Number(speed)||1));
 return <AbsoluteFill style={{alignItems:'center',justifyContent:'center',backgroundColor:'#0a0909'}}>
  {includeAudio&&entry.kind==='composition'&&entry.audio?.tracks.map((track,index)=>{
   const from=Math.round(track.start_ms*fps/(1000*rate));
   const durationInFrames=Math.max(1,Math.ceil(track.duration_ms*fps/(1000*rate)-1e-9));
   const age=frame-from,attack=track.fade_in_ms?Math.min(1,Math.max(0,age/(track.fade_in_ms*fps/(1000*rate)))):1;
   const release=track.fade_out_ms?Math.min(1,Math.max(0,(durationInFrames-age)/(track.fade_out_ms*fps/(1000*rate)))):1;
   return <Sequence key={index} from={from} durationInFrames={durationInFrames} layout="none">
    <Html5Audio src={staticFile(track.src)} trimBefore={Math.round((track.offset_ms||0)*fps/1000)} playbackRate={rate*(track.rate||1)} volume={(track.volume??1)*Math.min(attack,release)}/>
   </Sequence>;
  })}
  <div ref={target} style={{position:'relative',width:640,height:360,flexShrink:0,transform:`scale(${scale})`}}/>
 </AbsoluteFill>;
}
