/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function (global) {
  'use strict';
  const api=global.WiseSpatialApertures, F=global.MotionFactories=global.MotionFactories||{};
  const NS='http://www.w3.org/2000/svg';
  const svg=(doc,tag,attrs,parent)=>{const n=doc.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));parent.append(n);return n;};
  function alignedRow(root) {
    const doc=root.ownerDocument;root.replaceChildren();
    const main=svg(doc,'svg',{viewBox:'0 0 1920 1080',width:640,height:360,'aria-hidden':'true'},root);
    main.classList.add('pattern-svg');main.style.cssText='width:100%;height:100%;display:block';
    const images=api.formItems.map(item=>svg(doc,'image',{href:'assets/mechanical-pulse/'+(item.src==='watch-front.png'?'watch-front.webp':'watch-angle.webp'),
      width:item.width,height:item.width*item.sourceSize[1]/item.sourceSize[0],preserveAspectRatio:'xMidYMid meet','data-silhouette':item.id},main));
    const loads=['watch-front.webp','watch-angle.webp'].map(file=>{
      const img=doc.createElement('img');let resolve,reject;const promise=new Promise((ok,fail)=>{resolve=ok;reject=fail;});
      img.onload=()=>resolve();img.onerror=()=>reject(new Error('三联主体素材加载失败'));img.src='assets/mechanical-pulse/'+file;
      if(img.complete&&img.naturalWidth)resolve();
      return {promise,cancel:()=>{resolve();img.onload=null;img.onerror=null;img.removeAttribute('src');}};
    });
    let gone=false;const draw=ms=>{
      if(gone)return;const state=api.stateFor('aligned-silhouette',ms);
      root.dataset.designFrame=String(state.frame);root.dataset.windowPhrase='aligned-silhouette';
      api.getAlignedFormLayout(api.formOffset(state.local)).forEach((item,i)=>{
        images[i].setAttribute('x',String(item.left));images[i].setAttribute('y',String(item.top));
        images[i].setAttribute('transform',`rotate(${item.angle} ${item.centerX} ${item.centerY})`);
      });
    };
    draw.ready=Promise.all(loads.map(x=>x.promise));
    draw.destroy=preserve=>{gone=true;loads.forEach(x=>x.cancel());if(!preserve)root.replaceChildren();};draw(0);return draw;
  }
  function make(root,definition) {
    if(definition.variant_id==='aligned-silhouette')return alignedRow(root);
    return poster(root,definition.source?.frame_cache?definition:api.definitionFor(definition.id,definition.variant_id));
  }
  function poster(root,definition) {
    const img=root.ownerDocument.createElement('img');img.alt='';img.draggable=false;
    img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain';
    let gone=false,resolve,reject;const ready=new Promise((ok,fail)=>{resolve=ok;reject=fail;});
    img.onload=()=>resolve();img.onerror=()=>reject(new Error('手表动作预览图加载失败'));
    img.src=definition.source.frame_cache.poster.replace(/^catalog\//,'');root.replaceChildren(img);
    if(img.complete&&img.naturalWidth)resolve();
    const draw=ms=>{if(!gone)root.dataset.nativeFrame=String(api.frameFor(definition.variant_id&&definition.variant_id!=='standard'?definition.variant_id:definition.id,ms));};
    draw.ready=ready;draw.destroy=preserve=>{gone=true;resolve();img.onload=null;img.onerror=null;if(!preserve)root.replaceChildren();};draw(0);return draw;
  }
  F['diamond-aperture-release']=(root,_kit,definition)=>make(root,{...definition,id:'diamond-aperture-release'});
  F['spatial-mechanical-sequence']=(root,_kit,definition)=>make(root,definition||api.sequence);
  F['spatial-mechanical-sequence'].requiresPreparation=true;
  F['spatial-mechanical-sequence'].breakdown=api.breakdown;
  api.make=make;
})(globalThis);
