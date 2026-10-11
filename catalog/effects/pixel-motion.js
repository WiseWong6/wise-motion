/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
/* Pixel painter shared by the catalog, actions and frame component. */
(function(global){
  'use strict';
  const F=global.MotionFactories=global.MotionFactories||{},D=global.WisePixelMotionData;
  if(!D)throw new Error('像素动效的固定绘制数据未加载');
  const W=320,H=180,EMPTY=255,RATE=1.5,clamp=x=>Math.min(1,Math.max(0,x)),mod=(x,n)=>{const r=x%n;return r<0?r+n:r;};
  const eo=t=>1-(1-clamp(t))**3,eob=t=>{t=clamp(t);return 1+2.7*(t-1)**3+1.7*(t-1)**2;};
  const glyphCache=new Map();
  function points(words,scale=1){
    const key=words+'|'+scale;if(glyphCache.has(key))return glyphCache.get(key);
    const out=[];
    [...words].forEach((ch,i)=>{
      if(!D.glyphs[ch])throw new Error('像素字形不支持字符：'+ch);
      D.glyphs[ch].trim().split(/\s+/).forEach((row,y)=>[...row].forEach((c,x)=>{
        if(c==='1')for(let a=0;a<scale;a++)for(let b=0;b<scale;b++)out.push([i*6*scale+x*scale+a,y*scale+b]);
      }));
    });glyphCache.set(key,out);return out;
  }
  const logo=points('WISE',3).map(([x,y])=>[x-(4*18-3)/2+W/2,y-10.5+80]);
  const set=(img,x,y,c)=>{if(x>=0&&x<W&&y>=0&&y<H)img[y*W+x]=c;};
  function rect(img,x,y,w,h,c){
    const x0=Math.max(0,Math.trunc(x)),y0=Math.max(0,Math.trunc(y)),x1=Math.min(W,Math.trunc(x+w)),y1=Math.min(H,Math.trunc(y+h));
    if(x1>x0&&y1>y0)for(let yy=y0;yy<y1;yy++)img.fill(c,yy*W+x0,yy*W+x1);
  }
  function circ(img,cx,cy,rx,ry,c){
    rx=Math.max(rx,.5);ry=Math.max(ry,.5);
    for(let y=Math.max(0,Math.ceil(cy-ry));y<=Math.min(H-1,Math.floor(cy+ry));y++)for(let x=Math.max(0,Math.ceil(cx-rx));x<=Math.min(W-1,Math.floor(cx+rx));x++)
      if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)set(img,x,y,c);
  }
  function text(img,words,cx,cy,scale,col,shadow=true){
    const width=words.length*6*scale-scale;
    for(const [x,y]of points(words,scale)){
      const xx=Math.trunc(cx-width/2+x),yy=Math.trunc(cy-3.5*scale+y);
      if(shadow)set(img,xx+1,yy+1,1);set(img,xx,yy,col);
    }
  }
  function stars(img,t){D.stars.forEach(([x,y],i)=>{if((i+Math.trunc(t*6))%7)set(img,x,y,i%3?15:14);});}
  function robot(img,x,y,t,sq=1,c=10){
    const w=24*(2-sq),h=22*sq,by=y-h;
    rect(img,x-w/2,by,w,h,c);rect(img,x-w/2+3,by+4,w-6,8,0);
    const blink=mod(t*1.3,3)<.1;
    for(const e of [-1,1])rect(img,x+e*5-2,by+6+(blink?2:0),3,blink?1:4,11);
    rect(img,x-1,by-5,2,5,13);rect(img,x-2,by-8,4,3,Math.trunc(t*4)%2?3:4);
    rect(img,x-w/2-4,by+h*.4+Math.sin(t*8)*2,4,3,c);rect(img,x+w/2,by+h*.4-Math.sin(t*8)*2,4,3,c);
  }
  function gather(img,t){
    logo.forEach(([tx,ty],i)=>{
      const [sx,sy]=D.starts[i],d=D.delays[i],k=eo((t-d)/1.8),x=sx+(tx-sx)*k,y=sy+(ty-sy)*k;
      if(x>=0&&x<W&&y>=0&&y<H)set(img,Math.trunc(x),Math.trunc(y),k>=1?4:[9,10,11][Math.trunc(d*10)%3]);
    });
  }
  function hop(img,u){
    const h=Math.abs(Math.sin(u*Math.PI*1.2)),sq=1-.35*Math.max(0,.3-h)/.3+.15*h;
    robot(img,40+u*16,140-h*30,u,sq);
  }
  function pops(img,u){
    [2,3,4,5,10].forEach((c,i)=>{
      const k=eob((u-.8-i*.8)/.7);if(k<=0)return;
      const cx=150+i*34,s=k*12;
      if(i%2)circ(img,cx,80,s,s*(1+.3*Math.sin(u*10)*(1-k)),c);
      else rect(img,cx-s,80-s,2*s,2*s,c);
      rect(img,cx-1,95,2,2+Math.trunc(6*Math.sin(u*6+i)**2),12);
    });
  }
  function city(img,u){
    // Geometry and window lights are frozen in building-local coordinates.
    // Move complete strips: clipping and wrapping never consume random values.
    for(const layer of D.cityLayers){
      const shift=Math.floor(mod(u*layer.speed,layer.span));
      for(const building of layer.buildings)for(const wrap of [-layer.span,0,layer.span]){
        const x=building.x-shift-30+wrap;
        if(x+building.width<=0||x>=W)continue;
        rect(img,x,H-building.height,building.width,building.height,layer.color);
        for(const [wx,wy]of building.windows)rect(img,x+wx,wy,2,2,layer.windowColor);
      }
    }
  }
  function ball(img,u){
    const bt=mod(u*1.1,1),y=130-4*bt*(1-bt)*90,sq=bt>.06&&bt<.94?1:.6;
    for(let g=1;g<5;g++){
      const lag=u-g*.04,pb=mod(lag*1.1,1);
      circ(img,40+mod(lag*35,120),130-4*pb*(1-pb)*90,2,2,9);
    }
    circ(img,40+mod(u*35,120),y,8/sq**.5,8*sq,3);
  }
  function morph(img,u){
    const m=(Math.sin(u*2)+1)/2;
    for(let y=75;y<115;y++)for(let x=225;x<265;x++){
      const dx=x-245,dy=y-95,d=(1-m)*Math.sqrt(dx*dx+dy*dy)+m*Math.max(Math.abs(dx),Math.abs(dy))*1.1;
      if(d<16)set(img,x,y,m<.5?5:11);
    }
  }
  function kinetic(img,u){
    const words=['EASING','TIMING','RHYTHM','SPACING','APPEAL','OVERLAP','POLISH!'],i=Math.min(Math.trunc(u),6),v=u-i,bg=[2,9,6,1,7,3,8][i];
    img.fill(bg);
    for(let s=0;s<8;s++)rect(img,0,Math.trunc(mod(s*23+u*120,H)),W,1,(bg+1)%16);
    const sc=Math.max(1,Math.trunc(1+eob(v/.35)*4)),x=W/2+(1-eo(v/.3))*-200+eo((v-.8)/.2)*300;
    text(img,words[i],x,H/2,sc,12);
    text(img,words[(i+1)%7],W/2-mod(u*80,400)+200,150,1,4,false);
  }
  function confetti(img,u){
    if(u<=.2)return;
    for(const [vx,vy,c]of D.confetti){
      const x=W/2+vx*u*40,y=60+vy*u*40+60*u*u;
      if(x>=0&&x<W-1&&y>=0&&y<H-1)rect(img,Math.trunc(x),Math.trunc(y),1+Math.trunc(u*8)%2,2,c);
    }
  }
  const masks=new Map();
  function dissolve(img,f){
    if(!D.dissolve[f])return;
    if(!masks.has(f)){const binary=global.atob(D.dissolve[f]);masks.set(f,Uint8Array.from(binary,c=>c.charCodeAt(0)));}
    const mask=masks.get(f);for(let i=0;i<img.length;i++)if(mask[i>>3]&(1<<(i&7)))img[i]=0;
  }
  // Playback speed 1 is the supplied painter's 1.5x; the 20s endpoint holds frame 899.
  const sourceTickAt=seconds=>Math.floor(seconds*RATE*30+1e-9);
  const frameAt=seconds=>Math.min(899,Math.max(0,sourceTickAt(seconds)));
  function full(img,f){
    const t=f/30;
    if(t<4){
      img.fill(0);stars(img,t);gather(img,t);
      if(t>3)text(img,'MOTION DESIGNER',W/2,120,1,Math.trunc(t*10)%2?11:12,false);
      dissolve(img,f);
    }else if(t<10){
      const u=t-4;img.fill(15);rect(img,0,140,W,40,14);hop(img,u);pops(img,u);text(img,'SQUASH + STRETCH',W/2,20,1,12);
    }else if(t<18){
      const u=t-10;img.fill(8);city(img,u);circ(img,260,30,14,14,4);ball(img,u);morph(img,u);
      text(img,u<4?'EASING CURVES':'PARALLAX + MORPH',W/2,14,1,12);
    }else if(t<25)kinetic(img,t-18);
    else{
      const u=t-25;img.fill(0);stars(img,t);robot(img,W/2,150,u,1+.15*Math.sin(u*10),10);confetti(img,u);
      text(img,'MOTION BY',W/2,40,2,Math.trunc(u*6)%2?4:12);
      const s=eob(u/.6)*3;text(img,'WISE',W/2,80,u<.6?Math.max(1,Math.trunc(s)):3,11);dissolve(img,f);
    }
  }
  const parts={gather,pops,hop,city,ball,morph,kinetic,stars,confetti,idle:(img,u)=>robot(img,W/2,150,u,1+.15*Math.sin(u*10),10),
    dissolve:(img,u)=>{full(img,108);dissolve(img,Math.min(119,108+Math.floor(u*30+1e-9)));}};
  const choices={
    'particle-word':'gather','scale-in':'pops','ball-bounce-trails':'ball','shape-morph':'morph',
    'word-slam':'kinetic','star-twinkle':'stars','pixel-dissolve-transition':'dissolve','squash-bounce':'idle',
    'pixel-hop-squash':'hop','parallax-city-scroll':'city','particle-ballistic-fall':'confetti'
  };
  const sourceClips={gather:[0,120],pops:[120,180],hop:[120,180],city:[300,240],ball:[300,240],morph:[300,240],kinetic:[540,210],stars:[0,120],confetti:[750,150],idle:[750,150],dissolve:[0,12]};
  function indices(seconds,{part}={}){
    if(!Number.isFinite(seconds)||seconds<0)throw new TypeError('像素动效时间必须为非负有限数');
    const img=new Uint8Array(W*H);
    if(!part)full(img,frameAt(seconds));
    else{
      img.fill(EMPTY);if(!parts[part])throw new Error('未知像素动作：'+part);
      const [offset,length]=sourceClips[part],tick=Math.min(length-1,sourceTickAt(seconds));
      parts[part](img,(tick+offset)/30-offset/30);
    }
    return img;
  }
  function rgba(img){
    const out=new Uint8ClampedArray(W*H*4);
    for(let i=0;i<img.length;i++)if(img[i]!==EMPTY){const p=D.palette[img[i]],j=i*4;out[j]=p[0];out[j+1]=p[1];out[j+2]=p[2];out[j+3]=255;}
    return out;
  }
  function createEngine(canvas){
    canvas.width=W;canvas.height=H;canvas.style.imageRendering='pixelated';
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('无法准备像素动效绘制画布');
    const image=ctx.createImageData(W,H);let disposed=false,last='';
    return {render(seconds,{part}={}){
      if(disposed)throw new Error('像素动效实例已经释放');
      const key=(part||'full')+'|'+sourceTickAt(seconds);if(last===key)return;
      image.data.set(rgba(indices(seconds,{part})));ctx.putImageData(image,0,0);last=key;
    },clear(){if(disposed||last==='')return;ctx.clearRect(0,0,W,H);last='';},
    dispose(preserve=false){if(disposed)return;disposed=true;if(!preserve){canvas.width=0;canvas.height=0;}}};
  }
  function factory(root,kit,definition={},part){
    const layers=part?[{id:part,start:0,end:Infinity}]:F['pixel-motion-sequence'].breakdown;
    root.innerHTML='<div data-pixel-motion="'+(part||'full')+'" style="position:absolute;inset:0;overflow:hidden">'+layers.map(layer=>
      '<div '+(part?'':'data-layer="'+layer.id+'" ')+'style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><canvas data-scene-source="original" width="320" height="180" style="width:100%;height:auto;aspect-ratio:16/9;image-rendering:pixelated"></canvas></div>'
    ).join('')+'</div>';
    const canvases=[...root.querySelectorAll('canvas')],engines=canvases.map(createEngine);
    const draw=ms=>{
      const seconds=Math.max(0,ms)/1000,playbackMs=(frameAt(seconds)/30*1000)/RATE;
      layers.forEach((layer,i)=>{
        if(part||playbackMs>=layer.start&&playbackMs<layer.end)engines[i].render(seconds,{part});
        else engines[i].clear();
      });
    };
    draw.destroy=preserve=>engines.forEach(engine=>engine.dispose(preserve));return draw;
  }
  global.WisePixelMotion={indices,rgba,createEngine,choices,frameAt,baseRate:RATE,parts:Object.keys(parts),
    factory:(root,kit,definition)=>factory(root,kit,definition,choices[definition.id]),
    route(id,prior){return Object.assign((root,kit,definition={})=>definition.variant_id==='pixel-motion'?factory(root,kit,definition,choices[id]):prior(root,kit,definition),prior);}};
  F['pixel-motion-sequence']=(root,kit,definition)=>factory(root,kit,definition);
  for(const id of ['pixel-hop-squash','parallax-city-scroll','particle-ballistic-fall'])F[id]=(root,kit,definition)=>factory(root,kit,definition,choices[id]);
  F['pixel-motion-sequence'].breakdown=[
    {id:'opening',name:'像素聚字与星点',time:'0–2.67 秒',start:0,end:4000,detail:'固定像素错峰聚成 WISE，星点逐格闪烁；末尾随机像素消退。',actions:['particle-word','star-twinkle','pixel-dissolve-transition']},
    {id:'hop',name:'横移连跳与图形回弹',time:'2.67–6.67 秒',start:4000,end:10000,detail:'机器人向右连跳，触地压扁、腾空拉长；五个图形错峰放大回弹。',actions:['pixel-hop-squash','scale-in']},
    {id:'city',name:'分层城市与弹跳换形',time:'6.67–12 秒',start:10000,end:18000,detail:'固定楼群与窗灯以三种速度向左移动；小球等幅循环弹跳并保留四枚拖尾，方圆轮廓连续变化。',actions:['parallax-city-scroll','ball-bounce-trails','shape-morph']},
    {id:'words',name:'文字放大滑入换位',time:'12–16.67 秒',start:18000,end:25000,detail:'七个词每2/3秒轮换，放大回弹、从左滑入再向右退出；八条像素横线持续滚动。',actions:['word-slam']},
    {id:'ending',name:'彩纸抛落与品牌收尾',time:'16.67–20 秒',start:25000,end:30000,detail:'机器人上下拉压，250枚彩纸抛出下落，WISE 像素字弹出并在末尾消退。',actions:['particle-ballistic-fall','squash-bounce','star-twinkle','pixel-dissolve-transition']}
  ].map(layer=>({...layer,start:layer.start/RATE,end:layer.end/RATE}));
})(globalThis);
