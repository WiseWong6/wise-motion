// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React, {useId, useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import '../effects/mechanical-windows-data.js';
import '../effects/mechanical-windows.js';
import {WiseNativeVideo} from './native-video.jsx';

export const isDrawingFlash=timeMs=>globalThis.WiseMechanicalWindows.isDrawingFlash(timeMs);

/** Apply the extracted geometry to caller-owned images or videos. */
export function MechanicalWindowClip({effectId='cross-aperture-turn',variantId,speed=1,children}) {
  const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
  const id='wise-window-'+useId().replace(/[^a-zA-Z0-9_-]/g,'');
  const mode=variantId==='offset-aperture'?'offset-aperture':effectId;
  const {shapes}=globalThis.WiseMechanicalWindows.stateFor(mode,frame/fps*1000*speed);
  const scale=Math.min(width/1920,height/1080);
  return <AbsoluteFill style={{overflow:'hidden'}}>
    <div style={{position:'absolute',width:1920,height:1080,left:(width-1920*scale)/2,
      top:(height-1080*scale)/2,transformOrigin:'0 0',transform:`scale(${scale})`}}>
      <svg width="0" height="0" style={{position:'absolute'}}><defs>
        <clipPath id={id} clipPathUnits="userSpaceOnUse">
          {shapes.map((shape,index)=>shape.type==='circle'?<circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r}/>:
            <rect key={index} x={shape.cx-shape.width/2} y={shape.cy-shape.height/2} width={shape.width} height={shape.height}
              transform={`rotate(${shape.angle} ${shape.cx} ${shape.cy})`}/>)}
        </clipPath>
      </defs></svg>
      <AbsoluteFill style={{clipPath:`url(#${id})`,overflow:'hidden'}}>{children}</AbsoluteFill>
    </div>
  </AbsoluteFill>;
}

export function WiseMechanicalWindows({effectId='cross-aperture-turn',variantId,speed=1,...props}) {
  if(effectId==='mechanical-window-sequence')return <WiseNativeVideo {...props}
    definition={props.definition||globalThis.WiseMechanicalWindows.sequence} speed={speed}/>;
  return <WindowDemonstration effectId={effectId} variantId={variantId} speed={speed}/>;
}
function WindowDemonstration({effectId,variantId,speed}) {
  const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
  const root=useRef(null),painter=useRef(null);
  useLayoutEffect(()=>{
    painter.current=globalThis.WiseMechanicalWindows.make(root.current,{id:effectId,variant_id:variantId});
    return ()=>{painter.current?.destroy();painter.current=null;};
  },[effectId,variantId]);
  useLayoutEffect(()=>{painter.current?.(frame/fps*1000*speed);},[frame,fps,speed,effectId,variantId]);
  const scale=Math.min(width/640,height/360);
  return <AbsoluteFill style={{background:'#101211',overflow:'hidden'}}>
    <div ref={root} style={{position:'absolute',width:640,height:360,left:(width-640*scale)/2,
      top:(height-360*scale)/2,transformOrigin:'0 0',transform:`scale(${scale})`}}/>
  </AbsoluteFill>;
}
