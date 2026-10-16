/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function (global) {
  'use strict';
  const F = global.MotionFactories = global.MotionFactories || {};
  const api = global.WiseMechanicalWindows;
  const NS = 'http://www.w3.org/2000/svg';
  let serial = 0;
  const set = (node, name, value) => node.setAttribute(name, String(value));
  const svg = (document, tag, attrs, parent) => {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) set(node, key, value);
    parent.append(node); return node;
  };
  function disc(document, parent, outline = false, alternative = false) {
    const group = svg(document, 'g', {'data-disc': outline ? 'drawing' : 'solid'}, parent);
    const ink = 'var(--ink,#eeeee5)', accent = 'var(--accent,#bba67b)';
    svg(document, 'circle', {cx: 960, cy: 540, r: 355, fill: outline ? 'none' : 'var(--card,#1d221b)', stroke: ink, 'stroke-width': 5}, group);
    svg(document, 'circle', {cx: 960, cy: 540, r: 302, fill: 'none', stroke: accent, 'stroke-width': 3}, group);
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6;
      svg(document, 'line', {x1: 960 + Math.cos(angle) * 317, y1: 540 + Math.sin(angle) * 317,
        x2: 960 + Math.cos(angle) * 340, y2: 540 + Math.sin(angle) * 340, stroke: ink, 'stroke-width': 6}, group);
    }
    const positions = alternative ? [[840,490,110],[1090,590,145],[1000,340,70]] : [[820,470,140],[1110,470,125],[990,690,90]];
    for (const [cx, cy, r] of positions) {
      const gear = svg(document, 'g', {}, group);
      for (let i = 0; i < 18; i++) svg(document, 'rect', {x: cx-9, y: cy-r-12, width: 18, height: 30,
        fill: outline ? 'none' : accent, stroke: accent, 'stroke-width': 2, transform: `rotate(${i*20} ${cx} ${cy})`}, gear);
      svg(document, 'circle', {cx, cy, r: r-7, fill: outline ? 'none' : 'var(--stage,#101211)', stroke: accent, 'stroke-width': 4}, gear);
      svg(document, 'circle', {cx, cy, r: r*.35, fill: 'none', stroke: ink, 'stroke-width': 4}, gear);
      svg(document, 'circle', {cx, cy, r: 12, fill: ink}, gear);
    }
    svg(document, 'path', {d: 'M570 540H1350M960 150V930', fill: 'none', stroke: ink, 'stroke-width': 2, opacity: outline ? .6 : .18}, group);
    return group;
  }
  function poster(root, definition) {
    const image = root.ownerDocument.createElement('img');
    image.alt = ''; image.draggable = false;
    image.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain';
    let gone = false, resolve, reject;
    const ready = new Promise((ok, fail) => {resolve=ok;reject=fail;});
    const loaded = () => {if (!gone) resolve();};
    const failed = () => {if (!gone) reject(new Error('窗口组合预览图加载失败'));};
    image.addEventListener('load', loaded); image.addEventListener('error', failed);
    image.src = definition.source.frame_cache.poster.replace(/^catalog\//, '');
    root.replaceChildren(image);
    if (image.complete && image.naturalWidth) loaded();
    const draw = ms => {if (!gone) root.dataset.nativeFrame = String(api.frameFor('mechanical-window-sequence', ms));};
    draw.ready = ready;
    draw.destroy = preserve => {gone=true;resolve();image.removeEventListener('load',loaded);image.removeEventListener('error',failed);if(!preserve)root.replaceChildren();};
    draw(0); return draw;
  }
  function make(root, definition) {
    const mode = definition.variant_id === 'offset-aperture' ? 'offset-aperture' :
      definition.variant_id === 'registered-drawing' ? 'registered-drawing' : definition.id;
    const document = root.ownerDocument, id = 'mechanical-aperture-' + ++serial;
    root.replaceChildren();
    const main = svg(document, 'svg', {viewBox:'0 0 1920 1080',width:640,height:360,'aria-hidden':'true'}, root);
    main.classList.add('pattern-svg'); main.style.cssText='width:100%;height:100%;display:block';
    svg(document,'rect',{width:1920,height:1080,fill:'var(--stage,#101211)'},main);
    const defs=svg(document,'defs',{},main), clip=svg(document,'clipPath',{id,clipPathUnits:'userSpaceOnUse'},defs);
    const before=svg(document,'g',{'data-picture':'before'},main);
    const after=svg(document,'g',{'data-picture':'after'},main);
    const drawing=svg(document,'g',{'data-picture':'drawing'},main);
    drawing.style.cssText='--ink:#5f665b;--accent:#777c6c';
    svg(document,'rect',{width:1920,height:1080,fill:'#eeeee5'},drawing);
    svg(document,'rect',{width:1920,height:1080,fill:'var(--card,#1d221b)'},after);
    const a=disc(document,before), b=disc(document,after,false,true), line=disc(document,drawing,true);
    let gone=false;
    const draw=ms=>{
      if(gone)return;
      const state=api.stateFor(mode,ms), frame=state.frame;
      root.dataset.designFrame=String(frame);
      root.dataset.windowPhrase=state.phrase;
      const shapes=state.shapes;
      clip.replaceChildren();
      for(const shape of shapes){
        if(shape.type==='circle')svg(document,'circle',{cx:shape.cx,cy:shape.cy,r:shape.r},clip);
        else svg(document,'rect',{x:shape.cx-shape.width/2,y:shape.cy-shape.height/2,width:shape.width,height:shape.height,
          transform:`rotate(${shape.angle} ${shape.cx} ${shape.cy})`},clip);
      }
      const preentry=mode==='next-shot-preentry', flash=mode==='registered-drawing';
      const picture=frame<400?'before':frame<560?'after':frame<600?'before':frame<660?'after':frame<788?'before':frame<880?'after':'before';
      before.style.display=preentry||flash||picture==='before'?'block':'none';
      after.style.display=preentry||!flash&&picture==='after'?'block':'none';
      before.setAttribute('clip-path',preentry||flash?'none':`url(#${id})`);
      after.setAttribute('clip-path',flash?'none':`url(#${id})`);
      // Both layers derive from the current frame: the foreground never freezes the background.
      a.setAttribute('transform',preentry?`rotate(${(frame-788)*.35} 960 540)`:mode==='offset-aperture'?'translate(-530 -10)':'rotate(0 960 540)');
      b.setAttribute('transform',preentry?`rotate(${-(frame-788)*.6} 960 540)`:'rotate(0 960 540)');
      drawing.style.display=flash&&api.DRAWING_FLASHES.some(([start,end])=>frame>=start&&frame<end)?'block':'none';
      line.setAttribute('transform','rotate(0 960 540)');
      root.dataset.picture=preentry?'two-live-layers':picture;
    };
    draw.destroy=preserve=>{gone=true;if(!preserve)root.replaceChildren();};
    draw(0);return draw;
  }
  for(const id of ['cross-aperture-turn','rect-aperture-breathe','three-column-aperture','next-shot-preentry'])
    F[id]=(root,_kit,definition={})=>['continuous-diagonal','vertical-column-rise','paced-overlap'].includes(definition.variant_id)
      ?global.WiseSpatialApertures.make(root,{...definition,id}):make(root,{...definition,id});
  F['mechanical-window-sequence']=(root,_kit,definition)=>poster(root,definition||api.sequence);
  F['mechanical-window-sequence'].requiresPreparation=true;
  F['mechanical-window-sequence'].breakdown=api.breakdown;
  api.make=make;
  api.drawDisc=disc;
})(globalThis);
