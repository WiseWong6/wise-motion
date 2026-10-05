import {PAPER_SVG} from './paper.mjs';
import {FONT_DATA} from './font-data.mjs';
import {prepareBrandAssets} from './brand-final.mjs';
let cached;
const image=url=>new Promise((resolve,reject)=>{const img=new Image();img.onload=async()=>{try{await img.decode();resolve(img);}catch(error){reject(error);}};img.onerror=()=>reject(new Error('素材载入失败：'+url.slice(0,120)));img.src=url;});
export function loadAssets(){
 if(cached)return cached;
 cached=(async()=>{
  const images=globalThis.WiseCivilizationImages;
  if(!images)throw new Error('文明聚字的共享图片尚未加载');
  const font=new FontFace('PoemSerif',`url(${FONT_DATA})`);await font.load();document.fonts.add(font);
  const paper=await image('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(PAPER_SVG.replace('width="100%" height="100%"','width="1920" height="1080"')));
  const [civilization,growth]=await Promise.all([image(images.civilization),image(images.growth)]);
  const assets={paper,civilization,growth};return {...assets,...prepareBrandAssets(assets)};
 })();
 cached.catch(()=>{cached=undefined;});return cached;
}
