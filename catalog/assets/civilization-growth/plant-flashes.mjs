import {drawSprouts} from './four-sprouts.mjs';
import {drawFlowers} from './four-flowers.mjs';
export function plantFlash(t){return [[.72,.78],[.87,.93],[1.02,1.08]].some(([a,b])=>t>=a&&t<b)?.19:1;}
export function flowerFlash(t){return [[1.13,1.19],[1.30,1.36],[1.47,1.53]].some(([a,b])=>t>=a&&t<b)?.19:1;}
export function drawPlantsBlink(ctx,assets,t){const a=plantFlash(t);if(a===1){drawSprouts(ctx,assets,t);return;}ctx.save();ctx.globalAlpha*=a;drawSprouts(ctx,assets,t);ctx.restore();}
export function drawFlowersBlink(ctx,assets,t){const a=flowerFlash(t);if(a===1){drawFlowers(ctx,assets,t);return;}ctx.save();ctx.globalAlpha*=a;drawFlowers(ctx,assets,t);ctx.restore();}
