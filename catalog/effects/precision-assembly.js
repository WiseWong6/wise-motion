/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
/* Native scene metadata and static thumbnails. Playback is the Remotion/Blender cache adapter. */
(function(global){
  'use strict';
  const F=global.MotionFactories=global.MotionFactories||{};
  const data=global.WisePrecisionAssembly;
  if(!data)throw new Error('三维片段的帧表尚未载入');
  for(const [id,part] of Object.entries(data.choices)){
    const factory=(root,kit,definition)=>{
      const doc=root.ownerDocument,img=doc.createElement('img');
      img.alt='';img.draggable=false;img.decoding='async';
      img.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain';
      let destroyed=false;
      let accept,reject;
      const ready=new Promise((resolve,fail)=>{accept=resolve;reject=fail;});
      const loaded=()=>{if(!destroyed)accept();};
      const failed=()=>reject(new Error('无法加载真实三维静帧：'+part.poster));
      img.addEventListener('load',loaded);img.addEventListener('error',failed);
      img.src='assets/precision-assembly/成片/'+part.poster;
      root.replaceChildren(img);
      if(img.complete&&img.naturalWidth)loaded();
      const render=time=>{
        if(destroyed)return;
        root.dataset.nativeFrame=String(data.sample(id,time).blenderFrame);
      };
      render.ready=ready;
      render.destroy=preserve=>{
        if(destroyed)return;destroyed=true;
        img.removeEventListener('load',loaded);img.removeEventListener('error',failed);
        accept();if(!preserve)root.replaceChildren();
      };
      return render;
    };
    factory.requiresPreparation=true;
    F[id]=factory;
  }
  F['precision-assembly-sequence'].breakdown=[
    {id:'bridge',name:'机芯细节',detail:'真实发条盒、镂空夹板和金属倒角；镜头由第1帧推进到第72帧。',start:0,end:3000,time:'0–3秒',actions:[]},
    {id:'balance',name:'摆轮运行',detail:'第73–144帧，摆轮以48度振幅、每秒2.5次往返；轮系持续转动，属于视觉演示。',start:3000,end:6000,time:'3–6秒',actions:[]},
    {id:'portrait',name:'完整结构',detail:'第145–240帧，整表展示与轻微镜头推近。',start:6000,end:10000,time:'6–10秒',actions:[]},
    {id:'assembly',name:'分层拆解与回装',detail:'第241–432帧，五组机芯、刻度圈、指针和表镜沿深度错峰展开；真实镜头环绕观察，零件准确回到装配位置。',start:10000,end:18000,time:'10–18秒',actions:['ordered-depth-assembly']},
    {id:'final',name:'最终完整展示',detail:'第433–528帧，保持完整装配，镜头缓慢推进并随原片淡出收尾。',start:18000,end:22000,time:'18–22秒',actions:[]}
  ];
})(globalThis);
