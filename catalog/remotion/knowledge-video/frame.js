// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
export const clamp=x=>Math.max(0,Math.min(1,x));
export const lerp=(a,b,p)=>a+(b-a)*p;
export function q(t,at,d,e='linear'){
 const p=clamp((t-at)/d),z=1-p;
 if(e==='smooth')return p*p*(3-2*p);
 if(e==='expoout')return p===1?1:1-2**(-10*p);
 if(e==='sineout')return Math.sin(p*Math.PI/2);
 if(e==='sinein')return 1-Math.cos(p*Math.PI/2);
 if(e.startsWith('back')){const s=e==='back13'?1.3:2;return 1+(s+1)*(p-1)**3+s*(p-1)**2;}
 const m=e.match(/^p([123])(in|out|io)$/);if(!m)return p;
 const n=Number(m[1])+1;
 return m[2]==='in'?p**n:m[2]==='out'?1-z**n:p<.5?(2*p)**n/2:1-(2*z)**n/2;
}
export function opacity(nodes,value){for(const node of Array.isArray(nodes)?nodes:[nodes])if(node)node.style.opacity=String(value);}
export function pose(el,values){
 if(!el)return;const p=el._motionPose||={x:0,y:0,scale:1,rotation:0,xPercent:0,yPercent:0};Object.assign(p,values);
 const {x,y,scale,rotation,xPercent,yPercent}=p;
 if(el.namespaceURI==='http://www.w3.org/2000/svg')el.setAttribute('transform',`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`);
 else el.style.transform=`translate(${xPercent}%,${yPercent}%) translate(${x}px,${y}px) rotate(${rotation}deg) scale(${scale})`;
}
export function enter(el,t,at,d,from={},ease='expoout'){
 const p=q(t,at,d,ease);opacity(el,clamp(p));pose(el,{x:(from.x||0)*(1-p),y:(from.y||0)*(1-p),scale:lerp(from.scale??1,1,p),rotation:(from.rotation||0)*(1-p)});
 el.style.filter=from.blur?`blur(${Math.max(0,from.blur*(1-p))}px)`:'none';
}
