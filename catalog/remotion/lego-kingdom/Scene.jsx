// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React from 'react';
import {BuildAction, BUILD_SPECS} from './BuildActions.jsx';
import {FinaleAction, FINALE_SPECS} from './FinaleActions.jsx';
import {AmbientAction, AMBIENT_SPECS} from './AmbientActions.jsx';
import {C,F} from './theme.js';

// Existing mechanisms receive another example rather than a synonymous entry.
export const REUSED_MODES = Object.freeze({
  'brick-wipe': {id:'tile-wave-transition', variantId:'lego-kingdom'},
  'matrix-scan': {id:'stagger-drop', variantId:'lego-kingdom'},
  'efficiency-grid': {id:'stagger-in', variantId:'lego-kingdom-grid'},
  'file-editor-send': {id:'interface-feedback', variantId:'lego-kingdom-file'},
  'cursor-trail': {id:'follow', variantId:'lego-kingdom'},
  'tracked-labels': {id:'leader-callout', variantId:'lego-kingdom'},
  'path-packets': {id:'mindmap-follow', variantId:'lego-kingdom'},
  'verdict-checklist': {id:'progress-readout', variantId:'lego-kingdom'},
});
const groups = [[BuildAction,BUILD_SPECS],[FinaleAction,FINALE_SPECS],[AmbientAction,AMBIENT_SPECS]];
const rawSpecs = groups.flatMap(([Component,specs]) => Object.entries(specs).map(([mode,spec]) =>
  ({...spec, mode, Component, ...(REUSED_MODES[mode] ? {exportId:REUSED_MODES[mode].id,variantId:REUSED_MODES[mode].variantId} : {exportId:spec.id})})));
const aliases=new Map(rawSpecs.map(spec=>[spec.id,spec]));
export const LEGO_SPECS = Object.freeze(rawSpecs.map(spec=>{
  const map=id=>aliases.get(id)?.exportId||id;
  const actions=spec.kind==='composition'?(spec.actions||[]).map(map):[];
  const actionVariants=Object.fromEntries((spec.actions||[]).flatMap(id=>{
    const item=aliases.get(id);return item?.variantId?[[item.exportId,item.variantId]]:[];
  }));
  return {...spec,actions,actionVariants,layers:(spec.layers||[]).map(layer=>({...layer,actions:(layer.actions||[]).map(map)}))};
}));
export function resolveMotion(effectId,variantId) {
  const spec=LEGO_SPECS.find(item=>item.exportId===effectId && item.variantId===variantId);
  if(!spec)throw new Error('未知乐高视频动作：'+effectId+'/'+(variantId||''));
  return spec;
}
export function sourceFrame(spec,seconds) {
  if(!Number.isFinite(seconds))throw new TypeError('动作时间必须是有限秒数');
  return Math.max(0,Math.min(spec.frames-1,Math.floor(seconds*30+1e-7)));
}
export function LegoScene({effectId,variantId,frame,children,resolveAsset,ImageComponent}) {
  const spec=resolveMotion(effectId,variantId),Component=spec.Component;
  if(!Number.isFinite(frame))throw new TypeError('动作帧必须是有限数字');
  const sampled=Math.max(0,Math.min(spec.frames-1,Math.floor(frame+1e-7)));
  return <div data-lego-mode={spec.mode} data-source-frame={sampled}
    style={{position:'absolute',width:1080,height:1440,inset:0,overflow:'hidden',background:C.paper,color:C.ink,fontFamily:F.cn,fontWeight:400,lineHeight:'normal',fontSynthesisWeight:'none',fontFeatureSettings:'normal',WebkitFontSmoothing:'antialiased'}}>
    <style>{'[data-lego-mode], [data-lego-mode] * { box-sizing: border-box; }'}</style>
    <Component mode={spec.mode} frame={sampled} resolveAsset={resolveAsset} ImageComponent={ImageComponent}>{children}</Component>
  </div>;
}
