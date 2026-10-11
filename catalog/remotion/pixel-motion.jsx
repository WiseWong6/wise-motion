/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
import React,{useLayoutEffect,useRef} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import '../effects/pixel-motion-data.js';
import '../effects/pixel-motion.js';

export function WisePixelMotion({effectId='pixel-motion-sequence',variantId,speed=1}){
  const frame=useCurrentFrame(),{fps}=useVideoConfig(),canvas=useRef(null),engine=useRef(null);
  const part=effectId==='pixel-motion-sequence'?undefined:globalThis.WisePixelMotion.choices[effectId];
  useLayoutEffect(()=>{
    const instance=globalThis.WisePixelMotion.createEngine(canvas.current);engine.current=instance;
    return()=>{instance.dispose();if(engine.current===instance)engine.current=null;};
  },[]);
  useLayoutEffect(()=>{
    engine.current.render(frame/fps*Math.min(2,Math.max(.5,Number(speed)||1)),{part});
  },[frame,fps,speed,part,variantId]);
  return <AbsoluteFill style={{alignItems:'center',justifyContent:'center',backgroundColor:part?'transparent':'#1a1c2c'}}>
    <canvas ref={canvas} width={320} height={180} style={{width:'100%',height:'auto',aspectRatio:'16/9',imageRendering:'pixelated'}}/>
  </AbsoluteFill>;
}
