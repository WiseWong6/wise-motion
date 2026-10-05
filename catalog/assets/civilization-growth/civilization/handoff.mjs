import {drawFlowers,drawFlowerHead,FLOWER_DURATION} from '../four-flowers.mjs';
import {stemPoint,drawShoot,sproutState,SPROUT_DURATION} from '../four-sprouts.mjs';
import {drawOneSeed,seedPose,SEED_DURATION} from '../fire-05.mjs';
import {smooth,mix} from '../math.mjs';
import {PLATE,paperRepair} from './ink-parts.mjs';
export const FLOWER_TARGETS=[[329,70],[424,70],[329,167],[424,167]].map(([x,y])=>[PLATE.x+x*PLATE.scale,y*PLATE.scale]);
// 仅接管四格的内部纸面，原图格线和周围器物保持。
export const FLOWER_PAPER=[[289,16,89,108],[382,16,89,108],[289,129,89,98],[382,129,89,98]];
export function clearPrintedFlowers(ctx){for(const box of FLOWER_PAPER)paperRepair(ctx,c=>c.rect(...box),box);}
export function flowerExitFlash(t){return [[.10,.16],[.27,.33]].some(([a,b])=>t>=a&&t<b)?.20:1;}
export function handoffPose(t,c){
 const from=stemPoint(c,1,{elongation:1,clock:11.7+t}),to=FLOWER_TARGETS[c],p=smooth(t,.34+c*.02,1+c*.02);
 return {x:mix(from[0],to[0],p),y:mix(from[1],to[1],p)-Math.sin(Math.PI*p)*(15+c*2),scale:mix(1,.44,p),opacity:flowerExitFlash(t),bodyOpacity:1-smooth(t,.40+c*.02,.88+c*.02),from};
}
export function drawHandoff(ctx,assets,t){
 if(t<=0){drawFlowers(ctx,assets,FLOWER_DURATION);return;}
 for(let c=0;c<4;c++){
  const p=handoffPose(t,c);ctx.save();ctx.globalAlpha*=p.opacity;ctx.translate(p.x,p.y);ctx.scale(p.scale,p.scale);ctx.translate(-p.from[0],-p.from[1]);
  if(p.bodyOpacity>0){
   const old=sproutState(SPROUT_DURATION,c);ctx.save();ctx.globalAlpha*=p.bodyOpacity;
   drawOneSeed(ctx,seedPose(SEED_DURATION,c),{opacity:old.shell,crack:old.crack,assets});
   drawShoot(ctx,c,{growth:1,leaves:1,roots:1,elongation:1,clock:11.7+t,assets});ctx.restore();
  }
  // 同四个花头、同一花瓣时钟，一直保留到片尾；绝不交接成底图里的花。
  drawFlowerHead(ctx,c,FLOWER_DURATION+t,assets);ctx.restore();
 }
}
