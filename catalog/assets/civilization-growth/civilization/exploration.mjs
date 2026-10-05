import {warpPatch,line} from './ink-parts.mjs';
export const PLUME_BOX=[1588,262,77,190],NOZZLE=[1626,265];
export function plumeShift(t,u,v){const edge=Math.sin(Math.PI*u)*Math.sin(Math.PI*v),bend=Math.sin(t*9-v*12);return [bend*(3+v*9)*edge,Math.sin(t*12-v*10)*7.5*edge*v];}
export function plumePoint(t,k,q){const wave=Math.sin(t*9.1-q*14+k)*q;return [NOZZLE[0]+(k-2)*2.7*q+wave*(1.5+q*7),NOZZLE[1]+q*(105+Math.sin(t*13+k)*9)];}
export function drawExploration(ctx,image,t){
 warpPatch(ctx,image,PLUME_BOX,(u,v)=>plumeShift(t,u,v),8,18);
 ctx.save();ctx.globalAlpha=.48;for(let k=0;k<5;k++){const points=Array.from({length:24},(_,i)=>plumePoint(t,k,i/23));line(ctx,points,k%2?.8:1.1,k%2?'#7d8073':'#ededE4');}ctx.restore();
}
