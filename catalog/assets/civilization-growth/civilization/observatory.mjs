import {rotateDisk,line,ellipse} from './ink-parts.mjs';
export const GIMBAL={x:1304,y:121,rx:64,ry:64};
export function gimbalPoint(t,a,ring=0){const r=ring?56:62,yaw=t*.71+ring*1.2,tilt=ring?.92:.43,x=Math.cos(a)*r,y=Math.sin(a)*r;return [GIMBAL.x+x*Math.cos(yaw)-y*Math.sin(yaw)*Math.sin(tilt),GIMBAL.y+y*Math.cos(tilt)*.84];}
export function drawObservatory(ctx,image,t){
 rotateDisk(ctx,image,GIMBAL,.20*Math.sin(t*1.6));
 ctx.save();ctx.beginPath();ctx.ellipse(GIMBAL.x,GIMBAL.y,66,66,0,0,Math.PI*2);ctx.clip();
 for(let ring=0;ring<2;ring++){
  const points=Array.from({length:121},(_,i)=>gimbalPoint(t,i/120*Math.PI*2,ring));line(ctx,points,2.3,'#d4d5c8');line(ctx,points,.8,'#373b31');
  for(let i=0;i<36;i++){const a=i/36*Math.PI*2,p=gimbalPoint(t,a,ring);line(ctx,[p,[p[0]+(GIMBAL.x-p[0])*.035,p[1]+(GIMBAL.y-p[1])*.035]],.6,'#4d5145');}
 }
 const p=gimbalPoint(t,t*1.3,1);ellipse(ctx,p[0],p[1],2.7,2.7,'#555b4c','#30352b',.7);
 // 原球心和中心轴留在前层，内环围绕同一个中心运动。
 ctx.beginPath();ctx.ellipse(GIMBAL.x,GIMBAL.y,19,21,0,0,Math.PI*2);ctx.clip();ctx.drawImage(image,0,0);ctx.restore();
}
