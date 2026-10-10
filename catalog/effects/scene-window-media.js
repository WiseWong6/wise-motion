/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
/* 每次播放独享原作花朵与木纹缓存，画布由目录统一释放。 */
(function(global){
/* 色区顺序与实验树一致；每种花保留独立的真实花形素材。 */
'use strict';
global.WiseWindowFlowerAssets=[
  {id:'green-chrysanthemum',name:'绿菊',kind:'round',src:'assets/seasonal-flowers/green-chrysanthemum.webp',cleanAlpha:true},
  {id:'gold-flower',name:'金桂',kind:'sprig',src:'assets/gold-flower/bloom-sheet.webp',cleanAlpha:false},
  {id:'orange-tulip',name:'橙色郁金香',kind:'cup',src:'assets/seasonal-flowers/orange-tulip-angles.webp',cleanAlpha:true,views:['斜正面','侧面','斜背面','背面'],
    // 原图花朵没有等格排列。每项为源图裁切范围 x/y/宽/高，以及花托的源图坐标；
    // 所有姿态共用同一比例和花托位置，保留花苞到盛开的真实尺寸变化。
    frameSize:280,frameAnchor:[140,235],frames:[
      [[59,70,93,140,104,205],[231,55,113,157,286,207],[416,42,133,170,479,207],[614,35,155,177,689,207],[825,30,183,185,910,210],[1048,20,207,203,1150,218],[1277,19,220,209,1384,223],[1520,19,235,210,1635,224]],
      [[64,264,88,152,111,411],[233,258,114,159,301,412],[411,254,138,163,496,412],[608,244,156,174,705,413],[812,243,170,175,918,413],[1033,249,216,168,1145,412],[1268,251,229,166,1380,412],[1508,262,259,155,1635,412]],
      [[54,466,97,152,94,613],[227,458,125,161,276,614],[411,453,148,166,469,614],[608,446,165,174,677,615],[819,451,189,170,891,616],[1037,449,202,172,1115,616],[1257,442,244,179,1365,616],[1507,440,260,181,1628,616]],
      [[60,671,88,150,104,816],[230,665,113,158,286,818],[413,663,136,161,483,819],[605,661,158,166,685,822],[804,660,186,167,901,822],[1017,661,214,168,1127,824],[1247,659,240,170,1366,824],[1506,659,253,171,1631,825]]
    ]},
  {id:'green-hydrangea',name:'绿绣球',kind:'sprig',src:'assets/seasonal-flowers/green-hydrangea.webp',cleanAlpha:true},
  {id:'red-rose',name:'红玫瑰',kind:'round',src:'assets/seasonal-flowers/red-rose.webp',cleanAlpha:true},
  {id:'blue-hydrangea',name:'蓝绣球',kind:'sprig',src:'assets/seasonal-flowers/blue-hydrangea.webp',cleanAlpha:true}
];

 global.WiseWindowMedia=function(document){
  const globalThis={};
/* 六色透明花朵共用的姿态绘制入口；保留旧文件名兼容金桂预览。 */
'use strict';
(()=>{
  const clamp=v=>Math.max(0,Math.min(1,v));
  const frames=8,views=4,cache=new WeakMap(),tiles=new Map();
  const MAX_PIXELS=8*1024*1024;
  let nextId=0,pixels=0;
  function sample(progress){
    const phase=clamp(progress)*(frames-1),first=Math.floor(phase);
    return {first,next:Math.min(frames-1,first+1),blend:phase-first};
  }
  // 初始化只登记图片；明暗与角度按需缓存，六张大图不再各复制四份。
  function prepare(sheet,cellSize,cleanAlpha=false,layout){
    if(!sheet?.naturalWidth||!sheet.naturalHeight)throw new Error('花朵图片尚未就绪');
    cellSize??=Math.max(Math.ceil(sheet.naturalWidth/frames),layout?.frameSize||0);
    let sizes=cache.get(sheet);
    if(!sizes){sizes=new Map();cache.set(sheet,sizes);}
    const key=`${cellSize}:${cleanAlpha}:${layout?.frames?layout.id:'grid'}`;
    if(sizes.has(key))return sizes.get(key);
    const prepared={id:++nextId,sheet,cellSize,cleanAlpha,layout:layout?.frames?layout:null,
      naturalWidth:cellSize*frames,naturalHeight:cellSize*views};
    sizes.set(key,prepared);return prepared;
  }
  function tile(source,frame,row,tone){
    const key=`${source.id}:${frame}:${row}:${tone}`;
    if(tiles.has(key)){
      const found=tiles.get(key);tiles.delete(key);tiles.set(key,found);return found;
    }
    const size=source.cellSize;
    while(pixels+size*size>MAX_PIXELS&&tiles.size){
      const [oldKey,old]=tiles.entries().next().value;
      pixels-=old.width*old.height;tiles.delete(oldKey);old.width=0;old.height=0;
    }
    const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    const sw=source.sheet.naturalWidth/frames,sh=source.sheet.naturalHeight/views;
    let left=Math.round(frame*sw),top=Math.round(row*sh);
    let width=Math.round((frame+1)*sw)-left,height=Math.round((row+1)*sh)-top;
    let dx=0,dy=0,dw=size,dh=size;
    if(source.layout){
      // 生成图里的花并不一定等距排列；按实际花朵裁切，并围绕同一花托对齐。
      // 八帧统一比例，不能将小花苞也自动放大到满格。
      const [x,y,w,h,anchorX,anchorY]=source.layout.frames[row][frame];
      const scale=size/source.layout.frameSize,[ax,ay]=source.layout.frameAnchor;
      left=x;top=y;width=w;height=h;
      dx=(ax+x-anchorX)*scale;dy=(ay+y-anchorY)*scale;dw=w*scale;dh=h*scale;
    }
    const paint=()=>ctx.drawImage(source.sheet,left,top,width,height,dx,dy,dw,dh);
    paint();
    if(source.cleanAlpha){
      // 仅调整显示时的透明度：a³ 减弱残影，四次叠合恢复实心花瓣。
      // 无像素读取、无滤镜，不改写 PNG，本地文件可直接使用。
      ctx.globalCompositeOperation='destination-in';paint();paint();
      ctx.globalCompositeOperation='source-over';ctx.drawImage(canvas,0,0);ctx.drawImage(canvas,0,0);
    }
    const brightness=[.66,.82,.96,1.08][tone];
    ctx.globalCompositeOperation='source-atop';
    ctx.fillStyle=brightness<1?`rgba(0,0,0,${1-brightness})`:`rgba(255,255,255,${brightness-1})`;
    ctx.fillRect(0,0,size,size);ctx.globalCompositeOperation='source-over';
    tiles.set(key,canvas);pixels+=size*size;return canvas;
  }
  // 在透明小画布中相加两帧的颜色和透明度，再整体贴入场景。
  // 直接在场景上各画半透明的一帧，会让实心花瓣在中间变成 75% 不透明。
  const blendBuffers=new Map();
  function blendImages(first,next,amount,outputSize=first.width,destination){
    const blend=clamp(amount);
    if(!destination){
      if(blend===0||first===next)return first;
      if(blend===1)return next;
    }
    // 按实际显示像素混合，避免小花也处理最大的整张花簇。
    // 已完成的中间姿态可直接写入独立目标，之后不再重复混合。
    const size=Math.max(1,Math.ceil(outputSize));
    let canvas=destination||blendBuffers.get(size);
    if(!canvas){
      canvas=document.createElement('canvas');
      blendBuffers.set(size,canvas);
    }
    if(canvas.width!==size)canvas.width=size;
    if(canvas.height!==size)canvas.height=size;
    const ctx=canvas.getContext('2d');
    ctx.setTransform(1,0,0,1,0,0);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.clearRect(0,0,size,size);
    ctx.globalCompositeOperation='source-over';
    if(blend===0||blend===1||first===next){
      ctx.globalAlpha=1;ctx.drawImage(blend===1?next:first,0,0,size,size);
    }else{
      ctx.globalAlpha=1-blend;ctx.drawImage(first,0,0,size,size);
      ctx.globalCompositeOperation='lighter';ctx.globalAlpha=blend;
      ctx.drawImage(next,0,0,size,size);
    }
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    return canvas;
  }
  function draw(ctx,sheet,progress,view,size=30,tone=2){
    if(progress<=0)return;
    const source=sheet.sheet?sheet:prepare(sheet);
    const {first,next,blend}=sample(progress);
    const row=Math.max(0,Math.min(views-1,Math.floor(view)));
    const image=blendImages(tile(source,first,row,tone),tile(source,next,row,tone),blend);
    ctx.drawImage(image,0,0,image.width,image.height,-size/2,-size/2,size,size);
  }
  function loadAll(sheets,onReady,onError){
    let remaining=sheets.length,ended=false;
    if(!remaining){onReady();return;}
    const fail=index=>{if(!ended){ended=true;onError(index);}};
    sheets.forEach((sheet,index)=>{
      let settled=false;
      const loaded=()=>{
        if(settled||ended)return;settled=true;
        if(!sheet?.naturalWidth||!sheet.naturalHeight){fail(index);return;}
        if(--remaining===0){ended=true;onReady();}
      };
      const failed=()=>{if(!settled){settled=true;fail(index);}};
      if(!sheet){failed();return;}
      if(sheet.complete)loaded();
      else{sheet.addEventListener('load',loaded,{once:true});sheet.addEventListener('error',failed,{once:true});}
    });
  }
  globalThis.FlowerSprite={frames,views,sample,prepare,draw,blendImages,loadAll};
  globalThis.GoldFlowerSprite=globalThis.FlowerSprite;
})();

/* 绘制素材保持原图；只在准备画面时取木料、顺着原枝形拼接。 */
'use strict';
(()=>{
const parts={
  top:[215,43,700,76],bottom:[210,1243,214,37],
  left:[128,150,68,1050],right:[947,150,69,1050],
  horizontal:[210,411,210,24],vertical:[434,150,21,240],
  sill:[105,1286,936,35]
};
function windowFrame(image,opening,columns,rows,density){
  const {x,y,w,h}=opening,edge=12,bar=5,margin=7;
  const bounds={x:x-edge-margin,y:y-edge-margin,w:w+2*(edge+margin),h:h+2*(edge+margin)+5};
  const canvas=document.createElement('canvas');
  canvas.width=Math.ceil(bounds.w*density);canvas.height=Math.ceil(bounds.h*density);
  const ctx=canvas.getContext('2d');ctx.scale(density,density);ctx.translate(-bounds.x,-bounds.y);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  for(let i=4;i>0;i--){
    ctx.strokeStyle=`rgba(48,34,21,${.025+(4-i)*.012})`;ctx.lineWidth=i*1.5;
    ctx.strokeRect(x-edge+2,y-edge+3,w+edge*2,h+edge*2);
  }
  const rail=(part,dx,dy,dw,dh)=>{
    const source=parts[part];
    if(part==='sill'){ctx.drawImage(image,...source,dx,dy,dw,dh);return;}
    const vertical=['left','right','vertical'].includes(part);
    const scale=vertical?dw/source[2]:dh/source[3];
    const length=(vertical?source[3]:source[2])*scale,total=vertical?dh:dw;
    // 保持木纹比例，沿木料长度首尾镜像续接，避免把纹理拉成长条。
    for(let at=0,index=0;at<total;at+=length,index++){
      const remaining=Math.min(length,total-at);
      ctx.save();ctx.beginPath();
      ctx.rect(dx+(vertical?0:at),dy+(vertical?at:0),vertical?dw:remaining,vertical?remaining:dh);ctx.clip();
      ctx.translate(dx+(vertical?0:at),dy+(vertical?at:0));
      if(index%2){ctx.translate(vertical?0:length,vertical?length:0);ctx.scale(vertical?1:-1,vertical?-1:1);}
      ctx.drawImage(image,...source,0,0,vertical?dw:length,vertical?length:dh);ctx.restore();
    }
  };
  rail('left',x-edge,y-edge,edge,h+edge*2);
  rail('right',x+w,y-edge,edge,h+edge*2);
  for(const top of [true,false]){
    ctx.save();ctx.beginPath();
    if(top){ctx.moveTo(x-edge,y-edge);ctx.lineTo(x+w+edge,y-edge);ctx.lineTo(x+w,y);ctx.lineTo(x,y);}
    else{ctx.moveTo(x,y+h);ctx.lineTo(x+w,y+h);ctx.lineTo(x+w+edge,y+h+edge);ctx.lineTo(x-edge,y+h+edge);}
    ctx.closePath();ctx.clip();
    rail(top?'top':'bottom',x-edge,top?y-edge:y+h,w+edge*2,edge);ctx.restore();
  }
  const pw=w/columns,ph=h/rows;
  for(let row=1;row<rows;row++)for(let col=0;col<columns;col++)
    rail('horizontal',x+col*pw,y+row*ph-bar/2,pw,bar);
  for(let col=1;col<columns;col++)rail('vertical',x+col*pw-bar/2,y,bar,h);
  rail('sill',x-edge-4,y+h+edge,w+edge*2+8,5);
  return {canvas,...bounds};
}
// 每段都贴着同一条中心线，纹理纵向跟随枝条，外缘由原枝轮廓裁切。
// 只取树皮中间的不透明部分，不把原图边缘的光晕带入场景。
function bark(ctx,image,samples){
  const sx=405,sy=30,sw=230,sh=1460;
  let total=0;
  const lengths=samples.slice(1).map((q,i)=>{const p=samples[i];const length=Math.hypot(q.x-p.x,q.y-p.y);total+=length;return length;});
  if(total<.01)return;
  let distance=0;
  for(let i=0;i<lengths.length;i++){
    const a=samples[i],b=samples[i+1],length=lengths[i];
    if(length<.001)continue;
    const radius=Math.max(a.radius,b.radius),overlap=Math.min(.65,length*.22);
    const start=Math.max(0,distance-overlap),end=Math.min(total,distance+length+overlap);
    ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x)+Math.PI/2);ctx.scale(1,-1);
    ctx.drawImage(image,sx,sy+start/total*sh,sw,(end-start)/total*sh,
      -radius,-(distance-start),radius*2,end-start);
    ctx.restore();distance+=length;
  }
}
globalThis.WoodArt={windowFrame,bark,parts};
})();

  return globalThis;
 };
})(globalThis);
