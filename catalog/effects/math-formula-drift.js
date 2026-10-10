/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function(global){
  'use strict';
  const F=global.MotionFactories=global.MotionFactories||{};
  const equations=['d = |p| − r', 'f(t) = sin(2π·440·t)', "h = clamp(½ + ½(b−a)/k)", 'e^(iπ) + 1 = 0', 'n̂ = ∇d / |∇d|',
  'y[n] = x[n] · e^(−n/τ)', 'x(t) = A·sin(at + δ)', 'F = Σ aₖ·e^(2πikx)', 'φ = 137.508°', 'ρ(θ) = cos(kθ)'];
  const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};
  const set=(node,key,value)=>{value=String(value);if(node.getAttribute(key)!==value)node.setAttribute(key,value);};
  F['math-formula-drift']=root=>{
    const doc=root.ownerDocument,svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');
    for(const [key,value] of Object.entries({class:'pattern-svg',width:640,height:360,viewBox:'0 0 640 360','aria-hidden':'true'}))svg.setAttribute(key,value);
    const nodes=equations.map((equation,i)=>{
      const node=doc.createElementNS(svg.namespaceURI,'text');
      for(const [key,value] of Object.entries({'data-equation':i,y:(120+hash(i*7.7)*840)/3,'font-family':'Oswald, "Source Han Sans SC", sans-serif','font-weight':700,'font-style':'italic','font-size':(28+hash(i*5)*30)/3,fill:'var(--muted)',opacity:.25+.2*hash(i*2),'text-anchor':'middle','dominant-baseline':'middle'}))node.setAttribute(key,value);
      node.textContent=equation;svg.appendChild(node);return node;
    });
    root.replaceChildren(svg);let previous=NaN,disposed=false;
    const render=(ms,state={})=>{
      if(disposed)return;
      const time=Math.max(0,state.elapsed??ms)/1000;if(time===previous)return;previous=time;
      nodes.forEach((node,i)=>{
        const x=hash(i*3.1)*1920+time*(hash(i)-.5)*400;
        // 回收发生在文字完全离开画板之后；原零至半秒的画面坐标不变。
        set(node,'x',(((x+960)%3840+3840)%3840-960)/3);
      });
    };
    render.destroy=keep=>{if(disposed)return;disposed=true;if(!keep)svg.remove();};
    return render;
  };
})(globalThis);
