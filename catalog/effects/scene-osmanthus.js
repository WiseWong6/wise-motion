/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
/* 迁入自有原作，绘制函数与原数据共用；移除原界面、独立时钟和音频。 */
(function(global){
 global.WiseSceneSources.osmanthus=function(S,opt,def){
S.env.NightTreeData=global.NightTreeData;S.env.NightMoonMap=global.NightMoonMap;S.env.NightGlitter=global.NightGlitter;
 with(S.env){
const data=globalThis.NightTreeData;
const {branches,leaves,flowers,moon}=data;
// 三种样式共用原树与运动时序；金叶和枫叶减少银色掉落物。
const LOOK=document.body?.dataset.look||'flowers';
const MAPLE=LOOK==='maple-blend';
const GOLD_LEAVES_ONLY=LOOK==='gold-leaves'||MAPLE;
const SHOW_CANOPY_FLOWERS=!GOLD_LEAVES_ONLY;
// 每个前后层、枝组均匀疏叶；只筛选显示，保留原始叶位和生长时间。
const visibleLeaves=(()=>{
  const groups=new Map(),selected=new Set();
  const rank=l=>{let n=(l.sourceIndex+1)>>>0;n=Math.imul(n^(n>>>16),0x45d9f3b);return (n^(n>>>16))>>>0;};
  for(const leaf of leaves){const key=`${leaf.layer}:${leaf.volume}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(leaf);}
  for(const group of groups.values()){
    const sorted=[...group].sort((a,b)=>rank(a)-rank(b));
    for(const leaf of sorted.slice(0,Math.round(group.length*.7)))selected.add(leaf);
  }
  return leaves.filter(leaf=>selected.has(leaf));
})();
const W=720,H=960,DURATION=24,TREE_END=3,MORPH_TIME=.85;
const CANOPY_FLOWER_SCALE=1.35; // 单朵放大，花位与掉落物尺寸保持原值。
// 主画面独立取景：去掉原来给控件预留的空白，再等比映射到 3:4 画布。
const VIEW={width:640,height:640*4/3,scale:720/640};
const LEAF_START=data.leafClockStart,LEAF_END=data.leafClockEnd;

// 只改变整棵树的显示位置和比例，内部坐标、枝叶尺寸比例与生长时间不变。
const PLACEMENT={scale:.6,x:225,y:770,rootX:360,rootY:745};
// 重力使用取景像素 / 秒²；同一种弹性使回弹高度只随实际落差变化。
const GROUND_Y=PLACEMENT.y,GRAVITY=300,RESTITUTION=.46;
const toScreen=q=>({x:(q.x-PLACEMENT.rootX)*PLACEMENT.scale+PLACEMENT.x,y:(q.y-PLACEMENT.rootY)*PLACEMENT.scale+PLACEMENT.y});
const targetMoon={x:(moon.x-PLACEMENT.x)/PLACEMENT.scale+PLACEMENT.rootX,y:(moon.y-PLACEMENT.y)/PLACEMENT.scale+PLACEMENT.rootY};
const clamp=x=>Math.max(0,Math.min(1,x));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const button=document.querySelector('#play'),replayButton=document.querySelector('#replay'),slider=document.querySelector('#progress');
const readout=document.querySelector('#time'),status=document.querySelector('#status');
let playbackRate=1;
// LOCAL_SPEED_START
const speedButton=document.querySelector('#speed');
// LOCAL_SPEED_END
const reduced={matches:false};
function curve(b,t){
  const u=1-t;
  return{x:u*u*u*b.x+3*u*u*t*b.cx+3*u*t*t*b.dx+t*t*t*b.ex,
    y:u*u*u*b.y+3*u*u*t*b.cy+3*u*t*t*b.dy+t*t*t*b.ey};
}
function direction(b,t){
  const u=1-t;
  return Math.atan2(3*u*u*(b.cy-b.y)+6*u*t*(b.dy-b.cy)+3*t*t*(b.ey-b.dy),
    3*u*u*(b.cx-b.x)+6*u*t*(b.dx-b.cx)+3*t*t*(b.ex-b.dx));
}
const branchProgress=(b,t)=>clamp((t-b.start)/b.duration);
function leafProgress(leaf,t){
  if(t<=LEAF_START)return 0;
  if(t>=LEAF_END)return 1;
  // 原始时间从枝条长到叶柄时开始，叶片随各自枝条展开。
  return branchProgress(leaf,t);
}
function flowerProgress(f,t){
  const clock=flowerClocks.get(f);
  if(t<=clock.budAt)return 0;
  if(t<clock.start)return .22*smooth((t-clock.budAt)/(clock.start-clock.budAt));
  return mix(.22,f.maxOpen,clamp((t-clock.start)/f.duration));
}
// 参考本地动作库“风吹过，蒲公英散开”的移动风锋与局部响应。
function windState(t,x,y=680){
  const front=WIND.origin+(t-WIND.start)*WIND.speed,centerX=300-(front-WIND.origin)*.34;
  const envelope=smooth((t-WIND.start)/.35)*(1-smooth((t-(WIND.end-.6))/.6));
  const strength=Math.exp(-(((y-front)/WIND.width)**2)-(((x-centerX)/340)**2))*envelope;
  return {front,centerX,envelope,strength};
}

function treeShake(t){
  if(t<=IMPACT.start||t>=IMPACT.start+IMPACT.duration)return 0;
  const u=(t-IMPACT.start)/IMPACT.duration;
  return .012*smooth(u/.32)*(1-smooth((u-.32)/.68));
}
function attachedPoint(f,t){
  const bend=treeShake(t),height=f.y-PLACEMENT.rootY;
  return {x:f.x+bend*height,y:f.y-bend*.55*height};
}
function leafIsGold(leaf){
  // 固定枝组决定材质，避免逐叶随机混成杂色，也不改变叶位。
  return GOLD_LEAVES_ONLY||(Math.imul(leaf.branch+1,2654435761)>>>0)%10<8;
}
function mapleMaterial(leaf){
  const light=clamp(leaf.light*.65+leaf.layer/4*.35);
  const autumn=smooth(clamp((leaf.x-100)/500*.56+(leaf.y-60)/540*.44));
  const gold=[230+25*light,163+50*light,28+36*light];
  const red=[224+31*light,65+59*light,23+22*light];
  const rgb=gold.map((v,i)=>Math.round(mix(v,red[i],autumn)));
  const color=`rgb(${rgb.join(',')})`;
  return {color,fold:autumn>.5?'#ffb45e':'#ffdf69',vein:autumn>.5?'#ffd291':'#ffe789'};
}
function leafColor(leaf){
  if(MAPLE)return mapleMaterial(leaf).color;
  const light=clamp(leaf.light*.65+leaf.layer/4*.35);
  const from=leafIsGold(leaf)?[230,163,28]:[193,193,181];
  const to=leafIsGold(leaf)?[255,213,64]:[255,249,232];
  return `rgb(${from.map((v,i)=>Math.round(mix(v,to[i],light))).join(',')})`;
}
// 独立花、叶只调用原造型绘制，不准备整棵树、月亮、翅膀和反光贴图。
if(opt.mode==='flower'||opt.mode==='leaf')return {
  draw(){
    const c=S.ctx;c.save();c.translate(W/2,H/2);
    if(opt.mode==='flower'){
      const f=flowers[0],radius=23*f.size*1.2/64*CANOPY_FLOWER_SCALE;
      const zoom=Math.min(W,H)*.52/(radius*2);c.scale(zoom,zoom);flowerShape(c,f,1);
    }else{
      const leaf=visibleLeaves[0];c.scale(5,5);c.translate(-leaf.x,-leaf.y);drawLeaf(leaf,5,S.env);
    }
    c.restore();
  },inspect:()=>({subject:opt.mode})
};
// 独立补花：已有枝叶、花位不动，优先使用尚未开花的真实叶腋。
const extraFlowers=(()=>{
  const target=1470,added=[],occupied=new Map(),groups=new Map();
  const key=(x,y)=>`${Math.floor(x/3)}:${Math.floor(y/3)}`;
  const insert=f=>{const k=key(f.x,f.y);if(!occupied.has(k))occupied.set(k,[]);occupied.get(k).push(f);};
  const clear=(x,y)=>{
    const cx=Math.floor(x/3),cy=Math.floor(y/3);
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)
      for(const f of occupied.get(`${cx+dx}:${cy+dy}`)||[])
        if(Math.hypot(f.x-x,f.y-y)<2.5)return false;
    return true;
  };
  for(const f of flowers){insert(f);const k=`${f.layer}:${f.volume}`;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(f);}
  const used=new Set(flowers.map(f=>`${f.node}:${f.side}`));
  const rank=l=>(Math.imul(l.sourceIndex+1,2654435761)>>>0);
  const candidates=[...visibleLeaves].sort((a,b)=>
    Number(used.has(`${a.node}:${a.side}`))-Number(used.has(`${b.node}:${b.side}`))||rank(a)-rank(b));
  for(const leaf of candidates){
    const donors=groups.get(`${leaf.layer}:${leaf.volume}`);if(!donors)continue;
    const donor=donors[rank(leaf)%donors.length],seed=rank(leaf)/4294967296;
    for(let i=0;i<6&&added.length<target;i++){
      const angle=seed*Math.PI*2+i*2.39996,r=5+Math.sqrt(i/5)*8;
      const x=leaf.x+Math.cos(angle)*r,y=leaf.y+Math.sin(angle)*r;
      if(!clear(x,y))continue;
      const f={...donor,x,y,anchor:{x:leaf.x,y:leaf.y},node:leaf.node,side:leaf.side,
        branch:leaf.branch,at:leaf.at,layer:leaf.layer,volume:leaf.volume,z:leaf.z,
        extra:true,sourceLeaf:leaf.sourceIndex,rotation:angle,phase:seed*Math.PI*2,
        // 同一枝组使用原开花时间，补花不延长盛放时间。
        palette:i%3};
      added.push(f);insert(f);
    }
    if(added.length===target)break;
  }
  return added;
})();
const canopyFlowers=[...flowers,...extraFlowers];
// 只建立显示时钟，不改原树数据；同叶腋的花簇共享枝叶就绪时刻。
const flowerClocks=new Map();
const leafNodes=new Map(),leafBranches=new Map(),leafGroups=new Map();
for(const l of visibleLeaves){
  leafNodes.set(`${l.node}:${l.side}`,l);
  for(const [map,key] of [[leafBranches,l.branch],[leafGroups,l.volume]]){
    if(!map.has(key))map.set(key,[]);map.get(key).push(l);
  }
}
for(const f of canopyFlowers){
  const candidates=leafBranches.get(f.branch)||leafGroups.get(f.volume);
  const anchor=f.anchor||f;
  const leaf=leafNodes.get(`${f.node}:${f.side}`)||candidates.reduce((best,l)=>
    Math.hypot(l.x-anchor.x,l.y-anchor.y)<Math.hypot(best.x-anchor.x,best.y-anchor.y)?l:best);
  const b=branches[f.branch],branchAt=b.start+b.duration*f.at;
  // smooth(.86465)≈.95：可见叶片达到九成五展开，再开始出花苞。
  const leafAt=Math.max(LEAF_START,leaf.start+leaf.duration*.86465);
  const delay=.04+((Math.imul(leaf.sourceIndex+1,2654435761)>>>0)/4294967296)*.08;
  const budAt=Math.max(branchAt,leafAt)+delay,start=budAt+(f.start-f.budAt);
  flowerClocks.set(f,{leaf,branchAt,leafAt,delay,budAt,start,end:start+f.duration});
}
const BLOOM_END=Math.max(...[...flowerClocks.values()].map(c=>c.end));
const WIND={start:BLOOM_END,end:BLOOM_END+5.5,speed:82,origin:405,width:145};
const IMPACT={start:WIND.start+.16,duration:.7};

function symbolPath(ctx,f,r){
  ctx.beginPath();
  if(f.kind==='star'){
    if(f.symbolStyle.startsWith('cross')){
      const w=r*.15;
      const points=[[-w,-r],[w,-r],[w,-w],[r,-w],[r,w],[w,w],[w,r],[-w,r],[-w,w],[-r,w],[-r,-w],[-w,-w]];
      for(let i=0;i<points.length;i++){const [x,y]=points[i];if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
    }else{
      const corners=f.symbolStyle.startsWith('four')?4:5,inner=corners===4?.2:.43;
      for(let i=0;i<corners*2;i++){
        const angle=-Math.PI/2+i*Math.PI/corners,n=i%2?r*inner:r;
        if(i===0)ctx.moveTo(Math.cos(angle)*n,Math.sin(angle)*n);else ctx.lineTo(Math.cos(angle)*n,Math.sin(angle)*n);
      }
    }
  }else if(f.kind==='moon'){
    const cut=f.symbolStyle.startsWith('slim')?1.12:.86;
    ctx.arc(0,0,r,-Math.PI/2,Math.PI/2);
    ctx.bezierCurveTo(r*cut,r*.48,r*cut,-r*.48,0,-r);
  }else{
    ctx.moveTo(0,-r*1.2);
    ctx.bezierCurveTo(r*.95,-r*.55,r*.85,r*.45,0,r);
    ctx.bezierCurveTo(-r*.85,r*.45,-r*.95,-r*.55,0,-r*1.2);
  }
  ctx.closePath();
}
// 重用实际轮廓测量触地边缘，让空心、实心和旋转中的小物体落在同一地面。
function groundOffset(f,angle){
  const r=f.size*.55,outline=f.symbolStyle.endsWith('outline'),stroke=Math.max(.7,r*.16);
  angle+=f.symbolStyle==='cross-diagonal'?Math.PI/4:0;
  const sin=Math.sin(angle),cos=Math.cos(angle);let x=0,y=0,bottom=-Infinity;
  const sample=(px,py)=>{bottom=Math.max(bottom,px*sin+py*cos);};
  const path={beginPath(){},closePath(){},moveTo(px,py){x=px;y=py;sample(x,y);},lineTo(px,py){this.moveTo(px,py);},
    bezierCurveTo(cx,cy,dx,dy,ex,ey){
      const b={x,y,cx,cy,dx,dy,ex,ey};
      for(let i=1;i<=48;i++){const q=curve(b,i/48);sample(q.x,q.y);}x=ex;y=ey;
    },arc(cx,cy,r,from,to){
      for(let i=0;i<=96;i++){const a=mix(from,to,i/96);x=cx+Math.cos(a)*r;y=cy+Math.sin(a)*r;sample(x,y);}
    }};
  symbolPath(path,f,outline?r-stroke*.5:r);
  if(outline)bottom+=stroke*.5;
  if(f.kind==='leaf')bottom=Math.max(bottom,r*1.15*cos+.225,-r*.85*cos+.225);
  return bottom*fallingSize(f);
}
function fallPhysics(f,origin){
  const height=GROUND_Y-toScreen(origin).y;
  let fallDuration=Math.sqrt(2*height/GRAVITY);
  // 触地角度影响轮廓底边；先求接触时刻，再把同一落差用于撞击与回弹。
  for(let i=0;i<10;i++){
    const radius=groundOffset(f,f.rotation+fallDuration*.7)*PLACEMENT.scale;
    fallDuration=Math.sqrt(2*Math.max(0,height-radius)/GRAVITY);
  }
  const groundRadius=groundOffset(f,f.rotation+fallDuration*.7);
  const dropHeight=height-groundRadius*PLACEMENT.scale;
  const impactSpeed=GRAVITY*fallDuration,reboundSpeed=impactSpeed*RESTITUTION;
  return {fallDuration,groundRadius,dropHeight,impactSpeed,reboundSpeed,
    bounceDuration:reboundSpeed/GRAVITY,
    bounceHeight:reboundSpeed*reboundSpeed/(2*GRAVITY*PLACEMENT.scale)};
}
// 从枝叶间落下月牙、星星和银叶副本，原树保持茂盛。
const fallingFlowers=Array.from({length:112},(_,i)=>{
  const sourceIndex=(i*37)%flowers.length,original=flowers[sourceIndex],kind=['moon','star','leaf'][i%3];
  const variantIndex=Math.floor(i/3);
  const symbolStyle=kind==='star'?['five-solid','five-outline','four-solid','four-outline','cross','cross-diagonal'][variantIndex%6]
    :kind==='moon'?['crescent-solid','crescent-outline','slim-solid','slim-outline'][variantIndex%4]:'leaf-solid';
  // 形状与金银材质分开分配，同一轮廓在下一轮切换颜色。
  const styleCount=kind==='star'?6:kind==='moon'?4:1;
  const silver=GOLD_LEAVES_ONLY?(Math.imul(i+1,2654435761)>>>0)%7===0
    :(Math.floor(variantIndex/styleCount)+variantIndex%styleCount)%2===1;
  const metal=silver?'silver':'gold';
  const sourceLeaf=kind==='leaf'?visibleLeaves.reduce((best,l)=>
    Math.hypot(l.x-original.x,l.y-original.y)<Math.hypot(best.x-original.x,best.y-original.y)?l:best):null;
  const f={...original,...(sourceLeaf?{x:sourceLeaf.x,y:sourceLeaf.y}:{} ),kind,symbolStyle,wingSize:13+(i%5)};
  const release=IMPACT.start+i/111*3.3,windAt=release,origin=attachedPoint(f,release),source=toScreen(origin);
  const physics=fallPhysics(f,origin),{fallDuration,groundRadius,bounceDuration}=physics;
  const contactAt=release+fallDuration,bounceAt=contactAt,morphAt=bounceAt+bounceDuration;
  const force=windState((windAt+contactAt)/2,source.x,(source.y+GROUND_Y)/2).strength;
  const drift=Math.max(0,Math.min((toScreen(origin).x-22)/PLACEMENT.scale,105*(.3+.7*force)));
  const end={x:origin.x-drift,y:(GROUND_Y-PLACEMENT.y)/PLACEMENT.scale+PLACEMENT.rootY-groundRadius};
  const sweep=Math.min(32,Math.max(2,(toScreen(end).x-10)/PLACEMENT.scale*.3));
  return {...f,sourceIndex,kind,symbolStyle,metal,sourceLeaf:sourceLeaf?.sourceIndex??null,destination:i%4===0?'star':'moon',
    starRank:Math.floor(i/4),stopFraction:.5+((i*73)%113)/113*.32,release,color:i%4,wingSize:13+(i%5),origin,end,morphAt,windAt,drift,sweep,
    ...physics,contactAt,bounceAt,
    carryDuration:.6+(i%9)*.095,flightDuration:4.5+(i%11)*.16};
});
const flowerRelease=new Map(fallingFlowers.map(f=>[flowers[f.sourceIndex],f.release]));
const flowerAttached=(f,t)=>t<(flowerRelease.get(f)??Infinity);
function starTiming(f){
  const stop=f.morphAt+MORPH_TIME+f.carryDuration+f.flightDuration*f.stopFraction;
  return {brakeAt:stop-.8,settleAt:stop+.8};
}
function flowerMotion(f,time){
  if(f.destination==='star'){
    const {brakeAt,settleAt}=starTiming(f);
    if(time>brakeAt){
      const span=settleAt-brakeAt,u=clamp((time-brakeAt)/span);
      // 沿原飞行路线上逐渐减速，停在途中，不突然截断位置。
      time=brakeAt+span*(u-u*u*.5);
    }
  }
  const age=time-f.release;
  if(age<0)return{x:f.origin.x,y:f.origin.y,angle:f.rotation,morph:0,scale:1,opacity:0,flight:0};
  // 尚未化蝶时，风已改变落花的横向方向；所有偏移从零平滑开始。
  const fallTime=Math.min(age,f.fallDuration),falling=fallTime/f.fallDuration;
  let q={x:f.origin.x-f.drift*smooth(falling),
    y:f.origin.y+.5*GRAVITY*fallTime*fallTime/PLACEMENT.scale},flight=0;
  if(time>=f.contactAt)q={...f.end};
  if(time>=f.bounceAt){
    const riseTime=Math.min(time-f.bounceAt,f.bounceDuration),bounce=riseTime/f.bounceDuration;
    q={x:f.end.x+f.sweep*.35*smooth(bounce),
      y:f.end.y-(f.reboundSpeed*riseTime-.5*GRAVITY*riseTime*riseTime)/PLACEMENT.scale};
  }
  const morphAge=time-f.morphAt,morph=smooth(morphAge/MORPH_TIME);
  const apex={x:f.end.x+f.sweep*.35,y:f.end.y-f.bounceHeight};
  const launch={x:f.end.x+f.sweep,y:apex.y-12};
  const velocity={x:f.sweep*.65,y:-18};
  if(morphAge>=0){
    q=curve({x:apex.x,y:apex.y,cx:apex.x,cy:apex.y,
      dx:launch.x-velocity.x*MORPH_TIME/3,dy:launch.y-velocity.y*MORPH_TIME/3,
      ex:launch.x,ey:launch.y},clamp(morphAge/MORPH_TIME));
  }
  if(morphAge>=MORPH_TIME){
    const flyAge=morphAge-MORPH_TIME;
    const turn={x:launch.x+f.sweep*.85,y:launch.y-23-(f.sourceIndex%5)*3};
    flight=clamp(flyAge/(f.carryDuration+f.flightDuration));
    if(flyAge<f.carryDuration){
      // 触地后向右上回弹，化蝶后沿同一方向离地，再各自飞向月亮。
      q=curve({x:launch.x,y:launch.y,cx:launch.x+velocity.x*f.carryDuration/3,
        cy:launch.y+velocity.y*f.carryDuration/3,dx:turn.x,dy:turn.y,ex:turn.x,ey:turn.y},flyAge/f.carryDuration);
    }else{
      const rise=clamp((flyAge-f.carryDuration)/f.flightDuration);
      q=curve({x:turn.x,y:turn.y,cx:turn.x,cy:turn.y,
        dx:targetMoon.x-150-160*Math.sin(f.phase),dy:targetMoon.y+160+130*Math.cos(f.phase),
        ex:targetMoon.x+Math.cos(f.phase)*22,ey:targetMoon.y+Math.sin(f.phase)*19},rise);
      const envelope=Math.sin(Math.PI*rise)**2;
      q.x+=Math.sin(rise*Math.PI*6+f.phase)*14*envelope;
      q.y+=Math.cos(rise*Math.PI*4+f.phase)*9*envelope;
    }
  }
  const fallAngle=f.rotation+f.fallDuration*.7*smooth(age/f.fallDuration);
  return{x:q.x,y:q.y,angle:mix(fallAngle,-.14+Math.sin(time*1.6+f.phase)*.12,morph),
    morph,scale:1+.45*smooth(flight/.65),opacity:1,flight};
}
// 从各自飞行路线上挑停驻位置：疏密错落，避开月牙和树冠，互不扎堆。
const starStops=[];
for(const f of fallingFlowers.filter(f=>f.destination==='star')){
  const preferred=f.stopFraction;let best=preferred,bestScore=-Infinity;
  for(let i=0;i<49;i++){
    f.stopFraction=.43+i/48*.48;
    const q=toScreen(flowerMotion(f,24));
    if(q.y<105||q.y>350||q.x<140||q.x>555||Math.hypot(q.x-moon.x,q.y-moon.y)<105)continue;
    const distance=starStops.length?Math.min(...starStops.map(s=>Math.hypot(q.x-s.x,q.y-s.y))):60;
    const score=distance-Math.abs(f.stopFraction-preferred)*20;
    if(score>bestScore){bestScore=score;best=f.stopFraction;}
  }
  f.stopFraction=best;starStops.push(toScreen(flowerMotion(f,24)));
}
function starLifetime(f){
  const seed=((f.sourceIndex*2654435761)>>>0)/4294967296,bright=f.starRank%6===0;
  const fadeAt=starTiming(f).settleAt+.75+(bright?18+seed*4:4+seed*2);
  return {fadeAt,end:fadeAt+(bright?3:1.2)};
}
function starAppearance(f,t){
  const bright=f.starRank%6===0,seed=((f.sourceIndex*2654435761)>>>0)/4294967296;
  const q=starStops[f.starRank],near=1-clamp((Math.hypot(q.x-moon.x,q.y-moon.y)-100)/240);
  // 只选七颗局部星星，错开明灭；其余星位、大小和亮度固定。
  const period=3.6+seed*2.4,phase=((t-18+seed*period)%period+period)%period;
  const twinkle=reduced.matches||f.starRank%4!==0?0:
    smooth((t-18)/1.2)*smooth(phase/.45)*(1-smooth((phase-.45)/.85));
  const life=starLifetime(f),visibility=1-smooth((t-life.fadeAt)/(life.end-life.fadeAt));
  const restingAlpha=(bright?.92:.3+seed*.25)*(1-.22*near*moonProgress(t))*(f.starRank%4===0&&!reduced.matches?.6:1);
  return {radius:mix(bright?1.35+seed*.45:.55+seed*.5,2.2+seed*.4,twinkle),
    alpha:mix(restingAlpha,.98,twinkle)*visibility,bright,twinkle:twinkle*visibility};
}
function insideMoon(q){
  return Math.hypot(q.x-moon.x,q.y-moon.y)<=moon.r;
}
// 只放大离枝副本；短促反光使用固定相位，暂停和回拖时姿态一致。
const GLINT={attack:.035,fadeAt:.08,fade:.18,radius:22,core:.8,width:.65};
// 只改变呈现，不改变原运动轨迹、落地物理或汇月时刻。
function flightDepth(f,t){
  if(f.destination!=='moon')return {scale:1,alpha:1};
  const start=f.morphAt+MORPH_TIME+f.carryDuration;
  const far=smooth(((t-start)/f.flightDuration-.25)/.75);
  return {scale:mix(1,.62,far),alpha:mix(1,.8,far)};
}
function treeAttention(){
  // 离枝数量与叶片亮度独立；蝴蝶飞走后仍保留原本的金色。
  return 1;
}
function fallingSize(f){
  const symbolSpan=f.size*.55*(f.kind==='leaf'?2.35:2);
  return f.wingSize*.64*1.68/symbolSpan;
}
function butterflySpread(f,t){
  const flap=.22+.78*(.5+.5*Math.sin(t*11+f.phase));
  // 化形时先保持相近的外轮廓，完成后再平滑进入振翅。
  return mix(.84,flap,smooth((t-f.morphAt-MORPH_TIME)/.45));
}
function butterflyWing(f,t,side){
  const spread=butterflySpread(f,t),flight=smooth((t-f.morphAt-MORPH_TIME)/.45);
  const bank=Math.sin(t*1.7+f.phase)*.1*flight;
  // 每片翅从胸部翻转，收拢时翅尖抬起；左右翼迎光角度不同。
  const width=spread*(1-side*bank*.3),lift=-(1-spread)*.34+side*bank*.36;
  const sheen=Math.exp(-(((spread-.72+side*.07+bank*.3)/.26)**2));
  return {width,lift,sheen};
}
// 表面亮边与白色闪点共享一次反射，先掠过亮边，再达到短促峰值。
function reflectionCycle(f,t){
  const seed=((f.sourceIndex*2246822519)>>>0)/4294967296;
  const age=t-f.release-.5-seed*.26,period=2.9+seed*1.6;
  return age<0?-1:age%period;
}
function movingLightGain(f,t,kind){
  if(reduced.matches)return 0;
  const start=kind==='wing'?f.morphAt+MORPH_TIME+.15:f.release+.4;
  return smooth((t-start)/.25);
}
function fallingAppearance(f,t){
  const phase=reflectionCycle(f,t)-.52;
  const peak=f.sourceIndex%4===0?1:.12;
  const glint=phase<0?0:peak*smooth(phase/GLINT.attack)*(1-smooth((phase-GLINT.fadeAt)/GLINT.fade));
  return {size:mix(1,fallingSize(f),smooth((t-f.release)/.3)),glint:reduced.matches?0:glint};
}
function flowingLight(f,t){
  const phase=reflectionCycle(f,t);
  const alpha=phase<0?0:smooth(phase/.16)*(1-smooth((phase-.65)/.35));
  return {position:mix(-1.7,1.7,clamp(phase)),alpha:reduced.matches?0:alpha};
}
// 参考 p5.brush 的方向场：在物体自身坐标中沿局部方向积分，轨迹只在初始化生成。
// 主脉的切线与侧脉的分叉共同约束银光；花瓣用向外弯曲的方向，保持光贴着表面。
function surfaceVector(kind,item,lane,x,y){
  const u=clamp((x-lane.start)/(lane.end-lane.start));
  let guide,slope;
  if(kind==='leaf'){
    const side=lane.side||0,w=item.breadth*.42;
    guide=item.bend*(.76*x+.24*x*x)+side*w*Math.sin(u*Math.PI/2);
    slope=item.bend*(.76+.48*x)+side*w*Math.PI/2/(lane.end-lane.start)*Math.cos(u*Math.PI/2);
  }else{
    const bow=lane.side*.16;
    guide=bow*Math.sin(u*Math.PI);
    slope=bow*Math.PI/(lane.end-lane.start)*Math.cos(u*Math.PI);
  }
  slope+=(guide-y)*7;
  const length=Math.hypot(1,slope);return {x:1/length,y:slope/length};
}
function traceSurfaceField(kind,item,lane){
  let x=lane.start,y=kind==='leaf'?item.bend*(.76*x+.24*x*x):0,distance=lane.offset||0;
  const points=[{x,y,distance}],step=.018;
  for(let i=0;i<100&&x<lane.end;i++){
    const a=surfaceVector(kind,item,lane,x,y);
    const b=surfaceVector(kind,item,lane,x+a.x*step/2,y+a.y*step/2);
    const length=Math.min(step,(lane.end-x)/b.x),dx=b.x*length,dy=b.y*length;
    x+=dx;y+=dy;distance+=Math.hypot(dx,dy);points.push({x,y,distance});
  }
  return {points,angle:lane.angle||0};
}
function leafFieldPaths(leaf){
  const lanes=[{start:.07,end:.95}];
  for(const start of [.27,.48])for(const side of [-1,1])
    lanes.push({start,end:start+.31,side,offset:start-.07});
  return lanes.map(lane=>traceSurfaceField('leaf',leaf,lane));
}
const SURFACE_LIGHT={period:7.8,leafDuration:1.95,flowerDuration:1.7};
function buildSurfaceLights(kind){
  const objects=kind==='leaf'?visibleLeaves:canopyFlowers,cells=new Map();
  const eligible=o=>o.layer>=2&&(kind==='leaf'?o.size>=20&&o.foreshorten>.78:o.maxOpen>.95);
  for(const item of objects.filter(eligible)){
    const cell=`${Math.floor(item.x/90)}:${Math.floor(item.y/90)}`;
    if(!cells.has(cell))cells.set(cell,[]);cells.get(cell).push(item);
  }
  const groups=[...cells.values()].sort((a,b)=>Math.sin(a[0].x*.17+a[0].y*.13)-Math.sin(b[0].x*.17+b[0].y*.13))
    .slice(0,kind==='leaf'?60:28),lights=[];
  groups.forEach((group,i)=>{
    group.sort((a,b)=>b.z-a.z);const first=group[0];
    const selected=kind==='leaf'?[first]:group.filter(o=>Math.hypot(o.x-first.x,o.y-first.y)<24).slice(0,6);
    selected.forEach((item,j)=>{
      const paths=kind==='leaf'?leafFieldPaths(item):Array.from({length:4},(_,petal)=>
        traceSurfaceField('flower',item,{start:.10,end:.94,side:petal%2?1:-1,offset:petal*.11,angle:petal*Math.PI/2}));
      lights.push({kind,item,paths,delay:i/groups.length*SURFACE_LIGHT.period+j*.075,
        travel:Math.max(...paths.map(path=>path.points.at(-1).distance))+.24});
    });
  });
  return lights;
}
const surfaceLights=[...buildSurfaceLights('leaf'),...buildSurfaceLights('flower')];
// 从真实花位选择受光表面；各层与各枝组分散取样，不增加花或空中粒子。
const canopyGlitter=(()=>{
  const cells=new Map();
  for(const item of canopyFlowers){
    if(item.layer<2||item.maxOpen<.96)continue;
    const key=`${item.layer}:${Math.floor(item.x/48)}:${Math.floor(item.y/48)}`;
    if(!cells.has(key)||cells.get(key).z<item.z)cells.set(key,item);
  }
  return [...cells.values()].sort((a,b)=>Math.sin(a.x*.137+a.y*.071)-Math.sin(b.x*.137+b.y*.071))
    .slice(0,320).map(item=>({kind:'flower',item,slot:-1}));
})();
// 每个前景小区域选迎光的真实叶片；不会增加叶子或改变原来的叶形。
const leafGlitter=(()=>{
  const cells=new Map();
  for(const item of visibleLeaves){
    if(item.layer<2||item.size<17||item.foreshorten<.65)continue;
    const key=`${item.layer}:${Math.floor(item.x/54)}:${Math.floor(item.y/54)}`;
    if(!cells.has(key)||cells.get(key).z<item.z)cells.set(key,item);
  }
  return [...cells.values()].sort((a,b)=>Math.sin(a.x*.11+a.y*.073)-Math.sin(b.x*.11+b.y*.073))
    .slice(0,100).map(item=>({kind:'leaf',item,slot:-1}));
})();
function symbolFlowPaths(f){
  if(f.kind==='leaf')return leafFieldPaths({bend:.03,breadth:.29}).map(path=>({...path,
    points:path.points.map(q=>({...q,x:q.y*2,y:1-q.x*2.15}))}));
  const points=[];let x=0,y=0,distance=0;
  const point=(px,py)=>{
    if(points.length)distance+=Math.hypot(px-x,py-y);
    x=px;y=py;points.push({x,y,distance});
  };
  const path={beginPath(){},moveTo:point,lineTo(px,py){
    const sx=x,sy=y,count=Math.max(1,Math.ceil(Math.hypot(px-x,py-y)/.07));
    for(let i=1;i<=count;i++)point(mix(sx,px,i/count),mix(sy,py,i/count));
  },bezierCurveTo(cx,cy,dx,dy,ex,ey){
    const b={x,y,cx,cy,dx,dy,ex,ey};
    for(let i=1;i<=48;i++){const q=curve(b,i/48);point(q.x,q.y);}
  },arc(cx,cy,r,from,to){
    for(let i=0;i<=64;i++){const a=mix(from,to,i/64);point(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}
  },closePath(){this.lineTo(points[0].x,points[0].y);}};
  symbolPath(path,f,1);
  return [{angle:0,points:points.map(q=>({...q,distance:q.distance/distance}))}];
}
const fallingSurfacePaths=new Map(fallingFlowers.map(f=>[f,symbolFlowPaths(f)]));
function surfaceLight(light,t){
  const start=light.kind==='leaf'?LEAF_END+.12:flowerClocks.get(light.item).end+.08;
  const age=t-start-light.delay,duration=light.kind==='leaf'?SURFACE_LIGHT.leafDuration:SURFACE_LIGHT.flowerDuration;
  if(age<0||reduced.matches)return {head:0,alpha:0};
  const phase=age%SURFACE_LIGHT.period;
  return {head:phase/duration*light.travel,alpha:smooth(phase/.15)*(1-smooth((phase-duration+.3)/.3))*(1-smooth((t-DURATION+.8)/.8))};
}
// 月面明暗使用 NASA 正面月貌数据；满月以反射率差异为主，不叠随机坑洞阴影。
function lunarPixel(x,y){
  const rr=x*x+y*y;if(rr>=1)return [0,0,0,0];
  const map=globalThis.NightMoonMap,n=map.size;
  const px=clamp((x+1)/2)*(n-1),py=clamp((y+1)/2)*(n-1);
  const ix=Math.floor(px),iy=Math.floor(py),jx=Math.min(n-1,ix+1),jy=Math.min(n-1,iy+1);
  const at=(a,b)=>map.values[b*n+a]/255;
  const tone=mix(mix(at(ix,iy),at(jx,iy),px-ix),mix(at(ix,jy),at(jx,jy),px-ix),py-iy);
  const dark=[176,168,149],light=[255,247,218];
  // 只均匀提亮原月貌，不叠亮边，沿用原有轮廓透明度。
  return [...dark.map((v,i)=>Math.round(Math.min(255,mix(v,light[i],tone)*1.06))),Math.round(255*clamp((1-Math.sqrt(rr))*192))];
}
// 月面颜色只取样一次，圆边、明暗面和月相边界在同一高采样画布中合成。
function createMoonRaster(pixelRatio,displayScale=1,screenRatio=pixelRatio){
  const sampling=VIEW.scale*pixelRatio*4;
  // 过渡宽度以最终屏幕像素计，避免整幅画布经页面缩小后边缘又变硬。
  const edge=1.2/(moon.r*VIEW.scale*displayScale*screenRatio);
  const padding=Math.max(3/(VIEW.scale*pixelRatio),edge*moon.r);
  const size=Math.ceil((moon.r+padding)*2*sampling/2)*2,span=size/sampling;
  const step=span/size/moon.r,base=new Float32Array(size*size*6);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const nx=((x+.5)/size-.5)*span/moon.r,ny=((y+.5)/size-.5)*span/moon.r;
    const radius=Math.hypot(nx,ny),i=(y*size+x)*6,coverage=smooth((1-radius)/edge+.5);
    if(!coverage)continue;
    const inset=Math.max(1,radius/.999999),rgb=lunarPixel(nx/inset,ny/inset);
    base.set([rgb[0],rgb[1],rgb[2],coverage,nx,ny],i);
  }
  return {size,span,step,edge,base,pixels:new Uint8ClampedArray(size*size*4)};
}
function paintMoonRaster(raster,progress){
  const {base,pixels,edge}=raster,p=clamp(progress),k=1-2*p;
  const softness=.055*Math.sin(Math.PI*p);
  for(let j=0,i=0;j<pixels.length;j+=4,i+=6){
    const coverage=base[i+3];if(!coverage||p===0){pixels[j+3]=0;continue;}
    const x=base[i+4],y=base[i+5],arc=Math.sqrt(Math.max(0,1-y*y));
    const distance=(x-k*arc)/Math.sqrt(1+(k*y/Math.max(arc,.00001))**2);
    const lit=p===1?1:smooth(distance/edge+.5);
    const shade=softness>1e-8?1-.24*(1-smooth(Math.max(0,x-k*arc)/softness)):1;
    for(let c=0;c<3;c++)pixels[j+c]=Math.round(base[i+c]*shade);
    // 未受光区域透明，直接露出纯黑页面，不再出现蓝灰色圆盘。
    pixels[j+3]=Math.round(coverage*lit*255);
  }
  return pixels;
}
// 根据每只蝴蝶进入未来月面的位置求抵达区间，不用独立计时器播放月相。
const moonTravelers=fallingFlowers.filter(f=>f.destination==='moon');
const moonArrivals=new Map(moonTravelers.map(f=>{
  const end=f.morphAt+MORPH_TIME+f.carryDuration+f.flightDuration;
  let lo=end-f.flightDuration,hi=end;
  for(let i=0;i<36;i++){
    const mid=(lo+hi)/2,q=toScreen(flowerMotion(f,mid));
    if(!insideMoon(q))lo=mid;else hi=mid;
  }
  return [f.sourceIndex,{start:hi,end}];
}));
function moonContribution(f,t){
  const arrival=moonArrivals.get(f.sourceIndex);if(!arrival)return 0;
  return smooth((t-arrival.start)/(arrival.end-arrival.start));
}
function flowerPose(f,t){
  const pose=flowerMotion(f,t);
  const star=f.destination==='star'?smooth((t-starTiming(f).settleAt)/.75):0;
  return {...pose,star,angle:mix(pose.angle,0,star),opacity:pose.opacity*(1-moonContribution(f,t))};
}
// 光丝只采样物体刚走过的轨迹，不另造粒子，也不改变运动速度。
function motionRibbon(f,t){
  if(reduced.matches||f.sourceIndex%5!==0)return [];
  const current=flowerPose(f,t),airborne=t>=f.morphAt+MORPH_TIME;
  if(current.opacity<.01||current.star>.99||t<=f.release+.3||(!airborne&&t>=f.contactAt))return [];
  const duration=airborne?.48:.18,start=airborne?f.morphAt+MORPH_TIME:f.release+.3;
  const gain=smooth((t-start)/.3)*current.opacity*(1-current.star)*(1-smooth((t-DURATION+.8)/.8));
  const points=[];
  for(let i=0;i<=12;i++){
    const lag=duration*i/12,sample=t-lag;
    if(sample<start)break;
    const q=flowerPose(f,sample),distance=Math.hypot(q.x-current.x,q.y-current.y)*PLACEMENT.scale*VIEW.scale;
    if(distance>52)break;
    points.push({x:q.x,y:q.y,alpha:gain*(1-i/12)**2,lag,gold:(airborne?f.color%2===0:f.metal==='gold')});
  }
  return points;
}
function moonProgress(t){
  return moonTravelers.reduce((sum,f)=>sum+moonContribution(f,t),0)/moonTravelers.length;
}
// 圆盘右侧受光，明暗交界由一条椭圆弧向左推进：月牙、半月、盈月、满月。
function moonOutline(progress){
  const points=[],p=clamp(progress),steps=80;
  for(let i=0;i<=steps;i++){
    const angle=-Math.PI/2+i/steps*Math.PI;
    points.push({x:moon.r*Math.cos(angle),y:moon.r*Math.sin(angle)});
  }
  for(let i=steps;i>=0;i--){
    const angle=-Math.PI/2+i/steps*Math.PI;
    points.push({x:(1-2*p)*moon.r*Math.cos(angle),y:moon.r*Math.sin(angle)});
  }
  return points;
}
function grainPixel(x,y){return [0,0,0,255];}

function phaseAt(t){
  const phase=moonProgress(t);
  if(phase>=1)return '满月 · 星光留在途中';
  if(phase>0)return phase<.5?'蝶入月光 · 月牙渐盈':'蝶入月光 · 渐成满月';
  return t===0?'夜色':t<LEAF_START?'桂树生长':t<LEAF_END?'枝叶共长':t<BLOOM_END?'桂花开放':t<Math.min(...fallingFlowers.map(f=>f.release))?'满树桂花':t<Math.min(...fallingFlowers.map(f=>f.contactAt))?'风过 · 向左飘落':t<Math.max(...fallingFlowers.map(f=>f.morphAt+MORPH_TIME))?'落地反弹 · 花落成蝶':t<22?'群蝶赴月':'月下归静';
}

const soundStages={
  wood:{start:0,end:Math.max(...branches.map(b=>b.start+b.duration))},
  leaves:{start:LEAF_START,end:LEAF_END},
  blooms:SHOW_CANOPY_FLOWERS?(()=>{
    const ordered=flowers.filter(f=>f.maxOpen>.95).sort((a,b)=>flowerClocks.get(a).start+a.duration*.5-flowerClocks.get(b).start-b.duration*.5);
    return Array.from({length:11},(_,i)=>{
      const f=ordered[Math.floor(i*(ordered.length-1)/10)],q=toScreen(f);
      return {time:flowerClocks.get(f).start,duration:f.duration,pan:(q.x/VIEW.width-.5)*1.4};
    });
  })():[],
  flights:(()=>{
    const travelers=fallingFlowers.filter(f=>f.destination==='moon');
    const first=Math.min(...travelers.map(f=>f.morphAt+MORPH_TIME));
    return [first+.2,first+3.1,first+6].map((wanted,index)=>{
      const available=travelers.filter(f=>f.morphAt+MORPH_TIME<=wanted&&moonArrivals.get(f.sourceIndex).start>=wanted+1.2);
      const f=available[Math.floor((available.length-1)*index/2)];
      const from=toScreen(flowerPose(f,wanted)),to=toScreen(flowerPose(f,wanted+1.2));
      return {start:wanted,end:wanted+1.2,phase:f.phase,
        panFrom:clamp(from.x/VIEW.width)*1.4-.7,panTo:clamp(to.x/VIEW.width)*1.4-.7,sourceIndex:f.sourceIndex};
    });
  })(),
  stars:fallingFlowers.filter(f=>f.destination==='star'&&f.starRank%4===0).map(f=>{
    const seed=((f.sourceIndex*2654435761)>>>0)/4294967296,period=3.6+seed*2.4;
    let first=18-seed*period+.45;
    while(first<Math.max(18,starTiming(f).settleAt+.75))first+=period;
    return {first,period,...starLifetime(f),pan:(starStops[f.starRank].x/VIEW.width-.5)*1.4,note:f.starRank%5};
  })
};

const p=S.env;
  let background,treeCache,moonCache,ready=false,time=0,last=null,state='ready',finaleTime=0;
  let canopy=[];
  let flowerAtlas,wingAtlas;
  const FLOWER_STEPS=128,FLOWER_TILE=24,FLOWER_COLUMNS=36;
  const settledBranches=[...branches].sort((a,b)=>(a.start+a.duration)-(b.start+b.duration));
  let settledCount=0,treeCacheTime=-1;
  let glitter=null,opticalCache;
  const fallingGlitter=new Map();
  // 清脆轻碰声对齐触地瞬间，不在物体尚未落地时提前敲响。
  const sound=globalThis.NightTreeSound?.create({duration:DURATION,wind:WIND,stages:soundStages,
    cues:fallingFlowers.filter((_,i)=>i%6===0).map(f=>{
      const time=f.contactAt,q=toScreen(flowerPose(f,time));
      return {time,pan:(q.x/VIEW.width-.5)*1.4};
    }),onUnavailable:()=>{status.textContent='音效不可用，画面继续播放。';}});


  const density=Math.min(3,Math.max(2,window.devicePixelRatio||1));
  function drawBranch(ctx,b,amount){
    if(amount<=0)return;
    const left=[],right=[],count=30;
    for(let i=0;i<=count;i++){
      const t=amount*i/count,q=curve(b,t),normal=direction(b,t)+Math.PI/2;
      const taper=amount<.999?smooth((amount-t)/Math.max(.035,amount*.13)):1;
      let settled=mix(Math.max(.12,b.width*.5),Math.max(.12,b.endWidth*.5),smooth(t));
      if(b.guided&&b.parent>=0&&b.y>540){
        const collar=Math.min(.46,20/b.length),parentRadius=Math.max(.12,branches[b.parent].endWidth*.5);
        settled+=Math.max(0,parentRadius-Math.max(.12,b.width*.5))*(1-smooth(t/collar));
      }
      const radius=Math.max(.05,settled*taper);
      left.push({x:q.x+Math.cos(normal)*radius,y:q.y+Math.sin(normal)*radius});
      right.push({x:q.x-Math.cos(normal)*radius,y:q.y-Math.sin(normal)*radius});
    }
    const trace=list=>{
      for(let i=1;i<list.length-1;i++)ctx.quadraticCurveTo(list[i].x,list[i].y,
        (list[i].x+list[i+1].x)/2,(list[i].y+list[i+1].y)/2);
      const end=list[list.length-1];ctx.lineTo(end.x,end.y);
    };
    ctx.fillStyle='#fff6dc';ctx.beginPath();ctx.moveTo(left[0].x,left[0].y);trace(left);
    const tip=curve(b,amount);ctx.quadraticCurveTo(tip.x,tip.y,right[count].x,right[count].y);
    trace(right.reverse());ctx.closePath();ctx.fill();
    const parent=b.parent>=0?branches[b.parent]:null;
    const radius=(parent?parent.r1:b.r0)*smooth(amount/.15);
    ctx.beginPath();ctx.arc(b.x,b.y,Math.max(.02,radius),0,Math.PI*2);ctx.fill();
  }
  function drawGrowingTree(ctx,t){
    if(t<treeCacheTime){treeCache.clear();settledCount=0;}
    while(settledCount<settledBranches.length){
      const b=settledBranches[settledCount];if(b.start+b.duration>t)break;
      drawBranch(treeCache.drawingContext,b,1);settledCount++;
    }
    treeCacheTime=t;p.image(treeCache,0,0);
    // 已长成的枝干只绘制一次；当前仍在伸展的部分保持原始曲线和速度。
    for(let i=settledCount;i<settledBranches.length;i++){
      const b=settledBranches[i];if(b.start<t)drawBranch(ctx,b,branchProgress(b,t));
    }
  }
  function buildBackground(){
    const ctx=background.drawingContext,w=Math.floor(W*density),h=Math.floor(H*density);
    const pixels=ctx.createImageData(w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)pixels.data.set(grainPixel(x,y),(y*w+x)*4);
    ctx.putImageData(pixels,0,0);
  }
  let moonRaster,moonImage,lastMoonPhase=-1;
  function buildMoon(){
    const displayWidth=document.querySelector('#landscape').getBoundingClientRect?.().width||W;
    moonRaster=createMoonRaster(density,displayWidth/W,window.devicePixelRatio||1);
    moonCache?.remove?.();
    moonCache=p.createGraphics(moonRaster.size/2,moonRaster.size/2);moonCache.pixelDensity(2);
    moonImage=moonCache.drawingContext.createImageData(moonRaster.size,moonRaster.size);
    lastMoonPhase=-1;
  }
  function drawMoon(t){
    const progress=moonProgress(t);if(progress<=0)return;
    if(progress!==lastMoonPhase){
      moonImage.data.set(paintMoonRaster(moonRaster,progress));
      moonCache.drawingContext.putImageData(moonImage,0,0);lastMoonPhase=progress;
    }
    const ctx=p.drawingContext;ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    // 只缩放合成后的月面一次，不再另叠圆边或裁剪边。
    const span=moonRaster.span;p.image(moonCache,moon.x-span/2,moon.y-span/2,span,span);ctx.restore();
  }
  const wingMaterials=[
    {root:'#9b7135',middle:'#ebbd63',tip:'#fff0bc',rim:'#fff8df',vein:'#946a32',light:'255,249,224'},
    {root:'#778caa',middle:'#cedbe8',tip:'#f7f6f1',rim:'#ffffff',vein:'#657b98',light:'246,250,255'}
  ];
  function leafOutline(ctx,leaf){
    const n=leaf.size,w=leaf.breadth,bend=leaf.bend*n;
    if(MAPLE){
      // 五个尖裂片从叶柄向外展开；深凹口和细齿保留枫叶的轮廓。
      const half=[[.12,0],[.16,-.14],[.08,-.32],[.24,-.28],[.28,-.35],
        [.33,-.18],[.42,-.14],[.43,-.32],[.49,-.49],[.57,-.39],
        [.69,-.54],[.66,-.27],[.74,-.29],[.69,-.10],[.82,-.13],[1,0]];
      ctx.moveTo(0,0);
      for(const [x,y] of half)ctx.lineTo(x*n,(y+leaf.bend*x)*n);
      for(const [x,y] of half.slice(0,-1).reverse())ctx.lineTo(x*n,(-y+leaf.bend*x)*n);
      ctx.lineTo(0,0);ctx.closePath();return;
    }
    ctx.moveTo(0,0);
    ctx.bezierCurveTo(n*.20,-n*w,n*.73,-n*w+bend,n,bend);
    ctx.bezierCurveTo(n*.71,n*w+bend,n*.22,n*w*.85,0,0);ctx.closePath();
  }
  function leafShape(ctx,leaf){
    ctx.beginPath();leafOutline(ctx,leaf);ctx.fill();
  }
  function petalOutline(ctx,n,w){
    ctx.moveTo(1,-2);ctx.bezierCurveTo(n*.48,-w,n*.96,-w,n,0);
    ctx.bezierCurveTo(n*.96,w,n*.48,w,1,2);ctx.closePath();
  }
  function placeSurface(ctx,item,kind,amount=1){
    ctx.translate(item.x,item.y);ctx.rotate(kind==='leaf'?item.angle:item.rotation);
    if(kind==='leaf')ctx.scale(amount,amount*item.foreshorten);
    else{
      const scale=item.size*1.2/64*CANOPY_FLOWER_SCALE;ctx.scale(scale,scale);
      ctx.rotate(item.variant*.29);ctx.scale(1,[1,.82,.64,.91][item.variant]);
    }
  }
  function surfaceOutline(ctx,item,kind,part=-1,amount=1){
    ctx.save();placeSurface(ctx,item,kind,amount);
    if(kind==='leaf')leafOutline(ctx,item);
    else{
      if(item.maxOpen<.46){ctx.moveTo(5,0);ctx.ellipse(0,0,5,6.5,0,0,Math.PI*2);}
      if(part===4){ctx.moveTo(2.6,0);ctx.ellipse(0,0,2.6,2.4,0,0,Math.PI*2);}
      for(let i=0;i<4;i++){
        if(part>=0&&part!==i)continue;
        const open=smooth((item.maxOpen-.22-i*.018)/(.78-i*.018));if(open<=0)continue;
        ctx.save();ctx.rotate(i*Math.PI/2);petalOutline(ctx,mix(6,23,open),mix(1,8,open));ctx.restore();
      }
    }
    ctx.restore();
  }
  function strokeField(ctx,paths,head,alpha,size,kind,tail=.24,material=null){
    const passes=material||(kind==='leaf'?[[2.8,'#71859c',.26],[1.65,'#dceaff',.48],[.75,'#ffffff',.98]]
      :[[8,'#ffbf27',.45],[3.6,'#fff2b3',.98]]);
    ctx.lineCap='round';ctx.lineJoin='round';
    for(const path of paths){
      ctx.save();ctx.rotate(path.angle);
      for(let i=1;i<path.points.length;i++){
        const a=path.points[i-1],b=path.points[i],u=(head-(a.distance+b.distance)/2)/tail;
        if(u<=0||u>=1)continue;
        const light=Math.sin(u*Math.PI)**2;
        for(const [width,color,gain] of passes){
          ctx.save();ctx.globalAlpha*=alpha*light*gain;ctx.strokeStyle=color;ctx.lineWidth=width;
          ctx.beginPath();ctx.moveTo(a.x*size,a.y*size);ctx.lineTo(b.x*size,b.y*size);ctx.stroke();ctx.restore();
        }
      }
      ctx.restore();
    }
  }
  function drawSurfaceLight(light,t){
    if(light.kind==='flower'&&(!SHOW_CANOPY_FLOWERS||!flowerAttached(light.item,t)))return;
    const flow=surfaceLight(light,t);if(flow.alpha<=.001)return;
    const ctx=p.drawingContext;ctx.save();
    ctx.beginPath();surfaceOutline(ctx,light.item,light.kind);ctx.clip();
    // 同层靠前的物体也要挡住光；高层花叶由随后绘制的原缓存自然遮挡。
    const cut=(other,part)=>{
      ctx.beginPath();ctx.rect(light.item.x-100,light.item.y-100,200,200);
      surfaceOutline(ctx,other,light.kind,part);ctx.clip('evenodd');
    };
    // 分别扣除花瓣与花心，重叠处不因奇偶裁切重新露出后面的亮纹。
    if(light.kind==='flower')cut(light.item,4);
    for(const other of light.occluders)
      if(light.kind==='leaf'||flowerAttached(other,t))for(const part of light.kind==='leaf'?[-1]:[0,1,2,3,4])cut(other,part);
    placeSurface(ctx,light.item,light.kind);
    strokeField(ctx,light.paths,flow.head,flow.alpha,light.kind==='leaf'?light.item.size:23,light.kind,.24,
      light.kind==='leaf'&&leafIsGold(light.item)?[[2.8,'#e9a72a',.26],[1.65,'#ffd454',.48],[.75,'#fff1b0',.98]]:null);
    ctx.restore();
  }
  function wingPath(ctx,n,hind){
    ctx.beginPath();ctx.moveTo(0,n*.04);
    if(hind){
      ctx.bezierCurveTo(n*.36,-n*.02,n*.80,n*.18,n*.76,n*.43);
      ctx.bezierCurveTo(n*.74,n*.55,n*.63,n*.66,n*.54,n*.66);
      ctx.bezierCurveTo(n*.49,n*.74,n*.41,n*.75,n*.36,n*.68);
      ctx.bezierCurveTo(n*.19,n*.68,n*.06,n*.29,0,n*.04);
    }else{
      ctx.bezierCurveTo(n*.20,-n*.43,n*.64,-n*.98,n*.90,-n*.98);
      ctx.bezierCurveTo(n*.99,-n*.98,n,-n*.89,n,-n*.72);
      ctx.bezierCurveTo(n*.97,-n*.42,n*.73,-n*.10,n*.42,n*.06);
      ctx.bezierCurveTo(n*.23,n*.13,n*.08,n*.12,0,n*.04);
    }
    ctx.closePath();
  }
  const WING_TILE_W=44,WING_TILE_H=68,WING_COLUMNS=11,WING_UNIT=32;
  function buildWingAtlas(){
    // 四组前后翅材质：底色/翅脉、九个反光位置、边缘。飞行时只变形与混合。
    wingAtlas=p.createGraphics(WING_TILE_W*WING_COLUMNS,WING_TILE_H*4);wingAtlas.pixelDensity(2);
    const ctx=wingAtlas.drawingContext,n=WING_UNIT;
    for(let color=0;color<2;color++)for(const hind of [true,false]){
      const material=wingMaterials[color],row=color*2+(hind?0:1);
      for(let col=0;col<WING_COLUMNS;col++){
        ctx.save();ctx.translate(col*WING_TILE_W+4,row*WING_TILE_H+37);
        if(col===10){ctx.strokeStyle=material.rim;ctx.lineWidth=.28*WING_UNIT/9.6;wingPath(ctx,n,hind);ctx.stroke();}
        else{
          wingPath(ctx,n,hind);ctx.clip();
          if(col===0){
            const surface=ctx.createLinearGradient(0,n*.15,n*.92,hind?n*.65:-n*.86);
            surface.addColorStop(0,material.root);surface.addColorStop(.38,material.middle);surface.addColorStop(1,material.tip);
            ctx.globalAlpha=hind?.84:.94;ctx.fillStyle=surface;ctx.fillRect(-n*.1,-n*1.1,n*1.2,n*1.9);
            ctx.globalAlpha=.28;ctx.strokeStyle=material.vein;ctx.lineWidth=.3*WING_UNIT/9.6;ctx.lineCap='round';ctx.beginPath();
            if(hind){
              ctx.moveTo(n*.03,n*.08);ctx.quadraticCurveTo(n*.34,n*.14,n*.65,n*.43);
              ctx.moveTo(n*.03,n*.08);ctx.quadraticCurveTo(n*.25,n*.35,n*.36,n*.63);
            }else{
              ctx.moveTo(n*.04,0);ctx.quadraticCurveTo(n*.37,-n*.48,n*.87,-n*.88);
              ctx.moveTo(n*.04,0);ctx.quadraticCurveTo(n*.47,-n*.19,n*.91,-n*.54);
              ctx.moveTo(n*.04,0);ctx.quadraticCurveTo(n*.35,n*.02,n*.62,-n*.09);
            }
            ctx.stroke();
          }else{
            const x=n*(.48+.13*(col-1)/8),y=n*(hind?.35:-.57),pearl=ctx.createRadialGradient(x,y,0,x,y,n*.58);
            pearl.addColorStop(0,`rgba(${material.light},.8)`);pearl.addColorStop(.42,`rgba(${material.light},.32)`);pearl.addColorStop(1,`rgba(${material.light},0)`);
            ctx.fillStyle=pearl;ctx.fillRect(0,-n*1.1,n*1.1,n*1.9);
          }
        }
        ctx.restore();
      }
    }
  }
  function paintWing(ctx,row,col,n,alpha=1){
    if(alpha<=0)return;ctx.save();ctx.globalAlpha*=alpha;
    const scale=n/WING_UNIT;
    ctx.drawImage(wingAtlas.canvas,col*WING_TILE_W*2,row*WING_TILE_H*2,WING_TILE_W*2,WING_TILE_H*2,-4*scale,-37*scale,WING_TILE_W*scale,WING_TILE_H*scale);ctx.restore();
  }
  function drawButterfly(ctx,f,t){
    const n=f.wingSize*.64,material=wingMaterials[f.color%2];ctx.save();
    for(const side of [-1,1]){
      const wing=butterflyWing(f,t,side);
      ctx.save();ctx.transform(side*wing.width,wing.lift,0,1,0,0);
      for(const hind of [true,false]){
        const row=f.color%2*2+(hind?0:1),position=clamp(wing.width)*8,index=Math.min(7,Math.floor(position)),fraction=position-index;
        paintWing(ctx,row,0,n);
        const shine=(hind?.84:.94)*(.28+.6*wing.sheen);
        paintWing(ctx,row,1+index,n,shine*(1-fraction));paintWing(ctx,row,2+index,n,shine*fraction);
        if(glitter?.available){
          const slot=fallingGlitter.get(f).wings[(side===1?2:0)+(hind?0:1)];
          glitter.paint(ctx,slot);drawOpticalGlints(ctx,slot,'wing');
        }
        paintWing(ctx,row,10,n,.24+.3*wing.sheen);
      }
      ctx.restore();
    }
    const body=ctx.createLinearGradient(-n*.08,0,n*.08,0);
    body.addColorStop(0,material.root);body.addColorStop(.6,material.middle);body.addColorStop(1,material.rim);
    ctx.fillStyle=body;ctx.beginPath();ctx.ellipse(0,n*.1,n*.065,n*.34,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(0,-n*.24,n*.075,n*.085,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha*=.75;ctx.strokeStyle=material.tip;ctx.lineWidth=.28;ctx.lineCap='round';ctx.beginPath();
    ctx.moveTo(-n*.04,-n*.29);ctx.quadraticCurveTo(-n*.10,-n*.48,-n*.25,-n*.51);
    ctx.moveTo(n*.04,-n*.29);ctx.quadraticCurveTo(n*.10,-n*.48,n*.25,-n*.51);ctx.stroke();ctx.restore();
  }
  function drawLeaf(leaf,t,surface=p){
    const amount=smooth(leafProgress(leaf,t));if(amount<=0)return;
    const ctx=surface.drawingContext;ctx.save();ctx.translate(leaf.x,leaf.y);ctx.rotate(leaf.angle);
    ctx.scale(amount,amount*leaf.foreshorten);
    const color=leafColor(leaf),n=leaf.size;
    const fold=ctx.createLinearGradient(0,-n*leaf.breadth,0,n*leaf.breadth);
    fold.addColorStop(0,color);fold.addColorStop(.48,color);
    fold.addColorStop(.52,MAPLE?mapleMaterial(leaf).fold:leafIsGold(leaf)?(leaf.light>.5?'#ffdf69':'#f7c339'):(leaf.light>.5?'#fff9e8':'#dddccf'));fold.addColorStop(1,color);
    ctx.fillStyle=fold;leafShape(ctx,leaf);
    ctx.globalAlpha*=.28;ctx.strokeStyle=MAPLE?mapleMaterial(leaf).vein:leafIsGold(leaf)?'#ffe789':'#f9f0d8';ctx.lineWidth=.35;
    ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(n*.5,leaf.bend*n*.38,n,leaf.bend*n);
    if(MAPLE)for(const side of [-1,1])for(const [x,y] of [[.25,.28],[.65,.46]]){
      ctx.moveTo(n*.16,leaf.bend*n*.16);ctx.quadraticCurveTo(n*x*.66,n*(side*y*.4+leaf.bend*x*.66),n*x,n*(side*y+leaf.bend*x));
    }
    ctx.stroke();ctx.restore();
  }
  function flowerShape(ctx,f,progress,falling=false){
    if(progress<=0)return;
    const appear=smooth(progress/.14),open=smooth((progress-.22)/.78);
    ctx.save();const scale=f.size*1.2/64*appear*(falling?1:CANOPY_FLOWER_SCALE);ctx.scale(scale,scale);
    ctx.rotate(f.variant*.29);ctx.scale(1,[1,.82,.64,.91][f.variant]);
    ctx.fillStyle=['#ffd540','#f7c339','#f2ba34'][f.palette];
    if(falling){
      const gold=ctx.createLinearGradient(-18,18,18,-18);
      gold.addColorStop(0,'#dc8700');gold.addColorStop(.32,'#ffb900');
      gold.addColorStop(.72,'#ffda16');gold.addColorStop(1,'#fff078');
      ctx.fillStyle=gold;
    }
    if(open<.3){ctx.save();ctx.globalAlpha*=1-open/.3;ctx.beginPath();ctx.ellipse(0,0,5,6.5,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    for(let i=0;i<4;i++){
      const unfurl=smooth((progress-.22-i*.018)/(.78-i*.018));
      if(unfurl<=0)continue;
      const n=mix(6,23,unfurl),w=mix(1,8,unfurl);ctx.save();ctx.rotate(i*Math.PI/2);
      const gold=ctx.createLinearGradient(0,0,n,w);
      gold.addColorStop(0,'#e6a31c');gold.addColorStop(.36,['#ffd540','#f7c339','#f2ba34'][f.palette]);
      gold.addColorStop(1,(i+f.variant)%3===0?'#ffe789':'#ffdf69');ctx.fillStyle=gold;
      ctx.beginPath();petalOutline(ctx,n,w);ctx.fill();ctx.restore();
    }
    ctx.fillStyle=falling?'#b87300':'#ffe789';ctx.beginPath();ctx.ellipse(0,0,2.6,2.4,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function buildFlowerAtlas(){
    if(!SHOW_CANOPY_FLOWERS)return;
    const rows=Math.ceil((FLOWER_STEPS+1)*12/FLOWER_COLUMNS);
    flowerAtlas=p.createGraphics(FLOWER_COLUMNS*FLOWER_TILE,rows*FLOWER_TILE);flowerAtlas.pixelDensity(2);
    const ctx=flowerAtlas.drawingContext;
    for(let step=0;step<=FLOWER_STEPS;step++)for(let palette=0;palette<3;palette++)for(let variant=0;variant<4;variant++){
      const cell=step*12+palette*4+variant,x=cell%FLOWER_COLUMNS*FLOWER_TILE,y=Math.floor(cell/FLOWER_COLUMNS)*FLOWER_TILE;
      ctx.save();ctx.translate(x+FLOWER_TILE/2,y+FLOWER_TILE/2);ctx.scale(FLOWER_TILE/64,FLOWER_TILE/64);
      flowerShape(ctx,{size:64/1.2,palette,variant},step/FLOWER_STEPS);ctx.restore();
    }
  }
  function drawFlower(ctx,f,t,animated=false){
    if(!SHOW_CANOPY_FLOWERS||!flowerAttached(f,t))return;
    const progress=flowerProgress(f,t);if(progress<=0)return;
    ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.rotation);
    if(animated){
      // 原花瓣造型预绘为细分展开画格，避免数千朵花每帧重建渐变。
      const step=Math.round(progress*FLOWER_STEPS),cell=step*12+f.palette*4+f.variant;
      const x=cell%FLOWER_COLUMNS*FLOWER_TILE,y=Math.floor(cell/FLOWER_COLUMNS)*FLOWER_TILE,span=f.size*1.2;
      ctx.drawImage(flowerAtlas.canvas,x*2,y*2,FLOWER_TILE*2,FLOWER_TILE*2,-span/2,-span/2,span,span);
    }else flowerShape(ctx,f,progress);
    ctx.restore();
  }
  // 细光芒从亮核向两端退去，不用厚实星形或持续光晕。
  function drawGlint(ctx,x,y,amount,scale,extent=1){
    if(amount<=.001)return;
    ctx.save();ctx.translate(x,y);ctx.globalAlpha*=amount;
    // 抵消树和飞行对象的缩放，让光核保持可辨认的画布尺寸。
    const compensation=extent/(VIEW.scale*PLACEMENT.scale*scale);ctx.scale(compensation,compensation);
    const reach=GLINT.radius*(.5+.5*amount);
    const halo=ctx.createRadialGradient(0,0,0,0,0,4.5);
    halo.addColorStop(0,'rgba(255,250,223,.8)');halo.addColorStop(.25,'rgba(255,230,161,.22)');halo.addColorStop(1,'rgba(255,219,133,0)');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,4.5,0,Math.PI*2);ctx.fill();
    // 横、竖两道光芒使用相同长度、粗细和亮度衰减。
    for(const angle of [0,Math.PI/2]){
      ctx.save();ctx.rotate(angle);
      const ray=ctx.createLinearGradient(-reach,0,reach,0);
      ray.addColorStop(0,'rgba(255,220,110,0)');
      ray.addColorStop(.4,'rgba(255,241,185,.65)');
      ray.addColorStop(.5,'#fffdf0');
      ray.addColorStop(.6,'rgba(255,241,185,.65)');
      ray.addColorStop(1,'rgba(255,220,110,0)');
      ctx.strokeStyle=ray;ctx.lineWidth=GLINT.width;
      ctx.beginPath();ctx.moveTo(-reach,0);ctx.lineTo(reach,0);ctx.stroke();ctx.restore();
    }
    ctx.fillStyle='#fffdf0';ctx.beginPath();ctx.ellipse(0,0,GLINT.core,GLINT.core,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function buildOpticalCache(){
    opticalCache=p.createGraphics(160,80);opticalCache.pixelDensity(2);
    const ctx=opticalCache.drawingContext;
    for(const [index,gold] of [true,false].entries()){
      ctx.save();ctx.translate(index*80+40,40);
      const halo=ctx.createRadialGradient(0,0,0,0,0,11);
      halo.addColorStop(0,'rgba(255,252,245,.6)');
      halo.addColorStop(.2,gold?'rgba(255,225,169,.19)':'rgba(220,231,255,.2)');
      halo.addColorStop(1,'rgba(236,223,255,0)');ctx.fillStyle=halo;
      ctx.fillRect(-12,-12,24,24);
      for(const angle of [0,Math.PI/2]){
        ctx.save();ctx.rotate(angle);
        // 极淡色边只围绕白光，不改变金银物体的底色。两根光芒等长等宽。
        for(const [offset,color,alpha,width] of [[-.5,'230,203,255',.13,1.3],[.5,'194,226,255',.13,1.3],[0,gold?'255,240,210':'237,245,255',.9,.75]]){
          const ray=ctx.createLinearGradient(-29,0,29,0);
          ray.addColorStop(0,`rgba(${color},0)`);ray.addColorStop(.4,`rgba(${color},${alpha*.35})`);
          ray.addColorStop(.5,`rgba(${color},${alpha})`);ray.addColorStop(.6,`rgba(${color},${alpha*.35})`);ray.addColorStop(1,`rgba(${color},0)`);
          ctx.strokeStyle=ray;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(-29,offset);ctx.lineTo(29,offset);ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
    }
  }
  function drawOpticalGlints(ctx,slot,kind){
    if(!glitter?.available)return;
    for(const point of glitter.highlights(slot)){
      const enhanced=kind==='flower'||kind==='wing';
      const amount=smooth((point.energy-(enhanced?.04:.08))/(enhanced?.6:.8));if(amount<.015)continue;
      const transform=ctx.getTransform();
      const x=(transform.a*point.x+transform.c*point.y+transform.e)/density;
      const y=(transform.b*point.x+transform.d*point.y+transform.f)/density;
      // 位置跟随叶片/翅膀；光学光芒使用画面坐标，收翅时不会压扁或缩没。
      ctx.save();ctx.setTransform(density,0,0,density,0,0);ctx.translate(x,y);ctx.rotate(.16);
      ctx.globalCompositeOperation='screen';ctx.globalAlpha*=amount;
      const reach=(kind==='flower'?15:kind==='wing'?30:kind==='leaf'?17:25)*(.7+.3*amount);
      const side=80*reach/29,sourceX=point.gold?0:80;
      ctx.drawImage(opticalCache.canvas,sourceX*2,0,160,160,-side/2,-side/2,side,side);
      ctx.fillStyle='#fffdf7';ctx.beginPath();ctx.arc(0,0,enhanced?.95+amount*.45:.72+amount*.35,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
  }
  function drawMotionRibbon(ctx,f,t){
    const points=motionRibbon(f,t);if(points.length<2)return;
    const unit=1/(VIEW.scale*PLACEMENT.scale),color=points[0].gold?'255,231,184':'218,232,255';
    ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i];
      for(const [width,alpha] of [[2.2,.045],[.55,.46]]){
        ctx.globalAlpha=b.alpha*alpha*flightDepth(f,t).alpha;ctx.strokeStyle=`rgb(${color})`;ctx.lineWidth=width*unit;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
    }
    ctx.restore();
  }
  function paintFlow(ctx,f,t,r,outline=false){
    const flow=flowingLight(f,t);flow.alpha*=movingLightGain(f,t,'symbol');if(flow.alpha<=.001)return;
    const paths=fallingSurfacePaths.get(f),tail=.24;
    const travel=Math.max(...paths.map(path=>path.points.at(-1).distance))+tail;
    const head=(flow.position+1.7)/3.4*travel,stroke=Math.max(.7,r*.16);
    ctx.save();if(!outline)ctx.clip();
    // 银叶按主脉分流；月牙与星形按轮廓切线前进，空心款的亮纹始终落在描边里。
    const width=outline?stroke*.85:r*.16,silver=f.metal==='silver';
    strokeField(ctx,paths,head,flow.alpha,outline?r-stroke*.5:r,f.kind==='leaf'?'leaf':'flower',tail,
      [[width,silver?'#dceaff':'#ffd45c',.7],[width*.45,silver?'#ffffff':'#fff4c4',1]]);
    ctx.restore();
  }
  function drawFallingSymbol(ctx,f,t){
    const r=f.size*.55,outline=f.symbolStyle.endsWith('outline'),silver=f.metal==='silver';
    ctx.save();if(f.symbolStyle==='cross-diagonal')ctx.rotate(Math.PI/4);
    const fill=ctx.createLinearGradient(-r,r,r,-r);
    fill.addColorStop(0,silver?'#7f8c9e':'#af7929');
    fill.addColorStop(.45,silver?'#d4d8d2':'#f4bd46');
    fill.addColorStop(.72,silver?'#fff8e6':'#ffe5a0');
    fill.addColorStop(1,silver?'#acb6bd':'#dca847');
    ctx.fillStyle=fill;ctx.strokeStyle=fill;ctx.lineWidth=Math.max(.7,r*.16);ctx.lineJoin='round';
    // 描边向两侧扩张，略缩空心轮廓以保持与实心款相近的外尺寸。
    symbolPath(ctx,f,outline?r-ctx.lineWidth*.5:r);
    if(outline)ctx.stroke();else ctx.fill();
    if(f.kind==='leaf'){
      ctx.strokeStyle=silver?'#8295ad':'#997333';ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(0,r*1.15);
      ctx.quadraticCurveTo(r*.12,0,0,-r*.85);ctx.stroke();
      symbolPath(ctx,f,r);
    }
    if(glitter?.available){
      const slot=fallingGlitter.get(f).symbol;glitter.paint(ctx,slot);drawOpticalGlints(ctx,slot,'symbol');
    }
    else paintFlow(ctx,f,t,r,outline);
    ctx.restore();
  }
  function drawGroundContact(ctx,f,t){
    const amount=smooth((t-f.contactAt+.13)/.13)*(1-smooth((t-f.bounceAt)/.28));
    if(amount<=0)return;
    ctx.save();ctx.translate(f.end.x,(GROUND_Y-PLACEMENT.y)/PLACEMENT.scale+PLACEMENT.rootY);ctx.scale(1,.19);
    ctx.globalAlpha*=amount*.28;const radius=f.wingSize*.6;
    const contact=ctx.createRadialGradient(0,0,0,0,0,radius);
    contact.addColorStop(0,f.metal==='silver'?'#e8edf2':'#f7df9e');
    contact.addColorStop(1,f.metal==='silver'?'rgba(232,237,242,0)':'rgba(247,223,158,0)');
    ctx.fillStyle=contact;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawFlyingFlower(f,t,skyTime=t){
    const pose=flowerPose(f,t);if(pose.opacity<=0)return;
    const appearance=fallingAppearance(f,t),depth=flightDepth(f,t),ctx=p.drawingContext;
    drawGroundContact(ctx,f,t);
    ctx.save();ctx.translate(pose.x,pose.y);ctx.rotate(pose.angle);ctx.scale(pose.scale*depth.scale,pose.scale*depth.scale);
    if(pose.morph<1){
      ctx.save();ctx.globalAlpha=pose.opacity*(1-pose.morph);
      ctx.scale(appearance.size,appearance.size);drawFallingSymbol(ctx,f,t);
      ctx.restore();
    }
    if(pose.morph>0&&pose.star<1){
      ctx.globalAlpha=pose.opacity*pose.morph*(1-pose.star)*depth.alpha;drawButterfly(ctx,f,t);
    }
    if(pose.star>0){
      const star=starAppearance(f,skyTime),compensation=1/(VIEW.scale*PLACEMENT.scale*pose.scale);
      // 星芒独立于暗星底色，形成清楚的金白光芒，随后平滑收回。
      ctx.globalAlpha=pose.opacity*pose.star;
      drawGlint(ctx,0,0,star.twinkle,pose.scale);
      ctx.save();ctx.scale(compensation,compensation);ctx.globalAlpha=pose.opacity*pose.star*star.alpha;
      ctx.fillStyle=f.starRank%3===0?'#fff0d1':'#eef3ff';
      ctx.beginPath();ctx.ellipse(0,0,star.radius,star.radius,0,0,Math.PI*2);ctx.fill();
      if(star.bright){
        ctx.globalAlpha*=.35;ctx.strokeStyle='#fff7df';ctx.lineWidth=.55;ctx.beginPath();
        ctx.moveTo(-star.radius*2.5,0);ctx.lineTo(star.radius*2.5,0);
        ctx.moveTo(0,-star.radius*2.5);ctx.lineTo(0,star.radius*2.5);ctx.stroke();
      }
      ctx.restore();
    }
    if(!glitter?.available){
      const wing=butterflyWing(f,t,1),n=f.wingSize*.64;ctx.globalAlpha=pose.opacity*depth.alpha;
      drawGlint(ctx,mix(f.size*.12*appearance.size,n*.65*wing.width,pose.morph)*(1-pose.star),
        mix(-f.size*.16*appearance.size,n*(-.46+.65*wing.lift),pose.morph)*(1-pose.star),
        appearance.glint*mix(1,.4+.5*wing.sheen,pose.morph)*(1-pose.star)*
        mix(movingLightGain(f,t,'symbol'),movingLightGain(f,t,'wing'),pose.morph),pose.scale,mix(1,.65,pose.morph));
    }
    ctx.restore();
  }
  function buildGlitter(){
    if(!globalThis.NightGlitter)return;
    const surfaces=[];
    const add=(bounds,gold,grain,curvature,mask,focus)=>{
      const slot=surfaces.length;surfaces.push({bounds,gold,grain,curvature,mask,focus,seed:slot*1.731+3.17});return slot;
    };
    for(const light of canopyGlitter){
      light.slot=add([-34,-34,68,68],1,12,.42,ctx=>{
        for(let i=0;i<4;i++){
          const open=smooth((light.item.maxOpen-.22-i*.018)/(.78-i*.018));
          ctx.save();ctx.rotate(i*Math.PI/2);ctx.beginPath();petalOutline(ctx,mix(6,23,open),mix(1,8,open));ctx.fill();ctx.restore();
        }
        ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.ellipse(0,0,2.6,2.4,0,0,Math.PI*2);ctx.fill();
      },[15,0]);
    }
    for(const light of leafGlitter){
      const l=light.item,n=l.size,half=n*((MAPLE?.6:l.breadth)+Math.abs(l.bend))+.15*n;
      light.slot=add([-n*.15,-half,n*1.3,half*2],leafIsGold(l)?1:0,13,.36,ctx=>{
        ctx.beginPath();leafOutline(ctx,l);ctx.fill();
      },[n*.62,l.bend*n*.55]);
    }
    for(const f of fallingFlowers){
      const r=f.size*.55,n=f.wingSize*.64,outline=f.symbolStyle.endsWith('outline');
      const symbol=add([-r*2.1,-r*2.1,r*4.2,r*4.2],f.metal==='silver'?0:1,15,.3,ctx=>{
        ctx.lineWidth=Math.max(.7,r*.16);ctx.lineJoin='round';
        symbolPath(ctx,f,outline?r-ctx.lineWidth*.5:r);if(outline)ctx.stroke();else ctx.fill();
      });
      const wings=[];
      for(const side of [-1,1])for(const hind of [true,false])
        wings.push(add([-n*.25,-n*1.2,n*1.5,n*2.2],f.color%2===0?1:0,14,.55,ctx=>{wingPath(ctx,n,hind);ctx.fill();},[n*.62,n*(hind?.4:-.55)]));
      fallingGlitter.set(f,{symbol,wings});
    }
    glitter=globalThis.NightGlitter.create(surfaces);
  }
  function prepareGlitter(t){
    if(!glitter?.available)return;
    const jobs=[],gain=reduced.matches?0:1-smooth((t-DURATION+.8)/.8);
    for(const light of canopyGlitter){
      const f=light.item,open=smooth((t-flowerClocks.get(f).end)/.25);
      light.active=SHOW_CANOPY_FLOWERS&&open*gain>.001&&flowerAttached(f,t);if(!light.active)continue;
      jobs.push({slot:light.slot,gain:open*gain,tiltX:treeShake(t)*2,tiltY:0,angle:f.rotation+f.variant*.29});
    }
    for(const light of leafGlitter){
      const leaf=light.item,open=smooth((leafProgress(leaf,t)-.92)/.08);
      light.active=open*gain>.001;if(!light.active)continue;
      jobs.push({slot:light.slot,gain:open*gain,tiltX:leaf.bend*.3+treeShake(t)*2,
        tiltY:(1-leaf.foreshorten)*.35,angle:leaf.angle});
    }
    for(const f of fallingFlowers){
      if(t<f.release||gain<=.001)continue;
      const pose=flowerPose(f,t);if(pose.opacity<=.001||pose.star>=.999)continue;
      const slots=fallingGlitter.get(f);
      const symbolGain=gain*movingLightGain(f,t,'symbol'),wingGain=gain*movingLightGain(f,t,'wing');
      if(pose.morph<.999&&symbolGain>.001)jobs.push({slot:slots.symbol,gain:symbolGain,tiltX:Math.sin(pose.angle)*.24,
        tiltY:Math.cos(pose.angle)*.15,angle:pose.angle+(f.symbolStyle==='cross-diagonal'?Math.PI/4:0)});
      if(pose.morph>.001&&wingGain>.001)for(const side of [-1,1]){
        const wing=butterflyWing(f,t,side),tiltX=side*Math.sqrt(Math.max(0,1-wing.width**2))*.72;
        for(let hind=0;hind<2;hind++)jobs.push({slot:slots.wings[(side===1?2:0)+hind],gain:wingGain,
          tiltX,tiltY:wing.lift,angle:pose.angle+(side===1?0:Math.PI)});
      }
    }
    glitter.render(t,jobs);
  }
  function drawGlitterFlower(light,t=0){
    if(!SHOW_CANOPY_FLOWERS||!light.active)return;
    const ctx=p.drawingContext;ctx.save();
    // 发光来源已裁在真实花瓣内；仅光芒能伸出，仍受同层和前层物体遮挡。
    for(const other of light.occluders)if(flowerAttached(other,t))for(let part=0;part<=4;part++){
      ctx.beginPath();ctx.rect(light.item.x-100,light.item.y-100,200,200);
      surfaceOutline(ctx,other,'flower',part);ctx.clip('evenodd');
    }
    placeSurface(ctx,light.item,'flower');glitter.paint(ctx,light.slot);drawOpticalGlints(ctx,light.slot,'flower');ctx.restore();
  }
  function drawGlitterLeaf(light,t){
    if(!light.active)return;
    const ctx=p.drawingContext;ctx.save();
    for(const other of light.occluders){
      const amount=smooth(leafProgress(other,t));if(amount<=0)continue;
      ctx.beginPath();ctx.rect(light.item.x-100,light.item.y-100,200,200);
      surfaceOutline(ctx,other,'leaf',-1,amount);ctx.clip('evenodd');
    }
    placeSurface(ctx,light.item,'leaf',smooth(leafProgress(light.item,t)));
    glitter.paint(ctx,light.slot);drawOpticalGlints(ctx,light.slot,'leaf');ctx.restore();
  }
  function buildCanopy(){
    canopy=Array.from({length:5},(_,layer)=>{
      const band={layer,leaves:visibleLeaves.filter(l=>l.layer===layer).sort((a,b)=>a.z-b.z),flowers:canopyFlowers.filter(f=>f.layer===layer).sort((a,b)=>a.z-b.z)};
      for(const kind of ['leaf','flower']){
        const objects=kind==='leaf'?band.leaves:band.flowers;
        band[kind+'Lights']=surfaceLights.filter(light=>light.kind===kind&&light.item.layer===layer);
        for(const light of band[kind+'Lights']){
          const index=objects.indexOf(light.item),radius=kind==='leaf'?1:.5;
          light.occluders=objects.slice(index+1).filter(other=>
            Math.hypot(other.x-light.item.x,other.y-light.item.y)<(other.size+light.item.size)*radius);
        }
      }
      band.glitterFlowers=canopyGlitter.filter(light=>light.item.layer===layer);
      for(const light of band.glitterFlowers){
        const index=band.flowers.indexOf(light.item);
        light.occluders=band.flowers.slice(index+1).filter(other=>Math.hypot(other.x-light.item.x,other.y-light.item.y)<(other.size+light.item.size)*.7+12);
      }
      band.glitterLeaves=leafGlitter.filter(light=>light.item.layer===layer);
      for(const light of band.glitterLeaves){
        const index=band.leaves.indexOf(light.item);
        light.occluders=band.leaves.slice(index+1).filter(other=>Math.hypot(other.x-light.item.x,other.y-light.item.y)<other.size+light.item.size+20);
      }
      const shapes=[...band.leaves,...band.flowers];
      band.x=Math.floor(Math.min(...shapes.map(l=>l.x-l.size-3)));
      band.y=Math.floor(Math.min(...shapes.map(l=>l.y-l.size-3)));
      const width=Math.ceil(Math.max(...shapes.map(l=>l.x+l.size+3))-band.x);
      const height=Math.ceil(Math.max(...shapes.map(l=>l.y+l.size+3))-band.y);
      band.cache=p.createGraphics(width,height);band.cache.pixelDensity(density);
      band.flowerCache=p.createGraphics(width,height);band.flowerCache.pixelDensity(density);
      const ctx=band.cache.drawingContext;ctx.save();ctx.translate(-band.x,-band.y);
      for(const leaf of band.leaves)drawLeaf(leaf,LEAF_END,band.cache);ctx.restore();
      const fctx=band.flowerCache.drawingContext;fctx.save();fctx.translate(-band.x,-band.y);
      for(const f of band.flowers)drawFlower(fctx,f,BLOOM_END);fctx.restore();
      band.releases=band.flowers.filter(f=>flowerRelease.has(f));band.dropped=0;
      // 网格只索引原花层，不新增画布；边界与实际画布像素对齐。
      const tileSize=48,columns=Math.ceil(width/tileSize),rows=Math.ceil(height/tileSize);
      band.flowerTiles=Array.from({length:columns*rows},(_,i)=>({
        x:band.x+i%columns*tileSize,y:band.y+Math.floor(i/columns)*tileSize,
        width:Math.min(tileSize,width-i%columns*tileSize),
        height:Math.min(tileSize,height-Math.floor(i/columns)*tileSize),flowers:[]}));
      const tilesFor=f=>{
        // 大于花瓣最远端，并留出抗锯齿余量，旋转后也不漏掉边缘。
        const radius=f.size+3,tiles=[];
        const x0=Math.max(0,Math.floor((f.x-radius-band.x)/tileSize));
        const x1=Math.min(columns-1,Math.floor((f.x+radius-band.x)/tileSize));
        const y0=Math.max(0,Math.floor((f.y-radius-band.y)/tileSize));
        const y1=Math.min(rows-1,Math.floor((f.y+radius-band.y)/tileSize));
        for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)tiles.push(band.flowerTiles[y*columns+x]);
        return tiles;
      };
      for(const f of band.flowers)for(const tile of tilesFor(f))tile.flowers.push(f);
      band.flowerBounds={x:band.x,y:band.y,width,height,flowers:band.flowers};
      band.releaseTiles=band.releases.map(tilesFor);band.attached=band.releases.map(()=>true);
      return band;
    });
  }
  function render(t,skyTime=t,part){
    const show=id=>!part||part===id;
    if(show('sky'))p.image(background,0,0);
    const ctx=p.drawingContext;ctx.save();ctx.scale(VIEW.scale,VIEW.scale);if(show('sky'))drawMoon(t);
    ctx.save();ctx.translate(PLACEMENT.x,PLACEMENT.y);
    ctx.scale(PLACEMENT.scale,PLACEMENT.scale);ctx.translate(-PLACEMENT.rootX,-PLACEMENT.rootY);
    ctx.save();ctx.translate(PLACEMENT.rootX,PLACEMENT.rootY);const bend=treeShake(t);ctx.transform(1,0,bend,1-bend*.55,0,0);ctx.translate(-PLACEMENT.rootX,-PLACEMENT.rootY);
    if(show('tree')){drawGrowingTree(ctx,t);
    for(const band of canopy){
      ctx.globalAlpha=treeAttention(t);
      if(t>=LEAF_END)p.image(band.cache,band.x,band.y);
      else for(const leaf of band.leaves)drawLeaf(leaf,t);
      if(glitter?.available)for(const light of band.glitterLeaves)drawGlitterLeaf(light,t);
      else for(const light of band.leafLights)drawSurfaceLight(light,t);
      if(!SHOW_CANOPY_FLOWERS)continue;
      // 花簇只按前后层次轻微柔化，亮度不随时间变化，不随离枝数量变暗。
      ctx.save();ctx.globalAlpha=mix(.94,1,band.layer/4);
      if(t>=BLOOM_END){
        const dirty=new Set();
        for(let i=0;i<band.releases.length;i++){
          const attached=flowerAttached(band.releases[i],t);
          if(attached===band.attached[i])continue;
          band.attached[i]=attached;
          for(const tile of band.releaseTiles[i])dirty.add(tile);
        }
        if(dirty.size){
          const fctx=band.flowerCache.drawingContext;fctx.save();fctx.translate(-band.x,-band.y);
          // 大幅拖动时直接重建一次，避免跨越很多离枝事件后重复绘制相邻格子。
          const work=Array.from(dirty).reduce((sum,tile)=>sum+tile.flowers.length,0);
          const areas=work>band.flowers.length?[band.flowerBounds]:dirty;
          for(const tile of areas){
            // 原地局部清除并按原顺序重画相交花瓣，离枝和回拖都不会擦穿邻花。
            fctx.save();fctx.beginPath();fctx.rect(tile.x,tile.y,tile.width,tile.height);fctx.clip();
            fctx.clearRect(tile.x,tile.y,tile.width,tile.height);
            for(const f of tile.flowers)drawFlower(fctx,f,t);
            fctx.restore();
          }
          fctx.restore();band.dropped=band.attached.filter(attached=>!attached).length;
        }
        p.image(band.flowerCache,band.x,band.y);
      }
      else for(const f of band.flowers)drawFlower(ctx,f,t,true);
      if(glitter?.available)for(const light of band.glitterFlowers)drawGlitterFlower(light,t);
      else for(const light of band.flowerLights)drawSurfaceLight(light,t);
      ctx.restore();
    }
    }ctx.restore(); // 落花离枝后使用自身轨迹，不再跟随树的余震。
    if(show('flowers')){for(const f of fallingFlowers)if(t>=f.release)drawMotionRibbon(ctx,f,t);
    for(const f of fallingFlowers)if(t>=f.release)drawFlyingFlower(f,t,skyTime);}
    ctx.restore();ctx.restore();
  }

 if(opt.mode==='full'){
   background=p.createGraphics(W,H);background.pixelDensity(density);buildBackground();buildMoon();
 }
 if(opt.mode==='full'||opt.mode==='tree'){
   treeCache=p.createGraphics(W,H);treeCache.pixelDensity(density);buildFlowerAtlas();buildCanopy();
 }
 if(opt.mode!=='tree'){
   if(opt.mode!=='symbol')buildWingAtlas();
   buildOpticalCache();buildGlitter();
 }
 return {prepare(t,mode){if(mode==='full')prepareGlitter(t);},draw(t,mode,part){
  if(mode==='full'){render(t,t,part==='art'?null:part);return;}
  const c=S.ctx;
  if(mode==='tree'){c.save();c.scale(VIEW.scale,VIEW.scale);c.translate(PLACEMENT.x,PLACEMENT.y);c.scale(PLACEMENT.scale,PLACEMENT.scale);c.translate(-PLACEMENT.rootX,-PLACEMENT.rootY);drawGrowingTree(c,t);for(const band of canopy){for(const leaf of band.leaves)drawLeaf(leaf,t);if(SHOW_CANOPY_FLOWERS)for(const f of band.flowers)drawFlower(c,f,t,true);}c.restore();return;}
  if(mode==='journey'){c.save();c.scale(VIEW.scale,VIEW.scale);c.translate(PLACEMENT.x,PLACEMENT.y);c.scale(PLACEMENT.scale,PLACEMENT.scale);c.translate(-PLACEMENT.rootX,-PLACEMENT.rootY);for(const f of fallingFlowers)if(t>=f.release)drawFlyingFlower(f,t,t);c.restore();return;}
  c.save();c.translate(W/2,H/2);c.scale(5,5);
  if(mode==='butterfly')drawButterfly(c,fallingFlowers.find(f=>(f.color%2===1)===Boolean(opt.silver)),t);
  if(mode==='symbol')drawFallingSymbol(c,fallingFlowers.find(f=>(f.metal==='silver')===Boolean(opt.silver)&&(!opt.symbolStyle||f.symbolStyle===opt.symbolStyle)),t);
  c.restore();
 },inspect:t=>({moon:moonProgress(t),travelers:fallingFlowers.map(f=>flowerPose(f,t))}),destroy(){glitter?.destroy?.();}};

}
};
})(globalThis);

/* SCENE ENTRIES */
WiseSceneRuntime.register("osmanthus-tree-illustration",{"family": "osmanthus", "mode": "tree", "start": 0, "width": 720, "height": 960, "look": "gold-leaves", "variants": {"gold-leaves": {"family": "osmanthus", "mode": "tree", "start": 0, "width": 720, "height": 960, "look": "gold-leaves"}, "flowers": {"family": "osmanthus", "mode": "tree", "start": 0, "width": 720, "height": 960, "look": "flowers"}, "maple-blend": {"family": "osmanthus", "mode": "tree", "start": 0, "width": 720, "height": 960, "look": "maple-blend"}}});
WiseSceneRuntime.register("osmanthus-butterfly-illustration",{"family": "osmanthus", "mode": "butterfly", "start": 0, "width": 720, "height": 960, "look": "gold-leaves", "silver": false, "variants": {"gold": {"family": "osmanthus", "mode": "butterfly", "start": 0, "width": 720, "height": 960, "look": "gold-leaves", "silver": false}, "silver": {"family": "osmanthus", "mode": "butterfly", "start": 0, "width": 720, "height": 960, "look": "gold-leaves", "silver": true}}});
WiseSceneRuntime.register("osmanthus-symbol-illustration",{"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": false, "symbolStyle": "crescent-solid", "variants": {"gold-crescent-solid": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": false, "symbolStyle": "crescent-solid"}, "silver-crescent-solid": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": true, "symbolStyle": "crescent-solid"}, "gold-crescent-outline": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": false, "symbolStyle": "crescent-outline"}, "silver-crescent-outline": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": true, "symbolStyle": "crescent-outline"}, "gold-slim-solid": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": false, "symbolStyle": "slim-solid"}, "silver-slim-solid": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": true, "symbolStyle": "slim-solid"}, "gold-slim-outline": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": false, "symbolStyle": "slim-outline"}, "silver-slim-outline": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": true, "symbolStyle": "slim-outline"}, "gold-five-solid": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": false, "symbolStyle": "five-solid"}, "silver-five-solid": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": true, "symbolStyle": "five-solid"}, "gold-five-outline": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": false, "symbolStyle": "five-outline"}, "silver-five-outline": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": true, "symbolStyle": "five-outline"}, "gold-four-solid": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": false, "symbolStyle": "four-solid"}, "silver-four-solid": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": true, "symbolStyle": "four-solid"}, "gold-four-outline": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": false, "symbolStyle": "four-outline"}, "silver-four-outline": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": true, "symbolStyle": "four-outline"}, "gold-cross": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": false, "symbolStyle": "cross"}, "silver-cross": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": true, "symbolStyle": "cross"}, "gold-cross-diagonal": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": false, "symbolStyle": "cross-diagonal"}, "silver-cross-diagonal": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": true, "symbolStyle": "cross-diagonal"}, "gold-leaf-solid": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": false, "symbolStyle": "leaf-solid"}, "silver-leaf-solid": {"family": "osmanthus", "mode": "symbol", "start": 0, "width": 720, "height": 960, "silver": true, "symbolStyle": "leaf-solid"}}});
WiseSceneRuntime.register("osmanthus-leaf-illustration",{"family": "osmanthus", "mode": "leaf", "start": 0, "width": 720, "height": 960});
WiseSceneRuntime.register("osmanthus-flower-illustration",{"family": "osmanthus", "mode": "flower", "start": 0, "width": 720, "height": 960});
WiseSceneRuntime.register("osmanthus-butterfly-journey",{"family": "osmanthus", "mode": "full", "start": 0, "width": 720, "height": 960, "look": "gold-leaves", "breakdown": [{"id": "sky", "name": "夜空与月亮", "start": 0, "end": 24000, "time": "0—24秒", "detail": "夜空底色与月亮使用完整固定纹理和位置。", "actions": ["moon-event-fill", "osmanthus-moon-illustration"]}, {"id": "tree", "name": "桂树、树冠与花簇", "start": 0, "end": 24000, "time": "0—24秒", "detail": "枝干、叶片和花簇逐步展开，保留树的轻微摇摆、金属反光和前后遮挡。", "actions": ["osmanthus-tree-illustration", "osmanthus-leaf-illustration", "osmanthus-flower-illustration"]}, {"id": "flowers", "name": "离枝、碰撞、化蝶与飞行", "start": 0, "end": 24000, "time": "0—24秒", "detail": "落花或符号离枝后按自身路线下落、接触、回弹并化蝶；微片反光随翅膀姿态改变。", "actions": ["shape-contact-rebound", "swarm-arc-flight", "osmanthus-butterfly-illustration", "osmanthus-symbol-illustration"]}], "layers": ["sky", "tree", "flowers"], "variants": {"gold-leaves": {"family": "osmanthus", "mode": "full", "start": 0, "width": 720, "height": 960, "look": "gold-leaves", "breakdown": [{"id": "sky", "name": "夜空与月亮", "start": 0, "end": 24000, "time": "0—24秒", "detail": "夜空底色与月亮使用完整固定纹理和位置。", "actions": ["moon-event-fill", "osmanthus-moon-illustration"]}, {"id": "tree", "name": "桂树、树冠与花簇", "start": 0, "end": 24000, "time": "0—24秒", "detail": "枝干、叶片和花簇逐步展开，保留树的轻微摇摆、金属反光和前后遮挡。", "actions": ["osmanthus-tree-illustration", "osmanthus-leaf-illustration", "osmanthus-flower-illustration"]}, {"id": "flowers", "name": "离枝、碰撞、化蝶与飞行", "start": 0, "end": 24000, "time": "0—24秒", "detail": "落花或符号离枝后按自身路线下落、接触、回弹并化蝶；微片反光随翅膀姿态改变。", "actions": ["shape-contact-rebound", "swarm-arc-flight", "osmanthus-butterfly-illustration", "osmanthus-symbol-illustration"]}], "layers": ["sky", "tree", "flowers"]}, "flowers": {"family": "osmanthus", "mode": "full", "start": 0, "width": 720, "height": 960, "look": "flowers", "breakdown": [{"id": "sky", "name": "夜空与月亮", "start": 0, "end": 24000, "time": "0—24秒", "detail": "夜空底色与月亮使用完整固定纹理和位置。", "actions": ["moon-event-fill", "osmanthus-moon-illustration"]}, {"id": "tree", "name": "桂树、树冠与花簇", "start": 0, "end": 24000, "time": "0—24秒", "detail": "枝干、叶片和花簇逐步展开，保留树的轻微摇摆、金属反光和前后遮挡。", "actions": ["osmanthus-tree-illustration", "osmanthus-leaf-illustration", "osmanthus-flower-illustration"]}, {"id": "flowers", "name": "离枝、碰撞、化蝶与飞行", "start": 0, "end": 24000, "time": "0—24秒", "detail": "落花或符号离枝后按自身路线下落、接触、回弹并化蝶；微片反光随翅膀姿态改变。", "actions": ["shape-contact-rebound", "swarm-arc-flight", "osmanthus-butterfly-illustration", "osmanthus-symbol-illustration"]}], "layers": ["sky", "tree", "flowers"]}, "maple-blend": {"family": "osmanthus", "mode": "full", "start": 0, "width": 720, "height": 960, "look": "maple-blend", "breakdown": [{"id": "sky", "name": "夜空与月亮", "start": 0, "end": 24000, "time": "0—24秒", "detail": "夜空底色与月亮使用完整固定纹理和位置。", "actions": ["moon-event-fill", "osmanthus-moon-illustration"]}, {"id": "tree", "name": "桂树、树冠与花簇", "start": 0, "end": 24000, "time": "0—24秒", "detail": "枝干、叶片和花簇逐步展开，保留树的轻微摇摆、金属反光和前后遮挡。", "actions": ["osmanthus-tree-illustration", "osmanthus-leaf-illustration", "osmanthus-flower-illustration"]}, {"id": "flowers", "name": "离枝、碰撞、化蝶与飞行", "start": 0, "end": 24000, "time": "0—24秒", "detail": "落花或符号离枝后按自身路线下落、接触、回弹并化蝶；微片反光随翅膀姿态改变。", "actions": ["shape-contact-rebound", "swarm-arc-flight", "osmanthus-butterfly-illustration", "osmanthus-symbol-illustration"]}], "layers": ["sky", "tree", "flowers"]}}});
