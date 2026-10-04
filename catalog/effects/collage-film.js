/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 原创剪贴短片。完整组合与独立动作共用绘制函数；素材来源见 assets/collage-film/SOURCE.json。 */
(function(global){
'use strict';
const W=1600,H=900,DURATION=14,FPS=12;
const scriptURL=typeof document==='undefined'?'':document.currentScript?.src||[...document.scripts].find(s=>s.src.endsWith('/effects/collage-film.js'))?.src||'';
function assetURL(doc,name){
 if(scriptURL)return new URL('../assets/collage-film/'+name,scriptURL).href;
 const directory=/\/catalog\/[^/]*$/.test(new URL(doc.baseURI).pathname)?'assets/':'catalog/assets/';
 return new URL(directory+'collage-film/'+name,doc.baseURI).href;
}
const parts=[
 {id:'cutout-type-fold',key:'type',start:8.9,end:11.1},
 {id:'crank-linked-turn',key:'mechanics',start:0,end:3.1},
 {id:'joint-rule-unfold',key:'ruler',start:1.2,end:3.0},
 {id:'folded-step-rebound',key:'platforms',start:4.4,end:7.5},
 {id:'cutout-stride-leap',key:'runner',start:4.0,end:8.6},
 {id:'scraps-return-layout',key:'scraps',start:9.2,end:12.0}
];
function createPainter(doc,visible,only){
 const layer=(key,draw)=>{if(visible(key))draw();};
 let dead=false,motionLight;
 const buffers=new Set(),pending=new Set();
const C={paper:'#f1eee6',light:'#faf7ed',ink:'#232420',red:'#c34430',back:'#d1cfc5',grey:'#88897f'};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const lerp=(a,b,p)=>a+(b-a)*p;
const smooth=p=>{p=clamp(p);return p*p*(3-2*p);};
const prog=(t,a,b)=>smooth((t-a)/(b-a));
const out=p=>1-Math.pow(1-clamp(p),3);
const random=n=>{const r=Math.sin(n*121.37+617.2)*43758.9;return r-Math.floor(r);};
const pop=p=>{p=clamp(p);return p<.76?lerp(0,1.075,out(p/.76)):lerp(1.075,1,smooth((p-.76)/.24));};
const makeCanvas=(w,h)=>{const cv=Object.assign(doc.createElement('canvas'),{width:Math.ceil(w),height:Math.ceil(h)});buffers.add(cv);return cv;};
function path(c,points){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();}
function torn(w,h,seed,rough=1.8){
 const ps=[],nx=Math.ceil(w/13),ny=Math.ceil(h/13);
 for(let i=0;i<=nx;i++)ps.push([-w/2+i*w/nx,-h/2+(random(seed+i)-.5)*rough]);
 for(let i=1;i<=ny;i++)ps.push([w/2+(random(seed+100+i)-.5)*rough,-h/2+i*h/ny]);
 for(let i=nx-1;i>=0;i--)ps.push([-w/2+i*w/nx,h/2+(random(seed+200+i)-.5)*rough]);
 for(let i=ny-1;i>0;i--)ps.push([-w/2+(random(seed+300+i)-.5)*rough,-h/2+i*h/ny]);
 return ps;
}
function line(c,x1,y1,x2,y2,color,width=1){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function disc(c,x,y,r,color){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();}
function local(c,x,y,a,s,fn){c.save();c.translate(x,y);c.rotate(a);c.scale(s,s);fn();c.restore();}
let fiber,hand,wise,motion,wheel,runner,runnerRun,runnerRebound,plates={},stripCache=new Map();
function paperFibers(w,h,seed=1){
 const cv=makeCanvas(w,h),c=cv.getContext('2d');
 for(let i=0;i<w*h/25;i++){
   const x=random(i*5+seed)*w,y=random(i*5+seed+1)*h;
   c.globalAlpha=.023+random(i+8)*.055;c.strokeStyle=i%4?'#4b4a42':'#fff';
   c.lineWidth=.25+random(i+2)*.35;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+2,y-.6,x+2.5+random(i+6)*4,y+random(i+7)*1.5);c.stroke();
 }
 for(let i=0;i<w*h/900;i++){
   c.globalAlpha=.035;c.strokeStyle=i%3?'#6b695c':'#fff';c.lineWidth=.45;
   const x=random(i*7+102)*w,y=random(i*7+106)*h;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+4,y-2,x+9,y+3,x+15,y+1);c.stroke();
 }
 c.globalAlpha=1;return cv;
}
function surface(c,x,y,w,h){c.drawImage(fiber,0,0,w,h,x,y,w,h);}
function paperCard(c,w,h,seed,color=C.light,shadow=1){
 c.save();c.shadowColor=`rgba(32,30,25,${.14*shadow})`;c.shadowBlur=8*shadow;c.shadowOffsetX=1.8*shadow;c.shadowOffsetY=5*shadow;
 path(c,torn(w,h,seed,2.5));c.fillStyle=C.back;c.fill();c.shadowColor='transparent';
 c.translate(0,-1.8);path(c,torn(w,h,seed,2.5));c.fillStyle=color;c.fill();c.clip();surface(c,-w/2,-h/2,w,h);c.restore();
}
function inkPattern(c,w,h,seed){
 c.save();c.globalCompositeOperation='source-atop';
 c.globalAlpha=.16;c.fillStyle=C.light;
 for(let y=0;y<h;y+=4.2)for(let x=0;x<w;x+=4.2){const r=.35+random(x*3+y+seed)*.32;disc(c,x+(y%8>4?2.1:0),y,r,C.light);}
 for(let i=0;i<1000;i++){c.globalAlpha=.055+random(i+seed)*.12;c.fillStyle=i%4?C.light:C.ink;c.fillRect(random(i*4+seed)*w,random(i*4+seed+1)*h,.5+random(i+2)*2,.45);}
 c.restore();
}
function glyph(ch,seed,kind='cut'){
 const size=270,m=makeCanvas(400,410),c=m.getContext('2d');c.font=`700 ${size}px Oswald`;const width=c.measureText(ch).width+42;
 const cv=makeCanvas(width,354),g=cv.getContext('2d');g.font=`700 ${size}px Oswald`;g.textAlign='center';g.textBaseline='alphabetic';
 if(kind==='ticket'){
   g.translate(width/2,177);path(g,torn(width-2,300,seed,2.6));g.fillStyle=C.light;g.fill();g.translate(-width/2,-177);
   g.fillStyle=C.ink;g.fillText(ch,width/2,278);inkPattern(g,width,354,seed);
 }else{
   g.lineJoin='round';g.lineWidth=19;g.strokeStyle=C.light;g.strokeText(ch,width/2,278);
   for(let i=0;i<18;i++){g.lineWidth=19+random(seed+i)*1.7;g.strokeText(ch,width/2+(random(seed+i+40)-.5)*1.4,278+(random(seed+i+70)-.5)*1.1);}
   g.fillStyle=C.ink;g.fillText(ch,width/2,278);inkPattern(g,width,354,seed);
 }
 // The reverse is native paper geometry; no raster asset is modified.
 const back=makeCanvas(width,354),b=back.getContext('2d');b.drawImage(cv,0,0);b.globalCompositeOperation='source-in';b.fillStyle=C.back;b.fillRect(0,0,width,354);b.globalCompositeOperation='source-atop';b.globalAlpha=.22;b.drawImage(fiber,0,0,width,354,0,0,width,354);
 return{ch,seed,cv,back,width,height:354,kind};
}
function wordData(word,seed){return [...word].map((ch,i)=>glyph(ch,seed+i*11,i===1&&word==='WISE'?'ticket':'cut'));}
function layout(gs,center,y,size,gap=4){const s=size/270,total=gs.reduce((v,g)=>v+(g.width-24)*s,0)+gap*(gs.length-1);let x=center-total/2;return gs.map(g=>{const w=(g.width-24)*s;const p={x:x+w/2,y,s};x+=w+gap;return p;});}
function drawGlyph(c,g,x,y,angle=0,scale=1,flip=0,lift=0){
 c.save();c.translate(x,y);c.rotate(angle);
 // Fold around the lower paper edge, with a reverse face and a short edge.
 const px=Math.cos(flip),abs=Math.max(.055,Math.abs(px));
 c.translate(0,118*scale);c.transform(abs,Math.sin(flip)*.15,0,1,0,0);c.translate(0,-118*scale);
 c.shadowColor=`rgba(25,23,20,${.14+Math.min(lift/200,.1)})`;c.shadowBlur=4+lift*.12;c.shadowOffsetX=2+Math.sin(angle)*lift*.06;c.shadowOffsetY=3+lift*.13;
 c.drawImage(px<0?g.back:g.cv,-g.width*scale/2,-g.height*scale/2,g.width*scale,g.height*scale);
 c.shadowColor='transparent';
 if(abs<.25){line(c,0,-115*scale,0,116*scale,C.back,3.1);}
 c.restore();
}
function ribbon(c,points,progress=1,width=14){
 if(progress<=0)return;c.save();c.lineJoin='bevel';c.lineCap='butt';
 const count=Math.max(2,Math.ceil(points.length*clamp(progress))),ps=points.slice(0,count);
 c.shadowColor='#25231d30';c.shadowBlur=5;c.shadowOffsetY=4;c.beginPath();ps.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=C.red;c.lineWidth=width;c.stroke();c.shadowColor='transparent';
 c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p[0],p[1]-1):c.moveTo(p[0],p[1]-1));c.strokeStyle='#f7ead533';c.lineWidth=1.2;c.stroke();c.restore();
}
function tab(c,x,y,angle=0,scale=1){local(c,x,y,angle,scale,()=>{paperCard(c,62,30,731,C.red,.6);line(c,-19,-11,-10,10,'#9c382b',1.5);});}
function drawHand(c,tx,ty,scale,angle=0,opacity=1){
 c.save();c.globalAlpha*=clamp(opacity);c.translate(tx,ty);c.rotate(angle);c.scale(scale,scale);
 c.drawImage(hand,-1450,-438,1536,1024);c.restore();
}
function printScrap(c,x,y,w,h,rotation,seed,red=false){
 const key=[w,h,seed,red].join(':' );let cv=stripCache.get(key);
 if(!cv){cv=makeCanvas(w+22,h+22);const p=cv.getContext('2d');p.translate((w+22)/2,(h+22)/2);path(p,torn(w,h,seed,3));p.fillStyle=red?C.red:C.light;p.fill();p.clip();surface(p,-w/2,-h/2,w,h);p.fillStyle=C.ink;p.font='700 54px Oswald';p.fillText(seed%2?'MOTION':'WISE',-w/2-9,h/2+10);for(let j=0;j<6;j++)line(p,-w/2+4,-h/2+4+j*5,w/2-4,-h/2+4+j*5,red?'#efc9bb55':'#25252042',.7);stripCache.set(key,cv);}
 local(c,x,y,rotation,1,()=>{c.shadowColor='#25221e26';c.shadowBlur=5;c.shadowOffsetY=4;c.drawImage(cv,-cv.width/2,-cv.height/2);});
}
// New photographic layers are displayed as separate, independently moving paper pieces.
function printText(c,s,x,y,size,color=C.ink,family='Oswald',align='left'){
 c.fillStyle=color;c.font=`700 ${size}px ${family}`;c.textAlign=align;c.textBaseline='alphabetic';c.fillText(s,x,y);
}
function traced(c,pts,color,width=1){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function ring(c,x,y,r,color,width=1){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function texturedPolygon(c,pts,color,shadow=true){
 c.save();if(shadow){c.shadowColor='#1818152d';c.shadowBlur=13;c.shadowOffsetX=3;c.shadowOffsetY=8;}
 path(c,pts);c.fillStyle=color;c.fill();c.shadowColor='transparent';c.clip();c.globalAlpha=.7;c.drawImage(fiber,0,0);c.restore();
}
function base(c){c.fillStyle=C.paper;c.fillRect(0,0,W,H);c.drawImage(fiber,0,0);}
function buildPlate(w,h,seed,mode){
 const cv=makeCanvas(w+30,h+30),c=cv.getContext('2d');c.translate((w+30)/2,(h+30)/2);paperCard(c,w,h,seed,C.light,.1);c.save();path(c,torn(w-12,h-12,seed,2));c.clip();
 if(mode==='draft'){
  c.globalAlpha=.24;for(let x=-w/2+20;x<w/2;x+=24)line(c,x,-h/2,x,h/2,'#575c50',.6);for(let y=-h/2+20;y<h/2;y+=24)line(c,-w/2,y,w/2,y,'#575c50',.6);c.globalAlpha=1;
  const r=Math.min(w,h)*.31;for(const k of [1,.96,.74,.31])ring(c,40,-15,r*k,'#676b5c',k===1?1.5:.8);
  for(let i=0;i<48;i++){const a=i*Math.PI/24,len=i%4?9:22;line(c,40+Math.cos(a)*(r-len),-15+Math.sin(a)*(r-len),40+Math.cos(a)*r,-15+Math.sin(a)*r,'#676b5c',.9);}
  line(c,40-r-30,-15,40+r+40,-15,'#676b5c',.9);line(c,40,-15-r-28,40,-15+r+28,'#676b5c',.9);
  traced(c,[[-w/2+44,h/2-88],[-w/2+44,14],[-90,14],[-90,48],[40,48],[40,112],[w/2-50,112]],'#575c50',1.2);
  for(let i=0;i<7;i++){const x=-w/2+30+i*38;line(c,x,h/2-68,x,h/2-38,'#555b4d',.6);printText(c,String(i*10),x,h/2-20,9,'#62665b');}
  printText(c,'WISE MOTION',-w/2+24,-h/2+38,13);printText(c,'STUDY OF MOVEMENT',-w/2+24,-h/2+58,8,'#65695e');
 }else{
  printText(c,'MOTION',-w/2+18,-h/2+72,80,C.ink,'Oswald');line(c,-w/2+18,-h/2+84,w/2-18,-h/2+84,C.ink,1.4);
  for(let col=0;col<3;col++)for(let i=0;i<55;i++){const x=-w/2+18+col*(w-36)/3,y=-h/2+99+i*7.2;if(y>h/2-20)break;const max=(w-60)/3;line(c,x,y,x+max*(.6+.4*random(seed+i*5+col)),y,'#494c4388',i%9===0?1.6:.8);}
  c.globalAlpha=.85;for(let y=h/2-175;y<h/2-65;y+=4)for(let x=-w/2+23;x<w/2-25;x+=4)if(Math.sin((x+y)*.04)>.2)disc(c,x,y,.7,C.ink);
 }
 c.restore();return cv;
}
function plate(c,kind,x,y,angle=0,scale=1){local(c,x,y,angle,scale,()=>{c.shadowColor='#17191325';c.shadowBlur=14;c.shadowOffsetY=8;c.drawImage(plates[kind],-plates[kind].width/2,-plates[kind].height/2);});}
function flywheel(c,x,y,size,angle=0,shadow=1){
 local(c,x,y,angle,1,()=>{c.shadowColor=`rgba(20,22,18,${.24*shadow})`;c.shadowBlur=9*shadow;c.shadowOffsetY=8*shadow;c.drawImage(wheel,-size/2,-size/2,size,size);});
}
function rivet(c,x,y,r=10){disc(c,x+2,y+3,r,'#191b1838');disc(c,x,y,r,C.light);ring(c,x,y,r-2,'#77796d',1.5);line(c,x-r*.42,y+r*.25,x+r*.42,y-r*.25,C.ink,1.7);}
function drawRunner(c,pose,x,feet,size,angle=0,opacity=1){
 const cw=runner.width/2,ch=runner.height/2,anchors=[.91,.94,.95,.84];
 c.save();c.globalAlpha*=opacity;c.translate(x,feet);c.rotate(angle);c.shadowColor='#15181435';c.shadowBlur=6;c.shadowOffsetX=3;c.shadowOffsetY=7;
 c.drawImage(runner,(pose%2)*cw,Math.floor(pose/2)*ch,cw,ch,-size/2,-size*anchors[pose],size,size);c.restore();
}
function spindle(c,x,y,angle,r=80){
 local(c,x,y,angle,1,()=>{
  paperCard(c,r*2.13,r*.42,911,C.light,.7);ring(c,0,0,r,C.ink,2.2);ring(c,0,0,r-12,'#787c6d',.8);
  for(let i=0;i<24;i++){const a=i*Math.PI/12;line(c,Math.cos(a)*(r-7),Math.sin(a)*(r-7),Math.cos(a)*(r+5),Math.sin(a)*(r+5),C.ink,1.4);}rivet(c,0,0,12);
 });
}
function accordion(c,x,y,amount){
 local(c,x,y,-.045,1,()=>{for(let i=0;i<7;i++){const w=34+amount*31;local(c,i*(w-4),-i*3,0,1,()=>{paperCard(c,w,91,361+i,i%2?C.back:C.light,.3);line(c,-w/2+3,-39,-w/2+3,41,'#777968',.6);});}});
}
function shards(c,t,start,end,originX=1000,originY=420){
 for(let i=0;i<16;i++){
  const p=prog(t,start+i*.028,start+.58+i*.028),e=prog(t,end+i*.02,end+.65+i*.02);if(p===0||e===1)continue;
  const x=lerp(originX,120+random(i+92)*1350,p)+e*(i%2?210:-210),y=lerp(originY,80+random(i+79)*740,p)+e*420;
  c.save();c.globalAlpha=1-e;printScrap(c,x,y,21+random(i+10)*43,8+random(i+12)*18,(random(i+42)-.5)*3+p*.8+e,971+i,i%7===0);c.restore();
 }
}
function registration(c,x,y,r=18,color='#676e5b'){ring(c,x,y,r,color,.8);line(c,x-r-6,y,x+r+6,y,color,.7);line(c,x,y-r-6,x,y+r+6,color,.7);}

// Printed paper mechanics: additional movement stays tied to the existing pull and steps.
function paperGear(c,x,y,r,teeth,angle){
 local(c,x,y,angle,1,()=>{
  const ps=[];for(let i=0;i<teeth*4;i++){const a=i*Math.PI*2/(teeth*4),rr=i%4<2?r:r*.88;ps.push([Math.cos(a)*rr,Math.sin(a)*rr]);}
  c.shadowColor='#17191332';c.shadowBlur=5;c.shadowOffsetY=5;path(c,ps);c.fillStyle=C.light;c.fill();c.shadowColor='transparent';
  path(c,ps.map(([xx,yy])=>[xx*.96,yy*.96]));c.fillStyle=C.ink;c.fill();
  ring(c,0,0,r*.69,'#c4c7b8',1);ring(c,0,0,r*.57,'#a5ab98',.7);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;local(c,Math.cos(a)*r*.4,Math.sin(a)*r*.4,a,1,()=>{c.fillStyle=C.paper;c.beginPath();c.ellipse(0,0,r*.15,r*.07,0,0,Math.PI*2);c.fill();});}
  for(let i=0;i<teeth;i++){const a=i*Math.PI*2/teeth;line(c,Math.cos(a)*r*.75,Math.sin(a)*r*.75,Math.cos(a)*r*.88,Math.sin(a)*r*.88,'#d2d4c7',.65);}
  rivet(c,0,0,r*.16);
 });
}
function unfoldingScale(c,t,pull){
 c.save();c.strokeStyle='#707668';c.lineWidth=.75;c.beginPath();c.arc(1080,434,355,-2.75,-.62);c.stroke();c.restore();
 for(let i=0;i<9;i++){
  const open=prog(t,.73+i*.07,1.17+i*.07),a=-2.7+i*.225+pull*.09;
  if(!open)continue;
  local(c,1080+Math.cos(a)*327,434+Math.sin(a)*327,a,1,()=>{
   c.rotate((1-open)*-1.35);c.scale(Math.max(.06,open),1);paperCard(c,74,27,1300+i,C.light,.4);
   for(let j=0;j<7;j++)line(c,-29+j*9,-11,-29+j*9,j%3?-5:0,C.ink,.65);
   printText(c,String(i*15),23,9,8,C.ink,'Oswald','right');
  });
 }
}
function foldedRule(c,t){
 const open=prog(t,1.35,2.55);let x=302,y=791;
 for(let i=0;i<6;i++){
  const a=-.08+(i%2?1:-1)*(1-open)*1.17,l=70;
  local(c,x+Math.cos(a)*l/2,y+Math.sin(a)*l/2,a,1,()=>{
   paperCard(c,l,28,1410+i,i%2?C.light:'#dedfd2',.45);
   for(let j=0;j<9;j++)line(c,-29+j*7,-11,-29+j*7,j%4?-5:2,C.ink,.75);
   printText(c,String(i+1),23,9,8,'#62695a','Oswald','right');
  });
  rivet(c,x,y,3.2);x+=Math.cos(a)*l;y+=Math.sin(a)*l;
 }
 rivet(c,x,y,3.2);
}
function stepPressure(t,i){return Math.sin(clamp((t-[4.64,5.68,6.70][i])/.43)*Math.PI);}
function foldedSupport(c,w,pressure,seed){
 const depth=lerp(55,32,pressure),half=w*.38;
 c.save();path(c,[[-half,28],[-half+20,28+depth],[half+9,28+depth],[half,28]]);c.fillStyle='#b8beac';c.fill();
 for(let i=0;i<5;i++){
  const x=-half+i*half*2/5,nx=-half+(i+1)*half*2/5;
  path(c,[[x,28],[x+12,28+depth],[nx,28]]);c.fillStyle=i%2?C.light:'#d7dccc';c.fill();line(c,x+12,28+depth,nx,28,'#7c836f',.65);
 }
 line(c,-half+20,28+depth,half+9,28+depth,'#838975',.9);c.restore();
}
function landingBits(c,t,i){
 const dt=t-[4.64,5.68,6.70][i];if(dt<0||dt>.63)return;
 const p=clamp(dt/.63),cx=445+i*384,cy=670-i*35;
 for(let j=0;j<6;j++){
  const sign=j%2?1:-1,x=cx+sign*(17+p*(28+random(1500+j)*38)),y=cy-9-Math.sin(p*Math.PI)*(15+random(1510+j)*27)+p*19;
  c.save();c.globalAlpha=1-p;printScrap(c,x,y,8+random(1530+j)*12,4+random(1540+j)*4,sign*p*2,1560+j,j===1);c.restore();
 }
}
function leapStreamer(c,t,x,feet){
 const p=prog(t,6.58,7.42),leave=prog(t,8.25,8.85);if(!p||leave===1)return;
 const ps=Array.from({length:90},(_,i)=>{const a=i/89;return[x-450+460*a,feet+60-Math.sin(a*Math.PI*1.65)*82-(1-a)*30];});
 c.save();c.globalAlpha=1-leave;ribbon(c,ps,p,10);
 const tail=ps[Math.min(89,Math.max(0,Math.ceil(p*90)-1))];tab(c,tail[0],tail[1],-.25,.52);c.restore();
}
function paperClip(c,x,y,a=0,scale=1){
 local(c,x,y,a,scale,()=>{c.lineCap='round';c.lineJoin='round';
  const pts=[[9,-27],[9,17],[6,24],[-6,24],[-10,18],[-10,-21],[-6,-28],[1,-28],[5,-22],[5,13],[2,18],[-3,18],[-5,13],[-5,-15]];
  c.save();c.translate(2,2);traced(c,pts,'#0b10092d',4);c.restore();traced(c,pts,'#6f7566',3);traced(c,pts,'#eceee2',1.1);
 });
}
function returningScraps(c,t){
 for(let i=0;i<10;i++){
  const enter=prog(t,9.38+i*.028,10.02+i*.028),settle=prog(t,10.28+i*.035,11.12+i*.035);if(!enter)continue;
  const middleX=140+random(i+92)*1260,middleY=90+random(i+79)*720;
  const targets=[[154,78],[191,93],[226,70],[848,90],[878,108],[901,86],[1190,843],[1222,858],[1249,832],[1511,166]];
  const x=lerp(lerp(834,middleX,enter),targets[i][0],settle),y=lerp(lerp(471,middleY,enter),targets[i][1],settle);
  printScrap(c,x,y,22+random(i+10)*29,7+random(i+12)*10,lerp((random(i+42)-.5)*3+enter*.8,(random(i+13)-.5)*.6,settle),971+i,i===3);
 }
}

function machineLinkage(c,t){
 const pull=prog(t,.78,2.08),spin=-pull*4.9-Math.max(0,t-2.08)*1.7;
 line(c,1298,618,1402,643,C.ink,3);line(c,1320,565,1409,530,C.ink,2);
 paperGear(c,1415,588,64,16,-spin*1.7);paperGear(c,1432,694,43,12,spin*2.45);
 const belt=Array.from({length:90},(_,i)=>{const p=i/89;return[lerp(lerp(1060,340,pull),1160,p),lerp(548,542,p)+Math.sin(p*Math.PI)*(1-pull)*57];});ribbon(c,belt,1,16);
 flywheel(c,1080,434,600,spin);
 // The crank pin, connecting rod and small spindle follow the same turn.
 const pin={x:1080+Math.cos(spin-.7)*177,y:434+Math.sin(spin-.7)*177};
 local(c,(pin.x+786)/2,(pin.y+678)/2,Math.atan2(678-pin.y,786-pin.x),1,()=>{paperCard(c,Math.hypot(pin.x-786,pin.y-678),34,507,C.light,.7);line(c,-30,0,30,0,'#777b6e',1);});
 spindle(c,786,678,-spin*1.8,84);rivet(c,pin.x,pin.y,14);rivet(c,1080,434,17);
 if(t<2.96){const enter=prog(t,0,.4),leave=prog(t,2.22,2.96);drawHand(c,lerp(706,1060,enter)-pull*720-leave*760,548+pull*8,.66,-.06+pull*.04);}
 tab(c,lerp(1060,340,pull),548+pull*8,-.05,1);
}
function runPlatforms(c,t){
 for(let i=0;i<3;i++){
  const pressure=stepPressure(t,i),x=390+i*384,y=697-i*35,bend=pressure*13;
  local(c,x,y+bend,-.025-i*.012+pressure*.022,1,()=>{
   foldedSupport(c,387,pressure,683+i);paperCard(c,387,63,683+i,C.light,.5);
   c.save();path(c,torn(373,45,683+i));c.clip();printText(c,i===0?'WISE':i===1?'INTO':'MOTION',-159,31,64,'#b9bdb0','Oswald');c.restore();line(c,-169,-13,173,-13,C.red,6);
   local(c,172,30,.05+pressure*.50,1,()=>{c.transform(Math.max(.28,1-pressure*.60),0,0,1,0,0);paperCard(c,45,51,1690+i,'#d3d8c7',.2);line(c,-17,-19,17,-19,'#888f7b',.7);});
  });
  landingBits(c,t,i);
 }
}
// 每格保留原图像素；边界按透明轮廓确定，避免分格线切到手脚。
const runAtlas=[
 [25,33,411,416,245,446],[513,42,291,407,655,446],
 [1000,18,231,430,1084,445],[1310,19,430,418,1550,451],
 [16,463,405,408,247,868],[511,479,304,393,665,869],
 [985,452,252,420,1089,869],[1325,460,433,378,1560,852]
];
const reboundAtlas=[
 [59,103,395,389,271,489,271,308],
 [611,196,313,297,752,490,752,365],
 [1146,46,283,461,1270,504,1270,281],
 [88,588,392,320,282,905,282,798],
 [578,576,425,386,782,959,782,797],
 [1084,601,394,361,1263,959,1263,790]
];
function drawMotionPose(c,kind,pose,x,y,size,angle=0,opacity=1,airborne=false){
 const im=kind==='run'?runnerRun:runnerRebound,rect=(kind==='run'?runAtlas:reboundAtlas)[pose];
 const [sx,sy,sw,sh,ax,ay]=rect,s=size/450;
 const px=airborne?rect[6]:ax,py=airborne?rect[7]:ay;
 c.save();c.globalAlpha*=opacity;c.translate(x,y);c.rotate(angle);
 c.shadowColor='#15181430';c.shadowBlur=5;c.shadowOffsetX=2;c.shadowOffsetY=5;
 c.drawImage(im,sx,sy,sw,sh,(sx-px)*s,(sy-py)*s,sw*s,sh*s);c.restore();
}
function runnerState(t){
 const travel=clamp((t-4.12)/(6.70-4.12));
 if(t<6.70){
  const cycle=((Math.max(0,t-4.12)/1.04)%1),pose=Math.floor(cycle*8);
  return {kind:'run',pose,x:lerp(257,1190,travel),y:lerp(682,612,travel),size:493,angle:-.024+Math.sin(cycle*Math.PI*2)*.014,airborne:false};
 }
 if(t<7.08){
  const compress=prog(t,6.70,6.96);
  return {kind:'rebound',pose:t<6.83?0:1,x:1190+compress*9,y:612+compress*13,size:493,angle:-.02,airborne:false};
 }
 const dt=t-7.08,pose=dt<.17?2:dt<.34?3:dt<.59?4:5;
 // 起飞后的腰部沿抛物线运动；先压低再蹬伸，姿态与飞行不再共用一个僵硬剪影。
 return {kind:'rebound',pose,x:1199+440*dt+310*dt*dt,y:488-790*dt+330*dt*dt,size:493,angle:-.02-clamp(dt/1.2)*.20,airborne:true};
}
function runActor(c,t){
 const s=runnerState(t);
 if(t>4.60&&t<6.70)for(const [delay,opacity] of [[.16,.08],[.08,.14]]){
  const trail=runnerState(t-delay);drawMotionPose(c,trail.kind,trail.pose,trail.x,trail.y,trail.size,trail.angle,opacity,trail.airborne);
 }
 // 纸带跟随弹起的身体，在人物出框前留下短暂的运动方向。
 leapStreamer(c,t,s.x,s.airborne?s.y+110:s.y);
 if(t<8.58)drawMotionPose(c,s.kind,s.pose,s.x,s.y,s.size,s.angle,1,s.airborne);
}

function finalTitles(c,t){
 const a=prog(t,9.3,10.5),wl=layout(wise,491,263,310,9),ml=layout(motionLight,691,643,283,4);
 wl.forEach((p,i)=>{
  const v=prog(t,9.15+i*.075,9.8+i*.075);drawGlyph(c,wise[i],lerp(p.x-95,p.x,v),lerp(-210,p.y,pop(v)),[-.045,.035,-.015,.025][i],p.s,lerp(-1.8,0,v),50*(1-v));
 });
 ml.forEach((p,i)=>{
  const v=prog(t,9.52+i*.095,10.24+i*.095),rot=[-.035,.02,-.03,.035,-.016,.025][i];
  drawGlyph(c,motionLight[i],lerp(p.x+210,p.x,v),lerp(1030,p.y,out(v)),rot+lerp(.45,0,v),p.s,lerp(2.0,0,v),70*(1-v));
 });
}
function contactStrip(c,x,y,t){
 local(c,x,y,-.065,1,()=>{
  paperCard(c,609,151,830,C.light,.7);
  for(let i=0;i<4;i++){
   const lift=Math.sin(clamp((t-4.23-i*.62)/.57)*Math.PI);
   local(c,-221+i*149,-lift*15,(random(80+i)-.5)*.05+lift*.035,1,()=>{
    c.fillStyle=i%2?'#dadcd1':'#e7e6dc';c.fillRect(-65,-62,130,122);
    c.save();c.beginPath();c.rect(-65,-62,130,122);c.clip();drawMotionPose(c,'run',i*2,0,55,120,0,.87);c.restore();
    printText(c,String(i+1).padStart(2,'0'),-58,70,8,'#767c6b');
    const active=Math.floor(Math.max(0,t-4.25)*2)%4;if(active===i&&t<8.6)line(c,-36,66,46,66,C.red,2.4);
   });
  }tab(c,-280,-65,-.15,.72);tab(c,279,64,.13,.72);
 });
}

function sceneMachine(c,t){
 layer('paper',()=>base(c));
 const zoom=prog(t,2.9,4.05),s=1+zoom*.82,pull=prog(t,.78,2.08);
 c.save();c.translate(800,450);c.scale(s,s);c.translate(-lerp(800,1080,zoom),-450);
 layer('paper',()=>{
  plate(c,'news',245,480,-.09,.97);plate(c,'draft',1025,410,.07,.99);
  unfoldingScale(c,t,pull);paperClip(c,1263,114,.19,1.1);
  texturedPolygon(c,[[398,635],[1220,590],[1320,824],[470,875]],'#dbdbcf');
  local(c,529,652,-.055,1,()=>{paperCard(c,525,44,401,C.ink,.6);for(let i=0;i<26;i++)line(c,-246+i*20,-20,-246+i*20,i%5?-8:6,C.light,.8);});
 });
 layer('type',()=>{
  const word=layout(wise,442,275,242,9);
  word.forEach((p,i)=>{const a=prog(t,i*.07,.3+i*.07);drawGlyph(c,wise[i],p.x,p.y+(1-a)*-320,[-.1,.07,-.06,.045][i],p.s,(1-a)*1.5,20*(1-a));});
  local(c,430,423,-.045,1,()=>{paperCard(c,282,46,412,C.light,.4);printText(c,'IDEAS INTO MOTION',0,6,17,C.ink,'Oswald','center');tab(c,-134,-19,-.14,.55);});
 });
 layer('paper',()=>accordion(c,855,700,pull));
 layer('ruler',()=>foldedRule(c,t));layer('mechanics',()=>machineLinkage(c,t));
 layer('runner',()=>{const runnerIn=prog(t,2.08,2.60);if(runnerIn>0){local(c,1163,187,0,pop(runnerIn),()=>paperCard(c,269,35,773,C.light,.7));drawRunner(c,0,1160,179,220*pop(runnerIn),-.055);}});
 layer('paper',()=>{registration(c,1440,158,26);printText(c,'WISE / MOTION',1467,850,12,'#62695b','Oswald','right');});
 layer('scraps',()=>shards(c,t,1.2,3.45,1080,434));c.restore();
}
function sceneRun(c,t){
 const u=t-3.5;
 layer('paper',()=>{base(c);plate(c,'news',1515,273,.16,.78);plate(c,'draft',207,475,-.11,.91);texturedPolygon(c,[[-50,740],[1640,667],[1640,945],[-50,965]],C.ink);});
 layer('platforms',()=>runPlatforms(c,t));
 layer('mechanics',()=>{flywheel(c,245,842,334,-u*1.7,.7);flywheel(c,1435,810,274,u*2.1,.7);});
 layer('type',()=>{
  const mt=layout(motion,821,258,271,17);
  mt.forEach((p,i)=>{const a=prog(t,3.75+i*.085,4.20+i*.085),pulse=Math.sin(clamp((t-5.05-i*.16)/.63)*Math.PI);drawGlyph(c,motion[i],p.x,p.y-43*pulse+(1-a)*-280,[-.08,.045,-.045,.065,-.04,.07][i]+pulse*.09,p.s,1.4*(1-a),pulse*40);});
 });
 layer('runner',()=>{runActor(c,t);contactStrip(c,591,806,t);});
 layer('paper',()=>{registration(c,1422,379,25);line(c,1290,382,1460,382,'#686e5e',.8);for(let i=0;i<7;i++){const xx=240+i*175;line(c,xx,54,xx,67,C.ink,1);printText(c,String(i*20),xx+4,64,9,'#6a705f');}});
 layer('scraps',()=>{const moving=runnerState(t);shards(c,t,6.85,8.5,moving.x,moving.y);});
}
function finalPaper(c){
 base(c);plate(c,'draft',1336,243,.16,.78);plate(c,'news',136,765,-.16,.68);paperClip(c,1427,125,.24,.9);
 const edge=[];for(let i=0;i<=90;i++)edge.push([-80+i*20,lerp(474,416,i/90)+(random(i+732)-.5)*7]);
 texturedPolygon(c,[...edge,[1720,1010],[-90,1020]],C.ink);
 c.save();c.globalAlpha=.25;for(let i=0;i<36;i++)line(c,1150+i*13,495,1440+i*13,900,'#b0b5a4',.8);c.restore();
}
function sceneFinal(c,t){
 layer('paper',()=>finalPaper(c));
 layer('mechanics',()=>flywheel(c,1518,759,487,lerp(-2.2,-.20,prog(t,9.0,11.4)),.5));
 layer('runner',()=>{
  const enter=prog(t,8.75,10.0),arc=Array.from({length:90},(_,i)=>{const a=2.1+i/89*3.4;return[1225+Math.cos(a)*244,268+Math.sin(a)*244];});
  ribbon(c,arc,prog(t,9.15,10.18),13);drawRunner(c,3,lerp(1530,1260,enter),lerp(409,443,enter),559,-.08+.055*enter);
 });
 layer('paper',()=>{registration(c,1006,124,23);printText(c,'WISE MOTION',1066,78,13,'#6b705f');});
 layer('type',()=>{
  finalTitles(c,t);
  if(t>10.32){const p=prog(t,10.32,10.8);local(c,458,792+55*(1-p),-.038,pop(p),()=>{paperCard(c,366,53,261,C.light,.4);printText(c,'IDEAS INTO MOTION',0,7,20,C.ink,'Oswald','center');tab(c,-171,-20,-.17,.65);});}
 });
 layer('scraps',()=>returningScraps(c,t));
 layer('type',()=>{const stamp=prog(t,10.8,11.3);if(stamp>0)local(c,1008,801,lerp(-.25,-.1,stamp),pop(stamp),()=>{paperCard(c,137,53,182,C.red,lerp(1.2,.35,stamp));c.save();c.setLineDash([2,4]);c.strokeStyle='#f5ecdc99';c.lineWidth=.7;c.strokeRect(-61,-19,122,38);c.restore();printText(c,'WM',0,15,42,C.light,'Oswald','center');});});
}
function frame(c,seconds){
 const t=Math.min(DURATION,Math.floor(Math.max(0,seconds)*FPS+.00001)/FPS);
 c.clearRect(0,0,c.canvas.width,c.canvas.height);c.save();c.setTransform(c.canvas.width/W,0,0,c.canvas.height/H,0,0);
 if(t<4.12)sceneMachine(c,t);else if(t<9.5)sceneRun(c,t);else sceneFinal(c,t);
 // The wheel aperture opens into the running study as the camera reaches the hub.
 if(t>=3.45&&t<4.12){const p=prog(t,3.45,4.12);c.save();c.beginPath();c.arc(884,448,Math.max(.01,p*1830),0,Math.PI*2);c.clip();sceneRun(c,t);c.restore();}
 // The leap pushes a tall diagonal sheet across, revealing the assembled brand.
 if(t>=8.65&&t<9.5){const p=prog(t,8.65,9.5),x=lerp(1830,-540,p);c.save();path(c,[[x-110,-100],[1800,-100],[1800,1000],[x+400,1000]]);c.clip();sceneFinal(c,t);c.restore();layer('paper',()=>line(c,x-106,-80,x+404,980,'#e6e5d8',8));}
 c.restore();
}

function loadAsset(name){
 return new Promise((resolve,reject)=>{
  const im=new doc.defaultView.Image();
  const cancel=()=>{im.onload=im.onerror=null;im.removeAttribute('src');resolve(null);};pending.add(cancel);
  im.onload=()=>{pending.delete(cancel);im.onload=im.onerror=null;resolve(im);};
  im.onerror=()=>{pending.delete(cancel);im.onload=im.onerror=null;reject(new Error('剪贴素材加载失败：'+name));};
  im.src=assetURL(doc,name);
 });
}
const ready=(async()=>{
 await doc.fonts?.load('700 270px Oswald');if(dead)return;
 fiber=paperFibers(W,H,331);
 if(!only||only==='mechanics')[hand,wheel]=await Promise.all([loadAsset('hand.png'),loadAsset('flywheel.png')]);
 if(dead)return;
 if(!only)runner=await loadAsset('runner-poses.png');
 if(dead)return;
 if(!only||only==='runner')[runnerRun,runnerRebound]=await Promise.all([loadAsset('runner-run-cycle.png'),loadAsset('runner-rebound.png')]);
 if(dead)return;
 if(!only||only==='type'){
  wise=wordData('WISE',611);motion=wordData('MOTION',719);
  const originalInk=C.ink,originalLight=C.light;C.ink='#f1eee4';C.light='#232420';motionLight=wordData('MOTION',820);C.ink=originalInk;C.light=originalLight;
 }
 if(!only||only==='type'){plates.draft=buildPlate(705,640,218,'draft');plates.news=buildPlate(383,648,229,'news');}
})();
function single(c,key,seconds){
 const t=Math.floor(seconds*FPS+.00001)/FPS;
 c.clearRect(0,0,c.canvas.width,c.canvas.height);c.save();c.setTransform(c.canvas.width/W,0,0,c.canvas.height/H,0,0);base(c);
 if(key==='type'){finalPaper(c);finalTitles(c,t);}
 else if(key==='mechanics')machineLinkage(c,t);
 else if(key==='ruler')local(c,800,450,0,2.6,()=>{c.translate(-500,-770);foldedRule(c,t);});
 else if(key==='platforms')local(c,0,-180,0,1,()=>runPlatforms(c,t));
 else if(key==='runner')runActor(c,t);
 else if(key==='scraps')returningScraps(c,t);
 c.restore();
}
function destroy(){
 if(dead)return;dead=true;pending.forEach(cancel=>cancel());pending.clear();
 buffers.forEach(cv=>{cv.width=cv.height=1;});buffers.clear();stripCache.clear();
 fiber=hand=wheel=runner=runnerRun=runnerRebound=wise=motion=motionLight=null;plates={};
}
return {ready,frame,single,destroy};
}
function make(root,K,definition,part){
 const doc=root.ownerDocument,canvas=doc.createElement('canvas');canvas.width=definition.poster_only?640:1600;canvas.height=definition.poster_only?360:900;
 Object.assign(canvas.style,{position:'absolute',inset:'0',width:'640px',height:'360px'});canvas.setAttribute('role','img');canvas.setAttribute('aria-label',definition.name||'剪贴联动与海报归位');
 root.dataset.art='original';root.style.background='#f1eee6';root.replaceChildren(canvas);
 const markers=new Map();
 if(!part)for(const key of ['paper',...parts.map(p=>p.key)]){const marker=doc.createElement('span');marker.dataset.layer=key;marker.hidden=true;root.append(marker);markers.set(key,marker);}
 const ctx=canvas.getContext('2d'),painter=ctx?createPainter(doc,key=>!markers.get(key)?.hasAttribute('data-composition-hidden'),part?.key):null;
 let dead=false,prepared=!painter,previous=0,last=-1;
 const duration=definition.duration_ms||(part?(part.end-part.start)*1000:14000);
 function render(ms,options={}){
  if(dead)return;if(!Number.isFinite(ms))throw new TypeError('时间必须是有限数字');
  previous=Math.max(0,Math.min(duration,ms));
  const seconds=part?part.start+previous/duration*(part.end-part.start):previous/1000;
  const tick=Math.floor(seconds*FPS+.00001);if(!prepared||tick===last&&!options.force)return;last=tick;
  canvas.dataset.frame=String(tick);canvas.dataset.part=part?.key||'composition';
  if(painter){if(part)painter.single(ctx,part.key,seconds);else painter.frame(ctx,seconds);}
 }
 const Observer=doc.defaultView?.MutationObserver;
 const observer=!part&&Observer?new Observer(()=>render(previous,{force:true})):null;
 observer?.observe(root,{subtree:true,attributes:true,attributeFilter:['data-composition-hidden']});
 render.ready=Promise.resolve(painter?.ready).then(()=>{if(dead)return;prepared=true;render(previous,{force:true});});
 render.frameRate=FPS;
 render.destroy=(preserve=false)=>{if(dead)return;dead=true;observer?.disconnect();painter?.destroy();markers.forEach(node=>node.remove());markers.clear();if(!preserve){canvas.width=canvas.height=1;root.replaceChildren();}};
 render(0);return render;
}
const F=global.MotionFactories=global.MotionFactories||{};
for(const part of parts){F[part.id]=(root,K,definition)=>make(root,K,definition,part);F[part.id].requiresPreparation=true;}
F['collage-film-sequence']=(root,K,definition)=>make(root,K,definition);
F['collage-film-sequence'].requiresPreparation=true;
F['collage-film-sequence'].breakdown=[
 {id:'paper',name:'纸面与转场',actions:[],start:0,end:14000,time:'全片',detail:'新闻剪报、机械图、撕边纸底与刻度；3.45–4.12秒转轮圆孔展开，8.65–9.50秒斜切纸面接入海报。'},
 {id:'type',name:'字片折落与归位',actions:['cutout-type-fold'],start:0,end:11300,time:'0–11.30秒',detail:'字片保留白色切边、反面、折角和近纸阴影；WISE、MOTION分段入场，片尾重新排成上下两行。'},
 {id:'mechanics',name:'手掌牵引与曲柄',actions:['crank-linked-turn'],start:0,end:11400,time:'0–11.40秒',detail:'手掌拉红带，大转轮带动偏心销、连杆与小转轴；侧边两片纸齿轮按不同转速联动。'},
 {id:'ruler',name:'连节折尺',actions:['joint-rule-unfold'],start:1350,end:2550,time:'1.35–2.55秒',detail:'六节刻度纸尺围绕连接点逐节展开，每节末端成为下一节起点。'},
 {id:'platforms',name:'纸台受力回弹',actions:['folded-step-rebound'],start:4400,end:7500,time:'4.40–7.50秒',detail:'三阶纸台在4.64、5.68、6.70秒受压，台面下沉13像素、折叠支撑收紧，侧纸舌翻动并弹起小纸屑。'},
 {id:'runner',name:'剪影跑跃与纸带',actions:['cutout-stride-leap'],start:2080,end:10180,time:'2.08–10.18秒',detail:'八帧跑步循环连贯承重与蹬地，六帧蓄力与弹离姿态接续第三阶受力；两层淡印样跟随，红纸带带出飞行方向。'},
 {id:'scraps',name:'碎纸散开与归位',actions:['scraps-return-layout'],start:1200,end:12000,time:'1.20–12.00秒',detail:'运动时碎纸由局部散出；收尾十片印刷碎纸先外散，再收回海报边缘的固定位置，12秒起稳定。'}
];
})(globalThis);
