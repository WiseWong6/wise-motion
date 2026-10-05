// Paper geometry copied without changes from the protected reference.
 const rand=i=>{const v=Math.sin(i*127.1+39.73)*43758.5453;return v-Math.floor(v);};
 const f=n=>Number(n.toFixed(3));
 // 原纸的变化主要是淡斑与弯曲纤维，避免用均匀的逐像素颗粒铺满画面。
 let fibers='',flecks='',stains='';
 for(let i=0;i<54;i++){
  const x=rand(i+1)*640,y=rand(i+953)*360,l=5+rand(i+17)*17,a=rand(i+101)*Math.PI*2;
  const dx=Math.cos(a)*l,dy=Math.sin(a)*l,bend=(rand(i+71)-.5)*l*.7;
  fibers+=`M${f(x)} ${f(y)}c${f(dx*.2-dy/l*bend)} ${f(dy*.2+dx/l*bend)} ${f(dx*.69+dy/l*bend*.7)} ${f(dy*.69-dx/l*bend*.7)} ${f(dx)} ${f(dy)}`;
 }
 for(let i=0;i<92;i++){
  const x=rand(i+301)*640,y=rand(i+733)*360,r=.28+rand(i+41)*.95;
  flecks+=`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r*(.35+rand(i+13)))}" opacity="${f(.013+rand(i+201)*.022)}" transform="rotate(${f(rand(i+153)*180)} ${f(x)} ${f(y)})"/>`;
 }
 for(let i=0;i<23;i++){
  const x=rand(i+501)*640,y=rand(i+1033)*360,r=2+rand(i+61)*6;
  stains+=`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r*(.4+rand(i+513)*.6))}" opacity="${f(.008+rand(i+301)*.013)}" transform="rotate(${f(rand(i+613)*180)} ${f(x)} ${f(y)})"/>`;
 }
 const paperDefs=(id='kimi-paper')=>`<filter id="${id}-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".043 .037" numOctaves="3" seed="19"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".018"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter><filter id="${id}-paper-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".23"/></filter><filter id="${id}-paper-stains" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.25"/></filter>`;
 const paperMarkup=(id='kimi-paper')=>`<g class="kimi-paper"><rect width="640" height="360" fill="#e2e3dd"/><rect class="paper-mottle" width="640" height="360" fill="#e2e3dd" opacity=".12" filter="url(#${id}-grain)"/><g class="paper-stains" fill="#7e8075" filter="url(#${id}-paper-stains)">${stains}</g><g class="paper-flecks" fill="#74796b" filter="url(#${id}-paper-soft)">${flecks}</g><path class="paper-fibers" d="${fibers}" stroke="#818578" opacity=".056" stroke-width=".28" stroke-linecap="round" fill="none" filter="url(#${id}-paper-soft)"/></g>`;

export const PAPER_SVG=`<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs>${paperDefs("regrowth-paper")}</defs>${paperMarkup("regrowth-paper")}</svg>`;
