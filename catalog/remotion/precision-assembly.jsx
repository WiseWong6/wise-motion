/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
import React,{useLayoutEffect,useRef} from 'react';
import {AbsoluteFill,Freeze,Html5Audio,Html5Video,OffthreadVideo,staticFile,useCurrentFrame,useRemotionEnvironment,useVideoConfig} from 'remotion';
import '../effects/precision-assembly-data.js';

/** Frame adapter for the original Cycles cache. Complete native production assets are downloaded separately from Git. */
export function WisePrecisionAssembly({effectId='precision-assembly-sequence',speed=1,includeAudio=true,
  assetBaseUrl,width,height,timeOverrideMs,onReady,onFrame,onError}){
  const frame=useCurrentFrame(),{fps,width:vw,height:vh}=useVideoConfig();
  const {isRendering}=useRemotionEnvironment();
  const stage=useRef(null),video=useRef(null),announced=useRef(false),latest=useRef(null);
  const data=globalThis.WisePrecisionAssembly,part=data.choices[effectId];
  if(!part)throw new Error('未知三维片段：'+effectId);
  if(!Number.isFinite(speed))throw new TypeError('播放速度必须为有限数字');
  const rate=Math.min(2,Math.max(.5,speed));
  const time=timeOverrideMs??Math.min(part.frames/24*1000,frame/fps*rate*1000);
  const sample=data.sample(effectId,time);
  latest.current={time,elapsed:time,frame};
  const base=assetBaseUrl?new URL(assetBaseUrl.replace(/\/?$/,'/'),typeof document==='undefined'?'http://localhost/':document.baseURI).href:null;
  const movie=base?new URL('catalog/assets/precision-assembly/成片/分秒之间.mp4',base).href:staticFile('precision-assembly/成片/分秒之间.mp4');
  const audio=base?new URL('catalog/assets/composition-audio/precision-assembly/soundtrack.wav',base).href:staticFile('precision-assembly/成片/分秒之间-声轨.wav');
  const announce=()=>{
    if(announced.current)return;announced.current=true;
    onReady?.({native:true,stage:stage.current,destroy(){},snapshot(){
      const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;
      const context=canvas.getContext('2d');
      if(!context||!video.current||video.current.readyState<2)throw new Error('无法保留三维预览画面');
      context.drawImage(video.current,0,0);canvas.style.cssText='width:100%;height:100%;object-fit:contain';
      return canvas;
    }});
  };
  useLayoutEffect(()=>{onFrame?.(latest.current);},[time,frame,onFrame]);
  useLayoutEffect(()=>{announced.current=false;return()=>{announced.current=false;};},[effectId,movie]);
  const style={width:'100%',height:'100%',objectFit:'contain'};
  const imageProps={src:movie,muted:true,style,onError,pauseWhenBuffering:true};
  // Seek to each native frame's midpoint, so 24-fps frame boundaries stay stable at other fps.
  return <div ref={stage} data-native-scene={effectId} style={{position:'relative',width:width??vw,height:height??vh,background:'#080807'}}>
    <AbsoluteFill>
      <Freeze frame={sample.time*fps}>
        {isRendering?<OffthreadVideo {...imageProps}/>:<Html5Video {...imageProps} ref={video} onLoadedData={announce} onSeeked={announce}/>}
      </Freeze>
      {includeAudio&&effectId==='precision-assembly-sequence'?<Html5Audio src={audio} playbackRate={rate}/>:null}
    </AbsoluteFill>
  </div>;
}
