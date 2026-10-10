/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function(F){
  'use strict';
  const clamp=p=>Math.max(0,Math.min(1,p));
  const ease=p=>{p=clamp(p);return p<.5?4*p*p*p:1-(-2*p+2)**3/2;};
  const enter=(t,at,d)=>ease((t-at)/d),loop=p=>((p%1)+1)%1;
  const center=[320,170],radius=26;
  const branches=[
    {end:[176,104],control:[237,150],card:[30,32],title:'精准描述需求',detail:'把话说清楚',arrival:2.6},
    {end:[464,104],control:[403,150],card:[464,32],title:'进行需求拆解',detail:'分成小任务',arrival:3.7},
    {end:[320,244],control:[320,213],card:[247,244],title:'借助真实规律',detail:'从世界找灵感',arrival:4.8}
  ].map(b=>{
    const dx=b.end[0]-center[0],dy=b.end[1]-center[1],length=Math.hypot(dx,dy);
    return {...b,start:[center[0]+dx/length*radius,center[1]+dy/length*radius]};
  });
  const point=(b,p)=>b.start.map((v,i)=>(1-p)**2*v+2*(1-p)*p*b.control[i]+p*p*b.end[i]);
  // 截取同一条二次曲线，枝尖、亮尾和发射光点不另走轨道。
  function segment(b,a,z){
    const p=point(b,a),end=point(b,z);
    const c=p.map((v,i)=>v+(z-a)*((1-a)*(b.control[i]-b.start[i])+a*(b.end[i]-b.control[i])));
    return `M${p}Q${c} ${end}`;
  }
  let serial=0;
  // 按所需层创建节点；组合与独立动作调用同一套几何和更新函数。
  function scene(root,K,layers,offset=0){
    const has=name=>layers.includes(name);
    const id='motion-radial-branch-'+ ++serial;
    const glow=(name,alpha)=>`<radialGradient id="${id}-${name}"><stop stop-color="var(--accent)" stop-opacity="${alpha}"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></radialGradient>`;
    const circle=(part,r,fill,extra='')=>`<circle data-part="${part}" r="${r}" fill="${fill}" ${extra}/>`;
    root.innerHTML='<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true"><defs>'+(has('origin')?glow('root',.18):'')+(has('flow')?glow('head',.5):'')+(has('delivery')?glow('pulse',.55):'')+'</defs>'+
      (has('origin')?'<g data-layer="origin" data-part="ripples" fill="none" stroke="var(--teal)" stroke-width="1.2">'+[0,1].map(i=>`<circle data-part="ring${i}" cx="320" cy="170"/>`).join('')+'</g>':'')+
      (layers.some(name=>name!=='origin')?branches.map((b,i)=>`<g data-branch="${i}">`+
        (has('branches')?`<path data-layer="branches" data-part="branch${i}" fill="none" stroke-linecap="round"/>`+
        circle('tip'+i,2.4,'var(--accent)','data-layer="branches"'):'')+
        (has('flow')?`<g data-layer="flow" data-part="comet${i}"><path data-part="tail${i}" fill="none" stroke="var(--accent)" stroke-opacity=".5" stroke-width="1.8" stroke-linecap="round"/>`+
        circle('head-glow'+i,11,`url(#${id}-head)`)+circle('head'+i,2.8,'var(--accent)')+'</g>':'')+
        (has('delivery')?`<g data-layer="delivery" data-part="pulse${i}">`+circle('pulse-glow'+i,16,`url(#${id}-pulse)`)+circle('pulse-core'+i,3.8,'var(--accent)')+'</g>'+
        circle('arrival'+i,16,`url(#${id}-pulse)`,`data-layer="delivery" cx="${b.end[0]}" cy="${b.end[1]}"`):'')+
        (has('cards')?`<g data-layer="cards" data-part="card${i}" transform="translate(${b.card})"><rect width="146" height="96" rx="8" fill="var(--card)" stroke="var(--path)" stroke-width="1"/>`+
        '<path d="M33 0H113" fill="none" stroke="var(--teal)" stroke-width="1.5"/>'+
        `<text x="73" y="13" dominant-baseline="hanging" text-anchor="middle" font-size="${K.textSize('caption')}" font-weight="700" fill="var(--accent)">0${i+1}</text>`+
        `<text x="73" y="40" dominant-baseline="hanging" text-anchor="middle" font-size="${K.textSize('body')}" font-weight="300" fill="var(--ink)">${b.title}</text>`+
        `<text x="73" y="68" dominant-baseline="hanging" text-anchor="middle" font-size="${K.textSize('caption')}" font-weight="300" fill="var(--muted)">${b.detail}</text></g>`:'')+'</g>').join(''):'')+
      (has('origin')?'<g data-layer="origin" data-part="emitter">'+circle('root-glow',60,`url(#${id}-root)`,'cx="320" cy="170"')+
      circle('root',radius,'var(--card)','cx="320" cy="170" stroke="var(--accent)" stroke-opacity=".65" stroke-width="1.2"')+
      circle('root-core',6,'var(--accent)','cx="320" cy="170"')+'</g>':'')+'</svg>';
    const nodes=new Map([...root.querySelectorAll('[data-part]')].map(n=>[n.dataset.part,n]));
    const set=(name,attrs)=>{const node=nodes.get(name);for(const [key,value]of Object.entries(attrs))if(node.getAttribute(key)!==String(value))node.setAttribute(key,String(value));};
    const position=(name,p)=>set(name,{cx:p[0],cy:p[1]});
    const draw=[];
    if(has('origin'))draw.push(t=>{
      const rootP=enter(t,0,.4);
      set('emitter',{opacity:rootP});
      set('root-core',{r:6*(1+.08*Math.sin(t*5)*(1-enter(t,4.8,.6)))});
      set('ripples',{opacity:rootP*(1-enter(t,4.8,.6))});
      for(let k=0;k<2;k++){
        const p=loop(t*.55+k*.5);
        set('ring'+k,{r:radius+4+p*116,opacity:.4*(1-p)});
      }
    });
    branches.forEach((b,i)=>{
      if(has('branches'))draw.push(t=>{
        const grown=enter(t,.65+i*.25,.65),q=ease(grown),done=t>=b.arrival;
        set('branch'+i,{d:segment(b,0,q),opacity:grown>0?1:0,stroke:done?'var(--teal)':'var(--path)',
          'stroke-width':done?1.3:1,'stroke-dasharray':done?'none':'4 5','stroke-dashoffset':done?0:-t*26});
        position('tip'+i,point(b,q));set('tip'+i,{opacity:q>0&&q<1?1:0});
      });
      if(has('flow'))draw.push(t=>{
        const q=ease(enter(t,.65+i*.25,.65)),done=t>=b.arrival;
        // 原相位、尾长及已长出枝干的限制共同保留。
        const p=loop(t*.8+i*.33)*q,tail=Math.max(0,p-.3);
        set('comet'+i,{opacity:!done&&q>0&&p>.02?1:0});set('tail'+i,{d:segment(b,tail,p)});
        position('head'+i,point(b,p));position('head-glow'+i,point(b,p));
      });
      if(has('delivery'))draw.push(t=>{
        const run=enter(t,b.arrival-.9,.9),runP=ease(run),head=point(b,runP);
        set('pulse'+i,{opacity:run>0&&run<1?1:0});position('pulse-core'+i,head);position('pulse-glow'+i,head);
        const arrived=enter(t,b.arrival,.55);
        set('arrival'+i,{r:16+24*arrived,opacity:t>=b.arrival?1-arrived:0});
      });
      if(has('cards'))draw.push(t=>set('card'+i,{opacity:enter(t,b.arrival,.55)}));
    });
    return ms=>{
      const t=Math.min(5.4,Math.max(0,ms+offset-150)/1000);
      draw.forEach(render=>render(t));
    };
  }
  F['radial-branch-flow']=(root,K)=>scene(root,K,['origin','branches','flow','delivery','cards']);
  F['center-ripple-emit']=(root,K)=>scene(root,K,['origin']);
  // 各层保留组合绘制；圆心涟漪提供独立参考，其余层只在完整组合中使用。
  F['radial-branch-flow'].breakdown=[
    {id:'origin',actions:['center-ripple-emit'],name:'圆心与涟漪',start:150,end:5550,time:'0.15–5.55 秒',detail:'中心圆形渐显，两圈涟漪错相扩散，最后一次到达后涟漪退去、圆心停稳；中心始终固定。'},
    {id:'branches',actions:[],reason:'枝干生长仅作为完整组合的路径层保留，无独立参考。',name:'枝干错峰生长',start:800,end:4950,time:'0.80–4.95 秒',detail:'三条二次曲线从圆周错峰长出，枝尖沿同一曲线前进；对应光团抵达后，虚线变为实线。'},
    {id:'flow',actions:[],reason:'沿枝亮尾仅作为完整组合的光流层保留，无独立参考。',name:'亮尾沿枝干流动',start:800,end:4950,time:'0.80–4.95 秒',detail:'三组光点与亮尾沿各自枝干前进，只走已经长出的部分，并在对应发射光团抵达后停止。'},
    {id:'delivery',actions:[],reason:'光团发射与抵达仅作为完整组合的传递层保留，无独立参考。',name:'光团发射与抵达',start:1850,end:5500,time:'1.85–5.50 秒',detail:'三个较强光团依次发射，分别在 2.75、3.85、4.95 秒抵达枝干端点，落点辉光随后扩散淡去。'},
    {id:'cards',actions:[],reason:'端点卡片仅作为完整组合的内容层保留，无独立参考。',name:'抵达后显出卡片',start:2750,end:5500,time:'2.75–5.50 秒',detail:'三张端点卡片严格等待各自光团抵达，再用 0.55 秒渐显，结束后原位保留。'}
  ];
})(globalThis.MotionFactories);
