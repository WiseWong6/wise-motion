/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
 * 基于本机展示片独立绘制并经用户精修确认；无原片像素或媒体依赖。 */
(function(global){
'use strict';
function createPainter(doc=global.document){

const W=1066,H=600,TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,q)=>a+(b-a)*q,ease=v=>{v=clamp(v);return v*v*(3-2*v)},p=(t,a,b)=>ease((t-a)/(b-a));
function keys(t,rows){let i=0;while(i<rows.length-2&&t>rows[i+1][0])i++;const a=rows[i],b=rows[i+1],q=clamp((t-a[0])/(b[0]-a[0]));return a.slice(1).map((v,j)=>mix(v,b[j+1],ease(q)));}
function canvas(w=W,h=H){const v=doc.createElement('canvas');v.width=w;v.height=h;return v}
function rr(c,x,y,w,h,r,fill,stroke,width=1){c.beginPath();c.roundRect(x,y,w,h,Math.min(r,h/2,w/2));if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
function line(c,x,y,a,b,color,width=1){c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function circle(c,x,y,r,fill,stroke,width=1){c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
function text(c,s,x,y,size,color='#f6f4ff',weight=400){c.font=`${weight} ${size}px Arial,"PingFang SC",sans-serif`;c.textBaseline='alphabetic';c.textAlign='left';c.fillStyle=color;c.fillText(s,x,y)}
function alpha(c,a,fn){if(a<=0)return;c.save();c.globalAlpha*=clamp(a);fn();c.restore()}
function light(c,x,y,rx,ry,col,opacity=1,falloff=.5){c.save();c.translate(x,y);c.scale(1,ry/rx);const g=c.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,`rgba(${col},${opacity})`);g.addColorStop(falloff,`rgba(${col},${opacity*.48})`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.fillRect(-rx,-rx,rx*2,rx*2);c.restore()}
const bg=canvas(),bgc=bg.getContext('2d'),base=canvas(),bc=base.getContext('2d',{willReadFrequently:true}),paneSource=canvas(),pc=paneSource.getContext('2d'),lens=canvas(320,180),lc=lens.getContext('2d'),opening=canvas(),oc=opening.getContext('2d');
const glowFields=[[380.0,160.0,110.0,185.0],[535.0,215.0,170.0,130.0],[470.0,425.0,145.0,180.0],[690.0,480.0,150.0,126.0],[815.0,404.0,105.0,110.0],[724.0,28.0,95.0,78.0],[620.0,62.0,92.0,110.0],[574.0,330.0,168.0,106.0],[536.0,546.0,131.0,110.0],[903.0,349.0,83.0,146.0],[325.0,46.0,75.0,88.0],[537.0,145.0,170.0,88.0],[673.0,323.0,144.0,108.0],[359.0,326.0,85.0,126.0]];
const glowKeys=[[1.1,[[7.805,10.979,47.867],[0.0,0.0,0.0],[13.998,15.775,87.648],[34.556,43.791,138.63],[7.246,92.148,65.229],[97.466,28.463,133.89],[0.0,0.0,0.0],[0.0,13.035,0.0],[0.0,0.0,22.055],[24.294,26.934,71.643],[33.634,16.515,80.405],[115.203,44.143,214.725],[0.0,0.0,0.0],[18.446,0.0,21.303]]],[1.75,[[7.469,0.0,0.0],[0.0,0.0,0.0],[19.594,18.144,130.995],[26.458,23.604,130.104],[19.236,70.241,100.458],[129.669,37.886,164.746],[11.135,4.233,23.97],[0.0,7.446,0.0],[0.0,0.0,0.0],[15.952,33.847,73.862],[74.772,46.347,211.836],[36.18,0.0,21.235],[23.301,78.001,16.566],[12.492,21.156,79.889]]],[2.25,[[24.728,0.0,111.931],[0.0,0.0,0.0],[33.709,38.596,103.815],[37.628,36.701,128.72],[34.556,118.506,151.714],[154.44,45.135,188.482],[19.7,7.489,42.408],[0.0,30.486,0.0],[0.0,0.0,59.213],[8.874,1.676,51.671],[44.476,30.35,91.269],[102.441,58.657,186.002],[0.0,7.685,0.0],[0.0,0.0,0.0]]],[2.85,[[0.0,0.0,0.0],[106.089,16.474,32.138],[31.584,22.618,129.613],[25.369,29.977,77.17],[31.137,58.267,153.888],[100.396,23.237,133.167],[12.727,13.712,27.306],[0.0,95.125,0.0],[0.0,0.0,68.481],[0.938,0.0,14.573],[41.624,24.567,113.243],[0.0,17.211,144.08],[1.283,51.502,58.711],[8.963,6.701,88.466]]],[3.45,[[0.0,0.0,0.0],[98.761,0.0,36.611],[28.195,19.529,122.774],[31.302,47.066,86.92],[18.252,47.428,148.892],[110.209,28.87,147.242],[0.0,4.583,0.0],[0.0,121.641,0.0],[0.0,0.0,70.293],[2.196,0.0,2.361],[33.589,21.333,87.15],[0.0,23.901,140.003],[18.104,26.86,59.876],[20.517,11.193,110.556]]]];
function background(c,t){
 c.fillStyle='#0a0714';c.fillRect(0,0,W,H);let i=0;while(i<glowKeys.length-2&&t>glowKeys[i+1][0])i++;const ka=glowKeys[i],kb=glowKeys[i+1],q=p(t,ka[0],kb[0]);
 c.save();c.globalCompositeOperation='lighter';
 for(let j=0;j<glowFields.length;j++){
  const [x,y,sx,sy]=glowFields[j],rgb=ka[1][j].map((a,k)=>mix(a,kb[1][j][k],q)),m=Math.max(...rgb,1),color=rgb.map(a=>Math.round(a/Math.max(m,255)*255));
  c.save();c.translate(x,y);c.scale(sx,sy);const g=c.createRadialGradient(0,0,0,0,0,3.7);
  for(let k=0;k<=16;k++){const r=k/16*3.7;g.addColorStop(k/16,`rgba(${color.join(',')},${Math.exp(-r*r/2)})`)}
  c.fillStyle=g;c.fillRect(-3.7,-3.7,7.4,7.4);c.restore();
 }c.restore();
 const stars=[[266,467,.9],[572,173,.8],[667,184,1.1],[751,135,.8],[950,436,.7],[904,266,.65],[570,333,.6],[801,62,.7]];
 stars.forEach(([x,y,r],i)=>{c.globalAlpha=(.12+.12*p(t,.4,2.9))*(.8+.2*Math.sin(i+t));circle(c,x,y,r,'#a2b7ff')});c.globalAlpha=1;
}
// Sample the actual light and rear card in screen coordinates. Pane tint stays dark on its left side.
function glass(c,w,h,r,type){
 const matrix=c.getTransform();pc.setTransform(1,0,0,1,0,0);pc.clearRect(0,0,W,H);pc.drawImage(base,0,0);
 c.save();rr(c,0,0,w,h,r,'#ffffff');c.globalCompositeOperation='source-over';c.shadowColor='#02011170';c.shadowBlur=18;c.shadowOffsetY=13;rr(c,0,0,w,h,r,'#17142b22');c.shadowBlur=0;c.shadowOffsetY=0;c.restore();
 c.save();c.beginPath();c.roundRect(0,0,w,h,r);c.clip();c.setTransform(1,0,0,1,0,0);c.filter='blur(10px)';c.drawImage(paneSource,0,0);c.filter='none';c.setTransform(matrix);
 const milk=c.createLinearGradient(0,0,w,h);milk.addColorStop(0,type==='focus'?'#b9b5d111':'#d9d7ef09');milk.addColorStop(1,'#c6d6ee05');c.fillStyle=milk;c.fillRect(0,0,w,h);const body=c.createLinearGradient(0,0,w,h);body.addColorStop(0,type==='focus'?'#b3a7ca24':'#ddbdff22');body.addColorStop(.42,type==='focus'?'#30275229':'#6b45b62a');body.addColorStop(1,type==='focus'?'#4542f63d':'#83bcdf20');c.fillStyle=body;c.fillRect(0,0,w,h);
 if(type==='chat'){
  light(c,175,52,259,172,'125,74,249',.38);light(c,460,310,320,259,'53,152,250',.42);light(c,183,279,273,231,'75,60,243',.19);
 }else if(type==='focus'){
  const dark=c.createLinearGradient(0,0,w,0);dark.addColorStop(0,'#1d1b3270');dark.addColorStop(.40,'#21173235');dark.addColorStop(1,'#17112d00');c.fillStyle=dark;c.fillRect(0,0,w,h);light(c,w*.94,h*.81,w*.82,h*.99,'73,57,255',.53);light(c,w*.91,17,99,63,'114,98,255',.40);
 }else{light(c,w*.6,h*.25,w*.9,h*1.4,'112,68,251',.37)}
 const sheen=c.createLinearGradient(0,0,w*.8,h);sheen.addColorStop(0,'#f7e7ff13');sheen.addColorStop(.19,'#ffffff07');sheen.addColorStop(.36,'#d5bafa00');sheen.addColorStop(.43,'#ded4fc0a');sheen.addColorStop(.57,'#fffffe00');sheen.addColorStop(1,'#a3ddff08');c.fillStyle=sheen;c.fillRect(0,0,w,h);c.restore();
 const edge=c.createLinearGradient(0,0,w,h);edge.addColorStop(0,'#ece4ff6b');edge.addColorStop(.26,'#d4ceef3c');edge.addColorStop(.59,'#c9b8f22b');edge.addColorStop(1,'#9cc9fd59');rr(c,.65,.65,w-1.3,h-1.3,r-.65,null,edge,1.15);rr(c,2.2,2.2,w-4.4,h-4.4,r-2.2,null,'#19123325',1.4);
 const bevel=c.createLinearGradient(0,0,0,h);bevel.addColorStop(0,'#ddd0ff20');bevel.addColorStop(.16,'#e5d9ff00');bevel.addColorStop(.82,'#3833b300');bevel.addColorStop(1,'#777dff22');rr(c,4,4,w-8,h-8,r-4,null,bevel,1.25);
}
function orb(c,x,y,r){const g=c.createRadialGradient(x-r*.22,y-r*.3,.2,x,y,r);g.addColorStop(0,'#aacefd');g.addColorStop(.24,'#6672dc');g.addColorStop(.58,'#6673ef');g.addColorStop(.82,'#344482');g.addColorStop(1,'#223155');circle(c,x,y,r,g,'#c8d7fff0',1.1);circle(c,x,y,r-1.4,null,'#87beef35',.7);light(c,x-r*.2,y-r*.2,r*.66,r*.66,'40,181,249',.35)}
function pose(c,row,fn){const [x,y,s,a]=row;c.save();c.translate(x,y);c.transform(s,Math.tan(a||0)*s,0,s,0,0);fn();c.restore()}
const chatPos=[[0,156,153,1.11,-.025],[.15,158,153,1.11,-.025],[.35,168,149,1.12,-.025],[.65,296,120,.91,-.024],[1.1,402,99,.75,-.023],[1.55,413,-30,.93,-.008],[1.75,413,-80,.968,.001],[1.83,412,-70,.967,.001],[1.95,397,6,.92,.003],[2.0833,378,51,.918,-.018],[2.25,374,69,.915,-.018],[2.45,374,76,.915,-.018],[2.6,426,49,.956,-.004],[2.65,539,49,.975,-.01],[2.7833,727,58,.975,-.01],[2.84,1300,43,.975,-.01]];
const focusPos=[[0,-620,678,1.07,-.012],[.35,-54,553,1.07,-.012],[.65,-22,446,1.03,-.012],[1.1,152,368,.884,-.014],[1.55,96,298,1.122,-.012],[1.75,81,273,1.166,-.012],[1.9,77,282,1.161,-.012],[2.0833,64,373,1.105,-.012],[2.25,63,389,1.101,-.012],[2.45,57,393,1.114,-.012],[2.6,36,467,1.085,-.012],[2.65,-112,526,1.12,-.012],[2.7833,-335,652,1.12,-.012],[2.86,-1100,810,1.12,-.012]];
const listenPos=[[0,103,166,1.04,.018],[.15,102,166,1.04,.018],[.35,64,120,1.04,.018],[.65,186,91,.92,.019],[1.1,294,71,.77,.023],[1.55,278,-20,.934,.020],[1.75,273,-67,.967,.020],[1.9,269,-45,.963,.020],[2.0833,252,25,.90,.019],[2.25,249,38,.91,.020],[2.45,245,37,.91,.019],[2.6,60,-8,.91,.02],[2.65,-198,-30,.91,.02],[2.78,-680,-110,.91,.02]];
function listening(c,t,row=keys(t,listenPos)){alpha(c,1-p(t,2.43,2.72),()=>pose(c,row,()=>{glass(c,300,148,28,'listen');const fade=p(t,.10,.38)*(1-p(t,2.47,2.63));alpha(c,fade,()=>{text(c,'Voice input',23,37,15,'#f6edff',550);text(c,'0:'+String(Math.min(9,Math.floor((t+.03)*3.5)+2)).padStart(2,'0'),116,37,12,'#d4c6ef');for(let i=0;i<30;i++){const h=8+Math.pow(Math.sin(i*.51+t*8),2)*27*(i<26?1:.55);rr(c,29+i*6.4,89-h/2,3.1,h,1.5,i>26?'#d0caff69':'#e4dcffcd')}alpha(c,p(t,.68,.97),()=>text(c,'“…give this idea motion”',23,127,12,'#d3c5ef'));});light(c,139,85,68,64,'36,237,248',.79);light(c,140,85,19,23,'117,255,251',.96)}))}
function mainCard(c,t,row=keys(t,chatPos)){pose(c,row,()=>{glass(c,578,414,38,'chat');alpha(c,1-p(t,2.43,2.64),()=>{orb(c,43,43,12);text(c,'WISE',66,49,18,'#f8f2ff',550);text(c,t<.24?'ready':t<.83?'shaping':'ready',511,49,14,'#cab8e6');rr(c,269,93,271,45,23,'#e4d3ff26','#ead6ff16',1);text(c,'Bring this idea to life.',287,123,17,'#f9f3ff');if(t<.72)alpha(c,p(t,.37,.51)*(1-p(t,.59,.73)),()=>{rr(c,28,162,59,34,17,'#eadbff20');for(let i=0;i<3;i++)circle(c,45+i*12,179,3.3,'#e6dcfa')});['Start with a clear idea.','Give every move a purpose.','Let the details catch light.','Make the next frame matter.'].forEach((s,i)=>{const q=p(t,.61+i*.12,.86+i*.12);alpha(c,q,()=>text(c,s,31,183+10*p(t,1.3,1.7)*(1-p(t,1.95,2.16))+i*34+8*(1-q),20,'#f8f5ff'))});alpha(c,p(t,1.08,1.27),()=>{const buttonY=345-12*p(t,1.96,2.16);rr(c,70,buttonY,133,36,18,'#d9e1ff32','#ded5ff16');text(c,'Build a scene',83,buttonY+24,14);rr(c,212,buttonY,156,36,18,'#c6e3ff2a','#cfe8ff16');text(c,'Explore a variation',226,buttonY+24,14)});})})}
function knob(c,x,y,r,col){const g=c.createRadialGradient(x-r*.2,y-r*.35,.4,x,y,r);g.addColorStop(0,col==='cyan'?'#77dfef':'#fffffc');g.addColorStop(.8,col==='cyan'?'#50c8e7':'#e9f7f4');g.addColorStop(1,col==='cyan'?'#7ae5f4':'#bcd8e7');c.save();c.shadowColor='#090a3877';c.shadowBlur=3;c.shadowOffsetY=1;circle(c,x,y,r,g,'#e6fbffd0',.8);c.restore()}
function focus(c,t,row=keys(t,focusPos)){pose(c,row,()=>{glass(c,356,202,30,'focus');alpha(c,1-p(t,2.45,2.68),()=>{circle(c,39,73,10,'#f3f4fa');circle(c,43,69,8.2,'#292641');text(c,'Create',62,75,19,'#f8f6ff',500);text(c,'Space for your next idea',62,94,12,'#c7c0e3');const on=p(t,1.32,1.5);const track=c.createLinearGradient(269,54,326,89);track.addColorStop(0,on>.01?'#82aeffa1':'#9790cf4d');track.addColorStop(.65,on>.01?'#40b3e891':'#9790cf4d');track.addColorStop(1,on>.01?'#75daed86':'#b1a4d342');rr(c,269,54,61,35,19,track,'#bfcaf14b',1);knob(c,284+31*on,71.5,14,on>.95&&t>1.65&&t<1.88?'cyan':'white');line(c,25,114,331,114,'#c3bbed14',1);circle(c,32,147,6,null,'#f1e7ff',1.15);for(let i=0;i<8;i++){const a=i*TAU/8;line(c,32+Math.cos(a)*9,147+Math.sin(a)*9,32+Math.cos(a)*12,147+Math.sin(a)*12,'#dfd8f9',1.1)}text(c,'Light',62,153,18,'#f9f5ff');const value=Math.round(mix(30,74,p(t,1.5,1.75)));line(c,157,148,330,148,'#a190e980',2.7);knob(c,157+173*value/100,148,7.8,'white');text(c,value+'%',306,169,11,'#c7caed');})})}
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
  const k=(py*ww+px)*4;for(let ch=0;ch<3;ch++){const tint=[174,205,255][ch],col=sample(xx+(ch-1)*nx*edge*.8,yy+(ch-1)*ny*edge*.65,ch);b[k+ch]=clamp(col+tint*.025+shine*[219,242,255][ch]+Math.exp(-Math.pow((u-w*.17)/(w*.52),2)-Math.pow((v-h*.17)/(h*.45),2))*[4,19,34][ch],0,255)}b[k+3]=255*clamp(dist+.7);
 }
 lc.putImageData(out,0,0);c.save();c.globalAlpha*=opacity;c.translate(x,y);c.rotate(angle);c.filter='blur(.45px)';c.drawImage(lens,-ww/2,-hh/2);c.restore();
}
function ring(c,x,y,r,t,opacity=1){alpha(c,opacity,()=>{light(c,x,y+6,r*1.56,r*1.33,'58,227,255',.26);const g=c.createLinearGradient(x-r,y-r,x+r,y+r);g.addColorStop(0,'#f4f9ffed');g.addColorStop(.3,'#d7eaffaf');g.addColorStop(.6,'#89c5fff0');g.addColorStop(.88,'#ecffffe8');g.addColorStop(1,'#5dafda8f');circle(c,x,y,r,null,g,2.2);circle(c,x,y,r-5.3,null,'#ceefffa2',1.4);circle(c,x,y,r-2.5,null,'#659bca3b',1.1)})}
// Thin letterforms traced as vectors: consistent across browsers and operating systems.
function wordmark(c,t){
 const a=p(t,2.48,2.79);alpha(c,a,()=>{
  c.save();c.strokeStyle='#f2f0fc';c.lineWidth=2.7;c.lineCap='round';c.lineJoin='round';c.beginPath();
  // WISE: the same cap height as the two circular O letterforms.
  c.moveTo(231,276);c.lineTo(245,332);c.lineTo(259,291);c.lineTo(273,332);c.lineTo(287,276);
  c.moveTo(300,276);c.lineTo(318,276);c.moveTo(309,276);c.lineTo(309,332);c.moveTo(300,332);c.lineTo(318,332);
  c.moveTo(375,280);c.bezierCurveTo(360,271,334,274,334,289);c.bezierCurveTo(334,304,376,300,376,318);c.bezierCurveTo(376,335,347,337,333,327);
  c.moveTo(433,276);c.lineTo(393,276);c.lineTo(393,332);c.lineTo(433,332);c.moveTo(393,303);c.lineTo(426,303);
  // MOTION leaves the first O open for the arriving glass bubble.
  c.moveTo(475,332);c.lineTo(475,276);c.lineTo(502.5,316);c.lineTo(530,276);c.lineTo(530,332);
  c.moveTo(621,276);c.lineTo(665,276);c.moveTo(643,276);c.lineTo(643,332);
  c.moveTo(679,276);c.lineTo(697,276);c.moveTo(688,276);c.lineTo(688,332);c.moveTo(679,332);c.lineTo(697,332);
  c.moveTo(767.1,304);c.arc(739,304,28.1,0,TAU);
  c.moveTo(783,332);c.lineTo(783,276);c.lineTo(835,332);c.lineTo(835,276);
  c.stroke();c.restore();
 });
 // The lens finishes at (577,304), becoming the first O in MOTION.
 ring(c,577,304,28.1,t,p(t,2.7,2.88));
 alpha(c,p(t,2.92,3.07),()=>{
  c.save();c.textAlign='center';c.textBaseline='alphabetic';c.fillStyle='#d7daed';c.font='300 16px Arial,"PingFang SC",sans-serif';c.fillText('Motion with meaning.',533,375);
  c.fillStyle='#d0d2e9';c.font='300 14px "PingFang SC",sans-serif';c.fillText('让每一次运动，都有意义。',533,405);c.restore();
 });
}
function drawInner(t){bc.setTransform(1,0,0,1,0,0);bc.globalAlpha=1;bc.globalCompositeOperation='source-over';bc.filter='none';background(bgc,t);bc.drawImage(bg,0,0);wordmark(bc,t);listening(bc,t);mainCard(bc,t);focus(bc,t)}
function render(c,t){t=clamp(t,0,3.65);drawInner(t);
 const lp=lensPose(t);
 c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.filter='none';c.clearRect(0,0,W,H);
 // The recording opens a growing viewing aperture onto full-size art, rather than shrinking letters.
 if(t<.067){
  c.fillStyle='#1b1d2d';c.fillRect(0,0,W,H);const [w,h,blur]=keys(t,[[0,144,108,6],[.016667,205,113,8],[.033333,420,260,11],[.05,803,470,5],[.067,1066,600,0]]);oc.clearRect(0,0,W,H);oc.drawImage(base,0,0);oc.save();oc.globalCompositeOperation='destination-in';oc.filter=`blur(${blur}px)`;rr(oc,(W-w)/2,(H-h)/2,w,h,18,'#fff');oc.restore();c.drawImage(opening,0,0);ring(c,533,300,45,t,1-p(t,.033,.067));
 }else if(t<3.48){
  c.filter='blur(.35px)';c.drawImage(base,0,0);c.filter='none';refract(c,t,...lp,p(t,1.62,1.67)*(1-p(t,2.77,2.9)));rr(c,1,1,W-2,H-2,10,null,'#f4e6ff21',1.3);
 }else{
  const red=p(t,3.59,3.65);c.fillStyle=red>.01?'#28141c':'#1b1d2d';c.fillRect(0,0,W,H);if(t<3.555){const [w,h,blur]=keys(t,[[3.48,1066,600,0],[3.50,786,454,2],[3.516667,542,365,6],[3.533333,289,214,8],[3.55,127,93,6]]);oc.clearRect(0,0,W,H);oc.drawImage(base,0,0);oc.save();oc.globalCompositeOperation='destination-in';oc.filter=`blur(${blur}px)`;rr(oc,(W-w)/2,(H-h)/2,w,h,15,'#fff');oc.restore();c.drawImage(opening,0,0);ring(c,533,300,45,t,p(t,3.50,3.54));}else{const [x,y]=keys(t,[[3.55,533,300],[3.566667,538,261],[3.583333,553,221],[3.60,586,199],[3.616667,623,181],[3.633333,713,167],[3.65,864,174]]);c.save();c.translate(x,y);c.rotate(-.6);c.filter=`blur(${2+red*3}px)`;c.scale(1+Math.sin(red*Math.PI)*.24+red*.22,1-Math.sin(red*Math.PI)*.13-red*.18);if(red<1){c.globalAlpha=1-red;orb(c,0,0,43);ring(c,0,0,45,t)}c.globalAlpha=red;circle(c,0,0,43,'#e12537');c.restore();}}
 c.restore();return {t,panes:[keys(t,listenPos),keys(t,chatPos),keys(t,focusPos)],lens:lp};
}

const layerKeys=['background','wordmark','listening','chat','focus','lens','aperture'];
function reset(c){c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.filter='none';c.clearRect(0,0,W,H);}
function lensPose(t){return keys(t,[[1.64,453,353,38,47,-.16],[1.75,455,357,60,56,-.15],[1.8333,502,353,95,56,-.27],[1.90,534,331,103,81,-.14],[2.0,544,293,207,128,-.04],[2.0833,558,284,232,123,-.02],[2.25,564,280,253,132,-.015],[2.35,587,284,229,124,-.015],[2.45,586,290,211,116,-.012],[2.6,585,301,150,95,-.008],[2.75,577,304,81,74,0],[2.85,577,304,58,58,0]]);}
function drawLayers(layers,t){
 t=clamp(t,0,3.65);for(const key of layerKeys)reset(layers[key]);
 reset(bc);background(layers.background,t);bc.drawImage(layers.background.canvas,0,0);
 for(const [key,draw]of [['wordmark',wordmark],['listening',listening],['chat',mainCard],['focus',focus]]){
  draw(layers[key],t);bc.drawImage(layers[key].canvas,0,0);
 }
 refract(layers.lens,t,...lensPose(t),p(t,1.62,1.67)*(1-p(t,2.77,2.9)));
 if(t<.067||t>=3.48)render(layers.aperture,t);
 else rr(layers.aperture,1,1,W-2,H-2,10,null,'#f4e6ff21',1.3);
}
function drawPart(c,key,t){
 reset(c);
 if(key==='background'){background(c,t);return;}
 reset(bc);background(bc,key==='lens'?2.25:t);
 if(key==='panes'){listening(bc,t);mainCard(bc,t);focus(bc,t);}
 if(key==='lens')mainCard(bc,2.25);
 c.filter='blur(.35px)';c.drawImage(base,0,0);c.filter='none';
 if(key==='lens')refract(c,t,...lensPose(t),p(t,1.62,1.67)*(1-p(t,2.77,2.9)));
}
function drawCard(c,key){
 reset(c);reset(bc);background(bc,2.25);
 const spec={listening:[300,148,listening],chat:[578,414,mainCard],focus:[356,202,focus]}[key];
 if(!spec)throw new Error('未知玻璃卡片：'+key);
 const [w,h,draw]=spec,scale=Math.min(800/w,456/h);
 draw(c,2.25,[(W-w*scale)/2,(H-h*scale)/2,scale,0]);
}
function destroy(){for(const node of [bg,base,paneSource,lens,opening]){node.width=1;node.height=1;}}
return {render,drawLayers,drawPart,drawCard,drawInner,base,destroy,duration:3.65,width:W,height:H};
}

const parts=[['background','diffuse-light-drift','弥散光团渐变'],['panes','glass-card-stagger','透光卡片错层'],['lens','convex-glass-lens','凸泡变形折射']];
const clocks={background:[1.1,3.45],panes:[0,2.45],lens:[1.62,2.9]};
const durations={background:3000,panes:3000,lens:1800};
function make(root,kit,definition={},only){
 const doc=root.ownerDocument,container=doc.createElement('div');
 Object.assign(container.style,{position:'absolute',inset:'0',overflow:'hidden',background:'#0a0714'});root.replaceChildren(container);
 function surface(key,parent=container,lazy=false){const node=doc.createElement('canvas');node.width=lazy?1:1066;node.height=lazy?1:600;if(key)node.dataset.layer=key;Object.assign(node.style,{position:'absolute',inset:'0',width:'640px',height:'360px'});parent.append(node);return {node,c:lazy?null:node.getContext('2d')};}
 const layerHost=only?null:doc.createElement('div'),layers={};
 if(layerHost){Object.assign(layerHost.style,{position:'absolute',inset:'0',visibility:'hidden'});container.append(layerHost);for(const key of ['background','wordmark','listening','chat','focus','lens','aperture'])layers[key]=surface(key,layerHost,true);}
 const full=surface(only),painter=full.c?createPainter(doc):null;
 let dead=false,previous=-1,local=0,inspecting=false;
 function paintLayers(){
  if(!painter||!layerHost)return;
  const contexts={};for(const [key,layer]of Object.entries(layers)){if(!layer.c){layer.node.width=1066;layer.node.height=600;layer.c=layer.node.getContext('2d');}if(!layer.c)return;contexts[key]=layer.c;}
  painter.drawLayers(contexts,local);
 }
 const Observer=doc.defaultView?.MutationObserver;
 const observer=!only&&Observer?new Observer(()=>{
  if(dead)return;inspecting=!!layerHost.querySelector('[data-composition-hidden]');
  full.node.style.visibility=inspecting?'hidden':'visible';layerHost.style.visibility=inspecting?'visible':'hidden';
  if(inspecting)paintLayers();
 }):null;
 observer?.observe(layerHost,{subtree:true,attributes:true,attributeFilter:['data-composition-hidden']});
 const render=ms=>{
  if(dead)return;ms=Math.max(0,Math.min(definition.duration_ms||(only?durations[only]:3650),ms));if(ms===previous)return;previous=ms;
  local=ms/1000;
  if(only){const [a,b]=clocks[only],duration=definition.duration_ms||durations[only];local=a+(b-a)*Math.max(0,Math.min(1,(ms-150)/(duration-600)));}
  container.dataset.time=local.toFixed(6);container.dataset.phase=only|| (local<1.62?'浮层进入':local<2.48?'气泡折射':local<3.48?'字标交接':'收拢退出');
  if(painter){if(only)painter.drawPart(full.c,only,local);else painter.render(full.c,local);if(inspecting)paintLayers();}
 };
 render.frameRate=60;
 render.destroy=(preserve=false)=>{if(dead)return;dead=true;observer?.disconnect();painter?.destroy();for(const layer of Object.values(layers)){layer.node.width=1;layer.node.height=1;layer.c=null;}layerHost?.remove();full.node.style.visibility='visible';if(!preserve){full.node.width=1;full.node.height=1;root.replaceChildren();}full.c=null;};
 render(0);return render;
}
const cards=[['listening','glass-voice-card-illustration','透光语音卡'],['chat','glass-dialogue-card-illustration','透光对话卡'],['focus','glass-control-card-illustration','透光创作卡']];
function makeCard(root,kit,definition,key){
 const doc=root.ownerDocument,node=doc.createElement('canvas');node.width=1066;node.height=600;node.className='pattern-canvas';node.dataset.card=key;
 node.setAttribute('role','img');node.setAttribute('aria-label',cards.find(row=>row[0]===key)[2]);
 Object.assign(node.style,{width:'640px',height:'360px',background:'transparent'});root.replaceChildren(node);
 const c=node.getContext('2d');
 if(c){const painter=createPainter(doc);try{painter.drawCard(c,key);}finally{painter.destroy();}}
 // A single illustration is drawn once; seeking never adds a scene or redraw loop.
 let dead=false;const render=()=>{};
 render.destroy=(preserve=false)=>{if(dead)return;dead=true;if(!preserve){node.width=1;node.height=1;root.replaceChildren();}};
 return render;
}
global.WiseGlassLight={createPainter,parts,cards,duration:3650};
const F=global.MotionFactories;
if(F){
 F['glass-interface-sequence']=(root,kit,def)=>make(root,kit,def);
 for(const [key,id]of parts)F[id]=(root,kit,def)=>make(root,kit,def,key);
 for(const [key,id]of cards)F[id]=(root,kit,def)=>makeCard(root,kit,def,key);
 F['glass-interface-sequence'].breakdown=[
  {id:'background',name:'弥散光场',actions:['diffuse-light-drift'],start:0,end:3650,time:'0–3.65 秒',detail:'十四组紫蓝与青色光团按固定位置、椭圆范围和颜色渐变叠加，给玻璃提供透入的环境光。'},
  {id:'wordmark',name:'细线字标',actions:[],start:2480,end:3480,time:'2.48–3.48 秒',detail:'WISE MOTION 细线字标位于卡片后方，气泡收拢后成为 MOTION 的第一个 O，底部出现双语短句。'},
  {id:'listening',name:'后方语音卡',actions:['glass-card-stagger','glass-voice-card-illustration'],start:0,end:2780,time:'0–2.78 秒',detail:'语音卡先进入并保留青色光点，波形按同一时间变化；退出时向左上移动。'},
  {id:'chat',name:'中间对话卡',actions:['glass-card-stagger','glass-dialogue-card-illustration'],start:0,end:2840,time:'0–2.84 秒',detail:'对话卡采样后方光场和卡片，再叠少量着色；回复与按钮按固定次序出现。'},
  {id:'focus',name:'前景控制卡',actions:['glass-card-stagger','glass-control-card-illustration'],start:0,end:2860,time:'0–2.86 秒',detail:'控制卡从左下移入，左侧保持暗部、右侧透入蓝光；开关开启后滑杆读数升至74%。'},
  {id:'lens',name:'柔光凸泡',actions:['convex-glass-lens'],start:1620,end:2900,time:'1.62–2.90 秒',detail:'凸泡由小圆扩张为胶囊，逐像素采样后方文字并放大折射；体积由方向性柔光形成，不画深色环和气泡描边。'},
  {id:'aperture',name:'开窗与收拢',actions:[],start:0,end:3650,time:'0–3.65 秒',detail:'开头67毫秒展开观看窗口；3.48秒后画面收拢为光点，并转成红色过渡点。'}
 ];
}
})(globalThis);
