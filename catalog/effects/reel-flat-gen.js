/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function(F){
  'use strict';
  // 原片 30–46 秒。局部时钟只平移，不压缩；手机各组件与组合共享同一绘制函数。
  const TAU=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,p)=>a+(b-a)*p;
  const prog=(t,a,b)=>clamp((t-a)/(b-a));
  const cubic=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
  const expo=p=>p>=1?1:1-Math.pow(2,-10*p);
  const back=p=>1+2.70158*Math.pow(p-1,3)+1.70158*Math.pow(p-1,2);
  const inBack=p=>2.70158*p*p*p-1.70158*p*p;
  const elastic=p=>p<=0?0:p>=1?1:Math.pow(2,-10*p)*Math.sin((p*10-.75)*TAU/3)+1;
  const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};
  const colors=['#ff6b4a','#1fb5a8','#ffc93c','#1d2b53','#ff9aa2'];
  const set=(n,k,v)=>{const s=String(v);if(n.getAttribute(k)!==s)n.setAttribute(k,s);};
  const text=(n,value)=>{if(n.textContent!==value)n.textContent=value;};
  let serial=0;
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const svg=(title,body,bg='#f4efe6')=>`<svg class="pattern-svg" width="640" height="360" viewBox="0 0 1920 1080" aria-hidden="true"><title>${title}</title><rect width="1920" height="1080" fill="${bg}"/>${body}</svg>`;
  const label=(content,x,y,size,fill,extra='')=>`<text x="${x}" y="${y}" fill="${fill}" font-family="Oswald,sans-serif" font-size="${globalThis.MotionKit.textSize(Math.max(10,size/3),1/3)}" font-weight="700" ${extra}>${esc(content)}</text>`;
  // 字距在制作时用目录 Oswald Bold 字体计算；播放时不测量文字，不建立额外动画时钟。
  const materialRows = [{"id":"year","text":"2014","x":130,"y":420,"size":190,"fill":"#1d2b53","start":3.3,"stagger":0.06,"duration":0.6,"track":-6,"ease":"back","positions":[130,221.66,320.16,387.31],"width":356.87},{"id":"headline","text":"Flat. Material.","x":136,"y":515,"size":66,"fill":"#1d2b53","start":3.6,"stagger":0.02,"duration":0.7,"track":0,"positions":[136,164.644,182.728,213.088,236.254,252.358,269.254,315.718,346.078,369.244,400.264,425.542,443.032,473.392,491.476],"width":371.58},{"id":"subtitle","text":"Motion becomes the interface.","x":138,"y":580,"size":40,"fill":"#5a6275","start":3.8,"stagger":0.012,"duration":0.7,"track":0,"positions":[138,166.16,185.48,199.52,210.12,229.44,249.72,259.96,280.2,299.0,317.72,337.04,367.16,385.96,402.92,413.16,427.2,447.56,466.36,476.6,487.2,507.48,521.52,540.32,555.64,568.44,586.84,605.56,624.36],"width":496.12}];
  const generativeRows = [{"id":"headline1","text":"CODE IS","x":116,"y":450,"size":84,"fill":"#fff","start":0.6,"stagger":0.04,"duration":0.7,"track":0,"positions":[116,163.292,212.516,261.74,299.288,320.792,346.076],"width":273.252},{"id":"headline2","text":"THE CAMERA.","x":116,"y":540,"size":84,"fill":"#fff","start":0.8,"stagger":0.04,"duration":0.7,"track":0,"positions":[116,153.38,204.62,242.168,263.672,310.964,357.248,416.384,453.932,504.332,550.616],"width":455.112},{"id":"subtitle","text":"Real-time engines, shaders & generative systems.","x":118,"y":600,"size":26,"fill":"#9aa0b5","start":1.2,"stagger":0.008,"duration":0.7,"track":0,"positions":[118,133.6,145.82,157.78,164.904,173.328,182.454,189.344,208.922,221.142,227.798,240.018,253.2,266.252,273.142,286.324,298.544,309.568,315.756,322.412,333.436,346.67,358.63,371.708,383.928,393.886,404.91,411.566,426.386,433.042,446.094,458.314,471.496,483.716,493.674,505.634,514.76,521.65,532.596,544.816,551.472,562.496,574.144,585.168,594.294,606.514,626.092,637.116],"width":525.46}];
  const sizeRows=rows=>rows.map(r=>{const size=globalThis.MotionKit.textSize(Math.max(10,r.size/3),1/3),ratio=size/r.size;return {...r,size,motion_size:r.size,width:r.width*ratio,positions:r.positions.map(x=>r.x+(x-r.x)*ratio)};});
  function titleRows(rows,id,layer){rows=sizeRows(rows);return `<defs>${rows.map(r=>`<clipPath id="${id}-${layer}-${r.id}"><rect x="${r.x-r.size}" y="${r.y-r.size*1.05}" width="${r.width+r.size*2}" height="${r.size*1.35}"/></clipPath>`).join('')}</defs><g data-title-layer="${layer}">${rows.map(r=>`<g data-label-row="${r.id}" clip-path="url(#${id}-${layer}-${r.id})">${Array.from(r.text).map((ch,i)=>label(ch,r.positions[i],r.y,r.size,layer==='gen-title'&&r.id==='headline2'&&i===10?'#7b61ff':r.fill,`data-label-char="${i}" xml:space="preserve"`)).join('')}</g>`).join('')}</g>`;}
  function titleMotion(root,rows,layer){rows=sizeRows(rows);const groups=rows.map(r=>[...root.querySelectorAll(`[data-title-layer="${layer}"] [data-label-row="${r.id}"] [data-label-char]`)]);return t=>rows.forEach((r,k)=>groups[k].forEach((n,i)=>{const p=(r.ease==='back'?back:expo)(prog(t,r.start+i*r.stagger,r.start+i*r.stagger+r.duration));set(n,'visibility',p>0?'visible':'hidden');set(n,'y',r.y+(1-p)*r.motion_size*1.1);}));}
  function materialLabels(id){return `<g data-layer="labels">${titleRows(materialRows,id,'material-title')}<g data-material-words>${['RESPONSIVE','NATURAL','AWARE','INTENTIONAL'].map((word,i)=>`<g data-material-word="${i}"><circle cx="150" cy="${684+i*54}" r="9" fill="${colors[i]}"/>${label(`0${i+1}   ${word}`,178,692+i*54,22,'#1d2b53','letter-spacing="3" xml:space="preserve"')}</g>`).join('')}</g></g>`;}
  function materialLabelMotion(root){const titles=titleMotion(root,materialRows,'material-title'),words=[...root.querySelectorAll('[data-material-word]')];return t=>{titles(t);words.forEach((n,i)=>{const p=expo(prog(t,4.4+i*.16,5+i*.16));set(n,'opacity',p);set(n,'transform',`translate(${(1-p)*-40} 0)`);});};}
  function frameLayer(){return `<g data-layer="frame"><path data-gen-frame d="M870 140L830 140L830 180M1630 140L1670 140L1670 180M870 900L830 900L830 860M1630 900L1670 900L1670 860" fill="none" stroke="#c8c8ff" stroke-width="2"/>${label('POINTS 2400',830,124,14,'#8f8fb0','data-gen-readout="points" letter-spacing="2"')}${label('',1670,124,14,'#8f8fb0','data-gen-readout="morph" text-anchor="end" letter-spacing="2"')}${label('',830,928,14,'#8f8fb0','data-gen-readout="pose" letter-spacing="2"')}${label('60 FPS · ADDITIVE',1670,928,14,'#8f8fb0','data-gen-readout="fps" text-anchor="end" letter-spacing="2"')}</g>`;}
  function frameMotion(root){const frame=root.querySelector('[data-gen-frame]'),readouts=[...root.querySelectorAll('[data-gen-readout]')],morph=root.querySelector('[data-gen-readout="morph"]'),pose=root.querySelector('[data-gen-readout="pose"]');return t=>{const alpha=prog(t,.6,1.2),m1=cubic(prog(t,2,3)),m2=cubic(prog(t,4.6,5.6));set(frame,'stroke-opacity',alpha*.5);readouts.forEach(n=>set(n,'opacity',alpha));text(morph,m2>.5?'MORPH  TORUS → FIELD':m1>.5?'MORPH  SPHERE → TORUS':'MORPH  SPHERE');text(pose,`YAW ${(t*.55).toFixed(2)}  PITCH ${mix(.35,.78,m2).toFixed(2)}`);};}
  function generativeTitle(id){return `<g data-layer="title">${label('2020',110,330,210,'none','data-gen-year stroke="#fff" stroke-width="2" letter-spacing="-4"')}${titleRows(generativeRows,id,'gen-title')}</g>`;}
  function generativeTitleMotion(root){const rows=titleMotion(root,generativeRows,'gen-title'),year=root.querySelector('[data-gen-year]');return t=>{set(year,'stroke-opacity',.9*prog(t,.3,.9));rows(t);};}
  function once(draw){let last=-Infinity;return ms=>{const next=Math.max(0,ms);if(next===last)return;draw(next/1000);last=next;};}

  function tiles(root){
    root.innerHTML=svg('方圆阵列波次翻转',`<g data-layer="tiles">${Array.from({length:91},(_,i)=>`<rect data-tile="${i}"/>`).join('')}</g>`);
    const nodes=[...root.querySelectorAll('[data-tile]')];
    const cells=nodes.map((node,i)=>{const c=Math.floor(i/7),r=i%7;return{node,c,r,d:Math.hypot(c-6,r-3)/7,x:192+c*128,y:156+r*128};});
    return once(t=>cells.forEach(({node,c,r,d,x,y})=>{
      const ent=back(prog(t,d*.5,d*.5+.45)),exit=inBack(prog(t,2.7+d*.5,3.1+d*.5));
      const sc=t<4?Math.max(0,ent*(1-exit)):0,s=128*.64*sc;
      const local=t*2-d*1.5,k=Math.floor(local),f=cubic(clamp((local-k)/.6)),parity=((k%2)+2)%2;
      const radius=parity===0?mix(s/2,8*sc,f):mix(8*sc,s/2,f);
      set(node,'x',-s/2);set(node,'y',-s/2);set(node,'width',s);set(node,'height',s);
      set(node,'rx',Math.max(0,Math.min(radius,s/2)));set(node,'fill',colors[((c*2+r*3+k)%5+5)%5]);
      set(node,'transform',`translate(${x} ${y}) rotate(${(k+f)*90})`);
    }));
  }

  // 手机在原 1920×1080 画板中的几何。独立微组件只平移/等比放大展示，不改内部比例。
  const S={x:1152,y:152,w:376,h:776},cardX=1170,cardW=340;
  const cardY=i=>292+i*150;
  const checkPath=t=>{const p=prog(t,6.6,7),a=clamp(p*2),b=clamp(p*2-1),x=1340,y=S.y+S.h*.62;
    return `M${x-50} ${y}L${x-50+35*a} ${y+35*a}`+(b>0?`L${x-15+70*b} ${y+35-75*b}`:'');};
  function shell(id){return `<defs><filter id="${id}-shadow" x="-50%" y="-20%" width="200%" height="150%"><feDropShadow dx="0" dy="30" stdDeviation="30" flood-color="#1d2b53" flood-opacity=".28"/></filter><clipPath id="${id}-screen"><rect x="${S.x}" y="${S.y}" width="${S.w}" height="${S.h}" rx="48"/></clipPath></defs>
    <g data-layer="phone"><rect x="1140" y="140" width="400" height="800" rx="60" fill="#1d2b53" filter="url(#${id}-shadow)"/>
    <g clip-path="url(#${id}-screen)"><rect x="${S.x}" y="${S.y}" width="${S.w}" height="${S.h}" fill="#faf8f4"/><rect x="${S.x}" y="${S.y}" width="${S.w}" height="118" fill="#1d2b53"/>
    ${label('Reel',1184,240,36,'#fff')}${[0,1,2].map(i=>`<rect x="1464" y="${218+i*10}" width="30" height="3" fill="#fff"/>`).join('')}</g></g>`;}
  function cardFrame(i){const y=cardY(i);return `<g data-card-frame="${i}"><rect x="${cardX}" y="${y}" width="340" height="130" rx="22" fill="#fff" stroke="#ebe5da" stroke-width="1.5"/>
    <circle cx="1220" cy="${y+65}" r="28" fill="${colors[i]}"/><rect x="1266" y="${y+44}" width="150" height="14" rx="7" fill="#e4ded3"/><rect x="1266" y="${y+72}" width="100" height="12" rx="6" fill="#e4ded3"/>
    ${i===1?`<rect x="1266" y="${y+98}" width="210" height="8" rx="4" fill="#efe9df"/><rect data-part="progress" x="1266" y="${y+98}" width="0" height="8" rx="4" fill="#ff6b4a"/>`:''}</g>`;}
  const widgets={
    switch:()=>`<g data-layer="switch" data-card-widget="0"><rect data-part="switch-track" x="1420" y="340" width="66" height="34" rx="17" fill="#d9d3c8"/><circle data-part="switch-knob" cx="1437" cy="357" r="13" fill="#fff"/></g>`,
    spinner:()=>`<g data-layer="spinner" data-card-widget="2"><path data-part="spinner-arc" stroke="#ffc93c" stroke-width="6" stroke-linecap="round" fill="none"/></g>`,
    like:()=>`<g data-layer="like" data-card-widget="3"><path data-part="like-heart" d="M0 14C-30 -6 -12 -26 0 -10C12 -26 30 -6 0 14Z" fill="#e4ded3"/></g>`,
    fab:()=>`<g data-layer="fab"><rect data-part="fab-panel" fill="#ff6b4a"/><g data-part="fab-plus" fill="#fff"><rect x="1440" y="850" width="24" height="4"/><rect x="1450" y="840" width="4" height="24"/></g><path data-part="fab-check" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>${label('Published',1340,S.y+S.h*.62+120,36,'#fff','data-part="fab-label" text-anchor="middle"')}</g>`
  };
  function widgetMotion(root,name){
    const q=part=>root.querySelector(`[data-part="${part}"]`);
    if(name==='switch'){const track=q('switch-track'),knob=q('switch-knob');return t=>{const p=back(prog(t,4.8,5.15));set(track,'fill',p>.5?'#1fb5a8':'#d9d3c8');set(knob,'cx',1437+32*p);};}
    if(name==='spinner'){const arc=q('spinner-arc');return t=>{const a=t*6,len=1.2+Math.sin(t*4)*.9,cx=1454,cy=657,r=18;set(arc,'d',`M${cx+Math.cos(a)*r} ${cy+Math.sin(a)*r}A18 18 0 0 1 ${cx+Math.cos(a+len)*r} ${cy+Math.sin(a+len)*r}`);};}
    if(name==='like'){const heart=q('like-heart');return t=>{const p=elastic(prog(t,5.5,6.3));set(heart,'fill',p>.01?'#ff6b4a':'#e4ded3');set(heart,'transform',`translate(1454 807) scale(${.6+.4*p})`);};}
    const panel=q('fab-panel'),plus=[...q('fab-plus').children],check=q('fab-check'),copy=q('fab-label'),group=root.querySelector('[data-layer="fab"]');
    return t=>{const p=back(prog(t,5,5.4)),xp=cubic(prog(t,6,6.6)),r=36*Math.max(0,p),fx=1452,fy=852;
      set(group,'visibility',p>0?'visible':'hidden');
      set(panel,'x',mix(fx-r,S.x,xp));set(panel,'y',mix(fy-r,S.y+S.h*.4,xp));
      set(panel,'width',mix(2*r,S.w,xp));set(panel,'height',mix(2*r,S.h*.6+40,xp));set(panel,'rx',mix(r,36,xp));
      plus.forEach(n=>set(n,'fill-opacity',clamp(1-xp/.3)));set(check,'d',checkPath(t));set(check,'visibility',t>6.6?'visible':'hidden');set(copy,'opacity',prog(t,6.8,7.1));
    };
  }
  function phoneMotion(root){const rig=root.querySelector('[data-phone-rig]');return t=>{const p=expo(prog(t,3.2,4)),dy=(1-p)*800,deg=(1-p)*.25*180/Math.PI;set(rig,'transform',`translate(1340 ${540+dy}) rotate(${deg}) translate(-1340 -540)`);};}
  function cardsMotion(root,animated){
    // Canvas 的 globalAlpha 分别作用于每次填色和描边，不能在 SVG 中合并成整组透明度。
    const cards=[...root.querySelectorAll('[data-card-frame],[data-card-widget]')].map(node=>({node,index:+(node.dataset.cardFrame??node.dataset.cardWidget),paints:[...node.querySelectorAll('rect,circle,path')].flatMap(shape=>['fill','stroke'].filter(paint=>shape.hasAttribute(paint)&&shape.getAttribute(paint)!=='none').map(paint=>[shape,paint+'-opacity']))})),progress=root.querySelector('[data-part="progress"]');
    return t=>{for(const {node,index:i,paints} of cards){const p=animated?back(prog(t,3.7+i*.12,4.3+i*.12)):1;set(node,'transform',`translate(0 ${(1-p)*90})`);for(const [shape,paint] of paints)set(shape,paint,clamp(p));}
      if(progress)set(progress,'width',210*cubic(prog(t,4.5,6.4)));
    };
  }
  function phone(root,mode){
    const id='motion-flat-'+ ++serial,whole=mode==='whole',rise=mode==='rise',cards=mode==='cards';
    const index={switch:0,spinner:2,like:3}[mode],micro=Number.isInteger(index),showShell=whole||rise||mode==='fab';
    const names=whole||rise||cards||mode==='fab'?['switch','spinner','like','fab']:[mode];
    const frames=micro?[index]:[0,1,2,3];
    let body=`<g data-phone-rig>${showShell?shell(id):''}<g ${showShell?`clip-path="url(#${id}-screen)"`:''}><g data-layer="cards">${frames.map(cardFrame).join('')}</g>${names.map(n=>widgets[n]()).join('')}</g></g>`;
    const display=micro?`translate(960 540) scale(2.6) translate(-1340 ${-(cardY(index)+65)})`:whole?'':'translate(-380 0)';
    root.innerHTML=svg('手机卡片交互',`${whole?F['shape-pop-float'].layer()+materialLabels(id):''}<g data-display transform="${display}">${body}</g>`);
    const renderCards=cardsMotion(root,whole||cards),renderPhone=phoneMotion(root),draw=names.map(n=>widgetMotion(root,n));
    const drawShapes=whole?F['shape-pop-float'].motion(root):null,drawLabels=whole?materialLabelMotion(root):null;
    const starts={whole:3,rise:3,cards:3.5,switch:4.6,spinner:4.1,like:5.3,fab:4.8};
    return once(sec=>{const t=Math.round((sec+starts[mode])*1e9)/1e9;renderPhone(whole||rise?t:4);renderCards(rise?4.5:t);drawShapes?.(t);drawLabels?.(t);
      draw.forEach((render,i)=>render(rise||cards?(names[i]==='fab'?4.5:4.6):mode==='fab'&&names[i]!=='fab'?5:t));
    });
  }

  function noise(x,y){const a=Math.floor(x),b=Math.floor(y),xf=x-a,yf=y-b,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
    const h=(i,j)=>hash(i*57.13+j*131.7);return mix(mix(h(a,b),h(a+1,b),u),mix(h(a,b+1),h(a+1,b+1),u),v)*2-1;}
  function fieldLayer(_id,standalone=false){
    // 独立动作需在标准画板和缩略图中可读；组合仍保留原片的淡色底层。
    return standalone
      ? '<path data-layer="field" data-part="field-lines" fill="none" stroke="var(--blue,#7b61ff)" style="stroke:color-mix(in srgb,var(--blue,#7b61ff) 78%,var(--ink,#f4f1ea))" stroke-opacity=".9" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>'
      : '<path data-layer="field" data-part="field-lines" fill="none" stroke="#7b61ff" stroke-opacity=".16" stroke-width="1.2"/>';
  }
  function fieldMotion(root){const path=root.querySelector('[data-part="field-lines"]');const seeds=Array.from({length:220},(_,i)=>[hash(i)*1920,hash(i+.37)*1080]);
    return t=>{let d='';for(const seed of seeds){let x=(seed[0]+t*50)%1920,y=seed[1];d+=`M${x} ${y}`;for(let k=0;k<10;k++){const a=noise(x*.0022,y*.0022+t*.12)*TAU;x+=Math.cos(a)*14;y+=Math.sin(a)*14;d+=`L${x} ${y}`;}}set(path,'d',d);};}
  const NP=2400,genColors=['#3ef2ff','#5fb2ff','#7b61ff','#b05cff','#ff4fd8'];
  // 三组目标顶点只生成一次，各预览只持有自己的投影缓冲，播放时不创建点节点。
  let targets;
  function geometry(){if(targets)return targets;const sphere=new Float32Array(NP*3),torus=new Float32Array(NP*3),grid=new Float32Array(NP*3),jitter=new Float64Array(NP);
    for(let i=0;i<NP;i++){const y=1-2*(i+.5)/NP,r=Math.sqrt(1-y*y),th=i*2.399963,a=(i%60)/60*TAU,b=Math.floor(i/60)/40*TAU;
      sphere.set([Math.cos(th)*r,y,Math.sin(th)*r],i*3);torus.set([(.78+.32*Math.cos(a))*Math.cos(b),.32*Math.sin(a),(.78+.32*Math.cos(a))*Math.sin(b)],i*3);
      grid.set([((i%60)/59-.5)*2.6,0,(Math.floor(i/60)/39-.5)*1.8],i*3);jitter[i]=hash(i)-.5;}
    targets={sphere,torus,grid,jitter};return targets;}
  function pointLayer(id){return `<g data-layer="points"><foreignObject x="0" y="0" width="1920" height="1080" data-point-canvas style="mix-blend-mode:plus-lighter"><canvas xmlns="http://www.w3.org/1999/xhtml" width="1920" height="1080" style="display:block;width:1920px;height:1080px" aria-hidden="true"></canvas></foreignObject><g data-point-fallback></g></g>`;}
  function pointMotion(root){
    const canvas=root.querySelector('canvas'),fallback=root.querySelector('[data-point-fallback]');let ctx;try{ctx=canvas.getContext('2d');}catch(_){ctx=null;}
    let nodes=null;if(ctx){fallback.remove();}else{root.querySelector('[data-point-canvas]').remove();fallback.innerHTML=Array.from({length:NP},(_,i)=>`<rect data-point="${i}" fill="${genColors[i%5]}" style="mix-blend-mode:plus-lighter"/>`).join('');nodes=[...fallback.children];fallback.style.mixBlendMode='plus-lighter';}
    const {sphere,torus,grid,jitter}=geometry(),out=new Float32Array(NP*4);
    const render=t=>{
      // 该场景的原片绝对时间为 38+t；38–46 秒以半秒为节拍，保留脉冲初相。
      const abs=38+t,kick=Math.min(45.5,Math.floor(abs*2)/2),pulse=Math.exp(-(abs-kick)*7),m1=cubic(prog(t,2,3)),m2=cubic(prog(t,4.6,5.6));
      const yaw=t*.55,pitch=mix(.35,.78,m2),cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),grow=expo(prog(t,.1,1.2));
      for(let i=0;i<NP;i++){const j=i*3,k=i*4;let x=mix(mix(sphere[j],torus[j],m1),grid[j],m2),y=mix(mix(sphere[j+1],torus[j+1],m1),grid[j+1],m2),z=mix(mix(sphere[j+2],torus[j+2],m1),grid[j+2],m2);
        if(m2>0)y+=(Math.sin(x*3+t*2.4)*.14+Math.cos(z*4+t*1.8)*.1)*m2;
        const scale=grow*(1+.06*pulse)+jitter[i]*.05*pulse;x*=scale;y*=scale;z*=scale;
        const x1=x*cy-z*sy,z1=x*sy+z*cy,y1=y*cp-z1*sp,z2=y*sp+z1*cp,depth=z2+3.2;
        out[k]=1250+x1*270*3.2/depth;out[k+1]=520+y1*270*3.2/depth;out[k+2]=2.4*3.2/depth*(1+.5*pulse);out[k+3]=clamp(1.5-(depth-2.2)*.55,.15,1);
      }
      if(ctx){ctx.clearRect(0,0,1920,1080);ctx.globalCompositeOperation='lighter';for(let b=0;b<5;b++){ctx.fillStyle=genColors[b];for(let i=b;i<NP;i+=5){const k=i*4,s=out[k+2];ctx.globalAlpha=out[k+3];ctx.fillRect(out[k]-s/2,out[k+1]-s/2,s,s);}}ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
      else for(let i=0;i<NP;i++){const k=i*4,s=out[k+2],n=nodes[i];set(n,'x',out[k]-s/2);set(n,'y',out[k+1]-s/2);set(n,'width',s);set(n,'height',s);set(n,'opacity',out[k+3]);}
    };
    render.destroy=preserve=>{if(!preserve&&ctx){canvas.width=1;canvas.height=1;}};return render;
  }
  const codeLines=['const t = ease(time);','p = mix(sphere, torus, t);','camera.orbit(0.55 * time);',"render(points, 'additive');"];
  function codeLayer(){return `<g data-layer="code">${codeLines.map((_,i)=>label(String(i+1).padStart(2,'0'),110,700+i*36,21,'#3b3d52',`data-code-number="${i}"`)+label('',142,700+i*36,21,i%2?'#c8c2ff':'#8b7bff',`data-code-line="${i}" xml:space="preserve"`)).join('')}</g>`;}
  function codeMotion(root){const rows=[...root.querySelectorAll('[data-code-line]')],nums=[...root.querySelectorAll('[data-code-number]')];let start=1.6;const starts=codeLines.map(l=>{const s=start;start+=l.length/38+.1;return s;});
    return t=>rows.forEach((row,i)=>{const n=clamp(Math.floor((t-starts[i])*38),0,codeLines[i].length);text(row,codeLines[i].slice(0,n));set(nums[i],'opacity',prog(t,starts[i],starts[i]+.1));});}
  function gen(root,mode){const id='motion-gen-'+ ++serial,layers=mode==='whole'?['field','points','frame','title','code']:[mode];
    const builders={field:fieldLayer,points:pointLayer,frame:frameLayer,title:generativeTitle,code:codeLayer};
    const content=layers.map(l=>builders[l](id,mode==='field')).join('');
    const display=mode==='points'?'translate(-290 20)':mode==='frame'?'translate(960 540) scale(1.08) translate(-1250 -534)':mode==='title'?'translate(420 80)':'';
    root.innerHTML=svg(mode==='field'?'噪声流线连续游动':'生成点阵与代码',`<g ${display?`transform="${display}"`:''}>${content}</g>`,mode==='field'?'var(--stage,#05060a)':'#05060a');
    const draws=layers.map(l=>({field:fieldMotion,points:pointMotion,frame:frameMotion,title:generativeTitleMotion,code:codeMotion})[l](root)),draw=once(t=>draws.forEach(f=>f(Math.round(t*1e9)/1e9)));
    draw.destroy=preserve=>draws.forEach(f=>f.destroy?.(preserve));return draw;
  }
  F['title-stagger']=(root,kit,definition={})=>{
    if(definition.variant_id==='handoff')return F['keyframe-workbench'].title(root);
    if(definition.variant_id==='outline')return gen(root,'title');
    const id='motion-flat-labels-'+ ++serial;
    root.innerHTML=svg('年份标题与词条错峰入场',`<g transform="translate(420 0)">${materialLabels(id)}</g>`);
    const draw=materialLabelMotion(root);return once(t=>draw(Math.round((t+3)*1e9)/1e9));
  };
  F['generative-frame-readout']=root=>gen(root,'frame');
  F['tile-round-wave']=tiles;
  F['material-phone-rise']=root=>phone(root,'rise');
  F['material-card-stagger']=root=>phone(root,'cards');
  F['material-switch-spring']=root=>phone(root,'switch');
  F['material-spinner-arc']=root=>phone(root,'spinner');
  F['material-like-pop']=root=>phone(root,'like');
  F['material-fab-panel']=root=>phone(root,'fab');
  F['material-phone-sequence']=root=>phone(root,'whole');
  F['material-phone-sequence'].breakdown=[
    {id:'shapes',actions:['shape-pop-float'],name:'几何装饰弹出漂浮',start:100,end:5000,time:'0.10–5.00 秒',detail:'复用原有几何形状弹出漂浮：黄圆盘、青圆环和粉色方块错峰回弹，方块保持旋转。'},
    {id:'labels',actions:['title-stagger'],name:'年份标题与四项词条',start:300,end:2480,time:'0.30–2.48 秒',detail:'2014 逐字回弹升入，随后两行原标题从遮罩升起；四条彩点词条每项晚 0.16 秒从左淡入。'},
    {id:'phone',actions:['material-phone-rise'],name:'手机斜升回正',start:200,end:1000,time:'0.20–1.00 秒',detail:'机身和屏内所有内容共同从下方 800 像素、倾斜 0.25 弧度的位置升起回正。'},
    {id:'cards',actions:['material-card-stagger'],name:'卡片错峰回弹',start:700,end:3400,time:'0.70–3.40 秒',detail:'四张卡片每张晚 0.12 秒上移回弹；第二卡内进度条按原时钟填充。'},
    {id:'switch',actions:['material-switch-spring'],name:'开关滑动变色',start:1800,end:2150,time:'1.80–2.15 秒',detail:'圆钮越过终点后回弹，滑动进度过半时轨道切为青色。'},
    {id:'spinner',actions:['material-spinner-arc'],name:'加载圆弧',start:940,end:5000,time:'0.94–5.00 秒',detail:'第三卡入场后，黄线弧持续旋转并同时伸缩。'},
    {id:'like',actions:['material-like-pop'],name:'心形弹性放大',start:2500,end:3300,time:'2.50–3.30 秒',detail:'灰色心形切为珊瑚色并弹性放大；末段沿原顺序被面板遮住。'},
    {id:'fab',actions:['material-fab-panel'],name:'圆钮展开面板',start:2000,end:4100,time:'2.00–4.10 秒',detail:'圆钮先弹出，再延展到屏幕下部；加号淡出，白色对勾分两段描成，出现 Published。'}
  ];
  F['generative-point-morph']=root=>gen(root,'points');
  F['generative-flow-field']=root=>gen(root,'field');
  F['generative-point-sequence']=root=>gen(root,'whole');
  F['generative-point-sequence'].breakdown=[
    {id:'field',actions:['generative-flow-field'],name:'噪声流线',start:0,end:8000,time:'0–8 秒',detail:'220 条细线按同一噪声场逐步延伸，每条由 10 个短步连接，底层保持 16% 透明。'},
    {id:'points',actions:['generative-point-morph'],name:'三态点阵',start:100,end:8000,time:'0.10–8.00 秒',detail:'2400 点形成球体，2–3 秒变环面，4.6–5.6 秒变波场；持续自转、透视投影和半秒节拍胀缩。'},
    {id:'frame',actions:['generative-frame-readout'],name:'四角框与实时读数',start:600,end:8000,time:'0.60–8.00 秒',detail:'原四角框与读数共同渐显，形态说明随球、环、波场切换；水平旋转与俯仰读数使用点阵同一时钟。'},
    {id:'title',actions:['title-stagger'],name:'轮廓年份与三行标题',start:300,end:2268,time:'0.30–2.27 秒',detail:'2020 白色轮廓渐显，CODE IS、THE CAMERA. 和副标题按原错峰从裁剪框内升起。'},
    {id:'code',actions:[],reason:'按用户要求剔除独立分行续写，四行代码仅保留在完整组合中。',name:'逐行输入代码',start:1600,end:4400,time:'1.60–约 4.40 秒',detail:'四行代码按每秒 38 字写出，每行结束停顿 0.1 秒，行号随对应行显现。'}
  ];
})(globalThis.MotionFactories);
