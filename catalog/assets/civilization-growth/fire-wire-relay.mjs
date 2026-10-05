import {CALLIGRAPHY,contains} from './calligraphy.mjs';
import {PARTICLES,random} from './fire-material-field.mjs';
import {drawRelayCharacters,drawRelayDots} from './fire-particle-relay.mjs';
import {mix,smooth} from './math.mjs';
// 乱线先从炎的点场出发；每根线的终点均在燚本身的颜体轮廓内。
const ink=CALLIGRAPHY['燚'].points;
export const QUAD_TARGETS=PARTICLES.map(p=>{const q=ink[Math.floor(p.v*ink.length)];return [q.x,q.y];});
export const WIRE_VERTICES=Array.from({length:1600},(_,i)=>{const p=ink[Math.floor(random(i+851)*ink.length)];return {unit:p.unit,gate:p.unit%3,band:[p.x,p.y],source:PARTICLES[(i*37)%PARTICLES.length].start};});
export const WIRE_EDGES=[];
for(let i=0;i<WIRE_VERTICES.length;i++){
 const a=WIRE_VERTICES[i];
 const near=WIRE_VERTICES.map((b,j)=>({j,d:(a.band[0]-b.band[0])**2+(a.band[1]-b.band[1])**2})).filter(p=>p.j!==i&&p.d>3&&p.d<900).sort((a,b)=>a.d-b.d).slice(0,4);
 for(const {j} of near){if(j<i)continue;const b=WIRE_VERTICES[j];if([.2,.4,.6,.8].every(t=>contains('燚',mix(a.band[0],b.band[0],t),mix(a.band[1],b.band[1],t))))WIRE_EDGES.push([i,j]);}
}
export function wireState(t){const ms=t*1000;return {band:smooth(ms,680,1080),reveal:smooth(ms,612,841.5),nodes:smooth(ms,800,1050),gates:[0,1,2].map(c=>smooth(ms,[883,950,950][c],[1117,1050,1283][c])*.72)};}
export function wirePoint(t,i,s=wireState(t)){const v=WIRE_VERTICES[i];return [mix(v.source[0],v.band[0],s.band),mix(v.source[1],v.band[1],s.band)];}
export function drawFireWire(ctx,t,{opacity=1,positions=null}={}){
 const s=wireState(t);if(opacity<=0)return;const points=positions||WIRE_VERTICES.map((_,i)=>wirePoint(t,i,s));ctx.save();ctx.strokeStyle=ctx.fillStyle='#171717';ctx.lineWidth=.48;
 for(let i=0;i<WIRE_EDGES.length;i++){const [a,b]=WIRE_EDGES[i];ctx.globalAlpha=s.gates[WIRE_VERTICES[a].gate]*s.reveal*opacity;if(ctx.globalAlpha<=0)continue;ctx.beginPath();ctx.moveTo(...points[a]);ctx.lineTo(...points[b]);ctx.stroke();}
 for(let i=0;i<points.length;i++){ctx.globalAlpha=s.nodes*s.gates[WIRE_VERTICES[i].gate]*opacity;if(ctx.globalAlpha<=0)continue;ctx.fillRect(points[i][0]-.55,points[i][1]-.55,1.1,1.1);}ctx.restore();
}
export const QUAD_START=.883;
export function drawQuad(ctx,assets,t){const shared=t+QUAD_START;drawRelayCharacters(ctx,shared);drawRelayDots(ctx,shared,QUAD_TARGETS);drawFireWire(ctx,shared);}
