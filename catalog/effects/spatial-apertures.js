/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function (global) {
  'use strict';
  const api=global.WiseSpatialApertures, F=global.MotionFactories=global.MotionFactories||{};
  const NS='http://www.w3.org/2000/svg';let serial=0;
  const svg=(doc,tag,attrs,parent)=>{const n=doc.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,String(v));parent.append(n);return n;};
  const picture=(doc,parent,outline=false,alternative=false)=>global.WiseMechanicalWindows.drawDisc(doc,parent,outline,alternative);
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
    const mode=definition.variant_id||definition.id,doc=root.ownerDocument,id='spatial-aperture-'+ ++serial;
    if(mode==='aligned-silhouette')return alignedRow(root);
    root.replaceChildren();
    const main=svg(doc,'svg',{viewBox:'0 0 1920 1080',width:640,height:360,'aria-hidden':'true'},root);
    main.classList.add('pattern-svg');main.style.cssText='width:100%;height:100%;display:block';
    const defs=svg(doc,'defs',{},main),clip=svg(doc,'clipPath',{id,clipPathUnits:'userSpaceOnUse'},defs);
    svg(doc,'rect',{width:1920,height:1080,fill:'var(--stage,#101211)'},main);
    const before=svg(doc,'g',{'data-layer':'before'},main),after=svg(doc,'g',{'data-layer':'after','clip-path':`url(#${id})`},main);
    svg(doc,'rect',{width:1920,height:1080,fill:'var(--card,#1d221b)'},before);
    svg(doc,'rect',{width:1920,height:1080,fill:'var(--card,#1d221b)'},after);
    const a=picture(doc,before),b=picture(doc,after,false,true);
    const drawing=mode==='full-frame-blueprint'?svg(doc,'g',{'data-layer':'drawing'},main):null;
    if(drawing){svg(doc,'rect',{width:1920,height:1080,fill:'#eeece3'},drawing);
      drawing.style.cssText='--ink:#5f665b;--accent:#777c6c';picture(doc,drawing,true);}
    const oldCopy=mode==='overlap-copy-handoff'?svg(doc,'text',{x:96,y:210,fill:'var(--ink,#eeeee5)','font-size':120,'font-family':'Oswald','data-copy':'old'},before):null;
    const newCopy=mode==='overlap-copy-handoff'?svg(doc,'text',{x:96,y:210,fill:'var(--ink,#eeeee5)','font-size':120,'font-family':'Oswald','data-copy':'new'},after):null;
    if(oldCopy)oldCopy.textContent='FORM.';if(newCopy)newCopy.textContent='IN MOTION.';
    let gone=false;
    const draw=ms=>{
      if(gone)return;
      const state=api.stateFor(mode,ms),f=state.frame,t=state.local;
      root.dataset.designFrame=String(f);root.dataset.windowPhrase=state.phrase;
      clip.replaceChildren();for(const s of state.shapes) {
        if(s.type==='circle')svg(doc,'circle',{cx:s.cx,cy:s.cy,r:s.r},clip);
        else svg(doc,'rect',{x:s.cx-s.width/2,y:s.cy-s.height/2,width:s.width,height:s.height,transform:`rotate(${s.angle} ${s.cx} ${s.cy})`},clip);
      }
      const overlap=mode==='paced-overlap'||mode==='overlap-copy-handoff',flash=mode==='full-frame-blueprint';
      const cuts=mode==='continuous-diagonal'?[180,220]:mode==='diamond-aperture-release'?[300,320]:[];
      const shot=cuts.filter(c=>f>=c).length;root.dataset.shot=String(shot);
      const incoming=overlap||shot===1;
      before.style.display=overlap||flash||!incoming?'block':'none';
      after.style.display=flash?'none':incoming?'block':'none';
      before.setAttribute('clip-path',overlap||flash?'none':`url(#${id})`);
      a.setAttribute('transform',`rotate(${(overlap?t:f)*.35} 960 540)`);
      b.setAttribute('transform',`rotate(${-(overlap?t:f)*.6} 960 540)`);
      if(flash)a.setAttribute('transform','rotate(0 960 540)');
      if(drawing)drawing.style.display=api.isDrawingFlash(ms)?'block':'none';
      if(oldCopy){oldCopy.style.opacity=String(state.outgoingCopy);newCopy.style.opacity=String(state.incomingCopy);
        newCopy.setAttribute('transform',`translate(0 ${api.tween(t,12,20,28,0,api.settle)})`);}
    };
    draw.ready=Promise.resolve();draw.destroy=preserve=>{gone=true;if(!preserve)root.replaceChildren();};draw(0);return draw;
  }
  function poster(root,definition) {
    const img=root.ownerDocument.createElement('img');img.alt='';img.draggable=false;
    img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain';
    let gone=false,resolve,reject;const ready=new Promise((ok,fail)=>{resolve=ok;reject=fail;});
    img.onload=()=>resolve();img.onerror=()=>reject(new Error('空间组合预览图加载失败'));
    img.src=definition.source.frame_cache.poster.replace(/^catalog\//,'');root.replaceChildren(img);
    if(img.complete&&img.naturalWidth)resolve();
    const draw=ms=>{if(!gone)root.dataset.nativeFrame=String(api.frameFor('spatial-mechanical-sequence',ms));};
    draw.ready=ready;draw.destroy=preserve=>{gone=true;resolve();img.onload=null;img.onerror=null;if(!preserve)root.replaceChildren();};draw(0);return draw;
  }
  F['diamond-aperture-release']=(root,_kit,definition)=>make(root,{...definition,id:'diamond-aperture-release'});
  F['spatial-mechanical-sequence']=(root,_kit,definition)=>poster(root,definition||api.sequence);
  F['spatial-mechanical-sequence'].requiresPreparation=true;
  F['spatial-mechanical-sequence'].breakdown=api.breakdown;
  api.make=make;
})(globalThis);
