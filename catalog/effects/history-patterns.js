/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 从历史配方提炼的结构示例。保留身份、顺序与参数关系，不复制原作美术。 */
(function (global) {
  'use strict';
  let serial = 0;
  const F = global.MotionFactories = global.MotionFactories || {};
  const ink = 'var(--ink)', muted = 'var(--muted)', panel = 'var(--panel)', path = 'var(--path)';
  const list = (n, fn) => Array.from({length:n}, (_,i) => fn(i)).join('');
  const attr = (name,value,extra) => new RegExp('(?:^|\\s)'+name+'\\s*=').test(extra) ? '' : ` ${name}="${value}"`;
  const rect = (id,x,y,w,h,extra='') => `<rect data-part="${id}" x="${x}" y="${y}" width="${w}" height="${h}"${attr('rx',5,extra)}${attr('fill',panel,extra)}${attr('stroke',muted,extra)}${attr('stroke-width',.65,extra)} ${extra}/>`;
  const dot = (id,x,y,r=8,extra='') => `<circle data-part="${id}" cx="${x}" cy="${y}" r="${r}"${attr('fill',ink,extra)} ${extra}/>`;
  const text = (id,x,y,words,size=25,extra='') => `<text data-part="${id}" x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="${ink}" ${extra}>${words}</text>`;
  const line = (id,x1,y1,x2,y2,extra='') => `<line data-part="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${attr('stroke',muted,extra)}${attr('stroke-width',.85,extra)} ${extra}/>`;
  function stage(root, markup) {
    const ns = 'motion-pattern-' + (++serial);
    root.innerHTML = `<svg class="pattern-svg" viewBox="0 0 640 360" width="640" height="360" style="color:${ink};font-family:inherit" aria-hidden="true">${markup.replaceAll('NAMESPACE',ns)}</svg>`;
    const parts = new Map([...root.querySelectorAll('[data-part]')].map(x => [x.dataset.part,x]));
    return (id, attrs) => { const el=parts.get(id); if (attrs) for (const [k,v] of Object.entries(attrs)) el.setAttribute(k,String(v)); return el; };
  }
  const setText = (s,id,words) => {s(id).textContent=words;};
  const move = (s,id,x=0,y=0,scale=1,angle=0) => s(id,{transform:`translate(${x} ${y}) rotate(${angle}) scale(${scale})`});
  function register(id, setup) {
    F[id] = (root,K,definition) => {
      const render=setup(root,K,definition);
      return t => render(K.clamp(t/definition.duration_ms));
    };
  }
  const smooth = p => 1-(1-Math.min(1,Math.max(0,p)))**3;
  const section = (p,a,b) => Math.min(1,Math.max(0,(p-a)/(b-a)));

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
    const s=stage(root,'<path data-part="stroke" d="M130 235 Q220 65 320 160 T510 120" fill="none" stroke="var(--ink)" stroke-width="4" pathLength="1" stroke-dasharray="1"/>');
    return p=>s('stroke',{'stroke-dashoffset':1-smooth(section(p,.08,.85))});
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
  register('heartbeat-draw',(root)=>{
    const s=stage(root,`<path data-part="stroke" d="${heartbeatPath}" fill="none" stroke="var(--ink)" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1"/>`);
    return p=>s('stroke',{'stroke-dashoffset':1-2*p,opacity:p===0||p===1?0:1});
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
  register('underline-draw',(root) => {
    const s=stage(root,text('body',320,166,'先说清楚，再做漂亮',35)+line('u0',145,186,145,186)+line('u1',356,186,356,186));
    return p=> {s('u0',{x2:145+140*smooth(section(p,.12,.4))});s('u1',{x2:356+140*smooth(section(p,.48,.8))});};
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
  register('title-dock',(root) => {
    const s=stage(root,text('title',0,0,'让表达更清楚',42)+text('body',320,195,'事实 · 原因 · 做法',26)+text('detail',320,242,'一段有次序的正文',19));
    return p=>{const q=smooth(section(p,.08,.48));move(s,'title',320,185-90*q,1-.32*q);s('body',{opacity:section(p,.55,.78)});s('detail',{opacity:section(p,.65,.88)});};
  });
  register('progress-readout',(root) => {
    const s=stage(root,rect('track',110,195,420,16)+rect('fill',110,195,0,16,'style="fill:var(--ink)"')+text('value',320,160,'0%',50));
    return p=>{const q=smooth(section(p,.12,.85));s('fill',{width:420*q});setText(s,'value',Math.round(100*q)+'%');};
  });
  register('rolling-digits',(root) => {
    const s=stage(root,'<defs><clipPath id="NAMESPACE-digits"><rect x="225" y="132" width="190" height="64"/></clipPath></defs><g clip-path="url(#NAMESPACE-digits)">'+list(3,i=>`<g data-part="d${i}">${list(21,n=>text('digit'+i+'-'+n,260+i*60,180+n*64,String(n%10),53))}</g>` )+'</g>'+text('label',320,240,'低位越界，高位接着进位',18));
    return p=>{const value=98+5*section(p,.1,.9);for(let i=0;i<3;i++){const div=10**(2-i),base=Math.floor(value/div),rem=value%div,frac=i===2?value%1:Math.max(0,rem-(div-1));s('d'+i,{transform:`translate(0 ${-64*((base%10)+Math.min(1,frac))})`,opacity:frac>1e-8?.45:1});}};
  });
  register('text-decode',(root) => {
    const target='表达更加清楚',noise='◇△□○';const s=stage(root,text('word',320,195,target,43));
    return p=> {const q=section(p,.1,.85),n=Math.floor(q*target.length),tick=Math.floor(q*24);setText(s,'word',[...target].map((c,i)=>i<n?c:noise[(i+tick)%4]).join(''));};
  });
  register('text-edit',(root) => {
    const old='先说清楚问题',next='先说清楚做法',prefix='先说清楚';const s=stage(root,text('word',320,190,old,38));
    return p=>{let value=old;if(p>.2&&p<.48)value=old.slice(0,old.length-Math.floor(section(p,.2,.48)*(old.length-prefix.length)));else if(p>=.48&&p<.7)value=prefix;else if(p>=.7)value=next.slice(0,prefix.length+Math.floor(section(p,.7,.9)*(next.length-prefix.length)));setText(s,'word',value);};
  });
  register('particle-word',(root) => {
    // 演示目标明确给出为「人」字点阵；生产复用时必须换成实际字形采样点。
    const targets=[];for(let i=0;i<16;i++){targets.push([320-7*i,108+9*i]);targets.push([320+7*i,108+9*i]);}
    const s=stage(root,list(targets.length,i=>dot('p'+i,0,0,4))+text('label',320,315,'同一批点，逐一靠近字形目标',17));
    return p=>{const q=smooth(section(p,.08,.85));targets.forEach(([x,y],i)=>{const a=i*2.399,sx=320+240*Math.cos(a),sy=180+135*Math.sin(a);s('p'+i,{cx:sx+(x-sx)*q,cy:sy+(y-sy)*q});});};
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
  register('path-trail',(root) => {
    const route=q=>[105+430*q,185-70*Math.sin(q*2*Math.PI)];const s=stage(root,'<path data-part="trail" fill="none" stroke="var(--muted)" stroke-width="3"/>'+dot('body',0,0,10));
    return p=>{const q=section(p,.05,.9),pts=Array.from({length:51},(_,i)=>route(q*i/50));s('trail',{d:pts.map(([x,y],i)=>`${i?'L':'M'}${x},${y}`).join(' ')});s('body',{cx:pts[50][0],cy:pts[50][1]});};
  });
  register('rolling-distance',(root) => {
    const s=stage(root,line('floor',60,245,580,245)+'<g data-part="car">'+rect('box',-55,-85,110,56)+[-35,35].map((x,i)=>`<g data-part="wheel${i}">${dot('hub'+i,0,0,18,'fill="var(--panel)" stroke="var(--ink)"')}${line('spoke'+i,-17,0,17,0)}</g>`).join('')+'</g>');
    return p=>{const distance=330*smooth(section(p,.1,.85));move(s,'car',155+distance,226);for(let i=0;i<2;i++)move(s,'wheel'+i,i?35:-35,0,1,distance/18*180/Math.PI);};
  });
  register('point-morph',(root) => {
    const n=60,s=stage(root,list(n,i=>dot('p'+i,0,0,3)));
    return p=>{const q=section(p,.12,.84);for(let i=0;i<n;i++){const a=i/n*Math.PI*2,x=320+110*Math.cos(a),y=180+110*Math.sin(a),tx=140+(i%12)*32,ty=100+Math.floor(i/12)*40;s('p'+i,{cx:x+(tx-x)*smooth(q),cy:y+(ty-y)*smooth(q)});}};
  });
  register('path-branch',(root) => {
    const s=stage(root,rect('obstacle',280,125,80,110)+line('entry',90,180,220,180)+'<path d="M220 180 L260 95 H380 L420 180 M220 180 L260 265 H380 L420 180" fill="none" stroke="var(--path)" stroke-width="2"/>'+dot('input',90,180)+dot('top',220,180)+dot('bottom',220,180)+dot('end',420,180,15));
    const route=(q,sign)=>q<.25?[220+160*q,180+sign*85*q/.25]:q<.75?[260+120*(q-.25)/.5,180+sign*85]:[380+40*(q-.75)/.25,180+sign*85*(1-(q-.75)/.25)];
    return p=>{const start=section(p,.05,.25),q=section(p,.25,.85);s('input',{cx:90+130*start,opacity:p<=.25?1:0});for(const [id,sign] of [['top',-1],['bottom',1]]){const [x,y]=route(q,sign);s(id,{cx:x,cy:y,opacity:p>=.25&&p<.85?1:0});}s('end',{opacity:p>=.85?1:.15});};
  });
  register('connection-merge',(root) => {
    const ys=[90,180,270],s=stage(root,list(3,i=>line('l'+i,130,ys[i],460,180)+dot('p'+i,130,ys[i]))+dot('receiver',460,180,24));
    return p=>{ys.forEach((y,i)=>{const q=smooth(section(p,.1+i*.1,.55+i*.1));s('p'+i,{cx:130+330*q,cy:y+(180-y)*q});});s('receiver',{opacity:p>=.75?1:.15});};
  });
  register('sweep-trigger',(root) => {
    const s=stage(root,list(6,i=>rect('c'+i,130+i*65,155,42,50))+line('scan',90,95,90,270,'stroke-width="4"'));
    return p=>{const x=90+450*section(p,.1,.88);s('scan',{x1:x,x2:x});for(let i=0;i<6;i++)s('c'+i,{opacity:x>=151+i*65?1:.2});};
  });
  register('event-clock',(root) => {
    const events=[.22,.48,.73],s=stage(root,line('axis',90,260,550,260)+line('now',90,85,90,278)+list(3,i=>dot('c'+i,90+460*events[i],155,25)+text('time'+i,90+460*events[i],210,`${i+1} 个事件`,16)));
    return p=>{s('now',{x1:90+460*p,x2:90+460*p});events.forEach((time,i)=>s('c'+i,{opacity:p>=time?1:.15}));};
  });
  register('slider-response',(root) => {
    const s=stage(root,line('axis',150,275,490,275)+dot('handle',150,275,12)+'<rect data-part="subject" x="270" y="90" width="100" height="100" fill="var(--ink)"/>');
    return p=>{const q=.5-.5*Math.cos(p*2*Math.PI);s('handle',{cx:150+340*q});s('subject',{rx:50*q,transform:`rotate(${45*q} 320 140)`});};
  });
  register('data-pulse',(root) => {
    const samples=[0,.15,.8,.4,.95,.2,0],s=stage(root,list(7,i=>rect('b'+i,145+i*50,240,30,0,'style="fill:var(--ink)"'))+line('base',120,240,520,240));
    return p=>{for(let i=0;i<7;i++){const x=Math.max(0,Math.min(6,p*7-i*.13)),a=Math.floor(x),b=Math.min(6,a+1),v=samples[a]+(samples[b]-samples[a])*(x-a),h=130*v;s('b'+i,{y:240-h,height:h});}};
  });
  register('wave-grid',(root) => {
    const s=stage(root,list(35,i=>dot('p'+i,180+(i%7)*46,88+Math.floor(i/7)*46,9)));
    return p=>{for(let i=0;i<35;i++){const d=Math.hypot(i%7,Math.floor(i/7)),q=section(p,.1+d*.055,.23+d*.055),pulse=Math.sin(q*Math.PI);s('p'+i,{r:9+9*pulse,opacity:.3+.7*pulse});}};
  });
  register('bloom-layers',(root) => {
    const s=stage(root,list(12,i=>`<g data-part="petal${i}"><ellipse cx="0" cy="-44" rx="17" ry="48" fill="var(--plane-${i<6?2:3})" stroke="var(--muted)"/></g>`)+dot('center',320,185,15));
    return p=>{for(let i=0;i<12;i++){const q=smooth(section(p,i<6?.1:.28,i<6?.65:.85)),angle=(i%6)*60+(i<6?0:30);s('petal'+i,{transform:`translate(320 185) rotate(${angle}) scale(${.18+.82*q} ${.3+.7*q})`});}};
  });
  register('anchored-growth',(root) => {
    const s=stage(root,line('stem',320,290,320,290)+list(4,i=>`<path data-part="leaf${i}" d="M0 0 Q${i%2?-60:60} -60 ${i%2?-65:65} -20 Q${i%2?-30:30} 10 0 0" fill="var(--plane-3)" stroke="var(--muted)"/>`));
    return p=>{const q=smooth(section(p,.05,.7));s('stem',{y2:290-205*q});for(let i=0;i<4;i++){const v=smooth(section(p,.2+i*.13,.42+i*.13));s('leaf'+i,{transform:`translate(320 ${250-i*45}) scale(${v})`});}};
  });
  register('delay-wave-body',(root) => {
    const s=stage(root,dot('root',120,180,6)+'<path data-part="body" fill="none" stroke="var(--ink)" stroke-width="14" stroke-linecap="round"/>');
    return p=>{const pts=Array.from({length:40},(_,i)=>[120+i*10,180+i/39*38*Math.sin(p*2*Math.PI-i*.17)]);s('body',{d:pts.map(([x,y],i)=>`${i?'L':'M'}${x},${y}`).join(' ')});};
  });
  register('local-scan',(root) => {
    const s=stage(root,'<defs><clipPath id="NAMESPACE-shape"><circle cx="320" cy="180" r="100"/></clipPath></defs><circle cx="320" cy="180" r="100" fill="var(--panel)" stroke="var(--muted)"/><g clip-path="url(#NAMESPACE-shape)">'+rect('scan',0,60,30,240,'style="fill:var(--ink)"')+'</g>');
    return p=>s('scan',{x:160+320*p});
  });
  register('glyph-sheen',(root) => {
    const s=stage(root,'<defs><mask id="NAMESPACE-type">'+text('mask',320,200,'表达清楚',65,'style="fill:white"')+'</mask></defs>'+text('base',320,200,'表达清楚',65,'style="fill:var(--muted)"')+'<g mask="url(#NAMESPACE-type)">'+rect('scan',0,100,42,130,'style="fill:var(--ink)"')+'</g>');
    return p=>s('scan',{x:70+510*p});
  });
  register('color-evolve',(root) => {
    const s=stage(root,rect('shape',240,100,160,160));
    return p=>{const v=Math.round(80+145*smooth(section(p,.1,.85)));s('shape',{fill:`rgb(${v},${v},${v})`});};
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
  register('countdown-dial',(root) => {
    const s=stage(root,'<circle cx="320" cy="180" r="104" fill="none" stroke="var(--path)" stroke-width="5"/><circle data-part="remaining" cx="320" cy="180" r="104" fill="none" stroke="var(--ink)" stroke-width="5" pathLength="1" stroke-dasharray="1" transform="rotate(-90 320 180)"/>'+list(12,i=>line('tick'+i,320,65,320,75,`transform="rotate(${i*30} 320 180)"`))+line('needle',320,180,320,88)+text('value',320,220,'6',40));
    return p=>{s('remaining',{'stroke-dashoffset':p});s('needle',{transform:`rotate(${360*p} 320 180)`});setText(s,'value',String(Math.ceil(6*(1-p))));};
  });
  register('playback-track',(root) => {
    const points=[[145,255],[245,155],[450,155],[450,250]],s=stage(root,rect('button',395,130,110,50)+text('label',450,163,'确认',22)+'<path data-part="cursor" d="M0 0 L0 23 L6 17 L13 28 L18 25 L12 15 L23 15 Z" fill="var(--ink)"/>');
    return p=>{const t=Math.min(2.999,p*3),i=Math.floor(t),q=smooth(t-i),a=points[i],b=points[i+1];move(s,'cursor',a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q);const press=section(p,.65,.7)*(1-section(p,.7,.76));s('button',{transform:`translate(450 155) scale(${1-.08*press}) translate(-450 -155)`});};
  });
  register('load-balance',(root) => {
    const s=stage(root,line('stand',320,165,320,285)+'<g data-part="beam">'+line('bar',190,165,450,165)+[190,450].map((x,i)=>`<g data-part="pan${i}">${line('cord'+i,0,0,0,65)}${rect('tray'+i,-45,60,90,15)}</g>`).join('')+'</g>'+rect('load',410,0,55,34));
    return p=>{const entry=section(p,.08,.3),q=smooth(section(p,.32,.75)),angle=14*q;s('beam',{transform:`rotate(${angle} 320 165)`});move(s,'pan0',190,165,1,-angle);move(s,'pan1',450,165,1,-angle);const x=320+130*Math.cos(angle*Math.PI/180),y=165+130*Math.sin(angle*Math.PI/180);s('load',{x:x-27.5,y:(y+26)*entry});};
  });
  register('film-step',(root) => {
    const s=stage(root,line('axis',100,210,540,210)+dot('body',100,210,15)+text('label',320,275,'固定每秒六帧，同一路线',18));
    return p=>s('body',{cx:100+440*Math.min(1,Math.floor(p*24)/24)});
  });
  register('field-speed',(root) => {
    const s=stage(root,'<path d="M70 90 H230 L300 145 H400 L470 90 H580 M70 270 H230 L300 215 H400 L470 270 H580" fill="none" stroke="var(--muted)" stroke-width="2"/>'+list(12,i=>dot('p'+i,0,0,4)));
    // 时间累积量与截面宽度积分成正比，因此速度随宽度连续变化。
    // 这里只展示连续性关系，不计算真实流体。
    const width=x=>x<230?180:x<300?180-110*(x-230)/70:x<400?70:x<470?70+110*(x-400)/70:180;
    const table=[0],steps=1024,dx=510/steps;for(let i=1;i<=steps;i++)table[i]=table[i-1]+(width(70+(i-1)*dx)+width(70+i*dx))*dx/2;
    const position=q=>{const target=q*table[steps];let low=0,high=steps;while(high-low>1){const mid=(low+high)>>1;if(table[mid]<target)low=mid;else high=mid;}return 70+dx*(low+(target-table[low])/(table[high]-table[low]));};
    return p=>{for(let i=0;i<12;i++){const q=(p+i/12)%1,x=position(q);s('p'+i,{cx:x,cy:180+((i%3)-1)*width(x)*.3,opacity:Math.min(1,q/.04,(1-q)/.04)});}};
  });
  register('stroke-hatch',(root) => {
    const s=stage(root,'<defs><clipPath id="NAMESPACE-outline"><rect x="220" y="85" width="200" height="190" rx="15"/></clipPath></defs><rect data-part="outline" x="220" y="85" width="200" height="190" rx="15" fill="none" stroke="var(--ink)" stroke-width="3" pathLength="1" stroke-dasharray="1"/><g clip-path="url(#NAMESPACE-outline)">'+list(20,i=>line('h'+i,150+i*18,300,330+i*18,60))+'</g>');
    return p=>{s('outline',{'stroke-dashoffset':1-section(p,.05,.42)});for(let i=0;i<20;i++)s('h'+i,{opacity:section(p,.46+i*.018,.5+i*.018)});};
  });
  register('sequential-spec',(root) => {
    const s=stage(root,list(3,i=>`<circle data-part="icon${i}" cx="${170+i*150}" cy="125" r="30" fill="none" stroke="var(--ink)" stroke-width="3" pathLength="1" stroke-dasharray="1"/>`+text('label'+i,170+i*150,205,['事实','原因','做法'][i],26)+text('value'+i,170+i*150,250,String((i+1)*12),27)));
    return p=>{for(let i=0;i<3;i++){const delay=i*.2;s('icon'+i,{'stroke-dashoffset':1-section(p,.04+delay,.24+delay)});s('label'+i,{opacity:section(p,.25+delay,.34+delay)});s('value'+i,{opacity:section(p,.35+delay,.44+delay)});}};
  });
  register('bar-growth',(root) => {
    const values=[110,65,175,130],s=stage(root,line('base',100,270,540,270)+list(4,i=>rect('bar'+i,140+i*95,270,55,0,'style="fill:var(--ink)"')));
    return p=>values.forEach((value,i)=>{const h=value*smooth(section(p,.1+i*.08,.65+i*.08));s('bar'+i,{y:270-h,height:h});});
  });
})(globalThis);
