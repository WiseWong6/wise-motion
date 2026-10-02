/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* Kimi 档案桌插画：按原工程几何转写为独立矢量图，保留物件的原色、细线和局部动作。 */
(function(global){
  'use strict';
  const F=global.MotionFactories=global.MotionFactories||{};
  const ink='#1C1A16',blue='#1D4E89',kraft='#C7B694';
  const mono='Oswald, "Wise Motion Sans", sans-serif';
  const cn='"STFangsong", "FangSong", "Songti SC", "Courier New", serif';
  const clamp=x=>Math.max(0,Math.min(1,x));
  const seg=(t,a,b)=>clamp((t-a)/(b-a));
  const out=x=>1-(1-x)**3;
  const back=x=>1+2.70158*(x-1)**3+1.70158*(x-1)**2;
  const lerp=(a,b,k)=>a+(b-a)*k;
  const deg=r=>r*180/Math.PI;
  const list=(n,f)=>Array.from({length:n},(_,i)=>f(i)).join('');
  const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  function rng(seed){let a=seed>>>0;return()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^a>>>15,1|a);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296;};}
  let serial=0;
  function register(id,setup){
    F[id]=(root,K,def)=>{
      const ns='kimi-'+(++serial);
      const make=html=>{
        root.innerHTML=`<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true">${html.replaceAll('NS',ns)}</svg>`;
        const nodes=new Map([...root.querySelectorAll('[data-part]')].map(n=>[n.dataset.part,n]));
        return (name,attrs)=>{const n=nodes.get(name);for(const [k,v] of Object.entries(attrs||{})){const s=String(v);if(n.getAttribute(k)!==s)n.setAttribute(k,s);}return n;};
      };
      const render=setup(make);
      return ms=>render(Math.min(3000,Math.max(0,ms*3000/def.duration_ms))/1000);
    };
  }
  // 与原纸卡、道具相同的暖色阴影，只作用于物件，不铺原场景纸底。
  const defs=`<defs>
    <filter id="NS-paper-shadow" x="-25%" y="-30%" width="150%" height="170%"><feDropShadow dx="0" dy="8" stdDeviation="11" flood-color="#281e0f" flood-opacity=".25"/></filter>
    <filter id="NS-prop-shadow" x="-45%" y="-45%" width="190%" height="210%"><feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="#281e0f" flood-opacity=".28"/></filter>
    <filter id="NS-clip-shadow" x="-70%" y="-30%" width="240%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#281e0f" flood-opacity=".22"/></filter>
    <radialGradient id="NS-moon" gradientUnits="userSpaceOnUse" cx="0" cy="-16.1" r="51.428" fx="-15.4284" fy="-31.5284" fr="10.2856"><stop stop-color="#E8ECDF"/><stop offset="1" stop-color="#9AA8A0"/></radialGradient>
    <radialGradient id="NS-iris" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="26" fx="-5" fy="-6" fr="2"><stop stop-color="#3E6FA8"/><stop offset="1" stop-color="#143A68"/></radialGradient>
    <radialGradient id="NS-eye-glow"><stop stop-color="#1D4E89" stop-opacity=".14"/><stop offset="1" stop-color="#1D4E89" stop-opacity="0"/></radialGradient>
    <radialGradient id="NS-box-glow" gradientUnits="userSpaceOnUse" cx="900" cy="670" r="400" fr="20"><stop stop-color="#4078be" stop-opacity=".55"/><stop offset=".5" stop-color="#1D4E89" stop-opacity=".22"/><stop offset="1" stop-color="#1D4E89" stop-opacity="0"/></radialGradient>
    <linearGradient id="NS-terminal-sheen" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff" stop-opacity=".05"/><stop offset=".3" stop-color="#fff" stop-opacity=".012"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <filter id="NS-terminal-shadow" x="-15%" y="-25%" width="130%" height="165%"><feDropShadow dx="0" dy="34" stdDeviation="35" flood-color="#0f0c08" flood-opacity=".55"/></filter>
    <filter id="NS-box-shadow" x="-25%" y="-30%" width="150%" height="170%"><feDropShadow dx="0" dy="8" stdDeviation="11" flood-color="#281e0f" flood-opacity=".38"/></filter>
    <filter id="NS-label-shadow" x="-25%" y="-40%" width="150%" height="190%"><feDropShadow dx="0" dy="8" stdDeviation="11" flood-color="#281e0f" flood-opacity=".12"/></filter>
    <filter id="NS-chip-shadow" x="-25%" y="-45%" width="150%" height="210%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#281e0f" flood-opacity=".25"/></filter>
    <filter id="NS-lid-shadow" x="-25%" y="-30%" width="150%" height="175%"><feDropShadow data-part="lid-shadow" dx="0" dy="8" stdDeviation="11" flood-color="#281e0f" flood-opacity=".3"/></filter>
  </defs>`;
  const text=(s,x,y,size,opts={})=>`<text x="${x}" y="${y}" fill="${opts.fill||ink}" font-size="${size}" font-family="${esc(/[A-Za-z0-9]/.test(String(s))&&!/[\u3400-\u9fff]/.test(String(s))?mono:opts.font||cn)}" font-weight="${/[A-Za-z0-9]/.test(String(s))&&!/[\u3400-\u9fff]/.test(String(s))?700:opts.weight||300}" text-anchor="${opts.align||'start'}" dominant-baseline="${opts.baseline||'alphabetic'}"${opts.part?` data-part="${opts.part}"`:''}>${esc(s)}</text>`;
  const tape=(x,y,w,r)=>`<g transform="translate(${x} ${y}) rotate(${deg(r)})"><rect x="${-w/2}" y="-14" width="${w}" height="28" fill="#e6e4d7" fill-opacity=".55" stroke="#fff" stroke-opacity=".5" stroke-width="1"/></g>`;
  function moon(){
    // core/props.js moonCard，原宽 230、月相 .72、种子 21；保留原图注。
    const w=230,h=w*1.24,m=w*.07,iw=w-2*m,ih=h-2*m-w*.14;
    const mr=iw*.26,my=-h/2+m+ih/2,R=rng(21);
    const craters=list(26,()=>{
      const a=R()*Math.PI*2,rr=R()*mr*.85,cr=1+R()*mr*.12,alpha=.1+R()*.25;
      return `<circle data-crater cx="${Math.cos(a)*rr}" cy="${my+Math.sin(a)*rr}" r="${cr}" fill="#465a5f" fill-opacity="${alpha}"/>`;
    });
    const a=Math.PI*.5*(1-.72),b=Math.PI*(.5+.72);
    // Canvas 的填充会将弧线两端直接闭合，不能改成以圆心为顶点的扇形。
    const shade=`M${Math.cos(a)*mr} ${my+Math.sin(a)*mr}A${mr} ${mr} 0 1 1 ${Math.cos(b)*mr} ${my+Math.sin(b)*mr}Z`;
    return `<rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" fill="#F2EFE6" filter="url(#NS-prop-shadow)"/><rect x="${-iw/2}" y="${-h/2+m}" width="${iw}" height="${ih}" fill="#20344C"/><circle cx="0" cy="${my}" r="${mr}" fill="url(#NS-moon)"/>${craters}<path data-moon-shade d="${shade}" fill="#141e2d" fill-opacity=".55"/>${text('图 03 — 月面 · 蓝晒',0,h/2-m*.6,13,{align:'middle',font:mono,fill:'rgba(28,26,22,.7)'})}`;
  }
  function magnifier(r=100){
    const hl=r*1.9;
    return `<g filter="url(#NS-prop-shadow)"><rect x="-7" y="${r-4}" width="14" height="${hl}" rx="6" fill="#2E2A24"/><circle r="${r}" fill="#B9B2A2"/><circle r="${r*.88}" fill="#d6dee0" fill-opacity=".5"/></g><path d="M${(-.3+Math.cos(.9*Math.PI)*.5)*r} ${(-.3+Math.sin(.9*Math.PI)*.5)*r}A${r*.5} ${r*.5} 0 0 1 ${(-.3+Math.cos(1.5*Math.PI)*.5)*r} ${(-.3+Math.sin(1.5*Math.PI)*.5)*r}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="${r*.09}"/>`;
  }
  function compass(size=175){
    const s=Math.sin(.33)*size,y=Math.cos(.33)*size*.9;
    return `<g filter="url(#NS-prop-shadow)"><path d="M0 ${-size*.5}L${-s} ${y}M0 ${-size*.5}L${s} ${y}" fill="none" stroke="#35322C" stroke-width="${size*.045}" stroke-linecap="round"/><circle cy="${-size*.55}" r="${size*.09}" fill="#6E6759"/><rect x="${-size*.03}" y="${-size*.62}" width="${size*.06}" height="${size*.12}" fill="#6E6759"/><path d="M${-s-4} ${y}h8l-4 14Z" fill="${ink}"/></g>`;
  }
  function pencil(len=270){return `<g filter="url(#NS-prop-shadow)"><rect x="${-len/2}" y="-6" width="${len*.82}" height="12" rx="2" fill="#2B2B2B"/><path d="M${len*.32} -6L${len*.46} 0L${len*.32} 6Z" fill="#D8C49A"/><path d="M${len*.42} -2.4L${len*.48} 0L${len*.42} 2.4Z" fill="${ink}"/><rect x="${-len/2-8}" y="-6" width="10" height="12" fill="#8C8578"/></g>`;}
  function ruler(len=360){return `<rect x="${-len/2}" y="-16" width="${len}" height="32" rx="3" fill="#C9C2B0" filter="url(#NS-prop-shadow)"/>`+list(21,i=>`<path d="M${-len/2+i*len/20} -16v${i%5===0?12:6}" stroke="${ink}" stroke-opacity=".75" stroke-width="1.2"/>${i%5===0?text(i,-len/2+i*len/20,8,10,{align:'middle',font:mono,fill:'rgba(28,26,22,.75)'}):''}`);}
  function clip(size=64){const w=size*.32,h=size;return `<path d="M${-w*.4} ${-h*.3}V${h*.35}Q${-w*.4} ${h*.5} 0 ${h*.5}Q${w*.4} ${h*.5} ${w*.4} ${h*.35}V${-h*.25}Q${w*.4} ${-h*.42} ${w*.12} ${-h*.42}Q${-w*.14} ${-h*.42} ${-w*.14} ${-h*.25}V${h*.2}" fill="none" stroke="#4A463E" stroke-width="${size*.09}" stroke-linecap="round" stroke-linejoin="round" filter="url(#NS-clip-shadow)"/>`;}
  register('moon-card-illustration',make=>{
    const s=make(defs+`<g data-part="card" transform="translate(320 180) rotate(${deg(.06)})">${moon()}</g>`);
    return t=>{const k=out(seg(t,0,.7));s('card',{opacity:k,transform:`translate(320 ${180-60*(1-k)}) rotate(${deg(.06)})`});};
  });
  register('drafting-tools-illustration',make=>{
    // 每个物件保留原比例与角度，独立提取后将桌面空档收拢。
    const props=[{x:480,y:124,r:.55,art:magnifier()},{x:136,y:158,r:-.45,art:compass()},{x:400,y:279,r:.1,art:pencil()},{x:233,y:309,r:-.025,art:ruler()},{x:320,y:83,r:.7,art:clip(64)}];
    const s=make(defs+props.map((p,i)=>`<g data-part="p${i}" transform="translate(${p.x} ${p.y}) rotate(${deg(p.r)})"><g transform="scale(.75)">${p.art}</g></g>`).join(''));
    return t=>props.forEach((p,i)=>{const start=(i+2)*.12,k=out(seg(t,start,start+.7)),dy=[50,40,30,30,0][i];s('p'+i,{opacity:k>0?1:0,transform:`translate(${p.x} ${p.y-dy*(1-k)}) rotate(${deg(p.r)})`});});
  });
  register('archive-folder-illustration',make=>{
    const w=470,h=660,tabs=['语言','意义','图像','模式','结构','逻辑'];
    const s=make(defs+`<g transform="translate(320 180) scale(.43)"><g data-part="folder"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" fill="${kraft}" filter="url(#NS-prop-shadow)"/>`+tabs.map((v,i)=>`<g transform="translate(${w/2-10} ${-h/2+30+i*60})"><rect width="26" height="46" fill="#B3A17F"/><g transform="translate(13 23) rotate(90)">${text(v,0,0,12,{align:'middle',baseline:'middle',fill:'rgba(40,32,18,.75)'})}</g></g>`).join('')+text('',0,-220,46,{part:'label',align:'middle',font:'"Songti SC", "STSong", "Times New Roman", serif',fill:'rgba(28,26,22,.85)'})+`</g></g>`);
    return t=>{const k=out(seg(t,.12,.82));s('folder',{opacity:k,transform:`translate(${90*(1-k)} 0) rotate(${deg(-.035)})`});const n=s('label'),str='推理档案'.slice(0,Math.max(0,Math.floor((t-1)*6)));if(n.textContent!==str)n.textContent=str;};
  });
  const words='档案 词元 上下文 卷宗 账册 页边 印刷 纤维 墨迹 栏目 书页 合集 装订 枝叶 卷帙 架位 编目 索引 批注 源流 羊皮 宣纸 抄写 完整 保留 逐字 全宗 文库 架签 入藏 序列 连绵 持续 百万 千万 计数 度量 长度 全貌 整体 无损 窗口 注视 段落 文献 记忆 检索 条目 副本 行款 叶码 读者 校勘 见证'.split(' ');
  register('folio-cards-illustration',make=>{
    const cards=[[95,168,210,272,-.07,'卷宗 0007','叶 0007 / 2048',501],[332,302,190,244,.05,'卷宗 0128','叶 0128 / 2048',502],[118,560,200,258,.03,'卷宗 0542','叶 0542 / 2048',503],[342,646,185,236,-.05,'卷宗 0917','叶 0917 / 2048',504]];
    const art=cards.map(([x,y,w,h,r,title,footer,seed],i)=>{
      const R=rng(seed);let body='';
      for(let ly=-h/2+58;ly<h/2-34;ly+=13){const a=.35+R()*.25,n=4+Math.floor(R()*5);let line='';for(let j=0;j<n;j++)line+=(j?'，':'')+words[Math.floor(R()*words.length)];body+=text(line,-w/2+16,ly,9,{fill:`rgba(28,26,22,${a})`});}
      return `<g data-part="card${i}"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="3" fill="#E3DECF" filter="url(#NS-paper-shadow)"/>${text(title,-w/2+16,-h/2+30,18,{weight:700})}<path d="M${-w/2+16} ${-h/2+40}H${w/2-16}" stroke="${ink}" stroke-opacity=".3"/>${body}${text(footer,-w/2+16,h/2-14,17,{fill:'rgba(28,26,22,.62)'})}</g>`;
    }).join('');
    const s=make(defs+`<g transform="translate(320 180) scale(.38) translate(-313.5 -525)">${art}<g data-part="clip">${clip(54)}</g></g>`);
    return t=>{cards.forEach(([x,y,w,h,r],i)=>{const k=out(seg(t,.05+i*.12,.75+i*.12));s('card'+i,{opacity:k,transform:`translate(${x+w/2} ${y+h/2-50*(1-k)}) rotate(${deg(r)})`});});s('clip',{opacity:out(seg(t,.17,.87))>.85?1:0,transform:`translate(496 308) rotate(${deg(.45)})`});};
  });
  function chartPoints(){const R=rng(77);let yy=30;return Array.from({length:9},(_,i)=>{if(i)yy=Math.max(-125,Math.min(100,yy+(R()-.52)*95));return [-120+i*246/8,yy];});}
  register('chart-card-illustration',make=>{
    const pts=chartPoints(),peak=pts.reduce((a,b)=>b[1]<a[1]?b:a),d=pts.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ');
    const s=make(defs+`<g data-part="card"><rect x="-150" y="-167.5" width="300" height="335" rx="3" fill="#F2EFE6" filter="url(#NS-paper-shadow)"/>`+[-74.5,-12,50.5].map(y=>`<path d="M-120 ${y}H126" fill="none" stroke="${ink}" stroke-opacity=".1" stroke-width="1" stroke-dasharray="3 4"/>`).join('')+`<path d="M-120 -137V113H126M-123 -131l3-6 3 6M120 110l6 3-6 3" fill="none" stroke="${ink}" stroke-opacity=".55" stroke-width="1"/>`+list(5,i=>`<path d="M${-120+i*61.5} 113v5M-125 ${-137+i*62.5}h5" stroke="${ink}" stroke-opacity=".55" stroke-width="1"/>`)+`<path data-chart d="${d}" fill="none" stroke="${blue}" stroke-opacity=".85" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" transform="translate(.9 .9)" fill="none" stroke="${blue}" stroke-opacity=".15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`+pts.map(([x,y])=>`<circle data-point cx="${x}" cy="${y}" r="2.5" fill="${blue}" fill-opacity=".8"/>`).join('')+`<circle cx="${peak[0]}" cy="${peak[1]}" r="6.5" fill="none" stroke="${blue}" stroke-opacity=".55" stroke-width="1"/>${text('图 B — 信号',3,150,14,{align:'middle',baseline:'middle',fill:'rgba(28,26,22,.7)'})}</g>`);
    return t=>{const k=out(seg(t,.2,.75)),r=-.022-(1-k)*.28;s('card',{opacity:Math.min(1,k*2.5),transform:`translate(320 ${180-820*(1-k)}) rotate(${deg(r)}) scale(.8)`});};
  });
  register('aperture-eye-illustration',make=>{
    const s=make(defs+`<g transform="translate(320 180) scale(1.45)"><g data-part="eye"><circle r="95" fill="url(#NS-eye-glow)"/>`+list(12,i=>{const a=i/12*Math.PI*2;return `<path d="M${Math.cos(a)*58} ${Math.sin(a)*58}L${Math.cos(a)*66} ${Math.sin(a)*66}" stroke="${blue}" stroke-opacity=".5" stroke-width="1.5"/>`;})+`<circle r="52" fill="none" stroke="${blue}" stroke-width="3"/><circle r="44" fill="none" stroke="${blue}" stroke-opacity=".35" stroke-width="1"/><circle r="26" fill="url(#NS-iris)"/><circle r="10.5" fill="#14120F"/><circle cx="-6.5" cy="-7.5" r="3" fill="#fff" fill-opacity=".85"/></g><circle data-part="pulse" r="56" fill="none" stroke="${blue}" stroke-width="2"/></g>`);
    return clock=>{const t=4.75+Math.min(clock,1.6),k=back(seg(t,4.88,5.26)),b=1+.015*Math.sin(t*2.2)*seg(t,5.3,5.6),p=seg(t,5.08,5.6);s('eye',{opacity:seg(t,4.88,5.12),transform:`scale(${k*b})`});s('pulse',{r:lerp(56,120,out(p)),opacity:p>0&&p<1?.35*(1-p):0});};
  });
  const terminalLines=[
    ['$ kimi --model k3',.50,'#7FA8D9',700],['▸ 任务：复现 I–Love–Q 普适关系',.90,'#D8D3C6'],['▸ 扫描 20+ 篇论文 … ok',1.26,'#D8D3C6'],['▸ 实现数值管线',1.62,'#D8D3C6'],['▸ [扫描] 300+ 个状态方程',1.98,'#D8D3C6'],['▸ [修复] 已发表公式中的不一致',2.34,'#D8D3C6'],['Kimi 正在调试',3.60,'#EAE6DA'],['✓ 生成 3,000+ 行——管线验证通过',4.60,'#8A9467',700],['✓ 47 项测试通过 · 0 失败',4.85,'#8A9467',700]
  ];
  register('terminal-window-illustration',make=>{
    // s5_agents 原窗口的宽高、标题栏、去饱和圆点与输出颜色全部保留。
    const s=make(defs+`<g transform="translate(320 180) scale(.42)"><g data-part="window"><rect x="-620" y="-330" width="1240" height="660" rx="16" fill="#171512" filter="url(#NS-terminal-shadow)"/><clipPath id="NS-terminal"><rect x="-620" y="-330" width="1240" height="660" rx="16"/></clipPath><g clip-path="url(#NS-terminal)"><rect x="-620" y="-330" width="1240" height="46" fill="#201D18"/><rect x="-620" y="-330" width="1240" height="660" fill="url(#NS-terminal-sheen)"/></g><path d="M-620 -283.5H620" stroke="#e9e6dc" stroke-opacity=".08" stroke-width="1"/>`+['#B25A48','#C09B4D','#7C8F5A'].map((v,i)=>`<circle cx="${-590+i*26}" cy="-307" r="7" fill="${v}"/>`).join('')+text('kimi-code — agent session',0,-306,19,{align:'middle',baseline:'middle',font:mono,weight:400,fill:'rgba(216,211,198,.45)'})+terminalLines.map(([v,start,color,weight],i)=>text(v,-576,-234+i*54,25,{part:'row'+i,fill:color,weight:weight||400,font:mono,baseline:'middle'})).join('')+`<rect data-part="cursor" x="-573" y="-247" width="13" height="26" fill="#D8D3C6"/></g></g>`);
    // 仅测量有变化的两行；静止缩略图不触发持续排版。
    const widths=new Map();
    const width=(str,node)=>{if(widths.has(str))return widths.get(str);let v;try{v=node.getComputedTextLength();}catch(e){}if(!Number.isFinite(v)||v<=0)v=Array.from(str).reduce((n,c)=>n+(/[^\x00-\xff]/.test(c)?25:15),0);widths.set(str,v);return v;};
    return clock=>{
      // 窗口固定，只播放原片命令输入、日志与光标；不带入场、后退或前景标题。
      const t=Math.min(clock*2,5.1);
      let last=0,debug='';
      terminalLines.forEach(([v,start],i)=>{if(t>=start)last=i;let shown=v;if(i===0)shown=v.slice(0,Math.max(0,Math.floor((t-start)*50)));if(i===6){debug=t<3.6?'':t>=4.6?'...':['','.','..','...'][Math.floor((t-3.6)/.34)%4];shown=v+debug;}const n=s('row'+i,{opacity:seg(t,start,start+.12)});if(n.textContent!==shown)n.textContent=shown;});
      let row=Math.min(last+1,9),x=-576;
      if(t<.5){row=0;}else if(t<.5+terminalLines[0][0].length/50){row=0;x+=width(s('row0').textContent,s('row0'));}else if(t>=3.6&&t<4.6){row=6;x+=width(terminalLines[6][0]+debug,s('row6'));}
      s('cursor',{x:x+3,y:-234+row*54-13,opacity:t>=.25&&Math.floor(t*2.4)%2===0?.9:0});
    };
  });
  register('archive-box-illustration',make=>{
    const R=rng(97),chips=Array.from({length:7},(_,i)=>{
      const row=i<4?0:1,col=row?i-4:i,n=row?3:4;
      return {x:1230-(n*264+(n-1)*24)/2+132+col*288,y:row?300:210,sx:900+(R()-.5)*160,sy:660+(R()-.5)*60,r0:(R()-.5)*.5,r1:(R()-.5)*.05};
    });
    const s=make(defs+`<g transform="translate(320 180) scale(.34) translate(-1135 -498)"><g data-part="box"><rect x="620" y="550" width="560" height="300" rx="4" fill="${kraft}" filter="url(#NS-box-shadow)"/><rect x="634" y="564" width="532" height="272" fill="none" stroke="#3c301c" stroke-opacity=".25" stroke-width="1" stroke-dasharray="6 5"/><g data-part="interior"><rect x="638" y="568" width="524" height="264" rx="3" fill="#8A7A5C"/>`+list(3,i=>`<rect x="660" y="${594+i*16}" width="480" height="3" fill="#e9e5d8" fill-opacity=".35"/>`)+`<rect data-part="glow" x="480" y="270" width="840" height="840" fill="url(#NS-box-glow)"/></g><g data-part="label"><rect x="720" y="730" width="420" height="96" rx="2" fill="#F2EFE6" filter="url(#NS-label-shadow)"/>${text('K3 — 模型权重',930,764,27,{align:'middle',baseline:'middle',weight:700})}${text('2.8 万亿参数 · 月之暗面',930,800,18,{align:'middle',baseline:'middle',fill:'rgba(28,26,22,.62)'})}</g><g data-part="lid"><rect x="0" y="-150" width="560" height="300" rx="4" fill="${kraft}" filter="url(#NS-lid-shadow)"/><rect x="0" y="-150" width="560" height="300" rx="4" fill="#fffaeb" fill-opacity=".1"/><rect x="6" y="-144" width="548" height="288" rx="3" fill="none" stroke="#3c301c" stroke-opacity=".3" stroke-width="1.5"/>${text('档案盒 — 第 27 号',280,-110,19,{align:'middle',baseline:'middle',fill:'rgba(40,32,18,.55)'})}</g></g>`+chips.map((p,i)=>`<g data-part="chip${i}"><rect x="-132" y="-37" width="264" height="74" rx="3" fill="#F0EDE2" filter="url(#NS-chip-shadow)"/><circle cx="-110" r="6" fill="${blue}"/>${text(`k3-0000${i+1}.safetensors`,-94,1,18,{font:mono,baseline:'middle',fill:'rgba(28,26,22,.85)'})}</g>`).join('')+'</g>');
    return clock=>{const t=Math.min(clock,2.97),k=out(seg(t,.5,1.4)),box=out(seg(t,.15,.8));s('box',{opacity:box,transform:`translate(0 ${46*(1-box)})`});s('lid-shadow',{dy:8+k*10,stdDeviation:(22+k*14)/2,'flood-opacity':.3+k*.15});s('interior',{opacity:k});s('glow',{opacity:k});s('label',{opacity:k});s('lid',{transform:`translate(620 700) rotate(${deg(-.9*k)})`});chips.forEach((p,i)=>{const q=out(seg(t,1.4+i*.12,2.25+i*.12));s('chip'+i,{opacity:q,transform:`translate(${lerp(p.sx,p.x,q)} ${lerp(p.sy,p.y,q)}) rotate(${deg(lerp(p.r0,p.r1,q))}) scale(${lerp(.6,1,q)})`});});};
  });
})(globalThis);
