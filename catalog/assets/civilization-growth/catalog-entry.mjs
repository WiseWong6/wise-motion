/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
import {loadAssets,paintEffect,definitionFor,sequenceId,segments} from './engine.mjs';
function create(root,kit,definition={}){
 const id=definition.id,segment=definitionFor(id),doc=root.ownerDocument;
 const host=doc.createElement('div');host.dataset.art='original';host.style.cssText='position:absolute;inset:0;background:#e2e3dd';root.append(host);
 const layers=segment?[]:segments.map(item=>{const layer=doc.createElement('div');layer.dataset.layer=item.id;layer.style.cssText='position:absolute;inset:0';host.append(layer);return layer;});
 const canvas=doc.createElement('canvas');canvas.width=1920;canvas.height=1080;canvas.style.cssText='width:100%;height:100%;display:block';(layers[0]||host).append(canvas);
 let ctx=canvas.getContext('2d'),dead=false,assets=null,latest=definition.poster_only?definition.poster_time_ms||0:0;
 const limit=segment?segment.end-segment.start:18600;
 function draw(){
  host.dataset.time=String(latest);
  if(layers.length){const index=segments.findIndex((s,i)=>latest<s.end||i===segments.length-1);if(canvas.parentNode!==layers[index])layers[index].append(canvas);}
  if(ctx&&assets)paintEffect(ctx,assets,id,latest);
 }
 const render=ms=>{if(dead)return;if(!Number.isFinite(ms))throw new TypeError('定位时间必须为有限数字');latest=Math.max(0,Math.min(limit,ms));draw();};
 render.frameRate=60;
 if(ctx){
  host.dataset.renderState='preparing';
  render.ready=loadAssets().then(value=>{if(dead)return;assets=value;draw();host.dataset.renderState='ready';}).catch(error=>{if(!dead){host.dataset.renderState='error';throw error;}});
 }else host.dataset.renderState='canvas-unavailable';
 render.destroy=preserve=>{if(dead)return;dead=true;assets=null;ctx=null;if(!preserve)canvas.width=canvas.height=0;};
 draw();return render;
}
const factories=globalThis.MotionFactories=globalThis.MotionFactories||{};
for(const id of [sequenceId,...segments.map(s=>s.id)]){
 const factory=(root,kit,definition={})=>create(root,kit,{...definition,id});factory.requiresPreparation=true;
 if(id===sequenceId)factory.breakdown=segments.map(s=>({id:s.id,name:s.name,detail:s.detail,start:s.start,end:s.end,time:`${s.start/1000}–${s.end/1000} 秒`,actions:[s.id]}));
 factories[id]=factory;
}
