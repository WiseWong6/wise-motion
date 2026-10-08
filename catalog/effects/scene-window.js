/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 窗外实验树：原枝形、花位、花期与真实素材；仅替换原页面的播放入口。 */
(function(global){
 global.WiseSceneSources.window=function(S,opt){
 const document=S.doc,globalThis=global.WiseWindowMedia(document);
const data=global.WiseWindowTreeData;
const flowerAssets=global.WiseWindowFlowerAssets;
let flowerSheets;
let woodSheets;
let flowerFrames,windowArt;
const {branches,leaves,flowers}=data;
const W=720,H=960;
const OPENING={x:105,y:129,w:510,h:616};
const PANE_COLUMNS=3,PANE_ROWS=4,COLOR_ROWS=3;
// 小花团可像照片一样略垂过最下面一条窗棂，避免沿格线切出平整的花墙。
const FLOWER_BOTTOM=OPENING.y+OPENING.h*COLOR_ROWS/PANE_ROWS+36;

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

// 独立补花：已有枝叶、花位不动，优先使用尚未开花的真实叶腋。
const extraFlowers=(()=>{
  const target=4400,added=[],occupied=new Map(),groups=new Map();
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
  const candidates=[...leaves].sort((a,b)=>
    Number(used.has(`${a.node}:${a.side}`))-Number(used.has(`${b.node}:${b.side}`))||rank(a)-rank(b));
  for(const leaf of candidates){
    const donors=groups.get(`${leaf.layer}:${leaf.volume}`);if(!donors)continue;
    const donor=donors[rank(leaf)%donors.length],seed=rank(leaf)/4294967296;
    for(let i=0;i<8&&added.length<target;i++){
      const angle=seed*Math.PI*2+i*2.39996,r=5+Math.sqrt(i/8)*9;
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
  // 第二遍：沿枝补隙——树冠区内周围 24px 没有花的枝段采样点直接点上花，
  // 专填主枝桠之间的大片空隙（红框区域）；不占第一遍的叶腋配额。
  const hasNeighbor=(x,y,r)=>{
    const cx=Math.floor(x/3),cy=Math.floor(y/3),cells=Math.ceil(r/3);
    for(let dx=-cells;dx<=cells;dx++)for(let dy=-cells;dy<=cells;dy++)
      for(const f of occupied.get(`${cx+dx}:${cy+dy}`)||[])
        if(Math.hypot(f.x-x,f.y-y)<r)return true;
    return false;
  };
  let fillBudget=900;
  for(const [bi,b] of branches.entries()){
    if(fillBudget<=0)break;
    if(b.y>620)continue; // 树干与分叉区不补，保留主干的透气
    for(let k=2;k<10&&fillBudget>0;k++){
      const at=k/10,q=curve(b,at);
      if(q.y>600||hasNeighbor(q.x,q.y,24))continue;
      const donor=flowers[(bi*3+k)%flowers.length];
      const pseudo=(Math.imul(Math.round(q.x*7+q.y*13),2654435761)>>>0)/4294967296;
      for(let i=0;i<3&&fillBudget>0;i++){
        const ang=pseudo*6.28+i*2.4,rr=3+(i%2)*5;
        const x=q.x+Math.cos(ang)*rr,y=q.y+Math.sin(ang)*rr;
        if(!clear(x,y))continue;
        const f={...donor,x,y,anchor:{x:q.x,y:q.y},branch:bi,at,
          extra:true,sourceLeaf:-1,rotation:ang,phase:pseudo*6.28,palette:i%3};
        added.push(f);insert(f);fillBudget--;
      }
    }
  }
  return added;
})();
const baseFlowers=[...flowers,...extraFlowers];

const LEAF_START=data.leafClockStart,LEAF_END=data.leafClockEnd;
// 先记录原始花期，不改原树数据；用于保留起步动作和每朵花的展开时长。
const flowerClocks=new Map();
const leafNodes=new Map(),leafBranches=new Map(),leafGroups=new Map();
for(const l of visibleLeaves){
  leafNodes.set(`${l.node}:${l.side}`,l);
  for(const [map,key] of [[leafBranches,l.branch],[leafGroups,l.volume]]){
    if(!map.has(key))map.set(key,[]);map.get(key).push(l);
  }
}
for(const f of baseFlowers){
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
const CANOPY_FLOWER_SCALE=1.35,FLOWER_SIZE_GAIN=1.25;
const clamp=x=>Math.max(0,Math.min(1,x));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
// 恢复原实验树的窗内尺寸；这个映射不随播放进度改变。
const ROOT={x:360,y:745},SHRINK=.24,R_IN=170,R_OUT=560;
function deform(q){
  const dx=q.x-ROOT.x,dy=q.y-ROOT.y,r=Math.hypot(dx,dy);
  const s=1-SHRINK*smooth((r-R_IN)/(R_OUT-R_IN));
  return {x:ROOT.x+dx*s,y:ROOT.y+dy*s};
}
const firstFlowers=baseFlowers;
const FIRST_BUD=Math.min(...firstFlowers.map(f=>flowerClocks.get(f).budAt));
const LAST_BUD=Math.max(...firstFlowers.map(f=>flowerClocks.get(f).budAt));
const FULL_CANOPY=Math.max(...firstFlowers.map(f=>flowerClocks.get(f).end));
// 保留最初起步的先后、花苞时长及展开速度；去掉等待展叶的空段。
const SKEW=FIRST_BUD-.02;
const FLOWERS_PER_SECOND=firstFlowers.length/(LAST_BUD-FIRST_BUD);
function hashFlower(f){
  let n=(Math.round(f.x*997+f.y*7919)+f.branch*104729)>>>0;
  n=Math.imul(n^(n>>>16),0x45d9f3b);
  return (n^(n>>>16))>>>0;
}
// 后续仍是与首轮相同的花簇：保留簇内花位、花形和各朵的展开时长。
// 只为新花簇选一次固定落点，不把同一朵花沿着一条线反复复制。
const laterFlowers=(()=>{
  const groups=new Map();
  for(const f of firstFlowers){
    const key=`${f.branch}:${f.node}:${f.side}`;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(f);
  }
  const unit=(seed,salt)=>{
    let n=Math.imul(seed^salt,0x45d9f3b);
    n=Math.imul(n^(n>>>16),0x45d9f3b);
    return ((n^(n>>>16))>>>0)/4294967296;
  };
  const candidates=[];
  for(const group of groups.values()){
    const positions=group.map(deform),n=group.length;
    const origin={x:positions.reduce((v,p)=>v+p.x,0)/n,y:positions.reduce((v,p)=>v+p.y,0)/n};
    const target={x:group.reduce((v,f)=>v+f.x,0)/n,y:group.reduce((v,f)=>v+f.y,0)/n};
    const distance=Math.hypot(target.x-origin.x,target.y-origin.y);
    if(distance<12)continue;
    const seed=hashFlower(group[0]);
    for(let copy=0;copy<2;copy++){
      // 各簇在二维空间错落分布，不能排成等距射线。
      const u=unit(seed,copy*11+1),v=unit(seed,copy*11+2);
      const at=.15+.85*u,angle=unit(seed,copy*11+3)*Math.PI*2;
      const spread=8+12*v;
      const center={x:mix(origin.x,target.x,at)+Math.cos(angle)*spread,
        y:mix(origin.y,target.y,at)+Math.sin(angle)*spread};
      if(center.x<OPENING.x-28||center.x>OPENING.x+OPENING.w+28||
        center.y<OPENING.y-28||center.y>660)continue;
      const turn=(unit(seed,copy*11+4)-.5)*.8,cos=Math.cos(turn),sin=Math.sin(turn);
      const cluster=group.map((source,i)=>{
        const dx=positions[i].x-origin.x,dy=positions[i].y-origin.y;
        return {...source,x:center.x+dx*cos-dy*sin,y:center.y+dx*sin+dy*cos,
          rotation:source.rotation+turn,continuation:true,source,cluster:center};
      });
      candidates.push({center,flowers:cluster,rank:unit(seed,copy*11+5)});
    }
  }
  // 新簇只能接在已有花丛附近，同时留出间距，避免堆成线或厚墙。
  const cells=new Map(),cellSize=20;
  const insert=p=>{const k=`${Math.floor(p.x/cellSize)}:${Math.floor(p.y/cellSize)}`;
    if(!cells.has(k))cells.set(k,[]);cells.get(k).push(p);};
  const nearest=p=>{
    const x=Math.floor(p.x/cellSize),y=Math.floor(p.y/cellSize);let best=Infinity;
    for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)
      for(const q of cells.get(`${x+dx}:${y+dy}`)||[])best=Math.min(best,Math.hypot(q.x-p.x,q.y-p.y));
    return best;
  };
  for(const f of firstFlowers)insert(deform(f));
  let pending=candidates.sort((a,b)=>a.rank-b.rank),added=[],cursor=LAST_BUD;
  const within=f=>{
    const reach=f.size*1.2*CANOPY_FLOWER_SCALE*FLOWER_SIZE_GAIN/2;
    return f.x-reach>=OPENING.x&&f.x+reach<=OPENING.x+OPENING.w&&
      f.y-reach>=OPENING.y&&f.y+reach<=OPENING.y+OPENING.h;
  };
  // 逐簇续开，顺序由各簇自身决定；不设同步向外推进的圆环。
  while(pending.length){
    const deferred=[];let accepted=0;
    for(const candidate of pending){
      const gap=nearest(candidate.center);
      if(gap<2.5)continue;
      if(gap>24||(cursor<FULL_CANOPY&&!candidate.flowers.every(within))){deferred.push(candidate);continue;}
      const clusterStart=cursor+candidate.flowers.length/FLOWERS_PER_SECOND;
      const originalStart=Math.min(...candidate.flowers.map(f=>flowerClocks.get(f.source).budAt));
      for(const f of candidate.flowers){
        const original=flowerClocks.get(f.source),budAt=clusterStart+original.budAt-originalStart;
        const start=budAt+original.start-original.budAt;
        flowerClocks.set(f,{budAt,start,end:start+f.duration});
        added.push(f);insert(f);
      }
      cursor=clusterStart;accepted++;
    }
    if(!accepted)break;
    pending=deferred;
  }
  return added;
})();
const canopyFlowers=[...firstFlowers,...laterFlowers];
// 以参考照片窗框（左35、上420、宽890、高1130）为坐标基准描出花团。
// 每团单独控制轮廓、密度和花朵大小，留出照片中的枝条通道；顶部按用户纠正为青色。
const REFERENCE_BLOOMS=[
  {style:3,keep:.78,size:.7,points:[[240,500],[275,425],[355,365],[445,350],[485,385],[565,345],[645,385],[765,390],[815,475],[775,550],[660,575],[610,535],[490,575],[390,540],[335,595],[260,580]]},
  {style:0,keep:.7,size:.78,points:[[65,640],[90,565],[170,535],[225,550],[270,575],[315,570],[350,635],[310,700],[235,710],[175,745],[90,735]]},
  {style:4,keep:.76,size:.74,points:[[690,575],[740,525],[810,535],[875,555],[925,625],[915,710],[840,750],[760,735],[695,690],[710,630]]},
  {style:1,keep:.9,size:.72,points:[[320,645],[345,575],[430,535],[510,530],[565,560],[590,630],[560,690],[500,715],[470,770],[395,745],[335,710]]},
  {style:2,keep:.8,size:.92,points:[[40,850],[85,795],[165,770],[245,805],[300,800],[340,860],[315,925],[350,995],[310,1075],[240,1100],[200,1070],[130,1095],[70,1040],[90,970],[45,920]]},
  {style:1,keep:.94,size:.88,points:[[385,795],[455,780],[530,795],[585,835],[620,895],[570,935],[610,1005],[590,1080],[535,1135],[470,1160],[410,1120],[355,1090],[360,1020],[335,965],[395,930],[365,865]]},
  {style:5,keep:.48,size:.81,points:[[665,800],[725,775],[775,820],[840,805],[900,845],[925,915],[875,975],[905,1035],[840,1080],[760,1050],[705,1010],[670,930],[630,880]]},
  {style:2,keep:.83,size:.78,points:[[165,1210],[205,1170],[265,1150],[315,1190],[345,1250],[290,1280],[225,1265],[175,1270]]},
  {style:0,keep:.43,size:.65,points:[[75,1135],[120,1105],[175,1135],[195,1190],[150,1220],[85,1195]]},
  {style:0,keep:.42,size:.65,points:[[345,1210],[395,1185],[430,1235],[440,1290],[395,1305],[350,1270]]},
  {style:5,keep:.4,size:.72,points:[[800,1070],[850,1040],[905,1075],[925,1140],[890,1200],[825,1170],[785,1120]]}
].map((region,index)=>({...region,index,padding:[12,16,18,20,14,18,18,8,5,7,8][index],
  weight:[19,10,10,14,13,18,9,3,1,1.5,1.5][index],points:region.points.map(([x,y])=>({
  x:OPENING.x+(x-35)*OPENING.w/890,y:OPENING.y+(y-420)*OPENING.h/1130
}))}));
function outlineDistance(q,points){
  let inside=false,distance=Infinity;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[j],b=points[i],dx=b.x-a.x,dy=b.y-a.y;
    const at=clamp(((q.x-a.x)*dx+(q.y-a.y)*dy)/(dx*dx+dy*dy));
    distance=Math.min(distance,Math.hypot(q.x-a.x-dx*at,q.y-a.y-dy*at));
    if((a.y>q.y)!==(b.y>q.y)&&q.x<(b.x-a.x)*(q.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside?distance:-distance;
}
const clusterLooks=new WeakMap();
const arrangedPositions=new WeakMap(),openingFlowers=new WeakSet();
function unit(seed,salt=0){
  let n=Math.imul(seed^salt,0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);
  return ((n^(n>>>16))>>>0)/4294967296;
}
function grain(x,y,seed){
  const ix=Math.floor(x),iy=Math.floor(y),u=smooth(x-ix),v=smooth(y-iy);
  const at=(dx,dy)=>unit(Math.imul(ix+dx,73856093)^Math.imul(iy+dy,19349663),seed);
  return mix(mix(at(0,0),at(1,0),u),mix(at(0,1),at(1,1),u),v);
}
function clusterLook(center,seed){
  const ranks=REFERENCE_BLOOMS.map(region=>({region,d:outlineDistance(center,region.points)})).sort((a,b)=>b.d-a.d);
  const chosen=ranks[0],edge=smooth((chosen.d+10)/23);
  return {style:chosen.region.style,region:chosen.region.index,keep:chosen.region.keep*edge,
    size:chosen.region.size,outline:chosen.d};
}
// 花团必须真正长在参考位置。旧版只给旧花位套轮廓，下方独立花团会完全缺失。
// 保留起步花位；其余整簇在初始化时排到参考花团中，播放时绝不移动花心。
const displayedFlowers=(()=>{
  const groups=new Map(),selected=new Set(),continued=new Map();
  for(const f of firstFlowers){
    const key=`${f.branch}:${f.node}:${f.side}`;
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(f);
  }
  for(const f of laterFlowers){
    if(!continued.has(f.cluster))continued.set(f.cluster,[]);continued.get(f.cluster).push(f);
  }
  // 沿已确认花团的边缘补花，收紧团间空白；主色重心、顶部高度及底部留白不变。
  const regions=REFERENCE_BLOOMS.map(region=>({...region,
    left:Math.max(OPENING.x+2,Math.min(...region.points.map(q=>q.x))-region.padding),
    right:Math.min(OPENING.x+OPENING.w-2,Math.max(...region.points.map(q=>q.x))+region.padding),
    top:region.index===0||region.index===3?Math.min(...region.points.map(q=>q.y)):
      Math.max(OPENING.y,Math.min(...region.points.map(q=>q.y))-region.padding),
    bottom:Math.min(FLOWER_BOTTOM-14,Math.max(...region.points.map(q=>q.y))+region.padding)}));
  const totalWeight=regions.reduce((sum,r)=>sum+r.weight,0),used=new Map();
  const free=q=>{
    const x=Math.floor(q.x/5),y=Math.floor(q.y/5);
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)
      for(const p of used.get(`${x+dx}:${y+dy}`)||[])if(Math.hypot(p.x-q.x,p.y-q.y)<3.4)return false;
    return true;
  };
  const occupy=q=>{const k=`${Math.floor(q.x/5)}:${Math.floor(q.y/5)}`;
    if(!used.has(k))used.set(k,[]);used.get(k).push(q);};
  const regionAt=seed=>{
    let pick=unit(seed,271)*totalWeight;
    for(const r of regions){pick-=r.weight;if(pick<=0)return r;}
    return regions[regions.length-1];
  };
  const choose=(group,original,continuation)=>{
    const seed=hashFlower(group[0]),positions=group.map(f=>continuation?f:deform(f));
    const start=Math.min(...group.map(f=>flowerClocks.get(f).budAt));
    const pinned=!continuation&&start<FIRST_BUD+.18;
    const offsets=positions.map(q=>({x:q.x-original.x,y:q.y-original.y}));
    const canCross=continuation&&start>=FULL_CANOPY;
    let region=regionAt(seed),center=original;
    let accepted=pinned;
    if(pinned)region=regions[clusterLook(original,seed).region];
    else for(let attempt=0;attempt<240;attempt++){
      const q={x:mix(region.left,region.right,unit(seed,attempt*7+401)),
        y:mix(region.top,region.bottom,unit(seed,attempt*7+402))};
      const d=outlineDistance(q,region.points);
      const texture=.66*grain(q.x/23,q.y/23,region.index+613)+.34*grain(q.x/7,q.y/7,region.index+947);
      // 各团内部有明暗小簇和露枝孔隙；边缘不沿多边形切成直线。
      const acceptance=smooth((d+region.padding)/(region.padding+9))*smooth((texture-.17)/.46);
      if(unit(seed,attempt*7+403)>acceptance||!free(q))continue;
      if(!canCross&&!offsets.every((o,i)=>{
        const margin=group[i].size*1.2*CANOPY_FLOWER_SCALE*FLOWER_SIZE_GAIN*region.size*.9;
        return q.x+o.x-margin>=OPENING.x&&q.x+o.x+margin<=OPENING.x+OPENING.w&&q.y+o.y-margin>=OPENING.y;
      }))continue;
      center=q;accepted=true;break;
    }
    const shadow=grain(center.x/34,center.y/34,region.index+119);
    for(let i=0;i<group.length;i++){
      const f=group[i],detail=unit(hashFlower(f),937);
      arrangedPositions.set(f,{x:center.x+offsets[i].x,y:center.y+offsets[i].y});
      if(pinned)openingFlowers.add(f);
      clusterLooks.set(f,{style:region.style,region:region.index,
        size:region.size*(.7+1.05*detail*detail)*(.84+.16*f.layer/4),
        tone:Math.min(3,Math.max(0,Math.floor(shadow*4.3-.45+detail*.42))),
        outline:outlineDistance(center,region.points)});
    }
    if(!accepted)return;
    occupy(center);
    const ranked=[...group].sort((a,b)=>hashFlower(a)-hashFlower(b));
    const keep=pinned?clusterLook(center,seed).keep:.42+region.keep*.3;
    const count=Math.floor(group.length*keep+unit(seed,1583));
    for(const f of ranked.slice(0,count))selected.add(f);
  };
  for(const group of [...groups.values()].sort((a,b)=>hashFlower(a[0])-hashFlower(b[0]))){
    const points=group.map(deform);
    choose(group,{x:points.reduce((v,q)=>v+q.x,0)/points.length,y:points.reduce((v,q)=>v+q.y,0)/points.length},false);
  }
  for(const [center,group] of continued)choose(group,center,true);
  return selected;
})();
// 按用户标注的空白补上相邻花团。椭圆小团相互搭接，边缘有缺口，
// 不把红框当矩形铺满，也不移动已经确认的主花团。
const FILL_BLOOMS=[
  {region:1,count:420,lobes:[[99,166,31,45],[88,232,36,62],[105,287,32,31]]},
  {region:0,count:230,lobes:[[172,143,39,25],[221,131,48,31]]},
  {region:0,count:760,lobes:[[323,102,59,42],[399,89,67,39],[474,106,53,43],[393,135,99,30]]},
  {region:0,count:350,lobes:[[582,138,40,43],[601,181,32,39]]},
  {region:3,count:260,lobes:[[263,300,46,32],[245,328,33,24],[299,317,28,30]]},
  {region:3,count:470,lobes:[[449,240,36,37],[449,292,44,49],[428,330,30,26]]},
  {region:4,count:620,lobes:[[87,372,43,47],[75,432,39,54],[108,482,42,35],[132,421,35,69]]},
  {region:4,count:250,lobes:[[187,517,36,22],[244,510,49,22],[298,519,36,24]]},
  {region:6,count:430,lobes:[[631,306,43,35],[644,355,43,43],[603,374,35,35]]},
  {region:10,count:650,lobes:[[632,459,54,48],[655,512,42,46],[607,539,41,28],[594,487,36,54]]},
  {region:6,count:370,lobes:[[472,463,37,49],[511,488,32,35],[447,437,26,31]]},
  // 追加标注的四处缝隙：青绿交界、左侧绿橙交界、右侧红蓝交界及右下枝弯。
  {region:0,count:200,lobes:[[155,175,33,22],[207,174,41,23]]},
  {region:1,count:180,lobes:[[151,302,30,25],[183,314,24,22]]},
  {region:6,count:270,lobes:[[523,326,43,25],[578,330,35,25]]},
  {region:6,count:420,lobes:[[438,518,39,39],[486,535,38,36],[410,502,25,23]]}
].map((fill,index)=>({...fill,index,
  left:Math.min(...fill.lobes.map(([x,y,rx])=>x-rx)),
  right:Math.max(...fill.lobes.map(([x,y,rx])=>x+rx)),
  top:Math.min(...fill.lobes.map(([x,y,rx,ry])=>y-ry)),
  bottom:Math.max(...fill.lobes.map(([x,y,rx,ry])=>y+ry))}));
function fillDistance(q,fill){
  return Math.max(...fill.lobes.map(([x,y,rx,ry])=>
    (1-Math.hypot((q.x-x)/rx,(q.y-y)/ry))*Math.min(rx,ry)));
}
function fillBloomGaps(regions){
  const groups=new Map(),copies=new Map(),starts=new Map(),occupied=new Map();
  for(const f of firstFlowers){
    const key=`${f.branch}:${f.node}:${f.side}`;
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(f);
  }
  for(const f of laterFlowers){
    copies.set(f.source,(copies.get(f.source)||0)+1);
    starts.set(f.cluster,Math.min(starts.get(f.cluster)??Infinity,flowerClocks.get(f).budAt));
  }
  const occupy=q=>{const key=`${Math.floor(q.x/5)}:${Math.floor(q.y/5)}`;
    if(!occupied.has(key))occupied.set(key,[]);occupied.get(key).push(q);};
  const free=q=>{
    const x=Math.floor(q.x/5),y=Math.floor(q.y/5);
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)
      for(const p of occupied.get(`${x+dx}:${y+dy}`)||[])
        if(Math.hypot(p.x-q.x,p.y-q.y)<3.5)return false;
    return true;
  };
  for(const f of displayedFlowers)occupy(arrangedPositions.get(f));
  const candidates=[];
  for(const group of groups.values()){
    if(group.length<3)continue;
    const remaining=Math.min(...group.map(f=>2-(copies.get(f)||0)));
    for(let copy=0;copy<remaining;copy++)candidates.push({group,seed:hashFlower(group[0])^(copy+1)*104729});
  }
  candidates.sort((a,b)=>unit(a.seed,1871)-unit(b.seed,1871));
  const fills=regions.map(fill=>({...fill,remaining:fill.count})),added=[];
  let cursor=Math.max(...starts.values());
  for(const {group,seed} of candidates){
    const total=fills.reduce((n,fill)=>n+fill.remaining,0);if(!total)break;
    let pick=unit(seed,1901)*total;
    const fill=fills.find(fill=>(pick-=fill.remaining)<0);
    const region=REFERENCE_BLOOMS[fill.region],points=group.map(deform);
    const origin={x:points.reduce((n,q)=>n+q.x,0)/points.length,y:points.reduce((n,q)=>n+q.y,0)/points.length};
    const turn=(unit(seed,1903)-.5)*Math.PI,cos=Math.cos(turn),sin=Math.sin(turn);
    const offsets=points.map(q=>({x:(q.x-origin.x)*cos-(q.y-origin.y)*sin,
      y:(q.x-origin.x)*sin+(q.y-origin.y)*cos}));
    let center;
    for(let attempt=0;attempt<160;attempt++){
      const q={x:mix(fill.left,fill.right,unit(seed,attempt*7+2001)),
        y:mix(fill.top,fill.bottom,unit(seed,attempt*7+2002))};
      const texture=.65*grain(q.x/22,q.y/22,fill.index+2101)+.35*grain(q.x/7,q.y/7,fill.index+2309);
      const acceptance=smooth((fillDistance(q,fill)+3)/15)*(.2+.8*smooth((texture-.22)/.48));
      if(unit(seed,attempt*7+2003)>acceptance||!free(q))continue;
      if(!offsets.every(o=>q.x+o.x>=18&&q.x+o.x<=W-28&&q.y+o.y>=25))continue;
      center=q;break;
    }
    if(!center)continue;
    const originalStart=Math.min(...group.map(f=>flowerClocks.get(f).budAt));
    // 先继承单朵花的原动作；全部落点确定后，再与其他花团一起排开放顺序。
    cursor+=group.length/FLOWERS_PER_SECOND;
    const count=Math.min(fill.remaining,Math.floor(group.length*(.42+region.keep*.3)+unit(seed,2401)));
    const ranked=group.map((f,i)=>i).sort((i,j)=>hashFlower(group[i])-hashFlower(group[j]));
    const chosen=new Set(ranked.slice(0,count));
    const shadow=grain(center.x/34,center.y/34,region.index+119);
    for(let i=0;i<group.length;i++){
      const source=group[i],detail=unit(hashFlower(source),937),original=flowerClocks.get(source);
      const q={x:center.x+offsets[i].x,y:center.y+offsets[i].y};
      const f={...source,...q,source,continuation:true,cluster:center,gap:fill.index,rotation:source.rotation+turn};
      const budAt=cursor+original.budAt-originalStart,start=budAt+original.start-original.budAt;
      flowerClocks.set(f,{budAt,start,end:start+f.duration});
      arrangedPositions.set(f,q);
      clusterLooks.set(f,{style:region.style,region:region.index,
        size:region.size*(.7+1.05*detail*detail)*(.84+.16*f.layer/4),
        tone:Math.min(3,Math.max(0,Math.floor(shadow*4.3-.45+detail*.42))),
        outline:fillDistance(center,fill)});
      if(chosen.has(i)){displayedFlowers.add(f);occupy(q);}
      added.push(f);
    }
    fill.remaining-=count;
  }
  return added;
}
// 保留上轮补花的落点，再为新标注的缝隙选点。
for(const regions of [FILL_BLOOMS.slice(0,11),FILL_BLOOMS.slice(11)]){
  const added=fillBloomGaps(regions);
  laterFlowers.push(...added);canopyFlowers.push(...added);
}
const flowerIsVisible=f=>displayedFlowers.has(f)&&
  arrangedPositions.get(f).y<FLOWER_BOTTOM;
// 窗外花簇的越框距离再增加 10%；整簇使用固定偏移，花形、数量和花期不变。
const outsideOffsets=(()=>{
  const bounds=new Map();
  for(const f of laterFlowers){
    if(!flowerIsVisible(f))continue;
    const q=arrangedPositions.get(f);
    const r=f.size*1.2*CANOPY_FLOWER_SCALE*FLOWER_SIZE_GAIN*clusterLooks.get(f).size/2;
    const b=bounds.get(f.cluster)||{left:Infinity,right:-Infinity,top:Infinity};
    b.left=Math.min(b.left,q.x-r);b.right=Math.max(b.right,q.x+r);b.top=Math.min(b.top,q.y-r);
    bounds.set(f.cluster,b);
  }
  return new Map([...bounds].map(([cluster,b])=>[cluster,{
    x:.1*(Math.max(0,b.right-OPENING.x-OPENING.w)-Math.max(0,OPENING.x-b.left)),
    y:-.1*Math.max(0,OPENING.y-b.top)
  }]));
})();
const flowerPosition=f=>{
  const q=arrangedPositions.get(f);
  if(!f.continuation)return q;
  const offset=outsideOffsets.get(f.cluster);
  return offset?{x:q.x+offset.x,y:q.y+offset.y}:q;
};
// 所有花从内向外接续。各方向覆盖的距离不同，分别分配相同长度的花期，
// 再对齐最后一簇展开完成的时刻，避免两侧已停、顶部仍独自开放。
const VISIBLE_FLOWERS_PER_SECOND=firstFlowers.filter(flowerIsVisible).length/(LAST_BUD-FIRST_BUD);
(()=>{
  const groups=new Map(),seeds=[],sequence=[];
  for(const f of canopyFlowers){
    const key=f.cluster||`${f.branch}:${f.node}:${f.side}`;
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(f);
  }
  for(const flowers of groups.values()){
    const visible=flowers.filter(flowerIsVisible);if(!visible.length)continue;
    const points=visible.map(flowerPosition),center={
      x:points.reduce((n,q)=>n+q.x,0)/points.length,
      y:points.reduce((n,q)=>n+q.y,0)/points.length};
    if(flowers.some(f=>openingFlowers.has(f))){seeds.push(center);continue;}
    sequence.push({flowers,visible,center});
  }
  const origin={x:(Math.min(...seeds.map(q=>q.x))+Math.max(...seeds.map(q=>q.x)))/2,
    y:(Math.min(...seeds.map(q=>q.y))+Math.max(...seeds.map(q=>q.y)))/2};
  const directions=Array.from({length:12},()=>({clusters:[],count:0,finish:0}));
  const total=sequence.reduce((n,cluster)=>n+cluster.visible.length,0);
  const span=total/VISIBLE_FLOWERS_PER_SECOND;
  for(const cluster of sequence){
    const dx=cluster.center.x-origin.x,dy=cluster.center.y-origin.y;
    const angle=(Math.atan2(dy,dx)+Math.PI*2)%(Math.PI*2);
    const direction=directions[Math.floor(angle/Math.PI/2*directions.length)];
    cluster.order=Math.hypot(dx,dy)+(unit(hashFlower(cluster.flowers[0]),2609)-.5)*9;
    cluster.originalStart=Math.min(...cluster.visible.map(f=>flowerClocks.get(f).budAt));
    cluster.duration=Math.max(...cluster.visible.map(f=>flowerClocks.get(f).end))-cluster.originalStart;
    direction.clusters.push(cluster);direction.count+=cluster.visible.length;
  }
  for(const direction of directions){
    direction.clusters.sort((a,b)=>a.order-b.order);
    let count=0;
    for(const cluster of direction.clusters){
      cluster.at=count/direction.count*span;
      direction.finish=Math.max(direction.finish,cluster.at+cluster.duration);
      count+=cluster.visible.length;
    }
  }
  const finish=FIRST_BUD+.18+Math.max(...directions.map(direction=>direction.finish));
  for(const direction of directions)for(const cluster of direction.clusters){
    // 每个方向的出花间隔保持固定；仅平移整段花期，单朵花的展开速度不变。
    const shift=finish-direction.finish+cluster.at-cluster.originalStart;
    for(const f of cluster.flowers){
      const clock=flowerClocks.get(f);
      flowerClocks.set(f,{...clock,budAt:clock.budAt+shift,start:clock.start+shift,end:clock.end+shift});
    }
  }
})();
const BLOOM_END=Math.max(...canopyFlowers.filter(flowerIsVisible).map(f=>flowerClocks.get(f).end));
// 整段统一提速，内外接续及各方向的共同终点沿用同一时钟。
const PLAYBACK_SPEED=1.4;
const DURATION=(BLOOM_END-SKEW)/PLAYBACK_SPEED+.25;
const bloomClock=time=>Math.min(SKEW+time*PLAYBACK_SPEED,BLOOM_END);
// 落点与花期排好后再疏花，避免减少花量改变内外接续速度和共同终点。
const FLOWER_RENDER_SCALE=4.096,FLOWER_KEEP_RATIO=.06;
const plannedFlowers=canopyFlowers.filter(flowerIsVisible);
(()=>{
  const regions=new Map(),kept=new Set(),finishes=new Map();
  for(const f of plannedFlowers){
    const q=flowerPosition(f);
    const radius=f.size*1.2*CANOPY_FLOWER_SCALE*FLOWER_SIZE_GAIN*clusterLooks.get(f).size*FLOWER_RENDER_SCALE/2;
    // 再次放大后，略过会被画布外边缘切断的花位，花团本身不挪动。
    if(q.x-radius<0||q.x+radius>W||q.y-radius<0)continue;
    const region=clusterLooks.get(f).region;
    if(!regions.has(region))regions.set(region,[]);
    regions.get(region).push(f);
    // 保留各方位最后一小批花，疏花后左右与顶部仍一起收尾。
    const sector=Math.floor((Math.atan2(q.y-360,q.x-360)+Math.PI)*6/Math.PI);
    const last=finishes.get(sector)||[];
    last.push(f);last.sort((a,b)=>flowerClocks.get(b).end-flowerClocks.get(a).end);
    last.length=Math.min(3,last.length);finishes.set(sector,last);
  }
  for(const group of regions.values()){
    group.sort((a,b)=>flowerClocks.get(a).budAt-flowerClocks.get(b).budAt||hashFlower(a)-hashFlower(b));
    // 每个色团按出现顺序均匀抽取，整个花期都有新花接续。
    group.forEach((f,i)=>{
      if(i===0||Math.floor((i+1)*FLOWER_KEEP_RATIO)>Math.floor(i*FLOWER_KEEP_RATIO))kept.add(f);
    });
  }
  for(const last of finishes.values())for(const f of last)kept.add(f);
  for(const f of plannedFlowers)if(!kept.has(f))displayedFlowers.delete(f);
})();
// 本轮三处红框：优先恢复被疏掉的花，右侧缺少落点的部分借用未显示的玫瑰簇。
// 已显示的花不移动；整簇的位置在播放前确定，沿用原有花期。
const edgeFillFlowers=new Set();
(()=>{
  const span=f=>f.size*1.2*CANOPY_FLOWER_SCALE*FLOWER_SIZE_GAIN*clusterLooks.get(f).size*FLOWER_RENDER_SCALE;
  const fits=(f,q)=>q.x-span(f)/2>=0&&q.x+span(f)/2<=W&&q.y-span(f)/2>=0;
  const planned=new Set(plannedFlowers),births=new Map(),start=FIRST_BUD+.43;
  const rate=firstFlowers.filter(flowerIsVisible).length/(LAST_BUD-FIRST_BUD);
  const capacity=Math.round(rate*.25)+Math.ceil(rate*.25*.15);
  const bucket=f=>Math.floor((flowerClocks.get(f).budAt-start)/.25);
  for(const f of plannedFlowers)if(flowerIsVisible(f))births.set(bucket(f),(births.get(bucket(f))||0)+1);
  const room=group=>{
    const added=new Map();
    for(const f of group){const key=bucket(f);added.set(key,(added.get(key)||0)+1);}
    return [...added].every(([key,count])=>(births.get(key)||0)+count<=capacity);
  };
  const restore=f=>{displayedFlowers.add(f);edgeFillFlowers.add(f);births.set(bucket(f),(births.get(bucket(f))||0)+1);};
  const targets=[
    [180,108,3,3],[207,112,3,3],[233,107,3,3],
    [85,282,0,4],[96,301,0,4],
    [625,183,3,3],[632,203,3,3],[645,276,5,3]
  ];
  for(const [x,y,style,count] of targets){
    const nearby=plannedFlowers.filter(f=>!flowerIsVisible(f)&&f.continuation&&flowerPane(f)===style&&
      Math.hypot(flowerPosition(f).x-x,flowerPosition(f).y-y)<32&&fits(f,flowerPosition(f)))
      .sort((a,b)=>Math.hypot(flowerPosition(a).x-x,flowerPosition(a).y-y)-Math.hypot(flowerPosition(b).x-x,flowerPosition(b).y-y));
    let added=0;
    for(const f of nearby){
      const q=flowerPosition(f);
      if(!room([f]))continue;
      if([...edgeFillFlowers].some(other=>Math.hypot(flowerPosition(other).x-q.x,flowerPosition(other).y-q.y)<8))continue;
      restore(f);if(++added===count)break;
    }
  }
  const groups=new Map();
  for(const f of laterFlowers){
    if(!groups.has(f.cluster))groups.set(f.cluster,[]);groups.get(f.cluster).push(f);
  }
  for(const target of [{x:638,y:227},{x:649,y:249}]){
    const candidates=[...groups.values()].filter(group=>group.every(f=>!flowerIsVisible(f))&&
      group.every(f=>flowerPane(f)===4)&&group.filter(f=>planned.has(f)).length>=3)
      .map(group=>{
        const kept=group.filter(f=>planned.has(f)),points=kept.map(flowerPosition);
        const center={x:points.reduce((sum,q)=>sum+q.x,0)/points.length,y:points.reduce((sum,q)=>sum+q.y,0)/points.length};
        return {group,kept,center};
      }).sort((a,b)=>Math.hypot(a.center.x-target.x,a.center.y-target.y)-Math.hypot(b.center.x-target.x,b.center.y-target.y));
    const donor=candidates.find(({kept,center})=>room(kept)&&kept.every(f=>{
      const q=flowerPosition(f);return fits(f,{x:q.x+target.x-center.x,y:q.y+target.y-center.y});
    }));
    if(!donor)continue;
    for(const f of donor.group){
      const q=arrangedPositions.get(f);
      arrangedPositions.set(f,{x:q.x+target.x-donor.center.x,y:q.y+target.y-donor.center.y});
    }
    for(const f of donor.kept)restore(f);
  }
})();
// 只向共边的邻格借一层花色：整簇缩小后退，固定落点并沿用来源花期。
const backgroundFlowers=(()=>{
  const groups=new Map(),result=[],paneW=OPENING.w/PANE_COLUMNS,paneH=OPENING.h/PANE_ROWS;
  for(const f of canopyFlowers){
    if(!flowerIsVisible(f)||openingFlowers.has(f))continue;
    const key=f.cluster||`${f.branch}:${f.node}:${f.side}`;
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(f);
  }
  for(const group of groups.values()){
    const positions=group.map(flowerPosition),center={
      x:positions.reduce((sum,q)=>sum+q.x,0)/positions.length,
      y:positions.reduce((sum,q)=>sum+q.y,0)/positions.length};
    const col=Math.floor((center.x-OPENING.x)/paneW),row=Math.floor((center.y-OPENING.y)/paneH);
    if(col<0||col>=PANE_COLUMNS||row<0||row>=COLOR_ROWS)continue;
    const seed=hashFlower(group[0]),edges=[];
    for(const [dc,dr] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nextCol=col+dc,nextRow=row+dr;
      if(nextCol<0||nextCol>=PANE_COLUMNS||nextRow<0||nextRow>=COLOR_ROWS)continue;
      const boundary=dc?OPENING.x+(col+(dc>0?1:0))*paneW:OPENING.y+(row+(dr>0?1:0))*paneH;
      const distance=Math.abs(boundary-(dc?center.x:center.y));
      if(distance>54)continue;
      const reach=17+unit(seed,3271)*31;
      const target={x:center.x+dc*(distance+reach),y:center.y+dr*(distance+reach)};
      // 主花团与借来的背景花使用不同色，保持主次而不重复加厚同色。
      if(clusterLook(target,seed).style===clusterLooks.get(group[0]).style)continue;
      edges.push({target,col:nextCol,row:nextRow,distance});
    }
    edges.sort((a,b)=>a.distance-b.distance);
    const edge=edges[0];if(!edge||unit(seed,3277)>.66)continue;
    for(let i=0;i<group.length;i++){
      const q=positions[i],x=edge.target.x+(q.x-center.x)*.76,y=edge.target.y+(q.y-center.y)*.76;
      if(x<OPENING.x+edge.col*paneW+5||x>OPENING.x+(edge.col+1)*paneW-5||
        y<OPENING.y+edge.row*paneH+5||y>OPENING.y+(edge.row+1)*paneH-5)continue;
      result.push({source:group[i],x,y,from:{col,row},to:{col:edge.col,row:edge.row}});
    }
  }
  return result;
})();
// 保留色团的枝根参考，用于花头朝向；实际接枝在 buildFlowerSupports 中逐簇建立。
const bloomStalks=(()=>{
  const anchors=[];
  for(const b of branches)if(b.width>.8)
    for(const at of [.3,.65,.95])anchors.push(deform(curve(b,at)));
  return REFERENCE_BLOOMS.map(region=>{
    const xs=region.points.map(q=>q.x),ys=region.points.map(q=>q.y);
    const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
    const center={x:(left+right)/2,y:(top+bottom)/2},low={x:center.x,y:Math.min(680,bottom+20)};
    const root=anchors.reduce((best,q)=>Math.hypot(q.x-low.x,q.y-low.y)<Math.hypot(best.x-low.x,best.y-low.y)?q:best);
    return {root,center};
  });
})();
function drawBloomStalks(ctx,t){
  drawFlowerSupports(ctx,flowerSupports.front,t);
}
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
function flowerProgress(f,t){
  const clock=flowerClocks.get(f);
  // 花苞和展开共用一条曲线，避免在原 start 时刻由静止突然加速。
  // 出生、完成时刻沿用原安排，内外接续与共同终点不变。
  return f.maxOpen*smooth((t-clock.budAt)/(clock.end-clock.budAt));
}
const density=2;
// 八个关键姿态在播放时连续混合。同种同朝向共用高清花簇，
// 避免尺寸、明暗和 32 档进度相乘，挤掉缓存后又逐帧重画。
const FLOWER_STEPS=7;
const FLOWER_TILE_SIZE=Math.ceil(Math.max(...canopyFlowers.filter(flowerIsVisible).map(f=>
  f.size*1.2*CANOPY_FLOWER_SCALE*FLOWER_SIZE_GAIN*clusterLooks.get(f).size*FLOWER_RENDER_SCALE))*density/32)*32;
const FLOWER_CACHE_PIXELS=6*4*(FLOWER_STEPS+1)*FLOWER_TILE_SIZE**2,flowerSprites=new Map();
let flowerCachePixels=0;
const settledFlowerSprites=new Map();
let settledFlowerPixels=0;
let treeCache,canopy=[];
let flowerSupports,accentFlowers=[];
const sceneCaches=new Map();

// 同一花簇共用主色，跨过窗棂时不切色；所有选择在初始化时固定。
function flowerPane(f){
  if(f.styleIndex!==undefined)return f.styleIndex;
  return clusterLooks.get(f).style;
}

// 细枝使用与树皮一致的灰褐底色，主干另外贴合绘制素材。
const inks=new WeakMap();
function ink(ctx){
  if(inks.has(ctx))return inks.get(ctx);
  const tint=ctx.createLinearGradient(0,90,0,745);
  tint.addColorStop(0,'#a09580');tint.addColorStop(.58,'#827765');tint.addColorStop(1,'#6c6254');
  inks.set(ctx,tint);
  return tint;
}
function drawBranch(ctx,b,amount){
  if(amount<=0)return;
  const left=[],right=[],samples=[],count=30;
  for(let i=0;i<=count;i++){
    const t=amount*i/count,q=deform(curve(b,t)),normal=direction(b,t)+Math.PI/2;
    const taper=amount<.999?smooth((amount-t)/Math.max(.035,amount*.13)):1;
    let settled=mix(Math.max(.12,b.width*.5),Math.max(.12,b.endWidth*.5),smooth(t));
    if(b.guided&&b.parent>=0&&b.y>540){
      const collar=Math.min(.46,20/b.length),parentRadius=Math.max(.12,branches[b.parent].endWidth*.5);
      settled+=Math.max(0,parentRadius-Math.max(.12,b.width*.5))*(1-smooth(t/collar));
    }
    const radius=Math.max(.05,settled*taper);
    samples.push({...q,radius});
    left.push({x:q.x+Math.cos(normal)*radius,y:q.y+Math.sin(normal)*radius});
    right.push({x:q.x-Math.cos(normal)*radius,y:q.y-Math.sin(normal)*radius});
  }
  const trace=list=>{
    for(let i=1;i<list.length-1;i++)ctx.quadraticCurveTo(list[i].x,list[i].y,
      (list[i].x+list[i+1].x)/2,(list[i].y+list[i+1].y)/2);
    const end=list[list.length-1];ctx.lineTo(end.x,end.y);
  };
  ctx.fillStyle=ink(ctx);
  const parent=b.parent>=0?branches[b.parent]:null;
  const radius=(parent?parent.r1:b.r0)*smooth(amount/.15);
  const root=deform({x:b.x,y:b.y});
  ctx.beginPath();ctx.arc(root.x,root.y,Math.max(.02,radius),0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(left[0].x,left[0].y);trace(left);
  const tip=deform(curve(b,amount));ctx.quadraticCurveTo(tip.x,tip.y,right[count].x,right[count].y);
  trace(right.reverse());ctx.closePath();ctx.fill();
  if(b.width>1.4){
    ctx.save();ctx.clip();globalThis.WoodArt.bark(ctx,woodSheets[1],samples);ctx.restore();
  }
}
// 细小花瓣组成不对称小花：朝向、长短和折面各异，颜色靠实色分层，不加柔焦或亮边。
const PANE_STYLES=[
  {name:'草绿',palette:['#405b28','#587432','#79963e','#a2b457'],heart:'#6d7532'},
  {name:'金黄',palette:['#85751b','#b7a51d','#dccb25','#eee04a'],heart:'#927224'},
  {name:'橙色',palette:['#ad481d','#d46221','#eb822e','#f0a24b'],heart:'#9e4c22'},
  {name:'青色',palette:['#255b4c','#397460','#518d70','#7ba586'],heart:'#547346'},
  {name:'朱红',palette:['#82271d','#a93724','#c74b2e','#e56843'],heart:'#773621'},
  {name:'蓝色',palette:['#316671','#4b8790','#73aaa9','#9ac4bd'],heart:'#426f66'}
];
function flowerShape(ctx,f,progress){
  if(progress<=0&&!f.cachedPose)return;
  const pane=flowerPane(f),kind=flowerAssets[pane].kind;
  const tone=f.tone??clusterLooks.get(f)?.tone??1,variant=f.variant;
  ctx.save();ctx.scale(f.size*1.2/64,f.size*1.2/64);
  if(!f.cachedPose)ctx.globalAlpha*=flowerOpacity(progress);
  ctx.rotate((variant-1.5)*(kind==='cup'?.035:.055));
  // 每个花位是一支有前后层次的短花簇，姿态制好后整簇复用。
  const florets=kind==='sprig'?FLOWER_SPRIGS[variant]:LARGE_FLOWER_SPRIGS;
  // 短分梗随姿态一起缓存，从固定接枝点连到每个花头；绘制在花瓣后面。
  ctx.strokeStyle='#79806c';ctx.lineWidth=.42;ctx.lineCap='round';ctx.beginPath();
  for(let i=0;i<florets.length;i++){
    const [x,y,size]=florets[(i+variant)%florets.length],asset=flowerAssets[pane];
    const ay=asset.frames?(asset.frameAnchor[1]/asset.frameSize-.5)*30:0;
    ctx.moveTo(0,23);ctx.quadraticCurveTo(x*.3,22,x,y+ay*size);
  }
  ctx.stroke();
  for(let i=0;i<florets.length;i++){
    const [x,y,size]=florets[(i+variant)%florets.length];
    const shade=i===florets.length-1?Math.min(3,tone+1):Math.max(0,tone-(i%2));
    ctx.save();ctx.translate(x,y);ctx.scale(size,size);
    // 短花簇里的小花略微错开舒展，同一花簇仍在原定终点收齐。
    const open=floretProgress(progress,i,variant),pose=floretPose(x,y,variant,kind,open);
    const asset=flowerAssets[pane];
    if(asset.frames){
      const [ax,ay]=asset.frameAnchor.map(v=>(v/asset.frameSize-.5)*30);
      ctx.translate(ax,ay);ctx.rotate(pose.angle);ctx.translate(-ax,-ay);
    }else ctx.rotate(pose.angle);
    globalThis.FlowerSprite.draw(ctx,flowerFrames[pane],Math.max(.000001,open),pose.view,30,shade);
    ctx.restore();
  }
  ctx.restore();
}
function floretPose(x,y,variant,kind,progress){
  // 中间花朝向观众，两翼用斜面，少量外缘花用侧面；开花时不切换观察方向。
  const position=Math.abs(x)<7?1:x<0?0:2;
  // 郁金香使用真正的侧面/背面素材；正面只在四种簇形中的两朵穿插。
  const cupViews=[[1,0,2],[3,1,2],[2,3,1],[1,2,0]];
  const view=kind==='cup'?cupViews[variant][position]:Math.abs(x)<7?0:variant===3&&Math.abs(x)>=12?3:x<0?1:2;
  const spread=Math.atan2(x,Math.max(12,22-y))*(kind==='cup'?.16:.38);
  const angle=spread*(.65+.35*smooth((progress-.22)/.78))+(variant-1.5)*.025;
  return {view,angle};
}
function floretProgress(progress,index,variant){
  const p=clamp(progress),delay=((index+variant)%6)*.07;
  // 轻微错开舒展，全程连续；不在半开处等待后突然追赶。
  return p-delay*p*(1-p);
}
// 玫瑰、菊花和郁金香留三朵较大的花头，避免细节互相遮盖。
const LARGE_FLOWER_SPRIGS=[[-12,6,1.08,1],[12,5,1.03,2],[0,-12,1.14,0]];
const FLOWER_SPRIGS=[
  [[-11,-10,.78,1],[10,-8,.75,3],[-9,9,.83,2],[6,7,1.2,0],[0,-1,.73,1]],
  [[-8,-14,.87,1],[7,-10,.84,2],[-11,-1,.7,3],[7,4,.86,1],[-4,10,.84,2],[4,15,.66,0]],
  [[-11,-9,.91,1],[9,-12,.83,3],[-12,8,.86,2],[10,10,.78,1],[0,12,.84,2],[2,-1,1.06,0]],
  [[-14,-6,.72,3],[-5,-12,.93,1],[9,-6,.86,2],[-9,7,.78,1],[8,8,.9,3],[1,0,1.12,2]]
];
function flowerSprite(styleIndex,tone,variant,progress,span){
  const step=Math.round(clamp(progress)*FLOWER_STEPS),pixels=FLOWER_TILE_SIZE;
  const key=`${styleIndex}:${variant}:${step}`;
  if(flowerSprites.has(key))return flowerSprites.get(key);
  const canvas=document.createElement('canvas');canvas.width=pixels;canvas.height=pixels;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.translate(pixels/2,pixels/2);ctx.scale(pixels/64,pixels/64);
  // 明暗随四种花簇朝向固定，保留花瓣本身及簇内的阴影，不按每朵重复制图。
  flowerShape(ctx,{size:64/1.2,tone:variant%2+1,variant,styleIndex,cachedPose:true},step/FLOWER_STEPS);
  flowerSprites.set(key,canvas);flowerCachePixels+=pixels*pixels;
  return canvas;
}
// 素材本身已有从小花苞到盛放的尺寸变化。花头间距始终固定，
// 最初只渐显花苞，不能把整簇再次缩放成从中心炸开的效果。
const flowerOpacity=progress=>smooth(progress/.18);
function paintFlowerSprite(ctx,styleIndex,variant,progress,span,settled=false){
  if(progress<=0)return;
  const phase=clamp(progress)*FLOWER_STEPS,first=Math.floor(phase),blend=phase-first;
  const current=flowerSprite(styleIndex,0,variant,first/FLOWER_STEPS,span);
  const next=blend===0?current:flowerSprite(styleIndex,0,variant,(first+1)/FLOWER_STEPS,span);
  // 混合图只需覆盖这簇实际显示的像素，不必每朵都处理最大花簇的大图。
  const pixels=Math.ceil(span*density/16)*16;
  let sprite=current;
  if(blend>0){
    if(settled){
      const key=`${styleIndex}:${variant}:${progress}:${pixels}`;
      sprite=settledFlowerSprites.get(key);
      if(!sprite){
        sprite=document.createElement('canvas');sprite.width=pixels;sprite.height=pixels;
        globalThis.FlowerSprite.blendImages(current,next,blend,pixels,sprite);
        settledFlowerSprites.set(key,sprite);settledFlowerPixels+=pixels*pixels;
      }
    }else sprite=globalThis.FlowerSprite.blendImages(current,next,blend,pixels);
  }
  const alpha=ctx.globalAlpha;
  ctx.globalAlpha=alpha*flowerOpacity(progress);
  ctx.drawImage(sprite,0,0,sprite.width,sprite.height,-span/2,-span/2,span,span);
  ctx.globalAlpha=alpha;
}
// 坐标、颜色索引和尺寸固定，只计算一次，播放时只更新开花进度。
const flowerDrawInfo=new WeakMap();
const flowerGrowth=new WeakMap();
function flowerRotation(f){
  if(!flowerGrowth.has(f)){
    const q=flowerPosition(f),root=bloomStalks[clusterLooks.get(f).region].root;
    // 从花团所接的真实枝段向花心取方向，向两侧分开，但花头始终朝上。
    const outward=Math.atan2(q.x-root.x,Math.max(35,root.y-q.y));
    const cup=flowerAssets[flowerPane(f)].kind==='cup';
    const jitter=(unit(hashFlower(f),3917)-.5)*(cup?.06:.12);
    const limit=cup?.24:.82,angle=outward*(cup?.15:.55)+jitter;
    flowerGrowth.set(f,Math.max(-limit,Math.min(limit,angle)));
  }
  return flowerGrowth.get(f);
}
function drawInfo(f){
  if(!flowerDrawInfo.has(f))flowerDrawInfo.set(f,{
    position:flowerPosition(f),atlas:flowerPane(f),
    rotation:flowerRotation(f),cos:Math.cos(flowerRotation(f))*density,sin:Math.sin(flowerRotation(f))*density,
    span:f.size*1.2*CANOPY_FLOWER_SCALE*FLOWER_SIZE_GAIN*clusterLooks.get(f).size*FLOWER_RENDER_SCALE
  });
  return flowerDrawInfo.get(f);
}
function flowerSupportTip(f,position=flowerPosition(f),scale=1){
  const info=drawInfo(f),kind=flowerAssets[info.atlas].kind;
  const angle=info.rotation+(f.variant-1.5)*(kind==='cup'?.035:.055);
  const reach=23*info.span*scale/64;
  return {x:position.x-Math.sin(angle)*reach,y:position.y+Math.cos(angle)*reach};
}
function buildFlowerSupports(){
  // 原枝条上的精确曲线点是树根；新花只能接到原枝或此前已经长到的接枝点。
  const roots=[];
  for(const b of branches)if(b.width>.45)for(const at of [.2,.4,.6,.8,1]){
    const q=deform(curve(b,at));
    if(q.x>=OPENING.x&&q.x<=OPENING.x+OPENING.w&&q.y>=OPENING.y&&q.y<=OPENING.y+OPENING.h)
      {
        const before=deform(curve(b,Math.max(0,at-.002))),after=deform(curve(b,Math.min(1,at+.002)));
        roots.push({...q,branch:b,at,end:SKEW,angle:Math.atan2(after.y-before.y,after.x-before.x)});
      }
  }
  const connect=items=>{
    const supports=[],points=[...roots];
    items.sort((a,b)=>flowerClocks.get(a.source).budAt-flowerClocks.get(b.source).budAt);
    for(const item of items){
      const budAt=flowerClocks.get(item.source).budAt;
      const tip=flowerSupportTip(item.source,item.position,item.scale);
      let parent=null,best=Infinity,fallback=null,fallbackDistance=Infinity;
      for(const q of points){
        if(q.end>=budAt)continue;
        const distance=Math.hypot(q.x-tip.x,q.y-tip.y);
        // 优先找已经长好、并留得出完整舒展时间的枝条。
        // 不能只取最近的刚出生枝尖，再把一根长枝挤进最后几帧。
        if(q.end+supportDuration(distance)<=budAt&&distance<best){best=distance;parent=q;}
        if(!q.support&&distance<fallbackDistance){fallbackDistance=distance;fallback=q;}
      }
      // 最早几朵从原枯枝直接接出，既不改初始画面，也不借用未长好的新枝。
      if(!parent){parent=fallback;best=fallbackDistance;}
      const start=Math.max(SKEW,parent.end,budAt-supportDuration(best));
      const angle=Math.atan2(tip.y-parent.y,tip.x-parent.x);
      const turn=Math.atan2(Math.sin(parent.angle-angle),Math.cos(parent.angle-angle));
      const tangent=angle+Math.max(-.8,Math.min(.8,turn))*.7;
      const control1={x:parent.x+Math.cos(tangent)*best*.32,y:parent.y+Math.sin(tangent)*best*.32};
      const control2={x:tip.x-Math.cos(angle)*best*.28,y:tip.y-Math.sin(angle)*best*.28};
      const support={...item,parent,tip,control1,control2,start,end:budAt};
      supports.push(support);
      // 侧枝可以从母枝已长出的中段萌出，不必等到整根母枝和花头都长完。
      for(const at of [.25,.5,.75,1]){
        const q=supportPoint(support,at),u=1-at;
        const dx=u*u*(control1.x-parent.x)+2*u*at*(control2.x-control1.x)+at*at*(tip.x-control2.x);
        const dy=u*u*(control1.y-parent.y)+2*u*at*(control2.y-control1.y)+at*at*(tip.y-control2.y);
        let lo=0,hi=1;
        for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(smooth(mid)<at)lo=mid;else hi=mid;}
        points.push({...q,end:mix(start,budAt,hi),angle:Math.atan2(dy,dx),at,support});
      }
    }
    return supports;
  };
  return {
    front:connect(canopyFlowers.filter(flowerIsVisible).map(source=>({source,position:flowerPosition(source),scale:1}))),
    back:connect(backgroundFlowers.map(f=>({source:f.source,position:{x:f.x,y:f.y},scale:.76})))
  };
}
// 长枝比短枝更早起步；这是枝条自身的时长，不改变花朵的出生与结束时刻。
const supportDuration=length=>(.22+length/150)*PLAYBACK_SPEED;
function supportPoint(s,p){
  const a=s.parent,b=s.control1,c=s.control2,d=s.tip,u=1-p;
  return {x:u*u*u*a.x+3*u*u*p*b.x+3*u*p*p*c.x+p*p*p*d.x,
    y:u*u*u*a.y+3*u*u*p*b.y+3*u*p*p*c.y+p*p*p*d.y};
}
function drawFlowerSupports(ctx,supports,t){
  ctx.save();ctx.strokeStyle='#79806c';ctx.lineCap='round';
  // 先画细尖，再加上逐渐变厚的中段和根部；各层批量绘制，避免逐枝描边。
  for(const [reach,width] of [[1,.22],[.84,.4],[.6,.58]]){
    ctx.lineWidth=width;ctx.beginPath();let count=0;
    for(const support of supports){
      if(t<=support.start)continue;
      const p=smooth((t-support.start)/(support.end-support.start))*reach,u=1-p;
      const a=support.parent,b=support.control1,c=support.control2,tip=supportPoint(support,p);
      ctx.moveTo(a.x,a.y);
      // 截取同一条固定曲线，已长出的部分不会在后续帧弯折或换位置。
      ctx.bezierCurveTo(mix(a.x,b.x,p),mix(a.y,b.y,p),
        u*u*a.x+2*u*p*b.x+p*p*c.x,u*u*a.y+2*u*p*b.y+p*p*c.y,tip.x,tip.y);
      count++;
    }
    if(count)ctx.stroke();
  }
  ctx.restore();
}
// 两处红框各加一朵郁金香，直接落在现有短枝端点，不复制整簇或另长新枝。
function buildAccentFlowers(){
  const stems=flowerSupports.front.filter(s=>flowerPane(s.source)===2);
  return [{x:116,y:536,size:28,view:1,angle:-.14},{x:256,y:623,size:26,view:0,angle:.1}].map(target=>({
    ...target,support:stems.reduce((best,s)=>Math.hypot(s.tip.x-target.x,s.tip.y-target.y)<
      Math.hypot(best.tip.x-target.x,best.tip.y-target.y)?s:best)
  }));
}
function drawAccentFlowers(ctx,t){
  const asset=flowerAssets[2];
  for(const f of accentFlowers){
    const progress=flowerProgress(f.support.source,t)/f.support.source.maxOpen;
    if(progress<=0)continue;
    ctx.save();ctx.translate(f.support.tip.x,f.support.tip.y);ctx.rotate(f.angle);
    ctx.translate(-((asset.frameAnchor[0]/asset.frameSize)-.5)*f.size,
      -((asset.frameAnchor[1]/asset.frameSize)-.5)*f.size);
    ctx.globalAlpha*=flowerOpacity(progress);
    globalThis.FlowerSprite.draw(ctx,flowerFrames[2],progress,f.view,f.size,2);
    ctx.restore();
  }
}
function drawFlower(ctx,f,t,animated=false,batch=false){
  if(!flowerIsVisible(f))return;
  const progress=flowerProgress(f,t);if(progress<=0)return;
  const info=drawInfo(f),q=info.position;
  // 连续贴图时直接设好预存的旋转与位置，省掉逐花保存、旋转和恢复画布。
  if(batch)ctx.setTransform(info.cos,info.sin,-info.sin,info.cos,q.x*density,q.y*density);
  else{ctx.save();ctx.translate(q.x,q.y);ctx.rotate(info.rotation);}
  if(animated){
    const span=info.span;
    paintFlowerSprite(ctx,info.atlas,f.variant,progress,span,t>=flowerClocks.get(f).end);
  }else {const scale=FLOWER_SIZE_GAIN*CANOPY_FLOWER_SCALE*clusterLooks.get(f).size*FLOWER_RENDER_SCALE;ctx.scale(scale,scale);flowerShape(ctx,f,progress);}
  if(!batch)ctx.restore();
}
function drawBandFlowers(ctx,band,t,animated=true){
  // 首轮保持在窗内；后续新增花可以越框。两者均从固定花心展开。
  ctx.save();clipOpening(ctx);
  for(const f of band.first)drawFlower(ctx,f,t,animated,animated);
  ctx.restore();
  ctx.save();
  for(const f of band.later)drawFlower(ctx,f,t,animated,animated);
  ctx.restore();
}
function buildCanopy(){
  canopy=Array.from({length:5},(_,layer)=>({layer,
    first:firstFlowers.filter(f=>f.layer===layer&&flowerIsVisible(f)).sort((a,b)=>a.z-b.z),
    later:laterFlowers.filter(f=>f.layer===layer&&flowerIsVisible(f)).sort((a,b)=>a.z-b.z)}));
}
function initTreeCache(){
  const ctx=treeCache.drawingContext;
  ctx.save();clipOpening(ctx);
  for(const b of branches)drawBranch(ctx,b,1);
  ctx.restore();
}
function composeScene(t,part){
  const ctx=sceneCaches.get(part).drawingContext;
  ctx.setTransform(density,0,0,density,0,0);ctx.clearRect(0,0,W,H);
  if(part==='background'){
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
    drawWindowGlass(ctx);
    drawBackgroundFlowers(ctx,t);
    ctx.drawImage(treeCache.canvas,0,0,W,H);
    return;
  }
  if(part==='frame'){drawWindowFrame(ctx);return;}
  if(part==='art'){
    drawBackgroundFlowers(ctx,t);
    ctx.drawImage(treeCache.canvas,0,0,W,H);
  }
  ctx.save();ctx.beginPath();ctx.rect(0,0,W,FLOWER_BOTTOM);ctx.clip();
  drawBloomStalks(ctx,t);
  for(const band of canopy){
    ctx.save();drawBandFlowers(ctx,band,t);ctx.restore();
  }
  ctx.restore();
  drawAccentFlowers(ctx,t);
}

function drawBackgroundFlowers(ctx,t){
  ctx.save();clipOpening(ctx);ctx.globalAlpha=.32;
  drawFlowerSupports(ctx,flowerSupports.back,t);
  for(const f of backgroundFlowers){
    const progress=flowerProgress(f.source,t);if(progress<=0)continue;
    const info=drawInfo(f.source),span=info.span*.76;
    ctx.setTransform(info.cos,info.sin,-info.sin,info.cos,f.x*density,f.y*density);
    paintFlowerSprite(ctx,info.atlas,f.source.variant,progress,span,t>=flowerClocks.get(f.source).end);
  }
  ctx.restore();
}
function drawWindowGlass(ctx){
  ctx.save();
  const pw=OPENING.w/PANE_COLUMNS,ph=OPENING.h/PANE_ROWS;
  for(let row=0;row<PANE_ROWS;row++)for(let col=0;col<PANE_COLUMNS;col++){
    const x=OPENING.x+col*pw,y=OPENING.y+row*ph;
    const glass=ctx.createLinearGradient(x,y,x+pw,y+ph);
    glass.addColorStop(0,'#e8eeea');glass.addColorStop(.32,'#f7f8f2');glass.addColorStop(1,'#edf0e9');
    ctx.fillStyle=glass;ctx.fillRect(x,y,pw,ph);
    ctx.strokeStyle='rgba(70,65,49,.17)';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(x+2,y+ph-2);ctx.lineTo(x+2,y+2);ctx.lineTo(x+pw-2,y+2);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,249,.85)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x+pw-2,y+2);ctx.lineTo(x+pw-2,y+ph-2);ctx.lineTo(x+2,y+ph-2);ctx.stroke();
  }
  ctx.restore();
}
function drawWindowFrame(ctx){
  ctx.drawImage(windowArt.canvas,windowArt.x,windowArt.y,windowArt.w,windowArt.h);
}
const clipOpening=ctx=>{ctx.beginPath();ctx.rect(OPENING.x,OPENING.y,OPENING.w,OPENING.h);ctx.clip();};

 const parts=opt.mode==='full'?['background','frame','bloom']:['art'];
 let dead=false,sceneClock;
 const clockAt=t=>opt.mode==='tree'?(opt.pose==='bare'?SKEW:BLOOM_END):bloomClock(t);
 const ready=Promise.all([...flowerAssets.map(asset=>asset.src),'assets/wood/walnut-window.webp','assets/wood/bare-bark.webp']
   .map(path=>S.image('assets/scene-sources/window/'+path))).then(images=>{
   if(dead)return;
   flowerSheets=images.slice(0,6);woodSheets=images.slice(6);
   flowerFrames=flowerSheets.map((sheet,index)=>globalThis.FlowerSprite.prepare(sheet,undefined,flowerAssets[index].cleanAlpha,flowerAssets[index]));
   treeCache=S.graphics(W,H);treeCache.pixelDensity(density);
   for(const part of parts){const cache=S.graphics(W,H);cache.pixelDensity(density);sceneCaches.set(part,cache);}
   if(opt.mode==='full')windowArt=globalThis.WoodArt.windowFrame(woodSheets[0],OPENING,PANE_COLUMNS,PANE_ROWS,density);
   initTreeCache();buildCanopy();flowerSupports=buildFlowerSupports();accentFlowers=buildAccentFlowers();
 });
 return {ready,
   prepare(t){const clock=clockAt(t);if(clock===sceneClock)return;for(const part of parts)composeScene(clock,part);sceneClock=clock;},
   draw(_t,_mode,part){S.ctx.drawImage(sceneCaches.get(part).canvas,0,0,opt.width,opt.height);},
   inspect(t){const clock=clockAt(t);return {time:t,clock,duration:DURATION,playbackSpeed:PLAYBACK_SPEED,opening:OPENING,branches:branches.length,
     first:canopy.reduce((sum,band)=>sum+band.first.length,0),later:canopy.reduce((sum,band)=>sum+band.later.length,0),background:backgroundFlowers.length,
     flowers:canopyFlowers.filter(flowerIsVisible).map(f=>({position:flowerPosition(f),style:flowerPane(f),variant:f.variant,progress:flowerProgress(f,clock),clock:flowerClocks.get(f)})),
     supports:{front:flowerSupports.front.length,back:flowerSupports.back.length},accents:accentFlowers.length};},
   destroy(){dead=true;flowerSprites.clear();settledFlowerSprites.clear();sceneCaches.clear();flowerSheets=woodSheets=flowerFrames=windowArt=treeCache=flowerSupports=null;canopy=[];accentFlowers=[];}
 };
 };
 const base={family:'window',start:0,width:1440,height:1920};
 global.WiseSceneRuntime.register('window-experiment-tree-illustration',{...base,mode:'tree',pose:'bloom',variants:{bloom:{pose:'bloom'},bare:{pose:'bare'}}});
 global.WiseSceneRuntime.register('window-flower-bloom',{...base,mode:'bloom'});
 global.WiseSceneRuntime.register('window-experiment-journey',{...base,mode:'full',layers:['background','frame','bloom'],breakdown:[
   {id:'background',name:'窗内枯树与后景花',start:0,end:3891,time:'0—3.891秒',detail:'窗内原枯枝、玻璃和后景花保持原位置，后景花在木框后接续展开。',actions:['window-experiment-tree-illustration','window-flower-bloom']},
   {id:'frame',name:'胡桃木窗框',start:0,end:3891,time:'0—3.891秒',detail:'原胡桃木素材组成三列四行窗格，保持木纹比例和遮挡。',actions:[]},
   {id:'bloom',name:'沿枝展开并越过窗框的花簇',start:0,end:3891,time:'0—3.891秒',detail:'六色真实花簇沿固定枝位接续盛开，近景花越过木框，末尾停在盛放。',actions:['window-flower-bloom']}
 ]});
})(globalThis);
