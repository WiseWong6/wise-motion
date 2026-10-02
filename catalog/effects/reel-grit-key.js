/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function(F){
  'use strict';
  // 按原片 sGrit / sKey / sFlat 局部重写。仅由目录时钟绘制，不创建额外计时器。
  const clamp=v=>Math.max(0,Math.min(1,v)),span=(t,a,b)=>clamp((t-a)/(b-a));
  const mix=(a,b,p)=>a+(b-a)*p;
  const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
  const outExpo=p=>p>=1?1:1-Math.pow(2,-10*p),inExpo=p=>p<=0?0:Math.pow(2,10*p-10);
  const outBack=p=>1+2.70158*Math.pow(p-1,3)+1.70158*Math.pow(p-1,2);
  const set=(n,k,v)=>{v=String(v);if(n.getAttribute(k)!==v)n.setAttribute(k,v);};
  const attrs=(n,a)=>{for(const [k,v] of Object.entries(a))set(n,k,v);};
  const text=(s,x,y,size,color,extra='')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" ${extra}>${s}</text>`;
  let serial=0;
  function base(root,title,color,body){
    root.innerHTML=`<svg class="pattern-svg" width="640" height="360" viewBox="0 0 1920 1080" aria-hidden="true"><title>${title}</title><rect width="1920" height="1080" fill="${color}"/><g font-family="Oswald,sans-serif" font-weight="700">${body}</g></svg>`;
  }
  function clock(duration,draw,offset=0){let previous=-1;return ms=>{ms=Math.max(0,Math.min(duration,ms));if(ms===previous)return;draw(ms/1000+offset);previous=ms;};}
  function jitterLayer(){return '<g data-layer="jitter" letter-spacing="-6">'+['THE','NERVOUS','TYPE.'].map((s,i)=>text(s,120,380+i*170,190,i===2?'#d7263d':'#e8e2d0',`data-line="${i}"`)).join('')+'</g>';}
  function jitterMotion(root){const group=root.querySelector('[data-layer="jitter"]'),lines=[...group.querySelectorAll('[data-line]')];return t=>{
    const fr=Math.floor(t*24),r=k=>hash(fr*13.37+k*7.1);
    set(group,'transform',`translate(${(r(1)-.5)*6} ${(r(2)-.5)*8+(r(3)<.04?36:0)})`);
    lines.forEach((n,i)=>{set(n,'x',120+(hash(fr*3+i)-.5)*8);set(n,'visibility',t>=4.1+i*.25?'visible':'hidden');});
  };}
  function overprintLayer(){return '<g data-layer="overprint" fill="#e8e2d0" font-size="560" letter-spacing="-20" text-anchor="end">'+[0,1,2].map(i=>`<text data-print="${i}" opacity="${.05+.02*i}">1995</text>`).join('')+'</g>';}
  function overprintMotion(root){const nodes=[...root.querySelectorAll('[data-print]')];return t=>{const frame=Math.floor(t*12);nodes.forEach((n,i)=>attrs(n,{x:1840+(hash(frame+i)-.5)*30,y:760+(hash(frame*2+i)-.5)*20}));};}
  function scratchLayer(){return '<g data-layer="scratches">'+Array.from({length:4},(_,i)=>`<path data-scratch="${i}" fill="none" stroke="#e8e2d0" stroke-opacity=".35"/>`).join('')+Array.from({length:26},(_,i)=>`<circle data-dust="${i}"/>`).join('')+'<path data-hair fill="none" stroke="#000" stroke-opacity=".7" stroke-width="1.2"/><rect data-flash width="1920" height="1080" fill="#fff0dc"/></g>';}
  function scratchMotion(root){const scratches=[...root.querySelectorAll('[data-scratch]')],dust=[...root.querySelectorAll('[data-dust]')],hair=root.querySelector('[data-hair]'),flash=root.querySelector('[data-flash]');return t=>{
    const fr=Math.floor(t*24),r=k=>hash(fr*13.37+k*7.1);
    scratches.forEach((n,k)=>{const x=r(20+k)*1920;attrs(n,{visibility:r(10+k)<.55?'visible':'hidden','stroke-width':.6+r(30+k)*1.6,d:`M${x} 0C${x+8} 324 ${x-6} 756 ${x+4} 1080`});});
    dust.forEach((n,k)=>attrs(n,{cx:r(60+k)*1920,cy:r(90+k)*1080,r:.6+r(120+k)*3,fill:r(40+k)<.5?'#000':'#e8e2d0',opacity:r(40+k)<.5?.8:.6}));
    const x=r(8)*1920,y=r(9)*1080;attrs(hair,{visibility:r(7)<.3?'visible':'hidden',d:`M${x} ${y}C${x+40} ${y-30} ${x+10} ${y+60} ${x+70} ${y+40}`});
    set(flash,'opacity',r(11)*.07+(r(12)<.06?.12:0));
  };}
  F['frame-jitter-type']=root=>{base(root,'文字逐帧错位抖动','#0c0b09',jitterLayer());return clock(1900,jitterMotion(root),4.1);};
  F['ghost-type-overprint']=root=>{base(root,'文字多层套印漂移','#0c0b09',overprintLayer());return clock(3000,overprintMotion(root));};
  F['film-scratch-flicker']=root=>{base(root,'胶片刮痕与尘点闪动','#0c0b09',scratchLayer());return clock(3000,scratchMotion(root));};

  // 两个窗口保留原尺寸；合成窗口仅向右平移 350 像素，空出的曲线编辑器不伪装成组成动作。
  const comp={x:470,y:230,w:980,h:470,index:0,title:'COMPOSITION — BALL_v03'};
  const timeline={x:120,y:730,w:1680,h:210,index:2,title:'TIMELINE'};
  const inner=P=>({x:P.x+20,y:P.y+54,w:P.w-40,h:P.h-74});
  function panel(P){return `<rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="10" fill="#1c1e24" stroke="#2c2f37" stroke-width="1.5"/><path d="M${P.x+10} ${P.y}H${P.x+P.w-10}Q${P.x+P.w} ${P.y} ${P.x+P.w} ${P.y+10}V${P.y+34}H${P.x}V${P.y+10}Q${P.x} ${P.y} ${P.x+10} ${P.y}" fill="#23262d"/>`+text(P.title,P.x+16,P.y+22,13,'#8b909c','letter-spacing="2"')+[0,1,2].map(i=>`<circle cx="${P.x+P.w-20-i*16}" cy="${P.y+17}" r="4" fill="#3a3e48"/>`).join('');}
  function panelPose(t,P){const a=outExpo(span(t,.1+P.index*.12,.8+P.index*.12)),c=inExpo(span(t,5.4+P.index*.08,5.85+P.index*.08)),cy=P.y+P.h/2;return {opacity:c>=1?0:a,transform:`translate(0 ${(1-a)*60+cy}) scale(1 ${1-c}) translate(0 ${-cy})`};}
  function panelLayer(){return '<g data-layer="panels">'+[comp,timeline].map(P=>`<g data-window="${P.index}">${panel(P)}</g>`).join('')+'</g>';}
  function panelMotion(root){const nodes=[...root.querySelectorAll('[data-window]')];return t=>nodes.forEach(n=>attrs(n,panelPose(t,+n.dataset.window===0?comp:timeline)));}
  const loopU=t=>t<1?0:((t-1)/2)%1,pingPong=u=>u<.5?u*2:2-u*2;
  const bez=(a,b,u)=>3*(1-u)*(1-u)*u*a+3*(1-u)*u*u*b+u*u*u;
  function handles(t){const p=outBack(span(t,1.6,2.4));return [[mix(.333,.8,p),mix(.333,0,p)],[mix(.667,.2,p),mix(.667,1,p)]];}
  function ease(x,a,b){let lo=0,hi=1;for(let i=0;i<22;i++){const mid=(lo+hi)/2;if(bez(a[0],b[0],mid)<x)lo=mid;else hi=mid;}return bez(a[1],b[1],(lo+hi)/2);}
  function bounceLayer(){const I=inner(comp),ground=I.y+I.h-44,x0=I.x+150,x1=I.x+I.w-90;return '<g data-layer="bounce">'+`<rect x="${I.x}" y="${I.y}" width="${I.w}" height="${I.h}" fill="#0d0e11"/><rect x="${I.x+30}" y="${I.y+20}" width="${I.w-60}" height="${I.h-40}" fill="none" stroke="#2a2d35" stroke-width="1" stroke-dasharray="6 6"/>`+['linear','ease'].map((s,i)=>{const y=I.y+56+i*44;return text(s,I.x+50,y+5,14,'#6e7380')+`<rect x="${x0}" y="${y-1}" width="${x1-x0}" height="2" fill="#20232a"/><rect data-compare="${i}" y="${y-13}" width="26" height="26" fill="${i?'#ffc93c':'#4aa3ff'}"/>`;}).join('')+`<rect x="${I.x+40}" y="${ground}" width="${I.w-80}" height="2" fill="#2a2d35"/>`+[6,5,4,3,2,1].map(j=>`<ellipse data-ball="${j}" fill="#ff6b4a"/>`).join('')+`<ellipse data-shadow cy="${ground+2}" ry="7" fill="#000" fill-opacity=".6"/><ellipse data-ball="0" fill="#ff6b4a"/>`+text('squash &amp; stretch',I.x+I.w-50,I.y+I.h-12,13,'#4b4f5a','data-bounce-label text-anchor="end"')+'</g>';}
  function bounceMotion(root){const I=inner(comp),ground=I.y+I.h-44,nodes=[...root.querySelectorAll('[data-ball]')],shadow=root.querySelector('[data-shadow]'),label=root.querySelector('[data-bounce-label]'),compare=[...root.querySelectorAll('[data-compare]')];return t=>{
    const u=loopU(t),pp=pingPong(u),ga=span(t,.6,1),[a,b]=handles(t);
    compare.forEach((n,i)=>set(n,'x',mix(I.x+150,I.x+I.w-90,i?ease(pp,a,b):pp)-13));
    nodes.forEach(n=>{const j=+n.dataset.ball,uu=u-j*.012,valid=uu>=0,s=uu*4-Math.floor(uu*4),k=((Math.floor(uu*4)%4)+4)%4;
      const h=[250,180,120,70][k]*4*s*(1-s),v=Math.abs(1-2*s),c=Math.max(0,1-Math.min(s,1-s)/.07),sy=(1+.2*v*(1-c))*(1-.38*c),x=mix(I.x+90,I.x+I.w-90,uu);
      attrs(n,{visibility:valid?'visible':'hidden',cx:x,cy:ground-34-h+34*(1-sy),rx:34/sy,ry:34*sy,opacity:ga*(j===0?1:.22-j*.028)});
      if(j===0)attrs(shadow,{cx:x,rx:34*(1.1-h/600),opacity:ga});
    });set(label,'opacity',ga);
  };}
  const keyNames=['Ball · Position','Ball · Scale','Shadow · Opacity','Title · Tracking','Camera · Zoom'];
  const keyColors=['#ff6b4a','#ff6b4a','#8a8f99','#ffc93c','#4aa3ff'];
  const keyTimes=[[0,.25,.5,.75,1],[0,.24,.26,.49,.51,.74,.76,.99],[0,.125,.25,.375,.5,.625,.75,.875,1],[.05,.4],[0,1]];
  function timelineLayer(){const P=timeline,tx=P.x+300,tw=P.w-320,ry=P.y+34;let index=0;return '<g data-layer="timeline">'+`<rect x="${P.x}" y="${ry}" width="${P.w}" height="26" fill="#191b20"/>`+Array.from({length:41},(_,i)=>`<rect x="${tx+tw*i/40}" y="${ry+(i%5?18:10)}" width="1" height="${i%5?8:16}" fill="#4b4f5a"/>`).join('')+Array.from({length:9},(_,i)=>text(`${(i*.25).toFixed(2)}s`,tx+tw*i/8+4,ry+14,10,'#5d626e')).join('')+keyNames.map((name,i)=>{const y=P.y+80+i*24;return `<rect x="${P.x+18}" y="${y-6}" width="10" height="10" fill="${keyColors[i]}"/>`+text(name,P.x+40,y+4,13,'#a4a9b4')+`<rect x="${tx}" y="${y-8}" width="${tw}" height="16" fill="${keyColors[i]}" opacity=".16"/>`+keyTimes[i].map(k=>`<rect data-key="${index++}" data-row="${i}" data-at="${k}" x="-5" y="-5" width="10" height="10"/>`).join('');}).join('')+`<g data-playhead fill="#4aa3ff"><rect x="-1" y="${ry}" width="2" height="${P.h-34}"/><path d="M-8 ${ry}H8V${ry+10}L0 ${ry+18}L-8 ${ry+10}Z"/></g></g>`;}
  function timelineMotion(root){const P=timeline,tx=P.x+300,tw=P.w-320,nodes=[...root.querySelectorAll('[data-key]')],head=root.querySelector('[data-playhead]');return t=>{
    const px=tx+loopU(t)*tw;nodes.forEach(n=>{const i=+n.dataset.key,row=+n.dataset.row,x=tx+(+n.dataset.at)*tw,y=P.y+80+row*24,s=outBack(span(t,.9+i*.025,1.25+i*.025)),hot=Math.abs(x-px)<8&&t>1,c=keyColors[row];attrs(n,{visibility:s>0?'visible':'hidden',transform:`translate(${x} ${y}) rotate(45) scale(${s*(hot?1.5:1)})`,fill:hot?'#fff':c==='#8a8f99'?'#c5c9d1':c});});attrs(head,{visibility:t>.9?'visible':'hidden',transform:`translate(${px} 0)`});
  };}
  function content(root,title,layers,{collapse=false}={}){const id='motion-grit-key-'+ ++serial,defs=[comp,timeline].map(P=>`<clipPath id="${id}-${P.index}"><rect x="${P.x}" y="${P.y+34}" width="${P.w}" height="${P.h-34}"/></clipPath>`).join('');let body=`<defs>${defs}</defs>`;
    if(layers.includes('panels'))body+=panelLayer();
    else body+=layers.map(l=>panel(l==='bounce'?comp:timeline)).join('');
    for(const layer of layers.filter(l=>l!=='panels')){const P=layer==='bounce'?comp:timeline;body+=`<g ${collapse?`data-window="${P.index}"`:''}><g clip-path="url(#${id}-${P.index})">${layer==='bounce'?bounceLayer():timelineLayer()}</g></g>`;}
    base(root,title,'#131418',body);
    const draws=layers.map(l=>l==='panels'?panelMotion(root):l==='bounce'?bounceMotion(root):timelineMotion(root));
    return clock(6200,t=>draws.forEach(draw=>draw(t)));
  }
  F['panel-rise-collapse']=root=>content(root,'面板升入后纵向收扁',['panels']);
  F['ball-bounce-trails']=root=>content(root,'小球递减弹跳与残影',['bounce']);
  F['timeline-keyframe-playhead']=root=>content(root,'关键帧建立与游标扫描',['timeline']);
  F['keyframe-workbench']=root=>content(root,'弹跳与关键帧工作台',['panels','bounce','timeline'],{collapse:true});
  F['keyframe-workbench'].breakdown=[
    {id:'panels',actions:['panel-rise-collapse'],name:'面板外框',start:100,end:6010,time:'0.10–6.01 秒',detail:'两个窗口按原来的序号错峰升入，末尾围绕各自中线收扁。仅平移合成窗口到中间，保留原尺寸、配色和时间。'},
    {id:'bounce',actions:['ball-bounce-trails'],name:'弹跳与速度对照',start:600,end:6010,time:'0.60–6.01 秒',detail:'同一时钟控制线性与缓动对照、小球四段递减弹跳、六道残影和落地压扁。与独立动作共用实际绘制函数。'},
    {id:'timeline',actions:['timeline-keyframe-playhead'],name:'关键帧与游标',start:900,end:6010,time:'0.90–6.01 秒',detail:'五行关键帧每个错开 0.025 秒弹出。游标每两秒扫描一次，靠近的关键帧变白并放大，与小球共享循环时间。'}
  ];
  F['shape-pop-float']=root=>{
    base(root,'几何形状弹出漂浮','#f4efe6','<g data-layer="shapes"><circle data-shape="disc" cx="1700" fill="#ffc93c"/><circle data-shape="ring" cx="160" r="170" fill="none" stroke="#1fb5a8"/><rect data-shape="square" fill="#ff9aa2"/></g>');
    const disc=root.querySelector('[data-shape="disc"]'),ring=root.querySelector('[data-shape="ring"]'),square=root.querySelector('[data-shape="square"]');
    return clock(5000,t=>{const wave=Math.sin(t*1.3)*12,a=outBack(span(t,3.1,3.8)),b=outBack(span(t,3.3,4)),c=outBack(span(t,3.5,4.1));attrs(disc,{cy:170+wave,r:250*a});attrs(ring,{cy:980-wave,r:170*b,'stroke-width':44*b});attrs(square,{x:-40*c,y:-40*c,width:80*c,height:80*c,transform:`translate(920 ${900+wave}) rotate(${t*.6*180/Math.PI})`});},3);
  };
})(globalThis.MotionFactories);
