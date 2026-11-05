// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {SPECS}from'./specs.js';
import {createKnowledgeMotion}from'./painter.js';
import {LAYOUT}from'./source-layout.js';
// 按原绘制时钟定位组合中的动作阶段；只改变目录分类与说明，不改画面。
function breakdown(spec){
 const T=LAYOUT[spec.scene].T;
 const parts={
  paper:[
   ['sheet','论文页落定','论文页从上方倾斜落下并回稳。',T.paper,T.paper+.7,['tilt-drop-settle']],
   ['credits','年份与作者显现','年份先放大显现，作者信息随后由模糊变清晰。',T.paper+.4,T.paper+1.15,['stagger-in']],
   ['figure','结构图进入','结构图从上方倾斜落定，与论文页和作者信息组成完整资料。',T.title-.2,T.title+.5,['tilt-drop-settle']],
  ],
  catLinks:[
   ['center','中心词弹出','中心词从小尺寸弹出，建立关系图的中心。',T.see-.2,T.see+.3,[]],
   ['words','周围词语出现','六个周围词语按先后顺序缩放进入。',T.see+.2,T.see+1.2,['stagger-in']],
   ['links','连线依次长出','连线从中心标签边缘伸到各词语边缘，端点闪光后停留。',T.see+.3,T.see+1.3,['stroke-draw']],
  ],
  farewell:[
   ['avatar','人物与署名出现','人物头像先弹入，署名随后出现；头像继续轻微浮动。',T.intro-.15,T.intro+.35,['stagger-in']],
   ['icons','告别文字与图标入场','告别文字出现，点赞、收藏和关注图标依次描出轮廓。',T.bye+.2,T.bye+.94,['stagger-in','stroke-draw']],
   ['highlight','三连弹动点亮','三个图标依次弹动并变为金色，同时散出短射线。',T.bye+.8,T.bye+1.5,['material-like-pop']],
  ],
 }[spec.draw];
 const ms=t=>Math.round((Math.max(spec.start,Math.min(spec.end,t))-spec.start)/spec.rate*1000);
 return parts?.map(([id,name,detail,from,to,actions])=>{
  const start=ms(from),end=ms(to);
  return{id,name,detail,start,end,actions,time:`${(start/1000).toFixed(2)}–${(end/1000).toFixed(2)} 秒`};
 });
}
const scriptUrl=globalThis.document?.currentScript?.src;
for(const spec of SPECS){
 const factory=(root,viewport)=>{
 const base=new URL(scriptUrl?'../assets/knowledge-video/':'assets/knowledge-video/',scriptUrl||root.ownerDocument.baseURI).href;
 const paint=createKnowledgeMotion(root,spec,base,viewport),draw=ms=>paint(ms/1000);
 draw.ready=paint.ready;draw.destroy=paint.destroy;return draw;
 };
 const parts=breakdown(spec);
 if(parts)factory.breakdown=parts;
 (globalThis.MotionFactories||={})[spec.factory]=factory;
}
