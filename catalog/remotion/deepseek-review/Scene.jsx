// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React from 'react';
import {S3Pareto} from './S3Pareto';
import {S5Search} from './S5Search';
import {S13Closing} from './S13Closing';
export const SPECS = [
 {id:'search-filter-delivery',scene:'search',frames:244,preview:230,kind:'composition',actions:['stagger-in','layout-reorder','curve-path']},
 {id:'creative-cards-to-tracks',scene:'closing',frames:206,preview:167,kind:'composition',actions:['layout-reorder']},
 {id:'pareto-efficiency-sequence',scene:'pareto',start:57,frames:140,preview:129,viewport:[0,0,912,652]},
 {id:'deepseek-results-enter',exportId:'stagger-in',variantId:'deepseek-results',scene:'search',start:104,frames:34,preview:30,viewport:[84,544,912,520]},
 {id:'deepseek-results-filter',exportId:'layout-reorder',variantId:'deepseek-filter',scene:'search',start:122,frames:68,preview:62,viewport:[84,544,912,520]},
 {id:'deepseek-result-delivery',exportId:'curve-path',variantId:'deepseek-delivery',scene:'search',start:194,frames:50,preview:30,viewport:[84,544,912,600]},
 {id:'deepseek-creative-tracks',exportId:'layout-reorder',variantId:'deepseek-tracks',scene:'closing',start:90,frames:116,preview:77,viewport:[160,442,840,790]},
].map(spec=>Object.freeze({kind:'action',start:0,viewport:[0,0,1080,1440],...spec}));
const COMPONENTS={search:S5Search,closing:S13Closing,pareto:S3Pareto};
export function resolveMotion(effectId,variantId){
 const spec=SPECS.find(s=>(s.exportId||s.id)===effectId&&s.variantId===variantId);
 if(!spec)throw new Error('未知测评动效：'+effectId+'/'+variantId);
 return spec;
}
export function sourceFrame(spec,seconds){
 if(!Number.isFinite(seconds))throw new TypeError('动作时间必须是有限数字');
 return Math.min(spec.frames-1,Math.max(0,Math.floor(seconds*30+1e-7)))+spec.start;
}
export function ReviewScene({spec,frame}){
 if(!Number.isFinite(frame))throw new TypeError('动作帧必须是有限数字');
 const sampled=Math.max(spec.start,Math.min(spec.start+spec.frames-1,Math.floor(frame)));
 const Component=COMPONENTS[spec.scene], [x,y,width,height]=spec.viewport;
 return <div data-review-scene={spec.scene} data-source-frame={sampled} style={{position:'absolute',width,height,overflow:'hidden',background:'#FFFFFF',fontSynthesis:'none'}}>
  <div style={{position:'absolute',left:-x,top:-y,width:1080,height:1440}}><Component frame={sampled}/></div>
 </div>;
}
export function layersFor(spec){
 const end=spec.frames/30*1000;
 const layer=(id,name,detail,from,to,actions)=>({id,name,detail,time:`${(from/30).toFixed(2)}–${(to/30).toFixed(2)} 秒`,start:from/30*1000,end:Math.min(to/30*1000,end),actions});
 if(spec.scene==='search')return [
  layer('results','搜索结果入场','三条结果依次滑入，保留标题和来源。',104,138,['stagger-in']),
  layer('filter','扫描与剔除','扫描线检查结果，干扰项被划除并移走，其余结果向上补位。',122,190,['layout-reorder']),
  layer('delivery','有效内容递送','两个文档沿各自曲线路径进入模型，目标说明依次出现。',194,244,['curve-path']),
 ];
 if(spec.scene==='closing')return [layer('tracks','卡片连续变轨道','剧本、镜头、声音三张卡片连续改变位置和尺寸，播放头贯穿三条剪辑轨道。',90,206,['layout-reorder'])];
 return [];
}
