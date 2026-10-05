import {warpPatch,line,polygon,ellipse} from './ink-parts.mjs';
export const WARP_BOX=[560,71,192,103],CLOTH_BOX=[625,176,299,215];
const clothOutline=[[631,178],[750,183],[920,332],[833,388],[694,299]];
function clothWeight(x,y){
 let inside=false,min=1e6;
 for(let i=0,j=clothOutline.length-1;i<clothOutline.length;j=i++){
  const [ax,ay]=clothOutline[j],[bx,by]=clothOutline[i];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
  const dx=bx-ax,dy=by-ay,q=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));min=Math.min(min,Math.hypot(x-ax-q*dx,y-ay-q*dy));
 }return inside?Math.min(1,min/17):0;
}
export function shuttleState(t){return {x:652+78*Math.sin(t*5.4),y:143+2*Math.sin(t*10.8),angle:.035*Math.sin(t*5.4),opening:Math.sin(t*5.4)};}
export function warpShift(t,u,v){const e=Math.sin(Math.PI*u)*Math.sin(Math.PI*v),s=shuttleState(t);return [Math.sin(u*32+t*5.4)*.55*e,s.opening*4.4*e];}
export function clothShift(t,u,v){const x=CLOTH_BOX[0]+u*CLOTH_BOX[2],y=CLOTH_BOX[1]+v*CLOTH_BOX[3],e=clothWeight(x,y);return [Math.sin(t*3.9-v*8)*1.8*e,Math.sin(t*5.4-v*9)*3.1*e];}
export function drawLoom(ctx,image,t){
 warpPatch(ctx,image,WARP_BOX,(u,v)=>warpShift(t,u,v),12,8);
 warpPatch(ctx,image,CLOTH_BOX,(u,v)=>clothShift(t,u,v),14,14);
 const p=shuttleState(t);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
 polygon(ctx,[[-18,0],[-10,-4.3],[11,-4.3],[19,0],[11,4.3],[-10,4.3]],'#5e6056','#30322b',1);
 ellipse(ctx,0,0,7.5,1.9,'#d6d5ca','#30322b',.75);line(ctx,[[-12,2.2],[12,2.2]],.5,'#d1d1c4');ctx.restore();
 ctx.save();ctx.globalAlpha=.73;line(ctx,[[563,147],[p.x-19,p.y],[p.x+18,p.y],[750,146]],.55,'#f0efe5');ctx.restore();
}
