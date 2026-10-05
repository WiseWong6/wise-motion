import {seedPose,SEED_DURATION,drawOneSeed} from './fire-05.mjs';
import {PLANTS,SPROUT_DURATION,sproutState,stemPoint,drawShoot} from './four-sprouts.mjs';
import {GROWTH_REGIONS} from './growth-regions.mjs';
import {drawPolarTexture} from './botanical-texture.mjs';
import {smooth,mix} from './math.mjs';
export const FLOWER_DURATION=2.4;
export const FLOWERS=PLANTS.map((p,c)=>({id:c,plantId:c,petals:[16,8,5,4][c],radius:[34,37,33,37][c],turn:[-.14,.16,-.06,.10][c]}));
const BUD_HEIGHT=21,BUD_CENTER=3-BUD_HEIGHT/2;
export function flowerState(t,c){return {elongation:smooth(t,.05+c*.03,.90+c*.04),bud:smooth(t,.28+c*.035,.65+c*.035)*(1-smooth(t,.90+c*.045,1.32+c*.045)),open:smooth(t,.67+c*.07,1.87+c*.07)};}
export function flowerHeadPoint(c,{elongation=1,clock=11.7}={}){
 const [x,y]=stemPoint(c,1,{elongation,clock}),angle=FLOWERS[c].turn;
 return [x-Math.sin(angle)*BUD_CENTER,y+Math.cos(angle)*BUD_CENTER];
}
// 花苞和花心共用花苞中心，外侧花瓣从这里舒展、起伏，版画纹路跟随花瓣移动。
export function flowerPetalPoint(c,u,v,{open=1,clock=11.7}={}){
 const f=FLOWERS[c],dx=(u-.5)*2,dy=(v-.5)*2,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx),rim=Math.min(1,r)**2;
 const breathe=Math.sin(clock*2.5+c*.9+a*f.petals)*.036*rim*open;
 const spread=mix(.15,1,open)+breathe,twist=(1-open)*.23*rim+Math.sin(clock*1.8+a*3+c)*.024*rim*open;
 return [Math.cos(a+twist)*r*f.radius*spread,Math.sin(a+twist)*r*f.radius*spread*(.48+.52*open)+(1-open)*rim*f.radius*.24];
}
export function drawFlowerHead(ctx,c,t,assets){
 const s=flowerState(t,c),clock=9.3+t,[x,y]=flowerHeadPoint(c,{elongation:s.elongation,clock});if(s.bud<=0&&s.open<=0)return;
 if(!assets?.growth)throw new Error('花朵版画尚未准备完成');ctx.save();ctx.translate(x,y);ctx.rotate(FLOWERS[c].turn);
 if(s.bud>0){const box=GROWTH_REGIONS[12+c].source,h=BUD_HEIGHT,w=h*box[2]/box[3];ctx.save();ctx.globalAlpha*=s.bud;ctx.drawImage(assets.growth,...box,-w/2,-h/2,w,h);ctx.restore();}
 if(s.open>0){ctx.save();ctx.globalAlpha*=smooth(s.open,0,.12);drawPolarTexture(ctx,assets.growth,GROWTH_REGIONS[8+c].source,(u,v)=>flowerPetalPoint(c,u,v,{open:s.open,clock}),{sectors:32,rings:4});ctx.restore();}
 ctx.restore();
}
export function drawFlowerPlant(ctx,c,t,assets){const old=sproutState(SPROUT_DURATION,c),s=flowerState(t,c);drawOneSeed(ctx,seedPose(SEED_DURATION,c),{opacity:old.shell,crack:old.crack,assets});drawShoot(ctx,c,{growth:1,leaves:1,roots:1,elongation:s.elongation,clock:9.3+t,assets});drawFlowerHead(ctx,c,t,assets);}
export function drawFlowers(ctx,assets,t){
 // 芽与花的交界保持四颗种壳、四株植物、最后花头的绘制顺序。
 for(let c=0;c<4;c++){const old=sproutState(SPROUT_DURATION,c);drawOneSeed(ctx,seedPose(SEED_DURATION,c),{opacity:old.shell,crack:old.crack,assets});}
 for(let c=0;c<4;c++)drawShoot(ctx,c,{growth:1,leaves:1,roots:1,elongation:flowerState(t,c).elongation,clock:9.3+t,assets});
 for(let c=0;c<4;c++)drawFlowerHead(ctx,c,t,assets);
}
