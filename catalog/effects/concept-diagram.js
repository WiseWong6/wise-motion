/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function(F){
  'use strict';
  const clamp=p=>Math.max(0,Math.min(1,p));
  const enter=(t,at,d)=>{const p=clamp((t-at)/d);return p*p*(3-2*p);};
  const mix=(a,b,p)=>a+(b-a)*p,loop=p=>((p%1)+1)%1;
  // 成片视觉时钟，覆盖同一历史条目的两个图解案例；省去切页前压成一帧的空白句。
  const start=149.3+.55/1.4*(4/3),end=162.3;
  const beats=[[start,12.55],[150+19/30,13.4],[154.1,17],[156.2,19],[158+13/30,21.8],[end,25]];
  function sourceTime(ms){
    const p=Math.min(end,start+Math.max(0,ms-150)/1000);
    for(let i=1;i<beats.length;i++)if(p<=beats[i][0]){
      const [a,x]=beats[i-1],[b,y]=beats[i];return mix(x,y,(p-a)/(b-a));
    }
    return 25;
  }
  const point=(x,y,r,a)=>[x+Math.cos(a)*r,y+Math.sin(a)*r];
  const arc=(x,y,r,a,b)=>`M${point(x,y,r,a)}A${r} ${r} 0 ${b-a>Math.PI?1:0} 1 ${point(x,y,r,b)}`;
  F['concept-diagram']=(root,K)=>{
    const path=(id,color='teal',width=2,extra='')=>`<path data-part="${id}" fill="none" stroke="var(--${color})" stroke-width="${width}" ${extra}/>`;
    const dot=(id,r,color='teal',opacity=1)=>`<circle data-part="${id}" r="${r}" fill="var(--${color})" opacity="${opacity}"/>`;
    const arrow=id=>`<g data-part="${id}">${path(id+'-line','teal',3,'stroke-linecap="round"')}${path(id+'-head','teal',3,'stroke-linecap="round"')}</g>`;
    const text=(value,x,y,role,scale,color='ink',weight=K.type[role]>=K.type.title?700:300)=>`<text x="${x}" y="${y}" dominant-baseline="hanging" text-anchor="middle" font-size="${K.textSize(role,scale)}" font-weight="${weight}" fill="var(--${color})">${value}</text>`;
    root.innerHTML='<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true">'+
      '<g data-part="definition" transform="translate(136.4 -75) scale(.34)">'+
      ['方向','流动','压缩'].map((label,i)=>{const x=240+i*300;return `<g data-part="step${i}">`+
        text('0'+(i+1),x,300,'caption',.34,'accent',700)+text(label,x,350,'body',.34)+
        text(['多个方向','持续流动','向内收束'][i],x,410,'caption',.34,'muted')+'</g>'+(i<2?arrow('step-arrow'+i):'');}).join('')+
      '<circle data-part="outer" cx="540" cy="760" fill="none" stroke="var(--ink)" stroke-opacity=".28" stroke-width="2" stroke-dasharray="12 15"/>'+
      Array.from({length:6},(_,i)=>path('def-spin'+i,i===2?'accent':'teal',2+i*.3,`opacity="${.28+.13*i}"`)+dot('def-dot'+i,4+i*.45,i===2?'accent':'teal',.75)).join('')+
      Array.from({length:5},(_,i)=>arrow('inward'+i)+dot('inward-dot'+i,5)).join('')+
      '<g data-part="def-flow" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-dasharray="15 12">'+Array.from({length:5},(_,i)=>`<path data-part="def-flow${i}"/>`).join('')+'</g>'+
      '<circle data-part="def-core" cx="540" cy="760" fill="var(--card)" opacity=".9"/><circle data-part="def-pulse" cx="540" cy="760" fill="var(--accent)" opacity=".85"/>'+
      '<g data-part="conclusion">'+text('形成高旋转密度的',540,1053,'body',.34,'muted')+text('查克拉球',540,1130,'title',.34,'accent')+'</g></g>'+
      '<g data-part="concept" transform="translate(50 -208) scale(.5)">'+
      '<g data-part="breath"><circle data-part="concept-shell" fill="none" stroke="var(--card-edge)" stroke-width="2"/><circle data-part="concept-core" fill="var(--card)"/></g>'+
      Array.from({length:4},(_,i)=>path('concept-spin'+i,i===1?'accent':'teal',2.2,`opacity="${.32+.12*i}"`)+dot('concept-dot'+i,5,'teal',.75)).join('')+
      Array.from({length:3},(_,i)=>arrow('outward'+i)).join('')+
      '<g data-part="rotation">'+path('rotation-arc','ink',4,'stroke-linecap="round"')+path('rotation-head','ink',4,'stroke-linecap="round"')+'</g>'+
      Array.from({length:3},(_,i)=>dot('outward-dot'+i,5,'accent')).join('')+
      '<g data-part="concept-flow" fill="none" stroke="var(--accent)" stroke-width="2.3" stroke-dasharray="13 12">'+Array.from({length:5},(_,i)=>`<path data-part="concept-flow${i}"/>`).join('')+'</g>'+
      ['方向','旋转','流动 · 变大'].map((label,i)=>`<g data-part="concept-label${i}">${text(label,250+i*290,535,'body',.5,'muted')}</g>`).join('')+'</g></svg>';
    const nodes=new Map([...root.querySelectorAll('[data-part]')].map(n=>[n.dataset.part,n]));
    const set=(id,attrs)=>{const node=nodes.get(id);for(const [key,value]of Object.entries(attrs))if(node.getAttribute(key)!==String(value))node.setAttribute(key,String(value));};
    const circle=(id,x,y)=>set(id,{cx:x,cy:y});
    function drawArrow(id,x1,y1,x2,y2,p,alpha=1){
      const x=mix(x1,x2,p),y=mix(y1,y2,p),a=Math.atan2(y2-y1,x2-x1);
      set(id,{opacity:p>0?alpha:0});set(id+'-line',{d:`M${x1} ${y1}L${x} ${y}`});
      set(id+'-head',{opacity:p>.92?1:0,d:`M${x-13*Math.cos(a-.42)} ${y-13*Math.sin(a-.42)}L${x} ${y}L${x-13*Math.cos(a+.42)} ${y-13*Math.sin(a+.42)}`});
    }
    function definition(t){
      const direction=enter(t,13.4,.7),flow=enter(t,14.15,.8),compression=enter(t,15.15,1.05),dense=enter(t,17,.75);
      set('definition',{opacity:enter(t,12.55,.55)});
      [direction,flow,compression].forEach((p,i)=>{set('step'+i,{opacity:p});if(i<2)drawArrow('step-arrow'+i,330+i*300,372,450+i*300,372,p,p*.85);});
      const outer=mix(240,154,compression),inner=mix(84,122,dense);
      set('outer',{r:outer,'stroke-dashoffset':-t*58});
      for(let i=0;i<6;i++){
        const a=t*1.7+i*Math.PI/3,r=inner+i*7;
        set('def-spin'+i,{d:arc(540,760,r,a,a+Math.PI*(.55+.12*i))});circle('def-dot'+i,...point(540,760,r,a));
      }
      [-2.42,-1.58,-.72,0,.72].forEach((a,i)=>{
        const x1=540+Math.cos(a)*330,y1=760+Math.sin(a)*285,[x2,y2]=point(540,760,outer,a);
        drawArrow('inward'+i,x1,y1,x2,y2,direction);
        const q=loop((t-13.4)*(.45+i*.05)+i*.24);
        set('inward-dot'+i,{cx:mix(x1,x2,q),cy:mix(y1,y2,q),opacity:direction});
      });
      set('def-flow',{opacity:flow,'stroke-dashoffset':-t*72});
      for(let i=-2;i<=2;i++){const y=760+i*38;set('def-flow'+(i+2),{d:`M160 ${y+55*Math.sin(t+i)}C285 ${y-95} 370 ${y+70} ${540-outer*.65} ${y}`});}
      set('def-core',{r:inner*.55});set('def-pulse',{r:12+5*Math.sin(t*3.2)});set('conclusion',{opacity:dense});
    }
    function concept(t){
      const direction=enter(t,22.15,.42),rotation=enter(t,23.05,.42),flow=enter(t,24,.42);
      set('concept',{opacity:enter(t,19,.55)});set('breath',{transform:`translate(540 790) scale(${1+.035*Math.sin(t*5.4)})`});
      set('concept-shell',{r:75+42*flow});set('concept-core',{r:45+31*flow});
      for(let i=0;i<4;i++){
        const a=t*1.35+i*Math.PI/2,r=110+i*11;
        set('concept-spin'+i,{d:arc(540,790,r,a,a+Math.PI*.72)});circle('concept-dot'+i,...point(540,790,r,a));
      }
      [-.72,0,.72].forEach((a,i)=>{
        const [x1,y1]=point(540,790,55,a),[x2,y2]=point(540,790,205,a);
        // 原作只是减弱 35%，箭头仍然存在；并非完全退场。
        drawArrow('outward'+i,x1,y1,x2,y2,direction,1-flow*.35);
        const q=loop((t-22.15)*.46+i*.27);
        set('outward-dot'+i,{cx:mix(x1,x2,q),cy:mix(y1,y2,q),opacity:direction*(1-flow*.35)});
      });
      const spin=(t-23.05)*1.55,a=spin-.2,b=spin+Math.PI*1.45*rotation,[x,y]=point(540,790,155,b);
      set('rotation',{opacity:rotation});set('rotation-arc',{d:arc(540,790,155,a,b)});
      set('rotation-head',{d:'M-12 -15L0 0L12 -15',transform:`translate(${x} ${y}) rotate(${(b+Math.PI/2)*180/Math.PI})`});
      set('concept-flow',{opacity:flow,'stroke-dashoffset':-t*65});
      for(let i=-2;i<=2;i++){const y=790+i*35;set('concept-flow'+(i+2),{d:`M190 ${y}C325 ${y-80*Math.sin(t+i)} 400 ${y+50*i} 465 ${y}`});}
      [direction,rotation,flow].forEach((p,i)=>set('concept-label'+i,{opacity:p}));
    }
    return ms=>{
      const t=sourceTime(ms);
      set('definition',{display:t<19?'inline':'none'});set('concept',{display:t<19?'none':'inline'});
      // 隐藏组也采用确定的终点或起点，回拖不依赖上一帧。
      definition(Math.min(t,19));concept(Math.max(t,19));
    };
  };
})(globalThis.MotionFactories);
