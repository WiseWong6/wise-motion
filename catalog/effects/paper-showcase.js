/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 纸面与成果样例：原生绘制与独立生成的纸面素材，不使用原片像素。每一帧仅由传入时间决定。 */
(function (global) {
  'use strict';
  const F=global.MotionFactories=global.MotionFactories||{};
  let instance=0;
  const clamp=v=>Math.max(0,Math.min(1,v));
  const mix=(a,b,p)=>a+(b-a)*p;
  const smooth=(p,a,b)=>{const q=clamp((p-a)/(b-a));return q*q*(3-2*q);};
  const out=(p,a,b)=>1-Math.pow(1-clamp((p-a)/(b-a)),3);
  const fixed=v=>Number(v.toFixed(4));
  const random=i=>{const x=Math.sin(i*127.1+61.7)*43758.5453;return x-Math.floor(x);};
  const set=(el,key,value)=>el.setAttribute(key,typeof value==='number'?fixed(value):value);
  const transform=(el,x,y,scale=1,angle=0)=>set(el,'transform',`translate(${fixed(x)} ${fixed(y)}) rotate(${fixed(angle)}) scale(${fixed(scale)})`);
  const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
  const line=(d,color='#393d35',width=.65,extra='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" ${extra}/>`;
  function stage(root,label,defs,body){
    root.dataset.art='original';root.style.background='#cdd4c8';
    root.innerHTML=`<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}"><defs>${defs}</defs>${body}</svg>`;
    return {one:s=>root.querySelector(s),all:s=>[...root.querySelectorAll(s)]};
  }
  function materialDefs(id){
    const grain=Array.from({length:150},(_,i)=>`<path d="M${fixed(random(i+5)*128)} ${fixed(random(i+205)*128)}l${fixed(.2+random(i+9)*1.6)} ${fixed(random(i+67)*.45)}" stroke="#283529" stroke-width=".3" opacity="${fixed(.04+random(i+331)*.11)}"/>`).join('');
    return `<radialGradient id="${id}-desk" cx="45%" cy="39%" r="76%"><stop stop-color="#dde2d4"/><stop offset=".67" stop-color="#c8d1c5"/><stop offset="1" stop-color="#b5c1b5"/></radialGradient>
      <linearGradient id="${id}-paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e8e4d4"/><stop offset=".45" stop-color="#d6d3be"/><stop offset="1" stop-color="#c4c4ae"/></linearGradient>
      <linearGradient id="${id}-ivory" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#f2f0e6"/><stop offset=".34" stop-color="#dddcd0"/><stop offset=".72" stop-color="#b6bcb3"/><stop offset="1" stop-color="#8b9b92"/></linearGradient>
      <linearGradient id="${id}-leather" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#62665c"/><stop offset=".35" stop-color="#3e443d"/><stop offset=".78" stop-color="#222e29"/><stop offset="1" stop-color="#101f1b"/></linearGradient>
      <linearGradient id="${id}-cloth"><stop stop-color="#795c53"/><stop offset=".52" stop-color="#59433e"/><stop offset="1" stop-color="#302f29"/></linearGradient>
      <radialGradient id="${id}-muscle" cx="28%" cy="20%" r="78%"><stop stop-color="#fffdf0"/><stop offset=".39" stop-color="#dcded2"/><stop offset=".76" stop-color="#aeb9ad"/><stop offset="1" stop-color="#748e80"/></radialGradient>
      <linearGradient id="${id}-mane" x1="0" y1="0" x2="1" y2=".7"><stop stop-color="#f9f7e8"/><stop offset=".4" stop-color="#d5dccc"/><stop offset=".82" stop-color="#98ad9c"/><stop offset="1" stop-color="#f2f0df"/></linearGradient>
      <linearGradient id="${id}-skin"><stop stop-color="#9e8d73"/><stop offset=".52" stop-color="#d8c7aa"/><stop offset="1" stop-color="#b19c7e"/></linearGradient>
      <filter id="${id}-shadow" x="-35%" y="-50%" width="180%" height="220%"><feGaussianBlur stdDeviation="3.4"/></filter>
      <filter id="${id}-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1"/></filter>
      <pattern id="${id}-grain" width="128" height="128" patternUnits="userSpaceOnUse">${grain}</pattern>`;
  }
  const scriptURL=typeof document==='undefined'?'':document.currentScript?.src||[...document.scripts].find(s=>s.src.endsWith('/effects/paper-showcase.js'))?.src||'';
  function assetURL(name,doc){
    if(scriptURL)return new URL('../assets/stack-flick/'+name,scriptURL).href;
    const dir=/\/catalog\/[^/]*$/.test(new URL(doc.baseURI).pathname)?'assets/':'catalog/assets/';
    return new URL(dir+'stack-flick/'+name,doc.baseURI).href;
  }
  function prepareImage(url){
    const image=new global.Image();
    if(typeof image.decode==='function'){image.src=url;return image.decode();}
    return new Promise((resolve,reject)=>{image.onload=()=>{image.onload=image.onerror=null;resolve();};image.onerror=()=>{image.onload=image.onerror=null;reject(new Error('纸面素材加载失败'));};image.src=url;});
  }
  F['result-anchors']=(root,K,definition)=>{
    const id='paper-results-'+(++instance);
    // 位置按原片终态折算到640×360；边缘物件保留原片的裁切。
    const cards=[
      {x:22.7,y:-52,w:142,h:137,bx:70.3,by:27.3,bw:124.3,bh:31.3,label:['字符雨幕','三十列字符错速流动'],paper:false},
      {x:211.2,y:7.7,w:169,h:106.3,bx:332,by:34.7,bw:120.7,bh:35.3,label:['多轨环绕','五道椭圆轨道围绕中心'],paper:false},
      {x:537,y:-25,w:150,h:118,bx:464,by:58,bw:128.3,bh:46.7,label:['起伏网面','层叠山线随噪声变化','前层遮住后层'],paper:false},
      {x:-5,y:99,w:160,h:127,bx:70.3,by:132.7,bw:124.3,bh:31.3,label:['开盒浮页','文件从档案盒里展开'],paper:true},
      {x:454,y:142.3,w:127,h:71.7,bx:548.3,by:176,bw:67.3,bh:27.3,label:['手绘图卡','蓝色折线与网格'],paper:true,fs:5.6},
      {x:0,y:289,w:122.5,h:110,bx:35,by:273.7,bw:111.7,bh:31,label:['散页卡组','编号纸页错落叠放'],paper:true},
      {x:161,y:240,w:168,h:93,bx:242,by:309.3,bw:101.3,bh:34,label:['环面线框','细线构成立体环面'],paper:false},
      {x:348,y:280,w:170,h:100,bx:441,by:324.3,bw:118,bh:55,label:['月相纸卡','蓝晒月面与环形山','保留原有纸卡细节'],paper:true},
      {x:571.5,y:243.3,w:125,h:145,bx:527,by:259.3,bw:96.3,bh:48,label:['噪声流场','连续方向驱动流线','保留完整原生图形'],paper:false}
    ];
    // 材质只包裹目录原图形：纸张有薄边和不同高度的投影，道具沿用自身轮廓。
    const finishes=[
      {kind:'graphite',angle:-1.1,height:'low',viewBox:'42 30 556 300',ink:'#e8eee5',muted:'#a7b5b0',stage:'#172927'},
      {kind:'navy',angle:.65,height:'raised',viewBox:'42 30 556 300',ink:'#e8ecde',muted:'#a9b7b6',stage:'#182c35',backing:true},
      {kind:'vellum',angle:-1.25,height:'low',viewBox:'42 30 556 300',ink:'#294e61',muted:'#68838a',stage:'#d9e1d9'},
      {kind:'object',angle:-1.2,viewBox:'78 42 492 294',artH:134,artY:-3},
      {kind:'object',angle:.8,viewBox:'176 20 288 320',artH:98,artY:-12},
      {kind:'object',angle:-1.4,viewBox:'200 10 260 340',artH:148,artY:-19},
      {kind:'graphite',angle:-.75,height:'raised',viewBox:'112 52 416 256',ink:'#d9e9df',muted:'#9cb1a5',stage:'#172927',backing:true},
      {kind:'object',angle:-1,viewBox:'180 12 280 336',artH:146,artY:-13},
      {kind:'cyanotype',angle:1.2,height:'low',viewBox:'42 30 556 300',ink:'#e8f0e5',muted:'#aac4c6',stage:'#285568'}
    ];
    cards.forEach((c,i)=>Object.assign(c,finishes[i]));
    const elements=definition.parameters.catalogElements;
    if(!Array.isArray(elements)||elements.length!==cards.length)throw new Error('成果配对缺少九个目录元素定义。');
    const depthDefs=
      '<linearGradient id="'+id+'-graphite" x2=".82" y2="1"><stop stop-color="#243833"/><stop offset=".52" stop-color="#172927"/><stop offset="1" stop-color="#101d1d"/></linearGradient>'+
      '<linearGradient id="'+id+'-navy" x2=".84" y2="1"><stop stop-color="#273f46"/><stop offset=".6" stop-color="#182c35"/><stop offset="1" stop-color="#10232d"/></linearGradient>'+
      '<linearGradient id="'+id+'-vellum" x2=".8" y2="1"><stop stop-color="#e9eddf"/><stop offset=".55" stop-color="#d9e1d9"/><stop offset="1" stop-color="#c8d4cb"/></linearGradient>'+
      '<linearGradient id="'+id+'-cyanotype" x2=".75" y2="1"><stop stop-color="#3a6979"/><stop offset=".48" stop-color="#285568"/><stop offset="1" stop-color="#1c4056"/></linearGradient>'+
      '<linearGradient id="'+id+'-sheen" x2=".8" y2="1"><stop stop-color="#fffef0" stop-opacity=".10"/><stop offset=".32" stop-color="#fffef0" stop-opacity=".035"/><stop offset=".66" stop-color="#fffef0" stop-opacity="0"/><stop offset="1" stop-color="#071916" stop-opacity=".09"/></linearGradient>'+
      '<radialGradient id="'+id+'-light" cx="24%" cy="8%" r="85%"><stop stop-color="#fffae4" stop-opacity=".32"/><stop offset=".64" stop-color="#fffae4" stop-opacity=".035"/><stop offset="1" stop-color="#607b73" stop-opacity=".09"/></radialGradient>'+
      '<filter id="'+id+'-low" x="-18%" y="-25%" width="145%" height="160%"><feDropShadow dx="1.1" dy="1.6" stdDeviation="1.35" flood-color="#18352e" flood-opacity=".22"/></filter>'+
      '<filter id="'+id+'-raised" x="-22%" y="-30%" width="150%" height="170%"><feDropShadow dx="2.2" dy="4.1" stdDeviation="2.8" flood-color="#18332c" flood-opacity=".21"/><feDropShadow dx=".3" dy=".6" stdDeviation=".45" flood-color="#14241e" flood-opacity=".30"/></filter>'+
      '<filter id="'+id+'-annotation" x="-12%" y="-30%" width="132%" height="170%"><feDropShadow dx=".25" dy=".65" stdDeviation=".6" flood-color="#1e342a" flood-opacity=".15"/></filter>'+
      '<filter id="'+id+'-ink" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="gamma" amplitude="1" exponent=".84" offset="0"/></feComponentTransfer></filter>';
    const art=(c,i)=>{
      const palette=c.paper?'':('--stage:'+c.stage+';--card:'+c.stage+';--card-edge:#64766d;--ink:'+c.ink+';--muted:'+c.muted+';--accent:#d27748;--path:#c8d3d3;--blue:#598eca;--teal:#aebdb0');
      const graphic='<svg class="result-catalog-art" y="'+(c.artY||0)+'" width="'+c.w+'" height="'+(c.artH||c.h)+'" viewBox="'+c.viewBox+'" preserveAspectRatio="xMidYMid meet" overflow="visible" style="'+palette+'"></svg>';
      const material=c.paper?graphic:
        (c.backing?'<rect class="result-backing" x="-1.3" y="2.4" width="'+(c.w+1.4)+'" height="'+(c.h+1)+'" fill="#e4e6d9" transform="rotate(-.8 '+(c.w/2)+' '+(c.h/2)+')" filter="url(#'+id+'-low)"/>':'')+
        '<g class="result-front-sheet" filter="url(#'+id+'-'+c.height+')">'+
          '<rect class="result-paper-edge" y="1.1" width="'+c.w+'" height="'+c.h+'" fill="'+(c.kind==='vellum'?'#afc0b4':'#c2cdbb')+'"/>'+
          '<rect class="result-surface" width="'+c.w+'" height="'+c.h+'" fill="url(#'+id+'-'+c.kind+')"/>'+
          '<rect class="result-paper-grain" width="'+c.w+'" height="'+c.h+'" fill="url(#'+id+'-grain)" opacity="'+(c.kind==='vellum'?'.46':'.28')+'"/>'+
          '<g class="result-printed-ink" filter="url(#'+id+'-ink)">'+graphic+'</g>'+
          '<rect class="result-sheen" width="'+c.w+'" height="'+c.h+'" fill="url(#'+id+'-sheen)"/>'+
          '<rect width="'+c.w+'" height="'+c.h+'" fill="none" stroke="#f1f3e4" stroke-opacity="'+(c.kind==='vellum'?'.64':'.22')+'" stroke-width=".42"/>'+
          '<path class="result-paper-highlight" d="M.3 '+(c.h-.5)+'V.3H'+(c.w-.5)+'" fill="none" stroke="#fffdf0" stroke-opacity="'+(c.kind==='vellum'?'.68':'.31')+'" stroke-width=".5"/>'+
        '</g>';
      return '<g class="rich-result" data-catalog-effect="'+elements[i].id+'" data-material="'+c.kind+'"><g class="result-material" transform="rotate('+c.angle+' '+(c.w/2)+' '+(c.h/2)+')">'+material+'</g></g>';
    };
    const q=stage(root,'不同纸面与立体道具围绕WISE MOTION排列，使用Oswald粗体标题',materialDefs(id)+depthDefs,
      '<rect width="640" height="360" fill="url(#'+id+'-desk)"/>'+
      '<rect class="result-desk-light" width="640" height="360" fill="url(#'+id+'-light)"/>'+
      '<rect class="result-desk-grain" width="640" height="360" fill="url(#'+id+'-grain)" opacity=".14"/>'+
      '<g class="result-art-layer">'+cards.map(art).join('')+'</g>'+
      '<g class="result-title"><text x="320" y="198" text-anchor="middle" font-size="36" font-family="Oswald,sans-serif" font-weight="700" letter-spacing=".15" fill="#14201b">WISE MOTION</text></g>'+
      '<g class="result-label-layer">'+cards.map((c,i)=>{
        const fs=c.fs||7.5,lineHeight=fs*1.24,y=(c.bh-c.label.length*lineHeight)/2+fs*.86;
        return '<g class="result-explanation" data-catalog-effect="'+elements[i].id+'" filter="url(#'+id+'-annotation)">'+
          '<rect x="-.35" y="-.35" width="'+(c.bw+.7)+'" height="'+(c.bh+.7)+'" rx="3.5" fill="none" stroke="#fafbf3" stroke-opacity=".6" stroke-width=".35"/>'+
          '<rect width="'+c.bw+'" height="'+c.bh+'" rx="3.2" fill="#eeeddf" fill-opacity=".91" stroke="#353d31" stroke-opacity=".55" stroke-width=".28"/>'+
          '<text font-family="Wise Motion Sans,system-ui,sans-serif" font-size="'+fs+'" fill="#172015">'+c.label.map((text,j)=>'<tspan x="6" y="'+fixed(y+j*lineHeight)+'">'+text+'</tspan>').join('')+'</text></g>';
      }).join('')+'</g>');
    // 调用当前目录的绘制方法，完整图形直接进入；后续内部运动仍由同一播放时间驱动。
    const catalog=q.all('.result-catalog-art').map((viewport,i)=>{
      const host=root.ownerDocument.createElement('div'),native=K.createRenderer(host,elements[i]);
      native(elements[i].preview_ms,{ease:elements[i].default_ease});
      const svg=host.querySelector('svg');
      if(!svg)throw new Error('目录元素没有提供可复用图形：'+elements[i].name);
      viewport.setAttribute('viewBox',cards[i].viewBox||svg.getAttribute('viewBox'));
      viewport.replaceChildren(...svg.childNodes);
      return native;
    });
    const nodes=q.all('.rich-result'),labels=q.all('.result-explanation'),title=q.one('.result-title');
    let last=-1,disposed=false;
    const render=ms=>{
      if(disposed)return;
      const p=clamp(ms/definition.duration_ms);if(p===last)return;last=p;
      const time=p*definition.duration_ms,titleIn=out(time,240,560);
      transform(title,0,mix(13,0,titleIn));set(title,'opacity',titleIn);
      const drift=mix(6,0,smooth(time,700,2050));
      cards.forEach((c,i)=>{
        const begin=i===0?0:320+(i-1)*55,enter=out(time,begin,begin+300);
        const dx=(c.x+c.w/2-320)*.42*(1-enter),dy=(c.y+c.h/2-180)*.48*(1-enter)+drift;
        transform(nodes[i],c.x+dx,c.y+dy);set(nodes[i],'opacity',enter);
        const caption=out(time,begin+170,begin+310);
        transform(labels[i],c.bx+dx,c.by+dy+mix(5,0,caption));set(labels[i],'opacity',caption);
        catalog[i](Math.min(elements[i].duration_ms,elements[i].preview_ms+Math.max(0,time-begin)),{ease:elements[i].default_ease});
      });
    };
    // 页面已有准备流程会等待本地字体，首帧无需临时替换成其他字形。
    if(root.ownerDocument.fonts)render.ready=root.ownerDocument.fonts.load('700 36px Oswald','WISE MOTION');
    render.destroy=()=>{if(disposed)return;disposed=true;catalog.forEach(native=>native.destroy?.());};
    return render;
  };

  F['stack-flick']=(root,K,definition)=>{
    const id='paper-stack-'+(++instance),asset=assetURL('map-paper.webp',root.ownerDocument),background=assetURL('desk-background.webp',root.ownerDocument);
    const languages=[['未来已来',27],['build the future',23],['construire demain',22],['construye el futuro',21],['未来をつくる',26],['die Zukunft gestalten',19],['creare il futuro',23],['미래를 만들다',25],['construir o futuro',22],['építi a jövőt',25],['让想法成形',27],['未来，从这里开始',25]];
    // 这些位置在整段中固定；新页盖在旧页上面，已有边角逐层留下。
    const resting=[[-6,7,7,1.03],[3,-9,-11,1.02],[-10,5,2,.98],[7,5,21,1.04],[0,-7,-7,1.01],[5,2,17,.98],[-8,-1,-19,1.03],[4,4,6,1.04],[7,-7,14,.96],[-5,-3,-9,1.02],[2,5,-3,1.01],[0,0,5,1]];
    const defs=materialDefs(id)+`<filter id="${id}-blue" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".4 .45 .1 0 -.2 .25 .4 .25 0 0 .2 .35 .4 0 0 0 0 0 1 0"/></filter><filter id="${id}-ivory" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".78 0 0 0 .18 0 .78 0 0 .19 0 0 .78 0 .19 0 0 0 1 0"/></filter>`;
    const paper=i=>`<svg class="sheet-map" x="-128" y="-84" width="256" height="168" viewBox="50 55 1437 914" preserveAspectRatio="none" overflow="hidden"${i%4===1?` filter="url(#${id}-blue)"`:i%4===2?` filter="url(#${id}-ivory)"`:''}><image href="${asset}" width="1536" height="1024"/></svg>`;
    const q=stage(root,'多语言地图纸在同一处快速逐张叠加，已落定的纸不再移动，错位边角与接触阴影持续累积',defs,
      `<image class="stack-background" href="${background}" x="0" y="0" width="640" height="360" preserveAspectRatio="xMidYMid slice"/>
      <text class="stack-mark" x="136" y="192" fill="#15221a" font-size="31" font-family="Georgia,serif" font-weight="700">W</text>
      <ellipse class="stack-cast-shadow" cx="328" cy="188" rx="136" ry="88" fill="#405d45" opacity=".12" filter="url(#${id}-shadow)"/>
      ${languages.map((item,i)=>`<g class="language-sheet" data-sheet="${i}"><rect class="sheet-shadow" x="-128" y="-84" width="256" height="168" fill="#3e493c" opacity=".09" filter="url(#${id}-soft)"/><g class="sheet-face">${paper(i)}<text class="sheet-language" x="0" y="7" text-anchor="middle" font-family="Georgia, 'Songti SC', 'Noto Serif CJK SC', serif" font-size="${item[1]}" fill="#151b14">${item[0]}</text></g></g>`).join('')}`);
    const nodes=q.all('.language-sheet'),shadows=q.all('.sheet-shadow'),deskShadow=q.one('.stack-cast-shadow'),images=q.all('image');
    const error=document.createElement('p');error.className='study-error';error.hidden=true;error.textContent='桌面或地图纸素材未能加载，请确认同目录的素材文件完整。';root.append(error);
    const failed=()=>{error.hidden=false;};images.forEach(image=>image.addEventListener('error',failed));let last=-1,disposed=false;
    const render=ms=>{
      const time=clamp(ms/definition.duration_ms)*definition.duration_ms;if(disposed||time===last)return;last=time;
      let count=0;
      nodes.forEach((node,i)=>{
        const start=i===0?0:300+(i-1)*180,added=time>=start;
        const settle=i===0?1:1-Math.pow(1-clamp((time-start)/90),3),lift=added?1-settle:0;
        const [restX,restY,angle,scale]=resting[i];
        // 新页只在堆顶短距离下压；落定后保持同一姿态，下一张继续覆盖。
        transform(node,328+restX,183+restY-i*.45-lift*7,scale*(1+lift*.025),angle);
        set(node,'visibility',added?'visible':'hidden');set(node,'opacity',added?1:0);
        set(node,'data-settled',added&&settle===1?'true':'false');
        set(shadows[i],'transform',`translate(1 ${fixed(1.2+lift*2)})`);set(shadows[i],'opacity',mix(.085,.035,lift));
        if(added)count++;
      });
      set(root,'data-sheet-count',count);set(deskShadow,'rx',132+count*.55);set(deskShadow,'ry',85+count*.32);set(deskShadow,'opacity',.08+count*.004);
    };
    render.ready=Promise.all([prepareImage(asset),prepareImage(background)]);
    render.destroy=()=>{disposed=true;images.forEach(image=>image.removeEventListener('error',failed));root.removeAttribute('data-sheet-count');};
    return render;
  };

  F['result-anchors'].requiresPreparation=true;
  F['stack-flick'].requiresPreparation=true;
  F['result-anchors'].breakdown=[{"id": "claude-glyph-rain-illustration", "name": "字符雨幕与说明", "detail": "图形错峰落位，半透明说明框随后就近出现；保留图形内部运动与纸面层次。", "time": "0.00–2.95 秒", "start": 0, "end": 2950, "actions": ["claude-glyph-rain-illustration"]}, {"id": "claude-orbits-illustration", "name": "多轨环绕与说明", "detail": "图形错峰落位，半透明说明框随后就近出现；保留图形内部运动与纸面层次。", "time": "0.32–2.95 秒", "start": 320, "end": 2950, "actions": ["claude-orbits-illustration"]}, {"id": "claude-terrain-illustration", "name": "起伏网面与说明", "detail": "图形错峰落位，半透明说明框随后就近出现；保留图形内部运动与纸面层次。", "time": "0.38–2.95 秒", "start": 375, "end": 2950, "actions": ["claude-terrain-illustration"]}, {"id": "archive-box-illustration", "name": "开盒浮页与说明", "detail": "图形错峰落位，半透明说明框随后就近出现；保留图形内部运动与纸面层次。", "time": "0.43–2.95 秒", "start": 430, "end": 2950, "actions": ["archive-box-illustration"]}, {"id": "chart-card-illustration", "name": "手绘图卡与说明", "detail": "图形错峰落位，半透明说明框随后就近出现；保留图形内部运动与纸面层次。", "time": "0.48–2.95 秒", "start": 485, "end": 2950, "actions": ["chart-card-illustration"]}, {"id": "folio-cards-illustration", "name": "散页卡组与说明", "detail": "图形错峰落位，半透明说明框随后就近出现；保留图形内部运动与纸面层次。", "time": "0.54–2.95 秒", "start": 540, "end": 2950, "actions": ["folio-cards-illustration"]}, {"id": "torus-illustration", "name": "环面线框与说明", "detail": "图形错峰落位，半透明说明框随后就近出现；保留图形内部运动与纸面层次。", "time": "0.59–2.95 秒", "start": 595, "end": 2950, "actions": ["torus-illustration"]}, {"id": "moon-card-illustration", "name": "月相纸卡与说明", "detail": "图形错峰落位，半透明说明框随后就近出现；保留图形内部运动与纸面层次。", "time": "0.65–2.95 秒", "start": 650, "end": 2950, "actions": ["moon-card-illustration"]}, {"id": "claude-flow-field-illustration", "name": "噪声流场与说明", "detail": "图形错峰落位，半透明说明框随后就近出现；保留图形内部运动与纸面层次。", "time": "0.70–2.95 秒", "start": 705, "end": 2950, "actions": ["claude-flow-field-illustration"]}, {"id": "brand", "name": "中央名称", "detail": "带空格的大写 WISE MOTION，使用 Oswald 粗体，上移显现。", "time": "0.24–2.95 秒", "start": 240, "end": 2950, "actions": []}];
})(globalThis);
