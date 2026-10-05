import {smooth,mix,rand,TAU} from './math.mjs';
import {drawCalligraphy,CALLIGRAPHY,INK} from './calligraphy.mjs';
import {CURSIVE} from './cursive-data.mjs';
const sorted=ps=>[...ps].sort((a,b)=>Math.atan2(a.y-180,a.x-320)-Math.atan2(b.y-180,b.x-320)||Math.hypot(a.x-320,a.y-180)-Math.hypot(b.x-320,b.y-180));
const grass=sorted(CURSIVE.points),regular=sorted(CALLIGRAPHY['火'].points);
export const IGNITION_INK=Array.from({length:6800},(_,i)=>({from:grass[Math.floor(i/6800*grass.length)],to:regular[Math.floor(i/6800*regular.length)],bend:(rand(i+317)-.5)*23,r:.47+rand(i+411)*.38}));
export function ignitionState(t){return {reveal:smooth(t,.05,.96),scale:mix(1.10,1,smooth(t,.18,2.10)),grass:1-smooth(t,1.22,1.50),travel:smooth(t,1.28,1.97),dots:smooth(t,1.20,1.40)*(1-smooth(t,1.91,2.12)),regular:smooth(t,1.84,2.12)};}
export function ignitionPoint(t,i){const s=ignitionState(t),p=IGNITION_INK[i],arc=Math.sin(s.travel*Math.PI);return [mix(p.from.x,p.to.x,s.travel)+p.bend*arc,mix(p.from.y,p.to.y,s.travel)-13*arc,p.r];}
function cursivePath(ctx){ctx.beginPath();for(const path of CURSIVE.paths)for(const [op,...a] of path){if(op==='M')ctx.moveTo(...a);else if(op==='L')ctx.lineTo(...a);else if(op==='Q')ctx.quadraticCurveTo(...a);else if(op==='C')ctx.bezierCurveTo(...a);else ctx.closePath();}}
function drawCursive(ctx,s){
 if(s.grass<=0||s.reveal<=0)return;
 ctx.save();ctx.globalAlpha=s.grass;ctx.fillStyle=INK;
 if(s.reveal<1){const edge=37+300*s.reveal;ctx.beginPath();ctx.moveTo(165,32);ctx.lineTo(482,32);ctx.lineTo(482,edge-24);ctx.bezierCurveTo(391,edge+13,270,edge-14,165,edge+27);ctx.closePath();ctx.clip();}
 cursivePath(ctx);ctx.fill('evenodd');ctx.clip('evenodd');ctx.fillStyle='#e8e7df';ctx.globalAlpha=s.grass*.16;ctx.beginPath();
 for(let i=0;i<CURSIVE.points.length;i+=11){const p=CURSIVE.points[i];ctx.rect(p.x,p.y,.10+rand(i+713)*.22,1+rand(i+51)*2.8);}ctx.fill();ctx.restore();
}
export function drawIgnition(ctx,assets,t){
 const s=ignitionState(t);
 if(t>=2.12){drawCalligraphy(ctx,'火');return;}
 ctx.save();ctx.translate(320,180);ctx.scale(s.scale,s.scale);ctx.translate(-320,-180);drawCursive(ctx,s);
 if(s.dots>0){ctx.save();ctx.globalAlpha=s.dots*.86;ctx.fillStyle=INK;ctx.beginPath();for(let i=0;i<IGNITION_INK.length;i++){const [x,y,r]=ignitionPoint(t,i);ctx.moveTo(x+r,y);ctx.ellipse(x,y,r,r*1.22,0,0,TAU);}ctx.fill();ctx.restore();}
 drawCalligraphy(ctx,'火',{opacity:s.regular});ctx.restore();
}
