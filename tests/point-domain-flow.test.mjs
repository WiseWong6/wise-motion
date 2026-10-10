// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
// 记录真实提交的画布指令，验证几何、时钟、复用与资源释放；不代替视觉验收。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {data,environment} from './helpers.mjs';
const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
const composition=data.effects.find(e=>e.id==='point-domain-flow-sequence');
const fresh=data.effects.filter(e=>e.source.path==='catalog/effects/point-domain-flow.js');
function recorder(w){
 const contexts=[],cache=new WeakMap();let pathCount=0;
 class Shape{constructor(){this.hash=7;this.count=0;}add(op,args){this.count++;for(const n of args){assert.ok(Number.isFinite(n));this.hash=(Math.imul(this.hash,31)+(Math.round(n*1e6)|0))|0;}this.hash=(this.hash+op)|0;}moveTo(...a){this.add(1,a);}lineTo(...a){this.add(2,a);}}
 w.Path2D=class extends Shape{constructor(){super();pathCount++;}};
 w.HTMLCanvasElement.prototype.getContext=function(kind,options){if(cache.has(this))return cache.get(this);let style={font:'10px sans-serif',fillStyle:'#000000',strokeStyle:'#000000',globalAlpha:1},stack=[],transform=[],path=new Shape(),commands=[];
 const numbers=a=>{for(const n of a)if(typeof n==='number')assert.ok(Number.isFinite(n));};
 const record=(op,a)=>{numbers(a);commands.push([op,a,{...style},transform.slice()]);};
 const api={canvas:this,options,reset(){commands=[];},get commands(){return commands;},digest(){return createHash('sha256').update(JSON.stringify(commands)).digest('hex');},save(){stack.push([{...style},transform.slice()]);},restore(){assert.ok(stack.length);[style,transform]=stack.pop();},beginPath(){path=new Shape();},moveTo(...a){path.moveTo(...a);},lineTo(...a){path.lineTo(...a);},arc(...a){path.add(3,a);},rect(...a){path.add(4,a);},closePath(){path.add(5,[]);},stroke(p){const s=p||path;record('stroke',[s.hash,s.count]);},fill(){record('fill',[path.hash,path.count]);},clip(){record('clip',[path.hash,path.count]);},fillRect(...a){record('rect',a);},clearRect(...a){record('clear',a);},fillText(...a){record('text',a);},setLineDash(a){style.dash=[...a];},setTransform(...a){numbers(a);transform=[['set',...a]];},translate(...a){numbers(a);transform.push(['translate',...a]);},rotate(...a){numbers(a);transform.push(['rotate',...a]);},scale(...a){numbers(a);transform.push(['scale',...a]);},transform(...a){numbers(a);transform.push(['matrix',...a]);},measureText(s){const size=Number(style.font.match(/([\d.]+)px/)?.[1]||10);return {width:[...s].reduce((v,c)=>v+(c.charCodeAt(0)>255?1:.58)*size,0)};},createRadialGradient(...a){const stops=[];return {a,stops,addColorStop(...s){stops.push(s);}};},createLinearGradient(...a){const stops=[];return {a,stops,addColorStop(...s){stops.push(s);}};},createImageData(width,height){return {data:new Uint8ClampedArray(width*height*4)};},putImageData(){},drawImage(image,...a){record('image',[image.width,image.height,...a]);}};
 const ctx=new Proxy(api,{get:(o,k)=>k in o?o[k]:style[k],set(o,k,v){if(k in o)o[k]=v;else style[k]=v;return true;}});cache.set(this,ctx);contexts.push(ctx);return ctx;};
 return {contexts,get paths(){return pathCount;}};
}

async function env(){
 const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'file:///wise-motion/catalog/index.html',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.ResizeObserver=class{observe(){}disconnect(){}};const rec=recorder(w);
 for(const file of ['vendor/animejs/anime.umd.min.js','catalog/runtime.js','catalog/effects/reel-neon.js','catalog/effects/point-domain-flow.js'])w.eval(await read(file));
 return {w,rec,close(){w.MotionRuntime.disposeAll();w.anime.engine.pause();w.close();}};
}
async function setup(){const e=await env(),root=e.w.document.getElementById('root'),draw=e.w.MotionFactories[composition.id](root,e.w.MotionKit,composition);await draw.ready;const ctx=e.rec.contexts[0];return {...e,root,draw,ctx,at(ms,state){draw(e.w.WisePointDomainFlow.toPlaybackTime(ms),state);},close(){draw.destroy();e.close();}};}
test('正方形共用已绘网格，顺序拼接不重叠，弧线位于所属格内',async()=>{
 const e=await setup();try{const a=e.w.WisePointDomainFlow;assert.deepEqual(Array.from(a.goldenTiles,t=>t.size),[1,1,2,3,5,8]);let area=0;
 for(let i=0;i<6;i++){const tile=a.goldenTiles[i],g=a.goldenGeometry(i),timing=a.tileTimings[i];area+=tile.size**2;assert.ok(a.tileGridReady(timing.start,i));assert.equal(a.tileReveal(timing.start-.001,i),0);assert.equal(a.tileReveal(timing.end,i),1);if(i)assert.ok(timing.start>a.tileTimings[i-1].end);
  for(const [x,y]of g.arc){assert.ok(x>=g.square[0][0]-1e-9&&x<=g.square[1][0]+1e-9);assert.ok(y>=g.square[0][1]-1e-9&&y<=g.square[2][1]+1e-9);}
  for(const [x,y]of g.square){assert.ok(Math.abs((x*130/a.GRID_STEP+a.gridLattice.xOffset)-Math.round(x*130/a.GRID_STEP+a.gridLattice.xOffset))<1e-8);assert.ok(Math.abs((y*130/a.GRID_STEP+a.gridLattice.yOffset)-Math.round(y*130/a.GRID_STEP+a.gridLattice.yOffset))<1e-8);}
  if(i<5)assert.ok(Math.hypot(...g.arc.at(-1).map((v,j)=>v-a.goldenGeometry(i+1).arc[0][j]))<1e-9);
  for(let j=0;j<i;j++){const other=a.goldenTiles[j];assert.ok(Math.min(tile.x+tile.size,other.x+other.size)<=Math.max(tile.x,other.x)||Math.min(tile.y+tile.size,other.y+other.size)<=Math.max(tile.y,other.y));}
 }
 const seedTiming=a.tileTimings[0];for(const fraction of [.35,.65,.88]){e.ctx.reset();e.at((seedTiming.start+(seedTiming.end-seedTiming.start)*fraction)*1000,{force:true});const outlines=e.ctx.commands.filter(c=>c[0]==='stroke'&&c[2].strokeStyle==='#d9dfeb');assert.equal(outlines.length,1);assert.equal(outlines[0][1][1],5);}
 assert.equal(area,13*8);assert.ok(a.SCAN_START>a.tileTimings.at(-1).end);assert.ok(a.SCAN_DURATION>.5);
 for(let j=0;j<36;j++){const at=a.SCAN_START+j/36*a.SCAN_DURATION;assert.equal(a.innerScanState(at-.001).nodes[j],0);assert.ok(a.innerScanState(at+.001).nodes[j]>.1);}
 e.ctx.reset();e.at(2500,{force:true});assert.ok(e.ctx.commands.some(c=>c[0]==='stroke'&&c[2].strokeStyle==='#d9dfeb'));
 e.ctx.reset();e.at(3500,{force:true});assert.ok(e.ctx.commands.some(c=>c[0]==='stroke'&&c[2].strokeStyle==='#e8fff5'));
 }finally{e.close();}
});

test('地震让字符离地、落地与衰减反弹，镜头只作小幅震颤',async()=>{
 const e=await setup();try{const a=e.w.WisePointDomainFlow,painter=a.createPainter(e.w.document);assert.equal(a.glyphQuake(6.9,3,306,188).height,0);let heights=[];for(let t=7;t<9.5;t+=.005)heights.push(a.glyphQuake(t,3,306,188).height);assert.ok(Math.max(...heights)>3);let peaks=0;for(let i=1;i<heights.length-1;i++)if(heights[i]>heights[i-1]&&heights[i]>heights[i+1])peaks++;assert.ok(peaks>=3);assert.equal(a.glyphQuake(9.5,3,306,188).height,0);
 let centers=[];for(let ms=7000;ms<=8000;ms+=25){const state=painter.pose(a.toSourceTime(ms)/1000);assert.equal(state.pitch,0);centers.push(state.center);}assert.ok(Math.max(...centers.map(p=>p[0]))-Math.min(...centers.map(p=>p[0]))<13);assert.ok(Math.max(...centers.map(p=>p[1]))-Math.min(...centers.map(p=>p[1]))<9);
 for(let t=7;t<8.8;t+=.03){const q=a.quakeTremor(t);assert.ok(Math.abs(q[0])<1.5&&Math.abs(q[1])<1);for(let id=0;id<10;id++){const s=a.glyphQuake(t,id,306,188);assert.ok(s.height>=0&&s.height<25);assert.ok(Object.values(s).every(Number.isFinite));}}
 let previous=a.glyphQuake(6.99,3,306,188);for(let t=6.992;t<9.2;t+=.002){const current=a.glyphQuake(t,3,306,188);assert.ok(Math.abs(current.lateral-previous.lateral)<.18);assert.ok(Math.abs(current.angle-previous.angle)<.04);previous=current;}painter.destroy();
 }finally{e.close();}
});

test('文字沿正方向流动，同字保持连续，竖排字不整体转九十度',async()=>{
 const e=await setup();try{const a=e.w.WisePointDomainFlow;for(const lane of [5,18,45,72,106]){const first=a.rainGlyphs('审美节奏构图层次',500,13.5,1,lane),next=a.rainGlyphs('审美节奏构图层次',500,13.5,1.1,lane);for(const glyph of first){const after=next.find(g=>g.index===glyph.index);if(!after)continue;assert.equal(after.char,glyph.char);assert.ok(after.at>glyph.at);assert.ok(Math.abs(after.at-glyph.at-glyph.speed*.1)<1e-7);}assert.ok(new Set(first.map(g=>g.alpha)).size>=7);}
 e.ctx.reset();e.at(11500,{force:true});const glyphImages=e.ctx.commands.filter(c=>c[0]==='image'&&c[1][0]===1024);assert.ok(glyphImages.length>20);assert.ok(!glyphImages.some(c=>c[3].some(t=>t[0]==='rotate'&&Math.abs(t[1]-Math.PI/2)<1e-8)));
 }finally{e.close();}
});

test('三处文字字号颜色相同，第三次轨迹朝右下且分别到达对应边界',async()=>{
 const e=await setup();try{const api=e.w.WisePointDomainFlow;for(const [i,{stop}]of api.traces.entries()){const geom=api.traceGeometry(stop)[i];assert.ok(Math.abs(geom.clearance[i]-2.1)<1e-6);assert.ok(Math.min(...geom.clearance)>2.09999);assert.ok(api.sparkGeometry(api.impactBanks[i],.15).length>=350);}
 const third=api.traceGeometry(api.traces[2].stop)[2].tip;assert.ok(third[0]>395&&third[1]>295);const before=api.traceGeometry(api.traces[2].start)[2].tip;assert.ok(third[0]-before[0]>70&&third[1]-before[1]>80);
 e.ctx.reset();e.at(14000,{force:true});const texts=e.ctx.commands.filter(c=>c[0]==='text'&&['不够高级。','不够流畅。','没有质感。'].includes(c[1][0]));assert.equal(texts.length,3);assert.equal(new Set(texts.map(c=>c[2].font)).size,1);assert.equal(new Set(texts.map(c=>c[2].fillStyle)).size,1);assert.ok(texts.every(c=>c[2].fillStyle==='#eeeef1'));
 for(const ms of api.traces.map(t=>(t.stop+.18)*1000)){e.ctx.reset();e.at(ms,{force:true});assert.ok(e.ctx.commands.filter(c=>c[0]==='stroke'&&c[2].strokeStyle==='#ffdda0').length>=4);}
 }finally{e.close();}
});

test('铁花使用分叉弧线亮尾，成圆段没有旋转辐条，保留320条径向线，末段亮点沿黄金弧线流动',async t=>{
 const e=await setup();try{const a=e.w.WisePointDomainFlow;assert.equal(a.impactBanks[0].length,480);assert.equal(a.flowerBanks[0].length,360);const sparks=a.sparkGeometry(a.impactBanks[0],.3);assert.ok(sparks.some(p=>Math.hypot(p.head[0]-p.back[0],p.head[1]-p.back[1])>3));assert.ok(a.impactBanks[0].some(p=>p.birth>.16));
 for(const ms of [17000,18500,21500]){e.ctx.reset();e.at(ms,{force:true});assert.ok(e.ctx.commands.some(c=>c[0]==='stroke'&&c[2].strokeStyle==='#dd772b'));}
 e.ctx.reset();e.at(22500,{force:true});assert.equal(e.ctx.commands.filter(c=>c[0]==='stroke'&&['#92a5a5','#b9a28b'].includes(c[2].strokeStyle)).length,320);
 e.ctx.reset();e.at(26000,{force:true});assert.equal(e.ctx.commands.filter(c=>c[0]==='rect'&&c[2].fillStyle==='#fff1cf').length,144);
 t.diagnostic('每处撞击480条主粒子和分叉轨迹；中心成圆每轮360条轨迹，分组绘制亮尾，无逐粒子模糊。');
 }finally{e.close();}
});

test('波次按空间距离传递，远点延后、同距离同步，文字和细网格共用起伏表面',async()=>{
 const e=await env();try{const a=e.w.WisePointDomainFlow,w=a.waveProfiles[0],time=w.at+.2;assert.ok(a.gridWave(time,320,184)>4);assert.equal(a.gridWave(time,510,184),0);assert.ok(Math.abs(a.gridWave(w.at+.7,370,184)-a.gridWave(w.at+.7,320,234))<1e-10);assert.ok(a.gridWave(w.at+1.2,510,184)>4);assert.equal(a.gridWave(24.3,320,184),0);
 for(const t of [17.4,20.4,21.1,22.7]){const state=a.gridState(t),p=state.P(320,184),z=a.gridWave(t,320,184);assert.ok(Math.abs(p[1]-(state.core[1]-z))<1e-9);assert.ok(Math.abs(p[0]-(state.core[0]+z*.14))<1e-9);}

 }finally{e.close();}
});

test('画面可乱序重现、字形与弧线不重建，销毁后释放画布',async t=>{
 const e=await setup();try{const api=e.w.WisePointDomainFlow,prepared=api.glyphStats(e.ctx),paths=e.rec.paths,values=[0,1000,1600,3500,6300,9300,11800,12950,13980,15100,16600,17300,20500,22500,23940,24700,25866.666666666668,26833.333333333336],digests=new Map();
 assert.equal(e.ctx.options.alpha,false);assert.equal(e.ctx.options.willReadFrequently,undefined);
 for(const ms of values){e.ctx.reset();e.at(ms,{force:true});digests.set(ms,e.ctx.digest());}
 for(const ms of values.toReversed()){e.ctx.reset();e.at(ms,{force:true});assert.equal(e.ctx.digest(),digests.get(ms),String(ms));}
 assert.equal(api.glyphStats(e.ctx).glyphs,prepared.glyphs);assert.equal(e.rec.paths,paths);assert.ok(prepared.bytes<=64*1024*1024);assert.throws(()=>e.at(NaN),/有限数字/);
 const canvases=e.rec.contexts.map(c=>c.canvas);e.draw.destroy();assert.ok(canvases.every(c=>c.width===1&&c.height===1));assert.equal(e.root.childElementCount,0);t.diagnostic(`提前准备${prepared.glyphs}个字形，模拟缓存${prepared.bytes/1024/1024} MiB；不代表实机帧率或实测显存。`);
 }finally{e.close();}
});

test('放大压到2秒并立即接平面，回缩进行到一半前不出现完整图形',async()=>{
 const e=await setup();try{const a=e.w.WisePointDomainFlow,painter=a.createPainter(e.w.document);
 assert.ok(Math.abs(a.toSourceTime(6200)-256/30*1000)<1e-9);assert.ok(Math.abs(a.duration-21133.333333333336)<1e-7);assert.equal(composition.duration_ms,a.duration);
 for(const ms of [0,4200,5000,6200,8000,12000,14333.333333333334,14334,16000,19000,a.duration])assert.ok(Math.abs(a.toPlaybackTime(a.toSourceTime(ms))-ms)<1e-9);
 // 14.333秒之前保持原速；之后每播放1秒，原生长时钟推进1.5秒。
 const growthStart=a.toPlaybackTime(a.NATURE_START*1000);assert.ok(Math.abs(growthStart-14333.333333333334)<1e-8);assert.ok(Math.abs(a.toSourceTime(growthStart+1000)-a.toSourceTime(growthStart)-1500)<1e-8);assert.ok(Math.abs(a.toPlaybackTime(26000)-a.toPlaybackTime(23000)-2000)<1e-8);assert.ok(Math.abs(a.toSourceTime(12000)-(12000+256/30*1000-6200))<1e-8);assert.equal(a.frames,634);
 assert.ok(painter.pose(a.toSourceTime(5800)/1000).zoom>6);assert.ok('intro' in painter.pose(a.toSourceTime(6201)/1000));
 for(const t of [14.2,14.35,14.5,14.8]){const state=painter.pose(t);assert.equal(a.returnAppearance(t,state).alpha,0);e.ctx.reset();e.at(t*1000,{force:true});assert.ok(!e.ctx.commands.some(c=>c[0]==='stroke'&&c[2].strokeStyle==='#d9dfeb'));}
 const state=painter.pose(15.3);assert.ok(state.scale<.4);assert.ok(a.returnAppearance(15.3,state).alpha>.9);e.ctx.reset();e.at(15300,{force:true});assert.ok(e.ctx.commands.some(c=>c[0]==='stroke'&&c[2].strokeStyle==='#d9dfeb'));painter.destroy();
 }finally{e.close();}
});


test('第一块方格始终以光点为中心，回缩描边贴合文字正方形，两次镜头交接位置连续',async()=>{
 const e=await setup();try{const a=e.w.WisePointDomainFlow,painter=a.createPainter(e.w.document),close=(p,q,tolerance=1e-7)=>assert.ok(Math.hypot(p[0]-q[0],p[1]-q[1])<tolerance,`${p} / ${q}`);
 const g=a.goldenGeometry(0),mean=g.square.slice(0,4).reduce((out,p)=>out.map((v,i)=>v+p[i]/4),[0,0]);close(mean,[0,0]);
 const opening=painter.pose(3.8);close(opening.P(opening.cx,opening.cy),opening.origin);
 for(const t of [11.2,14.8,15.1,15.45,16.4]){const state=painter.pose(t),points=[[0,0],[1,0],[1,1],[0,1]].map(p=>a.planeGridPoint(state,...p)),center=points.reduce((out,p)=>out.map((v,i)=>v+p[i]/4),[0,0]);close(center,state.center);
  const lengths=points.map((p,i)=>Math.hypot(p[0]-points[(i+1)%4][0],p[1]-points[(i+1)%4][1]));assert.ok(Math.max(...lengths)-Math.min(...lengths)<1e-8);assert.ok(Math.abs(lengths[0]-a.PLANE_STEP*state.viewScale)<1e-7);
 }
 // 检查实际绘出的回缩正方形，而不只检查辅助函数。
 const state=painter.pose(15.4),shape=new e.w.Path2D();[[0,0],[1,0],[1,1],[0,1],[0,0]].map(p=>a.planeGridPoint(state,...p)).forEach((p,i)=>i?shape.lineTo(...p):shape.moveTo(...p));e.ctx.reset();e.at(15400,{force:true});assert.ok(e.ctx.commands.some(c=>c[0]==='stroke'&&c[2].strokeStyle==='#d9dfeb'&&c[1][0]===shape.hash));
 const cut=256/30,before=painter.pose(cut-1e-8),after=painter.pose(cut);for(const [x,y]of [[0,0],[1,0],[1,1],[0,1]])close(before.P(before.cx+(x-.5)*a.GRID_STEP,before.cy+(y-.5)*a.GRID_STEP),a.planeGridPoint(after,x,y),.001);
 const cut2=500/30,before2=painter.pose(cut2-1e-8),after2=painter.pose(cut2);for(const [x,y]of [[0,0],[1,0],[1,1],[0,1],[-3,-5],[10,3]])close(a.planeGridPoint(before2,x,y),a.gridTilePoint(after2,x,y,cut2),.001);
 for(let i=1;i<6;i++)assert.equal(a.returnTileReveal(14.98,i),0);painter.destroy();
 }finally{e.close();}
});

test('每条动作线先延伸、停驻蓄亮，再发出火花，停顿期间端点不移动',async()=>{
 const e=await setup();try{const a=e.w.WisePointDomainFlow,painter=a.createPainter(e.w.document);
 for(const [i,tr]of a.traces.entries()){
  const extending=a.traceGeometry((tr.start+tr.arrive)/2)[i],held=a.traceGeometry(tr.arrive+.02)[i],late=a.traceGeometry(tr.stop-.001)[i],burst=a.traceGeometry(tr.stop+.01)[i];assert.equal(extending.phase,'extend');assert.ok(extending.progress>0&&extending.progress<1);assert.equal(held.phase,'hold');assert.equal(late.phase,'hold');assert.equal(burst.phase,'spark');assert.ok(tr.stop-tr.arrive>=.25);assert.deepEqual(Array.from(held.tip),Array.from(late.tip));assert.ok(late.charge>held.charge);assert.ok(held.sparkAge<0);
  for(const [t,hasSpark]of [[tr.stop-.001,false],[tr.stop+.15,true]]){e.ctx.reset();painter.drawLayer(e.ctx,'constraints',t,painter.pose(t));const iron=e.ctx.commands.some(c=>c[0]==='stroke'&&c[2].strokeStyle==='#ffdda0');if(i===0||hasSpark)assert.equal(iron,hasSpark);}
 }painter.destroy();
 }finally{e.close();}
});

test('黄金矩形逐层分割，两千余个矩形比例正确、方格不相互覆盖、弧线不越过所属方格',async()=>{
 const e=await setup();try{const a=e.w.WisePointDomainFlow;assert.deepEqual(Array.from(a.mainGoldenTiles,t=>t.size),[1,1,2,3,5,8,13,21,34,55]);assert.ok(a.natureRectangles.length>=2000);assert.ok(a.natureArcs.length>=9000);
 const box=pts=>[Math.min(...pts.map(p=>p[0])),Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[1]))];
 for(const r of a.natureRectangles){assert.ok(Math.abs(r.width/r.height-a.PHI)<1e-9);const outer=box(r.outline),cells=[];
  for(const id of r.squares){const sq=a.natureSquares[id],b=box(a.natureGeometry[sq.guide].local);assert.ok(b[0]>=outer[0]-1e-8&&b[1]>=outer[1]-1e-8&&b[2]<=outer[2]+1e-8&&b[3]<=outer[3]+1e-8);
   for(const c of cells){const overlap=Math.max(0,Math.min(b[2],c[2])-Math.max(b[0],c[0]))*Math.max(0,Math.min(b[3],c[3])-Math.max(b[1],c[1]));assert.ok(overlap<1e-8);}cells.push(b);
  }
 }
 for(const line of a.natureGeometry){const sq=a.natureSquares[line.owner];assert.equal(a.natureProgress(line.at-.001,line),0);assert.equal(a.natureProgress(line.at+line.duration,line),1);
  for(const p of line.local){const x=p[0]-sq.center[0],y=p[1]-sq.center[1],u=(x*sq.u[0]+y*sq.u[1])/(sq.size*sq.size),v=(x*sq.v[0]+y*sq.v[1])/(sq.size*sq.size);assert.ok(u>=-1e-8&&u<=1+1e-8&&v>=-1e-8&&v<=1+1e-8);}
  for(const p of line.points)assert.ok(p.every(Number.isFinite)&&p[0]>12&&p[0]<628&&p[1]>8&&p[1]<352);
 }
 for(const t of [a.NATURE_START,17,17.3,17.8,18.25,24.8]){const m=a.natureCamera(t);assert.ok(Math.abs(Math.hypot(m.a,m.b)-Math.hypot(m.c,m.d))<1e-9);assert.ok(Math.abs(m.a*m.c+m.b*m.d)<1e-9);}
 assert.ok(Math.max(...a.natureGeometry.map(l=>l.at+l.duration))<25.7);
 }finally{e.close();}
});

test('每一条新增线从已画出的父级边或弧线接出，父级完成后才开始，不在空处独立出现',async()=>{
 const e=await setup();try{const a=e.w.WisePointDomainFlow,dist=(p,x,y)=>{const dx=y[0]-x[0],dy=y[1]-x[1],u=Math.max(0,Math.min(1,((p[0]-x[0])*dx+(p[1]-x[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-x[0]-u*dx,p[1]-x[1]-u*dy);};
 for(const l of a.natureGeometry){if(l.at<a.NATURE_START)continue;assert.ok(l.parentLine>=0&&l.parentLine<l.id);const parent=a.natureGeometry[l.parentLine];assert.ok(l.at>=parent.at+parent.duration-1e-8);let gap=Infinity;for(let i=1;i<parent.local.length;i++)gap=Math.min(gap,dist(l.local[0],parent.local[i-1],parent.local[i]));assert.ok(gap<1e-7,`新增线 ${l.id} 离已有线 ${gap}`);}
 const main=a.natureSquares.filter(s=>s.main);assert.equal(main.length,10);for(let i=1;i<main.length;i++){const before=a.natureGeometry[main[i-1].line].local.at(-1),next=a.natureGeometry[main[i].line].local[0];assert.ok(Math.hypot(before[0]-next[0],before[1]-next[1])<1e-8);}
 // 检查生长过程的可见点，边缘允许半个细描边的误差。
 for(let t=a.NATURE_START;t<=18.3;t+=.1){const state=a.gridState(t);for(const l of a.natureGeometry){const q=a.natureProgress(t,l);if(q===0)continue;const last=Math.floor(q*(l.local.length-1));for(let i=0;i<=last;i++){const p=a.naturePoint(0,l.local[i],t,state);assert.ok(p[0]>=-.25&&p[0]<=640.25&&p[1]>=-.25&&p[1]<=360.25);}}}
 }finally{e.close();}
});

test('原来的黄金弧线与铁花持续保留，递归密度不断增加，生长和成形均合并绘制',async()=>{
 const e=await setup();try{const a=e.w.WisePointDomainFlow,painter=a.createPainter(e.w.document),close=(p,q,tolerance=1e-6)=>assert.ok(Math.hypot(p[0]-q[0],p[1]-q[1])<tolerance),main=a.natureSquares.filter(s=>s.main).slice(0,6);
 const before=painter.pose(a.NATURE_START-1e-8),after=painter.pose(a.NATURE_START);
 for(let tile=0;tile<6;tile++){const old=a.goldenGeometry(tile).arc,line=a.natureGeometry[main[tile].line];assert.equal(line.local.length,old.length);for(let i=0;i<old.length;i++){const local=Array.from(old[i],v=>v*130/a.GRID_STEP);close(line.local[i],local);close(a.naturePoint(0,local,a.NATURE_START,after),a.planeGridPoint(before,local[0]+.5,local[1]+.5),.001);}}
 let previous=0;for(let t=a.NATURE_START;t<26.82;t+=.125){const state=painter.pose(t),count=a.natureArcs.filter(l=>a.natureProgress(t,l)>0).length;assert.ok(count>=previous);previous=count;for(const sq of main){const line=a.natureGeometry[sq.line];assert.equal(a.natureProgress(t,line),1);assert.ok(a.natureAlpha(line,t)>.85);}const f=a.flowerState(t,state);assert.ok(f.alpha>=.27);close(f.center,a.natureFocus(t,state));}
 assert.equal(previous,a.natureArcs.length);
 for(const t of [17,18.15,19,20,21,22.12,23.3,24.5,25.4,26.2]){e.ctx.reset();painter.drawLayer(e.ctx,'flow',t,painter.pose(t));const strokes=e.ctx.commands.filter(c=>c[0]==='stroke');assert.ok(strokes.length<=240,`${t}秒描边 ${strokes.length} 次`);assert.ok(strokes.some(c=>c[2].strokeStyle==='#efd7ae'&&c[2].globalAlpha>.85));}
 for(const t of [24.2,25.1,26.2]){e.ctx.reset();painter.drawLayer(e.ctx,'fibres',t,painter.pose(t));assert.ok(e.ctx.commands.some(c=>c[0]==='stroke'&&c[2].strokeStyle==='#ffdda0'&&c[2].globalAlpha>0));}painter.destroy();
 }finally{e.close();}
});

test('正式组合与已验收候选在21个代表时刻提交相同画布指令',async()=>{
 const expected=JSON.parse(await read('tests/fixtures/golden-growth-accepted.json'));
 const e=await setup();try{for(const [ms,hash]of Object.entries(expected.frames)){e.ctx.reset();e.draw(Number(ms),{force:true});assert.equal(e.ctx.digest(),hash,ms+'毫秒画面与验收版不同');}}finally{e.close();}
});

test('七个动作只创建自己的画布，共用组合加速时钟并支持倒序定位与释放',async()=>{
 const e=await env();try{const {w,rec}=e,api=w.WisePointDomainFlow;
 for(const def of fresh.filter(x=>x.kind==='action')){
  const spec=api.specs.find(s=>s.id===def.id),root=w.document.createElement('div'),draw=w.MotionFactories[def.id](root,w.MotionKit,def);await draw.ready;
  const ctx=rec.contexts.find(c=>c.canvas===root.querySelector('canvas'));
  assert.equal(root.querySelectorAll('canvas').length,1,def.name);
  assert.ok(Math.abs(def.duration_ms-(api.toPlaybackTime(spec.clock[1]*1000)-api.toPlaybackTime(spec.clock[0]*1000)))<1e-7);
  const hashes=new Map();for(const ms of [0,def.preview_ms,def.duration_ms]){ctx.reset();draw(ms,{force:true});hashes.set(ms,ctx.digest());const source=Math.min(805/30,spec.clock[1]-1/30000,api.toSourceTime(api.toPlaybackTime(spec.clock[0]*1000)+ms)/1000);assert.ok(Math.abs(Number(root.querySelector('[data-part]').dataset.time)-source)<.000001);}
  for(const [ms,hash]of [...hashes].reverse()){ctx.reset();draw(ms,{force:true});assert.equal(ctx.digest(),hash,def.name);}
  draw.destroy();assert.equal(root.childElementCount,0);assert.equal(ctx.canvas.width,1);
 }
 }finally{e.close();}
});

test('组合拆解具有真实透明图层，切换后保留时刻，字体与路径销毁不残留',async()=>{
 const e=await setup();try{const {w,root,draw,rec}=e,rows=w.MotionFactories[composition.id].breakdown,api=w.WisePointDomainFlow;
 assert.deepEqual([...new Set(rows.flatMap(r=>Array.from(r.actions)))].sort(),[...composition.actions].sort());
 assert.deepEqual([...new Set([...root.querySelectorAll('[data-layer]')].map(c=>c.dataset.layer))].sort(),Array.from(rows,r=>r.id).sort());
 for(const row of rows){const spec=api.specs.find(s=>s.key===row.id);assert.equal(row.start,api.toPlaybackTime(spec.clock[0]*1000));assert.equal(row.end,api.toPlaybackTime(spec.clock[1]*1000));}
 draw(19000);const canvas=root.querySelector('canvas:not([data-layer])'),layer=root.querySelector('[data-layer]');layer.setAttribute('data-composition-hidden','');await Promise.resolve();assert.equal(canvas.style.visibility,'hidden');
 for(const c of rec.contexts.filter(c=>c.canvas.hasAttribute('data-layer')))assert.notEqual(c.options?.alpha,false,'拆解图层必须透明');
 layer.removeAttribute('data-composition-hidden');await Promise.resolve();assert.equal(canvas.style.visibility,'visible');
 draw.destroy();assert.ok(rec.contexts.every(c=>c.canvas.width===1&&c.canvas.height===1));assert.equal(root.childElementCount,0);
 }finally{e.close();}
});

test('星点保留原示例，正式入口与复制提示词使用新图案且无旧视频覆盖',async()=>{
 const e=await env();try{const {w}=e;w.MotionRegistry=data;w.eval(await read('catalog/matching.js'));w.eval(await read('catalog/export.js')); const stars=data.effects.find(e=>e.id==='star-twinkle'),root=w.document.createElement('div');
 const original=w.MotionRuntime.create(root,stars,{autoplay:false});assert.ok(root.querySelector('[data-star]')||root.querySelector('svg'));original.destroy();
 const def=w.MotionKit.resolveVariant({...stars,variant_id:'layered-night'}),variant=w.MotionRuntime.create(root,def,{autoplay:false});await variant.ready;assert.equal(root.querySelectorAll('canvas').length,1);assert.equal(def.duration_ms,composition.duration_ms);variant.destroy();
 const prompt=w.MotionExport.prompt(composition,{},data);for(const term of ['黄金','打铁花','2002','21.133333','字幕'])assert.ok(prompt.includes(term),term);assert.doesNotMatch(prompt,/多涡流场|三圈文字圆|160颗/);
 const code=w.MotionExport.code(stars,{variantId:'layered-night'});assert.ok(code.indexOf('catalog/effects/reel-neon.js')<code.indexOf('catalog/effects/point-domain-flow.js'));
 const page=await read('catalog/index.html');assert.match(page,/effects\/point-domain-flow.js/);assert.doesNotMatch(page,/local-preview.js/);
 for(const id of ['grid-bend-spread','multivortex-release'])assert.equal(data.redirects[id],'grid-flow-unfold');
 }finally{e.close();}
});

test('目录旧书签直接显示新版名称、时长、真实拆解与复制代码',async()=>{
 const e=await environment(true,{staticPreview:true,hash:'#point-domain-flow-sequence'});try{const {w}=e,d=w.document;assert.equal(d.querySelector('.effect-item[aria-current="true"]').dataset.effect,composition.id);assert.ok(d.getElementById('prompt').textContent.includes('黄金矩形递归生长'));assert.ok(d.getElementById('code').textContent.includes('point-domain-flow.js'));assert.equal(d.querySelectorAll('[data-composition-layer]').length,w.MotionFactories[composition.id].breakdown.length);assert.equal(w.MotionRuntime.instanceCount,1);
 }finally{e.close();}
});
