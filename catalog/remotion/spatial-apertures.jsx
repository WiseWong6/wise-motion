// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React,{useId} from 'react';
import {AbsoluteFill,Img,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import '../effects/mechanical-windows-data.js';
import '../effects/mechanical-windows.js';
import '../effects/spatial-apertures-data.js';
import '../effects/spatial-apertures.js';
import {WiseNativeVideo} from './native-video.jsx';
const api=globalThis.WiseSpatialApertures;
export const isDrawingFlash=ms=>api.isDrawingFlash(ms);
export const layoutSilhouettes=(items,options)=>api.layoutSilhouettes(items,options);
export function useSpatialState({effectId='diamond-aperture-release',variantId,speed=1}={}) {
  const frame=useCurrentFrame(),{fps}=useVideoConfig();
  return api.stateFor(variantId||effectId,frame/fps*1000*speed);
}

/** Place outside picture Sequences: picture cuts must not restart the aperture. */
export function SpatialWindowClip({effectId='diamond-aperture-release',variantId,speed=1,children}) {
  const {width,height}=useVideoConfig();
  const id='wise-spatial-'+useId().replace(/[^a-zA-Z0-9_-]/g,'');
  const {shapes}=useSpatialState({effectId,variantId,speed});
  const scale=Math.min(width/1920,height/1080);
  return <AbsoluteFill style={{overflow:'hidden'}}><div style={{position:'absolute',width:1920,height:1080,
    left:(width-1920*scale)/2,top:(height-1080*scale)/2,transformOrigin:'0 0',transform:`scale(${scale})`}}>
    <svg width="0" height="0" style={{position:'absolute'}}><defs><clipPath id={id} clipPathUnits="userSpaceOnUse">
      {shapes.map((s,i)=>s.type==='circle'?<circle key={i} cx={s.cx} cy={s.cy} r={s.r}/>:
        <rect key={i} x={s.cx-s.width/2} y={s.cy-s.height/2} width={s.width} height={s.height} transform={`rotate(${s.angle} ${s.cx} ${s.cy})`}/>)}
    </clipPath></defs></svg>
    <AbsoluteFill style={{clipPath:`url(#${id})`,overflow:'hidden'}}>{children}</AbsoluteFill>
  </div></AbsoluteFill>;
}

/** Anchors/extents are measured AFTER display scaling and rotation; content is caller-owned. */
export function AlignedSilhouetteRow({items=api.formItems,margin=96,centerY=710,speed=1}) {
  const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),f=api.stateFor('aligned-silhouette',frame/fps*1000*speed).local;
  const layout=api.layoutSilhouettes(items,{margin,centerY,offsetY:api.formOffset(f)}),scale=Math.min(width/1920,height/1080);
  return <AbsoluteFill><div style={{position:'absolute',width:1920,height:1080,left:(width-1920*scale)/2,
    top:(height-1080*scale)/2,transformOrigin:'0 0',transform:`scale(${scale})`}}>
    {layout.map(item=><div key={item.id} style={{position:'absolute',left:item.left,top:item.top,width:item.width,
      height:item.width*item.sourceSize[1]/item.sourceSize[0],transform:`rotate(${item.angle}deg)`,
      transformOrigin:item.transformOriginPercent.map(n=>`${n}%`).join(' ')}}>
      {item.content??<Img src={staticFile('catalog/assets/mechanical-pulse/'+(item.src==='watch-front.png'?'watch-front.webp':'watch-angle.webp'))}
        style={{width:'100%',height:'100%',objectFit:'contain'}}/>}
    </div>)}
  </div></AbsoluteFill>;
}

export function WiseSpatialApertures({effectId='diamond-aperture-release',variantId,speed=1,...props}) {
  if(variantId==='aligned-silhouette')return <AbsoluteFill style={{background:'#101211'}}><AlignedSilhouetteRow speed={speed}/></AbsoluteFill>;
  return <WiseNativeVideo {...props} definition={props.definition?.source?.frame_cache?props.definition:
    api.definitionFor(effectId,variantId)} speed={speed}/>;
}
