/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (F) {
  'use strict';
  // 固定 MOTION 字标保留原片 Helvetica Neue Bold 轮廓和字距。
  // 路径与镜头共用原片 1920×1080 坐标，不依赖加载字体后测量，也不另画一个 O。
  const glyphs = {"M":{"width":907,"bounds":[69,0,838,714],"path":"M69 714V0H216V501H218L393 0H514L689 506H691V0H838V714H617L459 223H457L290 714Z"},"O":{"width":778,"bounds":[38,-16,740,731],"path":"M195 354Q195 401 205.5 445.0Q216 489 239.0 523.5Q262 558 299.0 578.5Q336 599 389 599Q442 599 479.0 578.5Q516 558 539.0 523.5Q562 489 572.5 445.0Q583 401 583 354Q583 309 572.5 266.5Q562 224 539.0 190.0Q516 156 479.0 135.5Q442 115 389 115Q336 115 299.0 135.5Q262 156 239.0 190.0Q216 224 205.5 266.5Q195 309 195 354ZM38 354Q38 276 62.0 208.5Q86 141 131.0 91.0Q176 41 241.5 12.5Q307 -16 389 -16Q472 -16 537.0 12.5Q602 41 647.0 91.0Q692 141 716.0 208.5Q740 276 740 354Q740 434 716.0 502.5Q692 571 647.0 622.0Q602 673 537.0 702.0Q472 731 389 731Q307 731 241.5 702.0Q176 673 131.0 622.0Q86 571 62.0 502.5Q38 434 38 354Z"},"T":{"width":611,"bounds":[13,0,598,714],"path":"M227 582V0H384V582H598V714H13V582Z"},"I":{"width":295,"bounds":[69,0,226,714],"path":"M69 714V0H226V714Z"},"N":{"width":741,"bounds":[69,0,672,714],"path":"M69 714V0H216V478H218L515 0H672V714H525V235H523L225 714Z"}};
  const colors = ['var(--accent)', 'var(--cycle-pink)', 'var(--cycle-red)', 'var(--yellow)', 'var(--teal)', 'var(--blue)', 'var(--reel-last)'];
  const subtitle = 'A 60-SECOND EVOLUTION OF MOTION DESIGN';
  const focus = {x:741.3, y:527};
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const prog = (t, a, b) => clamp((t-a)/(b-a));
  const outExpo = p => p >= 1 ? 1 : 1-Math.pow(2,-10*p);
  const inExpo = p => p <= 0 ? 0 : Math.pow(2,10*p-10);
  const inOutCubic = p => p < .5 ? 4*p*p*p : 1-Math.pow(-2*p+2,3)/2;
  const outBack = p => 1+2.70158*Math.pow(p-1,3)+1.70158*Math.pow(p-1,2);
  const hash = n => {const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};
  const set = (node, key, value) => {
    const next = String(value);
    if (node.getAttribute(key) !== next) node.setAttribute(key, next);
  };
  const content = (node, value) => {if (node.textContent !== value) node.textContent = value;};
  // 原字幕使用 Menlo 等宽字。固定字宽用于光标和对齐，播放时不读布局。
  const measure = (text, size, track) => text.length*(size*.60205078125+track)-track;
  const text = (part, value, x, y, size, track, fill, extra='') =>
    `<text data-part="${part}" x="${x}" y="${y}" font-size="${globalThis.MotionKit.textSize(Math.max(10,size/3),1/3)}" letter-spacing="${track}" fill="${fill}" style="font-family:Oswald,sans-serif;font-weight:700" ${extra}>${value}</text>`;
  const items = [];
  let letterX = 358.5, serial = 0;
  for (const ch of 'MOTION') {
    items.push({ch, x:letterX});
    letterX += glyphs[ch].width*.3-6;
  }
  const letterPaths = () => items.map(({ch,x},i) =>
    `<g data-letter="${i}" transform="translate(${x} 635)"><path data-glyph="${ch}" d="${glyphs[ch].path}" transform="scale(0.3 -0.3)"/></g>`).join('');

  // 点阵合并成一个路径，只在显现数量变化时写入；不为数百个点创建独立节点。
  const dots = [];
  for (let x=60;x<1920;x+=60) for (let y=60;y<1080;y+=60)
    dots.push({distance:Math.hypot(x-960,y-540)/1100, path:`M${x-1} ${y-1}h2v2h-2Z`});
  dots.sort((a,b)=>a.distance-b.distance);
  const bars = [
    {y:108,h:64,w:980,d:1,at:.1,rot:-.012},
    {y:196,h:24,w:560,d:1,at:.35,rot:.01},
    {y:872,h:92,w:1180,d:-1,at:.55,rot:.008},
    {y:990,h:26,w:720,d:1,at:.8,rot:-.01},
    {y:262,h:12,w:1500,d:-1,at:1.05,rot:.004}
  ];
  const paperPaths = bars.map((bar,i) => [0,1,2].map(boil => {
    const n=Math.max(2,Math.floor(bar.w/40)), points=[];
    for(let k=0;k<=n;k++) points.push(`${bar.w*k/n} ${(hash(i*31+k*1.7+boil)-.5)*6}`);
    for(let k=n;k>=0;k--) points.push(`${bar.w*k/n} ${bar.h+(hash(i*31+k*2.3+boil+50)-.5)*6}`);
    return 'M'+points.join('L')+'Z';
  }));

  function opening(root, withTransition) {
    const id = 'motion-reel-opening-'+ ++serial;
    const subX = 960-measure(subtitle,22,8)/2;
    const next = withTransition ?
      `<g data-part="next" clip-path="url(#${id}-iris)"><rect data-part="next-bg" width="1920" height="1080" fill="#e8541e"/>`+
      bars.map((b,i)=>`<path data-part="paper${i}" fill="#111" d="${paperPaths[i][0]}" visibility="hidden"/>`).join('')+
      '<circle data-part="disc" cx="1400" cy="540" r="0" fill="#f1e4c8"/><circle data-part="disc-center" cx="1400" cy="540" r="0" fill="#e8541e" visibility="hidden"/><circle data-part="satellite" r="0" fill="#111"/></g>'+
      '<circle data-part="iris-edge" cx="960" cy="540" r="0" fill="none" stroke="#f1e4c8" stroke-width="14" visibility="hidden"/>'+
      '<g data-part="hud" opacity="0">'+
      text('hud-title','CLAUDE  /  MOTION REEL  ’26',72,70,15,3,'currentColor')+
      `<g clip-path="url(#${id}-label)"><g data-part="hud-era" visibility="hidden">`+
      '<rect data-part="era-mark" y="58" width="12" height="12" fill="currentColor"/>'+
      text('era-label','1959  —  THE TITLE SEQUENCE',1848,70,15,3,'currentColor','text-anchor="end"')+'</g></g>'+
      '<g opacity=".25" fill="currentColor"><rect x="72" y="1028" width="1776" height="1"/>'+
      [4,10,16,22,30,38,46,54].map(t=>`<rect x="${72+1776*t/60-.5}" y="1023" width="1" height="11"/>`).join('')+'</g>'+
      '<rect data-part="hud-progress" x="72" y="1027" width="0" height="3" fill="currentColor"/>'+
      text('shot','SHOT 00 / 08',72,1010,14,3,'currentColor')+
      text('timecode','',1848,1010,14,3,'currentColor','text-anchor="end"')+'</g>' : '';
    root.innerHTML = '<svg class="pattern-svg" width="640" height="360" viewBox="0 0 1920 1080" aria-hidden="true"><title>MOTION</title>'+
      `<defs><clipPath id="${id}-letters"><rect x="58.5" y="320" width="1803" height="405"/></clipPath>`+
      (withTransition ? `<clipPath id="${id}-iris" clipPathUnits="userSpaceOnUse"><circle data-part="iris" cx="960" cy="540" r="0"/></clipPath><clipPath id="${id}-label"><rect x="920" y="44" width="940" height="36"/></clipPath>` : '')+'</defs>'+
      '<path data-part="dots" fill="var(--reel-dot)" opacity=".08"/>'+
      '<g data-part="word" data-font="Helvetica Neue Bold" fill="var(--ink)">'+
      '<rect data-part="ruler" x="960" y="661" width="0" height="4" fill="var(--reel-line)"/>'+
      `<g clip-path="url(#${id}-letters)">${letterPaths()}</g>`+
      text('start-year','1959',0,707,22,4,'var(--reel-muted)','opacity="0"')+
      text('end-year','2026',0,707,22,4,'var(--reel-muted)','opacity="0" text-anchor="end"')+
      colors.map((c,k)=>`<rect data-tick="${k}" x="0" y="661" width="4" height="0" fill="${c}"/>`).join('')+
      text('subtitle','',subX,763,22,8,'var(--ink)')+
      `<rect data-part="caret" x="${subX}" y="745.4" width="2" height="20.9" fill="var(--ink)" visibility="hidden"/></g>`+
      text('heading','SHOWREEL · 2026',960,150,16,6,'var(--reel-caption)','text-anchor="middle" opacity="0"')+next+'</svg>';
    const part = name => root.querySelector(`[data-part="${name}"]`);
    const word=part('word'), ruler=part('ruler'), dotPath=part('dots'), heading=part('heading');
    const startYear=part('start-year'), endYear=part('end-year'), caption=part('subtitle'), caret=part('caret');
    const letters=[...root.querySelectorAll('[data-letter]')], ticks=[...root.querySelectorAll('[data-tick]')];
    const iris=part('iris'), edge=part('iris-edge'), nextGroup=part('next'), disc=part('disc'), discCenter=part('disc-center'), satellite=part('satellite');
    const papers=withTransition ? bars.map((_,i)=>part('paper'+i)) : [];
    const hud=part('hud'), era=part('hud-era'), eraMark=part('era-mark'), hudProgress=part('hud-progress'), shot=part('shot'), timecode=part('timecode');
    let dotCount=-1;
    return milliseconds => {
      const time=clamp(milliseconds,withTransition?2850:0,withTransition?4400:2850), t=time/1000;
      const ga=prog(t,.15,1.4);
      let lo=0,hi=dots.length;
      while(lo<hi) {const mid=(lo+hi)>>>1;if(dots[mid].distance<ga)lo=mid+1;else hi=mid;}
      if(lo!==dotCount) {set(dotPath,'d',dots.slice(0,lo).map(d=>d.path).join(''));dotCount=lo;}
      const center=inOutCubic(prog(t,2.85,3.7)), zoom=1+90*inExpo(prog(t,3,4));
      set(word,'transform',`translate(${focus.x+(960-focus.x)*center} ${focus.y+(540-focus.y)*center}) scale(${zoom}) translate(${-focus.x} ${-focus.y})`);
      const width=1920*.62*outExpo(prog(t,.05,.7));
      set(ruler,'width',width);set(ruler,'x',960-width/2);
      letters.forEach((node,i)=>{
        const p=outExpo(prog(t,.45+i*.06,1.25+i*.06));
        set(node,'transform',`translate(${items[i].x} ${635+(1-p)*300*1.1})`);
        set(node,'visibility',p>0?'visible':'hidden');
        set(node,'fill',t>=2&&t<3?colors[(i+Math.floor(t/.5))%7]:'var(--ink)');
      });
      const alpha=outExpo(prog(t,1.2,1.8));
      set(startYear,'x',960-width/2);set(endYear,'x',960+width/2);
      set(startYear,'opacity',alpha);set(endYear,'opacity',alpha);
      ticks.forEach((node,k)=>{
        const p=outBack(prog(t,1.2+k*.07,1.6+k*.07));
        set(node,'x',960-width/2+width*k/6-2);set(node,'y',661-12*p);set(node,'height',12*p);
      });
      const count=clamp(Math.floor((time-1400)*40/1000),0,subtitle.length), shown=subtitle.slice(0,count);
      content(caption,shown);
      set(caret,'x',subX+measure(shown,22,8)+(shown?12:0));
      set(caret,'visibility',t>=1.4&&t<2.9&&(count<subtitle.length||Math.floor(t*2.5)%2===0)?'visible':'hidden');
      set(heading,'opacity',prog(t,.8,1.4)*(1-prog(t,2.8,3.2)));
      if(!withTransition)return;

      const p=prog(t,3.6,4.4), radius=Math.hypot(1920,1080)*.72*inOutCubic(p);
      set(iris,'r',radius);set(edge,'r',radius);set(edge,'visibility',p>0&&p<1?'visible':'hidden');
      set(nextGroup,'visibility',p>0?'visible':'hidden');
      // 原片纸片以每秒十二格抽动；只计算开窗承接段，没有另造下一页。
      const q=Math.floor((t-4)*12)/12, boil=((Math.floor((t-4)*12)%3)+3)%3;
      bars.forEach((bar,i)=>{
        const progress=outExpo(prog(q,bar.at,bar.at+.5));
        const x=bar.d>0 ? -bar.w+progress*(bar.w+60+i*20) : 1920-progress*(bar.w+40);
        set(papers[i],'visibility',progress>0?'visible':'hidden');
        set(papers[i],'transform',`translate(${x} ${bar.y}) rotate(${bar.rot*180/Math.PI})`);
        set(papers[i],'d',paperPaths[i][boil]);
      });
      const dp=outBack(prog(q,.15,.75));
      set(disc,'r',360*dp);set(satellite,'r',14*dp);
      set(discCenter,'visibility',dp>.2?'visible':'hidden');
      // 本片段中圆心出现时最近一次原片节拍恒为四秒。
      set(discCenter,'r',26+10*Math.exp(-Math.max(0,t-4)*6));
      set(satellite,'cx',1400+Math.cos(q*1.6)*400);set(satellite,'cy',540+Math.sin(q*1.6)*400);
      set(hud,'opacity',prog(t,3.9,4.4));set(hud,'color',t<4?'var(--ink)':'#111');
      set(era,'visibility',t>=4?'visible':'hidden');
      set(era,'transform',`translate(0 ${(1-outExpo(prog(t-4,0,.6)))*30})`);
      set(eraMark,'x',1848-measure('1959  —  THE TITLE SEQUENCE',15,3)-26);
      set(hudProgress,'width',1776*t/60);
      content(shot,t<4?'SHOT 00 / 08':'SHOT 01 / 08');
      content(timecode,`00:00:${String(Math.floor(t)).padStart(2,'0')}:${String(Math.floor(t*30)%30).padStart(2,'0')}`);
    };
  }
  F['char-color-cycle'] = root => opening(root,false);
  F['letter-hole-zoom'] = root => opening(root,true);
})(globalThis.MotionFactories);
