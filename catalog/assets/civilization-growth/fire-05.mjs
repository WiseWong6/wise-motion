import {GROWTH_REGIONS} from './growth-regions.mjs';
import {CALLIGRAPHY,INK} from './calligraphy.mjs';
import {smooth,mix,rand,TAU} from './math.mjs';
export const SEED_DURATION=2.6;
export const ROOTS=[155,265,375,485];
export const SEEDS=[{x:230,y:111,w:20,h:42,angle:-.30},{x:410,y:111,w:27,h:42,angle:.30},{x:230,y:233,w:16,h:44,angle:-.22},{x:410,y:233,w:28,h:40,angle:.22}];
export function seedPose(t,c){const p=SEEDS[c],q=smooth(t,1.48,2.30);return {variant:c,x:mix(p.x,ROOTS[c],q),y:mix(p.y,282,q),w:mix(p.w,p.w*.28,q),h:mix(p.h,p.h*.28,q),angle:mix(p.angle,1.10+(c%2)*.24,q)};}
export function seedSurface(c,u,a,t=1.3){const p=seedPose(t,c),width=Math.max(0,1-u*u)**.70*p.w*(.90+.10*u),x=Math.cos(a)*width,y=u*p.h,z=Math.sin(a);return [p.x+x*Math.cos(p.angle)-y*Math.sin(p.angle),p.y+x*Math.sin(p.angle)+y*Math.cos(p.angle),z];}
const pools=[0,1,2,3].map(c=>CALLIGRAPHY['燚'].points.filter(p=>p.unit===c));
export const FIRE_FIELD=CALLIGRAPHY['燚'].points.map((p,i)=>({...p,c:p.unit,u:rand(i+188)*1.96-.98,a:rand(i+194)*TAU,r:.26+rand(i+710)*.34,delay:rand(i+36)*.10,swirl:(rand(i+190)-.5)*39}));
export function naturePoint(t,i){const p=FIRE_FIELD[i],target=seedSurface(p.c,p.u,p.a,t),form=smooth(t,.06+p.delay,1.03),bend=2*form*(1-form);return [mix(p.x,target[0],form)+p.swirl*bend,mix(p.y,target[1],form)-24*bend,1,p.r];}
export function shellTransform(crack,side,p){return {x:side*crack*p.w*.36,y:crack*p.h*.06,angle:side*crack*.27};}
export function drawOneSeed(ctx,p,{opacity=1,crack=0,assets}={}){
 if(opacity<=0)return;const region=GROWTH_REGIONS[p.variant||0],image=assets?.growth;if(!image)throw new Error('种子版画尚未准备完成');
 ctx.save();ctx.globalAlpha*=opacity;ctx.translate(p.x,p.y);ctx.rotate(p.angle);
 if(crack<=0)ctx.drawImage(image,...region.source,-p.w,-p.h,p.w*2,p.h*2);
 else for(const side of [-1,1]){const motion=shellTransform(crack,side,p);ctx.save();ctx.translate(motion.x,motion.y);ctx.translate(0,p.h*.70);ctx.rotate(motion.angle);ctx.translate(0,-p.h*.70);ctx.beginPath();ctx.rect(side<0?-p.w:0,-p.h,p.w,p.h*2);ctx.clip();ctx.drawImage(image,...region.source,-p.w,-p.h,p.w*2,p.h*2);ctx.restore();}
 ctx.restore();
}
export function drawSeeds(ctx,t,opacity=1,assets){for(let c=0;c<4;c++)drawOneSeed(ctx,seedPose(t,c),{opacity,assets});}
export function drawSeedDots(ctx,t,opacity=1){if(opacity<=0)return;ctx.save();ctx.fillStyle=INK;ctx.globalAlpha=opacity*.79;ctx.beginPath();for(let i=0;i<FIRE_FIELD.length;i++){const [x,y,a,r]=naturePoint(t,i);ctx.moveTo(x+r,y);ctx.ellipse(x,y,r,r*1.32,0,0,TAU);}ctx.fill();ctx.restore();}
export const SEED_POOLS=pools;
