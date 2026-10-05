import {drawFlowers,FLOWER_DURATION} from './four-flowers.mjs';
import {PLATE} from './civilization/ink-parts.mjs';
import {applyReveal} from './civilization/reveal.mjs';
import {drawFire} from './civilization/fire.mjs';
import {drawWheels} from './civilization/wheels.mjs';
import {drawLoom} from './civilization/loom.mjs';
import {drawPendulum} from './civilization/pendulum.mjs';
import {drawPiston} from './civilization/piston.mjs';
import {drawObservatory} from './civilization/observatory.mjs';
import {drawExploration} from './civilization/exploration.mjs';
import {drawHandoff,clearPrintedFlowers} from './civilization/handoff.mjs';
export const ATLAS_REVEAL_DELAY=.33;
export function drawCivilizationAtlas(ctx,assets,t){
 if(t<=0){drawFlowers(ctx,assets,FLOWER_DURATION);return;}
 if(!assets.civilization)throw new Error('文明群像素材未准备完成');
 ctx.save();ctx.translate(PLATE.x,PLATE.y);ctx.scale(PLATE.scale,PLATE.scale);applyReveal(ctx,t-ATLAS_REVEAL_DELAY);
 ctx.drawImage(assets.civilization,0,0);
 clearPrintedFlowers(ctx);
 const clock=t+.42;
 drawFire(ctx,assets.civilization,clock);
 drawWheels(ctx,assets.civilization,clock);
 drawLoom(ctx,assets.civilization,clock);
 drawPendulum(ctx,clock);
 drawPiston(ctx,clock);
 drawObservatory(ctx,assets.civilization,clock);
 drawExploration(ctx,assets.civilization,clock);
 ctx.restore();drawHandoff(ctx,assets,t);
}
