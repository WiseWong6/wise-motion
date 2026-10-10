/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
/* 原工程插画的独立适配：保留图形与动作，去掉周围文稿。 */
(function(global){
  'use strict';
  const F=global.MotionFactories=global.MotionFactories||{};
  let serial=0;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const part=(p,a,b)=>clamp((p-a)/(b-a));
  const ease=p=>p<.5?4*p*p*p:1-(-2*p+2)**3/2;
  const list=(n,f)=>Array.from({length:n},(_,i)=>f(i)).join('');
  function register(id,setup){
    F[id]=(root,K,def)=>{
      const ns='illustration-'+(++serial);
      const make=html=>{
        root.innerHTML=`<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true">${html.replaceAll('NS',ns)}</svg>`;
        const nodes=new Map([...root.querySelectorAll('[data-part]')].map(n=>[n.dataset.part,n]));
        return (id,attrs)=>{const n=nodes.get(id);for(const [key,value] of Object.entries(attrs||{})){const v=String(value);if(n.getAttribute(key)!==v)n.setAttribute(key,v);}return n;};
      };
      const render=setup(make);
      return t=>render(clamp(t/def.duration_ms));
    };
  }
  const hatch=`<defs><pattern id="NS-hatch" width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><line x1="0" y1="0" x2="0" y2="4.5" stroke="var(--ink)" stroke-width=".9" opacity=".65"/></pattern></defs>`;
  register('animal-illustration',make=>{
    const animals=[
      `<circle cx="43" cy="42" r="19" fill="url(#NS-hatch)"/><circle cx="117" cy="42" r="19" fill="url(#NS-hatch)"/><ellipse cx="80" cy="87" rx="55" ry="51" fill="var(--card)"/><ellipse cx="58" cy="80" rx="15" ry="20" transform="rotate(25 58 80)" fill="var(--ink)"/><ellipse cx="102" cy="80" rx="15" ry="20" transform="rotate(-25 102 80)" fill="var(--ink)"/><path d="M71 103h18l-9 9Z" fill="var(--ink)"/><path d="M80 112v9m0-2q-9 9-17 0m17 0q9 9 17 0"/>`,
      `<ellipse cx="56" cy="46" rx="14" ry="37" transform="rotate(-10 56 46)" fill="var(--card)"/><ellipse cx="103" cy="46" rx="14" ry="37" transform="rotate(10 103 46)" fill="var(--card)"/><path d="M56 25v34m47-34v34" stroke="var(--ink)" stroke-opacity=".15" stroke-width="6"/><ellipse cx="80" cy="101" rx="49" ry="40" fill="var(--card)"/><circle cx="61" cy="93" r="4" fill="var(--ink)"/><circle cx="99" cy="93" r="4" fill="var(--ink)"/><path d="m74 109 6 6 6-6M80 115v9m-17-7-29-4m63 4 29-4"/>`,
      `<path d="M33 63 26 23l39 22h30l39-22-7 40q17 45-10 64-37 25-74 0Q16 108 33 63Z" fill="url(#NS-hatch)"/><path d="m43 54-5-14 15 9m64 5 5-14-15 9"/><path d="m57 86 8 2m30 0 8-2m-30 21 7 7 7-7M80 114v9m-25-13-32-5m82 5 32-5"/>`
      ,`<path d="m24 82 18-34h67l20 34 13 9v30H18V92Z" fill="url(#NS-hatch)"/><path d="m46 56-12 25h82L103 56ZM75 57v24" fill="var(--card)"/><path d="M25 97h13m84 0h13"/><circle cx="45" cy="121" r="16" fill="var(--card)"/><circle cx="115" cy="121" r="16" fill="var(--card)"/><circle cx="45" cy="121" r="4" fill="var(--ink)"/><circle cx="115" cy="121" r="4" fill="var(--ink)"/>`,
      `<path d="M78 17v94M70 28 28 97h42ZM87 37l47 60H87Z" fill="var(--card)"/><path d="M18 113h126l-22 24H38Z" fill="url(#NS-hatch)"/><path d="M10 146q12-8 24 0t24 0t24 0t24 0t24 0t24 0"/>`,
      `<path d="M59 91 35 115v24l33-17m33-31 24 24v24l-33-17" fill="url(#NS-hatch)"/><path d="M80 13q40 39 21 110H59Q40 52 80 13Z" fill="var(--card)"/><path d="M60 49h40"/><circle cx="80" cy="77" r="15" fill="url(#NS-hatch)"/><path d="M70 130v15m20-15v15m-10-13v23"/>`
    ];
    const s=make(hatch+animals.map((art,i)=>`<g transform="translate(${88+(i%3)*176} ${36+Math.floor(i/3)*152}) scale(.85)" data-part="a${i}" fill="none" stroke="var(--ink)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${art}</g>`).join(''));
    const shapes=animals.map((_,i)=>[...s('a'+i).children]);
    shapes.flat().forEach(n=>{n.setAttribute('pathLength','1');n.setAttribute('stroke-dasharray','1 1');});
    return p=>shapes.forEach((group,i)=>{const q=part(p,.04+i*.035,.58+i*.035),tone=part(q,.55,1);s('a'+i,{opacity:q>0?1:0});for(const n of group){const offset=String(1-q),fill=String(tone);if(n.getAttribute('stroke-dashoffset')!==offset)n.setAttribute('stroke-dashoffset',offset);if(n.getAttribute('fill-opacity')!==fill)n.setAttribute('fill-opacity',fill);}});
  });
  register('venturi-illustration',make=>{
    const X0=900,XT=1330,X1=1800,CY=540;
    const hw=x=>x<=XT?70+170*(1+Math.cos(Math.PI*(x-X0)/(XT-X0)))/2:70+95*(1-Math.cos(Math.PI*Math.min(1,(x-XT)/(X1-XT))))/2;
    const xs=Array.from({length:91},(_,i)=>X0+10*i),tau=[0];
    for(let i=1;i<xs.length;i++)tau.push(tau[i-1]+hw(xs[i])/10);
    const total=tau.at(-1),px=x=>86+(x-X0)*.52,py=(x,l)=>180+l*hw(x)*.52;
    const xAt=t=>{const tt=((t%total)+total)%total;let a=1,b=tau.length-1;while(a<b){const m=(a+b)>>1;if(tau[m]<tt)a=m+1;else b=m;}return xs[a-1]+(xs[a]-xs[a-1])*(tt-tau[a-1])/(tau[a]-tau[a-1]);};
    const path=l=>xs.map((x,i)=>`${i?'L':'M'}${px(x)} ${py(x,l)}`).join(' ');
    const s=make(`<line x1="76" y1="180" x2="566" y2="180" stroke="var(--ink)" stroke-width=".3" opacity=".25" stroke-dasharray="8 3 1 3"/>`+[-1,1].map((l,i)=>`<path data-part="wall${i}" d="${path(l)}" fill="none" stroke="var(--ink)" stroke-width=".8" pathLength="1" stroke-dasharray="1 1"/>`).join('')+list(15,j=>`<path data-part="stream${j}" d="${path((j/14*2-1)*.9)}" fill="none" stroke="var(--ink)" stroke-width=".3" opacity=".3" pathLength="1" stroke-dasharray="1 1"/>`)+list(60,i=>`<path data-part="flow${i}" fill="none" stroke="var(--ink)" stroke-width="${i%4===2?1.2:.75}" stroke-linecap="round"/>`));
    return p=>{const f=p*90,t8=Math.max(0,f-8),clock=6*(t8*.9+t8*t8*.045),trail=10+7.2*(.9+.09*t8);for(let i=0;i<2;i++)s('wall'+i,{'stroke-dashoffset':1-ease(part(p,i*.02,.24+i*.02))});for(let j=0;j<15;j++){s('stream'+j,{'stroke-dashoffset':1-ease(part(p,.04+j*.008,.28+j*.008))});for(let k=0;k<4;k++){const head=xAt(clock+k/4*total+j*97.3),tail=xAt(clock+k/4*total+j*97.3-trail),l=(j/14*2-1)*.9;s('flow'+(j*4+k),{d:`M${px(tail)} ${py(tail,l)}L${px(head)} ${py(head,l)}`,opacity:tail>head?0:part(p,.12,.23)*.8});}}};
  });
  register('attention-illustration',make=>{
    const picked=[1,6,11,17,22,27,31];
    const panel=(k)=>`<g transform="translate(${54+k*276} 185) scale(.34)">`+list(10,row=>`<path d="${Array.from({length:37},(_,i)=>`${i?'L':'M'}${i*20} ${50*Math.sin(row*Math.PI/5+i*.09)}`).join(' ')}" fill="none" stroke="var(--ink)" stroke-width=".6" opacity=".3"/>`)+list(36,i=>`<ellipse data-part="r${k}-${i}" cx="${10+i*20}" cy="0" rx="8" ry="56" fill="none" stroke="var(--ink)" stroke-width=".8"/><circle data-part="p${k}-${i}" r="3.2" fill="var(--ink)"/>`)+(k?picked.map((i,j)=>`<path data-part="bridge${j}" d="M${10+i*20} -56Q${(10+i*20+744)/2} ${-150-(i%3)*16} 744 0" fill="none" stroke="var(--ink)" stroke-width="1.1" pathLength="1" stroke-dasharray="1 1"/>`).join(''):`<path data-part="window" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`)+`<circle cx="744" cy="0" r="5" fill="var(--ink)"/></g>`;
    const s=make(panel(0)+panel(1));
    return p=>{const f=p*90,end=20+Math.floor(14*part(p,.09,.67));for(let k=0;k<2;k++)for(let i=0;i<36;i++){const active=k?picked.includes(i)&&f>18+picked.indexOf(i)*3:i>end-8&&i<=end;const show=part(p,i*.004,.12+i*.004);s(`r${k}-${i}`,{opacity:show*(active?.9:.25),'stroke-width':active?1.8:.8});s(`p${k}-${i}`,{cx:10+i*20+8*Math.cos(f*.09+i),cy:56*Math.sin(f*.09+i),opacity:active?show:0});}const a=10+(end-7)*20-12,b=10+end*20+12;s('window',{d:`M${a} 72v10H${b}v-10M${a} -72v-10H${b}v10`,opacity:part(p,.06,.16)});picked.forEach((_,j)=>s('bridge'+j,{'stroke-dashoffset':1-ease(part(p,(18+j*3)/90,(36+j*3)/90))}));};
  });
  register('heads-illustration',make=>{
    const heads=Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return [Math.cos(a)*116,Math.sin(a)*94];});
    const s=make(`<g transform="translate(320 180)"><ellipse rx="116" ry="94" fill="none" stroke="var(--ink)" stroke-width=".4" opacity=".3"/><path d="M-138 0H138M0-116V116" stroke="var(--ink)" stroke-width=".35" opacity=".25" stroke-dasharray="3 6"/>`+heads.map(([x,y],i)=>`<g data-part="g${i}"><path data-part="c${i}" d="M${x} ${y}Q${x*.25} ${y*.15} 0 0" fill="none" stroke="var(--ink)" stroke-width=".6" pathLength="1" stroke-dasharray="1 1"/><circle cx="${x}" cy="${y}" r="2.2" fill="var(--ink)"/><circle data-part="p${i}" r="1.5" fill="var(--ink)"/></g>`).join('')+`<circle r="10" fill="var(--card)" stroke="var(--ink)" stroke-width=".8"/></g>`);
    return p=>heads.forEach(([x,y],i)=>{const q=part(p,.04+i*.009,.2+i*.009),t=(p*2.7+i/16)%1,b=1-t;const k=b*b+.5*b*t;s('g'+i,{opacity:q});s('c'+i,{'stroke-dashoffset':1-q});s('p'+i,{cx:x*k,cy:y*(b*b+.3*b*t),opacity:q*.8});});
  });
  register('stage-merge-illustration',make=>{
    const s=make(list(4,stage=>list(4,i=>`<g data-part="g${stage}-${i}"><rect data-part="r${stage}-${i}" width="19" height="10.5" fill="none" stroke="var(--ink)" stroke-width=".4"/>`+list(3,j=>`<line data-part="l${stage}-${i}-${j}" x1="2" y1="${2.5+j*2.5}" x2="17" y2="${2.5+j*2.5}" stroke="var(--ink)" stroke-width=".3" opacity=".6"/>`)+'</g>'))+list(2,k=>`<g data-part="k${k}"><path d="M${72+k*254} 170V166H${308+k*254}V170M${72+k*254} 182V186H${308+k*254}V182" fill="none" stroke="var(--ink)" stroke-width=".65" pathLength="1" stroke-dasharray="1 1"/>`+list(9,i=>`<line x1="${76+k*254}" y1="${169+i*1.7}" x2="${304+k*254}" y2="${169+i*1.7}" stroke="var(--ink)" stroke-width=".2" opacity=".3"/><line data-part="f${k}-${i}" x1="${76+k*254}" y1="${169+i*1.7}" x2="${304+k*254}" y2="${169+i*1.7}" stroke="var(--ink)" stroke-width=".65" pathLength="1" stroke-dasharray=".02 .98"/>`)+'</g>'));
    return p=>{const f=p*90,merge=ease(part(p,22/90,50/90));for(let stage=0;stage<4;stage++)for(let i=0;i<4;i++){const join=ease(part(p,(22+stage*3+i)/90,(46+stage*3+i)/90)),w=19+join*4.6,y=141+join*27;const id=`${stage}-${i}`;s('g'+id,{transform:`translate(${85+stage*127+i*23.5} ${y})`,opacity:part(p,(4+stage*4+i*1.5)/90,(12+stage*4+i*1.5)/90)});s('r'+id,{width:w,height:10.5-join*3.9,opacity:1-join*.8});for(let j=0;j<3;j++){const yy=(2.5+j*2.5)*(1-join*.4);s(`l${id}-${j}`,{y1:yy,y2:yy,x2:w-2});}}for(let k=0;k<2;k++){s('k'+k,{opacity:merge});s('k'+k).querySelector('path').setAttribute('stroke-dashoffset',1-merge);for(let i=0;i<9;i++)s(`f${k}-${i}`,{'stroke-dashoffset':-((Math.max(0,f-50)*.012+i*.11)%1),opacity:part(p,44/90,56/90)});}};
  });
  register('torus-illustration',make=>{
    const useg=32,vseg=8,pts=[],edges=[];
    for(let u=0;u<useg;u++)for(let v=0;v<vseg;v++){const a=u/useg*Math.PI*2,b=v/vseg*Math.PI*2,r=1+.36*Math.cos(b);pts.push([r*Math.cos(a),.36*Math.sin(b),r*Math.sin(a)]);}
    const id=(u,v)=>((u+useg)%useg)*vseg+(v+vseg)%vseg;
    for(let u=0;u<useg;u++)for(let v=0;v<vseg;v++){edges.push([id(u,v),id(u+1,v)]);if(u%4===0)edges.push([id(u,v),id(u,v+1)]);if(v%3===1)edges.push([id(u,v),id(u+1,v+1)]);}
    const s=make(list(edges.length,i=>`<path data-part="e${i}" fill="none" stroke="var(--ink)" stroke-linecap="round"/>`));
    return p=>{const ay=p*Math.PI*2,ax=1.18,ca=Math.cos(ay),sa=Math.sin(ay),cx=Math.cos(ax),sx=Math.sin(ax);const P=pts.map(([x,y,z])=>{const X=x*ca+z*sa,Z=-x*sa+z*ca,Y=y*cx-Z*sx,zz=y*sx+Z*cx,scale=5/(5+zz);return [X*scale,Y*scale,zz];});const build=ease(part(p,0,.67));edges.forEach(([a,b],i)=>{const A=P[a],B=P[b],q=clamp((build-((i*7919)%edges.length)/edges.length*.75)/.25),depth=clamp((1.4-(A[2]+B[2])/2)/2.8);s('e'+i,{d:`M${320+A[0]*128} ${180+A[1]*128*.62}L${320+(A[0]+(B[0]-A[0])*q)*128} ${180+(A[1]+(B[1]-A[1])*q)*128*.62}`,'stroke-width':(.35+depth*.9)*.7,opacity:q<=0?0:.12+depth*.6});});};
  });
  register('dot-route-illustration',make=>{
    // 原工程固定种子产生的十六个目标，已按离左侧方块的距离排序。
    const dx=540/31,dy=520/27;
    const targets=[[2,12],[7,14],[3,2],[6,23],[11,16],[9,4],[12,9],[13,24],[19,16],[19,10],[19,22],[22,0],[24,3],[24,25],[30,16],[31,8]].map(([col,row])=>({col,row,x:470+col*dx,y:300+row*dy}));
    const picked=new Set(targets.map(v=>v.row*32+v.col));
    const out=p=>1-(1-p)**3,back=p=>1+2.70158*(p-1)**3+1.70158*(p-1)**2;
    // 同行普通圆点合为一条静态路径；只更新二十八行和十六组目标。
    const rows=list(28,row=>{
      const y=300+row*dy;
      const d=list(32,col=>{if(picked.has(row*32+col))return '';const x=470+col*dx;return `M${x+2.1} ${y}a2.1 2.1 0 1 0-4.2 0a2.1 2.1 0 1 0 4.2 0Z`;});
      return `<path data-part="row${row}" d="${d}" fill="var(--ink)" opacity="0"/>`;
    });
    const dots=targets.map((v,i)=>`<circle data-part="target${i}" cx="${v.x}" cy="${v.y}" r="2.1" fill="var(--ink)" opacity="0"/><circle data-part="halo${i}" cx="${v.x}" cy="${v.y}" r="5.3" fill="none" stroke="var(--diagram-blue)" stroke-width="1" opacity="0"/>`).join('');
    const lines=list(16,i=>`<path data-part="link${i}" d="M378 560L378 560" fill="none" stroke="var(--diagram-blue)" stroke-width="1.6" opacity="0"/>`);
    const s=make(`<g transform="translate(320 180) scale(.55) translate(-687.5 -560)">${rows}${dots}${lines}<g data-part="router" transform="translate(378 560) scale(0)" opacity="0"><rect x="-15" y="-15" width="30" height="30" fill="var(--diagram-blue)" stroke="var(--ink)" stroke-opacity=".55" stroke-width="1.2"/><path d="M-4 6V-5h4a3.2 3.2 0 0 1 0 6h-4m4 0 4 5" fill="none" stroke="var(--card)" stroke-width="1.6" stroke-linejoin="round"/></g></g>`);
    return p=>{
      // 从原点阵开场截取，保留局部时差；完成后留四百毫秒静止画面。
      const t=1.6+Math.min(p*3,2.6),alpha=Array.from({length:28},(_,r)=>out(part(t,1.6+r*.032,2.05+r*.032)));
      alpha.forEach((a,r)=>s('row'+r,{opacity:.72*a}));
      targets.forEach((v,i)=>{
        const at=2.95+i*.0375,g=out(part(t,at,at+.35)),h=part(t,at+.35,at+.65),a=alpha[v.row];
        const radius=h<=0?2.1:2.1+1.4*back(h)+.3*h*Math.sin(t*4+i*1.7);
        s('target'+i,{r:radius,fill:h>0?'var(--diagram-blue)':'var(--ink)',opacity:(.72+.28*h)*a});
        s('halo'+i,{r:radius+3.2,opacity:h>.6?.4*a:0});
        s('link'+i,{d:`M378 560L${378+(v.x-378)*g} ${560+(v.y-560)*g}`,opacity:.7*g});
      });
      const q=back(part(t,2.8,3.05));
      s('router',{transform:`translate(378 560) scale(${q})`,opacity:q>0?1:0});
    };
  });
  register('paper-scroll-illustration',make=>{
    // ContextScroll.tsx：保留 720×4000 账册、900 展开高度与 1100 滚动距离。
    // 仅将原绘图画布转成矢量图；纸内的密排字、流水号和章节线均属于物件。
    const rng=seed=>{let a=seed>>>0;return()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296;};};
    const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
    const text=(value,x,y,size,opacity=1,center=false,spacing=0,color='#1c1a16')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" fill-opacity="${opacity}" text-anchor="${center?'middle':'start'}" letter-spacing="${spacing}"${/^[0-9]+$/.test(value)?' font-family="Oswald, Source Han Sans SC, sans-serif" font-weight="700"':''}>${esc(value)}</text>`;
    const words='档案 token 上下文 卷宗 账册 页边 印刷 纤维 墨迹 栏目 书页 合集 装订 枝叶 卷帙 架位 编目 索引 批注 源流 羊皮 宣纸 抄写 完整 保留 逐字 全宗 文库 架签 入藏 序列 连绵 持续 百万 千万 计数 度量 长度 全貌 整体 无损 窗口 注视 段落 文献 记忆 检索 条目 副本 行款 叶码 读者 校勘 见证'.split(' ');
    const sections=['长卷','不断序列','无尽之页','逐字实录','页边笔记','跨度编目','一叶连绵','完整在握','全貌','入藏注记'];
    const R=rng(77),P=rng(42),fiberPaths=Array(8).fill('');
    let textureDefs='',texture='';
    for(let i=0;i<26;i++){
      const x=P()*720,y=P()*4000,r=(.12+P()*.3)*4000,dark=P()>.5;
      textureDefs+=`<radialGradient id="NS-cloud${i}"><stop stop-color="${dark?'#5f5e58':'#fffffc'}" stop-opacity="${dark?.018:.025}"/><stop offset="1" stop-opacity="0"/></radialGradient>`;
      texture+=`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#NS-cloud${i})"/>`;
    }
    // 同色纤维合并为路径，只在建立物件时生成，播放不逐根更新。
    for(let i=0;i<1400;i++){
      const x=P()*720,y=P()*4000,a=P()*Math.PI*2,len=4+P()*22,light=P()>.5,alpha=P();
      P(); // 保持原随机序列；合并纤维使用统一线宽。
      const bucket=(light?4:0)+Math.min(3,Math.floor(alpha*4));
      fiberPaths[bucket]+=`M${x} ${y}Q${x+Math.cos(a+.4)*len*.5} ${y+Math.sin(a+.4)*len*.5} ${x+Math.cos(a)*len} ${y+Math.sin(a)*len}`;
    }
    texture+=fiberPaths.map((d,i)=>`<path d="${d}" fill="none" stroke="${i<4?'#5a503c':'#fffffa'}" stroke-opacity="${i<4?.008+(i+.5)*.015/4:.012+(i-4+.5)*.018/4}" stroke-width=".95" stroke-linecap="round"/>`).join('');
    for(let i=0;i<10;i++){
      const x=P()*720,y=P()*4000,r=60+P()*260,alpha=.012+P()*.018;
      textureDefs+=`<radialGradient id="NS-stain${i}" fr="40%"><stop stop-color="#64625b" stop-opacity="0"/><stop offset="1" stop-color="#64625b" stop-opacity="${alpha}"/></radialGradient>`;
      texture+=`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#NS-stain${i})"/>`;
    }
    let body=text('上下文账册 — NAIVE',360,58,18,1,true,3,'#30302e')+'<path d="M60 72H660" stroke="#1c1a16" stroke-opacity=".35"/>',y=106,count=0,section=0,token=0;
    while(y<3960){
      if(count>0&&count%22===0){
        section++;
        body+=`<path d="M28 ${y-6}H692M28 ${y+28}H692" stroke="#1c1a16" stroke-opacity=".28"/>`+text(`卷 ${String(section).padStart(2,'0')} — ${sections[section%sections.length]}`,360,y+18,15,.8,true,2);
        y+=62;count++;continue;
      }
      token+=6200+Math.floor(R()*900);
      body+=text(String(token).padStart(7,'0'),20,y,10.5,.34);
      const alpha=R()<.08?.4:.72,n=5+Math.floor(R()*7),parts=[];
      for(let i=0;i<n;i++)parts.push(R()<.12?Math.floor(R()*999999).toLocaleString('en-US'):words[Math.floor(R()*words.length)]);
      let line=parts.join('，')+'。';if(line.length>30)line=line.slice(0,29)+'。';
      body+=text(line,96,y,14,alpha);
      if(R()<.05)body+=`<path d="M686 ${y-3}l4 4 8-10" fill="none" stroke="#30302e" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/>`;
      y+=26;count++;
    }
    body+='<path d="M84 40V3970" stroke="#1c1a16" stroke-opacity=".18"/>';
    const s=make(`<defs>${textureDefs}
      <clipPath id="NS-paper"><rect data-part="clip" x="80" y="40" width="720" height="0"/></clipPath>
      <clipPath id="NS-sheet"><rect width="720" height="4000"/></clipPath>
      <linearGradient id="NS-roll" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f7f5ee"/><stop offset=".4" stop-color="#e6e3da"/><stop offset=".85" stop-color="#c9c6bc"/><stop offset="1" stop-color="#aaa79d"/></linearGradient>
      <linearGradient id="NS-edge" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#3c3223" stop-opacity="0"/><stop offset="1" stop-color="#46453e" stop-opacity=".08"/></linearGradient>
      <filter id="NS-paper-shadow" filterUnits="userSpaceOnUse" x="40" y="0" width="800" height="980"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#30302b" flood-opacity=".1"/></filter>
      <filter id="NS-roll-shadow" x="-10%" y="-100%" width="120%" height="400%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#30302b" flood-opacity=".16"/></filter>
    </defs><g transform="translate(188 32) scale(.3)">
      <rect data-part="paper" x="80" y="40" width="720" height="0" fill="#F4F1E8" filter="url(#NS-paper-shadow)"/>
      <g data-part="sheet" clip-path="url(#NS-paper)"><g data-part="content" transform="translate(80 40)"><g clip-path="url(#NS-sheet)">${texture}<g fill="#30302e" font-family="Source Han Sans SC, sans-serif" font-weight="300">${body}</g></g></g><rect data-part="edge-shade" x="80" width="720" height="28" fill="url(#NS-edge)"/></g>
      <rect data-part="roll" x="70" y="22" width="740" height="36" rx="18" fill="url(#NS-roll)" filter="url(#NS-roll-shadow)"/>
      <rect data-part="roll-highlight" x="74" width="732" height="2" fill="#fffffa" fill-opacity=".4"/>
    </g>`);
    const out=global.anime.cubicBezier(.16,1,.3,1);
    return p=>{
      // 原作三十帧每秒：0–24 帧展开，7–32 帧滚动；目录开头留 150 毫秒。
      const f=Math.max(0,p*90-4.5),q=out(part(f,0,24)),h=900*q,edge=40+h,roll=36-21*q,offset=1100*out(part(f,7,32));
      s('paper',{height:h,visibility:h>2?'visible':'hidden'});s('clip',{height:h});s('sheet',{visibility:h>2?'visible':'hidden'});
      s('content',{transform:`translate(80 ${40-offset})`});s('edge-shade',{y:edge-28});
      s('roll',{y:edge-roll/2,height:roll,rx:roll/2});s('roll-highlight',{y:edge-roll/2+2});
    };
  });
  register('steel-ruler-illustration',make=>{
    // 原竖尺与横向扫动一起旋转为横尺纵扫，保持原控制曲线、材质和刻度。
    const inOut=global.anime.cubicBezier(.65,0,.35,1);
    const s=make(`<defs><linearGradient id="NS-steel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#2a2a27"/><stop offset=".18" stop-color="#3d3d39"/><stop offset=".55" stop-color="#353531"/><stop offset="1" stop-color="#262623"/></linearGradient>
      <filter id="NS-shadow" x="-8%" y="-70%" width="116%" height="240%"><feDropShadow dx="0" dy="18" stdDeviation="17" flood-color="#1e1a12" flood-opacity=".28"/></filter></defs>
      <g data-part="ruler" transform="translate(62.4 151.48) scale(.46)">
        <rect width="1120" height="124" fill="url(#NS-steel)" stroke="#000" stroke-opacity=".35" filter="url(#NS-shadow)"/>
        <rect width="1120" height="2" fill="#8d8c84" opacity=".7"/>
        ${list(136,i=>{const major=i%10===0,len=major?34:i%5===0?22:12,x=30+i*8;return `<g data-steel-tick="${i}"><path d="M${x} 0v${len}" stroke="#d9d6cc" stroke-width="${major?1.3:.8}" opacity="${major?.9:.65}"/>${major?`<text x="${x}" y="64" text-anchor="middle" fill="#d9d6cc" font-size="${global.MotionKit.textSize('micro',.46)}" font-weight="700" opacity=".85">${i/10}</text>`:''}</g>`;})}
        <text x="560" y="103" text-anchor="middle" fill="#cfccc2" font-size="${global.MotionKit.textSize('micro',.46)}" font-weight="700" letter-spacing="6" opacity=".75">STEEL · 0.5 MM · STAINLESS</text>
      </g>`);
    return p=>{
      const q=inOut(clamp((p*1200-150)/(17000/30)));
      s('ruler',{transform:`translate(62.4 ${360+10*.46-(360+(20+124)*.46)*q}) scale(.46)`});
    };
  });
})(globalThis);
