import {W,H,DURATION,locate} from './math.mjs';
import {drawIgnition} from './fire-01.mjs';
import {drawDouble} from './fire-material-field.mjs';
import {drawTriple} from './fire-particle-relay.mjs';
import {drawQuad} from './fire-wire-relay.mjs';
import {drawMaterialsAndAsh} from './fire-material-bridge.mjs';
import {drawPlantsBlink,drawFlowersBlink} from './plant-flashes.mjs';
import {drawCivilizationAtlas} from './civilization-atlas.mjs';
import {drawBrandFinal} from './brand-final.mjs';
export const DRAW=[drawIgnition,drawDouble,drawTriple,drawQuad,drawMaterialsAndAsh,drawPlantsBlink,drawFlowersBlink,drawCivilizationAtlas,drawBrandFinal];
export const sourceTime=t=>Math.min(DURATION,Math.max(0,Math.floor((t+1e-7)*30)/30));
export function renderFrame(ctx,assets,time,width=1920,height=1080){
 const state=locate(sourceTime(time));ctx.setTransform(width/W,0,0,height/H,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.imageSmoothingEnabled=true;
 ctx.clearRect(0,0,W,H);ctx.drawImage(assets.paper,0,0,W,H);DRAW[state.i](ctx,assets,state.local);return state;
}
