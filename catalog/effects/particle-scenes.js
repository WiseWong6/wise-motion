/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 谱面光点跳跃与沿点跳跃留光：复刻自 @言说心事 老师的教程。
 * https://www.xiaohongshu.com/user/profile/6926ff85000000003702b1c1?xsec_token=ABiobWDdNSX_CX9Vf091D7iZ9SeSMSlAk4oyjghnynYPQ%3D&xsec_source=pc_search */
/* 原料斗绘制与音符插画的本地接入；不运行原页面，不加载声音。 */
(function(global){
 'use strict';
 const F=global.MotionFactories=global.MotionFactories||{};
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const ease=v=>{const x=clamp(v);return x*x*(3-2*x);};
 const lerp=(a,b,v)=>a+(b-a)*v;
 const scriptURL=typeof document==='undefined'?'':document.currentScript?.src||[...document.scripts].find(s=>s.src.endsWith('/effects/particle-scenes.js'))?.src||'';
 function assetURL(name){
  if(scriptURL)return new URL('../assets/particle-scenes/'+name,scriptURL).href;
  const directory=/\/catalog\/[^/]*$/.test(new URL(document.baseURI).pathname)?'assets/':'catalog/assets/';
  return new URL(directory+'particle-scenes/'+name,document.baseURI).href;
 }
 function canvasAt(root){
  root.dataset.art='original';const canvas=root.ownerDocument.createElement('canvas');
  canvas.className='pattern-canvas';canvas.style.cssText='width:640px;height:360px;display:block';
  const ratio=Math.min(2,global.devicePixelRatio||1);canvas.width=640*ratio;canvas.height=360*ratio;root.replaceChildren(canvas);
  return {canvas,ratio};
 }
  const BEAN_BATCH = [
    [257, 293, -.7], [282, 293, .7], [307, 294, -.4], [332, 293, .5], [354, 291, -.6],
    [269, 277, -.4], [295, 277, 1.1], [320, 277, -.7], [344, 275, .65],
    [284, 261, .7], [308, 260, -.6], [332, 261, 1.1]
  ];
  function hopperBeans(phase, prefilled = false, hold = false) {
    // After the opening, this batch was filled during the previous cat's turn.
    return BEAN_BATCH.flatMap(([x, y, angle], id) => {
      const birth = id * .032, land = birth + .68 + (id % 3) * .012;
      const drain = .98 + id * .012, end = drain + .32;
      if ((!prefilled && phase < birth) || (!hold && phase >= end)) return [];
      if (!prefilled && phase < land) {
        const u = (phase - birth) / (land - birth);
        return [{ id, x: x + Math.sin(id * 4.31) * 9 * (1 - u),
          y: lerp(-24, y, u * u), angle: angle + (1 - u) * (id % 2 ? -1.4 : 1.4), scale: 1 }];
      }
      const u = hold ? 0 : ease((phase - drain) / (end - drain));
      return [{ id, x: lerp(x, 306, u), y: lerp(y, 362, u),
        angle: angle + u * (id % 2 ? -.45 : .45), scale: 1 }];
    });
  }
 function beanRenderer(ctx,coffeeBeanArt){
  const beanArtCache=new Map(),NAVY='#172356',BODY_SIDE='#344A80',BODY_SHADOW='#111B42';
  const F={beanColors:()=>['#666560','#FFFFFF']};
  const shape=(d,color)=>{ctx.fillStyle=color;ctx.fill(new Path2D(d));};
  const roundBox=(x,y,w,h,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
  const oval=(x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
function coloredBeanArt(color) {
  if (beanArtCache.has(color)) return beanArtCache.get(color);
  if (!document.createElement) return null;
  const art = document.createElement('canvas');
  art.width = 104; art.height = 144;
  const paint = art.getContext('2d');
  // Color the existing cutout at runtime; keep its silhouette, groove and alpha.
  // No pixel readback, so the original local PNG also works under file://.
  paint.filter = 'grayscale(1) brightness(1.55)';
  paint.drawImage(coffeeBeanArt, 216, 59, 824, 1140, 0, 0, art.width, art.height);
  paint.filter = 'none';
  paint.globalCompositeOperation = 'source-atop';
  paint.globalAlpha = .72;
  paint.fillStyle = color; paint.fillRect(0, 0, art.width, art.height);
  paint.globalAlpha = 1;
  paint.globalCompositeOperation = 'source-over';
  beanArtCache.set(color, art);
  return art;
}
function bean(x, y, angle, scale = 1, color = '#FFFFFF') {
  if (!coffeeBeanArt || !coffeeBeanArt.complete || !coffeeBeanArt.naturalWidth) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // Smaller beans retain the cutout's proportions instead of shrinking its gap.
  const length = 24, width = length * 824 / 1140;
  const art = coloredBeanArt(color);
  if (art) ctx.drawImage(art, 0, 0, art.width, art.height, -width / 2, -length / 2, width, length);
  else ctx.drawImage(coffeeBeanArt, 216, 59, 824, 1140, -width / 2, -length / 2, width, length);
  ctx.restore();
}
function hopper(s) {
  // Front elevation: a shallow opening, upright chamber and short funnel.
  // The broad mounting base sits on the roof instead of a narrow pedestal.
  roundBox(271, 327, 70, 30, 5, NAVY);
  roundBox(262, 348, 88, 10, 4, BODY_SIDE);
  const chamber = 'M 221 252 H 391 V 294 Q 391 302 385 308 L 353 332 Q 350 335 343 335 H 269 Q 262 335 259 332 L 227 308 Q 221 302 221 294 Z';
  shape(chamber, NAVY);
  ctx.save(); ctx.clip(new Path2D(chamber));
  const colors = F.beanColors(s.hopperRecipe);
  for (const b of s.hopper) bean(b.x, b.y, b.angle, b.scale, colors[b.id % colors.length]);
  shape(chamber, 'rgba(23,35,86,.12)');
  // A short, straight-sided taper, not a rounded bowl or long cone.
  shape('M 222 299 Q 306 307 390 299 L 385 308 L 353 332 Q 350 335 343 335 H 269 Q 262 335 259 332 L 227 308 Z', BODY_SIDE);
  shape('M 222 299 L 239 302 L 272 335 H 269 Q 262 335 259 332 L 227 308 Z', NAVY);
  shape('M 374 302 L 390 299 L 385 308 L 353 332 Q 350 335 343 335 H 339 Z', NAVY);
  ctx.restore();
  // Narrow ellipses match the near-front view of the machine and filter basket.
  oval(306, 251, 89, 8, BODY_SIDE);
  oval(306, 250, 81, 4, BODY_SHADOW);
  ctx.save();
  ctx.clip(new Path2D('M 225 0 H 387 V 250 Q 306 260 225 250 Z'));
  for (const b of s.hopper) bean(b.x, b.y, b.angle, b.scale, colors[b.id % colors.length]);
  ctx.restore();
  shape('M 217 251 Q 306 264 395 251 V 258 Q 306 271 217 258 Z', BODY_SIDE);
}

  return {draw:time=>hopper({hopper:hopperBeans(time),hopperRecipe:null}),dispose(){for(const c of beanArtCache.values())c.width=c.height=1;beanArtCache.clear();}};
 }
 global.MotionParticles=Object.freeze({hopperBeans,beanRenderer,assetURL});
 F['particle-hopper']=(root,K,def)=>{
  const {canvas,ratio}=canvasAt(root),ctx=canvas.getContext('2d');
  if(!ctx)return ()=>{};
  let disposed=false,paint,time=0;
  const render=ms=>{time=Math.min(1.5,Math.max(0,(ms-150)/1000));if(!paint||disposed)return;
   ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,640,360);ctx.fillStyle='#0E3CF1';ctx.fillRect(0,0,640,360);
   ctx.save();ctx.translate(320,160);ctx.scale(.64,.64);ctx.translate(-306,-174);paint.draw(time);ctx.restore();canvas.dataset.sourceTime=String(time);
  };
  render.ready=new Promise((resolve,reject)=>{
   const img=new Image();img.onload=()=>{if(!disposed){paint=beanRenderer(ctx,img);render(time*1000+150);}resolve();};
   img.onerror=()=>reject(Error('豆粒素材加载失败'));img.src=assetURL('coffee-bean.webp');
  });
  render.destroy=preserve=>{disposed=true;paint?.dispose();if(!preserve)canvas.width=canvas.height=1;};
  return render;
 };
 F['particle-hopper'].requiresPreparation=true;
 let notesLoading;
 function loadNotes(){
  if(global.CompletedFactories?.notes)return Promise.resolve();
  if(!notesLoading)notesLoading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src=assetURL('notes-source.js');
   script.onload=resolve;script.onerror=()=>{notesLoading=null;script.remove();reject(Error('音符插画源码加载失败'));};document.head.append(script);
  });return notesLoading;
 }
 F['note-hop-illustration']=(root,K,def)=>{
  const {canvas}=canvasAt(root);let context;
  try{context=canvas.getContext('webgl2',{antialias:true,alpha:false,preserveDrawingBuffer:true});}catch{}
  if(!context){canvas.dataset.unavailable='webgl2';const note=document.createElement('p');note.textContent='当前环境不支持此插画的三维绘制';root.append(note);return ()=>{};}
  let disposed=false,adapter,time=0,starting=false;
  const render=ms=>{time=Math.min(8,Math.max(0,(ms-150)/1000));if(adapter&&!disposed){adapter.render(time);canvas.dataset.sourceTime=String(time);}};
  render.ready=loadNotes().then(()=>{if(disposed)return;starting=true;return global.CompletedFactories.notes('hop',canvas);}).then(value=>{
   if(!value)return;if(disposed){value.dispose();return;}adapter=value;render(time*1000+150);
  }).catch(error=>{context.getExtension?.('WEBGL_lose_context')?.loseContext();throw error;});
  render.destroy=preserve=>{disposed=true;
   if(preserve&&adapter){const copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height;copy.style.cssText=canvas.style.cssText;copy.className=canvas.className;copy.getContext('2d').drawImage(canvas,0,0);canvas.replaceWith(copy);}
   adapter?.dispose();if(!adapter&&!starting)context.getExtension?.('WEBGL_lose_context')?.loseContext();if(!preserve)canvas.width=canvas.height=1;
  };
  return render;
 };
 F['note-hop-illustration'].requiresPreparation=true;
})(globalThis);
