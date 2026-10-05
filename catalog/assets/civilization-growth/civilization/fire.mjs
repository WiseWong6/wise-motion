import {warpPatch,line,polygon,INK} from './ink-parts.mjs';
export const FIRE_PATCHES={hands:[77,82,179,155],smoke:[205,47,81,345],shaft:[181,285,24,102]};
export function handShift(t,u,v){const envelope=Math.sin(Math.PI*u)*Math.sin(Math.PI*v);return [Math.sin(t*19)*2.6*envelope,Math.sin(t*6.2)*2.0*envelope];}
export function smokeShift(t,u,v){const e=Math.sin(Math.PI*u)*Math.sin(Math.PI*v);return [Math.sin(t*5.4-v*10)*8*(1-v)*e,Math.cos(t*4.1-v*8)*3.2*e];}
export function flameTip(t){return [218+Math.sin(t*14)*3.7,390-(21+Math.sin(t*17)*5.2)];}
export function drawFire(ctx,image,t){
 warpPatch(ctx,image,FIRE_PATCHES.hands,(u,v)=>handShift(t,u,v),8,10);
 warpPatch(ctx,image,FIRE_PATCHES.smoke,(u,v)=>smokeShift(t,u,v),6,20);
 ctx.save();ctx.beginPath();ctx.rect(...FIRE_PATCHES.shaft);ctx.clip();
 for(let i=0;i<7;i++){const a=t*15+i*Math.PI/3.5,x=193+Math.sin(a)*8;ctx.globalAlpha=.15+Math.max(0,Math.cos(a))*.34;line(ctx,[[x,286],[x+Math.sin(a)*1.6,383]],.75,INK);}ctx.restore();
 const [x,y]=flameTip(t);ctx.save();ctx.globalAlpha=.84;ctx.beginPath();ctx.moveTo(212,391);ctx.bezierCurveTo(207,379,x+7,y+11,x,y);ctx.bezierCurveTo(x-6,y+13,228,379,224,391);ctx.closePath();ctx.fillStyle='#626359';ctx.fill();line(ctx,[[218,389],[219,y+12],[x,y+4]],.6,'#d9d9d2');ctx.restore();
}
