import {WIRE_VERTICES,drawQuad,drawFireWire,QUAD_START} from './fire-wire-relay.mjs';
import {SEEDS,SEED_DURATION,ROOTS,seedPose,drawOneSeed,drawSeeds} from './fire-05.mjs';
import {mix,smooth,rand,TAU} from './math.mjs';
export const QUAD_END=.767,ROW_READY=.78,MORPH_START=.98;
export const FIRE_CENTERS=Array.from({length:4},(_,c)=>{
 const points=WIRE_VERTICES.filter(v=>v.unit===c).map(v=>v.band),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 return [(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2];
});
export function rowPose(t,c){const p=FIRE_CENTERS[c],q=smooth(t,.035+c*.015,.72+c*.015);return {x:mix(p[0],ROOTS[c],q),y:mix(p[1],185,q)-Math.sin(Math.PI*q)*(12+c*3),scale:mix(1,.62,q),progress:q};}
export function rowPoint(t,i){const v=WIRE_VERTICES[i],p=rowPose(t,v.unit),center=FIRE_CENTERS[v.unit];return [p.x+(v.band[0]-center[0])*p.scale,p.y+(v.band[1]-center[1])*p.scale];}
export function rowSeedPose(t,c){const p=SEEDS[c],end=seedPose(SEED_DURATION,c),q=smooth(t,1.57,2.32);return {variant:c,x:ROOTS[c],y:mix(185,end.y,q),w:mix(p.w,end.w,q),h:mix(p.h,end.h,q),angle:mix(p.angle,end.angle,q)};}
export const SEED_VERTICES=WIRE_VERTICES.map((v,i)=>({c:v.unit,u:rand(i+188)*1.96-.98,angle:rand(i+194)*TAU}));
export function seedWirePoint(t,i){
 const v=SEED_VERTICES[i],p=rowSeedPose(t,v.c),from=rowPoint(t,i),width=Math.max(0,1-v.u*v.u)**.70*p.w*(.90+.10*v.u),x=Math.cos(v.angle)*width,y=v.u*p.h,z=Math.sin(v.angle),q=smooth(t,MORPH_START+v.c*.015,1.36+v.c*.015);
 return [mix(from[0],p.x+x*Math.cos(p.angle)-y*Math.sin(p.angle),q),mix(from[1],p.y+x*Math.sin(p.angle)+y*Math.cos(p.angle),q),z];
}
export function rowFlash(t){return [[.84,.895],[.98,1.035],[1.12,1.17]].some(([a,b])=>t>=a&&t<b)?.20:1;}
export function materialState(t){return {glyph:0,wire:1-smooth(t,1.18,1.43),seeds:smooth(t,1.27,1.45),flash:rowFlash(t)};}
export function drawMaterialsAndAsh(ctx,assets,t){
 if(t<=0){drawQuad(ctx,assets,QUAD_END);return;}
 if(t>=2.32){drawSeeds(ctx,SEED_DURATION,1,assets);return;}
 const s=materialState(t),positions=WIRE_VERTICES.map((_,i)=>seedWirePoint(t,i));
 drawFireWire(ctx,QUAD_START+QUAD_END,{opacity:s.wire*s.flash,positions});
 for(let c=0;c<4;c++)drawOneSeed(ctx,rowSeedPose(t,c),{opacity:s.seeds*s.flash,assets});
}
export const drawMaterialBridge=drawMaterialsAndAsh;
