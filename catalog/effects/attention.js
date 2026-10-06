/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (F) {
  F['count-up'] = (root, M, definition) => {
    if (definition?.content) {
      const value=M.slot(definition,'value',128), from=M.slot(definition,'from',0), decimals=M.slot(definition,'decimals',0);
      const prefix=M.slot(definition,'prefix',''), suffix=M.slot(definition,'suffix',''), caption=M.slot(definition,'caption','每一步，走向确定的结果。');
      const format=M.slot(definition,'format','integer');
      const number=n=>{
        if(format==='integer')return String(Math.round(n));
        if(format==='thousands')return n.toLocaleString('en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
        if(format==='compact'){
          const units=[[1,''],[1e3,'K'],[1e6,'M'],[1e9,'B'],[1e12,'T']];
          let index=0;while(index<units.length-1&&Math.abs(n)>=units[index+1][0])index++;
          if(index<units.length-1&&Math.abs(Number((n/units[index][0]).toFixed(decimals)))>=1000)index++;
          return (n/units[index][0]).toFixed(decimals)+units[index][1];
        }
        return n.toFixed(decimals);
      };
      const label=n=>prefix+number(n)+suffix, family=M.textFont(label(value)+label(from));
      return M.textReady(root,[{family,text:label(value)+label(from)},{family:'Source Han Sans SC',weight:300,text:caption}],()=>{
        const s=M.scene(root,'<div class="big-number"></div><div class="number-caption"></div>');
        const samples=[from,value,0,...[1e3,1e6,1e9,1e12].flatMap(n=>[n-1,-n+1])].filter(n=>n>=Math.min(from,value)&&n<=Math.max(from,value));
        const width=Math.max(...samples.flatMap(n=>Array.from({length:10},(_,digit)=>M.measureText(root,prefix+number(n).replace(/[0-9]/g,String(digit))+suffix,64,family))),1), size=Math.min(64,64*544/width);
        if(size<24)throw new Error('数值与单位太长，请缩短前缀或后缀');
        s.one('.big-number').style.fontFamily='"'+family+'"';s.one('.big-number').style.fontSize=size+'px';
        const note=s.one('.number-caption');note.textContent=caption;note.style.fontFamily='"Source Han Sans SC"';note.style.fontWeight='300';
        if(M.measureText(root,caption,12,'Source Han Sans SC',300)>544)throw new Error('说明文字超出画板，请缩短 caption');
        return (t,o)=>{s.one('.big-number').textContent=label(M.mix(from,value,M.clamp(M.span(t,200,2600,o.ease))));};
      });
    }
    const s = M.scene(root, '<div class="big-number">0</div><div class="number-caption">每一步，走向确定的结果。</div>');
    return (t, o) => { s.one('.big-number').textContent = String(Math.round(M.clamp(M.span(t, 200, 2600, o.ease)) * 128)); };
  };
  // 沿用原地址的 Oswald 字体、短距落位与匀速逐字写出，保留整行占位。
  F['type-reveal'] = (root, M, definition) => {
    const text = M.slot(definition, 'text', 'WISE MOTION');
    const custom=Boolean(definition?.content),family=M.textFont(text);
    const setup=()=>{
    const chars = typeof Intl.Segmenter === 'function'
      ? [...new Intl.Segmenter(undefined, {granularity:'grapheme'}).segment(text)].map(x=>x.segment)
      : Array.from(text);
    const s = M.scene(root, '<div class="headline" style="font-family:Oswald,sans-serif;font-weight:700;font-size:var(--type-heading);letter-spacing:.2px;color:var(--ink)"><span class="type-line" style="position:relative;display:inline-block"><span aria-hidden="true" style="visibility:hidden">WISE MOTION</span><span class="typed-text" style="position:absolute;inset:0;text-align:left;white-space:pre" aria-label="WISE MOTION"></span></span></div>');
    const line=s.one('.type-line'),typed=s.one('.typed-text');
    if(custom){
      line.querySelector('[aria-hidden]').textContent=text;typed.setAttribute('aria-label',text);
      const headline=s.one('.headline'),width=M.measureText(root,text,48,family)+Math.max(0,chars.length-1)*.2;
      headline.style.fontFamily='"'+family+'"';headline.style.fontSize=Math.min(48,48*544/Math.max(1,width))+'px';
    }
    const duration=Math.max(720,chars.length*52);
    let previous=-1;
    return t=>{
      const enter=M.span(t,200,420,'outCubic');
      M.pose(line,{y:8*(1-enter),opacity:enter});
      const count=Math.min(chars.length,Math.floor(M.clamp((t-240)/duration)*chars.length));
      if(count!==previous){typed.textContent=chars.slice(0,count).join('');previous=count;}
    };
    };
    return custom?M.textReady(root,[{family,text}],setup):setup();
  };
  // 仅保留原配色页上半部分；尺寸比例和着色节拍沿用原作，底色由目录提供。
  F['tone-grow'] = (root, M) => {
    const palettes = [
      {name:'爱马仕橙', token:'HERMÈS ORANGE · #D95E00', color:'#D95E00', start:100, tones:620},
      {name:'克莱因蓝', token:'KLEIN BLUE · #002FA7', color:'#002FA7', start:300, tones:860}
    ];
    const levels = [.18, .34, .52, .72, 1];
    const s = M.scene(root, '<div class="palette-pair" style="position:absolute;left:20px;top:70px;width:900px;height:330px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:44px;transform:scale(.6666666666666666);transform-origin:0 0">' + palettes.map((p, i) =>
      `<article class="palette" style="display:grid;grid-template-rows:190px auto 38px;gap:16px;min-width:0">
        <div class="palette-main" style="position:relative;background:${p.color};opacity:0"><span style="position:absolute;left:20px;bottom:16px;font:700 ${M.textSize('caption',2/3)}px/1 Oswald,sans-serif;letter-spacing:.16em;color:#ffffff">${String(i+1).padStart(2,'0')}</span></div>
        <div class="palette-name" style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;min-width:0;opacity:0"><strong style="flex:0 0 auto;font:700 ${M.textSize('title',2/3)}px/1.05 var(--font);color:var(--ink)">${p.name}</strong><small style="min-width:0;padding-bottom:3px;font:700 ${M.textSize('caption',2/3)}px/1.1 Oswald,sans-serif;letter-spacing:.08em;color:var(--muted);white-space:nowrap">${p.token}</small></div>
        <div class="palette-tones" aria-label="${p.name}色阶" style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px">${levels.map(() => '<i style="display:block;background:var(--tone-fill,var(--stage));transform-origin:left center;opacity:0"></i>').join('')}</div>
      </article>`).join('') + '</div>');
    const groups = s.all('.palette').map(el => ({main:el.querySelector('.palette-main'), name:el.querySelector('.palette-name'), tones:[...el.querySelectorAll('.palette-tones i')]}));
    const style = (el, key, value) => {if(el.style[key]!==value)el.style[key]=value;};
    return t => groups.forEach((g, i) => {
      const p = palettes[i];
      const main = M.span(t,p.start,p.start+700,'inOutCubic');
      const name = M.span(t,p.start+60,p.start+720,'inOutCubic');
      style(g.main,'transform',`translateX(${-96*(1-main)}px)`);style(g.main,'opacity',String(main));
      style(g.name,'transform',`translateX(${-54*(1-name)}px)`);style(g.name,'opacity',String(name));
      g.tones.forEach((tone,j) => {
        const q = M.span(t,p.tones+j*45,p.tones+j*45+380,'linear');
        const fill=`color-mix(in srgb,var(--stage) ${(1-q)*100}%,${p.color} ${q*100}%)`;
        if(tone.style.getPropertyValue('--tone-fill')!==fill)tone.style.setProperty('--tone-fill',fill);
        style(tone,'opacity',String(levels[j]*M.ease(q,'outQuad')));
        style(tone,'transform',`scaleX(${M.ease(q,'outCubic')})`);
      });
    });
  };
  F['word-focus'] = (root, M, definition) => M.contentReady(root, definition, () => {
    const words=M.slot(definition,'words',['梳理关系','判断结构','组合组件']);
    const s=M.scene(root,'<div class="keyword-line" style="position:absolute;left:40px;top:158px;width:560px;display:flex;justify-content:center;gap:44px;font-family:Source Han Sans SC,sans-serif;font-size:var(--type-title);line-height:1.4;font-weight:700">'+words.map(word=>`<span class="keyword" style="position:relative;white-space:nowrap;color:var(--ink)">${M.escape(word)}<i aria-hidden="true" style="position:absolute;left:0;right:0;bottom:-6px;height:2px;border-radius:1px;background:var(--accent);transform-origin:left center;opacity:0"></i></span>`).join('')+'</div>');
    const nodes=s.all('.keyword'),lines=nodes.map(el=>el.querySelector('i'));
    if(definition?.content) nodes.forEach((node,i)=>M.fitText(root,node,words[i],150,24,16));
    const style=(el,key,value)=>{if(el.style[key]!==value)el.style[key]=value;};
    return t=>nodes.forEach((el,i)=>{
      const at=200+i*560.748;
      const active=M.span(t,at,at+160,'outQuad')*(1-M.span(t,at+560.748,at+800.748,'outQuad'));
      const fill=`color-mix(in srgb,var(--ink) ${(1-active)*100}%,var(--accent) ${active*100}%)`;
      if(el.style.getPropertyValue('--keyword-color')!==fill)el.style.setProperty('--keyword-color',fill);
      style(el,'color','var(--keyword-color)');
      const grow=M.span(t,at+100,at+320,'outCubic');
      const fade=1-M.span(t,at+620.748,at+800.748,'inQuad');
      style(lines[i],'transform',`scaleX(${grow})`);
      style(lines[i],'opacity',String(t>at+100?fade:0));
    });
  });
  F['focus-zoom'] = (root, M) => {
    const s = M.scene(root, M.cardSet(3)); const cards = s.all('.mini-card'); cards.forEach((c, i) => { c.style.left = `${148 + i * 118}px`; c.style.top = '125px'; });
    return (t, o) => { const p = M.span(t, 600, 2200, o.ease); cards.forEach((c, i) => M.pose(c, {scale: i === 1 ? 1 + p * .38 : 1 - p * .08, opacity: i === 1 ? 1 : 1 - p * .58, x: i === 1 ? 0 : (i - 1) * p * 18})); };
  };
})(globalThis.MotionFactories);
