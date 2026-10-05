import {CALLIGRAPHY} from './calligraphy.mjs';
import {PARTICLES,BUCKETS,map,drawCollapsingCharacters,drawDoubleBody} from './fire-material-field.mjs';
import {smooth,mix,clamp,TAU} from './math.mjs';
// 仍用原片的点群退散与分组曲线，焱的全部目的地来自它自己的颜体轮廓。
const pools=[0,1,2].map(unit=>CALLIGRAPHY['焱'].points.filter(p=>p.unit===unit));
export const TRIPLE_CENTERS=pools.map(ps=>({x:ps.reduce((a,p)=>a+p.x,0)/ps.length,y:ps.reduce((a,p)=>a+p.y,0)/ps.length}));
export const TRIPLE_TARGETS=PARTICLES.map(p=>{const unit=p.g<3?p.index%3:p.g<5?0:1+p.index%2,ink=pools[unit][Math.floor(p.u*pools[unit].length)];return {...ink,unit};});
export function relayState(t){
 const ms=t*1000;
 return {travel:smooth(ms,0,450),reform:smooth(ms,1040,1390),spread:smooth(ms,450,790),dots:smooth(t+1.05,.93,1.04),filler:smooth(t+1.05,.93,1.15),
  fade:map(ms,[[0,1],[160,1],[450,.85],[683,.60],[840,.40],[1330,0]]),
  cloud:map(ms,[[0,1],[450,1],[683,.42],[950,.025],[1200,0]]),
  body:map(ms,[[0,1],[450,1],[683,.51],[950,.12],[1250,.012],[1333,0]]),
  head:map(ms,[[0,1],[450,1],[683,.83],[950,.12],[1250,.012],[1333,0]]),
  radius:map(ms,[[0,.50],[160,.72],[450,.90],[1000,.75]])*map(ms,[[0,1],[160,1],[450,.86],[683,.78],[1000,.78]]),
  headRadius:map(ms,[[0,.50],[160,.72],[450,.90],[1000,.75]])*map(ms,[[0,1],[160,1],[450,.92],[683,.88],[1000,.88]]),
  headFade:map(ms,[[0,1],[160,1],[450,.88],[683,.80],[840,.60],[1330,0]])};
}
export function relayPoint(t,i,end=null,state=relayState(t)){
 const p=PARTICLES[i],target=TRIPLE_TARGETS[i],pose=TRIPLE_CENTERS[target.unit],head=p.g===3||p.g===4,retain=p.g<3?state.cloud:head?state.head:state.body;
 const visibility=clamp((retain-p.retention)/.08);let x=target.x,y=target.y;
 if(p.g>=3){x=pose.x+(x-pose.x)*(1+state.spread*(head?.35:.08));y=pose.y+(y-pose.y)*(1+state.spread*(head?.5:.14))-(head?8*state.spread:0);}
 x=mix(p.start[0],x,state.travel);y=mix(p.start[1],y,state.travel);
 if(end){x=mix(x,end[0],state.reform);y=mix(y,end[1],state.reform);}
 const r=p.r*(head?state.headRadius:state.radius)*Math.sqrt(visibility*(p.lead?1:state.filler));
 return [x,y,r,r*(1+1.1*(1-state.travel)),visibility];
}
export function drawRelayDots(ctx,t,endPoints=null){
 const state=relayState(t);if(state.fade<=0)return;
 for(let k=0;k<6;k++){ctx.save();ctx.fillStyle='#141511';ctx.globalAlpha=[.94,.73,.46][k%3]*state.dots*(k>=3?state.headFade:state.fade);ctx.beginPath();
  for(const p of BUCKETS[k]){if(p.g<3&&p.index%2===1)continue;const [x,y,r,ry,v]=relayPoint(t,p.index,endPoints?.[p.index],state);if(v<=0||r<.04)continue;ctx.moveTo(x+r,y);ctx.ellipse(x,y,r,ry,0,0,TAU);}ctx.fill();ctx.restore();
 }
}
export function drawRelayCharacters(ctx,t){drawDoubleBody(ctx,t+1.05);if(t<.26)drawCollapsingCharacters(ctx,t+1.05,{progress:smooth(t,0,.45),target:i=>[TRIPLE_TARGETS[i].x,TRIPLE_TARGETS[i].y]});}
export function drawTriple(ctx,assets,t){drawRelayCharacters(ctx,t);drawRelayDots(ctx,t);}
