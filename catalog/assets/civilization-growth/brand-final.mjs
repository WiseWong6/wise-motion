import {particleWord} from './particle-word-library.mjs';
import {drawCivilizationAtlas} from './civilization-atlas.mjs';
import {mix,smooth,rand,ATLAS_END} from './math.mjs';
export const BRAND_LIBRARY=particleWord;
export const BRAND_COUNT=BRAND_LIBRARY.particles.length;
export const ATLAS_LAST_LOCAL=ATLAS_END-11.7;
export function sampleInkOrigins(data,width=640,height=360){
 const candidates=[],stride=2*Math.max(1,Math.round(width/640));
 for(let y=stride/2;y<height;y+=stride)for(let x=stride/2;x<width;x+=stride){const k=(y*width+x)*4,ink=data[k]*.2126+data[k+1]*.7152+data[k+2]*.0722;if(data[k+3]>200&&ink<178)candidates.push([x/width*640,y/height*360]);}
 if(candidates.length<100)throw new Error('末幕墨迹不足，无法准备聚字粒子。');
 return Array.from({length:BRAND_COUNT},(_,i)=>{const p=candidates[Math.floor(rand(i+2719)*candidates.length)];return [p[0]+(rand(i+789)-.5)*.6,p[1]+(rand(i+881)-.5)*.6];});
}
export function prepareBrandAssets(assets){
 const plate=document.createElement('canvas');plate.width=1920;plate.height=1080;const ctx=plate.getContext('2d',{willReadFrequently:true});
 if(!ctx)throw new Error('无法准备末幕粒子。');
 ctx.setTransform(3,0,0,3,0,0);ctx.drawImage(assets.paper,0,0,640,360);drawCivilizationAtlas(ctx,assets,ATLAS_LAST_LOCAL);
 const origins=sampleInkOrigins(ctx.getImageData(0,0,1920,1080).data,1920,1080);
 return {brandPlate:plate,brandOrigins:origins};
}
export function brandFlash(t){return [[.10,.16],[.26,.32]].some(([a,b])=>t>=a&&t<b)?.18:1;}
export function brandState(t){return {image:(1-smooth(t,.37,.64))*brandFlash(t),dots:smooth(t,.34,.56),dt:Math.max(0,t-.42)};}
export function brandParticlePoint(t,i,origins){
 const dt=brandState(t).dt,from=origins[i],target=BRAND_LIBRARY.position(i,Math.min(dt,2.65)),q=smooth(dt,0,.64);
 return [mix(from[0],target[0],q),mix(from[1],target[1],q)];
}
export function drawBrandFinal(ctx,assets,t){
 if(t<=0){drawCivilizationAtlas(ctx,assets,ATLAS_LAST_LOCAL);return;}
 if(!assets.brandPlate||assets.brandOrigins?.length!==BRAND_COUNT)throw new Error('末幕与7000个聚字粒子尚未准备完成');
 const s=brandState(t);ctx.save();
 if(s.image>0){ctx.globalAlpha=s.image;ctx.drawImage(assets.brandPlate,0,0,640,360);}
 if(s.dots>0){
  ctx.globalAlpha=s.dots*.94;
  for(let bucket=0;bucket<3;bucket++){
   ctx.fillStyle=['#151610','#42453b','#6c7161'][bucket];ctx.beginPath();
   for(let i=0;i<BRAND_COUNT;i++){const p=BRAND_LIBRARY.particles[i];if(p.c!==bucket)continue;const [x,y]=brandParticlePoint(t,i,assets.brandOrigins),size=p.s/3;ctx.rect(x-size/2,y-size/2,size,size);}
   ctx.fill();
  }
 }
 ctx.restore();
}
