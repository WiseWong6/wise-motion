/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function(global){
'use strict';
const F=global.MotionFactories=global.MotionFactories||{};let serial=0;
const clamp=p=>Math.max(0,Math.min(1,p)),part=(t,a,b)=>clamp((t-a)/(b-a)),mix=(a,b,p)=>a+(b-a)*p;
const out=p=>1-(1-p)**3,back=p=>1+2.70158*(p-1)**3+1.70158*(p-1)**2;
const size=(role,scale=1)=>global.MotionKit.textSize(role,scale);
const list=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join('');
function scene(root,html){
  const ns='data-comparison-'+(++serial);
  root.innerHTML=`<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true">${html.replaceAll('NS',ns)}</svg>`;
  const nodes=new Map([...root.querySelectorAll('[data-part]')].map(n=>[n.dataset.part,n]));
  return (id,attrs={},text)=>{const n=nodes.get(id);for(const [k,v]of Object.entries(attrs))if(n.getAttribute(k)!==String(v))n.setAttribute(k,String(v));if(text!==undefined&&n.textContent!==String(text))n.textContent=String(text);return n;};
}
// 柱高与读数同步平缓起落；第二组在第一组收尾时起步，以短暂交叠接续。
F['narrated-count']=(root,K,def)=>{
  const items=[{x:260,y:808,h:240,value:60,at:0,duration:640,color:'var(--muted)',label:'优化前'},
    {x:650,y:736,h:312,value:78,at:500,duration:700,color:'var(--blue)',label:'优化后'}];
  const s=scene(root,`<g transform="translate(50 -252.5) scale(.5)">
    <text x="540" y="600" text-anchor="middle" fill="var(--ink)" font-size="${size('title',.5)}" font-weight="700">注册完成率</text>
    <path d="M210 1048H870" fill="none" stroke="var(--muted)" stroke-width="2" opacity=".5"/>
    ${items.map((v,i)=>`<rect data-part="bar${i}" x="${v.x}" y="1048" width="170" height="0" rx="5" fill="${v.color}"/>
      <text data-part="value${i}" x="${v.x+85}" y="1022" text-anchor="middle" fill="${v.color}" font-size="${size('subhead',.5)}" font-weight="700">0%</text>
      <text x="${v.x+85}" y="1105" text-anchor="middle" fill="var(--muted)" font-size="${size('body',.5)}" font-weight="300">${v.label}</text>`).join('')}
  </g>`);
  return t=>items.forEach((v,i)=>{const q=K.ease(part(t,v.at,v.at+v.duration),'inOutSine');s('bar'+i,{y:1048-v.h*q,height:v.h*q});s('value'+i,{y:1022-v.h*q},Math.round(v.value*q)+'%');});
};
function bezier(a,b,u){const m=1-u;return 3*m*m*u*a+3*m*u*u*b+u*u*u;}
function atX(x,a,b,snapEndpoints=true){if(snapEndpoints&&(x===0||x===1))return x;let lo=0,hi=1;for(let i=0;i<22;i++){const mid=(lo+hi)/2;if(bezier(a[0],b[0],mid)<x)lo=mid;else hi=mid;}return bezier(a[1],b[1],(lo+hi)/2);}
// 原横版 drawComp / drawGraph 共用时钟，图形分别等比缩放；案例为原片 23–27.25 秒。
F['motion-compare']=(root,K,def)=>{
  const start=290,length=700,ys=[340,384],G={x:1190,y:330,w:550,h:310};
  const s=scene(root,`<g data-part="tracks" transform="translate(-52 35.2) scale(.4)">${ys.map((y,i)=>`<text x="190" y="${y+5}" font-size="${size('body',.4)}" font-weight="300" fill="var(--muted)">${i?'缓动':'匀速'}</text>
    <rect data-part="rail${i}" x="${start}" y="${y-1}" width="${length}" height="2" fill="var(--track)"/>
    <rect data-part="${i?'eased':'linear'}" y="${y-13}" width="26" height="26" fill="${i?'#ffc93c':'#4aa3ff'}"/>`).join('')}</g>
    <g data-part="graph" transform="translate(-80 -14) scale(.4)">
      <g fill="none" stroke="var(--faint)" stroke-width="1">${list(9,i=>`<path d="M${G.x+G.w*i/8} ${G.y}V${G.y+G.h}"/>`)}${list(7,i=>`<path d="M${G.x} ${G.y+G.h*i/6}H${G.x+G.w}"/>`)}</g>
      <path data-part="curve" fill="none" stroke="#ffc93c" stroke-width="3.5"/>
      <g data-part="handles" fill="var(--ink)" stroke="var(--muted)" stroke-width="1.5"><path data-part="handle-lines" fill="none"/><circle data-part="handle0" r="7"/><circle data-part="handle1" r="7"/></g>
      <path data-part="guides" fill="none" stroke="var(--muted)" stroke-width="1" stroke-dasharray="4 5"/>
      <circle data-part="point" r="9" fill="#ffc93c"/>
      <text data-part="coordinates" x="1154" y="302" fill="#ffc93c" font-size="${size('caption',.4)}" font-weight="700"/>
    </g>`);
  return ms=>{
    const lt=1+Math.max(0,Math.min(4250,ms))/1000,u=((lt-1)/2)%1,progress=u<.5?u*2:2-u*2;
    const h=back(part(lt,1.6,2.4)),a=[mix(.333,.8,h),mix(.333,0,h)],b=[mix(.667,.2,h),mix(.667,1,h)];
    const value=atX(progress,a,b),last=Math.floor(80*out(part(lt,.5,1.3)));
    s('linear',{x:start+length*progress-13});s('eased',{x:start+length*value-13});
    s('curve',{d:list(last+1,i=>`${i?'L':'M'}${G.x+G.w*bezier(a[0],b[0],i/80)} ${G.y+G.h-G.h*bezier(a[1],b[1],i/80)}`)});
    const A=[G.x+a[0]*G.w,G.y+G.h-a[1]*G.h],B=[G.x+b[0]*G.w,G.y+G.h-b[1]*G.h];
    s('handles',{opacity:part(lt,1.2,1.5)});
    s('handle-lines',{d:`M${G.x} ${G.y+G.h}L${A.join(' ')}M${G.x+G.w} ${G.y}L${B.join(' ')}`});
    s('handle0',{cx:A[0],cy:A[1]});s('handle1',{cx:B[0],cy:B[1]});
    const px=G.x+progress*G.w,py=G.y+G.h-value*G.h,visible=lt>1?1:0;
    s('point',{cx:px,cy:py,opacity:visible});s('guides',{d:`M${px} ${G.y+G.h}L${px} ${py}L${G.x} ${py}`,opacity:visible});
    s('coordinates',{opacity:part(lt,.8,1.1)},`cubic-bezier(${a[0].toFixed(2)}, ${a[1].toFixed(2)}, ${b[0].toFixed(2)}, ${b[1].toFixed(2)})`);
  };
};
// 曲线预览与工作台直接共用同一组节点和绘制函数；只传入各自位置、主题与原时钟。
function graphLayer(original=false,layer='graph',large=false){
  const line=original?'#ffc93c':'var(--accent)',muted=original?'#8a8f99':'var(--muted)',ink=original?'#fff':'var(--ink)';
  return `<g data-layer="${layer}">
    ${large?'<rect data-part="large-border" fill="none" stroke="#2c2f37" stroke-width="1.5"/><path data-part="large-top" fill="none" stroke="#2c2f37" stroke-width="1.5" stroke-dasharray="5 6"/>':''}
    <g data-part="graph-grid" opacity="${large?0:1}" fill="none" stroke="${original?'#262930':'var(--faint)'}" stroke-width="${original?1:.6}">${list(9,i=>`<path data-part="grid-x${i}"/>`)}${list(7,i=>`<path data-part="grid-y${i}"/>`)}</g>
    <path data-part="curve" fill="none" stroke="${line}" stroke-width="${large?6:original?3.5:1.7}" stroke-linecap="round" stroke-linejoin="round"/>
    <g data-part="handles" fill="${ink}" stroke="${muted}" stroke-width="${original?1.5:.8}"><path data-part="handle-lines" fill="none"/><circle data-part="handle0" r="${original?7:4.2}"/><circle data-part="handle1" r="${original?7:4.2}"/></g>
    <path data-part="guides" fill="none" stroke="${original?'#4a4e59':muted}" stroke-width="${original?1:.7}" stroke-dasharray="${original?'4 5':'3 4'}"/>
    <circle data-part="point" r="${large?12:original?9:5}" fill="${large?'#fff':line}"/>
    <text data-part="coordinates" x="${large?1260:original?1154:320}" y="${large?784:original?302:43}" text-anchor="${original?'start':'middle'}" fill="${large?'#8b909c':line}" font-size="${large?18:original?17:size('body')}" font-weight="700"/>
    ${large?'<g data-part="large-companion"><circle data-part="ball" cx="1790" r="18" fill="#ffc93c"/><rect x="1789" y="220" width="2" height="520" fill="#2c2f37"/></g>':''}
  </g>`;
}
function graphMotion(root,layer='graph'){
  const nodes=new Map([...root.querySelector(`[data-layer="${layer}"]`).querySelectorAll('[data-part]')].map(n=>[n.dataset.part,n]));
  const s=(id,attrs={},text)=>{const n=nodes.get(id);for(const [k,v]of Object.entries(attrs))if(n.getAttribute(k)!==String(v))n.setAttribute(k,String(v));if(text!==undefined&&n.textContent!==String(text))n.textContent=String(text);};
  return ({a,b,x,y,w,height,sy=1,draw,progress,visible,handleOpacity,caption,captionOpacity=1,samples=80,guideOpacity=visible?1:0,snapEndpoints=true})=>{
    for(let i=0;i<9;i++)s('grid-x'+i,{d:`M${x+w*i/8} ${y}V${y+height}`});
    for(let i=0;i<7;i++)s('grid-y'+i,{d:`M${x} ${y+height*i/6}H${x+w}`});
    const last=Math.floor(samples*draw);
    s('curve',{d:list(last+1,i=>`${i?'L':'M'}${x+w*bezier(a[0],b[0],i/samples)} ${y+height-height*sy*bezier(a[1],b[1],i/samples)}`)});
    const A=[x+a[0]*w,y+height-a[1]*height],B=[x+b[0]*w,y+height-b[1]*height];
    s('handles',{opacity:handleOpacity});s('handle-lines',{d:`M${x} ${y+height}L${A.join(' ')}M${x+w} ${y}L${B.join(' ')}`});
    s('handle0',{cx:A[0],cy:A[1]});s('handle1',{cx:B[0],cy:B[1]});
    s('coordinates',{opacity:captionOpacity},caption);
    const value=atX(progress,a,b,snapEndpoints),px=x+w*progress,py=y+height-height*sy*value;
    s('point',{cx:px,cy:py,opacity:visible?1:0});s('guides',{d:`M${px} ${y+height}L${px} ${py}L${x} ${py}`,opacity:guideOpacity});
    return {value,px,py};
  };
}
// 两个入口共用超调曲线的求值、行进点和同高小球；原片入口只保留原尺寸与边框。
function largeGraphMotion(root,{layer='graph',original=false}={}){
  const draw=graphMotion(root,layer),scope=original?root.querySelector(`[data-layer="${layer}"]`):root;
  const companion=scope.querySelector('[data-part="large-companion"]'),ball=companion.querySelector('[data-part="ball"]');
  const border=scope.querySelector('[data-part="large-border"]'),top=scope.querySelector('[data-part="large-top"]');
  const update=(node,attrs)=>{for(const [key,value]of Object.entries(attrs))if(node.getAttribute(key)!==String(value))node.setAttribute(key,String(value));};
  return state=>{
    const result=draw({...state,a:[.34,1.56],b:[.64,1],sy:.8,handleOpacity:0,...(original?{samples:100,guideOpacity:0,snapEndpoints:false}:{})});
    update(companion,{opacity:state.visible?1:0});update(ball,{cy:result.py});
    if(original){update(border,{x:state.x,y:state.y,width:state.w,height:state.height*state.draw});update(top,{d:`M${state.x} ${state.y}H${state.x+state.w*state.draw}`});}
    return result;
  };
}
// 原曲线面板与大曲线两个案例：去掉外围软件窗口和片尾标题，保留手柄与求值关系。
F['bezier-editor']=(root,K,def)=>{
  const s=scene(root,`${graphLayer()}
    <g data-part="comparison">
      <text x="484" y="123" text-anchor="middle" fill="var(--muted)" font-size="${size('body')}" font-weight="300">匀速</text>
      <text x="484" y="218" text-anchor="middle" fill="var(--muted)" font-size="${size('body')}" font-weight="300">缓动</text>
      <path d="M428 148H556M428 243H556" fill="none" stroke="var(--track)"/>
      <rect data-part="linear" x="420" y="140" width="16" height="16" fill="var(--blue)"/>
      <rect data-part="eased" x="420" y="235" width="16" height="16" fill="var(--accent)"/>
    </g>
    <g data-part="large-companion"><path d="M546 70V285" fill="none" stroke="var(--track)"/><circle data-part="ball" cx="546" r="8" fill="var(--accent)"/></g>`);
  const graph=graphMotion(root),largeGraph=largeGraphMotion(root);
  return ms=>{
    const t=Math.min(5.5,Math.max(0,ms/1000)),large=t>=3.5,change=out(part(t,3.5,3.8));
    const h=back(part(t,1.1,1.9)),a=large?[.34,1.56]:[mix(.333,.8,h),mix(.333,0,h)],b=large?[.64,1]:[mix(.667,.2,h),mix(.667,1,h)];
    const x=mix(72,102,change),y=mix(88,85,change),w=mix(300,396,change),height=mix(190,200,change),sy=large?.8:1;
    const draw=out(large?part(t,3.6,4.5):part(t,0,.8));
    const u=t<.5?0:((t-.5)/2)%1,progress=large?part(t,4.5,5.5):u<.5?u*2:2-u*2,visible=large?t>=4.5:t>=.5;
    const {value}= (large?largeGraph:graph)({a,b,x,y,w,height,sy,draw,progress,visible,handleOpacity:large?0:part(t,.7,1),caption:`${a.map(v=>v.toFixed(2)).join(', ')} / ${b.map(v=>v.toFixed(2)).join(', ')}`});
    s('comparison',{opacity:large?0:1});s('linear',{x:420+128*progress});s('eased',{x:420+128*value});
    if(!large){s('large-companion',{opacity:0});s('ball',{cy:y+height-height*sy*value});}
  };
};
F['bezier-editor'].graphLayer=graphLayer;
F['bezier-editor'].graphMotion=graphMotion;
F['bezier-editor'].largeGraphMotion=largeGraphMotion;
// 原注意力场景的降幅三件套：同一进度驱动新条、节省段、尺寸线和滚动百分数。
F['reduction-dimension']=(root,K,def)=>{
  const inOut=global.anime.cubicBezier(.65,0,.35,1),scale=.6,num=size('heading',scale),L=num*1.02;
  // 负号由本地中文粗体提供（0.589 em），Oswald 数字最宽 0.55 em；分别留足字位。
  const x=1380,y=872,start=x+num*.7,pitch=num*.62;
  const s=scene(root,`<defs><pattern id="NS-hatch" width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V4.5" stroke="var(--muted)" stroke-width=".8"/></pattern>
    <clipPath id="NS-digits"><rect x="${start-num}" y="${y-num*.86}" width="${num*3}" height="${num*.885}"/></clipPath></defs>
    <g transform="translate(-395 -306.4) scale(.6)">
      <text x="760" y="704" font-size="${size('body',scale)}" font-weight="300" fill="var(--ink)">索引选择耗时</text>
      <text x="760" y="790" font-size="${size('body',scale)}" font-weight="300" fill="var(--muted)">原始</text>
      <text x="760" y="862" font-size="${size('body',scale)}" font-weight="300" fill="var(--ink)">优化后</text>
      <rect x="900" y="770" width="330" height="24" fill="url(#NS-hatch)" stroke="var(--muted)" stroke-width=".8"/>
      <rect data-part="current" x="900" y="842" width="330" height="24" fill="var(--accent)"/>
      <rect data-part="saved" y="842" height="24" fill="none" stroke="var(--muted)" stroke-width=".8" stroke-dasharray="3 4"/>
      <g data-part="dimension" fill="none" stroke="var(--muted)" stroke-width=".9"><path data-part="extensions"/><path data-part="dimension-line"/><path data-part="ticks" stroke-width="1.3"/></g>
      <text x="1380" y="704" font-size="${size('body',scale)}" font-weight="300" fill="var(--ink)">耗时减少</text>
      <g data-part="readout" fill="var(--accent)" font-size="${num}" font-weight="700">
        <text data-part="sign" x="${x}" y="${y}" font-family="Source Han Sans SC,sans-serif">−</text>
        ${list(2,i=>`<g clip-path="url(#NS-digits)"><text data-part="digit${i}-a" x="${start+pitch*i}" y="${y}">0</text><text data-part="digit${i}-b" x="${start+pitch*i}" y="${y+L}">1</text></g>`)}
        <text data-part="percent" x="${start+pitch*2+num*.04}" y="${y}">%</text>
      </g>
    </g>`);
  return ms=>{
    const q=inOut(part(ms,0,1000)),cut=330*.44*q,left=1230-cut,mid=(left+1230)/2,half=cut/2*q;
    s('current',{width:330-cut});s('saved',{x:left,width:cut,opacity:q>0?1:0});
    s('dimension',{opacity:q>0?1:0});s('extensions',{d:`M${left} 880V905M1230 880V905`,opacity:q});
    s('dimension-line',{d:`M${mid-half} 900H${mid+half}`});s('ticks',{d:`M${mid-half-5} 905l10 -10M${mid+half-5} 905l10 -10`});
    const value=44*q;s('readout',{fill:q>=1?'var(--ink)':'var(--accent)','data-value':value});
    for(let i=0;i<2;i++){const unit=10**(1-i),n=value/unit,digit=Math.floor(n)%10,fraction=i===1?n-Math.floor(n):clamp(value%unit-(unit-1));
      s('digit'+i+'-a',{y:y-fraction*L},digit);s('digit'+i+'-b',{y:y+(1-fraction)*L,opacity:fraction>0?1:0},(digit+1)%10);
    }
  };
};
})(globalThis);
