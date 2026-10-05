/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
 * 基于本机展示片独立绘制并经用户精修确认；无原片像素或媒体依赖。 */
(function(global){
'use strict';
// Fixed Helvetica Neue Bold outlines: MOTION exactly matches reel-opening.js.
// WISE uses the same installed face; no font file or runtime font dependency is added.
const wordmarkGlyphs={"W":{"advance":944,"bounds":[3,0,941,714],"path":[["M",749,0],["L",941,714],["L",787,714],["L",670,222],["L",668,222],["L",546,714],["L",399,714],["L",275,228],["L",273,228],["L",160,714],["L",3,714],["L",192,0],["L",351,0],["L",470,486],["L",472,486],["L",593,0],["Z"]]},"I":{"advance":295,"bounds":[69,0,226,714],"path":[["M",69,714],["L",69,0],["L",226,0],["L",226,714],["Z"]]},"S":{"advance":649,"bounds":[23.96153846153846,-16,625,731],"path":[["M",176,237],["L",24,237],["Q",23,171,48.0,123.0],["Q",73,75,115.5,44.0],["Q",158,13,213.5,-1.5],["Q",269,-16,328,-16],["Q",401,-16,456.5,1.0],["Q",512,18,549.5,48.5],["Q",587,79,606.0,121.0],["Q",625,163,625,212],["Q",625,272,599.5,310.5],["Q",574,349,539.0,372.0],["Q",504,395,468.5,405.5],["Q",433,416,413,420],["Q",346,437,304.5,448.0],["Q",263,459,239.5,470.0],["Q",216,481,208.0,494.0],["Q",200,507,200,528],["Q",200,551,210.0,566.0],["Q",220,581,235.5,591.0],["Q",251,601,270.0,605.0],["Q",289,609,308,609],["Q",337,609,361.5,604.0],["Q",386,599,405.0,587.0],["Q",424,575,435.5,554.0],["Q",447,533,449,501],["L",601,501],["Q",601,563,577.5,606.5],["Q",554,650,514.0,678.0],["Q",474,706,422.5,718.5],["Q",371,731,315,731],["Q",267,731,219.0,718.0],["Q",171,705,133.0,678.0],["Q",95,651,71.5,610.5],["Q",48,570,48,515],["Q",48,466,66.5,431.5],["Q",85,397,115.0,374.0],["Q",145,351,183.0,336.5],["Q",221,322,261,312],["Q",300,301,338.0,292.0],["Q",376,283,406.0,271.0],["Q",436,259,454.5,241.0],["Q",473,223,473,194],["Q",473,167,459.0,149.5],["Q",445,132,424.0,122.0],["Q",403,112,379.0,108.5],["Q",355,105,334,105],["Q",303,105,274.0,112.5],["Q",245,120,223.5,135.5],["Q",202,151,189.0,176.0],["Q",176,201,176,237],["Z"]]},"E":{"advance":648,"bounds":[69,0,611,714],"path":[["M",69,714],["L",69,0],["L",611,0],["L",611,132],["L",226,132],["L",226,307],["L",572,307],["L",572,429],["L",226,429],["L",226,582],["L",603,582],["L",603,714],["Z"]]},"M":{"advance":907,"bounds":[69,0,838,714],"path":[["M",69,714],["L",69,0],["L",216,0],["L",216,501],["L",218,501],["L",393,0],["L",514,0],["L",689,506],["L",691,506],["L",691,0],["L",838,0],["L",838,714],["L",617,714],["L",459,223],["L",457,223],["L",290,714],["Z"]]},"O":{"advance":778,"bounds":[38,-16,740,731],"path":[["M",195,354],["Q",195,401,205.5,445.0],["Q",216,489,239.0,523.5],["Q",262,558,299.0,578.5],["Q",336,599,389,599],["Q",442,599,479.0,578.5],["Q",516,558,539.0,523.5],["Q",562,489,572.5,445.0],["Q",583,401,583,354],["Q",583,309,572.5,266.5],["Q",562,224,539.0,190.0],["Q",516,156,479.0,135.5],["Q",442,115,389,115],["Q",336,115,299.0,135.5],["Q",262,156,239.0,190.0],["Q",216,224,205.5,266.5],["Q",195,309,195,354],["Z"],["M",38,354],["Q",38,276,62.0,208.5],["Q",86,141,131.0,91.0],["Q",176,41,241.5,12.5],["Q",307,-16,389,-16],["Q",472,-16,537.0,12.5],["Q",602,41,647.0,91.0],["Q",692,141,716.0,208.5],["Q",740,276,740,354],["Q",740,434,716.0,502.5],["Q",692,571,647.0,622.0],["Q",602,673,537.0,702.0],["Q",472,731,389,731],["Q",307,731,241.5,702.0],["Q",176,673,131.0,622.0],["Q",86,571,62.0,502.5],["Q",38,434,38,354],["Z"]]},"T":{"advance":611,"bounds":[13,0,598,714],"path":[["M",227,582],["L",227,0],["L",384,0],["L",384,582],["L",598,582],["L",598,714],["L",13,714],["L",13,582],["Z"]]},"N":{"advance":741,"bounds":[69,0,672,714],"path":[["M",69,714],["L",69,0],["L",216,0],["L",216,478],["L",218,478],["L",515,0],["L",672,0],["L",672,714],["L",525,714],["L",525,235],["L",523,235],["L",225,714],["Z"]]}};
const wordmarkScale=56/714,wordmarkTracking=-20*wordmarkScale,wordmarkBaseline=332;
const wordmarkLetters=[];let wordmarkAdvance=0;
for(const letter of 'WISE MOTION'){
 if(letter===' '){wordmarkAdvance+=28-wordmarkTracking;continue;}
 const width=wordmarkGlyphs[letter].advance*wordmarkScale;
 wordmarkLetters.push({letter,x:wordmarkAdvance,width});wordmarkAdvance+=width+wordmarkTracking;
}
const wordmarkLeft=(1066-(wordmarkAdvance-wordmarkTracking))/2;
for(const item of wordmarkLetters)item.x+=wordmarkLeft;
const wordmarkOBounds=wordmarkLetters.filter(item=>item.letter==='O').map(item=>{
 const [left,bottom,right,top]=wordmarkGlyphs.O.bounds;
 return [item.x+left*wordmarkScale,wordmarkBaseline-top*wordmarkScale,(right-left)*wordmarkScale,(top-bottom)*wordmarkScale];
});
const wordmarkOs=wordmarkOBounds.map(([x,y,w,h])=>x+w/2),wordmarkOY=wordmarkOBounds[0][1]+wordmarkOBounds[0][3]/2;
const wordmarkLensSize=wordmarkOBounds[0][2];
const spatialCardSpecs={listening:[300,148,28],chat:[578,414,38],focus:[356,202,30],music:[520,300,36],weather:[320,360,36],controls:[390,360,38]};
const spatialDuration=7.2,spatialFocal=1250,glassThickness=10;
const bluetoothPaths=[[[0,-10],[0,10],[7,5],[-7,-5]],[[-7,5],[7,-5],[0,-10]]];
function cardMotionAt(time){
 const t=Math.max(0,Math.min(spatialDuration,time)),p=(a,b)=>{const q=Math.max(0,Math.min(1,(t-a)/(b-a)));return q*q*(3-2*q);};
 return {waveTime:Math.min(t,1.5),ripplePhase:t/1.35,rippleStrength:.2+.8*p(.95,1.4)*(1-p(2.05,2.6)),musicProgress:.387+.08*p(1.05,2.4),brightness:.32+.54*p(2.65,3.25)-.12*p(3.25,3.8),volume:.18+.48*p(2.95,3.6)-.20*p(3.6,4.05),replies:[0,1,2,3].map(i=>p(4.28+i*.25,4.49+i*.25))};
}
// Monotone cubic interpolation carries velocity through gentle drift without overshoot.
function flowingPose(rows,t){
 let j=0;while(j<rows.length-2&&t>rows[j+1][0])j++;
 const [a,from]=rows[j],[b,to]=rows[j+1],h=b-a,q=Math.max(0,Math.min(1,(t-a)/h));
 return from.map((v,k)=>{
  const slope=i=>{
   if(i===0||i===rows.length-1)return 0;
   const left=rows[i][0]-rows[i-1][0],right=rows[i+1][0]-rows[i][0],d0=(rows[i][1][k]-rows[i-1][1][k])/left,d1=(rows[i+1][1][k]-rows[i][1][k])/right;
   if(d0*d1<=0)return 0;
   const w0=2*right+left,w1=right+2*left;return (w0+w1)/(w0/d0+w1/d1);
  };
  return (2*q**3-3*q*q+1)*v+(q**3-2*q*q+q)*h*slope(j)+(-2*q**3+3*q*q)*to[k]+(q**3-q*q)*h*slope(j+1);
 });
}
function projectGlassPoint(point,pose,camera=[0,0,0]){
 const [px,py,pz,rx,ry,rz,scale]=pose,rad=Math.PI/180;
 let [x,y,z]=point.map(v=>v*scale);
 [y,z]=[y*Math.cos(rx*rad)-z*Math.sin(rx*rad),y*Math.sin(rx*rad)+z*Math.cos(rx*rad)];
 [x,z]=[x*Math.cos(ry*rad)+z*Math.sin(ry*rad),-x*Math.sin(ry*rad)+z*Math.cos(ry*rad)];
 [x,y]=[x*Math.cos(rz*rad)-y*Math.sin(rz*rad),x*Math.sin(rz*rad)+y*Math.cos(rz*rad)];
 x+=px;y+=py;z+=pz;
 const yaw=camera[0]*rad;[x,z]=[x*Math.cos(yaw)+z*Math.sin(yaw),-x*Math.sin(yaw)+z*Math.cos(yaw)];
 x-=camera[1];z+=camera[2];
 const distance=spatialFocal-z;
 if(!Number.isFinite(distance)||distance<100)throw new RangeError('玻璃卡越过安全投影范围');
 const factor=spatialFocal/distance;return [533+x*factor,292+y*factor,z];
}
function glassPerimeter(w,h,r){
 const points=[];
 for(const [cx,cy,start] of [[w/2-r,-h/2+r,-90],[w/2-r,h/2-r,0],[-w/2+r,h/2-r,90],[-w/2+r,-h/2+r,180]])
  for(let i=0;i<=8;i++){const a=(start+i*90/8)*Math.PI/180;points.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}
 return points;
}
function spatialCardsAt(time){
 const t=Math.max(0,Math.min(spatialDuration,time)),clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);},progress=(a,b)=>smooth((t-a)/(b-a));
 const home={listening:[-310,-145,-200,8,30,-7,.82],chat:[0,-10,50,-6,-14,-2,.88],focus:[-250,140,-110,10,25,-8,.85],music:[315,-155,-270,-5,-30,8,.68],weather:[355,80,-220,6,-34,8,.60],controls:[135,160,-340,15,-18,5,.62]};
 const shelf={listening:[-360,-165,-280,12,28,-8,.78],chat:[-340,10,-330,8,32,-5,.62],focus:[-330,160,-220,10,28,-7,.70],music:[300,-170,-300,-8,-30,6,.62],weather:[350,25,-260,-6,-34,6,.58],controls:[300,165,-230,12,-32,7,.60]};
 const music={...shelf,music:[0,-10,145,8,-20,-4,1]},weather={...shelf,weather:[0,0,150,-7,22,4,1.1]},controls={...shelf,controls:[0,0,165,8,-20,-3,1.04]};
 const gallery={listening:[-340,-170,-60,10,28,-8,.82],chat:[-55,-110,-220,-10,10,0,.57],focus:[-330,135,-60,8,25,-7,.82],music:[285,-165,-120,-6,-25,6,.65],weather:[30,115,30,-6,12,3,.73],controls:[335,125,-80,10,-30,6,.73]};
 const chat={...shelf,chat:[0,-10,85,-5,-10,-2,.93]};
 const timeline=[[.85,home],[1.05,home],[1.55,music],[1.9,music],[2.4,weather],[2.75,weather],[3.25,controls],[3.6,controls],[4.15,gallery],[4.4,gallery],[4.9,chat],[5.35,chat]];
 const camera=[(-8+16*progress(0,5.15))*(1-progress(5.15,6.3)),0,32*Math.sin(Math.PI*clamp(t/6.3))];
 const cards=Object.keys(spatialCardSpecs).map((key,i)=>{
  const start=key==='listening'?[-880,-140,-180,5,22,-5,.82]:[home[key][0]*.25,home[key][1]*.2+30,-620-i*28,15,i%2?68:-68,i%2?12:-12,.7];
  const end=[(shelf[key][0]<0?-1:1)*(720+i*25),shelf[key][1]*2.1,-700,15,i%2?65:-65,i%2?18:-18,.55];
  const rows=[[0,start],...timeline.map(([at,poses],j)=>{
   const value=[...poses[key]];
   if(j%2===1){value[0]+=6;value[1]-=3;value[2]+=8;value[4]+=1.5;}
   return [at,value];
  }),[6.3,end],[spatialDuration,end]];
  const local=Math.max(0,t-i*.016),pose=flowingPose(rows,local);
  const opacity=progress(.06+i*.035,.48+i*.035)*(1-progress(5.4+i*.025,6.2+i*.025));
  return {key,pose,opacity,depth:projectGlassPoint([0,0,0],pose,camera)[2]};
 }).sort((a,b)=>a.depth-b.depth);
 return {t,camera,cards,phase:t<1.05?'六卡展开':t<1.9?'音乐卡前移':t<2.75?'天气卡前移':t<3.6?'控制中心前移':t<4.4?'六卡空间展开':t<6.3?'折射与退场':'字标收尾'};
}
function paintWordmarkLetter(c,item){
 c.save();c.translate(item.x,wordmarkBaseline);c.scale(wordmarkScale,-wordmarkScale);c.beginPath();
 for(const [op,...n]of wordmarkGlyphs[item.letter].path){
  if(op==='M')c.moveTo(...n);else if(op==='L')c.lineTo(...n);else if(op==='Q')c.quadraticCurveTo(...n);else if(op==='C')c.bezierCurveTo(...n);else c.closePath();
 }
 c.fill();c.restore();
}
function createPainter(doc=global.document){

const W=1066,H=600,TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,q)=>a+(b-a)*q,ease=v=>{v=clamp(v);return v*v*(3-2*v)},p=(t,a,b)=>ease((t-a)/(b-a));
function keys(t,rows){let i=0;while(i<rows.length-2&&t>rows[i+1][0])i++;const a=rows[i],b=rows[i+1],q=clamp((t-a[0])/(b[0]-a[0]));return a.slice(1).map((v,j)=>mix(v,b[j+1],ease(q)));}
function canvas(w=W,h=H){const v=doc.createElement('canvas');v.width=w;v.height=h;return v}
function rr(c,x,y,w,h,r,fill,stroke,width=1){c.beginPath();c.roundRect(x,y,w,h,Math.min(r,h/2,w/2));if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
function line(c,x,y,a,b,color,width=1){c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function circle(c,x,y,r,fill,stroke,width=1){c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
function text(c,s,x,y,size,color='#f5f5f5',weight=400){c.font=`${weight} ${size}px Arial,"PingFang SC",sans-serif`;c.textBaseline='alphabetic';c.textAlign='left';c.fillStyle=color;c.fillText(s,x,y)}
function alpha(c,a,fn){if(a<=0)return;c.save();c.globalAlpha*=clamp(a);fn();c.restore()}
function light(c,x,y,rx,ry,col,opacity=1,falloff=.5){c.save();c.translate(x,y);c.scale(1,ry/rx);const g=c.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,`rgba(${col},${opacity})`);g.addColorStop(falloff,`rgba(${col},${opacity*.48})`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.fillRect(-rx,-rx,rx*2,rx*2);c.restore()}
const bg=canvas(),bgc=bg.getContext('2d'),base=canvas(),bc=base.getContext('2d',{willReadFrequently:true}),paneSource=canvas(),pc=paneSource.getContext('2d'),lens=canvas(320,180),lc=lens.getContext('2d');
const glowFields=[[380.0,160.0,110.0,185.0],[535.0,215.0,170.0,130.0],[470.0,425.0,145.0,180.0],[690.0,480.0,150.0,126.0],[815.0,404.0,105.0,110.0],[724.0,28.0,95.0,78.0],[620.0,62.0,92.0,110.0],[574.0,330.0,168.0,106.0],[536.0,546.0,131.0,110.0],[903.0,349.0,83.0,146.0],[325.0,46.0,75.0,88.0],[537.0,145.0,170.0,88.0],[673.0,323.0,144.0,108.0],[359.0,326.0,85.0,126.0]];
const glowKeys=[[1.1,[[8.06,8.06,8.06],[0.0,0.0,0.0],[14.474,14.474,14.474],[24.343,24.343,24.343],[19.763,19.763,19.763],[23.847,23.847,23.847],[0.0,0.0,0.0],[2.716,2.716,2.716],[3.319,3.319,3.319],[12.981,12.981,12.981],[13.807,13.807,13.807],[37.361,37.361,37.361],[0.0,0.0,0.0],[3.559,3.559,3.559]]],[1.75,[[1.218,1.218,1.218],[0.0,0.0,0.0],[21.257,21.257,21.257],[21.606,21.606,21.606],[20.008,20.008,20.008],[29.714,29.714,29.714],[4.093,4.093,4.093],[1.552,1.552,1.552],[0.0,0.0,0.0],[13.6,13.6,13.6],[36.295,36.295,36.295],[6.04,6.04,6.04],[16.806,16.806,16.806],[13.624,13.624,13.624]]],[2.25,[[17.318,17.318,17.318],[0.0,0.0,0.0],[18.753,18.753,18.753],[22.454,22.454,22.454],[31.122,31.122,31.122],[34.226,34.226,34.226],[7.241,7.241,7.241],[6.352,6.352,6.352],[8.911,8.911,8.911],[8.054,8.054,8.054],[16.54,16.54,16.54],[33.729,33.729,33.729],[1.601,1.601,1.601],[0.0,0.0,0.0]]],[2.85,[[0.0,0.0,0.0],[18.576,18.576,18.576],[21.567,21.567,21.567],[14.029,14.029,14.029],[27.506,27.506,27.506],[23.458,23.458,23.458],[5.236,5.236,5.236],[19.821,19.821,19.821],[10.306,10.306,10.306],[2.211,2.211,2.211],[19.421,19.421,19.421],[22.792,22.792,22.792],[12.175,12.175,12.175],[13.917,13.917,13.917]]],[3.45,[[0.0,0.0,0.0],[16.349,16.349,16.349],[20.274,20.274,20.274],[16.71,16.71,16.71],[25.81,25.81,25.81],[26.127,26.127,26.127],[0.955,0.955,0.955],[25.346,25.346,25.346],[10.579,10.579,10.579],[0.397,0.397,0.397],[15.132,15.132,15.132],[22.609,22.609,22.609],[11.086,11.086,11.086],[17.752,17.752,17.752]]]];
function background(c,t){
 c.fillStyle='#101010';c.fillRect(0,0,W,H);let i=0;while(i<glowKeys.length-2&&t>glowKeys[i+1][0])i++;const ka=glowKeys[i],kb=glowKeys[i+1],q=p(t,ka[0],kb[0]);
 c.save();c.globalCompositeOperation='lighter';
 for(let j=0;j<glowFields.length;j++){
  const [x,y,sx,sy]=glowFields[j],rgb=ka[1][j].map((a,k)=>mix(a,kb[1][j][k],q)),m=Math.max(...rgb,1),color=rgb.map(a=>Math.round(a/Math.max(m,255)*255));
  c.save();c.translate(x,y);c.scale(sx,sy);const g=c.createRadialGradient(0,0,0,0,0,3.7);
  for(let k=0;k<=16;k++){const r=k/16*3.7;g.addColorStop(k/16,`rgba(${color.join(',')},${Math.exp(-r*r/2)})`)}
  c.fillStyle=g;c.fillRect(-3.7,-3.7,7.4,7.4);c.restore();
 }c.restore();
 const stars=[[266,467,.9],[572,173,.8],[667,184,1.1],[751,135,.8],[950,436,.7],[904,266,.65],[570,333,.6],[801,62,.7]];
 stars.forEach(([x,y,r],i)=>{c.globalAlpha=(.12+.12*p(t,.4,2.9))*(.8+.2*Math.sin(i+t));circle(c,x,y,r,'#b8b8b8')});c.globalAlpha=1;
}
// Sample the actual light and rear card in screen coordinates. Keep neutral highlights
// over a low-luminance field so white interface text remains readable.
function glass(c,w,h,r,type){
 const matrix=c.getTransform();pc.setTransform(1,0,0,1,0,0);pc.clearRect(0,0,W,H);pc.drawImage(base,0,0);
 c.save();rr(c,0,0,w,h,r,'#ffffff');c.globalCompositeOperation='source-over';c.shadowColor='#02020270';c.shadowBlur=18;c.shadowOffsetY=13;rr(c,0,0,w,h,r,'#16161622');c.shadowBlur=0;c.shadowOffsetY=0;c.restore();
 c.save();c.beginPath();c.roundRect(0,0,w,h,r);c.clip();c.setTransform(1,0,0,1,0,0);c.filter='blur(10px)';c.drawImage(paneSource,0,0);c.filter='none';c.setTransform(matrix);
 const milk=c.createLinearGradient(0,0,w,h);milk.addColorStop(0,type==='focus'?'#b8b8b811':'#d9d9d909');milk.addColorStop(1,'#d4d4d405');c.fillStyle=milk;c.fillRect(0,0,w,h);const body=c.createLinearGradient(0,0,w,h);body.addColorStop(0,type==='focus'?'#acacac24':'#c9c9c922');body.addColorStop(.42,type==='focus'?'#2c2c2c29':'#5555552a');body.addColorStop(1,type==='focus'?'#5050503d':'#b2b2b220');c.fillStyle=body;c.fillRect(0,0,w,h);
 if(type==='chat'){
  light(c,175,52,259,172,'97,97,97',.38);light(c,460,310,320,259,'138,138,138',.42);light(c,183,279,273,231,'76,76,76',.19);
 }else if(type==='focus'){
  const dark=c.createLinearGradient(0,0,w,0);dark.addColorStop(0,'#1d1d1d70');dark.addColorStop(.40,'#1b1b1b35');dark.addColorStop(1,'#14141400');c.fillStyle=dark;c.fillRect(0,0,w,h);light(c,w*.94,h*.81,w*.82,h*.99,'75,75,75',.53);light(c,w*.91,17,99,63,'113,113,113',.40);
 }else{light(c,w*.6,h*.25,w*.9,h*1.4,'91,91,91',.37)}
 const sheen=c.createLinearGradient(0,0,w*.8,h);sheen.addColorStop(0,'#ececec13');sheen.addColorStop(.19,'#ffffff07');sheen.addColorStop(.36,'#c4c4c400');sheen.addColorStop(.43,'#d9d9d90a');sheen.addColorStop(.57,'#ffffff00');sheen.addColorStop(1,'#d3d3d308');c.fillStyle=sheen;c.fillRect(0,0,w,h);c.restore();
 const edge=c.createLinearGradient(0,0,w,h);edge.addColorStop(0,'#e8e8e86b');edge.addColorStop(.26,'#d2d2d23c');edge.addColorStop(.59,'#c0c0c02b');edge.addColorStop(1,'#c3c3c359');rr(c,.65,.65,w-1.3,h-1.3,r-.65,null,edge,1.15);rr(c,2.2,2.2,w-4.4,h-4.4,r-2.2,null,'#16161625',1.4);
 const bevel=c.createLinearGradient(0,0,0,h);bevel.addColorStop(0,'#d6d6d620');bevel.addColorStop(.16,'#dedede00');bevel.addColorStop(.82,'#3d3d3d00');bevel.addColorStop(1,'#85858522');rr(c,4,4,w-8,h-8,r-4,null,bevel,1.25);
}
function orb(c,x,y,r){const g=c.createRadialGradient(x-r*.22,y-r*.3,.2,x,y,r);g.addColorStop(0,'#cacaca');g.addColorStop(.24,'#777777');g.addColorStop(.58,'#797979');g.addColorStop(.82,'#454545');g.addColorStop(1,'#303030');circle(c,x,y,r,g,'#d7d7d7f0',1.1);circle(c,x,y,r-1.4,null,'#b6b6b635',.7);light(c,x-r*.2,y-r*.2,r*.66,r*.66,'156,156,156',.35)}
function pose(c,row,fn){const [x,y,s,a]=row;c.save();c.translate(x,y);c.transform(s,Math.tan(a||0)*s,0,s,0,0);fn();c.restore()}
const chatPos=[[0,156,153,1.11,-.025],[.15,158,153,1.11,-.025],[.35,168,149,1.12,-.025],[.65,296,120,.91,-.024],[1.1,402,99,.75,-.023],[1.55,413,-30,.93,-.008],[1.75,413,-80,.968,.001],[1.83,412,-70,.967,.001],[1.95,397,6,.92,.003],[2.0833,378,51,.918,-.018],[2.25,374,69,.915,-.018],[2.45,374,76,.915,-.018],[2.6,426,49,.956,-.004],[2.65,539,49,.975,-.01],[2.7833,727,58,.975,-.01],[2.84,1300,43,.975,-.01]];
const focusPos=[[0,-620,678,1.07,-.012],[.35,-54,553,1.07,-.012],[.65,-22,446,1.03,-.012],[1.1,152,368,.884,-.014],[1.55,96,298,1.122,-.012],[1.75,81,273,1.166,-.012],[1.9,77,282,1.161,-.012],[2.0833,64,373,1.105,-.012],[2.25,63,389,1.101,-.012],[2.45,57,393,1.114,-.012],[2.6,36,467,1.085,-.012],[2.65,-112,526,1.12,-.012],[2.7833,-335,652,1.12,-.012],[2.86,-1100,810,1.12,-.012]];
const listenPos=[[0,103,166,1.04,.018],[.15,102,166,1.04,.018],[.35,64,120,1.04,.018],[.65,186,91,.92,.019],[1.1,294,71,.77,.023],[1.55,278,-20,.934,.020],[1.75,273,-67,.967,.020],[1.9,269,-45,.963,.020],[2.0833,252,25,.90,.019],[2.25,249,38,.91,.020],[2.45,245,37,.91,.019],[2.6,60,-8,.91,.02],[2.65,-198,-30,.91,.02],[2.78,-680,-110,.91,.02]];
function listening(c,t,row=keys(t,listenPos),motion=null,material=true){alpha(c,1-p(t,2.43,2.72),()=>pose(c,row,()=>{if(material)glass(c,300,148,28,'listen');const fade=p(t,.10,.38)*(1-p(t,2.47,2.63));alpha(c,fade,()=>{text(c,'Voice input',23,37,15,'#f0f0f0',550);text(c,'0:'+String(Math.min(9,Math.floor((t+.03)*3.5)+2)).padStart(2,'0'),116,37,12,'#cccccc');for(let i=0;i<30;i++){const h=8+Math.pow(Math.sin(i*.51+(motion?motion.waveTime:t)*8),2)*27*(i<26?1:.55);rr(c,29+i*6.4,89-h/2,3.1,h,1.5,i>26?'#cfcfcf69':'#e0e0e0cd')}alpha(c,p(t,.68,.97),()=>text(c,'“…give this idea motion”',23,127,12,'#cbcbcb'));});light(c,139,85,68,64,'195,195,195',.32);light(c,140,85,19,23,'225,225,225',.50)}))}
function mainCard(c,t,row=keys(t,chatPos),motion=null,material=true){pose(c,row,()=>{if(material)glass(c,578,414,38,'chat');alpha(c,1-p(t,2.43,2.64),()=>{orb(c,43,43,12);text(c,'WISE',66,49,18,'#f4f4f4',550);text(c,motion?(motion.replies[3]<1?'shaping':'ready'):t<.24?'ready':t<.83?'shaping':'ready',511,49,14,'#bfbfbf');rr(c,269,93,271,45,23,'#dadada26','#dddddd16',1);text(c,'Bring this idea to life.',287,123,17,'#f5f5f5');if(motion?motion.replies[0]<1:t<.72)alpha(c,motion?1-motion.replies[0]:p(t,.37,.51)*(1-p(t,.59,.73)),()=>{rr(c,28,162,59,34,17,'#e1e1e120');for(let i=0;i<3;i++)circle(c,45+i*12,179,3.3,'#e0e0e0')});['Start with a clear idea.','Give every move a purpose.','Let the details catch light.','Make the next frame matter.'].forEach((s,i)=>{const q=motion?motion.replies[i]:p(t,.61+i*.12,.86+i*.12);alpha(c,motion?Math.min(1,q*5):q,()=>text(c,motion?s.slice(0,Math.floor(s.length*q)):s,31,183+10*p(t,1.3,1.7)*(1-p(t,1.95,2.16))+i*34+4*(1-q),20,'#f6f6f6'))});alpha(c,motion?motion.replies[3]:p(t,1.08,1.27),()=>{const buttonY=345-12*p(t,1.96,2.16);rr(c,70,buttonY,133,36,18,'#e1e1e132','#dadada16');text(c,'Build a scene',83,buttonY+24,14);rr(c,212,buttonY,156,36,18,'#dfdfdf2a','#e4e4e416');text(c,'Explore a variation',226,buttonY+24,14)});})})}
function knob(c,x,y,r,col){const g=c.createRadialGradient(x-r*.2,y-r*.35,.4,x,y,r);g.addColorStop(0,col==='silver'?'#cacaca':'#ffffff');g.addColorStop(.8,col==='silver'?'#b1b1b1':'#f4f4f4');g.addColorStop(1,col==='silver'?'#cfcfcf':'#d3d3d3');c.save();c.shadowColor='#0d0d0d77';c.shadowBlur=3;c.shadowOffsetY=1;circle(c,x,y,r,g,'#f7f7f7d0',.8);c.restore()}
function focus(c,t,row=keys(t,focusPos),motion=null,material=true){pose(c,row,()=>{if(material)glass(c,356,202,30,'focus');alpha(c,1-p(t,2.45,2.68),()=>{circle(c,39,73,10,'#f4f4f4');circle(c,43,69,8.2,'#292929');text(c,'Create',62,75,19,'#f7f7f7',500);text(c,'Space for your next idea',62,94,12,'#c4c4c4');const on=p(t,1.32,1.5);const track=c.createLinearGradient(269,54,326,89);track.addColorStop(0,on>.01?'#aaaaaaa1':'#9696964d');track.addColorStop(.65,on>.01?'#9e9e9e91':'#9696964d');track.addColorStop(1,on>.01?'#c6c6c686':'#aaaaaa42');rr(c,269,54,61,35,19,track,'#cacaca4b',1);knob(c,284+31*on,71.5,14,on>.95&&t>1.65&&t<1.88?'silver':'white');line(c,25,114,331,114,'#c0c0c014',1);circle(c,32,147,6,null,'#ebebeb',1.15);for(let i=0;i<8;i++){const a=i*TAU/8;line(c,32+Math.cos(a)*9,147+Math.sin(a)*9,32+Math.cos(a)*12,147+Math.sin(a)*12,'#dcdcdc',1.1)}text(c,'Light',62,153,18,'#f7f7f7');const value=Math.round(mix(30,74,p(t,1.5,1.75)));line(c,157,148,330,148,'#9a9a9a80',2.7);knob(c,157+173*value/100,148,7.8,'white');text(c,value+'%',306,169,11,'#cccccc');})})}
// A bounded pixel pass maps scene light through a convex capsule.
// Depth comes from broad directional light, without a dark rim or stroked outline.
function refract(c,t,x,y,w,h,angle,opacity=1){
 if(opacity<=0)return;const ww=Math.ceil(w+4),hh=Math.ceil(h+4);if(lens.width!==ww||lens.height!==hh){lens.width=ww;lens.height=hh}
 const sx=Math.max(0,Math.floor(x-w*.9-20)),sy=Math.max(0,Math.floor(y-h*1.05-20)),sw=Math.min(W-sx,Math.ceil(w*1.8+42)),sh=Math.min(H-sy,Math.ceil(h*2.1+42)),src=bc.getImageData(sx,sy,sw,sh),out=lc.createImageData(ww,hh),a=src.data,b=out.data,co=Math.cos(angle),si=Math.sin(angle),r=h/2,straight=Math.max(0,(w-h)/2);
 const sample=(xx,yy,channel)=>{xx=clamp(xx-sx,0,sw-1.001);yy=clamp(yy-sy,0,sh-1.001);const ix=Math.floor(xx),iy=Math.floor(yy),fx=xx-ix,fy=yy-iy,k=(iy*sw+ix)*4+channel;return mix(mix(a[k],a[k+4],fx),mix(a[k+sw*4],a[k+(sw+1)*4],fx),fy)};
 for(let py=0;py<hh;py++)for(let px=0;px<ww;px++){
  const u=px+.5-ww/2,v=py+.5-hh/2,ax=Math.abs(u),qx=Math.max(ax-straight,0),len=Math.hypot(qx,v),dist=r-len;if(dist<-.7)continue;
  const edge=clamp(1-dist/r),m=.773+.13*Math.pow(edge,5)+.19*Math.pow(edge,18),bend=7*Math.exp(-Math.pow((dist-3.5)/2.3,2)),nx=len?Math.sign(u)*qx/len:0,ny=len?v/len:0;
  const uu=u*m+nx*bend,vv=v*m+ny*bend,xx=x+uu*co-vv*si,yy=y+uu*si+vv*co;
  const upper=Math.max(0,-ny),lower=Math.max(0,ny),right=Math.exp(-Math.pow((u-w*.27)/(w*.34),2));
  const rimLight=Math.exp(-Math.pow((dist-2.4)/2.6,2));
  const shine=rimLight*(upper*.38+lower*right*.24)
   +Math.exp(-Math.pow((dist-9)/6.5,2))*upper*.14
   +Math.exp(-Math.pow((dist-10)/7.5,2))*lower*(.08+right*.12);
  const k=(py*ww+px)*4;for(let ch=0;ch<3;ch++){const tint=[205,205,205][ch],col=sample(xx,yy,ch);b[k+ch]=clamp(col+tint*.025+shine*[242,242,242][ch]+Math.exp(-Math.pow((u-w*.17)/(w*.52),2)-Math.pow((v-h*.17)/(h*.45),2))*[19,19,19][ch],0,255)}b[k+3]=255*clamp(dist+.7);
 }
 lc.putImageData(out,0,0);c.save();c.globalAlpha*=opacity;c.translate(x,y);c.rotate(angle);c.filter='blur(.45px)';c.drawImage(lens,-ww/2,-hh/2);c.restore();
}
// Every letter uses its native outline, scale and baseline; the lens dissolves into O.
function wordmark(c,t){
 alpha(c,p(t,2.48,2.79),()=>{
  c.save();c.fillStyle='#f1f1f1';
  for(const item of wordmarkLetters){
   if(item===wordmarkLetters.find(letter=>letter.letter==='O'))continue;
   paintWordmarkLetter(c,item);
  }
  c.restore();
 });
 alpha(c,p(t,2.7,2.88),()=>{
  c.save();c.fillStyle='#f1f1f1';paintWordmarkLetter(c,wordmarkLetters.find(item=>item.letter==='O'));c.restore();
 });
 alpha(c,p(t,2.92,3.07),()=>{
  c.save();c.textAlign='center';c.textBaseline='alphabetic';c.fillStyle='#dbdbdb';c.font='300 16px Arial,"PingFang SC",sans-serif';c.fillText('Motion with meaning.',533,375);
  c.fillStyle='#d3d3d3';c.font='300 14px "PingFang SC",sans-serif';c.fillText('让每一次运动，都有意义。',533,405);c.restore();
 });
}
function drawInner(t){bc.setTransform(1,0,0,1,0,0);bc.globalAlpha=1;bc.globalCompositeOperation='source-over';bc.filter='none';background(bgc,t);bc.drawImage(bg,0,0);wordmark(bc,t);listening(bc,t);mainCard(bc,t);focus(bc,t)}
const layerKeys=['background','aperture','wordmark',...Object.keys(spatialCardSpecs),'lens'];
function reset(c){c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.filter='none';c.clearRect(0,0,W,H);}
function lensPose(t){return keys(t,[[1.64,453,353,38,47,-.16],[1.75,455,357,60,56,-.15],[1.8333,502,353,95,56,-.27],[1.90,534,331,103,81,-.14],[2.0,544,293,207,128,-.04],[2.0833,558,284,232,123,-.02],[2.25,564,280,253,132,-.015],[2.35,587,284,229,124,-.015],[2.45,586,290,211,116,-.012],[2.6,585,301,150,95,-.008],[2.75,wordmarkOs[0],wordmarkOY,81,74,0],[2.85,wordmarkOs[0],wordmarkOY,wordmarkLensSize,wordmarkLensSize,0]]);}
function drawPart(c,key,t){
 if(key==='panes'){renderSpatial(c,t,null,true);return;}
 reset(c);
 if(key==='background'){background(c,t);return;}
 reset(bc);background(bc,key==='lens'?2.25:t);
 if(key==='lens')mainCard(bc,2.25);
 c.filter='blur(.35px)';c.drawImage(base,0,0);c.filter='none';
 if(key==='lens')refract(c,t,...lensPose(t),p(t,1.62,1.67)*(1-p(t,2.77,2.9)));
}
// Three static iOS-inspired studies share the optical material, but keep their own
// information hierarchy: media transport, glanceable weather, grouped controls.
function uiText(c,value,x,y,size,color='#f5f5f5'){
 c.save();c.font=`700 ${size}px Oswald,"Wise Motion Sans",sans-serif`;c.textBaseline='alphabetic';c.textAlign='left';c.fillStyle=color;c.fillText(value,x,y);c.restore();
}
function icon(c,name,x,y,size=24,color='#f5f5f5'){
 c.save();c.translate(x,y);c.scale(size/24,size/24);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=1.7;c.lineCap='round';c.lineJoin='round';
 const path=(points,fill=false)=>{c.beginPath();points.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));if(fill){c.closePath();c.fill();}else c.stroke();};
 if(name==='sun'){
  circle(c,0,0,4,null,color,1.7);for(let i=0;i<8;i++){const a=i*TAU/8;line(c,Math.cos(a)*7,Math.sin(a)*7,Math.cos(a)*10,Math.sin(a)*10,color,1.7);}
 }else if(name==='cloud'){
  c.beginPath();c.moveTo(-7,6);c.bezierCurveTo(-15,6,-13,-3,-7,-3);c.bezierCurveTo(-6,-12,6,-12,8,-3);c.bezierCurveTo(16,-3,16,6,8,6);c.closePath();c.stroke();
 }else if(name==='wifi'){
  for(const r of [5,9,13]){c.beginPath();c.arc(0,7,r,-Math.PI*.77,-Math.PI*.23);c.stroke();}circle(c,0,7,1.4,color);
 }else if(name==='bluetooth')bluetoothPaths.forEach(points=>path(points));
 else if(name==='airplane')path([[-2,-10],[2,-10],[3,-3],[10,2],[10,5],[3,2],[2,8],[5,10],[5,12],[0,10],[-5,12],[-5,10],[-2,8],[-3,2],[-10,5],[-10,2],[-3,-3]],true);
 else if(name==='moon'){c.beginPath();c.arc(0,0,9,.3,Math.PI*1.55);c.bezierCurveTo(-1,-4,-2,2,8.6,2.7);c.closePath();c.fill();}
 else if(name==='speaker'){
  path([[-10,-4],[-6,-4],[0,-9],[0,9],[-6,4],[-10,4],[-10,-4]]);
  for(const r of [6,10]){c.beginPath();c.arc(0,0,r,-.75,.75);c.stroke();}
 }else if(name==='next'){
  path([[-9,-7],[0,0],[-9,7]],true);path([[0,-7],[9,0],[0,7]],true);
 }else if(name==='previous'){
  path([[9,-7],[0,0],[9,7]],true);path([[0,-7],[-9,0],[0,7]],true);
 }else if(name==='pause'){rr(c,-7,-9,5,18,1,color);rr(c,2,-9,5,18,1,color);}
 else if(name==='output'){
  path([[-6,8],[0,1],[6,8]],true);for(const r of [7,11]){c.beginPath();c.arc(0,-1,r,Math.PI*.8,Math.PI*2.2);c.stroke();}
 }
 c.restore();
}
function musicCard(c,t,row,motion=null,material=true){pose(c,row,()=>{
 if(material)glass(c,520,300,36,'music');
 const cover=c.createLinearGradient(28,28,114,114);cover.addColorStop(0,'#a5a5a5');cover.addColorStop(.45,'#343434');cover.addColorStop(1,'#141414');rr(c,28,28,86,86,18,cover,'#ffffff30');
 c.save();c.beginPath();c.roundRect(28,28,86,86,18);c.clip();if(motion){for(let i=0;i<3;i++){const q=(motion.ripplePhase+i/3)%1;alpha(c,Math.sin(Math.PI*q)*(1-q)*motion.rippleStrength,()=>circle(c,71,71,5+66*q,null,'#ffffff',1.4+1.2*(1-q)));}light(c,71,71,20,20,'210,210,210',.14*motion.rippleStrength);}else{for(let i=0;i<7;i++)circle(c,97,72,15+i*9,null,'#ffffff28',1.2);}c.restore();
 uiText(c,'AFTER HOURS',136,64,28);uiText(c,'WISE RADIO',136,94,18,'#bcbcbc');icon(c,'output',476,69,26);
 const progressX=motion?30+460*motion.musicProgress:208;line(c,30,152,490,152,'#ffffff25',4);line(c,30,152,progressX,152,'#eeeeee',4);circle(c,progressX,152,4,'#fff');
 uiText(c,'1:24',30,181,16,'#bcbcbc');uiText(c,'−2:16',451,181,16,'#bcbcbc');
 icon(c,'previous',172,231,29);icon(c,'pause',260,231,38);icon(c,'next',348,231,29);
});}
function weatherCard(c,t,row,motion=null,material=true){pose(c,row,()=>{
 if(material)glass(c,320,360,36,'weather');
 uiText(c,'CUPERTINO',28,49,24);uiText(c,'21°',26,126,72);
 icon(c,'sun',260,100,46);icon(c,'cloud',259,127,50);
 uiText(c,'PARTLY CLOUDY',29,165,18,'#d3d3d3');uiText(c,'H:24°  L:16°',29,192,18,'#bcbcbc');
 line(c,28,217,292,217,'#ffffff24');
 const hours=['NOW','15','16','17','18'],temps=['21°','22°','23°','22°','20°'];
 hours.forEach((hour,i)=>{const x=30+i*55;uiText(c,hour,x,247,16,'#bcbcbc');icon(c,i===0||i===4?'cloud':'sun',x+13,278,23);uiText(c,temps[i],x+1,318,21);});
});}
function controlCenter(c,t,row,motion=null,material=true){pose(c,row,()=>{
 if(material)glass(c,390,360,38,'controls');uiText(c,'CONTROL CENTER',28,46,24);
 // Connectivity is a grouped surface; two active circles use a light fill.
 rr(c,24,68,190,190,28,'#ffffff0b','#ffffff16');
 [['airplane',76,121,false],['wifi',162,121,true],['bluetooth',76,207,true],['output',162,207,false]].forEach(([name,x,y,on])=>{
  circle(c,x,y,33,on?'#ededed':'#ffffff15',on?'#ffffff':'#ffffff1a',.8);icon(c,name,x,y,29,on?'#242424':'#f5f5f5');
 });
 // Tall clipped capsules keep the fill and glyph legible at every level.
 [[232,motion?.brightness??.74,'sun'],[306,motion?.volume??.46,'speaker']].forEach(([x,value,name])=>{
  c.save();c.beginPath();c.roundRect(x,68,60,190,30);c.clip();c.fillStyle='#ffffff15';c.fillRect(x,68,60,190);const fill=c.createLinearGradient(x,68,x+60,258);fill.addColorStop(0,'#fcfcfc');fill.addColorStop(1,'#c8c8c8');c.fillStyle=fill;c.fillRect(x,68+190*(1-value),60,190*value);c.restore();
  rr(c,x,68,60,190,30,null,'#ffffff35');icon(c,name,x+30,226,24,value>.23?'#303030':'#f5f5f5');
 });
 rr(c,24,278,342,58,29,'#ffffff12','#ffffff20');icon(c,'moon',54,307,23);uiText(c,'FOCUS',81,314,21);uiText(c,'ON',314,313,18,'#bcbcbc');
});}
function drawCard(c,key,time){
 reset(c);
 const spec=spatialCardSpecs[key];
 if(!spec)throw new Error('未知玻璃卡片：'+key);
 if(time!==undefined){
  const state=spatialCardsAt(time),card=state.cards.find(item=>item.key===key);
  drawSpatialCard(c,key,card.pose,state.camera,card.opacity,cardMotionAt(state.t));
  return;
 }
 const [w,h]=spec,scale=Math.min(760/w,420/h);
 drawSpatialCard(c,key,[0,0,35,8,-24,-3,scale]);
}
const spatialTextures=new Map();
function spatialTexture(key){
 if(spatialTextures.has(key))return spatialTextures.get(key);
 const [w,h,r]=spatialCardSpecs[key],image=canvas(w,h),lit=canvas(w,h),material=canvas(w,h),face=image.getContext('2d');
 reset(bc);background(bc,2.25);
 glass(material.getContext('2d'),w,h,r,key==='listening'?'listen':key);
 const result={image,lit,material,face,c:lit.getContext('2d')};spatialTextures.set(key,result);return result;
}
function updateSpatialContent(key,motion){
 const texture=spatialTexture(key),c=texture.face;
 reset(c);c.drawImage(texture.material,0,0);
 ({listening,chat:mainCard,focus,music:musicCard,weather:weatherCard,controls:controlCenter})[key](c,2.25,[0,0,1,0],motion,false);
 return texture;
}
function polygon(c,points){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}
function textureTriangle(c,image,source,target){
 const [[u0,v0],[u1,v1],[u2,v2]]=source,[[x0,y0],[x1,y1],[x2,y2]]=target;
 const den=(u1-u0)*(v2-v0)-(u2-u0)*(v1-v0);
 const a=((x1-x0)*(v2-v0)-(x2-x0)*(v1-v0))/den,b=((y1-y0)*(v2-v0)-(y2-y0)*(v1-v0))/den;
 const cc=((x2-x0)*(u1-u0)-(x1-x0)*(u2-u0))/den,d=((y2-y0)*(u1-u0)-(y1-y0)*(u2-u0))/den;
 const center=[(x0+x1+x2)/3,(y0+y1+y2)/3];
 // Subpixel overlap removes hairline cracks; the full rounded face clips the outside.
 const expanded=target.map(([x,y])=>{const dx=x-center[0],dy=y-center[1],len=Math.hypot(dx,dy)||1;return [x+dx/len*.45,y+dy/len*.45];});
 c.save();polygon(c,expanded);c.clip();c.setTransform(a,b,cc,d,x0-a*u0-cc*v0,y0-b*u0-d*v0);c.drawImage(image,0,0);c.restore();
}
function drawSpatialCard(c,key,pose,camera=[0,0,0],opacity=1,motion=null){
 const [w,h,r]=spatialCardSpecs[key],texture=updateSpatialContent(key,motion),tc=texture.c;
 tc.clearRect(0,0,w,h);tc.drawImage(texture.image,0,0);
 tc.save();tc.beginPath();tc.roundRect(0,0,w,h,r);tc.clip();
 const shine=tc.createLinearGradient(0,0,w,h*.25),center=clamp(.5+pose[4]/95,.16,.84);
 shine.addColorStop(0,'#ffffff00');shine.addColorStop(Math.max(0,center-.16),'#ffffff00');shine.addColorStop(center,'#ffffff32');shine.addColorStop(Math.min(1,center+.16),'#ffffff00');shine.addColorStop(1,'#ffffff00');tc.fillStyle=shine;tc.fillRect(0,0,w,h);tc.restore();
 const perimeter=glassPerimeter(w,h,r),front=perimeter.map(([x,y])=>projectGlassPoint([x,y,0],pose,camera)),back=perimeter.map(([x,y])=>projectGlassPoint([x,y,-glassThickness],pose,camera));
 c.save();c.globalAlpha*=opacity;
 polygon(c,back);c.fillStyle='#181818';c.fill();
 // Actual front/back geometry exposes a silver sidewall as the card turns.
 for(let i=0;i<front.length;i++){
  const j=(i+1)%front.length,dx=front[j][0]-front[i][0],dy=front[j][1]-front[i][1];
  const value=Math.round(90+100*clamp((dx-dy)/(Math.hypot(dx,dy)||1)*.5+.5));
  polygon(c,[back[i],back[j],front[j],front[i]]);c.fillStyle=`rgb(${value},${value},${value})`;c.fill();
 }
 c.save();polygon(c,front);c.clip();
 const cols=8,rows=6,grid=[];
 for(let y=0;y<=rows;y++){grid[y]=[];for(let x=0;x<=cols;x++)grid[y][x]=projectGlassPoint([w*x/cols-w/2,h*y/rows-h/2,0],pose,camera);}
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const u=w*x/cols,v=h*y/rows,uu=w*(x+1)/cols,vv=h*(y+1)/rows;
  textureTriangle(c,texture.lit,[[u,v],[uu,v],[uu,vv]],[grid[y][x],grid[y][x+1],grid[y+1][x+1]]);
  textureTriangle(c,texture.lit,[[u,v],[uu,vv],[u,vv]],[grid[y][x],grid[y+1][x+1],grid[y+1][x]]);
 }
 c.restore();polygon(c,front);const edge=c.createLinearGradient(front[0][0],front[0][1],front[18][0],front[18][1]);edge.addColorStop(0,'#ffffffdd');edge.addColorStop(.45,'#ffffff30');edge.addColorStop(1,'#ffffff80');c.strokeStyle=edge;c.lineWidth=1.35;c.stroke();
 polygon(c,back);c.strokeStyle='#ffffff40';c.lineWidth=.8;c.stroke();c.restore();
 return {front,back,center:projectGlassPoint([0,0,0],pose,camera)};
}
function spatialLensPose(t){return keys(t,[[5.35,457,278,45,48,-.18],[5.48,515,270,205,110,-.09],[5.65,555,278,250,132,-.035],[5.82,579,294,183,105,-.015],[5.98,wordmarkOs[0],wordmarkOY,90,74,0],[6.25,wordmarkOs[0],wordmarkOY,wordmarkLensSize,wordmarkLensSize,0]]);}
function spatialMarkTime(t){return keys(t,[[0,2.47],[5.45,2.48],[6.25,2.88],[6.65,3.1],[7.2,3.1]])[0];}
function spatialBackground(c,t){background(c,1.1+t*.20);light(c,533,590,620,165,'185,185,185',.13);light(c,225,30,440,240,'180,180,180',.055);}
function spatialFloor(c,state){
 for(const card of state.cards){const center=projectGlassPoint([0,0,0],card.pose,state.camera),size=spatialCardSpecs[card.key][0]*card.pose[6]*.40;
  light(c,center[0],535+center[2]*.025,size,14+Math.max(0,center[2])*.015,'0,0,0',card.opacity*.32);
 }
}
function renderSpatial(c,time,layers=null,cardsOnly=false){
 const state=spatialCardsAt(time),t=state.t,motion=cardMotionAt(t);
 // Texture preparation must precede scene accumulation because the shared material
 // painter samples its backing canvas. No previous frame can leak into a new frame.
 for(const card of state.cards)spatialTexture(card.key);
 reset(bc);if(layers)for(const key of layerKeys)reset(layers[key]);
 const draw=(key,fn)=>{if(layers){fn(layers[key]);bc.drawImage(layers[key].canvas,0,0);}else fn(bc);};
 draw('background',ctx=>spatialBackground(ctx,t));draw('aperture',ctx=>spatialFloor(ctx,state));
 if(!cardsOnly)draw('wordmark',ctx=>wordmark(ctx,spatialMarkTime(t)));
 for(const card of state.cards)if(card.opacity>0)draw(card.key,ctx=>drawSpatialCard(ctx,card.key,card.pose,state.camera,card.opacity,motion));
 const lensPose=spatialLensPose(t),lensAlpha=cardsOnly?0:p(t,5.35,5.47)*(1-p(t,6.15,6.30));
 // Read the completed perspective scene, including the exact front-to-back order.
 if(layers)refract(layers.lens,t,...lensPose,lensAlpha);
 reset(c);c.drawImage(base,0,0);
 if(layers)c.drawImage(layers.lens.canvas,0,0);else refract(c,t,...lensPose,lensAlpha);
 return {...state,lens:lensPose,lensAlpha,markTime:spatialMarkTime(t)};
}
function drawSpatialLayers(layers,t){return renderSpatial(bgc,t,layers);}
function destroy(){for(const node of [bg,base,paneSource,lens,...[...spatialTextures.values()].flatMap(t=>[t.image,t.lit,t.material])]){node.width=1;node.height=1;}spatialTextures.clear();}
return {render:renderSpatial,drawLayers:drawSpatialLayers,drawPart,drawCard,drawSpatialCard,drawInner,base,destroy,duration:spatialDuration,width:W,height:H};
}

const parts=[['background','diffuse-light-drift','弥散光团渐变'],['panes','glass-card-stagger','透光卡片错层'],['lens','convex-glass-lens','凸泡变形折射']];
const clocks={background:[1.1,3.45],panes:[0,5.35],lens:[1.62,2.9]};
const durations={background:3000,panes:5950,lens:1800};
function make(root,kit,definition={},only){
 const doc=root.ownerDocument,container=doc.createElement('div');
 Object.assign(container.style,{position:'absolute',inset:'0',overflow:'hidden',background:'#101010'});root.replaceChildren(container);
 function surface(key,parent=container,lazy=false){const node=doc.createElement('canvas');node.width=lazy?1:1066;node.height=lazy?1:600;if(key)node.dataset.layer=key;Object.assign(node.style,{position:'absolute',inset:'0',width:'640px',height:'360px'});parent.append(node);return {node,c:lazy?null:node.getContext('2d')};}
 const layerHost=only?null:doc.createElement('div'),layers={};
 if(layerHost){Object.assign(layerHost.style,{position:'absolute',inset:'0',visibility:'hidden'});container.append(layerHost);for(const key of ['background','aperture','wordmark',...Object.keys(spatialCardSpecs),'lens'])layers[key]=surface(key,layerHost,true);}
 const full=surface(only),painter=full.c?createPainter(doc):null;
 let dead=false,previous=-1,local=0,inspecting=false;
 function paintLayers(){
  if(!painter||!layerHost)return;
  const contexts={};for(const [key,layer]of Object.entries(layers)){if(!layer.c){layer.node.width=1066;layer.node.height=600;layer.c=layer.node.getContext('2d');}if(!layer.c)return;contexts[key]=layer.c;}
  const state=painter.drawLayers(contexts,local);layers.background.node.style.zIndex='0';layers.aperture.node.style.zIndex='1';layers.wordmark.node.style.zIndex='2';state.cards.forEach((card,i)=>{layers[card.key].node.style.zIndex=String(i+3);});layers.lens.node.style.zIndex='9';
 }
 const Observer=doc.defaultView?.MutationObserver;
 const observer=!only&&Observer?new Observer(()=>{
  if(dead)return;inspecting=!!layerHost.querySelector('[data-composition-hidden]');
  full.node.style.visibility=inspecting?'hidden':'visible';layerHost.style.visibility=inspecting?'visible':'hidden';
  if(inspecting)paintLayers();
 }):null;
 observer?.observe(layerHost,{subtree:true,attributes:true,attributeFilter:['data-composition-hidden']});
 const render=ms=>{
  if(dead)return;ms=Math.max(0,Math.min(definition.duration_ms||(only?durations[only]:spatialDuration*1000),ms));if(ms===previous)return;previous=ms;
  local=ms/1000;
  if(only){const [a,b]=clocks[only],duration=definition.duration_ms||durations[only];local=a+(b-a)*Math.max(0,Math.min(1,(ms-150)/(duration-600)));}
  container.dataset.time=local.toFixed(6);container.dataset.phase=only||spatialCardsAt(local).phase;
  if(painter){if(only)painter.drawPart(full.c,only,local);else painter.render(full.c,local);if(inspecting)paintLayers();}
 };
 render.frameRate=60;
 render.destroy=(preserve=false)=>{if(dead)return;dead=true;observer?.disconnect();painter?.destroy();for(const layer of Object.values(layers)){layer.node.width=1;layer.node.height=1;layer.c=null;}layerHost?.remove();full.node.style.visibility='visible';if(!preserve){full.node.width=1;full.node.height=1;root.replaceChildren();}full.c=null;};
 render(0);return render;
}
const cards=[['listening','glass-voice-card-illustration','透光语音卡'],['chat','glass-dialogue-card-illustration','透光对话卡'],['focus','glass-control-card-illustration','透光创作卡'],['music','glass-music-card-illustration','黑银音乐卡'],['weather','glass-weather-card-illustration','黑银天气卡'],['controls','glass-controls-card-illustration','黑银控制中心']];
function makeCard(root,kit,definition,key){
 const doc=root.ownerDocument,node=doc.createElement('canvas');node.width=1066;node.height=600;node.className='pattern-canvas';node.dataset.card=key;
 node.setAttribute('role','img');node.setAttribute('aria-label',cards.find(row=>row[0]===key)[2]);
 Object.assign(node.style,{width:'640px',height:'360px',background:'transparent'});root.replaceChildren(node);
 const c=node.getContext('2d');
 const painter=c?createPainter(doc):null;
 let dead=false,last;const render=ms=>{
  if(dead)return;
  const time=Math.max(0,Math.min(spatialDuration,ms/1000));if(time===last)return;last=time;
  node.dataset.sourceTime=String(time);painter?.drawCard(c,key,time);
 };
 render(0);
 render.destroy=(preserve=false)=>{if(dead)return;dead=true;painter?.destroy();if(!preserve){node.width=1;node.height=1;root.replaceChildren();}};
 return render;
}
global.WiseGlassLight={createPainter,parts,cards,duration:spatialDuration*1000,spatial:{sample:spatialCardsAt,project:projectGlassPoint,perimeter:glassPerimeter,specs:spatialCardSpecs,thickness:glassThickness,content:cardMotionAt,bluetoothPaths},brand:{label:'WISE MOTION',family:'Helvetica Neue',weight:700,capHeight:56,scale:wordmarkScale,tracking:wordmarkTracking,baseline:wordmarkBaseline,glyphs:wordmarkGlyphs,letters:wordmarkLetters,oCenters:wordmarkOs.map(x=>[x,wordmarkOY]),oBounds:wordmarkOBounds}};
const F=global.MotionFactories;
if(F){
 F['glass-interface-sequence']=(root,kit,def)=>make(root,kit,def);
 for(const [key,id]of parts)F[id]=(root,kit,def)=>make(root,kit,def,key);
 for(const [key,id]of cards)F[id]=(root,kit,def)=>makeCard(root,kit,def,key);
 F['glass-interface-sequence'].breakdown=[
  {id:'background',name:'黑银环境光',actions:['diffuse-light-drift'],start:0,end:7200,time:'0–7.2 秒',detail:'银灰弥散光与顶部柔光构成暗色环境，亮度克制，衬托玻璃侧壁和白色界面。'},
  {id:'aperture',name:'地面柔光与投影',actions:[],start:0,end:6400,time:'0–6.4 秒',detail:'投影按六张卡的空间位置、距离和显隐变化，在卡片下方建立高度参照。'},
  {id:'wordmark',name:'粗体字标',actions:[],start:5450,end:7200,time:'5.45–7.2 秒',detail:'卡片退出时 WISE MOTION 在后方显现；凸泡在第一个 O 中心淡出，由原生字形接管，双语短句随后出现。'},
  {id:'listening',name:'语音玻璃卡',actions:['glass-card-stagger','glass-voice-card-illustration'],start:0,end:6400,time:'0–6.4 秒',detail:'语音卡从左向右滑入，波形变化后留在左后方，圆角前后表面连接为有厚度的玻璃边缘。'},
  {id:'chat',name:'对话玻璃卡',actions:['glass-card-stagger','glass-dialogue-card-illustration'],start:0,end:6400,time:'0–6.4 秒',detail:'先建立主体，展示新增控件时退到左后方，4.9秒前后再次向前，四行回复逐行逐字输出后承接凸泡折射。'},
  {id:'focus',name:'创作玻璃卡',actions:['glass-card-stagger','glass-control-card-illustration'],start:0,end:6400,time:'0–6.4 秒',detail:'创作卡在左下方提供前后错层参照，保持开关和74%滑杆状态，随后侧转退出。'},
  {id:'music',name:'音乐玻璃卡',actions:['glass-card-stagger','glass-music-card-illustration'],start:0,end:6400,time:'0–6.4 秒',detail:'1.05–1.9秒从右后方沿空间弧线来到前景，封面三圈涟漪扩散淡出，进度同步推进，再让位给天气卡。'},
  {id:'weather',name:'天气玻璃卡',actions:['glass-card-stagger','glass-weather-card-illustration'],start:0,end:6400,time:'0–6.4 秒',detail:'1.9–2.75秒向前并向另一侧轻转，让当前温度和小时预报清楚可读，随后退回右侧。'},
  {id:'controls',name:'玻璃控制中心',actions:['glass-card-stagger','glass-controls-card-illustration'],start:0,end:6400,time:'0–6.4 秒',detail:'2.75–3.6秒来到前景，亮度先上升再回落，音量稍后跟随，蓝牙图标采用竖直中轴与交叉双三角；随后参与六卡展开。'},
  {id:'lens',name:'柔光凸泡',actions:['convex-glass-lens'],start:5350,end:6300,time:'5.35–6.3 秒',detail:'采样已经完成空间投影与遮挡排序的画面，放大对话卡文字，收缩到字标首个 O；保持无深色内圈和整圈描边。'}
 ];
}
})(globalThis);
