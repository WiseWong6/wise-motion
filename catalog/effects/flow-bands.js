/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function(F){
  F['dual-scroll-settle']=(root,M)=>{
    root.innerHTML=[0,1].map(row=>`<div data-layer="${row?'lower':'upper'}" data-belt="${row}" style="position:absolute;left:0;top:${row?204:76}px;width:640px;height:82px;overflow:hidden">${[0,1,2].map(i=>`<div data-card="${i}" style="position:absolute;left:0;top:0;width:128px;height:80px;background:var(--card);border:.75px solid var(--card-muted);border-radius:3px;box-sizing:border-box"></div>`).join('')}</div>`).join('');
    const cards=[0,1].map(row=>[...root.querySelectorAll(`[data-belt="${row}"] [data-card]`)]);
    return t=>{
      const seconds=M.clamp(t/1000,0,1.3),a=.18,b=.25,end=1.3,v=560/(end-(a+b)/2);
      let distance;
      if(seconds<a)distance=v*seconds*seconds/(2*a);
      else if(seconds<end-b)distance=v*(seconds-a/2);
      else{const q=seconds-(end-b);distance=v*(end-b-a/2)+v*(q-q*q/(2*b));}
      cards.forEach((row,r)=>row.forEach((card,i)=>M.pose(card,{x:r?672+i*160-distance:-128-i*160+distance})));
    };
  };
})(globalThis.MotionFactories);
