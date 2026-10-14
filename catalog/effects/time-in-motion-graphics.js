/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function (global) {
  'use strict';
  const F = global.MotionFactories = global.MotionFactories || {};
  const clamp = x => Math.max(0, Math.min(1, x));
  function ease(x) {
    x = clamp(x); let a = 0, b = 1;
    // Original entry curve: cubic-bezier(.16,1,.3,1).
    for (let i = 0; i < 28; i++) {
      const t = (a + b) / 2, v = 3 * (1-t)**2*t*.16 + 3*(1-t)*t*t*.3 + t**3;
      if (v < x) a = t; else b = t;
    }
    return 1 - (1 - (a+b)/2)**3;
  }
  function wordState(frame) {
    if (!Number.isFinite(frame)) throw new TypeError('帧必须为有限数字');
    return [0, 6].map(start => ({y: 112 * (1 - ease((frame-start)/14)), visible: frame >= start}));
  }
  function dialState(frame) {
    if (!Number.isFinite(frame)) throw new TypeError('帧必须为有限数字');
    const local = Math.max(0, frame), enter = .85 * 24, open = ease(local/enter);
    const pulse = [0, 12, 24, 36].reduce((value, beat) => {
      const d = local-beat, p = d < 0 ? 0 : d < 1.8 ? d/1.8 : clamp((10.08-d)/8.28);
      return Math.max(value, p);
    }, 0);
    const angle = -18 + Math.min(95, local)/24 * 18;
    return {open, pulse, angle, innerAngle: -angle*.52, scale: .97+.03*open+.007*pulse,
      outerArc: ease((local-enter*.18)/(enter*.82)), innerArc: ease((local-enter*.4)/(enter*.6)),
      dot: ease((local-enter*.82)/(enter*.18)), ticks: Array.from({length:48},(_,i)=>clamp((open*53-i)/5))};
  }
  function board(root) {
    const d = root.ownerDocument, node = d.createElement('div');
    node.style.cssText='position:absolute;inset:0;background:#101114;color:#e9e6de;overflow:hidden';
    root.replaceChildren(node); return node;
  }
  function word(root) {
    const node=board(root), words=['EVERY','PART.'];
    const glyphs=words.map((text,i)=>{
      const clip=node.ownerDocument.createElement('div'), glyph=node.ownerDocument.createElement('span');
      clip.style.cssText='position:absolute;left:32px;top:'+(122+i*54)+'px;overflow:hidden;padding-block:.06em;margin-block:-.06em;font:700 51.33px/.98 Oswald,sans-serif;letter-spacing:-.055em';
      glyph.textContent=text;glyph.style.display='block';clip.append(glyph);node.append(clip);return glyph;
    });
    let gone=false;
    const draw=ms=>{if(gone)return;wordState(ms*24/1000).forEach((state,i)=>{
      glyphs[i].style.transform='translateY('+state.y+'%)';glyphs[i].style.visibility=state.visible?'visible':'hidden';
    });};
    draw.destroy=()=>{gone=true;};draw(0);return draw;
  }
  const point=(r,a)=>{const v=a*Math.PI/180;return [500+Math.cos(v)*r,500+Math.sin(v)*r];};
  const arc=(r,a,span)=>{const p=point(r,a),q=point(r,a+span);return 'M '+p.join(' ')+' A '+r+' '+r+' 0 '+(span>180?1:0)+' 1 '+q.join(' ');};
  function dial(root) {
    const host=board(root), d=root.ownerDocument;
    const svg=(tag,attrs,parent)=>{const n=d.createElementNS('http://www.w3.org/2000/svg',tag);
      for(const [key,value]of Object.entries(attrs))n.setAttribute(key,value);(parent||host).append(n);return n;};
    const main=svg('svg',{viewBox:'0 0 1000 1000',fill:'none',width:280,height:280});
    main.style.cssText='position:absolute;left:180px;top:40px;overflow:visible';
    svg('circle',{cx:500,cy:500,r:388,stroke:'#8e816a','stroke-width':1.3,opacity:.26},main);
    const outer=svg('g',{},main),inner=svg('g',{},main);
    const ticks=Array.from({length:48},(_,i)=>{const major=i%4===0,p=point(major?438:451,-90+i*7.5),q=point(466,-90+i*7.5);
      return svg('line',{x1:p[0],y1:p[1],x2:q[0],y2:q[1],stroke:major?'#d4b57a':'#8e816a','stroke-width':major?2.6:1.4},outer);});
    const a=svg('path',{d:arc(418,205,214),pathLength:1,stroke:'#d4b57a','stroke-width':2.5,'stroke-linecap':'round','stroke-dasharray':1},outer);
    const b=svg('path',{d:arc(351,-70,92),pathLength:1,stroke:'#efe8db','stroke-width':1.9,'stroke-linecap':'round','stroke-dasharray':1},inner);
    const p=point(351,22),dot=svg('circle',{cx:p[0],cy:p[1],r:3.2,fill:'#efe8db'},inner);
    let gone=false;
    const draw=ms=>{if(gone)return;const s=dialState(ms*24/1000);
      main.style.opacity=s.open;main.style.transform='scale('+s.scale+')';
      outer.setAttribute('transform','rotate('+s.angle+' 500 500)');inner.setAttribute('transform','rotate('+s.innerAngle+' 500 500)');
      ticks.forEach((n,i)=>n.setAttribute('opacity',s.ticks[i]*(i%4===0?.88:.3)));
      a.setAttribute('stroke-dashoffset',1-s.outerArc);a.setAttribute('stroke-width',2*(1.25+s.pulse*.25));
      b.setAttribute('stroke-dashoffset',1-s.innerArc);b.setAttribute('opacity',.62+s.pulse*.2);dot.setAttribute('opacity',s.dot);
    };draw.destroy=()=>{gone=true;};draw(0);return draw;
  }
  F['word-block-rise']=word;
  F['sparse-dial-counterturn']=dial;
  global.WiseTimeInMotionGraphics=Object.freeze({wordState,dialState});
})(globalThis);
