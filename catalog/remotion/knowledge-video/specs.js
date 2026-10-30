// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
export const SPECS=Object.freeze([
 {id:'dimensions-unfold-fold',name:'坐标展开成万维',scene:'s03-itemcf',draw:'dimensions',start:17.65,end:22.2,poster:19.8,view:[45,200,990,990],nodes:['s03-many','s03-dim','s03-space-note']},
 {id:'related-sentences-converge',name:'相关句子逐渐靠近',scene:'s04-embedding',draw:'sentences',start:46.88,end:52.35,poster:51.5,view:[65,90,950,1150],nodes:['s04-step']},
 {id:'context-silk-flow',name:'光丝传递词语关联',variant:'context',label:'上下文汇入关键词',scene:'s04-embedding',draw:'contextSilk',start:31.32,end:34.38,poster:33.5,view:[65,70,950,900],nodes:['s04-att']},
 {id:'context-silk-flow',factory:'context-silk-flow-cross',name:'光丝传递词语关联',variant:'cross',label:'交错关联与下方输出',scene:'s07-rerank',draw:'crossSilk',start:11.86,end:15.85,poster:14.8,view:[120,740,880,390],nodes:[]},
 {id:'cosine-gauge-sweep',name:'仪表指针与读数联动',scene:'s01-hook',draw:'gauge',start:5.58,end:10.4,poster:9.55,view:[120,430,840,760],nodes:['s01-ticks','s01-num','s01-cos']},
 {id:'vector-angle-swing',name:'向量夹角来回摆动',scene:'s02-vector',draw:'angle',start:4.55,end:11.2,poster:10.75,view:[60,200,960,1030],nodes:['s02-read','s02-fx','s02-fxn']},
 {id:'purchase-table-vector',name:'购买表格突出一行',scene:'s03-itemcf',draw:'table',start:0,end:14.1,poster:12.3,pace:2,view:[0,180,1600,900],nodes:['s03-users','s03-rows','s03-cells','s03-rowbox','s03-vecn','s03-vecl']},
 {id:'paper-card-drop',name:'论文资料依次入场',scene:'s04-embedding',draw:'paper',start:34.7,end:38.5,poster:38.2,view:[0,0,1080,1440],nodes:['s04-sheet','s04-year','s04-yl','s04-fig']},
 {id:'cat-context-links',name:'中心词连接周围词语',scene:'s04-embedding',draw:'catLinks',start:11.7,end:15.5,poster:14.4,view:[100,570,880,540],nodes:['s04-graph']},
 {id:'farewell-actions',name:'人物告别与三连点亮',scene:'s08-outro',draw:'farewell',start:12.96,end:17.03,poster:15.7,view:[200,220,680,1020],nodes:['s08-avatar','s08-name','s08-farewell','s08-action0','s08-action1','s08-action2']}
].map(s=>{const rate=1.3*(s.pace??1);return Object.freeze({...s,rate,factory:s.factory||s.id,duration:(s.end-s.start)/rate,preview:(s.poster-s.start)/rate})}));
export function resolveSpec(id,variant){const s=SPECS.find(s=>s.id===id&&(!variant||s.variant===variant));if(!s)throw Error('未找到知识库视频动作：'+id+'/'+variant);return s;}
export function sourceTime(spec,seconds){if(!Number.isFinite(seconds))throw TypeError('播放时间必须是有限数字');return Math.max(spec.start,Math.min(spec.end,spec.start+seconds*spec.rate));}
