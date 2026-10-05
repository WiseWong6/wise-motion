import {rotateDisk,diskPoint,line} from './ink-parts.mjs';
export const WATER_WHEEL={x:945,y:166,rx:70,ry:89,tilt:.16};
export const GEARS=[{x:845,y:414,rx:10.5,ry:10.5,teeth:14},{x:874,y:405,rx:15.2,ry:15.2,teeth:20},{x:911,y:394,rx:20,ry:20,teeth:26},{x:951,y:374,rx:17.5,ry:17.5,teeth:23},{x:1008,y:380,rx:32.5,ry:32.5,teeth:42},{x:1057,y:344,rx:22.3,ry:22.3,teeth:29}];
export const MACHINE_DISKS=[{x:435,y:742,rx:46,ry:47},{x:552,y:740,rx:42,ry:43},{x:712,y:733,rx:67,ry:88}];
export function wheelPhase(t){return t*.93;}
export function gearPhase(t,i){return t*1.65*(i%2?-1:1)*26/GEARS[i].teeth;}
export function waterDrop(t,i){return [1032+Math.sin(i*3.4)*9,81+((t*65+i*15)%148)];}
export function drawWheels(ctx,image,t){
 rotateDisk(ctx,image,WATER_WHEEL,wheelPhase(t));
 GEARS.forEach((d,i)=>rotateDisk(ctx,image,d,gearPhase(t,i)));
 MACHINE_DISKS.forEach((d,i)=>rotateDisk(ctx,image,d,t*(i===1?-1.4:1.4)));
 // 轴承与传动轴留在轮盘前面，防止裁出的轮片带着连接杆转动。
 ctx.drawImage(image,361,731,418,19,361,731,418,19);
 ctx.drawImage(image,927,153,35,24,927,153,35,24);
 ctx.save();ctx.beginPath();ctx.moveTo(1018,79);ctx.lineTo(1049,63);ctx.lineTo(1057,154);ctx.lineTo(1044,231);ctx.lineTo(1012,233);ctx.closePath();ctx.clip();ctx.globalAlpha=.55;
 for(let i=0;i<16;i++){const [x,y]=waterDrop(t,i);line(ctx,[[x,y],[x-1.5,y+9],[x+1,y+16]],1.4,'#eeeeE7');}ctx.restore();
}
