import {PAPER_SVG} from './paper.mjs';
import {FONT_DATA} from './font-data.mjs';
import {CIVILIZATION_IMAGE} from './civilization-image.mjs';
import {GROWTH_IMAGE} from './growth-image.mjs';
import {prepareBrandAssets} from './brand-final.mjs';
let cached;
const image=url=>new Promise((resolve,reject)=>{const img=new Image();img.onload=async()=>{try{await img.decode();resolve(img);}catch(error){reject(error);}};img.onerror=()=>reject(new Error('素材载入失败：'+url.slice(0,120)));img.src=url;});
export function loadAssets(){
 if(cached)return cached;
 cached=(async()=>{
  const font=new FontFace('PoemSerif',`url(${FONT_DATA})`);await font.load();document.fonts.add(font);
  const paper=await image('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(PAPER_SVG.replace('width="100%" height="100%"','width="1920" height="1080"')));
  const [civilization,growth]=await Promise.all([image(CIVILIZATION_IMAGE),image(GROWTH_IMAGE)]);
  const assets={paper,civilization,growth};return {...assets,...prepareBrandAssets(assets)};
 })();
 cached.catch(()=>{cached=undefined;});return cached;
}
