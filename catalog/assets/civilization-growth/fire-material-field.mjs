import {CALLIGRAPHY,contains,drawCalligraphy} from './calligraphy.mjs';
import {clamp,mix,smooth,TAU} from './math.mjs';
export {contains};

// 参数及字符绘制来自 material-evolution.js；目的地由横笔替换为火字轮廓。
export const random=i=>{const n=Math.sin(i*127.1+31.73)*43758.5453;return n-Math.floor(n);};
export const map=(t,keys)=>{for(let i=1;i<keys.length;i++)if(t<=keys[i][0])return mix(keys[i-1][1],keys[i][1],clamp((t-keys[i-1][0])/(keys[i][0]-keys[i-1][0])));return keys.at(-1)[1];};
export const layoutPoints=glyph=>CALLIGRAPHY[glyph].points;
export const sourcePoints=layoutPoints('火');
export const doublePoints=layoutPoints('炎');
export function characterGrid(layout){
 const columns=[];
 for(let x=172;x<=468;x+=3.25){const cells=[];for(let y=24;y<=332;y+=5.45)if(contains(layout,x,y))cells.push([x,y]);if(cells.length)columns.push(cells);}
 return columns;
}
const sourceColumns=characterGrid('火'),targetColumns=characterGrid('炎');
export const CHARACTERS=[];
sourceColumns.forEach((column,k)=>{
 const destination=targetColumns[Math.round(k/(sourceColumns.length-1)*(targetColumns.length-1))];
 const limit=Math.min(column.length,destination.length),survivors=new Set(Array.from({length:limit},(_,j)=>Math.round(j*(column.length-1)/Math.max(1,limit-1))));
 column.forEach((origin,j)=>{const index=CHARACTERS.length,target=destination[Math.round(j/Math.max(1,column.length-1)*(destination.length-1))];CHARACTERS.push({origin,target,keep:survivors.has(j),index,h:5.4+random(index+613)*1.1,tail:origin[0]>350&&origin[1]>248});});
});
export const PARTICLES=Array.from({length:17400},(_,i)=>{
 const u=random(i+19),v=random(i+178),w=random(i+811),lead=i<CHARACTERS.length;
 const original=sourcePoints[(i*61+Math.floor(w*37))%sourcePoints.length],target=doublePoints[Math.floor(u*doublePoints.length)];
 return {index:i,u,v,w,g:i%10,bucket:i%3,lead,origin:lead?CHARACTERS[i].origin:[original.x,original.y],start:lead?CHARACTERS[i].target:[target.x,target.y],r:i%10<3?.92+random(i+1499)*.46:.62+random(i+1499)*.70,retention:random(i+90003)};
});
export const BUCKETS=Array.from({length:6},(_,k)=>PARTICLES.filter(p=>p.bucket===k%3&&Number(p.g===3||p.g===4)===Math.floor(k/3)));
export function collapseState(t){return {ink:1-smooth(t,0,.36),characters:smooth(t,0,.20)*(1-smooth(t,1.02,1.24)),collapse:smooth(t,.52,.84),tail:smooth(t,.66,.93),dots:smooth(t,.93,1.04),filler:smooth(t,.93,1.15),charOut:smooth(t,1.02,1.24)};}
export function characterPoint(t,p){const s=collapseState(t),q=p.tail?s.tail:s.collapse;return [mix(p.origin[0],p.target[0],q),mix(p.origin[1],p.target[1],q),s.characters*(p.keep?1:1-q),mix(p.h,PARTICLES[p.index].r*2,s.charOut)];}
export function drawCharacter(ctx,index,x,y,h){
 if(index%3===0){ctx.fillRect(x-.27,y-h/2,.54,h);ctx.fillRect(x-.8,y-h/2,.8,.37);ctx.fillRect(x-.8,y+h/2-.4,.8,.37);}
 else{ctx.strokeRect(x-.65,y-h/2,1.3,h);if(index%5===0)ctx.fillRect(x-.5,y,.8,.3);}
}
export function drawCollapsingCharacters(ctx,t,travel=null){
 ctx.save();ctx.fillStyle=ctx.strokeStyle='#171814';ctx.lineWidth=.68;
 for(const p of CHARACTERS){let [x,y,a,h]=characterPoint(t,p);if(a<.002)continue;if(travel){const target=travel.target(p.index),q=travel.progress;x=mix(x,target[0],q);y=mix(y,target[1],q);}ctx.globalAlpha=a;drawCharacter(ctx,p.index,x,y,h);}
 ctx.restore();
}
export function drawInitialDots(ctx,t){
 const s=collapseState(t);if(s.dots<=0)return;
 for(let k=0;k<6;k++){ctx.save();ctx.fillStyle='#141511';ctx.globalAlpha=[.94,.73,.46][k%3]*s.dots;ctx.beginPath();
  for(const p of BUCKETS[k]){const visibility=clamp((1-p.retention)/.08);if(visibility<=0||(p.g<3&&p.index%2===1))continue;const r=p.r*.50*Math.sqrt(visibility*(p.lead?1:s.filler));if(r<.04)continue;const [x,y]=p.start;ctx.moveTo(x+r,y);ctx.ellipse(x,y,r,r*2.1,0,0,TAU);}ctx.fill();ctx.restore();
 }
}
export function drawDoubleBody(ctx,t){drawCalligraphy(ctx,'炎',{opacity:smooth(t,.70,.91)*(1-smooth(t,1.03,1.22))*.86});}
export function drawDouble(ctx,assets,t){const s=collapseState(t);if(s.ink>0)drawCalligraphy(ctx,'火',{opacity:s.ink});drawDoubleBody(ctx,t);drawCollapsingCharacters(ctx,t);drawInitialDots(ctx,t);}
