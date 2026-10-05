/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
 * 黄金矩形、文字雨幕与打铁花均为本地几何绘制，不读取视频或参考图片。
 * 组合与独立动作调用相同的部件绘制函数；全部位置由绝对时间决定。
 */
/* 黄金矩形递归生长及其直接拆分动作：复刻至 @陈与小金 老师，已取得授权（用户于2026-10-05确认）。
 * https://www.xiaohongshu.com/user/profile/674ae141000000001c019796?xsec_token=AB4_JtYTs33ywlUEE_Mx8jkB1aDCvusqnUmnJNp5ZZLwE%3D&xsec_source=pc_search */
(function(global){'use strict';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=(t,a,b)=>{const q=clamp((t-a)/(b-a));return q*q*(3-2*q);};
const rand=i=>{const x=Math.sin(i*127.1+19.7)*43758.5453;return x-Math.floor(x);};

// 正方形共享瀑布网格：1、1、2、3、5、8 格拼成 13×8 的黄金比例近似矩形。
const TAU=Math.PI*2,PHI=(1+Math.sqrt(5))/2,GRID_STEP=27,PLANE_STEP=324;
const gridLattice={columns:22,rows:14,xOffset:10.5,yOffset:6.5,left:24,right:616,top:8,bottom:352};
// 第一块正方形的中心也是光点、镜头和回缩的中心；不按整幅矩形重新居中。
const SEED=[.5,.5],PLANE_CENTER=[306,188];
const goldenTiles=[
 {x:0,y:0,size:1,cx:1,cy:1,angle:Math.PI},
 {x:1,y:0,size:1,cx:1,cy:1,angle:-Math.PI/2},
 {x:0,y:1,size:2,cx:0,cy:1,angle:0},
 {x:-3,y:0,size:3,cx:0,cy:0,angle:Math.PI/2},
 {x:-3,y:-5,size:5,cx:2,cy:0,angle:Math.PI},
 {x:2,y:-5,size:8,cx:2,cy:3,angle:-Math.PI/2}
];
const tilePoint=(x,y)=>[(x-SEED[0])*GRID_STEP/130,(y-SEED[1])*GRID_STEP/130];
const tileGeometry=goldenTiles.map(tile=>({...tile,square:[[tile.x,tile.y],[tile.x+tile.size,tile.y],[tile.x+tile.size,tile.y+tile.size],[tile.x,tile.y+tile.size],[tile.x,tile.y]].map(p=>tilePoint(...p)),arc:Array.from({length:65},(_,j)=>{const a=tile.angle+j/64*Math.PI/2;return tilePoint(tile.cx+Math.cos(a)*tile.size,tile.cy+Math.sin(a)*tile.size);})}));
function goldenGeometry(index){return tileGeometry[index];}
function tileGridReady(t,index){const g=gridLattice,s=goldenTiles[index],right=320+(s.x+s.size-SEED[0])*GRID_STEP,bottom=184+(s.y+s.size-SEED[1])*GRID_STEP;
 return [s.x+10,s.x+s.size+10].every(i=>mix(g.top,g.bottom,waterfallProgress(t,'vertical',i*13/(g.columns-1)))>=bottom)&&[s.y+6,s.y+s.size+6].every(i=>mix(g.left,g.right,waterfallProgress(t,'horizontal',i*9/(g.rows-1)))>=right);
}
const tileTimings=[];for(let i=0;i<goldenTiles.length;i++){let lo=0,hi=3.3;for(let j=0;j<32;j++){const mid=(lo+hi)/2;if(tileGridReady(mid,i))hi=mid;else lo=mid;}const start=Math.max(hi+.015,i?tileTimings[i-1].end+.012:1.35),end=start+.15+i*.016;tileTimings.push({start,end});}
const SCAN_START=Math.max(3.02,tileTimings.at(-1).end+.025),SCAN_DURATION=4.15-SCAN_START;
function tileReveal(t,index){const timing=tileTimings[index];return smooth(t,timing.start,timing.end);}
const scanSamples=[],scanOwners=[];for(let i=0;i<tileGeometry.length;i++){const pts=tileGeometry[i].arc;for(let j=i?1:0;j<pts.length;j++){scanSamples.push(pts[j]);scanOwners.push(i);}}
const scanLengths=[0];for(let i=1;i<scanSamples.length;i++)scanLengths[i]=scanLengths[i-1]+Math.hypot(scanSamples[i][0]-scanSamples[i-1][0],scanSamples[i][1]-scanSamples[i-1][1]);
function scanLocation(u){const length=clamp(u)*scanLengths.at(-1);let low=0,high=scanLengths.length-1;while(high-low>1){const m=(low+high)>>1;if(scanLengths[m]<length)low=m;else high=m;}const q=(length-scanLengths[low])/(scanLengths[high]-scanLengths[low]||1),a=scanSamples[low],b=scanSamples[high];return {point:[mix(a[0],b[0],q),mix(a[1],b[1],q)],tile:scanOwners[high]};}
function motifPoint(u){return scanLocation(u).point;}
function scanTick(u,radius){const loc=scanLocation(u),p=loc.point,a=motifPoint(Math.max(0,u-.001)),b=motifPoint(Math.min(1,u+.001)),len=Math.hypot(b[0]-a[0],b[1]-a[1])||1,n=[-(b[1]-a[1])/len,(b[0]-a[0])/len],box=goldenGeometry(loc.tile).square;return [1.1,3.8].map(d=>[clamp(p[0]*radius+n[0]*d,box[0][0]*radius,box[1][0]*radius),clamp(p[1]*radius+n[1]*d,box[0][1]*radius,box[2][1]*radius)]);}
function partialPath(pts,q){const amount=clamp(q)*(pts.length-1),last=Math.floor(amount),result=pts.slice(0,last+1);if(last<pts.length-1)result.push([mix(pts[last][0],pts[last+1][0],amount-last),mix(pts[last][1],pts[last+1][1],amount-last)]);return result;}
function clipTile(ctx,g,P,radius){ctx.beginPath();g.square.forEach((p,i)=>i?ctx.lineTo(...P(p[0]*radius,p[1]*radius)):ctx.moveTo(...P(p[0]*radius,p[1]*radius)));ctx.closePath();ctx.clip();}
function motifShape(ctx,P,radius,progress=1,alpha=1,width=.6,time=Infinity,reveal=null){
 if(progress<=0||alpha<=0)return;
 tileGeometry.forEach((g,i)=>{const q=reveal?reveal(i):time===Infinity?progress:tileReveal(time,i);if(q<=0)return;const tr=([x,y])=>P(x*radius,y*radius),seedMode=i===0&&!reveal&&time<4.2,seedGrow=seedMode?smooth(q,0,.58):1,outline=seedMode?g.square.map(p=>p.map(v=>v*seedGrow)):partialPath(g.square,q);
  path(ctx,outline.map(tr),'#d9dfeb',width*.8,alpha*.85);ctx.save();clipTile(ctx,g,P,radius);path(ctx,partialPath(g.arc,smooth(q,i===0&&!reveal&&time<4.2?.58:.18,1)).map(tr),'#e8cfac',width,alpha*.94);ctx.restore();});
 if(!reveal&&time>=SCAN_START-.1)for(let j=0;j<36;j++)path(ctx,scanTick(j/36,radius).map(p=>P(...p)),'#b7c9dc',width*.52,alpha*.45);
}
const ZOOM_START=4200,SOURCE_ZOOM_END=256/30*1000,ZOOM_END=6200,ZOOM_SAVED=SOURCE_ZOOM_END-ZOOM_END;
// 回缩后的生长段统一提速，几何、镜头、网格与铁花继续共用同一时钟。
const GROWTH_SOURCE_START=500/30*1000,GROWTH_SPEED=1.5;
function toSourceTime(ms){const source=ms<=ZOOM_START?ms:ms<ZOOM_END?ZOOM_START+(ms-ZOOM_START)*(SOURCE_ZOOM_END-ZOOM_START)/(ZOOM_END-ZOOM_START):ms+ZOOM_SAVED;return source<=GROWTH_SOURCE_START?source:GROWTH_SOURCE_START+(source-GROWTH_SOURCE_START)*GROWTH_SPEED;}
function toPlaybackTime(ms){const source=ms<=GROWTH_SOURCE_START?ms:GROWTH_SOURCE_START+(ms-GROWTH_SOURCE_START)/GROWTH_SPEED;return source<=ZOOM_START?source:source<SOURCE_ZOOM_END?ZOOM_START+(source-ZOOM_START)*(ZOOM_END-ZOOM_START)/(SOURCE_ZOOM_END-ZOOM_START):source-ZOOM_SAVED;}
function innerScanState(t){const progress=clamp((t-SCAN_START)/SCAN_DURATION),alpha=smooth(t,SCAN_START-.02,SCAN_START+.04)*(1-smooth(t,4.18,4.42));return {progress,alpha,nodes:Array.from({length:36},(_,j)=>{const age=t-(SCAN_START+j/36*SCAN_DURATION);return age<0||age>.3?0:Math.exp(-age/.07)*alpha;})};}
function returnTileReveal(t,index){return smooth(t,14.98+index*.15,15.20+index*.15);}
function returnAppearance(t,state){return {alpha:smooth(state.out,.55,.88),radius:130*PLANE_STEP/GRID_STEP};}
function planeGridPoint(state,x,y){return state.P(PLANE_CENTER[0]+(x-SEED[0])*PLANE_STEP,PLANE_CENTER[1]+(y-SEED[1])*PLANE_STEP);}
function gridCellStep(t){return mix(GRID_STEP,32,smooth(t,17.6,19.15))-5*smooth(t,19.2,20.4);}
function gridTilePoint(state,x,y,t){const unit=gridCellStep(t);return state.P(320+(x-SEED[0])*unit,184+(y-SEED[1])*unit);}

function waterfallProgress(t,kind,index){const start=kind==='vertical'?.24+index*.075:.68+index*.088,duration=kind==='vertical'?1.03:1.13;return smooth(t,start,start+duration);}
const waveProfiles=[
 {id:'group-stagger',at:17.2,x:320,y:184,speed:190,duration:.88,amplitude:9},
 {id:'wave-grid',at:19.0,x:110,y:65,speed:235,duration:.76,amplitude:13},
 {id:'group-stagger',at:20.75,x:320,y:184,speed:190,duration:.88,amplitude:16},
 {id:'wave-grid',at:22.15,x:110,y:65,speed:235,duration:.76,amplitude:15}
];
function gridWave(t,x,y){let z=0;const d0=Math.hypot(x-320,y-184),d1=Math.hypot(x-110,y-65);for(let i=0;i<waveProfiles.length;i++){const w=waveProfiles[i],q=(t-w.at-(i%2?d1:d0)/w.speed)/w.duration;if(q<=0||q>=1)continue;const p=w.id==='group-stagger'?1-(1-q)**3:q;z+=w.amplitude*Math.sin(Math.PI*p);}return z*(1-smooth(t,23.75,24.2));}
// 铁花用带阻力、重力和延迟分叉的轨迹，细亮尾随速度改变长度。
function ballistic(p,age){const d=-Math.expm1(-p.drag*age)/p.drag;return [p.x+p.vx*d,p.y+p.vy*d+.5*p.gravity*age*age];}
function ironParticles(seed,kind='impact'){
 const particles=[],count=kind==='impact'?360:270;
 for(let i=0;i<count;i++){const r=n=>rand(seed*787+i*19+n),ring=kind==='flower',angle=ring?r(1)*TAU:(i%5===0?r(1)*TAU:-Math.PI/2+(r(1)-.5)*3.35),speed=ring?110+r(2)*100:65+Math.pow(r(2),.62)*260;
  particles.push({x:(r(3)-.5)*2,y:(r(4)-.5)*2,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-(ring?12:0),drag:.7+r(5)*1.5,gravity:ring?110:200,birth:r(6)*.035,life:.58+r(7)*.52,width:r(8)>.86?1:0,brightness:.55+r(9)*.45});
 }
 for(let i=0;i<count/3;i++){const parent=particles[i*3],delay=.16+rand(seed+i+41)*.17,origin=ballistic(parent,delay),a=rand(seed+i+79)*TAU,vel=20+rand(seed+i+13)*65;
  particles.push({x:origin[0],y:origin[1],vx:parent.vx*Math.exp(-parent.drag*delay)*.7+Math.cos(a)*vel,vy:(parent.vy*Math.exp(-parent.drag*delay)+parent.gravity*delay)*.7+Math.sin(a)*vel,drag:1.6,gravity:parent.gravity,birth:parent.birth+delay,life:.23+rand(i+81)*.33,width:0,brightness:.65});
 }
 return particles;
}
const impactBanks=[ironParticles(1),ironParticles(2),ironParticles(3)],flowerBanks=Array.from({length:5},(_,i)=>ironParticles(10+i,'flower'));
function sparkGeometry(bank,time){const result=[];for(const p of bank){const age=time-p.birth;if(age<=0||age>=p.life)continue;const tail=.016+.035*(p.life-age)/p.life,head=ballistic(p,age),middle=ballistic(p,Math.max(0,age-tail*.45)),back=ballistic(p,Math.max(0,age-tail));result.push({head,middle,back,opacity:Math.pow(1-age/p.life,.8)*p.brightness,width:p.width});}return result;}
function paintIron(ctx,bank,time,P,alpha=1,widthScale=1){
 if(time<=0||time>1.4||alpha<=0)return;
 const groups=Array.from({length:16},()=>[]),tips=Array.from({length:4},()=>[]),samples=sparkGeometry(bank,time);
 for(const p of samples){const a=P(...p.back),b=P(...p.middle),c=P(...p.head);if(c[0]<-50||c[0]>690||c[1]<-50||c[1]>410)continue;const level=Math.min(3,Math.floor(p.opacity*4)),offset=p.width*8;
  groups[offset+level].push([a,b]);groups[offset+4+level].push([b,c]);if(p.width)tips[level].push(c);
 }
 ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';ctx.shadowBlur=0;
 for(let j=0;j<groups.length;j++){if(!groups[j].length)continue;const front=j%8>=4,level=j%4,thick=j>=8;ctx.beginPath();for(const [a,b]of groups[j]){ctx.moveTo(...a);ctx.lineTo(...b);}ctx.strokeStyle=front?'#ffdda0':'#dd772b';ctx.globalAlpha=alpha*(level+.7)/4;ctx.lineWidth=(thick?.62:.25)*widthScale;
  // 少量宽亮丝的柔光合批绘制，不对数百个粒子分别加模糊。
  if(front&&thick){const opacity=ctx.globalAlpha;ctx.lineWidth=1.7*widthScale;ctx.globalAlpha=opacity*.13;ctx.stroke();ctx.globalAlpha=opacity;ctx.lineWidth=.62*widthScale;}
  ctx.stroke();
 }
 ctx.fillStyle='#fff9e9';for(let j=0;j<tips.length;j++){ctx.globalAlpha=alpha*(j+1)/4;ctx.beginPath();for(const [x,y]of tips[j])ctx.rect(x-.18*widthScale,y-.18*widthScale,.36*widthScale,.36*widthScale);ctx.fill();}ctx.restore();
}
function innerScan(ctx,t,P,cx,cy,zoom){
 const {progress,alpha,nodes}=innerScanState(t);if(alpha<=0)return;
 const project=([x,y])=>P(cx+x,cy+y);
 // 连续的短亮尾沿内侧圆弧行进，每一枚刻度仅在亮头到达时响应。
 for(let k=0;k<10;k++){const end=progress-k*.005,start=Math.max(0,end-.005);if(end<=0)continue;path(ctx,mapLine(u=>{const p=motifPoint(mix(start,end,u));return project([p[0]*130,p[1]*130]);},4),'#b5e3d9',.8,alpha*(1-k/10)*.88);}
 nodes.forEach((a,j)=>{if(a<=.01)return;path(ctx,scanTick(j/36,130).map(project),'#e8fff5',1.05,a);});
 const p=motifPoint(progress);point(ctx,...project([p[0]*130,p[1]*130]),alpha,.47*Math.min(zoom,1.8));
}
function path(ctx,pts,color='#aeb8c8',width=.35,alpha=1){if(!pts.length||alpha<=0)return;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();ctx.restore();}
function line(ctx,x1,y1,x2,y2,color,width=.35,alpha=1){path(ctx,[[x1,y1],[x2,y2]],color,width,alpha);}
// 同一细线的底色和虚线沿用同一个当前路径，保留两次描边的顺序与叠色。
function strokeCurrentPath(ctx,color,width,alpha){if(alpha<=0)return;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.restore();}
// 每个画布分别缓存各字号的测量结果；字体准备完成时作废，销毁时释放。
const measuredWidths=new WeakMap();
function textWidth(ctx,value){let fonts=measuredWidths.get(ctx);if(!fonts){fonts=new Map();measuredWidths.set(ctx,fonts);}let widths=fonts.get(ctx.font);if(!widths){widths=new Map();fonts.set(ctx.font,widths);}if(!widths.has(value))widths.set(value,ctx.measureText(value).width);return widths.get(value);}
// 字形只栅格化一次；位置、沿线角度、透视和透明度仍由原来的绘制决定。
const glyphCaches=new WeakMap();
function glyphStore(ctx){let store=glyphCaches.get(ctx);if(!store){store={fonts:new Map(),pages:[],glyphs:0,hits:0};glyphCaches.set(ctx,store);}return store;}
function cachedGlyph(ctx,char){
 const store=glyphStore(ctx),key=ctx.font+'|'+ctx.fillStyle;let letters=store.fonts.get(key);
 if(!letters){letters=new Map();store.fonts.set(key,letters);}if(letters.has(char)){store.hits++;return letters.get(char);}
 const density=16,size=Number(ctx.font.match(/([\d.]+)px/)[1]),metrics=ctx.measureText(char),left=-Math.max(0,metrics.actualBoundingBoxLeft||0)-1,top=-Math.max(size*1.1,metrics.actualBoundingBoxAscent||0)-1;
 const width=Math.ceil((Math.max(metrics.width,metrics.actualBoundingBoxRight||0)-left+1)*density),height=Math.ceil((-top+Math.max(size*.3,metrics.actualBoundingBoxDescent||0)+1)*density);
 let page=store.pages.at(-1);if(page&&page.x+width>page.canvas.width){page.x=0;page.y+=page.row;page.row=0;}
 if(!page||page.y+height>page.canvas.height){const canvas=ctx.canvas.ownerDocument.createElement('canvas');canvas.width=1024;canvas.height=1024;page={canvas,ctx:canvas.getContext('2d'),x:0,y:0,row:0};store.pages.push(page);}
 const glyph={canvas:page.canvas,sx:page.x,sy:page.y,sw:width,sh:height,left,top,width:width/density,height:height/density};
 const c=page.ctx;c.save();c.setTransform(density,0,0,density,page.x-left*density,page.y-top*density);c.font=ctx.font;c.fillStyle=ctx.fillStyle;c.textBaseline='alphabetic';c.textAlign='left';c.fillText(char,0,0);c.restore();page.x+=width;page.row=Math.max(page.row,height);letters.set(char,glyph);store.glyphs++;return glyph;
}
function drawGlyph(ctx,char,x,y){if(char===' ')return;const g=cachedGlyph(ctx,char);ctx.drawImage(g.canvas,g.sx,g.sy,g.sw,g.sh,x+g.left,y+g.top,g.width,g.height);}
function releaseGlyphs(ctx){const store=glyphCaches.get(ctx);if(store)for(const page of store.pages){page.canvas.width=page.canvas.height=1;}glyphCaches.delete(ctx);}
function glyphStats(ctx){const s=glyphCaches.get(ctx);return s?{glyphs:s.glyphs,hits:s.hits,pages:s.pages.length,bytes:s.pages.length*1024*1024*4}:{glyphs:0,hits:0,pages:0,bytes:0};}
function warmGlyphs(ctx){ctx.save();for(const [size,color,phrase]of [[13.5,'#c4ccdb',top+bottom+side],[3.4,'#dbe1ed',bottom+side],[3.5,'#c0c7d6',words]]){ctx.font=`500 ${size}px "PingFang SC", sans-serif`;ctx.fillStyle=color;for(const c of new Set(phrase))if(c!==' ')cachedGlyph(ctx,c);}ctx.restore();}
function visibleRaySamples(core){const limit=(Math.hypot(Math.max(core[0],640-core[0]),Math.max(core[1],360-core[1]))+20)/.918;return Math.min(76,Math.max(2,Math.floor((limit-12)/(778/75))+2));}
function text(ctx,s,x,y,size=4,color='#bfc5cc',angle=0,alpha=1,font='sans-serif'){if(alpha<=0)return;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.font=`500 ${size}px ${font}`;ctx.fillText(s,0,0);ctx.restore();}
// 原片分阶段的径向光照量测，仅保留颜色、半径和时间参数；不使用原片位图。
const lightRadii=[0,1,3,6,10,16,24,40,65,100,150,210,280,380,700];
const lightKeys=[[0.5,[[246,242,234],[235,224,205],[143,124,107],[118,99,84],[95,78,65],[73,58,50],[58,47,41],[45,35,32],[32,26,26],[20,18,22],[6,10,16],[1,5,14],[0,3,8],[0,3,8],[1,2,5]]],[1.966667,[[246,242,234],[235,224,205],[138,117,102],[118,100,84],[101,83,68],[84,67,57],[71,56,49],[53,42,38],[40,32,30],[26,22,24],[10,12,17],[1,6,14],[0,3,9],[0,3,8],[1,2,5]]],[3.966667,[[246,242,234],[235,224,205],[160,141,125],[128,110,95],[103,85,71],[83,67,58],[67,53,47],[53,42,38],[40,32,30],[28,24,26],[11,13,18],[2,7,15],[0,3,9],[0,3,8],[1,2,5]]],[5.0,[[246,242,234],[235,224,205],[185,172,156],[166,148,131],[139,121,105],[114,96,82],[94,77,68],[56,46,43],[39,32,31],[31,27,28],[15,16,21],[4,9,16],[0,4,10],[0,3,8],[1,2,5]]],[5.966667,[[246,242,234],[235,224,205],[197,180,165],[179,161,143],[151,135,121],[75,64,63],[62,53,51],[53,44,42],[43,36,35],[27,23,25],[11,12,18],[3,7,15],[0,3,10],[0,3,8],[1,2,5]]],[7.366667,[[246,242,234],[235,224,205],[198,176,151],[182,156,133],[159,134,111],[128,105,88],[65,55,52],[50,39,35],[41,31,29],[29,23,23],[12,11,16],[3,6,11],[1,3,8],[2,3,7],[1,2,5]]],[8.3,[[246,242,234],[235,224,205],[191,160,132],[174,141,112],[153,120,93],[128,98,76],[103,76,58],[70,51,38],[52,37,28],[34,25,19],[17,12,10],[5,5,5],[3,3,3],[3,3,3],[5,3,0]]],[8.966667,[[246,242,234],[235,224,205],[221,196,167],[215,186,156],[204,171,139],[184,148,115],[158,122,93],[119,88,63],[86,60,43],[56,38,25],[27,18,10],[11,7,3],[5,4,1],[4,3,1],[5,3,0]]],[9.966667,[[246,242,234],[235,224,205],[218,192,164],[213,182,154],[202,169,136],[185,149,116],[161,125,93],[122,89,63],[88,61,42],[57,39,25],[30,20,11],[15,9,4],[11,6,2],[10,7,2],[5,3,0]]],[11.2,[[246,242,234],[235,224,205],[189,153,121],[174,138,106],[153,117,86],[127,93,67],[104,74,52],[78,55,38],[57,39,25],[38,25,16],[23,16,8],[10,6,2],[4,3,0],[4,3,0],[5,3,0]]],[11.8,[[246,242,234],[235,224,205],[229,204,176],[221,191,163],[209,176,142],[188,152,117],[161,124,92],[122,89,64],[89,63,43],[58,40,26],[33,23,15],[13,8,3],[5,3,0],[4,3,0],[5,3,0]]],[12.133333,[[246,242,234],[235,224,205],[222,194,164],[211,180,148],[198,162,128],[173,135,103],[143,108,79],[109,79,55],[79,55,38],[53,36,23],[30,21,13],[12,7,3],[5,3,0],[4,3,0],[5,3,0]]],[12.833333,[[246,242,234],[235,224,205],[228,205,179],[221,193,163],[210,177,144],[190,153,119],[163,126,95],[125,91,66],[92,65,45],[62,44,30],[34,24,17],[13,8,3],[5,3,0],[4,3,0],[5,3,0]]],[13.3,[[246,242,234],[235,224,205],[192,161,130],[173,138,105],[156,120,90],[131,97,71],[109,79,56],[84,59,41],[62,43,29],[44,31,20],[25,18,11],[11,7,3],[5,3,0],[4,3,0],[5,3,0]]],[14.133333,[[246,242,234],[235,224,205],[173,138,108],[158,121,92],[144,108,80],[123,90,65],[104,73,52],[80,57,40],[62,44,30],[42,30,20],[24,17,10],[10,6,2],[4,3,0],[4,3,0],[5,3,0]]],[14.7,[[246,242,234],[235,224,205],[226,203,177],[220,189,161],[205,171,141],[181,146,114],[152,117,89],[119,88,65],[89,65,49],[58,41,29],[29,20,12],[15,11,5],[6,4,1],[4,3,1],[5,3,0]]],[15.633333,[[246,242,234],[235,224,205],[218,191,162],[206,173,142],[183,147,115],[151,117,89],[127,96,72],[99,73,55],[70,50,36],[53,39,28],[28,21,14],[14,10,6],[5,4,0],[4,3,1],[5,3,0]]],[16.3,[[246,242,234],[235,224,205],[204,184,164],[184,160,138],[155,130,108],[123,98,79],[99,78,62],[75,57,43],[52,38,26],[36,25,16],[20,13,7],[10,7,2],[5,4,0],[4,3,1],[5,3,0]]],[16.666667,[[246,242,234],[235,224,205],[196,167,139],[178,147,120],[164,135,110],[140,114,92],[104,79,60],[75,55,40],[53,37,24],[34,23,14],[19,12,6],[10,6,2],[5,3,0],[4,3,1],[5,3,0]]],[17.966667,[[246,242,234],[235,224,205],[198,168,137],[193,165,138],[191,162,135],[173,147,122],[150,122,98],[124,98,77],[72,52,38],[45,31,20],[24,16,8],[11,6,2],[4,3,0],[4,3,1],[5,3,0]]],[18.966667,[[246,242,234],[235,224,205],[228,204,178],[220,194,167],[216,189,163],[199,171,143],[176,146,119],[146,117,93],[89,64,47],[56,39,26],[28,19,10],[12,7,2],[5,3,0],[4,3,1],[5,3,0]]],[19.966667,[[246,242,234],[235,224,205],[214,184,157],[203,175,148],[195,170,145],[173,145,121],[151,124,100],[109,83,63],[73,51,37],[49,34,22],[25,16,8],[11,7,2],[5,3,0],[4,3,1],[5,3,0]]],[20.966667,[[246,242,234],[235,224,205],[234,211,192],[229,209,187],[216,194,170],[197,170,146],[176,148,123],[125,95,71],[96,70,51],[68,50,35],[40,29,18],[20,14,6],[10,6,2],[7,4,1],[5,3,0]]],[21.966667,[[246,242,234],[235,224,205],[222,196,172],[218,195,172],[203,179,156],[183,156,134],[162,135,111],[116,87,66],[91,67,49],[67,48,34],[40,28,18],[21,14,6],[11,6,2],[8,5,1],[5,3,0]]],[22.966667,[[246,242,234],[235,224,205],[246,229,211],[241,225,207],[234,215,198],[221,199,176],[204,177,151],[164,132,104],[118,89,66],[83,61,44],[47,33,22],[23,15,8],[11,6,2],[7,4,1],[5,3,0]]],[23.833333,[[246,242,234],[235,224,205],[246,230,213],[242,225,206],[238,222,203],[226,204,181],[210,184,158],[184,156,130],[126,96,72],[84,62,45],[47,34,22],[23,15,8],[11,6,2],[6,4,1],[5,3,0]]],[24.466667,[[246,242,234],[235,224,205],[243,228,209],[235,216,195],[225,202,177],[209,183,157],[173,147,124],[149,123,100],[123,100,76],[97,75,56],[65,49,31],[45,30,19],[34,20,12],[26,15,11],[4,3,0]]],[25.0,[[246,242,234],[235,224,205],[246,232,219],[240,224,206],[231,211,189],[219,197,172],[184,161,138],[164,140,115],[140,116,90],[117,94,70],[100,75,52],[75,48,29],[56,30,18],[50,23,18],[4,3,0]]],[25.833333,[[246,242,234],[235,224,205],[226,204,184],[214,191,169],[200,178,155],[186,164,139],[155,135,112],[136,115,90],[120,98,72],[108,82,57],[79,49,31],[60,33,22],[46,22,15],[35,15,10],[4,3,0]]]];
function glow(ctx,x,y,r=150,strength=1,warm=true,time=0){
 let i=0;while(i<lightKeys.length-2&&time>lightKeys[i+1][0])i++;
 const a=lightKeys[i],b=lightKeys[i+1],q=clamp((time-a[0])/(b[0]-a[0])),fade=smooth(time,.07,.43);
 ctx.save();const g=ctx.createRadialGradient(x,y,0,x,y,700);
 lightRadii.forEach((radius,k)=>{const rgb=a[1][k].map((v,j)=>Math.round(mix(v,b[1][k][j],q)));g.addColorStop(radius/700,`rgb(${rgb.join(' ')})`);});
 ctx.globalAlpha=fade;ctx.fillStyle=g;ctx.fillRect(0,0,640,360);ctx.restore();
}
function point(ctx,x,y,t=1,r=1){if(t<=0)return;ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=t;
 const g=ctx.createRadialGradient(x,y,0,x,y,8*r);g.addColorStop(0,'rgba(255,252,246,.96)');g.addColorStop(.075,'rgba(255,247,233,.94)');g.addColorStop(.18,'rgba(242,228,207,.48)');g.addColorStop(.43,'rgba(193,179,162,.1)');g.addColorStop(1,'rgba(160,135,110,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,8*r,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#fffefa';ctx.beginPath();ctx.arc(x,y,.48*r,0,Math.PI*2);ctx.fill();ctx.restore();}
function light(ctx,x,y,time,visibility=1){
 const bright=smooth(time,8.5,11.2)*(1-smooth(time,24.1,24.6)),r=mix(.9,1.35,bright);
 point(ctx,x,y,visibility,r);
 ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=visibility*(1-smooth(time,23.86,24.6));
 const g=ctx.createLinearGradient(x-260,y,x+260,y);g.addColorStop(0,'rgba(255,240,218,0)');g.addColorStop(.29,'rgba(241,232,218,.03)');g.addColorStop(.46,'rgba(244,237,224,.13)');g.addColorStop(.5,'rgba(255,255,246,.7)');g.addColorStop(.54,'rgba(244,237,224,.13)');g.addColorStop(.71,'rgba(241,232,218,.03)');g.addColorStop(1,'rgba(255,240,218,0)');
 ctx.strokeStyle=g;ctx.lineWidth=.5;ctx.shadowColor='rgba(255,247,232,.8)';ctx.shadowBlur=2.3;ctx.beginPath();ctx.moveTo(x-260,y);ctx.lineTo(x+260,y);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha*=.34;ctx.lineWidth=1.25;ctx.stroke();ctx.restore();
}
const stars=Array.from({length:180},(_,i)=>({x:rand(i+41)*700-30,y:rand(i+91)*420-30,r:i<24?.35+rand(i+142)*.35:.10+rand(i+142)*.2,a:i<24?.38+rand(i+15)*.46:.12+rand(i+15)*.2,depth:.12+rand(i+171)*.88}));
function dust(ctx,t,alpha=.5){ctx.save();ctx.globalCompositeOperation='screen';const camera=smooth(t,8.53,11.16),release=1-smooth(t,23.88,24.7);for(let i=0;i<stars.length;i++){const s=stars[i],drift=(t>8.53?Math.sin((t-8.53)*.24):0)*6*s.depth,xx=s.x+drift,yy=s.y+Math.cos((t-8.53)*.21)*camera*4*s.depth,twinkle=.94+.06*Math.sin(t*(.3+s.depth)+i);ctx.globalAlpha=s.a*alpha*twinkle*release*smooth(t,.08,.55);ctx.fillStyle=i%5===0?'#ceddeb':'#f4ead9';if(i<24){ctx.shadowColor=i%5===0?'#b9cbe9':'#fff0da';ctx.shadowBlur=1.6;}else ctx.shadowBlur=0;ctx.beginPath();ctx.arc(xx,yy,s.r,0,Math.PI*2);ctx.fill();}ctx.restore();}
function mapLine(fn,steps=80){return Array.from({length:steps+1},(_,i)=>fn(i/steps));}
// 字符雨幕的错速与八字尾迹：保留文案字符，位移始终沿行或沿列为正。
const mod=(v,n)=>(v%n+n)%n;
function rainGlyphs(string,length,size,time,lane,range=[0,length]){const spacing=size*1.13,speed=size*(1.65+rand(lane+79)*1.3),offset=time*speed+rand(lane+17)*spacing*19,first=Math.floor((range[0]-offset)/spacing)-1,last=Math.ceil((range[1]-offset)/spacing)+1,result=[];for(let i=first;i<=last;i++){const at=i*spacing+offset;if(at<range[0]||at>range[1])continue;const tail=mod(-i-lane,23);result.push({index:i,char:string[mod(i+lane*3,string.length)],at,alpha:.32+(tail<8?.68*(1-tail/8)**1.4:0),speed});}return result;}
const quakeImpacts=[7.02,7.34,7.68];
function quakeTremor(time){let x=0,y=0;for(const start of quakeImpacts){const age=time-start;if(age<0||age>.65)continue;x+=Math.sin(age*78)*Math.exp(-age*11)*.85;y+=Math.sin(age*93)*Math.exp(-age*12)*.48;}return [x,y];}
// 绝对时间求解抛起、重力落下与落地反弹；任意拖动都回到同一受力状态。
function glyphQuake(time,id,x,y){const delay=Math.min(.13,Math.hypot(x-306,y-188)/2800)+rand(id+91)*.045,g=275+rand(id+9)*65,restitution=.43+rand(id+33)*.13;let h=0,v=0,last=quakeImpacts[0]+delay;
 function advance(dt){for(let i=0;i<16&&dt>1e-8;i++){if(h<1e-8&&v<.7){h=0;v=0;return;}const hit=(v+Math.sqrt(Math.max(0,v*v+2*g*h)))/g;if(hit>=dt){h=Math.max(0,h+v*dt-.5*g*dt*dt);v-=g*dt;return;}h=0;v=-(v-g*hit)*restitution;dt-=hit;}}
 if(time<last||time>9.5)return {height:0,lateral:0,angle:0};for(let i=0;i<quakeImpacts.length;i++){const at=quakeImpacts[i]+delay;if(at>time)break;advance(at-last);v+=[55,42,30][i]*(.75+rand(id+17)*.45);last=at;}advance(time-last);let lateral=0,angle=0;for(const start of quakeImpacts){const age=time-start-delay;if(age<0)continue;const decay=Math.exp(-age*5);lateral+=Math.sin(age*(47+rand(id)*9))*Math.cos(id)*decay*.8;angle+=Math.sin(age*23)*Math.sin(id)*decay*.12;}angle+=h*.011*Math.sin(id);return {height:h,lateral,angle};}
function onCurve(ctx,string,fn,size=4,color='#acb8cd',alpha=.75,time=0,lane=0,vertical=false,visualScale=1){if(alpha<=0)return;ctx.save();ctx.fillStyle=color;ctx.font=`500 ${size}px "PingFang SC", sans-serif`;const pts=mapLine(fn,120),lengths=[0];for(let i=1;i<pts.length;i++)lengths[i]=lengths[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);let j=1;for(const glyph of rainGlyphs(string,lengths.at(-1),size*visualScale,time,lane)){while(j<lengths.length-1&&lengths[j]<glyph.at)j++;const q=(glyph.at-lengths[j-1])/(lengths[j]-lengths[j-1]||1),a=pts[j-1],b=pts[j],xx=mix(a[0],b[0],q),yy=mix(a[1],b[1],q);if(xx<-25||xx>665||yy<-25||yy>385)continue;ctx.save();ctx.globalAlpha=alpha*glyph.alpha;ctx.translate(xx,yy);ctx.rotate(Math.atan2(b[1]-a[1],b[0]-a[0])-(vertical?Math.PI/2:0));ctx.scale(visualScale,visualScale);drawGlyph(ctx,glyph.char,-size*.45,vertical?size*.35:-.7);ctx.restore();}ctx.restore();}
function planeText(ctx,string,P,x,y,len,size=13,vertical=false,alpha=1,time=0,lane=0){ctx.save();ctx.fillStyle='#c4ccdb';ctx.font=`500 ${size}px "PingFang SC", sans-serif`;const localTime=toPlaybackTime(time*1000)/1000,origin=P(x,y),next=P(x+(vertical?0:1),y+(vertical?1:0)),dx=next[0]-origin[0],dy=next[1]-origin[1],norm=dx*dx+dy*dy,offsets=[[-80,-80],[720,-80],[-80,440],[720,440]].map(p=>((p[0]-origin[0])*dx+(p[1]-origin[1])*dy)/norm),range=[clamp(Math.min(...offsets),0,len),clamp(Math.max(...offsets),0,len)];for(const glyph of rainGlyphs(string,len,size,time-8.53,lane,range)){const xx=x+(vertical?0:glyph.at),yy=y+(vertical?glyph.at:0),a=P(xx,yy);if(a[0]<-70||a[0]>710||a[1]<-70||a[1]>430)continue;const b=P(xx+1,yy),d=P(xx,yy+1),shake=glyphQuake(localTime,lane*997+glyph.index,xx,yy);ctx.save();ctx.globalAlpha=alpha*glyph.alpha;ctx.transform(b[0]-a[0],b[1]-a[1],d[0]-a[0],d[1]-a[1],a[0],a[1]);ctx.translate(shake.lateral,-shake.height);ctx.rotate(shake.angle);drawGlyph(ctx,glyph.char,vertical?-size*.45:0,vertical?size*.34:-.7);ctx.restore();}ctx.restore();}

const top='不够高级。没有感觉。再惊艳一点。不够流畅。还是不对。太普通了。';
const bottom='再高级一点。说不上来。总差点意思。没有质感。再改一下。不是我要的。';
const side='不够自然。没有灵魂。太平了。再有冲击力一点。不够丝滑。感觉不对。';
const small='没有质感。';

const words='审美。节奏。构图。层次。质感。留白。运动。衔接。重复。变奏。审美。节奏。构图。层次。质感。留白。';
// 结尾延续开场方格：相邻斐波那契方格向外延伸，格内再递归分出黄金矩形。
// 所有坐标来自所属方格、黄金比例与四分之一转向，没有预先散摆的枝叶位置。
const NATURE_START=GROWTH_SOURCE_START/1000,NATURE_MORPH_START=16.9,NATURE_MORPH_END=18.25;
const NATURE_SCALE=338/55,NATURE_CENTER=[20,-12],NATURE_MIN_CELL=11,NATURE_MAX_DEPTH=5;
const naturePalette=['#efd7ae','#e2be83','#d7d2af','#c6ceb2','#e7c992'];
const natureSquares=[],natureRectangles=[],natureGeometry=[];
const natureStyles=[
 {color:'#efd7ae',width:.90,alpha:.88},{color:'#e2be83',width:.58,alpha:.78},
 {color:'#d7d2af',width:.44,alpha:.69},{color:'#c6ceb2',width:.34,alpha:.57},
 {color:'#e7c992',width:.27,alpha:.46},
 {color:'#d9dfeb',width:.45,alpha:.22},{color:'#baa580',width:.32,alpha:.24},
 {color:'#aaab98',width:.25,alpha:.18},{color:'#bca780',width:.20,alpha:.13},
 {color:'#b9b59a',width:.18,alpha:.10}
];
function natureMorph(t){return smooth(t,NATURE_MORPH_START,NATURE_MORPH_END);}
function natureCamera(t){const q=natureMorph(t),r=-.128,ca=Math.cos(r),sa=Math.sin(r);return {
 a:mix(GRID_STEP*ca,NATURE_SCALE,q),b:mix(GRID_STEP*sa,0,q),
 c:mix(-GRID_STEP*sa,0,q),d:mix(GRID_STEP*ca,NATURE_SCALE,q),
 x:mix(320,320-NATURE_CENTER[0]*NATURE_SCALE,q),y:mix(180,180-NATURE_CENTER[1]*NATURE_SCALE,q)
};}
function naturePoint(frame,local,t,state){const m=state?(state.natureCamera??=natureCamera(t)):natureCamera(t);return [m.x+m.a*local[0]+m.c*local[1],m.y+m.b*local[0]+m.d*local[1]];}
function natureProgress(t,line){return smooth(t,line.at,line.at+line.duration);}
function natureAlpha(line,t){return line.style===5?mix(.85,.22,smooth(t,18.4,24.75)):natureStyles[line.style].alpha;}
function addNatureLine(local,at,duration,style,owner,kind,parentLine=-1){const id=natureGeometry.length;natureGeometry.push({id,local,points:local.map(p=>naturePoint(0,p,30)),at,duration,style,owner,kind,parentLine});return id;}
function quarterArc(map,cx,cy,size,angle){const count=Math.max(8,Math.min(64,Math.ceil(size*NATURE_SCALE*.4)));return Array.from({length:count+1},(_,i)=>map(cx+Math.cos(angle+i/count*Math.PI/2)*size,cy+Math.sin(angle+i/count*Math.PI/2)*size));}
function squareMap(center,u,v){return (x,y)=>[center[0]+u[0]*x+v[0]*y,center[1]+u[1]*x+v[1]*y];}
function squareCorners(map){return [[1,0],[1,1],[0,1],[0,0],[1,0]].map(p=>map(...p));}
function addNatureSquare(map,size,depth,at,duration,parentSquare,parentRect,parentLine,main=false){
 const index=natureSquares.length,center=map(0,0),u=map(1,0).map((v,i)=>v-center[i]),v=map(0,1).map((v,i)=>v-center[i]),outline=squareCorners(map);
 const guide=addNatureLine(outline,at,duration*.36,5+Math.min(4,depth),index,'square',parentLine),arc=quarterArc((x,y)=>map(x/size,y/size),0,0,size,0);
 const line=addNatureLine(arc,at+duration*.36,duration*.64,Math.min(4,depth),index,'arc',guide);
 const square={index,map,center,u,v,size,depth,at,end:at+duration,parentSquare,parentRect,guide,line,main};natureSquares.push(square);return square;
}
// 标准黄金矩形从左下角进入，依次切左、上、右、下的正方形，圆弧首尾相接。
function addGoldenRectangle(owner,map,width,height,at,depth,parentLine){
 const index=natureRectangles.length,outline=[[0,height],[0,0],[width,0],[width,height],[0,height]].map(p=>map(...p)),guide=addNatureLine(outline,at,.16,5+Math.min(4,depth),owner.index,'rectangle',parentLine);
 const rect={index,owner:owner.index,width,height,depth,at,guide,outline,squares:[]};natureRectangles.push(rect);
 let x=0,y=0,w=width,h=height,previous=guide,time=at+.20;
 for(let i=0;i<8;i++){
  const edge=i%4,size=Math.min(w,h);if(size*NATURE_SCALE<1.65)break;
  let cx,cy,angle;
  if(edge===0){cx=x+size;cy=y+size;angle=Math.PI;}
  else if(edge===1){cx=x;cy=y+size;angle=-Math.PI/2;}
  else if(edge===2){cx=x+w-size;cy=y;angle=0;}
  else{cx=x+w;cy=y+h-size;angle=Math.PI/2;}
  const center=map(cx,cy),p=map(cx+Math.cos(angle)*size,cy+Math.sin(angle)*size),q=map(cx+Math.cos(angle+Math.PI/2)*size,cy+Math.sin(angle+Math.PI/2)*size),local=squareMap(center,p.map((v,j)=>v-center[j]),q.map((v,j)=>v-center[j]));
  const duration=.21*Math.pow(.86,depth-1),sq=addNatureSquare(local,size,depth,time,duration,owner.index,index,previous);rect.squares.push(sq.index);previous=sq.line;time=sq.end+.025;
  if(edge===0){x+=size;w-=size;}else if(edge===1){y+=size;h-=size;}else if(edge===2)w-=size;else h-=size;
 }
 // 先完整登记本层，随后递归，确保每个新格都有明确的上一层。
 for(const i of rect.squares)subdivideNatureSquare(natureSquares[i]);return rect;
}
function subdivideNatureSquare(square){
 if(square.depth>=NATURE_MAX_DEPTH||square.size*NATURE_SCALE<NATURE_MIN_CELL)return;
 const h=1/PHI,k=1-h,S=square.size,depth=square.depth+1,at=Math.max(square.end+.12,17.05),P=square.map;
 // 两个不相交的黄金矩形，以及右下角的余方格，恰好铺满所属方格。
 const first=addGoldenRectangle(square,(x,y)=>P(1-x/S,h-y/S),S,S*h,at,depth,square.line);
 addGoldenRectangle(square,(x,y)=>P(x/S,h+y/S),S*h,S*k,at+.14,depth,square.line);
 if(S*k*NATURE_SCALE>=2.1){
  const remaining=addNatureSquare((x,y)=>P(h+k*x,h+k*y),S*k,depth,at+.23,.22*Math.pow(.86,depth-1),square.index,-1,first.guide);
  subdivideNatureSquare(remaining);
 }
}
const mainGoldenTiles=goldenTiles.map(tile=>({...tile}));
for(let i=6;i<10;i++){
 const size=mainGoldenTiles[i-1].size+mainGoldenTiles[i-2].size,minX=Math.min(...mainGoldenTiles.map(g=>g.x)),minY=Math.min(...mainGoldenTiles.map(g=>g.y)),maxX=Math.max(...mainGoldenTiles.map(g=>g.x+g.size)),maxY=Math.max(...mainGoldenTiles.map(g=>g.y+g.size));
 if(i%4===2)mainGoldenTiles.push({x:minX,y:maxY,size,cx:minX,cy:maxY,angle:0});
 else if(i%4===3)mainGoldenTiles.push({x:minX-size,y:minY,size,cx:minX,cy:minY,angle:Math.PI/2});
 else if(i%4===0)mainGoldenTiles.push({x:minX,y:minY-size,size,cx:maxX,cy:minY,angle:Math.PI});
 else mainGoldenTiles.push({x:maxX,y:minY,size,cx:maxX,cy:maxY,angle:-Math.PI/2});
}
let previousMain=-1;
for(let i=0;i<mainGoldenTiles.length;i++){
 const g=mainGoldenTiles[i],ca=Math.cos(g.angle),sa=Math.sin(g.angle),map=(u,v)=>[g.cx-SEED[0]+g.size*(u*ca-v*sa),g.cy-SEED[1]+g.size*(u*sa+v*ca)];
 const at=i<6?14.8+i*.11:18.0+(i-6)*.95,square=addNatureSquare(map,g.size,0,at,i<6?.18:.86,i?i-1:-1,-1,previousMain,true);previousMain=square.line;
 // 开场已有的六段弧线和方格直接沿用原采样，交接时不重画、不隐去。
 if(i<6){const old=tileGeometry[i].arc.map(p=>p.map(v=>v*130/GRID_STEP)),line=natureGeometry[square.line];line.local=old;line.points=old.map(p=>naturePoint(0,p,30));}
}
for(const square of natureSquares.slice())subdivideNatureSquare(square);
const natureArcs=natureGeometry.filter(line=>line.kind==='arc');
const natureRoot=tileGeometry.at(-1).arc.at(-1).map(v=>v*130/GRID_STEP);
function natureFocus(t,state){return t<NATURE_START?state.core:naturePoint(0,[0,0],t,state);}
function flowerState(t,state){const alpha=smooth(t,16.36,16.7)*mix(1,.28,smooth(t,20.5,25.2)),size=mix(.72,.5,state.shrink||0);return {alpha,size,center:t<NATURE_START?state.center:natureFocus(t,state)};}

const barriers=[{a:[298,40],b:[480,194],margin:7},{a:[172,129],b:[197,340],margin:22},{a:[332,355],b:[492,275],margin:9}].map(w=>{
 const dx=w.b[0]-w.a[0],dy=w.b[1]-w.a[1],length=Math.hypot(dx,dy);let n=[-dy/length,dx/length];
 if((306-w.a[0])*n[0]+(188-w.a[1])*n[1]<0)n=n.map(v=>-v);
 return {...w,n,distance:p=>(p[0]-w.a[0])*n[0]+(p[1]-w.a[1])*n[1]};
});
// 一次动作分成伸出、停住蓄亮、铁花迸散；后一次等前一次已落下再起。
const traces=[{start:11.16,arrive:11.48,stop:11.74,cool:11.91,fn:u=>[320+64*u,183-54*u-12*u*u]},
 {start:12.20,arrive:12.55,stop:12.82,cool:13.00,fn:u=>[290-110*u,201+45*u-12*u*u]},
 {start:13.23,arrive:13.61,stop:13.90,cool:14.09,fn:u=>[318+112*u,211+110*u+9*u*u]}].map(tr=>{
 let hit=1;
 for(const wall of barriers){if(wall.distance(tr.fn(1))>=wall.margin+2.1)continue;
  let low=0,high=1;for(let i=0;i<40;i++){const mid=(low+high)/2;if(wall.distance(tr.fn(mid))>=wall.margin+2.1)low=mid;else high=mid;}hit=Math.min(hit,low);
 }
 return {...tr,hit};
});
function traceState(tr,time){const progress=smooth(time,tr.start,tr.arrive),charge=time>=tr.arrive&&time<tr.stop?smooth(time,tr.arrive,tr.stop):0;return {progress,charge,age:time-tr.stop,phase:time<tr.start?'waiting':time<tr.arrive?'extend':time<tr.stop?'hold':'spark'};}
function safePolygon(){let points=[[-900,-700],[1500,-700],[1500,1000],[-900,1000]];
 for(const wall of barriers){const result=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],da=wall.distance(a)-wall.margin,db=wall.distance(b)-wall.margin;if(da>=0)result.push(a);if((da>=0)!==(db>=0)){const q=da/(da-db);result.push([mix(a[0],b[0],q),mix(a[1],b[1],q)]);}}points=result;}
 return points;
}
const innerDomain=safePolygon();
function traceGeometry(time){return traces.map((tr,index)=>{const state=traceState(tr,time),tip=tr.fn(tr.hit*state.progress);return {...state,index,hitParameter:tr.hit,tip,clearance:barriers.map(w=>w.distance(tip)-w.margin),sparkAge:state.age};});}

function coordinateState(t){const keys=[[0,1],[4,.965],[4.5,1.18],[5,2],[5.5,3.18],[6,4.02],[6.5,4.85],[7,5.68],[7.5,6.54],[8,7.43],[8.5,8.15],[9.25,8.15]];let k=0;while(k<keys.length-2&&t>keys[k+1][0])k++;const zoom=mix(keys[k][1],keys[k+1][1],clamp((t-keys[k][0])/(keys[k+1][0]-keys[k][0]))),cx=320,cy=180+4*smooth(t,1.5,3)*(1-smooth(t,5.1,7)),tilt=0;
const origin=[cx,mix(cy,301,tilt)+17*smooth(t,8.05,8.53)],a=tilt*1.08,sinTilt=Math.sin(a),cosTilt=Math.cos(a);
function P(x,y){let dx=(x-cx)*zoom,dy=(y-cy)*zoom;const den=Math.max(.24,1-dy*sinTilt/650);return [cx+dx/den,origin[1]+dy*cosTilt/den];}

const appear=smooth(t,.04,.52);return {P,zoom,cx,cy,tilt,origin,appear};}
function boundaryState(t){const intro=smooth(t,256/30,11.16),out=smooth(t,14.35,15.6),angle=-.012*intro-.098*out-.018*smooth(t,11.2,14.1),scale=mix(1,GRID_STEP/PLANE_STEP,out),pitch=0;
 const motion=[[11.166667,304,190],[11.8,301,188],[12.4,296,188],[12.833333,292,188],[13.833333,286,186],[14.166667,286,186]];let j=0;while(j<motion.length-2&&t>motion[j+1][0])j++;const ma=motion[j],mb=motion[j+1],mq=clamp((t-ma[0])/(mb[0]-ma[0]));const tremor=quakeTremor(toPlaybackTime(t*1000)/1000),ox=(t<11.166667?mix(320,304,intro):mix(mix(ma[1],mb[1],mq),320,out))+tremor[0],oy=(t<11.166667?mix(197,190,intro):mix(mix(ma[2],mb[2],mq),180,out))+tremor[1];
 const viewScale=scale*mix(8.15*GRID_STEP/PLANE_STEP,1,intro),sa=Math.sin(angle),ca=Math.cos(angle);
 // 所有线、字、正方形共用这个投影，不再给回缩图形补偿一次缩放。
 function P(x,y){const dx=(x-306)*viewScale,dy=(y-188)*viewScale;return [ox+dx*ca-dy*sa,oy+dx*sa+dy*ca];}
 const center=P(...PLANE_CENTER);return {P,intro,out,angle,scale,viewScale,pitch,center};
}
function gridState(t){const release=smooth(t,23.15,24.55),turn=smooth(t,24.5,25.16),bend=smooth(t,19.5,23.77),shrink=smooth(t,18.9,20.2),rot=mix(-.128,.14,smooth(t,18.8,20.45)),core=[320,180+8*smooth(t,16.666667,19.0)];
 const endMove=smooth(t,25,26.8),camera=1,cosRot=Math.cos(rot),sinRot=Math.sin(rot);
 function P(x,y,extra=0){const dx=x-320,dy=y-184,ga=Math.exp(-(dx*dx+dy*dy)/33000),b=bend*(1+extra),xx=dx+b*(Math.sin(dy/51)*11+dx*ga*.23),yy=dy+b*(Math.sin(dx/59)*6+dy*ga*.25),wave=gridWave(t,x,y);return [core[0]+xx*cosRot-yy*sinRot+wave*.14,core[1]+xx*sinRot+yy*cosRot-wave];}
 return {P,release,turn,bend,shrink,rot,endMove,camera,core};
}

const duration=toPlaybackTime(806/30*1000),lastTime=805/30;
const specs=[
 {key:'light',id:null,name:'光点与暖晕接续',clock:[0,806/30],preview:11.2},
 {key:'sky',id:'star-twinkle',name:'深浅星点微明灭',clock:[0,806/30],preview:11.2},
 {key:'coordinates',id:'coordinate-grid-build',name:'瀑布网格黄金绘入',clock:[0,4.2],preview:3.9},
 {key:'zoom',id:'coordinate-focus-zoom',name:'坐标中心放大',clock:[4.2,256/30],preview:6.5},
 {key:'plane',id:'text-plane-tilt',name:'字符雨幕震动',clock:[256/30,500/30],preview:10.3},
 {key:'constraints',id:'boundary-curve-stop',name:'亮线蓄势打铁花',clock:[11.2,16.12],preview:13.0},
 {key:'return',id:'frame-ring-collapse',name:'黄金方格回缩',clock:[14.15,500/30],preview:15.1},
 {key:'fibres',id:'bounded-fibre-grow',name:'铁花持续绽放',clock:[16.36,806/30],preview:18.7},
 {key:'grid',id:null,name:'网格波次起伏',clock:[500/30,24.6],preview:23.0},
 {key:'flow',id:null,name:'黄金矩形递归生长',clock:[NATURE_START,806/30],preview:25.8},
 {key:'grid-flow',id:'grid-flow-unfold',name:'网格起伏黄金生长',clock:[500/30,806/30],preview:25.8}
];

function createPainter(doc){
 let grain=null,natureBatches=null,radialGrid=null,dead=false;
 const textContexts=new Set();
 function texture(ctx,t=0,alpha=.11){if(!grain){grain=doc.createElement('canvas');grain.width=640;grain.height=360;const gc=grain.getContext('2d');if(!gc)return;const im=gc.createImageData(640,360);for(let i=0;i<640*360;i++){const v=rand(i)*255;im.data[i*4]=im.data[i*4+1]=im.data[i*4+2]=v;im.data[i*4+3]=20;}gc.putImageData(im,0,0);}ctx.save();ctx.globalAlpha=alpha*smooth(t,.04,.52);ctx.drawImage(grain,0,0,640,360);ctx.restore();}
function drawCoordinate(ctx,t,state){const {P,zoom,cx,cy,tilt,appear}=state;
 function seg(x1,y1,x2,y2,col='#bbc4d4',width=.32,alpha=1){line(ctx,...P(x1,y1),...P(x2,y2),col,width*1.9*Math.min(zoom,1.7),alpha);}
 const ax=smooth(t,.08,.75),ay=smooth(t,.25,1.05);ctx.save();ctx.setLineDash([11*zoom,3*zoom,1.7*zoom,3*zoom]);seg(40,cy,mix(40,600,ax),cy,'#c4c4c3',.28,appear*.73);seg(cx,15,cx,mix(15,345,ay),'#c4c4c3',.28,appear*.73);ctx.restore();
 const g=gridLattice;
 for(let i=0;i<g.columns;i++){const x=cx+(i-g.xOffset)*GRID_STEP,a=waterfallProgress(t,'vertical',i*13/(g.columns-1)),y=mix(g.top,g.bottom,a);seg(x,g.top,x,y,'#bdc8db',.31,a*.83);if(a>0&&a<1)seg(x,Math.max(g.top,y-12),x,y,'#eef2f7',.45,.8);}
 for(let i=0;i<g.rows;i++){const y=cy+(i-g.yOffset)*GRID_STEP,a=waterfallProgress(t,'horizontal',i*9/(g.rows-1)),x=mix(g.left,g.right,a);seg(g.left,y,x,y,'#bdc8db',.31,a*.83);if(a>0&&a<1)seg(Math.max(g.left,x-15),y,x,y,'#eef2f7',.42,.75);}
 const minor=smooth(t,.9,2.5)*(1-smooth(t,7.8,8.8));if(minor>0){ctx.save();ctx.setLineDash([.4*zoom,2.8*zoom]);for(let i=-32;i<=32;i++){const a=waterfallProgress(t,'vertical',(i+32)*13/64);seg(cx+(i+.5)*GRID_STEP/3,g.top,cx+(i+.5)*GRID_STEP/3,mix(g.top,g.bottom,a),'#7b889e',.16,minor*.3);}for(let i=-19;i<=19;i++){const a=waterfallProgress(t,'horizontal',(i+19)*9/38);seg(g.left,cy+(i+.5)*GRID_STEP/3,mix(g.left,g.right,a),cy+(i+.5)*GRID_STEP/3,'#7b889e',.16,minor*.3);}ctx.restore();}
 const graph=smooth(t,1.15,3.15);motifShape(ctx,(x,y)=>P(cx+x,cy+y),130,graph,.92,.62*Math.min(zoom,1.7),t);innerScan(ctx,t,P,cx,cy,zoom);
 const tick=smooth(t,1.6,2.8);for(let i=-27;i<=27;i++){const x=cx+i*GRID_STEP/3,y=cy+i*GRID_STEP/3;seg(x,cy,x,cy+(i%3===0?4.1:1.8),'#c0c8d5',.21,tick*.85);seg(cx,y,cx+(i%3===0?4.1:1.8),y,'#c0c8d5',.21,tick*.85);}
 function word(s,x,y,size=3.6,ang=0,a=1){text(ctx,s,...P(x,y),size*zoom,'#c8cbd7',ang-tilt*.1,a,'"Courier New",monospace');}
 const dim=smooth(t,2.5,3.1);for(let i=-5;i<=5;i++)if(i)word(String(i),cx+i*GRID_STEP-1,cy+9,2.7,0,tick*.8);
 const model=smooth(t,4.7,5.1)*(1-smooth(t,8.55,8.85));seg(cx+2,cy-2,cx+8.7,cy-8.7,'#d0ced2',.19,model);seg(cx+8.7,cy-8.7,cx+28,cy-8.7,'#d0ced2',.19,model);word('WISE MOTION',cx+9.7,cy-9.8,2.4,0,model);word('INTENT + MOTION',cx+5.4,cy+7.4,1.8,0,model);
}
function drawPlane(ctx,t,state){const {P,intro,angle,scale,center}=state;
 const textIn=smooth(t,9.12,9.45),outer=1-smooth(t,9.25,9.7);
 // 中心正方形的四条边贯穿开场、文字段、回缩和波次网格。
 for(let i=-16;i<=16;i++){
  const y=188+(i+.5)*PLANE_STEP,x=306+(i+.5)*PLANE_STEP;
  path(ctx,[P(-5000,y),P(5500,y)],'#b0bdd2',.28,textIn*.7);
  if(textIn>0)planeText(ctx,i%2===0?top:bottom,P,-5000,y,10500,13.5,false,textIn*.97,t,i+10);
  path(ctx,[P(x,-5000),P(x,5500)],'#aebbd0',.28,textIn*.7);
  if(textIn>0)planeText(ctx,side,P,x,-5000,10500,13.5,true,textIn*.97,t,i+40);
 }
 if(outer>0){
  for(let i=-2;i<=2;i++){path(ctx,[P(306+(i+.5)*PLANE_STEP,-900),P(306+(i+.5)*PLANE_STEP,1100)],'#c0c5d0',.45,outer*.8);path(ctx,[P(-900,188+(i+.5)*PLANE_STEP),P(1500,188+(i+.5)*PLANE_STEP)],'#c0c5d0',.45,outer*.8);}
  motifShape(ctx,(x,y)=>P(306+x,188+y),130*PLANE_STEP/GRID_STEP,1,outer,.6,t);
 }
 ctx.save();ctx.setLineDash([58*scale,10*scale,5*scale,10*scale]);path(ctx,[P(-1700,188),P(2300,188)],'#b7b7b3',.39,.66);path(ctx,[P(306,-1500),P(306,1900)],'#b7b7b3',.39,.66);ctx.restore();
}

function drawConstraints(ctx,t,state){const {P,scale}=state,end=smooth(t,15.45,16.12),labels=['不够高级。','不够流畅。','没有质感。'];
 // 三处使用同一字号、颜色、字重和起亮方式；第三条朝右下撞击斜边。
 barriers.forEach((w,i)=>{const tr=traces[i],alpha=smooth(t,tr.arrive-.1,tr.arrive+.05)*(1-end),pa=P(...w.a),pb=P(...w.b),mid=P((w.a[0]+w.b[0])/2,(w.a[1]+w.b[1])/2);path(ctx,[pa,pb],'#e5e6e7',.68*scale,alpha);
  let angle=Math.atan2(pb[1]-pa[1],pb[0]-pa[0]);if(angle>Math.PI/2)angle-=Math.PI;if(angle<-Math.PI/2)angle+=Math.PI;ctx.save();ctx.textAlign='center';ctx.shadowBlur=1.25*scale;ctx.shadowColor='rgba(255,255,255,.35)';text(ctx,labels[i],mid[0]+Math.sin(angle)*7*scale,mid[1]-Math.cos(angle)*7*scale,15.3*scale,'#eeeef1',angle,alpha);ctx.restore();
 });
 for(let i=0;i<traces.length;i++){const tr=traces[i],motion=traceState(tr,t),q=tr.hit*motion.progress,cool=smooth(t,tr.cool,tr.cool+.15),pts=mapLine(u=>P(...tr.fn(u*q)),70);
  if(q>0){ctx.save();ctx.shadowColor='#ffd6a7';ctx.shadowBlur=(1-cool)*(2+motion.charge*2);path(ctx,pts,cool>.8?'#d88455':'#fff0cf',mix(1.65,1.35,cool)*scale,(1-end)*mix(1,.95,cool));ctx.restore();point(ctx,...P(...tr.fn(q)),(1-cool)*(1-end),(.35+motion.charge*.8)*scale);}
  // 停住时一小段亮线从后方追上端点，位置不越过文字边界。
  if(motion.phase==='hold'){const head=mix(.55,1,motion.charge);path(ctx,mapLine(u=>P(...tr.fn(tr.hit*mix(Math.max(0,head-.18),head,u))),18),'#fff9e9',2.3*scale,(1-end)*Math.sin(Math.PI*motion.charge));}
  if(motion.age>0&&motion.age<1.4){const hit=tr.fn(tr.hit);paintIron(ctx,impactBanks[i],motion.age,(x,y)=>P(hit[0]+x,hit[1]+y),1-end,Math.max(.4,scale));if(motion.age<.15)point(ctx,...P(...hit),(1-motion.age/.15)*(1-end),1.1*scale);}
 }
}
function drawReturn(ctx,t,state){const {P}=state,{alpha,radius}=returnAppearance(t,state);if(alpha<=0)return;
 motifShape(ctx,(x,y)=>P(306+x,188+y),radius,1,alpha,.64,Infinity,i=>returnTileReveal(t,i));
}

function ironFlower(ctx,t,state){
 if(t<16.36)return;const {alpha,size,center}=flowerState(t,state),now=t-16.36,latest=Math.floor(now/.7);
 // 同一团铁花随生长中心移动，后段只减弱，不再整团退场。
 const project=(x,y)=>t<NATURE_START?[center[0]+x*size,center[1]+y*size]:naturePoint(0,[x*size/GRID_STEP,y*size/GRID_STEP],t,state);
 for(let k=Math.max(0,latest-1);k<=latest;k++){const age=now-k*.7;paintIron(ctx,flowerBanks[k%flowerBanks.length],age,project,alpha,.72);}
}

function drawEarlyFibres(ctx,t,state){ironFlower(ctx,t,state);}
function drawGrid(ctx,t,state){const {P,core,release,bend}=state;
const textFade=1-smooth(t,23.35,24.6),fine=smooth(t,20.04,20.64),unit=gridCellStep(t),typeScale=mix(13.5*GRID_STEP/PLANE_STEP/3.5,1,smooth(t,16.666667,18.3));
// 回缩留下的黄金弧线由持续生长层接续，网格层不再将它淡出。
// 主文字网格贯穿全幅。随着镜头转动、拉伸和弯曲，字也跟着网格变形。
if(textFade>0){for(let i=-13;i<=13;i++){const x=320+(i+.5)*unit,y=184+(i+.5)*unit;const f=u=>P(x,-95+u*550),g=u=>P(-110+u*860,y);path(ctx,mapLine(f), '#aebbd1',.33,textFade*.66);path(ctx,mapLine(g),'#aebbd1',.33,textFade*.66);onCurve(ctx,words,f,3.5,'#c0c7d6',textFade*.8,t,i+70,true,typeScale);onCurve(ctx,words,g,3.5,'#c0c7d6',textFade*.8,t,i+100,false,typeScale);}}
// 细网格从中心铺开，与黄金矩形接续生长共用当前时间。
if(fine>0&&release<1){const fade=fine*(1-release),grow=smooth(t,20.03,20.55);ctx.save();ctx.beginPath();ctx.rect(320-440*grow,184-300*grow,880*grow,600*grow);ctx.clip();for(let i=-28;i<=28;i++){const step=unit/2,x=320+i*step,y=184+i*step;path(ctx,mapLine(u=>P(x,-50+u*470,.35),75),'#c1b7a4',.18,fade*.42);path(ctx,mapLine(u=>P(-70+u*790,y,.35),90),'#c1b7a4',.18,fade*.42);}ctx.restore();}
if(fine>0&&release<1){
 // 半径、方向系数和虚线样式不随时间变化；点坐标仍逐帧按原运算顺序计算。
 radialGrid??=Array.from({length:320},(_,i)=>{const angle=i/320*6.283;return {angle,cross:Math.sin(angle)*Math.cos(angle),curve:.75+.3*Math.cos(2*angle+.8),vertical:Math.cos(2*angle+.4),samples:mapLine(u=>{const r=mix(12,790,u);return {r,falloff:1-Math.exp(-r*r/18000),log:Math.log(1+r/35),waveX:Math.sin(r/70+angle*2)*2.2,waveY:Math.sin(r/90+angle*3)*1.4};},75),points:Array.from({length:76},()=>[0,0]),visible:[],dash:[30+rand(i+47)*68,4+rand(i+31)*14,7+rand(i+52)*21,9+rand(i+65)*31],speed:8+rand(i+31)*22,width:.35+rand(i+73)*.25,alpha:.4+rand(i+11)*.29};});
 const opacity=fine*(1-release),visibleCount=visibleRaySamples(core);for(let i=0;i<radialGrid.length;i++){const ray=radialGrid[i],pts=ray.points;
  ray.visible.length=visibleCount;for(let j=0;j<visibleCount;j++)ray.visible[j]=pts[j];
  for(let j=0;j<visibleCount;j++){const sample=ray.samples[j],r=sample.r,bendAmount=bend*sample.falloff,an=ray.angle+.12*bendAmount*sample.log*ray.curve;let x=Math.cos(an)*r,y=Math.sin(an)*r;x+=bendAmount*r*.12*ray.cross;y+=bendAmount*r*.055*ray.vertical;x+=sample.waveX*bendAmount;y+=sample.waveY*bendAmount;pts[j][0]=core[0]+x;pts[j][1]=core[1]+y;}
  path(ctx,ray.visible,i%13===0?'#92a5a5':'#b9a28b',.22,opacity*.35);ctx.save();ctx.setLineDash(ray.dash);ctx.lineDashOffset=-t*ray.speed;strokeCurrentPath(ctx,i%13===0?'#bcc6c0':'#decaaf',ray.width,opacity*ray.alpha);ctx.restore();
 }
}
}
function drawFibres(ctx,t,state){ironFlower(ctx,t,state);}

function prepareNature(ctx){if(dead||natureBatches)return;const Path=doc.defaultView?.Path2D||global.Path2D,groups=new Map();
 // 按绘制样式和完成时间分组；时间决定生长次序，已完成的整组复用路径。
 for(const line of natureGeometry){const key=line.style+':'+Math.ceil((line.at+line.duration)*4);if(!groups.has(key))groups.set(key,{style:line.style,lines:[],ready:0});const batch=groups.get(key);batch.lines.push(line);batch.ready=Math.max(batch.ready,line.at+line.duration);}
 natureBatches=[...groups.values()].map(batch=>{const path=new Path();for(const line of batch.lines)line.local.forEach((p,i)=>i?path.lineTo(...p):path.moveTo(...p));return {...batch,path};});
}
function drawFlow(ctx,t,state){if(t<NATURE_START)return;prepareNature(ctx);const m=state.natureCamera??=natureCamera(t),scale=Math.hypot(m.a,m.b),tips=[];
 ctx.save();ctx.transform(m.a,m.b,m.c,m.d,m.x,m.y);
 for(const batch of natureBatches){const style=natureStyles[batch.style];ctx.strokeStyle=style.color;ctx.lineWidth=style.width/scale;ctx.globalAlpha=natureAlpha(batch,t);
  if(t>=batch.ready){ctx.stroke(batch.path);continue;}
  ctx.beginPath();let drawn=false;
  for(const line of batch.lines){const q=natureProgress(t,line);if(q<=0)continue;const pts=q===1?line.local:partialPath(line.local,q);pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));drawn=true;
   if(line.kind==='arc'&&q<1&&tips.length<36)tips.push({point:pts.at(-1),size:line.style===0?.40:.18,alpha:line.style===0?.75:.38});
  }
  if(drawn)ctx.stroke();
 }
 ctx.restore();for(const tip of tips)point(ctx,...naturePoint(0,tip.point,t,state),tip.alpha,tip.size);
 ctx.save();ctx.fillStyle='#fff1cf';for(let i=0;i<144;i++){const line=natureArcs[(i*47)%natureArcs.length];if(natureProgress(t,line)<1)continue;const u=mod(t*.055+rand(i+9),1),p=line.local[Math.floor(u*(line.local.length-1))],v=naturePoint(0,p,t,state);ctx.globalAlpha=.24+rand(i+30)*.36;ctx.fillRect(v[0],v[1],.52,.52);}ctx.restore();
}

function pose(t){return t<256/30?coordinateState(t):t<500/30?boundaryState(t):gridState(t);}
function background(ctx,t,state){if(t<256/30){const warm=smooth(t,7.8,8.7),appear=smooth(t,.04,.52);ctx.fillStyle=`rgb(${mix(1,8,warm)*appear} ${mix(6,6,warm)*appear} ${mix(13,3,warm)*appear})`;}else ctx.fillStyle=t<500/30?'#080602':'#070501';ctx.fillRect(0,0,640,360);const center=state.origin||state.center||natureFocus(t,state);glow(ctx,...center,210,1,true,t);
 if(t>=500/30&&state.release>0){ctx.save();const shade=ctx.createRadialGradient(...center,0,...center,430);shade.addColorStop(0,'rgba(0,0,0,0)');shade.addColorStop(.12,'rgba(0,0,0,.04)');shade.addColorStop(.36,'rgba(0,0,0,.08)');shade.addColorStop(1,'rgba(0,0,0,.17)');ctx.globalAlpha=state.release;ctx.fillStyle=shade;ctx.fillRect(0,0,640,360);ctx.restore();}
}
function sky(ctx,t){dust(ctx,t,t<256/30?.48:t<500/30?.86:mix(.55,.8,smooth(t,23.87,24.2)));}
function core(ctx,t,state){const center=state.origin||state.center||natureFocus(t,state);
 if(t>=500/30){const {release}=state,core=center; light(ctx,...core,t);if(release>.75){point(ctx,...core,smooth(t,24.08,24.28),1.55);const flare=ctx.createLinearGradient(core[0]-210,core[1],core[0]+210,core[1]);flare.addColorStop(0,'rgba(245,223,182,0)');flare.addColorStop(.45,'rgba(250,228,194,.08)');flare.addColorStop(.5,'rgba(255,247,226,.34)');flare.addColorStop(.55,'rgba(250,228,194,.08)');flare.addColorStop(1,'rgba(245,223,182,0)');ctx.save();ctx.globalCompositeOperation='screen';ctx.strokeStyle=flare;ctx.lineWidth=.4;ctx.beginPath();ctx.moveTo(core[0]-210,core[1]);ctx.lineTo(core[0]+210,core[1]);ctx.stroke();ctx.restore();} }
 else{light(ctx,...center,t,t<256/30?state.appear:1);if(t<256/30){line(ctx,center[0],center[1]-7,center[0],center[1]+7,'#fff2d2',.38,state.appear*.65);line(ctx,center[0]-11,center[1],center[0]+11,center[1],'#ffe5bf',.3,state.appear*.4);}}
}
function drawLayer(ctx,key,t,state=pose(t),standalone=false){
 textContexts.add(ctx);
 if(key==='light'){background(ctx,t,state);core(ctx,t,state);return;}
 if(key==='sky'){sky(ctx,t);return;}
 if(key==='grid-flow'){drawLayer(ctx,'grid',t,state,standalone);drawLayer(ctx,'flow',t,state,standalone);return;}
 if(key==='coordinates'&&t<4.2)drawCoordinate(ctx,t,state);
 if(key==='zoom'&&t>=4.2&&t<256/30)drawCoordinate(ctx,t,state);
 if(key==='plane'&&t>=256/30&&t<500/30)drawPlane(ctx,t,state);
 if(key==='constraints'&&t>=11.2&&t<500/30)drawConstraints(ctx,t,state);
 if(key==='return'&&t>=14.15&&t<500/30)drawReturn(ctx,t,state);
 if(key==='fibres'&&t>16.36){if(t<500/30)drawEarlyFibres(ctx,t,state);else drawFibres(ctx,t,state,standalone);}
 if(key==='grid'&&t>=500/30)drawGrid(ctx,t,state);
 if(key==='flow'&&t>=NATURE_START)drawFlow(ctx,t,state);
}
function composite(ctx,t){const state=pose(t);background(ctx,t,state);if(t>=256/30&&t<500/30)sky(ctx,t);
 for(const key of ['coordinates','zoom','plane','constraints','return','grid','fibres','flow'])drawLayer(ctx,key,t,state);
 core(ctx,t,state);if(t<256/30||t>=500/30)sky(ctx,t);texture(ctx,t,t<256/30?.11:.12);
}
function destroy(){if(dead)return;dead=true;for(const ctx of textContexts)measuredWidths.delete(ctx);for(const ctx of textContexts)releaseGlyphs(ctx);textContexts.clear();if(grain){grain.width=1;grain.height=1;grain=null;}natureBatches=radialGrid=null;}
return {composite,drawLayer,background,core,texture,pose,prepareNature,destroy};
}

function make(root,kit,definition={},only){
 const doc=root.ownerDocument,box=doc.createElement('div');Object.assign(box.style,{position:'absolute',inset:'0',overflow:'hidden',background:'#070501'});root.replaceChildren(box);
 function surface(key,parent=box,lazy=false){const node=doc.createElement('canvas');node.width=lazy?1:1280;node.height=lazy?1:720;if(key)node.dataset.layer=key;node.setAttribute('role','img');node.setAttribute('aria-label',definition.name||(only?specs.find(s=>s.key===only).name:'黄金矩形递归生长'));Object.assign(node.style,{position:'absolute',inset:'0',width:'640px',height:'360px',font:'16px Times',fontFeatureSettings:'normal',fontSynthesis:'weight style',webkitFontSmoothing:'auto',textRendering:'auto'});parent.append(node);return {node,c:lazy?null:node.getContext('2d',{alpha:!!only})};}
 const layerHost=only?null:doc.createElement('div'),layers={};
 if(layerHost){Object.assign(layerHost.style,{position:'absolute',inset:'0',visibility:'hidden'});box.append(layerHost);for(const key of ['light','sky','coordinates','zoom','plane','constraints','return','grid','fibres','flow'])layers[key]=surface(key,layerHost,true);layers.core=surface('light',layerHost,true);}
 const full=surface(only),painter=full.c?createPainter(doc):null,spec=specs.find(s=>s.key===only);
 let dead=false,previous=-1,local=0,inspecting=false;
 const limit=definition.duration_ms||(spec?toPlaybackTime(spec.clock[1]*1000)-toPlaybackTime(spec.clock[0]*1000):duration);
 function reset(c,clear=true){c.setTransform(2,0,0,2,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.shadowBlur=0;c.filter='none';c.font='10px sans-serif';c.fillStyle='#000000';c.strokeStyle='#000000';c.lineWidth=1;c.lineDashOffset=0;c.lineCap='butt';c.lineJoin='miter';c.shadowColor='rgba(0,0,0,0)';c.textAlign='left';c.textBaseline='alphabetic';c.setLineDash([]);if(clear)c.clearRect(0,0,640,360);}
 function paintLayers(){if(!painter||!layerHost)return;const state=painter.pose(local);
  for(const [key,layer]of Object.entries(layers)){if(!layer.c){layer.node.width=1280;layer.node.height=720;layer.c=layer.node.getContext('2d');}if(!layer.c)return;reset(layer.c);if(key==='light')painter.background(layer.c,local,state);else if(key==='core')painter.core(layer.c,local,state);else painter.drawLayer(layer.c,key,local,state);}
 }
 const Observer=doc.defaultView?.MutationObserver;
 const observer=layerHost&&Observer?new Observer(()=>{if(dead)return;inspecting=!!layerHost.querySelector('[data-composition-hidden]');full.node.style.visibility=inspecting?'hidden':'visible';layerHost.style.visibility=inspecting?'visible':'hidden';if(inspecting)paintLayers();}):null;
 observer?.observe(layerHost,{subtree:true,attributes:true,attributeFilter:['data-composition-hidden']});
 const render=(ms,state={})=>{if(dead)return;if(!Number.isFinite(ms))throw new TypeError('时间必须是有限数字');ms=clamp(ms,0,limit);if(ms===previous&&!state.force)return;previous=ms;
  local=Math.min(lastTime,toSourceTime((spec?toPlaybackTime(spec.clock[0]*1000):0)+ms)/1000);
  // 独立动作段尾保留最后一个有效采样，避免刚好越过部件的结束边界而变成空帧。
  if(spec)local=Math.min(local,spec.clock[1]-1/30000);
  box.dataset.time=local.toFixed(6);box.dataset.part=only||'composition';
  if(painter){reset(full.c,!!only);if(only){if(only!=='light'){full.c.fillStyle='#070501';full.c.fillRect(0,0,640,360);}painter.drawLayer(full.c,only,local,painter.pose(local),true);painter.texture(full.c,local);}else painter.composite(full.c,local);if(inspecting)paintLayers();}
 };
 render.frameRate=30;
 render.ready=Promise.resolve(doc.fonts?.ready).then(()=>{if(dead)return;for(const layer of [full,...Object.values(layers)])if(layer.c){measuredWidths.delete(layer.c);releaseGlyphs(layer.c);if(!only||['plane','grid-flow'].includes(only))warmGlyphs(layer.c);}if(painter&&!definition.poster_only&&(!only||only==='grid-flow'))painter.prepareNature(full.c);render(Math.max(previous,0),{force:true});});
 render.destroy=(preserve=false)=>{if(dead)return;dead=true;observer?.disconnect();painter?.destroy();if(full.c){measuredWidths.delete(full.c);releaseGlyphs(full.c);}for(const layer of Object.values(layers)){if(layer.c){measuredWidths.delete(layer.c);releaseGlyphs(layer.c);}layer.node.width=1;layer.node.height=1;layer.c=null;}layerHost?.remove();full.node.style.visibility='visible';if(!preserve){full.node.width=1;full.node.height=1;root.replaceChildren();}full.c=null;};
 render(0);return render;
}
const F=global.MotionFactories=global.MotionFactories||{};
for(const s of specs)if(s.id&&s.key!=='sky'){F[s.id]=(root,kit,def)=>make(root,kit,def,s.key);F[s.id].requiresPreparation=true;}
const priorStars=F['star-twinkle'];
F['star-twinkle']=(root,kit,def={})=>def.variant_id==='layered-night'?make(root,kit,def,'sky'):priorStars(root,kit,def);
F['point-domain-flow-sequence']=(root,kit,def)=>make(root,kit,def);
F['point-domain-flow-sequence'].requiresPreparation=true;
const details={
 light:'精细白核、暖棕光晕持续跟随同一生长中心。',
 sky:'180颗固定深度细星微漂移、微幅明灭。',
 coordinates:'坐标线瀑布绘入；中心正方形依次接出1、1、2、3、5、8格，弧线留在所属格内，内侧节点依次扫描。',
 zoom:'围绕第一块正方形中心连续放大，两秒接入文字平面。',
 plane:'横排文字沿网格流动，竖排文字自上而下；震动使单字抬起、落下并衰减反弹。',
 constraints:'三条亮线依次延伸、停驻蓄亮、打出分叉铁花；三处痛点字的字号和颜色一致。',
 return:'镜头缩小后重现同一组黄金方格，描边与文字网格吻合。',
 fibres:'同一团铁花持续绽放，随黄金图形的生长中心移动。',
 grid:'横纵网格按距离传递波次，文字跟随同一表面起伏。',
 flow:'从原有黄金方格向外接续，再在父级方格内递归分割；2002个黄金矩形、9383个方格与弧线形成满幅图案。'
};
F['point-domain-flow-sequence'].breakdown=specs.filter(s=>s.key!=='grid-flow').map(s=>{
 const start=toPlaybackTime(s.clock[0]*1000),end=toPlaybackTime(s.clock[1]*1000);
 return {id:s.key,name:s.name,actions:s.id?[s.id]:['grid','flow'].includes(s.key)?['grid-flow-unfold']:[],start,end,time:start===0&&end===duration?'全片':`${(start/1000).toFixed(2)}–${(end/1000).toFixed(2)}秒`,detail:details[s.key]};
});
global.WisePointDomainFlow=Object.freeze({duration,lastTime:toPlaybackTime(lastTime*1000),frames:Math.round(duration*30/1000),fps:30,specs,createPainter,traceGeometry,traces,SEED,GRID_STEP,PLANE_STEP,gridLattice,planeGridPoint,gridTilePoint,gridCellStep,returnTileReveal,mainGoldenTiles,natureRectangles,natureSquares,natureStyles,natureGeometry,natureArcs,natureProgress,naturePoint,natureMorph,natureCamera,natureFocus,natureAlpha,natureRoot,flowerState,NATURE_START,NATURE_MORPH_START,NATURE_MORPH_END,NATURE_SCALE,PHI,visibleRaySamples,gridState,glyphStats,motifPoint,goldenGeometry,goldenTiles,tileTimings,tileReveal,tileGridReady,SCAN_START,SCAN_DURATION,rainGlyphs,glyphQuake,quakeTremor,scanTick,innerScanState,returnAppearance,toPlaybackTime,toSourceTime,waterfallProgress,gridWave,waveProfiles,sparkGeometry,impactBanks,flowerBanks});
global.FieldSequenceClock=Object.freeze({duration,lastTime:toPlaybackTime(lastTime*1000),fps:30,frames:Math.round(duration*30/1000)});
})(globalThis);
