/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
 * 保留本机精修后的真实绘制、独立笔形和材料过渡。原片图形权利不由代码许可授予。 */
(function (global) {
 'use strict';
 const factories=global.MotionFactories=global.MotionFactories||{},parts={};
 const material={images:new Map(),imageJobs:new Map(),keyPartsReady:false,users:0};
 let serial=0,keyJob=null;
 const uid=name=>'wise-material-'+name+'-'+(++serial);
 const scriptURL=typeof document!=='undefined' ? (document.currentScript?.src || Array.from(document.scripts).find(node=>/\/effects\/material-evolution\.js(?:[?#]|$)/.test(node.src))?.src || '') : '';
 function assetURL(name){
  if(typeof document==='undefined'||typeof URL==='undefined')return 'catalog/assets/material-evolution/'+name;
  if(scriptURL)return new URL('../assets/material-evolution/'+name,scriptURL).href;
  const directory=/\/catalog\/[^/]*$/.test(new URL(document.baseURI).pathname)?'assets/':'catalog/assets/';
  return new URL(directory+'material-evolution/'+name,document.baseURI).href;
 }
 function loadKeys(){
  if(global.WiseMaterialKeyShapes)return Promise.resolve(global.WiseMaterialKeyShapes);
  if(keyJob)return keyJob;
  keyJob=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src=assetURL('key-shapes.js');script.async=true;
   script.onload=()=>{script.onload=script.onerror=null;script.remove();if(global.WiseMaterialKeyShapes)resolve(global.WiseMaterialKeyShapes);else{keyJob=null;reject(new Error('字形资料未能载入。'));}};
   script.onerror=()=>{script.onload=script.onerror=null;script.remove();keyJob=null;reject(new Error('字形资料未能载入。'));};
   document.head.append(script);
  });
  return keyJob;
 }
 function loadImage(name){
  if(material.imageJobs.has(name))return material.imageJobs.get(name);
  const image=new Image();material.images.set(name,image);
  const job=new Promise((resolve,reject)=>{
   image.onload=async()=>{image.onload=image.onerror=null;try{if(image.decode)await image.decode();resolve(image);}catch(error){material.imageJobs.delete(name);material.images.delete(name);reject(error);}};
   image.onerror=()=>{image.onload=image.onerror=null;material.imageJobs.delete(name);material.images.delete(name);reject(new Error('材料纹理未能载入。'));};
   image.src=assetURL(name);
  });
  material.imageJobs.set(name,job);return job;
 }

/* Kimi 开源参考复刻：纸面与共用月面。素材由内置图片工具依参考帧提取/重建。 */
(function(){
 'use strict';
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
 const moonDefs=id=>`<filter id="${id}-moon-tonal" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="1.15" intercept=".01"/><feFuncG type="linear" slope="1.15" intercept=".01"/><feFuncB type="linear" slope="1.15" intercept=".01"/></feComponentTransfer></filter><clipPath id="${id}-moon-clip"><circle r="80"/></clipPath><linearGradient class="moon-shadow-gradient" id="${id}-moon-shadow"><stop offset="0" stop-color="#000" stop-opacity=".94"/><stop offset=".31" stop-color="#000" stop-opacity=".925"/><stop offset=".5" stop-color="#000" stop-opacity=".85"/><stop offset=".67" stop-color="#000" stop-opacity=".54"/><stop offset=".87" stop-color="#000" stop-opacity=".07"/><stop offset="1" stop-color="#000" stop-opacity=".06"/></linearGradient>`;
 const moonMarkup=id=>`<g class="moon-surface" clip-path="url(#${id}-moon-clip)"><image class="moon-texture" filter="url(#${id}-moon-tonal)" href="${assetURL('moon.png')}" x="-100.4" y="-100.1" width="200.65" height="200.65" style="mix-blend-mode:multiply"/><circle class="moon-shade" r="80" fill="url(#${id}-moon-shadow)" opacity="1"/></g>`;
 const marginalia=(page=16)=>`<g fill="#31322d" font-family="Arial,sans-serif"><g opacity=".53" font-size="1.7"><text x="22" y="291" letter-spacing=".15">TOPIC 1. DAO</text><text x="22" y="294">Taoism/Daoism</text><text x="22" y="297">the path</text><text x="22" y="300" font-size="1.45">It is, rather, the principle</text><text x="22" y="302" font-size="1.45">underlying everything that exists.</text><text x="22" y="309" letter-spacing=".15">TOPIC 2. TAOISM/DAOISM</text><text x="22" y="312">No action</text><text x="22" y="315">the path</text><text x="22" y="318" font-size="1.4">understood as a method, a lifestyle,</text><text x="22" y="320" font-size="1.4">or a collection of personal expressions</text></g><g opacity=".5" text-anchor="end" font-size="2" letter-spacing=".22"><text x="617" y="29">FORM NO STRUCTURE</text><text x="617" y="33" font-size="1.5">Struct</text><text x="617" y="36" font-size="1.5">Brush</text><text x="617" y="41" font-size="1.5" letter-spacing="0">It does not have a defined structure</text><text x="617" y="45" font-size="1.7">CULTURAL ACCEPTED</text><text x="617" y="48" font-size="1.4" letter-spacing="0">socially integrated, they are governed</text><text x="617" y="58" font-size="1.4">Reg.2568</text></g><g font-size="2.45" letter-spacing=".3" opacity=".65"><text x="605" y="325">PAG. ${page}</text><text x="88" y="350">65.62</text><text x="128" y="350">75.45</text><text x="173" y="350">92.76</text><text x="285" y="350">85.96</text><text x="548" y="350">55.32</text><text x="586" y="350">81.94</text></g></g>`;
 material.paper={paperDefs,paperMarkup,moonDefs,moonMarkup,marginalia};
}());
/* 复用的点阵圆柱基础；其余早期画稿不由整片播放器调用。 */
(function () {
  'use strict';
  const F=parts, TAU=Math.PI*2;
  const clamp=v=>Math.max(0,Math.min(1,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=(t,a,b)=>{const q=clamp((t-a)/(b-a));return q*q*(3-2*q);};
  const out=(t,a,b)=>1-Math.pow(1-clamp((t-a)/(b-a)),3);
  const n=v=>Number(v.toFixed(3));
  const rand=i=>{const x=Math.sin(i*127.1+31.73)*43758.5453;return x-Math.floor(x);};
  const path=(points,close=false)=>points.map((p,i)=>(i?'L':'M')+n(p[0])+' '+n(p[1])).join('')+(close?'Z':'');
  const attr=(el,key,value)=>el.setAttribute(key,typeof value==='number'?n(value):value);
  const move=(el,x,y,scale=1,angle=0)=>attr(el,'transform',`translate(${n(x)} ${n(y)}) rotate(${n(angle)}) scale(${n(scale)})`);
  const group=(body,transform='',extra='')=>`<g${transform?` transform="${transform}"`:''} ${extra}>${body}</g>`;
  const line=(d,width=.5,extra='')=>`<path d="${d}" fill="none"${/\bstroke=/.test(extra)?'':' stroke="currentColor"'} stroke-width="${width}" ${extra}/>`;
  const circle=(x,y,r,extra='')=>`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" ${extra}/>`;
  const ellipse=(x,y,rx,ry,extra='')=>`<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" ${extra}/>`;
  function svg(root,body,defs='',paper=false){
    const paperId=uid('wire-paper');root.dataset.art='original';root.style.background=paper?'#e7e8df':'#11191d';
    root.innerHTML=`<svg class="review-svg structure-study" viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" style="color:${paper?'#242424':'#d7dbd2'}"><defs>${defs}<filter id="${paperId}-grain" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".4" numOctaves="3" seed="12"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".075"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter></defs>${paper?paperSurface(paperId):''}${body}</svg>`;
    return {one:q=>root.querySelector(q),all:q=>Array.from(root.querySelectorAll(q))};
  }
  function disposable(render){let disposed=false,last=null;const draw=t=>{if(disposed||t===last)return;last=t;render(t);};draw.destroy=()=>{disposed=true;};return draw;}
  function paperSurface(paperId){
    let marks='';for(let i=0;i<650;i++){const x=rand(i+9)*640,y=rand(i+500)*360;marks+=`M${n(x)} ${n(y)}l${n(.15+rand(i+61)*1.4)} ${n((rand(i+101)-.5)*.5)}`;}
    return `<rect width="640" height="360" fill="#e7e8df" filter="url(#${paperId}-grain)"/><path d="${marks}" stroke="#606258" stroke-width=".26" opacity=".18"/>`;
  }
  F['dots-wireframe']=(root,K,d)=>{
    const rows=11,around=14,per=rows*around,vertices=[],edges=[];
    for(let c=0;c<3;c++)for(let row=0;row<rows;row++)for(let a=0;a<around;a++){
      const i=vertices.length,j=row*around+a,angle=a/around*TAU+(row===0||row===rows-1?0:(rand(j+770)-.5)*.65);
      // 三笔各有长短、倾角与位置，上笔抬得高，末笔伸得长。
      const length=[191,168,325][c],center=[323,323,318][c],baseline=[83,181,277][c],slope=[.14,.095,.06][c],bx=center+(rand(j+851+c*313)-.5)*length;
      vertices.push({c,row,a,angle,scatterX:320+(rand(i+1233)-.5)*282,scatterY:68+row*22.55+(row===0||row===rows-1?0:(rand(j+391)-.5)*23)+(rand(i+1235)-.5)*18,sx:320+(rand(i+81)-.5)*280,sy:181+(rand(i+219)-.5)*55,bandX:bx,bandY:baseline+(rand(j+531+c*149)-.5)*[28,29,28][c]-(bx-320)*slope,jitter:row===0||row===rows-1?0:(rand(j+391)-.5)*23});
      const base=c*per+row*around;
      if(row===0||row===rows-1||a%3===0)edges.push([i,base+(a+1)%around,c,row===0||row===rows-1?0:2]);
      if(row<rows-1){edges.push([i,i+around,c,1]);const step=(rand(j+995)>.5?1:-1)*(1+Math.floor(rand(j+171)*2));edges.push([i,c*per+(row+1)*around+(a+step+around)%around,c,2]);}
      if(row<rows-2&&rand(j+235)>.48)edges.push([i,c*per+(row+2)*around+(a+around+3)%around,c,3]);
      if(row<rows-2&&row%2===0&&a===row%around)edges.push([i,c*per+(row+2)*around+(a+around+(row%4?3:-3))%around,c,3]);
    }
    let cloud='';for(let i=0;i<(d.kimiOpen?0:12800);i++){const x=320+(rand(i+51)-.5)*270+(rand(i+489)-.5)*30,y=185+(rand(i+784)+rand(i+166)-1)*53-13*Math.sin((x-190)/260*TAU);cloud+=`M${n(x)} ${n(y)}v${n(.4+rand(i+72)*(i%6===0?8:2.4))}`;}
    const q=svg(root,`<path class="wire-cloud" d="${cloud}" fill="none" stroke="#151515" stroke-width=".6"/><g class="wire-lines" fill="none">${edges.map(()=>'<path/>').join('')}</g><g class="wire-points" fill="#171717">${vertices.map(()=>'<rect width="1.5" height="1.5"/>').join('')}</g>`, '',true);
    const dots=q.all('.wire-points rect'),lines=q.all('.wire-lines path'),cloudNode=q.one('.wire-cloud'),points=new Float64Array(vertices.length*3);
    return disposable(ms=>{
      const p=clamp(ms/d.duration_ms),band=d.kimiOpen?smooth(ms,680,1080):smooth(p,.16,.31),form=d.kimiOpen?smooth(ms,1630,1850):smooth(p,.39,.77),scatter=d.kimiOpen?smooth(ms,1430,1630):0,enter=smooth(p,0,.08),angle=(d.kimiOpen?smooth(ms,1750,2550):smooth(p,.48,.86))*.12;
      attr(cloudNode,'opacity',enter*(1-smooth(p,.17,.31))*.85);attr(cloudNode,'transform',`translate(0 ${n(8*(1-enter))})`);
      vertices.forEach((v,i)=>{
        const a=v.angle+angle,tx=320+(v.c-1)*84+33*Math.cos(a),ty=68+v.row*22.55+v.jitter+10*Math.sin(a),front=(Math.sin(a)+1)/2;
        const sx=v.scatterX,sy=v.scatterY;
        const x=mix(mix(mix(v.sx,v.bandX,band),sx,scatter),tx,form),y=mix(mix(mix(v.sy,v.bandY,band),sy,scatter),ty,form),r=mix(1.45,1.65+.65*front,form);
        points[i*3]=x;points[i*3+1]=y;points[i*3+2]=front;
        attr(dots[i],'x',x-r/2);attr(dots[i],'y',y-r/2);attr(dots[i],'width',r);attr(dots[i],'height',r);attr(dots[i],'opacity',enter*mix(.8,.38+.62*front,form));
      });
      edges.forEach(([a,b,c,type],i)=>{
        const x=points[a*3],y=points[a*3+1],reveal=smooth(p,.24,.33),depth=(points[a*3+2]+points[b*3+2])*.5;
        attr(lines[i],'d',`M${n(x)} ${n(y)}L${n(mix(x,points[b*3],reveal))} ${n(mix(y,points[b*3+1],reveal))}`);
        const sparse=i%13===0||type===0&&i%3===0?1:0,alpha=mix(sparse,.22+.75*depth,form);
        attr(lines[i],'stroke','#171717');attr(lines[i],'stroke-width',type===0?.72:.39+.28*depth);attr(lines[i],'opacity',reveal*alpha);
      });
    });
  };


}());
/* Kimi 开源片 8.100–9.350 秒；帧号为 30fps、首帧编号 1。 */
(function () {
  'use strict';
  const F=parts;
  const clamp=v=>Math.max(0,Math.min(1,v));
  const mix=(a,b,p)=>a+(b-a)*p;
  const n=v=>Number(v.toFixed(4));
  const smooth=(x,a,b)=>{const p=clamp((x-a)/(b-a));return p*p*(3-2*p);};
  const rand=i=>{const v=Math.sin(i*127.1+49.37)*43758.5453;return v-Math.floor(v);};
  const attr=(el,key,value)=>el.setAttribute(key,typeof value==='number'?n(value):value);
  // 帧号、亮心位置、左右距离、中球半径、侧球半径、纵向比例。
  // 半径包含浅色纤维外缘；低灰度阈值测出的暗体边界比此外缘略小。
  const fibers=[
    [244,320.33,179.33,133.66,132.34,55,55,1],
    [247,320.33,179.50,133,133,55.3,55.3,1],
    [252,320.67,180.00,133.34,133,55.8,55.8,1],
    [257,320.67,181.00,131,130.33,58.2,58.7,1],
    [259,321.00,181.00,125.33,124.67,60.0,61.5,1],
    [260,321.33,181.00,121.66,121,60.8,62.5,1],
    [261,320.67,181.00,113,112.66,62.1,65.0,1],
    [262,321.33,181.50,79.33,78.34,63.4,70.5,1],
    [263,320.33,181.00,58.33,61,67.5,73.5,1],
    [264,319.50,180.33,0,0,95.5,95.5,.827],
    [265,321.17,181.33,0,0,80.0,80.0,1]
  ];
  // 月面先轻微扩张，再下移缩小；276–278 帧下移过冲，随后向上回稳。
  const moons=[
    [264,319.50,180.33,79.5,1],
    [265,321.17,181.33,79.5,1],
    [266,321.83,181.33,82.5,1],
    [267,322.50,181.33,84.5,1],
    [268,323.00,182.33,85.3,1],
    [269,323.00,183.0,84.8,.995],
    [270,323.00,186.0,83.4,.985],
    [271,323.00,188.50,82.5,.970],
    [273,326.50,205.50,75.8,.910],
    [274,328.33,212.00,73.8,.865],
    [275,331.33,232.33,70.7,.825],
    [276,334.17,249.33,66.3,.780],
    [277,334.50,251.00,64.9,.735],
    [278,334.83,251.67,62.3,.690],
    [279,335.17,250.00,58.9,.650],
    [280,335.00,248.67,57.8,.620],
    [281,334.50,245.67,55.2,.600],
    [282,334.33,244.83,54.4,.580]
  ];
  function sample(table,frame){
    if(frame<=table[0][0])return table[0].slice(1);
    for(let i=1;i<table.length;i++)if(frame<=table[i][0]){
      const a=table[i-1],b=table[i],p=(frame-a[0])/(b[0]-a[0]);
      return a.slice(1).map((v,j)=>mix(v,b[j+1],p));
    }
    return table[table.length-1].slice(1);
  }
  function threads(seed){
    let d='';
    for(let i=0;i<126;i++){
      const a=(i/126+rand(i+seed)*.013)*Math.PI*2,r=34+rand(i+seed+77)*18;
      const inner=3+rand(i+seed+17)*20,bend=(rand(i+seed+28)-.5)*4;
      const x=Math.cos(a),y=Math.sin(a);
      d+=`M${n(x*inner)} ${n(y*inner)}Q${n(x*r*.58-y*bend)} ${n(y*r*.58+x*bend)} ${n(x*r)} ${n(y*r)}`;
    }
    return d;
  }
  F['spheres-unite']=(root,K,definition)=>{
    const shared=material.paper,id=uid('spheres'),moonId=id+'-moon';
    const edgeMask=`<mask id="${id}-initial-steps" maskUnits="userSpaceOnUse" x="-72" y="-72" width="144" height="144"><rect x="-72" y="-72" width="144" height="144" fill="white"/><g class="initial-sphere-steps" fill="black"><rect x="-72" y="-72" width="47" height="29"/><rect x="-72" y="-43" width="34" height="13"/><rect x="-72" y="-30" width="22" height="38"/><rect x="51" y="-43" width="21" height="51"/><rect x="38" y="-72" width="34" height="29"/></g></mask>`;
    const textureDefs=`<filter id="${id}-fiber-motion" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB"><feTurbulence class="fiber-flow-noise" type="fractalNoise" baseFrequency=".049 .053" numOctaves="2" seed="27" result="flow"/><feDisplacementMap class="fiber-flow-warp" in="SourceGraphic" in2="flow" scale=".55" xChannelSelector="R" yChannelSelector="G"/></filter><filter id="${id}-moon-soft"><feGaussianBlur class="moon-appearance-blur" stdDeviation=".55"/></filter>`;
    // PNG 的浅外缘比估读注册半径淡，补偿 5% 显示尺寸，缩放中心仍为亮心。
    const image=`<image class="fiber-image" href="${assetURL('fiber.png')}" x="-67.0747" y="-66.9688" width="132.878" height="132.878"/>`;
    const variants=['rotate(-7) scale(-1 1)','rotate(0)','rotate(11) scale(1 -1)'];
    const fiberMarkup=i=>`<g class="fiber-sphere" data-sphere="${i}"><g mask="url(#${id}-initial-steps)"><g class="fiber-drift"><g class="fiber-variant" transform="${variants[i]}">${image}</g></g><path class="fiber-threads-a" d="${threads(47+i*11)}" fill="none" stroke="#f1f0ea" stroke-width=".12" opacity=".10"/><path class="fiber-threads-b" d="${threads(171+i*13)}" fill="none" stroke="#deded7" stroke-width=".10" opacity=".09"/></g></g>`;
    root.dataset.art='original';
    root.style.background='#e2e3dd';
    root.innerHTML=`<svg class="review-svg" viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="三枚已在场的纤维球靠拢放大，先合成单个纤维球，再快速变为月面；月球缩小下移，接向图鉴"><defs>${shared.paperDefs(id)}${shared.moonDefs(moonId)}${edgeMask}${textureDefs}</defs>${shared.paperMarkup(id)}<g class="sphere-marginalia">${shared.marginalia(16)}</g><g class="fiber-spheres">${fiberMarkup(0)}${fiberMarkup(2)}${fiberMarkup(1)}</g><g class="united-moon" filter="url(#${id}-moon-soft)">${shared.moonMarkup(moonId)}</g></svg>`;
    const all=s=>Array.from(root.querySelectorAll(s)),one=s=>root.querySelector(s);
    const spheres=all('.fiber-sphere'),moon=one('.united-moon'),shade=one('.moon-shade'),shadow=one('.moon-shadow-gradient');
    // 用样式模糊合成后的月面，避免局部 SVG 滤镜把暗部裁成纯黑斑。
    moon.removeAttribute('filter');
    let last=-1,destroyed=false;
    const render=ms=>{
      if(destroyed)return;
      const local=Math.max(0,Math.min(1250,ms));if(local===last)return;last=local;
      const frame=244+local*.03;
      const [x,y,left,right,centerRadius,sideRadius,aspect]=sample(fibers,frame);
      const mineral=smooth(frame,264.12,264.95),merged=smooth(frame,263.15,264);
      attr(one('.fiber-spheres'),'opacity',1-mineral);
      one('.fiber-spheres').style.filter='brightness('+n(.95-.16*smooth(frame,257,264))+')';
      attr(one('.initial-sphere-steps'),'opacity',1-smooth(frame,244,246));
      spheres.forEach(el=>{
        const i=Number(el.dataset.sphere),radius=i===1?centerRadius:sideRadius;
        const px=i===0?x-left:i===2?x+right:x;
        // 合体的原帧高度约 155；重建素材在压扁后仍少约 5%，只对末段纵向作补偿。
        const materialY=1+.05*smooth(frame,262.5,264);
        attr(el,'transform',`translate(${n(px)} ${n(y)}) scale(${n(radius/55)} ${n(radius/55*aspect*materialY)})`);
        attr(el,'opacity',i===1?1:1-merged);
        // 外形变化跟随实测帧；内部仅作小幅流动，不额外摆动球的位置或大小。
        const phase=local*.006+i*.61;
        attr(el.querySelector('.fiber-drift'),'transform',`rotate(${n((i-1)*.8+local*.0035+.7*Math.sin(phase))})`);
        attr(el.querySelector('.fiber-threads-a'),'transform',`rotate(${n(-1.4*Math.sin(phase)-local*.007)}) scale(${n(1+.008*Math.sin(phase*1.3))})`);
        attr(el.querySelector('.fiber-threads-b'),'transform',`rotate(${n(2*Math.sin(phase*.8)+local*.004)})`);
        attr(el.querySelector('.fiber-threads-a'),'opacity',.075+.035*(1+Math.sin(phase))*.5);
      });
      const [mx,my,mr]=sample(moons,frame);
      attr(moon,'transform',`translate(${n(mx)} ${n(my)}) scale(${n(mr/80)})`);
      attr(moon,'opacity',mineral);attr(shade,'opacity',1);
      // 阴影边界向左退去，左缘仍暗；整体降低阴影会把左半球提前照亮。
      attr(shadow,'x2',n(mix(100,57,smooth(frame,270,279)))+'%');
      moon.style.filter='blur('+n(mix(1.85,0,smooth(frame,265,269)))+'px)';
      attr(one('.sphere-marginalia'),'opacity',1-smooth(frame,257,264));
    };
    render.destroy=()=>{destroyed=true;};
    return render;
  };
}());
/* Kimi 图鉴：轮廓独立的版画图层、局部显影、真实曲面变形与仪器内件运动。 */
(function () {
  'use strict';

  const F = parts;
  const SOURCE_DURATION = 2650;
  const SHEET = assetURL('atlas-engraving.png');
  const clamp = value => Math.max(0, Math.min(1, value));
  const number = value => Number(value.toFixed(4));
  const ease = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
  let instance = 0;

  // 初始分区坐标对应透明版画整板；下方 objects 为实际独立轮廓及动作。
  // 出现时间来自原片各阶段；少量轮廓重叠用于先露主体、后补附属细节。
  const regions = [
    { key: 'stair-plan', label: '旋梯平面图', box: [316, 88, 55, 55], start: -20, end: 350, ghost: .30 },
    { key: 'exploded-machine', label: '机械分解图', box: [198, 61, 94, 160], start: 80, end: 525, ghost: .34 },
    { key: 'stair-elevation', label: '旋梯立面', box: [277, 55, 55, 116], start: 100, end: 510, ghost: .05 },
    { key: 'cells', label: '细胞图', box: [341, 142, 60, 44], start: 100, end: 535, ghost: 0 },
    { key: 'wave-surface', label: '左下曲面网格', box: [114, 224, 153, 58], start: 295, end: 575, ghost: .05 },
    { key: 'triangle-note', label: '月球左侧角度图', box: [251, 225, 38, 32], start: 310, end: 590, ghost: .08 },
    { key: 'beetle-body', label: '甲虫身体', box: [154, 140, 25, 35], start: 370, end: 545, ghost: 0 },
    { key: 'beetle-limbs', label: '甲虫足与触角', box: [111, 131, 84, 49], start: 495, end: 765, ghost: 0 },
    { key: 'hyperboloid', label: '甲虫下方双曲面', box: [120, 178, 77, 47], start: 380, end: 760, ghost: .16 },
    { key: 'well', label: '漏斗曲面', box: [379, 102, 54, 47], start: 385, end: 780, ghost: .24 },
    { key: 'satellite', label: '带天线球体', box: [407, 143, 35, 49], start: 360, end: 760, ghost: .04 },
    { key: 'pendulum', label: '双圆摆线图', box: [375, 184, 49, 80], start: 455, end: 835, ghost: 0 },
    { key: 'orbits', label: '上方天体轨道图', box: [198, 6, 145, 50], start: 425, end: 810, ghost: .10 },
    { key: 'upper-angle', label: '上方角度投影图', box: [327, 5, 49, 51], start: 540, end: 945, ghost: .12 },
    { key: 'shell', label: '鹦鹉螺剖面', box: [172, 277, 61, 78], start: 550, end: 935, ghost: .15 },
    { key: 'spacecraft', label: '航天器剖面', box: [214, 265, 130, 61], start: 580, end: 1030, ghost: 0 },
    { key: 'volute', label: '下方建筑涡卷', box: [344, 261, 74, 93], start: 505, end: 1000, ghost: .08 },
    { key: 'lower-notes', label: '航天器下方图解', box: [239, 315, 105, 40], start: 730, end: 1110, ghost: .06 },
    { key: 'antenna', label: '大型射电天线', box: [17, 176, 175, 179], start: 650, end: 1130, ghost: 0,
      polygon: '17,213 53,210 74,177 91,177 115,215 155,231 155,243 130,251 144,286 192,337 181,354 45,355 48,307 34,279 25,264' },
    { key: 'left-ratio', label: '左侧比例递推图', box: [13, 102, 95, 112], start: 690, end: 1120, ghost: .07 },
    { key: 'rose-window', label: '圆形花窗', box: [373, 3, 86, 97], start: 690, end: 1120, ghost: .08 },
    { key: 'hourglass-curve', label: '上方曲线', box: [459, 5, 35, 65], start: 760, end: 1120, ghost: .12 },
    { key: 'sine-projection', label: '右上螺线投影', box: [491, 7, 44, 111], start: 720, end: 1150, ghost: .13 },
    { key: 'helicoid', label: '蜻蜓上方螺旋', box: [431, 72, 59, 67], start: 765, end: 1200, ghost: 0 },
    { key: 'dragonfly-body', label: '蜻蜓身体', box: [474, 123, 13, 57], start: 690, end: 945, ghost: 0 },
    { key: 'dragonfly-wings', label: '蜻蜓翅膀', box: [442, 123, 78, 39], start: 835, end: 1120, ghost: .09 },
    { key: 'globe', label: '左上地球仪', box: [112, 9, 56, 73], start: 900, end: 1350, ghost: 0 },
    { key: 'globe-notes', label: '地球仪旁几何注释', box: [111, 71, 90, 64], start: 990, end: 1450, ghost: .09 },
    { key: 'globe-right-notes', label: '地球仪右侧图解', box: [165, 20, 36, 68], start: 1020, end: 1450, ghost: .08 },
    { key: 'platonic-solids', label: '建筑左侧多面体', box: [429, 190, 19, 89], start: 900, end: 1230, ghost: .06 },
    { key: 'cathedral-left-spire', label: '建筑左塔尖', box: [450, 156, 19, 125], start: 955, end: 1390, ghost: 0 },
    { key: 'cathedral-right-spire', label: '建筑右塔尖', box: [491, 154, 15, 104], start: 965, end: 1420, ghost: 0 },
    { key: 'cathedral', label: '建筑拱廊', box: [449, 154, 112, 128], start: 1080, end: 1640, ghost: 0 },
    { key: 'gyro', label: '右上环架仪器', box: [536, 4, 90, 96], start: 990, end: 1540, ghost: 0 },
    { key: 'compass', label: '右侧环形仪器', box: [536, 87, 91, 82], start: 1030, end: 1590, ghost: 0 },
    { key: 'lens-cone', label: '下方双锥仪器', box: [413, 280, 27, 75], start: 840, end: 1280, ghost: .06 },
    { key: 'instrument-plans', label: '下方仪器三视图', box: [439, 281, 52, 74], start: 925, end: 1380, ghost: 0 },
    { key: 'tesseract', label: '左上立方投影', box: [13, 3, 100, 95], start: 1220, end: 1580, ghost: .05 },
    { key: 'lower-hourglass', label: '左下双球曲面', box: [16, 283, 38, 69], start: 1190, end: 1590, ghost: .10 },
    { key: 'right-surfaces', label: '右侧曲面组', box: [560, 166, 66, 94], start: 1240, end: 1730, ghost: .17 },
    { key: 'bottom-geometry', label: '右下几何图解', box: [491, 278, 136, 78], start: 1260, end: 1760, ghost: .10 }
  ];

  // 月球逐帧测得的中心和半径；保留原片的承接和缩小，不另做淡入。
  const moonKeys = [
    [0, 335.5, 250.3, 60.5], [50, 335, 248, 58],
    [250, 333.5, 238, 49.5], [516.667, 332, 230, 43.3],
    [750, 330.5, 226, 39.5], [1116.667, 330, 224, 36.5],
    [1750, 329, 221, 33.5], [2150, 329, 220, 33]
  ];
  function moonAt(time) {
    if (time >= moonKeys[moonKeys.length - 1][0]) return moonKeys[moonKeys.length - 1].slice(1);
    for (let i = 1; i < moonKeys.length; i++) {
      const a = moonKeys[i - 1], b = moonKeys[i];
      if (time <= b[0]) {
        const p = clamp((time - a[0]) / (b[0] - a[0]));
        return [1, 2, 3].map(axis => a[axis] + (b[axis] - a[axis]) * p);
      }
    }
    return moonKeys[0].slice(1);
  }


  const outlines = {
    'exploded-machine': 'M196 62 Q232 54 264 64 L272 129 Q288 128 294 145 L291 167 L278 176 L280 215 Q242 225 197 214 L195 194 L203 178 L197 153 L200 134 L195 109 L201 97 Z',
    'stair-plan': 'M344 88 C376 88 378 141 344 142 C313 143 309 93 344 88Z',
    'stair-elevation': 'M278 56 L333 56 L332 89 L321 93 L313 106 L315 130 L329 145 L332 170 L279 170 L279 151 L288 134 L284 118 L276 102Z',
    'cells': 'M348 142 C359 139 390 139 398 149 L398 179 Q376 187 345 179 Q338 163 348 142Z',
    'wave-surface': 'M115 247 L191 226 L267 248 L266 257 L198 285 L118 258Z',
    'triangle-note': 'M252 226 Q268 224 286 227 L289 253 Q271 259 250 253Z',
    'beetle-limbs': 'M110 139 Q120 130 140 132 L153 130 Q168 133 179 130 L194 134 L195 176 Q165 184 146 174 Q127 181 111 171Z',
    'hyperboloid': 'M122 178 Q160 173 194 180 Q203 207 194 222 Q160 228 122 220 Q115 203 122 178Z',
    'well': 'M379 105 L429 104 L436 130 L416 136 L416 149 L408 149 L408 135 L379 134Z',
    'satellite': 'M406 143 Q418 137 426 149 L445 192 L437 197 L415 174 L407 172Z',
    'pendulum': 'M392 184 Q415 184 419 200 L411 217 L420 260 L375 265 L378 232 L393 213 L384 205Z',
    'orbits': 'M198 7 Q261 1 325 9 L344 21 L341 54 L201 56Z',
    'upper-angle': 'M335 6 L371 8 L377 56 L329 56 L335 42Z',
    'shell': 'M196 277 Q207 274 214 286 L214 302 Q231 304 234 325 Q236 348 215 355 Q181 355 175 334 Q170 310 182 291Z',
    'spacecraft': 'M214 287 L244 267 L270 263 L308 264 L312 280 L342 271 L343 316 L312 309 L306 325 L263 326 L245 322 L216 300Z',
    'volute': 'M344 261 L395 260 L396 274 Q417 281 420 305 Q424 333 398 346 L396 355 L344 355Z',
    'antenna': 'M18 212 L47 208 L74 175 L92 175 L116 213 L156 231 L155 240 L127 251 L133 271 L149 301 L166 320 L185 332 L178 354 L46 355 L47 307 L36 280 L31 263 L22 250Z',
    'left-ratio': 'M14 102 L105 103 L104 173 L66 196 L57 205 L39 206 L39 190 L13 189 L14 158 L26 155 L25 137Z',
    'rose-window': 'M416 3 Q459 2 460 51 Q458 97 421 99 L373 99 L373 52 Q373 11 416 3Z',
    'hourglass-curve': 'M460 5 Q480 1 491 12 L494 57 Q481 71 459 64Z',
    'sine-projection': 'M493 6 L533 9 L534 100 Q523 120 506 117 L491 100Z',
    'helicoid': 'M452 73 L462 73 L465 92 L490 91 L489 104 L469 114 L464 137 L446 137 L445 117 L432 110 L431 100 L447 94Z',
    'dragonfly-wings': 'M475 123 L487 122 L489 130 Q516 126 522 136 L521 153 Q512 164 487 153 L487 181 L475 181 L475 153 Q447 164 442 153 L441 136 Q450 124 474 132Z',
    'globe': 'M113 9 L166 9 L166 58 L156 68 L154 82 L121 82 L122 68 L112 55Z',
    'globe-notes': 'M111 75 L163 71 L167 87 L197 84 L201 134 L111 134Z',
    'globe-right-notes': 'M167 23 L201 21 L201 84 L171 88 L164 66Z',
    'platonic-solids': 'M432 189 L448 189 L448 278 L430 278Z',
    'cathedral': 'M451 155 L467 155 L470 218 L490 200 L491 155 L505 154 L505 184 L550 155 L561 154 L562 269 L524 282 L523 255 L510 237 L495 244 L490 282 L449 283Z',
    'gyro': 'M568 4 L605 6 Q625 22 625 52 L629 89 Q586 103 539 89 L535 62 L540 28Z',
    'compass': 'M582 88 Q624 88 628 127 Q628 165 589 170 Q542 169 537 133 Q534 99 582 88Z',
    'lens-cone': 'M414 282 Q432 275 440 290 L432 318 L439 344 L436 355 L414 355 L412 344 L418 317 L411 294Z',
    'instrument-plans': 'M440 282 L490 280 L491 353 L439 355Z',
    'tesseract': 'M14 4 L110 3 L114 94 L15 98Z',
    'lower-hourglass': 'M35 283 Q56 287 56 307 L49 318 Q59 335 48 351 Q27 362 17 344 L17 327 L23 318 Q9 292 35 283Z',
    'right-surfaces': 'M563 165 L625 166 L628 259 L561 262Z',
    'bottom-geometry': 'M491 279 L627 277 L629 356 L489 356Z'
  };
  const omitted = new Set(['beetle-body', 'dragonfly-body', 'cathedral-left-spire', 'cathedral-right-spire']);
  const objects = regions.filter(item => !omitted.has(item.key)).map(item => {
    const result = { ...item, outline: outlines[item.key] || `M${item.box[0]} ${item.box[1]}h${item.box[2]}v${item.box[3]}h-${item.box[2]}Z` };
    if (item.key === 'stair-plan') Object.assign(result, { start: -180, end: 260, ghost: .36 });
    if (item.key === 'cells') Object.assign(result, { start: 65, end: 350 });
    if (item.key === 'exploded-machine') Object.assign(result, { start: 80, end: 505, ghost: .65 });
    if (item.key === 'shell') Object.assign(result, { start: 565, end: 700, ghost: .07 });
    if (item.key === 'spacecraft') Object.assign(result, { start: 575, end: 1010 });
    if (item.key === 'antenna') Object.assign(result, { start: 730, end: 1090 });
    if (item.key === 'cathedral') Object.assign(result, { start: 1040, end: 1620, coreStart: 945, coreEnd: 1320, core: 'M452 157L465 157L468 275L450 277ZM493 157L504 157L503 224L491 232Z' });
    if (item.key === 'beetle-limbs') Object.assign(result, { start: 485, end: 690, coreStart: 375, coreEnd: 535, core: 'M155 140Q181 135 181 156Q180 174 156 172Z' });
    if (item.key === 'dragonfly-wings') Object.assign(result, { start: 825, end: 1110, coreStart: 670, coreEnd: 930, core: 'M476 123Q487 120 488 140L485 181L476 181Z' });
    const innerEnds = { orbits: 680, hyperboloid: 660, well: 690, satellite: 690, pendulum: 690, volute: 700 };
    if (innerEnds[item.key]) result.end = innerEnds[item.key];
    const outerWindows = {
      'left-ratio': [850, 1060], 'rose-window': [830, 1050],
      'hourglass-curve': [840, 1080], 'sine-projection': [850, 1100],
      helicoid: [850, 1320]
    };
    if (outerWindows[item.key]) [result.start, result.end] = outerWindows[item.key];
    return result;
  });

  const innerParts = {
    'stair-plan': [{ key: 'fan', shape: '<circle cx="344" cy="114" r="20.8"/>', center: [344, 114] }],
    'gyro': [{ key: 'gimbal', shape: '<circle cx="585" cy="43" r="25.5"/>', center: [585, 43] }],
    'compass': [{ key: 'dial', shape: '<circle cx="584" cy="130" r="21"/>', center: [584, 130] }],
    'dragonfly-wings': [
      { key: 'wing-left', shape: '<path d="M477 133Q449 124 441 135L442 154Q453 165 477 147Z"/>', center: [478, 140] },
      { key: 'wing-right', shape: '<path d="M485 133Q513 124 523 135L522 154Q508 165 485 147Z"/>', center: [484, 140] }
    ]
  };
  const layouts = {
    'exploded-machine': { center: [245, 214], keys: [[0, -23, -5, 1.12], [250, -20, -3, 1.08], [750, -7, 0, 1.055], [1750, 0, 0, 1]] },
    'stair-plan': { center: [344, 114], keys: [[0, 6, -21, 1.26], [250, 6, -17, 1.15], [750, 2, -8, 1.08], [1750, 0, 0, 1]] },
    'stair-elevation': { center: [307, 169], keys: [[0, -3, -4, 1.10], [250, -3, -3, 1.09], [750, -1, 0, 1.04], [1750, 0, 0, 1]] },
    'cells': { center: [369, 164], keys: [[0, 8, -3, 1.12], [250, 8, -3, 1.12], [750, 3, -1, 1.04], [1750, 0, 0, 1]] },
    'shell': { center: [205, 350], keys: [[0, -6, 8, 1.15], [750, -6, 8, 1.15], [1750, 3, 4, 1]] },
    'spacecraft': { center: [282, 318], keys: [[0, -4, 4, 1.07], [750, -4, 4, 1.07], [1750, 0, 0, 1]] }
  };
  function interpolate(keys, time) {
    if (time <= keys[0][0]) return keys[0].slice(1);
    for (let i = 1; i < keys.length; i++) {
      if (time <= keys[i][0]) {
        const a = keys[i - 1], b = keys[i], progress = (time - a[0]) / (b[0] - a[0]);
        return a.slice(1).map((value, axis) => value + (b[axis + 1] - value) * progress);
      }
    }
    return keys[keys.length - 1].slice(1);
  }
  function waveAt(time) {
    const [cx, cy] = interpolate([[0, 172, 268], [517, 172, 268], [750, 177, 266], [1117, 184, 263], [1750, 191, 257], [2150, 192, 257]], time);
    const [size] = interpolate([[0, 1], [517, 1], [1117, .94], [1750, .88]], time);
    // 原294/321/355帧分别为中央高峰、较低偏右峰、中央再次起峰。
    // 按原片四角校正投影斜向，并重新拟合峰位；其他物件与显影时序保持原值。
    const [amplitude, peakU, peakV] = interpolate([
      [0, 33.1, .198, .233], [516.667, 33.1, .198, .233],
      [750, 30.9, .239, .259], [1116.667, 26.35, .3155, .3283],
      [1416.667, 24, .413, .444], [1750, -.855, -.233, 0],
      [2150, 5.651, -.255, 0], [2550, 29.4, .274, .29],
      [2650, 29.4, .274, .29]
    ], time);
    const project = (u, v) => {
      const z = amplitude * Math.exp(-((u - peakU) ** 2 / .32 + (v - peakV) ** 2 / 1.05)) - 5 * Math.exp(-((u + .75) ** 2 / .15 + v * v));
      return [cx + 1 + (46 * u + 34.7 * v) * size, cy + 2.7 - (1 - size) * 16.667 + (-11.74 * u + 16.33 * v - z) * size];
    };
    return Array.from({ length: 44 }, (_, index) => {
      const family = index < 22, fixed = ((index % 22) / 21) * 2 - 1;
      return Array.from({ length: 45 }, (_, step) => {
        const variable = step / 44 * 2 - 1, p = project(family ? fixed : variable, family ? variable : fixed);
        return (step ? 'L' : 'M') + number(p[0]) + ' ' + number(p[1]);
      }).join('');
    });
  }

  F['atlas-expand'] = (root, K, definition) => {
    const shared = material.paper;
    if (!shared || typeof shared.moonDefs !== 'function' || typeof shared.moonMarkup !== 'function') throw new Error('图鉴需要先载入 KimiOpen 的共享月球实现。');
    const prefix = 'kimi-atlas-' + (++instance), moonId = prefix + '-moon';
    const duration = Number(definition && definition.duration_ms) || SOURCE_DURATION;
    const paperId = prefix + '-paper';
    let definitions = shared.paperDefs(paperId) + shared.moonDefs(moonId);
    definitions += `<image id="${prefix}-sheet" href="${SHEET}" x="0" y="0" width="640" height="360" preserveAspectRatio="none"/>`;
    let body = '';
    const bounds = item => item.key === 'wave-surface' ? [80, 211, 210, 100] : [item.box[0] - 22, item.box[1] - 22, item.box[2] + 44, item.box[3] + 44];
    const rect = box => `x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}"`;
    objects.forEach((item, index) => {
      const id = `${prefix}-object-${index}`, box = bounds(item), parts = innerParts[item.key] || [];
      definitions += `<clipPath id="${id}-outline" clipPathUnits="userSpaceOnUse"><path d="${item.outline}"/></clipPath>`;
      definitions += `<filter id="${id}-grain" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" ${rect(box)} color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${number(.041 + (index % 4) * .003)} ${number(.071 + (index % 3) * .007)}" numOctaves="3" seed="${31 + index * 7}"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .2126 .7152 .0722 0 0"/><feComponentTransfer><feFuncA class="atlas-threshold" data-region="${item.key}" type="linear" slope="18" intercept="-10.44"/></feComponentTransfer></filter>`;
      definitions += `<mask id="${id}-reveal" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" ${rect(box)} style="mask-type:alpha"><rect class="atlas-ghost" data-region="${item.key}" ${rect(box)} fill="white" opacity="0"/><rect class="atlas-fragment-field" data-region="${item.key}" ${rect(box)} fill="white" filter="url(#${id}-grain)"/>${item.core ? `<path class="atlas-core" data-region="${item.key}" d="${item.core}" fill="white" opacity="0"/>` : ''}</mask>`;
      let content;
      if (item.key === 'wave-surface') {
        content = `<g class="atlas-wave-grid" fill="none" stroke="#252722" stroke-width=".47" stroke-linejoin="round">${Array.from({ length: 44 }, () => '<path class="atlas-wave-line"/>').join('')}</g>`;
      } else if (parts.length) {
        definitions += `<mask id="${id}-fixed" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="360" style="mask-type:luminance"><rect width="640" height="360" fill="white"/><g fill="black">${parts.map(part => part.shape).join('')}</g></mask>`;
        parts.forEach(part => { definitions += `<clipPath id="${id}-${part.key}">${part.shape}</clipPath>`; });
        content = `<use href="#${prefix}-sheet" mask="url(#${id}-fixed)"/>` + parts.map(part => `<g class="atlas-moving-part" data-part="${part.key}"><use href="#${prefix}-sheet" clip-path="url(#${id}-${part.key})"/></g>`).join('');
      } else content = `<use href="#${prefix}-sheet"/>`;
      // 每个物件都有自己的图片引用、轮廓和遮罩，图层运动不会带出邻近物件。
      body += `<g class="atlas-object" data-region="${item.key}" data-label="${item.label}" visibility="hidden"><g class="atlas-object-reveal" mask="url(#${id}-reveal)"><g ${item.key === 'wave-surface' ? '' : `clip-path="url(#${id}-outline)"`}>${content}</g></g></g>`;
    });
    // 注释只保留物件轮廓以外的原板部分，不能在运动后显回一张静态整板。
    definitions += `<mask id="${prefix}-annotations" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="360" style="mask-type:luminance"><rect width="640" height="360" fill="white"/><g fill="black">${objects.map(item => `<path d="${item.outline}"/>`).join('')}</g></mask>`;
    root.dataset.art = 'original'; root.style.background = '#e2e3dd';
    root.innerHTML = `<svg class="review-svg kimi-atlas-study" viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" ><defs>${definitions}</defs>${shared.paperMarkup(paperId)}<g class="atlas-world"><g class="atlas-plate" transform="translate(16 9) scale(.95)" style="mix-blend-mode:multiply" opacity=".89"><use class="atlas-annotation-completion" href="#${prefix}-sheet" mask="url(#${prefix}-annotations)" opacity="0"/>${body}</g><g class="atlas-moon">${shared.moonMarkup(moonId)}</g></g><rect class="atlas-next-cursor" x="267.3" y="212.3" width="13" height="3.5" fill="#10110f" visibility="hidden"/></svg>`;
    const query = (selector, key) => root.querySelector(selector + `[data-region="${key}"]`);
    const nodes = objects.map((item, index) => ({
      item, group: query('.atlas-object', item.key), ghost: query('.atlas-ghost', item.key), field: query('.atlas-fragment-field', item.key),
      reveal: query('.atlas-object', item.key).querySelector('.atlas-object-reveal'), revealMask: `url(#${prefix}-object-${index}-reveal)`, threshold: query('.atlas-threshold', item.key), core: query('.atlas-core', item.key), filter: `url(#${prefix}-object-${index}-grain)`, previous: null
    }));
    const moon = root.querySelector('.atlas-moon'), moonShade = moon.querySelector('.moon-shade'), moonShadow = root.querySelector('.moon-shadow-gradient');
    const world = root.querySelector('.atlas-world'), cursor = root.querySelector('.atlas-next-cursor');
    const annotations = root.querySelector('.atlas-annotation-completion');
    const waveLines = [...root.querySelectorAll('.atlas-wave-line')];
    const moving = [...root.querySelectorAll('.atlas-moving-part')];
    let disposed = false, last = null;
    const render = ms => {
      if (disposed) return;
      const time = clamp((Number.isFinite(ms) ? ms : 0) / duration) * SOURCE_DURATION;
      if (time === last) return; last = time;
      root.dataset.phase = time >= 2600 ? 'clear' : time >= 1850 ? 'complete' : 'develop';
      world.style.display = time >= 2600 ? 'none' : '';
      cursor.setAttribute('visibility', time >= 2600 ? 'visible' : 'hidden');
      const [x, y, radius] = moonAt(time);
      moon.setAttribute('transform', `translate(${number(x)} ${number(y)}) scale(${number(radius / 80)})`);
      moon.setAttribute('data-radius', number(radius));
      if (moonShadow) moonShadow.setAttribute('x2', '57%');
      if (moonShade) moonShade.setAttribute('opacity', number(1 - .50 * ease(time / 290)));
      for (const node of nodes) {
        const { item } = node;
        const progress = ease((time - item.start) / (item.end - item.start));
        const coreProgress = item.core ? ease((time - item.coreStart) / (item.coreEnd - item.coreStart)) : 0;
        node.group.setAttribute('data-progress', number(progress));
        node.group.setAttribute('visibility', progress === 0 && coreProgress === 0 ? 'hidden' : 'visible');
        const layout = layouts[item.key];
        if (layout) {
          const [dx, dy, scale] = interpolate(layout.keys, time), [cx, cy] = layout.center;
          node.group.setAttribute('transform', `translate(${number(dx + cx)} ${number(dy + cy)}) scale(${number(scale*(item.key === 'shell' ? .88 : 1))} ${number(scale*(item.key === 'shell' ? 1.025 : 1))}) translate(${-cx} ${-cy})`);
        }
        if (item.key === 'stair-plan') node.group.setAttribute('opacity', number(.13 + .87 * ease(time / 200)));
        if (item.key === 'exploded-machine') node.group.setAttribute('opacity', number(.30 + .70 * ease((time - 245) / 290)));
        if (progress !== node.previous) {
          node.previous = progress;
          if(progress===1)node.reveal.removeAttribute('mask');else node.reveal.setAttribute('mask',node.revealMask);
          node.ghost.setAttribute('opacity', number(item.ghost * Math.sin(progress * Math.PI)));
          node.field.setAttribute('visibility', progress === 0 ? 'hidden' : 'visible');
          node.field.setAttribute('filter', progress === 1 ? 'none' : node.filter);
          node.threshold.setAttribute('intercept', number(-18 * (.75 - .50 * progress)));
        }
        if (node.core) node.core.setAttribute('opacity', number(coreProgress));
      }
      waveAt(time).forEach((path, index) => waveLines[index].setAttribute('d', path));
      for (const part of moving) {
        const kind = part.dataset.part;
        let cx, cy, angle, sy = 1;
        if (kind === 'fan') { cx = 344; cy = 114; angle = -20 + time * .026; }
        else if (kind === 'gimbal') { cx = 585; cy = 43; angle = 9 * Math.sin((time - 1500) * .0042); }
        else if (kind === 'dial') { cx = 584; cy = 130; angle = (time - 1600) * .018; }
        else { cx = kind === 'wing-left' ? 478 : 484; cy = 140; angle = (kind === 'wing-left' ? -1 : 1) * (4 + 5 * Math.sin(time * .013)); sy = .84 + .16 * Math.cos(time * .013); }
        part.setAttribute('transform', `translate(${cx} ${cy}) rotate(${number(angle)}) scale(1 ${number(sy)}) translate(${-cx} ${-cy})`);
      }
      annotations.setAttribute('opacity', number(ease((time - 1450) / 350)));
    };
    render.destroy = () => { disposed = true; };
    return render;
  };
})();
/* 点云接圆柱：共享开头的颗粒，点先聚拢，再按列补足空间连线。 */
(function(){'use strict';
 const base=parts['dots-wireframe'],clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,p)=>a+(b-a)*p;
 const ease=p=>{p=clamp(p);return p*p*(3-2*p);};
 const map=(t,keys)=>{for(let i=1;i<keys.length;i++)if(t<=keys[i][0])return mix(keys[i-1][1],keys[i][1],clamp((t-keys[i-1][0])/(keys[i][0]-keys[i-1][0])));return keys.at(-1)[1];};
 parts['dots-wireframe']=(root,K,d)=>{
  const paperId=uid('dots-paper'),old=base(root,K,{...d,duration_ms:2550,kimiOpen:true});const svg=root.querySelector('svg');svg.querySelectorAll(':scope > rect,:scope > path:not(.wire-cloud)').forEach(e=>e.remove());
  svg.querySelector('defs').insertAdjacentHTML('beforeend',material.paper.paperDefs(paperId));svg.querySelector('defs').insertAdjacentHTML('afterend',material.paper.paperMarkup(paperId));svg.insertAdjacentHTML('beforeend',material.paper.marginalia(16));
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;canvas.style.cssText='position:absolute;inset:0;width:640px;height:360px;pointer-events:none';root.append(canvas);const ctx=canvas.getContext('2d'),cloudNode=svg.querySelector('.wire-cloud'),pointsNode=svg.querySelector('.wire-points'),lineNodes=Array.from(svg.querySelectorAll('.wire-lines path')),pointNodes=Array.from(svg.querySelectorAll('.wire-points rect'));let last=-1,disposed=false;
  const render=ms=>{if(disposed||last===ms)return;last=ms;
   old(ms);
   cloudNode.setAttribute('opacity','0');pointsNode.setAttribute('opacity',ease((ms-800)/250));
   lineNodes.forEach((el,i)=>{const column=i/lineNodes.length*3|0,start=[883,950,950][column],full=[1117,1050,1283][column],fadeStart=[1550,1450,1383][column],fadeEnd=[1683,1617,1583][column],early=ease((ms-start)/(full-start))*(1-ease((ms-fadeStart)/(fadeEnd-fadeStart))),later=ease((ms-(1800+column*100))/210);el.setAttribute('opacity',Number(el.getAttribute('opacity'))*Math.max(early,later)*.72);});
   pointNodes.forEach(el=>el.setAttribute('opacity',Math.min(1,Number(el.getAttribute('opacity'))*1.5)));
   ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,640,360);material.particles.draw(ctx,3.55+ms/1000);
  };render.destroy=preserve=>{disposed=true;old.destroy?.();if(!preserve)canvas.width=canvas.height=0;};return render;
 };
})();
/* Kimi 原片 6.10—8.10 秒：字符切柱 → 点阵环柄 → 棋盘 → 像素三球。 */
(function () {
  'use strict';
  const F = parts;
  const clamp = x => Math.max(0, Math.min(1, x));
  const n = x => Number(x.toFixed(3));
  const rectPath = (x,y,w,h) => `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}Z`;
  const rand = i => { const v = Math.sin(i * 127.1 + 41.2) * 43758.5453; return v - Math.floor(v); };
  const lerpKeys = (keys,t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i=1;i<keys.length;i++) if(t<=keys[i][0]) {
      const a=keys[i-1], b=keys[i], q=(t-a[0])/(b[0]-a[0]);
      return a[1]+(b[1]-a[1])*q;
    }
    return keys[keys.length-1][1];
  };
  const centers=[200.5,321.5,442.5], ballCenters=[186.67,320.33,452.67];
  const cell=5.6, left=128, top=55.3;
  let instance=0;

  // 用同一网格构成上部的宽环和下部长柄；环内的空白也随格子边界走。
  function insideShape(x,y,c) {
    if(y<55.3||y>296) return false;
    const dx=Math.abs(x-centers[c]);
    const outer=y<80?72.4:y<91.7?61.2:y<103?50:y<114.3?44.4:y<125.5?33.2:y<136.7?22:y<140?16.4:12.6;
    const hole=y<80?0:y<91.7?27.5:y<119.9?18:0;
    return dx<=outer && !(hole>0&&dx<hole);
  }
  const cells=[];
  for(let row=0;row<43;row++) for(let col=0;col<70;col++) {
    const x=left+col*cell,y=top+row*cell, cx=x+cell/2,cy=y+cell/2;
    const c=Math.min(2,Math.max(0,Math.round((cx-centers[0])/121)));
    if(insideShape(cx,cy,c)) cells.push({x,y,c,row,col});
  }
  const dots=[];
  for(let row=0;row<22;row++)for(let col=0;col<35;col++){
    const x=134.3+col*11.2,y=57.6+row*11.2;
    const c=Math.min(2,Math.max(0,Math.round((x-centers[0])/121)));
    if(insideShape(x,y,c))dots.push({x,y,c,row,col});
  }
  const ringShapePath = cells.map(v=>rectPath(v.x,v.y,cell+.01,cell+.01)).join('');
  const bases=[85.3,126.3,167.3,208.3,249.3,290.3];
  // 原片184帧左柱底部先露右侧字符，顶部只有短头；两端随后向中部接力。
  const codeStarts=[
    [6.075,6.140,6.213,6.160,6.130,6.065],
    [6.160,6.240,6.325,6.285,6.215,6.135],
    [6.250,6.350,6.430,6.450,6.310,6.225]
  ];
  const codeFull=[
    [6.160,6.230,6.300,6.265,6.190,6.120],
    [6.255,6.340,6.425,6.390,6.300,6.220],
    [6.350,6.450,6.530,6.550,6.420,6.310]
  ];
  const symbols='0010··1··*··0··01···0·1*··';
  const codeLine=(seed,len=67)=>Array.from({length:len},(_,i)=>symbols[Math.floor(rand(seed+i*7)*symbols.length)]).join('');
  const arrival=v=> {
    if(v.c===0)return 6.965+(v.y-55)/1150+(v.x-128)*.00015;
    if(v.c===1)return 6.978+(v.y-55)/1350+(v.x-273)*.00012;
    return 7.065+(v.y-55)/2500+Math.max(0,v.x-395)*.0006;
  };
  function patternLimit(v,t){
    if(v.c===2 && v.x>(v.y<90?454:465))return false;
    const limit=lerpKeys([[7.0,155],[7.10,208],[7.233,236],[7.367,253],[7.50,250]],t);
    const end=limit+(v.c===1?lerpKeys([[7.10,0],[7.233,27],[7.367,22],[7.50,0]],t):0);
    return v.y<=end;
  }
  function keepCell(v,t){
    if(t<7.42)return true;
    const c=v.c;
    const minY=lerpKeys(c===0?[[7.42,55],[7.50,55],[7.633,92],[7.767,128],[7.80,148]]:
      c===1?[[7.42,55],[7.50,55],[7.633,60],[7.767,92],[7.833,115],[7.867,145]]:
      [[7.42,55],[7.50,55],[7.633,80],[7.70,110],[7.767,146]],t);
    const maxY=lerpKeys(c===1?[[7.42,296],[7.50,250],[7.633,184],[7.70,151],[7.767,141],[7.833,128],[7.867,120]]:
      [[7.42,296],[7.50,250],[7.633,184],[7.767,141],[7.80,128]],t);
    if(v.y<minY||v.y>maxY)return false;
    if(c===0){
      const cut=lerpKeys([[7.42,128],[7.50,188],[7.633,245],[7.767,286],[7.80,315]],t);
      if(v.x<cut-(v.y-55)*1.5)return false;
      if(t>7.70&&v.x>lerpKeys([[7.70,230],[7.767,213],[7.80,208]],t))return false;
    }
    if(c===1&&t>7.633&&v.x>lerpKeys([[7.633,384],[7.767,344],[7.833,333]],t))return false;
    if(c===2&&v.x>lerpKeys([[7.42,515],[7.50,487],[7.633,467],[7.767,430]],t))return false;
    return true;
  }

  F['kimi-open-bridge']=(root,K,definition)=>{
    const shared=material.paper;
    if(!shared||!F['dots-wireframe'])throw new Error('连接段需要纸面共用文件和点阵圆柱先载入。');
    const id='kimi-bridge-'+(++instance), duration=Number(definition&&definition.duration_ms)||2000;
    const wireRoot=document.createElement('div');
    const wireRenderer=F['dots-wireframe'](wireRoot,K,{id:'dots-wireframe',duration_ms:2550});
    wireRenderer(2550);
    const wireMarkup=['.wire-lines','.wire-points'].map(q=>wireRoot.querySelector(q).outerHTML).join('');
    const textMarkup=bases.map((y,j)=>[0,1,2].map(c=>`<g class="bridge-code-band" data-column="${c}" data-band="${j}"><g clip-path="url(#${id}-code-window-${c}-${j})"><text x="128" y="${y}">${codeLine(c*700+j*41)}</text><text x="128" y="${y+6.6}">${codeLine(c*700+j*41+19)}</text></g></g>`).join('')).join('');
    const codeClips=bases.map((y,j)=>[0,1,2].map(c=>`<clipPath id="${id}-code-window-${c}-${j}"><rect class="bridge-code-window" x="0" y="50" width="0" height="255"/></clipPath>`).join('')).join('');
    const oldClips=[0,1,2].map(c=>`<clipPath id="${id}-old-${c}"><rect x="${202+c*84}" y="50" width="67" height="255"/></clipPath>`).join('');
    const ringClips=[0,1,2].map(c=>`<clipPath id="${id}-ring-${c}"><path d="${cells.filter(v=>v.c===c).map(v=>rectPath(v.x,v.y,cell,cell)).join('')}"/></clipPath>`).join('');
    const ballCode=[0,1,2].map(c=>`<g class="bridge-ball-code" data-ball="${c}"><text x="${ballCenters[c]-39}" y="164.2">${codeLine(800+c*61,28)}</text><text x="${ballCenters[c]-39}" y="170.8">${codeLine(819+c*61,28)}</text><text class="lower-code" x="${ballCenters[c]-39}" y="204.7">${codeLine(863+c*61,28)}</text><text class="lower-code" x="${ballCenters[c]-39}" y="211.3">${codeLine(891+c*61,28)}</text></g>`).join('');
    root.dataset.art='original';root.style.background='#e2e3dd';
    root.innerHTML=`<svg class="review-svg kimi-bridge-study" viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg"><defs>${shared.paperDefs(id+'-paper')}<clipPath id="${id}-wire"><path class="bridge-wire-clip"/></clipPath><filter id="${id}-soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur class="bridge-wire-blur" stdDeviation="0"/></filter>${oldClips}${ringClips}${codeClips}<clipPath id="${id}-shape"><path d="${ringShapePath}"/></clipPath></defs>${shared.paperMarkup(id+'-paper')}${shared.marginalia(16)}<g class="bridge-wire" clip-path="url(#${id}-wire)" filter="url(#${id}-soft)">${wireMarkup}</g><path class="bridge-dots" fill="#11120f"/><g class="bridge-code" font-family="Arial,sans-serif" font-size="5.5" letter-spacing="-.15" fill="#11120f">${textMarkup}</g><path class="bridge-cell-paper" fill="#e2e3dd"/><path class="bridge-solid" fill="#090a07"/><path class="bridge-checker" fill="#090a07"/><path class="bridge-triangles" fill="#090a07"/><g class="bridge-ball-codes" font-family="Arial,sans-serif" font-size="5.5" letter-spacing="-.15" fill="#11120f">${ballCode}</g></svg><canvas class="bridge-ball-layer" width="640" height="360" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>`;
    const query=q=>root.querySelector(q);
    const wire=query('.bridge-wire'),wireClip=query('.bridge-wire-clip'),blur=query('.bridge-wire-blur');
    const dotNode=query('.bridge-dots'),paperCells=query('.bridge-cell-paper'),solid=query('.bridge-solid'),checker=query('.bridge-checker'),triangles=query('.bridge-triangles');
    const codeNodes=Array.from(root.querySelectorAll('.bridge-code-band'));
    const codeWindows=Array.from(root.querySelectorAll('.bridge-code-window'));
    const ballCodeNodes=Array.from(root.querySelectorAll('.bridge-ball-code'));
    const canvas=query('.bridge-ball-layer'),ctx=canvas.getContext('2d',{willReadFrequently:true});
    const mosaic=document.createElement('canvas'),mctx=mosaic.getContext('2d',{willReadFrequently:true});
    const sphere=material.images.get('fiber.png');
    let sphereHeadRenderer=null,sphereHeadRoot=null,sphereHead=null;
    // 末端直接共享下一段的首帧主体、纤维方向与阶梯遮罩，避免接缝跳变。
    if(F['spheres-unite']){
      sphereHeadRoot=document.createElement('div');
      sphereHeadRenderer=F['spheres-unite'](sphereHeadRoot,K,{id:'spheres-unite',duration_ms:1250});
      sphereHeadRenderer(0);
      const source=sphereHeadRoot.querySelector('svg');
      const markup=(source.querySelector('defs').outerHTML+source.querySelector('.fiber-spheres').outerHTML).replaceAll('kimi-three-spheres',id+'-tail');
      root.insertAdjacentHTML('beforeend',`<svg class="review-svg bridge-sphere-tail" viewBox="0 0 640 360" opacity="0" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" xmlns="http://www.w3.org/2000/svg">${markup}</svg>`);
      sphereHead=query('.bridge-sphere-tail');
    }
    let disposed=false,last=null,sourceTime=6.1;
    function drawBalls(t){
      if(disposed||!ctx)return;
      ctx.clearRect(0,0,640,360);
      const tailOpacity=sphereHead?clamp((t-8.082)/.018):0;
      if(sphereHead)sphereHead.setAttribute('opacity',n(tailOpacity));
      canvas.style.opacity=String(n(1-tailOpacity));
      if(t<7.817){canvas.dataset.pixelSize='0';canvas.dataset.revealTop='241';return;}
      // 外形是从下部逐层建起来；清晰度同时从粗格走向纤维，而非整球淡入。
      const size=lerpKeys([[7.817,13],[7.9,8.1],[7.967,4.3],[8.033,2.6],[8.1,.7]],t);
      const revealTop=lerpKeys([[7.817,219],[7.833,213],[7.9,176],[7.967,151],[8.033,138],[8.1,122]],t);
      canvas.dataset.pixelSize=n(size);canvas.dataset.revealTop=n(revealTop);
      if(!sphere.complete||!sphere.naturalWidth)return;
      const resolution=Math.max(10,Math.round(132.878/size));
      mosaic.width=resolution;mosaic.height=resolution;
      for(let i=0;i<3;i++){
        const cx=ballCenters[i];
        // 先把纹理旋转到低分辨率画布，再水平垂直放大；像素格本身不旋转。
        const factor=resolution/132.878;
        const drift=[-.8,.401,1.458][i],variant=[-7,0,11][i];
        mctx.setTransform(1,0,0,1,0,0);mctx.clearRect(0,0,resolution,resolution);
        mctx.imageSmoothingEnabled=true;
        mctx.setTransform(factor,0,0,factor,67.0747*factor,66.9688*factor);
        mctx.rotate((drift+variant)*Math.PI/180);
        mctx.scale(i===0?-1:1,i===2?-1:1);
        mctx.drawImage(sphere,-67.0747,-66.9688,132.878,132.878);
        ctx.save();
        // 粗像素阶段先呈扁球，再逐步长高，最终与下一段的完整纤维球重合。
        const aspect=lerpKeys([[7.817,.78],[7.9,.82],[7.967,.94],[8.033,1],[8.1,1]],t);
        ctx.translate(cx,179.33);ctx.scale(1,aspect);ctx.translate(-cx,-179.33);ctx.beginPath();
        for(let x=-69.3;x<69.3;x+=12.6){
          const center=x+6.3;
          const plateau=lerpKeys([[7.817,6.3],[7.9,12.6],[8.033,25.2],[8.1,37.8]],t);
          const staircase=Math.ceil(Math.max(0,Math.abs(center)-plateau)/18.9)*12.6;
          const yy=Math.min(237,revealTop+staircase);
          ctx.rect(cx+x,yy,12.64,Math.max(0,241-yy));
        }
        ctx.clip();
        if(t>=8.033){
          ctx.beginPath();ctx.rect(cx-72,179.33-72,144,144);
          [[-72,-72,47,29],[-72,-43,34,13],[-72,-30,22,38],[51,-43,21,51],[38,-72,34,29]].forEach(r=>ctx.rect(cx+r[0],179.33+r[1],r[2],r[3]));
          if(t>=8.05&&t<8.095)ctx.rect(cx-12.6,107.33,25.2,30);
          ctx.clip('evenodd');
        }
        ctx.imageSmoothingEnabled=t>=8.085;
        ctx.drawImage(mosaic,cx-67.0747,179.33-66.9688,132.878,132.878);
        ctx.restore();
      }
    }
    // 所需纹理已由共用准备队列解码，不为每个预览重复挂载加载回调。
    const render=ms=>{
      if(disposed)return;
      const t=6.1+clamp((Number.isFinite(ms)?ms:0)/duration)*2;
      if(t===last)return;last=t;sourceTime=t;
      root.dataset.sourceTime=n(t);
      root.dataset.phase=t<6.67?'cut-columns':t<6.965?'dot-stems':t<7.42?'checker-stems':t<7.817?'dissolve':'pixel-spheres';
      let wirePath='';
      for(let c=0;c<3;c++){
        const p=c===2?Math.pow(clamp((t-6.37)/.33),2):clamp((t-6.18-c*.08)/.43);
        if(p>=1)continue;
        for(let col=0;col<6;col++){
          const x=201+c*84+col*11.6;
          const y0=p===0?48:55+p*180+(5-col)*12*p;
          const y1=p===0?311:305-p*85-col*11*p;
          if(y1>y0)wirePath+=rectPath(x,Math.floor(y0/11.2)*11.2,11.7,Math.ceil((y1-y0)/11.2)*11.2);
        }
      }
      wireClip.setAttribute('d',wirePath);wire.setAttribute('visibility',wirePath?'visible':'hidden');
      blur.setAttribute('stdDeviation',n(clamp((t-6.18)/.3)*.55));
      let dp='',pp='',sp='',cp='',tp='';
      for(const v of dots){
        const enter=[6.53,6.795,6.57][v.c]+(v.y-55)*.00012;
        if(t<enter||!keepCell(v,t)||(patternLimit(v,t)&&t>=arrival(v)))continue;
        dp+=`M${n(v.x-1)} ${n(v.y)}a1 1 0 1 0 2 0a1 1 0 1 0-2 0`;
      }
      for(const v of cells){
        if(!keepCell(v,t)||!patternLimit(v,t))continue;
        const age=t-arrival(v);
        if(age<0)continue;
        const tile=rectPath(v.x,v.y,cell+.015,cell+.015);
        pp+=tile;
        const endY=lerpKeys([[7.42,296],[7.5,250],[7.767,140]],t);
        const stemEnd=lerpKeys([[7.10,208],[7.233,236],[7.367,253],[7.50,250]],t)+(v.c===1?lerpKeys([[7.10,0],[7.233,27],[7.367,22],[7.50,0]],t):0);
        const nearExit=v.y>stemEnd-22||(t>7.70&&v.c===1&&v.x>310);
        const fixedTriangle=v.c===2&&(v.x>433||(v.y<80&&v.x>419));
        const checkerDelay=v.c===2?.115+Math.max(0,v.x-400)*.002:.12;
        if(age<.031)sp+=tile;
        else if(age<checkerDelay||nearExit||fixedTriangle){
          // 每11.2大格由四个5.6格合成风车，每小格只放一枚可读三角。
          const x=v.x,y=v.y,s=cell,quadrant=(v.row%2)*2+v.col%2;
          if(quadrant===0)tp+=`M${n(x)} ${n(y)}L${n(x+s)} ${n(y+s)}V${n(y)}Z`;
          else if(quadrant===1)tp+=`M${n(x+s)} ${n(y)}L${n(x)} ${n(y+s)}H${n(x+s)}Z`;
          else if(quadrant===2)tp+=`M${n(x)} ${n(y+s)}L${n(x+s)} ${n(y)}H${n(x)}Z`;
          else tp+=`M${n(x+s)} ${n(y+s)}L${n(x)} ${n(y)}V${n(y+s)}Z`;
        }else if((v.col+v.row)%2===0)cp+=tile;
      }
      // 原片在棋盘显影前有一拍大黑块跳入，块的位置来自第 210 帧。
      if(t>=6.948&&t<7.075){
        const extent=clamp((t-6.948)/.045);
        sp+=rectPath(128,55.3,145.7,7.8);
        if(extent>.35)sp+='M309 63h25v5h35v-5h40v11h22v7h-27v11h26v25h13v102h-14v-78h-12v-12h-11v-12h-7v-22h-17v-9h-29v10h-20v-6h12v-9h-47v-7h11ZM286 86h11v7h12v48h-12v-12h-12v-12h-9v-9h10ZM309 197h11v11h14v33h-25Z';
      }
      if(t>=7.10&&t<7.55){
        const rightTop=lerpKeys([[7.10,55.3],[7.40,55.3],[7.55,95]],t);
        sp+=rectPath(477,rightTop,11.2,41)+rectPath(488,rightTop+8,11.2,29)+rectPath(488,rightTop+37,2.6,24);
        if(t<7.44){
          const yy=lerpKeys([[7.10,230],[7.233,253],[7.367,275],[7.44,286]],t);
          sp+=rectPath(188,yy,25,11.2)+rectPath(309,Math.min(286,yy+22),25,11.2);
          if(t<7.31)sp+=rectPath(430,yy+11,25,11.2)+rectPath(430,yy+22,13.8,11.2);
        }
      }
      if(t>=7.70&&t<7.825){
        sp+=rectPath(353.8,92,16,16.5)+rectPath(365,108.5,4.8,8.4);
        if(t<7.80)for(const xx of [426,437.2,448.4])dp+=`M${xx-.7} 136.5a.7 .7 0 1 0 1.4 0a.7 .7 0 1 0-1.4 0`;
      }
      dotNode.setAttribute('d',dp);paperCells.setAttribute('d',pp);solid.setAttribute('d',sp);checker.setAttribute('d',cp);triangles.setAttribute('d',tp);
      codeNodes.forEach(el=>{
        const c=Number(el.dataset.column),band=Number(el.dataset.band),y=bases[band];
        const middleBottom=c===1&&band===5&&t>=6.63;
        const ring=t>=[6.53,6.795,6.57][c]||middleBottom;
        const enter=codeStarts[c][band];
        const leave=6.99+(y-55)/1100+c*.007;
        const centerGap=c===1&&t>=6.63&&t<6.795&&band!==5;
        el.setAttribute('visibility',t>=enter&&t<leave&&!centerGap?'visible':'hidden');
        el.setAttribute('clip-path',`url(#${id}-${ring?'ring':'old'}-${c})`);
        el.querySelectorAll('text').forEach(node=>node.setAttribute('x',ring?centers[c]-72.5:202+c*84));
        const width=ring?390:67*clamp((t-enter)/(codeFull[c][band]-enter));
        const windowX=ring?128:202+c*84+(band>=3?67-width:0);
        codeWindows[band*3+c].setAttribute('x',n(windowX));
        codeWindows[band*3+c].setAttribute('width',n(width));
      });
      ballCodeNodes.forEach((el,i)=>{
        el.setAttribute('display',t>=7.595+i*.018&&t<7.967?'inline':'none');
        const upper=el.querySelectorAll('text:not(.lower-code)');
        upper.forEach(node=>node.setAttribute('visibility',t>=7.695?'visible':'hidden'));
        el.querySelectorAll('.lower-code').forEach(node=>node.setAttribute('visibility',t<7.835?'visible':'hidden'));
        const width=lerpKeys([[7.767,76],[7.9,100]],t);
        el.querySelectorAll('text').forEach(node=>{node.setAttribute('x',n(ballCenters[i]-width/2));node.setAttribute('textLength',n(width));node.setAttribute('lengthAdjust','spacingAndGlyphs');});
      });
      drawBalls(t);
    };
    render.destroy=preserve=>{
      if(disposed)return;disposed=true;
      if(wireRenderer.destroy)wireRenderer.destroy();
      if(sphereHeadRenderer&&sphereHeadRenderer.destroy)sphereHeadRenderer.destroy();
      if(sphereHeadRoot)sphereHeadRoot.replaceChildren();
      wireRoot.replaceChildren();mosaic.width=0;mosaic.height=0;
      if(!preserve){if(ctx)ctx.clearRect(0,0,640,360);canvas.width=canvas.height=0;}
    };
    return render;
  };
}());

function initializeKeyParts(){
 if(material.keyPartsReady)return;
 material.keyShapes=global.WiseMaterialKeyShapes;
/* 开头：关键书法姿态的矢量路径与正确加权合成；字形颗粒和点云共享同一粒子场。 */
(function(){
'use strict';
const F=parts, data=material.keyShapes.opening;
const clamp=v=>Math.max(0,Math.min(1,v)), mix=(a,b,p)=>a+(b-a)*p;
const smooth=(x,a,b)=>{const p=clamp((x-a)/(b-a));return p*p*(3-2*p);};
const random=i=>{const v=Math.sin(i*127.1+31.73)*43758.5453;return v-Math.floor(v);};
// 只缓存相邻姿态的透明画布。每档墨色合成一条路径，不再匹配或拉扯碎墨。
const poseCache=new Map(),poseWidth=624,poseHeight=720;
function pose(index){
 if(poseCache.has(index)){const hit=poseCache.get(index);poseCache.delete(index);poseCache.set(index,hit);return hit;}
 const canvas=document.createElement('canvas');canvas.width=poseWidth;canvas.height=poseHeight;
 const ctx=canvas.getContext('2d');ctx.setTransform(2,0,0,2,-320,0);
 for(const layer of data[index].layers){ctx.fillStyle=layer.color;ctx.fill(new Path2D(layer.path),'evenodd');}
 poseCache.set(index,canvas);
 // 双向定位时也只保留三张区域缓存，避免整段姿态占用上百兆内存。
 while(poseCache.size>3){const old=poseCache.keys().next().value;poseCache.get(old).width=0;poseCache.delete(old);}
 return canvas;
}
const blended=document.createElement('canvas');blended.width=poseWidth;blended.height=poseHeight;
const blendCtx=blended.getContext('2d');let blendFrame=-1;
function drawGlyph(ctx,frame,opacity=1){
 if(!blended.width){blended.width=poseWidth;blended.height=poseHeight;blendFrame=-1;}
 let index=0;while(index<data.length-1&&frame>=data[index+1].frame)index++;
 const next=data[index+1],q=next?clamp((frame-data[index].frame)/(next.frame-data[index].frame)):0;
 const a=pose(index);let source=a;
 if(q>.00001&&next){
  if(frame!==blendFrame){const b=pose(index+1);blendCtx.setTransform(1,0,0,1,0,0);blendCtx.clearRect(0,0,poseWidth,poseHeight);blendCtx.globalCompositeOperation='source-over';blendCtx.globalAlpha=1-q;blendCtx.drawImage(a,0,0);blendCtx.globalCompositeOperation='lighter';blendCtx.globalAlpha=q;blendCtx.drawImage(b,0,0);blendCtx.globalAlpha=1;blendCtx.globalCompositeOperation='source-over';blendFrame=frame;}
  source=blended;
 }
 ctx.save();ctx.globalAlpha=opacity;ctx.drawImage(source,160,0,312,360);ctx.restore();
}
// 左下鼓起、右上隆起和两端斜切，来自原片字符团的独立上下边。
const bandX=[171,176,184,196,216,240,264,288,312,336,360,384,400,416,432,444,449];
const bandTop=[168,163,163,163,164,159,152,149,145,143,138,134,135,143,153,161,173];
const bandBottom=[181,190,200,211,224,224,222,212,208,207,204,201,200,199,203,200,190];
function edgeAt(values,x,xs=bandX){let i=1;while(i<xs.length-1&&x>xs[i])i++;return mix(values[i-1],values[i],clamp((x-xs[i-1])/(xs[i]-xs[i-1])));}
function bandPoint(x,v,inset=0){return [x,mix(edgeAt(bandTop,x)+inset,edgeAt(bandBottom,x)-inset,v)];}
// 二的上短横与下长横分别保留落笔厚度、向右抬升和收笔肩。
const shortX=[275.1,280.6,288.5,299.5,312.1,323.9,335.8,345.2,353.9,359.4];
const shortTop=[130,123.5,121.4,118.5,117,114.1,112,118.5,129.3,138];
const shortBottom=[135.1,148.8,156.1,159,155.3,152.4,149.6,146.7,144.5,141.6];
const longX=[213.5,220.1,229.5,244.6,263.4,286,312.4,338.8,367.1,385.9,395.3,404.7,414.2,425.5,434];
const longTop=[215,213.2,212.3,207.7,202.3,197.8,195.1,191.5,191.5,189.7,187.9,189.7,198.7,206.8,219.5];
const longBottom=[230.3,242.1,252,255.6,252.9,246.6,241.2,235.7,233.9,233.9,235.7,240.3,243,240.3,225.8];
function strokePoint(u,v,xs,top,bottom){const x=mix(xs[0],xs.at(-1),u);return [x,mix(edgeAt(top,x,xs),edgeAt(bottom,x,xs),v)];}
let particles=null,characters=null,buckets=null;
function particleData(){
 if(particles)return particles;
 const mask=document.createElement('canvas');mask.width=1280;mask.height=720;const c=mask.getContext('2d');c.scale(2,2);drawGlyph(c,76);const pixels=c.getImageData(0,0,1280,720).data,cells=[];
 for(let x=176;x<459;x+=2.9)for(let y=27;y<336;y+=2.35){const i=(Math.round(y*2)*1280+Math.round(x*2))*4;if(pixels[i+3]>0&&pixels[i]<155)cells.push([x,y]);}
 characters=[];for(let x=176;x<459;x+=3.25)for(let y=27;y<336;y+=5.45){const i=(Math.round(y*2)*1280+Math.round(x*2))*4;if(pixels[i+3]>0&&pixels[i]<155)characters.push({origin:[x,y],index:characters.length});}
 const columns=new Map();characters.forEach(p=>{const x=p.origin[0];if(!columns.has(x))columns.set(x,[]);columns.get(x).push(p);});const minX=Math.min(...columns.keys()),maxX=Math.max(...columns.keys());columns.forEach(column=>{const x=171+(column[0].origin[0]-minX)/(maxX-minX)*278,height=edgeAt(bandBottom,x)-edgeAt(bandTop,x),count=Math.min(column.length,Math.max(1,Math.floor(height/6.2))),keep=new Set(Array.from({length:count},(_,i)=>Math.round(count>1?i*(column.length-1)/(count-1):column.length/2)));column.forEach((p,index)=>{p.order=column.length>1?index/(column.length-1):.5;p.keepInBand=keep.has(index);});});
 characters.forEach(p=>{p.h=5.4+random(p.index+613)*1.1;const x=171+(p.origin[0]-minX)/(maxX-minX)*278;p.target=bandPoint(x,p.order,p.h/2);});
 particles=Array.from({length:17400},(_,i)=>{
  const u=random(i+19),v=random(i+178),w=random(i+811),g=i%10,a=u*Math.PI*2;
  const col=Math.floor(u*220),row=Math.floor(v*32);
  let start=bandPoint(171+col/219*278+(w-.5)*2.4,row/31);
  if(i%9===0){start[0]+=(random(i+973)-.5)*8;start[1]+=(w-.5)*8;}
  const lead=i<characters.length;if(lead)start=characters[i].target;
  const origin=lead?characters[i].origin:cells[(i*61+Math.floor(w*37))%cells.length];let mid;const gauss=Math.sqrt(-2*Math.log(.04+v*.96));
  if(g<3)mid=[319+Math.cos(a)*73*gauss,139+Math.sin(a)*37*gauss];
  else if(g<5)mid=strokePoint(u,v,shortX,shortTop,shortBottom);
  else mid=strokePoint(u,v,longX,longTop,longBottom);
  return{origin,start,mid,lead,end:[320+(u-.5)*(i%3===2?282:166),84+i%3*98+(v-.5)*40-(u-.5)*20],g,bucket:i%3,r:g<3?.92+random(i+1499)*.46:.62+random(i+1499)*.70,retention:random(i+90003),index:i};
 });mask.width=mask.height=0;buckets=[0,1,2,3,4,5].map(key=>particles.filter(p=>p.bucket===key%3&&Number(p.g===3||p.g===4)===Math.floor(key/3)));return particles;
}
const map=(t,keys)=>{for(let i=1;i<keys.length;i++)if(t<=keys[i][0])return mix(keys[i-1][1],keys[i][1],clamp((t-keys[i-1][0])/(keys[i][0]-keys[i-1][0])));return keys.at(-1)[1];};
function drawParticles(ctx,t){
 const pool=particleData(),collapse=smooth(t,3.20,3.24),charOut=smooth(t,3.52,3.74),dotsIn=smooth(t,3.43,3.54);
 // 灰墨先退，竖向小字符仍维持「道」的轮廓，然后各笔画向横向团块聚拢。
 if(t<2.86)drawGlyph(ctx,76,1-smooth(t,2.5,2.86));
 if(t<3.81){ctx.save();ctx.fillStyle='#171814';ctx.globalAlpha=smooth(t,2.5,2.70)*(1-charOut);
  for(const p of characters){const delayed=p.origin[1]>311&&p.origin[0]>325&&p.origin[0]<385?smooth(t,3.24,3.42):collapse,travel=smooth(t,3.55,4.00),dot=pool[p.index];const x=mix(mix(p.origin[0],p.target[0],delayed),dot.mid[0],travel),y=mix(mix(p.origin[1],p.target[1],delayed),dot.mid[1],travel),h=mix(p.h,dot.r*2,charOut);
   ctx.globalAlpha=smooth(t,2.5,2.70)*(1-charOut)*(p.keepInBand?1:1-delayed);if(ctx.globalAlpha<.002)continue;
   if(p.index%3===0){ctx.fillRect(x-.27,y-h/2,.54,h);ctx.fillRect(x-.8,y-h/2,.8,.37);ctx.fillRect(x-.8,y+h/2-.4,.8,.37);}else{ctx.strokeStyle='#171814';ctx.lineWidth=.68;ctx.strokeRect(x-.65,y-h/2,1.3,h);if(p.index%5===0)ctx.fillRect(x-.5,y,.8,.3);}
  }ctx.restore();
 }
 const body=smooth(t,3.89,4.00)*(1-smooth(t,4.1,4.50));if(body>0){ctx.save();ctx.globalAlpha=body*.45;const g=ctx.createLinearGradient(0,196,0,254);g.addColorStop(0,'#8d8e82');g.addColorStop(1,'#30312a');ctx.fillStyle=g;const sp=smooth((t-3.55)*1000,450,790),px=x=>319+(x-319)*(1+sp*.08),py=y=>224+(y-224)*(1+sp*.14);ctx.beginPath();longX.forEach((x,i)=>{if(i)ctx.lineTo(px(x),py(longTop[i]));else ctx.moveTo(px(x),py(longTop[i]));});for(let i=longX.length-1;i>=0;i--)ctx.lineTo(px(longX[i]),py(longBottom[i]));ctx.closePath();ctx.fill();ctx.restore();}
 const ms=(t-3.55)*1000,a=smooth(ms,0,450),b=smooth(ms,1040,1390),fade=map(ms,[[0,1],[160,1],[450,.85],[683,.60],[840,.40],[1330,0]]);
 const cloudRetain=map(ms,[[0,1],[450,1],[683,.42],[950,.025],[1200,0]]),bodyRetain=map(ms,[[0,1],[450,1],[683,.51],[950,.12],[1250,.012],[1333,0]]),spread=smooth(ms,450,790),radius=map(ms,[[0,.50],[160,.72],[450,.90],[1000,.75]])*map(ms,[[0,1],[160,1],[450,.86],[683,.78],[1000,.78]]),filler=smooth(t,3.43,3.65);
 if(dotsIn<=0||fade<=0)return;
 const headRetain=map(ms,[[0,1],[450,1],[683,.83],[950,.12],[1250,.012],[1333,0]]),headFade=map(ms,[[0,1],[160,1],[450,.88],[683,.80],[840,.60],[1330,0]]),headRadius=map(ms,[[0,.50],[160,.72],[450,.90],[1000,.75]])*map(ms,[[0,1],[160,1],[450,.92],[683,.88],[1000,.88]]);
 for(let key=0;key<6;key++){const bucket=key%3,head=key>=3;
  ctx.save();ctx.beginPath();ctx.fillStyle='#141511';ctx.globalAlpha=[.94,.73,.46][bucket]*dotsIn*(head?headFade:fade);
  for(const p of buckets[key]){
   const retain=p.g<3?cloudRetain:head?headRetain:bodyRetain,visibility=clamp((retain-p.retention)/.08);
   if(visibility<=0||(p.g<3&&p.index%2===1))continue;
   const cx=p.g<5?320:319,cy=p.g<5?135:224;let tx=p.mid[0],ty=p.mid[1];
   if(p.g>=3){tx=cx+(tx-cx)*(1+spread*(p.g<5?.35:.08));ty=cy+(ty-cy)*(1+spread*(p.g<5?.5:.14))-(p.g<5?8*spread:0);}
   const x=mix(mix(p.start[0],tx,a),p.end[0],b),y=mix(mix(p.start[1],ty,a),p.end[1],b),r=p.r*(head?headRadius:radius)*Math.sqrt(visibility*(p.lead?1:filler));
   if(r<.04)continue;
   ctx.moveTo(x+r,y);ctx.ellipse(x,y,r,r*(1+1.1*(1-a)),0,0,Math.PI*2);
  }ctx.fill();ctx.restore();
 }
}
function baseStage(root,id){root.style.background='#e2e3dd';root.innerHTML=`<svg class="review-svg" viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg"><defs>${material.paper.paperDefs(id)}</defs>${material.paper.paperMarkup(id)}<g class="opening-notes">${material.paper.marginalia(16)}</g></svg><canvas width="1280" height="720" style="position:absolute;inset:0;width:640px;height:360px"></canvas>`;return root.querySelector('canvas').getContext('2d');}
F['brush-writing']=(root)=>{const ctx=baseStage(root,uid('brush-paper')),notes=root.querySelector('.opening-notes');return ms=>{ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,640,360);drawGlyph(ctx,1+ms*.03);notes.setAttribute('opacity',smooth(ms,1730,1850));};};
F['glyph-particles']=(root)=>{const ctx=baseStage(root,uid('particles-paper'));return ms=>{ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,640,360);drawParticles(ctx,2.5+ms/1000);};};
material.particles={draw:drawParticles,data:particleData};
material.releasePoses=()=>{for(const canvas of poseCache.values())canvas.width=canvas.height=0;poseCache.clear();blended.width=blended.height=0;blendFrame=-1;};
})();
/* 图鉴清場后，字符试写、数字换形、三种字标试样、发布短句与最终字标。 */
(function(){'use strict';
const keys=material.keyShapes.ending;
const path=shapes=>shapes.map(shape=>[shape.p,...shape.h].map(p=>p.map((v,i)=>(i?'L':'M')+v[0]+' '+v[1]).join('')+'Z').join('')).join('');
const paths=keys.map(k=>({...k,path:path(k.shapes)}));
parts['release-ending']=root=>{
 const id=uid('ending-paper');root.style.background='#e2e3dd';root.innerHTML=`<svg class="review-svg" viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg"><defs>${material.paper.paperDefs(id)}</defs>${material.paper.paperMarkup(id)}<path class="ending-shape" fill="#070805" fill-rule="evenodd"/><rect class="ending-black" width="640" height="360" fill="#000" opacity="0"/></svg>`;
 root.querySelectorAll('.kimi-paper>rect').forEach(e=>e.setAttribute('fill','#e3e4de'));
 const shape=root.querySelector('.ending-shape'),black=root.querySelector('.ending-black');let previous=-1;
 return ms=>{const frame=357+ms*.03+.000001;let i=0;while(i<paths.length-1&&frame>=paths[i+1].frame)i++;if(i!==previous){previous=i;shape.setAttribute('d',paths[i].path);}black.setAttribute('opacity',frame>=451?'1':'0');root.dataset.sourceFrame=frame.toFixed(3);};
};})();

 material.keyPartsReady=true;
}

 const clips=[
  {id:'brush-glyph-build',name:'书法笔形生成',part:'brush-writing',start:0,end:2500,sourceDuration:2500,keys:true,warm:[1800],detail:'保留七档墨色和独立笔画姿态，相邻姿态加权显影。'},
  {id:'glyph-bar-collapse',name:'字形聚为书法横带',part:'glyph-particles',start:2500,end:3550,sourceDuration:1050,keys:true,warm:[200,850,1000],detail:'竖向小字符沿各笔位置收拢成具有独立上下边的斜向横带。'},
  {id:'dots-lines-cylinders',name:'颗粒横笔接点阵圆柱',part:'dots-wireframe',start:3550,end:6100,sourceDuration:2550,keys:true,warm:[150,2150],detail:'同一颗粒场先形成独立长短横笔，再按列补点和空间连线。'},
  {id:'material-form-chain',name:'字符网格接像素纤维球',part:'kimi-open-bridge',start:6100,end:8100,sourceDuration:2000,keys:true,images:['fiber.png'],warm:[200,1995],detail:'圆柱沿网格交接字符、环柄、棋盘和像素球，末帧接入真实纤维球。'},
  {id:'spheres-material-merge',name:'纤维球合为月面',part:'spheres-unite',start:8100,end:9250,sourceDuration:1250,images:['fiber.png','moon.png'],warm:[500,800],detail:'三球保留各自半径和内层流向，合体后快速换为月面并缩小下移。'},
  {id:'atlas-reveal-clear',name:'版画图鉴显影清场',part:'atlas-expand',start:9250,end:356/30*1000,sourceDuration:2650,images:['moon.png','atlas-engraving.png'],warm:[750,1150,1550],detail:'三十七个独立轮廓分区显影，曲面及仪器内部连续运动后清场。'},
  {id:'glyph-cut-ending',name:'字形快切与字标收束',part:'release-ending',start:356/30*1000,end:15054,sourceDuration:15054-356/30*1000,keys:true,warm:[12500-356/30*1000],detail:'按独立矢量轮廓切换字符、数字、字标和发布短句，末段进入黑场。'}
 ];
 const duration=15054,compositionId='material-evolution-sequence';
 function activeIndex(time){let i=0;while(i<clips.length-1&&time>=clips[i].end)i++;return i;}
 function finiteTime(value,limit){return Math.max(0,Math.min(limit,Number.isFinite(value)?value:0));}
 function paperNode(root){
  const id=uid('paper');
  root.innerHTML=`<svg class="review-svg material-shared-paper" viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:640px;height:360px;display:block"><defs>${material.paper.paperDefs(id)}</defs>${material.paper.paperMarkup(id)}</svg>`;
 }
 function make(root,K,definition,clip){
  const isComposition=!clip,poster=Boolean(definition.poster_only),limit=isComposition?duration:clip.end-clip.start;
  root.dataset.art='original';root.style.background='#e2e3dd';
  let disposed=false,ready=false,latest=finiteTime(poster?definition.poster_time_ms:0,limit),lastDrawn=null,retained=false;
  const frames=new Map(),renderers=[],roots=[];
  let selected=isComposition?clips: [clip],cover=null;
  if(isComposition){
   paperNode(root);
   for(const item of clips){const node=document.createElement('div');node.dataset.layer=item.id;node.style.cssText='position:absolute;inset:0;width:640px;height:360px;pointer-events:none';root.append(node);roots.push(node);}
  }else{root.dataset.layer=clip.id;paperNode(root);roots.push(root);}
  const baseRects=isComposition?Array.from(root.querySelectorAll('.material-shared-paper .kimi-paper>rect')):[];
  const set=(node,name,value)=>{const text=String(value);if(node.dataset[name]!==text)node.dataset[name]=text;};
  const applyClock=time=>{
   set(root,'materialTime',Number(time.toFixed(6)));
   set(root,'sourceTime',Number(((isComposition?time:clip.start+time)/1000).toFixed(6)));
   if(isComposition){
    const index=activeIndex(time);set(root,'materialPhase',clips[index].id);
    roots.forEach((node,i)=>{const visibility=i===index?'visible':'hidden';if(node.style.visibility!==visibility)node.style.visibility=visibility;});
    const fill=index===clips.length-1?'#e3e4de':'#e2e3dd';baseRects.forEach(node=>{if(node.getAttribute('fill')!==fill)node.setAttribute('fill',fill);});
   }else set(root,'materialPhase',clip.id);
  };
  function draw(time){
   if(disposed||lastDrawn===time)return;
   lastDrawn=time;applyClock(time);
   renderers.forEach(renderer=>{
    const {item,node,draw}=renderer;
    const local=finiteTime(isComposition?time-item.start:time,item.end-item.start);
    if(renderer.lastLocalTime===local)return;
    // 未开始和已结束的片段只在局部边界变化时归位，正常播放只重绘当前片段。
    renderer.lastLocalTime=local;draw(local);
    set(node,'materialLocalTime',Number(local.toFixed(6)));
   });
  }
  const render=ms=>{if(disposed)return;latest=finiteTime(ms,limit);if(ready)draw(latest);else applyClock(latest);};
  const probe=document.createElement('canvas');let canvasOK=false;
  try{canvasOK=Boolean(probe.getContext('2d'));}catch(error){canvasOK=false;}
  probe.width=probe.height=0;
  if(!canvasOK){
   root.dataset.renderState='canvas-unavailable';ready=true;draw(latest);
  }else{
   root.dataset.renderState='preparing';
   cover=document.createElement('div');cover.dataset.materialPreparing='';cover.style.cssText='position:absolute;inset:0;background:#e2e3dd;opacity:.999;pointer-events:none;z-index:2';root.append(cover);
   if(poster&&isComposition)selected=[clips[activeIndex(latest)]];
   const names=[...new Set(selected.flatMap(item=>item.images||[]))];
   const jobs=names.map(loadImage);if(selected.some(item=>item.keys))jobs.push(loadKeys());
   const waitPaint=()=>new Promise(resolve=>{
    if(disposed){resolve(false);return;}
    if(typeof global.requestAnimationFrame!=='function'){resolve(true);return;}
    const handle=global.requestAnimationFrame(()=>{frames.delete(handle);resolve(!disposed);});frames.set(handle,resolve);
   });
   render.ready=Promise.all(jobs).then(async()=>{
    if(disposed)return;
    if(selected.some(item=>item.keys))initializeKeyParts();
    material.users++;retained=true;
    for(const item of selected){
     if(disposed)return;
     const node=isComposition?roots[clips.indexOf(item)]:root;
     const draw=parts[item.part](node,K,{id:item.part,duration_ms:item.sourceDuration});
     node.dataset.art='original';
     for(const svg of node.querySelectorAll('svg.review-svg'))Object.assign(svg.style,{position:'absolute',inset:'0',width:'640px',height:'360px',display:'block'});
     if(isComposition){node.style.background='transparent';node.querySelectorAll('.kimi-paper').forEach(paper=>paper.remove());}
     renderers.push({item,node,draw});
    }
    // 单段建立过程会替换它的内部节点；纸面遮罩重新置于同一个稳定画板上。
    if(!cover.parentNode)root.append(cover);
    root.dataset.renderState='warming';
    if(poster){
     draw(latest);
     if(!await waitPaint()||!await waitPaint())return;
    }else{
     const warm=isComposition?[1800,3700,5700,6300,8095,8600,8900,10000,10400,10800,12500]:clip.warm;
     for(const time of warm){
      draw(time);
      if(!await waitPaint()||!await waitPaint())return;
     }
    }
    if(disposed)return;
    ready=true;lastDrawn=null;draw(latest);cover.remove();cover=null;root.dataset.renderState='ready';
   }).catch(error=>{
    if(disposed)return;
    root.dataset.renderState='error';if(cover)cover.textContent='素材未能载入，请重新打开。';throw error;
   });
  }
  render.destroy=preserve=>{
   if(disposed)return;disposed=true;
   for(const [handle,resolve] of frames){global.cancelAnimationFrame?.(handle);resolve(false);}frames.clear();
   for(const {draw} of renderers)draw.destroy?.(preserve);
   renderers.length=0;
   if(!preserve)root.querySelectorAll('canvas').forEach(canvas=>{canvas.width=canvas.height=0;});
   cover?.remove();cover=null;
   if(retained){retained=false;material.users--;if(material.users===0)material.releasePoses?.();}
  };
  return render;
 }
 for(const clip of clips){
  const factory=(root,K,definition={})=>make(root,K,definition,clip);
  factory.requiresPreparation=true;factories[clip.id]=factory;
 }
 const composition=(root,K,definition={})=>make(root,K,definition,null);
 composition.requiresPreparation=true;
 composition.breakdown=clips.map(clip=>({id:clip.id,name:clip.name,start:clip.start,end:clip.end,time:(clip.start/1000).toFixed(3)+'–'+(clip.end/1000).toFixed(3)+' 秒',detail:clip.detail,actions:[clip.id]}));
 factories[compositionId]=composition;
})(globalThis);
