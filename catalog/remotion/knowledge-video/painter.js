// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {LAYOUT} from './source-layout.js';
import {makeK} from './drawing.js';
import * as scenes from './scenes.js';
import {pose} from './frame.js';
import {sourceTime} from './specs.js';
const fonts=new WeakMap();
function prepareFont(document,assetBase){
 let entry=fonts.get(document);if(!entry){const face=new FontFace('Smiley Sans',`url(${JSON.stringify(new URL('SmileySans-Oblique.otf',assetBase).href)})`,{weight:'400',style:'normal'});entry={count:0,face,promise:face.load().then(f=>{document.fonts.add(f);return f;})};fonts.set(document,entry);}
 entry.count++;return{ready:entry.promise,release(){if(--entry.count===0){fonts.delete(document);entry.promise.then(f=>{if(!entry.count)document.fonts.delete(f)},()=>{});}}};
}
export function createKnowledgeMotion(host,spec,assetBase,{width=640,height=360}={}){
 const doc=host.ownerDocument,layout=LAYOUT[spec.scene],K=makeK(doc),mount=doc.createElement('div');host.append(mount);
 const shadow=mount.attachShadow({mode:'open'}),[x,y,w,h]=spec.view,scale=Math.min(width/w,height/h);
 const markup=spec.nodes.map(id=>layout.html[id]).join('').replaceAll('__AVATAR__',new URL('wise-avatar.png',assetBase).href).replaceAll('__TRANSFORMER__',new URL('transformer.png',assetBase).href);
 shadow.innerHTML=`<style>*{box-sizing:border-box;margin:0;padding:0}${layout.css}.viewport{position:absolute;left:${(width-w*scale)/2}px;top:${(height-h*scale)/2}px;width:${w}px;height:${h}px;overflow:hidden;transform:scale(${scale});transform-origin:0 0;background:#050505}#root{inset:auto;left:${-x}px;top:${-y}px;width:1080px;height:1440px;overflow:visible}.full{position:absolute;inset:0;width:1080px;height:1440px}#s03-dim{transform:translateY(-70px)}</style><div class="viewport"><div id="root"><div class="scene-stage"><canvas id="main-canvas" class="vz" width="1080" height="1440"></canvas><svg id="selected-svg" class="full" viewBox="0 0 1080 1440"></svg>${markup}</div></div></div>`;
 const stage=shadow.querySelector('.scene-stage'),$=id=>shadow.getElementById(id),svg=$('selected-svg'),ctx=$('main-canvas').getContext('2d');
 if(!ctx)throw Error('当前环境无法准备绘图画布');
 function set(target,values){for(const el of typeof target==='string'?[...shadow.querySelectorAll(target)]:Array.isArray(target)?target:[target]){if(!el)continue;const transforms={};for(const[key,value]of Object.entries(values)){if(['x','y','xPercent','yPercent','scale','rotation'].includes(key))transforms[key]=value;else el.style[key]=typeof value==='number'&&['left','right','top','bottom','width','height','fontSize'].includes(key)?value+'px':value;}if(Object.keys(transforms).length)pose(el,transforms);}}
 function canvas(id,w,h){const el=K.h('canvas','',null,stage);el.id=id;el.width=w;el.height=h;return el.getContext('2d');}
 const render=scenes[spec.draw]({$,svg,ctx,K,T:layout.T,set,stage,canvas,add:(tag,cls,html)=>K.h(tag,cls,html,stage)});
 let destroyed=false;const font=prepareFont(doc,assetBase);
 const draw=seconds=>{if(!destroyed){const t=sourceTime(spec,seconds);mount.dataset.sourceTime=String(t);render(t);}};
 draw.ready=Promise.all([font.ready,...[...shadow.querySelectorAll('img')].map(img=>img.decode())]).then(()=>{if(!destroyed)draw(0)});
 draw.destroy=(preserve=false)=>{
  if(destroyed)return;destroyed=true;
  if(preserve){
   // 目录静态缩略图不能序列化影子节点；把本帧固化为无脚本的独立页面。
   const copy=doc.createElement('div');copy.innerHTML=shadow.innerHTML;
   const copies=copy.querySelectorAll('canvas');shadow.querySelectorAll('canvas').forEach((original,i)=>{const img=doc.createElement('img');for(const a of copies[i].attributes)img.setAttribute(a.name,a.value);img.src=original.toDataURL();copies[i].replaceWith(img)});
   const frame=doc.createElement('iframe');frame.title='动效静态画面';frame.setAttribute('aria-hidden','true');frame.style.cssText=`position:absolute;inset:0;width:${width}px;height:${height}px;border:0;pointer-events:none`;
   frame.srcdoc=`<!doctype html><style>html,body{margin:0;background:#050505;overflow:hidden}@font-face{font-family:"Smiley Sans";src:url(${JSON.stringify(new URL('SmileySans-Oblique.otf',assetBase).href)})}</style>`+copy.innerHTML;
   mount.replaceChildren(frame);
   // 移除原影子树，静态页面保留在普通节点中，供目录复制。
   const frozen=doc.createElement('div');frozen.append(frame);mount.replaceWith(frozen);
  }else mount.remove();
  font.release();
 };
 draw.shadow=shadow;return draw;
}
