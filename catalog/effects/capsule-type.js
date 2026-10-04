/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* Extracted from the approved 5-second WISE MOTION composition.
   The catalog adds object isolation and lifecycle control; geometry, pigments,
   lighting, camera keys and full-composition timing retain the approved source. */
(function(global){
'use strict';
const local={};
/* WISE MOTION — a deterministic, choreographed capsule field. */
(function(scope){
'use strict';
const duration=5.0, NX=72,NZ=80,PITCH=.34,R=.395, IMPACT=1.88;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const phase=(t,a,b)=>{let u=clamp((t-a)/(b-a));return u*u*(3-2*u);};
const seed=n=>{let v=Math.sin(n*127.1+311.7)*43758.5453123;return v-Math.floor(v);};
const cubic=(a,b,c,d,t)=>a.map((v,i)=>(1-t)**3*v+3*(1-t)**2*t*b[i]+3*(1-t)*t*t*c[i]+t**3*d[i]);
// Linear-light pigment values shared by geometry instances and reflected field colors.
const palette={pink:[.95,.008,.18],yellow:[1.0,.59,.008],cyan:[.008,.43,.68],fieldStart:[.78,.64,.29],fieldEnd:[.90,.76,.38],floor:[.40,.32,.16],fog:[.80,.67,.38]};
const wiseColors=[palette.pink,palette.yellow,palette.cyan,palette.pink];
const motionColors=[palette.cyan,palette.pink,palette.yellow,palette.cyan,palette.yellow,palette.pink];
const sPath=[];
for(const curve of [ [[.65,2.12],[.1,2.63],[-1.04,2.32],[-.70,1.67]], [[-.70,1.67],[-.45,1.21],[.77,1.50],[.72,.80]], [[.72,.80],[.68,.16],[-.22,.10],[-.70,.46]] ]){
 for(let i=0;i<=14;i++){const p=cubic(...curve,i/14);if(sPath.length&&i===0)continue;sPath.push(p);}
}
const oPath=Array.from({length:49},(_,i)=>{const a=i*Math.PI/24;return [.74*Math.cos(a),1.335+.965*Math.sin(a)];});
const paths=[
 [[[-1.15,2.30],[-.60,.37],[0,1.58],[.60,.37],[1.15,2.30]]],
 [[[0,.37],[0,2.30]]],
 [sPath],
 [[[-.60,.37],[-.60,2.30],[.70,2.30]],[[-.60,1.38],[.50,1.38]],[[-.60,.37],[.70,.37]]],
 [[[-.92,.37],[-.92,2.30],[0,1.26],[.92,2.30],[.92,.37]]],
 [oPath],
 [[[-.85,2.30],[.85,2.30]],[[0,2.30],[0,.37]]],
 [[[-.78,.37],[-.78,2.30],[.78,.37],[.78,2.30]]]
];
const centers=[-3.07,-.97,.88,3.53].map(x=>x*1.05),hits=[.34,.51,.68,.85];
const motionGlyphs=[4,5,6,1,5,7],motionCenters=[-3.919,-2.066,-.263,1.04,2.266,4.018].map(x=>x*1.05);
const motionLaunch=j=>IMPACT+.035+(5-j)*.026;
const segments=paths.map(group=>group.flatMap(path=>path.slice(1).map((b,i)=>{const a=path[i],dx=b[0]-a[0],dy=b[1]-a[1];return {a,b,dx,dy,den:dx*dx+dy*dy};})));
function glyphDistance(index,p){
 let value=100;
 const bulge=1+.055*Math.sin(clamp((p[1]-.37)/1.93)*Math.PI),radius=(index===1?.40:index>3?.34:R)*bulge;
 for(const s of segments[index]){const x=p[0]-s.a[0],y=p[1]-s.a[1],u=clamp((x*s.dx+y*s.dy)/s.den);const d=Math.hypot(x-s.dx*u,y-s.dy*u,p[2]*.72)-radius;
  const k=(index===2||index===5)?.035:.19,h=clamp(.5+.5*(d-value)/k);value=mix(d,value,h)-k*h*(1-h);
 }
 return value*.72;
}
const minYs=paths.map((_,j)=>{
 let min=10;
 for(let x=-1.55;x<=1.55;x+=.025){let low=-1,high=1;
  let inside=false;for(let y=-.4;y<1;y+=.025)if(glyphDistance(j,[x,y,0])<=0){high=y;inside=true;break;}
  if(!inside)continue;for(let k=0;k<23;k++){let m=(low+high)/2;if(glyphDistance(j,[x,m,0])>0)low=m;else high=m;}min=Math.min(min,(low+high)/2);
 }return min;
});
const capsules=[];
for(let z=0;z<NZ;z++)for(let x=0;x<NX;x++){
 const id=z*NX+x,px=(x-(NX-1)/2)*PITCH,pz=(z-(NZ-1)/2)*PITCH;
 const distance=Math.hypot(px-5.25,(pz-4.60)*1.15),n=seed(id+72);
 capsules.push({id,x:px,z:pz,n,burst:(distance<1.65||(Math.abs(pz-4.60)<.68&&Math.abs(px)<4.9))&&n>.30,distance});
}
function letterPose(j,t){
 const age=t-hits[j],dropStart=hits[j]-.34,fall=clamp((t-dropStart)/.34),pre=t<hits[j];
 const bounce=pre?5.8*(1-fall*fall):Math.abs(Math.sin(age*18))*Math.exp(-age*8.4)*.38;
 const compress=pre?0:Math.exp(-age*9.2)*Math.sin(Math.min(age*26,Math.PI));
 const squash=1-.18*Math.max(0,compress),sway=pre?(j%2?-.14:.14)*(1-fall*.75):Math.sin(age*18)*Math.exp(-age*7)*.10*(j%2?-1:1);
 const press=.16*(1-Math.exp(-Math.max(age,0)*20));
 return {x:centers[j],y:.76-press-minYs[j]*squash+bounce,tilt:sway,twist:(j-1.5)*.028*(1-phase(t,.85,1.4)),squash,age,visible:t>=dropStart-.04};
}
function motionPose(j,t){
 const glyph=motionGlyphs[j],age=t-motionLaunch(j),a=Math.max(0,age),grow=phase(a,0,.15);
 const spread=1-Math.pow(1-clamp(a/.26),3),settle=phase(a,.36,.90),spin=1-phase(a,.10,.88);
 const scale=.72*grow*(1+.16*Math.sin(Math.PI*clamp(a/.5))*Math.exp(-a*2));
 const landed=Math.max(0,a-.64),squash=1-.10*Math.exp(-landed*15)*Math.sin(Math.min(landed*32,Math.PI));
 const hop=Math.sin(Math.PI*clamp(a/.64))*(1.35+(j%3)*.16);
 const bounce=Math.abs(Math.sin(landed*20))*Math.exp(-landed*13)*.13;
 const finalX=motionCenters[j],splay=finalX*1.12;
 return {glyph,visible:age>=0,age,x:mix(mix(finalX*.48+1.5,splay,spread),finalX,settle),
  y:mix(.28,.66-minYs[glyph]*scale*squash,grow)+hop+bounce,z:mix(mix(4.60,3.35+(j%2)*.28,spread),4.60,settle),
  scale,squash,rotation:quat((-.85+j*.08)*spin,(j-2.5)*.35*spin,(j-2.5)*.20*spin)};
}
function displacement(x,z,t,channels){
 let q=0;
 if(channels.wise!==false)for(let j=0;j<4;j++){
  const age=t-hits[j];if(age<0)continue;
  const dx=x-centers[j],dz=z,dist=Math.hypot(dx,dz*1.08),width=j===0?1.2:j===1?.38:.80;
  const contact=Math.exp(-Math.pow(dx/width,4)-dz*dz/1.05);
  q-=.16*(1-Math.exp(-age*20))*contact;
  const wave=dist-age*5.6;
  q+=Math.sin(wave*7)*Math.exp(-wave*wave/1.0)*Math.exp(-age*1.25)*.16*phase(age,0,.07);
 }
 const age=t-IMPACT;if(channels.impact!==false&&age>=0){const dist=Math.hypot(x-5.25,z-4.60),wave=dist-age*9.0;q+=Math.cos(wave*5.5)*Math.exp(-wave*wave/1.2)*Math.exp(-age*1.4)*.38*phase(age,0,.04);}
 // Each emerged letter settles onto the same field at the end of its arc.
 if(channels.motion!==false)for(let j=0;j<6;j++){const age=t-motionLaunch(j)-.64;if(age<0)continue;const dx=x-motionCenters[j],dz=z-4.60;
  q-=.10*phase(age,0,.10)*Math.exp(-Math.pow(dx/(j===3?.30:.90),4)-dz*dz/.42);
 }

 return clamp(q,-.34,.44);
}
function quat(ax,ay,az){const sx=Math.sin(ax/2),cx=Math.cos(ax/2),sy=Math.sin(ay/2),cy=Math.cos(ay/2),sz=Math.sin(az/2),cz=Math.cos(az/2);return [sx*cy*cz-cx*sy*sz,cx*sy*cz+sx*cy*sz,cx*cy*sz-sx*sy*cz,cx*cy*cz+sx*sy*sz];}
function fieldAt(t,channels){
 const values=new Float32Array(capsules.length*14);let k=0,airborne=0;
 for(const p of capsules){
  const height=.76+displacement(p.x,p.z,t,channels),sy=(height-.018)/4;
  let x=p.x,y=(height+.018)/2,z=p.z,rotation=[0,0,0,1],scale=[.147,sy,.147];
  const delay=Math.min(p.distance*.018,.20),age=t-IMPACT-delay-p.n*.025,returning=phase(t,2.75+p.n*.1,3.55+p.n*.1);
  if(channels.impact!==false&&p.burst&&age>0&&returning<1){
   const a=Math.atan2((p.z-4.60)*2.5,p.x*.35),velocity=p.n>.55?4.5+p.n*3.4:1.8+p.n*1.8,flight=Math.max(0,velocity*age-8.2*age*age);
   const land=velocity/8.2,after=Math.max(0,age-land),rebound=after>0?Math.abs(Math.sin(after*12))*Math.exp(-after*8)*.25:0;
   const spread=(2.2+p.n*2.5)*Math.min(age,.58),fade=1-returning;
   x+=Math.cos(a)*spread*fade;z+=Math.sin(a)*spread*fade;y+=(flight+rebound)*fade;
   rotation=quat(age*(3+p.n*4)*fade,age*2*fade,Math.sin(a)*age*4*fade);if(flight*fade>.1)airborne++;
  }
  const colorWave=channels.impact===false?0:phase(t,IMPACT+p.distance/13,IMPACT+.32+p.distance/13),tone=.96+p.n*.06;
  const pigment=[palette.pink,palette.yellow,palette.cyan][p.id%3],confetti=channels.impact!==false&&p.burst?phase(age,0,.12)*(1-returning):0;
  const color=palette.fieldStart.map((v,j)=>mix(mix(v,palette.fieldEnd[j],colorWave),pigment[j],confetti)*tone);
  values.set([x,y,z,...scale,...rotation,...color,.37],k);k+=14;
 }return {values,airborne};
}
function frameAt(seconds,channels={}){
 const t=clamp(Number(seconds)||0,0,duration),letters=channels.wise===false?[]:centers.map((_,j)=>letterPose(j,t)),motionLetters=channels.motion===false?[]:motionGlyphs.map((_,j)=>motionPose(j,t));
 const approach=clamp((t-1.42)/.46),age=Math.max(0,t-IMPACT);
 const ball=t<IMPACT?[mix(10.8,5.25,approach),mix(6.4,1.40,approach*approach),4.60]:[5.25+age*6.5,1.40+age*6.7-age*age*2.2,4.60-age*2.0];
 const field=fieldAt(t,channels);
 return {time:t,letters,motionLetters,fieldInstances:field.values,capsuleCount:capsules.length,airborne:field.airborne,ball,ballEnabled:channels.impact!==false&&t>=1.42&&t<3.15?1:0,ballSpin:age*3.8,end:t>=duration};
}
scope.WiseMotionModel={palette,wiseColors,motionColors,duration,frameAt,glyphDistance,paths,centers,hits,minYs,motionGlyphs,motionCenters,impact:IMPACT,constants:{NX,NZ,PITCH,radius:R},quat};
})(local);
/* WISE MOTION — mesh-rendered soft typography and a dense capsule field. */
(function(scope){
'use strict';
const model=scope.WiseMotionModel,palette=model.palette,DURATION=model.duration,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const glslColor=rgb=>'vec3('+rgb.map(v=>v.toFixed(4)).join(',')+')';
const phase=(t,a,b)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u);};
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>{const l=Math.hypot(...a);return a.map(v=>v/l);};
function lookAt(eye,target){const z=unit(sub(eye,target)),x=unit(cross([0,1,0],z)),y=cross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
function perspective(fov,aspect,near,far){const f=1/Math.tan(fov*Math.PI/360);return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];}
function ortho(l,r,b,t,n,f){return [2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1];}
function multiply(a,b){const r=new Array(16).fill(0);for(let c=0;c<4;c++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)r[c*4+i]+=a[k*4+i]*b[c*4+k];return r;}
const cameraKeys=[
 {t:0,eye:[-6.4,3.8,9.5],target:[-2.7,1.15,0],fov:36},
 {t:.40,eye:[-5.1,4.6,11.4],target:[-1.5,1.15,0],fov:36},
 {t:1.06,eye:[1.9,5.7,14.0],target:[0,1.1,.4],fov:35},
 {t:1.62,eye:[3.0,6.3,14.7],target:[.2,1.1,.8],fov:35},
 {t:1.90,eye:[1.5,7.3,15.1],target:[.25,1.1,1.4],fov:36},
 {t:2.16,eye:[.55,9.7,17.0],target:[0,1.45,1.45],fov:37},
 {t:3.45,eye:[.35,9.2,15.5],target:[0,1.22,1.65],fov:34},
 {t:5,eye:[.35,9.2,15.5],target:[0,1.22,1.65],fov:34}
];
const light=[-7,12,8],lightMatrix=multiply(ortho(-16,16,-16,16,.1,48),lookAt(light,[0,0,0]));
function sceneAt(seconds,channels={}){const state=model.frameAt(seconds,channels),t=state.time;let i=0;while(i<cameraKeys.length-2&&t>cameraKeys[i+1].t)i++;
 const a=cameraKeys[i],b=cameraKeys[i+1],u=phase(t,a.t,b.t),eye=a.eye.map((v,j)=>mix(v,b.eye[j],u)),target=a.target.map((v,j)=>mix(v,b.target[j],u)),fov=mix(a.fov,b.fov,u);
 const impactAge=Math.max(0,t-model.impact),kick=channels.impact!==false&&t>=model.impact?Math.sin(impactAge*76)*Math.exp(-impactAge*17)*.12:0;eye[0]+=kick;eye[1]+=kick*.55;
 const view=lookAt(eye,target),projection=perspective(fov,16/9,.1,65),vp=multiply(projection,view),focus=Math.hypot(...sub(eye,[mix(-2.7,0,phase(t,.15,1.0)),1.25,mix(0,1.7,phase(t,1.62,2.4))]));
 return {...state,eye,target,fov,view,vp,lightMatrix,focus,aperture:mix(18,5,phase(t,.2,1.3))};}
function lathe(capsule=false,lon=12,lat=10){
 const p=[],n=[],indices=[],rings=[];
 if(capsule){for(let i=0;i<=3;i++){let a=-Math.PI/2+i*Math.PI/6;rings.push([Math.cos(a),-1+Math.sin(a),Math.sin(a)]);}for(let i=0;i<=3;i++){let a=i*Math.PI/6;rings.push([Math.cos(a),1+Math.sin(a),Math.sin(a)]);}}
 else for(let i=0;i<=lat;i++){let a=-Math.PI/2+i*Math.PI/lat;rings.push([Math.cos(a),Math.sin(a),Math.sin(a)]);}
 rings.forEach(([r,y,ny],row)=>{for(let j=0;j<=lon;j++){const a=j*Math.PI*2/lon,c=Math.cos(a),s=Math.sin(a);p.push(c*r,y,s*r);n.push(c*r,ny,s*r);if(row<rings.length-1&&j<lon){let x=row*(lon+1)+j,b=x+lon+1;indices.push(x,b,x+1,x+1,b,b+1);}}});
 return {positions:new Float32Array(p),normals:new Float32Array(n),indices:new Uint16Array(indices)};
}
function glyphMesh(id){
 const step=.07,min=[-1.75,-.62,-.84],count=[52,54,25],positions=[],normals=[],occlusion=[],cache=new Map();
 const [nx,ny,nz]=count,values=new Float32Array(nx*ny*nz),index=(x,y,z)=>(z*ny+y)*nx+x,point=(x,y,z)=>[min[0]+x*step,min[1]+y*step,min[2]+z*step];
 for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)values[index(x,y,z)]=model.glyphDistance(id,point(x,y,z));
 const corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 function vertex(p){
  const key=p.map(v=>Math.round(v*1e7)).join(',');let record=cache.get(key);
  if(!record){
   p=p.slice();const e=.002,gradient=point=>point.map((_,k)=>{let a=point.slice(),b=point.slice();a[k]+=e;b[k]-=e;return (model.glyphDistance(id,a)-model.glyphDistance(id,b))/(2*e);});
   for(let pass=0;pass<2;pass++){const n=gradient(p),d=model.glyphDistance(id,p),l=dot(n,n);if(l>1e-12)p=p.map((v,k)=>v-d*n[k]/l);}
   const g=gradient(p),metric=Math.max(.25,Math.hypot(...g)),n=unit(g);let cavity=0;
   for(const [distance,weight] of [[.16,.50],[.34,.32],[.58,.18]]){
    const sample=p.map((v,k)=>v+n[k]*distance),clearance=model.glyphDistance(id,sample)/metric;
    cavity+=Math.max(0,1-clearance/distance)*weight;
   }
   record={p,n,ao:clamp(1-cavity*.85,.52,1)};cache.set(key,record);
  }
  positions.push(...record.p);normals.push(...record.n);occlusion.push(record.ao);
 }
 for(let z=0;z<nz-1;z++)for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
  const ps=corners.map(c=>point(x+c[0],y+c[1],z+c[2])),ds=corners.map(c=>values[index(x+c[0],y+c[1],z+c[2])]);if(ds.every(v=>v>0)||ds.every(v=>v<=0))continue;
  for(const t of tetra){const ins=t.filter(i=>ds[i]<=0),outs=t.filter(i=>ds[i]>0);if(!ins.length||!outs.length)continue;
   const edge=(a,b)=>ps[a].map((v,k)=>mix(v,ps[b][k],ds[a]/(ds[a]-ds[b])));
   if(ins.length===1){for(const j of outs)vertex(edge(ins[0],j));}
   else if(ins.length===3){for(const j of ins)vertex(edge(j,outs[0]));}
   else{const a=edge(ins[0],outs[0]),b=edge(ins[0],outs[1]),c=edge(ins[1],outs[0]),d=edge(ins[1],outs[1]);for(const p of [a,b,c,c,b,d])vertex(p);}
  }
 }
 return {positions:new Float32Array(positions),normals:new Float32Array(normals),occlusion:new Float32Array(occlusion)};
}
let geometry;
function meshes(ids=model.paths.map((_,i)=>i)){
 if(!geometry)geometry={pill:lathe(true,10),fringe:lathe(true,6),ball:lathe(false,40,26),letters:new Array(model.paths.length),floor:{positions:new Float32Array([-50,-.025,-50,-50,-.025,50,50,-.025,-50,50,-.025,-50,-50,-.025,50,50,-.025,50]),normals:new Float32Array(Array.from({length:6},()=>[0,1,0]).flat())}};
 for(const id of ids)if(!geometry.letters[id])geometry.letters[id]=glyphMesh(id);
 return geometry;
}
async function prepare(ids,cancelled){
 for(const id of ids){if(cancelled())return;await new Promise(resolve=>global.setTimeout(resolve,0));if(cancelled())return;meshes([id]);}
}
// Extend the physical foreground with low-detail distant capsules. Cull by the
// current camera and fade to the same sky before the finite outer boundary.
const fringeBounds={minX:-48.96,maxX:48.96,minZ:-57.8,maxZ:23.12,fadeEnd:48};
let fringePoints;
function fringeAt(state,channels={}){
 if(channels.field===false)return new Float32Array();
 if(!fringePoints){fringePoints=[];for(let z=-170;z<68;z++)for(let x=-144;x<144;x++){
  if(x>=-36&&x<36&&z>=-40&&z<40)continue;
  const px=(x+.5)*.34,pz=(z+.5)*.34,n=Math.sin(x*127.1+z*311.7+91.3)*43758.5453123;
  fringePoints.push([px,pz,.96+(n-Math.floor(n))*.06,Math.hypot(px-5.25,(pz-4.60)*1.15)]);
 }}
 const output=[],m=state.vp,v=state.view,t=state.time;
 for(const [x,z,tone,distance] of fringePoints){
  const depth=-(v[2]*x+v[6]*.389+v[10]*z+v[14]);if(depth<.1||depth>fringeBounds.fadeEnd+2)continue;
  const w=m[3]*x+m[7]*.389+m[11]*z+m[15],sx=(m[0]*x+m[4]*.389+m[8]*z+m[12])/w,sy=(m[1]*x+m[5]*.389+m[9]*z+m[13])/w;
  if(Math.abs(sx)>1.08||Math.abs(sy)>1.08)continue;
  const wave=channels.impact===false?0:phase(t,1.88+distance/13,2.20+distance/13);
  const color=palette.fieldStart.map((value,i)=>mix(value,palette.fieldEnd[i],wave)*tone);
  output.push(x,.389,z,.147,.1855,.147,0,0,0,1,...color,.37);
 }
 return new Float32Array(output);
}
function frameDraws(t,channels={}){const state=sceneAt(t,channels),draws=channels.field===false?[]:[{mesh:'floor',instances:new Float32Array([0,0,0,1,1,1,0,0,0,1,...palette.floor,.68]),metal:0,kind:0},{mesh:'pill',instances:state.fieldInstances,metal:.025,kind:1}];
 state.letters.forEach((l,i)=>{if(l.visible)draws.push({mesh:'letter'+i,instances:new Float32Array([l.x,l.y,0,1/Math.sqrt(l.squash),l.squash,1/Math.sqrt(l.squash),...model.quat(0,l.twist,l.tilt),...model.wiseColors[i],.23]),metal:0,kind:2});});
 state.motionLetters.forEach((l,i)=>{if(l.visible&&l.scale>.001)draws.push({mesh:'letter'+l.glyph,instances:new Float32Array([l.x,l.y,l.z,l.scale/Math.sqrt(l.squash),l.scale*l.squash,l.scale/Math.sqrt(l.squash),...l.rotation,...model.motionColors[i],.23]),metal:0,kind:2});});
 if(state.ballEnabled)draws.push({mesh:'ball',instances:new Float32Array([...state.ball,.64,.64,.64,...model.quat(0,0,-state.ballSpin),.81,.82,.82,.10]),metal:.98,kind:3});
 if(channels.field!==false)draws.splice(1,0,{mesh:'fringe',instances:fringeAt(state,channels),metal:.025,kind:1,castShadow:false});
 return {state,draws};
}
const backdropSource=`
vec3 backdrop(vec2 uv){
 vec3 color=mix(vec3(.83,.72,.46),vec3(.58,.49,.29),smoothstep(.1,1.0,uv.y));
 vec2 offset=(uv-vec2(.64,.70))*vec2(1.25,1.8);
 return color+vec3(.22,.18,.11)*exp(-dot(offset,offset)*4.0);
}`;
const skySource=`precision highp float;varying vec2 v_uv;
${backdropSource}
void main(){vec3 c=backdrop(v_uv);c=clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.0,1.0);gl_FragColor=vec4(pow(c,vec3(1.0/2.2)),1.0);}`;
const vertexSource=`precision highp float;
attribute vec3 a_position,a_normal,a_offset,a_scale;attribute vec4 a_rotation,a_style;attribute float a_occlusion;
uniform mat4 u_vp,u_view,u_lightMatrix;
varying vec3 v_world,v_normal;varying vec4 v_style,v_shadow;varying float v_depth,v_occlusion;
vec3 turn(vec3 p,vec4 q){return p+2.0*cross(q.xyz,cross(q.xyz,p)+q.w*p);}
void main(){vec3 p=turn(a_position*a_scale,a_rotation)+a_offset;v_world=p;v_normal=normalize(turn(a_normal/a_scale,a_rotation));v_style=a_style;v_occlusion=a_occlusion;v_shadow=u_lightMatrix*vec4(p,1.0);v_depth=-(u_view*vec4(p,1.0)).z;gl_Position=u_vp*vec4(p,1.0);}`;
// Glyph cavities are baked from their actual surfaces. The field receives the
// shared shadow map; glossy bodies avoid shadow-map self-acne and use studio reflections.
const fragmentSource=`precision highp float;
varying vec3 v_world,v_normal;varying vec4 v_style,v_shadow;varying float v_depth,v_occlusion;
uniform sampler2D u_shadow;uniform vec2 u_resolution;uniform vec3 u_eye;uniform float u_metal,u_kind,u_time;
${backdropSource}
float softbox(vec3 r,vec3 direction,vec2 size,float feather){
 vec3 axis=normalize(direction),right=normalize(cross(axis,vec3(0.0,1.0,0.0))),up=cross(right,axis);
 float facing=dot(r,axis);vec2 uv=vec2(dot(r,right),dot(r,up))/max(facing,.001);
 vec2 mask=1.0-smoothstep(size-vec2(feather),size+vec2(feather),abs(uv));
 return mask.x*mask.y*step(.001,facing);
}
vec3 env(vec3 r,float rough){
 vec3 c=mix(vec3(.020,.012,.028),vec3(.16,.14,.21),smoothstep(-.35,.75,r.y));
 float feather=.018+rough*.24;
 c+=vec3(1.0,.97,.95)*softbox(r,vec3(-.65,1.0,.8),vec2(.46,.24),feather)*12.0;
 c+=vec3(.92,.97,1.0)*softbox(r,vec3(.95,.45,.25),vec2(.10,.56),feather)*8.0;
 c+=vec3(.82,.90,1.0)*softbox(r,vec3(.15,.85,-.8),vec2(.55,.14),feather)*3.8;
 return c;
}
float visibility(vec3 n,vec3 light){vec3 p=v_shadow.xyz/v_shadow.w*.5+.5;if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0)return 1.0;float value=0.0,bias=max(.0012*(1.0-max(dot(n,light),0.0)),.00060)+(u_kind>1.5?.0018:0.0);
 for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){vec4 s=texture2D(u_shadow,p.xy+vec2(float(x),float(y))/1024.0);float depth=dot(s,vec4(1.0,1.0/255.0,1.0/65025.0,1.0/16581375.0));value+=p.z-bias<=depth?1.0:.12;}return value/9.0;}
vec3 tone(vec3 c){return clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.0,1.0);}
void main(){
 vec3 p=v_world,n=normalize(v_normal),view=normalize(u_eye-p),light=normalize(vec3(-7.0,12.0,8.0)-p),halfV=normalize(view+light),base=v_style.rgb;
 float rough=v_style.a,metal=u_metal,nv=max(dot(n,view),.001),nl=max(dot(n,light),0.0),nh=max(dot(n,halfV),0.0),vh=max(dot(view,halfV),0.0),shade=u_kind>1.5?1.0:visibility(n,light);
 float a=rough*rough,a2=a*a,d=nh*nh*(a2-1.0)+1.0,k=(rough+1.0)*(rough+1.0)/8.0;
 vec3 f0=mix(vec3(.042),base,metal),f=f0+(1.0-f0)*pow(1.0-vh,5.0);
 float distribution=a2/max(3.14159265*d*d,.00001),geometry=nv/(nv*(1.0-k)+k)*nl/(nl*(1.0-k)+k);
 vec3 color=(base*(1.0-metal)/3.14159265+distribution*geometry*f/max(4.0*nv*nl,.001))*vec3(2.65,2.57,2.62)*nl*shade*mix(.80,1.0,v_occlusion);
 float ao=mix(.48,1.0,smoothstep(.05,.70,p.y))*v_occlusion;
 color+=base*(1.0-metal)*(.11+.18*max(n.y,0.0))*ao;
 // A broad colored fill keeps shadowed candy paint saturated, with brighter grazing edges.
 float isCandy=step(1.5,u_kind)*(1.0-step(2.5,u_kind));
 color+=base*isCandy*(.13*pow(clamp(dot(n,light)*.5+.5,0.0,1.0),2.0)+.09*pow(1.0-nv,2.0))*ao;
 vec3 ray=reflect(-view,n),environment=env(ray,rough);
 if(u_kind>2.5&&ray.y<-.02){float t=(.66-p.y)/ray.y;if(t>0.0&&t<28.0){vec3 hit=p+ray*t;vec2 q=fract(hit.xz/.34+.5)-.5;float caps=1.0-smoothstep(.10,.51,length(q));vec3 floorColor=mix(${glslColor(palette.fieldStart)},${glslColor(palette.fieldEnd)},smoothstep(1.88,3.65,u_time));environment=mix(environment,floorColor*(.26+.75*caps),.91);}}
 vec3 envF=f0+(1.0-f0)*pow(1.0-nv,5.0);color+=environment*envF*(1.0-rough*.45)*ao;
 if(isCandy>.5){float coat=.025+.975*pow(1.0-nv,5.0);color=color*(1.0-coat*.25)+env(ray,.065)*coat*.65*ao;}
 color+=base*.12*max(dot(n,normalize(vec3(3.0,4.0,-5.0))),0.0);
 vec3 fog=backdrop(gl_FragCoord.xy/u_resolution);float mist=smoothstep(18.0,48.0,v_depth);color=mix(color,fog,mist*(1.0-isCandy*.96));
 color=pow(tone(color),vec3(1.0/2.2));gl_FragColor=vec4(color,clamp(v_depth/45.0,0.0,1.0));
}`;
const shadowSource=`precision highp float;void main(){vec4 enc=fract(gl_FragCoord.z*vec4(1.0,255.0,65025.0,16581375.0));enc-=enc.yzww*vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);gl_FragColor=enc;}`;
const postVertex=`attribute vec3 a_position;varying vec2 v_uv;void main(){v_uv=a_position.xy*.5+.5;gl_Position=vec4(a_position.xy,0.0,1.0);}`;
const postSource=`precision highp float;varying vec2 v_uv;uniform sampler2D u_image;uniform vec2 u_resolution;uniform float u_focus,u_aperture;
void main(){vec4 center=texture2D(u_image,v_uv);float depth=center.a*45.0,radius=clamp(abs(depth-u_focus)/max(depth,1.0)*u_aperture,0.0,5.0);vec3 color=center.rgb;float weight=1.0;
for(int i=0;i<12;i++){float a=float(i)*.5235988;vec4 c=texture2D(u_image,v_uv+vec2(cos(a),sin(a))*radius/u_resolution);float w=c.a*45.0<depth-1.0?.1:1.0;color+=c.rgb*w;weight+=w;}
vec2 p=v_uv-.5;float vignette=1.0-.16*dot(p,p);float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;gl_FragColor=vec4(color/weight*vignette+grain/510.0,1.0);}`;
const api={duration:DURATION,sceneAt,frameDraws,fringeAt,fringeBounds,meshes,prepare,model,sources:{sky:skySource,vertex:vertexSource,fragment:fragmentSource,shadow:shadowSource,postVertex,post:postSource}};scope.WiseMotion3D=api;
function createPainter(canvas,gl,ids){
 let ext,programs,gpu,instanceBuffer,quadBuffer,shadowTarget,colorTarget,targetSize;
 const resources={Shader:new Set(),Program:new Set(),Buffer:new Set(),Texture:new Set(),Framebuffer:new Set(),Renderbuffer:new Set()};
 const keep=(kind,value)=>{if(!value)throw Error('图形资源创建失败');resources[kind].add(value);return value;};
 const drop=(kind,value)=>{if(resources[kind].delete(value)&&!gl.isContextLost())gl['delete'+kind](value);};
 function destroy(){for(const [kind,items] of Object.entries(resources))for(const value of [...items])drop(kind,value);colorTarget=null;}
const attrNames=['a_position','a_normal','a_offset','a_scale','a_rotation','a_style','a_occlusion'];
function compile(type,source){const sh=keep('Shader',gl.createShader(type));gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;}
function program(v,f){const vs=compile(gl.VERTEX_SHADER,v),fs=compile(gl.FRAGMENT_SHADER,f),p=keep('Program',gl.createProgram());gl.attachShader(p,vs);gl.attachShader(p,fs);attrNames.forEach((n,i)=>gl.bindAttribLocation(p,i,n));gl.linkProgram(p);drop('Shader',vs);drop('Shader',fs);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));const uniforms={};for(const n of ['vp','view','lightMatrix','shadow','eye','metal','kind','time','image','resolution','focus','aperture'])uniforms[n]=gl.getUniformLocation(p,'u_'+n);return {p,uniforms};}
function buffer(data,type=gl.ARRAY_BUFFER){const b=keep('Buffer',gl.createBuffer());gl.bindBuffer(type,b);gl.bufferData(type,data,gl.STATIC_DRAW);return b;}
function target(width,height,unit){const texture=keep('Texture',gl.createTexture());gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);const fb=keep('Framebuffer',gl.createFramebuffer()),depth=keep('Renderbuffer',gl.createRenderbuffer());gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);gl.bindRenderbuffer(gl.RENDERBUFFER,depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,width,height);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('离屏画面不可用');return {texture,fb,depth,width,height};}
function removeTarget(t){if(!t)return;drop('Texture',t.texture);drop('Framebuffer',t.fb);drop('Renderbuffer',t.depth);}
function setup(){ext=gl.getExtension('ANGLE_instanced_arrays');programs={sky:program(postVertex,skySource),main:program(vertexSource,fragmentSource),shadow:program(vertexSource,shadowSource),post:program(postVertex,postSource)};gpu={};const g=meshes(ids);for(const [name,m] of Object.entries({...g,letters:undefined,...Object.fromEntries(ids.map(i=>['letter'+i,g.letters[i]]))})){if(!m)continue;gpu[name]={p:buffer(m.positions),n:buffer(m.normals),ao:m.occlusion?buffer(m.occlusion):null,index:m.indices?buffer(m.indices,gl.ELEMENT_ARRAY_BUFFER):null,count:m.indices?m.indices.length:m.positions.length/3};}instanceBuffer=buffer(new Float32Array(1));quadBuffer=buffer(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]));shadowTarget=target(1024,1024,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shadowTarget.texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);colorTarget=null;targetSize=[0,0];}
function matrices(p,state,shadow){gl.useProgram(p.p);gl.uniformMatrix4fv(p.uniforms.vp,false,new Float32Array(shadow?lightMatrix:state.vp));gl.uniformMatrix4fv(p.uniforms.view,false,new Float32Array(state.view));gl.uniformMatrix4fv(p.uniforms.lightMatrix,false,new Float32Array(lightMatrix));gl.uniform3fv(p.uniforms.eye,state.eye);gl.uniform1i(p.uniforms.shadow,0);gl.uniform1f(p.uniforms.time,state.time);gl.uniform2f(p.uniforms.resolution,canvas.width,canvas.height);}
function draw(draw,p){const m=gpu[draw.mesh];gl.bindBuffer(gl.ARRAY_BUFFER,m.p);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,m.n);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);if(m.ao){gl.bindBuffer(gl.ARRAY_BUFFER,m.ao);gl.enableVertexAttribArray(6);gl.vertexAttribPointer(6,1,gl.FLOAT,false,0,0);}else{gl.disableVertexAttribArray(6);gl.vertexAttrib1f(6,1);}if(m.index)gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.index);gl.uniform1f(p.uniforms.metal,draw.metal);gl.uniform1f(p.uniforms.kind,draw.kind);const count=draw.instances.length/14;
 if(ext){gl.bindBuffer(gl.ARRAY_BUFFER,instanceBuffer);gl.bufferData(gl.ARRAY_BUFFER,draw.instances,gl.DYNAMIC_DRAW);let offset=0;[3,3,4,4].forEach((size,j)=>{const at=j+2;gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,size,gl.FLOAT,false,56,offset);ext.vertexAttribDivisorANGLE(at,1);offset+=size*4;});if(m.index)ext.drawElementsInstancedANGLE(gl.TRIANGLES,m.count,gl.UNSIGNED_SHORT,0,count);else ext.drawArraysInstancedANGLE(gl.TRIANGLES,0,m.count,count);for(let a=2;a<6;a++){ext.vertexAttribDivisorANGLE(a,0);gl.disableVertexAttribArray(a);}}
 else{for(let a=2;a<6;a++)gl.disableVertexAttribArray(a);for(let i=0;i<count;i++){let at=i*14;gl.vertexAttrib3fv(2,draw.instances.subarray(at,at+3));gl.vertexAttrib3fv(3,draw.instances.subarray(at+3,at+6));gl.vertexAttrib4fv(4,draw.instances.subarray(at+6,at+10));gl.vertexAttrib4fv(5,draw.instances.subarray(at+10,at+14));if(m.index)gl.drawElements(gl.TRIANGLES,m.count,gl.UNSIGNED_SHORT,0);else gl.drawArrays(gl.TRIANGLES,0,m.count);}}
}
function render(t,channels){if(!colorTarget)return;const {state,draws}=frameDraws(t,channels);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.DITHER);gl.bindFramebuffer(gl.FRAMEBUFFER,shadowTarget.fb);gl.viewport(0,0,1024,1024);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);matrices(programs.shadow,state,true);for(const d of draws)if(d.castShadow!==false)draw(d,programs.shadow);
 gl.bindFramebuffer(gl.FRAMEBUFFER,colorTarget.fb);gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.95,.90,.76,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.DEPTH_TEST);gl.useProgram(programs.sky.p);gl.bindBuffer(gl.ARRAY_BUFFER,quadBuffer);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);for(let a=1;a<7;a++)gl.disableVertexAttribArray(a);gl.drawArrays(gl.TRIANGLES,0,3);gl.enable(gl.DEPTH_TEST);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shadowTarget.texture);matrices(programs.main,state,false);for(const d of draws)draw(d,programs.main);
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.DEPTH_TEST);gl.useProgram(programs.post.p);const u=programs.post.uniforms;gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,colorTarget.texture);gl.uniform1i(u.image,1);gl.uniform2f(u.resolution,canvas.width,canvas.height);gl.uniform1f(u.focus,state.focus);gl.uniform1f(u.aperture,state.aperture);gl.bindBuffer(gl.ARRAY_BUFFER,quadBuffer);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);for(let a=1;a<7;a++)gl.disableVertexAttribArray(a);gl.drawArrays(gl.TRIANGLES,0,3);

}

 try{setup();colorTarget=target(canvas.width,canvas.height,1);}catch(error){destroy();throw error;}
 return {render,destroy};
}
api.createPainter=createPainter;
})(local);
const core=local.WiseMotion3D;
const parts=[
 {id:'soft-type-land',key:'wise',start:0,end:1.55,glyphs:[0,1,2,3]},
 {id:'capsule-impact-scatter',key:'impact',start:1.35,end:3.9,glyphs:[]},
 {id:'type-burst-settle',key:'motion',start:1.8,end:3.8,glyphs:[1,4,5,6,7]}
];
function make(root,K,definition,part){
 const doc=root.ownerDocument,win=doc.defaultView,canvas=doc.createElement('canvas');
 canvas.width=definition.poster_only?640:1600;canvas.height=definition.poster_only?360:900;
 Object.assign(canvas.style,{position:'absolute',inset:'0',width:'640px',height:'360px'});
 canvas.setAttribute('role','img');canvas.setAttribute('aria-label',definition.name);
 root.dataset.art='original';root.style.background='#f3e4b6';root.replaceChildren(canvas);
 const markers=new Map();
 if(!part)for(const key of ['field','wise','impact','motion']){const node=doc.createElement('span');node.hidden=true;node.dataset.layer=key;root.append(node);markers.set(key,node);}
 const glyphs=part?.glyphs||[0,1,2,3,4,5,6,7];
 let dead=false,prepared=false,lost=false,painter=null,previous=0,gl=null,notice;
 function message(text){if(!notice){notice=doc.createElement('span');notice.setAttribute('role','status');Object.assign(notice.style,{position:'absolute',inset:'0',display:'grid',placeItems:'center',padding:'40px',color:'#38203e',fontSize:'16px'});root.append(notice);}notice.textContent=text;}
 function channels(){return part?{wise:part.key==='wise',impact:part.key==='impact',motion:part.key==='motion',field:true}:Object.fromEntries([...markers].map(([key,node])=>[key,!node.hasAttribute('data-composition-hidden')]));}
 function render(ms){
  if(dead)return;if(!Number.isFinite(ms))throw new TypeError('时间必须是有限数字');
  previous=Math.max(0,Math.min(definition.duration_ms,ms));
  const seconds=part?part.start+previous/1000:previous/1000;
  canvas.dataset.sourceTime=String(seconds);canvas.dataset.part=part?.key||'composition';
  if(prepared&&!lost&&painter)painter.render(seconds,channels());
 }
 function initialize(){
  if(dead||lost)return;
  gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'high-performance'});
  if(!gl){message('当前环境无法显示立体画面，请启用浏览器图形加速。');return;}
  painter=core.createPainter(canvas,gl,glyphs);notice?.remove();notice=null;render(previous);
 }
 const onLost=event=>{event.preventDefault();lost=true;painter?.destroy();painter=null;message('图形资源暂时中断，恢复后显示当前进度。');};
 const onRestored=()=>{if(dead)return;lost=false;if(prepared)try{initialize();}catch(error){message('立体画面恢复失败，请重新选择该效果。');}};
 canvas.addEventListener('webglcontextlost',onLost);canvas.addEventListener('webglcontextrestored',onRestored);
 const observer=!part&&win?.MutationObserver?new win.MutationObserver(()=>render(previous)):null;
 observer?.observe(root,{subtree:true,attributes:true,attributeFilter:['data-composition-hidden']});
 render.ready=Promise.resolve().then(async()=>{
  if(dead)return;
  gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'high-performance'});
  if(gl)await core.prepare(glyphs,()=>dead);
  if(dead)return;prepared=true;initialize();render(previous);
 });
 render.frameRate=30;
 render.destroy=(preserve=false)=>{
  if(dead)return;
  if(preserve&&painter&&!lost){
   render(previous);const still=doc.createElement('canvas');still.width=canvas.width;still.height=canvas.height;still.style.cssText=canvas.style.cssText;
   still.setAttribute('role','img');still.setAttribute('aria-label',definition.name);Object.assign(still.dataset,canvas.dataset);
   const ctx=still.getContext('2d');if(ctx){ctx.drawImage(canvas,0,0);canvas.replaceWith(still);}
  }
  dead=true;observer?.disconnect();canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);
  painter?.destroy();painter=null;gl?.getExtension('WEBGL_lose_context')?.loseContext();gl=null;
  markers.forEach(node=>node.remove());markers.clear();
  if(!preserve){canvas.width=canvas.height=1;root.replaceChildren();}
 };
 render(0);return render;
}
const factories=global.MotionFactories=global.MotionFactories||{};
for(const part of parts){factories[part.id]=(root,K,definition)=>make(root,K,definition,part);factories[part.id].requiresPreparation=true;}
factories['capsule-type-sequence']=(root,K,definition)=>make(root,K,definition);
factories['capsule-type-sequence'].requiresPreparation=true;
factories['capsule-type-sequence'].breakdown=[
 {id:'field',name:'胶囊地面与共享灯光',actions:[],start:0,end:5000,time:'全段',detail:'5760根胶囊、始终奶黄的地面；受压、波纹、飞散和归位跟随当前显示的字母与碰撞。'},
 {id:'wise',name:'字母错峰落定',actions:['soft-type-land'],start:0,end:1550,time:'0–1.55秒',detail:'四个饱满字母错峰落地，压缩、回弹与倾转逐渐衰减，接触处压陷并向外传出波纹。'},
 {id:'impact',name:'碰撞掀起胶囊',actions:['capsule-impact-scatter'],start:1420,end:3900,time:'1.42–3.90秒',detail:'银球1.88秒撞到前方地面，掀起彩色胶囊并触发提亮波；同一批胶囊翻转落回原位。'},
 {id:'motion',name:'字母炸出归位',actions:['type-burst-settle'],start:1915,end:3800,time:'1.92–3.80秒',detail:'六个实体字母从右向左接续炸起，向外翻转、回弹并排成前方第二行。'}
];
// Read-only inspection hooks also let downstream compositions reuse this model.
global.WiseCapsuleType={model:core.model,sceneAt:core.sceneAt,frameDraws:core.frameDraws,fringeAt:core.fringeAt,fringeBounds:core.fringeBounds,meshes:core.meshes,sources:core.sources};
})(globalThis);
