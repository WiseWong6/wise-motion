/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 从历史配方提炼的结构示例。保留身份、顺序与参数关系；本机图形适配见 NOTICE.md。 */
(function (global) {
  'use strict';
  let serial = 0;
  const F = global.MotionFactories = global.MotionFactories || {};
  const ink = 'var(--ink)', muted = 'var(--muted)', panel = 'var(--panel)', path = 'var(--path)';
  const list = (n, fn) => Array.from({length:n}, (_,i) => fn(i)).join('');
  const attr = (name,value,extra) => new RegExp('(?:^|\\s)'+name+'\\s*=').test(extra) ? '' : ` ${name}="${value}"`;
  const rect = (id,x,y,w,h,extra='') => `<rect data-part="${id}" x="${x}" y="${y}" width="${w}" height="${h}"${attr('rx',5,extra)}${attr('fill',panel,extra)}${attr('stroke',muted,extra)}${attr('stroke-width',.65,extra)} ${extra}/>`;
  const dot = (id,x,y,r=8,extra='') => `<circle data-part="${id}" cx="${x}" cy="${y}" r="${r}"${attr('fill',ink,extra)} ${extra}/>`;
  const text = (id,x,y,words,size=25,extra='') => `<text data-part="${id}" x="${x}" y="${y}" text-anchor="middle" font-size="${global.MotionKit.textSize(size)}" fill="${ink}"${attr('font-weight',global.MotionKit.textSize(size)>=global.MotionKit.type.title||(/[A-Za-z0-9]/.test(String(words))&&!/[\u3400-\u9fff]/.test(String(words)))?700:300,extra)} ${extra}>${words}</text>`;
  const line = (id,x1,y1,x2,y2,extra='') => `<line data-part="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${attr('stroke',muted,extra)}${attr('stroke-width',.85,extra)} ${extra}/>`;
  function stage(root, markup) {
    const ns = 'motion-pattern-' + (++serial);
    root.innerHTML = `<svg class="pattern-svg" viewBox="0 0 640 360" width="640" height="360" style="color:${ink};font-family:inherit" aria-hidden="true">${markup.replaceAll('NAMESPACE',ns)}</svg>`;
    const parts = new Map([...root.querySelectorAll('[data-part]')].map(x => [x.dataset.part,x]));
    return (id, attrs) => { const el=parts.get(id); if (attrs) for (const [k,v] of Object.entries(attrs)) { const value=String(v); if(el.getAttribute(k)!==value)el.setAttribute(k,value); } return el; };
  }
  const setText = (s,id,words) => {const el=s(id),value=String(words);if(el.textContent!==value)el.textContent=value;};
  const move = (s,id,x=0,y=0,scale=1,angle=0) => s(id,{transform:`translate(${x} ${y}) rotate(${angle}) scale(${scale})`});
  function register(id, setup) {
    F[id] = (root,K,definition) => {
      const render=setup(root,K,definition);
      return t => render(K.clamp(t/definition.duration_ms));
    };
  }
  const smooth = p => 1-(1-Math.min(1,Math.max(0,p)))**3;
  const section = (p,a,b) => Math.min(1,Math.max(0,(p-a)/(b-a)));

  F['theme-card-layout'] = (root,K) => {
    // 原主题卡用排版块示意眉题、标题和说明，不替换成另画的卡片或文案。
    const rows=[
      {y:92,w:130,h:16,at:.45,fill:'var(--accent)',alpha:1},
      {y:140,w:480,h:46,at:.95,fill:'var(--ink)',alpha:.15},
      {y:212,w:340,h:46,at:1.45,fill:'var(--ink)',alpha:.15},
      {y:306,w:250,h:14,at:1.95,fill:'var(--muted)',alpha:.45}
    ];
    const s=stage(root,`<g transform="translate(98 48) scale(.6)">
      <defs>
        <clipPath id="NAMESPACE-theme-card-clip"><rect width="740" height="440" rx="16"/></clipPath>
        <linearGradient id="NAMESPACE-theme-card-light" gradientUnits="userSpaceOnUse" x1="-90" y1="0" x2="90" y2="0">
          <stop offset="0" stop-color="var(--accent)" stop-opacity="0"/><stop offset=".5" stop-color="var(--accent)" stop-opacity=".08"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <g data-part="theme-card">
        <rect width="740" height="440" rx="16" fill="var(--card)" stroke="var(--card-edge)" stroke-width="2"/>
        <g clip-path="url(#NAMESPACE-theme-card-clip)">
          ${rows.map((r,i)=>`<rect data-part="theme-row${i}" data-theme-row="${i}" y="${r.y}" height="${r.h}" rx="${Math.min(8,r.h/2)}" fill="${r.fill}"/>`).join('')}
          <rect data-part="theme-underline" x="64" y="196" height="4" fill="var(--accent)"/>
          <rect data-part="theme-cursor" x="418" y="212" width="8" height="46" fill="var(--teal)"/>
        </g>
      </g>
      <g clip-path="url(#NAMESPACE-theme-card-clip)"><g data-part="theme-light"><rect x="-90" y="0" width="180" height="440" fill="url(#NAMESPACE-theme-card-light)"/></g></g>
    </g>`);
    return elapsed=>{
      // 保留原三秒设计时钟及独立的固定卡面扫光，末尾四百毫秒冻结。
      const u=K.clamp(elapsed,0,3000)/1000,q=K.span(u,.1,.6,'inOutCubic');
      s('theme-card',{opacity:q,transform:`translate(0 ${(1-q)*26})`});
      rows.forEach((r,i)=>{
        const e=K.span(u,r.at,r.at+.45,'inOutCubic');
        s('theme-row'+i,{x:64-150*(1-e),width:r.w*(.55+.45*e),opacity:e*r.alpha});
      });
      const underline=200*K.span(u,2.5,3,'inOutCubic');
      s('theme-underline',{width:underline,opacity:underline>1?1:0});
      s('theme-cursor',{opacity:u>2.1&&Math.floor(u*2.3)%2===0?1:0});
      const travel=((u*.42%1)+1)%1;
      s('theme-light',{transform:`translate(${-140+1020*travel} 0)`});
    };
  };

  F['terminal-code'] = (root,K) => {
    // 窗口与打字时钟沿用原作，代码统一为画板中的正文大小。
    // 字宽来自本地 Oswald Bold / 思源 Light；缩略图和播放都无需现场测量。
    const codeSize=K.textSize('body',.6);
    const advances={' ':.221,'"':.415,'(':.315,')':.315,',':.25,';':.25,'=':.535,a:.46,c:.468,d:.503,e:.47,i:.265,m:.753,n:.507,o:.483,r:.383,s:.424,t:.351};
    const width=value=>Array.from(value).reduce((sum,ch)=>sum+codeSize*(advances[ch]??1),0);
    const code=[
      [['const ','var(--ink)'],['idea','var(--ink)'],[' = ','var(--muted)'],['"一个画面"','var(--teal)'],[';','var(--muted)']],
      [['const ','var(--ink)'],['motion','var(--ink)'],[' = ','var(--muted)'],['"让它动起来"','var(--teal)'],[';','var(--muted)']],
      [['create','var(--ink)'],['(','var(--muted)'],['idea','var(--ink)'],[', ','var(--muted)'],['motion','var(--ink)'],[');','var(--muted)']]
    ];
    const rows=code.map((tokens,i)=>{
      let pen=62,start=0;
      return {words:tokens.map(([value])=>value).join(''),tokens:tokens.map(([value,color],j)=>{
        const token={value,color,x:pen,start,runs:[]};let at=0;
        for(const run of value.match(/[0-9A-Za-z.\-]+|[^0-9A-Za-z.\-]+/g)){
          token.runs.push({value:run,start:at,part:`terminal-token${i}-${j}-${token.runs.length}`,latin:/[0-9A-Za-z.\-]/.test(run)});at+=run.length;
        }
        pen+=width(value);start+=value.length;return token;
      })};
    });
    const s=stage(root,`<g transform="translate(80 78) scale(.6)"><g data-part="terminal-window" font-weight="300">
      <defs>
        <clipPath id="NAMESPACE-terminal-bar"><rect width="800" height="340" rx="18"/></clipPath>
        <filter id="NAMESPACE-terminal-shadow" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity=".4"/></filter>
        <linearGradient id="NAMESPACE-terminal-beam" gradientUnits="userSpaceOnUse" x1="-55" y1="0" x2="55" y2="0"><stop offset="0" stop-color="var(--accent)" stop-opacity="0"/><stop offset=".5" stop-color="var(--accent)" stop-opacity=".18"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient>
      </defs>
      <rect width="800" height="340" rx="18" fill="var(--card)" filter="url(#NAMESPACE-terminal-shadow)"/>
      <g clip-path="url(#NAMESPACE-terminal-bar)"><rect width="800" height="48" fill="var(--symbol)"/></g>
      <rect width="800" height="340" rx="18" fill="none" stroke="var(--card-edge)" stroke-width="1.5"/>
      ${['#ff5f56','#ffbd2e','#27c93f'].map((color,i)=>`<circle cx="${27+i*23}" cy="24" r="6" fill="${color}"/>`).join('')}
      <text x="400" y="14" text-anchor="middle" dominant-baseline="text-before-edge" font-family="Oswald, sans-serif" font-weight="700" font-size="${K.textSize('caption',.6)}" fill="var(--muted)">creative-session</text>
      ${rows.map((row,i)=>`<g data-part="terminal-row${i}" data-terminal-code-row="${i}">
        <text x="30" y="${87+i*72}" dominant-baseline="text-before-edge" font-size="${codeSize}" fill="var(--accent)">›</text>
        ${row.tokens.map(token=>`<text x="${token.x}" y="${87+i*72}" fill="${token.color}" dominant-baseline="text-before-edge" xml:space="preserve" style="white-space:pre">${token.runs.map(run=>`<tspan data-part="${run.part}" font-size="${codeSize}" font-weight="${run.latin?700:300}" font-family="${run.latin?'Oswald':'Wise Motion Sans'}, sans-serif">${K.escape(run.value)}</tspan>`).join('')}</text>`).join('')}
        <rect data-part="terminal-cursor${i}" y="${90+i*72}" width="10" height="29" fill="var(--teal)"/>
      </g>`).join('')}
      <g data-part="terminal-status"><rect x="-55" y="300" width="110" height="28" fill="url(#NAMESPACE-terminal-beam)"/><rect x="-18" y="320" width="36" height="4" fill="var(--accent)" fill-opacity=".58"/></g>
    </g></g>`);
    return elapsed=>{
      // 原场景使用二点五秒设计时钟；末尾半秒冻结，保持代码清晰可读。
      const t=K.clamp(elapsed,0,2500)/1000,p=K.span(t,0,.4,'inOutCubic');
      s('terminal-window',{opacity:p,transform:`translate(0 ${16*(1-p)})`});
      rows.forEach((row,i)=>{
        const count=Math.max(0,Math.floor((t-.3-i*.5)*50));
        s('terminal-row'+i,{opacity:count?1:0});
        for(const token of row.tokens)for(const run of token.runs)setText(s,run.part,run.value.slice(0,Math.max(0,count-token.start-run.start)));
        s('terminal-cursor'+i,{x:62+width(row.words.slice(0,count)),opacity:count>0&&count<row.words.length&&Math.floor(t*8)%2===0?1:0});
      });
      const travel=((t*.18%1)+1)%1;
      s('terminal-status',{transform:`translate(${36+728*travel} 0)`});
    };
  };

  F['formula-evolve'] = (root,K) => {
    // 定稿的四项公式及真实词点。演示统一加快两倍，保留先横移、再合行的两步关系。
    const terms=[
      {id:'years',at:120,parts:[['years',208,52,'var(--teal)','X年',332,55]]},
      {id:'domain',at:750,parts:[['domain',378,52,'var(--blue)','电商',162,205],['domain-plus',292,43,'var(--muted)','+',248,130]]},
      {id:'audience',at:1430,parts:[['audience',548,52,'var(--accent)','C端',-8,355],['audience-plus',464,43,'var(--muted)','+',76,280]]},
      {id:'experience',at:1500,parts:[['experience',783,52,'var(--teal)','产品经验',-243,505],['experience-plus',630,43,'var(--muted)','+',-90,430]]}
    ];
    const s=stage(root,`<g transform="translate(104 -68) scale(.4)" font-weight="300">
      ${terms.map(term=>`<g data-part="term-${term.id}" data-formula-term="${term.id}">${term.parts.map(([id,x,size,color,words])=>`<g data-part="pose-${id}"><text x="${x}" y="435" text-anchor="middle" font-size="${K.textSize('title',.4)}" font-weight="700" fill="${color}">${words}</text></g>`).join('')}</g>`).join('')}
      <g data-part="underline"><path data-part="underline-stroke" d="M209 463H871" fill="none" stroke="var(--teal)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".5" pathLength="1" stroke-dasharray="1 1"/></g>
    </g>`);
    return elapsed=>{
      const t=Math.min(3400,Math.max(0,elapsed));
      const spread=K.span(t,1714,1949,'inOutCubic');
      const row=K.span(t,1972.5166666666664,2142.5166666666664,'inOutCubic');
      for(const term of terms){
        s('term-'+term.id,{opacity:K.span(t,term.at,term.at+110,'outCubic')});
        for(const [id,,,,,x,y] of term.parts)s('pose-'+id,{transform:`translate(${K.mix(x,0,spread)} ${K.mix(y,0,row)})`});
      }
      const underline=K.span(t,2780.0333333333347,2910.0333333333347,'outCubic');
      s('underline',{opacity:underline});
      s('underline-stroke',{'stroke-dashoffset':1-underline});
    };
  };

  F['experience-progress'] = (root,K) => {
    // 保留三张经验卡和原成片的讲述间距；只统一成目录的中性配色。
    const cards=[['精准描述需求','把话说清楚',3.9,7.2,235],['进行需求拆解','分成小任务',7.2,13.5,540],['借助真实规律','从世界找灵感',13.5,19.5,845]];
    // 原成片五个讲述区间，统一加快四倍；不是三个等长的进度窗口。
    const clock=[[120,3.9],[986.666666666667,7.2],[1361.666666666667,9.7],[2053.3333333333335,13.5],[2503.333333333334,16.2],[3053.3333333333335,19.5]];
    const s=stage(root,`<g transform="translate(-4 -309) scale(.6)" font-weight="300">
      <defs>
        <linearGradient id="NAMESPACE-experience-beam" gradientUnits="userSpaceOnUse" x1="-95" y1="0" x2="95" y2="0">
          <stop offset="0" stop-color="var(--card-ink)" stop-opacity="0"/><stop offset=".5" stop-color="var(--card-ink)" stop-opacity=".12"/><stop offset="1" stop-color="var(--card-ink)" stop-opacity="0"/>
        </linearGradient>
        ${cards.map((_,i)=>`<clipPath id="NAMESPACE-experience-clip${i}"><rect x="0" y="0" width="260" height="310" rx="12"/></clipPath>`).join('')}
      </defs>
      ${cards.map(([title,label],i)=>`<g data-part="experience-card${i}" data-experience-card="${i}">
        <rect data-part="experience-frame${i}" x="0" y="0" width="260" height="310" rx="14" fill="var(--card)" stroke-width="2"/>
        <path d="M34 0H226" stroke="var(--card-muted)" stroke-width="3" fill="none"/>
        <text x="130" y="44" font-size="${K.textSize('caption',.6)}" font-family="Oswald, sans-serif" font-weight="700" fill="var(--card-ink)" text-anchor="middle" dominant-baseline="text-before-edge">${String(i+1).padStart(2,'0')}</text>
        <text x="130" y="132" font-size="${K.textSize('body',.6)}" fill="var(--card-ink)" text-anchor="middle" dominant-baseline="text-before-edge">${title}</text>
        <path d="M48 206H212" stroke="var(--card-muted)" stroke-width="1.4" opacity=".9" fill="none"/>
        <text x="130" y="240" font-size="${K.textSize('caption',.6)}" fill="var(--card-muted)" text-anchor="middle" dominant-baseline="text-before-edge">${label}</text>
        <g data-part="experience-flow${i}" clip-path="url(#NAMESPACE-experience-clip${i})">
          <g data-part="experience-beam${i}"><rect x="-95" y="0" width="190" height="310" fill="url(#NAMESPACE-experience-beam)"/></g>
          <rect data-part="experience-progress${i}" x="0" y="305" height="5" fill="var(--card-ink)"/>
        </g>
      </g>`).join('')}
    </g>`);
    return elapsed=>{
      const ms=K.clamp(elapsed,0,3400);
      let u=19.5;
      for(let i=0;i<clock.length-1;i++)if(ms<clock[i+1][0]){
        const [at,from]=clock[i],[end,to]=clock[i+1];u=K.mix(from,to,(ms-at)/(end-at));break;
      }
      cards.forEach(([, ,at,end,x],i)=>{
        const q=K.span(u,at,at+.55,'inOutCubic'),e=K.ease(q,'inOutCubic'),active=u>=at&&u<end;
        s('experience-card'+i,{opacity:q,transform:`translate(${x-130} ${660+(1-e)*26})`});
        s('experience-frame'+i,{stroke:active?'var(--card-ink)':'var(--card-muted)','stroke-opacity':active?.55:1});
        s('experience-flow'+i,{opacity:active?1:0});
        const travel=((u-at)*.31%1+1)%1;
        s('experience-beam'+i,{transform:`translate(${-130+travel*520} 0)`});
        s('experience-progress'+i,{width:260*K.clamp((u-at)/(end-at))});
      });
    };
  };

  F['word-cloud-lift'] = (root,K) => {
    // 只提取原云形与手工词位，原视频的回应图和整页底色不带入。
    const words=[
      ['没感觉',0,-218,50,'var(--muted)'],['太死板',-244,-106,46,'var(--muted)'],
      ['再好看一点',-8,-95,52,'var(--muted)'],['不够高级',268,-105,43,'var(--muted)'],
      ['不够顺',-302,15,42,'var(--muted)'],['有点丑',0,12,88,'var(--teal)'],
      ['有点僵硬',284,16,68,'var(--ink)'],['不够舒服',-286,114,42,'var(--muted)'],
      ['不够灵动',0,113,60,'var(--ink)'],['不够自然',298,103,42,'var(--muted)'],
      ['缺点氛围',-227,187,41,'var(--muted)'],['再优化一下',16,186,43,'var(--muted)'],
      ['节奏不对',262,180,41,'var(--muted)']
    ];
    const s=stage(root,`<g transform="translate(158 -25) scale(.3)" font-weight="300">
      <path data-part="cloud" d="M-337 229 C-502 226 -505 16 -402 -26 C-420 -184 -237 -234 -160 -163 C-141 -350 161 -350 179 -189 C286 -267 443 -175 411 -43 C529 3 510 227 371 230 C179 251 -132 253 -337 229 Z" fill="var(--card)" stroke="var(--card-edge)" stroke-width="1.5"/>
      ${words.map(([label,x,y,size,color],i)=>`<text data-part="word${i}" data-cloud-word="${label}" text-anchor="middle" dominant-baseline="text-before-edge" fill="${color}">${label}</text>`).join('')}
    </g>`);
    return elapsed=>{
      // 原成片前两段视觉时钟；五秒后停在收拢完成处，不进入后续回应图。
      const ms=Math.min(5000,Math.max(0,elapsed));
      const t=ms<=3600?ms/3600*3.7:3.7+(ms-3600)/1800*2.8;
      const lift=K.span(t,4.55,5.7,'inOutCubic'),scale=K.mix(1,.72,lift);
      const fontLift=K.mix(1.25,1,lift),idle=.22+.78*(1-lift);
      const x=540+Math.sin(t*.86)*7*idle,y=K.mix(650,375,lift)+Math.cos(t*.71)*4*idle;
      const breath=1+Math.sin(t*1.55)*.009*idle;
      s('cloud',{transform:`translate(${x} ${y}) scale(${scale*breath})`,opacity:K.span(t,0,.5,'inOutCubic')});
      words.forEach(([,wx,wy,size],i)=>{
        // 整体收小文字，留出各词漂移的余量；右侧长词向内移，不裁切字形。
        const font=size*scale*fontLift*.78;
        const dx=Math.sin(t*(.72+(i%4)*.05)+i*1.13)*6*idle;
        const dy=Math.cos(t*(.64+(i%3)*.07)+i*.91)*4*idle;
        s('word'+i,{x:x+wx*scale+dx,y:y+wy*scale+dy-font*.625,'font-size':font,opacity:K.span(t,i*.045,i*.045+.5,'inOutCubic')});
      });
    };
  };

  F['evidence-icons'] = (root,K) => {
    // 四种原图形等比缩到目录画板，单行等距排布，标签对齐；不带原背景、标题与语音。
    // 从真实词点取相对时刻，不把句子内的节拍替换成等间隔图标进入。
    const s=stage(root,`<g transform="scale(.4)" font-weight="300">
      <g data-icon-sequence="experience" data-icon-word="经历" data-icon-start="120" transform="translate(-60 -100)">
        <rect data-part="experience-frame" x="230" y="456" width="180" height="122" rx="10" fill="none" stroke="var(--teal)" stroke-width="3" data-icon-stroke data-icon-delay="0" data-icon-duration=".32"/>
        <path data-part="experience-line0" d="M260 486H371" fill="none" stroke="var(--teal)" stroke-width="5" stroke-linecap="round" data-icon-stroke data-icon-delay=".33" data-icon-duration=".13"/>
        <path data-part="experience-line1" d="M260 516H350" fill="none" stroke="var(--teal)" stroke-width="5" stroke-linecap="round" data-icon-stroke data-icon-delay=".44" data-icon-duration=".13"/>
        <path data-part="experience-line2" d="M260 546H380" fill="none" stroke="var(--teal)" stroke-width="5" stroke-linecap="round" data-icon-stroke data-icon-delay=".55" data-icon-duration=".13"/>
        <text data-part="experience-label" x="320" y="660" font-size="${K.textSize('body',.4)}" fill="var(--teal)" text-anchor="middle" data-icon-fade data-icon-delay=".66" data-icon-duration=".16">经历</text>
      </g>
      <g data-icon-sequence="method" data-icon-word="方法" data-icon-start="432" transform="translate(-140 -100)">
        <circle data-part="method-node0" cx="706" cy="486" r="26" fill="none" stroke="var(--blue)" stroke-width="3" data-icon-stroke data-icon-delay="0" data-icon-duration=".19"/>
        <path data-part="method-line0" d="M732 490H790V524" fill="none" stroke="var(--blue)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" data-icon-stroke data-icon-delay=".14" data-icon-duration=".23"/>
        <path data-part="method-line1" d="M690 512V554H784" fill="none" stroke="var(--blue)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" data-icon-stroke data-icon-delay=".22" data-icon-duration=".23"/>
        <circle data-part="method-node1" cx="816" cy="554" r="26" fill="none" stroke="var(--blue)" stroke-width="3" data-icon-stroke data-icon-delay=".33" data-icon-duration=".19"/>
        <text data-part="method-label" x="760" y="660" font-size="${K.textSize('body',.4)}" fill="var(--blue)" text-anchor="middle" data-icon-fade data-icon-delay=".49" data-icon-duration=".16">方法</text>
      </g>
      <g data-icon-sequence="ability" data-icon-word="能力" data-icon-start="753" transform="translate(660 -450)">
        <circle data-part="ability-circle" cx="320" cy="860" r="68" fill="none" stroke="var(--accent)" stroke-width="4" data-icon-stroke data-icon-delay="0" data-icon-duration=".28"/>
        <path data-part="ability-check" d="M279 858L308 887L361 827" fill="none" stroke="var(--accent)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" data-icon-stroke data-icon-delay=".28" data-icon-duration=".23"/>
        <text data-part="ability-label" x="320" y="1010" font-size="${K.textSize('body',.4)}" fill="var(--accent)" text-anchor="middle" data-icon-fade data-icon-delay=".5" data-icon-duration=".16">能力</text>
      </g>
      <g data-icon-sequence="data" data-icon-word="数据" data-icon-start="1458" transform="translate(580 -450)">
        <path data-part="data-baseline" d="M659 922H851" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" data-icon-stroke data-icon-delay="0" data-icon-duration=".19"/>
        <rect data-part="data-bar0" x="688" y="865" width="36" height="57" rx="4" fill="var(--path)" data-icon-bar data-icon-delay=".09" data-icon-duration=".35"/>
        <rect data-part="data-bar1" x="747" y="823" width="36" height="99" rx="4" fill="var(--blue)" data-icon-bar data-icon-delay=".17" data-icon-duration=".35"/>
        <rect data-part="data-bar2" x="806" y="785" width="36" height="137" rx="4" fill="var(--teal)" data-icon-bar data-icon-delay=".25" data-icon-duration=".35"/>
        <text data-part="data-label" x="760" y="1010" font-size="${K.textSize('body',.4)}" fill="var(--teal)" text-anchor="middle" data-icon-fade data-icon-delay=".58" data-icon-duration=".16">数据</text>
      </g>
    </g>`);
    const items=[...root.querySelectorAll('[data-icon-stroke],[data-icon-bar],[data-icon-fade]')].map(node=>{
      const mode=node.hasAttribute('data-icon-stroke')?'stroke':node.hasAttribute('data-icon-bar')?'bar':'label';
      if(mode==='stroke')s(node.dataset.part,{pathLength:1,'stroke-dasharray':'1 1'});
      return {id:node.dataset.part,mode,start:Number(node.closest('[data-icon-start]').dataset.iconStart)+Number(node.dataset.iconDelay)*1000,duration:Number(node.dataset.iconDuration)*1000,bottom:mode==='bar'?Number(node.getAttribute('y'))+Number(node.getAttribute('height')):0};
    });
    return t=>items.forEach(item=>{
      const q=K.span(t,item.start,item.start+item.duration,item.mode==='stroke'?'inOutQuad':'outCubic');
      if(item.mode==='stroke')s(item.id,{'stroke-dashoffset':1-q,opacity:q>0?1:0});
      else if(item.mode==='bar')s(item.id,{transform:`translate(0 ${item.bottom*(1-q)}) scale(1 ${q})`,opacity:q>0?1:0});
      else s(item.id,{transform:`translate(0 ${5*(1-q)})`,opacity:q});
    });
  };

  function reboundScene(root,K,definition) {
    const vertical=definition.id==='vertical-rebound';
    const first=vertical?'top':'left',second=vertical?'bottom':'right';
    const style='fill="var(--card)" stroke="var(--ink)" rx="3"';
    const s=stage(root,vertical
      ?rect(first,248,60,144,96,style)+rect(second,248,204,144,96,style)
      :rect(first,176,108,112,144,style)+rect(second,352,108,112,144,style));
    // 保留原作的入场和五次逐渐减弱的回摆，不对卡片施加形变。
    const stops=[[.04,-1200],[.60,34],[.96,-16],[1.38,8],[1.84,-3.5],[2.33,1],[2.94,0]];
    return p => {
      const t=p*definition.duration_ms/1000;
      let x=stops[0][1];
      for(let i=1;i<stops.length;i++){
        const [end,value]=stops[i], [start,previous]=stops[i-1];
        if(t>=end){x=value;continue;}
        x=K.mix(previous,value,K.span(t,start,end,i===1?'outCubic':'inOutSine'));break;
      }
      const offset=x*640/1080,opacity=K.span(t,.04,.60,'outCubic');
      s(first,{transform:`translate(${offset} 0)`,opacity});
      s(second,{transform:`translate(${-offset} 0)`,opacity});
    };
  }
  register('rigid-rebound',reboundScene);
  register('vertical-rebound',reboundScene);
  register('mask-stagger-text',(root) => {
    const s=stage(root,'<defs><clipPath id="NAMESPACE-window"><rect x="50" y="120" width="540" height="95"/></clipPath></defs><g clip-path="url(#NAMESPACE-window)">'+list(6,i=>text('c'+i,170+i*60,185,'表达更加清楚'[i],44))+'</g>');
    return p=> {for(let i=0;i<6;i++){const q=smooth(section(p,.08+i*.075,.4+i*.075));s('c'+i,{transform:`translate(0 ${90*(1-q)})`});}};
  });
  register('stroke-draw',(root) => {
    const s=stage(root,'<path data-part="stroke" d="M96 180 H174 C188 180 190 162 204 162 S220 180 236 180 C248 180 250 194 258 194 S274 96 286 96 S308 254 320 254 S338 180 354 180 H378 C398 180 400 148 422 148 S450 180 470 180 H544" fill="none" stroke="var(--ink)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1"/>');
    return p=>{const q=smooth(section(p,.08,.85));s('stroke',{'stroke-dashoffset':1-q,opacity:q>0?1:0});};
  });
  const heartbeatPoints=[[96,180],[208,180],[264,96],[320,264],[376,180],[544,180]];
  const heartbeatPath=heartbeatPoints.map(([x,y],i)=>(i?'L':'M')+x+' '+y).join(' ');
  const heartbeatSegments=heartbeatPoints.slice(1).map((point,i)=>({from:heartbeatPoints[i],to:point,length:Math.hypot(point[0]-heartbeatPoints[i][0],point[1]-heartbeatPoints[i][1])}));
  const heartbeatLength=heartbeatSegments.reduce((sum,s)=>sum+s.length,0);
  register('heartbeat-follow',(root)=>{
    const s=stage(root,`<path data-part="guide" d="${heartbeatPath}" fill="none" stroke="var(--muted)" stroke-width=".9" stroke-linejoin="round" stroke-linecap="round"/>`+dot('glow',96,180,9,'opacity=".1"')+dot('point',96,180,3));
    return p=>{
      let remaining=p*heartbeatLength,segment=heartbeatSegments.at(-1);
      for(const candidate of heartbeatSegments){segment=candidate;if(remaining<=candidate.length||candidate===heartbeatSegments.at(-1))break;remaining-=candidate.length;}
      const q=Math.min(1,remaining/segment.length),x=segment.from[0]+(segment.to[0]-segment.from[0])*q,y=segment.from[1]+(segment.to[1]-segment.from[1])*q;
      s('point',{cx:x,cy:y});s('glow',{cx:x,cy:y});
    };
  });
  register('mindmap-grow',(root)=>{
    const ends=[[136,180],[504,180],[320,52],[320,308]];
    const paths=ends.map(([x,y],i)=>`<path data-part="axis${i}" d="M320 180L${x} ${y}" fill="none" stroke="${ink}" stroke-width=".85" pathLength="1" stroke-dasharray="1 1"/>`).join('');
    const labels=[[408,112,'I'],[232,112,'II'],[232,248,'III'],[408,248,'IV']];
    const s=stage(root,paths+'<g data-part="labels">'+labels.map(([x,y,label],i)=>text('quadrant'+i,x,y,label,13,'font-weight="300" opacity=".45"')).join('')+'</g>');
    return p=>{
      const q=smooth(section(p,.12,.62));
      ends.forEach((_,i)=>s('axis'+i,{'stroke-dashoffset':1-q,opacity:q===0?0:1}));
      s('labels',{opacity:section(p,.65,.8)});
    };
  });
  register('mindmap-follow',(root,K,definition)=>{
    // 左至右的分流线路。子线仅在父线的光点到达后启动。
    const edges=[];
    const add=(points,start)=>{
      const segments=points.slice(1).map((to,i)=>({from:points[i],to,length:Math.hypot(to[0]-points[i][0],to[1]-points[i][1])}));
      const length=segments.reduce((sum,s)=>sum+s.length,0);
      const edge={points,segments,length,start,end:start+length/260};edges.push(edge);return edge;
    };
    const curve=(from,to)=>Array.from({length:41},(_,i)=>{
      const t=i/40,u=1-t,m=(from[0]+to[0])/2;
      return [u*u*u*from[0]+3*u*u*t*m+3*u*t*t*m+t*t*t*to[0],u*u*u*from[1]+3*u*u*t*from[1]+3*u*t*t*to[1]+t*t*t*to[1]];
    });
    const stem=add([[112,180],[216,180]],.2);
    [[360,108],[360,252]].forEach((joint,i)=>{
      const parent=add(curve([216,180],joint),stem.end);
      [joint[1]-44,joint[1]+44].forEach(y=>add(curve(joint,[504,y]),parent.end));
    });
    const lines=edges.map((e,i)=>`<path data-part="branch${i}" d="${e.points.map(([x,y],j)=>(j?'L':'M')+x+' '+y).join(' ')}" fill="none" stroke="${muted}" stroke-opacity=".45" stroke-width=".85"/>`).join('');
    const nodes=[64,152,208,296].map((y,i)=>rect('terminal'+i,504,y-8,24,16,'fill="var(--stage)" stroke="var(--muted)" stroke-width=".7" rx="4"')).join('');
    const s=stage(root,lines+nodes+dot('root',112,180,4)+edges.map((_,i)=>dot('head'+i,112,180,2.7)).join(''));
    return p=>{
      const t=p*definition.duration_ms/1000;
      edges.forEach((edge,i)=>{
        let remaining=section(t,edge.start,edge.end)*edge.length,segment=edge.segments.at(-1);
        for(const candidate of edge.segments){segment=candidate;if(remaining<=candidate.length||candidate===edge.segments.at(-1))break;remaining-=candidate.length;}
        const q=Math.min(1,remaining/segment.length);
        s('head'+i,{cx:K.mix(segment.from[0],segment.to[0],q),cy:K.mix(segment.from[1],segment.to[1],q),opacity:t>=edge.start&&t<edge.end?1:0});
      });
    };
  });
  register('vertical-feed',(root) => {
    // 自绘细线图标；整墙只用一条滚动带，新图标自然从底部接入。
    const icons = [
      'M3 11L12 3L21 11M6 9V21H18V9',
      'M4 5H20V19H4ZM4 9H20M8 9V19',
      'M5 3H15L20 8V21H5ZM15 3V8H20M8 12H16M8 16H14',
      'M3 6H10L12 9H21V20H3Z',
      'M12 3A9 9 0 1 0 12 21A9 9 0 1 0 12 3M12 7V12L16 14',
      'M4 7H20V21H4ZM4 11H20M8 3V8M16 3V8',
      'M3 18L8 12L13 15L21 5M15 5H21V11',
      'M5 21V13H8V21M11 21V8H14V21M17 21V3H20V21',
      'M10 3A7 7 0 1 0 10 17A7 7 0 1 0 10 3M15 15L21 21',
      'M5 11H19V21H5ZM8 11V7A4 4 0 0 1 16 7V11',
      'M12 3L21 7V12Q21 18 12 22Q3 18 3 12V7Z',
      'M3 5H21V19H3ZM3 5L12 13L21 5',
      'M3 4H21V17H9L4 21V17H3Z',
      'M12 3L15 9L22 10L17 15L18 22L12 18L6 22L7 15L2 10L9 9Z',
      'M4 12L10 18L21 5',
      'M12 3V21M3 12H21',
      'M3 12H21M15 6L21 12L15 18',
      'M12 3V21M6 15L12 21L18 15',
      'M4 4H20V20H4ZM4 10H20M10 4V20',
      'M3 6L12 2L21 6L12 10ZM3 6V18L12 22L21 18V6M12 10V22',
      'M4 18V10A8 8 0 0 1 20 10V18M4 12H7V19H4ZM17 12H20V19H17Z',
      'M4 7H8L10 4H15L17 7H21V21H3V7ZM12 10A4 4 0 1 0 12 18A4 4 0 1 0 12 10',
      'M5 3H19V21L12 17L5 21Z',
      'M3 4H10L12 6L14 4H21V20H14L12 22L10 20H3ZM12 6V22'
    ];
    const s=stage(root,'<defs><clipPath id="NAMESPACE-feed"><rect x="100" y="36" width="440" height="288"/></clipPath></defs><g clip-path="url(#NAMESPACE-feed)"><g data-part="rows">'+icons.map((d,i)=>`<g data-part="icon${i}" transform="translate(${164+i%4*104} ${56+Math.floor(i/4)*72})"><path d="${d}" transform="scale(1.5)" fill="none" stroke="${ink}" stroke-width=".7" stroke-linecap="round" stroke-linejoin="round"/></g>`).join('')+'</g></g>');
    return p=>{
      s('rows',{transform:`translate(0 ${-144*section(p,.35,.85)})`});
      icons.forEach((_,i)=>{
        const delay=(Math.abs(i%4-1.5)+Math.abs(Math.floor(i/4)-1.5))*.025;
        s('icon'+i,{opacity:smooth(section(p,.02+delay,.12+delay))});
      });
    };
  });
  register('scroll-brake',(root) => {
    const s=stage(root,line('guide',320,65,320,285,'stroke-dasharray="4 5"')+'<g data-part="belt">'+list(8,i=>rect('r'+i,i*150,120,130,120)+text('n'+i,i*150+65,190,String(i+1),32))+'</g>');
    // 先匀速，随后速度线性减到零；终点正好对齐指定卡片。
    return p=>{const v=300/.65,distance=p<.45 ? v*p : p<.85 ? v*.45+v*((p-.45)-(p-.45)**2/.8) : 300;s('belt',{transform:`translate(${320-65-distance} 0)`});};
  });
  register('dwell-carousel',(root) => {
    const s=stage(root,'<defs><clipPath id="NAMESPACE-cards"><rect x="190" y="90" width="260" height="180"/></clipPath></defs><g clip-path="url(#NAMESPACE-cards)"><g data-part="cards">'+list(3,i=>rect('r'+i,190+i*280,95,260,170)+text('w'+i,320+i*280,185,['问题','做法','结果'][i],36))+'</g></g>');
    return p=>{let q=p<.25?0:p<.4?smooth(section(p,.25,.4)):p<.65?1:p<.8?1+smooth(section(p,.65,.8)):2;s('cards',{transform:`translate(${-280*q} 0)`});};
  });
  register('progress-readout',(root) => {
    const s=stage(root,rect('track',76,172,420,16)+rect('fill',76,172,0,16,'style="fill:var(--ink)"')+`<text data-part="value" x="514" y="180" fill="var(--ink)" font-size="${global.MotionKit.textSize('body')}" font-weight="700" text-anchor="start" dominant-baseline="central">0%</text>`);
    return p=>{const q=smooth(section(p,.12,.85));s('fill',{width:420*q});setText(s,'value',Math.round(100*q)+'%');};
  });
  register('text-decode',(root) => {
    const target='表达更加清楚',noise='◇△□○';const s=stage(root,text('word',320,195,target,43));
    return p=> {const q=section(p,.1,.85),n=Math.floor(q*target.length),tick=Math.floor(q*24);setText(s,'word',[...target].map((c,i)=>i<n?c:noise[(i+tick)%4]).join(''));};
  });
  register('text-edit',(root,K) => {
    // 对照 Input.tsx：原 1920×1080 输入框整体缩至 1/3，保留双行布局与工具栏。
    // 只使用目录卡片底色；不带原场景网格、题签、裁切标记和发送后的扩散。
    const old='一次，绘制一张“鹈鹕骑自行车”的 SVG 插画。',next='一次性绘制 50 张“鹈鹕骑自行车”。',prefix='一次';
    const size=K.textSize('body'),width=1520/3,height=296/3,sendX=(1520-98)/3,sendY=(296-66)/3;
    const measure=value=>[...value].reduce((w,ch)=>w+size*(ch.charCodeAt(0)>0x2e7f?1:ch===' '?.3:.56),0);
    // 否定的是单张数量，叉号固定在“一张”上；尺寸跟随字高，不覆盖边框和工具栏。
    const strikeWidth=size*2+8,strikeHeight=size*1.55;
    const strikeLeft=measure(old.slice(0,old.indexOf('一张')))-4;
    const icon=(part,size,path,extra='')=>`<svg data-part="${part}" aria-hidden="true" viewBox="0 0 24 24" width="${size}" height="${size}" style="display:block;width:${size}px;height:${size}px;flex:none" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${extra}<path d="${path}"/></svg>`;
    const s=K.scene(root,`<div data-part="input" class="edit-input" style="position:absolute;left:${200/3}px;top:${392/3}px;width:${width}px;height:${height}px;border:0;border-radius:2px;background:var(--card);color:var(--card-ink);opacity:0">
      <svg class="edit-outline" aria-hidden="true" viewBox="0 0 1520 296" width="${width}" height="${height}" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"><path data-part="outline" d="M6 0H1514Q1520 0 1520 6V290Q1520 296 1514 296H6Q0 296 0 290V6Q0 0 6 0" fill="none" stroke="var(--card-ink)" stroke-width="1" opacity=".55" pathLength="1" stroke-dasharray="1 1"/></svg>
      <div class="edit-line" style="position:absolute;left:20px;top:${(100-46)/3}px;font-size:${size}px;line-height:1.2;font-weight:300;white-space:nowrap"><span data-part="draft" style="position:relative;display:inline-block"><span data-part="word"></span><svg data-part="strike" aria-hidden="true" viewBox="0 0 ${strikeWidth} ${strikeHeight}" width="${strikeWidth}" height="${strikeHeight}" style="position:absolute;left:${strikeLeft}px;top:50%;transform:translateY(-50%);width:${strikeWidth}px;height:${strikeHeight}px;pointer-events:none"><g fill="none" stroke="var(--red)" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><path data-part="strike-a" d="M3 3 Q${strikeWidth*.42} ${strikeHeight*.46} ${strikeWidth-3} ${strikeHeight-3}" pathLength="1" stroke-dasharray="1 1"/><path data-part="strike-b" d="M${strikeWidth-4} 2 Q${strikeWidth*.54} ${strikeHeight*.48} 2 ${strikeHeight-2}" pathLength="1" stroke-dasharray="1 1"/></g></svg></span><i data-part="caret" aria-hidden="true" style="display:inline-block;width:${2/3}px;height:${50/3}px;margin-left:1px;vertical-align:-3px;background:var(--card-ink)"></i></div>
      <svg aria-hidden="true" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"><path data-part="ruler" fill="none" stroke="var(--card-muted)" stroke-width="${.8/3}"/><circle data-part="send-ring" cx="${sendX}" cy="${sendY}" r="${52/3}" fill="none" stroke="var(--card-muted)" stroke-width="${.8/3}" stroke-dasharray="${2/3} ${5/3}"/></svg>
      <div data-part="toolbar" class="edit-toolbar" style="position:absolute;left:20px;right:20px;top:64px;height:${76/3}px;display:flex;align-items:center;color:var(--card-ink)">
        ${icon('plus',10,'M12 5v14M5 12h14')}
        <span class="edit-agent" style="display:flex;align-items:center;gap:${10/3}px;margin-left:12px;font-family:Oswald,sans-serif;font-weight:700;font-size:${K.textSize('caption')}px;letter-spacing:${1/3}px">${icon('bot',8,'M12 8V4H8M2 14h2M20 14h2M15 13v2M9 13v2','<rect width="16" height="12" x="4" y="8" rx="2"/>')}<span>Agent</span></span>
        <span style="flex:1"></span>
        <span data-part="model" class="edit-model" style="display:flex;align-items:center;gap:${10/3}px;margin-right:${50/3}px;font-size:${K.textSize('caption')}px;font-family:Oswald,sans-serif;font-weight:700;white-space:nowrap">WISE MOTION<span style="color:var(--card-muted)">${icon('chevron',8,'m6 9 6 6 6-6')}</span></span>
        <span data-part="send" class="edit-send" aria-hidden="true" style="width:${76/3}px;height:${76/3}px;border-radius:50%;display:grid;place-items:center;flex:none;background:var(--card-ink);color:var(--card)">${icon('arrow',32/3,'M12 19V5M5 12l7-7 7 7').replace('stroke-width="2"','stroke-width="2.4"')}</span>
      </div>
    </div>`);
    const node=id=>s.one(`[data-part="${id}"]`),input=node('input'),word=node('word'),caret=node('caret'),strike=node('strike'),a=node('strike-a'),b=node('strike-b');
    const outline=node('outline'),toolbar=node('toolbar'),ring=node('send-ring'),ruler=node('ruler');
    const style=(el,key,value)=>{if(el.style[key]!==value)el.style[key]=value;};
    const attribute=(el,key,value)=>{value=String(value);if(el.getAttribute(key)!==value)el.setAttribute(key,value);};
    let lastValue;
    return p=>{
      const enter=smooth(section(p,0,.12));K.pose(input,{y:18*(1-enter),opacity:enter});
      let value=old.slice(0,Math.floor(section(p,.1,.26)*old.length));
      if(p>=.44&&p<.58)value=old.slice(0,old.length-Math.floor(section(p,.44,.58)*(old.length-prefix.length)));
      else if(p>=.58&&p<.64)value=prefix;
      else if(p>=.64)value=next.slice(0,prefix.length+Math.floor(section(p,.64,.82)*(next.length-prefix.length)));
      if(value!==lastValue){
        lastValue=value;word.textContent=value;
        // 与原作一样按字宽绘制尺线；不逐帧读取字体布局。
        const textWidth=measure(value),y=134/3;
        attribute(ruler,'d',value?'M20 '+y+'H'+(20+textWidth)+Array.from({length:Math.floor(textWidth/(11.5/3))+1},(_,i)=>'M'+(20+i*11.5/3)+' '+y+'v'+((i%4===0?9:4)/3)).join(''):'');
      }
      attribute(outline,'stroke-dashoffset',1-smooth(section(p,0,.18)));
      style(toolbar,'opacity',String(smooth(section(p,.08,.2))));
      attribute(ring,'opacity',smooth(section(p,0,.18)));
      style(caret,'opacity',String(p>=.82||Math.floor(p*3000/210)%2===0?1:0));
      style(strike,'opacity',String(p>=.3&&p<.44?1:0));
      const first=section(p,.3,.34),second=section(p,.34,.38);
      attribute(a,'stroke-dashoffset',1-first);attribute(a,'opacity',first>0?1:0);
      attribute(b,'stroke-dashoffset',1-second);attribute(b,'opacity',second>0?1:0);
    };
  });
  register('fragment-replace',(root) => {
    const s=stage(root,'<defs>'+list(12,i=>`<clipPath id="NAMESPACE-f${i}"><rect x="${170+(i%4)*75}" y="${123+Math.floor(i/4)*35}" width="75" height="35"/></clipPath>` )+'</defs>'+list(12,i=>`<g data-part="f${i}" clip-path="url(#NAMESPACE-f${i})">${text('old'+i,320,198,'旧的表达',65)}</g>`)+text('new',320,198,'新的做法',50));
    return p=>{const q=section(p,.2,.65);for(let i=0;i<12;i++)s('f'+i,{transform:`translate(${((i%4)-1.5)*100*q} ${(Math.floor(i/4)-1)*90*q}) rotate(${(i%2?1:-1)*8*q} 320 180)`,opacity:1-q});s('new',{opacity:smooth(section(p,.68,.88))});};
  });
  register('page-cover',(root) => {
    const s=stage(root,rect('old',95,70,450,230)+text('oldwords',320,190,'旧页',40)+'<g data-part="new">'+rect('newrect',95,70,450,230,'style="fill:var(--plane-2)"')+text('newwords',320,190,'新页',40)+'</g>');
    return p=> {s('old',{opacity:1});s('new',{transform:`translate(${500*(1-smooth(section(p,.12,.82)))} 0)`});};
  });
  register('stagger-crossfade',(root) => {
    const s=stage(root,text('old',320,190,'先保留旧观点',38)+text('new',320,190,'再接入新做法',38));
    return p=>{s('old',{opacity:1-section(p,.2,.42)});s('new',{opacity:section(p,.55,.82)});};
  });
  register('shutter-transition',(root) => {
    const s=stage(root,text('old',320,190,'旧画面',45)+text('new',320,190,'新画面',45)+list(8,i=>rect('shade'+i,i*80,0,81,360,'rx="0" style="fill:var(--muted)"')));
    return p=>{s('old',{opacity:p<.5?1:0});s('new',{opacity:p>=.5?1:0});for(let i=0;i<8;i++){const close=section(p,.1+i*.025,.25+i*.025),open=section(p,.58+i*.025,.76+i*.025);s('shade'+i,{transform:`translate(0 ${-360*(1-close+open)})`});}};
  });
  register('pivot-swing',(root) => {
    const s=stage(root,dot('pin',320,75,5)+'<g data-part="body">'+line('rod',320,75,320,245)+rect('weight',290,220,60,50)+'</g>');
    return p=>s('body',{transform:`rotate(${24*Math.sin(p*2*Math.PI)} 320 75)`});
  });
  register('squash-bounce',(root) => {
    const s=stage(root,line('floor',95,285,545,285)+'<ellipse data-part="ball" cx="320" cy="100" rx="32" ry="32" fill="var(--ink)"/>');
    return p=>{let height,ratio=1;if(p<.2)height=165*(1-(p/.2)**2);else{const q=section(p,.2,1),wave=Math.abs(Math.sin(q*3*Math.PI));height=112*Math.exp(-3*q)*wave;ratio=1+.38*Math.exp(-3*q)*Math.exp(-32*wave);if(wave>.35)ratio=1-.13*Math.exp(-3*q)*wave;}if(p===1){height=0;ratio=1;}s('ball',{cx:320,cy:285-32/ratio-height,rx:32*ratio,ry:32/ratio});};
  });
  register('rolling-distance',(root) => {
    const s=stage(root,line('floor',60,245,580,245)+'<g data-part="car">'+rect('box',-55,-85,110,56)+[-35,35].map((x,i)=>`<g data-part="wheel${i}">${dot('hub'+i,0,0,18,'fill="var(--panel)" stroke="var(--ink)"')}${line('spoke'+i,-17,0,17,0)}</g>`).join('')+'</g>');
    return p=>{const distance=330*smooth(section(p,.1,.85));move(s,'car',155+distance,226);for(let i=0;i<2;i++)move(s,'wheel'+i,i?35:-35,0,1,distance/18*180/Math.PI);};
  });
  register('point-morph',(root) => {
    const n=60,s=stage(root,list(n,i=>dot('p'+i,0,0,3)));
    return p=>{const q=section(p,.12,.84);for(let i=0;i<n;i++){const a=i/n*Math.PI*2,x=320+110*Math.cos(a),y=180+110*Math.sin(a),tx=140+(i%12)*32,ty=100+Math.floor(i/12)*40;s('p'+i,{cx:x+(tx-x)*smooth(q),cy:y+(ty-y)*smooth(q)});}};
  });
  register('line-converge',(root,K,definition) => {
    // 原三卡依次建立后上移，三线同拍向下描到主卡。只保留相关卡片与连接关系。
    const xs=[95,257,419],centers=xs.map(x=>x+63),starts=[0,.5538,1.1645];
    const riseAt=starts[2]+.42,connectorAt=riseAt+.49;
    const icons=[
      '<path d="M-10-9H10V14H-10Z M-5-13H5V-6H-5Z M-5 1H5 M-5 7H2"/>',
      '<circle cx="0" cy="0" r="12"/><circle cx="0" cy="0" r="1.5" fill="var(--card-ink)" stroke="none"/>',
      '<path d="M-12-9H12 M-12 0H12 M-12 9H12"/>'
    ];
    const frame=(id,x,y,w,h,inside=false)=>rect(id,x,y,w,h,`rx="0" fill="${inside?'none':'var(--card)'}" stroke="var(--card-ink)" stroke-width="${inside?.25:.65}" opacity="${inside?.35:1}" pathLength="1" stroke-dasharray="1 1"`);
    const paths=[`M${centers[0]} 158 C${centers[0]} 191.3,320 196.7,320 230`,'M320 158 L320 230',`M${centers[2]} 158 C${centers[2]} 191.3,320 196.7,320 230`];
    const cards=xs.map((x,i)=>frame('frame'+i,x,44,126,114)+frame('inset'+i,x+2,46,122,110,true)+
      `<g data-part="icon${i}" transform="translate(${centers[i]} 70)" fill="none" stroke="var(--card-ink)" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round">${icons[i]}</g>`+
      `<text data-part="label${i}" x="${centers[i]}" y="105" text-anchor="middle" font-size="${global.MotionKit.textSize('caption')}" fill="var(--card-ink)" font-weight="300">${['内容先于装饰','颜色必须有语义','密度服从层级'][i]}</text>`+
      `<g data-part="detail${i}">${line('detail-a'+i,x+24,125,x+102,125,'stroke="var(--card-muted)" stroke-width=".5"')}${line('detail-b'+i,x+36,135,x+90,135,'stroke="var(--card-muted)" stroke-width=".5"')}</g>`).join('');
    const s=stage(root,'<g data-part="cards">'+cards+'</g>'+paths.map((d,i)=>`<path data-part="connector${i}" d="${d}" fill="none" stroke="var(--muted)" stroke-width=".65" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1"/>`).join('')+
      frame('receiver-frame',95,230,450,80)+frame('receiver-inset',97,232,446,76,true)+`<text data-part="receiver-label" x="320" y="278" text-anchor="middle" font-size="${K.textSize('title')}" fill="var(--card-ink)" font-weight="700">一页一个重心</text>`+
      centers.map((x,i)=>dot('start-dot'+i,x,158,1.75,'fill="var(--card-ink)"')).join('')+dot('end-dot',320,230,1.75,'fill="var(--card-ink)"'));
    return p=>{
      const t=p*definition.duration_ms/1000,rise=K.span(t,riseAt,riseAt+.46,'inOutCubic');
      move(s,'cards',0,84*(1-rise));
      starts.forEach((at,i)=>{
        s('frame'+i,{opacity:t>=at?1:0,'stroke-dashoffset':1-K.span(t,at,at+.28,'outCubic'),'fill-opacity':K.span(t,at+.182,at+.362,'outQuad')});
        s('inset'+i,{opacity:t>=at+.025?.35:0,'stroke-dashoffset':1-K.span(t,at+.025,at+.245,'outCubic')});
        s('icon'+i,{opacity:K.span(t,at+.07,at+.27,'outQuad')});
        s('label'+i,{opacity:K.span(t,at+.11,at+.31,'outQuad')});
        s('detail'+i,{opacity:K.span(t,at+.14,at+.34,'outQuad')});
        s('connector'+i,{opacity:t>=connectorAt?1:0,'stroke-dashoffset':1-K.span(t,connectorAt,connectorAt+.44,'outCubic')});
        s('start-dot'+i,{opacity:K.span(t,connectorAt-.03,connectorAt+.13)});
      });
      s('receiver-frame',{opacity:t>=connectorAt+.03?1:0,'stroke-dashoffset':1-K.span(t,connectorAt+.03,connectorAt+.41,'outCubic'),'fill-opacity':K.span(t,connectorAt+.277,connectorAt+.457,'outQuad')});
      s('receiver-inset',{opacity:t>=connectorAt+.11?.35:0,'stroke-dashoffset':1-K.span(t,connectorAt+.11,connectorAt+.49,'outCubic')});
      s('receiver-label',{opacity:K.span(t,connectorAt+.23,connectorAt+.49,'outQuad')});
      s('end-dot',{opacity:K.span(t,connectorAt+.37,connectorAt+.55)});
    };
  });
  register('event-clock',(root) => {
    const events=[.22,.48,.73],s=stage(root,line('axis',90,260,550,260)+line('now',90,85,90,278)+list(3,i=>dot('c'+i,90+460*events[i],155,25)+text('time'+i,90+460*events[i],210,`${i+1} 个事件`,16)));
    return p=>{s('now',{x1:90+460*p,x2:90+460*p});events.forEach((time,i)=>s('c'+i,{opacity:p>=time?1:.15}));};
  });
  register('slider-response',(root) => {
    const s=stage(root,line('axis',150,275,490,275)+dot('handle',150,275,12)+'<rect data-part="subject" x="270" y="90" width="100" height="100" fill="var(--ink)"/>');
    return p=>{const q=.5-.5*Math.cos(p*2*Math.PI);s('handle',{cx:150+340*q});s('subject',{rx:50*q,transform:`rotate(${45*q} 320 140)`});};
  });
  register('wave-grid',(root) => {
    const s=stage(root,list(35,i=>dot('p'+i,180+(i%7)*46,88+Math.floor(i/7)*46,9)));
    return p=>{for(let i=0;i<35;i++){const d=Math.hypot(i%7,Math.floor(i/7)),q=section(p,.1+d*.055,.23+d*.055),pulse=Math.sin(q*Math.PI);s('p'+i,{r:9+9*pulse,opacity:.3+.7*pulse});}};
  });
  register('local-scan',(root) => {
    const s=stage(root,'<foreignObject x="0" y="0" width="640" height="360"><div xmlns="http://www.w3.org/1999/xhtml" style="width:640px;height:360px;display:flex;align-items:center;justify-content:center"><span data-part="wordmark" class="brand-name" style="font-size:var(--type-heading);line-height:1.2;white-space:nowrap;animation:none;color:var(--brand-base);background-image:linear-gradient(90deg,var(--brand-base) 0%,var(--brand-base) 58%,var(--brand-light) 70%,var(--brand-light) 82%,var(--brand-base) 94%,var(--brand-base) 100%)">WISE MOTION</span></div></foreignObject>');
    // 与左上角品牌共用字形和渐变，只由播放器控制扫光进度。
    return p=>{s('wordmark').style.backgroundPosition=`${200*(1-p)}% 0px`;};
  });
  register('color-evolve',(root) => {
    const s=stage(root,rect('shape',240,100,160,160));
    return p=>{const q=smooth(section(p,.1,.85));s('shape',{fill:`color-mix(in srgb,var(--accent) ${(1-q)*100}%,var(--teal) ${q*100}%)`});};
  });
  register('density-field',(root) => {
    const s=stage(root,list(120,i=>dot('p'+i,115+((i*73)%409),65+((i*37)%229),3)));
    return p=>{const count=Math.floor(10+110*section(p,.08,.88));for(let i=0;i<120;i++)s('p'+i,{opacity:i<count?1:0});};
  });
  register('dim-focus',(root) => {
    const s=stage(root,list(5,i=>rect('c'+i,78+i*100,125,84,110))+text('title',320,180,'重点',23));
    return p=>{const q=section(p,.15,.75);for(let i=0;i<5;i++)s('c'+i,{opacity:i===2?1:1-.82*q});};
  });
  register('staged-build',(root) => {
    const s=stage(root,text('title',320,82,'让每一步都有依据',28)+list(3,i=>rect('layer'+i,150,110+i*65,340,50)+text('words'+i,320,144+i*65,['看见问题','理解原因','确定做法'][i],23)));
    return p=>{for(let i=0;i<3;i++){const q=smooth(section(p,.08+i*.22,.24+i*.22));s('layer'+i,{opacity:q});s('words'+i,{opacity:q});}};
  });
  register('playback-track',(root) => {
    const points=[[145,255],[245,155],[450,155],[450,250]],s=stage(root,rect('button',395,130,110,50)+text('label',450,163,'确认',22)+'<path data-part="cursor" d="M0 0 L0 23 L6 17 L13 28 L18 25 L12 15 L23 15 Z" fill="var(--ink)"/>');
    return p=>{const t=Math.min(2.999,p*3),i=Math.floor(t),q=smooth(t-i),a=points[i],b=points[i+1];move(s,'cursor',a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q);const press=section(p,.65,.7)*(1-section(p,.7,.76));s('button',{transform:`translate(450 155) scale(${1-.08*press}) translate(-450 -155)`});};
  });
  register('cylinder-drum',(root)=>{
    const radius=102,tilt=.24;
    const front=a=>Math.cos(a)>radius/(650*Math.cos(tilt));
    const s=stage(root,list(8,i=>`<path data-part="panel${i}" fill="none" stroke="var(--card-ink)" stroke-opacity=".48" stroke-width=".6"/>`));
    const project=(a,y)=>{
      const x=radius*Math.sin(a),z=radius*Math.cos(a),depth=z*Math.cos(tilt)-y*Math.sin(tilt),scale=650/(650-depth);
      return [320+x*scale,178+(y*Math.cos(tilt)+z*Math.sin(tilt))*scale];
    };
    const point=([x,y])=>x.toFixed(3)+' '+y.toFixed(3);
    return p=>{
      const phase=p*Math.PI*2;
      for(let i=0;i<8;i++){
        const center=i/8*Math.PI*2-phase,lo=center-.30,hi=center+.30;let d='';
        for(const y of [-51,-22,-5,12,51]){
          const left=y===-51||y===51?lo:lo+.09,right=y===-51||y===51?hi:hi-.09;
          for(let j=0;j<20;j++){
            const a=left+(right-left)*j/20,b=left+(right-left)*(j+1)/20;
            if(front((a+b)/2))d+='M'+point(project(a,y))+'L'+point(project(b,y));
          }
        }
        for(const a of [lo,hi])if(front(a))d+='M'+point(project(a,-51))+'L'+point(project(a,51));
        s('panel'+i,{d});
      }
    };
  });
  register('stamp-land',root => {
    // 原档案印记从 2.1 倍缩到原尺寸，双边框与墨色共用落印进度。
    const s=stage(root,`<g data-part="stamp" fill="#B23A2A">
      <rect x="-76" y="-24.7" width="152" height="49.4" fill="none" stroke="#B23A2A" stroke-opacity=".85" stroke-width="2.5"/>
      <rect x="-72" y="-20.7" width="144" height="41.4" fill="none" stroke="#B23A2A" stroke-opacity=".5" stroke-width="1"/>
      <text x="0" y="1" dominant-baseline="middle" text-anchor="middle" font-size="${global.MotionKit.textSize('title')}" font-weight="700" fill-opacity=".85">样本 · K3</text>
    </g>`);
    return p=>{const q=smooth(section(p,0,.27/.7));s('stamp',{transform:`translate(320 180) scale(${2.1-1.1*q}) rotate(${-0.14*180/Math.PI})`,opacity:.9*q});};
  });
  F['load-balance']=(root,K)=>{
    // 指令章节的 SFT 杠杆天平，原片案例 77.1–82.67 秒；保留成片时钟与设计时钟的对应。
    const green='#0AE448',scale=.55;
    const beats=[
      [74.66666666666666,77.33333333333334,5.200000000000003,9.5],
      [77.33333333333334,79.26666666666665,9.5,12.300000000000011],
      [79.26666666666665,82.36666666666667,12.300000000000011,15.199999999999989],
      [82.36666666666667,85.30000000000001,15.199999999999989,19]
    ];
    const ease=p=>{p=K.clamp(p);return p<.5?4*p*p*p:1-(-2*p+2)**3/2;};
    const s=stage(root,`<g data-part="instruction" transform="translate(23 -328) scale(.55)" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <g data-part="beam"><path d="M-370 0H370" stroke="var(--ink)" stroke-width="7"/>
        <circle cx="-330" r="10" fill="var(--ink)"/><circle cx="330" r="10" fill="var(--ink)"/>
      </g>
      <path data-part="stand" d="M495 1070L540 980L585 1070L495 1070M460 1090H620" stroke="var(--ink)" stroke-width="3"/>
      <text x="540" y="1110" text-anchor="middle" dominant-baseline="hanging" font-size="${global.MotionKit.textSize('title',scale)}" font-weight="700" fill="var(--ink)">指令遵循</text>
      <g data-part="fine">
        <rect data-part="weight" width="166" height="100" fill="${green}"/>
        <text data-part="sft" text-anchor="middle" dominant-baseline="hanging" font-size="${global.MotionKit.textSize('subhead',scale)}" font-weight="700" fill="#0E100F">SFT</text>
        <text data-part="tuning" text-anchor="middle" dominant-baseline="hanging" font-size="${global.MotionKit.textSize('body',scale)}" font-weight="300" fill="${green}">微调</text>
        <rect data-part="pulse" width="180" height="114" stroke="${green}"/>
        ${list(4,i=>`<circle data-part="particle${i}" r="${4+i*.7}" fill="${green}"/>`)}
      </g>
    </g>`);
    return ms=>{
      const program=77.1+K.clamp(ms,0,5570)/1000,b=beats.find(b=>program<b[1])||beats.at(-1);
      const t=K.mix(b[2],b[3],K.clamp((program-b[0])/(b[1]-b[0])));
      const lever=ease((t-9.5)/1),fine=ease((t-12.3)/.85),live=program-70.96666666666667;
      const angle=K.mix(-.14,0,fine)+fine*Math.sin(live*2.2)*.012;
      const wx=540+295*Math.cos(angle),wy=960+295*Math.sin(angle),yy=K.mix(wy-92,wy-145,fine);
      s('instruction',{opacity:lever});s('beam',{transform:`translate(540 960) rotate(${angle*180/Math.PI})`});s('fine',{opacity:fine});
      s('weight',{x:wx-83,y:yy});s('sft',{x:wx,y:yy+15});s('tuning',{x:wx,y:yy-50});
      const pulse=.5+.5*Math.sin(live*4.2);
      s('pulse',{x:wx-90,y:yy-7,'stroke-opacity':.35+.45*pulse,'stroke-width':2+2*pulse});
      const particleTime=Math.max(0,program-79.26666666666665);
      for(let i=0;i<4;i++){
        const q=((particleTime*.42+i*.24)%1+1)%1;
        s('particle'+i,{cx:K.mix(570,wx-92,q),cy:K.mix(748,yy+50,q)+Math.sin(q*Math.PI)*18,'fill-opacity':.45+.45*(1-q)});
      }
    };
  };
  register('film-step',(root) => {
    const s=stage(root,line('axis',100,210,540,210)+dot('body',100,210,15)+text('label',320,275,'固定每秒六帧，同一路线',18));
    return p=>s('body',{cx:100+440*Math.min(1,Math.floor(p*24)/24)});
  });
  register('sequential-spec',(root) => {
    const s=stage(root,list(3,i=>`<circle data-part="icon${i}" cx="${170+i*150}" cy="125" r="30" fill="none" stroke="var(--ink)" stroke-width="3" pathLength="1" stroke-dasharray="1"/>`+text('label'+i,170+i*150,205,['事实','原因','做法'][i],26)+text('value'+i,170+i*150,250,String((i+1)*12),27)));
    return p=>{for(let i=0;i<3;i++){const delay=i*.2;s('icon'+i,{'stroke-dashoffset':1-section(p,.04+delay,.24+delay)});s('label'+i,{opacity:section(p,.25+delay,.34+delay)});s('value'+i,{opacity:section(p,.35+delay,.44+delay)});}};
  });
})(globalThis);
