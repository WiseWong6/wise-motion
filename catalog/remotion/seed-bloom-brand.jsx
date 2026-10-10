/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import '../effects/seed-bloom-brand.js';
/** The Canvas renderer is synchronous and has no external assets or font loading.
 * Layout effects finish the current frame before Remotion captures it.
 * A new isolated engine is created per mounted component, including StrictMode remounts. */
export function SeedBloomBrand({effectId='seed-bloom-brand-sequence', speed=1}) {
  const frame=useCurrentFrame(), {fps}=useVideoConfig();
  const canvas=useRef(null),engine=useRef(null);
  useLayoutEffect(()=>{
    const instance=globalThis.WiseSeedBloom.createEngine(canvas.current);engine.current=instance;
    return()=>{instance.dispose();if(engine.current===instance)engine.current=null;};
  },[]);
  useLayoutEffect(()=>{
    const seconds=frame/fps*Math.min(2,Math.max(.5,Number(speed)||1));
    if(effectId==='seed-bloom-brand-sequence')engine.current.render(seconds);
    else engine.current.drawAction(effectId,seconds);
  },[frame,fps,effectId,speed]);
  return <AbsoluteFill style={{backgroundColor:'#151D1B',alignItems:'center',justifyContent:'center'}}>
    <canvas ref={canvas} width={2132} height={1200} style={{width:'100%',height:'100%',objectFit:'contain'}}/>
  </AbsoluteFill>;
}
